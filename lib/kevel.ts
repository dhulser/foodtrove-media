/**
 * Kevel Decision API client
 *
 * Handles POST /api/v2/decision requests for ad placements.
 * Implements graceful degradation on empty/no-fill responses — a placement
 * that returns no winner falls back silently; blank space is not acceptable.
 *
 * Usage:
 *   const decision = await fetchAdDecision({ networkId, siteId, placements })
 *   const winner = getWinner(decision, "home-hero-billboard")
 *   // winner is null if no fill — render fallback, not blank
 *
 * Docs: https://dev.kevel.com/docs/decision-api
 */

export interface KevelPlacement {
  divName: string;       // matches our placementId (e.g. "home-hero-billboard")
  networkId: number;
  siteId: number;
  adTypes?: number[];    // Kevel ad type IDs (1 = image, 2 = html creative, etc.)
  count?: number;        // max ads to return (default 1)
  zoneIds?: number[];
  keywords?: string[];
  properties?: Record<string, string | number | boolean | string[]>;
}

export interface KevelDecisionRequest {
  placements: KevelPlacement[];
  user?: {
    key?: string;        // user identifier for frequency capping
  };
  keywords?: string[];
  url?: string;
  referrer?: string;
  ip?: string;
}

export interface KevelCreative {
  id: number;
  title: string;
  body: string;          // HTML creative body
  customData?: Record<string, unknown>;
  data?: {
    imageUrl?: string;
    ctaText?: string;
    customData?: Record<string, unknown>;
  };
}

export interface KevelWinner {
  ad: {
    id: number;
    advertiserId: number;
    campaignId: number;
    flightId: number;
    creativeId: number;
    priority: number;
  };
  creative: KevelCreative;
  clickUrl: string;
  impressionUrl: string;
  contents: Array<{
    type: string;       // "html", "image", "js"
    template: string;
    data: Record<string, unknown>;
    body: string;
  }>;
}

export interface KevelDecisionResponse {
  decisions: Record<string, KevelWinner[] | null>;
}

export type AdFillResult =
  | { filled: true; winner: KevelWinner }
  | { filled: false; reason: "no-fill" | "error" | "no-credentials" };

// Environment — credentials injected at runtime
const KEVEL_NETWORK_ID = process.env.KEVEL_NETWORK_ID
  ? parseInt(process.env.KEVEL_NETWORK_ID, 10)
  : null;
const KEVEL_API_KEY = process.env.KEVEL_API_KEY ?? null;

/**
 * Returns true if Kevel credentials are provisioned.
 * Use this to gate live ad calls vs. placeholder rendering.
 */
export function kevelCredentialsAvailable(): boolean {
  return KEVEL_NETWORK_ID !== null && KEVEL_API_KEY !== null;
}

/**
 * Fetch ad decisions from the Kevel Decision API.
 * Returns null if credentials are absent or on any network error.
 * Errors are caught and logged — callers always get a usable result.
 */
export async function fetchAdDecision(
  request: KevelDecisionRequest
): Promise<KevelDecisionResponse | null> {
  if (!KEVEL_NETWORK_ID || !KEVEL_API_KEY) {
    // No credentials yet — return null, callers fall back to placeholder
    return null;
  }

  const url = `https://e-${KEVEL_NETWORK_ID}.adzerk.net/api/v2/decision`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Adzerk-ApiKey": KEVEL_API_KEY,
      },
      body: JSON.stringify(request),
      // Short timeout to avoid blocking renders on slow ad responses
      signal: AbortSignal.timeout(1500),
    });

    if (!response.ok) {
      console.warn(
        `[Kevel] Decision API error: ${response.status} ${response.statusText} for placements: ${request.placements.map((p) => p.divName).join(", ")}`
      );
      return null;
    }

    return (await response.json()) as KevelDecisionResponse;
  } catch (err) {
    // Network error, timeout, or JSON parse failure — degrade gracefully
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Kevel] fetchAdDecision failed: ${msg}`);
    return null;
  }
}

/**
 * Extract the winning ad for a specific placement from a decision response.
 * Returns a typed AdFillResult — always check `filled` before rendering.
 *
 * No-fill is a normal operational state (low inventory, targeting mismatch, etc.)
 * — treat it the same as a network error and render the fallback creative.
 */
export function getWinner(
  decision: KevelDecisionResponse | null,
  placementId: string
): AdFillResult {
  if (!decision) {
    return { filled: false, reason: "no-credentials" };
  }

  const winners = decision.decisions[placementId];
  if (!winners || winners.length === 0) {
    return { filled: false, reason: "no-fill" };
  }

  return { filled: true, winner: winners[0] };
}

/**
 * Fire impression pixel for a delivered ad.
 * Best-effort — failures are swallowed. Call this after the ad is visible.
 */
export async function fireImpression(impressionUrl: string): Promise<void> {
  try {
    await fetch(impressionUrl, { method: "GET", mode: "no-cors" });
  } catch {
    // Impression fire failure is non-fatal — log and continue
    console.warn("[Kevel] Impression pixel failed:", impressionUrl);
  }
}

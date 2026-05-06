/**
 * /api/ad-decision — Kevel Decision API proxy
 *
 * Keeps KEVEL_API_KEY server-side. Client components (AdSlot) call this
 * instead of hitting the Kevel API directly.
 *
 * Request body:
 *   { placementId: string, siteId?: number, adTypes?: number[] }
 *
 * Response:
 *   { filled: true, html: string, clickUrl: string, impressionUrl: string }
 *   { filled: false, reason: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchAdDecision, getWinner } from "@/lib/kevel";

export async function POST(request: NextRequest) {
  let body: { placementId?: string; siteId?: number; adTypes?: number[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ filled: false, reason: "invalid-request" }, { status: 400 });
  }

  const { placementId, siteId, adTypes } = body;

  if (!placementId) {
    return NextResponse.json({ filled: false, reason: "missing-placement-id" }, { status: 400 });
  }

  const networkId = process.env.KEVEL_NETWORK_ID ? parseInt(process.env.KEVEL_NETWORK_ID, 10) : null;
  const siteIdEnv = process.env.KEVEL_SITE_ID ? parseInt(process.env.KEVEL_SITE_ID, 10) : null;

  if (!networkId || !process.env.KEVEL_API_KEY) {
    return NextResponse.json({ filled: false, reason: "no-credentials" });
  }

  const decision = await fetchAdDecision({
    placements: [
      {
        divName: placementId,
        networkId,
        // Prefer caller-supplied siteId, then env default, then 0 (no targeting)
        siteId: siteId ?? siteIdEnv ?? 0,
        adTypes: adTypes ?? [5], // 5 = standard display
        count: 1,
      },
    ],
    user: {
      // No persistent user ID in browse-only MVP — anonymous session
      key: `anon-${Date.now()}`,
    },
  });

  const result = getWinner(decision, placementId);

  if (!result.filled) {
    return NextResponse.json({ filled: false, reason: result.reason });
  }

  const { winner } = result;
  const content = winner.contents?.[0];

  if (!content) {
    return NextResponse.json({ filled: false, reason: "no-content" });
  }

  // Return the creative body and tracking URLs
  return NextResponse.json({
    filled: true,
    html: content.body ?? "",
    clickUrl: winner.clickUrl ?? "",
    impressionUrl: winner.impressionUrl ?? "",
  });
}

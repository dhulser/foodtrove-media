/**
 * /api/admin/trafficking — Flight Operations API
 *
 * Provides read and write access to Kevel flight configuration for Ad Ops.
 * Casey uses this to act on pacing anomalies, activate paused campaigns,
 * update CPMs, and modify keyword targeting — without manually calling
 * the Kevel Management API.
 *
 * GET  /api/admin/trafficking  → all flights with live status
 * PUT  /api/admin/trafficking  → update flight (activate/pause, CPM, keywords)
 *
 * Only exposes the subset of Kevel flight fields that Ad Ops needs to modify.
 * Destructive operations (delete, budget zero-out) are not exposed here.
 *
 * Used by: /admin/trafficking
 * Consumers: Casey (Ad Ops)
 */

import { NextRequest, NextResponse } from "next/server";

const KEVEL_API_KEY = process.env.KEVEL_API_KEY;

// ─── Network config ───────────────────────────────────────────────────────────

const ADVERTISERS = [
  {
    id: 6256813,
    name: "Organic Valley",
    slug: "organic-valley",
    color: "emerald",
    campaignId: 659171965,
    flights: [
      { id: 863229974, format: "Billboard", formatKeyword: "ft-billboard", cpm: 5.0 },
      { id: 863229975, format: "Leaderboard", formatKeyword: "ft-leaderboard", cpm: 5.0 },
      { id: 863229976, format: "MRec", formatKeyword: "ft-mrec", cpm: 5.0 },
    ],
  },
  {
    id: 6256814,
    name: "Liquid I.V.",
    slug: "liquid-iv",
    color: "sky",
    campaignId: 659171966,
    flights: [
      { id: 863229977, format: "Billboard", formatKeyword: "ft-billboard", cpm: 7.5 },
      { id: 863229978, format: "Leaderboard", formatKeyword: "ft-leaderboard", cpm: 6.5 },
      { id: 863229979, format: "MRec", formatKeyword: "ft-mrec", cpm: 6.0 },
    ],
  },
  {
    id: 6256815,
    name: "Earthbound Farm",
    slug: "earthbound-farm",
    color: "orange",
    campaignId: 659171967,
    flights: [
      { id: 863237502, format: "Billboard", formatKeyword: "ft-billboard,produce,organic,fresh", cpm: 8.5 }, // created 2026-05-13
      { id: 863229981, format: "Leaderboard", formatKeyword: "ft-leaderboard,produce,organic,fresh", cpm: 8.0 },
      { id: 863229982, format: "MRec", formatKeyword: "ft-mrec,produce,organic,fresh", cpm: 7.5 },
    ],
  },
];

// ─── Kevel API helpers ────────────────────────────────────────────────────────

async function kevelGet(path: string) {
  if (!KEVEL_API_KEY) throw new Error("KEVEL_API_KEY not set");
  const res = await fetch(`https://api.kevel.co/v1/${path}`, {
    headers: {
      "X-Adzerk-ApiKey": KEVEL_API_KEY,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Kevel GET error: ${res.status} on /v1/${path}`);
  }
  return res.json();
}

async function kevelPut(path: string, body: Record<string, unknown>) {
  if (!KEVEL_API_KEY) throw new Error("KEVEL_API_KEY not set");
  const res = await fetch(`https://api.kevel.co/v1/${path}`, {
    method: "PUT",
    headers: {
      "X-Adzerk-ApiKey": KEVEL_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Kevel PUT error: ${res.status} on /v1/${path}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface FlightStatus {
  flightId: number;
  flightName: string;
  advertiserId: number;
  advertiserName: string;
  advertiserSlug: string;
  advertiserColor: string;
  format: string;
  formatKeyword: string;
  isActive: boolean;
  isUnlimited: boolean;
  impressions: number;
  price: number;
  keywords: string;
  priorityId: number;
  startDate: string | null;
  noEndDate: boolean;
  // Computed
  statusLabel: "active" | "paused" | "no-flight";
  hasFormatKeyword: boolean;
  hasContextualKeyword: boolean;
  contextualKeywords: string[];
  // Ops signals
  opsNote: string | null;
}

// ─── GET — read all flight statuses ──────────────────────────────────────────

export async function GET() {
  if (!KEVEL_API_KEY) {
    return NextResponse.json(
      { error: "Missing KEVEL_API_KEY — Kevel Management API unavailable" },
      { status: 503 }
    );
  }

  const flights: FlightStatus[] = [];

  await Promise.all(
    ADVERTISERS.flatMap((adv) =>
      adv.flights.map(async (flightDef) => {
        try {
          const data = await kevelGet(`flight/${flightDef.id}`);

          const keywordsStr: string = data.Keywords ?? "";
          const keywordList = keywordsStr
            .split(",")
            .map((k: string) => k.trim())
            .filter(Boolean);
          const formatKeys = ["ft-billboard", "ft-leaderboard", "ft-mrec"];
          const contextualKeys = ["produce", "organic", "fresh", "snacks", "beverages", "health", "nutrition", "dairy", "bakery", "frozen"];

          const hasFormatKeyword = keywordList.some((k: string) => formatKeys.includes(k));
          const contextualPresent = keywordList.filter((k: string) => contextualKeys.includes(k));

          let opsNote: string | null = null;
          if (!data.IsActive) {
            opsNote = "Flight is paused — activate to enter auction.";
          } else if (!hasFormatKeyword) {
            opsNote = `Missing format keyword (${flightDef.formatKeyword}) — flight won't serve.`;
          } else if (data.Impressions === 0 && !data.IsUnlimited) {
            opsNote = "Impression goal is 0 with unlimited=false — decisions will be null.";
          }

          flights.push({
            flightId: data.Id ?? flightDef.id,
            flightName: data.Name ?? `${adv.name} — ${flightDef.format}`,
            advertiserId: adv.id,
            advertiserName: adv.name,
            advertiserSlug: adv.slug,
            advertiserColor: adv.color,
            format: flightDef.format,
            formatKeyword: flightDef.formatKeyword,
            isActive: data.IsActive ?? false,
            isUnlimited: data.IsUnlimited ?? false,
            impressions: data.Impressions ?? 0,
            price: data.Price ?? flightDef.cpm,
            keywords: keywordsStr,
            priorityId: data.PriorityId ?? 259929,
            startDate: data.StartDate ?? null,
            noEndDate: data.NoEndDate ?? true,
            statusLabel: data.IsActive ? "active" : "paused",
            hasFormatKeyword,
            hasContextualKeyword: contextualPresent.length > 0,
            contextualKeywords: contextualPresent,
            opsNote,
          });
        } catch (err) {
          flights.push({
            flightId: flightDef.id,
            flightName: `${adv.name} — ${flightDef.format}`,
            advertiserId: adv.id,
            advertiserName: adv.name,
            advertiserSlug: adv.slug,
            advertiserColor: adv.color,
            format: flightDef.format,
            formatKeyword: flightDef.formatKeyword,
            isActive: false,
            isUnlimited: false,
            impressions: 0,
            price: flightDef.cpm,
            keywords: "",
            priorityId: 259929,
            startDate: null,
            noEndDate: true,
            statusLabel: "paused",
            hasFormatKeyword: false,
            hasContextualKeyword: false,
            contextualKeywords: [],
            opsNote: `Fetch error: ${String(err).slice(0, 100)}`,
          });
        }
      })
    )
  );

  // Sort: by advertiser then format order
  const formatOrder = ["Billboard", "Leaderboard", "MRec"];
  flights.sort((a, b) => {
    if (a.advertiserId !== b.advertiserId) {
      return ADVERTISERS.findIndex((x) => x.id === a.advertiserId) -
        ADVERTISERS.findIndex((x) => x.id === b.advertiserId);
    }
    return formatOrder.indexOf(a.format) - formatOrder.indexOf(b.format);
  });

  const activeCount = flights.filter((f) => f.isActive).length;
  const pausedCount = flights.filter((f) => f.statusLabel === "paused").length;
  const opsNoteCount = flights.filter((f) => f.opsNote).length;
  const noFlightCount = flights.filter((f) => f.statusLabel === "no-flight").length;

  return NextResponse.json({
    flights,
    summary: {
      total: flights.length,
      active: activeCount,
      paused: pausedCount,
      noFlight: noFlightCount,
      needsAttention: opsNoteCount,
    },
    fetchedAt: new Date().toISOString(),
  });
}

// ─── PUT — update a flight ────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  if (!KEVEL_API_KEY) {
    return NextResponse.json(
      { error: "Missing KEVEL_API_KEY" },
      { status: 503 }
    );
  }

  let body: {
    flightId?: number;
    action?: "activate" | "pause" | "update-cpm" | "update-keywords";
    price?: number;
    keywords?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { flightId, action } = body;

  if (!flightId || !action) {
    return NextResponse.json(
      { error: "flightId and action are required" },
      { status: 400 }
    );
  }

  // Validate flightId is one we know about (safety check)
  const allFlightIds = ADVERTISERS.flatMap((a) => a.flights.map((f) => f.id));
  if (!allFlightIds.includes(flightId)) {
    return NextResponse.json(
      { error: `Unknown flightId ${flightId} — not in FoodTrove network registry` },
      { status: 400 }
    );
  }

  // Fetch current flight state first (we need it for the PUT payload)
  let currentFlight: Record<string, unknown>;
  try {
    currentFlight = await kevelGet(`flight/${flightId}`);
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch flight ${flightId}: ${String(err).slice(0, 100)}` },
      { status: 502 }
    );
  }

  // Build the update payload — Kevel PUT requires the full flight object
  const updatePayload: Record<string, unknown> = {
    Id: currentFlight.Id,
    Name: currentFlight.Name,
    CampaignId: currentFlight.CampaignId,
    PriorityId: currentFlight.PriorityId ?? 259929,
    StartDateISO: currentFlight.StartDateISO ?? currentFlight.StartDate,
    NoEndDate: currentFlight.NoEndDate ?? true,
    IsUnlimited: currentFlight.IsUnlimited ?? true,
    Impressions: currentFlight.Impressions ?? 1000000,
    Price: currentFlight.Price,
    RateType: currentFlight.RateType ?? 1,
    GoalType: currentFlight.GoalType ?? 2,
    Keywords: currentFlight.Keywords ?? "",
    IsActive: currentFlight.IsActive,
  };

  switch (action) {
    case "activate":
      updatePayload.IsActive = true;
      break;

    case "pause":
      updatePayload.IsActive = false;
      break;

    case "update-cpm":
      if (typeof body.price !== "number" || body.price <= 0) {
        return NextResponse.json(
          { error: "price must be a positive number for update-cpm" },
          { status: 400 }
        );
      }
      updatePayload.Price = body.price;
      break;

    case "update-keywords":
      if (typeof body.keywords !== "string") {
        return NextResponse.json(
          { error: "keywords must be a string for update-keywords" },
          { status: 400 }
        );
      }
      updatePayload.Keywords = body.keywords;
      break;

    default:
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      );
  }

  try {
    const updated = await kevelPut(`flight/${flightId}`, updatePayload);
    return NextResponse.json({
      ok: true,
      action,
      flightId,
      updated: {
        isActive: updated.IsActive,
        price: updated.Price,
        keywords: updated.Keywords,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Kevel update failed: ${String(err).slice(0, 200)}` },
      { status: 502 }
    );
  }
}

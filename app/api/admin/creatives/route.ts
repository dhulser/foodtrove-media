/**
 * /api/admin/creatives — Kevel Management API proxy for Creative Preview dashboard
 *
 * Returns all creatives for all advertisers on FoodTrove network 12024.
 * Includes ScriptBody HTML, flight associations, format metadata, and active status.
 *
 * Server-side only — KEVEL_API_KEY never leaves the server.
 *
 * Response shape:
 *   { advertisers: AdvertiserCreatives[], meta: { totalCreatives, lastFetched } }
 */
import { NextResponse } from "next/server";

const KEVEL_API_KEY = process.env.KEVEL_API_KEY;

// Known advertiser IDs for FoodTrove network 12024
const ADVERTISER_IDS = [6254651, 6256255, 6256266];

const ADVERTISER_NAMES: Record<number, string> = {
  6254651: "FreshFarm Organics",
  6256255: "NutriPeak Nutrition",
  6256266: "GreenLeaf Farms",
};

// Known creative IDs per advertiser
const CREATIVE_IDS: Record<number, number[]> = {
  6254651: [905327348, 905360724, 905392725],  // Billboard, Leaderboard, MRec
  6256255: [905393443, 905393444, 905393445],  // Billboard, Leaderboard, MRec
  6256266: [906821651, 906821652, 906821653],  // Billboard, Leaderboard, MRec
};

// Flight associations per creative (creative → [flightId, ...])
const CREATIVE_FLIGHTS: Record<number, number[]> = {
  905327348: [863187467],  // FreshFarm Billboard → billboard flight
  905360724: [863187590],  // FreshFarm Leaderboard → leaderboard flight
  905392725: [863188334],  // FreshFarm MRec → mrec flight
  905393443: [863188608],  // NutriPeak Billboard
  905393444: [863188610],  // NutriPeak Leaderboard
  905393445: [863188611],  // NutriPeak MRec
  906821651: [863188756],  // GreenLeaf Billboard
  906821652: [863188757],  // GreenLeaf Leaderboard
  906821653: [863188758],  // GreenLeaf MRec
};

// Human-readable format labels per creative
const FORMAT_LABELS: Record<number, { size: string; format: string; dimensions: string }> = {
  905327348: { size: "billboard", format: "Billboard", dimensions: "970×250" },
  905360724: { size: "leaderboard", format: "Leaderboard", dimensions: "728×90" },
  905392725: { size: "mrec", format: "MRec", dimensions: "300×250" },
  905393443: { size: "billboard", format: "Billboard", dimensions: "970×250" },
  905393444: { size: "leaderboard", format: "Leaderboard", dimensions: "728×90" },
  905393445: { size: "mrec", format: "MRec", dimensions: "300×250" },
  906821651: { size: "billboard", format: "Billboard", dimensions: "970×250" },
  906821652: { size: "leaderboard", format: "Leaderboard", dimensions: "728×90" },
  906821653: { size: "mrec", format: "MRec", dimensions: "300×250" },
};

// CPM rates per advertiser per format
const CPM_RATES: Record<number, Record<string, number>> = {
  6254651: { billboard: 5.00, leaderboard: 5.00, mrec: 5.00 },
  6256255: { billboard: 7.50, leaderboard: 6.50, mrec: 6.00 },
  6256266: { billboard: 0, leaderboard: 8.00, mrec: 7.50 },
};

async function kevelGet(path: string) {
  if (!KEVEL_API_KEY) throw new Error("KEVEL_API_KEY not set");
  const res = await fetch(`https://api.kevel.co/v1/${path}`, {
    headers: {
      "X-Adzerk-ApiKey": KEVEL_API_KEY,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Kevel API ${res.status} on GET /v1/${path}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export interface CreativeDetail {
  id: number;
  title: string;
  advertiserId: number;
  advertiserName: string;
  isActive: boolean;
  isHTMLJS: boolean;
  scriptBody: string;     // The HTML/JS creative content
  adTypeId: number;
  flightIds: number[];
  format: string;         // "Billboard" | "Leaderboard" | "MRec"
  size: string;           // "billboard" | "leaderboard" | "mrec"
  dimensions: string;     // "970×250" etc.
  cpm: number;
  lastModified?: string;
}

export interface AdvertiserCreatives {
  advertiserId: number;
  advertiserName: string;
  color: string;           // Tailwind color token for UI
  creatives: CreativeDetail[];
}

const ADVERTISER_COLORS: Record<number, string> = {
  6254651: "amber",
  6256255: "blue",
  6256266: "teal",
};

export async function GET() {
  if (!KEVEL_API_KEY) {
    return NextResponse.json(
      { error: "Missing KEVEL_API_KEY — Kevel Management API unavailable" },
      { status: 503 }
    );
  }

  try {
    const advertisers: AdvertiserCreatives[] = await Promise.all(
      ADVERTISER_IDS.map(async (advId) => {
        const creativeIds = CREATIVE_IDS[advId] ?? [];
        const creatives = await Promise.all(
          creativeIds.map(async (creativeId): Promise<CreativeDetail> => {
            try {
              const data = await kevelGet(`creative/${creativeId}`);
              const fmt = FORMAT_LABELS[creativeId] ?? { size: "unknown", format: "Unknown", dimensions: "?" };
              const cpmTable = CPM_RATES[advId] ?? {};
              return {
                id: creativeId,
                title: data.Title ?? data.title ?? `Creative ${creativeId}`,
                advertiserId: advId,
                advertiserName: ADVERTISER_NAMES[advId],
                isActive: data.IsActive ?? true,
                isHTMLJS: data.IsHTMLJS ?? false,
                scriptBody: data.ScriptBody ?? data.Body ?? "",
                adTypeId: data.AdTypeId ?? 5,
                flightIds: CREATIVE_FLIGHTS[creativeId] ?? [],
                format: fmt.format,
                size: fmt.size,
                dimensions: fmt.dimensions,
                cpm: cpmTable[fmt.size] ?? 0,
                lastModified: data.LastModified ?? data.UpdatedAt,
              };
            } catch (err) {
              // Return a stub if one creative fails — don't fail the whole response
              const fmt = FORMAT_LABELS[creativeId] ?? { size: "unknown", format: "Unknown", dimensions: "?" };
              return {
                id: creativeId,
                title: `Creative ${creativeId} (fetch error)`,
                advertiserId: advId,
                advertiserName: ADVERTISER_NAMES[advId],
                isActive: false,
                isHTMLJS: false,
                scriptBody: `<!-- Error fetching creative: ${String(err).slice(0, 100)} -->`,
                adTypeId: 5,
                flightIds: CREATIVE_FLIGHTS[creativeId] ?? [],
                format: fmt.format,
                size: fmt.size,
                dimensions: fmt.dimensions,
                cpm: 0,
              };
            }
          })
        );
        return {
          advertiserId: advId,
          advertiserName: ADVERTISER_NAMES[advId],
          color: ADVERTISER_COLORS[advId] ?? "stone",
          creatives,
        };
      })
    );

    const totalCreatives = advertisers.reduce((sum, a) => sum + a.creatives.length, 0);
    const activeCreatives = advertisers.reduce(
      (sum, a) => sum + a.creatives.filter((c) => c.isActive).length,
      0
    );

    return NextResponse.json({
      advertisers,
      meta: {
        totalCreatives,
        activeCreatives,
        totalAdvertisers: ADVERTISER_IDS.length,
        lastFetched: new Date().toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch creatives: ${String(err)}` },
      { status: 500 }
    );
  }
}

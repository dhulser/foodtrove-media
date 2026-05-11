/**
 * /api/admin/creatives — Kevel Management API proxy for Creative Preview dashboard
 *
 * Returns all creatives for all advertisers on FoodTrove network 12024.
 * Includes ScriptBody HTML, flight associations, format metadata, and active status.
 *
 * Server-side only — KEVEL_API_KEY never leaves the server.
 *
 * Advertisers (real brands, internal demo only):
 *   Organic Valley  (6256813) — purple  — campaigns 659171965
 *   Liquid I.V.     (6256814) — sky     — campaign 659171966
 *   Earthbound Farm (6256815) — orange  — campaign 659171967
 *
 * Response shape:
 *   { advertisers: AdvertiserCreatives[], meta: { totalCreatives, lastFetched } }
 */
import { NextResponse } from "next/server";

const KEVEL_API_KEY = process.env.KEVEL_API_KEY;

// Advertiser IDs for FoodTrove network 12024 — real CPG brands (internal demo)
const ADVERTISER_IDS = [6256813, 6256814, 6256815];

const ADVERTISER_NAMES: Record<number, string> = {
  6256813: "Organic Valley",
  6256814: "Liquid I.V.",
  6256815: "Earthbound Farm",
};

// Creative IDs per advertiser (Billboard, Leaderboard, MRec)
const CREATIVE_IDS: Record<number, number[]> = {
  6256813: [906824269, 906824270, 906824271],  // OV: Billboard, Leaderboard, MRec
  6256814: [906824272, 906824273, 906824274],  // LIV: Billboard, Leaderboard, MRec
  6256815: [906824275, 906824276, 906824277],  // EBF: Billboard, Leaderboard, MRec
};

// Flight associations per creative (creative → [flightId, ...])
// Note: /creative/map returns 404 on network 12024 — wire via Kevel dashboard
const CREATIVE_FLIGHTS: Record<number, number[]> = {
  906824269: [863229974],  // OV Billboard → flight
  906824270: [863229975],  // OV Leaderboard → flight
  906824271: [863229976],  // OV MRec → flight
  906824272: [863229977],  // LIV Billboard → flight
  906824273: [863229978],  // LIV Leaderboard → flight
  906824274: [863229979],  // LIV MRec → flight
  906824275: [863229980],  // EBF Billboard → flight
  906824276: [863229981],  // EBF Leaderboard → flight
  906824277: [863229982],  // EBF MRec → flight
};

// Human-readable format labels per creative
const FORMAT_LABELS: Record<number, { size: string; format: string; dimensions: string }> = {
  906824269: { size: "billboard",   format: "Billboard",   dimensions: "970×250" },
  906824270: { size: "leaderboard", format: "Leaderboard", dimensions: "728×90"  },
  906824271: { size: "mrec",        format: "MRec",        dimensions: "300×250" },
  906824272: { size: "billboard",   format: "Billboard",   dimensions: "970×250" },
  906824273: { size: "leaderboard", format: "Leaderboard", dimensions: "728×90"  },
  906824274: { size: "mrec",        format: "MRec",        dimensions: "300×250" },
  906824275: { size: "billboard",   format: "Billboard",   dimensions: "970×250" },
  906824276: { size: "leaderboard", format: "Leaderboard", dimensions: "728×90"  },
  906824277: { size: "mrec",        format: "MRec",        dimensions: "300×250" },
};

// CPM rates per advertiser per format
const CPM_RATES: Record<number, Record<string, number>> = {
  6256813: { billboard: 7.00, leaderboard: 6.00, mrec: 5.50 },
  6256814: { billboard: 7.00, leaderboard: 6.00, mrec: 5.50 },
  6256815: { billboard: 7.00, leaderboard: 6.00, mrec: 5.50 },
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
  scriptBody: string;
  adTypeId: number;
  flightIds: number[];
  format: string;
  size: string;
  dimensions: string;
  cpm: number;
  lastModified?: string;
}

export interface AdvertiserCreatives {
  advertiserId: number;
  advertiserName: string;
  color: string;
  creatives: CreativeDetail[];
}

const ADVERTISER_COLORS: Record<number, string> = {
  6256813: "violet",
  6256814: "sky",
  6256815: "orange",
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

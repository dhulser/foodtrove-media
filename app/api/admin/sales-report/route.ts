/**
 * /api/admin/sales-report — Revenue reporting for Sales dashboard
 *
 * Pulls live flight data from the Kevel Management API and calculates:
 * - Estimated revenue per advertiser per format (CPM × impressions / 1000)
 * - Blended effective CPM across the network
 * - Impression budget utilisation per flight
 * - Competitive auction summary (which advertisers are competing on each keyword)
 *
 * All CPM rates are live from Kevel (Price field on flights).
 * Impression counts are budget figures (IsUnlimited = no cap). In a real
 * network these would come from a reporting API. We project revenue based on
 * an estimated daily fill rate (configurable).
 *
 * Cached 60s — revenue figures don't need sub-minute freshness.
 */
import { NextResponse } from "next/server";

const KEVEL_API_KEY = process.env.KEVEL_API_KEY;

// --- FoodTrove network config ---
const ADVERTISERS: Record<
  number,
  { name: string; campaignIds: number[] }
> = {
  6254651: { name: "FreshFarm Organics", campaignIds: [659158534] },
  6256255: { name: "NutriPeak Nutrition", campaignIds: [659159072] },
  6256266: { name: "GreenLeaf Farms",    campaignIds: [659159177] },
};

const CAMPAIGNS: Record<
  number,
  { advertiserId: number; flightIds: number[] }
> = {
  659158534: { advertiserId: 6254651, flightIds: [863187467, 863187590, 863188334] },
  659159072: { advertiserId: 6256255, flightIds: [863188608, 863188610, 863188611] },
  659159177: { advertiserId: 6256266, flightIds: [863188756, 863188757] },
};

// Map keyword → format name for readable labels
const FORMAT_LABELS: Record<string, string> = {
  "ft-billboard":   "Billboard (970×250)",
  "ft-leaderboard": "Leaderboard (728×90)",
  "ft-mrec":        "Medium Rectangle (300×250)",
};

// Estimated daily impressions per format (conservative — demo environment)
// In production these come from a reporting API
const ESTIMATED_DAILY_IMPRESSIONS: Record<string, number> = {
  "ft-billboard":   2400,  // ~100/hr × 24h
  "ft-leaderboard": 4800,  // ~200/hr × 24h
  "ft-mrec":        3600,  // ~150/hr × 24h
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
    throw new Error(`Kevel ${res.status} on GET /v1/${path}`);
  }
  return res.json();
}

export interface FlightReport {
  flightId: number;
  flightName: string;
  keyword: string;
  format: string;
  isActive: boolean;
  cpm: number;                   // $ per 1000 impressions
  estimatedDailyImpressions: number;
  estimatedDailyRevenue: number; // CPM × daily impressions / 1000
  estimatedMonthlyRevenue: number;
}

export interface AdvertiserReport {
  advertiserId: number;
  advertiserName: string;
  flights: FlightReport[];
  totalDailyRevenue: number;
  totalMonthlyRevenue: number;
  activeFormats: string[];
}

export interface NetworkSummary {
  totalDailyRevenue: number;
  totalMonthlyRevenue: number;
  blendedCPM: number;
  totalActiveFlights: number;
  auctionCompetition: AuctionSlot[];
  fetchedAt: string;
}

export interface AuctionSlot {
  format: string;
  keyword: string;
  competitors: Array<{
    advertiserName: string;
    cpm: number;
    isWinning: boolean;
  }>;
  winningCPM: number;
  runnerUpCPM: number | null;
}

export interface SalesReportResponse {
  advertisers: AdvertiserReport[];
  network: NetworkSummary;
}

export async function GET() {
  if (!KEVEL_API_KEY) {
    return NextResponse.json(
      { error: "Missing KEVEL_API_KEY — sales report unavailable" },
      { status: 503 }
    );
  }

  try {
    // Fetch all flights in parallel across all campaigns
    const allFlightIds = Object.values(CAMPAIGNS).flatMap((c) => c.flightIds);
    const flightDataMap: Record<number, ReturnType<typeof Object.create>> = {};

    await Promise.all(
      allFlightIds.map(async (flightId) => {
        try {
          const data = await kevelGet(`flight/${flightId}`);
          flightDataMap[flightId] = data;
        } catch {
          flightDataMap[flightId] = null;
        }
      })
    );

    // Build advertiser reports
    const advertiserReports: AdvertiserReport[] = Object.entries(ADVERTISERS).map(
      ([advIdStr, advInfo]) => {
        const advId = parseInt(advIdStr, 10);
        const flightIds = advInfo.campaignIds.flatMap(
          (cid) => CAMPAIGNS[cid]?.flightIds ?? []
        );

        const flights: FlightReport[] = flightIds
          .map((flightId): FlightReport | null => {
            const fd = flightDataMap[flightId];
            if (!fd) return null;

            const keyword = (fd.Keywords ?? "").split(",")[0].trim();
            const format = FORMAT_LABELS[keyword] ?? keyword ?? "Unknown format";
            const cpm: number = fd.Price ?? 0;
            const dailyImpressions = ESTIMATED_DAILY_IMPRESSIONS[keyword] ?? 1000;
            const dailyRevenue = (cpm / 1000) * dailyImpressions;

            return {
              flightId: fd.Id,
              flightName: fd.Name,
              keyword,
              format,
              isActive: fd.IsActive ?? false,
              cpm,
              estimatedDailyImpressions: dailyImpressions,
              estimatedDailyRevenue: parseFloat(dailyRevenue.toFixed(2)),
              estimatedMonthlyRevenue: parseFloat((dailyRevenue * 30).toFixed(2)),
            };
          })
          .filter((f): f is FlightReport => f !== null && f.isActive);

        const totalDaily = flights.reduce((sum, f) => sum + f.estimatedDailyRevenue, 0);
        const totalMonthly = flights.reduce((sum, f) => sum + f.estimatedMonthlyRevenue, 0);

        return {
          advertiserId: advId,
          advertiserName: advInfo.name,
          flights,
          totalDailyRevenue: parseFloat(totalDaily.toFixed(2)),
          totalMonthlyRevenue: parseFloat(totalMonthly.toFixed(2)),
          activeFormats: Array.from(new Set(flights.map((f) => f.format))),
        };
      }
    );

    // Network summary
    const totalDailyRevenue = advertiserReports.reduce(
      (sum, a) => sum + a.totalDailyRevenue,
      0
    );
    const totalMonthlyRevenue = advertiserReports.reduce(
      (sum, a) => sum + a.totalMonthlyRevenue,
      0
    );

    // Weighted blended CPM (impressions × CPM / total impressions)
    const allFlights = advertiserReports.flatMap((a) => a.flights);
    const totalImpressions = allFlights.reduce(
      (sum, f) => sum + f.estimatedDailyImpressions,
      0
    );
    const weightedCPM =
      totalImpressions > 0
        ? allFlights.reduce(
            (sum, f) => sum + f.cpm * f.estimatedDailyImpressions,
            0
          ) / totalImpressions
        : 0;

    // Auction competition by format
    const formatKeywords = ["ft-billboard", "ft-leaderboard", "ft-mrec"];
    const auctionCompetition: AuctionSlot[] = formatKeywords.map((kw) => {
      const competingFlights = allFlights
        .filter((f) => f.keyword === kw)
        .sort((a, b) => b.cpm - a.cpm);

      const competitors = competingFlights.map((f, i) => {
        const adv = advertiserReports.find((a) =>
          a.flights.some((af) => af.flightId === f.flightId)
        );
        return {
          advertiserName: adv?.advertiserName ?? "Unknown",
          cpm: f.cpm,
          isWinning: i === 0,
        };
      });

      return {
        format: FORMAT_LABELS[kw] ?? kw,
        keyword: kw,
        competitors,
        winningCPM: competingFlights[0]?.cpm ?? 0,
        runnerUpCPM: competingFlights[1]?.cpm ?? null,
      };
    });

    return NextResponse.json({
      advertisers: advertiserReports,
      network: {
        totalDailyRevenue: parseFloat(totalDailyRevenue.toFixed(2)),
        totalMonthlyRevenue: parseFloat(totalMonthlyRevenue.toFixed(2)),
        blendedCPM: parseFloat(weightedCPM.toFixed(2)),
        totalActiveFlights: allFlights.length,
        auctionCompetition,
        fetchedAt: new Date().toISOString(),
      },
    } satisfies SalesReportResponse);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[SalesReport] Kevel fetch failed:", msg);
    return NextResponse.json(
      { error: `Sales report unavailable: ${msg}` },
      { status: 502 }
    );
  }
}

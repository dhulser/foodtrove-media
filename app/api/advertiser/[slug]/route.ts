/**
 * /api/advertiser/[slug] — Advertiser Self-Serve Performance API
 *
 * Returns a performance view for a single advertiser: live campaign state from
 * the Kevel Management API, plus derived impression/spend estimates using the
 * same delivery model as /api/admin/analytics.
 *
 * Powers /advertiser/[slug] — the brand-facing portal each advertiser sees.
 *
 * Auth: none for demo (production would gate on advertiser session).
 * Cache: 60s — frequent enough for demo freshness.
 */

import { NextResponse } from "next/server";
import { BRANDS } from "@/lib/brands";

const KEVEL_API_KEY = process.env.KEVEL_API_KEY;
const KEVEL_API_BASE = "https://api.kevel.co/v1";

// Flight config per advertiser slug — all flights this advertiser runs
const ADVERTISER_FLIGHTS: Record<
  string,
  {
    flightId: number;
    format: string;
    formatLabel: string;
    cpm: number;
    contextual: boolean;
    keyword: string;
    monthlyImpressions: number;
  }[]
> = {
  "organic-valley": [
    {
      flightId: 863229974,
      format: "billboard",
      formatLabel: "Billboard 970×250",
      cpm: 5.0,
      contextual: false,
      keyword: "ft-billboard",
      monthlyImpressions: 120_000,
    },
    {
      flightId: 863229975,
      format: "leaderboard",
      formatLabel: "Leaderboard 728×90",
      cpm: 5.0,
      contextual: false,
      keyword: "ft-leaderboard",
      monthlyImpressions: 280_000,
    },
    {
      flightId: 863229976,
      format: "mrec",
      formatLabel: "MRec 300×250",
      cpm: 5.0,
      contextual: false,
      keyword: "ft-mrec",
      monthlyImpressions: 420_000,
    },
  ],
  "liquid-iv": [
    {
      flightId: 863229977,
      format: "billboard",
      formatLabel: "Billboard 970×250",
      cpm: 7.5,
      contextual: false,
      keyword: "ft-billboard",
      monthlyImpressions: 120_000,
    },
    {
      flightId: 863229978,
      format: "leaderboard",
      formatLabel: "Leaderboard 728×90",
      cpm: 6.5,
      contextual: false,
      keyword: "ft-leaderboard",
      monthlyImpressions: 280_000,
    },
    {
      flightId: 863229979,
      format: "mrec",
      formatLabel: "MRec 300×250",
      cpm: 6.0,
      contextual: false,
      keyword: "ft-mrec",
      monthlyImpressions: 420_000,
    },
  ],
  "earthbound-farm": [
    {
      flightId: 863229981,
      format: "leaderboard",
      formatLabel: "Leaderboard 728×90 (Contextual)",
      cpm: 8.0,
      contextual: true,
      keyword: "ft-leaderboard,produce",
      monthlyImpressions: 280_000,
    },
    {
      flightId: 863229982,
      format: "mrec",
      formatLabel: "MRec 300×250 (Contextual)",
      cpm: 7.5,
      contextual: true,
      keyword: "ft-mrec,produce",
      monthlyImpressions: 420_000,
    },
  ],
};

// Deterministic daily delivery fraction (same model as analytics)
function dailyDeliveryFraction(dayOfMonth: number): number {
  const weekly = [0.85, 1.0, 1.05, 1.08, 1.1, 0.92, 0.82];
  const base = weekly[dayOfMonth % 7] ?? 1.0;
  const midMonthBoost = 1 + 0.05 * Math.sin((dayOfMonth / 30) * Math.PI);
  return base * midMonthBoost;
}

function mtdImpressions(monthlyTotal: number): number {
  const now = new Date();
  const day = now.getUTCDate();
  let total = 0;
  for (let d = 1; d <= day; d++) {
    const fraction = dailyDeliveryFraction(d);
    total += (monthlyTotal / 30) * fraction;
  }
  return Math.round(total);
}

// Fetch a single flight from Kevel Management API
async function fetchFlight(flightId: number): Promise<Record<string, unknown> | null> {
  if (!KEVEL_API_KEY) return null;
  try {
    const res = await fetch(`${KEVEL_API_BASE}/flight/${flightId}`, {
      headers: { "X-Adzerk-ApiKey": KEVEL_API_KEY },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<Record<string, unknown>>;
  } catch {
    return null;
  }
}

// Fetch campaign from Kevel Management API
async function fetchCampaign(campaignId: number): Promise<Record<string, unknown> | null> {
  if (!KEVEL_API_KEY) return null;
  try {
    const res = await fetch(`${KEVEL_API_BASE}/campaign/${campaignId}`, {
      headers: { "X-Adzerk-ApiKey": KEVEL_API_KEY },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<Record<string, unknown>>;
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const brand = BRANDS.find((b) => b.slug === slug);
  if (!brand) {
    return NextResponse.json({ error: "Advertiser not found" }, { status: 404 });
  }

  const flights = ADVERTISER_FLIGHTS[slug] ?? [];

  // Fetch live campaign data
  const campaignData = await fetchCampaign(brand.kevelCampaignId);

  // Fetch each flight live
  const flightResults = await Promise.all(
    flights.map(async (f) => {
      const live = await fetchFlight(f.flightId);
      const mtd = mtdImpressions(f.monthlyImpressions);
      const monthlyTarget = f.monthlyImpressions;
      const day = new Date().getUTCDate();
      const expectedMtd = Math.round((monthlyTarget / 30) * day * 1.0);
      const paceRatio = expectedMtd > 0 ? mtd / expectedMtd : 1.0;

      const paceStatus =
        paceRatio >= 0.9 && paceRatio <= 1.1
          ? "on-track"
          : paceRatio > 1.1
          ? "over-pacing"
          : "under-pacing";

      const estimatedSpend = (mtd / 1000) * f.cpm;

      return {
        flightId: f.flightId,
        format: f.format,
        formatLabel: f.formatLabel,
        cpm: f.cpm,
        contextual: f.contextual,
        keyword: f.keyword,
        // Live Kevel state
        isActive: live ? live.IsActive === true : true,
        flightName: live ? (live.Name as string) ?? f.formatLabel : f.formatLabel,
        // Delivery estimates
        mtdImpressions: mtd,
        monthlyTarget,
        estimatedSpend: parseFloat(estimatedSpend.toFixed(2)),
        paceRatio: parseFloat(paceRatio.toFixed(3)),
        paceStatus,
      };
    })
  );

  // Network totals
  const totalMtdImpressions = flightResults.reduce((s, f) => s + f.mtdImpressions, 0);
  const totalEstimatedSpend = flightResults.reduce((s, f) => s + f.estimatedSpend, 0);
  const activeFlights = flightResults.filter((f) => f.isActive).length;

  // Auction context: who else is competing on these formats?
  const AUCTION_CONTEXT: Record<string, { name: string; cpm: number }[]> = {
    billboard: [
      { name: "Organic Valley", cpm: 5.0 },
      { name: "Liquid I.V.", cpm: 7.5 },
    ],
    leaderboard: [
      { name: "Organic Valley", cpm: 5.0 },
      { name: "Liquid I.V.", cpm: 6.5 },
      { name: "Earthbound Farm", cpm: 8.0 },
    ],
    mrec: [
      { name: "Organic Valley", cpm: 5.0 },
      { name: "Liquid I.V.", cpm: 6.0 },
      { name: "Earthbound Farm", cpm: 7.5 },
    ],
  };

  // For each flight, show their position in the auction
  const flightsWithAuction = flightResults.map((f) => {
    const competitors = AUCTION_CONTEXT[f.format] ?? [];
    const sorted = [...competitors].sort((a, b) => b.cpm - a.cpm);
    const myRank = sorted.findIndex((c) => c.name === brand.name) + 1;
    const totalBidders = sorted.length;
    const topBid = sorted[0]?.cpm ?? f.cpm;
    const isWinning = myRank === 1;

    return {
      ...f,
      auctionRank: myRank,
      auctionParticipants: totalBidders,
      topBidCpm: topBid,
      isWinning,
    };
  });

  return NextResponse.json(
    {
      advertiser: {
        slug: brand.slug,
        name: brand.name,
        tagline: brand.tagline,
        icon: brand.icon,
        kevelAdvertiserId: brand.kevelAdvertiserId,
        kevelCampaignId: brand.kevelCampaignId,
        campaignName: campaignData
          ? (campaignData.Name as string) ?? `${brand.name} — Campaign`
          : `${brand.name} — Campaign`,
        campaignIsActive: campaignData
          ? campaignData.IsActive === true
          : true,
      },
      summary: {
        activeFlights,
        totalFlights: flights.length,
        totalMtdImpressions,
        totalEstimatedSpend: parseFloat(totalEstimatedSpend.toFixed(2)),
        networkFormats: flights.map((f) => f.format),
      },
      flights: flightsWithAuction,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    }
  );
}

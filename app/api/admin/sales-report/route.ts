/**
 * /api/admin/sales-report — Sales reporting data endpoint
 *
 * Aggregates campaign data from Kevel Management API into a Sales-friendly
 * format. Returns CPM rates, flight status, advertiser roster, and
 * estimated inventory value for Tyler's pipeline conversations.
 *
 * Auth: none for demo (production would require session auth)
 * Cache: 5-minute TTL
 */
import { NextResponse } from "next/server";

interface KevelFlight {
  Id: number;
  Name: string;
  CampaignId: number;
  Price: number;
  RateType: number;
  IsActive: boolean;
  IsUnlimited: boolean;
  Impressions: number;
  Keywords: string;
  StartDateISO: string;
}

interface KevelCampaign {
  Id: number;
  Name: string;
  AdvertiserId: number;
  IsActive: boolean;
}

interface KevelAdvertiser {
  Id: number;
  Title: string;
  IsActive: boolean;
}

const FORMAT_LABELS: Record<string, string> = {
  "ft-billboard": "Billboard 970×250",
  "ft-leaderboard": "Leaderboard 728×90",
  "ft-mrec": "MRec 300×250",
};

function extractFormat(keywords: string): string {
  if (!keywords) return "Unknown";
  const kws = keywords.split(",").map((k) => k.trim());
  for (const kw of kws) {
    if (FORMAT_LABELS[kw]) return FORMAT_LABELS[kw];
  }
  return "Custom";
}

function isContextual(keywords: string): boolean {
  if (!keywords) return false;
  const kws = keywords.split(",").map((k) => k.trim());
  const formatKeys = new Set(Object.keys(FORMAT_LABELS));
  return kws.some((kw) => !formatKeys.has(kw));
}

// Simulate monthly impression estimates based on slot type
const MONTHLY_IMPRESSION_ESTIMATES: Record<string, number> = {
  "ft-billboard": 120000,
  "ft-leaderboard": 200000,
  "ft-mrec": 350000,
};

async function kevelGet(path: string, apiKey: string) {
  const url = `https://api.kevel.co/v1/${path}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resp = await (fetch as any)(url, {
    headers: { "X-Adzerk-ApiKey": apiKey },
    next: { revalidate: 300 }, // 5-minute cache — Next.js fetch extension
  });
  if (!resp.ok) throw new Error(`Kevel API ${path}: ${resp.status}`);
  return resp.json();
}

export async function GET() {
  const apiKey = process.env.KEVEL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "no-credentials" }, { status: 503 });
  }

  try {
    // Known advertiser IDs from FoodTrove network 12024
    const advertiserIds = [6254651, 6256255, 6256266];
    const campaignIds = [659158534, 659159072, 659159177];

    // Fetch all data in parallel
    const [advertisers, ...campaigns] = await Promise.all([
      Promise.all(advertiserIds.map((id) => kevelGet(`advertiser/${id}`, apiKey).catch(() => null))),
      ...campaignIds.map((id) => kevelGet(`campaign/${id}`, apiKey).catch(() => null)),
    ]);

    // Build advertiser map
    const advertiserMap: Record<number, KevelAdvertiser> = {};
    for (const adv of advertisers as (KevelAdvertiser | null)[]) {
      if (adv) advertiserMap[adv.Id] = adv;
    }

    // Known flight IDs per campaign
    const flightIdsByCampaign: Record<number, number[]> = {
      659158534: [863187467, 863187590, 863188334],  // FreshFarm
      659159072: [863188608, 863188610, 863188611],  // NutriPeak
      659159177: [863188756, 863188757],             // GreenLeaf
    };

    // Fetch all flights in parallel
    const allFlightIds = Object.values(flightIdsByCampaign).flat();
    const flights = await Promise.all(
      allFlightIds.map((id) => kevelGet(`flight/${id}`, apiKey).catch(() => null))
    );
    const flightMap: Record<number, KevelFlight> = {};
    for (const f of flights as (KevelFlight | null)[]) {
      if (f) flightMap[f.Id] = f;
    }

    // Build sales report data
    const advertisers_report = advertiserIds.map((advId) => {
      const adv = advertiserMap[advId];
      if (!adv) return null;

      // Find campaigns for this advertiser
      const advCampaigns = (campaigns as (KevelCampaign | null)[]).filter(
        (c): c is KevelCampaign => c !== null && c.AdvertiserId === advId
      );

      const advFlights: KevelFlight[] = [];
      for (const camp of advCampaigns) {
        const campFlightIds = flightIdsByCampaign[camp.Id] ?? [];
        for (const fid of campFlightIds) {
          const f = flightMap[fid];
          if (f) advFlights.push(f);
        }
      }

      const activeFlights = advFlights.filter((f) => f.IsActive);
      const formats = activeFlights.map((f) => ({
        name: f.Name,
        format: extractFormat(f.Keywords),
        keywords: f.Keywords,
        cpm: f.Price,
        isContextual: isContextual(f.Keywords),
        isActive: f.IsActive,
        flightId: f.Id,
        monthlyEstImpressions: (() => {
          const kws = f.Keywords?.split(",").map((k) => k.trim()) ?? [];
          const formatKey = kws.find((k) => MONTHLY_IMPRESSION_ESTIMATES[k]);
          return formatKey ? MONTHLY_IMPRESSION_ESTIMATES[formatKey] : 50000;
        })(),
      }));

      const totalMonthlyRevenue = formats.reduce((sum, f) => {
        return sum + (f.cpm / 1000) * f.monthlyEstImpressions;
      }, 0);

      return {
        id: advId,
        name: adv.Title,
        isActive: adv.IsActive,
        campaigns: advCampaigns.length,
        activeFlights: activeFlights.length,
        formats,
        avgCpm: formats.length > 0
          ? formats.reduce((s, f) => s + f.cpm, 0) / formats.length
          : 0,
        estimatedMonthlyRevenue: totalMonthlyRevenue,
      };
    }).filter(Boolean);

    // Aggregate metrics
    const totalActiveFlights = advertisers_report.reduce(
      (s, a) => s + (a?.activeFlights ?? 0), 0
    );
    const totalEstMonthlyRevenue = advertisers_report.reduce(
      (s, a) => s + (a?.estimatedMonthlyRevenue ?? 0), 0
    );
    const avgNetworkCpm = advertisers_report.length > 0
      ? advertisers_report.reduce((s, a) => s + (a?.avgCpm ?? 0), 0) / advertisers_report.length
      : 0;

    // Placement inventory summary
    const inventory = [
      {
        placement: "Homepage Billboard",
        size: "970×250",
        location: "Above fold, homepage",
        estimatedMonthlyImpressions: MONTHLY_IMPRESSION_ESTIMATES["ft-billboard"],
        currentCpm: Math.max(...advertisers_report.map(a =>
          a?.formats.find(f => f.keywords?.includes("ft-billboard"))?.cpm ?? 0
        )),
        advertisers: advertisers_report.filter(a =>
          a?.formats.some(f => f.keywords?.includes("ft-billboard"))
        ).map(a => a?.name),
      },
      {
        placement: "Leaderboard",
        size: "728×90",
        location: "Department pages, homepage, search",
        estimatedMonthlyImpressions: MONTHLY_IMPRESSION_ESTIMATES["ft-leaderboard"],
        currentCpm: Math.max(...advertisers_report.map(a =>
          a?.formats.find(f => f.keywords?.includes("ft-leaderboard"))?.cpm ?? 0
        )),
        advertisers: advertisers_report.filter(a =>
          a?.formats.some(f => f.keywords?.includes("ft-leaderboard"))
        ).map(a => a?.name),
      },
      {
        placement: "Medium Rectangle",
        size: "300×250",
        location: "Product pages, dept right rail, cart",
        estimatedMonthlyImpressions: MONTHLY_IMPRESSION_ESTIMATES["ft-mrec"],
        currentCpm: Math.max(...advertisers_report.map(a =>
          a?.formats.find(f => f.keywords?.includes("ft-mrec"))?.cpm ?? 0
        )),
        advertisers: advertisers_report.filter(a =>
          a?.formats.some(f => f.keywords?.includes("ft-mrec"))
        ).map(a => a?.name),
      },
    ];

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      network: "FoodTrove Media — Kevel Network 12024",
      summary: {
        totalAdvertisers: advertisers_report.length,
        totalActiveFlights,
        estimatedMonthlyRevenue: totalEstMonthlyRevenue,
        avgNetworkCpm,
      },
      advertisers: advertisers_report,
      inventory,
    });
  } catch (err) {
    console.error("[sales-report] Error:", err);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}

/**
 * /api/admin/analytics — Network Analytics API
 *
 * Aggregates live Kevel Management API data into a network-level performance view:
 * - Fill rate estimates per ad format
 * - CPM competition and auction dynamics
 * - Placement-level impression projections
 * - Network health status (active flights, advertisers, creatives)
 * - Revenue run-rate and trend signals
 *
 * This is the executive overview surface — consumed by /admin/analytics.
 * Data sources:
 *   1. Kevel Management API (live flight/advertiser state)
 *   2. Derived metrics from known campaign configuration
 *   3. Simulated impression delivery model (for demo credibility)
 *
 * Auth: none for demo (production would require session auth)
 */

import { NextResponse } from "next/server";

const KEVEL_API_KEY = process.env.KEVEL_API_KEY;

// All known flight IDs on the network, grouped by format keyword
const FLIGHT_CONFIG: Record<string, { flightId: number; advertiserId: number; advertiserName: string; cpm: number; contextual: boolean }[]> = {
  "ft-billboard": [
    { flightId: 863187467, advertiserId: 6254651, advertiserName: "FreshFarm Organics", cpm: 5.0, contextual: false },
    { flightId: 863188608, advertiserId: 6256255, advertiserName: "NutriPeak Nutrition", cpm: 7.5, contextual: false },
  ],
  "ft-leaderboard": [
    { flightId: 863187590, advertiserId: 6254651, advertiserName: "FreshFarm Organics", cpm: 5.0, contextual: false },
    { flightId: 863188610, advertiserId: 6256255, advertiserName: "NutriPeak Nutrition", cpm: 6.5, contextual: false },
    { flightId: 863188756, advertiserId: 6256266, advertiserName: "GreenLeaf Farms", cpm: 8.0, contextual: true },
  ],
  "ft-mrec": [
    { flightId: 863188334, advertiserId: 6254651, advertiserName: "FreshFarm Organics", cpm: 5.0, contextual: false },
    { flightId: 863188611, advertiserId: 6256255, advertiserName: "NutriPeak Nutrition", cpm: 6.0, contextual: false },
    { flightId: 863188757, advertiserId: 6256266, advertiserName: "GreenLeaf Farms", cpm: 7.5, contextual: true },
  ],
};

const FORMAT_LABELS: Record<string, string> = {
  "ft-billboard": "Billboard 970×250",
  "ft-leaderboard": "Leaderboard 728×90",
  "ft-mrec": "MRec 300×250",
};

// Monthly impression volume estimates by format (based on page traffic modeling)
const MONTHLY_IMPRESSIONS: Record<string, number> = {
  "ft-billboard": 120_000,
  "ft-leaderboard": 280_000,
  "ft-mrec": 420_000,
};

// Deterministic per-day delivery curve (index = day of month, 0-based)
// Models realistic traffic patterns: higher on weekends, weekly cycles
function dailyDeliveryFraction(dayOfMonth: number): number {
  const weekly = [0.85, 1.0, 1.05, 1.08, 1.1, 0.92, 0.82]; // Mon–Sun baseline
  const weekday = dayOfMonth % 7;
  const base = weekly[weekday] ?? 1.0;
  // Small month-wave: uptick mid-month
  const midMonthBoost = 1 + 0.05 * Math.sin((dayOfMonth / 30) * Math.PI);
  return base * midMonthBoost;
}

// Simulate month-to-date impressions delivered (deterministic from date seed)
function mtdImpressions(format: string, today: Date): number {
  const dom = today.getDate(); // day of month
  const monthly = MONTHLY_IMPRESSIONS[format] ?? 100_000;
  const dailyAvg = monthly / 30;
  let total = 0;
  for (let d = 1; d < dom; d++) {
    total += dailyAvg * dailyDeliveryFraction(d);
  }
  // Add partial today (assume linear through current hour)
  const hourFraction = today.getHours() / 24;
  total += dailyAvg * dailyDeliveryFraction(dom) * hourFraction;
  return Math.round(total);
}

// Fill rate model: higher competition = higher fill rate
function estimateFillRate(format: string, activeFlightCount: number): number {
  const base = 0.72; // baseline fill rate with one active advertiser
  const competitionBoost = (activeFlightCount - 1) * 0.08;
  const formatBonus = format === "ft-mrec" ? 0.05 : 0; // MRec historically better fill
  return Math.min(0.99, base + competitionBoost + formatBonus);
}

async function kevelGet(path: string) {
  if (!KEVEL_API_KEY) throw new Error("KEVEL_API_KEY not set");
  const url = `https://api.kevel.co/v1/${path}`;
  const res = await fetch(url, {
    headers: { "X-Adzerk-ApiKey": KEVEL_API_KEY },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Kevel ${path}: ${res.status}`);
  return res.json();
}

interface FlightData {
  Id: number;
  Name: string;
  IsActive: boolean;
  IsUnlimited: boolean;
  Impressions: number;
  Price: number;
  Keywords: string;
}

export async function GET() {
  const today = new Date();

  if (!KEVEL_API_KEY) {
    return NextResponse.json(
      { error: "Missing KEVEL_API_KEY — Kevel Management API unavailable" },
      { status: 503 }
    );
  }

  try {
    // Fetch live flight status for all known flights
    const allFlightIds = Object.values(FLIGHT_CONFIG).flat().map(f => f.flightId);
    const flightResults = await Promise.allSettled(
      allFlightIds.map(id => kevelGet(`flight/${id}`))
    );

    const liveFlights = new Map<number, FlightData>();
    flightResults.forEach((result, i) => {
      if (result.status === "fulfilled") {
        liveFlights.set(allFlightIds[i], result.value as FlightData);
      }
    });

    // Build per-format analytics
    const formats = Object.keys(FLIGHT_CONFIG).map(formatKey => {
      const flights = FLIGHT_CONFIG[formatKey];
      const activeFlights = flights.filter(f => {
        const live = liveFlights.get(f.flightId);
        return live?.IsActive ?? false;
      });

      const cpms = activeFlights.map(f => f.cpm);
      const topCpm = cpms.length > 0 ? Math.max(...cpms) : 0;
      const avgCpm = cpms.length > 0 ? cpms.reduce((a, b) => a + b, 0) / cpms.length : 0;
      const auctionPressure = activeFlights.length; // # of competing advertisers

      const fillRate = estimateFillRate(formatKey, activeFlights.length);
      const monthlyImpressions = MONTHLY_IMPRESSIONS[formatKey] ?? 0;
      const mtd = mtdImpressions(formatKey, today);
      const monthlyRevEstimate = monthlyImpressions * (topCpm / 1000) * fillRate;
      const mtdRevEstimate = mtd * (topCpm / 1000) * fillRate;

      // Top winner per format (highest CPM active flight)
      const topWinner = activeFlights.reduce<typeof activeFlights[0] | null>((best, f) => {
        if (!best || f.cpm > best.cpm) return f;
        return best;
      }, null);

      return {
        formatKey,
        label: FORMAT_LABELS[formatKey],
        activeAdvertisers: activeFlights.length,
        totalAdvertisers: flights.length,
        topCpm,
        avgCpm: Math.round(avgCpm * 100) / 100,
        auctionPressure,
        fillRatePct: Math.round(fillRate * 1000) / 10, // one decimal
        monthlyImpressions,
        mtdImpressions: mtd,
        paceVsTarget: Math.round((mtd / (monthlyImpressions * (today.getDate() / 30))) * 100),
        monthlyRevEstimate: Math.round(monthlyRevEstimate),
        mtdRevEstimate: Math.round(mtdRevEstimate),
        topWinner: topWinner ? {
          name: topWinner.advertiserName,
          cpm: topWinner.cpm,
          contextual: topWinner.contextual,
        } : null,
        flights: activeFlights.map(f => ({
          name: f.advertiserName,
          cpm: f.cpm,
          contextual: f.contextual,
          flightId: f.flightId,
          isActive: liveFlights.get(f.flightId)?.IsActive ?? false,
        })),
      };
    });

    // Network-level rollup
    const totalActiveFlights = formats.reduce((n, f) => n + f.activeAdvertisers, 0);
    const totalMonthlyImpressions = formats.reduce((n, f) => n + f.monthlyImpressions, 0);
    const totalMtdImpressions = formats.reduce((n, f) => n + f.mtdImpressions, 0);
    const totalMonthlyRev = formats.reduce((n, f) => n + f.monthlyRevEstimate, 0);
    const totalMtdRev = formats.reduce((n, f) => n + f.mtdRevEstimate, 0);
    const avgFillRate = formats.reduce((n, f) => n + f.fillRatePct, 0) / formats.length;
    const avgTopCpm = formats.reduce((n, f) => n + f.topCpm, 0) / formats.length;

    // Unique active advertisers
    const activeAdvertiserIds = new Set(
      Object.values(FLIGHT_CONFIG)
        .flat()
        .filter(f => liveFlights.get(f.flightId)?.IsActive)
        .map(f => f.advertiserId)
    );

    // Day-of-week fill rate trend (last 7 days simulated)
    const trendDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const dom = d.getDate();
      const deliveryFrac = dailyDeliveryFraction(dom);
      const dailyImpressions = Math.round((totalMonthlyImpressions / 30) * deliveryFrac);
      const dailyRev = Math.round((totalMonthlyRev / 30) * deliveryFrac);
      return {
        date: dayLabel,
        impressions: dailyImpressions,
        revenue: dailyRev,
        fillRate: Math.round(avgFillRate * (0.9 + deliveryFrac * 0.1)),
      };
    });

    // Placement leaderboard — top slots by estimated impressions
    const placements = [
      { id: "home-hero-billboard", label: "Homepage Billboard", format: "ft-billboard", page: "/", position: "above-fold" },
      { id: "home-mid-leaderboard", label: "Homepage Leaderboard", format: "ft-leaderboard", page: "/", position: "mid-page" },
      { id: "dept-leaderboard", label: "Dept Page Leaderboard", format: "ft-leaderboard", page: "/shop/[dept]", position: "above-fold" },
      { id: "product-mrec", label: "Product Page MRec", format: "ft-mrec", page: "/shop/[dept]/[product]", position: "right-rail" },
      { id: "deals-billboard", label: "Deals Billboard", format: "ft-billboard", page: "/deals", position: "above-fold" },
      { id: "brands-mrec", label: "Brand Page MRec", format: "ft-mrec", page: "/brands/[slug]", position: "right-rail" },
      { id: "search-leaderboard", label: "Search Results Leaderboard", format: "ft-leaderboard", page: "/search", position: "top" },
    ].map(p => {
      const formatData = formats.find(f => f.formatKey === p.format)!;
      // Weight by position: above-fold > right-rail > mid-page
      const positionMultiplier = p.position === "above-fold" ? 1.2 : p.position === "right-rail" ? 0.9 : 0.75;
      const impressions = Math.round((formatData.monthlyImpressions / 3) * positionMultiplier); // 3 placements avg per format
      const mtdImp = Math.round((formatData.mtdImpressions / 3) * positionMultiplier);
      const revMonth = Math.round(impressions * (formatData.topCpm / 1000) * (formatData.fillRatePct / 100));
      return {
        ...p,
        monthlyImpressions: impressions,
        mtdImpressions: mtdImp,
        topCpm: formatData.topCpm,
        fillRatePct: formatData.fillRatePct,
        monthlyRevEstimate: revMonth,
        auctionPressure: formatData.auctionPressure,
      };
    }).sort((a, b) => b.monthlyRevEstimate - a.monthlyRevEstimate);

    return NextResponse.json({
      network: {
        networkId: 12024,
        fetchedAt: today.toISOString(),
        activeAdvertisers: activeAdvertiserIds.size,
        totalActiveFlights,
        avgFillRatePct: Math.round(avgFillRate * 10) / 10,
        avgTopCpm: Math.round(avgTopCpm * 100) / 100,
        monthlyImpressionCapacity: totalMonthlyImpressions,
        mtdImpressions: totalMtdImpressions,
        monthlyRevEstimate: totalMonthlyRev,
        mtdRevEstimate: totalMtdRev,
        dayOfMonth: today.getDate(),
        paceVsTarget: Math.round((totalMtdImpressions / (totalMonthlyImpressions * (today.getDate() / 30))) * 100),
      },
      formats,
      placements,
      trendDays,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[analytics] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * /api/admin/inventory — Inventory Availability Forecasting
 *
 * Pre-sales tool for Casey and Tyler: shows available impressions per format,
 * sold inventory from active Kevel flights, available-to-sell (ATS) capacity,
 * CPM floor guidance, and a 30-day forward availability curve.
 *
 * Traffic model:
 *   - Homepage: 4,200 sessions/day (est.)
 *   - Shop/category pages: 8,800 sessions/day (8 depts × 1,100)
 *   - Product detail: 6,500 sessions/day
 *   - Search: 1,800 sessions/day
 *   - Deals: 1,200 sessions/day
 *   - Cart + Order + Account: 1,800 sessions/day
 *   Total: ~24,300 sessions/day → drives impression estimates per placement
 *
 * Sold inventory derived from Kevel flight data (IsUnlimited=false flights show
 * booked impression caps; IsUnlimited=true treated as 70% fill rate at scale).
 */

import { NextResponse } from "next/server";

const KEVEL_API_KEY = process.env.KEVEL_API_KEY;
const KEVEL_NETWORK_ID = process.env.KEVEL_NETWORK_ID ?? "12024";

// Known flight IDs per campaign — mirrors campaigns route
const ALL_FLIGHT_IDS = [
  863187467, 863187590, 863188334,  // FreshFarm: billboard, leaderboard, mrec
  863188608, 863188610, 863188611,  // NutriPeak: billboard, leaderboard, mrec
  863188756, 863188757,              // GreenLeaf: leaderboard, mrec
];

const FORMAT_META: Record<string, {
  label: string;
  size: string;
  placements: { page: string; slot: string; dailySessions: number; viewability: number }[];
  cpmFloor: number;
  cpmCeiling: number;
}> = {
  billboard: {
    label: "Billboard",
    size: "970×250",
    cpmFloor: 4.50,
    cpmCeiling: 12.00,
    placements: [
      { page: "Homepage", slot: "home-hero-billboard", dailySessions: 4200, viewability: 0.82 },
      { page: "Deals", slot: "deals-hero-billboard", dailySessions: 1200, viewability: 0.79 },
      { page: "Order Confirmation", slot: "post-purchase-billboard", dailySessions: 440, viewability: 0.91 },
    ],
  },
  leaderboard: {
    label: "Leaderboard",
    size: "728×90",
    cpmFloor: 3.50,
    cpmCeiling: 10.00,
    placements: [
      { page: "Homepage", slot: "home-mid-leaderboard", dailySessions: 4200, viewability: 0.71 },
      { page: "Category Pages (×8)", slot: "category-top-leaderboard", dailySessions: 8800, viewability: 0.76 },
      { page: "Category Pages (×8)", slot: "category-inline-leaderboard", dailySessions: 8800, viewability: 0.64 },
      { page: "Search", slot: "search-top-leaderboard", dailySessions: 1800, viewability: 0.74 },
      { page: "Deals", slot: "deals-leaderboard", dailySessions: 1200, viewability: 0.70 },
      { page: "Cart", slot: "cart-top-leaderboard", dailySessions: 880, viewability: 0.68 },
      { page: "Account", slot: "account-top-leaderboard", dailySessions: 420, viewability: 0.65 },
      { page: "Brand Pages (×3)", slot: "brand-mid-leaderboard", dailySessions: 360, viewability: 0.73 },
    ],
  },
  mrec: {
    label: "Medium Rectangle",
    size: "300×250",
    cpmFloor: 3.00,
    cpmCeiling: 9.00,
    placements: [
      { page: "Category Pages (×8)", slot: "category-mrec-rail (×2)", dailySessions: 8800, viewability: 0.78 },
      { page: "Product Detail", slot: "product-mrec-sticky", dailySessions: 6500, viewability: 0.84 },
      { page: "Cart", slot: "cart-mrec-sidebar", dailySessions: 880, viewability: 0.75 },
      { page: "Brand Pages (×3)", slot: "brand-mrec-rail", dailySessions: 360, viewability: 0.80 },
      { page: "Promoted Search", slot: "sponsored-search-shelf", dailySessions: 1800, viewability: 0.88 },
    ],
  },
};

// Day-of-week traffic multipliers (Mon=0 … Sun=6)
const DOW_MULTIPLIERS = [0.88, 0.95, 1.02, 1.05, 1.08, 1.18, 1.12];

// Monthly seasonality (Jan=0 … Dec=11) — grocery retail skews weekend, holiday spikes
const MONTHLY_MULTIPLIERS = [0.85, 0.82, 0.90, 0.92, 0.97, 1.02, 1.00, 1.03, 1.05, 1.12, 1.22, 1.30];

type FlightData = {
  Id: number;
  IsActive: boolean;
  IsUnlimited: boolean;
  Impressions: number;
  Price: { Value: number };
  Keywords?: string;
  Name: string;
  StartDateISO?: string;
  EndDateISO?: string;
};

async function fetchFlight(flightId: number): Promise<FlightData | null> {
  if (!KEVEL_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.kevel.co/v1/flight/${flightId}`,
      {
        headers: { "X-Adzerk-ApiKey": KEVEL_API_KEY },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function flightFormat(flight: FlightData): string {
  const kw = (flight.Keywords ?? "").toLowerCase();
  if (kw.includes("ft-billboard")) return "billboard";
  if (kw.includes("ft-leaderboard")) return "leaderboard";
  if (kw.includes("ft-mrec")) return "mrec";
  // Infer from flight name
  const name = flight.Name.toLowerCase();
  if (name.includes("billboard")) return "billboard";
  if (name.includes("leaderboard")) return "leaderboard";
  if (name.includes("mrec") || name.includes("medium")) return "mrec";
  return "unknown";
}

function formatCapacity(formatKey: string): number {
  const meta = FORMAT_META[formatKey];
  if (!meta) return 0;
  const today = new Date();
  const dow = today.getDay();
  const month = today.getMonth();
  const dowMult = DOW_MULTIPLIERS[dow] ?? 1.0;
  const monthMult = MONTHLY_MULTIPLIERS[month] ?? 1.0;
  // Daily available impressions = sum(sessions × viewability) across all placements
  const base = meta.placements.reduce(
    (sum, p) => sum + p.dailySessions * p.viewability,
    0
  );
  return Math.round(base * dowMult * monthMult);
}

function thirtyDayCapacity(formatKey: string): { date: string; available: number; sold: number }[] {
  const meta = FORMAT_META[formatKey];
  if (!meta) return [];
  const base = meta.placements.reduce((sum, p) => sum + p.dailySessions * p.viewability, 0);
  const month = new Date().getMonth();
  const monthMult = MONTHLY_MULTIPLIERS[month] ?? 1.0;

  const result = [];
  const today = new Date();
  for (let d = 0; d < 30; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dow = date.getDay();
    const dowMult = DOW_MULTIPLIERS[dow] ?? 1.0;
    const capacity = Math.round(base * dowMult * monthMult);
    result.push({
      date: date.toISOString().split("T")[0],
      available: capacity,
      sold: 0, // will be populated by flight data
    });
  }
  return result;
}

export async function GET() {
  // Fetch all flights in parallel
  const flightResults = await Promise.allSettled(
    ALL_FLIGHT_IDS.map((id) => fetchFlight(id))
  );
  const flights = flightResults
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((f): f is FlightData => f !== null && f.IsActive);

  // Organize sold inventory by format
  const soldByFormat: Record<string, {
    flightId: number;
    advertiserHint: string;
    cpm: number;
    isUnlimited: boolean;
    bookedImpressions: number;
    keywords: string;
    startDate: string | null;
    endDate: string | null;
  }[]> = { billboard: [], leaderboard: [], mrec: [] };

  for (const flight of flights) {
    const fmt = flightFormat(flight);
    if (soldByFormat[fmt]) {
      soldByFormat[fmt].push({
        flightId: flight.Id,
        advertiserHint: flight.Name,
        cpm: flight.Price?.Value ?? 0,
        isUnlimited: flight.IsUnlimited,
        bookedImpressions: flight.IsUnlimited ? 0 : (flight.Impressions ?? 0),
        keywords: flight.Keywords ?? "",
        startDate: flight.StartDateISO ?? null,
        endDate: flight.EndDateISO ?? null,
      });
    }
  }

  // Compute per-format inventory summary
  const formatSummaries = Object.entries(FORMAT_META).map(([key, meta]) => {
    const dailyCapacity = formatCapacity(key);
    const monthlyCapacity = dailyCapacity * 30;

    const soldFlights = soldByFormat[key] ?? [];
    // Sold impressions: unlimited flights consume ~70% of capacity each; capped flights consume bookedImpressions
    const dailySoldImpressions = soldFlights.reduce((sum, f) => {
      return sum + (f.isUnlimited ? Math.round(dailyCapacity * 0.70) : Math.round(f.bookedImpressions / 30));
    }, 0);
    const dailySold = Math.min(dailySoldImpressions, dailyCapacity);
    const dailyAts = Math.max(0, dailyCapacity - dailySold);
    const fillRate = dailyCapacity > 0 ? (dailySold / dailyCapacity) : 0;

    // CPM recommendation: floor + competitive pressure factor
    const activeCpms = soldFlights.map((f) => f.cpm).filter((c) => c > 0);
    const topCpm = activeCpms.length > 0 ? Math.max(...activeCpms) : meta.cpmFloor;
    const recommendedFloor = Math.max(
      meta.cpmFloor,
      topCpm * 0.80  // new entrants should be within 20% of top CPM
    );

    // Audience composition hint (derived from placement mix)
    const placementPages = meta.placements.map((p) => p.page);

    const curve = thirtyDayCapacity(key);
    // Mark sold on curve (simplified — spread sold across all days)
    for (const day of curve) {
      const dow = new Date(day.date).getDay();
      const dowMult = DOW_MULTIPLIERS[dow] ?? 1.0;
      const month = new Date(day.date).getMonth();
      const monthMult = MONTHLY_MULTIPLIERS[month] ?? 1.0;
      const baseForDay = meta.placements.reduce((sum, p) => sum + p.dailySessions * p.viewability, 0);
      const cap = Math.round(baseForDay * dowMult * monthMult);
      day.available = cap;
      day.sold = Math.min(cap, Math.round(dailySold * dowMult));
    }

    return {
      formatKey: key,
      label: meta.label,
      size: meta.size,
      dailyCapacity,
      monthlyCapacity,
      dailySold,
      dailyAts,
      fillRatePct: Math.round(fillRate * 100),
      placementCount: meta.placements.length,
      placementPages,
      avgViewability: Math.round(
        (meta.placements.reduce((sum, p) => sum + p.viewability, 0) / meta.placements.length) * 100
      ),
      cpmFloor: meta.cpmFloor,
      cpmCeiling: meta.cpmCeiling,
      recommendedFloor: Math.round(recommendedFloor * 100) / 100,
      topActiveCpm: topCpm,
      activeFlights: soldFlights.length,
      soldFlights,
      availabilityCurve: curve,
    };
  });

  // Network totals
  const totalDailyCapacity = formatSummaries.reduce((s, f) => s + f.dailyCapacity, 0);
  const totalDailySold = formatSummaries.reduce((s, f) => s + f.dailySold, 0);
  const totalDailyAts = formatSummaries.reduce((s, f) => s + f.dailyAts, 0);
  const networkFillRate = totalDailyCapacity > 0 ? (totalDailySold / totalDailyCapacity) : 0;

  // CPM upside: if all ATS filled at recommended floor
  const atsRevenueUpside = formatSummaries.reduce((sum, f) => {
    return sum + (f.dailyAts / 1000) * f.recommendedFloor;
  }, 0);
  const currentDailyRevenue = formatSummaries.reduce((sum, f) => {
    return sum + (f.dailySold / 1000) * f.topActiveCpm;
  }, 0);

  return NextResponse.json({
    asOf: new Date().toISOString(),
    network: {
      totalDailyCapacity,
      totalDailySold,
      totalDailyAts,
      networkFillRatePct: Math.round(networkFillRate * 100),
      currentDailyRevEstimate: Math.round(currentDailyRevenue * 100) / 100,
      atsRevenuePotential: Math.round(atsRevenueUpside * 100) / 100,
      activeFlightCount: flights.length,
    },
    formats: formatSummaries,
  });
}

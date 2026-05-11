/**
 * /api/admin/forecast — Campaign Reach Forecaster
 *
 * Estimates impressions, reach, and spend for a proposed campaign before booking.
 * Used by Tyler (Sales) to give advertisers a reach estimate and projection.
 *
 * Input (POST body):
 *   {
 *     formats: string[]           // "billboard" | "leaderboard" | "mrec"
 *     budget: number              // total USD budget
 *     durationDays: number        // flight length in days
 *     cpmFloor: number            // advertiser's floor CPM (optional, defaults to format floor)
 *     keywords: string[]          // contextual targeting keywords (optional)
 *     targetSegment: string       // segment name for CPM multiplier (optional)
 *   }
 *
 * Returns per-format and aggregate forecast:
 *   impressions, reach, eCPM, totalSpend, winRate, competingBids
 */

import { NextRequest, NextResponse } from "next/server";

// Network capacity constants (daily, network 12024 as of May 2026)
const DAILY_CAPACITY: Record<string, number> = {
  billboard: 18500,     // homepage + category page billboard slots
  leaderboard: 42000,   // homepage, search, dept, product page leaderboards
  mrec: 31000,          // sidebar MRec placements across product/dept/search
};

// Current floor CPMs (from rate-card)
const CPM_FLOORS: Record<string, number> = {
  billboard: 4.50,
  leaderboard: 3.75,
  mrec: 3.25,
};

// Current average auction CPMs (clearing price, weighted by fill)
const CPM_AVG: Record<string, number> = {
  billboard: 6.85,
  leaderboard: 5.90,
  mrec: 5.40,
};

// Current fill rate (% of impressions sold in last 30 days)
const FILL_RATE: Record<string, number> = {
  billboard: 0.71,
  leaderboard: 0.63,
  mrec: 0.68,
};

// Competing advertisers per format (auction pressure)
const AUCTION_PARTICIPANTS: Record<string, string[]> = {
  billboard: ["Organic Valley", "Liquid I.V."],
  leaderboard: ["Organic Valley", "Liquid I.V.", "Earthbound Farm"],
  mrec: ["Organic Valley", "Liquid I.V.", "Earthbound Farm"],
};

// Segment CPM premium multipliers (from audience-segments)
const SEGMENT_PREMIUM: Record<string, number> = {
  "organic-enthusiast": 1.35,
  "health-conscious": 1.25,
  "premium-fresh": 1.65,
  "family-staples": 1.10,
  "deal-seeker": 0.85,
  "new-shopper": 0.95,
};

// Contextual keyword → CPM lift map
const KEYWORD_LIFT: Record<string, number> = {
  organic: 0.20,
  produce: 0.15,
  dairy: 0.12,
  "grass-fed": 0.18,
  hydration: 0.22,
  electrolytes: 0.20,
  "protein-shake": 0.18,
  wellness: 0.14,
  seasonal: 0.08,
  keto: 0.16,
  vegan: 0.13,
  "non-gmo": 0.11,
};

interface FormatForecast {
  format: string;
  dailyCapacity: number;
  availableDaily: number;           // ATS (capacity × (1 - fill_rate))
  flightDays: number;
  totalAvailable: number;           // ATS × days
  estimatedImpressions: number;     // budget-constrained impressions at eCPM
  projectedReach: number;           // unique shoppers (dedup ~55% of impressions)
  eCPM: number;                     // effective CPM after context + segment lift
  winRate: number;                  // probability this bid wins vs. current auction
  estimatedSpend: number;           // min(budget/numFormats, capacity×eCPM/1000)
  competingBids: string[];          // other advertisers in auction
  cpmFloor: number;                 // floor for this format
  contextualLift: number;           // additional CPM from keyword targeting (fraction)
  segmentLift: number;              // additional CPM from segment targeting (fraction)
}

interface ForecastResponse {
  formats: FormatForecast[];
  aggregate: {
    totalImpressions: number;
    totalReach: number;             // deduped across formats (~70% of sum)
    totalSpend: number;
    blendedCPM: number;
    budgetUtilization: number;      // spend / budget (0–1)
    durationDays: number;
    budget: number;
  };
  generatedAt: string;
  warnings: string[];
}

export async function POST(req: NextRequest) {
  let body: {
    formats?: string[];
    budget?: number;
    durationDays?: number;
    cpmFloor?: number;
    keywords?: string[];
    targetSegment?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    formats = ["billboard", "leaderboard", "mrec"],
    budget = 5000,
    durationDays = 30,
    cpmFloor,
    keywords = [],
    targetSegment,
  } = body;

  const warnings: string[] = [];

  // Validate formats
  const validFormats = formats.filter(f => ["billboard", "leaderboard", "mrec"].includes(f));
  if (validFormats.length === 0) {
    return NextResponse.json({ error: "No valid formats specified" }, { status: 400 });
  }
  if (budget < 500) {
    warnings.push("Minimum recommended budget is $500 for meaningful reach.");
  }
  if (durationDays < 7) {
    warnings.push("Flights shorter than 7 days have limited reach optimization.");
  }

  // Contextual lift from keywords
  const contextualLift = keywords.reduce((sum, kw) => {
    const lift = KEYWORD_LIFT[kw.toLowerCase()] ?? 0;
    return sum + lift;
  }, 0);

  // Segment lift
  const segKey = targetSegment?.toLowerCase().replace(/\s+/g, "-") ?? "";
  const segmentMultiplier = SEGMENT_PREMIUM[segKey] ?? 1.0;
  const segmentLift = segmentMultiplier - 1.0;

  // Budget split evenly across formats (simple for now)
  const budgetPerFormat = budget / validFormats.length;

  const formatForecasts: FormatForecast[] = validFormats.map(format => {
    const capacity = DAILY_CAPACITY[format];
    const fillRate = FILL_RATE[format];
    const baseCPM = CPM_AVG[format];
    const floor = cpmFloor ?? CPM_FLOORS[format];

    // Available-to-sell (ATS) = unsold inventory
    const availableDaily = Math.round(capacity * (1 - fillRate));
    const totalAvailable = availableDaily * durationDays;

    // Effective CPM with lift
    const rawEcpm = baseCPM * (1 + contextualLift) * segmentMultiplier;
    const eCPM = Math.max(floor, Math.round(rawEcpm * 100) / 100);

    // Win rate: probability of winning vs. current auction participants
    // If our CPM >= avg, we win more; if below, we win fewer
    const baseWinRate = eCPM >= baseCPM ? 0.82 : Math.max(0.15, eCPM / baseCPM * 0.82);
    const winRate = Math.min(0.95, baseWinRate);

    // Budget-constrained impressions
    const maxImpressionsFromBudget = Math.round((budgetPerFormat / eCPM) * 1000);
    const estimatedImpressions = Math.min(maxImpressionsFromBudget, totalAvailable);

    // Reach = unique shoppers (rough dedup: 55% of impressions, capped at network monthly uniques)
    const projectedReach = Math.round(estimatedImpressions * 0.55);

    // Actual spend
    const estimatedSpend = Math.round((estimatedImpressions / 1000) * eCPM * 100) / 100;

    return {
      format,
      dailyCapacity: capacity,
      availableDaily,
      flightDays: durationDays,
      totalAvailable,
      estimatedImpressions,
      projectedReach,
      eCPM,
      winRate,
      estimatedSpend,
      competingBids: AUCTION_PARTICIPANTS[format] ?? [],
      cpmFloor: floor,
      contextualLift,
      segmentLift,
    };
  });

  // Aggregate
  const totalImpressions = formatForecasts.reduce((s, f) => s + f.estimatedImpressions, 0);
  const totalReach = Math.round(
    formatForecasts.reduce((s, f) => s + f.projectedReach, 0) * 0.70
  ); // 70% dedup across formats
  const totalSpend = formatForecasts.reduce((s, f) => s + f.estimatedSpend, 0);
  const blendedCPM =
    totalImpressions > 0
      ? Math.round((totalSpend / totalImpressions) * 1000 * 100) / 100
      : 0;
  const budgetUtilization = budget > 0 ? Math.min(1, totalSpend / budget) : 0;

  if (budgetUtilization < 0.7) {
    warnings.push(
      `Only ${Math.round(budgetUtilization * 100)}% of budget can be deployed against available inventory. Consider extending the flight or adding more formats.`
    );
  }

  const response: ForecastResponse = {
    formats: formatForecasts,
    aggregate: {
      totalImpressions,
      totalReach,
      totalSpend: Math.round(totalSpend * 100) / 100,
      blendedCPM,
      budgetUtilization: Math.round(budgetUtilization * 1000) / 1000,
      durationDays,
      budget,
    },
    generatedAt: new Date().toISOString(),
    warnings,
  };

  return NextResponse.json(response);
}

export async function GET() {
  // Return metadata / default estimate
  return NextResponse.json({
    description: "Campaign Reach Forecaster — POST with budget, formats, durationDays to get an estimate",
    formats: ["billboard", "leaderboard", "mrec"],
    segments: Object.keys(SEGMENT_PREMIUM),
    contextualKeywords: Object.keys(KEYWORD_LIFT),
    networkCapacity: DAILY_CAPACITY,
    cpmFloors: CPM_FLOORS,
    cpmAvg: CPM_AVG,
  });
}

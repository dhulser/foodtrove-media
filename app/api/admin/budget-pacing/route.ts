import { NextResponse } from "next/server";

const KEVEL_API_KEY = process.env.KEVEL_API_KEY || "";

// Seeded PRNG
function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function getWindowRng(windowMs: number, salt: number = 0): () => number {
  const bucket = Math.floor(Date.now() / windowMs) + salt;
  return seededRandom(bucket);
}

// Fetch live CPM from Kevel Management API
async function tryFetchFlightCPM(flightId: number): Promise<number | null> {
  if (!KEVEL_API_KEY) return null;
  try {
    const res = await fetch(`https://api.kevel.co/v1/flight/${flightId}`, {
      headers: { "X-Adzerk-ApiKey": KEVEL_API_KEY },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.Flight || data)?.Price ?? null;
  } catch {
    return null;
  }
}

interface DailySpend {
  day: number; // 0 = first day of flight
  date: string; // ISO date
  impressions: number;
  spend: number;
  cumImpressions: number;
  cumSpend: number;
  projectedCumSpend?: number; // future days only
}

interface FlightBudgetData {
  flightId: number;
  flightName: string;
  advertiserName: string;
  advertiserColor: string;
  format: string;
  cpm: number;
  contractedBudget: number;
  spendToDate: number;
  projectedTotal: number;
  projectedOverUnder: number; // positive = over, negative = under
  daysElapsed: number;
  daysTotal: number;
  daysRemaining: number;
  flightStartDate: string;
  flightEndDate: string;
  status: "on-track" | "at-risk-over" | "at-risk-under" | "ended";
  dailyHistory: DailySpend[];
  dailyBurnRate: number; // avg $ per day to date
  requiredDailyBurnRate: number; // $ per day needed to hit contracted budget
  paceVsRequired: number; // ratio: actual/required — >1 means ahead
}

interface BudgetPacingResponse {
  flights: FlightBudgetData[];
  networkSummary: {
    totalContractedRevenue: number;
    totalSpendToDate: number;
    totalProjectedRevenue: number;
    projectedRevenueGap: number;
    flightsOnTrack: number;
    flightsAtRisk: number;
    avgPaceRatio: number;
  };
  liveCPMEnrichment: { flightId: number; cpm: number } | null;
  generatedAt: string;
}

// Flight definitions
const FLIGHTS = [
  // Organic Valley
  {
    flightId: 863187467,
    flightName: "Organic Valley — Billboard Q2 2026",
    advertiserName: "Organic Valley",
    advertiserColor: "#16a34a",
    format: "Billboard",
    defaultCpm: 5.0,
    contractedBudget: 3000,
    daysElapsed: 28,
    daysTotal: 90, // Q2 = ~90 days
    salt: 10,
  },
  {
    flightId: 863187590,
    flightName: "Organic Valley — Leaderboard Q2 2026",
    advertiserName: "Organic Valley",
    advertiserColor: "#16a34a",
    format: "Leaderboard",
    defaultCpm: 5.0,
    contractedBudget: 2500,
    daysElapsed: 28,
    daysTotal: 90,
    salt: 11,
  },
  {
    flightId: 863188334,
    flightName: "Organic Valley — MRec Q2 2026",
    advertiserName: "Organic Valley",
    advertiserColor: "#16a34a",
    format: "MRec",
    defaultCpm: 5.0,
    contractedBudget: 2000,
    daysElapsed: 28,
    daysTotal: 90,
    salt: 12,
  },
  // Liquid I.V.
  {
    flightId: 863188608,
    flightName: "Liquid I.V. — Billboard Q2 2026",
    advertiserName: "Liquid I.V.",
    advertiserColor: "#0ea5e9",
    format: "Billboard",
    defaultCpm: 7.5,
    contractedBudget: 4000,
    daysElapsed: 21,
    daysTotal: 60,
    salt: 20,
  },
  {
    flightId: 863188610,
    flightName: "Liquid I.V. — Leaderboard Q2 2026",
    advertiserName: "Liquid I.V.",
    advertiserColor: "#0ea5e9",
    format: "Leaderboard",
    defaultCpm: 6.5,
    contractedBudget: 3500,
    daysElapsed: 21,
    daysTotal: 60,
    salt: 21,
  },
  {
    flightId: 863188611,
    flightName: "Liquid I.V. — MRec Q2 2026",
    advertiserName: "Liquid I.V.",
    advertiserColor: "#0ea5e9",
    format: "MRec",
    defaultCpm: 6.0,
    contractedBudget: 3000,
    daysElapsed: 21,
    daysTotal: 60,
    salt: 22,
  },
  // Earthbound Farm
  {
    flightId: 863188756,
    flightName: "Earthbound Farm — Contextual Leaderboard Q2 2026",
    advertiserName: "Earthbound Farm",
    advertiserColor: "#84cc16",
    format: "Leaderboard",
    defaultCpm: 8.0,
    contractedBudget: 6000,
    daysElapsed: 14,
    daysTotal: 45,
    salt: 30,
  },
  {
    flightId: 863188757,
    flightName: "Earthbound Farm — Contextual MRec Q2 2026",
    advertiserName: "Earthbound Farm",
    advertiserColor: "#84cc16",
    format: "MRec",
    defaultCpm: 7.5,
    contractedBudget: 5500,
    daysElapsed: 14,
    daysTotal: 45,
    salt: 31,
  },
];

export async function GET() {
  // Fetch live CPM for Organic Valley billboard to enrich
  const liveCPM = await tryFetchFlightCPM(863187467);

  const today = new Date();
  const flightResults: FlightBudgetData[] = [];

  for (const fl of FLIGHTS) {
    const cpm = fl.flightId === 863187467 && liveCPM ? liveCPM : fl.defaultCpm;
    const dailyHistory: DailySpend[] = [];

    // Build per-day spend history (past days) + projections (future days)
    let cumImpressions = 0;
    let cumSpend = 0;

    const flightStart = new Date(today);
    flightStart.setDate(flightStart.getDate() - fl.daysElapsed);

    // Past days — seeded per-day impressions (realistic variance)
    for (let d = 0; d < fl.daysElapsed; d++) {
      const dayRng = seededRandom(fl.salt * 1000 + d * 31 + 7);
      dayRng(); // consume to avoid seed bias

      // Expected daily impressions ± variance
      const baseImpressions = (fl.contractedBudget / cpm) * 1000 / fl.daysTotal;
      const variance = 0.2; // ±20%
      const dayImpressions = Math.round(baseImpressions * (1 + (dayRng() - 0.5) * 2 * variance));
      const daySpend = (dayImpressions / 1000) * cpm;
      cumImpressions += dayImpressions;
      cumSpend += daySpend;

      const dayDate = new Date(flightStart);
      dayDate.setDate(dayDate.getDate() + d);

      dailyHistory.push({
        day: d,
        date: dayDate.toISOString().split("T")[0],
        impressions: dayImpressions,
        spend: Math.round(daySpend * 100) / 100,
        cumImpressions,
        cumSpend: Math.round(cumSpend * 100) / 100,
      });
    }

    const spendToDate = Math.round(cumSpend * 100) / 100;
    const dailyBurnRate = spendToDate / Math.max(fl.daysElapsed, 1);
    const daysRemaining = fl.daysTotal - fl.daysElapsed;
    const requiredDailyBurnRate = (fl.contractedBudget - spendToDate) / Math.max(daysRemaining, 1);
    const paceVsRequired = requiredDailyBurnRate > 0 ? dailyBurnRate / requiredDailyBurnRate : 1;

    // Future days projection based on current burn rate with slight regression
    const projectionRng = getWindowRng(3600000, fl.salt * 7); // hourly window
    projectionRng();
    const trendFactor = 0.95 + projectionRng() * 0.10; // slight regression to mean

    for (let d = fl.daysElapsed; d < fl.daysTotal; d++) {
      const projDaySpend = dailyBurnRate * trendFactor * (1 + (projectionRng() - 0.5) * 0.05);
      const projDayImpressions = Math.round((projDaySpend / cpm) * 1000);
      cumImpressions += projDayImpressions;
      cumSpend += projDaySpend;

      const dayDate = new Date(flightStart);
      dayDate.setDate(dayDate.getDate() + d);

      dailyHistory.push({
        day: d,
        date: dayDate.toISOString().split("T")[0],
        impressions: projDayImpressions,
        spend: Math.round(projDaySpend * 100) / 100,
        cumImpressions,
        cumSpend: Math.round(cumSpend * 100) / 100,
        projectedCumSpend: Math.round(cumSpend * 100) / 100,
      });
    }

    const projectedTotal = Math.round(cumSpend * 100) / 100;
    const projectedOverUnder = Math.round((projectedTotal - fl.contractedBudget) * 100) / 100;

    // Status
    const paceThreshold = 0.88;
    const overThreshold = 1.15;
    let status: FlightBudgetData["status"] = "on-track";
    if (daysRemaining <= 0) status = "ended";
    else if (paceVsRequired < paceThreshold) status = "at-risk-under";
    else if (paceVsRequired > overThreshold) status = "at-risk-over";

    const flightEnd = new Date(flightStart);
    flightEnd.setDate(flightEnd.getDate() + fl.daysTotal);

    flightResults.push({
      flightId: fl.flightId,
      flightName: fl.flightName,
      advertiserName: fl.advertiserName,
      advertiserColor: fl.advertiserColor,
      format: fl.format,
      cpm,
      contractedBudget: fl.contractedBudget,
      spendToDate,
      projectedTotal,
      projectedOverUnder,
      daysElapsed: fl.daysElapsed,
      daysTotal: fl.daysTotal,
      daysRemaining,
      flightStartDate: flightStart.toISOString().split("T")[0],
      flightEndDate: flightEnd.toISOString().split("T")[0],
      status,
      dailyHistory,
      dailyBurnRate: Math.round(dailyBurnRate * 100) / 100,
      requiredDailyBurnRate: Math.round(requiredDailyBurnRate * 100) / 100,
      paceVsRequired: Math.round(paceVsRequired * 1000) / 1000,
    });
  }

  // Network summary
  const totalContractedRevenue = flightResults.reduce((s, f) => s + f.contractedBudget, 0);
  const totalSpendToDate = flightResults.reduce((s, f) => s + f.spendToDate, 0);
  const totalProjectedRevenue = flightResults.reduce((s, f) => s + f.projectedTotal, 0);
  const projectedRevenueGap = totalProjectedRevenue - totalContractedRevenue;
  const flightsOnTrack = flightResults.filter((f) => f.status === "on-track").length;
  const flightsAtRisk = flightResults.filter((f) => f.status === "at-risk-under" || f.status === "at-risk-over").length;
  const avgPaceRatio = flightResults.reduce((s, f) => s + f.paceVsRequired, 0) / Math.max(flightResults.length, 1);

  const response: BudgetPacingResponse = {
    flights: flightResults,
    networkSummary: {
      totalContractedRevenue,
      totalSpendToDate: Math.round(totalSpendToDate * 100) / 100,
      totalProjectedRevenue: Math.round(totalProjectedRevenue * 100) / 100,
      projectedRevenueGap: Math.round(projectedRevenueGap * 100) / 100,
      flightsOnTrack,
      flightsAtRisk,
      avgPaceRatio: Math.round(avgPaceRatio * 1000) / 1000,
    },
    liveCPMEnrichment: liveCPM !== null ? { flightId: 863187467, cpm: liveCPM } : null,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(response);
}

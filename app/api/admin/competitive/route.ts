/**
 * /api/admin/competitive
 *
 * Competitive intelligence — share of voice, win rate, CPM benchmarking,
 * format competition analysis across all active advertisers on network 12024.
 *
 * Data model:
 * - Kevel live CPM enrichment from Management API
 * - Simulated auction outcomes using seeded PRNG (consistent within 30-min windows)
 * - Win share derived from CPM ratios + format weight × stochastic auction noise
 */

import { NextResponse } from "next/server";

const KEVEL_API_KEY = process.env.KEVEL_API_KEY ?? "";
const MGMT_BASE = "https://api.kevel.co/v1";

// ---------------------------------------------------------------------------
// Kevel Management API helper
// ---------------------------------------------------------------------------

async function kevelGet(path: string): Promise<Record<string, unknown>> {
  if (!KEVEL_API_KEY) return {};
  try {
    const res = await fetch(`${MGMT_BASE}/${path}`, {
      headers: { "X-Adzerk-ApiKey": KEVEL_API_KEY },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Seeded PRNG — stable within time window
// ---------------------------------------------------------------------------

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0) ^ (s >>> 4);
    s = (Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0) ^ (s >>> 8);
    return (s >>> 0) / 4294967296;
  };
}

// 30-minute seeded window
function getWindowRng(windowMs: number, salt: number) {
  const bucket = Math.floor(Date.now() / windowMs);
  return seededRandom(bucket * 9999 + salt);
}

// ---------------------------------------------------------------------------
// Advertiser config — matches kevel-api skill entity table
// ---------------------------------------------------------------------------

interface AdvertiserConfig {
  id: number;
  name: string;
  slug: string;
  color: string;
  accentBg: string;
  accentText: string;
  formats: {
    billboard?: { flightId: number; cpm: number };
    leaderboard?: { flightId: number; cpm: number };
    mrec?: { flightId: number; cpm: number };
  };
  contextualKeywords: string[];
  category: string;
}

const ADVERTISERS: AdvertiserConfig[] = [
  {
    id: 6254651,
    name: "Organic Valley",
    slug: "organic-valley",
    color: "#10b981",
    accentBg: "bg-emerald-50",
    accentText: "text-emerald-700",
    formats: {
      billboard: { flightId: 863187467, cpm: 5.0 },
      leaderboard: { flightId: 863187590, cpm: 5.0 },
      mrec: { flightId: 863188334, cpm: 5.0 },
    },
    contextualKeywords: ["organic", "produce", "fresh", "dairy"],
    category: "Dairy & Organics",
  },
  {
    id: 6256255,
    name: "Liquid I.V.",
    slug: "liquid-iv",
    color: "#3b82f6",
    accentBg: "bg-blue-50",
    accentText: "text-blue-700",
    formats: {
      billboard: { flightId: 863188608, cpm: 7.5 },
      leaderboard: { flightId: 863188610, cpm: 6.5 },
      mrec: { flightId: 863188611, cpm: 6.0 },
    },
    contextualKeywords: ["health", "wellness", "hydration", "nutrition"],
    category: "Health & Wellness",
  },
  {
    id: 6256266,
    name: "Earthbound Farm",
    slug: "earthbound-farm",
    color: "#f59e0b",
    accentBg: "bg-amber-50",
    accentText: "text-amber-700",
    formats: {
      leaderboard: { flightId: 863188756, cpm: 8.0 },
      mrec: { flightId: 863188757, cpm: 7.5 },
    },
    contextualKeywords: ["produce", "organic", "fresh", "salads"],
    category: "Fresh Produce",
  },
];

// ---------------------------------------------------------------------------
// Format definitions
// ---------------------------------------------------------------------------

const FORMATS = ["billboard", "leaderboard", "mrec"] as const;
type Format = (typeof FORMATS)[number];

const FORMAT_LABELS: Record<Format, string> = {
  billboard: "Billboard 970×250",
  leaderboard: "Leaderboard 728×90",
  mrec: "MRec 300×250",
};

// ---------------------------------------------------------------------------
// Live CPM enrichment from Kevel
// ---------------------------------------------------------------------------

async function enrichCpms(): Promise<Record<string, Record<Format, number | null>>> {
  const enriched: Record<string, Record<Format, number | null>> = {};

  for (const adv of ADVERTISERS) {
    enriched[adv.slug] = {
      billboard: null,
      leaderboard: null,
      mrec: null,
    };

    for (const [format, spec] of Object.entries(adv.formats)) {
      if (!spec) continue;
      const data = await kevelGet(`flight/${spec.flightId}`);
      const liveCpm = typeof data.Price === "number" ? data.Price : null;
      enriched[adv.slug][format as Format] = liveCpm ?? spec.cpm;
    }
  }

  return enriched;
}

// ---------------------------------------------------------------------------
// Auction simulation — per format, per 30-min window
// ---------------------------------------------------------------------------

interface AuctionResult {
  format: Format;
  formatLabel: string;
  totalAuctions: number;
  participants: Array<{
    advertiser: string;
    slug: string;
    wins: number;
    winRate: number;
    avgWinCpm: number;
    avgClearingCpm: number;
    cpmPremium: number; // vs network floor
    color: string;
  }>;
  networkFloor: number;
  networkAvgCpm: number;
  topContexts: string[];
  competitionIndex: number; // 0–100: how contested this format is
}

function simulateAuctions(
  format: Format,
  liveCpms: Record<string, Record<Format, number | null>>
): AuctionResult {
  const rng = getWindowRng(30 * 60 * 1000, format.length * 31 + 7);
  rng(); rng(); // consume to avoid seed bias

  const participants = ADVERTISERS.filter((a) => a.formats[format]);

  if (participants.length === 0) {
    return {
      format,
      formatLabel: FORMAT_LABELS[format],
      totalAuctions: 0,
      participants: [],
      networkFloor: 1.0,
      networkAvgCpm: 0,
      topContexts: [],
      competitionIndex: 0,
    };
  }

  const TOTAL_AUCTIONS = 8400 + Math.floor(rng() * 2000); // ~8.4k–10.4k daily auctions per format

  // Compute effective CPMs (live or configured)
  const effectiveCpms = participants.map((adv) => ({
    adv,
    cpm: liveCpms[adv.slug]?.[format] ?? adv.formats[format]!.cpm,
  }));

  const maxCpm = Math.max(...effectiveCpms.map((e) => e.cpm));
  const networkFloor = 1.0;

  // Win probability weighted by CPM^1.2 (higher CPM = disproportionately more wins)
  const weights = effectiveCpms.map((e) => Math.pow(e.cpm / maxCpm, 1.2));
  const totalWeight = weights.reduce((s, w) => s + w, 0);

  const results = effectiveCpms.map((e, i) => {
    const winShare = weights[i] / totalWeight;
    const wins = Math.round(TOTAL_AUCTIONS * winShare * (0.9 + rng() * 0.2)); // ±10% noise
    const avgWinCpm = e.cpm * (1.02 + rng() * 0.08); // small uplift from auction dynamics
    const avgClearingCpm = e.cpm * (0.85 + rng() * 0.12); // clearing price slightly below bid
    return {
      advertiser: e.adv.name,
      slug: e.adv.slug,
      wins,
      winRate: 0, // computed below after total wins known
      avgWinCpm,
      avgClearingCpm,
      cpmPremium: ((e.cpm - networkFloor) / networkFloor) * 100,
      color: e.adv.color,
    };
  });

  const totalWins = results.reduce((s, r) => s + r.wins, 0);
  results.forEach((r) => {
    r.winRate = totalWins > 0 ? r.wins / totalWins : 0;
  });

  // Network avg CPM (clearing price weighted by wins)
  const networkAvgCpm =
    results.reduce((s, r) => s + r.avgClearingCpm * r.wins, 0) /
    Math.max(totalWins, 1);

  // Competition index: 100 = perfectly contested (equal win shares), 0 = monopoly
  const entropy = results.reduce((s, r) => {
    if (r.winRate <= 0) return s;
    return s - r.winRate * Math.log2(r.winRate);
  }, 0);
  const maxEntropy = Math.log2(results.length);
  const competitionIndex = maxEntropy > 0 ? Math.round((entropy / maxEntropy) * 100) : 0;

  // Top contexts from winning advertisers
  const topWinner = results.sort((a, b) => b.wins - a.wins)[0];
  const topAdv = ADVERTISERS.find((a) => a.slug === topWinner?.slug);
  const topContexts = topAdv?.contextualKeywords.slice(0, 3) ?? [];

  return {
    format,
    formatLabel: FORMAT_LABELS[format],
    totalAuctions: TOTAL_AUCTIONS,
    participants: results,
    networkFloor,
    networkAvgCpm,
    topContexts,
    competitionIndex,
  };
}

// ---------------------------------------------------------------------------
// Share of voice — cross-format summary
// ---------------------------------------------------------------------------

interface ShareOfVoice {
  advertiser: string;
  slug: string;
  color: string;
  category: string;
  contextualKeywords: string[];
  totalWins: number;
  totalAuctions: number;
  overallWinRate: number;
  overallShareOfVoice: number; // % of total impressions served
  avgCpm: number;
  cpmRank: number;
  formatBreakdown: Array<{
    format: Format;
    formatLabel: string;
    wins: number;
    winRate: number;
    cpm: number;
    active: boolean;
  }>;
  competitiveStrengths: string[]; // where this advertiser dominates
  vulnerabilities: string[]; // formats/contexts where they're weak or absent
}

// ---------------------------------------------------------------------------
// Contextual competition — which contexts are most contested
// ---------------------------------------------------------------------------

interface ContextualSlot {
  keyword: string;
  label: string;
  competitors: Array<{ advertiser: string; color: string; winRate: number }>;
  avgCpm: number;
  cpmLiftVsRos: number;
  contestLevel: "low" | "medium" | "high";
}

function buildContextualMap(
  liveCpms: Record<string, Record<Format, number | null>>
): ContextualSlot[] {
  const CONTEXTS = [
    { keyword: "produce", label: "Produce / Fresh" },
    { keyword: "organic", label: "Organic" },
    { keyword: "dairy", label: "Dairy" },
    { keyword: "health", label: "Health & Wellness" },
    { keyword: "snacks", label: "Snacks & Beverages" },
    { keyword: "frozen", label: "Frozen" },
    { keyword: "bakery", label: "Bakery" },
    { keyword: "meat", label: "Meat & Seafood" },
    { keyword: "household", label: "Household" },
    { keyword: "baby", label: "Baby & Kids" },
    { keyword: "nutrition", label: "Nutrition" },
    { keyword: "fresh", label: "Fresh & Seasonal" },
  ];

  const ROS_CPM = 3.5; // run-of-site base CPM

  return CONTEXTS.map((ctx, i) => {
    const rng = getWindowRng(30 * 60 * 1000, ctx.keyword.length * 37 + i * 13);
    rng();

    // Which advertisers target this context?
    const targeting = ADVERTISERS.filter((a) =>
      a.contextualKeywords.includes(ctx.keyword)
    );

    const nonTargeting = ADVERTISERS.filter(
      (a) => !a.contextualKeywords.includes(ctx.keyword)
    );

    // CPM for this context — weighted avg of targeting advertisers' MRec CPMs
    const avgCpm =
      targeting.length > 0
        ? targeting.reduce((s, a) => {
            const cpm =
              liveCpms[a.slug]?.mrec ?? a.formats.mrec?.cpm ?? a.formats.leaderboard?.cpm ?? 5.0;
            return s + cpm;
          }, 0) / targeting.length
        : ROS_CPM * (1 + rng() * 0.3);

    // Competitors map
    const competitors = targeting.map((a) => {
      const hasBillboard = !!a.formats.billboard;
      const hasLeaderboard = !!a.formats.leaderboard;
      const winRate =
        targeting.length === 1
          ? 0.85 + rng() * 0.1
          : 0.3 + rng() * 0.4;
      return {
        advertiser: a.name,
        color: a.color,
        winRate,
      };
    });

    // Add ROS placeholder if no advertisers target this context
    if (competitors.length === 0) {
      competitors.push({
        advertiser: "Run of Site",
        color: "#9ca3af",
        winRate: 1.0,
      });
    }

    const contestLevel: "low" | "medium" | "high" =
      targeting.length === 0
        ? "low"
        : targeting.length === 1
        ? "medium"
        : "high";

    return {
      keyword: ctx.keyword,
      label: ctx.label,
      competitors,
      avgCpm,
      cpmLiftVsRos: ((avgCpm - ROS_CPM) / ROS_CPM) * 100,
      contestLevel,
    };
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function GET() {
  // 1. Enrich CPMs from Kevel
  const liveCpms = await enrichCpms();

  // 2. Simulate auctions per format
  const formatAuctions = FORMATS.map((f) => simulateAuctions(f, liveCpms));

  // 3. Build share-of-voice summary
  const sovMap: Record<string, {
    totalWins: number;
    totalAuctions: number;
    cpmTotal: number;
    cpmCount: number;
    formatBreakdown: Record<Format, { wins: number; winRate: number; cpm: number; active: boolean }>;
  }> = {};

  for (const adv of ADVERTISERS) {
    sovMap[adv.slug] = {
      totalWins: 0,
      totalAuctions: 0,
      cpmTotal: 0,
      cpmCount: 0,
      formatBreakdown: {
        billboard: { wins: 0, winRate: 0, cpm: 0, active: false },
        leaderboard: { wins: 0, winRate: 0, cpm: 0, active: false },
        mrec: { wins: 0, winRate: 0, cpm: 0, active: false },
      },
    };
  }

  for (const auction of formatAuctions) {
    for (const participant of auction.participants) {
      const entry = sovMap[participant.slug];
      if (!entry) continue;
      entry.totalWins += participant.wins;
      entry.totalAuctions += auction.totalAuctions;
      entry.cpmTotal += participant.avgWinCpm;
      entry.cpmCount += 1;
      entry.formatBreakdown[auction.format] = {
        wins: participant.wins,
        winRate: participant.winRate,
        cpm: liveCpms[participant.slug]?.[auction.format] ?? 0,
        active: true,
      };
    }
  }

  const grandTotalWins = Object.values(sovMap).reduce((s, e) => s + e.totalWins, 0);

  const shareOfVoice: ShareOfVoice[] = ADVERTISERS.map((adv, i) => {
    const entry = sovMap[adv.slug];
    const avgCpm = entry.cpmCount > 0 ? entry.cpmTotal / entry.cpmCount : 0;

    // Strengths: formats where win rate is top in network
    const strengths: string[] = [];
    const vulnerabilities: string[] = [];

    for (const fmt of FORMATS) {
      const fb = entry.formatBreakdown[fmt];
      if (!fb.active) {
        vulnerabilities.push(`Not active in ${FORMAT_LABELS[fmt]}`);
        continue;
      }
      // Check if this advertiser wins most in this format
      const competing = formatAuctions
        .find((a) => a.format === fmt)
        ?.participants.filter((p) => p.slug !== adv.slug) ?? [];
      const isTopWinner = competing.every((c) => c.winRate <= fb.winRate);
      if (isTopWinner) {
        strengths.push(`Dominates ${FORMAT_LABELS[fmt]}`);
      }
    }

    // Contextual strengths
    if (adv.contextualKeywords.length > 2) {
      strengths.push(`Strong contextual coverage (${adv.contextualKeywords.slice(0, 2).join(", ")})`);
    }

    // CPM rank (higher CPM = more competitive)
    const cpmRank =
      ADVERTISERS.filter((a) => {
        const aCpm = a.formats.mrec?.cpm ?? a.formats.leaderboard?.cpm ?? 0;
        const thisCpm = adv.formats.mrec?.cpm ?? adv.formats.leaderboard?.cpm ?? 0;
        return aCpm > thisCpm;
      }).length + 1;

    return {
      advertiser: adv.name,
      slug: adv.slug,
      color: adv.color,
      category: adv.category,
      contextualKeywords: adv.contextualKeywords,
      totalWins: entry.totalWins,
      totalAuctions: entry.totalAuctions,
      overallWinRate: entry.totalAuctions > 0 ? entry.totalWins / entry.totalAuctions : 0,
      overallShareOfVoice: grandTotalWins > 0 ? entry.totalWins / grandTotalWins : 0,
      avgCpm,
      cpmRank,
      formatBreakdown: FORMATS.map((fmt) => ({
        format: fmt,
        formatLabel: FORMAT_LABELS[fmt],
        ...entry.formatBreakdown[fmt],
      })),
      competitiveStrengths: strengths,
      vulnerabilities,
    };
  }).sort((a, b) => b.overallShareOfVoice - a.overallShareOfVoice);

  // 4. Contextual map
  const contextualMap = buildContextualMap(liveCpms);

  // 5. CPM benchmarks — min/max/avg across advertisers per format
  const cpmBenchmarks = FORMATS.map((fmt) => {
    const cpms = ADVERTISERS.filter((a) => a.formats[fmt]).map(
      (a) => liveCpms[a.slug]?.[fmt] ?? a.formats[fmt]!.cpm
    );
    if (cpms.length === 0) return null;
    const avg = cpms.reduce((s, c) => s + c, 0) / cpms.length;
    return {
      format: fmt,
      formatLabel: FORMAT_LABELS[fmt],
      minCpm: Math.min(...cpms),
      maxCpm: Math.max(...cpms),
      avgCpm: avg,
      cpmSpread: ((Math.max(...cpms) - Math.min(...cpms)) / avg) * 100,
      floor: 1.0,
    };
  }).filter(Boolean);

  // 6. Network-level summary
  const networkSummary = {
    totalAdvertisers: ADVERTISERS.length,
    totalActiveFlights: ADVERTISERS.flatMap((a) => Object.values(a.formats)).length,
    totalDailyAuctions: formatAuctions.reduce((s, a) => s + a.totalAuctions, 0),
    avgNetworkCpm:
      formatAuctions.reduce((s, a) => s + a.networkAvgCpm, 0) / FORMATS.length,
    avgCompetitionIndex:
      Math.round(formatAuctions.reduce((s, a) => s + a.competitionIndex, 0) / FORMATS.length),
    mostContestedFormat: formatAuctions.reduce((best, a) =>
      a.competitionIndex > best.competitionIndex ? a : best
    ).formatLabel,
    leastContestedContext: contextualMap
      .filter((c) => c.contestLevel === "low")
      .slice(0, 3)
      .map((c) => c.label),
  };

  return NextResponse.json({
    networkSummary,
    shareOfVoice,
    formatAuctions,
    contextualMap,
    cpmBenchmarks,
    generatedAt: new Date().toISOString(),
  });
}

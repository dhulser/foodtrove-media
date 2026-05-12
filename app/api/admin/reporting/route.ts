/**
 * /api/admin/reporting — Contextual Performance Report API
 *
 * Shows keyword-level revenue attribution and contextual lift vs. run-of-site.
 * Core retail media value prop: contextual placement earns premium CPMs.
 *
 * Data model:
 *   - 12 contextual keywords tracked across the storefront
 *   - Per keyword: impressions served, revenue, CTR, contextual CPM vs. ROS CPM
 *   - Per advertiser: context coverage, win rate by keyword, revenue attribution
 *   - Format breakdown: how each keyword performs across billboard/leaderboard/MRec
 *
 * Deterministic seeded model — daily cadence, stable within day, changes each day.
 */

import { NextResponse } from "next/server";

const KEVEL_API_KEY = process.env.KEVEL_API_KEY || "";

// Contextual keyword taxonomy — matches keyword routing in ad-decision proxy
const CONTEXTUAL_KEYWORDS = [
  { keyword: "produce", label: "Fresh Produce", department: "Produce", baselineMultiplier: 1.65 },
  { keyword: "organic", label: "Organic", department: "Cross-dept", baselineMultiplier: 1.72 },
  { keyword: "dairy", label: "Dairy", department: "Dairy & Eggs", baselineMultiplier: 1.38 },
  { keyword: "bakery", label: "Bakery", department: "Bakery", baselineMultiplier: 1.22 },
  { keyword: "meat", label: "Meat & Seafood", department: "Meat & Seafood", baselineMultiplier: 1.45 },
  { keyword: "deli", label: "Deli", department: "Deli", baselineMultiplier: 1.18 },
  { keyword: "frozen", label: "Frozen Foods", department: "Frozen", baselineMultiplier: 1.15 },
  { keyword: "beverages", label: "Beverages", department: "Beverages", baselineMultiplier: 1.28 },
  { keyword: "health", label: "Health & Wellness", department: "Cross-dept", baselineMultiplier: 1.55 },
  { keyword: "snacks", label: "Snacks", department: "Snacks", baselineMultiplier: 1.32 },
  { keyword: "nutrition", label: "Nutrition", department: "Cross-dept", baselineMultiplier: 1.48 },
  { keyword: "fresh", label: "Fresh Items", department: "Cross-dept", baselineMultiplier: 1.60 },
] as const;

// Advertiser keyword affinity — which advertisers target which contexts
const ADVERTISER_CONTEXT = [
  {
    advertiserName: "Organic Valley",
    advertiserId: 6254651,
    targetedKeywords: ["produce", "organic", "dairy", "fresh"],
    runOfSiteCPM: 5.0,
    contextualCPM: 8.0,
    color: "emerald",
  },
  {
    advertiserName: "Liquid I.V.",
    advertiserId: 6256255,
    targetedKeywords: ["health", "nutrition", "beverages", "snacks"],
    runOfSiteCPM: 6.5,
    contextualCPM: 11.2,
    color: "blue",
  },
  {
    advertiserName: "Earthbound Farm",
    advertiserId: 6256266,
    targetedKeywords: ["produce", "organic", "fresh", "health"],
    runOfSiteCPM: 7.0,
    contextualCPM: 12.5,
    color: "green",
  },
] as const;

// ROS (run-of-site) CPM baseline for comparison
const ROS_CPM_BASELINE = 4.20;

// Seeded PRNG — stable within a day, changes each day
function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function getDailyRng(salt: number = 0): () => number {
  const daySeed = Math.floor(Date.now() / 86400000) * 1031 + salt;
  return seededRandom(daySeed);
}

// Fetch live Kevel flight data for CPM enrichment
async function fetchKevelFlights(): Promise<Record<number, number>> {
  if (!KEVEL_API_KEY) return {};
  const flightIds = [863187467, 863187590, 863188334, 863188608, 863188610, 863188611, 863188756, 863188757];
  const liveCPMs: Record<number, number> = {};

  try {
    await Promise.all(
      flightIds.map(async (id) => {
        const res = await fetch(`https://api.kevel.co/v1/flight/${id}`, {
          headers: { "X-Adzerk-ApiKey": KEVEL_API_KEY },
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.Price) liveCPMs[id] = data.Price;
        }
      })
    );
  } catch {
    // Fall back to hardcoded values
  }
  return liveCPMs;
}

export async function GET() {
  const liveCPMs = await fetchKevelFlights();

  const todayDaySeed = Math.floor(Date.now() / 86400000);

  // Build per-keyword performance data
  const keywordRows = CONTEXTUAL_KEYWORDS.map((kw, kwIdx) => {
    const rng = getDailyRng(kwIdx * 137 + 1);
    rng(); rng(); // warm up

    const mult = kw.baselineMultiplier;

    // Base impressions for this keyword (monthly scale)
    const baseImpressions = Math.round(18000 + rng() * 22000);
    const impressions = Math.round(baseImpressions * mult);

    // CTR: contextual pages have higher engagement
    const baseCTR = 0.008 + rng() * 0.006;
    const ctr = baseCTR * (mult * 0.7 + 0.3); // partial lift on CTR
    const clicks = Math.round(impressions * ctr);

    // Which advertisers target this keyword
    const targetingAdvertisers = ADVERTISER_CONTEXT.filter((a) =>
      (a.targetedKeywords as readonly string[]).includes(kw.keyword)
    );

    // Contextual CPM: weighted average of targeting advertisers' contextual CPMs
    const contextualCPM =
      targetingAdvertisers.length > 0
        ? targetingAdvertisers.reduce((s, a) => s + a.contextualCPM, 0) / targetingAdvertisers.length
        : ROS_CPM_BASELINE * mult;

    // Blended CPM: mix of contextual (targeting advertisers) and ROS impressions
    const contextualFraction = targetingAdvertisers.length > 0 ? 0.55 + rng() * 0.25 : 0;
    const blendedCPM =
      contextualFraction * contextualCPM + (1 - contextualFraction) * ROS_CPM_BASELINE;

    const revenue = Math.round((impressions / 1000) * blendedCPM * 100) / 100;
    const liftPct = Math.round(((blendedCPM / ROS_CPM_BASELINE) - 1) * 1000) / 10;

    // Format breakdown
    const billboardFrac = kw.department === "Cross-dept" ? 0.25 : 0.18;
    const leaderboardFrac = 0.42 + rng() * 0.08;
    const mrecFrac = 1 - billboardFrac - leaderboardFrac;

    // Conversion rate (post-click add-to-cart)
    const convRate = 0.022 + rng() * 0.018 + (mult - 1) * 0.012;
    const conversions = Math.round(clicks * convRate);

    // 30-day trend: daily impression sparkline (7 data points = last 7 days)
    const trend = Array.from({ length: 7 }, (_, d) => {
      const dayRng = seededRandom((todayDaySeed - 6 + d) * 3003 + kwIdx * 41);
      dayRng();
      return Math.round(impressions / 30 * (0.8 + dayRng() * 0.4));
    });

    return {
      keyword: kw.keyword,
      label: kw.label,
      department: kw.department,
      impressions,
      clicks,
      conversions,
      revenue,
      ctr: Math.round(ctr * 10000) / 100, // as %
      conversionRate: Math.round(convRate * 10000) / 100,
      contextualCPM: Math.round(contextualCPM * 100) / 100,
      blendedCPM: Math.round(blendedCPM * 100) / 100,
      rosCPM: ROS_CPM_BASELINE,
      liftPct, // vs. ROS baseline
      contextualFraction: Math.round(contextualFraction * 100),
      targetingAdvertiserCount: targetingAdvertisers.length,
      targetingAdvertisers: targetingAdvertisers.map((a) => a.advertiserName),
      formatBreakdown: {
        billboard: Math.round(impressions * billboardFrac),
        leaderboard: Math.round(impressions * leaderboardFrac),
        mrec: Math.round(impressions * mrecFrac),
      },
      trend7d: trend,
    };
  });

  // Sort by revenue desc by default
  keywordRows.sort((a, b) => b.revenue - a.revenue);

  // Build per-advertiser context coverage summary
  const advertiserSummary = ADVERTISER_CONTEXT.map((adv, advIdx) => {
    const rng = getDailyRng(advIdx * 251 + 500);
    rng(); rng();

    const matchedKeywords = keywordRows.filter((kw) =>
      (adv.targetedKeywords as readonly string[]).includes(kw.keyword)
    );

    const contextImpressions = matchedKeywords.reduce((s, kw) => s + kw.impressions, 0);
    const contextRevenue = matchedKeywords.reduce((s, kw) => s + kw.revenue, 0);

    // Win rate on contextual auctions
    const contextualWinRate = 0.62 + rng() * 0.22;

    // Live CPM from Kevel if available
    const flightIdMap: Record<number, number> = {
      6254651: 863187467, // Organic Valley billboard
      6256255: 863188608, // Liquid I.V. billboard
      6256266: 863188756, // Earthbound Farm leaderboard
    };
    const flightId = flightIdMap[adv.advertiserId];
    const liveCPM = flightId && liveCPMs[flightId] ? liveCPMs[flightId] : adv.contextualCPM;

    return {
      advertiserName: adv.advertiserName,
      advertiserId: adv.advertiserId,
      targetedKeywords: [...adv.targetedKeywords],
      keywordCount: adv.targetedKeywords.length,
      contextImpressions,
      contextRevenue: Math.round(contextRevenue * 100) / 100,
      contextualCPM: Math.round(liveCPM * 100) / 100,
      runOfSiteCPM: adv.runOfSiteCPM,
      cpmPremium: Math.round(((liveCPM / adv.runOfSiteCPM) - 1) * 1000) / 10,
      contextualWinRate: Math.round(contextualWinRate * 1000) / 10,
      color: adv.color,
    };
  });

  // Network-level summary
  const totalImpressions = keywordRows.reduce((s, kw) => s + kw.impressions, 0);
  const totalRevenue = Math.round(keywordRows.reduce((s, kw) => s + kw.revenue, 0) * 100) / 100;
  const totalClicks = keywordRows.reduce((s, kw) => s + kw.clicks, 0);
  const totalConversions = keywordRows.reduce((s, kw) => s + kw.conversions, 0);
  const avgBlendedCPM = Math.round((totalRevenue / (totalImpressions / 1000)) * 100) / 100;
  const avgLift = Math.round(keywordRows.reduce((s, kw) => s + kw.liftPct, 0) / keywordRows.length * 10) / 10;
  const contextualImpressionShare = Math.round(
    keywordRows.reduce((s, kw) => s + kw.impressions * kw.contextualFraction / 100, 0) / totalImpressions * 100
  );

  // Top keyword by revenue lift for the header callout
  const topLiftKeyword = [...keywordRows].sort((a, b) => b.liftPct - a.liftPct)[0];

  return NextResponse.json({
    summary: {
      totalImpressions,
      totalRevenue,
      totalClicks,
      totalConversions,
      avgBlendedCPM,
      rosCPMBaseline: ROS_CPM_BASELINE,
      avgContextualLiftPct: avgLift,
      contextualImpressionShare,
      keywordCount: CONTEXTUAL_KEYWORDS.length,
      activeAdvertisers: ADVERTISER_CONTEXT.length,
      topLiftKeyword: topLiftKeyword
        ? { keyword: topLiftKeyword.label, liftPct: topLiftKeyword.liftPct }
        : null,
    },
    keywords: keywordRows,
    advertisers: advertiserSummary,
    generatedAt: new Date().toISOString(),
    period: "MTD",
  });
}

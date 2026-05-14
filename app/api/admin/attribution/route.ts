/**
 * /api/admin/attribution — Multi-Touch Attribution API
 *
 * Models the full shopper journey from first ad exposure to purchase.
 * Supports four attribution models side-by-side:
 *   - First-touch (100% credit to first exposure)
 *   - Last-touch (100% credit to last exposure before purchase)
 *   - Linear (equal credit across all touchpoints)
 *   - Time-decay (more credit to touchpoints closer to purchase)
 *
 * Also provides:
 *   - Journey path analysis (most common multi-step sequences)
 *   - View-through vs click-through attribution split
 *   - Cross-device path reconstruction (single-device demo, noted)
 *   - Latency distribution (time from first impression to purchase)
 *   - Model comparison table for all three advertisers
 *
 * All data seeded for demo stability (hourly bucket). Real implementation
 * would ingest from ad log + conversion pixel pipeline.
 */

import { NextResponse } from "next/server";

// ── Seeded PRNG ──────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };
}

function getWindowRng(windowMs: number, salt: number): () => number {
  const bucket = Math.floor(Date.now() / windowMs);
  return seededRandom((bucket * 9999 + salt) >>> 0);
}

// Hourly-stable RNG
function getRng(salt: number): () => number {
  return getWindowRng(3600000, salt);
}

// ── Attribution model constants ───────────────────────────────────────────────

const ADVERTISERS = [
  {
    id: "organic-valley",
    name: "Organic Valley",
    color: "#15803d",
    colorClass: "emerald",
    cpm: { billboard: 5.0, leaderboard: 5.0, mrec: 5.0 },
    contextual: false,
    category: "produce",
  },
  {
    id: "liquid-iv",
    name: "Liquid I.V.",
    color: "#0369a1",
    colorClass: "blue",
    cpm: { billboard: 7.5, leaderboard: 6.5, mrec: 6.0 },
    contextual: false,
    category: "beverages",
  },
  {
    id: "earthbound-farm",
    name: "Earthbound Farm",
    color: "#7c3aed",
    colorClass: "violet",
    cpm: { billboard: 8.5, leaderboard: 8.0, mrec: 7.5 },
    contextual: true,
    category: "produce",
  },
];

// Common journey step types
type StepType =
  | "billboard_view"
  | "leaderboard_view"
  | "mrec_view"
  | "search_sponsored"
  | "dept_page"
  | "pdp_view"
  | "cart_add"
  | "checkout"
  | "purchase";

interface JourneyStep {
  type: StepType;
  label: string;
  adFormat?: string;
  touchpoint: boolean; // is this an ad touchpoint?
}

// Pre-defined common journey patterns
const JOURNEY_TEMPLATES: Array<{ steps: StepType[]; weight: number }> = [
  // Direct: billboard → browse → purchase
  { steps: ["billboard_view", "dept_page", "pdp_view", "cart_add", "purchase"], weight: 18 },
  // Leaderboard + MRec → purchase
  { steps: ["leaderboard_view", "dept_page", "mrec_view", "pdp_view", "cart_add", "checkout", "purchase"], weight: 15 },
  // Search intent → sponsored → purchase
  { steps: ["billboard_view", "search_sponsored", "pdp_view", "cart_add", "purchase"], weight: 14 },
  // Multi-session: billboard → return → leaderboard → purchase
  { steps: ["billboard_view", "leaderboard_view", "dept_page", "mrec_view", "pdp_view", "purchase"], weight: 12 },
  // MRec right-rail upsell
  { steps: ["dept_page", "mrec_view", "pdp_view", "cart_add", "checkout", "purchase"], weight: 11 },
  // View-through: no click, just impression → organic return
  { steps: ["billboard_view", "leaderboard_view", "search_sponsored", "purchase"], weight: 9 },
  // Short path: leaderboard click → PDP → buy
  { steps: ["leaderboard_view", "pdp_view", "cart_add", "purchase"], weight: 8 },
  // Long nurture: 4+ impressions
  { steps: ["billboard_view", "leaderboard_view", "dept_page", "billboard_view", "search_sponsored", "pdp_view", "checkout", "purchase"], weight: 7 },
  // Billboard only (view-through)
  { steps: ["billboard_view", "purchase"], weight: 6 },
];

const STEP_META: Record<StepType, { label: string; touchpoint: boolean; adFormat?: string }> = {
  billboard_view: { label: "Billboard Impression", touchpoint: true, adFormat: "billboard" },
  leaderboard_view: { label: "Leaderboard Impression", touchpoint: true, adFormat: "leaderboard" },
  mrec_view: { label: "MRec Impression", touchpoint: true, adFormat: "mrec" },
  search_sponsored: { label: "Sponsored Search Click", touchpoint: true, adFormat: "search" },
  dept_page: { label: "Category Browse", touchpoint: false },
  pdp_view: { label: "Product Detail View", touchpoint: false },
  cart_add: { label: "Add to Cart", touchpoint: false },
  checkout: { label: "Checkout", touchpoint: false },
  purchase: { label: "Purchase", touchpoint: false },
};

// ── Attribution model calculations ──────────────────────────────────────────

function computeAttribution(
  touchpoints: string[],
  totalRevenue: number
): {
  firstTouch: Record<string, number>;
  lastTouch: Record<string, number>;
  linear: Record<string, number>;
  timeDecay: Record<string, number>;
} {
  const n = touchpoints.length;
  if (n === 0) return { firstTouch: {}, lastTouch: {}, linear: {}, timeDecay: {} };

  const formats = ["billboard", "leaderboard", "mrec", "search"];
  const init = () => Object.fromEntries(formats.map((f) => [f, 0]));

  const firstTouch = init();
  const lastTouch = init();
  const linear = init();
  const timeDecay = init();

  // First-touch: 100% to first ad touchpoint
  if (formats.includes(touchpoints[0])) {
    firstTouch[touchpoints[0]] = totalRevenue;
  }

  // Last-touch: 100% to last ad touchpoint
  const lastAd = [...touchpoints].reverse().find((t) => formats.includes(t));
  if (lastAd) lastTouch[lastAd] = totalRevenue;

  // Linear: equal split
  const share = totalRevenue / n;
  touchpoints.forEach((t) => {
    if (formats.includes(t)) linear[t] += share;
  });

  // Time-decay: weights 2^(position/total) normalized
  const rawWeights = touchpoints.map((_, i) => Math.pow(2, i / n));
  const totalWeight = rawWeights.reduce((s, w) => s + w, 0);
  touchpoints.forEach((t, i) => {
    if (formats.includes(t)) {
      timeDecay[t] += (rawWeights[i] / totalWeight) * totalRevenue;
    }
  });

  return { firstTouch, lastTouch, linear, timeDecay };
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const rng = getRng(8847);
  rng(); rng(); // burn seed bias

  // ── Summary metrics ──
  const totalConversions = 1840 + Math.round(rng() * 420);
  const totalRevenue = 74000 + Math.round(rng() * 18000);
  const avgOrderValue = totalRevenue / totalConversions;
  const avgTouchpoints = 2.4 + rng() * 1.8;
  const clickThroughPct = 0.31 + rng() * 0.18; // % of conversions with a click touchpoint
  const viewThroughPct = 1 - clickThroughPct;

  // ── Attribution model comparison per advertiser ──
  const advertiserModels = ADVERTISERS.map((adv) => {
    const advRng = getRng(adv.id.length * 47 + adv.id.charCodeAt(0) * 13);
    advRng(); advRng();

    const conversions = Math.round(200 + advRng() * 300);
    const revenue = conversions * (avgOrderValue * (0.85 + advRng() * 0.30));

    // Simulate typical touchpoint sequence for this advertiser
    const tpMix = adv.contextual
      ? ["leaderboard", "mrec", "leaderboard"]
      : ["billboard", "leaderboard", "billboard", "mrec"];

    const attr = computeAttribution(tpMix, revenue);

    // ROAS: Revenue / Ad Spend. Spend = impressions * CPM/1000
    const impressions = conversions * (120 + Math.round(advRng() * 180));
    const avgCpm = (adv.cpm.billboard + adv.cpm.leaderboard + adv.cpm.mrec) / 3;
    const adSpend = (impressions / 1000) * avgCpm;
    const roas = revenue / adSpend;

    // Attribution model % differences
    const firstTouchRevenue = Object.values(attr.firstTouch).reduce((s, v) => s + v, 0);
    const lastTouchRevenue = Object.values(attr.lastTouch).reduce((s, v) => s + v, 0);

    return {
      advertiser: adv.name,
      advertiserId: adv.id,
      color: adv.color,
      colorClass: adv.colorClass,
      contextual: adv.contextual,
      conversions,
      revenue: Math.round(revenue),
      adSpend: Math.round(adSpend),
      roas: Math.round(roas * 10) / 10,
      avgTouchpointsPerConversion: Math.round((2.1 + advRng() * 1.6) * 10) / 10,
      models: {
        firstTouch: {
          attributedRevenue: Math.round(firstTouchRevenue),
          pct: firstTouchRevenue > 0 ? Math.round((firstTouchRevenue / revenue) * 100) : 0,
          roas: Math.round((firstTouchRevenue / adSpend) * 10) / 10,
        },
        lastTouch: {
          attributedRevenue: Math.round(lastTouchRevenue),
          pct: lastTouchRevenue > 0 ? Math.round((lastTouchRevenue / revenue) * 100) : 0,
          roas: Math.round((lastTouchRevenue / adSpend) * 10) / 10,
        },
        linear: {
          attributedRevenue: Math.round(revenue * (0.65 + advRng() * 0.15)),
          pct: Math.round((0.65 + advRng() * 0.15) * 100),
          roas: Math.round(roas * (0.65 + advRng() * 0.15) * 10) / 10,
        },
        timeDecay: {
          attributedRevenue: Math.round(revenue * (0.72 + advRng() * 0.12)),
          pct: Math.round((0.72 + advRng() * 0.12) * 100),
          roas: Math.round(roas * (0.72 + advRng() * 0.12) * 10) / 10,
        },
      },
      topConvertingFormats: [
        { format: "billboard", conversions: Math.round(conversions * (0.35 + advRng() * 0.15)) },
        { format: "leaderboard", conversions: Math.round(conversions * (0.28 + advRng() * 0.12)) },
        { format: "mrec", conversions: Math.round(conversions * (0.22 + advRng() * 0.10)) },
        { format: "search", conversions: Math.round(conversions * (0.12 + advRng() * 0.06)) },
      ].sort((a, b) => b.conversions - a.conversions),
    };
  });

  // ── Journey path analysis ──
  const totalWeight = JOURNEY_TEMPLATES.reduce((s, t) => s + t.weight, 0);
  const journeyPaths = JOURNEY_TEMPLATES.map((template, idx) => {
    const pathRng = getRng(template.steps.length * 31 + idx * 7 + 3);
    pathRng();

    const pathConversions = Math.round((template.weight / totalWeight) * totalConversions * (0.85 + pathRng() * 0.30));
    const pathRevenue = pathConversions * avgOrderValue;
    const touchpointCount = template.steps.filter((s) => STEP_META[s].touchpoint).length;
    const hasClick = template.steps.includes("search_sponsored");

    return {
      id: `path-${idx}`,
      steps: template.steps.map((s) => ({
        type: s,
        ...STEP_META[s],
      })),
      conversions: pathConversions,
      revenue: Math.round(pathRevenue),
      avgOrderValue: Math.round(avgOrderValue * (0.9 + pathRng() * 0.2)),
      touchpointCount,
      hasClick,
      conversionRate: Math.round((0.8 + pathRng() * 2.4) * 100) / 100, // % of shoppers who took this path and converted
      avgTimeToPurchaseDays: Math.round((0.5 + pathRng() * 4.5) * 10) / 10,
    };
  }).sort((a, b) => b.conversions - a.conversions);

  // ── Latency distribution (time from first impression to purchase) ──
  const latencyRng = getRng(5531);
  latencyRng();
  const latencyBuckets = [
    { label: "Same session", hours: 0, days: 0, pct: Math.round(8 + latencyRng() * 8) },
    { label: "< 1 day", hours: 1, days: 0, pct: Math.round(15 + latencyRng() * 12) },
    { label: "1–3 days", hours: 24, days: 1, pct: Math.round(22 + latencyRng() * 10) },
    { label: "4–7 days", hours: 96, days: 4, pct: Math.round(18 + latencyRng() * 10) },
    { label: "8–14 days", hours: 192, days: 8, pct: Math.round(14 + latencyRng() * 8) },
    { label: "15–30 days", hours: 360, days: 15, pct: Math.round(12 + latencyRng() * 8) },
    { label: "> 30 days", hours: 720, days: 30, pct: 0 },
  ];
  // Normalize to 100
  const latencyTotal = latencyBuckets.slice(0, 6).reduce((s, b) => s + b.pct, 0);
  latencyBuckets[6].pct = Math.max(0, 100 - latencyTotal);

  // ── Attribution window analysis ──
  const windowRng = getRng(7723);
  windowRng();
  const attributionWindows = [
    {
      window: "Click-through 30d",
      conversions: Math.round(totalConversions * 0.31),
      revenue: Math.round(totalRevenue * 0.38),
      type: "click",
      active: true,
    },
    {
      window: "Click-through 7d",
      conversions: Math.round(totalConversions * 0.22),
      revenue: Math.round(totalRevenue * 0.27),
      type: "click",
      active: false,
    },
    {
      window: "View-through 1d",
      conversions: Math.round(totalConversions * 0.28),
      revenue: Math.round(totalRevenue * 0.31),
      type: "view",
      active: true,
    },
    {
      window: "View-through 7d",
      conversions: Math.round(totalConversions * 0.19),
      revenue: Math.round(totalRevenue * 0.22),
      type: "view",
      active: false,
    },
  ];

  // ── Format-level attribution breakdown ──
  const formatRng = getRng(2211);
  formatRng();
  const formatAttribution = [
    {
      format: "Billboard 970×250",
      formatId: "billboard",
      firstTouchPct: Math.round(38 + formatRng() * 12),
      lastTouchPct: Math.round(18 + formatRng() * 10),
      linearPct: Math.round(28 + formatRng() * 10),
      conversions: Math.round(totalConversions * (0.30 + formatRng() * 0.08)),
      avgTouchPosition: 1.4,
      icon: "📢",
    },
    {
      format: "Leaderboard 728×90",
      formatId: "leaderboard",
      firstTouchPct: Math.round(22 + formatRng() * 12),
      lastTouchPct: Math.round(28 + formatRng() * 12),
      linearPct: Math.round(26 + formatRng() * 10),
      conversions: Math.round(totalConversions * (0.26 + formatRng() * 0.07)),
      avgTouchPosition: 2.1,
      icon: "📊",
    },
    {
      format: "MRec 300×250",
      formatId: "mrec",
      firstTouchPct: Math.round(18 + formatRng() * 12),
      lastTouchPct: Math.round(32 + formatRng() * 14),
      linearPct: Math.round(24 + formatRng() * 10),
      conversions: Math.round(totalConversions * (0.22 + formatRng() * 0.07)),
      avgTouchPosition: 2.8,
      icon: "🎯",
    },
    {
      format: "Sponsored Search",
      formatId: "search",
      firstTouchPct: Math.round(14 + formatRng() * 8),
      lastTouchPct: Math.round(38 + formatRng() * 16),
      linearPct: Math.round(22 + formatRng() * 8),
      conversions: Math.round(totalConversions * (0.18 + formatRng() * 0.06)),
      avgTouchPosition: 3.2,
      icon: "🔍",
    },
  ];

  // ── Cross-sell attribution (post-purchase) ──
  const crossSellRng = getRng(9913);
  crossSellRng();
  const crossSellAttribution = {
    totalCrossSellConversions: Math.round(totalConversions * (0.06 + crossSellRng() * 0.04)),
    crossSellRevenue: Math.round(totalRevenue * (0.04 + crossSellRng() * 0.03)),
    avgCrossSellAOV: Math.round(28 + crossSellRng() * 24),
    windowDays: 7,
    topPairs: [
      { trigger: "Organic Valley purchase", crossSell: "Earthbound Farm Produce", conversions: Math.round(18 + crossSellRng() * 14) },
      { trigger: "Liquid I.V. purchase", crossSell: "Liquid I.V. Bundle", conversions: Math.round(12 + crossSellRng() * 10) },
      { trigger: "Earthbound Farm purchase", crossSell: "Organic Valley Dairy", conversions: Math.round(9 + crossSellRng() * 8) },
    ],
  };

  return NextResponse.json({
    meta: {
      period: "Last 30 days",
      model: "Multi-touch attribution — FoodTrove Network 12024",
      attributionPolicy: {
        clickThrough: "30 days",
        viewThrough: "1 day",
        crossSell: "7 days",
        deduplication: "last-touch within window",
      },
    },
    summary: {
      totalConversions,
      totalRevenue,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      avgTouchpointsPerConversion: Math.round(avgTouchpoints * 10) / 10,
      clickThroughPct: Math.round(clickThroughPct * 100),
      viewThroughPct: Math.round(viewThroughPct * 100),
      crossSellAttribution,
    },
    advertiserModels,
    journeyPaths: journeyPaths.slice(0, 8), // top 8 paths by conversion volume
    latencyBuckets,
    attributionWindows,
    formatAttribution,
  });
}

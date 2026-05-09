/**
 * /api/admin/measurement — Measurement & Attribution API
 *
 * Provides the measurement and attribution story for the FoodTrove RMN:
 * - Impression delivery by advertiser and placement
 * - Attribution model: view-through (1-day) and click-through (30-day)
 * - 3P discrepancy rate tracking (vs. DoubleVerify-style verification)
 * - Post-purchase cross-sell attribution
 * - Revenue attribution waterfall by touchpoint type
 *
 * Data model:
 *   - Impression counts are derived from the same delivery simulation as analytics
 *   - Attribution events are modeled on industry-standard rates
 *     (CTR: 0.05–0.15%, view-through conversion: 0.3–0.8%, post-purchase cross-sell: 4–8%)
 *   - Discrepancy: simulated at 1.5–3.5% (below 5% threshold = compliant)
 *   - All numbers are demo-credible; real implementation would ingest from ad log pipeline
 *
 * Auth: none for demo (production: session auth required)
 */

import { NextResponse } from "next/server";

const KEVEL_API_KEY = process.env.KEVEL_API_KEY;

// ── Advertiser config ────────────────────────────────────────────────────────

interface AdvertiserConfig {
  id: number;
  name: string;
  slug: string;
  color: string;
  flights: FlightConfig[];
}

interface FlightConfig {
  id: number;
  format: "billboard" | "leaderboard" | "mrec";
  formatLabel: string;
  keyword: string;
  cpm: number;
  contextual: boolean;
  contextualLabel?: string;
}

const ADVERTISERS: AdvertiserConfig[] = [
  {
    id: 6254651,
    name: "FreshFarm Organics",
    slug: "freshfarm-organics",
    color: "#15803d",
    flights: [
      { id: 863187467, format: "billboard", formatLabel: "Billboard 970×250", keyword: "ft-billboard", cpm: 5.0, contextual: false },
      { id: 863187590, format: "leaderboard", formatLabel: "Leaderboard 728×90", keyword: "ft-leaderboard", cpm: 5.0, contextual: false },
      { id: 863188334, format: "mrec", formatLabel: "MRec 300×250", keyword: "ft-mrec", cpm: 5.0, contextual: false },
    ],
  },
  {
    id: 6256255,
    name: "NutriPeak Nutrition",
    slug: "nutripeak-nutrition",
    color: "#0369a1",
    flights: [
      { id: 863188608, format: "billboard", formatLabel: "Billboard 970×250", keyword: "ft-billboard", cpm: 7.5, contextual: false },
      { id: 863188610, format: "leaderboard", formatLabel: "Leaderboard 728×90", keyword: "ft-leaderboard", cpm: 6.5, contextual: false },
      { id: 863188611, format: "mrec", formatLabel: "MRec 300×250", keyword: "ft-mrec", cpm: 6.0, contextual: false },
    ],
  },
  {
    id: 6256266,
    name: "GreenLeaf Farms",
    slug: "greenleaf-farms",
    color: "#7c3aed",
    flights: [
      { id: 863188756, format: "leaderboard", formatLabel: "Leaderboard 728×90 (Produce)", keyword: "ft-leaderboard", cpm: 8.0, contextual: true, contextualLabel: "Produce pages" },
      { id: 863188757, format: "mrec", formatLabel: "MRec 300×250 (Produce)", keyword: "ft-mrec", cpm: 7.5, contextual: true, contextualLabel: "Produce pages" },
    ],
  },
];

// ── Monthly impression volumes (from analytics model) ────────────────────────

const FORMAT_MONTHLY_IMPRESSIONS: Record<string, number> = {
  billboard: 120_000,
  leaderboard: 280_000,
  mrec: 420_000,
};

// GreenLeaf wins produce-targeted leaderboard/mrec — only gets ~35% of those slots
const GREENLEAF_CONTEXTUAL_SHARE = 0.35;

// ── Delivery simulation ──────────────────────────────────────────────────────

function dailyDeliveryFraction(dayOfMonth: number): number {
  const weekly = [0.85, 1.0, 1.05, 1.08, 1.1, 0.92, 0.82];
  const base = weekly[dayOfMonth % 7] ?? 1.0;
  const seed = (dayOfMonth * 2654435761) % 1000;
  const noise = 0.97 + (seed / 1000) * 0.06;
  return base * noise;
}

function mtdImpressions(monthlyCapacity: number, dayOfMonth: number): number {
  let total = 0;
  const daily = monthlyCapacity / 30;
  for (let d = 1; d <= dayOfMonth; d++) {
    total += daily * dailyDeliveryFraction(d);
  }
  return Math.round(total);
}

// Per-flight impression allocation: auction winner gets all impressions for that slot
// Billboard: NutriPeak wins (7.50 > 5.00), Leaderboard non-contextual: NutriPeak (6.50 > 5.00)
// Leaderboard contextual (produce): GreenLeaf (8.00)
// MRec non-contextual: NutriPeak (6.00 > 5.00), MRec contextual: GreenLeaf (7.50)
function flightImpressions(
  advertiserSlug: string,
  format: "billboard" | "leaderboard" | "mrec",
  contextual: boolean,
  dayOfMonth: number
): number {
  const monthly = FORMAT_MONTHLY_IMPRESSIONS[format] ?? 0;

  if (format === "billboard") {
    // Only NutriPeak wins billboard; FreshFarm gets 0 (loses auction)
    if (advertiserSlug === "nutripeak-nutrition") return mtdImpressions(monthly, dayOfMonth);
    return 0;
  }

  if (format === "leaderboard") {
    const contextualPool = Math.round(monthly * GREENLEAF_CONTEXTUAL_SHARE);
    const runOfSitePool = monthly - contextualPool;
    if (advertiserSlug === "greenleaf-farms") return mtdImpressions(contextualPool, dayOfMonth);
    if (advertiserSlug === "nutripeak-nutrition") return mtdImpressions(runOfSitePool, dayOfMonth);
    return 0; // FreshFarm loses
  }

  if (format === "mrec") {
    const contextualPool = Math.round(monthly * GREENLEAF_CONTEXTUAL_SHARE);
    const runOfSitePool = monthly - contextualPool;
    if (advertiserSlug === "greenleaf-farms") return mtdImpressions(contextualPool, dayOfMonth);
    if (advertiserSlug === "nutripeak-nutrition") return mtdImpressions(runOfSitePool, dayOfMonth);
    return 0; // FreshFarm loses
  }

  return 0;
}

// ── Attribution model ────────────────────────────────────────────────────────

// Industry-standard rates (demo-calibrated for credibility)
const ATTR_RATES: Record<string, {
  ctr: number;                    // click-through rate
  clickConvRate: number;          // % of clicks → conversion (purchase)
  viewThroughConvRate: number;    // % of impressions → view-through conversion
  crossSellRate: number;          // post-purchase cross-sell click rate (only on order confirmation)
  avgOrderValue: number;          // average basket value for attribution credit
}> = {
  "freshfarm-organics":  { ctr: 0.0012, clickConvRate: 0.042, viewThroughConvRate: 0.0032, crossSellRate: 0.062, avgOrderValue: 34.50 },
  "nutripeak-nutrition": { ctr: 0.0010, clickConvRate: 0.038, viewThroughConvRate: 0.0028, crossSellRate: 0.055, avgOrderValue: 28.00 },
  "greenleaf-farms":     { ctr: 0.0018, clickConvRate: 0.055, viewThroughConvRate: 0.0045, crossSellRate: 0.071, avgOrderValue: 41.20 }, // contextual = higher engagement
};

// ── 3P discrepancy model ─────────────────────────────────────────────────────

// FoodTrove's measurement integrity target: discrepancy vs 3P verification < 5%
// Simulated discrepancy per format (1P vs DoubleVerify-equivalent)
const DISCREPANCY_PCT: Record<string, number> = {
  billboard:   2.1,
  leaderboard: 1.8,
  mrec:        3.2,
};

// ── Attribution window config ─────────────────────────────────────────────────

const ATTRIBUTION_WINDOWS = {
  viewThrough: { days: 1,  label: "1-day view-through" },
  clickThrough: { days: 30, label: "30-day click-through" },
  postPurchase: { days: 7,  label: "7-day post-purchase cross-sell" },
};

// ── Kevel Management API helper ───────────────────────────────────────────────

async function kevelGet(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.kevel.co/v1/${path}`, {
    headers: { "X-Adzerk-ApiKey": KEVEL_API_KEY ?? "", "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return {};
  return res.json();
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET() {
  const now = new Date();
  const dayOfMonth = now.getUTCDate();
  const daysInMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getDate();
  const monthProgress = dayOfMonth / daysInMonth;

  // Try to pull live flight state from Kevel (validates active status)
  let kevelFlightState: Record<number, { isActive: boolean; price: number }> = {};
  if (KEVEL_API_KEY) {
    try {
      const campaignIds = [659158534, 659159072, 659159177]; // FreshFarm, NutriPeak, GreenLeaf
      const flightFetches = await Promise.allSettled(
        campaignIds.map(id => kevelGet(`campaign/${id}/flight`))
      );
      for (const res of flightFetches) {
        if (res.status === "fulfilled") {
          const items = (res.value as { items?: unknown[] }).items ?? [];
          for (const f of items) {
            const flight = f as { Id: number; IsActive: boolean; Price: number };
            kevelFlightState[flight.Id] = { isActive: flight.IsActive, price: flight.Price };
          }
        }
      }
    } catch {
      // Fall through — use static config
    }
  }

  // Build per-advertiser measurement records
  const advertiserMeasurement = ADVERTISERS.map(adv => {
    const rates = ATTR_RATES[adv.slug] ?? ATTR_RATES["freshfarm-organics"];

    let totalImpressions = 0;
    let totalSpend = 0;
    let totalClicks = 0;
    let totalClickConversions = 0;
    let totalViewThroughConversions = 0;
    let totalCrossSellConversions = 0;

    const flightBreakdown = adv.flights.map(flight => {
      const isActive = kevelFlightState[flight.id]?.isActive ?? true;
      const impressions = isActive ? flightImpressions(adv.slug, flight.format, flight.contextual, dayOfMonth) : 0;
      const spend = (impressions / 1000) * flight.cpm;
      const clicks = Math.round(impressions * rates.ctr);
      const clickConversions = Math.round(clicks * rates.clickConvRate);
      const viewConversions = Math.round(impressions * rates.viewThroughConvRate);
      // Cross-sell only meaningful for post-purchase placements; model as ~12% of order confirmations
      const crossSell = Math.round(impressions * 0.12 * rates.crossSellRate);

      totalImpressions += impressions;
      totalSpend += spend;
      totalClicks += clicks;
      totalClickConversions += clickConversions;
      totalViewThroughConversions += viewConversions;
      totalCrossSellConversions += crossSell;

      return {
        flightId: flight.id,
        formatLabel: flight.formatLabel,
        keyword: flight.keyword,
        cpm: flight.cpm,
        contextual: flight.contextual,
        contextualLabel: flight.contextualLabel ?? null,
        isActive,
        impressions,
        spend: Math.round(spend * 100) / 100,
        clicks,
        ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
        clickConversions,
        viewConversions,
      };
    });

    const totalAttributedRevenue = Math.round(
      (totalClickConversions + totalViewThroughConversions * 0.6 + totalCrossSellConversions * 0.4)
      * rates.avgOrderValue * 100
    ) / 100;

    const roas = totalSpend > 0
      ? Math.round((totalAttributedRevenue / totalSpend) * 100) / 100
      : 0;

    return {
      advertiserId: adv.id,
      advertiserName: adv.name,
      slug: adv.slug,
      color: adv.color,
      summary: {
        impressions: totalImpressions,
        spend: Math.round(totalSpend * 100) / 100,
        clicks: totalClicks,
        ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
        clickConversions: totalClickConversions,
        viewThroughConversions: totalViewThroughConversions,
        crossSellConversions: totalCrossSellConversions,
        totalConversions: totalClickConversions + totalViewThroughConversions + totalCrossSellConversions,
        attributedRevenue: totalAttributedRevenue,
        roas,
        monthProgress: Math.round(monthProgress * 1000) / 10,
      },
      flights: flightBreakdown,
    };
  });

  // Aggregate network totals
  const networkImpressions = advertiserMeasurement.reduce((s, a) => s + a.summary.impressions, 0);
  const networkSpend = advertiserMeasurement.reduce((s, a) => s + a.summary.spend, 0);
  const networkClicks = advertiserMeasurement.reduce((s, a) => s + a.summary.clicks, 0);
  const networkConversions = advertiserMeasurement.reduce((s, a) => s + a.summary.totalConversions, 0);
  const networkAttributedRevenue = advertiserMeasurement.reduce((s, a) => s + a.summary.attributedRevenue, 0);

  // Revenue attribution waterfall (by touchpoint type across all advertisers)
  const clickThroughRevenue = advertiserMeasurement.reduce((s, a) =>
    s + a.summary.clickConversions * (ATTR_RATES[a.slug]?.avgOrderValue ?? 30), 0);
  const viewThroughRevenue = advertiserMeasurement.reduce((s, a) =>
    s + a.summary.viewThroughConversions * 0.6 * (ATTR_RATES[a.slug]?.avgOrderValue ?? 30), 0);
  const crossSellRevenue = advertiserMeasurement.reduce((s, a) =>
    s + a.summary.crossSellConversions * 0.4 * (ATTR_RATES[a.slug]?.avgOrderValue ?? 30), 0);

  // 3P discrepancy by format
  const discrepancyByFormat = Object.entries(DISCREPANCY_PCT).map(([format, pct]) => {
    const monthly = FORMAT_MONTHLY_IMPRESSIONS[format] ?? 0;
    const firstParty = mtdImpressions(monthly, dayOfMonth);
    const thirdParty = Math.round(firstParty * (1 - pct / 100));
    return {
      format,
      formatLabel: format === "billboard" ? "Billboard 970×250" : format === "leaderboard" ? "Leaderboard 728×90" : "MRec 300×250",
      firstPartyImpressions: firstParty,
      thirdPartyImpressions: thirdParty,
      discrepancyPct: pct,
      status: pct < 5.0 ? "compliant" : "breach",
      threshold: 5.0,
    };
  });

  const avgDiscrepancy = discrepancyByFormat.reduce((s, f) => s + f.discrepancyPct, 0) / discrepancyByFormat.length;

  // Attribution window summary
  const attributionConfig = {
    windows: ATTRIBUTION_WINDOWS,
    activeConversionPixels: 3, // one per advertiser
    impressionPixelCoverage: 100, // % of placements with pixel fired
    lastVerified: now.toISOString(),
  };

  return NextResponse.json({
    meta: {
      networkId: 12024,
      generatedAt: now.toISOString(),
      dayOfMonth,
      daysInMonth,
      monthProgress: Math.round(monthProgress * 1000) / 10,
      kevelConnected: !!KEVEL_API_KEY,
    },
    network: {
      impressions: networkImpressions,
      spend: Math.round(networkSpend * 100) / 100,
      clicks: networkClicks,
      ctr: networkImpressions > 0 ? Math.round((networkClicks / networkImpressions) * 10000) / 100 : 0,
      conversions: networkConversions,
      attributedRevenue: Math.round(networkAttributedRevenue * 100) / 100,
      avgDiscrepancyPct: Math.round(avgDiscrepancy * 10) / 10,
      discrepancyStatus: avgDiscrepancy < 5.0 ? "compliant" : "breach",
      discrepancyTarget: 5.0,
    },
    advertisers: advertiserMeasurement,
    discrepancy: discrepancyByFormat,
    attribution: attributionConfig,
    revenueWaterfall: {
      clickThrough: { revenue: Math.round(clickThroughRevenue * 100) / 100, label: "Click-through (30-day)", share: 0 },
      viewThrough: { revenue: Math.round(viewThroughRevenue * 100) / 100, label: "View-through (1-day)", share: 0 },
      crossSell: { revenue: Math.round(crossSellRevenue * 100) / 100, label: "Post-purchase cross-sell", share: 0 },
      total: Math.round((clickThroughRevenue + viewThroughRevenue + crossSellRevenue) * 100) / 100,
    },
  });
}

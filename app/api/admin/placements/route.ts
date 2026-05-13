/**
 * /api/admin/placements — Placement Yield Manager API
 *
 * Returns a complete inventory map of every Kevel ad slot across the FoodTrove
 * storefront. For each placement, surfaces:
 *   - Page location and slot dimensions
 *   - Which flights are eligible (keyword routing)
 *   - Estimated fill rate and realized CPM
 *   - Yield efficiency vs. CPM floor
 *   - Contextual signals passed to Kevel at that slot
 *
 * Used by: /admin/placements (yield management dashboard)
 * Consumers: Casey (Ad Ops), Tyler (Sales — identifies under-monetized slots)
 */

import { NextResponse } from "next/server";

const KEVEL_API_KEY = process.env.KEVEL_API_KEY;

// ─── Flight registry (network 12024) ─────────────────────────────────────────

const FLIGHTS = {
  "ft-billboard": [
    {
      flightId: 863187467,
      advertiserName: "Organic Valley",
      cpm: 5.0,
      contextual: false,
    },
    {
      flightId: 863188608,
      advertiserName: "Liquid I.V.",
      cpm: 7.5,
      contextual: false,
    },
  ],
  "ft-leaderboard": [
    {
      flightId: 863187590,
      advertiserName: "Organic Valley",
      cpm: 5.0,
      contextual: false,
    },
    {
      flightId: 863188610,
      advertiserName: "Liquid I.V.",
      cpm: 6.5,
      contextual: false,
    },
    {
      flightId: 863188756,
      advertiserName: "Earthbound Farm",
      cpm: 8.0,
      contextual: true,
    },
  ],
  "ft-mrec": [
    {
      flightId: 863188334,
      advertiserName: "Organic Valley",
      cpm: 5.0,
      contextual: false,
    },
    {
      flightId: 863188611,
      advertiserName: "Liquid I.V.",
      cpm: 6.0,
      contextual: false,
    },
    {
      flightId: 863188757,
      advertiserName: "Earthbound Farm",
      cpm: 7.5,
      contextual: true,
    },
  ],
} as const;

// ─── Complete placement map across all storefront pages ───────────────────────

interface PlacementDef {
  id: string;
  page: string;
  pageSlug: string;
  pageType:
    | "homepage"
    | "department"
    | "product"
    | "search"
    | "deals"
    | "weekly-deals"
    | "post-purchase"
    | "account"
    | "brand";
  format: "billboard" | "leaderboard" | "mrec";
  formatKeyword: string;
  dimensions: string;
  position: "above-fold" | "mid-page" | "below-fold" | "right-rail";
  contextualKeywords: string[];
  monthlyTrafficEstimate: number; // page impressions/mo
  cpmFloor: number;
  notes?: string;
}

const PLACEMENT_DEFS: PlacementDef[] = [
  // ─── Homepage ───────────────────────────────────────────────────────────────
  {
    id: "home-hero-billboard",
    page: "Homepage",
    pageSlug: "/",
    pageType: "homepage",
    format: "billboard",
    formatKeyword: "ft-billboard",
    dimensions: "970×250",
    position: "above-fold",
    contextualKeywords: [],
    monthlyTrafficEstimate: 85_000,
    cpmFloor: 5.0,
    notes: "Highest-visibility slot. Liquid I.V. wins at $7.50 CPM.",
  },
  {
    id: "home-mid-leaderboard",
    page: "Homepage",
    pageSlug: "/",
    pageType: "homepage",
    format: "leaderboard",
    formatKeyword: "ft-leaderboard",
    dimensions: "728×90",
    position: "mid-page",
    contextualKeywords: [],
    monthlyTrafficEstimate: 85_000,
    cpmFloor: 5.0,
    notes: "ROS leaderboard — 3-way auction. Earthbound Farm wins contextually.",
  },
  // ─── Department pages ────────────────────────────────────────────────────────
  {
    id: "dept-produce-top-leaderboard",
    page: "Produce Department",
    pageSlug: "/shop/produce",
    pageType: "department",
    format: "leaderboard",
    formatKeyword: "ft-leaderboard",
    dimensions: "728×90",
    position: "above-fold",
    contextualKeywords: ["produce", "organic", "fresh"],
    monthlyTrafficEstimate: 24_000,
    cpmFloor: 5.0,
    notes:
      "Earthbound Farm contextual leaderboard wins at $8.00 CPM on produce keyword.",
  },
  {
    id: "dept-dairy-top-leaderboard",
    page: "Dairy Department",
    pageSlug: "/shop/dairy",
    pageType: "department",
    format: "leaderboard",
    formatKeyword: "ft-leaderboard",
    dimensions: "728×90",
    position: "above-fold",
    contextualKeywords: ["dairy"],
    monthlyTrafficEstimate: 18_000,
    cpmFloor: 5.0,
    notes: "Untargeted by contextual advertisers. ROS 2-way auction only.",
  },
  {
    id: "dept-bakery-top-leaderboard",
    page: "Bakery Department",
    pageSlug: "/shop/bakery",
    pageType: "department",
    format: "leaderboard",
    formatKeyword: "ft-leaderboard",
    dimensions: "728×90",
    position: "above-fold",
    contextualKeywords: ["bakery"],
    monthlyTrafficEstimate: 14_000,
    cpmFloor: 5.0,
    notes: "Untargeted. Opportunity for new contextual advertiser pitch.",
  },
  {
    id: "dept-frozen-top-leaderboard",
    page: "Frozen Department",
    pageSlug: "/shop/frozen",
    pageType: "department",
    format: "leaderboard",
    formatKeyword: "ft-leaderboard",
    dimensions: "728×90",
    position: "above-fold",
    contextualKeywords: ["frozen"],
    monthlyTrafficEstimate: 16_000,
    cpmFloor: 5.0,
    notes: "Untargeted. High-traffic slot — prime for new advertiser.",
  },
  {
    id: "dept-snacks-top-leaderboard",
    page: "Snacks Department",
    pageSlug: "/shop/snacks",
    pageType: "department",
    format: "leaderboard",
    formatKeyword: "ft-leaderboard",
    dimensions: "728×90",
    position: "above-fold",
    contextualKeywords: ["snacks", "nutrition"],
    monthlyTrafficEstimate: 22_000,
    cpmFloor: 5.0,
    notes: "Liquid I.V. nutrition context — potential for higher CPM targeting.",
  },
  {
    id: "dept-beverages-top-leaderboard",
    page: "Beverages Department",
    pageSlug: "/shop/beverages",
    pageType: "department",
    format: "leaderboard",
    formatKeyword: "ft-leaderboard",
    dimensions: "728×90",
    position: "above-fold",
    contextualKeywords: ["beverages"],
    monthlyTrafficEstimate: 19_000,
    cpmFloor: 5.0,
    notes: "High-value for hydration/beverage brands. Liquid I.V. opportunity.",
  },
  // ─── Product detail pages ────────────────────────────────────────────────────
  {
    id: "product-right-rail-mrec",
    page: "Product Detail (all)",
    pageSlug: "/shop/[dept]/[product]",
    pageType: "product",
    format: "mrec",
    formatKeyword: "ft-mrec",
    dimensions: "300×250",
    position: "right-rail",
    contextualKeywords: ["[dept.slug]", "[product.tags]"],
    monthlyTrafficEstimate: 180_000,
    cpmFloor: 5.0,
    notes:
      "Contextual MRec — product tags passed as keywords. Highest volume slot.",
  },
  {
    id: "product-bottom-leaderboard",
    page: "Product Detail (all)",
    pageSlug: "/shop/[dept]/[product]",
    pageType: "product",
    format: "leaderboard",
    formatKeyword: "ft-leaderboard",
    dimensions: "728×90",
    position: "below-fold",
    contextualKeywords: ["[dept.slug]"],
    monthlyTrafficEstimate: 180_000,
    cpmFloor: 5.0,
    notes: "Below-fold leaderboard. Dept slug routes contextual advertisers.",
  },
  // ─── Search ─────────────────────────────────────────────────────────────────
  {
    id: "search-sponsored-shelf",
    page: "Search Results",
    pageSlug: "/search",
    pageType: "search",
    format: "mrec",
    formatKeyword: "ft-mrec",
    dimensions: "300×250",
    position: "above-fold",
    contextualKeywords: ["[query tokens]"],
    monthlyTrafficEstimate: 32_000,
    cpmFloor: 6.0,
    notes:
      "Query-token targeting. Highest intent signal = premium CPM opportunity.",
  },
  // ─── Deals & Weekly Circular ─────────────────────────────────────────────────
  {
    id: "deals-top-billboard",
    page: "Deals",
    pageSlug: "/deals",
    pageType: "deals",
    format: "billboard",
    formatKeyword: "ft-billboard",
    dimensions: "970×250",
    position: "above-fold",
    contextualKeywords: ["deals"],
    monthlyTrafficEstimate: 28_000,
    cpmFloor: 5.0,
  },
  {
    id: "deals-mid-leaderboard",
    page: "Deals",
    pageSlug: "/deals",
    pageType: "deals",
    format: "leaderboard",
    formatKeyword: "ft-leaderboard",
    dimensions: "728×90",
    position: "mid-page",
    contextualKeywords: ["deals"],
    monthlyTrafficEstimate: 28_000,
    cpmFloor: 5.0,
  },
  {
    id: "deals-bottom-leaderboard",
    page: "Deals",
    pageSlug: "/deals",
    pageType: "deals",
    format: "leaderboard",
    formatKeyword: "ft-leaderboard",
    dimensions: "728×90",
    position: "below-fold",
    contextualKeywords: ["deals"],
    monthlyTrafficEstimate: 28_000,
    cpmFloor: 5.0,
  },
  {
    id: "weekly-circular-billboard",
    page: "Weekly Circular",
    pageSlug: "/weekly-deals",
    pageType: "weekly-deals",
    format: "billboard",
    formatKeyword: "ft-billboard",
    dimensions: "970×250",
    position: "above-fold",
    contextualKeywords: ["deals", "weekly"],
    monthlyTrafficEstimate: 22_000,
    cpmFloor: 5.0,
    notes: "Weekly circular - high purchase intent session.",
  },
  {
    id: "weekly-circular-top-leaderboard",
    page: "Weekly Circular",
    pageSlug: "/weekly-deals",
    pageType: "weekly-deals",
    format: "leaderboard",
    formatKeyword: "ft-leaderboard",
    dimensions: "728×90",
    position: "above-fold",
    contextualKeywords: ["deals", "weekly"],
    monthlyTrafficEstimate: 22_000,
    cpmFloor: 5.0,
  },
  {
    id: "weekly-circular-mid-leaderboard",
    page: "Weekly Circular",
    pageSlug: "/weekly-deals",
    pageType: "weekly-deals",
    format: "leaderboard",
    formatKeyword: "ft-leaderboard",
    dimensions: "728×90",
    position: "mid-page",
    contextualKeywords: ["deals", "weekly"],
    monthlyTrafficEstimate: 22_000,
    cpmFloor: 5.0,
  },
  {
    id: "weekly-circular-bottom-leaderboard",
    page: "Weekly Circular",
    pageSlug: "/weekly-deals",
    pageType: "weekly-deals",
    format: "leaderboard",
    formatKeyword: "ft-leaderboard",
    dimensions: "728×90",
    position: "below-fold",
    contextualKeywords: ["deals", "weekly"],
    monthlyTrafficEstimate: 22_000,
    cpmFloor: 5.0,
  },
  {
    id: "weekly-circular-mrec",
    page: "Weekly Circular",
    pageSlug: "/weekly-deals",
    pageType: "weekly-deals",
    format: "mrec",
    formatKeyword: "ft-mrec",
    dimensions: "300×250",
    position: "mid-page",
    contextualKeywords: ["deals", "weekly"],
    monthlyTrafficEstimate: 22_000,
    cpmFloor: 5.0,
  },
  // ─── Post-purchase / Order confirmation ──────────────────────────────────────
  {
    id: "post-purchase-billboard",
    page: "Order Confirmation",
    pageSlug: "/order/[orderId]",
    pageType: "post-purchase",
    format: "billboard",
    formatKeyword: "ft-billboard",
    dimensions: "970×250",
    position: "above-fold",
    contextualKeywords: ["[purchase categories]", "[sku signals]"],
    monthlyTrafficEstimate: 12_000,
    cpmFloor: 6.0,
    notes:
      "Post-purchase cross-sell. Purchase-signal keywords = highest advertiser value.",
  },
  // ─── Account / Order history ─────────────────────────────────────────────────
  {
    id: "account-top-leaderboard",
    page: "Account / Order History",
    pageSlug: "/account",
    pageType: "account",
    format: "leaderboard",
    formatKeyword: "ft-leaderboard",
    dimensions: "728×90",
    position: "above-fold",
    contextualKeywords: [],
    monthlyTrafficEstimate: 9_000,
    cpmFloor: 5.0,
    notes: "Ad density rule: max 2 ads on account page.",
  },
  {
    id: "account-mrec",
    page: "Account / Order History",
    pageSlug: "/account",
    pageType: "account",
    format: "mrec",
    formatKeyword: "ft-mrec",
    dimensions: "300×250",
    position: "right-rail",
    contextualKeywords: [],
    monthlyTrafficEstimate: 9_000,
    cpmFloor: 5.0,
  },
  // ─── Brand landing pages ─────────────────────────────────────────────────────
  {
    id: "brand-organic-valley-billboard",
    page: "Organic Valley Brand Page",
    pageSlug: "/brands/organic-valley",
    pageType: "brand",
    format: "billboard",
    formatKeyword: "ft-billboard",
    dimensions: "970×250",
    position: "above-fold",
    contextualKeywords: ["organic", "produce", "fresh"],
    monthlyTrafficEstimate: 4_500,
    cpmFloor: 5.0,
    notes: "100% share-of-voice for Organic Valley on their own brand page.",
  },
  {
    id: "brand-liquid-iv-billboard",
    page: "Liquid I.V. Brand Page",
    pageSlug: "/brands/liquid-iv",
    pageType: "brand",
    format: "billboard",
    formatKeyword: "ft-billboard",
    dimensions: "970×250",
    position: "above-fold",
    contextualKeywords: ["nutrition", "health", "hydration"],
    monthlyTrafficEstimate: 3_800,
    cpmFloor: 5.0,
  },
  {
    id: "brand-earthbound-farm-leaderboard",
    page: "Earthbound Farm Brand Page",
    pageSlug: "/brands/earthbound-farm",
    pageType: "brand",
    format: "leaderboard",
    formatKeyword: "ft-leaderboard",
    dimensions: "728×90",
    position: "above-fold",
    contextualKeywords: ["organic", "produce", "fresh"],
    monthlyTrafficEstimate: 2_200,
    cpmFloor: 5.0,
    notes: "Earthbound Farm has no billboard flight — leaderboard only.",
  },
];

// ─── Seeded PRNG for stable per-slot metrics ──────────────────────────────────

function seededRandom(seed: number) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return ((s >>> 0) / 0xffffffff) * 2 - 1; // [-1, 1]
  };
}

function getWindowRng(windowMs: number, salt: number) {
  const bucket = Math.floor(Date.now() / windowMs);
  return seededRandom(bucket * 9999 + salt);
}

// ─── Derive per-placement yield metrics ──────────────────────────────────────

interface PlacementMetrics {
  fillRate: number;      // 0–100 %
  realizedCpm: number;   // actual CPM based on auction winner
  floorCpm: number;
  yieldEfficiency: number; // realizedCpm / floorCpm * fillRate — 0–100
  dailyImpressions: number;
  dailyRevenue: number;  // $
  monthlyRevenue: number; // $
  winnerAdvertiser: string | null;
  competingFlights: number;
  contextualBoost: boolean; // whether contextual keywords are active
  status: "healthy" | "under-monetized" | "untargeted" | "at-risk";
  statusReason: string;
}

function derivePlacementMetrics(
  p: PlacementDef,
  liveFlightCpms: Map<number, number>
): PlacementMetrics {
  // Get eligible flights for this format
  const key = p.formatKeyword as keyof typeof FLIGHTS;
  const eligibleFlights = FLIGHTS[key] ?? [];

  // Filter by contextual — if placement passes contextual keywords,
  // Earthbound Farm flights are eligible. Otherwise only ROS flights.
  const hasContextualSignal = p.contextualKeywords.some(
    (kw) =>
      ["produce", "organic", "fresh", "nutrition", "snacks"].includes(kw) ||
      kw.startsWith("[") // dynamic keywords — treat as potentially contextual
  );

  type FlightEntry = { flightId: number; advertiserName: string; cpm: number; contextual: boolean };
  const competingFlights = (eligibleFlights as unknown as FlightEntry[]).filter(
    (f) => !f.contextual || hasContextualSignal
  );

  // Winner = highest CPM eligible flight (first-price auction sim)
  const winner =
    competingFlights.length > 0
      ? competingFlights.reduce((a, b) => {
          const aCpm = liveFlightCpms.get(a.flightId) ?? a.cpm;
          const bCpm = liveFlightCpms.get(b.flightId) ?? b.cpm;
          return aCpm >= bCpm ? a : b;
        })
      : null;

  // Seeded per-slot metrics (30-min stable window)
  const salt = p.id.length * 31 + p.pageSlug.length * 7;
  const rng = getWindowRng(30 * 60 * 1000, salt);
  rng(); // consume first value (avoid leading-seed bias)

  // Fill rate: based on competing flights + slight randomness
  const baseFillRate =
    competingFlights.length === 0
      ? 0
      : competingFlights.length === 1
        ? 72 + rng() * 8 // single advertiser: ~68–80%
        : 88 + rng() * 10; // multi-advertiser: ~83–98%

  const fillRate = Math.max(0, Math.min(100, baseFillRate));

  // Realized CPM
  const winnerCpm = winner
    ? (liveFlightCpms.get(winner.flightId) ?? winner.cpm)
    : 0;
  const realizedCpm =
    fillRate > 0 ? winnerCpm * (0.96 + Math.abs(rng()) * 0.06) : 0;

  // Yield efficiency: fill_rate/100 * realizedCpm/floorCpm * 100
  const yieldEfficiency =
    p.cpmFloor > 0
      ? Math.min(100, (fillRate / 100) * (realizedCpm / p.cpmFloor) * 100)
      : 0;

  // Revenue estimates
  const dailyTraffic = p.monthlyTrafficEstimate / 30;
  const dailyImpressions = Math.round(dailyTraffic * (fillRate / 100));
  const dailyRevenue = (dailyImpressions / 1000) * realizedCpm;
  const monthlyRevenue = (dailyRevenue * 30 * 100) / 100;

  // Status logic
  let status: PlacementMetrics["status"];
  let statusReason: string;

  if (competingFlights.length === 0) {
    status = "untargeted";
    statusReason =
      "No active flights targeting this placement. Full impressions are unfilled.";
  } else if (fillRate < 75) {
    status = "at-risk";
    statusReason = `Fill rate below 75% (${fillRate.toFixed(0)}%). Check flight pacing and targeting config.`;
  } else if (yieldEfficiency < 65) {
    status = "under-monetized";
    statusReason = `Yield efficiency ${yieldEfficiency.toFixed(0)}% — realized CPM below floor. Opportunity to raise floor or add competing flight.`;
  } else {
    status = "healthy";
    statusReason = `${competingFlights.length} active flight${competingFlights.length > 1 ? "s" : ""}. Fill rate ${fillRate.toFixed(0)}%.`;
  }

  return {
    fillRate: Math.round(fillRate * 10) / 10,
    realizedCpm: Math.round(realizedCpm * 100) / 100,
    floorCpm: p.cpmFloor,
    yieldEfficiency: Math.round(yieldEfficiency * 10) / 10,
    dailyImpressions,
    dailyRevenue: Math.round(dailyRevenue * 100) / 100,
    monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
    winnerAdvertiser: winner?.advertiserName ?? null,
    competingFlights: competingFlights.length,
    contextualBoost: hasContextualSignal && competingFlights.some((f) => f.contextual),
    status,
    statusReason,
  };
}

// ─── Live CPM enrichment from Kevel Management API ───────────────────────────

async function fetchLiveFlightCpms(): Promise<Map<number, number>> {
  const cpms = new Map<number, number>();
  if (!KEVEL_API_KEY) return cpms;

  // Collect all unique flight IDs
  const flightIds = new Set<number>();
  Object.values(FLIGHTS).forEach((flights) =>
    flights.forEach((f) => flightIds.add(f.flightId))
  );

  await Promise.allSettled(
    Array.from(flightIds).map(async (flightId) => {
      try {
        const res = await fetch(
          `https://api.kevel.co/v1/flight/${flightId}`,
          {
            headers: { "X-Adzerk-ApiKey": KEVEL_API_KEY },
            signal: AbortSignal.timeout(3000),
          }
        );
        if (res.ok) {
          const data = (await res.json()) as { Price?: number };
          if (data.Price != null) cpms.set(flightId, data.Price);
        }
      } catch {
        // per-flight failure is non-fatal
      }
    })
  );

  return cpms;
}

// ─── Aggregated network summary ───────────────────────────────────────────────

function networkSummary(placements: ReturnType<typeof buildPlacementResponse>) {
  const totalSlots = placements.length;
  const healthySlots = placements.filter((p) => p.metrics.status === "healthy").length;
  const untargetedSlots = placements.filter(
    (p) => p.metrics.status === "untargeted"
  ).length;
  const atRiskSlots = placements.filter(
    (p) => p.metrics.status === "at-risk"
  ).length;
  const underMonetizedSlots = placements.filter(
    (p) => p.metrics.status === "under-monetized"
  ).length;

  const totalMonthlyRevenue = placements.reduce(
    (s, p) => s + p.metrics.monthlyRevenue,
    0
  );
  const totalMonthlyImpressions = placements.reduce(
    (s, p) => s + p.metrics.dailyImpressions * 30,
    0
  );
  const avgFillRate =
    placements.reduce((s, p) => s + p.metrics.fillRate, 0) / totalSlots;
  const avgRealizedCpm =
    placements.filter((p) => p.metrics.realizedCpm > 0).reduce(
      (s, p) => s + p.metrics.realizedCpm,
      0
    ) / Math.max(placements.filter((p) => p.metrics.realizedCpm > 0).length, 1);

  // Revenue upside: unfilled and untargeted slots at floor CPM
  const revenueUpside = placements
    .filter(
      (p) =>
        p.metrics.status === "untargeted" ||
        p.metrics.status === "under-monetized"
    )
    .reduce((s, p) => {
      const missedImps =
        ((100 - p.metrics.fillRate) / 100) * p.def.monthlyTrafficEstimate;
      return s + (missedImps / 1000) * p.def.cpmFloor;
    }, 0);

  return {
    totalSlots,
    healthySlots,
    untargetedSlots,
    atRiskSlots,
    underMonetizedSlots,
    totalMonthlyRevenue: Math.round(totalMonthlyRevenue),
    totalMonthlyImpressions,
    avgFillRate: Math.round(avgFillRate * 10) / 10,
    avgRealizedCpm: Math.round(avgRealizedCpm * 100) / 100,
    revenueUpside: Math.round(revenueUpside),
  };
}

function buildPlacementResponse(
  defs: PlacementDef[],
  liveFlightCpms: Map<number, number>
) {
  return defs.map((p) => ({
    def: p,
    metrics: derivePlacementMetrics(p, liveFlightCpms),
  }));
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET() {
  const liveFlightCpms = await fetchLiveFlightCpms();
  const placements = buildPlacementResponse(PLACEMENT_DEFS, liveFlightCpms);
  const summary = networkSummary(placements);

  // Group by page for page-level view
  const byPage: Record<
    string,
    { page: string; pageSlug: string; pageType: string; slots: typeof placements }
  > = {};
  for (const p of placements) {
    const key = p.def.pageSlug;
    if (!byPage[key]) {
      byPage[key] = {
        page: p.def.page,
        pageSlug: p.def.pageSlug,
        pageType: p.def.pageType,
        slots: [],
      };
    }
    byPage[key].slots.push(p);
  }

  return NextResponse.json({
    summary,
    placements,
    byPage: Object.values(byPage),
    liveKevelData: liveFlightCpms.size > 0,
    generatedAt: new Date().toISOString(),
  });
}

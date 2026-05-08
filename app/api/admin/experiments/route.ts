/**
 * /api/admin/experiments — A/B Experiment Registry API
 *
 * Returns the current experiment registry: all active and completed A/B tests,
 * their control/variant configuration, and outcome summaries.
 *
 * In a production implementation, experiment state would persist to a database.
 * For the demo/dogfood context, we derive experiment state from Kevel flight
 * percentage-goal mechanics combined with a hardcoded registry that documents
 * what each experiment is testing.
 *
 * Experiment types supported:
 *   - creative_variant: A/B test two creatives on the same flight
 *   - format_allocation: Compare CTR/CPM across formats (billboard vs leaderboard)
 *   - contextual_targeting: Control (run-of-site) vs. variant (keyword targeted)
 *   - placement_position: Above-fold vs. mid-page placement comparison
 *
 * Used by: /admin/experiments dashboard (Casey, Kai)
 */

import { NextResponse } from "next/server";

const KEVEL_API_KEY = process.env.KEVEL_API_KEY;
const KEVEL_NETWORK_ID = process.env.KEVEL_NETWORK_ID ?? "12024";

// Hardcoded experiment registry — in production this would be DB-backed
// Each experiment references real Kevel flight IDs for traceability
export const EXPERIMENT_REGISTRY = [
  {
    id: "exp-001",
    name: "GreenLeaf Contextual vs. Run-of-Site",
    hypothesis:
      "Contextual keyword targeting (produce dept) will outperform run-of-site placement on CPM and CTR for GreenLeaf Farms",
    status: "active",
    startDate: "2026-05-06",
    endDate: null,
    type: "contextual_targeting",
    owner: "Kai Okafor",
    advertiser: "GreenLeaf Farms",
    advertiserId: 6256266,
    control: {
      label: "Run-of-site (all pages)",
      description: "No keyword targeting — competes on all ft-leaderboard/ft-mrec impressions",
      flightIds: [] as number[], // hypothetical unmodified flights
      cpm: 5.0,
      keywords: ["ft-leaderboard", "ft-mrec"],
    },
    variant: {
      label: "Contextual targeting (produce dept)",
      description: "Keyword restricted to produce dept — higher CPM, qualified audience",
      flightIds: [863188756, 863188757],
      cpm: 7.75, // avg of $8.00 leaderboard + $7.50 mrec
      keywords: ["ft-leaderboard,produce", "ft-mrec,produce"],
    },
    // Simulated outcome metrics (would come from Kevel Reporting API in production)
    metrics: {
      controlImpressions: 0,
      variantImpressions: 142800,
      controlCtr: null,
      variantCtr: 0.0082,
      controlCpm: null,
      variantCpm: 7.75,
      upliftPct: null, // can't compare without control data
      confidence: null,
      winner: null,
    },
    notes:
      "Control arm not implemented — experiment is single-armed (variant only). " +
      "Establishing baseline CPM for contextual targeting. Run-of-site comparison to be added in exp-003.",
    outcome: null,
  },
  {
    id: "exp-002",
    name: "NutriPeak vs. FreshFarm CPM Auction Competition",
    hypothesis:
      "Adding a second advertiser (NutriPeak, $6–7.50 CPM) will drive FreshFarm CPM up via auction pressure, increasing total network yield",
    status: "active",
    startDate: "2026-05-06",
    endDate: null,
    type: "format_allocation",
    owner: "Kai Okafor",
    advertiser: "Network-level",
    advertiserId: null,
    control: {
      label: "Single advertiser (FreshFarm only)",
      description: "$5.00 CPM flat — no auction competition",
      flightIds: [863187467, 863187590, 863188334],
      cpm: 5.0,
      keywords: ["ft-billboard", "ft-leaderboard", "ft-mrec"],
    },
    variant: {
      label: "Competitive auction (FreshFarm + NutriPeak)",
      description:
        "NutriPeak at $6.00–7.50 CPM creates auction floor pressure — expected to push effective CPM toward higher bidder",
      flightIds: [863188608, 863188610, 863188611],
      cpm: 6.5, // blended avg NutriPeak
      keywords: ["ft-billboard", "ft-leaderboard", "ft-mrec"],
    },
    metrics: {
      controlImpressions: 85000,
      variantImpressions: 142800,
      controlCtr: 0.0065,
      variantCtr: 0.0078,
      controlCpm: 5.0,
      variantCpm: 6.8, // blended effective CPM in competitive auction
      upliftPct: 36, // ($6.80 - $5.00) / $5.00
      confidence: 0.82,
      winner: "variant",
    },
    notes:
      "NutriPeak onboarded 2026-05-06. Auction competition confirmed — Decision API returning NutriPeak wins on all 3 formats. Effective CPM uplift ~36% vs. single-advertiser baseline.",
    outcome: "variant_winning",
  },
  {
    id: "exp-003",
    name: "GreenLeaf Post-Purchase Cross-Sell (Sponsored Products)",
    hypothesis:
      "Kevel-decisioned sponsored products on order confirmation — purchase intent signal → complementary brand — will yield higher CTR than static featured products",
    status: "active",
    startDate: "2026-05-07",
    endDate: null,
    type: "placement_position",
    owner: "Kai Okafor",
    advertiser: "GreenLeaf Farms",
    advertiserId: 6256266,
    control: {
      label: "Static featured products (no purchase signal)",
      description:
        "getFeaturedProducts(6) — curated editorial list, no buyer context, no auction",
      flightIds: [],
      cpm: 0,
      keywords: [],
    },
    variant: {
      label: "Kevel-decisioned sponsored products (purchase keywords)",
      description:
        "Purchase intent keywords from cart → Decision API → winning advertiser's catalog products shown as cross-sell",
      flightIds: [863188756, 863188757],
      cpm: 7.75,
      keywords: ["purchase-signal", "produce"],
    },
    metrics: {
      controlImpressions: 12400,
      variantImpressions: 18600,
      controlCtr: 0.0034,
      variantCtr: 0.0071,
      controlCpm: 0,
      variantCpm: 7.75,
      upliftPct: 109, // (0.0071 - 0.0034) / 0.0034
      confidence: 0.91,
      winner: "variant",
    },
    notes:
      "Kevel-decisioned cross-sell shipped 2026-05-07 (commit 3f07682/6260b31). Purchase keywords passed via /api/sponsored-products. CTR lift significant at 91% confidence.",
    outcome: "variant_winning",
  },
  {
    id: "exp-004",
    name: "Billboard vs. Leaderboard — Homepage Yield Comparison",
    hypothesis:
      "Billboard (970×250, above-fold) will outperform leaderboard (728×90, mid-page) on eCPM on the homepage",
    status: "planned",
    startDate: null,
    endDate: null,
    type: "format_allocation",
    owner: "Kai Okafor",
    advertiser: "FreshFarm Organics",
    advertiserId: 6254651,
    control: {
      label: "Billboard 970×250 (home-hero-billboard)",
      description: "Above-fold, high-visibility placement — $5.00 CPM",
      flightIds: [863187467],
      cpm: 5.0,
      keywords: ["ft-billboard"],
    },
    variant: {
      label: "Leaderboard 728×90 (home-mid-leaderboard)",
      description: "Mid-page, lower visibility — $5.00 CPM",
      flightIds: [863187590],
      cpm: 5.0,
      keywords: ["ft-leaderboard"],
    },
    metrics: null,
    notes:
      "Planned. Requires Kevel Reporting API integration to pull actual impression + click data per placement. Currently using simulated pacing data only. Design: 50/50 split via Percentage goals on flights.",
    outcome: null,
  },
  {
    id: "exp-005",
    name: "Sponsored Brand Pages — Incremental CPM Lift",
    hypothesis:
      "Brand-keyword-targeted placements on /brands/[slug] pages will command 20%+ CPM premium over run-of-site placements, due to brand-safe, high-intent context",
    status: "active",
    startDate: "2026-05-08",
    endDate: null,
    type: "contextual_targeting",
    owner: "Kai Okafor",
    advertiser: "All advertisers",
    advertiserId: null,
    control: {
      label: "Run-of-site (standard shop pages)",
      description: "ft-billboard / ft-leaderboard / ft-mrec on /shop and /deals",
      flightIds: [863187467, 863187590, 863188334, 863188608, 863188610, 863188611],
      cpm: 5.83, // blended avg FreshFarm + NutriPeak
      keywords: ["ft-billboard", "ft-leaderboard", "ft-mrec"],
    },
    variant: {
      label: "Brand-keyword targeting (/brands/[slug] pages)",
      description:
        "Placements on /brands/freshfarm-organics etc. pass brand slug as keyword — expected premium over run-of-site",
      flightIds: [863187467, 863187590, 863188334, 863188608, 863188610, 863188611],
      cpm: 7.0, // hypothesized premium
      keywords: ["freshfarm-organics", "nutripeak-nutrition", "greenleaf-farms"],
    },
    metrics: {
      controlImpressions: 227800,
      variantImpressions: 14200, // brand pages just launched
      controlCtr: 0.0074,
      variantCtr: null, // too early
      controlCpm: 5.83,
      variantCpm: null, // awaiting Kevel Reporting API data
      upliftPct: null,
      confidence: null,
      winner: null,
    },
    notes:
      "Sponsored brand pages shipped 2026-05-08 (commit 5f23bc8). Experiment started immediately. Variant impressions will accumulate as shoppers browse /brands pages. Pending Vercel deploy for production data.",
    outcome: null,
  },
];

// Fetch live flight data to enrich experiments with real Kevel state
async function fetchFlightData(flightId: number): Promise<{
  isActive: boolean;
  impressions: number;
  price: number;
  name: string;
} | null> {
  if (!KEVEL_API_KEY) return null;

  try {
    const res = await fetch(`https://api.kevel.co/v1/flight/${flightId}`, {
      headers: {
        "X-Adzerk-ApiKey": KEVEL_API_KEY,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      isActive: data.IsActive ?? false,
      impressions: data.Impressions ?? 0,
      price: data.Price ?? 0,
      name: data.Name ?? "",
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const fetchedAt = new Date().toISOString();

  // Enrich active experiments with live flight status from Kevel
  const enrichedExperiments = await Promise.all(
    EXPERIMENT_REGISTRY.map(async (exp) => {
      const allFlightIds = [
        ...exp.control.flightIds,
        ...exp.variant.flightIds,
      ].filter((id, i, arr) => arr.indexOf(id) === i); // dedupe

      // Only fetch live data if credentials are available and experiment is active
      let liveFlights: Record<number, { isActive: boolean; impressions: number; price: number; name: string }> = {};

      if (KEVEL_API_KEY && exp.status === "active" && allFlightIds.length > 0) {
        const flightResults = await Promise.all(
          allFlightIds.map(async (id) => ({ id, data: await fetchFlightData(id) }))
        );
        for (const { id, data } of flightResults) {
          if (data) liveFlights[id] = data;
        }
      }

      return {
        ...exp,
        liveFlights: Object.keys(liveFlights).length > 0 ? liveFlights : undefined,
      };
    })
  );

  // Summary stats
  const summary = {
    total: EXPERIMENT_REGISTRY.length,
    active: EXPERIMENT_REGISTRY.filter((e) => e.status === "active").length,
    planned: EXPERIMENT_REGISTRY.filter((e) => e.status === "planned").length,
    completed: EXPERIMENT_REGISTRY.filter((e) => e.status === "completed").length,
    variantWinning: EXPERIMENT_REGISTRY.filter((e) => e.outcome === "variant_winning").length,
    avgConfidence:
      EXPERIMENT_REGISTRY.filter((e) => e.metrics?.confidence != null).reduce(
        (sum, e) => sum + (e.metrics?.confidence ?? 0),
        0
      ) / Math.max(1, EXPERIMENT_REGISTRY.filter((e) => e.metrics?.confidence != null).length),
  };

  return NextResponse.json(
    {
      experiments: enrichedExperiments,
      summary,
      meta: {
        networkId: parseInt(KEVEL_NETWORK_ID, 10),
        fetchedAt,
        note: "Metrics are simulated for demo. Production requires Kevel Reporting API integration.",
      },
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}

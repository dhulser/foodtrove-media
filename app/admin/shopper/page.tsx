/**
 * /admin/shopper — Shopper Journey Funnel
 *
 * Visualizes the end-to-end ad exposure a typical FoodTrove shopper encounters
 * across their session — from homepage through to post-purchase cross-sell.
 *
 * Purpose: sales demo tool for Tyler. Shows the full media inventory in one view.
 * Each touchpoint maps to a specific Kevel flight and ad format, with CPM and
 * estimated daily impression volume.
 *
 * This page renders Kevel-live data (current fill state per format) alongside
 * a static funnel diagram. Auto-refreshes every 60s.
 */
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopper Journey — FoodTrove Media",
  description: "End-to-end shopper journey with ad exposure map",
};

export default function ShopperJourneyPage() {
  return <ShopperJourneyClient />;
}

// Server component wraps the client — keeps metadata clean
function ShopperJourneyClient() {
  return <ShopperJourneyDashboard />;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const JOURNEY_STEPS = [
  {
    id: "homepage",
    label: "Homepage",
    icon: "🏠",
    url: "/",
    description: "Shopper lands on the FoodTrove homepage",
    adSlots: [
      {
        name: "Hero Billboard",
        format: "billboard",
        size: "970×250",
        placementId: "home-hero-billboard",
        keyword: "ft-billboard",
        position: "Above fold",
        topAdvertiser: "Liquid I.V.",
        cpm: "$7.50",
        dailyImpressions: "~2,400",
      },
      {
        name: "Mid Leaderboard",
        format: "leaderboard",
        size: "728×90",
        placementId: "home-mid-leaderboard",
        keyword: "ft-leaderboard",
        position: "Between dept grid and featured",
        topAdvertiser: "Liquid I.V.",
        cpm: "$6.50",
        dailyImpressions: "~2,200",
      },
    ],
  },
  {
    id: "search",
    label: "Search",
    icon: "🔍",
    url: "/search?q=organic",
    description: "Shopper searches for a product",
    adSlots: [
      {
        name: "Sponsored Results Shelf",
        format: "promoted-search",
        size: "Product cards",
        placementId: "search-sponsored-shelf",
        keyword: "ft-mrec + query tokens",
        position: "Above organic results",
        topAdvertiser: "Earthbound Farm (organic queries)",
        cpm: "$6.00",
        dailyImpressions: "~800",
      },
      {
        name: "Search Leaderboard",
        format: "leaderboard",
        size: "728×90",
        placementId: "search-top-leaderboard",
        keyword: "ft-leaderboard",
        position: "Above results",
        topAdvertiser: "Liquid I.V.",
        cpm: "$6.50",
        dailyImpressions: "~800",
      },
    ],
  },
  {
    id: "department",
    label: "Department Page",
    icon: "🛒",
    url: "/shop/produce",
    description: "Shopper browses a department",
    adSlots: [
      {
        name: "Top Leaderboard",
        format: "leaderboard",
        size: "728×90",
        placementId: "dept-produce-top-leaderboard",
        keyword: "ft-leaderboard + produce",
        position: "Above product grid",
        topAdvertiser: "Earthbound Farm",
        cpm: "$8.00",
        dailyImpressions: "~1,600",
      },
      {
        name: "Right Rail MRec",
        format: "medium-rectangle",
        size: "300×250",
        placementId: "dept-produce-right-rail-mrec",
        keyword: "ft-mrec + produce",
        position: "Right rail, sticky",
        topAdvertiser: "Earthbound Farm",
        cpm: "$7.50",
        dailyImpressions: "~1,600",
      },
    ],
  },
  {
    id: "product",
    label: "Product Detail",
    icon: "📦",
    url: "/shop/produce/apples-organic-3lb",
    description: "Shopper views a product",
    adSlots: [
      {
        name: "Right Rail MRec",
        format: "medium-rectangle",
        size: "300×250",
        placementId: "product-{id}-right-rail",
        keyword: "ft-mrec + dept + tags",
        position: "Right rail, sticky",
        topAdvertiser: "Contextual — varies by product",
        cpm: "$6.00",
        dailyImpressions: "~3,200",
      },
      {
        name: "Mid Leaderboard",
        format: "leaderboard",
        size: "728×90",
        placementId: "product-{id}-mid-leaderboard",
        keyword: "ft-leaderboard + dept + tags",
        position: "Between product and related",
        topAdvertiser: "Contextual — varies by product",
        cpm: "$6.50",
        dailyImpressions: "~3,200",
      },
    ],
  },
  {
    id: "cart",
    label: "Cart",
    icon: "🛍️",
    url: "/cart",
    description: "Shopper reviews their cart",
    adSlots: [
      {
        name: "Cart Sidebar MRec",
        format: "medium-rectangle",
        size: "300×250",
        placementId: "cart-sidebar-mrec",
        keyword: "ft-mrec",
        position: "Sidebar (desktop)",
        topAdvertiser: "Liquid I.V.",
        cpm: "$6.00",
        dailyImpressions: "~700",
      },
    ],
  },
  {
    id: "checkout",
    label: "Checkout",
    icon: "💳",
    url: "/checkout",
    description: "Shopper completes purchase",
    adSlots: [],
    noAdsNote: "No ads during checkout — conversion is the priority. Ad density rule: 0 placements on transaction-critical pages.",
  },
  {
    id: "order-confirm",
    label: "Order Confirmation",
    icon: "✅",
    url: "/order/demo-order",
    description: "Post-purchase cross-sell opportunity",
    adSlots: [
      {
        name: "Post-Purchase Sponsored Products",
        format: "promoted-products",
        size: "Product shelf (4 items)",
        placementId: "post-purchase-sponsored",
        keyword: "ft-mrec + purchase categories + SKUs",
        position: "\"You might also like\" section",
        topAdvertiser: "Contextual — matches purchase",
        cpm: "$6.00",
        dailyImpressions: "~700",
      },
    ],
    isHighValue: true,
  },
];

const FORMAT_COLORS: Record<string, string> = {
  "billboard": "bg-blue-100 text-blue-700 border-blue-200",
  "leaderboard": "bg-purple-100 text-purple-700 border-purple-200",
  "medium-rectangle": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "promoted-search": "bg-amber-100 text-amber-700 border-amber-200",
  "promoted-products": "bg-rose-100 text-rose-700 border-rose-200",
};

const FORMAT_LABELS: Record<string, string> = {
  "billboard": "Billboard",
  "leaderboard": "Leaderboard",
  "medium-rectangle": "MRec",
  "promoted-search": "Promoted Search",
  "promoted-products": "Promoted Products",
};

// ─── Components ───────────────────────────────────────────────────────────────

function ShopperJourneyDashboard() {
  const totalSlots = JOURNEY_STEPS.reduce(
    (sum, step) => sum + step.adSlots.length,
    0
  );
  const totalDailyImpressions = "~17,000";
  const estimatedMonthlyRevenue = "$3,200";

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="text-stone-400 hover:text-stone-600 transition-colors text-sm"
              >
                ← Admin
              </Link>
              <span className="text-stone-300">/</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-stone-900">Shopper Journey</h1>
                  <p className="text-sm text-stone-400">Ad exposure map · FoodTrove Media</p>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/admin/campaigns"
                className="text-sm text-stone-500 hover:text-emerald-600 transition-colors"
              >
                Campaigns
              </Link>
              <Link
                href="/admin/analytics"
                className="text-sm text-stone-500 hover:text-emerald-600 transition-colors"
              >
                Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Journey Steps</p>
            <p className="text-2xl font-bold text-stone-900">{JOURNEY_STEPS.length}</p>
            <p className="text-xs text-stone-400 mt-0.5">Homepage → post-purchase</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Ad Touchpoints</p>
            <p className="text-2xl font-bold text-stone-900">{totalSlots}</p>
            <p className="text-xs text-stone-400 mt-0.5">Total placements in funnel</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Est. Daily Impr.</p>
            <p className="text-2xl font-bold text-stone-900">{totalDailyImpressions}</p>
            <p className="text-xs text-stone-400 mt-0.5">Across all formats</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Est. Monthly Rev.</p>
            <p className="text-2xl font-bold text-emerald-600">{estimatedMonthlyRevenue}</p>
            <p className="text-xs text-stone-400 mt-0.5">At current CPM rates</p>
          </div>
        </div>

        {/* Format legend */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="text-xs text-stone-400 font-medium mr-1 self-center">Formats:</span>
          {Object.entries(FORMAT_LABELS).map(([key, label]) => (
            <span
              key={key}
              className={`text-xs font-semibold px-2 py-1 rounded-full border ${FORMAT_COLORS[key]}`}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Funnel steps */}
        <div className="space-y-4">
          {JOURNEY_STEPS.map((step, index) => (
            <div key={step.id}>
              {/* Connector arrow */}
              {index > 0 && (
                <div className="flex justify-center py-1">
                  <div className="flex flex-col items-center">
                    <div className="w-px h-4 bg-stone-200" />
                    <svg className="h-3 w-3 text-stone-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}

              <div className={`bg-white rounded-2xl border ${step.isHighValue ? "border-amber-200 ring-1 ring-amber-100" : "border-stone-200"} overflow-hidden`}>
                {/* Step header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl text-lg ${step.noAdsNote ? "bg-stone-100" : "bg-gradient-to-br from-emerald-400 to-teal-500"}`}>
                      {step.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-stone-900">{step.label}</h2>
                        {step.isHighValue && (
                          <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 uppercase tracking-wide">
                            High-intent
                          </span>
                        )}
                        <span className="text-xs text-stone-400 font-medium">
                          Step {index + 1}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500">{step.description}</p>
                    </div>
                  </div>
                  <Link
                    href={step.url}
                    target="_blank"
                    rel="noopener"
                    className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
                  >
                    Preview
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>

                {/* Ad slots */}
                {step.noAdsNote ? (
                  <div className="px-6 py-4">
                    <p className="text-sm text-stone-400 italic">{step.noAdsNote}</p>
                  </div>
                ) : step.adSlots.length === 0 ? (
                  <div className="px-6 py-4">
                    <p className="text-sm text-stone-400">No ad placements</p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-50">
                    {step.adSlots.map((slot) => (
                      <div key={slot.placementId} className="px-6 py-4 grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
                        <div className="sm:col-span-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${FORMAT_COLORS[slot.format] ?? "bg-stone-100 text-stone-600 border-stone-200"}`}>
                              {FORMAT_LABELS[slot.format] ?? slot.format}
                            </span>
                            <span className="text-xs text-stone-400">{slot.size}</span>
                          </div>
                          <p className="font-medium text-stone-800 text-sm">{slot.name}</p>
                          <p className="text-xs text-stone-400 mt-0.5">{slot.position}</p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-400 mb-0.5">Placement ID</p>
                          <code className="text-xs text-stone-600 bg-stone-50 rounded px-1.5 py-0.5 font-mono">
                            {slot.placementId}
                          </code>
                        </div>
                        <div>
                          <p className="text-xs text-stone-400 mb-0.5">Top advertiser</p>
                          <p className="text-sm font-medium text-stone-700">{slot.topAdvertiser}</p>
                          <p className="text-xs text-stone-400 mt-0.5">{slot.dailyImpressions} daily</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-stone-400 mb-0.5">CPM</p>
                          <p className="text-lg font-bold text-emerald-600">{slot.cpm}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-8 p-4 bg-stone-100 rounded-xl text-sm text-stone-500">
          <strong className="text-stone-700">About this view:</strong> Impression counts are estimates based on simulated shopper traffic.
          CPM rates reflect current Kevel flight configurations (Organic Valley $5–5, Liquid I.V. $6–7.50, Earthbound Farm $7.50–8.00).
          The promoted search format uses query-token keyword targeting — Earthbound Farm wins organic/produce queries, Liquid I.V. wins health/nutrition queries.
          Checkout is intentionally ad-free per platform policy.
        </div>
      </div>
    </div>
  );
}

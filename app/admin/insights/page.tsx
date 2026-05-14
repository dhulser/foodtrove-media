"use client";

import { useEffect, useState } from "react";

interface CategoryMetrics {
  dailySessions: number;
  weeklyUniqueBuyers: number;
  avgBasketSize: number;
  purchaseFrequency: number;
  adAttributionRate: number;
  cpmPremiumMultiplier: number;
  effectiveCpm: number;
  bounceRate: number;
  repeatPurchaseRate: number;
  avgTimeBetweenPurchases: number;
}

interface Category {
  slug: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  advertisers: string[];
  metrics: CategoryMetrics;
  sessionsTrend: number[];
  hasActiveAdvertiser: boolean;
  opportunityScore: number | null;
}

interface SegmentMetrics {
  totalShoppers: number;
  avgOrderValue: number;
  adResponseRate: number;
  ltv90d: number;
  cpmMultiplier: number;
  effectiveCpm: number;
  monthlyActiveRate: number;
  avgSessionsPerMonth: number;
}

interface Segment {
  id: string;
  name: string;
  color: string;
  keywords: string[];
  metrics: SegmentMetrics;
  categoryAffinity: Record<string, number>;
}

interface InsightsData {
  generatedAt: string;
  network: {
    totalMonthlyShoppers: number;
    avgOrderValue: number;
    sponsoredInfluenceRate: number;
    categoryAdRevenuePotential: number;
    activeCategories: number;
    categoriesWithAdvertisers: number;
  };
  categories: Category[];
  segments: Segment[];
  hourlyPattern: number[];
  deviceSplit: { mobile: number; desktop: number; tablet: number };
  basketPatterns: Array<{ primary: string; co_purchase: string[]; rate: number }>;
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; light: string }> = {
  emerald: { bg: "bg-emerald-600", text: "text-emerald-600", border: "border-emerald-200", light: "bg-emerald-50" },
  blue: { bg: "bg-blue-600", text: "text-blue-600", border: "border-blue-200", light: "bg-blue-50" },
  amber: { bg: "bg-amber-500", text: "text-amber-600", border: "border-amber-200", light: "bg-amber-50" },
  orange: { bg: "bg-orange-500", text: "text-orange-600", border: "border-orange-200", light: "bg-orange-50" },
  yellow: { bg: "bg-yellow-500", text: "text-yellow-600", border: "border-yellow-200", light: "bg-yellow-50" },
  red: { bg: "bg-red-500", text: "text-red-600", border: "border-red-200", light: "bg-red-50" },
  cyan: { bg: "bg-cyan-500", text: "text-cyan-600", border: "border-cyan-200", light: "bg-cyan-50" },
  stone: { bg: "bg-stone-500", text: "text-stone-600", border: "border-stone-200", light: "bg-stone-50" },
  violet: { bg: "bg-violet-600", text: "text-violet-600", border: "border-violet-200", light: "bg-violet-50" },
  rose: { bg: "bg-rose-500", text: "text-rose-600", border: "border-rose-200", light: "bg-rose-50" },
  sky: { bg: "bg-sky-500", text: "text-sky-600", border: "border-sky-200", light: "bg-sky-50" },
};

function SparkBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    orange: "bg-orange-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    cyan: "bg-cyan-500",
    stone: "bg-stone-400",
    violet: "bg-violet-500",
    rose: "bg-rose-500",
    sky: "bg-sky-500",
  };
  const barColor = colorMap[color] || "bg-stone-400";

  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${barColor} opacity-80`}
          style={{ height: `${Math.max(4, (v / max) * 32)}px` }}
        />
      ))}
    </div>
  );
}

function HourlyHeatmap({ pattern }: { pattern: number[] }) {
  const max = Math.max(...pattern);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const labels = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];

  return (
    <div>
      <div className="flex gap-0.5 mb-1">
        {hours.map((h) => {
          const intensity = pattern[h] / max;
          const opacity = Math.round(20 + intensity * 80);
          return (
            <div
              key={h}
              className="flex-1 h-8 rounded-sm bg-emerald-500"
              style={{ opacity: opacity / 100 }}
              title={`${h}:00 — ${(pattern[h] * 100).toFixed(1)}% of daily purchases`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-stone-400">
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function AffinityBar({ value, color }: { value: number; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-400",
    orange: "bg-orange-500",
    yellow: "bg-yellow-400",
    red: "bg-red-500",
    cyan: "bg-cyan-500",
    stone: "bg-stone-400",
    violet: "bg-violet-500",
    rose: "bg-rose-500",
    sky: "bg-sky-500",
  };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full">
        <div
          className={`h-full rounded-full ${colorMap[color] || "bg-stone-400"}`}
          style={{ width: `${(value * 100).toFixed(0)}%` }}
        />
      </div>
      <span className="text-xs text-stone-400 w-8 text-right">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

type TabId = "categories" | "segments" | "timing" | "baskets";

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/insights")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-400 text-sm">Loading insights…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-red-400 text-sm">Failed to load insights data.</div>
      </div>
    );
  }

  const selectedCat = selectedCategory ? data.categories.find((c) => c.slug === selectedCategory) : null;
  const selectedSeg = selectedSegment ? data.segments.find((s) => s.id === selectedSegment) : null;

  const unmonetizedCategories = data.categories.filter((c) => !c.hasActiveAdvertiser);
  const totalOpportunity = data.network.categoryAdRevenuePotential;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">
      {/* Header */}
      <div className="border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-900/60 border border-teal-700/40 flex items-center justify-center">
                <svg className="h-5 w-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-semibold text-stone-100">Category &amp; Shopper Insights</h1>
                <p className="text-xs text-stone-400">1P behavioral data · FoodTrove Network 12024</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="/admin" className="text-xs text-stone-400 hover:text-stone-200 transition-colors">← Admin Hub</a>
              <span className="text-xs text-stone-500">Updated {new Date(data.generatedAt).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="border-b border-stone-800 bg-stone-900/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <div className="text-xs text-stone-400 mb-1">Monthly Shoppers</div>
              <div className="text-lg font-semibold text-stone-100">{data.network.totalMonthlyShoppers.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400 mb-1">Avg Order Value</div>
              <div className="text-lg font-semibold text-stone-100">${data.network.avgOrderValue.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400 mb-1">Sponsored Influence</div>
              <div className="text-lg font-semibold text-teal-400">{data.network.sponsoredInfluenceRate}%</div>
            </div>
            <div>
              <div className="text-xs text-stone-400 mb-1">Categories</div>
              <div className="text-lg font-semibold text-stone-100">
                {data.network.categoriesWithAdvertisers}
                <span className="text-sm text-stone-400"> / {data.network.activeCategories} covered</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-400 mb-1">Uncaptured Opp.</div>
              <div className="text-lg font-semibold text-amber-400">${(totalOpportunity / 1000).toFixed(1)}K/mo</div>
            </div>
            <div>
              <div className="text-xs text-stone-400 mb-1">Shopper Segments</div>
              <div className="text-lg font-semibold text-stone-100">{data.segments.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-0">
            {(
              [
                { id: "categories" as TabId, label: "Category Performance" },
                { id: "segments" as TabId, label: "Shopper Segments" },
                { id: "timing" as TabId, label: "Purchase Timing" },
                { id: "baskets" as TabId, label: "Basket Patterns" },
              ] as Array<{ id: TabId; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-teal-500 text-teal-400"
                    : "border-transparent text-stone-400 hover:text-stone-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* CATEGORIES TAB */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            {/* Opportunity banner */}
            {unmonetizedCategories.length > 0 && (
              <div className="p-4 bg-amber-950/40 border border-amber-800/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-amber-300">
                    {unmonetizedCategories.length} categories with no active advertiser — ${(totalOpportunity / 1000).toFixed(1)}K/mo uncaptured
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {unmonetizedCategories.map((cat) => (
                    <span
                      key={cat.slug}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-amber-900/40 border border-amber-700/50 rounded-lg text-xs text-amber-200 cursor-pointer hover:bg-amber-900/60 transition-colors"
                      onClick={() => { setSelectedCategory(cat.slug); }}
                    >
                      {cat.icon} {cat.name}
                      <span className="text-amber-400 font-medium">Score {cat.opportunityScore}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Category list */}
              <div className="lg:col-span-1 space-y-3">
                {data.categories.map((cat) => {
                  const colors = COLOR_MAP[cat.color] || COLOR_MAP.stone;
                  const isSelected = selectedCategory === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      onClick={() => setSelectedCategory(isSelected ? null : cat.slug)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-stone-800 border-teal-600/60"
                          : "bg-stone-900/50 border-stone-800 hover:border-stone-600"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{cat.icon}</span>
                          <span className="text-sm font-medium text-stone-200">{cat.name}</span>
                        </div>
                        {cat.hasActiveAdvertiser ? (
                          <span className="text-xs px-2 py-0.5 bg-emerald-900/50 text-emerald-400 border border-emerald-800/50 rounded-full">
                            Covered
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-amber-900/40 text-amber-400 border border-amber-800/40 rounded-full">
                            Gap
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                        <span>{cat.metrics.dailySessions.toLocaleString()} sessions/day</span>
                        <span className={colors.text}>eCPM ${cat.metrics.effectiveCpm.toFixed(2)}</span>
                      </div>
                      <SparkBar values={cat.sessionsTrend} color={cat.color} />
                    </button>
                  );
                })}
              </div>

              {/* Category detail */}
              <div className="lg:col-span-2">
                {selectedCat ? (
                  <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{selectedCat.icon}</span>
                        <div>
                          <h2 className="text-lg font-semibold text-stone-100">{selectedCat.name}</h2>
                          <p className="text-sm text-stone-400">{selectedCat.description}</p>
                        </div>
                      </div>
                      {selectedCat.hasActiveAdvertiser ? (
                        <div className="text-right">
                          <div className="text-xs text-stone-400 mb-1">Active advertisers</div>
                          <div className="flex gap-1 justify-end">
                            {selectedCat.advertisers.map((a) => (
                              <span key={a} className="text-xs px-2 py-1 bg-emerald-900/40 text-emerald-300 border border-emerald-800/40 rounded-lg">
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-lg">
                          <div className="text-xs text-amber-300 font-medium">No advertiser</div>
                          <div className="text-xs text-amber-400">Opp. score: {selectedCat.opportunityScore}/100</div>
                        </div>
                      )}
                    </div>

                    {/* Metric grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        { label: "Daily Sessions", value: selectedCat.metrics.dailySessions.toLocaleString(), sub: "avg 7d" },
                        { label: "Weekly Buyers", value: selectedCat.metrics.weeklyUniqueBuyers.toLocaleString(), sub: "unique" },
                        { label: "Avg Basket", value: `$${selectedCat.metrics.avgBasketSize.toFixed(2)}`, sub: "per order" },
                        { label: "Purchase Freq.", value: `${selectedCat.metrics.purchaseFrequency}×/mo`, sub: "per shopper" },
                        { label: "Ad Attribution", value: `${selectedCat.metrics.adAttributionRate}%`, sub: "of purchases" },
                        { label: "Repeat Rate", value: `${(selectedCat.metrics.repeatPurchaseRate * 100).toFixed(0)}%`, sub: "30-day" },
                        { label: "eCPM", value: `$${selectedCat.metrics.effectiveCpm.toFixed(2)}`, sub: `${selectedCat.metrics.cpmPremiumMultiplier.toFixed(1)}× vs ROS` },
                        { label: "Bounce Rate", value: `${selectedCat.metrics.bounceRate.toFixed(1)}%`, sub: "category pg" },
                        { label: "Avg Reorder", value: `${selectedCat.metrics.avgTimeBetweenPurchases}d`, sub: "between purchases" },
                      ].map((m) => (
                        <div key={m.label} className="p-3 bg-stone-800/50 rounded-lg">
                          <div className="text-xs text-stone-400 mb-1">{m.label}</div>
                          <div className="text-base font-semibold text-stone-100">{m.value}</div>
                          <div className="text-xs text-stone-500">{m.sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* 7-day trend */}
                    <div>
                      <div className="text-xs font-medium text-stone-400 mb-2">Session trend — last 7 days</div>
                      <SparkBar values={selectedCat.sessionsTrend} color={selectedCat.color} />
                      <div className="flex justify-between text-xs text-stone-500 mt-1">
                        <span>6d ago</span>
                        <span>Today</span>
                      </div>
                    </div>

                    {/* Pitch callout */}
                    <div className="p-3 bg-teal-950/40 border border-teal-800/40 rounded-lg">
                      <div className="text-xs font-semibold text-teal-300 mb-1">Tyler&apos;s pitch angle</div>
                      <div className="text-xs text-teal-200/80">
                        {selectedCat.metrics.purchaseFrequency >= 3
                          ? `High repeat-purchase category (${selectedCat.metrics.purchaseFrequency}×/mo) — advertisers in ${selectedCat.name} capture shoppers during habitual buying cycles, not just impulse searches.`
                          : selectedCat.metrics.avgBasketSize >= 50
                          ? `High basket-size category ($${selectedCat.metrics.avgBasketSize.toFixed(0)} avg order) — premium shoppers. ${selectedCat.name} ads reach buyers with demonstrated willingness to spend.`
                          : selectedCat.metrics.adAttributionRate >= 25
                          ? `${selectedCat.metrics.adAttributionRate}% of ${selectedCat.name} purchases show ad exposure — strong attribution signal for ROAS reporting.`
                          : `${selectedCat.name} drives ${selectedCat.metrics.dailySessions.toLocaleString()} sessions/day with ${selectedCat.metrics.repeatPurchaseRate * 100 | 0}% repeat-purchase rate — captive, returning audience.`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-10 flex items-center justify-center text-stone-500 text-sm">
                    Select a category to see detailed insights
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SEGMENTS TAB */}
        {activeTab === "segments" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Segment list */}
            <div className="lg:col-span-1 space-y-3">
              {data.segments.map((seg) => {
                const isSelected = selectedSegment === seg.id;
                return (
                  <button
                    key={seg.id}
                    onClick={() => setSelectedSegment(isSelected ? null : seg.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-stone-800 border-teal-600/60"
                        : "bg-stone-900/50 border-stone-800 hover:border-stone-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-stone-200">{seg.name}</span>
                      <span className="text-xs text-stone-400">{seg.metrics.totalShoppers.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-400">eCPM ${seg.metrics.effectiveCpm.toFixed(2)}</span>
                      <span className="text-stone-400">{seg.metrics.adResponseRate}% ad resp.</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-stone-700 rounded-full">
                      <div
                        className="h-full rounded-full bg-teal-500"
                        style={{ width: `${Math.min(100, (seg.metrics.totalShoppers / 30000) * 100)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Segment detail */}
            <div className="lg:col-span-2">
              {selectedSeg ? (
                <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-100">{selectedSeg.name}</h2>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {selectedSeg.keywords.map((kw) => (
                        <span key={kw} className="text-xs px-2 py-0.5 bg-stone-800 text-stone-300 border border-stone-700 rounded-full">
                          {kw}
                        </span>
                      ))}
                      {selectedSeg.keywords.length === 0 && (
                        <span className="text-xs text-stone-500 italic">General / uncategorized</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: "Segment Size", value: selectedSeg.metrics.totalShoppers.toLocaleString() },
                      { label: "Avg Order Value", value: `$${selectedSeg.metrics.avgOrderValue.toFixed(2)}` },
                      { label: "90-Day LTV", value: `$${selectedSeg.metrics.ltv90d.toFixed(2)}` },
                      { label: "Ad Response Rate", value: `${selectedSeg.metrics.adResponseRate}%` },
                      { label: "CPM Multiplier", value: `${selectedSeg.metrics.cpmMultiplier.toFixed(2)}×` },
                      { label: "eCPM", value: `$${selectedSeg.metrics.effectiveCpm.toFixed(2)}` },
                      { label: "Monthly Active", value: `${(selectedSeg.metrics.monthlyActiveRate * 100).toFixed(0)}%` },
                      { label: "Sessions/Month", value: selectedSeg.metrics.avgSessionsPerMonth.toFixed(1) },
                    ].map((m) => (
                      <div key={m.label} className="p-3 bg-stone-800/50 rounded-lg">
                        <div className="text-xs text-stone-400 mb-1">{m.label}</div>
                        <div className="text-base font-semibold text-stone-100">{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Category affinity */}
                  <div>
                    <div className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Category Affinity</div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {data.categories.map((cat) => (
                        <div key={cat.slug} className="flex items-center gap-2">
                          <span className="text-sm w-5">{cat.icon}</span>
                          <span className="text-xs text-stone-400 w-24 truncate">{cat.name}</span>
                          <div className="flex-1">
                            <AffinityBar
                              value={selectedSeg.categoryAffinity[cat.slug] || 0}
                              color={selectedSeg.color}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advertiser fit */}
                  <div className="p-3 bg-teal-950/40 border border-teal-800/40 rounded-lg">
                    <div className="text-xs font-semibold text-teal-300 mb-1">Best advertiser fit</div>
                    <div className="text-xs text-teal-200/80">
                      {selectedSeg.metrics.cpmMultiplier >= 2.0
                        ? `Premium segment — ${selectedSeg.metrics.cpmMultiplier.toFixed(1)}× CPM multiplier justifies Contextual Commerce or Full-Funnel packages. Lead with LTV ($${selectedSeg.metrics.ltv90d.toFixed(0)} 90d) and basket correlation data.`
                        : selectedSeg.metrics.adResponseRate >= 15
                        ? `High ad response rate (${selectedSeg.metrics.adResponseRate}%) — strong retargeting candidate. Pair with post-purchase MRec placements and sponsored brand pages.`
                        : `Broad awareness play — ${selectedSeg.metrics.totalShoppers.toLocaleString()} shoppers, $${selectedSeg.metrics.avgOrderValue.toFixed(0)} AOV. Best fit for Awareness Starter package with billboard format.`}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-10 flex items-center justify-center text-stone-500 text-sm">
                  Select a segment to see detailed metrics and category affinity
                </div>
              )}
            </div>
          </div>
        )}

        {/* TIMING TAB */}
        {activeTab === "timing" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-stone-200 mb-1">Purchase Time-of-Day Distribution</h2>
                <p className="text-xs text-stone-400">When FoodTrove shoppers complete purchases — 24h, normalized</p>
              </div>
              <HourlyHeatmap pattern={data.hourlyPattern} />
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: "Morning Peak", time: "7–9am", desc: "Pre-work / commute browsing" },
                  { label: "Lunch Window", time: "11am–1pm", desc: "Lunchtime meal planning" },
                  { label: "Evening Peak", time: "5–8pm", desc: "Dinner prep decision moment" },
                ].map((p) => (
                  <div key={p.label} className="p-3 bg-stone-800/50 rounded-lg">
                    <div className="text-xs font-semibold text-stone-200">{p.label}</div>
                    <div className="text-xs text-teal-400 mt-0.5">{p.time}</div>
                    <div className="text-xs text-stone-400 mt-1">{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* Device split */}
              <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-stone-200 mb-4">Device Split</h2>
                <div className="space-y-3">
                  {[
                    { label: "Mobile", value: data.deviceSplit.mobile, color: "bg-emerald-500" },
                    { label: "Desktop", value: data.deviceSplit.desktop, color: "bg-blue-500" },
                    { label: "Tablet", value: data.deviceSplit.tablet, color: "bg-violet-500" },
                  ].map((d) => (
                    <div key={d.label}>
                      <div className="flex justify-between text-xs text-stone-400 mb-1">
                        <span>{d.label}</span>
                        <span>{(d.value * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-stone-800 rounded-full">
                        <div
                          className={`h-full rounded-full ${d.color}`}
                          style={{ width: `${d.value * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-stone-800/50 rounded-lg">
                  <div className="text-xs text-stone-400">
                    <strong className="text-stone-200">Ad format implications:</strong> {(data.deviceSplit.mobile * 100).toFixed(0)}% mobile → MRec (300×250) and leaderboard (728×90 responsive) formats outperform billboard on mobile. Contextual targeting performs equally across devices.
                  </div>
                </div>
              </div>

              {/* Timing pitch */}
              <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-stone-200 mb-3">Timing Advantage for Advertisers</h2>
                <div className="space-y-3 text-xs text-stone-400">
                  <p>FoodTrove shoppers have three distinct high-intent windows during the day. Unlike open-web DSP targeting, FoodTrove ad decisioning runs at the moment of category browse — not post-session retargeting.</p>
                  <p className="text-stone-300">Dinner prep peak (5–8pm) is the highest-value window for produce, dairy, and meat advertisers — shoppers are making same-day purchase decisions, not researching for next week.</p>
                  <p>CPM timing premiums are available for advertisers wanting time-of-day weighting. Flag as roadmap item for Tyler&apos;s next pitch refresh.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BASKET PATTERNS TAB */}
        {activeTab === "baskets" && (
          <div className="space-y-5">
            <div className="p-4 bg-stone-900/50 border border-stone-800 rounded-xl">
              <h2 className="text-sm font-semibold text-stone-200 mb-1">Cross-Category Purchase Patterns</h2>
              <p className="text-xs text-stone-400">When a shopper buys from a primary category, what else do they buy in the same session? Enables cross-category advertiser targeting recommendations.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.basketPatterns.map((bp) => {
                const primaryCat = data.categories.find((c) => c.slug === bp.primary);
                if (!primaryCat) return null;
                return (
                  <div key={bp.primary} className="bg-stone-900/50 border border-stone-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{primaryCat.icon}</span>
                      <div>
                        <div className="text-sm font-semibold text-stone-200">{primaryCat.name}</div>
                        <div className="text-xs text-stone-400">Primary category</div>
                      </div>
                    </div>
                    <div className="text-xs text-stone-400 mb-2">Co-purchased in same basket ({(bp.rate * 100).toFixed(0)}% of sessions):</div>
                    <div className="space-y-1.5">
                      {bp.co_purchase.map((coSlug) => {
                        const coCat = data.categories.find((c) => c.slug === coSlug);
                        if (!coCat) return null;
                        return (
                          <div key={coSlug} className="flex items-center gap-2 text-xs">
                            <span>{coCat.icon}</span>
                            <span className="text-stone-300">{coCat.name}</span>
                            {coCat.hasActiveAdvertiser && (
                              <span className="ml-auto text-emerald-400 font-medium">Covered ✓</span>
                            )}
                            {!coCat.hasActiveAdvertiser && (
                              <span className="ml-auto text-amber-400">Gap</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Advertiser opportunity */}
                    {primaryCat.advertisers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-stone-800 text-xs text-stone-400">
                        <span className="text-teal-400">{primaryCat.advertisers[0]}</span> could expand to{" "}
                        {bp.co_purchase.filter((s) => {
                          const c = data.categories.find((cat) => cat.slug === s);
                          return c && !c.hasActiveAdvertiser;
                        }).map((s) => {
                          const c = data.categories.find((cat) => cat.slug === s);
                          return c?.name;
                        }).filter(Boolean).join(", ") || "all co-purchase categories are covered"} — cross-category targeting pitch.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cross-category strategy note */}
            <div className="p-4 bg-teal-950/40 border border-teal-800/40 rounded-xl">
              <div className="text-sm font-semibold text-teal-300 mb-2">Cross-category targeting — advertiser pitch angle</div>
              <div className="text-xs text-teal-200/80 space-y-1">
                <p>Basket co-purchase data is FoodTrove&apos;s strongest 1P signal advantage. An Earthbound Farm advertiser on produce pages should also consider targeting dairy pages — produce+dairy is the #1 co-purchase pair on the network.</p>
                <p>This data feeds directly into the Advertiser Onboarding Wizard&apos;s contextual keyword recommendations and the Audience Segments keyword routing map.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

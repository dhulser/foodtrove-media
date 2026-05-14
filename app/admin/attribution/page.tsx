/**
 * /admin/attribution — Multi-Touch Attribution Dashboard
 *
 * Shows how ad impressions contribute to purchases across the full shopper journey.
 * Four attribution models compared side-by-side: first-touch, last-touch, linear, time-decay.
 * Journey path analysis, latency distribution, and cross-sell attribution.
 *
 * Primary audience: Casey (measurement accuracy), Tyler (ROAS conversations), Diana (board)
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface JourneyStep {
  type: string;
  label: string;
  touchpoint: boolean;
  adFormat?: string;
}

interface JourneyPath {
  id: string;
  steps: JourneyStep[];
  conversions: number;
  revenue: number;
  avgOrderValue: number;
  touchpointCount: number;
  hasClick: boolean;
  conversionRate: number;
  avgTimeToPurchaseDays: number;
}

interface AdvertiserModel {
  advertiser: string;
  advertiserId: string;
  color: string;
  colorClass: string;
  contextual: boolean;
  conversions: number;
  revenue: number;
  adSpend: number;
  roas: number;
  avgTouchpointsPerConversion: number;
  models: {
    firstTouch: { attributedRevenue: number; pct: number; roas: number };
    lastTouch: { attributedRevenue: number; pct: number; roas: number };
    linear: { attributedRevenue: number; pct: number; roas: number };
    timeDecay: { attributedRevenue: number; pct: number; roas: number };
  };
  topConvertingFormats: Array<{ format: string; conversions: number }>;
}

interface AttributionData {
  meta: {
    period: string;
    attributionPolicy: {
      clickThrough: string;
      viewThrough: string;
      crossSell: string;
      deduplication: string;
    };
  };
  summary: {
    totalConversions: number;
    totalRevenue: number;
    avgOrderValue: number;
    avgTouchpointsPerConversion: number;
    clickThroughPct: number;
    viewThroughPct: number;
    crossSellAttribution: {
      totalCrossSellConversions: number;
      crossSellRevenue: number;
      avgCrossSellAOV: number;
      windowDays: number;
      topPairs: Array<{ trigger: string; crossSell: string; conversions: number }>;
    };
  };
  advertiserModels: AdvertiserModel[];
  journeyPaths: JourneyPath[];
  latencyBuckets: Array<{ label: string; pct: number }>;
  attributionWindows: Array<{
    window: string;
    conversions: number;
    revenue: number;
    type: string;
    active: boolean;
  }>;
  formatAttribution: Array<{
    format: string;
    formatId: string;
    firstTouchPct: number;
    lastTouchPct: number;
    linearPct: number;
    conversions: number;
    avgTouchPosition: number;
    icon: string;
  }>;
}

// ── Helper components ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent = "emerald",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <div className={`rounded-xl p-4 ${colors[accent] || colors.emerald}`}>
      <div className="text-xs font-medium opacity-70 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
}

function ModelBar({
  pct,
  color,
  label,
}: {
  pct: number;
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="w-20 text-stone-500 truncate">{label}</div>
      <div className="flex-1 bg-stone-100 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-10 text-right font-medium text-stone-700">{pct}%</div>
    </div>
  );
}

type ModelKey = "firstTouch" | "lastTouch" | "linear" | "timeDecay";

const MODEL_META: Record<ModelKey, { label: string; description: string; color: string }> = {
  firstTouch: {
    label: "First Touch",
    description: "100% credit to the first ad exposure. Best for awareness campaigns.",
    color: "#f59e0b",
  },
  lastTouch: {
    label: "Last Touch",
    description: "100% credit to the last ad before purchase. Default for direct-response.",
    color: "#ef4444",
  },
  linear: {
    label: "Linear",
    description: "Equal credit across all touchpoints. Fair for multi-format campaigns.",
    color: "#3b82f6",
  },
  timeDecay: {
    label: "Time Decay",
    description: "More credit to recent touchpoints. Balanced for subscription-type buyers.",
    color: "#8b5cf6",
  },
};

function JourneyPathViz({ path }: { path: JourneyPath }) {
  const [expanded, setExpanded] = useState(false);

  const formatIcon: Record<string, string> = {
    billboard_view: "📢",
    leaderboard_view: "📊",
    mrec_view: "🎯",
    search_sponsored: "🔍",
    dept_page: "🏪",
    pdp_view: "📦",
    cart_add: "🛒",
    checkout: "💳",
    purchase: "✅",
  };

  return (
    <div
      className="bg-white border border-stone-200 rounded-xl p-4 cursor-pointer hover:border-stone-300 transition-all"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 overflow-hidden">
            {path.steps.slice(0, expanded ? 99 : 6).map((step, i) => (
              <div key={i} className="flex items-center gap-0.5">
                {i > 0 && <span className="text-stone-300 text-xs">→</span>}
                <span
                  className={`text-sm ${step.touchpoint ? "opacity-100" : "opacity-40"}`}
                  title={step.label}
                >
                  {formatIcon[step.type] || "•"}
                </span>
              </div>
            ))}
            {!expanded && path.steps.length > 6 && (
              <span className="text-xs text-stone-400 ml-1">+{path.steps.length - 6} more</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {path.hasClick && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                Click
              </span>
            )}
            <span className="px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded text-xs">
              {path.touchpointCount} ad{path.touchpointCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-stone-600 shrink-0 ml-2">
          <div className="text-right">
            <div className="font-semibold text-stone-800">{path.conversions.toLocaleString()}</div>
            <div className="text-xs text-stone-400">conversions</div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-stone-800">${path.revenue.toLocaleString()}</div>
            <div className="text-xs text-stone-400">revenue</div>
          </div>
          <div className="text-right hidden md:block">
            <div className="font-semibold text-stone-800">{path.avgTimeToPurchaseDays}d</div>
            <div className="text-xs text-stone-400">avg latency</div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-stone-100">
          <div className="flex flex-wrap gap-1.5">
            {path.steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                  step.touchpoint
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-stone-50 text-stone-500 border border-stone-200"
                }`}
              >
                <span>{formatIcon[step.type] || "•"}</span>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-stone-500 flex gap-4">
            <span>Conversion rate: {path.conversionRate}%</span>
            <span>Avg AOV: ${path.avgOrderValue}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AttributionPage() {
  const [data, setData] = useState<AttributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<ModelKey>("lastTouch");
  const [activeTab, setActiveTab] = useState<"overview" | "journeys" | "models" | "latency">(
    "overview"
  );

  useEffect(() => {
    fetch("/api/admin/attribution")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400 text-sm">Loading attribution data…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-red-500 text-sm">Error loading data: {error}</div>
      </div>
    );
  }

  const { summary, advertiserModels, journeyPaths, latencyBuckets, attributionWindows, formatAttribution } = data;

  const maxLatencyPct = Math.max(...latencyBuckets.map((b) => b.pct));

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-600 rounded-xl">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Multi-Touch Attribution</h1>
                <p className="text-sm text-stone-400">
                  Shopper journey · model comparison · conversion paths · {data.meta.period}
                </p>
              </div>
            </div>
            <Link
              href="/admin"
              className="text-sm text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Admin Hub
            </Link>
          </div>

          {/* Policy banner */}
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex flex-wrap gap-4 text-xs text-purple-800">
              <span>
                <strong>Click-through window:</strong> {data.meta.attributionPolicy.clickThrough}
              </span>
              <span>
                <strong>View-through window:</strong> {data.meta.attributionPolicy.viewThrough}
              </span>
              <span>
                <strong>Cross-sell window:</strong> {data.meta.attributionPolicy.crossSell}
              </span>
              <span>
                <strong>Dedup:</strong> {data.meta.attributionPolicy.deduplication}
              </span>
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 border-t border-stone-100 pt-0">
            {(
              [
                { key: "overview", label: "Overview" },
                { key: "journeys", label: "Journey Paths" },
                { key: "models", label: "Model Comparison" },
                { key: "latency", label: "Latency & Windows" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? "border-purple-500 text-purple-700"
                    : "border-transparent text-stone-500 hover:text-stone-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <>
            {/* KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Attributed Conversions"
                value={summary.totalConversions.toLocaleString()}
                sub="Last 30 days"
                accent="purple"
              />
              <StatCard
                label="Total Attributed Revenue"
                value={`$${(summary.totalRevenue / 1000).toFixed(1)}K`}
                sub="Across all advertisers"
                accent="blue"
              />
              <StatCard
                label="Avg Order Value"
                value={`$${summary.avgOrderValue.toFixed(2)}`}
                sub="Attributed conversions"
                accent="emerald"
              />
              <StatCard
                label="Avg Touchpoints / Conversion"
                value={summary.avgTouchpointsPerConversion.toFixed(1)}
                sub={`${summary.clickThroughPct}% have a click`}
                accent="amber"
              />
            </div>

            {/* Attribution by format */}
            <div>
              <h2 className="text-base font-semibold text-stone-800 mb-4">Attribution by Ad Format</h2>
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                        Format
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider">
                        Conversions
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:table-cell">
                        Avg Touch Position
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-amber-600 uppercase tracking-wider">
                        First Touch
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-red-600 uppercase tracking-wider">
                        Last Touch
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-blue-600 uppercase tracking-wider">
                        Linear
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {formatAttribution.map((f) => (
                      <tr key={f.formatId} className="hover:bg-stone-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{f.icon}</span>
                            <span className="font-medium text-stone-800">{f.format}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-stone-700">
                          {f.conversions.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-stone-500 hidden md:table-cell">
                          #{f.avgTouchPosition}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 bg-stone-100 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-amber-400"
                                style={{ width: `${f.firstTouchPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-amber-700 font-medium w-8">{f.firstTouchPct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 bg-stone-100 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-red-400"
                                style={{ width: `${f.lastTouchPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-red-700 font-medium w-8">{f.lastTouchPct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 bg-stone-100 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-blue-400"
                                style={{ width: `${f.linearPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-blue-700 font-medium w-8">{f.linearPct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-500">
                  % = share of conversions where this format received credit under each model. Billboard is the primary awareness driver (high first-touch); MRec and Search close the loop (high last-touch).
                </div>
              </div>
            </div>

            {/* Cross-sell attribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-stone-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-stone-800 mb-3">
                  Post-Purchase Cross-Sell Attribution
                </h3>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Cross-sell conversions</span>
                    <span className="font-semibold text-stone-800">
                      {summary.crossSellAttribution.totalCrossSellConversions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Cross-sell revenue</span>
                    <span className="font-semibold text-stone-800">
                      ${summary.crossSellAttribution.crossSellRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Avg cross-sell AOV</span>
                    <span className="font-semibold text-stone-800">
                      ${summary.crossSellAttribution.avgCrossSellAOV}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Attribution window</span>
                    <span className="font-semibold text-stone-800">
                      {summary.crossSellAttribution.windowDays} days post-purchase
                    </span>
                  </div>
                </div>
                <div className="border-t border-stone-100 pt-3">
                  <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                    Top Cross-Sell Pairs
                  </div>
                  <div className="space-y-2">
                    {summary.crossSellAttribution.topPairs.map((pair, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="text-stone-600">
                          {pair.trigger} → <strong>{pair.crossSell}</strong>
                        </div>
                        <span className="font-medium text-stone-800 ml-2">{pair.conversions}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Click vs view-through breakdown */}
              <div className="bg-white border border-stone-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-stone-800 mb-3">
                  Click-Through vs View-Through Split
                </h3>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {summary.clickThroughPct}%
                    </div>
                    <div className="text-xs text-blue-600 mt-1">Click-through</div>
                    <div className="text-xs text-stone-500 mt-0.5">Direct intent signal</div>
                  </div>
                  <div className="flex-1 bg-violet-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-violet-700">
                      {summary.viewThroughPct}%
                    </div>
                    <div className="text-xs text-violet-600 mt-1">View-through</div>
                    <div className="text-xs text-stone-500 mt-0.5">Awareness credit (1-day window)</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {attributionWindows.map((w, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                        w.active ? "bg-emerald-50 border border-emerald-200" : "bg-stone-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {w.active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        )}
                        <span className={w.active ? "font-medium text-stone-800" : "text-stone-500"}>
                          {w.window}
                        </span>
                        {w.active && (
                          <span className="px-1 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 text-stone-600">
                        <span>{w.conversions.toLocaleString()} conv</span>
                        <span>${w.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── JOURNEY PATHS TAB ── */}
        {activeTab === "journeys" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-stone-800">Top Conversion Paths</h2>
              <div className="text-xs text-stone-500 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="text-sm opacity-100">📢</span> Ad touchpoint
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-sm opacity-40">🏪</span> Organic step
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {journeyPaths.map((path) => (
                <JourneyPathViz key={path.id} path={path} />
              ))}
            </div>
            <div className="mt-4 p-3 bg-stone-100 rounded-lg text-xs text-stone-500">
              Click a path to expand the full step sequence. Opaque icons = ad touchpoints; faded = organic steps.
              Paths are ranked by conversion volume. Avg latency = time from first impression to purchase.
            </div>
          </div>
        )}

        {/* ── MODEL COMPARISON TAB ── */}
        {activeTab === "models" && (
          <div className="space-y-6">
            {/* Model selector */}
            <div>
              <h2 className="text-base font-semibold text-stone-800 mb-3">
                Choose Attribution Model
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(Object.keys(MODEL_META) as ModelKey[]).map((key) => {
                  const m = MODEL_META[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveModel(key)}
                      className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        activeModel === key
                          ? "border-purple-500 bg-purple-50"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <div
                        className="text-sm font-semibold mb-1"
                        style={{ color: m.color }}
                      >
                        {m.label}
                      </div>
                      <div className="text-xs text-stone-500 leading-relaxed">{m.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Per-advertiser model results */}
            <div>
              <h2 className="text-base font-semibold text-stone-800 mb-4">
                Advertiser Results — {MODEL_META[activeModel].label} Model
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {advertiserModels.map((adv) => {
                  const modelData = adv.models[activeModel];
                  return (
                    <div
                      key={adv.advertiserId}
                      className="bg-white border border-stone-200 rounded-xl p-5"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="font-semibold text-stone-900">{adv.advertiser}</div>
                          {adv.contextual && (
                            <span className="text-xs text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                              Contextual
                            </span>
                          )}
                        </div>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: adv.color }}
                        />
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-500">Attributed revenue</span>
                          <span className="font-semibold text-stone-800">
                            ${modelData.attributedRevenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-500">Attribution %</span>
                          <span className="font-semibold" style={{ color: MODEL_META[activeModel].color }}>
                            {modelData.pct}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-500">ROAS ({MODEL_META[activeModel].label})</span>
                          <span className="font-semibold text-stone-800">{modelData.roas}×</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-500">Total conversions</span>
                          <span className="font-semibold text-stone-800">
                            {adv.conversions.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-500">Avg touchpoints</span>
                          <span className="font-semibold text-stone-800">
                            {adv.avgTouchpointsPerConversion}
                          </span>
                        </div>
                      </div>

                      {/* Model comparison bars */}
                      <div className="border-t border-stone-100 pt-3 space-y-2">
                        <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                          All models
                        </div>
                        {(Object.keys(MODEL_META) as ModelKey[]).map((mk) => (
                          <ModelBar
                            key={mk}
                            label={MODEL_META[mk].label}
                            pct={adv.models[mk].pct}
                            color={mk === activeModel ? MODEL_META[mk].color : "#d1d5db"}
                          />
                        ))}
                      </div>

                      {/* Top converting formats */}
                      <div className="border-t border-stone-100 pt-3 mt-3">
                        <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
                          Top converting formats
                        </div>
                        {adv.topConvertingFormats.slice(0, 3).map((f) => (
                          <div key={f.format} className="flex justify-between text-xs text-stone-600 py-0.5">
                            <span className="capitalize">{f.format}</span>
                            <span className="font-medium">{f.conversions} conv</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Model selection guidance */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-800">
              <strong>Model selection guidance for FoodTrove:</strong> Last-touch is the default for
              direct-response billing and ROAS conversations with advertisers. Linear is recommended for
              multi-format campaigns (all three advertisers use 3 formats) where you want to value
              the awareness and consideration journey equally. Time-decay is best for high-frequency
              grocery buyers (weekly purchases mean recency matters). First-touch is Tyler&apos;s story
              for new advertiser onboarding — it shows the billboard as the awareness catalyst.
            </div>
          </div>
        )}

        {/* ── LATENCY & WINDOWS TAB ── */}
        {activeTab === "latency" && (
          <div className="space-y-6">
            {/* Latency distribution */}
            <div className="bg-white border border-stone-200 rounded-xl p-6">
              <h2 className="text-base font-semibold text-stone-800 mb-4">
                Time-to-Conversion Distribution
              </h2>
              <p className="text-sm text-stone-500 mb-6">
                How long after the first ad impression does a shopper complete a purchase?
              </p>
              <div className="space-y-3">
                {latencyBuckets.map((bucket) => (
                  <div key={bucket.label} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-stone-600 text-right">{bucket.label}</div>
                    <div className="flex-1 bg-stone-100 rounded-full h-6 relative">
                      <div
                        className="absolute inset-y-0 left-0 bg-purple-500 rounded-full transition-all flex items-center justify-end pr-2"
                        style={{ width: `${(bucket.pct / maxLatencyPct) * 100}%` }}
                      >
                        {(bucket.pct / maxLatencyPct) > 0.3 && (
                          <span className="text-xs font-semibold text-white">{bucket.pct}%</span>
                        )}
                      </div>
                      {(bucket.pct / maxLatencyPct) <= 0.3 && (
                        <span className="absolute left-full ml-2 text-xs font-medium text-stone-700">
                          {bucket.pct}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-3 bg-stone-50 rounded-lg text-xs text-stone-600">
                <strong>Implication:</strong> {latencyBuckets[0].pct + (latencyBuckets[1]?.pct ?? 0)}% of conversions happen within 1 day of first impression.
                The 30-day click-through window captures the full long-tail of grocery purchase cycles.
                View-through credit at 1 day is conservative — it only claims same-or-next-day purchases
                where ad recall is strong.
              </div>
            </div>

            {/* Attribution window comparison */}
            <div className="bg-white border border-stone-200 rounded-xl p-6">
              <h2 className="text-base font-semibold text-stone-800 mb-4">
                Attribution Window Scenarios
              </h2>
              <p className="text-sm text-stone-500 mb-4">
                How conversion count and revenue change with different window settings. Current active windows highlighted.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attributionWindows.map((w, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border-2 ${
                      w.active
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-stone-200 bg-white opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-sm font-semibold ${
                          w.type === "click" ? "text-blue-700" : "text-violet-700"
                        }`}
                      >
                        {w.window}
                      </span>
                      {w.active ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-500 text-xs rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xl font-bold text-stone-900">
                          {w.conversions.toLocaleString()}
                        </div>
                        <div className="text-xs text-stone-500">conversions</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-stone-900">
                          ${w.revenue.toLocaleString()}
                        </div>
                        <div className="text-xs text-stone-500">attributed revenue</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <strong>Window policy note:</strong> FoodTrove uses 30-day click-through (grocery purchase
                cycles are long) and 1-day view-through (conservative — avoids inflating impression credit
                in discrepancy reports). Changing to 7-day view-through would add{" "}
                ~{(attributionWindows.find(w => !w.active && w.type === "view")?.conversions ?? 0).toLocaleString()} conversions
                to the attribution pool but would increase 3P discrepancy risk.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

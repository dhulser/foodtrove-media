"use client";

/**
 * ContextualReportClient — Contextual Performance Report
 *
 * Fetches from /api/admin/reporting and renders:
 * 1. Summary KPI strip — total impressions, revenue, avg contextual lift vs. ROS
 * 2. Keyword performance table — sortable by impression/revenue/lift/CTR
 * 3. Advertiser context coverage — which advertisers target which keywords, CPM premium
 * 4. Format breakdown per keyword — billboard/leaderboard/MRec split
 */

import { useEffect, useState, useCallback } from "react";

// ---- Types ----
interface KeywordRow {
  keyword: string;
  label: string;
  department: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  conversionRate: number;
  contextualCPM: number;
  blendedCPM: number;
  rosCPM: number;
  liftPct: number;
  contextualFraction: number;
  targetingAdvertiserCount: number;
  targetingAdvertisers: string[];
  formatBreakdown: { billboard: number; leaderboard: number; mrec: number };
  trend7d: number[];
}

interface AdvertiserSummary {
  advertiserName: string;
  advertiserId: number;
  targetedKeywords: string[];
  keywordCount: number;
  contextImpressions: number;
  contextRevenue: number;
  contextualCPM: number;
  runOfSiteCPM: number;
  cpmPremium: number;
  contextualWinRate: number;
  color: string;
}

interface ReportSummary {
  totalImpressions: number;
  totalRevenue: number;
  totalClicks: number;
  totalConversions: number;
  avgBlendedCPM: number;
  rosCPMBaseline: number;
  avgContextualLiftPct: number;
  contextualImpressionShare: number;
  keywordCount: number;
  activeAdvertisers: number;
  topLiftKeyword: { keyword: string; liftPct: number } | null;
}

interface ReportData {
  summary: ReportSummary;
  keywords: KeywordRow[];
  advertisers: AdvertiserSummary[];
  generatedAt: string;
  period: string;
}

type SortKey = "revenue" | "impressions" | "liftPct" | "ctr" | "blendedCPM" | "conversions";

// ---- Helpers ----
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

function liftColor(pct: number): string {
  if (pct >= 50) return "text-emerald-700 bg-emerald-50";
  if (pct >= 25) return "text-blue-700 bg-blue-50";
  if (pct >= 10) return "text-amber-700 bg-amber-50";
  return "text-stone-500 bg-stone-100";
}

// Mini sparkline SVG
function Sparkline({ values }: { values: number[] }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 56;
  const h = 20;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h * 0.9;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="#6d28d9"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ADVERTISER_COLORS: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  green: "bg-green-100 text-green-800 border-green-200",
};

export default function ContextualReportClient() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [tab, setTab] = useState<"keywords" | "advertisers">("keywords");
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/reporting")
      .then((r) => r.json())
      .then((d: ReportData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [load]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-stone-400">Loading contextual report…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-red-500">Failed to load report data.</div>
      </div>
    );
  }

  const { summary, keywords, advertisers } = data;

  const sortedKeywords = [...keywords].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortDir === "desc" ? -diff : diff;
  });

  const SortHeader = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide cursor-pointer hover:text-stone-700 select-none"
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === col ? (
          <span className="text-violet-600">{sortDir === "desc" ? "↓" : "↑"}</span>
        ) : (
          <span className="text-stone-300">↕</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Lift callout banner */}
      {summary.topLiftKeyword && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-violet-900">
              Top contextual lift: {summary.topLiftKeyword.keyword}
            </span>
            <span className="text-sm text-violet-700 ml-2">
              +{summary.topLiftKeyword.liftPct}% CPM vs. run-of-site — use in new advertiser pitches
            </span>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "MTD Impressions", value: fmt(summary.totalImpressions), sub: `${summary.contextualImpressionShare}% contextual` },
          { label: "MTD Revenue", value: fmtMoney(summary.totalRevenue), sub: "net contextual" },
          { label: "Avg Blended CPM", value: `$${summary.avgBlendedCPM}`, sub: `vs $${summary.rosCPMBaseline} ROS` },
          { label: "Avg Contextual Lift", value: `+${summary.avgContextualLiftPct}%`, sub: "vs run-of-site" },
          { label: "Tracked Keywords", value: String(summary.keywordCount), sub: `${summary.activeAdvertisers} advertisers` },
          { label: "Clicks", value: fmt(summary.totalClicks), sub: `${fmt(summary.totalConversions)} conversions` },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-stone-400 font-medium mb-1">{kpi.label}</div>
            <div className="text-xl font-bold text-stone-900">{kpi.value}</div>
            <div className="text-xs text-stone-400 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 w-fit">
        {(["keywords", "advertisers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {t === "keywords" ? "Keywords" : "Advertiser Coverage"}
          </button>
        ))}
      </div>

      {/* Keywords tab */}
      {tab === "keywords" && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="text-sm font-semibold text-stone-700">Keyword Performance — MTD</h2>
            <p className="text-xs text-stone-400 mt-0.5">Click a row to see format breakdown. Sort by any column.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Keyword</th>
                  <SortHeader col="impressions" label="Impressions" />
                  <SortHeader col="revenue" label="Revenue" />
                  <SortHeader col="blendedCPM" label="Blended CPM" />
                  <SortHeader col="liftPct" label="Lift vs. ROS" />
                  <SortHeader col="ctr" label="CTR" />
                  <SortHeader col="conversions" label="Conversions" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">7-day trend</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Advertisers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {sortedKeywords.map((kw) => (
                  <>
                    <tr
                      key={kw.keyword}
                      className="hover:bg-stone-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedKeyword(expandedKeyword === kw.keyword ? null : kw.keyword)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-stone-900">{kw.label}</span>
                          <span className="text-xs text-stone-400">{kw.department}</span>
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5">
                          {kw.contextualFraction}% contextual
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stone-700 font-medium">{fmt(kw.impressions)}</td>
                      <td className="px-4 py-3 text-stone-700 font-medium">{fmtMoney(kw.revenue)}</td>
                      <td className="px-4 py-3">
                        <div className="text-stone-700 font-medium">${kw.blendedCPM.toFixed(2)}</div>
                        <div className="text-xs text-stone-400">ctx: ${kw.contextualCPM.toFixed(2)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${liftColor(kw.liftPct)}`}>
                          +{kw.liftPct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-600">{kw.ctr.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-stone-600">{fmt(kw.conversions)}</td>
                      <td className="px-4 py-3">
                        <Sparkline values={kw.trend7d} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {kw.targetingAdvertisers.map((name) => (
                            <span key={name} className="text-xs px-1.5 py-0.5 bg-violet-50 text-violet-700 rounded-md border border-violet-100">
                              {name.split(" ")[0]}
                            </span>
                          ))}
                          {kw.targetingAdvertiserCount === 0 && (
                            <span className="text-xs text-stone-400">ROS only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded format breakdown row */}
                    {expandedKeyword === kw.keyword && (
                      <tr key={`${kw.keyword}-expanded`} className="bg-violet-50/50">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="flex items-start gap-8">
                            <div>
                              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Format Breakdown</div>
                              <div className="flex gap-4">
                                {[
                                  { label: "Billboard", val: kw.formatBreakdown.billboard, color: "bg-blue-100 text-blue-800" },
                                  { label: "Leaderboard", val: kw.formatBreakdown.leaderboard, color: "bg-emerald-100 text-emerald-800" },
                                  { label: "MRec", val: kw.formatBreakdown.mrec, color: "bg-violet-100 text-violet-800" },
                                ].map((f) => (
                                  <div key={f.label} className={`px-3 py-2 rounded-lg ${f.color}`}>
                                    <div className="text-xs font-medium">{f.label}</div>
                                    <div className="text-lg font-bold">{fmt(f.val)}</div>
                                    <div className="text-xs opacity-75">
                                      {Math.round(f.val / kw.impressions * 100)}%
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">CPM Comparison</div>
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-28 text-xs text-stone-500">Contextual CPM</div>
                                  <div className="text-sm font-semibold text-emerald-700">${kw.contextualCPM.toFixed(2)}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-28 text-xs text-stone-500">Blended CPM</div>
                                  <div className="text-sm font-semibold text-stone-700">${kw.blendedCPM.toFixed(2)}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-28 text-xs text-stone-500">ROS baseline</div>
                                  <div className="text-sm font-semibold text-stone-400">${kw.rosCPM.toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Conversion Funnel</div>
                              <div className="space-y-1">
                                <div className="text-xs text-stone-500">{fmt(kw.impressions)} impressions</div>
                                <div className="text-xs text-stone-500">→ {fmt(kw.clicks)} clicks ({kw.ctr.toFixed(2)}% CTR)</div>
                                <div className="text-xs text-stone-500">→ {fmt(kw.conversions)} conversions ({kw.conversionRate.toFixed(2)}% CVR)</div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Advertisers tab */}
      {tab === "advertisers" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {advertisers.map((adv) => {
              const colorCls = ADVERTISER_COLORS[adv.color] || "bg-stone-100 text-stone-800 border-stone-200";
              return (
                <div key={adv.advertiserId} className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className={`px-5 py-4 border-b ${colorCls.replace("text-", "border-").replace("bg-", "border-").split(" ").filter(c => c.startsWith("border-")).join(" ")} bg-stone-50`}>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-stone-900">{adv.advertiserName}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colorCls}`}>
                        {adv.keywordCount} keywords
                      </span>
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-4">
                    {/* CPM metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-stone-50 rounded-xl px-3 py-2">
                        <div className="text-xs text-stone-400 mb-0.5">Contextual CPM</div>
                        <div className="text-lg font-bold text-stone-900">${adv.contextualCPM.toFixed(2)}</div>
                      </div>
                      <div className="bg-stone-50 rounded-xl px-3 py-2">
                        <div className="text-xs text-stone-400 mb-0.5">CPM Premium</div>
                        <div className="text-lg font-bold text-emerald-700">+{adv.cpmPremium.toFixed(1)}%</div>
                      </div>
                      <div className="bg-stone-50 rounded-xl px-3 py-2">
                        <div className="text-xs text-stone-400 mb-0.5">Context Impressions</div>
                        <div className="text-lg font-bold text-stone-900">{fmt(adv.contextImpressions)}</div>
                      </div>
                      <div className="bg-stone-50 rounded-xl px-3 py-2">
                        <div className="text-xs text-stone-400 mb-0.5">Context Revenue</div>
                        <div className="text-lg font-bold text-stone-900">{fmtMoney(adv.contextRevenue)}</div>
                      </div>
                    </div>

                    {/* Win rate */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-xs text-stone-500">Contextual win rate</div>
                        <div className="text-xs font-semibold text-stone-700">{adv.contextualWinRate.toFixed(1)}%</div>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${adv.contextualWinRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Targeted keywords */}
                    <div>
                      <div className="text-xs text-stone-400 font-medium mb-2">Targeted contexts</div>
                      <div className="flex flex-wrap gap-1.5">
                        {adv.targetedKeywords.map((kw) => (
                          <span key={kw} className="text-xs px-2 py-0.5 bg-violet-50 text-violet-700 rounded-md border border-violet-100 capitalize">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-stone-400 pt-1 border-t border-stone-100">
                      ROS baseline: ${adv.runOfSiteCPM.toFixed(2)} CPM
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Opportunity analysis */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-amber-900 mb-1">Untargeted high-value contexts</div>
                <div className="text-sm text-amber-800">
                  <span className="font-medium">Dairy, Bakery, Deli, Frozen, Snacks, Beverages</span> contexts currently have
                  no advertiser targeting — these serve ROS-rate ads at $4.20 CPM. A new advertiser in these
                  categories could capture these impressions at contextual CPM ($7–11 range based on adjacent categories).
                  Potential incremental monthly revenue: <span className="font-semibold">$4,200–$8,700</span>.
                </div>
                <div className="text-xs text-amber-700 mt-2">
                  Use the Rate Card and Forecast tools to build a proposal for new advertisers in these categories.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-stone-400 pb-4">
        <div>Generated: {data.generatedAt ? new Date(data.generatedAt).toLocaleString() : "—"} · Period: {data.period} · Kevel Network 12024</div>
        <div>5-min auto-refresh · Click any keyword row to expand format breakdown</div>
      </div>
    </div>
  );
}

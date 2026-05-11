"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Segment {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  behaviorSignals: string[];
  matchedKeywords: string[];
  shopperCount: number;
  avgBasketSize: number;
  purchaseFrequencyPerWeek: number;
  premiumCpmMultiplier: number;
  cpmFloor: number;
  conversionRate: number;
  retentionScore: number;
  topCategories: string[];
  topAdvertisers: string[];
  liveKeywords: string[];
  isLive: boolean;
  segment_value: string;
  note?: string;
}

interface KeywordRow {
  keyword: string;
  segments: string[];
  activeBidders: number;
  avgCpm: number;
  contextualLift: number;
  isLive: boolean;
}

interface AudiencesData {
  generatedAt: string;
  summary: {
    totalShoppers: number;
    totalSegments: number;
    liveSegments: number;
    premiumSegmentShare: number;
    avgPremiumCpmMultiplier: number;
    activeKeywords: number;
  };
  segments: Segment[];
  keywordTargetingMap: KeywordRow[];
  targetingStrategy: Record<string, string>;
}

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : `${n}`;
}

const SEGMENT_VALUE_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  premium: { bg: "bg-emerald-50", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  mass: { bg: "bg-blue-50", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
  value: { bg: "bg-amber-50", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  awareness: { bg: "bg-violet-50", text: "text-violet-700", badge: "bg-violet-100 text-violet-700" },
};

export default function AudiencesClient() {
  const [data, setData] = useState<AudiencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"segments" | "keywords" | "strategy">("segments");
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState<string>("all");

  useEffect(() => {
    fetch("/api/admin/audiences")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const interval = setInterval(() => {
      fetch("/api/admin/audiences")
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});
    }, 120000); // 2-min refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-sm">Loading audience data…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-red-500">Failed to load audience data</p>
      </div>
    );
  }

  const { summary, segments, keywordTargetingMap, targetingStrategy } = data;
  const filteredSegments = filterValue === "all" ? segments : segments.filter((s) => s.segment_value === filterValue);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-stone-400 hover:text-stone-600 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                <svg className="h-5 w-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Audience Segments</h1>
                <p className="text-sm text-stone-400">Shopper cohorts · Keyword targeting · CPM premium analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs text-stone-400">2-min refresh · {new Date(data.generatedAt).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI strip */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-stone-900">{fmt(summary.totalShoppers)}</div>
              <div className="text-xs text-stone-400">Total shoppers</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-stone-900">{summary.totalSegments}</div>
              <div className="text-xs text-stone-400">Segments</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-600">{summary.liveSegments}</div>
              <div className="text-xs text-stone-400">Live (ads serving)</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-stone-900">{summary.premiumSegmentShare}%</div>
              <div className="text-xs text-stone-400">Premium tier reach</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-stone-900">{summary.avgPremiumCpmMultiplier}×</div>
              <div className="text-xs text-stone-400">Avg premium CPM lift</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-stone-900">{summary.activeKeywords}</div>
              <div className="text-xs text-stone-400">Active keywords</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs + filters */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-sm">
            {(["segments", "keywords", "strategy"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  activeTab === tab
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {tab === "segments" ? "Shopper Segments" : tab === "keywords" ? "Keyword Map" : "Targeting Strategy"}
              </button>
            ))}
          </div>

          {activeTab === "segments" && (
            <div className="flex gap-2">
              {["all", "premium", "mass", "value", "awareness"].map((v) => (
                <button
                  key={v}
                  onClick={() => setFilterValue(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                    filterValue === v
                      ? "bg-stone-800 text-white"
                      : "bg-white border border-stone-200 text-stone-500 hover:border-stone-300"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Segments Tab */}
        {activeTab === "segments" && (
          <div className="space-y-4">
            {filteredSegments.map((seg) => {
              const colors = SEGMENT_VALUE_COLORS[seg.segment_value] || SEGMENT_VALUE_COLORS.mass;
              const isExpanded = expandedSegment === seg.id;

              return (
                <div
                  key={seg.id}
                  className="bg-white border border-stone-200 rounded-2xl shadow-sm hover:shadow-md transition-all"
                >
                  {/* Segment header row */}
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedSegment(isExpanded ? null : seg.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Status indicator */}
                        <div className="flex-shrink-0 mt-0.5">
                          {seg.isLive ? (
                            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" title="Ads currently serving to this segment" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-stone-300" title="No active ads targeting this segment" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-sm font-semibold text-stone-900">{seg.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                              {seg.segment_value}
                            </span>
                            {seg.isLive && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                Live
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 leading-relaxed">{seg.description}</p>
                          {seg.note && (
                            <p className="text-xs text-amber-600 mt-1 italic">{seg.note}</p>
                          )}
                        </div>
                      </div>

                      {/* Key metrics — right side */}
                      <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                        <div className="text-right">
                          <div className="text-base font-bold text-stone-900">{fmt(seg.shopperCount)}</div>
                          <div className="text-xs text-stone-400">Shoppers</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-stone-900">${seg.avgBasketSize.toFixed(0)}</div>
                          <div className="text-xs text-stone-400">Avg basket</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-base font-bold ${seg.premiumCpmMultiplier >= 1.3 ? "text-emerald-600" : seg.premiumCpmMultiplier >= 1.0 ? "text-stone-900" : "text-amber-600"}`}>
                            {seg.premiumCpmMultiplier >= 1.0 ? "+" : ""}{((seg.premiumCpmMultiplier - 1) * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-stone-400">CPM premium</div>
                        </div>
                        <div className="text-stone-300 ml-2">
                          {isExpanded ? "▲" : "▼"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-stone-100 px-6 pb-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                        <div className={`${colors.bg} rounded-xl p-4`}>
                          <div className={`text-lg font-bold ${colors.text}`}>${seg.cpmFloor.toFixed(2)}</div>
                          <div className="text-xs text-stone-500 mt-0.5">CPM floor</div>
                          <div className="text-xs text-stone-400">({seg.premiumCpmMultiplier}× base rate)</div>
                        </div>
                        <div className="bg-stone-50 rounded-xl p-4">
                          <div className="text-lg font-bold text-stone-900">{seg.conversionRate.toFixed(1)}%</div>
                          <div className="text-xs text-stone-400 mt-0.5">Conversion rate</div>
                        </div>
                        <div className="bg-stone-50 rounded-xl p-4">
                          <div className="text-lg font-bold text-stone-900">{seg.retentionScore}%</div>
                          <div className="text-xs text-stone-400 mt-0.5">30-day retention</div>
                        </div>
                        <div className="bg-stone-50 rounded-xl p-4">
                          <div className="text-lg font-bold text-stone-900">{seg.purchaseFrequencyPerWeek.toFixed(1)}×/wk</div>
                          <div className="text-xs text-stone-400 mt-0.5">Purchase frequency</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                        {/* Targeting keywords */}
                        <div>
                          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Kevel Keywords</div>
                          <div className="flex flex-wrap gap-1">
                            {seg.liveKeywords.length > 0 ? (
                              seg.liveKeywords.map((kw) => (
                                <span key={kw} className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 font-mono">
                                  {kw}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-stone-400 italic">No active keywords — segment not currently targeted</span>
                            )}
                          </div>
                        </div>

                        {/* Top categories */}
                        <div>
                          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Top Categories</div>
                          <div className="space-y-1">
                            {seg.topCategories.map((cat) => (
                              <div key={cat} className="text-xs text-stone-600 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                                {cat}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Active advertisers */}
                        <div>
                          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Active Advertisers</div>
                          {seg.topAdvertisers.length > 0 ? (
                            <div className="space-y-1">
                              {seg.topAdvertisers.map((adv) => (
                                <div key={adv} className="text-xs text-stone-600 flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  {adv}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-amber-600 italic">No active advertisers — opportunity</p>
                          )}
                        </div>
                      </div>

                      {/* Behavior signals */}
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Behavior Signals</div>
                        <div className="flex flex-wrap gap-1">
                          {seg.behaviorSignals.map((sig) => (
                            <span key={sig} className="px-2 py-0.5 bg-stone-100 rounded text-xs text-stone-600">{sig}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === "keywords" && (
          <div className="space-y-4">
            <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-stone-700">Kevel Keyword → Segment Routing Map</h2>
                <span className="text-xs text-stone-400">{keywordTargetingMap.filter((k) => k.isLive).length} active · {keywordTargetingMap.length} total</span>
              </div>
              <div className="divide-y divide-stone-50">
                {keywordTargetingMap.map((kw) => (
                  <div key={kw.keyword} className="px-6 py-4 flex items-center gap-4 hover:bg-stone-50 transition-colors">
                    <div className="flex-shrink-0">
                      {kw.isLive ? (
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-stone-300" />
                      )}
                    </div>
                    <div className="w-28 flex-shrink-0">
                      <span className="font-mono text-sm font-semibold text-stone-800 bg-stone-100 px-2 py-0.5 rounded">
                        {kw.keyword}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-wrap gap-1">
                      {kw.segments.map((seg) => {
                        const segData = segments.find((s) => s.id === seg);
                        const colors = SEGMENT_VALUE_COLORS[segData?.segment_value || "mass"];
                        return (
                          <span key={seg} className={`px-2 py-0.5 rounded text-xs font-medium ${colors.badge}`}>
                            {segData?.name || seg}
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 text-right">
                      <div>
                        <div className="text-sm font-semibold text-stone-900">${kw.avgCpm.toFixed(2)}</div>
                        <div className="text-xs text-stone-400">avg CPM</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-emerald-600">+{kw.contextualLift}%</div>
                        <div className="text-xs text-stone-400">CTX lift</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-stone-900">{kw.activeBidders}</div>
                        <div className="text-xs text-stone-400">bidders</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Strategy Tab */}
        {activeTab === "strategy" && (
          <div className="space-y-5">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-stone-700 mb-4">Targeting Architecture</h2>
              <div className="space-y-4">
                {Object.entries(targetingStrategy).map(([key, value]) => (
                  <div key={key} className="flex gap-4">
                    <div className="w-36 text-xs font-semibold text-stone-400 uppercase tracking-wide flex-shrink-0 pt-0.5">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    <div className="text-sm text-stone-700 flex-1">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-cyan-800 mb-3">Audience Gaps — Opportunity Pipeline</h3>
              <div className="space-y-3">
                {segments.filter((s) => !s.isLive || s.topAdvertisers.length === 0).map((seg) => (
                  <div key={seg.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-cyan-900">{seg.name}</span>
                      <span className="text-xs text-cyan-600 ml-2">({fmt(seg.shopperCount)} shoppers)</span>
                      <p className="text-xs text-cyan-700 mt-0.5">
                        {seg.isLive
                          ? "Segment live but under-monetized — room for more advertisers"
                          : "No active ads — potential new advertiser category"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-cyan-600 mt-4 italic">
                Surface these gaps in Tyler&apos;s prospect outreach — each untargeted segment represents incremental ad revenue.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

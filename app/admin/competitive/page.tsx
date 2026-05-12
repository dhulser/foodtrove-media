"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types matching the API response
// ---------------------------------------------------------------------------

interface Participant {
  advertiser: string;
  slug: string;
  wins: number;
  winRate: number;
  avgWinCpm: number;
  avgClearingCpm: number;
  cpmPremium: number;
  color: string;
}

interface FormatAuction {
  format: string;
  formatLabel: string;
  totalAuctions: number;
  participants: Participant[];
  networkFloor: number;
  networkAvgCpm: number;
  topContexts: string[];
  competitionIndex: number;
}

interface FormatBreakdown {
  format: string;
  formatLabel: string;
  wins: number;
  winRate: number;
  cpm: number;
  active: boolean;
}

interface SovEntry {
  advertiser: string;
  slug: string;
  color: string;
  category: string;
  contextualKeywords: string[];
  totalWins: number;
  totalAuctions: number;
  overallWinRate: number;
  overallShareOfVoice: number;
  avgCpm: number;
  cpmRank: number;
  formatBreakdown: FormatBreakdown[];
  competitiveStrengths: string[];
  vulnerabilities: string[];
}

interface ContextualSlot {
  keyword: string;
  label: string;
  competitors: Array<{ advertiser: string; color: string; winRate: number }>;
  avgCpm: number;
  cpmLiftVsRos: number;
  contestLevel: "low" | "medium" | "high";
}

interface CpmBenchmark {
  format: string;
  formatLabel: string;
  minCpm: number;
  maxCpm: number;
  avgCpm: number;
  cpmSpread: number;
  floor: number;
}

interface NetworkSummary {
  totalAdvertisers: number;
  totalActiveFlights: number;
  totalDailyAuctions: number;
  avgNetworkCpm: number;
  avgCompetitionIndex: number;
  mostContestedFormat: string;
  leastContestedContext: string[];
}

interface CompetitiveData {
  networkSummary: NetworkSummary;
  shareOfVoice: SovEntry[];
  formatAuctions: FormatAuction[];
  contextualMap: ContextualSlot[];
  cpmBenchmarks: CpmBenchmark[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function cpm(n: number) {
  return `$${n.toFixed(2)}`;
}

function ContestBadge({ level }: { level: "low" | "medium" | "high" }) {
  const styles = {
    low: "bg-stone-100 text-stone-500",
    medium: "bg-amber-50 text-amber-700 border border-amber-200",
    high: "bg-red-50 text-red-700 border border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[level]}`}>
      {level === "low" ? "Open" : level === "medium" ? "Contested" : "Competitive"}
    </span>
  );
}

// Bar component
function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pctWidth = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pctWidth}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Tab = "overview" | "formats" | "contextual" | "benchmarks";

export default function CompetitivePage() {
  const [data, setData] = useState<CompetitiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedFormat, setSelectedFormat] = useState<string>("billboard");

  useEffect(() => {
    fetch("/api/admin/competitive")
      .then((r) => r.json())
      .then((d) => {
        setData(d as CompetitiveData);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-400 text-sm">Loading competitive intelligence…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-red-400 text-sm">Error: {error ?? "No data"}</div>
      </div>
    );
  }

  const { networkSummary, shareOfVoice, formatAuctions, contextualMap, cpmBenchmarks } = data;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Share of Voice" },
    { id: "formats", label: "Format Analysis" },
    { id: "contextual", label: "Contextual Map" },
    { id: "benchmarks", label: "CPM Benchmarks" },
  ];

  const selectedAuction = formatAuctions.find((a) => a.format === selectedFormat);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <div className="border-b border-stone-800 bg-stone-900">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-stone-500 hover:text-stone-300 text-sm transition-colors">
                ← Admin
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-stone-100">Competitive Intelligence</h1>
                <p className="text-xs text-stone-500 mt-0.5">
                  Share of voice · CPM benchmarks · Contextual competition — Network 12024
                </p>
              </div>
            </div>
            <div className="text-xs text-stone-600">
              {new Date(data.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} refresh
            </div>
          </div>
        </div>
      </div>

      {/* Network summary KPI strip */}
      <div className="border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Active Advertisers", value: networkSummary.totalAdvertisers },
              { label: "Active Flights", value: networkSummary.totalActiveFlights },
              {
                label: "Daily Auctions",
                value: networkSummary.totalDailyAuctions.toLocaleString(),
              },
              { label: "Avg Network CPM", value: `$${networkSummary.avgNetworkCpm.toFixed(2)}` },
              {
                label: "Competition Index",
                value: `${networkSummary.avgCompetitionIndex}/100`,
              },
              { label: "Most Contested", value: networkSummary.mostContestedFormat, small: true },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-3">
                <div className={`font-bold text-stone-100 ${kpi.small ? "text-sm" : "text-xl"}`}>
                  {kpi.value}
                </div>
                <div className="text-xs text-stone-500 mt-0.5">{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-400"
                    : "border-transparent text-stone-500 hover:text-stone-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ================================================================
            TAB: Share of Voice Overview
        ================================================================ */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* SOV summary table */}
            <div>
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-widest mb-4">
                Share of Voice — All Formats
              </h2>
              <div className="space-y-4">
                {shareOfVoice.map((entry) => {
                  const sovPct = entry.overallShareOfVoice * 100;
                  return (
                    <div
                      key={entry.slug}
                      className="bg-stone-900 border border-stone-800 rounded-xl p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: entry.color }}
                          />
                          <div>
                            <div className="font-semibold text-stone-100">{entry.advertiser}</div>
                            <div className="text-xs text-stone-500">{entry.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold" style={{ color: entry.color }}>
                            {sovPct.toFixed(1)}%
                          </div>
                          <div className="text-xs text-stone-500">share of voice</div>
                        </div>
                      </div>

                      {/* SOV bar */}
                      <div className="mt-4">
                        <Bar value={entry.overallShareOfVoice} max={1} color={entry.color} />
                      </div>

                      {/* Stats row */}
                      <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
                        <div>
                          <div className="text-xs text-stone-500">Wins / day</div>
                          <div className="text-sm font-medium text-stone-200">
                            {entry.totalWins.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-stone-500">Win rate</div>
                          <div className="text-sm font-medium text-stone-200">
                            {pct(entry.overallWinRate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-stone-500">Avg CPM</div>
                          <div className="text-sm font-medium text-stone-200">
                            {cpm(entry.avgCpm)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-stone-500">CPM rank</div>
                          <div className="text-sm font-medium text-stone-200">
                            #{entry.cpmRank} of {shareOfVoice.length}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-stone-500">Active formats</div>
                          <div className="text-sm font-medium text-stone-200">
                            {entry.formatBreakdown.filter((f) => f.active).length} / 3
                          </div>
                        </div>
                      </div>

                      {/* Format badges */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {entry.formatBreakdown.map((fb) => (
                          <span
                            key={fb.format}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                              fb.active
                                ? "bg-stone-800 text-stone-300"
                                : "bg-stone-900 text-stone-600 border border-stone-800"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${fb.active ? "bg-emerald-400" : "bg-stone-600"}`}
                            />
                            {fb.formatLabel}
                            {fb.active && (
                              <span className="text-stone-400">{cpm(fb.cpm)}</span>
                            )}
                          </span>
                        ))}
                      </div>

                      {/* Strengths / vulnerabilities */}
                      {(entry.competitiveStrengths.length > 0 ||
                        entry.vulnerabilities.length > 0) && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {entry.competitiveStrengths.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-emerald-500 mb-1">
                                Strengths
                              </div>
                              <ul className="space-y-0.5">
                                {entry.competitiveStrengths.map((s) => (
                                  <li key={s} className="text-xs text-stone-400 flex items-start gap-1">
                                    <span className="text-emerald-500 mt-0.5">✓</span>
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {entry.vulnerabilities.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-amber-500 mb-1">
                                Gaps
                              </div>
                              <ul className="space-y-0.5">
                                {entry.vulnerabilities.map((v) => (
                                  <li key={v} className="text-xs text-stone-400 flex items-start gap-1">
                                    <span className="text-amber-500 mt-0.5">⚠</span>
                                    {v}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Contextual keywords */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {entry.contextualKeywords.map((kw) => (
                          <span
                            key={kw}
                            className="px-2 py-0.5 bg-stone-800 text-stone-400 text-xs rounded-full"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SOV donut-style summary */}
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-stone-300 mb-4">
                Impression Share by Advertiser
              </h3>
              <div className="space-y-3">
                {shareOfVoice.map((entry) => (
                  <div key={entry.slug} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-stone-400 text-right flex-shrink-0">
                      {entry.advertiser.split(" ")[0]}
                    </div>
                    <div className="flex-1">
                      <div className="h-6 bg-stone-800 rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg flex items-center px-2 transition-all duration-700"
                          style={{
                            width: `${entry.overallShareOfVoice * 100}%`,
                            backgroundColor: entry.color,
                          }}
                        >
                          <span className="text-white text-xs font-semibold whitespace-nowrap">
                            {(entry.overallShareOfVoice * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-stone-500 w-20 text-right">
                      {entry.totalWins.toLocaleString()} wins
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            TAB: Format Analysis
        ================================================================ */}
        {activeTab === "formats" && (
          <div className="space-y-6">
            {/* Format selector */}
            <div className="flex gap-2">
              {formatAuctions.map((fa) => (
                <button
                  key={fa.format}
                  onClick={() => setSelectedFormat(fa.format)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedFormat === fa.format
                      ? "bg-purple-600 text-white"
                      : "bg-stone-800 text-stone-400 hover:text-stone-200"
                  }`}
                >
                  {fa.formatLabel}
                </button>
              ))}
            </div>

            {selectedAuction && (
              <div className="space-y-5">
                {/* Format KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Daily Auctions",
                      value: selectedAuction.totalAuctions.toLocaleString(),
                    },
                    {
                      label: "Avg Clearing CPM",
                      value: `$${selectedAuction.networkAvgCpm.toFixed(2)}`,
                    },
                    {
                      label: "Network Floor",
                      value: `$${selectedAuction.networkFloor.toFixed(2)}`,
                    },
                    {
                      label: "Competition Index",
                      value: `${selectedAuction.competitionIndex}/100`,
                    },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-3"
                    >
                      <div className="text-xl font-bold text-stone-100">{kpi.value}</div>
                      <div className="text-xs text-stone-500 mt-0.5">{kpi.label}</div>
                    </div>
                  ))}
                </div>

                {/* Participant breakdown */}
                <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-800">
                    <h3 className="text-sm font-semibold text-stone-300">
                      Advertiser Competition — {selectedAuction.formatLabel}
                    </h3>
                  </div>
                  {selectedAuction.participants.length === 0 ? (
                    <div className="px-5 py-8 text-center text-stone-500 text-sm">
                      No advertisers active in this format
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-800">
                      {selectedAuction.participants
                        .sort((a, b) => b.wins - a.wins)
                        .map((p, i) => (
                          <div key={p.slug} className="px-5 py-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: p.color }}
                                />
                                <span className="font-medium text-stone-200">{p.advertiser}</span>
                                {i === 0 && (
                                  <span className="px-1.5 py-0.5 bg-yellow-900/50 text-yellow-400 text-xs rounded-full border border-yellow-800/50">
                                    Leader
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-stone-100">
                                  {pct(p.winRate)}
                                </div>
                                <div className="text-xs text-stone-500">win rate</div>
                              </div>
                            </div>
                            <Bar
                              value={p.wins}
                              max={Math.max(...selectedAuction.participants.map((x) => x.wins))}
                              color={p.color}
                            />
                            <div className="mt-3 grid grid-cols-3 gap-3">
                              <div>
                                <div className="text-xs text-stone-500">Daily wins</div>
                                <div className="text-sm text-stone-300">
                                  {p.wins.toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-stone-500">Avg win CPM</div>
                                <div className="text-sm text-stone-300">{cpm(p.avgWinCpm)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-stone-500">CPM premium</div>
                                <div className="text-sm text-stone-300">
                                  +{p.cpmPremium.toFixed(0)}% vs floor
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Top contexts for this format */}
                {selectedAuction.topContexts.length > 0 && (
                  <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-stone-300 mb-3">
                      Top Contextual Signals — {selectedAuction.formatLabel}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedAuction.topContexts.map((ctx) => (
                        <span
                          key={ctx}
                          className="px-3 py-1 bg-purple-900/40 border border-purple-800/50 text-purple-300 text-sm rounded-full"
                        >
                          {ctx}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================
            TAB: Contextual Map
        ================================================================ */}
        {activeTab === "contextual" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-widest">
                Contextual Competition by Department / Keyword
              </h2>
              <div className="flex items-center gap-3 text-xs text-stone-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-stone-500" />
                  Open
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Contested
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Competitive
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contextualMap.map((ctx) => (
                <div
                  key={ctx.keyword}
                  className="bg-stone-900 border border-stone-800 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium text-stone-200">{ctx.label}</div>
                    <ContestBadge level={ctx.contestLevel} />
                  </div>

                  {/* Competitors mini-bar */}
                  <div className="flex h-3 rounded-full overflow-hidden mb-3">
                    {ctx.competitors.map((c, i) => (
                      <div
                        key={`${c.advertiser}-${i}`}
                        title={`${c.advertiser}: ${(c.winRate * 100).toFixed(0)}%`}
                        style={{
                          width: `${c.winRate * 100}%`,
                          backgroundColor: c.color,
                        }}
                      />
                    ))}
                  </div>

                  {/* Competitors list */}
                  <div className="space-y-1 mb-3">
                    {ctx.competitors.map((c, i) => (
                      <div key={`${c.advertiser}-list-${i}`} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="text-xs text-stone-400">{c.advertiser}</span>
                        </div>
                        <span className="text-xs text-stone-500">
                          {(c.winRate * 100).toFixed(0)}% share
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CPM */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                    <span className="text-xs text-stone-500">Avg CPM</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-stone-200">
                        {cpm(ctx.avgCpm)}
                      </span>
                      <span
                        className={`ml-2 text-xs ${ctx.cpmLiftVsRos >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {ctx.cpmLiftVsRos >= 0 ? "+" : ""}
                        {ctx.cpmLiftVsRos.toFixed(0)}% vs ROS
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Opportunity panel */}
            <div className="bg-stone-900 border border-amber-800/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-amber-400 mb-1">
                Untargeted High-Value Contexts
              </h3>
              <p className="text-xs text-stone-500 mb-3">
                Contexts with no active advertisers targeting them — new advertiser acquisition
                opportunity for Tyler.
              </p>
              <div className="flex flex-wrap gap-2">
                {contextualMap
                  .filter((c) => c.contestLevel === "low")
                  .map((c) => (
                    <span
                      key={c.keyword}
                      className="px-3 py-1.5 bg-amber-950/40 border border-amber-800/40 text-amber-300 text-sm rounded-lg"
                    >
                      {c.label}
                      <span className="ml-2 text-amber-500 font-semibold">{cpm(c.avgCpm)}</span>
                    </span>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            TAB: CPM Benchmarks
        ================================================================ */}
        {activeTab === "benchmarks" && (
          <div className="space-y-6">
            <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-widest">
              CPM Benchmarks by Format
            </h2>

            {cpmBenchmarks.map((bm) => (
              <div
                key={bm.format}
                className="bg-stone-900 border border-stone-800 rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-semibold text-stone-200">{bm.formatLabel}</h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      CPM spread: {bm.cpmSpread.toFixed(0)}% between min and max
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-stone-100">{cpm(bm.avgCpm)}</div>
                    <div className="text-xs text-stone-500">network avg CPM</div>
                  </div>
                </div>

                {/* Range bar */}
                <div className="relative mb-4">
                  <div className="h-2 bg-stone-800 rounded-full">
                    {/* floor marker */}
                    <div
                      className="absolute top-0 h-2 bg-stone-600 rounded-l-full"
                      style={{ left: 0, width: "2px" }}
                    />
                    {/* range */}
                    <div
                      className="absolute top-0 h-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                      style={{
                        left: `${(bm.minCpm / (bm.maxCpm * 1.2)) * 100}%`,
                        width: `${((bm.maxCpm - bm.minCpm) / (bm.maxCpm * 1.2)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-stone-500">
                    <span>Floor {cpm(bm.floor)}</span>
                    <span>Min {cpm(bm.minCpm)}</span>
                    <span>Avg {cpm(bm.avgCpm)}</span>
                    <span>Max {cpm(bm.maxCpm)}</span>
                  </div>
                </div>

                {/* Per-advertiser CPM detail */}
                <div className="space-y-2">
                  {shareOfVoice
                    .filter((sov) =>
                      sov.formatBreakdown.find((fb) => fb.format === bm.format && fb.active)
                    )
                    .map((sov) => {
                      const fb = sov.formatBreakdown.find((f) => f.format === bm.format)!;
                      const barWidth = bm.maxCpm > 0 ? (fb.cpm / bm.maxCpm) * 100 : 0;
                      return (
                        <div key={sov.slug} className="flex items-center gap-3">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: sov.color }}
                          />
                          <div className="w-28 text-xs text-stone-400">{sov.advertiser}</div>
                          <div className="flex-1">
                            <div className="h-2 bg-stone-800 rounded-full">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${barWidth}%`,
                                  backgroundColor: sov.color,
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-stone-200 w-16 text-right">
                            {cpm(fb.cpm)}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}

            {/* Auction insight */}
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-stone-300 mb-2">Auction Dynamics</h3>
              <div className="text-sm text-stone-400 space-y-2">
                <p>
                  Liquid I.V. holds the highest CPMs across all active formats ($7.50/$6.50/$6.00),
                  making them the consistent auction winner on run-of-network placements.
                </p>
                <p>
                  Earthbound Farm wins contextual produce/organic contexts despite no billboard
                  flight — their contextual CPM premium ($8.00 leaderboard) exceeds Liquid I.V.&apos;s
                  leaderboard rate in targeted contexts.
                </p>
                <p>
                  Organic Valley is the most vulnerable to competitive pressure — lowest CPMs
                  across all formats. Recommend pricing conversation at next renewal.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

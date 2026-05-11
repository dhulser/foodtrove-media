"use client";

import { useState, useEffect, useCallback } from "react";
import type { AuctionLogResponse, AuctionEvent } from "@/app/api/admin/auction-log/route";
import Link from "next/link";

const COLORS: Record<string, string> = {
  green:   "bg-green-100 text-green-800 border-green-200",
  blue:    "bg-blue-100 text-blue-800 border-blue-200",
  emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
  gray:    "bg-gray-100 text-gray-800 border-gray-200",
};

const DOT_COLORS: Record<string, string> = {
  green:   "bg-green-500",
  blue:    "bg-blue-500",
  emerald: "bg-emerald-500",
  gray:    "bg-gray-500",
};

function formatCpm(cpm: number): string {
  return `$${cpm.toFixed(2)}`;
}

function formatRevenue(rev: number): string {
  return rev >= 1 ? `$${rev.toFixed(2)}` : `$${(rev * 1000).toFixed(3)}‰`;
}

function formatTs(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function secondsAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// Sparkline: very minimal ASCII-style bars
function SparkBars({ values, maxVal, color }: { values: number[]; maxVal: number; color: string }) {
  const bars = "▁▂▃▄▅▆▇█";
  const display = values.map(v => {
    const idx = maxVal > 0 ? Math.round((v / maxVal) * (bars.length - 1)) : 0;
    return bars[idx];
  }).join("");
  return <span className={`font-mono text-xs tracking-tight ${color}`}>{display}</span>;
}

interface Props {
  initialData: AuctionLogResponse | null;
}

export default function AuctionLogClient({ initialData }: Props) {
  const [data, setData] = useState<AuctionLogResponse | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [windowMinutes, setWindowMinutes] = useState(30);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [filterAdvertiser, setFilterAdvertiser] = useState<string>("all");
  const [filterFormat, setFilterFormat] = useState<string>("all");

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/auction-log?window=${windowMinutes}&limit=200`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: AuctionLogResponse = await res.json();
      setData(json);
      setLastRefresh(Date.now());
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [windowMinutes]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => refresh(true), 30_000);
    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  // Re-fetch when window changes
  useEffect(() => {
    refresh(false);
  }, [windowMinutes, refresh]);

  const events = data?.events ?? [];
  const summary = data?.summary;

  // Apply filters
  const filteredEvents = events.filter(e => {
    if (filterAdvertiser !== "all" && e.winner.advertiserName !== filterAdvertiser) return false;
    if (filterFormat !== "all" && e.formatLabel !== filterFormat) return false;
    return true;
  });

  // Unique advertisers + formats for filter dropdowns
  const advertisers = Array.from(new Set(events.map(e => e.winner.advertiserName))).sort();
  const formats = Array.from(new Set(events.map(e => e.formatLabel))).sort();

  // Win share per advertiser for bar chart
  const totalEvents = summary?.totalEvents ?? 0;
  const advEntries = Object.entries(summary?.byAdvertiser ?? {}).sort((a, b) => b[1].wins - a[1].wins);

  // Hourly revenue sparkline (last 6 x 5-min buckets approximation)
  const sparkValues = advEntries.map(([, v]) => v.revenue);
  const sparkMax = Math.max(...sparkValues, 0.001);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-stone-400 hover:text-stone-600 transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-semibold text-stone-900">Auction Log</h1>
                <p className="text-xs text-stone-400">Live bid stream · Kevel Network 12024</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Window selector */}
              <select
                value={windowMinutes}
                onChange={e => setWindowMinutes(Number(e.target.value))}
                className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value={15}>Last 15 min</option>
                <option value={30}>Last 30 min</option>
                <option value={60}>Last 1 hour</option>
                <option value={180}>Last 3 hours</option>
              </select>

              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(v => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  autoRefresh
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-stone-100 text-stone-500 border-stone-200"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}`} />
                {autoRefresh ? "Live" : "Paused"}
              </button>

              {/* Manual refresh */}
              <button
                onClick={() => refresh(false)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 bg-white text-stone-600 hover:border-stone-300 transition-all disabled:opacity-50"
              >
                <svg className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            Failed to load auction data: {error}
          </div>
        )}

        {/* KPI Strip */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs text-stone-400 mb-1">Auctions ({windowMinutes}m)</div>
              <div className="text-2xl font-bold text-stone-900">{summary.totalEvents.toLocaleString()}</div>
              <div className="text-xs text-stone-400 mt-1">{Math.round(summary.totalEvents / windowMinutes)}/min avg</div>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs text-stone-400 mb-1">Est. Revenue</div>
              <div className="text-2xl font-bold text-amber-600">${summary.estimatedHourlyRevenue.toFixed(2)}<span className="text-sm font-normal text-stone-400">/hr</span></div>
              <div className="text-xs text-stone-400 mt-1">${(summary.estimatedHourlyRevenue * 24).toFixed(2)}/day run-rate</div>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs text-stone-400 mb-1">Contextual Win Rate</div>
              <div className="text-2xl font-bold text-emerald-600">{(summary.contextualWinRate * 100).toFixed(1)}%</div>
              <div className="text-xs text-stone-400 mt-1">GreenLeaf contextual</div>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs text-stone-400 mb-1">Avg Auction Latency</div>
              <div className="text-2xl font-bold text-stone-900">{summary.avgAuctionMs.toFixed(0)}<span className="text-sm font-normal text-stone-400">ms</span></div>
              <div className="text-xs text-stone-400 mt-1 truncate">Top: {summary.topPlacement}</div>
            </div>
          </div>
        )}

        {/* Win share by advertiser */}
        {summary && advEntries.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-700 mb-4">Win Share — {windowMinutes}-min Window</h2>
            <div className="space-y-3">
              {advEntries.map(([name, stats]) => {
                const pct = totalEvents > 0 ? (stats.wins / totalEvents) * 100 : 0;
                const evt0 = events.find(e => e.winner.advertiserName === name);
                const color = evt0?.winner.advertiserColor ?? "gray";
                const barColors: Record<string, string> = {
                  green: "bg-green-500",
                  blue: "bg-blue-500",
                  emerald: "bg-emerald-500",
                  gray: "bg-gray-400",
                };
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${DOT_COLORS[color] ?? "bg-gray-400"}`} />
                        <span className="text-sm text-stone-700 font-medium">{name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-stone-500">
                        <span>{stats.wins.toLocaleString()} wins</span>
                        <span className="font-medium text-stone-700">{pct.toFixed(1)}%</span>
                        <span className="text-amber-600 font-medium">${(stats.revenue).toFixed(3)} rev</span>
                        <span>avg {formatCpm(stats.avgCpm)} CPM</span>
                      </div>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColors[color] ?? "bg-gray-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Format breakdown */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(summary.byFormat).map(([fmt, stats]) => (
              <div key={fmt} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">{fmt}</div>
                <div className="text-lg font-bold text-stone-900">{stats.wins.toLocaleString()}</div>
                <div className="text-xs text-stone-400">impressions · ${stats.revenue.toFixed(3)} revenue</div>
              </div>
            ))}
          </div>
        )}

        {/* Event stream */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          {/* Filter bar */}
          <div className="border-b border-stone-100 px-5 py-3 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              {filteredEvents.length.toLocaleString()} events
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <select
                value={filterAdvertiser}
                onChange={e => setFilterAdvertiser(e.target.value)}
                className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-600 focus:outline-none"
              >
                <option value="all">All Advertisers</option>
                {advertisers.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select
                value={filterFormat}
                onChange={e => setFilterFormat(e.target.value)}
                className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-600 focus:outline-none"
              >
                <option value="all">All Formats</option>
                {formats.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[100px_1fr_140px_100px_80px_90px_80px] text-xs font-semibold text-stone-400 uppercase tracking-wide px-5 py-2 border-b border-stone-100 bg-stone-50 hidden lg:grid">
            <span>Time</span>
            <span>Placement</span>
            <span>Winner</span>
            <span>Format</span>
            <span className="text-right">CPM</span>
            <span className="text-center">Context</span>
            <span className="text-right">Latency</span>
          </div>

          {/* Event rows */}
          <div className="divide-y divide-stone-50 max-h-[600px] overflow-y-auto">
            {filteredEvents.length === 0 && !loading && (
              <div className="px-5 py-10 text-center text-sm text-stone-400">
                No auction events in this window.
              </div>
            )}
            {filteredEvents.slice(0, 150).map(evt => (
              <div key={evt.id}
                className="grid grid-cols-1 lg:grid-cols-[100px_1fr_140px_100px_80px_90px_80px] px-5 py-3 hover:bg-stone-50 transition-colors gap-1 lg:gap-0 items-center text-sm">
                {/* Time */}
                <div className="text-xs text-stone-400 font-mono" title={new Date(evt.ts).toISOString()}>
                  {secondsAgo(evt.ts)}
                </div>

                {/* Placement */}
                <div>
                  <div className="text-sm text-stone-800 font-medium truncate">{evt.placementLabel}</div>
                  <div className="text-xs text-stone-400">{evt.pageLabel}</div>
                </div>

                {/* Winner */}
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${COLORS[evt.winner.advertiserColor] ?? COLORS.gray}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[evt.winner.advertiserColor] ?? "bg-gray-400"}`} />
                    {evt.winner.advertiserName.split(" ")[0]}
                  </span>
                  {evt.losers.filter(l => l.eligible).length > 0 && (
                    <div className="text-xs text-stone-400 mt-0.5">
                      beat {evt.losers.filter(l => l.eligible).map(l => `${l.advertiserName.split(" ")[0]} (${formatCpm(l.cpm)})`).join(", ")}
                    </div>
                  )}
                </div>

                {/* Format */}
                <div className="text-xs text-stone-500">
                  <div>{evt.formatLabel}</div>
                  <div className="text-stone-400">{evt.dimensions}</div>
                </div>

                {/* CPM */}
                <div className="text-right">
                  <span className="text-sm font-semibold text-amber-700">{formatCpm(evt.winner.cpm)}</span>
                </div>

                {/* Contextual */}
                <div className="text-center">
                  {evt.winner.contextual ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs border border-emerald-200">
                      <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      ctx
                    </span>
                  ) : (
                    <span className="text-xs text-stone-300">—</span>
                  )}
                  {evt.contextKeywords.length > 0 && (
                    <div className="text-xs text-stone-400 mt-0.5 truncate" title={evt.contextKeywords.join(", ")}>
                      {evt.contextKeywords[0]}
                      {evt.contextKeywords.length > 1 ? ` +${evt.contextKeywords.length - 1}` : ""}
                    </div>
                  )}
                </div>

                {/* Latency */}
                <div className="text-right text-xs text-stone-500 font-mono">
                  {evt.auctionDurationMs}ms
                </div>
              </div>
            ))}
          </div>

          {filteredEvents.length > 150 && (
            <div className="px-5 py-3 border-t border-stone-100 text-xs text-stone-400 text-center">
              Showing most recent 150 of {filteredEvents.length.toLocaleString()} events — narrow window or filter to see all
            </div>
          )}
        </div>

        {/* Last refreshed */}
        <div className="text-xs text-stone-400 text-right">
          Last updated: {new Date(lastRefresh).toLocaleTimeString()} ·{" "}
          {autoRefresh ? "auto-refresh every 30s" : "auto-refresh paused"}
        </div>
      </div>
    </div>
  );
}

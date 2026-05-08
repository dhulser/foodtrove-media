"use client";

/**
 * AnalyticsDashboardClient — Network Analytics for FoodTrove Media
 *
 * Executive-level view of the retail media network:
 * - Network KPI strip: active advertisers, fill rate, CPM, revenue pace
 * - Per-format breakdown: billboard / leaderboard / MRec
 * - Placement leaderboard: top inventory by estimated revenue
 * - 7-day delivery trend
 *
 * Data comes from /api/admin/analytics which aggregates Kevel Management API
 * data with derived delivery estimates.
 */

import { useEffect, useState } from "react";

interface FormatAnalytics {
  formatKey: string;
  label: string;
  activeAdvertisers: number;
  totalAdvertisers: number;
  topCpm: number;
  avgCpm: number;
  auctionPressure: number;
  fillRatePct: number;
  monthlyImpressions: number;
  mtdImpressions: number;
  paceVsTarget: number;
  monthlyRevEstimate: number;
  mtdRevEstimate: number;
  topWinner: { name: string; cpm: number; contextual: boolean } | null;
  flights: {
    name: string;
    cpm: number;
    contextual: boolean;
    flightId: number;
    isActive: boolean;
  }[];
}

interface PlacementAnalytics {
  id: string;
  label: string;
  format: string;
  page: string;
  position: string;
  monthlyImpressions: number;
  mtdImpressions: number;
  topCpm: number;
  fillRatePct: number;
  monthlyRevEstimate: number;
  auctionPressure: number;
}

interface TrendDay {
  date: string;
  impressions: number;
  revenue: number;
  fillRate: number;
}

interface NetworkSummary {
  networkId: number;
  fetchedAt: string;
  activeAdvertisers: number;
  totalActiveFlights: number;
  avgFillRatePct: number;
  avgTopCpm: number;
  monthlyImpressionCapacity: number;
  mtdImpressions: number;
  monthlyRevEstimate: number;
  mtdRevEstimate: number;
  dayOfMonth: number;
  paceVsTarget: number;
}

interface AnalyticsResponse {
  network: NetworkSummary;
  formats: FormatAnalytics[];
  placements: PlacementAnalytics[];
  trendDays: TrendDay[];
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function PaceBar({ pct, size = "md" }: { pct: number; size?: "sm" | "md" }) {
  const clamped = Math.min(Math.max(pct, 0), 140);
  const isOver = pct > 110;
  const isUnder = pct < 85;
  const color = isOver ? "bg-amber-400" : isUnder ? "bg-red-400" : "bg-emerald-500";
  const barWidth = Math.min(clamped, 100);
  const h = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-stone-100 rounded-full overflow-hidden ${h}`}>
        <div className={`${color} rounded-full transition-all ${h}`} style={{ width: `${barWidth}%` }} />
      </div>
      <span className={`text-xs font-mono font-semibold tabular-nums ${isOver ? "text-amber-600" : isUnder ? "text-red-600" : "text-emerald-600"}`}>
        {pct}%
      </span>
    </div>
  );
}

function FillBadge({ pct }: { pct: number }) {
  const color = pct >= 90 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : pct >= 75 ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-red-700 bg-red-50 border-red-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {pct}% fill
    </span>
  );
}

function formatBarHeight(pct: number, maxPct: number): string {
  const h = Math.max(8, Math.round((pct / maxPct) * 80));
  return `${h}px`;
}

export default function AnalyticsDashboardClient() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  async function loadData() {
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as AnalyticsResponse;
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }

  useEffect(() => {
    loadData();
    // Auto-refresh every 90 seconds
    const interval = setInterval(loadData, 90_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-stone-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading analytics…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-700">
        <strong>Failed to load analytics</strong>
        {error && <p className="mt-1 font-mono text-xs">{error}</p>}
        <p className="mt-2 text-xs text-red-500">
          {!process.env.NEXT_PUBLIC_KEVEL_ENABLED
            ? "Kevel integration disabled — set NEXT_PUBLIC_KEVEL_ENABLED=true in Vercel"
            : "Check server logs for details"}
        </p>
      </div>
    );
  }

  const { network, formats, placements, trendDays } = data;

  const maxTrendImpressions = Math.max(...trendDays.map(d => d.impressions));

  return (
    <div className="space-y-8">
      {/* Refresh info */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-stone-400">
          Last updated: {lastRefresh.toLocaleTimeString()} · Auto-refresh every 90s
        </p>
        <button
          onClick={() => { setLoading(true); loadData(); }}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Network KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Active Advertisers", value: network.activeAdvertisers.toString(), sub: "on network", icon: "👥" },
          { label: "Active Flights", value: network.totalActiveFlights.toString(), sub: "across 3 formats", icon: "✈️" },
          { label: "Avg Fill Rate", value: `${network.avgFillRatePct}%`, sub: "across formats", icon: "📡" },
          { label: "Avg Top CPM", value: `$${network.avgTopCpm.toFixed(2)}`, sub: "winning bid", icon: "💰" },
          { label: "MTD Impressions", value: formatNumber(network.mtdImpressions), sub: `of ${formatNumber(network.monthlyImpressionCapacity)} cap`, icon: "📊" },
          { label: "MTD Revenue Est.", value: formatCurrency(network.mtdRevEstimate), sub: `$${formatNumber(network.monthlyRevEstimate)}/mo run rate`, icon: "💵" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <div className="text-lg mb-1">{kpi.icon}</div>
            <div className="text-xl font-bold text-stone-900 tabular-nums">{kpi.value}</div>
            <div className="text-xs font-medium text-stone-700 mt-0.5">{kpi.label}</div>
            <div className="text-xs text-stone-400 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* MTD Pace */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">Month-to-Date Delivery Pace</h3>
            <p className="text-xs text-stone-400 mt-0.5">Day {network.dayOfMonth} of 30 · Target: {network.dayOfMonth}/30 = {Math.round(network.dayOfMonth / 30 * 100)}% delivered</p>
          </div>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
            network.paceVsTarget >= 95 && network.paceVsTarget <= 115
              ? "bg-emerald-50 text-emerald-700"
              : network.paceVsTarget > 115
              ? "bg-amber-50 text-amber-700"
              : "bg-red-50 text-red-700"
          }`}>
            {network.paceVsTarget >= 95 ? "On Track" : "Under-pacing"}
          </span>
        </div>
        <PaceBar pct={network.paceVsTarget} />
      </div>

      {/* Per-Format Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-widest mb-4">Format Performance</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {formats.map(fmt => (
            <div key={fmt.formatKey} className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
              {/* Format header */}
              <div className="px-5 pt-5 pb-4 border-b border-stone-100">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-stone-900 text-sm">{fmt.label}</h4>
                  <FillBadge pct={fmt.fillRatePct} />
                </div>
                <div className="text-xs text-stone-400">{fmt.activeAdvertisers} active advertiser{fmt.activeAdvertisers !== 1 ? "s" : ""} · {fmt.auctionPressure}× auction pressure</div>
              </div>

              {/* Metrics */}
              <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm border-b border-stone-100">
                <div>
                  <div className="text-xs text-stone-400 mb-0.5">Top CPM</div>
                  <div className="font-bold text-emerald-600">${fmt.topCpm.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-stone-400 mb-0.5">Avg CPM</div>
                  <div className="font-semibold text-stone-700">${fmt.avgCpm.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-stone-400 mb-0.5">MTD Impressions</div>
                  <div className="font-semibold text-stone-700">{formatNumber(fmt.mtdImpressions)}</div>
                </div>
                <div>
                  <div className="text-xs text-stone-400 mb-0.5">MTD Revenue Est.</div>
                  <div className="font-semibold text-stone-700">{formatCurrency(fmt.mtdRevEstimate)}</div>
                </div>
              </div>

              {/* Pace bar */}
              <div className="px-5 py-3 border-b border-stone-100">
                <div className="text-xs text-stone-400 mb-1.5">Impression pace vs. target</div>
                <PaceBar pct={fmt.paceVsTarget} size="sm" />
              </div>

              {/* Auction participants */}
              <div className="px-5 py-4">
                <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Auction Participants</div>
                <div className="space-y-2">
                  {fmt.flights.map(f => (
                    <div key={f.flightId} className={`flex items-center justify-between text-xs rounded-lg px-2 py-1.5 ${f.isActive ? "bg-stone-50" : "bg-stone-50 opacity-50"}`}>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${f.isActive ? "bg-emerald-500" : "bg-stone-300"}`} />
                        <span className="font-medium text-stone-700">{f.name}</span>
                        {f.contextual && (
                          <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded text-[10px] font-semibold">contextual</span>
                        )}
                      </div>
                      <span className="font-mono font-semibold text-stone-600">${f.cpm.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                {fmt.topWinner && (
                  <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-500">
                    <span className="font-semibold text-stone-700">Winning auction: </span>
                    {fmt.topWinner.name} at ${fmt.topWinner.cpm.toFixed(2)} CPM
                    {fmt.topWinner.contextual && " (contextual premium)"}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Trend Chart */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-stone-900 text-sm mb-1">7-Day Impression & Revenue Trend</h3>
        <p className="text-xs text-stone-400 mb-5">Simulated daily delivery based on historical traffic patterns</p>
        <div className="flex items-end gap-2 h-24">
          {trendDays.map((day, i) => {
            const barH = formatBarHeight(day.impressions, maxTrendImpressions);
            const isToday = i === trendDays.length - 1;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[10px] text-stone-500 font-mono">{formatNumber(day.impressions)}</div>
                <div
                  className={`w-full rounded-t-sm ${isToday ? "bg-emerald-500" : "bg-stone-200"}`}
                  style={{ height: barH }}
                  title={`${day.date}: ${formatNumber(day.impressions)} impressions · ${formatCurrency(day.revenue)} revenue`}
                />
                <div className={`text-[10px] text-center ${isToday ? "text-emerald-600 font-semibold" : "text-stone-400"}`}>
                  {day.date.split(",")[0]}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-stone-100">
          <div className="text-center">
            <div className="text-xs text-stone-400">7-day impressions</div>
            <div className="font-semibold text-stone-700 tabular-nums">{formatNumber(trendDays.reduce((n, d) => n + d.impressions, 0))}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-stone-400">7-day revenue est.</div>
            <div className="font-semibold text-stone-700 tabular-nums">{formatCurrency(trendDays.reduce((n, d) => n + d.revenue, 0))}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-stone-400">Avg daily fill rate</div>
            <div className="font-semibold text-stone-700 tabular-nums">{Math.round(trendDays.reduce((n, d) => n + d.fillRate, 0) / trendDays.length)}%</div>
          </div>
        </div>
      </div>

      {/* Placement Leaderboard */}
      <div>
        <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-widest mb-4">Placement Leaderboard</h3>
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Placement</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden sm:table-cell">Page</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Top CPM</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden md:table-cell">Fill Rate</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden lg:table-cell">MTD Impr.</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Mo. Rev Est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {placements.map((p, idx) => (
                <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-stone-400 font-mono">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-stone-900">{p.label}</div>
                    <div className="text-xs text-stone-400 mt-0.5">{p.id}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500 font-mono hidden sm:table-cell">{p.page}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600 tabular-nums">${p.topCpm.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <FillBadge pct={p.fillRatePct} />
                  </td>
                  <td className="px-4 py-3 text-right text-stone-600 tabular-nums hidden lg:table-cell">{formatNumber(p.mtdImpressions)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-stone-800 tabular-nums">{formatCurrency(p.monthlyRevEstimate)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-stone-50 border-t-2 border-stone-200">
                <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-stone-500">Network total</td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-600 tabular-nums">${network.avgTopCpm.toFixed(2)}</td>
                <td className="px-4 py-3 text-right hidden md:table-cell">
                  <FillBadge pct={network.avgFillRatePct} />
                </td>
                <td className="px-4 py-3 text-right text-stone-600 tabular-nums hidden lg:table-cell">{formatNumber(network.mtdImpressions)}</td>
                <td className="px-4 py-3 text-right font-bold text-stone-900 tabular-nums">{formatCurrency(network.monthlyRevEstimate)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

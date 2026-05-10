"use client";

/**
 * InventoryForecastClient — Available-to-Sell (ATS) Dashboard
 *
 * Pre-sales planning tool for Casey (Ad Ops) and Tyler (Sales):
 * - Network-level ATS summary with revenue upside
 * - Per-format breakdown: capacity, sold, available, fill rate
 * - CPM floor recommendations based on active auction pressure
 * - 30-day availability curve (sparkline per format)
 * - Placement inventory map for Tyler's RFP responses
 */

import { useEffect, useState } from "react";

interface PlacementMeta {
  page: string;
  slot: string;
  dailySessions: number;
  viewability: number;
}

interface SoldFlight {
  flightId: number;
  advertiserHint: string;
  cpm: number;
  isUnlimited: boolean;
  bookedImpressions: number;
  keywords: string;
  startDate: string | null;
  endDate: string | null;
}

interface FormatInventory {
  formatKey: string;
  label: string;
  size: string;
  dailyCapacity: number;
  monthlyCapacity: number;
  dailySold: number;
  dailyAts: number;
  fillRatePct: number;
  placementCount: number;
  placementPages: string[];
  avgViewability: number;
  cpmFloor: number;
  cpmCeiling: number;
  recommendedFloor: number;
  topActiveCpm: number;
  activeFlights: number;
  soldFlights: SoldFlight[];
  availabilityCurve: { date: string; available: number; sold: number }[];
}

interface NetworkInventory {
  asOf: string;
  network: {
    totalDailyCapacity: number;
    totalDailySold: number;
    totalDailyAts: number;
    networkFillRatePct: number;
    currentDailyRevEstimate: number;
    atsRevenuePotential: number;
    activeFlightCount: number;
  };
  formats: FormatInventory[];
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function fmtCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

function FillGauge({ pct, color }: { pct: number; color: string }) {
  const status = pct >= 85 ? "text-amber-600" : pct >= 50 ? "text-emerald-600" : "text-blue-600";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold ${status}`}>{pct}% filled</span>
        <span className="text-xs text-stone-400">{100 - pct}% ATS</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function AvailabilityCurve({ curve }: { curve: { date: string; available: number; sold: number }[] }) {
  const maxAvail = Math.max(...curve.map((d) => d.available));
  return (
    <div className="mt-3">
      <div className="text-xs text-stone-400 mb-1.5">30-day availability (daily)</div>
      <div className="flex items-end gap-0.5 h-10">
        {curve.map((day, i) => {
          const atsH = Math.round(((day.available - day.sold) / maxAvail) * 40);
          const soldH = Math.round((day.sold / maxAvail) * 40);
          const isWeekend = [0, 6].includes(new Date(day.date).getDay());
          return (
            <div key={i} className="flex-1 flex flex-col justify-end" title={`${day.date}: ${fmtNum(day.available - day.sold)} ATS`}>
              <div
                className={`rounded-sm ${isWeekend ? "bg-blue-200" : "bg-blue-100"}`}
                style={{ height: `${atsH}px` }}
              />
              <div
                className="rounded-sm bg-stone-300"
                style={{ height: `${soldH}px` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-1">
        <span className="flex items-center gap-1 text-xs text-stone-400">
          <span className="w-2 h-2 rounded-sm bg-blue-100 inline-block" />Available
        </span>
        <span className="flex items-center gap-1 text-xs text-stone-400">
          <span className="w-2 h-2 rounded-sm bg-stone-300 inline-block" />Sold
        </span>
      </div>
    </div>
  );
}

const FORMAT_COLORS: Record<string, { bar: string; badge: string; accent: string }> = {
  billboard: { bar: "bg-blue-500", badge: "bg-blue-50 text-blue-700", accent: "border-blue-200 hover:border-blue-300" },
  leaderboard: { bar: "bg-violet-500", badge: "bg-violet-50 text-violet-700", accent: "border-violet-200 hover:border-violet-300" },
  mrec: { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700", accent: "border-emerald-200 hover:border-emerald-300" },
};

function FormatCard({ fmt }: { fmt: FormatInventory }) {
  const [expanded, setExpanded] = useState(false);
  const colors = FORMAT_COLORS[fmt.formatKey] ?? FORMAT_COLORS.billboard;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all ${colors.accent}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-stone-900">{fmt.label}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
                {fmt.size}
              </span>
            </div>
            <div className="text-xs text-stone-400 mt-0.5">
              {fmt.placementCount} placements · {fmt.avgViewability}% avg viewability
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-400">Active flights</div>
            <div className="text-lg font-bold text-stone-900">{fmt.activeFlights}</div>
          </div>
        </div>

        {/* Fill gauge */}
        <FillGauge pct={fmt.fillRatePct} color={colors.bar} />

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-stone-50 rounded-lg p-2.5">
            <div className="text-xs text-stone-400 mb-0.5">Daily capacity</div>
            <div className="text-sm font-bold text-stone-900">{fmtNum(fmt.dailyCapacity)}</div>
          </div>
          <div className="bg-stone-50 rounded-lg p-2.5">
            <div className="text-xs text-stone-400 mb-0.5">Daily sold</div>
            <div className="text-sm font-bold text-stone-700">{fmtNum(fmt.dailySold)}</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-2.5">
            <div className="text-xs text-emerald-600 mb-0.5">Daily ATS</div>
            <div className="text-sm font-bold text-emerald-700">{fmtNum(fmt.dailyAts)}</div>
          </div>
        </div>

        {/* CPM section */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-amber-700 mb-0.5">CPM Guidance</div>
              <div className="text-xs text-amber-600">
                Floor: <span className="font-bold">{fmtCurrency(fmt.recommendedFloor)}</span>
                {" "}· Top active: <span className="font-bold">{fmtCurrency(fmt.topActiveCpm)}</span>
                {" "}· Ceiling: <span className="font-bold">{fmtCurrency(fmt.cpmCeiling)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-amber-500">ATS upside</div>
              <div className="text-sm font-bold text-amber-700">
                {fmtCurrency((fmt.dailyAts / 1000) * fmt.recommendedFloor)}/day
              </div>
            </div>
          </div>
        </div>

        {/* 30-day curve */}
        <AvailabilityCurve curve={fmt.availabilityCurve} />

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-xs text-stone-400 hover:text-stone-600 transition-colors w-full text-left"
        >
          {expanded ? "▲ Hide" : "▼ Show"} placement breakdown + active flights
        </button>
      </div>

      {/* Expanded: placements + flights */}
      {expanded && (
        <div className="border-t border-stone-100 px-6 pb-6 pt-4 space-y-4">
          {/* Placement pages */}
          <div>
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Placements</div>
            <div className="flex flex-wrap gap-1.5">
              {fmt.placementPages.map((page) => (
                <span key={page} className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-md">
                  {page}
                </span>
              ))}
            </div>
          </div>

          {/* Active flights */}
          {fmt.soldFlights.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Active Flights</div>
              <div className="space-y-2">
                {fmt.soldFlights.map((flight) => (
                  <div key={flight.flightId} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2">
                    <div>
                      <div className="text-xs font-medium text-stone-700">{flight.advertiserHint}</div>
                      <div className="text-xs text-stone-400">
                        Flight #{flight.flightId}
                        {flight.isUnlimited ? " · Unlimited" : ` · ${fmtNum(flight.bookedImpressions)} imps booked`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-stone-900">${flight.cpm.toFixed(2)} CPM</div>
                      <div className="text-xs text-stone-400">
                        {flight.keywords ? flight.keywords.split(",").slice(0, 3).join(", ") : "run-of-site"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InventoryForecastClient() {
  const [data, setData] = useState<NetworkInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/inventory");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120_000); // refresh every 2 min
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-stone-100 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-stone-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-700">
        Failed to load inventory data: {error}
      </div>
    );
  }

  const { network, formats } = data;

  return (
    <div className="space-y-8">
      {/* Network summary strip */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-stone-900">Network Inventory — Today</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              All formats combined · {lastRefresh?.toLocaleTimeString()} ·
              <button onClick={fetchData} className="ml-1 text-blue-500 hover:text-blue-700 transition-colors">
                Refresh
              </button>
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-600 font-medium">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-stone-900">{fmtNum(network.totalDailyCapacity)}</div>
            <div className="text-xs text-stone-400 mt-0.5">Total capacity/day</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-stone-700">{fmtNum(network.totalDailySold)}</div>
            <div className="text-xs text-stone-400 mt-0.5">Sold/day</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{fmtNum(network.totalDailyAts)}</div>
            <div className="text-xs text-stone-400 mt-0.5">Available-to-sell</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${network.networkFillRatePct > 80 ? "text-amber-600" : "text-emerald-600"}`}>
              {network.networkFillRatePct}%
            </div>
            <div className="text-xs text-stone-400 mt-0.5">Fill rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-stone-800">{fmtCurrency(network.currentDailyRevEstimate)}</div>
            <div className="text-xs text-stone-400 mt-0.5">Est. daily revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{fmtCurrency(network.atsRevenuePotential)}</div>
            <div className="text-xs text-stone-400 mt-0.5">ATS upside/day</div>
          </div>
        </div>

        {/* Network fill bar */}
        <div className="mt-5">
          <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
              style={{ width: `${network.networkFillRatePct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-stone-400 mt-1">
            <span>{network.activeFlightCount} active flights</span>
            <span>{network.networkFillRatePct}% of capacity sold · {100 - network.networkFillRatePct}% unsold</span>
          </div>
        </div>
      </div>

      {/* Pre-sales guidance callout */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <svg className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-sm font-semibold text-blue-800 mb-1">Pre-Sales Guidance</div>
            <div className="text-xs text-blue-700 leading-relaxed">
              Available-to-sell figures reflect today&rsquo;s daily capacity minus active booked flights.
              Use CPM floor recommendations when quoting new advertisers — pricing below active auctions
              reduces revenue without improving fill rate. Weekend capacity runs 12–18% above weekday baseline.
              Quote 30-day minimums to anchor advertiser expectations on reach.
            </div>
          </div>
        </div>
      </div>

      {/* Per-format cards */}
      <div>
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-widest mb-4">
          Format Breakdown
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {formats.map((fmt) => (
            <FormatCard key={fmt.formatKey} fmt={fmt} />
          ))}
        </div>
      </div>

      {/* Quick reference for Tyler */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        <h3 className="text-sm font-bold text-stone-900 mb-4">Quick Reference — Advertiser Packages</h3>
        <p className="text-xs text-stone-500 mb-4 leading-relaxed">
          Standard packages for RFP responses. Impression figures are 30-day ATS at current capacity.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left py-2 pr-4 font-semibold text-stone-500">Format</th>
                <th className="text-right py-2 pr-4 font-semibold text-stone-500">30-day ATS</th>
                <th className="text-right py-2 pr-4 font-semibold text-stone-500">CPM floor</th>
                <th className="text-right py-2 pr-4 font-semibold text-stone-500">30-day min</th>
                <th className="text-right py-2 font-semibold text-stone-500">Top placement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {formats.map((fmt) => {
                const thirtyDayAts = fmt.dailyAts * 30;
                const minSpend = (thirtyDayAts / 1000) * fmt.recommendedFloor;
                const topPage = fmt.placementPages[0] ?? "—";
                return (
                  <tr key={fmt.formatKey} className="hover:bg-stone-50 transition-colors">
                    <td className="py-2.5 pr-4 font-medium text-stone-800">{fmt.label} ({fmt.size})</td>
                    <td className="py-2.5 pr-4 text-right text-stone-600">{fmtNum(thirtyDayAts)}</td>
                    <td className="py-2.5 pr-4 text-right text-stone-600">{fmtCurrency(fmt.recommendedFloor)}</td>
                    <td className="py-2.5 pr-4 text-right font-bold text-emerald-700">{fmtCurrency(minSpend)}</td>
                    <td className="py-2.5 text-right text-stone-500">{topPage}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      <div className="text-xs text-stone-400 text-center pb-4">
        Traffic model based on session estimates · Seasonality and day-of-week multipliers applied ·
        Sold inventory derived from active Kevel flights in network 12024
      </div>
    </div>
  );
}

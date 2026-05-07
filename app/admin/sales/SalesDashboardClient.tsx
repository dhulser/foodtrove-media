"use client";

import { useEffect, useState } from "react";

// Types matching /api/admin/sales-report response
interface FlightReport {
  flightId: number;
  flightName: string;
  keyword: string;
  format: string;
  isActive: boolean;
  cpm: number;
  estimatedDailyImpressions: number;
  estimatedDailyRevenue: number;
  estimatedMonthlyRevenue: number;
}

interface AdvertiserReport {
  advertiserId: number;
  advertiserName: string;
  flights: FlightReport[];
  totalDailyRevenue: number;
  totalMonthlyRevenue: number;
  activeFormats: string[];
}

interface AuctionCompetitor {
  advertiserName: string;
  cpm: number;
  isWinning: boolean;
}

interface AuctionSlot {
  format: string;
  keyword: string;
  competitors: AuctionCompetitor[];
  winningCPM: number;
  runnerUpCPM: number | null;
}

interface NetworkSummary {
  totalDailyRevenue: number;
  totalMonthlyRevenue: number;
  blendedCPM: number;
  totalActiveFlights: number;
  auctionCompetition: AuctionSlot[];
  fetchedAt: string;
}

interface SalesReport {
  advertisers: AdvertiserReport[];
  network: NetworkSummary;
}

function fmt$(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtK(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString();
}

// Advertiser accent colors
const ADVERTISER_COLORS: Record<string, string> = {
  "FreshFarm Organics": "emerald",
  "NutriPeak Nutrition": "violet",
  "GreenLeaf Farms":    "teal",
};

function accentClasses(name: string, variant: "bg" | "text" | "border") {
  const color = ADVERTISER_COLORS[name] ?? "stone";
  const map: Record<string, Record<string, string>> = {
    "FreshFarm Organics": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    "NutriPeak Nutrition": { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200"  },
    "GreenLeaf Farms":    { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200"    },
  };
  return map[name]?.[variant] ?? `bg-stone-50 text-stone-700 border-stone-200`.split(" ").find(c => c.startsWith(variant)) ?? "";
}

function AdvertiserCard({ adv }: { adv: AdvertiserReport }) {
  const bgCls    = accentClasses(adv.advertiserName, "bg");
  const textCls  = accentClasses(adv.advertiserName, "text");
  const borderCls = accentClasses(adv.advertiserName, "border");

  return (
    <div className={`rounded-2xl border ${borderCls} ${bgCls} p-6 space-y-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className={`text-base font-bold ${textCls}`}>{adv.advertiserName}</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            {adv.activeFormats.length} active format{adv.activeFormats.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-stone-900">{fmt$(adv.totalMonthlyRevenue)}</p>
          <p className="text-xs text-stone-400">est. monthly</p>
        </div>
      </div>

      {/* Flight breakdown table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-stone-400 uppercase tracking-wider border-b border-stone-200">
              <th className="pb-2 font-medium">Format</th>
              <th className="pb-2 font-medium text-right">CPM</th>
              <th className="pb-2 font-medium text-right">Daily est. imps</th>
              <th className="pb-2 font-medium text-right">Daily rev.</th>
              <th className="pb-2 font-medium text-right">Monthly rev.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {adv.flights.map((f) => (
              <tr key={f.flightId} className="text-stone-700">
                <td className="py-2.5 pr-4">
                  <div className="font-medium text-stone-800 truncate max-w-[160px]">{f.format}</div>
                  <div className="text-xs text-stone-400 font-mono">{f.keyword}</div>
                </td>
                <td className="py-2.5 text-right font-semibold">{fmt$(f.cpm)}</td>
                <td className="py-2.5 text-right text-stone-500">{fmtK(f.estimatedDailyImpressions)}</td>
                <td className="py-2.5 text-right">{fmt$(f.estimatedDailyRevenue)}</td>
                <td className="py-2.5 text-right font-semibold">{fmt$(f.estimatedMonthlyRevenue)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-stone-200">
              <td className="pt-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide" colSpan={3}>Total</td>
              <td className="pt-2.5 text-right font-bold text-stone-900">{fmt$(adv.totalDailyRevenue)}</td>
              <td className="pt-2.5 text-right font-bold text-stone-900">{fmt$(adv.totalMonthlyRevenue)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function AuctionCard({ slot }: { slot: AuctionSlot }) {
  const premium =
    slot.runnerUpCPM !== null
      ? (((slot.winningCPM - slot.runnerUpCPM) / slot.runnerUpCPM) * 100).toFixed(0)
      : null;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-stone-900">{slot.format}</p>
          <p className="text-xs font-mono text-stone-400">{slot.keyword}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold text-emerald-700">{fmt$(slot.winningCPM)}</p>
          <p className="text-xs text-stone-400">winning CPM</p>
        </div>
      </div>

      <div className="space-y-2">
        {slot.competitors.map((c, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`flex-1 flex items-center gap-2.5 py-1.5 px-3 rounded-lg ${c.isWinning ? "bg-emerald-50 border border-emerald-200" : "bg-stone-50"}`}>
              {c.isWinning ? (
                <span className="text-emerald-600 text-xs font-bold">★</span>
              ) : (
                <span className="w-3 h-3 rounded-full bg-stone-300 shrink-0" />
              )}
              <span className={`text-sm font-medium ${c.isWinning ? "text-emerald-800" : "text-stone-600"}`}>
                {c.advertiserName}
              </span>
              <span className={`ml-auto text-sm font-bold ${c.isWinning ? "text-emerald-700" : "text-stone-500"}`}>
                {fmt$(c.cpm)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {premium !== null && (
        <p className="text-xs text-stone-400 mt-3">
          Winner pays {premium}% premium over runner-up
        </p>
      )}
    </div>
  );
}

export default function SalesDashboardClient() {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchReport = async () => {
    try {
      const res = await fetch("/api/admin/sales-report");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setReport(await res.json());
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    const interval = setInterval(fetchReport, 300_000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-pulse text-stone-400 text-sm">Loading sales data…</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-lg mx-auto mt-16 bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
        <p className="text-sm font-semibold text-red-700 mb-2">Sales report unavailable</p>
        <p className="text-xs text-red-500 font-mono">{error ?? "No data returned"}</p>
        <p className="text-xs text-stone-400 mt-4">
          Ensure <code className="font-mono">KEVEL_API_KEY</code> is set and the Kevel Management API is reachable.
        </p>
        <button
          onClick={fetchReport}
          className="mt-4 px-4 py-2 text-sm font-semibold text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { network, advertisers } = report;

  return (
    <div className="space-y-8">

      {/* KPI bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Est. Monthly Revenue",  value: fmt$(network.totalMonthlyRevenue), sub: `${fmt$(network.totalDailyRevenue)}/day` },
          { label: "Blended CPM",           value: fmt$(network.blendedCPM),           sub: "across all formats" },
          { label: "Active Advertisers",    value: String(advertisers.length),          sub: `${network.totalActiveFlights} active flights` },
          { label: "Auction Slots",         value: String(network.auctionCompetition.length), sub: "competed formats" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-1">{kpi.label}</p>
            <p className="text-2xl font-extrabold text-stone-900">{kpi.value}</p>
            <p className="text-xs text-stone-400 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Advertiser breakdown */}
      <div>
        <h2 className="text-base font-bold text-stone-900 mb-4">Advertiser Revenue Breakdown</h2>
        <div className="space-y-4">
          {advertisers.map((adv) => (
            <AdvertiserCard key={adv.advertiserId} adv={adv} />
          ))}
        </div>
      </div>

      {/* Auction competition */}
      <div>
        <h2 className="text-base font-bold text-stone-900 mb-4">Live Auction Competition</h2>
        <p className="text-xs text-stone-400 mb-4">
          First-price CPM auction — winner determined by highest Price on active flights.
          Kevel resolves ties by priority.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {network.auctionCompetition.map((slot) => (
            <AuctionCard key={slot.keyword} slot={slot} />
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="text-xs text-stone-400 pt-2 border-t border-stone-100 flex items-center justify-between">
        <span>
          Revenue figures are estimates based on conservative daily impression projections.
          CPM rates are live from the Kevel Management API.
        </span>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {lastRefresh && (
            <span>Last updated {lastRefresh.toLocaleTimeString()}</span>
          )}
          <button
            onClick={fetchReport}
            className="px-3 py-1.5 text-xs font-semibold text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

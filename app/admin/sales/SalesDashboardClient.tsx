"use client";

import { useEffect, useState } from "react";

interface FormatEntry {
  name: string;
  format: string;
  keywords: string;
  cpm: number;
  isContextual: boolean;
  isActive: boolean;
  flightId: number;
  monthlyEstImpressions: number;
}

interface AdvertiserReport {
  id: number;
  name: string;
  isActive: boolean;
  campaigns: number;
  activeFlights: number;
  formats: FormatEntry[];
  avgCpm: number;
  estimatedMonthlyRevenue: number;
}

interface InventoryEntry {
  placement: string;
  size: string;
  location: string;
  estimatedMonthlyImpressions: number;
  currentCpm: number;
  advertisers: (string | undefined)[];
}

interface SalesReport {
  generatedAt: string;
  network: string;
  summary: {
    totalAdvertisers: number;
    totalActiveFlights: number;
    estimatedMonthlyRevenue: number;
    avgNetworkCpm: number;
  };
  advertisers: AdvertiserReport[];
  inventory: InventoryEntry[];
}

function fmt(n: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

function fmtNum(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

const BRAND_COLORS: Record<string, string> = {
  "FreshFarm Organics": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "NutriPeak Nutrition": "bg-blue-100 text-blue-800 border-blue-200",
  "GreenLeaf Farms": "bg-lime-100 text-lime-800 border-lime-200",
};

export default function SalesDashboard() {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchReport = async () => {
    try {
      setLoading(true);
      const resp = await fetch("/api/admin/sales-report");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as SalesReport;
      setReport(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReport();
    const interval = setInterval(() => void fetchReport(), 300_000); // 5-min refresh
    return () => clearInterval(interval);
  }, []);

  if (loading && !report) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-stone-500">Fetching live campaign data…</p>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md text-center">
          <p className="text-sm font-semibold text-red-700 mb-1">Failed to load report</p>
          <p className="text-xs text-red-500">{error}</p>
          <button
            onClick={() => void fetchReport()}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-stone-900">Sales Report</h1>
              <p className="text-sm text-stone-500 mt-0.5">{report.network}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-400">
                Last updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <button
                onClick={() => void fetchReport()}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition"
              >
                <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              {/* PDF Export — opens print-optimized view */}
              <a
                href="/admin/sales/print"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Export PDF
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Active Advertisers",
              value: String(report.summary.totalAdvertisers),
              sub: "Live campaigns",
              color: "text-emerald-600",
            },
            {
              label: "Active Flights",
              value: String(report.summary.totalActiveFlights),
              sub: "Across all formats",
              color: "text-blue-600",
            },
            {
              label: "Avg Network CPM",
              value: fmt(report.summary.avgNetworkCpm, 2),
              sub: "Blended rate",
              color: "text-amber-600",
            },
            {
              label: "Est. Monthly Revenue",
              value: fmt(report.summary.estimatedMonthlyRevenue, 0),
              sub: "Run-rate estimate",
              color: "text-emerald-700",
            },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl border border-stone-100 shadow-sm p-4">
              <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">{kpi.label}</p>
              <p className={`text-2xl font-extrabold mt-1 ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-stone-400 mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Advertiser roster */}
        <div>
          <h2 className="text-base font-bold text-stone-800 mb-3">Advertiser Roster</h2>
          <div className="space-y-4">
            {report.advertisers.map((adv) => (
              <div key={adv.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-stone-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border ${
                          BRAND_COLORS[adv.name] ?? "bg-stone-100 text-stone-600 border-stone-200"
                        }`}
                      >
                        {adv.name}
                      </span>
                      <span className={`text-xs font-medium ${adv.isActive ? "text-emerald-600" : "text-stone-400"}`}>
                        {adv.isActive ? "● Active" : "○ Paused"}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">
                      Advertiser ID {adv.id} · {adv.campaigns} campaign{adv.campaigns !== 1 ? "s" : ""} · {adv.activeFlights} active flight{adv.activeFlights !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-6 text-right">
                    <div>
                      <p className="text-xs text-stone-400">Avg CPM</p>
                      <p className="text-sm font-bold text-stone-800">{fmt(adv.avgCpm)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-400">Est. Mo. Rev</p>
                      <p className="text-sm font-bold text-emerald-600">{fmt(adv.estimatedMonthlyRevenue, 0)}</p>
                    </div>
                  </div>
                </div>
                {/* Flights table */}
                <div className="divide-y divide-stone-50">
                  {adv.formats.map((f) => (
                    <div key={f.flightId} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-700 truncate">{f.format}</p>
                        <p className="text-xs text-stone-400 truncate">{f.name}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-stone-500 shrink-0">
                        {f.isContextual && (
                          <span className="bg-purple-50 text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded-full font-medium">
                            Contextual
                          </span>
                        )}
                        <span>{fmtNum(f.monthlyEstImpressions)} est. imp./mo</span>
                        <span className="font-semibold text-stone-700">{fmt(f.cpm)} CPM</span>
                        <span className="font-medium text-emerald-600">
                          {fmt((f.cpm / 1000) * f.monthlyEstImpressions, 0)}/mo
                        </span>
                        <span className={f.isActive ? "text-emerald-500" : "text-stone-300"}>
                          {f.isActive ? "●" : "○"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory breakdown */}
        <div>
          <h2 className="text-base font-bold text-stone-800 mb-3">Ad Inventory</h2>
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Placement</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden sm:table-cell">Size</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Est. Mo. Impr.</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Floor CPM</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Sold To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {report.inventory.map((inv) => (
                  <tr key={inv.placement} className="hover:bg-stone-50/50 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-stone-800">{inv.placement}</p>
                      <p className="text-xs text-stone-400">{inv.location}</p>
                    </td>
                    <td className="px-5 py-3.5 text-stone-500 hidden sm:table-cell font-mono text-xs">{inv.size}</td>
                    <td className="px-5 py-3.5 text-right text-stone-600 font-medium">{fmtNum(inv.estimatedMonthlyImpressions)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-amber-600">{fmt(inv.currentCpm)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex flex-wrap gap-1 justify-end">
                        {inv.advertisers.filter(Boolean).map((name) => (
                          <span
                            key={name}
                            className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${
                              BRAND_COLORS[name ?? ""] ?? "bg-stone-100 text-stone-600 border-stone-200"
                            }`}
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-stone-50 border-t border-stone-200">
                  <td colSpan={2} className="px-5 py-3 text-xs font-bold text-stone-700 uppercase tracking-wide">Totals</td>
                  <td className="px-5 py-3 text-right font-bold text-stone-700">
                    {fmtNum(report.inventory.reduce((s, i) => s + i.estimatedMonthlyImpressions, 0))}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-amber-600">
                    {fmt(report.inventory.reduce((s, i) => s + i.currentCpm, 0) / report.inventory.length)}
                    <span className="font-normal text-stone-400 ml-1">avg</span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer note */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-5 py-4">
          <p className="text-xs font-semibold text-amber-700 mb-1">Sales pipeline note</p>
          <p className="text-xs text-amber-600">
            Revenue estimates use impression volume projections × live CPM rates. Monthly impression
            figures are run-rate estimates based on current traffic mix — not actuals from Kevel
            impression log (analytics integration pending). CPM rates reflect the current highest bidder
            per format; additional advertiser competition will increase floor CPMs.
          </p>
        </div>

      </div>
    </div>
  );
}

"use client";

/**
 * MeasurementDashboardClient — Measurement & Attribution for FoodTrove Media
 *
 * Shows the full measurement story:
 * 1. Network-level attribution KPI strip
 * 2. 3P discrepancy rate tracking (vs. 5% threshold)
 * 3. Revenue attribution waterfall (click-through / view-through / post-purchase)
 * 4. Per-advertiser attribution breakdown (impressions → clicks → conversions → revenue)
 * 5. Attribution window config
 *
 * Data source: /api/admin/measurement (live Kevel + derived attribution model)
 */

import { useEffect, useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface FlightBreakdown {
  flightId: number;
  formatLabel: string;
  keyword: string;
  cpm: number;
  contextual: boolean;
  contextualLabel: string | null;
  isActive: boolean;
  impressions: number;
  spend: number;
  clicks: number;
  ctr: number;
  clickConversions: number;
  viewConversions: number;
}

interface AdvertiserSummary {
  impressions: number;
  spend: number;
  clicks: number;
  ctr: number;
  clickConversions: number;
  viewThroughConversions: number;
  crossSellConversions: number;
  totalConversions: number;
  attributedRevenue: number;
  roas: number;
  monthProgress: number;
}

interface Advertiser {
  advertiserId: number;
  advertiserName: string;
  slug: string;
  color: string;
  summary: AdvertiserSummary;
  flights: FlightBreakdown[];
}

interface DiscrepancyRecord {
  format: string;
  formatLabel: string;
  firstPartyImpressions: number;
  thirdPartyImpressions: number;
  discrepancyPct: number;
  status: "compliant" | "breach";
  threshold: number;
}

interface WaterfallItem {
  revenue: number;
  label: string;
  share: number;
}

interface RevenueWaterfall {
  clickThrough: WaterfallItem;
  viewThrough: WaterfallItem;
  crossSell: WaterfallItem;
  total: number;
}

interface AttributionConfig {
  windows: {
    viewThrough: { days: number; label: string };
    clickThrough: { days: number; label: string };
    postPurchase: { days: number; label: string };
  };
  activeConversionPixels: number;
  impressionPixelCoverage: number;
  lastVerified: string;
}

interface NetworkSummary {
  impressions: number;
  spend: number;
  clicks: number;
  ctr: number;
  conversions: number;
  attributedRevenue: number;
  avgDiscrepancyPct: number;
  discrepancyStatus: "compliant" | "breach";
  discrepancyTarget: number;
}

interface MeasurementResponse {
  meta: {
    networkId: number;
    generatedAt: string;
    dayOfMonth: number;
    daysInMonth: number;
    monthProgress: number;
    kevelConnected: boolean;
  };
  network: NetworkSummary;
  advertisers: Advertiser[];
  discrepancy: DiscrepancyRecord[];
  attribution: AttributionConfig;
  revenueWaterfall: RevenueWaterfall;
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function fmtMoney(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent = "stone",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "stone" | "emerald" | "blue" | "amber" | "red";
}) {
  const accentMap: Record<string, string> = {
    stone: "text-stone-900",
    emerald: "text-emerald-700",
    blue: "text-blue-700",
    amber: "text-amber-700",
    red: "text-red-700",
  };
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-2xl font-bold ${accentMap[accent]}`}>{value}</div>
      {sub && <div className="text-xs text-stone-400 mt-1">{sub}</div>}
    </div>
  );
}

function DiscrepancyMeter({
  record,
}: {
  record: DiscrepancyRecord;
}) {
  const isCompliant = record.status === "compliant";
  const barColor = isCompliant ? "bg-emerald-500" : "bg-red-500";
  const barWidth = Math.min((record.discrepancyPct / record.threshold) * 100, 100);

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-stone-800">{record.formatLabel}</div>
          <div className="text-xs text-stone-400 mt-0.5">
            1P: {fmtNum(record.firstPartyImpressions)} · 3P: {fmtNum(record.thirdPartyImpressions)}
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            isCompliant
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {isCompliant ? "✓ Compliant" : "⚠ Breach"}
        </span>
      </div>
      {/* Discrepancy bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div
          className={`text-sm font-bold tabular-nums ${
            isCompliant ? "text-emerald-700" : "text-red-700"
          }`}
        >
          {fmtPct(record.discrepancyPct)}
        </div>
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-stone-400">
        <span>0%</span>
        <span className="text-stone-500">Target: &lt;{record.threshold}%</span>
        <span>{record.threshold}%</span>
      </div>
    </div>
  );
}

function WaterfallBar({
  label,
  revenue,
  total,
  color,
}: {
  label: string;
  revenue: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (revenue / total) * 100 : 0;
  return (
    <div className="flex items-center gap-4">
      <div className="w-48 text-sm text-stone-600 text-right pr-2">{label}</div>
      <div className="flex-1 bg-stone-100 rounded-full h-5 overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all flex items-center pl-3`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        >
          <span className="text-xs font-semibold text-white whitespace-nowrap">
            {fmtMoney(revenue)}
          </span>
        </div>
      </div>
      <div className="w-12 text-sm text-stone-500 tabular-nums">{fmtPct(pct, 0)}</div>
    </div>
  );
}

function AdvertiserCard({
  adv,
  expanded,
  onToggle,
}: {
  adv: Advertiser;
  expanded: boolean;
  onToggle: () => void;
}) {
  const s = adv.summary;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full text-left px-6 py-5 hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: adv.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-stone-900">{adv.advertiserName}</div>
            <div className="text-xs text-stone-400 mt-0.5">
              {fmtNum(s.impressions)} impr · {fmtNum(s.clicks)} clicks · {fmtNum(s.totalConversions)} conv
            </div>
          </div>
          {/* Summary metrics */}
          <div className="hidden sm:flex items-center gap-8 text-right">
            <div>
              <div className="text-xs text-stone-400">Spend</div>
              <div className="text-sm font-semibold text-stone-800">{fmtMoney(s.spend)}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400">Attr. Rev</div>
              <div className="text-sm font-semibold text-emerald-700">{fmtMoney(s.attributedRevenue)}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400">ROAS</div>
              <div className="text-sm font-bold text-blue-700">{s.roas.toFixed(2)}×</div>
            </div>
          </div>
          <svg
            className={`h-4 w-4 text-stone-400 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded: attribution breakdown + flight table */}
      {expanded && (
        <div className="border-t border-stone-100 px-6 py-5 space-y-5">
          {/* Attribution breakdown */}
          <div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Attribution Breakdown</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-stone-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-stone-900">{fmtNum(s.clickConversions)}</div>
                <div className="text-xs text-stone-400">Click-through</div>
                <div className="text-xs text-stone-500 mt-0.5">30-day window</div>
              </div>
              <div className="bg-stone-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-stone-900">{fmtNum(s.viewThroughConversions)}</div>
                <div className="text-xs text-stone-400">View-through</div>
                <div className="text-xs text-stone-500 mt-0.5">1-day window</div>
              </div>
              <div className="bg-stone-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-stone-900">{fmtNum(s.crossSellConversions)}</div>
                <div className="text-xs text-stone-400">Cross-sell</div>
                <div className="text-xs text-stone-500 mt-0.5">Post-purchase</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-blue-800">{fmtPct(s.ctr)}</div>
                <div className="text-xs text-blue-600">CTR</div>
                <div className="text-xs text-stone-500 mt-0.5">{fmtMoney(s.spend)} spent</div>
              </div>
            </div>
          </div>

          {/* Flight table */}
          <div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Flight Breakdown</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-stone-400 border-b border-stone-100">
                    <th className="text-left pb-2 font-medium">Format</th>
                    <th className="text-right pb-2 font-medium">CPM</th>
                    <th className="text-right pb-2 font-medium">Impr</th>
                    <th className="text-right pb-2 font-medium">CTR</th>
                    <th className="text-right pb-2 font-medium">Clicks</th>
                    <th className="text-right pb-2 font-medium">Conv</th>
                    <th className="text-right pb-2 font-medium">Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {adv.flights.map((fl) => (
                    <tr key={fl.flightId} className={fl.isActive ? "" : "opacity-40"}>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-1.5">
                          {fl.contextual && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-violet-100 text-violet-700 font-medium">
                              ctx
                            </span>
                          )}
                          <span className="text-stone-700">{fl.formatLabel}</span>
                        </div>
                      </td>
                      <td className="py-2 text-right tabular-nums text-stone-600">${fl.cpm.toFixed(2)}</td>
                      <td className="py-2 text-right tabular-nums text-stone-600">{fmtNum(fl.impressions)}</td>
                      <td className="py-2 text-right tabular-nums text-stone-600">{fl.impressions > 0 ? fmtPct(fl.ctr, 2) : "—"}</td>
                      <td className="py-2 text-right tabular-nums text-stone-600">{fl.impressions > 0 ? fmtNum(fl.clicks) : "—"}</td>
                      <td className="py-2 text-right tabular-nums text-stone-600">
                        {fl.impressions > 0 ? fmtNum(fl.clickConversions + fl.viewConversions) : "—"}
                      </td>
                      <td className="py-2 text-right tabular-nums text-stone-700 font-medium">{fmtMoney(fl.spend)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MeasurementDashboardClient() {
  const [data, setData] = useState<MeasurementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAdv, setExpandedAdv] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/measurement", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: MeasurementResponse) => {
        // Compute waterfall shares
        const total = json.revenueWaterfall.total;
        if (total > 0) {
          json.revenueWaterfall.clickThrough.share = json.revenueWaterfall.clickThrough.revenue / total;
          json.revenueWaterfall.viewThrough.share = json.revenueWaterfall.viewThrough.revenue / total;
          json.revenueWaterfall.crossSell.share = json.revenueWaterfall.crossSell.revenue / total;
        }
        setData(json);
        // Default: expand first advertiser
        if (json.advertisers.length > 0) {
          setExpandedAdv(json.advertisers[0].advertiserId);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-stone-400 animate-pulse">Loading measurement data…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-red-500">Failed to load: {error ?? "no data"}</div>
      </div>
    );
  }

  const { network, advertisers, discrepancy, attribution, revenueWaterfall, meta } = data;

  const discCompliant = network.discrepancyStatus === "compliant";

  return (
    <div className="space-y-8">
      {/* Network KPI strip */}
      <section>
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">Network MTD</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Impressions" value={fmtNum(network.impressions)} sub="Month-to-date" />
          <KpiCard label="Clicks" value={fmtNum(network.clicks)} sub={`${fmtPct(network.ctr, 2)} CTR`} />
          <KpiCard label="Conversions" value={fmtNum(network.conversions)} sub="All windows" />
          <KpiCard label="Ad Spend" value={fmtMoney(network.spend)} sub="From advertisers" accent="blue" />
          <KpiCard label="Attr. Revenue" value={fmtMoney(network.attributedRevenue)} sub="Advertiser-attributed" accent="emerald" />
          <KpiCard
            label="Discrepancy"
            value={fmtPct(network.avgDiscrepancyPct)}
            sub={discCompliant ? `< ${network.discrepancyTarget}% target ✓` : `ABOVE ${network.discrepancyTarget}% threshold`}
            accent={discCompliant ? "emerald" : "red"}
          />
        </div>
      </section>

      {/* 3P Discrepancy section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
            3P Verification Discrepancy
          </h2>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              discCompliant
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${discCompliant ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
            />
            {discCompliant
              ? `All formats compliant (< ${network.discrepancyTarget}%)`
              : `Discrepancy breach detected`}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {discrepancy.map((rec) => (
            <DiscrepancyMeter key={rec.format} record={rec} />
          ))}
        </div>
        <div className="mt-3 p-3 bg-stone-50 rounded-xl text-xs text-stone-500 leading-relaxed">
          <strong className="text-stone-700">Methodology:</strong> FoodTrove compares impression counts from the Kevel event log (1P) against DoubleVerify-equivalent pixel counts (3P). Discrepancy = (1P − 3P) ÷ 1P. Threshold: &lt;5% per format, per month. Measurement integrity is a contractual commitment to advertisers.
        </div>
      </section>

      {/* Revenue attribution waterfall */}
      <section>
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
          Revenue Attribution Waterfall
        </h2>
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
          <WaterfallBar
            label="Click-through (30-day)"
            revenue={revenueWaterfall.clickThrough.revenue}
            total={revenueWaterfall.total}
            color="bg-blue-500"
          />
          <WaterfallBar
            label="View-through (1-day)"
            revenue={revenueWaterfall.viewThrough.revenue}
            total={revenueWaterfall.total}
            color="bg-emerald-500"
          />
          <WaterfallBar
            label="Post-purchase cross-sell"
            revenue={revenueWaterfall.crossSell.revenue}
            total={revenueWaterfall.total}
            color="bg-violet-500"
          />
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-sm text-stone-500 font-medium">Total attributed revenue</span>
            <span className="text-xl font-bold text-stone-900">{fmtMoney(revenueWaterfall.total)}</span>
          </div>
        </div>
      </section>

      {/* Attribution window config */}
      <section>
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
          Attribution Configuration
        </h2>
        <div className="bg-white border border-stone-200 rounded-2xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-stone-400 mb-1">Click-through window</div>
              <div className="text-2xl font-bold text-stone-900">{attribution.windows.clickThrough.days}d</div>
              <div className="text-xs text-stone-500 mt-1">{attribution.windows.clickThrough.label}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400 mb-1">View-through window</div>
              <div className="text-2xl font-bold text-stone-900">{attribution.windows.viewThrough.days}d</div>
              <div className="text-xs text-stone-500 mt-1">{attribution.windows.viewThrough.label}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400 mb-1">Post-purchase window</div>
              <div className="text-2xl font-bold text-stone-900">{attribution.windows.postPurchase.days}d</div>
              <div className="text-xs text-stone-500 mt-1">{attribution.windows.postPurchase.label}</div>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-stone-100 grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm">
                {attribution.activeConversionPixels}
              </div>
              <div>
                <div className="text-stone-700 font-medium">Conversion pixels</div>
                <div className="text-xs text-stone-400">Active (1 per advertiser)</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                {attribution.impressionPixelCoverage}%
              </div>
              <div>
                <div className="text-stone-700 font-medium">Impression pixel coverage</div>
                <div className="text-xs text-stone-400">All placements instrumented</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Per-advertiser breakdown */}
      <section>
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
          Advertiser Attribution
        </h2>
        <div className="space-y-3">
          {advertisers.map((adv) => (
            <AdvertiserCard
              key={adv.advertiserId}
              adv={adv}
              expanded={expandedAdv === adv.advertiserId}
              onToggle={() =>
                setExpandedAdv(expandedAdv === adv.advertiserId ? null : adv.advertiserId)
              }
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="text-xs text-stone-400 text-right">
        Generated: {new Date(meta.generatedAt).toLocaleString()} ·{" "}
        Day {meta.dayOfMonth} of {meta.daysInMonth} ({meta.monthProgress}% of month) ·{" "}
        Kevel Network {meta.networkId}{" "}
        {meta.kevelConnected ? "· Live data" : "· Demo mode"}
      </div>
    </div>
  );
}

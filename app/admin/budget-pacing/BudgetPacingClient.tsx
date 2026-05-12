"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DailySpend {
  day: number;
  date: string;
  impressions: number;
  spend: number;
  cumSpend: number;
  projectedCumSpend?: number;
}

interface FlightBudgetData {
  flightId: number;
  flightName: string;
  advertiserName: string;
  advertiserColor: string;
  format: string;
  cpm: number;
  contractedBudget: number;
  spendToDate: number;
  projectedTotal: number;
  projectedOverUnder: number;
  daysElapsed: number;
  daysTotal: number;
  daysRemaining: number;
  flightStartDate: string;
  flightEndDate: string;
  status: "on-track" | "at-risk-over" | "at-risk-under" | "ended";
  dailyHistory: DailySpend[];
  dailyBurnRate: number;
  requiredDailyBurnRate: number;
  paceVsRequired: number;
}

interface NetworkSummary {
  totalContractedRevenue: number;
  totalSpendToDate: number;
  totalProjectedRevenue: number;
  projectedRevenueGap: number;
  flightsOnTrack: number;
  flightsAtRisk: number;
  avgPaceRatio: number;
}

interface BudgetPacingResponse {
  flights: FlightBudgetData[];
  networkSummary: NetworkSummary;
  liveCPMEnrichment: { flightId: number; cpm: number } | null;
  generatedAt: string;
}

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function statusConfig(status: FlightBudgetData["status"]) {
  const map = {
    "on-track": { label: "On track", color: "text-emerald-400", bg: "bg-emerald-900/30 border-emerald-800", bar: "bg-emerald-500" },
    "at-risk-over": { label: "Risk: over-spend", color: "text-sky-400", bg: "bg-sky-900/30 border-sky-800", bar: "bg-sky-500" },
    "at-risk-under": { label: "Risk: under-delivery", color: "text-amber-400", bg: "bg-amber-900/30 border-amber-800", bar: "bg-amber-500" },
    ended: { label: "Ended", color: "text-zinc-500", bg: "bg-zinc-800 border-zinc-700", bar: "bg-zinc-600" },
  };
  return map[status];
}

// Mini spark-chart using SVG
function SparkLine({ history, contractedBudget, color }: { history: DailySpend[]; contractedBudget: number; color: string }) {
  const W = 200;
  const H = 48;
  const maxSpend = Math.max(contractedBudget * 1.1, ...history.map((d) => d.cumSpend));
  const points = history.map((d, i) => {
    const x = (i / Math.max(history.length - 1, 1)) * W;
    const y = H - (d.cumSpend / maxSpend) * H;
    return `${x},${y}`;
  });
  const pastCount = history.filter((d) => d.projectedCumSpend === undefined).length;
  const pastPoints = points.slice(0, pastCount).join(" ");
  const futurePoints = points.slice(pastCount - 1).join(" ");

  // Contracted budget line
  const budgetY = H - (contractedBudget / maxSpend) * H;

  return (
    <svg width={W} height={H} className="overflow-visible">
      {/* Budget target line */}
      <line x1={0} y1={budgetY} x2={W} y2={budgetY} stroke="#6b7280" strokeWidth={1} strokeDasharray="3,3" />
      {/* Past actual spend */}
      <polyline points={pastPoints} fill="none" stroke={color} strokeWidth={1.5} />
      {/* Projected spend (dashed) */}
      {futurePoints && (
        <polyline points={futurePoints} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="4,3" opacity={0.5} />
      )}
    </svg>
  );
}

export default function BudgetPacingClient() {
  const [data, setData] = useState<BudgetPacingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"advertiser" | "status" | "at-risk">("at-risk");
  const [selectedFlight, setSelectedFlight] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/budget-pacing")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse">Loading budget pacing…</div>
      </div>
    );
  }

  const { flights, networkSummary } = data;

  // Sort
  const sorted = [...flights].sort((a, b) => {
    if (sortBy === "at-risk") {
      // At-risk first, then on-track, then ended
      const order = { "at-risk-under": 0, "at-risk-over": 1, "on-track": 2, ended: 3 };
      return order[a.status] - order[b.status];
    }
    if (sortBy === "advertiser") return a.advertiserName.localeCompare(b.advertiserName);
    // status alpha
    return a.status.localeCompare(b.status);
  });

  const detail = selectedFlight !== null ? flights.find((f) => f.flightId === selectedFlight) : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-zinc-500 hover:text-zinc-300 text-sm">← Admin</Link>
          <span className="text-zinc-700">/</span>
          <h1 className="text-lg font-semibold text-zinc-100">Budget Pacing</h1>
          <span className="ml-2 text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">Spend projections</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {data.liveCPMEnrichment && (
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              Live CPM: ${data.liveCPMEnrichment.cpm.toFixed(2)}
            </span>
          )}
          <span>Updated: {new Date(data.generatedAt).toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Network summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Contracted Revenue",
              value: fmt(networkSummary.totalContractedRevenue),
              sub: "Q2 committed",
              accent: "text-zinc-200",
            },
            {
              label: "Spend To Date",
              value: fmt(networkSummary.totalSpendToDate),
              sub: `${pct(networkSummary.totalSpendToDate / networkSummary.totalContractedRevenue)} of contracted`,
              accent: "text-zinc-200",
            },
            {
              label: "Projected Revenue",
              value: fmt(networkSummary.totalProjectedRevenue),
              sub: networkSummary.projectedRevenueGap >= 0
                ? `${fmt(networkSummary.projectedRevenueGap)} over contracted`
                : `${fmt(Math.abs(networkSummary.projectedRevenueGap))} shortfall`,
              accent: networkSummary.projectedRevenueGap >= 0 ? "text-emerald-400" : "text-amber-400",
            },
            {
              label: "Flights At Risk",
              value: `${networkSummary.flightsAtRisk} / ${flights.length}`,
              sub: `${networkSummary.flightsOnTrack} on track`,
              accent: networkSummary.flightsAtRisk > 0 ? "text-amber-400" : "text-emerald-400",
            },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-500 mb-1">{kpi.label}</div>
              <div className={`text-xl font-bold ${kpi.accent}`}>{kpi.value}</div>
              <div className="text-xs text-zinc-600 mt-0.5">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs text-zinc-500">Sort:</span>
          {(["at-risk", "advertiser", "status"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                sortBy === s
                  ? "bg-zinc-700 text-zinc-200 border-zinc-600"
                  : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300"
              }`}
            >
              {s === "at-risk" ? "At-risk first" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Flight cards */}
        <div className="space-y-3">
          {sorted.map((flight) => {
            const cfg = statusConfig(flight.status);
            const spendPct = flight.spendToDate / flight.contractedBudget;
            const projPct = flight.projectedTotal / flight.contractedBudget;
            const isExpanded = selectedFlight === flight.flightId;

            return (
              <div
                key={flight.flightId}
                className={`bg-zinc-900 border rounded-xl overflow-hidden transition-all`}
                style={{ borderColor: isExpanded ? flight.advertiserColor + "66" : undefined }}
              >
                {/* Row header */}
                <button
                  className="w-full text-left p-4 hover:bg-zinc-800/50 transition-colors"
                  onClick={() => setSelectedFlight(isExpanded ? null : flight.flightId)}
                >
                  <div className="flex items-center gap-4">
                    {/* Advertiser dot */}
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: flight.advertiserColor }}
                    />

                    {/* Name + format */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-200 truncate">{flight.flightName}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {flight.format} · {fmt(flight.cpm)} CPM · {flight.daysElapsed}d elapsed / {flight.daysTotal}d total
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>

                    {/* Key numbers */}
                    <div className="hidden md:flex items-center gap-6 text-right flex-shrink-0">
                      <div>
                        <div className="text-xs text-zinc-500">Spend to date</div>
                        <div className="text-sm font-medium text-zinc-200">{fmt(flight.spendToDate)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">Projected total</div>
                        <div className={`text-sm font-medium ${flight.projectedOverUnder < -100 ? "text-amber-400" : flight.projectedOverUnder > 100 ? "text-sky-400" : "text-zinc-200"}`}>
                          {fmt(flight.projectedTotal)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">vs. contracted</div>
                        <div className={`text-sm font-medium ${flight.projectedOverUnder < 0 ? "text-amber-400" : "text-emerald-400"}`}>
                          {flight.projectedOverUnder >= 0 ? "+" : ""}{fmt(flight.projectedOverUnder)}
                        </div>
                      </div>
                    </div>

                    <span className="text-zinc-600 text-sm ml-2">{isExpanded ? "▲" : "▼"}</span>
                  </div>

                  {/* Spend bars */}
                  <div className="mt-3 space-y-1.5">
                    {/* Actual spend bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-600 w-20 text-right">Spent</span>
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cfg.bar}`}
                          style={{ width: `${Math.min(100, spendPct * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500 w-10">{pct(spendPct)}</span>
                    </div>
                    {/* Projected bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-600 w-20 text-right">Projected</span>
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full opacity-40 ${cfg.bar}`}
                          style={{ width: `${Math.min(120, projPct * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-600 w-10">{pct(projPct)}</span>
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Burn rate metrics */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Burn Rate Analysis</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: "Actual daily burn", value: fmt(flight.dailyBurnRate), sub: "avg to date" },
                            { label: "Required daily burn", value: fmt(flight.requiredDailyBurnRate), sub: "to hit contracted" },
                            { label: "Pace ratio", value: `${(flight.paceVsRequired * 100).toFixed(0)}%`, sub: ">100% = ahead" },
                            { label: "Days remaining", value: flight.daysRemaining.toString(), sub: `of ${flight.daysTotal}d total` },
                          ].map((m) => (
                            <div key={m.label} className="bg-zinc-950/60 rounded-lg p-3">
                              <div className="text-xs text-zinc-500 mb-1">{m.label}</div>
                              <div className="text-base font-bold text-zinc-100">{m.value}</div>
                              <div className="text-xs text-zinc-600">{m.sub}</div>
                            </div>
                          ))}
                        </div>

                        {/* Flight dates */}
                        <div className="text-xs text-zinc-600 space-y-0.5">
                          <div>Start: {flight.flightStartDate} · End: {flight.flightEndDate}</div>
                          <div>Contracted: {fmt(flight.contractedBudget)} · CPM: ${flight.cpm.toFixed(2)}</div>
                        </div>
                      </div>

                      {/* Spark chart */}
                      <div>
                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                          Cumulative Spend — Actual vs. Projection
                        </h3>
                        <div className="bg-zinc-950/60 rounded-lg p-3 overflow-x-auto">
                          <SparkLine
                            history={flight.dailyHistory}
                            contractedBudget={flight.contractedBudget}
                            color={flight.advertiserColor}
                          />
                          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-600">
                            <span className="flex items-center gap-1">
                              <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke={flight.advertiserColor} strokeWidth="2" /></svg>
                              Actual
                            </span>
                            <span className="flex items-center gap-1">
                              <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke={flight.advertiserColor} strokeWidth="2" strokeDasharray="4,3" opacity={0.5} /></svg>
                              Projected
                            </span>
                            <span className="flex items-center gap-1">
                              <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#6b7280" strokeWidth="1" strokeDasharray="3,3" /></svg>
                              Budget target
                            </span>
                          </div>
                        </div>

                        {/* Action callout */}
                        {flight.status === "at-risk-under" && (
                          <div className="mt-3 bg-amber-950/40 border border-amber-800/50 rounded-lg px-3 py-2.5 text-xs text-amber-200/80">
                            <strong className="text-amber-300">Under-delivery risk:</strong> At current burn rate,
                            projected shortfall is {fmt(Math.abs(flight.projectedOverUnder))}. Consider increasing
                            keyword targeting reach or adding placements. Contact Tyler for renewal discussion.
                          </div>
                        )}
                        {flight.status === "at-risk-over" && (
                          <div className="mt-3 bg-sky-950/40 border border-sky-800/50 rounded-lg px-3 py-2.5 text-xs text-sky-200/80">
                            <strong className="text-sky-300">Over-spend risk:</strong> Projected to deliver{" "}
                            {fmt(flight.projectedOverUnder)} above contracted. Review pacing caps or surface
                            make-good options if the advertiser hasn&apos;t approved incremental spend.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-8 text-xs text-zinc-600 text-center">
          Projections use current daily burn rate with 5% regression-to-mean over remaining flight days.
          Live CPM sourced from Kevel Management API (Organic Valley Billboard); others use contracted CPMs.
          For billing reconciliation, see{" "}
          <Link href="/admin/billing" className="text-zinc-400 hover:text-zinc-300">Invoice Reconciliation →</Link>
        </div>
      </div>
    </div>
  );
}

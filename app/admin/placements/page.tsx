"use client";

/**
 * /admin/placements — Placement Yield Manager
 *
 * Visual map of every Kevel ad slot across the FoodTrove storefront.
 * Surfaces fill rate, realized CPM, yield efficiency, and revenue per slot.
 *
 * Owner: Kai (Engineering) — primary users: Casey (Ad Ops), Tyler (Sales)
 *
 * Data source: /api/admin/placements
 */

import { useEffect, useState, useCallback } from "react";

// ─── Types (mirrors API response) ─────────────────────────────────────────────

interface PlacementDef {
  id: string;
  page: string;
  pageSlug: string;
  pageType: string;
  format: "billboard" | "leaderboard" | "mrec";
  formatKeyword: string;
  dimensions: string;
  position: string;
  contextualKeywords: string[];
  monthlyTrafficEstimate: number;
  cpmFloor: number;
  notes?: string;
}

interface PlacementMetrics {
  fillRate: number;
  realizedCpm: number;
  floorCpm: number;
  yieldEfficiency: number;
  dailyImpressions: number;
  dailyRevenue: number;
  monthlyRevenue: number;
  winnerAdvertiser: string | null;
  competingFlights: number;
  contextualBoost: boolean;
  status: "healthy" | "under-monetized" | "untargeted" | "at-risk";
  statusReason: string;
}

interface PlacementItem {
  def: PlacementDef;
  metrics: PlacementMetrics;
}

interface PageGroup {
  page: string;
  pageSlug: string;
  pageType: string;
  slots: PlacementItem[];
}

interface Summary {
  totalSlots: number;
  healthySlots: number;
  untargetedSlots: number;
  atRiskSlots: number;
  underMonetizedSlots: number;
  totalMonthlyRevenue: number;
  totalMonthlyImpressions: number;
  avgFillRate: number;
  avgRealizedCpm: number;
  revenueUpside: number;
}

interface ApiResponse {
  summary: Summary;
  placements: PlacementItem[];
  byPage: PageGroup[];
  liveKevelData: boolean;
  generatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return n >= 1000
    ? `$${(n / 1000).toFixed(1)}K`
    : `$${n.toFixed(0)}`;
}

function fmtImpressions(n: number) {
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(0)}K`
      : String(n);
}

function statusColors(status: PlacementMetrics["status"]) {
  switch (status) {
    case "healthy":
      return {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        dot: "bg-emerald-400",
        label: "text-emerald-400",
        badge: "bg-emerald-900/40 text-emerald-300 border border-emerald-700/40",
      };
    case "under-monetized":
      return {
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        dot: "bg-amber-400",
        label: "text-amber-400",
        badge: "bg-amber-900/40 text-amber-300 border border-amber-700/40",
      };
    case "untargeted":
      return {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        dot: "bg-red-400",
        label: "text-red-400",
        badge: "bg-red-900/40 text-red-300 border border-red-700/40",
      };
    case "at-risk":
      return {
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
        dot: "bg-orange-400",
        label: "text-orange-400",
        badge: "bg-orange-900/40 text-orange-300 border border-orange-700/40",
      };
  }
}

function formatLabel(format: string) {
  switch (format) {
    case "billboard":
      return "Billboard";
    case "leaderboard":
      return "Leaderboard";
    case "mrec":
      return "MRec";
    default:
      return format;
  }
}

function pageTypeIcon(pageType: string) {
  switch (pageType) {
    case "homepage":
      return "🏠";
    case "department":
      return "🏬";
    case "product":
      return "🛒";
    case "search":
      return "🔍";
    case "deals":
      return "🔥";
    case "weekly-deals":
      return "📋";
    case "post-purchase":
      return "✅";
    case "account":
      return "👤";
    case "brand":
      return "⭐";
    default:
      return "📄";
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlacementCard({ item }: { item: PlacementItem }) {
  const { def, metrics } = item;
  const colors = statusColors(metrics.status);
  const [expanded, setExpanded] = useState(false);

  const statusLabel = {
    healthy: "Healthy",
    "under-monetized": "Under-monetized",
    untargeted: "Untargeted",
    "at-risk": "At Risk",
  }[metrics.status];

  return (
    <div
      className={`rounded-xl border ${colors.border} ${colors.bg} p-4 transition-all`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              {statusLabel}
            </span>
            <span className="text-xs text-stone-400 bg-stone-800/50 px-2 py-0.5 rounded-full border border-stone-700/40">
              {formatLabel(def.format)} · {def.dimensions}
            </span>
            {metrics.contextualBoost && (
              <span className="text-xs text-purple-300 bg-purple-900/30 px-2 py-0.5 rounded-full border border-purple-700/40">
                ✦ Contextual
              </span>
            )}
          </div>
          <p className="text-sm font-mono text-stone-400 mt-1.5 truncate">
            {def.id}
          </p>
          <p className="text-xs text-stone-500 mt-0.5">{def.position}</p>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="shrink-0 text-xs text-stone-500 hover:text-stone-300 transition-colors mt-0.5"
        >
          {expanded ? "▲ less" : "▼ more"}
        </button>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <div>
          <p className="text-xs text-stone-500">Fill rate</p>
          <p className="text-lg font-bold text-stone-100">
            {metrics.fillRate.toFixed(0)}
            <span className="text-sm font-normal text-stone-400">%</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-stone-500">Realized CPM</p>
          <p className="text-lg font-bold text-stone-100">
            ${metrics.realizedCpm.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-stone-500">Yield efficiency</p>
          <p className="text-lg font-bold text-stone-100">
            {metrics.yieldEfficiency.toFixed(0)}
            <span className="text-sm font-normal text-stone-400">%</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-stone-500">Mo. revenue</p>
          <p className="text-lg font-bold text-emerald-400">
            {fmtCurrency(metrics.monthlyRevenue)}
          </p>
        </div>
      </div>

      {/* Fill rate bar */}
      <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${
            metrics.fillRate >= 88
              ? "bg-emerald-500"
              : metrics.fillRate >= 70
                ? "bg-amber-500"
                : "bg-red-500"
          }`}
          style={{ width: `${metrics.fillRate}%` }}
        />
      </div>

      {/* Status reason */}
      <p className={`text-xs ${colors.label} leading-snug`}>
        {metrics.statusReason}
      </p>

      {/* Winner + competing flights */}
      <div className="mt-2 flex items-center gap-3 flex-wrap">
        {metrics.winnerAdvertiser ? (
          <span className="text-xs text-stone-400">
            Winner:{" "}
            <span className="text-stone-200 font-medium">
              {metrics.winnerAdvertiser}
            </span>
          </span>
        ) : (
          <span className="text-xs text-red-400">No eligible flights</span>
        )}
        <span className="text-xs text-stone-500">
          {metrics.competingFlights} competing flight
          {metrics.competingFlights !== 1 ? "s" : ""}
        </span>
        <span className="text-xs text-stone-500">
          Floor: ${metrics.floorCpm.toFixed(2)} CPM
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-stone-700/40 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-stone-500">Daily impressions</p>
              <p className="text-sm font-semibold text-stone-200">
                {fmtImpressions(metrics.dailyImpressions)}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Daily revenue</p>
              <p className="text-sm font-semibold text-stone-200">
                ${metrics.dailyRevenue.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Monthly traffic est.</p>
              <p className="text-sm font-semibold text-stone-200">
                {fmtImpressions(def.monthlyTrafficEstimate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Format keyword</p>
              <p className="text-sm font-mono text-stone-300">
                {def.formatKeyword}
              </p>
            </div>
          </div>
          {def.contextualKeywords.length > 0 && (
            <div>
              <p className="text-xs text-stone-500 mb-1">
                Contextual keywords passed
              </p>
              <div className="flex flex-wrap gap-1.5">
                {def.contextualKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs bg-stone-800 border border-stone-700/60 text-stone-300 px-2 py-0.5 rounded-full"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          {def.notes && (
            <p className="text-xs text-stone-400 italic border-l-2 border-stone-600 pl-3">
              {def.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PageGroupSection({ group }: { group: PageGroup }) {
  const pageRevenue = group.slots.reduce(
    (s, p) => s + p.metrics.monthlyRevenue,
    0
  );
  const hasIssues = group.slots.some(
    (p) =>
      p.metrics.status === "untargeted" || p.metrics.status === "at-risk"
  );

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{pageTypeIcon(group.pageType)}</span>
          <div>
            <h3 className="text-base font-semibold text-stone-100">
              {group.page}
            </h3>
            <span className="text-xs text-stone-500 font-mono">
              {group.pageSlug}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-emerald-400">
            {fmtCurrency(pageRevenue)}
            <span className="text-xs font-normal text-stone-500">/mo</span>
          </p>
          <p className="text-xs text-stone-500">
            {group.slots.length} slot{group.slots.length !== 1 ? "s" : ""}
            {hasIssues && (
              <span className="ml-1 text-amber-400">⚠ needs attention</span>
            )}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {group.slots.map((slot) => (
          <PlacementCard key={slot.def.id} item={slot} />
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type FilterStatus =
  | "all"
  | "healthy"
  | "under-monetized"
  | "untargeted"
  | "at-risk";
type FilterFormat = "all" | "billboard" | "leaderboard" | "mrec";

export default function PlacementsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"pages" | "slots">("pages");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterFormat, setFilterFormat] = useState<FilterFormat>("all");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/placements")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ApiResponse>;
      })
      .then((d) => {
        setData(d);
        setLastRefresh(new Date());
        setError(null);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5 * 60 * 1000); // 5-min auto-refresh
    return () => clearInterval(t);
  }, [load]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-400 text-sm animate-pulse">
          Loading placement data…
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-red-400 text-sm">
          Failed to load: {error}
        </div>
      </div>
    );
  }

  const s = data!.summary;

  // Filtered placements for "slots" view
  const filteredPlacements = (data?.placements ?? []).filter((p) => {
    if (filterStatus !== "all" && p.metrics.status !== filterStatus) return false;
    if (filterFormat !== "all" && p.def.format !== filterFormat) return false;
    return true;
  });

  // Filtered page groups for "pages" view
  const filteredByPage = (data?.byPage ?? [])
    .map((pg) => ({
      ...pg,
      slots: pg.slots.filter((p) => {
        if (filterStatus !== "all" && p.metrics.status !== filterStatus) return false;
        if (filterFormat !== "all" && p.def.format !== filterFormat) return false;
        return true;
      }),
    }))
    .filter((pg) => pg.slots.length > 0);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <div className="border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-stone-500 mb-1">
                <a href="/admin" className="hover:text-stone-300 transition-colors">
                  Admin
                </a>
                <span>›</span>
                <span>Placement Yield Manager</span>
              </div>
              <h1 className="text-2xl font-bold text-stone-100">
                Placement Yield Manager
              </h1>
              <p className="text-sm text-stone-400 mt-1">
                Every Kevel ad slot across the FoodTrove storefront — fill
                rate, CPM, and revenue by placement.
              </p>
            </div>
            <div className="text-right shrink-0">
              <button
                onClick={load}
                disabled={loading}
                className="text-xs text-stone-400 hover:text-stone-200 border border-stone-700 hover:border-stone-500 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? "Refreshing…" : "↺ Refresh"}
              </button>
              {lastRefresh && (
                <p className="text-xs text-stone-600 mt-1">
                  {lastRefresh.toLocaleTimeString()}
                </p>
              )}
              {data?.liveKevelData && (
                <p className="text-xs text-emerald-500 mt-1">
                  ● Live Kevel CPM
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Network KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            {
              label: "Total slots",
              value: String(s.totalSlots),
              sub: "across all pages",
              color: "text-stone-100",
            },
            {
              label: "Healthy",
              value: String(s.healthySlots),
              sub: `of ${s.totalSlots} slots`,
              color: "text-emerald-400",
            },
            {
              label: "Untargeted",
              value: String(s.untargetedSlots),
              sub: "no eligible flights",
              color: s.untargetedSlots > 0 ? "text-red-400" : "text-stone-400",
            },
            {
              label: "At risk",
              value: String(s.atRiskSlots),
              sub: "fill rate < 75%",
              color:
                s.atRiskSlots > 0 ? "text-orange-400" : "text-stone-400",
            },
            {
              label: "Avg fill rate",
              value: `${s.avgFillRate}%`,
              sub: "network average",
              color: s.avgFillRate >= 80 ? "text-emerald-400" : "text-amber-400",
            },
            {
              label: "Mo. revenue",
              value: fmtCurrency(s.totalMonthlyRevenue),
              sub: `+${fmtCurrency(s.revenueUpside)} upside`,
              color: "text-emerald-400",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-stone-900 border border-stone-800 rounded-xl p-4"
            >
              <p className="text-xs text-stone-500 mb-1">{kpi.label}</p>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-stone-600 mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Revenue upside callout */}
        {s.revenueUpside > 0 && (
          <div className="mb-6 bg-amber-950/30 border border-amber-800/40 rounded-xl px-5 py-4 flex items-start gap-4">
            <span className="text-xl mt-0.5">💡</span>
            <div>
              <p className="text-sm font-semibold text-amber-300">
                {fmtCurrency(s.revenueUpside)}/mo in untapped inventory
              </p>
              <p className="text-sm text-amber-200/70 mt-0.5">
                {s.untargetedSlots} slot
                {s.untargetedSlots !== 1 ? "s" : ""} have no active flights and{" "}
                {s.underMonetizedSlots} slot
                {s.underMonetizedSlots !== 1 ? "s" : ""} are under-monetized.
                Tyler: these are the inventory gaps to pitch new advertisers on.
              </p>
            </div>
          </div>
        )}

        {/* Filters + view toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {/* Status filter */}
            {(
              [
                "all",
                "healthy",
                "under-monetized",
                "untargeted",
                "at-risk",
              ] as FilterStatus[]
            ).map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  filterStatus === f
                    ? "bg-stone-700 border-stone-500 text-stone-100"
                    : "border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200"
                }`}
              >
                {f === "all"
                  ? "All status"
                  : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <span className="w-px bg-stone-700 self-stretch" />
            {/* Format filter */}
            {(
              ["all", "billboard", "leaderboard", "mrec"] as FilterFormat[]
            ).map((f) => (
              <button
                key={f}
                onClick={() => setFilterFormat(f)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  filterFormat === f
                    ? "bg-stone-700 border-stone-500 text-stone-100"
                    : "border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200"
                }`}
              >
                {f === "all" ? "All formats" : formatLabel(f)}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex border border-stone-700 rounded-lg overflow-hidden">
            {(["pages", "slots"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`text-xs px-3 py-1.5 transition-all ${
                  view === v
                    ? "bg-stone-700 text-stone-100"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                {v === "pages" ? "By page" : "All slots"}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        {view === "pages" ? (
          filteredByPage.length === 0 ? (
            <div className="text-center py-16 text-stone-500 text-sm">
              No placements match the current filter.
            </div>
          ) : (
            filteredByPage.map((group) => (
              <PageGroupSection key={group.pageSlug} group={group} />
            ))
          )
        ) : (
          <div>
            <p className="text-xs text-stone-500 mb-4">
              {filteredPlacements.length} placement
              {filteredPlacements.length !== 1 ? "s" : ""} — sorted by monthly
              revenue (desc)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredPlacements
                .sort((a, b) => b.metrics.monthlyRevenue - a.metrics.monthlyRevenue)
                .map((p) => (
                  <div key={p.def.id}>
                    <p className="text-xs text-stone-500 mb-1 font-medium flex items-center gap-1">
                      <span>{pageTypeIcon(p.def.pageType)}</span>
                      <span>{p.def.page}</span>
                    </p>
                    <PlacementCard item={p} />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-stone-800 flex items-center justify-between text-xs text-stone-600">
          <span>
            Placement Yield Manager — {data?.placements.length ?? 0} slots ·
            FoodTrove Media Network 12024
          </span>
          {data?.generatedAt && (
            <span>
              Generated {new Date(data.generatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

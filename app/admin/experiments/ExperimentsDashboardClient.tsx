"use client";

/**
 * ExperimentsDashboardClient — A/B Experiment Registry for Kai / Casey
 *
 * Displays the current experiment registry: all active and planned A/B tests,
 * their control/variant configuration, metrics, and outcome summaries.
 *
 * Experiments are defined in /api/admin/experiments and reference real Kevel
 * flight IDs — this is the canonical experiment log for the FoodTrove network.
 */

import { useEffect, useState } from "react";

type ExperimentStatus = "active" | "planned" | "completed";
type ExperimentType =
  | "creative_variant"
  | "format_allocation"
  | "contextual_targeting"
  | "placement_position";
type ExperimentOutcome = "variant_winning" | "control_winning" | "inconclusive" | null;

interface ExperimentArm {
  label: string;
  description: string;
  flightIds: number[];
  cpm: number;
  keywords: string[];
}

interface ExperimentMetrics {
  controlImpressions: number | null;
  variantImpressions: number | null;
  controlCtr: number | null;
  variantCtr: number | null;
  controlCpm: number | null;
  variantCpm: number | null;
  upliftPct: number | null;
  confidence: number | null;
  winner: "variant" | "control" | null;
}

interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  status: ExperimentStatus;
  startDate: string | null;
  endDate: string | null;
  type: ExperimentType;
  owner: string;
  advertiser: string;
  advertiserId: number | null;
  control: ExperimentArm;
  variant: ExperimentArm;
  metrics: ExperimentMetrics | null;
  notes: string;
  outcome: ExperimentOutcome;
}

interface ExperimentSummary {
  total: number;
  active: number;
  planned: number;
  completed: number;
  variantWinning: number;
  avgConfidence: number;
}

interface ExperimentsResponse {
  experiments: Experiment[];
  summary: ExperimentSummary;
  meta: {
    networkId: number;
    fetchedAt: string;
    note: string;
  };
}

const TYPE_LABELS: Record<ExperimentType, string> = {
  creative_variant: "Creative Variant",
  format_allocation: "Format Allocation",
  contextual_targeting: "Contextual Targeting",
  placement_position: "Placement Position",
};

const TYPE_COLORS: Record<ExperimentType, string> = {
  creative_variant: "bg-purple-50 text-purple-700 border-purple-200",
  format_allocation: "bg-blue-50 text-blue-700 border-blue-200",
  contextual_targeting: "bg-teal-50 text-teal-700 border-teal-200",
  placement_position: "bg-orange-50 text-orange-700 border-orange-200",
};

function StatusBadge({ status }: { status: ExperimentStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
        Active
      </span>
    );
  }
  if (status === "planned") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-xs font-medium border border-stone-200">
        <span className="w-1.5 h-1.5 rounded-full bg-stone-400 inline-block" />
        Planned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-medium border border-sky-200">
      Completed
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: ExperimentOutcome }) {
  if (!outcome) return null;
  if (outcome === "variant_winning") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
        ✓ Variant winning
      </span>
    );
  }
  if (outcome === "control_winning") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
        Control winning
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-xs font-semibold border border-stone-200">
      Inconclusive
    </span>
  );
}

function ConfidenceBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-stone-400">—</span>;
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? "bg-emerald-500" : pct >= 75 ? "bg-amber-400" : "bg-stone-300";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-stone-500">{pct}%</span>
    </div>
  );
}

function MetricCell({ value, format }: { value: number | null; format: "int" | "pct" | "cpm" | "uplift" }) {
  if (value === null) return <span className="text-xs text-stone-400">—</span>;
  if (format === "int") {
    return <span className="text-xs font-mono text-stone-700">{value.toLocaleString()}</span>;
  }
  if (format === "pct") {
    return <span className="text-xs font-mono text-stone-700">{(value * 100).toFixed(2)}%</span>;
  }
  if (format === "cpm") {
    return <span className="text-xs font-mono text-stone-700">${value.toFixed(2)}</span>;
  }
  if (format === "uplift") {
    const color = value > 0 ? "text-emerald-700" : "text-red-700";
    return (
      <span className={`text-xs font-mono font-semibold ${color}`}>
        {value > 0 ? "+" : ""}{value}%
      </span>
    );
  }
  return null;
}

function ExperimentCard({ exp }: { exp: Experiment }) {
  const [expanded, setExpanded] = useState(false);
  const hasMetrics = exp.metrics !== null;

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-stone-400">{exp.id}</span>
              <StatusBadge status={exp.status} />
              <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${TYPE_COLORS[exp.type]}`}>
                {TYPE_LABELS[exp.type]}
              </span>
              {exp.outcome && <OutcomeBadge outcome={exp.outcome} />}
            </div>
            <h3 className="text-sm font-semibold text-stone-900 leading-snug">{exp.name}</h3>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{exp.hypothesis}</p>
          </div>
        </div>

        {/* Quick metrics row */}
        {hasMetrics && exp.metrics && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-stone-50 rounded-lg p-2.5">
              <div className="text-xs text-stone-400 mb-0.5">Variant Imps</div>
              <MetricCell value={exp.metrics.variantImpressions} format="int" />
            </div>
            <div className="bg-stone-50 rounded-lg p-2.5">
              <div className="text-xs text-stone-400 mb-0.5">CTR Lift</div>
              {exp.metrics.controlCtr !== null && exp.metrics.variantCtr !== null ? (
                <span className="text-xs font-mono font-semibold text-emerald-700">
                  +{Math.round(((exp.metrics.variantCtr - exp.metrics.controlCtr) / exp.metrics.controlCtr) * 100)}%
                </span>
              ) : (
                <span className="text-xs text-stone-400">—</span>
              )}
            </div>
            <div className="bg-stone-50 rounded-lg p-2.5">
              <div className="text-xs text-stone-400 mb-0.5">CPM Uplift</div>
              <MetricCell value={exp.metrics.upliftPct} format="uplift" />
            </div>
            <div className="bg-stone-50 rounded-lg p-2.5">
              <div className="text-xs text-stone-400 mb-0.5">Confidence</div>
              <ConfidenceBar value={exp.metrics.confidence} />
            </div>
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-1"
        >
          {expanded ? "▲ Hide details" : "▼ Show details"}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-stone-100 px-5 py-4 space-y-4">
          {/* Arms comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-stone-50 rounded-lg p-3 border border-stone-200">
              <div className="text-xs font-semibold text-stone-500 mb-1.5">Control</div>
              <div className="text-xs font-medium text-stone-800">{exp.control.label}</div>
              <div className="text-xs text-stone-500 mt-0.5">{exp.control.description}</div>
              {exp.control.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {exp.control.keywords.map((kw) => (
                    <span key={kw} className="text-xs px-1.5 py-0.5 bg-stone-200 text-stone-600 rounded font-mono">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
              {exp.control.flightIds.length > 0 && (
                <div className="mt-1.5 text-xs text-stone-400">
                  Flight IDs: {exp.control.flightIds.join(", ")}
                </div>
              )}
              {hasMetrics && exp.metrics && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-xs text-stone-400">Imps</div>
                    <MetricCell value={exp.metrics.controlImpressions} format="int" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-400">CTR</div>
                    <MetricCell value={exp.metrics.controlCtr} format="pct" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-400">CPM</div>
                    <MetricCell value={exp.metrics.controlCpm} format="cpm" />
                  </div>
                </div>
              )}
            </div>

            <div className={`rounded-lg p-3 border ${exp.metrics?.winner === "variant" ? "bg-emerald-50 border-emerald-200" : "bg-stone-50 border-stone-200"}`}>
              <div className="text-xs font-semibold text-stone-500 mb-1.5">
                Variant {exp.metrics?.winner === "variant" && "✓"}
              </div>
              <div className="text-xs font-medium text-stone-800">{exp.variant.label}</div>
              <div className="text-xs text-stone-500 mt-0.5">{exp.variant.description}</div>
              {exp.variant.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {exp.variant.keywords.map((kw) => (
                    <span key={kw} className="text-xs px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded font-mono">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
              {exp.variant.flightIds.length > 0 && (
                <div className="mt-1.5 text-xs text-stone-400">
                  Flight IDs: {exp.variant.flightIds.join(", ")}
                </div>
              )}
              {hasMetrics && exp.metrics && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-xs text-stone-400">Imps</div>
                    <MetricCell value={exp.metrics.variantImpressions} format="int" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-400">CTR</div>
                    <MetricCell value={exp.metrics.variantCtr} format="pct" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-400">CPM</div>
                    <MetricCell value={exp.metrics.variantCpm} format="cpm" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="text-xs font-semibold text-stone-500 mb-1">Notes</div>
            <p className="text-xs text-stone-600 leading-relaxed">{exp.notes}</p>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-xs text-stone-400">
            <span>Owner: <span className="text-stone-600">{exp.owner}</span></span>
            {exp.startDate && <span>Started: <span className="text-stone-600">{exp.startDate}</span></span>}
            {exp.endDate && <span>Ended: <span className="text-stone-600">{exp.endDate}</span></span>}
            <span>Advertiser: <span className="text-stone-600">{exp.advertiser}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExperimentsDashboardClient() {
  const [data, setData] = useState<ExperimentsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ExperimentStatus | "all">("all");

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/experiments", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = data?.experiments.filter(
    (e) => filter === "all" || e.status === filter
  ) ?? [];

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-stone-400 animate-pulse">Loading experiment registry…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-700">
          <strong>Error loading experiments:</strong> {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-stone-400 mb-1">Total Experiments</div>
          <div className="text-2xl font-bold text-stone-900">{summary.total}</div>
          <div className="text-xs text-stone-400 mt-0.5">in registry</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-emerald-600 mb-1">Active</div>
          <div className="text-2xl font-bold text-emerald-700">{summary.active}</div>
          <div className="text-xs text-emerald-600 mt-0.5">running now</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-stone-400 mb-1">Planned</div>
          <div className="text-2xl font-bold text-stone-600">{summary.planned}</div>
          <div className="text-xs text-stone-400 mt-0.5">queued</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-stone-400 mb-1">Variant Winning</div>
          <div className="text-2xl font-bold text-stone-900">{summary.variantWinning}</div>
          <div className="text-xs text-stone-400 mt-0.5">of {summary.active + summary.completed} with data</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-stone-400 mb-1">Avg Confidence</div>
          <div className="text-2xl font-bold text-stone-900">{Math.round(summary.avgConfidence * 100)}%</div>
          <div className="text-xs text-stone-400 mt-0.5">across experiments w/ data</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "active", "planned", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              filter === f
                ? "bg-stone-900 text-white border-stone-900"
                : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
            }`}
          >
            {f === "all" ? `All (${data.experiments.length})` : `${f[0].toUpperCase()}${f.slice(1)} (${data.experiments.filter(e => e.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Experiment cards */}
      <div className="space-y-4">
        {filtered.map((exp) => (
          <ExperimentCard key={exp.id} exp={exp} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-stone-400">
            No experiments in this category.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 p-4 bg-stone-50 border border-stone-200 rounded-xl">
        <div className="text-xs text-stone-500">
          <strong className="text-stone-700">Note:</strong> {data.meta.note}{" "}
          Experiment registry last fetched at {new Date(data.meta.fetchedAt).toLocaleTimeString()}.
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

interface FormatForecast {
  format: string;
  dailyCapacity: number;
  availableDaily: number;
  flightDays: number;
  totalAvailable: number;
  estimatedImpressions: number;
  projectedReach: number;
  eCPM: number;
  winRate: number;
  estimatedSpend: number;
  competingBids: string[];
  cpmFloor: number;
  contextualLift: number;
  segmentLift: number;
}

interface ForecastAggregate {
  totalImpressions: number;
  totalReach: number;
  totalSpend: number;
  blendedCPM: number;
  budgetUtilization: number;
  durationDays: number;
  budget: number;
}

interface ForecastResponse {
  formats: FormatForecast[];
  aggregate: ForecastAggregate;
  generatedAt: string;
  warnings: string[];
}

const SEGMENTS = [
  { value: "", label: "No segment targeting (run-of-network)" },
  { value: "organic-enthusiast", label: "Organic Enthusiast (+35% CPM)" },
  { value: "health-conscious", label: "Health-Conscious (+25% CPM)" },
  { value: "premium-fresh", label: "Premium Fresh Buyer (+65% CPM)" },
  { value: "family-staples", label: "Family Staples (+10% CPM)" },
  { value: "deal-seeker", label: "Deal Seeker (−15% CPM, untargeted)" },
  { value: "new-shopper", label: "New Shopper (−5% CPM, acquisition)" },
];

const KEYWORDS = [
  "organic", "produce", "dairy", "grass-fed", "hydration", "electrolytes",
  "protein-shake", "wellness", "seasonal", "keto", "vegan", "non-gmo",
];

const FORMAT_LABELS: Record<string, string> = {
  billboard: "Billboard 970×250",
  leaderboard: "Leaderboard 728×90",
  mrec: "Medium Rectangle 300×250",
};

const FORMAT_COLORS: Record<string, string> = {
  billboard: "emerald",
  leaderboard: "blue",
  mrec: "violet",
};

function fmt(n: number): string {
  return n.toLocaleString();
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export default function ForecastClient() {
  const [budget, setBudget] = useState(5000);
  const [duration, setDuration] = useState(30);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["billboard", "leaderboard", "mrec"]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [segment, setSegment] = useState("");
  const [cpmFloor, setCpmFloor] = useState<string>("");
  const [result, setResult] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFormat = (f: string) => {
    setSelectedFormats(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  };

  const toggleKeyword = (k: string) => {
    setSelectedKeywords(prev =>
      prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]
    );
  };

  const runForecast = async () => {
    if (selectedFormats.length === 0) {
      setError("Select at least one ad format.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formats: selectedFormats,
          budget,
          durationDays: duration,
          keywords: selectedKeywords,
          targetSegment: segment || undefined,
          cpmFloor: cpmFloor ? parseFloat(cpmFloor) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Forecast failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Input panel */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-700 mb-5">Campaign Parameters</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Budget */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Total Budget (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-stone-400 text-sm">$</span>
              <input
                type="number"
                min={500}
                step={500}
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Flight Duration (days)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* CPM floor override */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              CPM Floor Override <span className="text-stone-400">(optional — defaults to format floor)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-stone-400 text-sm">$</span>
              <input
                type="number"
                min={0}
                step={0.25}
                value={cpmFloor}
                placeholder="e.g. 6.50"
                onChange={e => setCpmFloor(e.target.value)}
                className="w-full pl-7 pr-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Audience segment */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Audience Segment</label>
            <select
              value={segment}
              onChange={e => setSegment(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {SEGMENTS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Format selection */}
        <div className="mt-5">
          <label className="block text-xs font-medium text-stone-500 mb-2">Ad Formats</label>
          <div className="flex gap-3 flex-wrap">
            {["billboard", "leaderboard", "mrec"].map(f => {
              const active = selectedFormats.includes(f);
              const color = FORMAT_COLORS[f];
              return (
                <button
                  key={f}
                  onClick={() => toggleFormat(f)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    active
                      ? `bg-${color}-50 border-${color}-300 text-${color}-700`
                      : "bg-white border-stone-200 text-stone-500 hover:border-stone-300"
                  }`}
                >
                  {FORMAT_LABELS[f]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Keyword targeting */}
        <div className="mt-5">
          <label className="block text-xs font-medium text-stone-500 mb-2">
            Contextual Keywords <span className="text-stone-400">(each adds CPM lift)</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {KEYWORDS.map(k => {
              const active = selectedKeywords.includes(k);
              return (
                <button
                  key={k}
                  onClick={() => toggleKeyword(k)}
                  className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                    active
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-white border-stone-200 text-stone-500 hover:border-stone-300"
                  }`}
                >
                  {k}
                </button>
              );
            })}
          </div>
        </div>

        {/* Run button */}
        <div className="mt-6">
          <button
            onClick={runForecast}
            disabled={loading || selectedFormats.length === 0}
            className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Calculating…" : "Run Forecast"}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="text-xs font-semibold text-amber-700 mb-1">Forecaster Notes</div>
              {result.warnings.map((w, i) => (
                <p key={i} className="text-sm text-amber-700">{w}</p>
              ))}
            </div>
          )}

          {/* Aggregate summary */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-700 mb-4">Aggregate Forecast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Total Impressions", value: fmt(result.aggregate.totalImpressions), sub: "est." },
                { label: "Unique Reach", value: fmt(result.aggregate.totalReach), sub: "deduped shoppers" },
                { label: "Est. Spend", value: `$${result.aggregate.totalSpend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, sub: `of $${budget.toLocaleString()} budget` },
                { label: "Blended eCPM", value: `$${result.aggregate.blendedCPM.toFixed(2)}`, sub: "effective" },
                { label: "Budget Utilization", value: pct(result.aggregate.budgetUtilization), sub: "deployed" },
                { label: "Flight Duration", value: `${duration}d`, sub: "days" },
              ].map(stat => (
                <div key={stat.label} className="text-center p-3 bg-stone-50 rounded-xl">
                  <div className="text-lg font-bold text-stone-900">{stat.value}</div>
                  <div className="text-xs font-medium text-stone-500">{stat.label}</div>
                  <div className="text-xs text-stone-400">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Per-format breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {result.formats.map(f => {
              const color = FORMAT_COLORS[f.format] ?? "stone";
              return (
                <div key={f.format} className={`bg-white border border-${color}-200 rounded-2xl p-5 shadow-sm`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-bold text-stone-900">{FORMAT_LABELS[f.format] ?? f.format}</div>
                      <div className="text-xs text-stone-400">eCPM: ${f.eCPM.toFixed(2)}</div>
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full bg-${color}-50 text-${color}-700 border border-${color}-200`}>
                      Win rate {pct(f.winRate)}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-stone-600">
                      <span>Impressions</span>
                      <span className="font-medium text-stone-800">{fmt(f.estimatedImpressions)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Unique reach</span>
                      <span className="font-medium text-stone-800">{fmt(f.projectedReach)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Est. spend</span>
                      <span className="font-medium text-stone-800">
                        ${f.estimatedSpend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>ATS (daily)</span>
                      <span className="font-medium text-stone-800">{fmt(f.availableDaily)} imp</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>CPM floor</span>
                      <span className="font-medium text-stone-800">${f.cpmFloor.toFixed(2)}</span>
                    </div>
                    {f.contextualLift > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Contextual lift</span>
                        <span className="font-medium">+{pct(f.contextualLift)} CPM</span>
                      </div>
                    )}
                    {f.segmentLift > 0 && (
                      <div className="flex justify-between text-blue-700">
                        <span>Segment premium</span>
                        <span className="font-medium">+{pct(f.segmentLift)} CPM</span>
                      </div>
                    )}
                    {f.segmentLift < 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span>Segment discount</span>
                        <span className="font-medium">{pct(f.segmentLift)} CPM</span>
                      </div>
                    )}
                  </div>

                  {f.competingBids.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-stone-100">
                      <div className="text-xs text-stone-400 mb-1">Competing in auction</div>
                      <div className="flex flex-wrap gap-1">
                        {f.competingBids.map(b => (
                          <span key={b} className="text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">{b}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-xs text-stone-400 text-right">
            Forecast generated at {new Date(result.generatedAt).toLocaleString()} ·
            Estimates based on 30-day network averages. Actual delivery depends on auction competition and flight settings.
          </div>
        </>
      )}
    </div>
  );
}

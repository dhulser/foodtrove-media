"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AdvertiserStatus {
  advertiserId: number;
  advertiserName: string;
  advertiserSlug: string;
  advertiserColor: string;
  isActive: boolean;
  flightCount: number;
  activeFlightCount: number;
}

interface FlightStatus {
  flightId: number;
  flightName: string;
  advertiserId: number;
  advertiserName: string;
  advertiserSlug: string;
  advertiserColor: string;
  format: string;
  formatKeyword: string;
  isActive: boolean;
  isUnlimited: boolean;
  impressions: number;
  price: number;
  keywords: string;
  priorityId: number;
  startDate: string | null;
  noEndDate: boolean;
  statusLabel: "active" | "paused" | "no-flight";
  hasFormatKeyword: boolean;
  hasContextualKeyword: boolean;
  contextualKeywords: string[];
  opsNote: string | null;
}

interface TraffickingData {
  flights: FlightStatus[];
  advertisers: AdvertiserStatus[];
  summary: {
    total: number;
    active: number;
    paused: number;
    noFlight: number;
    needsAttention: number;
  };
  fetchedAt: string;
}

// ─── Color maps ────────────────────────────────────────────────────────────────

const ADVERTISER_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  "organic-valley": {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
  },
  "liquid-iv": {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    badge: "bg-sky-100 text-sky-700",
  },
  "earthbound-farm": {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700",
  },
};

const FORMAT_ICONS: Record<string, string> = {
  Billboard: "⬛",
  Leaderboard: "▬",
  MRec: "▪",
};

// ─── Inline editor component ───────────────────────────────────────────────────

function CpmEditor({
  flight,
  onSave,
  onCancel,
}: {
  flight: FlightStatus;
  onSave: (flightId: number, price: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(flight.price.toFixed(2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed <= 0) {
      setError("CPM must be a positive number");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(flight.flightId, parsed);
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-stone-400">$</span>
      <input
        type="number"
        step="0.01"
        min="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 px-2 py-1 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        autoFocus
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-2 py-1 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        onClick={onCancel}
        className="px-2 py-1 text-xs text-stone-500 hover:text-stone-700 transition-colors"
      >
        Cancel
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

function KeywordsEditor({
  flight,
  onSave,
  onCancel,
}: {
  flight: FlightStatus;
  onSave: (flightId: number, keywords: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(flight.keywords);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(flight.flightId, value);
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ft-leaderboard,produce,organic"
        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
        autoFocus
      />
      <div className="text-xs text-stone-400">
        Comma-separated. Format keyword required (ft-billboard / ft-leaderboard / ft-mrec). Contextual keywords optional.
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save keywords"}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}

// ─── Advertiser row component ──────────────────────────────────────────────────

function AdvertiserRow({
  adv,
  colors,
  onAction,
}: {
  adv: AdvertiserStatus;
  colors: { bg: string; text: string; border: string; badge: string };
  onAction: (advertiserId: number, action: "activate-advertiser" | "pause-advertiser") => Promise<void>;
}) {
  const [toggling, setToggling] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleToggle = async () => {
    setToggling(true);
    setResult(null);
    try {
      await onAction(adv.advertiserId, adv.isActive ? "pause-advertiser" : "activate-advertiser");
      setResult({ ok: true, message: `Advertiser ${adv.isActive ? "paused" : "activated"} in Kevel. All flights affected.` });
    } catch (e) {
      setResult({ ok: false, message: String(e) });
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className={`px-5 py-3 flex items-center gap-4 ${adv.isActive ? "" : "bg-red-50/30"}`}>
      <div className="flex-1">
        <div className={`text-sm font-semibold ${colors.text}`}>{adv.advertiserName}</div>
        <div className="text-xs text-stone-400">
          ID: {adv.advertiserId} · {adv.activeFlightCount}/{adv.flightCount} flights active
        </div>
        {!adv.isActive && (
          <div className="mt-1 text-xs text-red-600 font-medium">
            ⛔ Account paused — all flights blocked from serving, regardless of flight-level status
          </div>
        )}
        {result && (
          <div className={`mt-1 text-xs ${result.ok ? "text-emerald-700" : "text-red-600"}`}>
            {result.ok ? "✓ " : "✗ "}{result.message}
          </div>
        )}
      </div>
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer select-none ${
          adv.isActive
            ? "bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700"
            : "bg-red-100 text-red-700 hover:bg-emerald-100 hover:text-emerald-700"
        } disabled:opacity-50`}
        title={adv.isActive ? "Click to pause advertiser account" : "Click to activate advertiser account"}
      >
        {toggling ? (
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full ${adv.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
        )}
        {toggling ? "Updating…" : adv.isActive ? "Account Active" : "Account Paused"}
      </button>
    </div>
  );
}

// ─── Flight card ───────────────────────────────────────────────────────────────

function FlightCard({
  flight,
  onAction,
}: {
  flight: FlightStatus;
  onAction: (flightId: number, action: string, payload?: { price?: number; keywords?: string }) => Promise<void>;
}) {
  const [toggling, setToggling] = useState(false);
  const [editMode, setEditMode] = useState<"cpm" | "keywords" | null>(null);
  const [actionResult, setActionResult] = useState<{ ok: boolean; message: string } | null>(null);

  const colors = ADVERTISER_COLORS[flight.advertiserSlug] ?? {
    bg: "bg-stone-50", text: "text-stone-700", border: "border-stone-200", badge: "bg-stone-100 text-stone-700",
  };

  const isNoFlight = flight.statusLabel === "no-flight";

  const handleToggle = async () => {
    if (isNoFlight) return;
    setToggling(true);
    setActionResult(null);
    try {
      await onAction(flight.flightId, flight.isActive ? "pause" : "activate");
      setActionResult({ ok: true, message: `Flight ${flight.isActive ? "paused" : "activated"} in Kevel.` });
    } catch (e) {
      setActionResult({ ok: false, message: String(e) });
    } finally {
      setToggling(false);
    }
  };

  const handleCpmSave = async (flightId: number, price: number) => {
    await onAction(flightId, "update-cpm", { price });
    setEditMode(null);
    setActionResult({ ok: true, message: `CPM updated to $${price.toFixed(2)}.` });
  };

  const handleKeywordsSave = async (flightId: number, keywords: string) => {
    await onAction(flightId, "update-keywords", { keywords });
    setEditMode(null);
    setActionResult({ ok: true, message: "Keywords updated." });
  };

  return (
    <div className={`rounded-xl border ${colors.border} bg-white shadow-sm overflow-hidden`}>
      {/* Card header */}
      <div className={`px-5 py-4 ${colors.bg} border-b ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base" title={flight.format}>{FORMAT_ICONS[flight.format] ?? "◻"}</span>
            <div>
              <div className={`text-sm font-semibold ${colors.text}`}>{flight.advertiserName}</div>
              <div className="text-xs text-stone-500">{flight.format} · {flight.flightId}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isNoFlight ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-500">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                No flight
              </span>
            ) : (
              <button
                onClick={handleToggle}
                disabled={toggling}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer select-none ${
                  flight.isActive
                    ? "bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700"
                    : "bg-stone-100 text-stone-500 hover:bg-emerald-100 hover:text-emerald-700"
                } disabled:opacity-50`}
                title={flight.isActive ? "Click to pause flight" : "Click to activate flight"}
              >
                {toggling ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${flight.isActive ? "bg-emerald-500" : "bg-stone-400"}`} />
                )}
                {toggling ? "Updating…" : flight.isActive ? "Active" : "Paused"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 space-y-3">
        {/* Ops note */}
        {flight.opsNote && (
          <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs ${
            isNoFlight
              ? "bg-stone-50 border border-stone-200 text-stone-500"
              : "bg-amber-50 border border-amber-200 text-amber-700"
          }`}>
            <span className="mt-0.5 flex-shrink-0">{isNoFlight ? "ℹ" : "⚠"}</span>
            <span>{flight.opsNote}</span>
          </div>
        )}

        {/* CPM row */}
        <div>
          <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">CPM</div>
          {editMode === "cpm" ? (
            <CpmEditor
              flight={flight}
              onSave={handleCpmSave}
              onCancel={() => setEditMode(null)}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-stone-800">
                {flight.price > 0 ? `$${flight.price.toFixed(2)}` : "—"}
              </span>
              {!isNoFlight && (
                <button
                  onClick={() => setEditMode("cpm")}
                  className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
          )}
        </div>

        {/* Keywords row */}
        <div>
          <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">Keywords</div>
          {editMode === "keywords" ? (
            <KeywordsEditor
              flight={flight}
              onSave={handleKeywordsSave}
              onCancel={() => setEditMode(null)}
            />
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <div className="flex flex-wrap gap-1 flex-1">
                  {flight.keywords
                    ? flight.keywords.split(",").map((k) => k.trim()).filter(Boolean).map((kw) => {
                        const isFormat = ["ft-billboard", "ft-leaderboard", "ft-mrec"].includes(kw);
                        const isContextual = ["produce", "organic", "fresh", "snacks", "beverages", "health", "nutrition", "dairy", "bakery", "frozen"].includes(kw);
                        return (
                          <span
                            key={kw}
                            className={`px-2 py-0.5 rounded text-xs font-mono ${
                              isFormat
                                ? "bg-indigo-100 text-indigo-700"
                                : isContextual
                                ? "bg-teal-100 text-teal-700"
                                : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {kw}
                          </span>
                        );
                      })
                    : <span className="text-xs text-stone-400 italic">No keywords set</span>
                  }
                </div>
                {!isNoFlight && (
                  <button
                    onClick={() => setEditMode("keywords")}
                    className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors flex-shrink-0"
                  >
                    Edit
                  </button>
                )}
              </div>
              {!flight.hasFormatKeyword && !isNoFlight && (
                <div className="text-xs text-amber-600">
                  ⚠ Missing format keyword — flight won&apos;t enter auction
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action feedback */}
        {actionResult && (
          <div className={`px-3 py-2 rounded-lg text-xs ${
            actionResult.ok
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {actionResult.ok ? "✓ " : "✗ "}{actionResult.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function TraffickingClient() {
  const [data, setData] = useState<TraffickingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAdvertiser, setFilterAdvertiser] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/trafficking");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: TraffickingData = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (
    flightId: number,
    action: string,
    payload?: { price?: number; keywords?: string }
  ) => {
    const res = await fetch("/api/admin/trafficking", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flightId, action, ...payload }),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      throw new Error(json.error ?? `HTTP ${res.status}`);
    }
    // Refresh data after successful action
    await fetchData();
    return json;
  };

  const handleAdvertiserAction = async (advertiserId: number, action: "activate-advertiser" | "pause-advertiser") => {
    const res = await fetch("/api/admin/trafficking", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ advertiserId, action }),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      throw new Error(json.error ?? `HTTP ${res.status}`);
    }
    // Refresh data after successful action
    await fetchData();
    return json;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 text-stone-400">
          <div className="w-5 h-5 rounded-full border-2 border-stone-300 border-t-indigo-600 animate-spin" />
          <span className="text-sm">Loading flight data from Kevel…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="p-5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <div className="font-semibold mb-1">Failed to load trafficking data</div>
          <div>{error}</div>
          <button
            onClick={fetchData}
            className="mt-3 px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Filter flights
  const filtered = data.flights.filter((f) => {
    if (filterAdvertiser !== "all" && f.advertiserSlug !== filterAdvertiser) return false;
    if (filterStatus === "active" && !f.isActive) return false;
    if (filterStatus === "paused" && (f.statusLabel !== "paused")) return false;
    if (filterStatus === "attention" && !f.opsNote) return false;
    if (filterStatus === "no-flight" && f.statusLabel !== "no-flight") return false;
    return true;
  });

  const advertisers = [
    { slug: "organic-valley", name: "Organic Valley" },
    { slug: "liquid-iv", name: "Liquid I.V." },
    { slug: "earthbound-farm", name: "Earthbound Farm" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total flights", value: data.summary.total, color: "text-stone-900" },
          { label: "Active", value: data.summary.active, color: "text-emerald-700" },
          { label: "Paused", value: data.summary.paused, color: "text-amber-600" },
          { label: "No flight", value: data.summary.noFlight, color: "text-stone-400" },
          { label: "Needs attention", value: data.summary.needsAttention, color: "text-red-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-center">
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-stone-400 mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Advertiser account status */}
      {data.advertisers && data.advertisers.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
            <div className="text-sm font-semibold text-stone-700">Advertiser Accounts</div>
            <div className="text-xs text-stone-400">Advertiser-level IsActive — gates ALL flights for that account</div>
          </div>
          <div className="divide-y divide-stone-100">
            {data.advertisers.map((adv) => {
              const colors = ADVERTISER_COLORS[adv.advertiserSlug] ?? {
                bg: "bg-stone-50", text: "text-stone-700", border: "border-stone-200", badge: "bg-stone-100 text-stone-700",
              };
              return (
                <AdvertiserRow
                  key={adv.advertiserId}
                  adv={adv}
                  colors={colors}
                  onAction={handleAdvertiserAction}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Info strip */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 text-sm text-indigo-800">
        <span className="font-semibold">Trafficking Console</span> — Changes are written directly to Kevel Network 12024 via Management API.
        Activate/pause takes effect immediately. CPM and keyword changes enter the next auction cycle.
        Kevel propagation to Decision API takes up to 30 seconds.
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">Advertiser</span>
          <div className="flex gap-1">
            {[{ slug: "all", name: "All" }, ...advertisers].map((a) => (
              <button
                key={a.slug}
                onClick={() => setFilterAdvertiser(a.slug)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filterAdvertiser === a.slug
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-stone-600 border border-stone-200 hover:border-indigo-300"
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">Status</span>
          <div className="flex gap-1">
            {[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "paused", label: "Paused" },
              { key: "attention", label: "Needs attention" },
              { key: "no-flight", label: "No flight" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setFilterStatus(s.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filterStatus === s.key
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-stone-600 border border-stone-200 hover:border-indigo-300"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={fetchData}
          className="ml-auto px-3 py-1.5 text-xs font-medium text-stone-500 border border-stone-200 rounded-lg hover:border-stone-300 bg-white transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Flight grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-stone-400 text-sm">
          No flights match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((flight) => (
            <FlightCard
              key={flight.flightId}
              flight={flight}
              onAction={handleAction}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="pt-2 border-t border-stone-100">
        <div className="text-xs text-stone-400 space-y-1">
          <div className="flex flex-wrap gap-4">
            <span><span className="inline-block w-2 h-2 rounded bg-indigo-400 mr-1" />Format keyword (required for auction routing)</span>
            <span><span className="inline-block w-2 h-2 rounded bg-teal-400 mr-1" />Contextual keyword (dept / product targeting)</span>
            <span><span className="inline-block w-2 h-2 rounded bg-stone-300 mr-1" />Other keyword</span>
          </div>
          <div>
            Data fetched from Kevel at {data.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString() : "—"}.
            Active status toggle writes to <code className="font-mono text-indigo-500">PUT /v1/flight/&#123;id&#125;</code> immediately.
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

/**
 * CreativesPreviewClient — Creative Preview & Management Dashboard
 *
 * Shows all ad creatives across FoodTrove advertisers with live HTML preview,
 * format metadata, flight associations, and status indicators.
 *
 * For Casey (Ad Ops): daily creative health review before campaign launch.
 * Source: /api/admin/creatives → Kevel Management API
 */
import { useEffect, useState, useCallback } from "react";

interface CreativeDetail {
  id: number;
  title: string;
  advertiserId: number;
  advertiserName: string;
  isActive: boolean;
  isHTMLJS: boolean;
  scriptBody: string;
  adTypeId: number;
  flightIds: number[];
  format: string;
  size: string;
  dimensions: string;
  cpm: number;
  lastModified?: string;
}

interface AdvertiserCreatives {
  advertiserId: number;
  advertiserName: string;
  color: string;
  creatives: CreativeDetail[];
}

interface ApiResponse {
  advertisers: AdvertiserCreatives[];
  meta: {
    totalCreatives: number;
    activeCreatives: number;
    totalAdvertisers: number;
    lastFetched: string;
  };
  error?: string;
}

const COLOR_MAP: Record<string, { badge: string; ring: string; dot: string; tab: string; tabActive: string }> = {
  emerald: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ring: "ring-emerald-200",
    dot: "bg-emerald-500",
    tab: "text-emerald-700 border-emerald-500",
    tabActive: "bg-emerald-600 text-white",
  },
  blue: {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    ring: "ring-blue-200",
    dot: "bg-blue-500",
    tab: "text-blue-700 border-blue-500",
    tabActive: "bg-blue-600 text-white",
  },
  amber: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    ring: "ring-amber-200",
    dot: "bg-amber-500",
    tab: "text-amber-700 border-amber-500",
    tabActive: "bg-amber-600 text-white",
  },
};

const FORMAT_WIDTHS: Record<string, number> = {
  billboard: 480,
  leaderboard: 364,
  mrec: 300,
};

const FORMAT_HEIGHTS: Record<string, number> = {
  billboard: 124,
  leaderboard: 46,
  mrec: 250,
};

function CreativeCard({
  creative,
  color,
}: {
  creative: CreativeDetail;
  color: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const colors = COLOR_MAP[color] ?? COLOR_MAP.emerald;
  const previewWidth = FORMAT_WIDTHS[creative.size] ?? 300;
  const previewHeight = FORMAT_HEIGHTS[creative.size] ?? 250;

  // Sanitize HTML for iframe srcdoc — wrap in minimal HTML doc
  const iframeSrcDoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { overflow: hidden; background: #f8f8f8; }
</style>
</head>
<body>${creative.scriptBody || '<p style="padding:12px;color:#999;font-size:12px;">No creative content</p>'}</body>
</html>`;

  return (
    <div
      className={`bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-stone-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${colors.badge}`}
              >
                {creative.format}
                <span className="opacity-60">·</span>
                {creative.dimensions}
              </span>
              {creative.isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500`}></span>
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-stone-50 text-stone-500 border border-stone-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                  Inactive
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-stone-900 truncate" title={creative.title}>
              {creative.title}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Creative ID: {creative.id}
              {creative.cpm > 0 && (
                <span className="ml-2 text-stone-500">· ${creative.cpm.toFixed(2)} CPM</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Flight associations */}
      <div className="px-5 py-3 bg-stone-50 border-b border-stone-100">
        <p className="text-xs text-stone-500 mb-1.5 font-medium uppercase tracking-wide">
          Flight associations
        </p>
        <div className="flex flex-wrap gap-1.5">
          {creative.flightIds.length > 0 ? (
            creative.flightIds.map((fid) => (
              <span
                key={fid}
                className="inline-block px-2 py-0.5 bg-white border border-stone-200 rounded text-xs text-stone-600 font-mono"
              >
                {fid}
              </span>
            ))
          ) : (
            <span className="text-xs text-stone-400 italic">No flight linked</span>
          )}
        </div>
      </div>

      {/* Creative preview toggle */}
      <div className="px-5 py-4">
        <button
          onClick={() => setPreviewOpen((o) => !o)}
          className="w-full flex items-center justify-between text-sm text-stone-600 hover:text-stone-900 transition-colors group"
        >
          <span className="font-medium">
            {previewOpen ? "Hide preview" : "Show live preview"}
          </span>
          <svg
            className={`h-4 w-4 text-stone-400 group-hover:text-stone-600 transition-transform ${previewOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {previewOpen && (
          <div className="mt-3">
            <div className="text-xs text-stone-400 mb-2">
              Rendered at {previewWidth}×{previewHeight}px (scaled to container)
            </div>
            {/* Iframe preview — renders actual HTML creative */}
            <div
              className={`rounded-lg overflow-hidden border border-stone-200 bg-stone-50`}
              style={{
                width: "100%",
                paddingBottom: `${(previewHeight / previewWidth) * 100}%`,
                position: "relative",
              }}
            >
              <iframe
                srcDoc={iframeSrcDoc}
                title={`Preview: ${creative.title}`}
                className="absolute inset-0 w-full h-full"
                sandbox="allow-scripts"
                scrolling="no"
              />
            </div>

            {/* Raw ScriptBody toggle */}
            <details className="mt-3">
              <summary className="text-xs text-stone-400 hover:text-stone-600 cursor-pointer select-none">
                View raw HTML
              </summary>
              <pre className="mt-2 p-3 bg-stone-900 text-emerald-400 text-xs rounded-lg overflow-x-auto max-h-48 leading-relaxed">
                {creative.scriptBody || "(empty)"}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreativesPreviewClient() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number | "all">("all");
  const [filterFormat, setFilterFormat] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/creatives");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json: ApiResponse = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3 text-stone-400">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading creatives from Kevel…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto py-24 text-center">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-stone-900 mb-1">Failed to load creatives</p>
        <p className="text-xs text-stone-500 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Flatten all creatives for filtering
  const allCreatives = data.advertisers.flatMap((a) =>
    a.creatives.map((c) => ({ ...c, color: a.color }))
  );

  // Apply filters
  const filtered = allCreatives.filter((c) => {
    if (activeTab !== "all" && c.advertiserId !== activeTab) return false;
    if (filterFormat !== "all" && c.size !== filterFormat) return false;
    if (filterStatus === "active" && !c.isActive) return false;
    if (filterStatus === "inactive" && c.isActive) return false;
    return true;
  });

  return (
    <div>
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-stone-900">{data.meta.totalCreatives}</div>
          <div className="text-xs text-stone-500 mt-0.5">Total creatives</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-emerald-600">{data.meta.activeCreatives}</div>
          <div className="text-xs text-stone-500 mt-0.5">Active</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-stone-900">{data.meta.totalAdvertisers}</div>
          <div className="text-xs text-stone-500 mt-0.5">Advertisers</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-stone-900">
            {Math.round((data.meta.activeCreatives / Math.max(data.meta.totalCreatives, 1)) * 100)}%
          </div>
          <div className="text-xs text-stone-500 mt-0.5">Active rate</div>
        </div>
      </div>

      {/* Advertiser tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "all"
              ? "bg-stone-900 text-white"
              : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"
          }`}
        >
          All advertisers
        </button>
        {data.advertisers.map((adv) => {
          const colors = COLOR_MAP[adv.color] ?? COLOR_MAP.emerald;
          return (
            <button
              key={adv.advertiserId}
              onClick={() => setActiveTab(adv.advertiserId)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === adv.advertiserId
                  ? colors.tabActive
                  : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"
              }`}
            >
              {adv.advertiserName}
            </button>
          );
        })}
      </div>

      {/* Format + status filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-500 font-medium">Format:</span>
          {["all", "billboard", "leaderboard", "mrec"].map((f) => (
            <button
              key={f}
              onClick={() => setFilterFormat(f)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterFormat === f
                  ? "bg-stone-800 text-white"
                  : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"
              }`}
            >
              {f === "all" ? "All" : f === "mrec" ? "MRec" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-500 font-medium">Status:</span>
          {["all", "active", "inactive"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterStatus === s
                  ? "bg-stone-800 text-white"
                  : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-stone-400">
          {filtered.length} creative{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Creative cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <svg className="h-8 w-8 mx-auto mb-3 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No creatives match the current filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((creative) => (
            <CreativeCard key={creative.id} creative={creative} color={creative.color} />
          ))}
        </div>
      )}

      {/* Last fetch timestamp */}
      <div className="mt-8 text-xs text-stone-400 text-right">
        Data fetched {new Date(data.meta.lastFetched).toLocaleTimeString()} · Kevel Network 12024
      </div>
    </div>
  );
}

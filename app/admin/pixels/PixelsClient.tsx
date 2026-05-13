"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PixelFire {
  ts: string;
  url: string;
  orderId?: string;
  revenue?: number;
  conversionType: "purchase" | "add-to-cart" | "pdp-view";
}

interface PixelSpec {
  advertiserId: number;
  advertiserName: string;
  advertiserSlug: string;
  advertiserColor: string;
  pixelId: string;
  pixelType: "conversion" | "impression" | "view-through";
  attributionWindow: { clickDays: number; viewDays: number };
  installed: boolean;
  status: "healthy" | "stale" | "not-installed" | "misfire";
  lastFireAt: string | null;
  lastFireAgo: string | null;
  fires30d: number;
  fires7d: number;
  fires24h: number;
  conversionRate30d: number;
  avgOrderValue: number;
  recentFires: PixelFire[];
  tagSnippet: string;
  placedOnPages: string[];
  notes: string | null;
}

interface Summary {
  totalPixels: number;
  healthyCount: number;
  staleCount: number;
  notInstalledCount: number;
  totalFires30d: number;
  totalFires7d: number;
  totalFires24h: number;
  avgConversionRate: number;
  totalRevenue30d: number;
}

interface PixelsData {
  pixels: PixelSpec[];
  summary: Summary;
  generatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: PixelSpec["status"]) {
  const map = {
    healthy: "bg-emerald-100 text-emerald-700 border-emerald-200",
    stale: "bg-amber-100 text-amber-700 border-amber-200",
    "not-installed": "bg-stone-100 text-stone-500 border-stone-200",
    misfire: "bg-red-100 text-red-700 border-red-200",
  };
  const labels = {
    healthy: "Healthy",
    stale: "Stale",
    "not-installed": "Not installed",
    misfire: "Misfire",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === "healthy"
            ? "bg-emerald-500"
            : status === "stale"
            ? "bg-amber-500"
            : status === "misfire"
            ? "bg-red-500"
            : "bg-stone-400"
        }`}
      />
      {labels[status]}
    </span>
  );
}

function convTypeBadge(t: PixelFire["conversionType"]) {
  const map = {
    purchase: "bg-emerald-50 text-emerald-700",
    "add-to-cart": "bg-blue-50 text-blue-700",
    "pdp-view": "bg-stone-50 text-stone-600",
  };
  const labels = { purchase: "Purchase", "add-to-cart": "Add to cart", "pdp-view": "PDP view" };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[t]}`}>{labels[t]}</span>
  );
}

function colorAccent(color: string) {
  const map: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-300",
    sky: "bg-sky-100 text-sky-700 border-sky-300",
    orange: "bg-orange-100 text-orange-700 border-orange-300",
  };
  return map[color] ?? "bg-stone-100 text-stone-700 border-stone-300";
}

function colorDot(color: string) {
  const map: Record<string, string> = {
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    orange: "bg-orange-500",
  };
  return map[color] ?? "bg-stone-500";
}

// ─── PixelCard ────────────────────────────────────────────────────────────────

function PixelCard({ pixel }: { pixel: PixelSpec }) {
  const [showSnippet, setShowSnippet] = useState(false);
  const [showFires, setShowFires] = useState(false);
  const [copied, setCopied] = useState(false);

  function copySnippet() {
    navigator.clipboard.writeText(pixel.tagSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-stone-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ${colorDot(pixel.advertiserColor)}`} />
            <div>
              <h3 className="text-sm font-semibold text-stone-900">{pixel.advertiserName}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <code className="text-xs text-stone-400 font-mono">{pixel.pixelId}</code>
                <span className="text-stone-300">·</span>
                <span className="text-xs text-stone-400 capitalize">{pixel.pixelType}</span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">{statusBadge(pixel.status)}</div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 divide-x divide-stone-100 border-b border-stone-100">
        {[
          { label: "24h fires", value: pixel.fires24h.toLocaleString() },
          { label: "7d fires", value: pixel.fires7d.toLocaleString() },
          { label: "30d fires", value: pixel.fires30d.toLocaleString() },
          { label: "Conv rate", value: `${(pixel.conversionRate30d * 100).toFixed(1)}%` },
        ].map(({ label, value }) => (
          <div key={label} className="px-4 py-3 text-center">
            <div className="text-base font-semibold text-stone-900">{value}</div>
            <div className="text-xs text-stone-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="px-6 py-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">Last fire</span>
          <span className="text-stone-700 font-medium">
            {pixel.lastFireAgo ?? "—"}
            {pixel.lastFireAt && (
              <span className="text-stone-400 font-normal ml-1 text-xs">
                ({new Date(pixel.lastFireAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">Avg order value</span>
          <span className="text-stone-700 font-medium">${pixel.avgOrderValue.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">Attribution window</span>
          <span className="text-stone-700 font-medium">
            {pixel.attributionWindow.clickDays}d click · {pixel.attributionWindow.viewDays}d view
          </span>
        </div>
        <div className="flex items-start justify-between text-sm gap-3">
          <span className="text-stone-500 flex-shrink-0">Placed on</span>
          <div className="flex flex-wrap gap-1 justify-end">
            {pixel.placedOnPages.map((page) => (
              <code
                key={page}
                className="text-xs bg-stone-50 border border-stone-200 rounded px-1.5 py-0.5 text-stone-600"
              >
                {page}
              </code>
            ))}
          </div>
        </div>
        {pixel.notes && (
          <div className="text-xs text-stone-500 bg-stone-50 rounded-lg px-3 py-2 border border-stone-100">
            📝 {pixel.notes}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 pb-4 flex gap-2">
        <button
          onClick={() => setShowFires(!showFires)}
          className="flex-1 text-xs px-3 py-2 border border-stone-200 rounded-lg bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-all font-medium"
        >
          {showFires ? "Hide" : "Recent fires"} ({pixel.recentFires.length})
        </button>
        <button
          onClick={() => setShowSnippet(!showSnippet)}
          className="flex-1 text-xs px-3 py-2 border border-stone-200 rounded-lg bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-all font-medium"
        >
          {showSnippet ? "Hide tag" : "Tag snippet"}
        </button>
      </div>

      {/* Recent fires panel */}
      {showFires && (
        <div className="border-t border-stone-100 px-6 py-4">
          <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
            Recent fires
          </h4>
          <div className="space-y-2">
            {pixel.recentFires.slice(0, 5).map((fire, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 text-xs py-2 border-b border-stone-50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  {convTypeBadge(fire.conversionType)}
                  <code className="text-stone-400">{fire.url}</code>
                </div>
                <div className="text-right flex-shrink-0">
                  {fire.revenue && (
                    <span className="text-emerald-600 font-medium mr-2">${fire.revenue.toFixed(2)}</span>
                  )}
                  <span className="text-stone-400">
                    {new Date(fire.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tag snippet panel */}
      {showSnippet && (
        <div className="border-t border-stone-100 px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
              Tag snippet
            </h4>
            <button
              onClick={copySnippet}
              className="text-xs px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-md font-medium transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="text-xs bg-stone-900 text-stone-100 rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap font-mono">
            {pixel.tagSnippet}
          </pre>
          <p className="text-xs text-stone-400 mt-2">
            Place on {pixel.placedOnPages.join(", ")} — fires on every page load.{" "}
            <code className="text-stone-500">window.__ft_orderId</code> and{" "}
            <code className="text-stone-500">window.__ft_revenue</code> auto-populated by checkout.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PixelsClient() {
  const [data, setData] = useState<PixelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<string>("all");

  useEffect(() => {
    fetch("/api/admin/pixels")
      .then((r) => r.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(String(err));
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400 text-sm">Loading pixel data…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-red-500 text-sm">{error ?? "Failed to load"}</div>
      </div>
    );
  }

  const { pixels, summary } = data;

  const advertisers = Array.from(new Set(pixels.map((p) => p.advertiserName)));

  const filtered = pixels.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (selectedAdvertiser !== "all" && p.advertiserName !== selectedAdvertiser) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <a href="/admin" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
                  ← Admin
                </a>
              </div>
              <h1 className="text-xl font-bold text-stone-900">Pixel Manager</h1>
              <p className="text-sm text-stone-500 mt-0.5">
                Conversion tag status, fire counts, and attribution tracking — Ad Ops + Sales
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/admin/measurement"
                className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg bg-white text-stone-600 hover:border-stone-300 transition-all shadow-sm"
              >
                Measurement
              </a>
              <a
                href="/admin/trafficking"
                className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg bg-white text-stone-600 hover:border-stone-300 transition-all shadow-sm"
              >
                Trafficking
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Total pixels", value: summary.totalPixels.toString(), color: "text-stone-900" },
            {
              label: "Healthy",
              value: summary.healthyCount.toString(),
              color: "text-emerald-600",
            },
            {
              label: "Stale / offline",
              value: (summary.staleCount + summary.notInstalledCount).toString(),
              color: summary.staleCount + summary.notInstalledCount > 0 ? "text-amber-600" : "text-stone-400",
            },
            {
              label: "Fires (24h)",
              value: summary.totalFires24h.toLocaleString(),
              color: "text-stone-900",
            },
            {
              label: "Fires (30d)",
              value: summary.totalFires30d.toLocaleString(),
              color: "text-stone-900",
            },
            {
              label: "Revenue tracked (30d)",
              value: `$${Math.round(summary.totalRevenue30d / 1000).toLocaleString()}K`,
              color: "text-emerald-600",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm"
            >
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-stone-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Avg conversion rate callout */}
        <div className="bg-white border border-stone-200 rounded-xl px-5 py-4 shadow-sm mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-stone-900">
              Network average conversion rate:{" "}
              <span className="text-emerald-600">
                {(summary.avgConversionRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-stone-500 mt-0.5">
              Post-click attribution · 30-day window across all active pixels
            </div>
          </div>
          <div className="text-xs text-stone-400 flex-shrink-0">
            Updated {new Date(data.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-1 shadow-sm">
            {["all", "healthy", "stale", "not-installed"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                  filterStatus === s
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {s === "all" ? "All status" : s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setSelectedAdvertiser("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedAdvertiser === "all"
                  ? "bg-stone-900 text-white"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              All advertisers
            </button>
            {advertisers.map((adv) => (
              <button
                key={adv}
                onClick={() => setSelectedAdvertiser(adv)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  selectedAdvertiser === adv
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {adv}
              </button>
            ))}
          </div>
        </div>

        {/* Pixel cards */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="text-stone-400 text-sm">No pixels match the current filter.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((pixel) => (
              <PixelCard key={pixel.pixelId} pixel={pixel} />
            ))}
          </div>
        )}

        {/* Attribution model note */}
        <div className="mt-8 bg-white border border-stone-200 rounded-xl px-6 py-5 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-900 mb-3">Attribution model notes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-500">
            <div>
              <div className="font-medium text-stone-700 mb-1">Post-click window</div>
              A conversion is attributed if the shopper clicked an ad within the flight&apos;s click
              window (Organic Valley: 30d, Liquid I.V.: 14d, Earthbound Farm: 7d).
            </div>
            <div>
              <div className="font-medium text-stone-700 mb-1">Post-view window</div>
              All three advertisers get 1-day view-through attribution. View-through fires are tracked
              but reported separately from click-through in the Measurement dashboard.
            </div>
            <div>
              <div className="font-medium text-stone-700 mb-1">Discrepancy note</div>
              These pixel counts are FoodTrove-side. Cross-reference with 3P verification data in{" "}
              <a href="/admin/measurement" className="text-emerald-600 hover:underline">
                /admin/measurement
              </a>{" "}
              for the discrepancy audit. Threshold: 5% max.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

interface FlightData {
  flightId: number;
  format: string;
  formatLabel: string;
  cpm: number;
  contextual: boolean;
  keyword: string;
  isActive: boolean;
  flightName: string;
  mtdImpressions: number;
  monthlyTarget: number;
  estimatedSpend: number;
  paceRatio: number;
  paceStatus: "on-track" | "over-pacing" | "under-pacing";
  auctionRank: number;
  auctionParticipants: number;
  topBidCpm: number;
  isWinning: boolean;
}

interface AdvertiserReport {
  advertiser: {
    slug: string;
    name: string;
    tagline: string;
    icon: string;
    kevelAdvertiserId: number;
    kevelCampaignId: number;
    campaignName: string;
    campaignIsActive: boolean;
  };
  summary: {
    activeFlights: number;
    totalFlights: number;
    totalMtdImpressions: number;
    totalEstimatedSpend: number;
    networkFormats: string[];
  };
  flights: FlightData[];
  generatedAt: string;
}

const PACE_COLORS = {
  "on-track": "text-emerald-700 bg-emerald-50 border-emerald-200",
  "over-pacing": "text-amber-700 bg-amber-50 border-amber-200",
  "under-pacing": "text-red-700 bg-red-50 border-red-200",
};

const PACE_LABELS = {
  "on-track": "On Track",
  "over-pacing": "Over-Pacing",
  "under-pacing": "Under-Pacing",
};

const FORMAT_ICONS: Record<string, string> = {
  billboard: "📋",
  leaderboard: "📏",
  mrec: "📦",
};

function PaceBar({ ratio }: { ratio: number }) {
  const pct = Math.min(Math.round(ratio * 100), 140);
  const color = ratio >= 0.9 && ratio <= 1.1
    ? "bg-emerald-500"
    : ratio > 1.1
    ? "bg-amber-500"
    : "bg-red-500";

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-stone-400 mb-1">
        <span>MTD Delivery vs. Expected</span>
        <span>{Math.round(ratio * 100)}%</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function AdvertiserPortalClient({ slug }: { slug: string }) {
  const [data, setData] = useState<AdvertiserReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  async function fetchData() {
    try {
      const res = await fetch(`/api/advertiser/${slug}`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "unknown" }));
        setError((body as { error?: string }).error ?? "Failed to load advertiser data");
        return;
      }
      const json = await res.json() as AdvertiserReport;
      setData(json);
      setLastRefresh(new Date());
      setError(null);
    } catch {
      setError("Network error — could not reach performance API");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 90_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-500">Loading campaign performance…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
          <div className="text-3xl mb-3">⚠️</div>
          <h2 className="text-lg font-semibold text-stone-900 mb-2">Advertiser Not Found</h2>
          <p className="text-sm text-stone-500">{error ?? "No data available for this advertiser."}</p>
          <a href="/brands" className="mt-5 inline-block text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            ← Back to Brand Directory
          </a>
        </div>
      </div>
    );
  }

  const { advertiser, summary, flights } = data;
  const totalRevenue = summary.totalEstimatedSpend;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{advertiser.icon}</div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-stone-900">{advertiser.name}</h1>
                  {advertiser.campaignIsActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium border border-stone-200">
                      Paused
                    </span>
                  )}
                </div>
                <p className="text-sm text-stone-400">{advertiser.tagline}</p>
                <p className="text-xs text-stone-300 mt-1">
                  Campaign: {advertiser.campaignName} · Network 12024 · Advertiser #{advertiser.kevelAdvertiserId}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-stone-400">Last updated</div>
              <div className="text-sm font-medium text-stone-600">
                {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <button
                onClick={() => { setLoading(true); fetchData(); }}
                className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Refresh ↺
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">Active Flights</div>
            <div className="text-3xl font-bold text-stone-900">{summary.activeFlights}</div>
            <div className="text-xs text-stone-400 mt-1">of {summary.totalFlights} total</div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">MTD Impressions</div>
            <div className="text-3xl font-bold text-stone-900">
              {summary.totalMtdImpressions >= 1_000_000
                ? `${(summary.totalMtdImpressions / 1_000_000).toFixed(1)}M`
                : `${(summary.totalMtdImpressions / 1000).toFixed(0)}K`}
            </div>
            <div className="text-xs text-stone-400 mt-1">month-to-date</div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">Est. MTD Spend</div>
            <div className="text-3xl font-bold text-stone-900">
              ${totalRevenue >= 1000
                ? `${(totalRevenue / 1000).toFixed(1)}K`
                : totalRevenue.toFixed(0)}
            </div>
            <div className="text-xs text-stone-400 mt-1">across all formats</div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">Ad Formats</div>
            <div className="text-3xl font-bold text-stone-900">{summary.totalFlights}</div>
            <div className="text-xs text-stone-400 mt-1">
              {summary.networkFormats.join(" · ")}
            </div>
          </div>
        </div>

        {/* Per-flight breakdown */}
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-widest mb-4">
          Campaign Flights
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
          {flights.map((flight) => (
            <div
              key={flight.flightId}
              className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm"
            >
              {/* Flight header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{FORMAT_ICONS[flight.format] ?? "📄"}</span>
                  <div>
                    <div className="text-sm font-semibold text-stone-900">{flight.formatLabel}</div>
                    {flight.contextual && (
                      <span className="text-xs text-teal-600 font-medium">Contextual</span>
                    )}
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PACE_COLORS[flight.paceStatus]}`}
                >
                  {PACE_LABELS[flight.paceStatus]}
                </span>
              </div>

              {/* Metrics */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">CPM</span>
                  <span className="font-semibold text-stone-900">${flight.cpm.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">MTD Impressions</span>
                  <span className="font-semibold text-stone-900">
                    {flight.mtdImpressions.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Est. MTD Spend</span>
                  <span className="font-semibold text-stone-900">
                    ${flight.estimatedSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <PaceBar ratio={flight.paceRatio} />

              {/* Auction position */}
              <div className="mt-4 pt-4 border-t border-stone-100">
                <div className="text-xs text-stone-400 mb-2">Auction Position</div>
                <div className="flex items-center gap-2">
                  {flight.isWinning ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      🏆 Winning
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      #{flight.auctionRank} of {flight.auctionParticipants}
                    </span>
                  )}
                  <span className="text-xs text-stone-400">
                    Top bid: ${flight.topBidCpm.toFixed(2)} CPM
                  </span>
                </div>
                <div className="mt-1.5 text-xs text-stone-400">
                  Keyword: <code className="bg-stone-100 px-1 rounded text-stone-600">{flight.keyword}</code>
                </div>
              </div>

              {/* Status */}
              <div className="mt-3 flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${flight.isActive ? "bg-emerald-500" : "bg-stone-300"}`} />
                <span className="text-xs text-stone-400">
                  Flight #{flight.flightId} · {flight.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Network context */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-stone-700 mb-4">Network Context</h3>
          <p className="text-sm text-stone-500 mb-3">
            Your campaigns run on the FoodTrove Media retail media network (Kevel Network 12024).
            Ads are served via first-price CPM auction across {" "}
            <strong className="text-stone-700">8 departments</strong> and{" "}
            <strong className="text-stone-700">91 products</strong>. Keyword targeting routes
            impressions by ad format; contextual targeting narrows delivery to relevant shopper intent signals.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-stone-50 rounded-xl">
              <div className="text-lg font-bold text-stone-900">120K</div>
              <div className="text-xs text-stone-400 mt-0.5">Billboard/mo est.</div>
            </div>
            <div className="text-center p-3 bg-stone-50 rounded-xl">
              <div className="text-lg font-bold text-stone-900">280K</div>
              <div className="text-xs text-stone-400 mt-0.5">Leaderboard/mo est.</div>
            </div>
            <div className="text-center p-3 bg-stone-50 rounded-xl">
              <div className="text-lg font-bold text-stone-900">420K</div>
              <div className="text-xs text-stone-400 mt-0.5">MRec/mo est.</div>
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <div className="flex items-center gap-4 pt-4 border-t border-stone-200">
          <a href="/brands" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
            ← Brand Directory
          </a>
          <a href={`/brands/${slug}`} className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
            Brand Page ↗
          </a>
          <span className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-stone-400">FoodTrove Media · Kevel Network 12024</span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

/**
 * PacingDashboardClient — Flight Pacing for Casey (Ad Ops)
 *
 * Fetches live flight data from /api/admin/campaigns and computes pacing signals.
 *
 * Pacing model (demo-friendly):
 *   - Flight start date → compute days elapsed / total days
 *   - For IsUnlimited flights: simulate expected impressions based on CPM bucket
 *     (billboard: 10K/day, leaderboard: 25K/day, MRec: 20K/day)
 *   - Simulated impressions served: days_elapsed × daily_rate (with ±15% noise seed on flight ID)
 *   - Pacing ratio: (simulated_served / expected_at_this_point) × 100
 *   - Health:
 *     >110% = over-pacing (amber)
 *     90–110% = on-track (green)
 *     <90% = under-pacing (red)
 */

import { useEffect, useState } from "react";

interface AdSummary {
  id: number;
  creativeId: number;
  isActive: boolean;
  percentage: number;
}

interface FlightSummary {
  id: number;
  name: string;
  isActive: boolean;
  isUnlimited: boolean;
  impressions: number;
  price: number;
  rateType: number;
  keywords: string;
  startDate: string;
  noEndDate: boolean;
  priorityId: number;
  ads: AdSummary[];
}

interface CampaignSummary {
  id: number;
  name: string;
  isActive: boolean;
  advertiserId: number;
  flights: FlightSummary[];
}

interface AdvertiserSummary {
  id: number;
  name: string;
  isActive: boolean;
  campaigns: CampaignSummary[];
}

interface CampaignsResponse {
  advertisers: AdvertiserSummary[];
  meta: {
    networkId: number;
    siteId: number;
    channelId: number;
    fetchedAt: string;
  };
}

// Format name → keyword to ad format mapping
function inferFormat(name: string, keywords: string): string {
  const kw = keywords.toLowerCase();
  const nm = name.toLowerCase();
  if (kw.includes("billboard") || nm.includes("billboard")) return "billboard";
  if (kw.includes("leaderboard") || nm.includes("leaderboard")) return "leaderboard";
  if (kw.includes("mrec") || nm.includes("mrec") || nm.includes("medium") || nm.includes("300")) return "mrec";
  return "display";
}

// Simulated daily impression volume by format
function dailyRate(format: string): number {
  switch (format) {
    case "billboard": return 8500;
    case "leaderboard": return 22000;
    case "mrec": return 17500;
    default: return 12000;
  }
}

// Deterministic "noise" factor per flight ID (±15%)
function pacingNoise(flightId: number): number {
  const seed = flightId % 100;
  return 0.85 + (seed / 100) * 0.30; // 0.85 to 1.15
}

interface PacingFlight {
  flightId: number;
  flightName: string;
  advertiserName: string;
  advertiserId: number;
  campaignName: string;
  format: string;
  isActive: boolean;
  cpm: number;
  // Pacing
  daysLive: number;
  impressionsExpected: number; // cumulative through today
  impressionsServed: number;   // simulated
  pacingPct: number;
  health: "on-track" | "over-pacing" | "under-pacing" | "inactive";
  // Revenue (estimated)
  revenueEstimate: number;
  // Creative health
  creativeCount: number;
  allCreativesActive: boolean;
}

function computePacing(
  flight: FlightSummary,
  advertiserName: string,
  advertiserId: number,
  campaignName: string
): PacingFlight {
  const format = inferFormat(flight.name, flight.keywords);
  const rate = dailyRate(format);

  // Days since flight start (approximation — startDate is Unix ms / Kevel epoch)
  // Kevel stores StartDate as a Unix ms timestamp or ISO string
  let daysLive = 0;
  if (flight.startDate) {
    const startMs = typeof flight.startDate === "number"
      ? flight.startDate
      : Date.parse(flight.startDate as unknown as string);
    const nowMs = Date.now();
    daysLive = Math.max(0, Math.floor((nowMs - startMs) / (1000 * 60 * 60 * 24)));
  }

  const noise = pacingNoise(flight.id);
  const impressionsExpected = daysLive * rate;
  const impressionsServed = Math.floor(impressionsExpected * noise);
  const pacingPct = impressionsExpected > 0
    ? Math.round((impressionsServed / impressionsExpected) * 100)
    : 100;

  let health: PacingFlight["health"] = "on-track";
  if (!flight.isActive) {
    health = "inactive";
  } else if (pacingPct > 110) {
    health = "over-pacing";
  } else if (pacingPct < 90) {
    health = "under-pacing";
  }

  const revenueEstimate = Math.floor((impressionsServed / 1000) * flight.price);

  const allCreativesActive = flight.ads.length > 0 && flight.ads.every((a) => a.isActive && a.percentage > 0);

  return {
    flightId: flight.id,
    flightName: flight.name,
    advertiserName,
    advertiserId,
    campaignName,
    format,
    isActive: flight.isActive,
    cpm: flight.price,
    daysLive,
    impressionsExpected,
    impressionsServed,
    pacingPct,
    health,
    revenueEstimate,
    creativeCount: flight.ads.length,
    allCreativesActive,
  };
}

function healthBadge(health: PacingFlight["health"]) {
  switch (health) {
    case "on-track":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          On track
        </span>
      );
    case "over-pacing":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          Over-pacing
        </span>
      );
    case "under-pacing":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
          Under-pacing
        </span>
      );
    case "inactive":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-xs font-medium border border-stone-200">
          Inactive
        </span>
      );
  }
}

function PacingBar({ pct, health }: { pct: number; health: PacingFlight["health"] }) {
  const colors = {
    "on-track": "bg-emerald-500",
    "over-pacing": "bg-amber-400",
    "under-pacing": "bg-red-500",
    "inactive": "bg-stone-300",
  };
  const capped = Math.min(pct, 130);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colors[health]}`}
          style={{ width: `${(capped / 130) * 100}%` }}
        />
      </div>
      <span className="text-xs font-mono text-stone-500 w-10 text-right">{pct}%</span>
    </div>
  );
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function PacingDashboardClient() {
  const [data, setData] = useState<CampaignsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/campaigns", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastFetched(new Date().toLocaleTimeString());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-stone-400 animate-pulse">Fetching live pacing data…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-700">
          <strong>Error loading pacing data:</strong> {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Flatten all flights into pacing rows
  const rows: PacingFlight[] = [];
  for (const adv of data.advertisers) {
    for (const camp of adv.campaigns) {
      for (const flight of camp.flights) {
        rows.push(computePacing(flight, adv.name, adv.id, camp.name));
      }
    }
  }

  // Sort: inactive last, then by health severity (under-pacing first)
  const healthOrder = { "under-pacing": 0, "over-pacing": 1, "on-track": 2, "inactive": 3 };
  rows.sort((a, b) => healthOrder[a.health] - healthOrder[b.health]);

  // Summary counts
  const underPacing = rows.filter((r) => r.health === "under-pacing").length;
  const overPacing = rows.filter((r) => r.health === "over-pacing").length;
  const onTrack = rows.filter((r) => r.health === "on-track").length;
  const totalServed = rows.reduce((s, r) => s + r.impressionsServed, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenueEstimate, 0);

  const formatLabel: Record<string, string> = {
    billboard: "Billboard 970×250",
    leaderboard: "Leaderboard 728×90",
    mrec: "MRec 300×250",
    display: "Display",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-stone-400 mb-1">Active Flights</div>
          <div className="text-2xl font-bold text-stone-900">{rows.filter(r => r.isActive).length}</div>
          <div className="text-xs text-stone-400 mt-0.5">{rows.length} total</div>
        </div>
        <div className={`border rounded-xl p-4 shadow-sm ${underPacing > 0 ? "bg-red-50 border-red-200" : "bg-white border-stone-200"}`}>
          <div className={`text-xs mb-1 ${underPacing > 0 ? "text-red-500" : "text-stone-400"}`}>Under-pacing</div>
          <div className={`text-2xl font-bold ${underPacing > 0 ? "text-red-700" : "text-stone-400"}`}>{underPacing}</div>
          <div className="text-xs text-stone-400 mt-0.5">require attention</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-stone-400 mb-1">Simulated Imps</div>
          <div className="text-2xl font-bold text-stone-900">{fmtNum(totalServed)}</div>
          <div className="text-xs text-stone-400 mt-0.5">all active flights</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-stone-400 mb-1">Est. Revenue</div>
          <div className="text-2xl font-bold text-stone-900">${totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-stone-400 mt-0.5">at booked CPMs</div>
        </div>
      </div>

      {/* Pacing alerts */}
      {underPacing > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-2">
            <svg className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className="text-sm font-semibold text-red-800">
                {underPacing} flight{underPacing > 1 ? "s" : ""} under-pacing
              </div>
              <div className="text-xs text-red-600 mt-0.5">
                Check flight settings and creative health. Under-pacing may indicate budget exhaustion, targeting mismatch, or a paused creative.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per-advertiser sections */}
      {data.advertisers.map((adv) => {
        const advRows = rows.filter((r) => r.advertiserId === adv.id);
        if (advRows.length === 0) return null;
        const advRevenue = advRows.reduce((s, r) => s + r.revenueEstimate, 0);

        return (
          <div key={adv.id} className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-stone-900">{adv.name}</h2>
                {adv.isActive
                  ? <span className="text-xs px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">Active</span>
                  : <span className="text-xs px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded border border-stone-200">Inactive</span>
                }
              </div>
              <span className="text-xs text-stone-400">Est. ${advRevenue.toLocaleString()} total</span>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-stone-400 w-[35%]">Flight</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-stone-400 w-[12%]">Format</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-stone-400 w-[12%]">Health</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-stone-400 w-[22%]">Pacing</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-stone-400 w-[10%]">Imps</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-stone-400 w-[9%]">Est. Rev</th>
                  </tr>
                </thead>
                <tbody>
                  {advRows.map((row, idx) => (
                    <tr key={row.flightId}
                      className={`border-b border-stone-50 hover:bg-stone-50/50 transition-colors ${
                        idx === advRows.length - 1 ? "border-b-0" : ""
                      }`}>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <div>
                            <div className="text-xs font-medium text-stone-900 leading-snug">{row.flightName}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-stone-400">CPM ${row.cpm.toFixed(2)}</span>
                              {!row.allCreativesActive && row.isActive && (
                                <span className="text-xs text-amber-600 flex items-center gap-0.5">
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  Creative issue
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-stone-500">{formatLabel[row.format] ?? row.format}</span>
                      </td>
                      <td className="px-4 py-3">
                        {healthBadge(row.health)}
                      </td>
                      <td className="px-4 py-3">
                        <PacingBar pct={row.pacingPct} health={row.health} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-mono text-stone-600">{fmtNum(row.impressionsServed)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-mono text-stone-600">${row.revenueEstimate.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-stone-400">
        <div>
          Pacing data: simulated delivery model · Real-time impression reporting requires Kevel Reporting API
        </div>
        <div className="flex items-center gap-2">
          {lastFetched && <span>Refreshed {lastFetched}</span>}
          <button onClick={fetchData}
            className="px-2 py-1 border border-stone-200 rounded-md hover:border-stone-300 text-stone-500 hover:text-stone-700 transition-all bg-white shadow-sm">
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";

// Campaign data — sourced from /api/admin/campaigns (live Kevel Management API)
// Falls back to static snapshot if the API is unavailable (Vercel env vars not set).
// Static data is the canonical source of advertiser/flight IDs for FoodTrove network 12024.

interface AdEntry {
  adId: number;
  creativeId: number;
  percentage: number;
  isActive: boolean;
}

interface FlightEntry {
  id: number;
  name: string;
  format: "billboard" | "leaderboard" | "mrec";
  formatLabel: string;
  keyword: string;
  cpm: number;
  isActive: boolean;
  isUnlimited: boolean;
  impressions: number;
  ads: AdEntry[];
}

interface AdvertiserEntry {
  id: number;
  name: string;
  color: string; // for visual identity
  tagline: string;
  campaigns: {
    id: number;
    name: string;
    isActive: boolean;
    flights: FlightEntry[];
  }[];
}

// Static data — represents the live Kevel state as of 2026-05-11
const ADVERTISERS: AdvertiserEntry[] = [
  {
    id: 6256813,
    name: "Organic Valley",
    color: "#15803d",
    tagline: "Organic dairy co-op, pasture-raised, farmer-owned since 1988, Wisconsin",
    campaigns: [
      {
        id: 659171965,
        name: "Organic Valley — Q2 2026",
        isActive: true,
        flights: [
          {
            id: 863229974, name: "Organic Valley — Homepage Billboard Q2 2026",
            format: "billboard", formatLabel: "Billboard 970×250",
            keyword: "ft-billboard", cpm: 5.00,
            isActive: true, isUnlimited: true, impressions: 1000000,
            ads: [{ adId: 1081404207, creativeId: 905327348, percentage: 100, isActive: true }]
          },
          {
            id: 863229975, name: "Organic Valley — Homepage Leaderboard Q2 2026",
            format: "leaderboard", formatLabel: "Leaderboard 728×90",
            keyword: "ft-leaderboard", cpm: 5.00,
            isActive: true, isUnlimited: true, impressions: 1000000,
            ads: [{ adId: 1081437296, creativeId: 905360724, percentage: 100, isActive: true }]
          },
          {
            id: 863229976, name: "Organic Valley — Product MRec Q2 2026",
            format: "mrec", formatLabel: "Medium Rectangle 300×250",
            keyword: "ft-mrec", cpm: 5.00,
            isActive: true, isUnlimited: true, impressions: 1000000,
            ads: [{ adId: 1081470449, creativeId: 905392725, percentage: 100, isActive: true }]
          },
        ],
      },
    ],
  },
  {
    id: 6256814,
    name: "Liquid I.V.",
    color: "#0369a1",
    tagline: "Hydration multiplier, Cellular Transport Technology, beverages/supplements, California",
    campaigns: [
      {
        id: 659171966,
        name: "Liquid I.V. — Launch Q2 2026",
        isActive: true,
        flights: [
          {
            id: 863229977, name: "Liquid I.V. — Billboard Q2 2026",
            format: "billboard", formatLabel: "Billboard 970×250",
            keyword: "ft-billboard", cpm: 7.50,
            isActive: true, isUnlimited: true, impressions: 1000000,
            ads: [{ adId: 1081471133, creativeId: 905393443, percentage: 100, isActive: true }]
          },
          {
            id: 863229978, name: "Liquid I.V. — Leaderboard Q2 2026",
            format: "leaderboard", formatLabel: "Leaderboard 728×90",
            keyword: "ft-leaderboard", cpm: 6.50,
            isActive: true, isUnlimited: true, impressions: 1000000,
            ads: [{ adId: 1081471134, creativeId: 905393444, percentage: 100, isActive: true }]
          },
          {
            id: 863229979, name: "Liquid I.V. — MRec Q2 2026",
            format: "mrec", formatLabel: "Medium Rectangle 300×250",
            keyword: "ft-mrec", cpm: 6.00,
            isActive: true, isUnlimited: true, impressions: 1000000,
            ads: [{ adId: 1081471135, creativeId: 905393445, percentage: 100, isActive: true }]
          },
        ],
      },
    ],
  },
  {
    id: 6256815,
    name: "Earthbound Farm",
    color: "#166534",
    tagline: "America's #1 organic salad brand, organic salads & produce, since 1984, California",
    campaigns: [
      {
        id: 659171967,
        name: "Earthbound Farm — Spring Produce Q2 2026",
        isActive: true,
        flights: [
          {
            id: 863229981, name: "Earthbound Farm — Produce Leaderboard Q2 2026",
            format: "leaderboard", formatLabel: "Leaderboard 728×90",
            keyword: "ft-leaderboard,produce", cpm: 8.00,
            isActive: true, isUnlimited: true, impressions: 1000000,
            ads: [{ adId: 1081476545, creativeId: 905398803, percentage: 100, isActive: true }]
          },
          {
            id: 863229982, name: "Earthbound Farm — Produce MRec Q2 2026",
            format: "mrec", formatLabel: "Medium Rectangle 300×250",
            keyword: "ft-mrec,produce", cpm: 7.50,
            isActive: true, isUnlimited: true, impressions: 1000000,
            ads: [{ adId: 1081476547, creativeId: 905398804, percentage: 100, isActive: true }]
          },
        ],
      },
    ],
  },
];

const FORMAT_COLORS = {
  billboard: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-400" },
  leaderboard: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-400" },
  mrec: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400" },
};

interface AuctionAnalysis {
  format: string;
  formatLabel: string;
  slots: { advertiser: string; cpm: number; keyword: string; isContextual: boolean }[];
}

function getAuctionAnalysis(): AuctionAnalysis[] {
  const formats: Record<string, AuctionAnalysis> = {
    billboard: { format: "billboard", formatLabel: "Billboard 970×250", slots: [] },
    leaderboard: { format: "leaderboard", formatLabel: "Leaderboard 728×90", slots: [] },
    mrec: { format: "mrec", formatLabel: "Medium Rectangle 300×250", slots: [] },
  };

  for (const adv of ADVERTISERS) {
    for (const campaign of adv.campaigns) {
      for (const flight of campaign.flights) {
        const isContextual = flight.keyword.includes(",");
        if (formats[flight.format]) {
          formats[flight.format].slots.push({
            advertiser: adv.name,
            cpm: flight.cpm,
            keyword: flight.keyword,
            isContextual,
          });
        }
      }
    }
  }

  // Sort by CPM descending in each format
  for (const key of Object.keys(formats)) {
    formats[key].slots.sort((a, b) => b.cpm - a.cpm);
  }

  return Object.values(formats);
}

export default function CampaignDashboardClient() {
  const [expandedFlights, setExpandedFlights] = useState<Set<number>>(new Set());
  const [decisionResults, setDecisionResults] = useState<Record<string, string>>({});
  const [testingSlot, setTestingSlot] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<Record<string, { isActive?: boolean; impressions?: number }>>({});
  const [liveDataState, setLiveDataState] = useState<"loading" | "live" | "unavailable">("loading");
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  // Fetch live campaign data from the Kevel Management API proxy
  const fetchLiveData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/campaigns");
      if (!res.ok) {
        setLiveDataState("unavailable");
        return;
      }
      const data = await res.json();
      if (data.error) {
        setLiveDataState("unavailable");
        return;
      }
      // Build a flight-id → live status map
      const statusMap: Record<string, { isActive?: boolean; impressions?: number }> = {};
      for (const adv of data.advertisers ?? []) {
        for (const camp of adv.campaigns ?? []) {
          for (const flight of camp.flights ?? []) {
            statusMap[flight.id] = { isActive: flight.isActive, impressions: flight.impressions };
          }
        }
      }
      setLiveStatus(statusMap);
      setFetchedAt(data.meta?.fetchedAt ?? null);
      setLiveDataState("live");
    } catch {
      setLiveDataState("unavailable");
    }
  }, []);

  useEffect(() => {
    fetchLiveData();
    // Refresh live data every 60 seconds
    const interval = setInterval(fetchLiveData, 60_000);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  const toggleFlight = (flightId: number) => {
    setExpandedFlights(prev => {
      const next = new Set(prev);
      if (next.has(flightId)) next.delete(flightId);
      else next.add(flightId);
      return next;
    });
  };

  const testDecision = async (keyword: string, label: string) => {
    setTestingSlot(keyword);
    try {
      const size = keyword.includes("billboard") ? "billboard"
        : keyword.includes("leaderboard") ? "leaderboard" : "medium-rectangle";
      const keywords = keyword.split(",").map(k => k.trim());
      
      const res = await fetch("/api/ad-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placementId: `admin-test-${keyword}`, size, keywords }),
      });
      const data = await res.json();
      if (data.filled) {
        setDecisionResults(prev => ({ ...prev, [keyword]: `✓ FILL — advertiser serving` }));
      } else {
        setDecisionResults(prev => ({ ...prev, [keyword]: "○ No fill" }));
      }
    } catch {
      setDecisionResults(prev => ({ ...prev, [keyword]: "✗ Error" }));
    }
    setTestingSlot(null);
  };

  const totalFlights = ADVERTISERS.reduce((acc, adv) =>
    acc + adv.campaigns.reduce((acc2, c) => acc2 + c.flights.length, 0), 0);
  const totalAdvertisers = ADVERTISERS.length;
  const totalCampaigns = ADVERTISERS.reduce((acc, adv) => acc + adv.campaigns.length, 0);

  const auctionAnalysis = getAuctionAnalysis();

  return (
    <div className="space-y-8">
      {/* Live data status banner */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-medium ${
        liveDataState === "live"
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : liveDataState === "loading"
          ? "bg-stone-50 text-stone-500 border border-stone-200"
          : "bg-amber-50 text-amber-700 border border-amber-200"
      }`}>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${
            liveDataState === "live" ? "bg-emerald-500" :
            liveDataState === "loading" ? "bg-stone-400 animate-pulse" : "bg-amber-500"
          }`} />
          {liveDataState === "live" && "Live data from Kevel Management API (refreshes every 60s)"}
          {liveDataState === "loading" && "Connecting to Kevel Management API…"}
          {liveDataState === "unavailable" && "Showing static snapshot — Kevel API unavailable (check KEVEL_API_KEY in Vercel env vars)"}
        </div>
        {fetchedAt && (
          <span className="font-mono text-[10px] text-emerald-600">
            {new Date(fetchedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Advertisers", value: totalAdvertisers, icon: "🏢" },
          { label: "Campaigns", value: totalCampaigns, icon: "📋" },
          { label: "Flights", value: totalFlights, icon: "✈️" },
          { label: "Formats", value: 3, icon: "📐" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-xl border border-stone-100 shadow-sm p-4">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-extrabold text-stone-900">{value}</div>
            <div className="text-xs font-medium text-stone-400 uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {/* Auction Analysis */}
      <div>
        <h2 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-3">Live Auction — Competitive Fill Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {auctionAnalysis.map((analysis) => {
            const fmtColors = FORMAT_COLORS[analysis.format as keyof typeof FORMAT_COLORS];
            return (
              <div key={analysis.format} className={`bg-white rounded-xl border shadow-sm p-4 ${fmtColors.border}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${fmtColors.dot}`} />
                  <h3 className="text-sm font-bold text-stone-700">{analysis.formatLabel}</h3>
                </div>
                <div className="space-y-2">
                  {analysis.slots.map((slot, idx) => (
                    <div key={`${slot.advertiser}-${slot.cpm}`} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-stone-50">
                      <div>
                        <div className="flex items-center gap-1.5">
                          {idx === 0 && (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                              Top Bid
                            </span>
                          )}
                          {slot.isContextual && (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                              Contextual
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-stone-700 mt-0.5">{slot.advertiser}</div>
                        <div className="text-[10px] font-mono text-stone-400">{slot.keyword}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-stone-900">${slot.cpm.toFixed(2)}</div>
                        <div className="text-[10px] text-stone-400">CPM</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => testDecision(
                    analysis.slots[0]?.keyword ?? analysis.format,
                    analysis.formatLabel
                  )}
                  disabled={testingSlot === analysis.slots[0]?.keyword}
                  className="mt-3 w-full text-xs py-1.5 px-3 rounded-lg bg-stone-100 text-stone-600 font-medium hover:bg-stone-200 disabled:opacity-50 transition-colors"
                >
                  {testingSlot === analysis.slots[0]?.keyword ? "Testing…" : "Test Decision API →"}
                </button>
                {decisionResults[analysis.slots[0]?.keyword] && (
                  <div className={`mt-2 text-xs text-center font-medium ${
                    decisionResults[analysis.slots[0]?.keyword]?.startsWith("✓")
                      ? "text-emerald-600" : "text-stone-400"
                  }`}>
                    {decisionResults[analysis.slots[0]?.keyword]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Advertiser cards */}
      <div>
        <h2 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-3">Advertisers & Flights</h2>
        <div className="space-y-6">
          {ADVERTISERS.map((adv) => (
            <div key={adv.id} className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
              {/* Advertiser header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-stone-50"
                style={{ borderLeft: `4px solid ${adv.color}` }}>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-stone-900">{adv.name}</h3>
                    <span className="text-xs font-mono text-stone-400">ID: {adv.id}</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">{adv.tagline}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
                    Active
                  </span>
                </div>
              </div>

              {/* Campaigns & Flights */}
              {adv.campaigns.map((campaign) => (
                <div key={campaign.id}>
                  <div className="px-6 py-2 bg-stone-50 border-b border-stone-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-600">{campaign.name}</span>
                      <span className="text-[10px] font-mono text-stone-400">Campaign {campaign.id}</span>
                    </div>
                  </div>

                  <div className="divide-y divide-stone-50">
                    {campaign.flights.map((flight) => {
                      const fmtColors = FORMAT_COLORS[flight.format as keyof typeof FORMAT_COLORS];
                            const isExpanded = expandedFlights.has(flight.id);
                            // Overlay live status if available; fall back to static
                            const liveFlightData = liveStatus[flight.id];
                            const effectiveActive = liveFlightData?.isActive ?? flight.isActive;
                      return (
                        <div key={flight.id}>
                          <button
                            className="w-full px-6 py-3.5 flex items-center justify-between hover:bg-stone-50 transition-colors text-left"
                            onClick={() => toggleFlight(flight.id)}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${fmtColors.bg} ${fmtColors.text}`}>
                                {flight.formatLabel}
                              </span>
                              <span className="text-sm font-medium text-stone-700 truncate max-w-xs">
                                {flight.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right">
                                <div className="text-sm font-bold text-stone-900">${flight.cpm.toFixed(2)}</div>
                                <div className="text-[10px] text-stone-400">CPM</div>
                              </div>
                              <div className="text-right hidden sm:block">
                                <div className="text-xs font-mono text-stone-400">{flight.keyword}</div>
                              </div>
                              <span className={`text-[10px] rotate-90 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                                ›
                              </span>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-6 pb-4 bg-stone-50 border-t border-stone-100">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                                {[
                                  { label: "Flight ID", value: flight.id, mono: true },
                                  { label: "Status", value: effectiveActive ? "Active" : "Paused", mono: false },
                                  { label: "Impressions Cap", value: flight.isUnlimited ? "Unlimited" : flight.impressions.toLocaleString(), mono: false },
                                  { label: "Keywords", value: flight.keyword, mono: true },
                                ].map(({ label, value, mono }) => (
                                  <div key={label} className="bg-white rounded-lg p-2.5 border border-stone-100">
                                    <div className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">{label}</div>
                                    <div className={`text-xs font-semibold text-stone-700 ${mono ? "font-mono" : ""}`}>{value}</div>
                                  </div>
                                ))}
                              </div>
                              {flight.ads.map((ad) => (
                                <div key={ad.adId} className="mt-3 bg-white rounded-lg p-2.5 border border-stone-100">
                                  <div className="text-[10px] text-stone-400 uppercase tracking-wide mb-2">Creative Mapping</div>
                                  <div className="flex items-center gap-4 flex-wrap">
                                    <span className="text-xs font-mono text-stone-500">Ad ID: {ad.adId}</span>
                                    <span className="text-xs font-mono text-stone-500">Creative: {ad.creativeId}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      ad.isActive ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"
                                    }`}>
                                      {ad.isActive ? "Active" : "Paused"}
                                    </span>
                                    <span className="text-xs font-medium text-stone-700">Weight: {ad.percentage}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Network config panel */}
      <div className="bg-stone-900 rounded-xl p-6 text-white">
        <h2 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">Kevel Network Configuration</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Network", value: "12024" },
            { label: "Site ID", value: "1324936" },
            { label: "Channel", value: "65694" },
            { label: "Ad Type", value: "5" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">{label}</div>
              <div className="text-sm font-mono font-bold text-stone-200">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">Decision API</div>
            <div className="text-xs font-mono text-emerald-400">https://e-12024.adzerk.net/api/v2</div>
          </div>
          <div>
            <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">Management API</div>
            <div className="text-xs font-mono text-emerald-400">https://api.kevel.co/v1</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-stone-800">
          <div className="text-xs text-stone-500 uppercase tracking-wide mb-2">Ad Slot Inventory</div>
          <div className="text-xs font-mono text-stone-400 leading-relaxed">
            home-hero-billboard · home-mid-leaderboard · dept-*-top-leaderboard · dept-*-right-rail-mrec ·
            product-*-right-rail · product-*-mid-leaderboard · search-* · deals-* ·
            cart-top-leaderboard · cart-sidebar-mrec · checkout-top-leaderboard ·
            post-purchase-billboard · post-purchase-leaderboard · account-sidebar-mrec · account-top-leaderboard
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * /api/admin/auction-log — Live Auction Event Stream
 *
 * Returns a stream of recent auction decision events across all placements,
 * showing which advertiser won each auction, at what CPM, and the competitive
 * context (other bidders, their CPMs). This makes auction mechanics tangible
 * for the sales demo and for Ad Ops monitoring.
 *
 * Data model:
 * - Each event represents one ad impression decision
 * - Winner: highest CPM eligible advertiser (Kevel first-price auction)
 * - Losers: other eligible advertisers who lost on price/targeting
 * - Contextual events: GreenLeaf wins on produce/organic pages (highest CPM)
 * - Placement taxonomy mirrors actual AdSlot usage in the storefront
 *
 * Realism notes:
 * - Events are generated from a deterministic model seeded by timestamp
 *   (so the same request returns the same recent events — no jitter)
 * - CPMs and advertisers match the actual Kevel flight configuration
 * - Contextual wins (GreenLeaf) only appear on appropriate placements
 * - Event volume is calibrated to realistic page traffic (200-500 events/hour)
 *
 * Auth: none (demo — production would require session auth)
 */

import { NextRequest, NextResponse } from "next/server";

// Advertiser definitions — matches Kevel campaign config
interface Advertiser {
  id: number;
  name: string;
  slug: string;
  color: string;   // Tailwind color token for badge rendering
}

const ADVERTISERS: Record<number, Advertiser> = {
  6254651: { id: 6254651, name: "FreshFarm Organics", slug: "freshfarm", color: "green" },
  6256255: { id: 6256255, name: "NutriPeak Nutrition", slug: "nutripeak", color: "blue" },
  6256266: { id: 6256266, name: "GreenLeaf Farms", slug: "greenleaf", color: "emerald" },
};

// Ad format definitions
interface FormatConfig {
  keyword: string;
  label: string;
  dimensions: string;
  flights: FlightConfig[];
}

interface FlightConfig {
  flightId: number;
  advertiserId: number;
  cpm: number;
  contextual: boolean;
  contextKeywords: string[];  // keywords that make this flight eligible
}

const FORMATS: FormatConfig[] = [
  {
    keyword: "ft-billboard",
    label: "Billboard",
    dimensions: "970×250",
    flights: [
      { flightId: 863187467, advertiserId: 6254651, cpm: 5.0, contextual: false, contextKeywords: [] },
      { flightId: 863188608, advertiserId: 6256255, cpm: 7.5, contextual: false, contextKeywords: [] },
    ],
  },
  {
    keyword: "ft-leaderboard",
    label: "Leaderboard",
    dimensions: "728×90",
    flights: [
      { flightId: 863187590, advertiserId: 6254651, cpm: 5.0, contextual: false, contextKeywords: [] },
      { flightId: 863188610, advertiserId: 6256255, cpm: 6.5, contextual: false, contextKeywords: [] },
      { flightId: 863188756, advertiserId: 6256266, cpm: 8.0, contextual: true, contextKeywords: ["produce", "organic", "fresh"] },
    ],
  },
  {
    keyword: "ft-mrec",
    label: "MRec",
    dimensions: "300×250",
    flights: [
      { flightId: 863188334, advertiserId: 6254651, cpm: 5.0, contextual: false, contextKeywords: [] },
      { flightId: 863188611, advertiserId: 6256255, cpm: 6.0, contextual: false, contextKeywords: [] },
      { flightId: 863188757, advertiserId: 6256266, cpm: 7.5, contextual: true, contextKeywords: ["produce", "organic", "fresh"] },
    ],
  },
];

// Placement taxonomy — mirrors actual storefront AdSlot usage
interface PlacementConfig {
  id: string;
  label: string;
  page: string;
  pageLabel: string;
  formatKeyword: string;
  contextKeywords: string[];  // additional context passed on this placement
  impressionsPerHour: number; // traffic volume for this placement
}

const PLACEMENTS: PlacementConfig[] = [
  { id: "home-hero-billboard", label: "Homepage Hero Billboard", page: "/", pageLabel: "Homepage", formatKeyword: "ft-billboard", contextKeywords: [], impressionsPerHour: 180 },
  { id: "home-mid-leaderboard", label: "Homepage Mid Leaderboard", page: "/", pageLabel: "Homepage", formatKeyword: "ft-leaderboard", contextKeywords: [], impressionsPerHour: 160 },
  { id: "dept-produce-leaderboard", label: "Produce Dept Leaderboard", page: "/shop/produce", pageLabel: "Produce Dept", formatKeyword: "ft-leaderboard", contextKeywords: ["produce", "organic", "fresh"], impressionsPerHour: 95 },
  { id: "dept-dairy-leaderboard", label: "Dairy Dept Leaderboard", page: "/shop/dairy", pageLabel: "Dairy Dept", formatKeyword: "ft-leaderboard", contextKeywords: ["dairy"], impressionsPerHour: 72 },
  { id: "product-right-rail-mrec", label: "Product Right Rail MRec", page: "/shop/produce/:id", pageLabel: "Product Detail (Produce)", formatKeyword: "ft-mrec", contextKeywords: ["produce", "organic"], impressionsPerHour: 145 },
  { id: "product-snacks-mrec", label: "Snacks Product MRec", page: "/shop/snacks/:id", pageLabel: "Product Detail (Snacks)", formatKeyword: "ft-mrec", contextKeywords: ["snacks", "nutrition"], impressionsPerHour: 88 },
  { id: "cart-top-leaderboard", label: "Cart Top Leaderboard", page: "/cart", pageLabel: "Cart", formatKeyword: "ft-leaderboard", contextKeywords: [], impressionsPerHour: 55 },
  { id: "deals-billboard", label: "Deals Page Billboard", page: "/deals", pageLabel: "Deals", formatKeyword: "ft-billboard", contextKeywords: [], impressionsPerHour: 110 },
  { id: "search-sponsored-shelf", label: "Sponsored Search Shelf", page: "/search", pageLabel: "Search Results", formatKeyword: "ft-mrec", contextKeywords: [], impressionsPerHour: 130 },
  { id: "order-confirm-billboard", label: "Post-Purchase Billboard", page: "/order/:id", pageLabel: "Order Confirmation", formatKeyword: "ft-billboard", contextKeywords: [], impressionsPerHour: 42 },
];

export interface AuctionEvent {
  id: string;              // unique event ID
  ts: number;              // unix timestamp (ms)
  placementId: string;
  placementLabel: string;
  pageLabel: string;
  formatLabel: string;
  dimensions: string;
  winner: {
    advertiserId: number;
    advertiserName: string;
    advertiserSlug: string;
    advertiserColor: string;
    flightId: number;
    cpm: number;
    contextual: boolean;
    impressionRevenue: number;   // cpm / 1000
  };
  losers: Array<{
    advertiserId: number;
    advertiserName: string;
    cpm: number;
    eligible: boolean;      // false = contextual flight not eligible on this page
    reason: string;         // "outbid" | "context-mismatch"
  }>;
  contextKeywords: string[];
  auctionDurationMs: number;    // simulated latency
  candidateCount: number;
}

export interface AuctionLogResponse {
  events: AuctionEvent[];
  summary: {
    totalEvents: number;
    windowMinutes: number;
    byAdvertiser: Record<string, { wins: number; revenue: number; avgCpm: number }>;
    byFormat: Record<string, { wins: number; revenue: number }>;
    contextualWinRate: number;    // % of wins from contextual flights
    avgAuctionMs: number;
    topPlacement: string;
    estimatedHourlyRevenue: number;
  };
  generatedAt: number;
}

// Deterministic seeded PRNG — same seed → same events (stable UI between refreshes)
function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateAuctionEvents(windowMinutes: number, now: number): AuctionEvent[] {
  // Seed on the current 30-second window so events change every 30s (demo freshness)
  const windowSeed = Math.floor(now / 30000);
  const rng = seededRandom(windowSeed);

  const events: AuctionEvent[] = [];
  const windowMs = windowMinutes * 60 * 1000;
  const startTs = now - windowMs;

  // Build event timeline: distribute events across window based on placement traffic
  for (const placement of PLACEMENTS) {
    const fmt = FORMATS.find(f => f.keyword === placement.formatKeyword);
    if (!fmt) continue;

    // How many events in this window for this placement
    const eventsInWindow = Math.round(
      (placement.impressionsPerHour / 60) * windowMinutes * (0.8 + rng() * 0.4)
    );

    for (let i = 0; i < eventsInWindow; i++) {
      const eventTs = startTs + rng() * windowMs;

      // Determine which flights are eligible on this placement
      const eligible = fmt.flights.filter(f => {
        if (!f.contextual) return true;
        // Contextual flight only eligible if placement passes matching keyword
        return f.contextKeywords.some(k => placement.contextKeywords.includes(k));
      });

      if (eligible.length === 0) continue;

      // Winner = highest CPM eligible flight
      const winner = eligible.reduce((best, f) => (f.cpm > best.cpm ? f : best));
      const winnerAdv = ADVERTISERS[winner.advertiserId];

      // Losers = other eligible flights + ineligible contextual flights
      const losers = fmt.flights
        .filter(f => f.flightId !== winner.flightId)
        .map(f => {
          const isEligible = !f.contextual || f.contextKeywords.some(k => placement.contextKeywords.includes(k));
          return {
            advertiserId: f.advertiserId,
            advertiserName: ADVERTISERS[f.advertiserId]?.name ?? `Advertiser ${f.advertiserId}`,
            cpm: f.cpm,
            eligible: isEligible,
            reason: isEligible ? "outbid" : "context-mismatch",
          };
        });

      // Simulated auction latency: 18–45ms
      const latencyMs = Math.round(18 + rng() * 27);

      const eventId = `evt-${placement.id}-${Math.floor(eventTs)}-${i}`;

      events.push({
        id: eventId,
        ts: Math.round(eventTs),
        placementId: placement.id,
        placementLabel: placement.label,
        pageLabel: placement.pageLabel,
        formatLabel: fmt.label,
        dimensions: fmt.dimensions,
        winner: {
          advertiserId: winner.advertiserId,
          advertiserName: winnerAdv?.name ?? `Advertiser ${winner.advertiserId}`,
          advertiserSlug: winnerAdv?.slug ?? String(winner.advertiserId),
          advertiserColor: winnerAdv?.color ?? "gray",
          flightId: winner.flightId,
          cpm: winner.cpm,
          contextual: winner.contextual,
          impressionRevenue: winner.cpm / 1000,
        },
        losers,
        contextKeywords: placement.contextKeywords,
        auctionDurationMs: latencyMs,
        candidateCount: eligible.length,
      });
    }
  }

  // Sort newest first
  events.sort((a, b) => b.ts - a.ts);

  return events;
}

function computeSummary(events: AuctionEvent[], windowMinutes: number): AuctionLogResponse["summary"] {
  const byAdvertiser: Record<string, { wins: number; revenue: number; avgCpm: number }> = {};
  const byFormat: Record<string, { wins: number; revenue: number }> = {};
  let contextualWins = 0;
  let totalLatency = 0;
  const placementWins: Record<string, number> = {};

  for (const evt of events) {
    const advName = evt.winner.advertiserName;
    if (!byAdvertiser[advName]) byAdvertiser[advName] = { wins: 0, revenue: 0, avgCpm: 0 };
    byAdvertiser[advName].wins++;
    byAdvertiser[advName].revenue += evt.winner.impressionRevenue;

    if (!byFormat[evt.formatLabel]) byFormat[evt.formatLabel] = { wins: 0, revenue: 0 };
    byFormat[evt.formatLabel].wins++;
    byFormat[evt.formatLabel].revenue += evt.winner.impressionRevenue;

    if (evt.winner.contextual) contextualWins++;
    totalLatency += evt.auctionDurationMs;

    placementWins[evt.placementLabel] = (placementWins[evt.placementLabel] ?? 0) + 1;
  }

  // Compute avgCpm per advertiser
  for (const k of Object.keys(byAdvertiser)) {
    const entry = byAdvertiser[k];
    entry.avgCpm = entry.wins > 0 ? (entry.revenue / entry.wins) * 1000 : 0;
  }

  const topPlacement = Object.entries(placementWins).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const totalRevenue = events.reduce((s, e) => s + e.winner.impressionRevenue, 0);
  const hourlyRevenue = windowMinutes > 0 ? (totalRevenue / windowMinutes) * 60 : 0;

  return {
    totalEvents: events.length,
    windowMinutes,
    byAdvertiser,
    byFormat,
    contextualWinRate: events.length > 0 ? contextualWins / events.length : 0,
    avgAuctionMs: events.length > 0 ? totalLatency / events.length : 0,
    topPlacement,
    estimatedHourlyRevenue: hourlyRevenue,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const windowMinutes = Math.min(parseInt(searchParams.get("window") ?? "30", 10), 180);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 500);

  const now = Date.now();
  const events = generateAuctionEvents(windowMinutes, now).slice(0, limit);
  const summary = computeSummary(events, windowMinutes);

  const response: AuctionLogResponse = {
    events,
    summary,
    generatedAt: now,
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store",
      "X-Auction-Events": String(events.length),
    },
  });
}

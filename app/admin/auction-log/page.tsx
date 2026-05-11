/**
 * /admin/auction-log — Live Auction Monitor
 *
 * Shows the real-time bid stream: every ad impression decision across all
 * storefront placements, with winner, losers, CPM, and contextual signals.
 *
 * This is the key demo tool for showing:
 * - Multi-advertiser auction competition
 * - Contextual targeting (GreenLeaf winning on produce pages)
 * - Premium CPM dynamics (higher-value inventory commands more)
 * - Auction latency and scale
 */

import { Suspense } from "react";
import AuctionLogClient from "./AuctionLogClient";
import type { AuctionLogResponse } from "@/app/api/admin/auction-log/route";

export const metadata = {
  title: "Auction Log — FoodTrove Media Admin",
  description: "Live bid stream — see every ad decision, winner, and CPM across all placements.",
};

async function fetchAuctionData(): Promise<AuctionLogResponse | null> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/admin/auction-log?window=30&limit=200`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function AuctionLogPage() {
  const initialData = await fetchAuctionData();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400 text-sm">Loading auction stream…</div>
      </div>
    }>
      <AuctionLogClient initialData={initialData} />
    </Suspense>
  );
}

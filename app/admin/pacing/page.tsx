/**
 * /admin/pacing — Flight Pacing Dashboard for Ad Operations (Casey)
 *
 * Reuses /api/admin/campaigns data and computes:
 *   - Impression delivery rate vs. goal
 *   - Days remaining in flight
 *   - Spend-to-budget ratio (estimated from CPM × impressions served)
 *   - Pacing health signal: on-track / under-pacing / over-pacing
 *
 * For FoodTrove demo: all flights are IsUnlimited=true so "pacing"
 * is measured relative to simulated impressions and flight age.
 * Real deployment would pipe impression counts from Kevel reporting API.
 */

import { Suspense } from "react";
import PacingDashboardClient from "./PacingDashboardClient";
import Link from "next/link";

export const metadata = {
  title: "Flight Pacing — FoodTrove Ad Ops",
  description: "Real-time flight pacing health for Ad Operations",
};

export default function PacingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-stone-400 hover:text-stone-600 transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex items-center justify-center w-8 h-8 bg-violet-600 rounded-lg">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-stone-900">Flight Pacing</h1>
                <p className="text-xs text-stone-400">FoodTrove Media · Ad Operations · Kevel Network 12024</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/campaigns"
                className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-500 hover:border-stone-300 hover:text-stone-700 transition-all bg-white shadow-sm">
                Campaigns ↗
              </Link>
              <Link href="/admin/sales"
                className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-500 hover:border-stone-300 hover:text-stone-700 transition-all bg-white shadow-sm">
                Sales ↗
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-stone-400">Loading pacing data…</div>
        </div>
      }>
        <PacingDashboardClient />
      </Suspense>
    </div>
  );
}

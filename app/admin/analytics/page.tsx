import { Suspense } from "react";
import Link from "next/link";
import AnalyticsDashboardClient from "./AnalyticsDashboardClient";

export const metadata = {
  title: "Network Analytics — FoodTrove Media",
  description: "Real-time retail media network performance analytics",
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-stone-400">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading analytics…</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="text-stone-400 hover:text-stone-600 transition-colors text-sm"
              >
                ← Admin
              </Link>
              <span className="text-stone-300">/</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-xl">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-stone-900">Network Analytics</h1>
                  <p className="text-sm text-stone-400">FoodTrove Media · Kevel Network 12024</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/campaigns"
                className="text-xs text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition-all"
              >
                Campaigns
              </Link>
              <Link
                href="/admin/pacing"
                className="text-xs text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition-all"
              >
                Pacing
              </Link>
              <Link
                href="/admin/sales"
                className="text-xs text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition-all"
              >
                Sales
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingFallback />}>
          <AnalyticsDashboardClient />
        </Suspense>
      </div>
    </div>
  );
}

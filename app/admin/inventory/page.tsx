import { Suspense } from "react";
import InventoryForecastClient from "./InventoryForecastClient";
import Link from "next/link";

export const metadata = {
  title: "Inventory Forecast — FoodTrove Media",
  description: "Available-to-sell inventory by format — pre-sales planning for Ad Ops and Sales",
};

export default function InventoryForecastPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                <svg className="h-4 w-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-stone-900">Inventory Forecast</h1>
                <p className="text-xs text-stone-400">
                  FoodTrove Media · Available-to-Sell · Kevel Network 12024
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/pacing"
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Pacing
              </Link>
              <Link
                href="/admin/analytics"
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<InventorySkeleton />}>
          <InventoryForecastClient />
        </Suspense>
      </div>
    </div>
  );
}

function InventorySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-stone-100 rounded-2xl" />
      <div className="h-12 bg-stone-100 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-72 bg-stone-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

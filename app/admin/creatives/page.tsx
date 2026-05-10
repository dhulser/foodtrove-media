import { Suspense } from "react";
import Link from "next/link";
import CreativesPreviewClient from "./CreativesPreviewClient";

export const metadata = {
  title: "Creative Preview — FoodTrove Ad Ops",
  description: "Live HTML creative preview and flight status for all FoodTrove advertisers",
};

export default function CreativesPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="flex items-center justify-center w-8 h-8 bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-stone-900">Creative Preview</h1>
                <p className="text-xs text-stone-400">FoodTrove Media · Ad Operations · Live HTML Rendering</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/campaigns"
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
                </svg>
                Campaigns
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition"
              >
                ← Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-rose-50 border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-start gap-2.5">
            <svg className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-rose-700 leading-relaxed">
              <strong>Ad Ops tool.</strong> Live HTML creatives rendered directly from Kevel Management API.
              Preview shows exactly what shoppers see — no placeholder substitution.
              Click &ldquo;Show live preview&rdquo; on any creative to expand the rendered iframe.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-24">
              <div className="flex items-center gap-3 text-stone-400">
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm">Loading creatives…</span>
              </div>
            </div>
          }
        >
          <CreativesPreviewClient />
        </Suspense>
      </div>
    </div>
  );
}

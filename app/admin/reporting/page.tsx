/**
 * /admin/reporting — Contextual Performance Report
 *
 * Shows keyword-level revenue attribution and contextual lift vs. run-of-site.
 * Tyler uses this for new advertiser pitches: "your ad on our organic produce
 * pages earns 72% more than run-of-site."
 * Casey uses this to prioritize which contexts to optimize.
 */

export const metadata = {
  title: "Contextual Performance Report — FoodTrove Media",
  description: "Keyword-level revenue attribution and contextual lift vs. run-of-site",
};

import Link from "next/link";
import ContextualReportClient from "./ContextualReportClient";
import { Suspense } from "react";

export default function ReportingPage() {
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-stone-900">Contextual Performance</h1>
                <p className="text-xs text-stone-400">FoodTrove Media · Keyword Attribution · MTD</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/analytics"
                className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-500 hover:border-stone-300 hover:text-stone-700 transition-all bg-white shadow-sm">
                Network Analytics ↗
              </Link>
              <Link href="/admin/measurement"
                className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-500 hover:border-stone-300 hover:text-stone-700 transition-all bg-white shadow-sm">
                Measurement ↗
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-stone-400">Loading contextual report…</div>
        </div>
      }>
        <ContextualReportClient />
      </Suspense>
    </div>
  );
}

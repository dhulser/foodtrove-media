import { Metadata } from "next";
import SalesDashboardClient from "./SalesDashboardClient";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sales Report — FoodTrove Media",
  description: "Revenue reporting and auction competition for FoodTrove retail media network",
};

export default function SalesReportPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-stone-400 hover:text-stone-600 transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <span className="h-4 w-px bg-stone-200" />
            <div className="flex items-center gap-2.5">
              <span className="text-lg">📊</span>
              <div>
                <p className="text-sm font-bold text-stone-900 leading-none">Sales Report</p>
                <p className="text-xs text-stone-400 leading-none mt-0.5">FoodTrove Media — Ad Network</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/campaigns"
              className="text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors"
            >
              Ad Ops Dashboard →
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SalesDashboardClient />
      </main>
    </div>
  );
}

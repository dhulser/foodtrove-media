import Link from "next/link";

// Redirect /admin → /admin/campaigns for direct navigation
// Also render a proper hub page for browser display
export const metadata = {
  title: "Admin Hub — FoodTrove Media",
  description: "FoodTrove Media internal operations dashboard",
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-emerald-600 rounded-xl">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">FoodTrove Media — Admin</h1>
              <p className="text-sm text-stone-400">Internal operations · Powered by Kevel Network 12024</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-widest mb-5">Dashboards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Campaign Dashboard */}
          <Link href="/admin/campaigns"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Campaign Dashboard</div>
                <div className="text-xs text-stone-400">Ad Ops</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Live campaign and flight status from Kevel. Real-time pacing, active advertisers, and
              creative health — for Ad Ops daily operations.
            </p>
            <div className="mt-4 text-xs font-medium text-emerald-600 group-hover:text-emerald-700">
              Open dashboard →
            </div>
          </Link>

          {/* Sales Reporting */}
          <Link href="/admin/sales"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Sales Reporting</div>
                <div className="text-xs text-stone-400">Revenue & Pipeline</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              CPM rates, estimated revenue, auction competition, and per-advertiser drill-down.
              Designed for Tyler's pipeline and renewal conversations.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs font-medium text-blue-600 group-hover:text-blue-700">
                Open report →
              </span>
              <a href="/admin/sales/print" target="_blank" rel="noopener"
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
                PDF export ↗
              </a>
            </div>
          </Link>

          {/* Flight Pacing — new */}
          <Link href="/admin/pacing"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-violet-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 group-hover:bg-violet-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Flight Pacing</div>
                <div className="text-xs text-stone-400">Ad Ops · Casey</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Real-time pacing health per flight — impression delivery rate vs. goal, days remaining,
              and spend-to-budget ratio. For Casey's daily pacing checks.
            </p>
            <div className="mt-4 text-xs font-medium text-violet-600 group-hover:text-violet-700">
              Open pacing →
            </div>
          </Link>

        </div>

        {/* Quick links */}
        <div className="mt-10 pt-8 border-t border-stone-200">
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-widest mb-4">Quick Links</h2>
          <div className="flex flex-wrap gap-3">
            <a href="https://app.kevel.co" target="_blank" rel="noopener"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-600 hover:border-stone-300 hover:text-stone-800 transition-all shadow-sm">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Kevel Console
            </a>
            <Link href="/api/health"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-600 hover:border-stone-300 hover:text-stone-800 transition-all shadow-sm">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Health Check
            </Link>
            <Link href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-600 hover:border-stone-300 hover:text-stone-800 transition-all shadow-sm">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Storefront
            </Link>
          </div>
        </div>

        {/* Network status */}
        <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-medium text-emerald-700">Kevel Network 12024 — Operational</span>
            <span className="text-xs text-emerald-500 ml-auto">3 active advertisers · FreshFarm / NutriPeak / GreenLeaf Farms</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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

          {/* Experiment Registry */}
          <Link href="/admin/experiments"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-orange-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Experiment Registry</div>
                <div className="text-xs text-stone-400">A/B Tests · Outcomes</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Active and completed A/B experiments — creative variants, contextual targeting tests,
              format allocation, and placement position comparisons.
            </p>
            <div className="mt-4 text-xs font-medium text-orange-600 group-hover:text-orange-700">
              Open registry →
            </div>
          </Link>

          {/* Network Analytics — new */}
          <Link href="/admin/analytics"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Network Analytics</div>
                <div className="text-xs text-stone-400">Executive Overview</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Fill rates, CPM competition, placement leaderboard, revenue run-rate, and 7-day
              delivery trend across all 3 formats. Single pane for network health.
            </p>
            <div className="mt-4 text-xs font-medium text-blue-600 group-hover:text-blue-700">
              Open analytics →
            </div>
          </Link>

          {/* Shopper Journey */}
          <Link href="/admin/shopper"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Shopper Journey</div>
                <div className="text-xs text-stone-400">Ad Exposure Map · Sales Demo</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Full funnel visualization — every ad touchpoint from homepage to post-purchase,
              with CPM, placement IDs, and estimated daily impressions. Tyler&rsquo;s pitch deck in a URL.
            </p>
            <div className="mt-4 text-xs font-medium text-purple-600 group-hover:text-purple-700">
              Open journey map →
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
              and spend-to-budget ratio. For Casey&rsquo;s daily pacing checks.
            </p>
            <div className="mt-4 text-xs font-medium text-violet-600 group-hover:text-violet-700">
              Open pacing →
            </div>
          </Link>

          {/* Inventory Forecast */}
          <Link href="/admin/inventory"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Inventory Forecast</div>
                <div className="text-xs text-stone-400">ATS · Pre-Sales Planning</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Available-to-sell capacity by format, CPM floor guidance, 30-day availability
              curve, and packaged inventory for RFP responses. Casey and Tyler&rsquo;s pre-sales tool.
            </p>
            <div className="mt-4 text-xs font-medium text-blue-600 group-hover:text-blue-700">
              Open forecast →
            </div>
          </Link>

          {/* Creative Preview — new */}
          <Link href="/admin/creatives"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-rose-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Creative Preview</div>
                <div className="text-xs text-stone-400">Ad Ops · Casey</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Live HTML creative preview for all 3 advertisers — rendered directly from Kevel.
              Filter by format, status, or advertiser. Inspect raw ScriptBody HTML inline.
            </p>
            <div className="mt-4 text-xs font-medium text-rose-600 group-hover:text-rose-700">
              Open creative preview →
            </div>
          </Link>

          {/* Auction Log — live bid stream */}
          <Link href="/admin/auction-log"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Auction Log</div>
                <div className="text-xs text-stone-400">Live Bid Stream</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Real-time record of every ad decision — which advertiser won, at what CPM, who they
              beat, and whether contextual targeting drove a premium. The auction in action.
            </p>
            <div className="mt-4 text-xs font-medium text-amber-600 group-hover:text-amber-700">
              Open auction log →
            </div>
          </Link>

          {/* Rate Card & Media Kit */}
          <Link href="/admin/rate-card"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Rate Card & Media Kit</div>
                <div className="text-xs text-stone-400">Sales · Tyler</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Ad format specs, CPM ranges, package deals, and audience profile for advertiser
              conversations. PDF-printable media kit.
            </p>
            <div className="mt-4 text-xs font-medium text-indigo-600 group-hover:text-indigo-700">
              Open rate card →
            </div>
          </Link>

          {/* Audience Segments */}
          <Link href="/admin/audiences"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-cyan-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 group-hover:bg-cyan-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Audience Segments</div>
                <div className="text-xs text-stone-400">Targeting · CPM Premium</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Shopper cohorts mapped to Kevel keyword targeting — organic buyers, premium fresh,
              health-conscious, and more. CPM premium by segment.
            </p>
            <div className="mt-4 text-xs font-medium text-cyan-600 group-hover:text-cyan-700">
              Open segments →
            </div>
          </Link>

          {/* Campaign Forecaster */}
          <Link href="/admin/forecast"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-sky-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 group-hover:bg-sky-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Campaign Forecaster</div>
                <div className="text-xs text-stone-400">Pre-Sale Reach Estimates</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Before booking: estimate impressions, unique reach, and eCPM for any budget + format
              combination. Factor in contextual keywords and audience segment CPM premiums.
            </p>
            <div className="mt-4 text-xs font-medium text-sky-600 group-hover:text-sky-700">
              Open forecaster →
            </div>
          </Link>

          {/* Measurement & Attribution */}
          <Link href="/admin/measurement"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-teal-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Measurement</div>
                <div className="text-xs text-stone-400">Attribution · 3P Verification</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              3P discrepancy tracking, revenue attribution waterfall (click-through / view-through /
              post-purchase), ROAS by advertiser, and attribution window config.
            </p>
            <div className="mt-4 text-xs font-medium text-teal-600 group-hover:text-teal-700">
              Open measurement →
            </div>
          </Link>

          {/* Flight Ops Alerts */}
          <Link href="/admin/alerts"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-red-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Flight Ops Alerts</div>
                <div className="text-xs text-stone-400">Ad Ops · Casey</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Real-time alert feed: fill rate drops, pacing anomalies, creative health flags, budget runway warnings.
              Severity-ranked with remediation actions. 5-minute refresh.
            </p>
            <div className="mt-4 text-xs font-medium text-red-600 group-hover:text-red-700">
              Open alerts →
            </div>
          </Link>

          {/* Ad Ops Workflow */}
          <Link href="/admin/ops"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-fuchsia-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-50 group-hover:bg-fuchsia-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Ad Ops Workflow</div>
                <div className="text-xs text-stone-400">Casey&apos;s Daily Queue</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Day-start action queue: pacing anomalies, creative approvals, budget runway warnings,
              discrepancy alerts, and flight lifecycle events — prioritized by urgency.
            </p>
            <div className="mt-4 text-xs font-medium text-fuchsia-600 group-hover:text-fuchsia-700">
              Open workflow →
            </div>
          </Link>

          {/* Billing & Invoicing */}
          <Link href="/admin/billing"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-green-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 group-hover:bg-green-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Billing & Invoicing</div>
                <div className="text-xs text-stone-400">Invoices · Make-Goods · Revenue</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Per-advertiser invoice reconciliation with delivery vs. booked impressions, make-good credits
              for under-delivering flights, and net revenue by billing period.
            </p>
            <div className="mt-4 text-xs font-medium text-green-600 group-hover:text-green-700">
              Open billing →
            </div>
          </Link>

          {/* Network Settings */}
          <Link href="/admin/settings"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Network Settings</div>
                <div className="text-xs text-stone-400">Kevel Config · Ad Density</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Live API health checks, environment variable status, ad density rules by page, and
              contextual keyword-to-flight routing map. Ops reference for Kai and Casey.
            </p>
            <div className="mt-4 text-xs font-medium text-slate-600 group-hover:text-slate-700">
              Open settings →
            </div>
          </Link>

          {/* Contextual Performance Report */}
          <Link href="/admin/reporting"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-violet-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 group-hover:bg-violet-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Contextual Performance</div>
                <div className="text-xs text-stone-400">Keyword Attribution · CPM Lift</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Keyword-level revenue attribution and contextual CPM lift vs. run-of-site.
              Shows which page contexts earn premium CPMs — Tyler&apos;s core sales narrative for new advertiser pitches.
            </p>
            <div className="mt-4 text-xs font-medium text-violet-600 group-hover:text-violet-700">
              Open report →
            </div>
          </Link>

          {/* Advertiser Portal */}
          <Link href="/admin/advertiser-portal"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-teal-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Advertiser Portal</div>
                <div className="text-xs text-stone-400">Self-serve · Campaign Insights</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Per-advertiser self-serve view: flight performance, ROAS, creative status, audience reach,
              and contextual targeting recommendations. All three active advertisers.
            </p>
            <div className="mt-4 text-xs font-medium text-teal-600 group-hover:text-teal-700">
              Open portal →
            </div>
          </Link>

          {/* Budget Pacing */}
          <Link href="/admin/budget-pacing"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-violet-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 group-hover:bg-violet-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Budget Pacing</div>
                <div className="text-xs text-stone-400">Spend projections · Tyler / Sales</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Per-flight spend trajectory: actual daily burn vs. required burn rate, end-of-flight
              projected total vs. contracted budget. At-risk flags for under- and over-delivery.
            </p>
            <div className="mt-4 text-xs font-medium text-violet-600 group-hover:text-violet-700">
              View projections →
            </div>
          </Link>

          {/* Competitive Intelligence */}
          <Link href="/admin/competitive"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Competitive Intelligence</div>
                <div className="text-xs text-stone-400">Share of voice · CPM benchmarks · Tyler / Sales</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Share of voice by advertiser, format-level win rate analysis, contextual competition map,
              and CPM benchmarks. Identifies gaps and pricing opportunities for Tyler&rsquo;s advertiser conversations.
            </p>
            <div className="mt-4 text-xs font-medium text-purple-600 group-hover:text-purple-700">
              Open analysis →
            </div>
          </Link>

          {/* Trafficking Console */}
          <Link href="/admin/trafficking"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Trafficking Console</div>
                <div className="text-xs text-stone-400">Activate · Pause · CPM · Keywords · Casey / Ad Ops</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Direct flight operations against Kevel Network 12024. Activate or pause flights, update
              CPMs, and modify keyword targeting — without leaving the dashboard.
            </p>
            <div className="mt-4 text-xs font-medium text-indigo-600 group-hover:text-indigo-700">
              Open console →
            </div>
          </Link>

          {/* Placement Yield Manager */}
          <Link href="/admin/placements"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-lime-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-lime-50 group-hover:bg-lime-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Placement Yield Manager</div>
                <div className="text-xs text-stone-400">Fill rate · CPM · Revenue by slot · Casey / Tyler</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Complete inventory map of every Kevel ad slot across the storefront. Fill rate, realized CPM,
              yield efficiency, and revenue per placement — with revenue upside callout for untargeted inventory.
            </p>
            <div className="mt-4 text-xs font-medium text-lime-600 group-hover:text-lime-700">
              Open yield manager →
            </div>
          </Link>

          {/* Pixel Manager */}
          <Link href="/admin/pixels"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-violet-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 group-hover:bg-violet-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Pixel Manager</div>
                <div className="text-xs text-stone-400">Conversion tags · Fire counts · Attribution · Casey / Sales</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Conversion pixel health per advertiser — fire counts (24h / 7d / 30d), last-fire timestamp,
              attribution window config, and tag snippet delivery. Confirm tracking before campaign launch.
            </p>
            <div className="mt-4 text-xs font-medium text-violet-600 group-hover:text-violet-700">
              Open pixel manager →
            </div>
          </Link>

          {/* Deal Desk */}
          <Link href="/admin/deal-desk"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Deal Desk</div>
                <div className="text-xs text-stone-400">IO management · Pipeline · Tyler / Sales</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Insertion order pipeline across all stages — prospect to live. IO line items with Kevel flight links,
              delivery progress, weighted pipeline value, and deal notes.
            </p>
            <div className="mt-4 text-xs font-medium text-blue-600 group-hover:text-blue-700">
              Open deal desk →
            </div>
          </Link>

          {/* Signal Intelligence */}
          <Link href="/admin/signals"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-cyan-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 group-hover:bg-cyan-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Signal Intelligence</div>
                <div className="text-xs text-stone-400">1P Data · Tyler / Casey</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Live shopper purchase signals: trending categories, intent keywords, sponsored influence rate,
              and advertiser targeting recommendations powered by FoodTrove 1P data. Tyler&apos;s pitch for new CPG brands.
            </p>
            <div className="mt-4 text-xs font-medium text-cyan-600 group-hover:text-cyan-700">
              View signals →
            </div>
          </Link>

          {/* Category & Shopper Insights */}
          <Link href="/admin/insights"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-teal-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Category &amp; Shopper Insights</div>
                <div className="text-xs text-stone-400">1P Data · Tyler / Sales</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Category performance, shopper segment profiles, basket co-purchase patterns, and purchase timing heatmaps.
              Tyler&apos;s pre-pitch data room — the 1P data story made concrete.
            </p>
            <div className="mt-4 text-xs font-medium text-teal-600 group-hover:text-teal-700">
              View insights →
            </div>
          </Link>

          {/* Multi-Touch Attribution */}
          <Link href="/admin/attribution"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Multi-Touch Attribution</div>
                <div className="text-xs text-stone-400">Journey paths · Model comparison · Casey / Tyler</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Full shopper journey from first impression to purchase. Compare first-touch, last-touch,
              linear, and time-decay models side-by-side. Latency distribution and cross-sell attribution.
            </p>
            <div className="mt-4 text-xs font-medium text-purple-600 group-hover:text-purple-700">
              View attribution →
            </div>
          </Link>

          {/* Advertiser Onboarding */}
          <Link href="/admin/onboarding"
            className="group bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-rose-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
                <svg className="h-5 w-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-stone-900">Advertiser Onboarding</div>
                <div className="text-xs text-stone-400">Self-serve setup · Kevel API · Tyler / Casey</div>
              </div>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              4-step wizard to onboard a new advertiser end-to-end — creates advertiser, campaign, flights,
              and auto-generated HTML creatives in Kevel via Management API. Live in 15–30 min.
            </p>
            <div className="mt-4 text-xs font-medium text-rose-600 group-hover:text-rose-700">
              Onboard new advertiser →
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
            <span className="text-xs text-emerald-500 ml-auto">3 active advertisers · Organic Valley / Liquid I.V. / Earthbound Farm · 30 admin tools</span>
          </div>
        </div>
      </div>
    </div>
  );
}

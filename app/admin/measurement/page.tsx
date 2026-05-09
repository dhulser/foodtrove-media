import MeasurementDashboardClient from "./MeasurementDashboardClient";

export const metadata = {
  title: "Measurement & Attribution — FoodTrove Media",
  description: "Impression attribution, 3P discrepancy tracking, and revenue waterfall for FoodTrove ad network",
};

export default function MeasurementPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-teal-600 rounded-xl">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Measurement &amp; Attribution</h1>
              <p className="text-sm text-stone-400">
                3P discrepancy · revenue attribution · conversion tracking · Kevel Network 12024
              </p>
            </div>
          </div>
        </div>

        {/* Section nav */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 text-sm border-t border-stone-100">
            {[
              { label: "Network Overview", href: "#network" },
              { label: "3P Discrepancy", href: "#discrepancy" },
              { label: "Attribution Waterfall", href: "#waterfall" },
              { label: "Advertiser Breakdown", href: "#advertisers" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="py-3 text-stone-500 hover:text-stone-800 transition-colors border-b-2 border-transparent hover:border-teal-500"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Policy callout */}
        <div className="mb-8 p-4 bg-teal-50 border border-teal-200 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-teal-800">
              <strong>Measurement integrity policy:</strong> FoodTrove Media maintains a maximum 5% discrepancy rate between 1P Kevel impressions
              and 3P verification counts. Attribution windows: click-through 30 days, view-through 1 day, post-purchase cross-sell 7 days.
              All advertiser reporting uses last-touch attribution with view-through credit (0.6× weight).
            </div>
          </div>
        </div>

        {/* Back nav */}
        <div className="mb-6">
          <a
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Admin Hub
          </a>
        </div>

        <MeasurementDashboardClient />
      </div>
    </div>
  );
}

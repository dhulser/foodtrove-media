import ForecastClient from "./ForecastClient";

export const metadata = {
  title: "Campaign Forecaster — FoodTrove Media",
  description: "Estimate reach, impressions, and spend for a proposed campaign before booking.",
};

export default function ForecastPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-sky-600 rounded-xl">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Campaign Forecaster</h1>
              <p className="text-sm text-stone-400">Reach & impression estimates before booking · Network 12024</p>
            </div>
            <div className="ml-auto">
              <a href="/admin" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
                ← Admin Hub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl mb-6">
          <p className="text-sm text-sky-800">
            <strong>How to use:</strong> Enter a budget, flight duration, and targeting parameters.
            The forecaster estimates impressions, unique reach, and effective CPM based on current
            auction clearing prices and available-to-sell inventory. Use this to set advertiser
            expectations before a campaign goes live.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <ForecastClient />
      </div>
    </div>
  );
}

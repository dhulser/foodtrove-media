import TraffickingClient from "./TraffickingClient";

export const metadata = {
  title: "Trafficking Console — FoodTrove Media",
  description: "Flight operations: activate, pause, update CPM and keywords for all Kevel flights",
};

export default function TraffickingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-xl">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Trafficking Console</h1>
                <p className="text-sm text-stone-400">Flight operations · FoodTrove Media · Kevel Network 12024</p>
              </div>
            </div>
            <a href="/admin" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
              ← Admin Hub
            </a>
          </div>
        </div>
      </div>

      <TraffickingClient />
    </div>
  );
}

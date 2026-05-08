import { Metadata } from "next";
import ExperimentsDashboardClient from "./ExperimentsDashboardClient";

export const metadata: Metadata = {
  title: "Experiment Registry — FoodTrove Admin",
  description: "A/B test registry: active experiments, metrics, and outcomes",
};

export default function ExperimentsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <a
                  href="/admin"
                  className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
                >
                  ← Admin
                </a>
              </div>
              <h1 className="text-xl font-bold text-stone-900">Experiment Registry</h1>
              <p className="text-sm text-stone-500 mt-0.5">
                A/B tests running on the FoodTrove ad network — Kevel flight-backed, documented outcomes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/admin/pacing"
                className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg bg-white text-stone-600 hover:border-stone-300 transition-all shadow-sm"
              >
                Pacing
              </a>
              <a
                href="/admin/campaigns"
                className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg bg-white text-stone-600 hover:border-stone-300 transition-all shadow-sm"
              >
                Campaigns
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <ExperimentsDashboardClient />
    </div>
  );
}

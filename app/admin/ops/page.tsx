import OpsWorkflowClient from "./OpsWorkflowClient";

export const metadata = {
  title: "Ad Ops Workflow — FoodTrove Media",
  description: "Casey's daily action queue: pacing, creative approvals, budget runway, discrepancies",
};

export default function OpsWorkflowPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-fuchsia-600 rounded-xl">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Ad Ops Workflow</h1>
                <p className="text-sm text-stone-400">Casey&apos;s day-start queue · FoodTrove Media</p>
              </div>
            </div>
            <a href="/admin" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
              ← Admin Hub
            </a>
          </div>
        </div>
      </div>

      <OpsWorkflowClient />
    </div>
  );
}

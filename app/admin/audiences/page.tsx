import { Suspense } from "react";
import AudiencesClient from "./AudiencesClient";

export const metadata = {
  title: "Audience Segments — FoodTrove Media",
  description: "Shopper cohort analysis, keyword targeting map, and CPM premium data for FoodTrove advertisers",
};

export default function AudiencesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-sm">Loading audience segments…</p>
        </div>
      </div>
    }>
      <AudiencesClient />
    </Suspense>
  );
}

import { Suspense } from "react";
import RateCardClient from "./RateCardClient";

export const metadata = {
  title: "Media Kit & Rate Card — FoodTrove Media",
  description: "Ad formats, CPMs, packages, and audience profile for FoodTrove Media advertisers",
};

export default function RateCardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-sm">Loading rate card…</p>
        </div>
      </div>
    }>
      <RateCardClient />
    </Suspense>
  );
}

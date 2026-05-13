import { Metadata } from "next";
import OnboardingClient from "./OnboardingClient";

export const metadata: Metadata = {
  title: "Advertiser Onboarding — FoodTrove Media Admin",
  description: "Self-serve advertiser campaign setup via Kevel Management API",
};

export default function OnboardingPage() {
  return <OnboardingClient />;
}

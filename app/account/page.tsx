/**
 * /account — Shopper account page
 *
 * Shows:
 *   - Profile section (demo data — no real auth)
 *   - Order history (reads from sessionStorage — persists within session)
 *   - Personalization ad placement (right rail mrec)
 *   - "Reorder" CTA for retail media attribution story
 *
 * This page is important for the retail media narrative:
 * logged-in shoppers represent the addressable audience that advertisers
 * want to reach. Order history = purchase intent signal.
 */
import type { Metadata } from "next";
import AccountClient from "./AccountClient";

export const metadata: Metadata = {
  title: "My Account — FoodTrove",
  description: "Your FoodTrove account, order history, and preferences.",
};

export default function AccountPage() {
  return <AccountClient />;
}

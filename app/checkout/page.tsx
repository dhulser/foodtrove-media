/**
 * /checkout — Checkout page
 *
 * Presents a two-column layout:
 *   Left: delivery & payment form (simulated — no real payment processing)
 *   Right: order summary pulled from cart state
 *
 * On submit, generates a synthetic order ID and navigates to /order/[orderId].
 * Cart is cleared on successful "order placement".
 *
 * Ad context: leaderboard above the fold to capture last-impression inventory.
 */
import type { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout — FoodTrove",
  description: "Complete your FoodTrove grocery order.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}

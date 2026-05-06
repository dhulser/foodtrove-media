/**
 * /cart — Full-page cart view
 *
 * Alternative to the cart drawer for:
 *   - Deep-linking to cart from email confirmations
 *   - Mobile experience where drawer may be cramped
 *   - SEO accessibility (cart content accessible without JS)
 *
 * Ad context: pre-checkout leaderboard + medium-rectangle cross-sell.
 */
import type { Metadata } from "next";
import CartPageClient from "./CartPageClient";

export const metadata: Metadata = {
  title: "Your Cart — FoodTrove",
  description: "Review your FoodTrove cart before checkout.",
};

export default function CartPage() {
  return <CartPageClient />;
}

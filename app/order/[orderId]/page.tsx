/**
 * /order/[orderId] — Order confirmation page
 *
 * Key retail media context: post-purchase state is prime ad real estate.
 * Shoppers who just bought are high-intent. Sponsored product cross-sells
 * here have strong purchase-intent signal.
 *
 * Page structure:
 *   - Order confirmation header (success state)
 *   - Order summary (items, pricing)
 *   - "You might also like" — featured products (eventually Kevel-decisioned)
 *   - Post-purchase ad placements: billboard + leaderboard
 *   - Delivery timeline
 */
import type { Metadata } from "next";
import OrderConfirmationClient from "./OrderConfirmationClient";

export const metadata: Metadata = {
  title: "Order Confirmed — FoodTrove",
  description: "Your FoodTrove order is confirmed and on its way.",
};

interface OrderPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { orderId } = await params;
  return <OrderConfirmationClient orderId={orderId} />;
}

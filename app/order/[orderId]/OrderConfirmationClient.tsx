"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/catalog";
import AdSlot from "@/components/AdSlot";

interface OrderItem {
  id: string;
  name: string;
  brand: string;
  unit: string;
  price: number;
  quantity: number;
  departmentIcon: string;
  departmentSlug: string;
}

interface OrderData {
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tipAmount: number;
  taxes: number;
  total: number;
  deliveryOption: "standard" | "express" | "scheduled";
  address: string;
  email: string;
  firstName: string;
  lastName: string;
  placedAt: string;
}

const DELIVERY_LABELS = {
  standard: { label: "Standard Delivery", eta: "Within 2 hours", icon: "🚗" },
  express: { label: "Express Delivery", eta: "Within 45 minutes", icon: "⚡" },
  scheduled: { label: "Scheduled Delivery", eta: "Your chosen time slot", icon: "📅" },
};

// Sponsored product from /api/sponsored-products
interface SponsoredProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  unit: string;
  rating: number;
  reviewCount: number;
  departmentSlug: string;
  departmentName: string;
  departmentIcon: string;
  inStock: boolean;
}

interface SponsoredProductsResponse {
  source: "kevel" | "fallback";
  sponsoredBy: string | null;
  advertiserId: number | null;
  products: SponsoredProduct[];
}

interface OrderConfirmationClientProps {
  orderId: string;
}

export default function OrderConfirmationClient({ orderId }: OrderConfirmationClientProps) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [crossSell, setCrossSell] = useState<SponsoredProductsResponse | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`order-${orderId}`);
      if (stored) {
        setOrder(JSON.parse(stored) as OrderData);
      }
    } catch {
      // Non-fatal — show generic confirmation
    }
    setLoading(false);
  }, [orderId]);

  /**
   * Purchase signal keywords for Kevel targeting.
   * Derived from the order's item categories and SKUs once order data loads.
   * Passed to post-purchase AdSlots so Kevel can serve complementary sponsored products.
   * Format: [...department slugs, ...sku-{id} strings]
   */
  const purchaseKeywords = useMemo<string[]>(() => {
    if (!order?.items?.length) return [];
    const categories = Array.from(new Set(order.items.map((item) => item.departmentSlug).filter(Boolean)));
    const skus = order.items.map((item) => `sku-${item.id}`);
    return [...categories, ...skus];
  }, [order]);

  // Fetch Kevel-decisioned sponsored products once we have purchase keywords
  useEffect(() => {
    if (!purchaseKeywords.length) return;
    const keywordsParam = purchaseKeywords.join(",");
    fetch(`/api/sponsored-products?keywords=${encodeURIComponent(keywordsParam)}&count=6`)
      .then((r) => r.json())
      .then((data: SponsoredProductsResponse) => setCrossSell(data))
      .catch(() => {
        // Non-fatal — cross-sell section stays hidden
      });
  }, [purchaseKeywords]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-400">Loading…</div>
      </div>
    );
  }

  const delivery = order
    ? DELIVERY_LABELS[order.deliveryOption] ?? DELIVERY_LABELS.standard
    : DELIVERY_LABELS.standard;

  const placedAt = order?.placedAt ? new Date(order.placedAt) : new Date();
  const etaDate = new Date(placedAt);
  if (order?.deliveryOption === "express") {
    etaDate.setMinutes(etaDate.getMinutes() + 45);
  } else {
    etaDate.setHours(etaDate.getHours() + 2);
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Confirmation hero */}
      <div className="bg-gradient-to-br from-emerald-700 to-teal-600 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold mb-2">
            {order ? `Thanks, ${order.firstName}!` : "Order Confirmed!"}
          </h1>
          <p className="text-emerald-100 text-lg">
            Your order is confirmed and being prepared.
          </p>
          <div className="mt-4 inline-block bg-white/10 border border-white/20 rounded-xl px-5 py-3">
            <p className="text-xs text-emerald-200 uppercase tracking-widest font-semibold mb-0.5">Order ID</p>
            <p className="text-lg font-mono font-bold">{orderId}</p>
          </div>
          {order?.email && (
            <p className="mt-4 text-sm text-emerald-200">
              Confirmation sent to <strong className="text-white">{order.email}</strong>
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Delivery status card */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-3xl">{delivery.icon}</span>
              <div>
                <p className="text-sm font-semibold text-stone-800">{delivery.label}</p>
                <p className="text-xs text-stone-400">{delivery.eta}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-400 uppercase tracking-wide font-medium">Estimated arrival</p>
              <p className="text-sm font-bold text-stone-800">
                {etaDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} today
              </p>
            </div>
          </div>

          {order?.address && (
            <div className="mt-4 pt-4 border-t border-stone-100 flex items-start gap-2.5">
              <svg className="h-4 w-4 text-stone-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-stone-600">{order.address}</p>
            </div>
          )}

          {/* Progress steps */}
          <div className="mt-5 pt-5 border-t border-stone-100">
            <div className="flex items-center">
              {[
                { label: "Order placed", done: true },
                { label: "Preparing", done: true },
                { label: "On the way", done: false },
                { label: "Delivered", done: false },
              ].map((s, i, arr) => (
                <div key={s.label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        s.done
                          ? "bg-emerald-500 text-white"
                          : "bg-stone-100 border-2 border-stone-200 text-stone-400"
                      }`}
                    >
                      {s.done ? "✓" : i + 1}
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1 text-center leading-tight">{s.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mb-4 mx-1 ${s.done && arr[i + 1].done ? "bg-emerald-400" : "bg-stone-200"}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order summary */}
        {order && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100">
              <h2 className="text-base font-bold text-stone-900">
                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
              </h2>
            </div>

            <ul className="divide-y divide-stone-50">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-6 py-3.5">
                  <span className="text-2xl shrink-0">{item.departmentIcon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">{item.name}</p>
                    <p className="text-xs text-stone-400">{item.brand} · {item.unit}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-stone-800">{formatPrice(item.price * item.quantity)}</p>
                    <p className="text-xs text-stone-400">Qty: {item.quantity}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 space-y-2">
              <div className="flex justify-between text-sm text-stone-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-stone-600">
                <span>Delivery fee</span>
                <span>{order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}</span>
              </div>
              {order.tipAmount > 0 && (
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Driver tip</span>
                  <span>{formatPrice(order.tipAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-stone-600">
                <span>Tax</span>
                <span>{formatPrice(order.taxes)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-stone-900 pt-2 border-t border-stone-200">
                <span>Total charged</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Post-purchase billboard — prime real estate */}
        <div>
          <p className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-3">Sponsored</p>
          <div className="flex justify-center">
            <AdSlot
              size="billboard"
              placementId="post-purchase-billboard"
              keywords={purchaseKeywords}
            />
          </div>
        </div>

        {/* Kevel-decisioned cross-sell — "Stock up on these too" */}
        {crossSell && crossSell.products.length > 0 && (
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xl font-bold text-stone-900">Stock up on these too</h2>
              <div className="flex items-center gap-2">
                {crossSell.source === "kevel" && crossSell.sponsoredBy && (
                  <span className="text-xs text-stone-400">
                    Sponsored by <strong className="text-stone-600">{crossSell.sponsoredBy}</strong>
                  </span>
                )}
                <span className="text-xs text-stone-400 bg-white border border-stone-100 px-2 py-1 rounded-full">
                  Sponsored
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {crossSell.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/shop/${product.departmentSlug}/${product.id}`}
                  className="bg-white rounded-xl border border-stone-100 shadow-sm p-3 hover:shadow-md hover:border-emerald-200 transition-all group"
                >
                  <div className="aspect-square rounded-lg bg-stone-50 flex items-center justify-center text-3xl mb-2 group-hover:bg-emerald-50 transition-colors">
                    {product.departmentIcon}
                  </div>
                  <p className="text-xs font-semibold text-stone-800 leading-tight line-clamp-2 mb-1">{product.name}</p>
                  <p className="text-xs text-stone-400">{product.brand}</p>
                  <p className="text-sm font-bold text-emerald-700 mt-1">{formatPrice(product.price)}</p>
                  <p className="text-[10px] text-stone-400">{product.unit}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Post-purchase leaderboard */}
        <div className="flex justify-center">
          <AdSlot
            size="leaderboard"
            placementId="post-purchase-leaderboard"
            keywords={purchaseKeywords}
          />
        </div>

        {/* CTA strip */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-800">
                Need to add anything?
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                Start a new order while you wait for delivery.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/shop"
                className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors whitespace-nowrap"
              >
                Shop Again
              </Link>
              <Link
                href="/deals"
                className="px-5 py-2.5 border border-stone-200 text-stone-700 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors whitespace-nowrap"
              >
                Today&apos;s Deals
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

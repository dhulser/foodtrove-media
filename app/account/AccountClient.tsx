"use client";

import { useEffect, useState } from "react";
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

interface StoredOrder {
  orderId: string;
  items: OrderItem[];
  total: number;
  deliveryOption: string;
  address: string;
  firstName: string;
  lastName: string;
  placedAt: string;
}

// Demo profile — in production this would come from auth
const DEMO_PROFILE = {
  name: "Alex Rivera",
  email: "alex.rivera@example.com",
  memberSince: "January 2024",
  tier: "FoodTrove+ Member",
  savedAddresses: ["123 Main St, New York, NY 10001"],
  preferences: ["Organic", "Gluten-Free", "Local Farms"],
};

const ACCOUNT_SECTIONS = [
  { icon: "📦", label: "Orders", href: "#orders" },
  { icon: "🏠", label: "Addresses", href: "#addresses" },
  { icon: "💳", label: "Payment methods", href: "#payment" },
  { icon: "🔔", label: "Notifications", href: "#notifications" },
  { icon: "🛒", label: "Shopping lists", href: "#lists" },
  { icon: "⚙️", label: "Settings", href: "#settings" },
];

export default function AccountClient() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);

  useEffect(() => {
    // Load orders from sessionStorage
    const found: StoredOrder[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith("order-")) {
        try {
          const data = JSON.parse(sessionStorage.getItem(key) ?? "") as StoredOrder;
          found.push(data);
        } catch {
          // Skip corrupt entries
        }
      }
    }
    // Sort newest first
    found.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
    setOrders(found);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Account header */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-xs text-stone-400 mb-4 flex items-center gap-1.5">
            <Link href="/" className="hover:text-emerald-600">Home</Link>
            <span>›</span>
            <span className="text-stone-600 font-medium">My Account</span>
          </nav>

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
              {DEMO_PROFILE.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">{DEMO_PROFILE.name}</h1>
              <p className="text-sm text-stone-500">{DEMO_PROFILE.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                ✦ {DEMO_PROFILE.tier}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8 items-start">
          {/* ── Left sidebar ──────────────────────────────────────────── */}
          <div className="hidden lg:block w-64 shrink-0 space-y-4">
            {/* Nav links */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <ul className="divide-y divide-stone-50">
                {ACCOUNT_SECTIONS.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      className="flex items-center gap-3 px-5 py-3.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-emerald-700 transition-colors"
                    >
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Member since */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-1">Member since</p>
              <p className="text-sm font-semibold text-stone-700">{DEMO_PROFILE.memberSince}</p>

              <div className="mt-4">
                <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-2">My preferences</p>
                <div className="flex flex-wrap gap-1.5">
                  {DEMO_PROFILE.preferences.map((pref) => (
                    <span
                      key={pref}
                      className="inline-block px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-full"
                    >
                      {pref}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar ad — personalized placement */}
            <AdSlot size="medium-rectangle" placementId="account-sidebar-mrec" />
          </div>

          {/* ── Main content ──────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Orders", value: orders.length || "—", icon: "📦" },
                { label: "Total spent", value: orders.length ? formatPrice(orders.reduce((a, o) => a + o.total, 0)) : "—", icon: "💰" },
                { label: "FT+ Rewards", value: "340 pts", icon: "⭐" },
                { label: "Next reward", value: "$5 off", icon: "🎁" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-stone-100 shadow-sm p-4 text-center">
                  <span className="text-2xl block mb-1">{stat.icon}</span>
                  <p className="text-lg font-bold text-stone-900">{stat.value}</p>
                  <p className="text-xs text-stone-400">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Leaderboard ad — account page top */}
            <div className="flex justify-center">
              <AdSlot size="leaderboard" placementId="account-top-leaderboard" />
            </div>

            {/* Order history */}
            <div id="orders">
              <h2 className="text-lg font-bold text-stone-900 mb-4">Order History</h2>

              {orders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-10 text-center">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-stone-600 font-medium">No orders yet</p>
                  <p className="text-sm text-stone-400 mt-1 mb-5">
                    Orders placed during this session will appear here.
                  </p>
                  <Link
                    href="/shop"
                    className="inline-block px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.orderId}
                      className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden"
                    >
                      {/* Order header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-stone-100 gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-stone-900 font-mono">{order.orderId}</p>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                              ✓ Delivered
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 mt-0.5">
                            {new Date(order.placedAt).toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold text-stone-900">{formatPrice(order.total)}</span>
                          <Link
                            href={`/order/${order.orderId}`}
                            className="px-3 py-1.5 border border-stone-200 text-stone-700 text-xs font-semibold rounded-lg hover:bg-stone-50 transition-colors"
                          >
                            View details
                          </Link>
                        </div>
                      </div>

                      {/* Items preview */}
                      <div className="px-5 py-3 flex items-center gap-3 overflow-x-auto">
                        {order.items.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            title={item.name}
                            className="shrink-0 w-10 h-10 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center text-xl"
                          >
                            {item.departmentIcon}
                          </div>
                        ))}
                        {order.items.length > 5 && (
                          <span className="shrink-0 text-xs text-stone-400 font-medium">
                            +{order.items.length - 5} more
                          </span>
                        )}
                        <div className="ml-auto shrink-0">
                          <button className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 whitespace-nowrap">
                            Reorder →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved addresses */}
            <div id="addresses">
              <h2 className="text-lg font-bold text-stone-900 mb-4">Saved Addresses</h2>
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
                {DEMO_PROFILE.savedAddresses.map((addr, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-4 border-b border-stone-50 last:border-0">
                    <span className="text-stone-400 mt-0.5">🏠</span>
                    <div className="flex-1">
                      <p className="text-sm text-stone-700">{addr}</p>
                      <span className="text-xs text-emerald-600 font-medium">Default</span>
                    </div>
                    <button className="text-xs text-stone-400 hover:text-stone-600 transition-colors">Edit</button>
                  </div>
                ))}
                <div className="px-5 py-3">
                  <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700 transition-colors">
                    + Add address
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom leaderboard */}
            <div className="flex justify-center pt-4">
              <AdSlot size="leaderboard" placementId="account-bottom-leaderboard" />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

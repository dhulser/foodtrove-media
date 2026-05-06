/**
 * NavClient — cart icon + drawer, wired to cart state.
 * Separated from Nav (server component) so the server component can pass
 * departments without needing "use client" itself.
 */
"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import CartDrawer from "@/components/CartDrawer";

export default function NavClient() {
  const { totalItems } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <a
        href="/account"
        className="text-stone-500 hover:text-emerald-700 transition-colors hidden sm:block"
        aria-label="My Account"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </a>

      <button
        onClick={() => setCartOpen(true)}
        className="relative text-stone-500 hover:text-emerald-700 transition-colors"
        aria-label={`Cart${totalItems > 0 ? ` — ${totalItems} item${totalItems === 1 ? "" : "s"}` : ""}`}
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </button>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

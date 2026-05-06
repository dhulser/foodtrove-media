/**
 * CartDrawer — slide-in cart panel.
 *
 * Opens when user clicks the cart icon in the Nav.
 * Shows items, quantities, subtotal, and a checkout CTA (stub — no real checkout).
 */
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";
import QuantityControl from "@/components/QuantityControl";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, subtotal, removeItem, clearCart } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="text-lg font-bold text-stone-900">
            Your Cart
            {items.length > 0 && (
              <span className="ml-2 text-sm font-normal text-stone-400">
                ({items.reduce((a, i) => a + i.quantity, 0)} items)
              </span>
            )}
          </h2>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-stone-400 hover:text-red-500 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
              aria-label="Close cart"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
              <div className="text-5xl">🛒</div>
              <p className="text-stone-600 font-medium">Your cart is empty</p>
              <p className="text-sm text-stone-400">Add items from the shop to get started.</p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-full hover:bg-emerald-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {items.map(({ product, department, quantity }) => (
                <li key={product.id} className="flex gap-4 px-5 py-4">
                  {/* Emoji icon — no real images in MVP */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center text-2xl">
                    {department.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-400 font-medium truncate">{product.brand}</p>
                    <p className="text-sm font-semibold text-stone-800 leading-snug line-clamp-2">
                      {product.name}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">{product.unit}</p>
                    <div className="flex items-center justify-between mt-2">
                      <QuantityControl productId={product.id} />
                      <span className="text-sm font-bold text-stone-900">
                        {formatPrice(product.price * quantity)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(product.id)}
                    className="flex-shrink-0 self-start p-1 text-stone-300 hover:text-red-400 transition-colors"
                    aria-label={`Remove ${product.name}`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer — subtotal + checkout */}
        {items.length > 0 && (
          <div className="border-t border-stone-100 px-5 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">Subtotal</span>
              <span className="text-lg font-bold text-stone-900">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-stone-400">Delivery and taxes calculated at checkout.</p>
            <Link
              href="/checkout"
              onClick={onClose}
              className="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 text-center"
            >
              Proceed to Checkout · {formatPrice(subtotal)}
            </Link>
            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm text-stone-600 hover:text-stone-900 font-medium transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}

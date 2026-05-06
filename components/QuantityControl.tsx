/**
 * QuantityControl — +/- buttons for adjusting cart item quantity.
 * Client component — reads and writes cart state via useCart hook.
 *
 * Props:
 *   productId — the product to control
 *   compact   — smaller size variant for use in order summaries
 */
"use client";

import { useCart } from "@/lib/cart";

interface QuantityControlProps {
  productId: string;
  /** Compact mode — smaller buttons for sidebars / order summary panels */
  compact?: boolean;
}

export default function QuantityControl({ productId, compact = false }: QuantityControlProps) {
  const { getQuantity, setQuantity } = useCart();
  const quantity = getQuantity(productId);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setQuantity(productId, quantity - 1)}
          className="w-5 h-5 rounded border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 active:scale-95 transition-all text-xs font-bold"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="w-4 text-center text-xs font-semibold text-stone-700">{quantity}</span>
        <button
          onClick={() => setQuantity(productId, quantity + 1)}
          className="w-5 h-5 rounded border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 active:scale-95 transition-all text-xs font-bold"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => setQuantity(productId, quantity - 1)}
        className="w-6 h-6 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 hover:border-stone-300 active:scale-95 transition-all text-sm font-bold"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="w-5 text-center text-sm font-semibold text-stone-800">{quantity}</span>
      <button
        onClick={() => setQuantity(productId, quantity + 1)}
        className="w-6 h-6 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 hover:border-stone-300 active:scale-95 transition-all text-sm font-bold"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

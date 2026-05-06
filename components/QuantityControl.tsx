/**
 * QuantityControl — +/- buttons for adjusting cart item quantity.
 * Client component — reads and writes cart state via useCart hook.
 */
"use client";

import { useCart } from "@/lib/cart";

interface QuantityControlProps {
  productId: string;
}

export default function QuantityControl({ productId }: QuantityControlProps) {
  const { getQuantity, setQuantity } = useCart();
  const quantity = getQuantity(productId);

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

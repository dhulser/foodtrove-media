"use client";

/**
 * AddToCartButton — adds a product to the cart.
 * Requires CartProvider to be present in the tree.
 *
 * Usage:
 *   <AddToCartButton product={product} department={department} />
 *   <AddToCartButton product={product} department={department} fullSize />
 */
import { useCart } from "@/lib/cart";
import type { Product, Department } from "@/lib/types";

interface AddToCartButtonProps {
  product: Product;
  department: Department;
  fullSize?: boolean;
  disabled?: boolean;
}

export default function AddToCartButton({
  product,
  department,
  fullSize = false,
  disabled = false,
}: AddToCartButtonProps) {
  const { addItem, getQuantity } = useCart();
  const inCart = getQuantity(product.id) > 0;

  return (
    <button
      className={`font-semibold text-white rounded-xl hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 ${
        inCart ? "bg-emerald-700 ring-2 ring-emerald-300" : "bg-emerald-600"
      } ${
        fullSize
          ? "flex-1 sm:flex-initial px-8 py-3 text-base shadow-sm"
          : "px-3 py-1.5 text-xs rounded-lg"
      }`}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product, department);
      }}
      aria-label={`Add ${product.name} to cart`}
    >
      {inCart ? (fullSize ? "Added ✓" : "Added") : (fullSize ? "Add to Cart" : "Add")}
    </button>
  );
}

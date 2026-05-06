"use client";

/**
 * Browse-only add-to-cart button.
 * Client component — event handlers are valid here.
 * MVP: no actual cart logic — visual affordance only.
 */
interface AddToCartButtonProps {
  fullSize?: boolean;
  disabled?: boolean;
}

export default function AddToCartButton({ fullSize = false, disabled = false }: AddToCartButtonProps) {
  return (
    <button
      className={`font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 ${
        fullSize
          ? "flex-1 sm:flex-initial px-8 py-3 text-base shadow-sm"
          : "px-3 py-1.5 text-xs rounded-lg"
      }`}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        // TODO: wire up cart state when checkout scope is added
      }}
    >
      {fullSize ? "Add to Cart" : "Add"}
    </button>
  );
}

"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice, getFeaturedProducts } from "@/lib/catalog";
import QuantityControl from "@/components/QuantityControl";
import ProductCard from "@/components/ProductCard";
import AdSlot from "@/components/AdSlot";
import ProductImage from "@/components/ProductImage";

// Cross-sell recommendations — would be Kevel-decisioned in production
const suggestions = getFeaturedProducts(4);

export default function CartPageClient() {
  const { items, subtotal, removeItem, clearCart } = useCart();

  const estimatedTax = subtotal * 0.08875;
  const deliveryFee = subtotal >= 50 ? 0 : 4.99; // Free delivery over $50
  const total = subtotal + estimatedTax + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <nav className="text-xs text-stone-400 mb-8 flex items-center gap-1.5">
            <Link href="/" className="hover:text-emerald-600">Home</Link>
            <span>›</span>
            <span className="text-stone-600 font-medium">Cart</span>
          </nav>

          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-2xl font-bold text-stone-900 mb-2">Your cart is empty</h1>
            <p className="text-stone-500 text-sm mb-8 max-w-sm mx-auto">
              Add products to your cart to get started. Free delivery on orders over $50.
            </p>
            <Link
              href="/shop"
              className="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>

          {/* Cross-sell even on empty cart */}
          <div className="mt-12">
            <h2 className="text-lg font-bold text-stone-800 mb-5">Popular right now</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {suggestions.map(({ product, department }) => (
                <ProductCard key={product.id} product={product} department={department} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-stone-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-emerald-600">Home</Link>
          <span>›</span>
          <span className="text-stone-600 font-medium">Cart</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-stone-900">
            Your Cart
            <span className="ml-2 text-sm font-normal text-stone-400">
              ({items.reduce((a, i) => a + i.quantity, 0)} items)
            </span>
          </h1>
          <button
            onClick={clearCart}
            className="text-xs text-stone-400 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        </div>

        {/* Free delivery banner */}
        {subtotal < 50 && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
            <span className="text-emerald-600 text-lg">🚚</span>
            <p className="text-sm text-emerald-800">
              Add <strong>{formatPrice(50 - subtotal)}</strong> more to get free delivery!
            </p>
            <div className="ml-auto flex-1 max-w-32 bg-emerald-200 rounded-full h-1.5">
              <div
                className="bg-emerald-500 rounded-full h-1.5 transition-all"
                style={{ width: `${Math.min((subtotal / 50) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {subtotal >= 50 && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
            <span className="text-emerald-600 text-lg">✅</span>
            <p className="text-sm text-emerald-800 font-semibold">
              You qualify for free delivery!
            </p>
          </div>
        )}

        {/* Top leaderboard */}
        <div className="mb-6 flex justify-center">
          <AdSlot size="leaderboard" placementId="cart-top-leaderboard" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Cart items ────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <ul className="divide-y divide-stone-50">
                {items.map(({ product, department, quantity }) => (
                  <li key={product.id} className="flex gap-4 p-5">
                    {/* Product image */}
                    <Link
                      href={`/shop/${department.slug}/${product.id}`}
                      className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-stone-50 border border-stone-100"
                    >
                      <ProductImage
                        productId={product.id}
                        productName={product.name}
                        brandName={product.brand}
                        departmentIcon={department.icon}
                        departmentColor={department.id}
                        size="card"
                        className="w-full h-full"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">{product.brand}</p>
                      <Link href={`/shop/${department.slug}/${product.id}`}>
                        <h3 className="text-sm font-semibold text-stone-800 hover:text-emerald-700 transition-colors leading-snug line-clamp-2 mt-0.5">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-stone-400 mt-0.5">{product.unit}</p>

                      <div className="flex items-center justify-between mt-3">
                        <QuantityControl productId={product.id} />
                        <div className="text-right">
                          <p className="text-base font-bold text-stone-900">
                            {formatPrice(product.price * quantity)}
                          </p>
                          {quantity > 1 && (
                            <p className="text-xs text-stone-400">{formatPrice(product.price)} each</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(product.id)}
                      className="shrink-0 self-start p-1.5 text-stone-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                      aria-label={`Remove ${product.name}`}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* "You may also need" — cross-sell */}
            <div className="mt-8">
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="text-base font-bold text-stone-900">You may also need</h2>
                <span className="text-xs text-stone-400">Sponsored</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {suggestions.map(({ product, department }) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    department={department}
                    showSponsoredBadge={true}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Order summary sidebar ─────────────────────────────────── */}
          <div className="lg:w-[360px] shrink-0">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm sticky top-24">
              <div className="p-5 border-b border-stone-100">
                <h2 className="text-base font-bold text-stone-900">Order Summary</h2>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} items)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Delivery fee</span>
                  <span className={deliveryFee === 0 ? "text-emerald-600 font-semibold" : ""}>
                    {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Estimated tax</span>
                  <span>{formatPrice(estimatedTax)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-stone-900 pt-3 border-t border-stone-100">
                  <span>Estimated total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="px-5 pb-5 space-y-3">
                <Link
                  href="/checkout"
                  className="block w-full py-4 bg-emerald-600 text-white font-bold text-center rounded-xl hover:bg-emerald-700 active:scale-[0.99] transition-all shadow-sm"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  href="/shop"
                  className="block w-full py-2.5 text-sm text-stone-600 hover:text-stone-900 font-medium text-center transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>

              {/* Cart sidebar mrec */}
              <div className="px-5 pb-5">
                <AdSlot size="medium-rectangle" placementId="cart-sidebar-mrec" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

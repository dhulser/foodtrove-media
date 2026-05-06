import type { Metadata } from "next";
import Link from "next/link";
import { getDealsProducts, formatPrice } from "@/lib/catalog";
import type { DealProduct } from "@/lib/catalog";
import AdSlot from "@/components/AdSlot";
import ProductImage from "@/components/ProductImage";
import AddToCartButton from "@/components/AddToCartButton";

export const metadata: Metadata = {
  title: "Weekly Deals — FoodTrove",
  description:
    "Big savings on groceries, produce, snacks, beverages, and more. Limited-time deals updated weekly.",
};

function DealCard({ deal }: { deal: DealProduct }) {
  const { product, department, discountPct, originalPrice, salePrice, badgeLabel } = deal;

  return (
    <div className="group relative bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all overflow-hidden flex flex-col">
      {/* Discount ribbon */}
      <div className="absolute top-3 left-3 z-10">
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-sm">
          {discountPct}% OFF
        </span>
      </div>

      {/* Badge label */}
      <div className="absolute top-3 right-3 z-10">
        <span className="inline-block px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-semibold rounded-full">
          {badgeLabel}
        </span>
      </div>

      {/* Product image */}
      <Link href={`/shop/${department.slug}/${product.id}`} className="block">
        <div className="aspect-square bg-stone-50 overflow-hidden">
          <ProductImage
            productId={product.id}
            productName={product.name}
            brandName={product.brand}
            departmentIcon={department.icon}
            departmentColor={department.id}
            size="card"
            className="w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Department badge */}
        <Link
          href={`/shop/${department.slug}`}
          className="text-[10px] font-medium text-stone-400 uppercase tracking-wide hover:text-emerald-600 transition-colors"
        >
          {department.icon} {department.name}
        </Link>

        {/* Product name */}
        <Link href={`/shop/${department.slug}/${product.id}`} className="flex-1">
          <h3 className="text-sm font-semibold text-stone-800 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2">
            {product.name}
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">{product.brand}</p>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`text-xs ${i < Math.round(product.rating) ? "text-amber-400" : "text-stone-200"}`}
            >
              ★
            </span>
          ))}
          <span className="text-[10px] text-stone-400 ml-0.5">
            ({product.reviewCount.toLocaleString()})
          </span>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-lg font-extrabold text-red-600">{formatPrice(salePrice)}</span>
          <span className="text-sm text-stone-400 line-through">{formatPrice(originalPrice)}</span>
          <span className="text-xs font-semibold text-emerald-600 ml-auto">
            Save {formatPrice(originalPrice - salePrice)}
          </span>
        </div>

        {/* Add to cart */}
        <div className="mt-2">
          <AddToCartButton product={product} department={department} fullSize={false} disabled={!product.inStock} />
        </div>
      </div>
    </div>
  );
}

export default function DealsPage() {
  const deals = getDealsProducts(16);

  // Split: top 4 as "featured", rest as grid
  const featuredDeals = deals.slice(0, 4);
  const gridDeals = deals.slice(4);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-red-200 text-sm font-semibold uppercase tracking-widest mb-2">
                💥 Limited time savings
              </p>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                Weekly Deals
              </h1>
              <p className="text-red-100 mt-3 text-lg max-w-lg">
                Up to 30% off groceries, produce, snacks, and more. New deals every week — stock up while they last.
              </p>
            </div>

            <div className="flex gap-4 text-center">
              {[
                { label: "Deals available", value: deals.length.toString() },
                { label: "Max savings", value: "30% off" },
                { label: "Departments", value: "8" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur rounded-xl px-5 py-4 min-w-[80px]">
                  <p className="text-2xl font-extrabold">{stat.value}</p>
                  <p className="text-xs text-red-200 mt-0.5 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard ad above content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-center">
        <AdSlot size="leaderboard" placementId="deals-top-leaderboard" />
      </div>

      {/* Billboard ad — full width treatment */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 flex justify-center">
        <AdSlot size="billboard" placementId="deals-hero-billboard" />
      </div>

      {/* Featured deals — 4-up highlight strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            🔥 Top Picks Today
          </h2>
          <span className="text-xs text-stone-400 bg-white border border-stone-100 px-3 py-1 rounded-full">
            Refreshed weekly
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featuredDeals.map((deal) => (
            <DealCard key={deal.product.id} deal={deal} />
          ))}
        </div>
      </section>

      {/* Mid-page leaderboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 flex justify-center">
        <AdSlot size="leaderboard" placementId="deals-mid-leaderboard" />
      </div>

      {/* Deals grid — remaining products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-baseline gap-3 mb-6">
          <h2 className="text-xl font-bold text-stone-800">All Deals</h2>
          <span className="text-sm text-stone-400">{gridDeals.length} more deals</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {gridDeals.map((deal, index) => (
            <div key={deal.product.id}>
              <DealCard deal={deal} />
              {/* Inline leaderboard every 6 items */}
              {(index + 1) % 6 === 0 && (
                <div className="col-span-full my-4" style={{ display: "none" }}>
                  {/* Placeholder for future inline ad unit */}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Category shortcuts */}
      <section className="bg-white border-t border-stone-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-stone-800 mb-5">Shop by Department</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { icon: "🥦", label: "Produce", slug: "produce" },
              { icon: "🥛", label: "Dairy & Eggs", slug: "dairy" },
              { icon: "🍞", label: "Bakery", slug: "bakery" },
              { icon: "🍿", label: "Snacks", slug: "snacks" },
              { icon: "☕", label: "Beverages", slug: "beverages" },
              { icon: "🥩", label: "Meat & Seafood", slug: "meat-seafood" },
              { icon: "🧊", label: "Frozen", slug: "frozen" },
              { icon: "🧹", label: "Household", slug: "household" },
            ].map((dept) => (
              <Link
                key={dept.slug}
                href={`/shop/${dept.slug}`}
                className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-200 rounded-full text-sm font-medium text-stone-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all"
              >
                <span>{dept.icon}</span>
                <span>{dept.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

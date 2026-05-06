import Link from "next/link";
import { getAllDepartments, getFeaturedProducts, formatPrice } from "@/lib/catalog";
import AdSlot from "@/components/AdSlot";
import ProductCard from "@/components/ProductCard";

export default function HomePage() {
  const departments = getAllDepartments();
  const featuredProducts = getFeaturedProducts(12);

  return (
    <div className="min-h-screen">
      {/* Hero billboard ad slot */}
      <div className="w-full bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-center">
          <AdSlot size="billboard" placementId="home-hero-billboard" />
        </div>
      </div>

      {/* Hero section */}
      <section className="relative bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <p className="text-emerald-200 text-sm font-medium uppercase tracking-widest mb-3">
              Now open in your neighborhood
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Fresh groceries,<br />
              <span className="text-emerald-300">delivered fast.</span>
            </h1>
            <p className="text-lg text-emerald-100 leading-relaxed mb-8 max-w-lg">
              Shop thousands of products from local farms and top brands.
              Organic, conventional, or specialty — we have what your family needs.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop/produce"
                className="px-6 py-3 bg-white text-emerald-800 font-semibold rounded-full hover:bg-emerald-50 transition-colors shadow-md"
              >
                Shop Produce
              </Link>
              <Link
                href="/shop"
                className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-full border border-emerald-400 hover:bg-emerald-500 transition-colors"
              >
                Browse All
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Department grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">Shop by Department</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {departments.map((dept) => (
            <Link
              key={dept.id}
              href={`/shop/${dept.slug}`}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-stone-100 shadow-sm hover:shadow-md hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
            >
              <span className="text-3xl">{dept.icon}</span>
              <div>
                <p className="text-sm font-semibold text-stone-800 group-hover:text-emerald-700 transition-colors">
                  {dept.name}
                </p>
                <p className="text-xs text-stone-400">
                  {dept.products.length} items
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Leaderboard ad slot */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center mb-8">
        <AdSlot size="leaderboard" placementId="home-mid-leaderboard" />
      </div>

      {/* Featured / Sponsored products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-bold text-stone-800">Featured Products</h2>
          <Link href="/shop" className="text-sm text-emerald-600 font-medium hover:text-emerald-700">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {featuredProducts.map(({ product, department }) => (
            <ProductCard
              key={product.id}
              product={product}
              department={department}
              showSponsoredBadge={false}
            />
          ))}
        </div>
      </section>

      {/* Value props banner */}
      <section className="bg-white border-t border-stone-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: "🚀", title: "Same-Day Delivery", desc: "Order by 2pm" },
              { icon: "🌱", title: "Organic Options", desc: "Certified fresh" },
              { icon: "💯", title: "Quality Guaranteed", desc: "Or we'll replace it" },
              { icon: "🛒", title: "10,000+ Products", desc: "Everything you need" },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-2">
                <span className="text-3xl">{item.icon}</span>
                <p className="text-sm font-semibold text-stone-800">{item.title}</p>
                <p className="text-xs text-stone-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

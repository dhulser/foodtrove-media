import type { Metadata } from "next";
import Link from "next/link";
import { searchProducts } from "@/lib/catalog";
import AdSlot from "@/components/AdSlot";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  return {
    title: query
      ? `"${query}" — Search Results — FoodTrove`
      : "Search — FoodTrove",
    description: query
      ? `Search results for "${query}" at FoodTrove.`
      : "Search thousands of grocery products at FoodTrove.",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? searchProducts(query) : [];

  return (
    <div className="min-h-screen">
      {/* Search header */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Mobile search bar — desktop is in Nav */}
          <div className="md:hidden mb-4">
            <SearchBar defaultValue={query} />
          </div>

          {query ? (
            <div>
              <h1 className="text-2xl font-bold text-stone-900">
                {results.length > 0
                  ? `${results.length} result${results.length === 1 ? "" : "s"} for `
                  : `No results for `}
                <span className="text-emerald-700">"{query}"</span>
              </h1>
              {results.length === 0 && (
                <p className="text-stone-500 mt-1 text-sm">
                  Try a different search term, or browse by department below.
                </p>
              )}
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Search</h1>
              <p className="text-stone-500 mt-1 text-sm">
                Search thousands of grocery products.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top ad slot */}
        {query && results.length > 0 && (
          <div className="mb-8 flex justify-center">
            <AdSlot size="leaderboard" placementId="search-top-leaderboard" />
          </div>
        )}

        {results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.map(({ product, department }, index) => (
              <div key={product.id}>
                <ProductCard
                  product={product}
                  department={department}
                  showSponsoredBadge={product.sponsored}
                />
                {/* Mid-page ad unit every 12 products */}
                {(index + 1) % 12 === 0 && index + 1 < results.length && (
                  <div className="col-span-full" />
                )}
              </div>
            ))}
          </div>
        ) : query ? (
          /* No results — show department browse fallback */
          <NoResultsFallback query={query} />
        ) : (
          /* Empty query — show search prompt */
          <SearchPrompt />
        )}

        {/* Bottom ad slot */}
        {query && results.length > 0 && (
          <div className="mt-12 flex justify-center">
            <AdSlot size="leaderboard" placementId="search-bottom-leaderboard" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function NoResultsFallback({ query }: { query: string }) {
  const suggestions = [
    { label: "Produce", href: "/shop/produce", icon: "🥦" },
    { label: "Dairy", href: "/shop/dairy", icon: "🥛" },
    { label: "Bakery", href: "/shop/bakery", icon: "🍞" },
    { label: "Snacks", href: "/shop/snacks", icon: "🍿" },
    { label: "Beverages", href: "/shop/beverages", icon: "🥤" },
    { label: "Meat & Seafood", href: "/shop/meat-seafood", icon: "🥩" },
    { label: "Frozen", href: "/shop/frozen", icon: "🧊" },
    { label: "Household", href: "/shop/household", icon: "🏠" },
  ];

  return (
    <div className="py-8">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-stone-600 font-medium text-lg">
          No products matched "{query}"
        </p>
        <p className="text-stone-400 mt-1 text-sm">
          Try searching for something like "organic milk", "chicken breast", or "chips".
        </p>
      </div>

      <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
        Browse by Department
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {suggestions.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-stone-100 shadow-sm hover:shadow-md hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
          >
            <span className="text-2xl">{s.icon}</span>
            <span className="text-sm font-semibold text-stone-700 group-hover:text-emerald-700 transition-colors">
              {s.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SearchPrompt() {
  const popular = [
    "organic milk",
    "chicken breast",
    "sourdough bread",
    "greek yogurt",
    "sparkling water",
    "frozen pizza",
    "potato chips",
    "olive oil",
  ];

  return (
    <div className="py-12 text-center">
      <div className="text-6xl mb-6">🛒</div>
      <h2 className="text-xl font-bold text-stone-800 mb-2">
        What are you looking for?
      </h2>
      <p className="text-stone-500 text-sm mb-8">
        Search thousands of products across all departments.
      </p>
      <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
        {popular.map((term) => (
          <Link
            key={term}
            href={`/search?q=${encodeURIComponent(term)}`}
            className="px-3 py-1.5 text-sm text-stone-600 bg-stone-100 rounded-full hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
          >
            {term}
          </Link>
        ))}
      </div>
    </div>
  );
}

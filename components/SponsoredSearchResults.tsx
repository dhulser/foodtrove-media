"use client";

/**
 * SponsoredSearchResults — Client component
 *
 * Fetches Kevel-decisioned sponsored products for the search query
 * and renders them as a "Sponsored" shelf above the organic results.
 *
 * Runs client-side so SSR search results are never blocked.
 * If Kevel returns no fill (no credentials, no matching flights, low inventory),
 * this component renders nothing — organic results aren't affected.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product, Department } from "@/lib/types";

interface SponsoredProduct {
  product: Product;
  department: Department;
}

interface SponsoredSearchResponse {
  products: SponsoredProduct[];
  sponsoredBy: string | null;
  advertiserId: number | null;
  source: "kevel" | "static";
  impressionUrl: string | null;
}

interface SponsoredSearchResultsProps {
  query: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export default function SponsoredSearchResults({
  query,
}: SponsoredSearchResultsProps) {
  const [data, setData] = useState<SponsoredSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query.trim()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setData(null);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000); // 3s max

    fetch("/api/sponsored-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, count: 4 }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((json: SponsoredSearchResponse) => {
        setData(json);
        // Fire impression pixel if we got a fill
        if (json.source === "kevel" && json.impressionUrl) {
          fetch(json.impressionUrl, { mode: "no-cors" }).catch(() => {});
        }
      })
      .catch(() => {
        // Timeout or network error — just show nothing
        setData(null);
      })
      .finally(() => {
        clearTimeout(timer);
        setLoading(false);
      });

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Loading: show a subtle skeleton placeholder while we wait on Kevel
  if (loading) {
    return (
      <div className="mb-8 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-3 w-24 bg-stone-200 rounded" />
          <div className="h-3 w-32 bg-stone-100 rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 bg-stone-100 rounded-xl border border-stone-100"
            />
          ))}
        </div>
      </div>
    );
  }

  // No fill or static — render nothing
  if (!data || !data.sponsoredBy || data.products.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
            Sponsored Results
          </span>
          <span className="text-xs text-stone-300">·</span>
          <span className="text-xs text-stone-400 font-medium">
            {data.sponsoredBy}
          </span>
        </div>
        <span className="text-[10px] text-stone-300 font-medium uppercase tracking-wider">
          Ad
        </span>
      </div>

      {/* Sponsored product shelf */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-amber-50/60 rounded-2xl border border-amber-100">
        {data.products.map(({ product, department }) => (
          <Link
            key={product.id}
            href={`/shop/${department.slug}/${product.id}`}
            className="group bg-white rounded-xl border border-stone-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all overflow-hidden"
          >
            {/* Product color swatch (consistent with ProductImage approach) */}
            <div
              className="h-24 flex items-center justify-center"
              style={{
                backgroundColor: `hsl(${(product.id.charCodeAt(0) * 37 + product.id.charCodeAt(Math.min(2, product.id.length - 1)) * 13) % 360}, 45%, 92%)`,
              }}
            >
              <span className="text-3xl select-none">
                {department.id === "produce"
                  ? "🥦"
                  : department.id === "dairy"
                  ? "🥛"
                  : department.id === "bakery"
                  ? "🍞"
                  : department.id === "snacks"
                  ? "🍿"
                  : department.id === "beverages"
                  ? "🥤"
                  : department.id === "meat-seafood"
                  ? "🥩"
                  : department.id === "frozen"
                  ? "🧊"
                  : "🏠"}
              </span>
            </div>

            <div className="p-2.5">
              <p className="text-xs font-semibold text-stone-800 leading-tight line-clamp-2 group-hover:text-emerald-700 transition-colors">
                {product.name}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">{product.brand}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-sm font-bold text-stone-900">
                  {formatPrice(product.price)}
                </span>
                <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 rounded px-1.5 py-0.5">
                  Sponsored
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

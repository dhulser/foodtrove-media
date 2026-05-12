import Link from "next/link";
import type { Metadata } from "next";
import AdSlot from "@/components/AdSlot";
import { getAllDepartments } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Weekly Deals — FoodTrove",
  description: "This week's best deals and promotions across all departments.",
};

// ---------------------------------------------------------------------------
// Static weekly circular data — realistic grocery promotions
// ---------------------------------------------------------------------------

const VALID_THROUGH = "May 18, 2026";

interface Deal {
  id: string;
  title: string;
  brand: string;
  originalPrice: number;
  salePrice: number;
  unit: string;
  emoji: string;
  category: string;
  departmentSlug: string;
  badge?: string;
  limit?: string;
  sponsored?: boolean;
  sponsorName?: string;
}

const WEEKLY_DEALS: Deal[] = [
  {
    id: "d1",
    title: "Organic Whole Milk",
    brand: "Organic Valley",
    originalPrice: 5.99,
    salePrice: 3.99,
    unit: "1 gal",
    emoji: "🥛",
    category: "Dairy",
    departmentSlug: "dairy",
    badge: "HOT",
    sponsored: true,
    sponsorName: "Organic Valley",
  },
  {
    id: "d2",
    title: "Hydration Multiplier (Lemon Lime)",
    brand: "Liquid I.V.",
    originalPrice: 24.99,
    salePrice: 17.99,
    unit: "16 ct",
    emoji: "💧",
    category: "Health",
    departmentSlug: "health",
    badge: "EXCLUSIVE",
    sponsored: true,
    sponsorName: "Liquid I.V.",
  },
  {
    id: "d3",
    title: "Spring Mix Salad",
    brand: "Earthbound Farm",
    originalPrice: 5.49,
    salePrice: 3.49,
    unit: "5 oz",
    emoji: "🥗",
    category: "Produce",
    departmentSlug: "produce",
    badge: "ORGANIC",
    sponsored: true,
    sponsorName: "Earthbound Farm",
  },
  {
    id: "d4",
    title: "Atlantic Salmon Fillet",
    brand: "FoodTrove Fresh",
    originalPrice: 14.99,
    salePrice: 9.99,
    unit: "per lb",
    emoji: "🐟",
    category: "Meat & Seafood",
    departmentSlug: "meat-seafood",
    badge: "WEEKEND",
    limit: "Limit 4 lbs",
  },
  {
    id: "d5",
    title: "Large Brown Eggs",
    brand: "Happy Hen",
    originalPrice: 7.29,
    salePrice: 4.49,
    unit: "doz",
    emoji: "🥚",
    category: "Dairy",
    departmentSlug: "dairy",
  },
  {
    id: "d6",
    title: "Sourdough Boule",
    brand: "Artisan Hearth",
    originalPrice: 5.99,
    salePrice: 3.99,
    unit: "24 oz",
    emoji: "🍞",
    category: "Bakery",
    departmentSlug: "bakery",
    badge: "FRESH",
  },
  {
    id: "d7",
    title: "Hass Avocados",
    brand: "FoodTrove Organic",
    originalPrice: 1.79,
    salePrice: 0.99,
    unit: "each",
    emoji: "🥑",
    category: "Produce",
    departmentSlug: "produce",
    badge: "5 for $4",
    limit: "5 for $4.00",
  },
  {
    id: "d8",
    title: "Greek Yogurt Plain",
    brand: "Chobani",
    originalPrice: 6.49,
    salePrice: 4.19,
    unit: "32 oz",
    emoji: "🫙",
    category: "Dairy",
    departmentSlug: "dairy",
  },
  {
    id: "d9",
    title: "Clementines",
    brand: "Wonderful",
    originalPrice: 8.99,
    salePrice: 5.99,
    unit: "3 lb bag",
    emoji: "🍊",
    category: "Produce",
    departmentSlug: "produce",
  },
  {
    id: "d10",
    title: "Boneless Chicken Breast",
    brand: "FoodTrove Fresh",
    originalPrice: 5.99,
    salePrice: 3.49,
    unit: "per lb",
    emoji: "🍗",
    category: "Meat",
    departmentSlug: "meat-seafood",
    badge: "BUY 2",
  },
  {
    id: "d11",
    title: "Pasta Sauce Marinara",
    brand: "Rao's",
    originalPrice: 10.99,
    salePrice: 6.99,
    unit: "24 oz",
    emoji: "🍝",
    category: "Pantry",
    departmentSlug: "pantry",
    badge: "FAN FAVE",
  },
  {
    id: "d12",
    title: "Extra Virgin Olive Oil",
    brand: "California Olive Ranch",
    originalPrice: 13.99,
    salePrice: 8.99,
    unit: "16.9 fl oz",
    emoji: "🫒",
    category: "Pantry",
    departmentSlug: "pantry",
  },
];

// Featured deals — top 4 for hero section
const FEATURED_DEALS = WEEKLY_DEALS.slice(0, 4);

// Produce deals for contextual section
const PRODUCE_DEALS = WEEKLY_DEALS.filter((d) => d.departmentSlug === "produce");
const HEALTH_DEALS = WEEKLY_DEALS.filter((d) => d.departmentSlug === "health");

function discountPct(original: number, sale: number) {
  return Math.round(((original - sale) / original) * 100);
}

function DealCard({ deal }: { deal: Deal }) {
  const savings = deal.originalPrice - deal.salePrice;
  const pct = discountPct(deal.originalPrice, deal.salePrice);

  return (
    <Link
      href={`/shop/${deal.departmentSlug}`}
      className="group relative bg-white border border-stone-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-emerald-200 transition-all flex flex-col"
    >
      {/* Discount badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
          -{pct}%
        </span>
      </div>

      {/* Category badge */}
      {deal.badge && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
            {deal.badge}
          </span>
        </div>
      )}

      {/* Product emoji (grocery-style) */}
      <div className="h-28 bg-stone-50 flex items-center justify-center border-b border-stone-100">
        <span className="text-5xl">{deal.emoji}</span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs text-stone-400 mb-0.5">{deal.brand}</div>
        <div className="font-medium text-stone-800 text-sm leading-snug mb-1">{deal.title}</div>
        <div className="text-xs text-stone-400 mb-3">{deal.unit}</div>

        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-700">
              ${deal.salePrice.toFixed(2)}
            </span>
            <span className="text-sm text-stone-400 line-through">
              ${deal.originalPrice.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-0.5">
            Save ${savings.toFixed(2)}
          </div>
          {deal.limit && (
            <div className="text-xs text-stone-400 mt-1">{deal.limit}</div>
          )}
        </div>

        {/* Sponsored label */}
        {deal.sponsored && (
          <div className="mt-3 pt-2 border-t border-stone-100 flex items-center gap-1">
            <span className="text-xs text-amber-600 font-medium">★ Sponsored</span>
            <span className="text-xs text-stone-400">by {deal.sponsorName}</span>
          </div>
        )}

        <div className="mt-3 text-xs font-medium text-emerald-600 group-hover:text-emerald-700 transition-colors">
          Shop now →
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default async function WeeklyDealsPage() {
  const departments = getAllDepartments();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wide">
                  Weekly Circular
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                This Week&apos;s Best Deals
              </h1>
              <p className="mt-2 text-emerald-200 text-sm">
                {WEEKLY_DEALS.length} deals · Valid through {VALID_THROUGH}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-emerald-200">Savings this week</div>
              <div className="text-3xl font-bold">
                Up to {Math.max(...WEEKLY_DEALS.map((d) => discountPct(d.originalPrice, d.salePrice)))}% off
              </div>
            </div>
          </div>

          {/* Category nav */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-1">
            {["All", ...Array.from(new Set(WEEKLY_DEALS.map((d) => d.category)))].map((cat) => (
              <span
                key={cat}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 cursor-pointer transition-colors text-emerald-50"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Billboard ad slot — above deals */}
      <div className="bg-white border-b border-stone-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <AdSlot
            size="billboard"
            placementId="weekly-deals-billboard"
            keywords={["deals", "promotions", "weekly-circular"]}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Leaderboard ad between header and featured */}
        <div className="flex justify-center mb-8">
          <AdSlot
            size="leaderboard"
            placementId="weekly-deals-top-leaderboard"
            keywords={["deals", "ft-leaderboard"]}
          />
        </div>

        {/* Featured deals — 4-up */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-stone-900">Featured Deals</h2>
            <span className="text-sm text-stone-400">Valid through {VALID_THROUGH}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURED_DEALS.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </section>

        {/* Two-column: produce + MRec ad */}
        <section className="mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Produce deals */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-bold text-stone-900 mb-4">🥑 Fresh Produce Deals</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PRODUCE_DEALS.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            </div>

            {/* MRec ad slot + small callout */}
            <div className="flex flex-col gap-4">
              <AdSlot
                size="medium-rectangle"
                placementId="weekly-deals-right-mrec"
                keywords={["produce", "organic", "fresh", "ft-mrec"]}
              />

              {/* Loyalty CTA */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <div className="text-sm font-bold text-emerald-800 mb-1">
                  🎁 FoodTrove Rewards
                </div>
                <p className="text-xs text-emerald-700 mb-3">
                  Earn 2x points on all weekly deals. Redeem for free groceries.
                </p>
                <Link
                  href="/account"
                  className="inline-block text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
                >
                  Check your points →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Health & wellness strip */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-stone-900">💊 Health & Wellness</h2>
            <Link href="/shop/health" className="text-sm text-emerald-600 hover:text-emerald-700">
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HEALTH_DEALS.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
            {/* pad with remaining deals if under 4 */}
            {WEEKLY_DEALS.filter(
              (d) => !FEATURED_DEALS.includes(d) && !PRODUCE_DEALS.includes(d) && !HEALTH_DEALS.includes(d)
            )
              .slice(0, Math.max(0, 4 - HEALTH_DEALS.length))
              .map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
          </div>
        </section>

        {/* Leaderboard ad between sections */}
        <div className="flex justify-center mb-10">
          <AdSlot
            size="leaderboard"
            placementId="weekly-deals-mid-leaderboard"
            keywords={["health", "nutrition", "ft-leaderboard"]}
          />
        </div>

        {/* All remaining deals */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-stone-900">More Deals</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {WEEKLY_DEALS.filter(
              (d) => !FEATURED_DEALS.includes(d) && !PRODUCE_DEALS.includes(d) && !HEALTH_DEALS.includes(d)
            ).map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </section>

        {/* Bottom leaderboard */}
        <div className="flex justify-center mb-8">
          <AdSlot
            size="leaderboard"
            placementId="weekly-deals-bottom-leaderboard"
            keywords={["deals", "pantry", "ft-leaderboard"]}
          />
        </div>

        {/* Department Browse */}
        <section>
          <h2 className="text-lg font-bold text-stone-900 mb-4">Browse All Departments</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {departments.map((dept) => (
              <Link
                key={dept.slug}
                href={`/shop/${dept.slug}`}
                className="flex flex-col items-center gap-1 py-3 bg-white border border-stone-100 rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all text-center"
              >
                <span className="text-2xl">{dept.icon}</span>
                <span className="text-xs font-medium text-stone-600">{dept.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Fine print */}
        <div className="mt-8 py-4 border-t border-stone-200">
          <p className="text-xs text-stone-400 text-center max-w-2xl mx-auto">
            Sale prices valid in-store and online through {VALID_THROUGH}. Quantities limited.
            Sponsored products identified with ★. Prices subject to change. Some restrictions
            apply — see store for details.
          </p>
        </div>
      </div>
    </div>
  );
}

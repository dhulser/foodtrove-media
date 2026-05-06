import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { getDepartmentBySlug, getAllDepartments, formatPrice } from "@/lib/catalog";
import AdSlot from "@/components/AdSlot";
import ProductCard from "@/components/ProductCard";

interface DepartmentPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const departments = getAllDepartments();
  return departments.map((dept) => ({ slug: dept.slug }));
}

export async function generateMetadata({ params }: DepartmentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const dept = getDepartmentBySlug(slug);
  if (!dept) return {};
  return {
    title: `${dept.name} — FoodTrove`,
    description: dept.description,
  };
}

export default async function DepartmentPage({ params }: DepartmentPageProps) {
  const { slug } = await params;
  const dept = getDepartmentBySlug(slug);
  if (!dept) notFound();

  const departments = getAllDepartments();

  // Split products: first sponsored, then by rating
  const sponsored = dept.products.filter((p) => p.sponsored);
  const regular = dept.products.filter((p) => !p.sponsored).sort((a, b) => b.rating - a.rating);

  return (
    <div>
      {/* Department header */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-xs text-stone-400 mb-4 flex items-center gap-1.5">
            <Link href="/" className="hover:text-emerald-600">Home</Link>
            <span>›</span>
            <span className="text-stone-600 font-medium">{dept.name}</span>
          </nav>

          <div className="flex items-start gap-4">
            <span className="text-4xl">{dept.icon}</span>
            <div>
              <h1 className="text-3xl font-bold text-stone-900">{dept.name}</h1>
              <p className="text-stone-500 mt-1">{dept.description}</p>
              <p className="text-xs text-stone-400 mt-1">{dept.products.length} products</p>
            </div>
          </div>

          {/* Department tab nav */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-1">
            {departments.map((d) => (
              <Link
                key={d.id}
                href={`/shop/${d.slug}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  d.slug === slug
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "text-stone-500 hover:text-stone-800 hover:bg-stone-100"
                }`}
              >
                <span>{d.icon}</span>
                <span>{d.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Main product grid */}
          <div className="flex-1 min-w-0">
            {/* Leaderboard slot above product grid */}
            <div className="mb-6 flex justify-center">
              <AdSlot
                size="leaderboard"
                placementId={`dept-${dept.id}-top-leaderboard`}
                debug={true}
              />
            </div>

            {/* Sponsored products — if any */}
            {sponsored.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-amber-400 rounded"></span>
                  Sponsored
                  <span className="w-4 h-0.5 bg-amber-400 rounded"></span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {sponsored.map((product) => (
                    <ProductCard key={product.id} product={product} department={dept} showSponsoredBadge={true} />
                  ))}
                </div>
              </div>
            )}

            {/* All products */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-stone-800">All Products</h2>
                <p className="text-sm text-stone-400">{regular.length} items</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {regular.map((product, index) => (
                <React.Fragment key={product.id}>
                  <ProductCard product={product} department={dept} />
                  {/* Inline ad slot every 10 products */}
                  {(index + 1) % 10 === 0 && (
                    <div className="col-span-full flex justify-center py-2">
                      <AdSlot
                        size="leaderboard"
                        placementId={`dept-${dept.id}-inline-${Math.floor(index / 10)}`}
                        debug={true}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
              </div>
            </div>
          </div>

          {/* Right rail — medium rectangle slot */}
          <div className="hidden lg:block w-[300px] shrink-0">
            <div className="sticky top-[120px] space-y-4">
              <AdSlot
                size="medium-rectangle"
                placementId={`dept-${dept.id}-right-rail-mrec`}
                debug={true}
              />
              <AdSlot
                size="medium-rectangle"
                placementId={`dept-${dept.id}-right-rail-mrec-2`}
                debug={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

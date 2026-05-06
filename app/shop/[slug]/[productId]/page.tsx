import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getProductById, getDepartmentBySlug, formatPrice } from "@/lib/catalog";
import AdSlot from "@/components/AdSlot";
import ProductCard from "@/components/ProductCard";
import ProductImage from "@/components/ProductImage";
import AddToCartButton from "@/components/AddToCartButton";

interface ProductPageProps {
  params: Promise<{ slug: string; productId: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  const result = getProductById(productId);
  if (!result) return {};
  const { product } = result;
  return {
    title: `${product.name} — FoodTrove`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, productId } = await params;
  const result = getProductById(productId);

  if (!result || result.department.slug !== slug) notFound();

  const { product, department } = result;
  const stars = Math.round(product.rating);

  // Related products — same department, exclude current, limit 6
  const relatedProducts = department.products
    .filter((p) => p.id !== product.id)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-stone-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-emerald-600">Home</Link>
          <span>›</span>
          <Link href={`/shop/${department.slug}`} className="hover:text-emerald-600">{department.name}</Link>
          <span>›</span>
          <span className="text-stone-600 font-medium truncate">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Product image */}
          <div className="flex-1 min-w-0 max-w-lg">
            <div className="aspect-square bg-stone-100 rounded-2xl overflow-hidden shadow-sm">
              <ProductImage
                productId={product.id}
                productName={product.name}
                brandName={product.brand}
                departmentIcon={department.icon}
                departmentColor={department.id}
                size="detail"
                className="w-full h-full"
              />
            </div>
            {/* SKU label below image */}
            <p className="mt-2 text-xs text-stone-400 text-center font-mono">{product.sku}</p>
          </div>

          {/* Product details */}
          <div className="flex-1 min-w-0">
            {product.sponsored && (
              <span className="inline-block mb-3 px-2 py-0.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded">
                Sponsored
              </span>
            )}

            <p className="text-sm font-medium text-stone-400 uppercase tracking-wide">{product.brand}</p>
            <h1 className="text-3xl font-bold text-stone-900 mt-1 leading-snug">{product.name}</h1>
            <p className="text-sm text-stone-400 mt-1">{product.unit}</p>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-lg ${i < stars ? "text-amber-400" : "text-stone-200"}`}>
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm font-medium text-stone-700">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-stone-400">({product.reviewCount.toLocaleString()} reviews)</span>
            </div>

            {/* Price */}
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-stone-900">{formatPrice(product.price)}</span>
              <span className="text-stone-400 text-sm">{product.unit}</span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2.5 py-1 text-xs font-medium text-stone-600 bg-stone-100 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="mt-6 text-stone-600 leading-relaxed">{product.description}</p>

            {/* In-stock / add-to-cart */}
            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${product.inStock ? "bg-emerald-500" : "bg-red-400"}`} />
                <span className="text-sm text-stone-500">
                  {product.inStock ? "In stock" : "Out of stock"}
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <AddToCartButton product={product} department={department} fullSize disabled={!product.inStock} />
              <button className="px-4 py-3 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right rail ad */}
          <div className="hidden xl:block w-[300px] shrink-0">
            <div className="sticky top-[120px]">
              <AdSlot
                size="medium-rectangle"
                placementId={`product-${product.id}-right-rail`}
              />
            </div>
          </div>
        </div>

        {/* Mid-page leaderboard */}
        <div className="my-10 flex justify-center">
          <AdSlot
            size="leaderboard"
            placementId={`product-${product.id}-mid-leaderboard`}
          />
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-stone-800 mb-6">
              More from {department.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} department={department} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

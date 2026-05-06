import Link from "next/link";
import { formatPrice } from "@/lib/catalog";
import type { Product, Department } from "@/lib/types";
import AddToCartButton from "@/components/AddToCartButton";
import ProductImage from "@/components/ProductImage";

interface ProductCardProps {
  product: Product;
  department: Department;
  /** Show sponsored badge */
  showSponsoredBadge?: boolean;
}

export default function ProductCard({ product, department, showSponsoredBadge = true }: ProductCardProps) {
  const stars = Math.round(product.rating);

  return (
    <Link
      href={`/shop/${department.slug}/${product.id}`}
      className="group relative flex flex-col bg-white rounded-xl border border-stone-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 overflow-hidden"
    >
      {/* Sponsored badge */}
      {product.sponsored && showSponsoredBadge && (
        <div className="absolute top-2 left-2 z-10">
          <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded">
            Sponsored
          </span>
        </div>
      )}

      {/* Product image area */}
      <div className="aspect-square overflow-hidden">
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

      {/* Product info */}
      <div className="flex flex-col flex-1 p-4 gap-1.5">
        <p className="text-xs text-stone-400 font-medium uppercase tracking-wide truncate">
          {product.brand}
        </p>
        <h3 className="text-sm font-semibold text-stone-800 leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-stone-500 truncate">{product.unit}</p>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1">
          <div className="flex text-amber-400 text-xs">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < stars ? "text-amber-400" : "text-stone-200"}>
                ★
              </span>
            ))}
          </div>
          <span className="text-xs text-stone-400">({product.reviewCount.toLocaleString()})</span>
        </div>

        {/* Price + CTA */}
        <div className="flex items-end justify-between mt-auto pt-2">
          <div>
            <span className="text-lg font-bold text-stone-900">{formatPrice(product.price)}</span>
          </div>
          <AddToCartButton product={product} department={department} />
        </div>
      </div>
    </Link>
  );
}

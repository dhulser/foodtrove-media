import { notFound } from "next/navigation";
import Link from "next/link";
import { getBrandBySlug, getAllBrandSlugs } from "@/lib/brands";
import { getProductsForBrand, formatPrice, renderStars } from "@/lib/catalog";
import AdSlot from "@/components/AdSlot";
import ProductCard from "@/components/ProductCard";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllBrandSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) return { title: "Brand Not Found" };
  return {
    title: `${brand.name} — FoodTrove Brand Partner`,
    description: brand.tagline,
  };
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) notFound();

  const products = getProductsForBrand(brand.productBrands, brand.categoryTags, 12);

  // Accent color mapping for Tailwind (dynamic class gen doesn't work — explicit map)
  const accentMap: Record<string, {
    heroBg: string;
    pillBg: string;
    pillText: string;
    pillBorder: string;
    ctaBg: string;
    ctaHover: string;
    textColor: string;
    borderColor: string;
    lightBg: string;
  }> = {
    emerald: {
      heroBg: "from-emerald-600 to-teal-700",
      pillBg: "bg-emerald-100",
      pillText: "text-emerald-800",
      pillBorder: "border-emerald-200",
      ctaBg: "bg-emerald-600",
      ctaHover: "hover:bg-emerald-700",
      textColor: "text-emerald-600",
      borderColor: "border-emerald-200",
      lightBg: "bg-emerald-50",
    },
    blue: {
      heroBg: "from-blue-600 to-indigo-700",
      pillBg: "bg-blue-100",
      pillText: "text-blue-800",
      pillBorder: "border-blue-200",
      ctaBg: "bg-blue-600",
      ctaHover: "hover:bg-blue-700",
      textColor: "text-blue-600",
      borderColor: "border-blue-200",
      lightBg: "bg-blue-50",
    },
    lime: {
      heroBg: "from-lime-600 to-green-700",
      pillBg: "bg-lime-100",
      pillText: "text-lime-800",
      pillBorder: "border-lime-200",
      ctaBg: "bg-lime-600",
      ctaHover: "hover:bg-lime-700",
      textColor: "text-lime-700",
      borderColor: "border-lime-200",
      lightBg: "bg-lime-50",
    },
  };

  const colors = accentMap[brand.colorScheme.accent] ?? accentMap.emerald;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Brand hero — Kevel billboard placement */}
      <div className={`bg-gradient-to-br ${colors.heroBg} relative overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white rounded-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/60 text-sm mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/brands" className="hover:text-white transition-colors">Brands</Link>
            <span>/</span>
            <span className="text-white">{brand.name}</span>
          </nav>

          {/* Brand identity */}
          <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-5xl">{brand.icon}</span>
                <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 text-white/90`}>
                  Sponsored Partner
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-2">
                {brand.name}
              </h1>
              <p className="text-white/80 text-lg font-medium mb-1">{brand.tagline}</p>
              <p className="text-white/60 text-xs font-mono">{brand.founded}</p>
            </div>
            <div className={`${colors.ctaBg} ${colors.ctaHover} text-white px-6 py-3 rounded-full font-semibold text-sm self-start md:self-auto transition-colors cursor-default`}>
              {brand.ctaLabel}
            </div>
          </div>

          {/* Kevel billboard ad — brand has paid for this placement */}
          <div className="flex justify-center">
            <AdSlot
              size="billboard"
              placementId={`brand-${brand.slug}-billboard`}
              keywords={[brand.kevelBrandKeyword]}
            />
          </div>
        </div>
      </div>

      {/* About section + pillars */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Brand description */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-stone-900 mb-3">About {brand.name}</h2>
            <p className="text-stone-600 leading-relaxed text-base mb-6">
              {brand.description}
            </p>
            {/* Pillars 2×2 grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {brand.pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className={`${colors.lightBg} ${colors.borderColor} border rounded-xl p-4 flex gap-3`}
                >
                  <span className="text-2xl flex-shrink-0">{pillar.icon}</span>
                  <div>
                    <p className={`text-sm font-bold ${colors.textColor} mb-0.5`}>{pillar.title}</p>
                    <p className="text-xs text-stone-600 leading-relaxed">{pillar.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right rail — Kevel MRec */}
          <div className="flex flex-col gap-4">
            <AdSlot
              size="medium-rectangle"
              placementId={`brand-${brand.slug}-mrec`}
              keywords={[brand.kevelBrandKeyword]}
            />
            {/* Network stats card */}
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
                On FoodTrove Network
              </p>
              <dl className="space-y-2">
                {[
                  { label: "Ad formats", value: "3 formats" },
                  { label: "Network reach", value: "All FoodTrove shoppers" },
                  { label: "Targeting", value: brand.colorScheme.accent === "lime" ? "Produce + contextual" : "Run-of-site" },
                  { label: "Measurement", value: "Kevel impression + click" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-baseline">
                    <dt className="text-xs text-stone-500">{row.label}</dt>
                    <dd className="text-xs font-semibold text-stone-800">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard between about and products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center mb-8">
        <AdSlot
          size="leaderboard"
          placementId={`brand-${brand.slug}-mid-leaderboard`}
          keywords={[brand.kevelBrandKeyword]}
        />
      </div>

      {/* Featured products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-bold text-stone-900">{brand.ctaLabel}</h2>
          <span className="text-sm text-stone-400">{products.length} products</span>
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {products.map(({ product, department }) => (
              <ProductCard
                key={product.id}
                product={product}
                department={department}
                showSponsoredBadge={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-stone-400">
            <p className="text-lg mb-2">Products coming soon</p>
            <p className="text-sm">Check back — we&apos;re expanding this brand&apos;s range.</p>
          </div>
        )}
      </div>

      {/* Back to brands */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <Link
          href="/brands"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
        >
          ← All brand partners
        </Link>
      </div>
    </div>
  );
}

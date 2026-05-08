import Link from "next/link";
import { BRANDS } from "@/lib/brands";
import AdSlot from "@/components/AdSlot";

export const metadata = {
  title: "Brand Partners — FoodTrove",
  description: "Explore our featured brand partners and their products on FoodTrove.",
};

export default function BrandsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Page header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">
                Retail Media Network
              </p>
              <h1 className="text-3xl font-extrabold text-stone-900 mb-2">
                Our Brand Partners
              </h1>
              <p className="text-stone-500 text-base max-w-xl">
                FoodTrove partners with best-in-class brands who share our commitment to quality.
                These featured partners have dedicated brand pages on our storefront.
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1">
              <span className="text-xs text-stone-400 font-mono uppercase tracking-wider">Powered by</span>
              <span className="text-sm font-bold text-stone-600">FoodTrove Media Network</span>
              <span className="text-xs text-stone-400">{BRANDS.length} featured partners</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard ad slot */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-center">
        <AdSlot size="leaderboard" placementId="brands-top-leaderboard" />
      </div>

      {/* Brand cards grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BRANDS.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              className="group block bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-lg hover:border-stone-300 transition-all overflow-hidden"
            >
              {/* Brand card hero */}
              <div className={`bg-gradient-to-br ${brand.colorScheme.bg} p-8 text-white relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-4 -right-4 w-32 h-32 bg-white rounded-full" />
                  <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-white rounded-full" />
                </div>
                <div className="relative">
                  <span className="text-4xl mb-3 block">{brand.icon}</span>
                  <h2 className="text-xl font-bold mb-1">{brand.name}</h2>
                  <p className="text-white/80 text-sm">{brand.tagline}</p>
                </div>
              </div>

              {/* Brand card body */}
              <div className="p-5">
                <p className="text-stone-600 text-sm leading-relaxed line-clamp-3 mb-4">
                  {brand.description}
                </p>

                {/* Brand pillars — preview 2 */}
                <div className="space-y-2 mb-4">
                  {brand.pillars.slice(0, 2).map((pillar) => (
                    <div key={pillar.title} className="flex items-start gap-2">
                      <span className="text-base flex-shrink-0 mt-0.5">{pillar.icon}</span>
                      <div>
                        <span className="text-xs font-semibold text-stone-700">{pillar.title}</span>
                        <span className="text-xs text-stone-400"> — {pillar.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer strip */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${brand.colorScheme.badge}`}>
                    Sponsored Partner
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold group-hover:text-emerald-700 transition-colors">
                    View brand →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* What is Sponsored Partner section */}
        <div className="mt-12 bg-white border border-stone-200 rounded-2xl p-8">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-stone-900 mb-3">About Brand Partnerships</h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-4">
              FoodTrove Brand Partners are premium sponsors on our retail media network.
              They have dedicated storefronts here, curated ad placements throughout the site, and a direct
              connection to FoodTrove shoppers. Partner status requires meeting our quality and
              sustainability standards — we don't take just anyone.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: "🎯", title: "Targeted Reach", desc: "Ads delivered to shoppers actively buying in their category" },
                { icon: "📊", title: "Full Measurement", desc: "Impression, click, and conversion reporting via Kevel" },
                { icon: "🏪", title: "Brand Storefront", desc: "Dedicated brand page — premium placement on every shopper's journey" },
              ].map((item) => (
                <div key={item.title} className="flex flex-col gap-1.5">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-sm font-semibold text-stone-800">{item.title}</p>
                  <p className="text-xs text-stone-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

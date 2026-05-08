/**
 * Sponsored Brand data for FoodTrove Media retail media network.
 *
 * These three advertisers have active Kevel campaigns across all ad formats.
 * Their brand pages are a premium retail media placement — advertisers pay a
 * CPM premium to own their brand presence on the storefront.
 *
 * Keywords for Kevel targeting:
 *   ft-billboard, ft-leaderboard, ft-mrec  — format routing
 *   brand slug (e.g. "freshfarm-organics")  — brand page specific targeting
 */

export interface BrandProfile {
  /** URL slug — matches /brands/[slug] */
  slug: string;
  /** Display name */
  name: string;
  /** Short tagline shown on brand cards */
  tagline: string;
  /** Longer brand description for the landing page */
  description: string;
  /** Brand color (CSS class palette — Tailwind) */
  colorScheme: {
    bg: string;
    accent: string;
    text: string;
    badge: string;
  };
  /** Emoji/icon to represent the brand */
  icon: string;
  /** Category tags this brand sells in — used to pull catalog products */
  categoryTags: string[];
  /** Brand-specific catalog product names (for surfacing their products) */
  productBrands: string[];
  /** Kevel advertiser ID */
  kevelAdvertiserId: number;
  /** Kevel campaign ID */
  kevelCampaignId: number;
  /** Brand-specific keyword to pass to Kevel for brand-page targeting */
  kevelBrandKeyword: string;
  /** Story points shown on the brand page */
  pillars: Array<{ icon: string; title: string; desc: string }>;
  /** CTA text for product section heading */
  ctaLabel: string;
  /** Founded year and location (story element) */
  founded: string;
}

export const BRANDS: BrandProfile[] = [
  {
    slug: "freshfarm-organics",
    name: "FreshFarm Organics",
    tagline: "Certified organic, family-farm sourced.",
    description:
      "FreshFarm Organics has been connecting families with certified organic produce and pantry staples since 2009. Every product is sourced directly from USDA-certified family farms within 200 miles of our distribution centers — meaning what arrives in your cart was in the ground a few days ago. We never use synthetic pesticides, GMOs, or artificial preservatives. Just real food, done right.",
    colorScheme: {
      bg: "from-emerald-600 to-teal-700",
      accent: "emerald",
      text: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    icon: "🌿",
    categoryTags: ["organic", "produce", "fresh", "natural", "farm-fresh"],
    productBrands: [
      "Earthbound Farm",
      "Vital Farms",
      "Organic Valley",
      "Horizon Organic",
      "FoodTrove Fresh",
    ],
    kevelAdvertiserId: 6254651,
    kevelCampaignId: 659158534,
    kevelBrandKeyword: "brand-freshfarm",
    pillars: [
      { icon: "🌾", title: "Family Farms Only", desc: "Every product traces back to a named family farm. No factory agriculture." },
      { icon: "✅", title: "USDA Certified Organic", desc: "Third-party verified. Every product meets USDA National Organic Program standards." },
      { icon: "🚜", title: "200-Mile Sourcing", desc: "Grown close to home — shorter supply chains mean fresher produce and a smaller footprint." },
      { icon: "♻️", title: "Climate Positive", desc: "Carbon-negative farming practices across our entire supplier network since 2021." },
    ],
    ctaLabel: "Shop Organic Products",
    founded: "Founded 2009 · Pacific Northwest",
  },
  {
    slug: "nutripeak-nutrition",
    name: "NutriPeak Nutrition",
    tagline: "Performance nutrition built on science.",
    description:
      "NutriPeak Nutrition formulates science-backed supplements and functional foods for athletes, weekend warriors, and anyone optimizing their daily performance. Every formula is developed with registered dietitians, third-party tested for purity, and free of proprietary blends — you always know exactly what you're getting and why. From clean protein to electrolyte hydration, NutriPeak delivers what your body actually needs.",
    colorScheme: {
      bg: "from-blue-600 to-indigo-700",
      accent: "blue",
      text: "text-blue-700",
      badge: "bg-blue-100 text-blue-800 border-blue-200",
    },
    icon: "💪",
    categoryTags: ["protein", "supplements", "sports", "nutrition", "health", "clean-label"],
    productBrands: ["Chobani", "RX Bar", "Kind", "Larabar", "Clif"],
    kevelAdvertiserId: 6256255,
    kevelCampaignId: 659159072,
    kevelBrandKeyword: "brand-nutripeak",
    pillars: [
      { icon: "🔬", title: "RD-Formulated", desc: "Every product developed by registered dietitians, not marketing teams." },
      { icon: "🧪", title: "Third-Party Tested", desc: "NSF Certified for Sport. Batch-tested for 200+ banned substances." },
      { icon: "📋", title: "No Proprietary Blends", desc: "Full label transparency — every ingredient, every dose, disclosed." },
      { icon: "⚡", title: "Clinically Dosed", desc: "Ingredient amounts match the doses used in published clinical research." },
    ],
    ctaLabel: "Shop Performance Nutrition",
    founded: "Founded 2016 · Boulder, CO",
  },
  {
    slug: "greenleaf-farms",
    name: "GreenLeaf Farms",
    tagline: "Fresh from the field, direct to your table.",
    description:
      "GreenLeaf Farms is a collective of regenerative farmers in the California Central Valley who grow premium produce under strict sustainability standards. Our members practice no-till farming, cover cropping, and integrated pest management — farming methods that rebuild soil health year over year. What you buy from GreenLeaf isn't just food: it's a vote for a farming system that will still work in 50 years.",
    colorScheme: {
      bg: "from-lime-600 to-green-700",
      accent: "lime",
      text: "text-lime-700",
      badge: "bg-lime-100 text-lime-800 border-lime-200",
    },
    icon: "🥬",
    categoryTags: ["produce", "greens", "vegetables", "regenerative", "local", "farm-fresh"],
    productBrands: [
      "Driscoll's",
      "Dole",
      "Earthbound Farm",
      "Christopher Ranch",
      "Sunkist",
      "FoodTrove Fresh",
    ],
    kevelAdvertiserId: 6256266,
    kevelCampaignId: 659159177,
    kevelBrandKeyword: "brand-greenleaf",
    pillars: [
      { icon: "🌱", title: "Regenerative Agriculture", desc: "No-till farming and cover cropping that actively rebuilds soil carbon." },
      { icon: "🐝", title: "Pollinator Safe", desc: "Zero neonicotinoids across all member farms. Verified by The Bee Better Certified program." },
      { icon: "💧", title: "Water Stewards", desc: "30% less water use than conventional comparable operations through precision irrigation." },
      { icon: "👩‍🌾", title: "Farmer-Owned Collective", desc: "48 independent farmers, each a cooperative member with an equal voice in standards." },
    ],
    ctaLabel: "Shop GreenLeaf Products",
    founded: "Founded 2013 · Salinas Valley, CA",
  },
];

export function getBrandBySlug(slug: string): BrandProfile | undefined {
  return BRANDS.find((b) => b.slug === slug);
}

export function getAllBrandSlugs(): string[] {
  return BRANDS.map((b) => b.slug);
}

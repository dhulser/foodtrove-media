/**
 * Sponsored Brand data for FoodTrove Media retail media network.
 *
 * These three advertisers have active Kevel campaigns across all ad formats.
 * Their brand pages are a premium retail media placement — advertisers pay a
 * CPM premium to own their brand presence on the storefront.
 *
 * Keywords for Kevel targeting:
 *   ft-billboard, ft-leaderboard, ft-mrec  — format routing
 *   brand slug (e.g. "organic-valley")  — brand page specific targeting
 *
 * Kevel Network 12024 advertiser IDs:
 *   Organic Valley:  6256813  campaign 659171965
 *   Liquid I.V.:     6256814  campaign 659171966
 *   Earthbound Farm: 6256815  campaign 659171967
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
    slug: "organic-valley",
    name: "Organic Valley",
    tagline: "Pasture-raised. Always organic. Farmer-owned.",
    description:
      "Organic Valley is America's largest farmer-owned organic cooperative, founded in 1988 in the Coulee Region of Wisconsin. Our 1,800+ farmer-owners across 34 states raise their animals on real pasture — 365 days a year where climate allows. Every carton of milk, dozen eggs, and block of cheese traces back to a named farm. No shortcuts, no factory barns, no compromises. USDA Organic and Non-GMO Verified on every product.",
    colorScheme: {
      bg: "from-violet-800 to-purple-600",
      accent: "violet",
      text: "text-violet-700",
      badge: "bg-violet-100 text-violet-800 border-violet-200",
    },
    icon: "🥛",
    categoryTags: ["organic", "dairy", "eggs", "pasture-raised", "non-gmo"],
    productBrands: [
      "Organic Valley",
      "Horizon Organic",
      "Vital Farms",
      "Stonyfield",
    ],
    kevelAdvertiserId: 6256813,
    kevelCampaignId: 659171965,
    kevelBrandKeyword: "brand-organic-valley",
    pillars: [
      { icon: "🐄", title: "Pasture-Raised Always", desc: "Our cows graze on real grass pastures 365 days a year. No confinement, no shortcuts." },
      { icon: "👨‍🌾", title: "Farmer-Owned Co-op", desc: "1,800+ independent family farmers. Every purchase goes back to the farm." },
      { icon: "✅", title: "USDA Certified Organic", desc: "Third-party certified. No synthetic pesticides, no GMOs, no artificial hormones." },
      { icon: "🌿", title: "Non-GMO Verified", desc: "Every product Non-GMO Project Verified. Transparent from farm to fridge." },
    ],
    ctaLabel: "Shop Organic Valley",
    founded: "Founded 1988 · La Farge, Wisconsin",
  },
  {
    slug: "liquid-iv",
    name: "Liquid I.V.",
    tagline: "Hydration Multiplier™ — 1 stick = 2–3x the hydration.",
    description:
      "Liquid I.V. is on a mission to change the way the world hydrates. Our Hydration Multiplier uses Cellular Transport Technology™ — a precise ratio of glucose, sodium, and potassium — to deliver hydration into the bloodstream faster and more efficiently than water alone. One stick in 16 oz of water outperforms drinking 2–3 bottles of water. Non-GMO, gluten-free, soy-free, and dairy-free. Available in 16 flavors.",
    colorScheme: {
      bg: "from-sky-900 to-blue-600",
      accent: "sky",
      text: "text-sky-700",
      badge: "bg-sky-100 text-sky-800 border-sky-200",
    },
    icon: "💧",
    categoryTags: ["hydration", "supplements", "beverages", "sports", "non-gmo", "gluten-free"],
    productBrands: [
      "Liquid I.V.",
      "Nuun",
      "DripDrop",
      "Pedialyte Sport",
      "Gatorade",
    ],
    kevelAdvertiserId: 6256814,
    kevelCampaignId: 659171966,
    kevelBrandKeyword: "brand-liquid-iv",
    pillars: [
      { icon: "⚡", title: "Cellular Transport Technology™", desc: "A precise ratio of glucose, sodium, and potassium that accelerates absorption at the cellular level." },
      { icon: "💧", title: "2–3x the Hydration", desc: "One stick in 16 oz of water delivers more effective hydration than 2–3 bottles of water alone." },
      { icon: "🧪", title: "Non-GMO & Allergen-Free", desc: "Non-GMO Project Verified. Gluten-free, soy-free, dairy-free. Nothing unnecessary." },
      { icon: "🌍", title: "1 Purchased = 1 Donated", desc: "For every product sold, one is donated to someone in need through our global giving program." },
    ],
    ctaLabel: "Shop Liquid I.V.",
    founded: "Founded 2012 · El Segundo, CA",
  },
  {
    slug: "earthbound-farm",
    name: "Earthbound Farm",
    tagline: "America's #1 organic salad brand since 1984.",
    description:
      "Earthbound Farm started with a 2.5-acre raspberry farm in Carmel Valley, California in 1984 and grew into the country's largest organic produce brand. We pioneered the pre-washed, ready-to-eat salad category and still lead it today. Every bag is triple-washed and tested for food safety. Our farms use organic practices that rebuild soil health, protect waterways, and eliminate synthetic pesticides — farming the way it was meant to be done.",
    colorScheme: {
      bg: "from-orange-800 to-orange-500",
      accent: "orange",
      text: "text-orange-700",
      badge: "bg-orange-100 text-orange-800 border-orange-200",
    },
    icon: "🥗",
    categoryTags: ["organic", "produce", "salads", "greens", "vegetables", "ready-to-eat"],
    productBrands: [
      "Earthbound Farm",
      "Dole",
      "Taylor Farms",
      "Driscoll's",
      "FoodTrove Fresh",
    ],
    kevelAdvertiserId: 6256815,
    kevelCampaignId: 659171967,
    kevelBrandKeyword: "brand-earthbound-farm",
    pillars: [
      { icon: "🌱", title: "Organic Since 1984", desc: "The original organic produce pioneers. Over 40 years of no synthetic pesticides, no GMOs." },
      { icon: "🥗", title: "Triple-Washed & Ready", desc: "Every bag is triple-washed, tested, and ready to eat straight from the package." },
      { icon: "🚜", title: "Farm to Shelf in 24 hrs", desc: "Our supply chain moves fast. Harvested today, on your shelf — and in your salad bowl — tomorrow." },
      { icon: "🌍", title: "Soil Health First", desc: "Organic farming practices that rebuild soil, protect waterways, and create habitat for beneficial insects." },
    ],
    ctaLabel: "Shop Earthbound Farm",
    founded: "Founded 1984 · Carmel Valley, CA",
  },
];

export function getBrandBySlug(slug: string): BrandProfile | undefined {
  return BRANDS.find((b) => b.slug === slug);
}

export function getAllBrandSlugs(): string[] {
  return BRANDS.map((b) => b.slug);
}

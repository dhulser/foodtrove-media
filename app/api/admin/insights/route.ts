import { NextResponse } from "next/server";

// Seeded PRNG — stable per day-hour bucket so numbers don't jump on refresh
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };
}

function getDailyRng(salt: number): () => number {
  const bucket = Math.floor(Date.now() / (1000 * 60 * 60)); // hourly bucket
  return seededRandom(bucket * 7919 + salt);
}

const CATEGORIES = [
  {
    slug: "produce",
    name: "Produce",
    icon: "🥦",
    color: "emerald",
    advertisers: ["Earthbound Farm", "Organic Valley"],
    description: "Fresh fruits and vegetables",
  },
  {
    slug: "dairy",
    name: "Dairy & Eggs",
    icon: "🥛",
    color: "blue",
    advertisers: ["Organic Valley"],
    description: "Milk, cheese, eggs, yogurt",
  },
  {
    slug: "beverages",
    name: "Beverages",
    icon: "🧃",
    color: "amber",
    advertisers: ["Liquid I.V."],
    description: "Drinks, hydration, wellness",
  },
  {
    slug: "bakery",
    name: "Bakery",
    icon: "🍞",
    color: "orange",
    advertisers: [],
    description: "Bread, pastries, baked goods",
  },
  {
    slug: "snacks",
    name: "Snacks",
    icon: "🍿",
    color: "yellow",
    advertisers: ["Liquid I.V."],
    description: "Chips, crackers, snack bars",
  },
  {
    slug: "meat-seafood",
    name: "Meat & Seafood",
    icon: "🥩",
    color: "red",
    advertisers: [],
    description: "Fresh and packaged proteins",
  },
  {
    slug: "frozen",
    name: "Frozen",
    icon: "🧊",
    color: "cyan",
    advertisers: ["Earthbound Farm"],
    description: "Frozen meals, vegetables, desserts",
  },
  {
    slug: "pantry",
    name: "Pantry",
    icon: "🫙",
    color: "stone",
    advertisers: [],
    description: "Canned goods, condiments, grains",
  },
];

const SHOPPER_SEGMENTS = [
  { id: "organic", name: "Organic Enthusiast", keywords: ["organic", "produce", "natural"], color: "emerald" },
  { id: "family", name: "Family Staples", keywords: ["dairy", "bakery", "snacks", "pantry"], color: "blue" },
  { id: "health", name: "Health-Conscious", keywords: ["beverages", "produce", "snacks"], color: "violet" },
  { id: "premium", name: "Premium Fresh Buyer", keywords: ["meat-seafood", "produce", "dairy"], color: "amber" },
  { id: "deal", name: "Deal Seeker", keywords: [], color: "rose" },
  { id: "new", name: "New Shopper", keywords: [], color: "sky" },
];

export async function GET() {
  const rng = getDailyRng(3721);
  rng(); rng(); // burn first two to avoid seed bias

  // Category metrics
  const categories = CATEGORIES.map((cat) => {
    const catRng = getDailyRng(cat.slug.length * 101 + cat.slug.charCodeAt(0) * 17);
    catRng(); catRng();

    const baseVisits = 2800 + Math.round(catRng() * 4200);
    const bounceRate = 0.18 + catRng() * 0.22;
    const avgBasketSize = 28 + catRng() * 52;
    const purchaseFrequency = 1.4 + catRng() * 2.8; // purchases per shopper per month
    const adAttribution = 0.12 + catRng() * 0.28; // % of purchases with ad exposure
    const cpmPremium = 1.2 + catRng() * 1.8; // x multiplier vs ROS

    const sessionsTrend: number[] = [];
    for (let d = 6; d >= 0; d--) {
      const dayRng = seededRandom(cat.slug.length * 31 + d * 97 + 11);
      dayRng();
      const dayVisits = Math.round(baseVisits * (0.85 + dayRng() * 0.30));
      sessionsTrend.push(dayVisits);
    }

    // Top products in category (synthetic)
    const topProducts = generateTopProducts(cat.slug, catRng);

    return {
      slug: cat.slug,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      description: cat.description,
      advertisers: cat.advertisers,
      metrics: {
        dailySessions: baseVisits,
        weeklyUniqueBuyers: Math.round(baseVisits * 0.38 * (1 - bounceRate)),
        avgBasketSize: parseFloat(avgBasketSize.toFixed(2)),
        purchaseFrequency: parseFloat(purchaseFrequency.toFixed(1)),
        adAttributionRate: parseFloat((adAttribution * 100).toFixed(1)),
        cpmPremiumMultiplier: parseFloat(cpmPremium.toFixed(2)),
        effectiveCpm: parseFloat((3.5 * cpmPremium).toFixed(2)), // ROS base $3.50
        bounceRate: parseFloat((bounceRate * 100).toFixed(1)),
        repeatPurchaseRate: parseFloat((0.42 + catRng() * 0.28).toFixed(2)),
        avgTimeBetweenPurchases: Math.round(7 + catRng() * 21), // days
      },
      sessionsTrend, // last 7 days
      hasActiveAdvertiser: cat.advertisers.length > 0,
      opportunityScore: cat.advertisers.length === 0 ? parseFloat((75 + catRng() * 25).toFixed(0)) : null,
    };
  });

  // Shopper segment breakdown
  const segments = SHOPPER_SEGMENTS.map((seg) => {
    const segRng = getDailyRng(seg.id.length * 133 + seg.id.charCodeAt(0) * 19);
    segRng(); segRng();

    const size = 8000 + Math.round(segRng() * 22000);
    const avgOrderValue = 34 + segRng() * 48;
    const adResponseRate = 0.06 + segRng() * 0.14;
    const ltv90d = avgOrderValue * (1.4 + segRng() * 2.2);
    const cpmMultiplier = 1.1 + segRng() * 1.6;

    // Category affinity scores
    const affinity: Record<string, number> = {};
    CATEGORIES.forEach((cat) => {
      const affinityRng = seededRandom(seg.id.length * 53 + cat.slug.length * 37 + 7);
      affinityRng();
      const isPreferred = seg.keywords.includes(cat.slug);
      affinity[cat.slug] = isPreferred
        ? parseFloat((0.55 + affinityRng() * 0.45).toFixed(2))
        : parseFloat((0.05 + affinityRng() * 0.35).toFixed(2));
    });

    return {
      id: seg.id,
      name: seg.name,
      color: seg.color,
      keywords: seg.keywords,
      metrics: {
        totalShoppers: size,
        avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
        adResponseRate: parseFloat((adResponseRate * 100).toFixed(1)),
        ltv90d: parseFloat(ltv90d.toFixed(2)),
        cpmMultiplier: parseFloat(cpmMultiplier.toFixed(2)),
        effectiveCpm: parseFloat((3.5 * cpmMultiplier).toFixed(2)),
        monthlyActiveRate: parseFloat((0.48 + segRng() * 0.38).toFixed(2)),
        avgSessionsPerMonth: parseFloat((3.2 + segRng() * 6.8).toFixed(1)),
      },
      categoryAffinity: affinity,
    };
  });

  // Purchase time-of-day distribution
  const hourlyPattern: number[] = [];
  for (let h = 0; h < 24; h++) {
    const hourRng = seededRandom(h * 113 + 9999);
    hourRng();
    // Morning peak 7–9am, lunch 11–1pm, evening peak 5–8pm
    const isMorningPeak = h >= 7 && h <= 9;
    const isLunchPeak = h >= 11 && h <= 13;
    const isEveningPeak = h >= 17 && h <= 20;
    const baseLoad = 0.02 + hourRng() * 0.02;
    const peakBonus = isMorningPeak ? 0.08 : isLunchPeak ? 0.06 : isEveningPeak ? 0.10 : 0;
    hourlyPattern.push(parseFloat((baseLoad + peakBonus).toFixed(3)));
  }
  // Normalize to 1.0
  const hourTotal = hourlyPattern.reduce((s, v) => s + v, 0);
  const normalizedHourly = hourlyPattern.map((v) => parseFloat((v / hourTotal).toFixed(3)));

  // Device & session breakdown
  const deviceSplit = {
    mobile: 0.58,
    desktop: 0.31,
    tablet: 0.11,
  };

  // Network summary KPIs
  const totalMonthlyShoppers = 124000;
  const avgOrderValue = 44.20;
  const sponsoredInfluenceRate = 0.34;
  const categoryAdRevenuePotential = categories
    .filter((c) => !c.hasActiveAdvertiser && c.opportunityScore)
    .reduce((s, c) => s + (c.metrics.dailySessions * 30 / 1000) * c.metrics.effectiveCpm * 0.65, 0);

  // Basket composition patterns (cross-category purchase signals)
  const basketPatterns = [
    { primary: "produce", co_purchase: ["dairy", "bakery", "pantry"], rate: 0.72 },
    { primary: "dairy", co_purchase: ["bakery", "produce", "pantry"], rate: 0.68 },
    { primary: "beverages", co_purchase: ["snacks", "produce"], rate: 0.61 },
    { primary: "meat-seafood", co_purchase: ["produce", "pantry", "dairy"], rate: 0.77 },
    { primary: "snacks", co_purchase: ["beverages", "bakery"], rate: 0.55 },
  ];

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    network: {
      totalMonthlyShoppers,
      avgOrderValue,
      sponsoredInfluenceRate: parseFloat((sponsoredInfluenceRate * 100).toFixed(1)),
      categoryAdRevenuePotential: parseFloat(categoryAdRevenuePotential.toFixed(0)),
      activeCategories: CATEGORIES.length,
      categoriesWithAdvertisers: CATEGORIES.filter((c) => c.advertisers.length > 0).length,
    },
    categories,
    segments,
    hourlyPattern: normalizedHourly,
    deviceSplit,
    basketPatterns,
  });
}

function generateTopProducts(
  categorySlug: string,
  rng: () => number
): Array<{ name: string; indexedSales: number; sponsoredShare: number }> {
  const products: Record<string, string[]> = {
    produce: ["Organic Hass Avocado", "Baby Spinach 5oz", "Heirloom Tomatoes", "Rainbow Carrots", "Blueberries 1pt"],
    dairy: ["Organic Whole Milk 1gal", "Greek Yogurt Plain 32oz", "Cage-Free Eggs 12ct", "Sharp Cheddar 8oz", "Unsalted Butter"],
    beverages: ["Liquid I.V. Lemon-Lime 30ct", "Sparkling Water 12pk", "Cold Brew Concentrate", "Kombucha 16oz", "Oat Milk 52oz"],
    bakery: ["Sourdough Loaf", "Everything Bagels 6ct", "Croissants 4pk", "Whole Grain Sandwich Bread", "Baguette"],
    snacks: ["Mixed Nuts 9oz", "Grain-Free Granola Bar 5ct", "Rice Crackers", "Dark Chocolate 70%", "Popcorn Variety"],
    "meat-seafood": ["Atlantic Salmon Fillet 1lb", "Grass-Fed 80/20 Beef 1lb", "Free-Range Chicken Breast", "Shrimp 1lb", "Tuna Steaks"],
    frozen: ["Organic Edamame 16oz", "Earthbound Farm Salad Kit", "Veggie Burger 4pk", "Acai Packets", "Frozen Burritos 8pk"],
    pantry: ["Extra Virgin Olive Oil 33.8oz", "Organic Chicken Broth 32oz", "Pasta Variety 3pk", "Sea Salt", "Almond Butter 16oz"],
  };

  const names = products[categorySlug] || ["Product A", "Product B", "Product C", "Product D", "Product E"];
  return names.map((name) => ({
    name,
    indexedSales: parseFloat((60 + rng() * 140).toFixed(0)), // 0–200 index vs avg
    sponsoredShare: parseFloat((0.08 + rng() * 0.32).toFixed(2)),
  }));
}

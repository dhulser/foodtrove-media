import { NextResponse } from "next/server";

// ─── Seeded PRNG ────────────────────────────────────────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Stable window RNG — changes every N ms
function getWindowRng(windowMs: number, salt: number) {
  const bucket = Math.floor(Date.now() / windowMs);
  return seededRandom(bucket * 9999 + salt);
}

// Per-minute stable RNG for "live" signals
function getMinuteRng(salt: number) {
  return getWindowRng(60_000, salt);
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface PurchaseSignal {
  id: string;
  ts: string;           // ISO timestamp (recent, within last few minutes)
  productName: string;
  productId: string;
  departmentSlug: string;
  departmentName: string;
  tags: string[];
  purchaseValue: number;
  shopperId: string;    // hashed/anonymous
  sessionKeywords: string[];  // what the shopper searched / browsed before purchase
  sponsored: boolean;         // was this purchase influenced by a sponsored ad?
  sponsoredAdvertiser?: string;
}

interface CategorySignal {
  slug: string;
  name: string;
  sessionCount5min: number;
  sessionCount1h: number;
  sessionCount24h: number;
  purchaseCount1h: number;
  purchaseCount24h: number;
  avgOrderValue: number;
  trendDirection: "up" | "flat" | "down";
  trendPct: number;           // vs. same time yesterday
  topSearchTerms: string[];
  activeAdvertisers: string[];
  untargeted: boolean;        // no advertiser targeting this category → opportunity
  cpmFloor: number;
}

interface TrendingKeyword {
  keyword: string;
  count1h: number;
  count24h: number;
  trendPct: number;
  categories: string[];
  advertiserMatch: string | null;  // which advertiser currently targets this keyword (or null)
  opportunityScore: number;        // 0–100: high = high intent + no advertiser = Tyler's pitch
}

interface SignalSummary {
  purchasesLast5min: number;
  purchasesLast1h: number;
  purchasesLast24h: number;
  grossRevenueLast24h: number;
  sponsoredInfluencedLast24h: number;  // purchases influenced by a sponsored ad
  sponsoredInfluencePct: number;
  activeShoppers5min: number;
  activeShoppers1h: number;
  topCategoryNow: string;
  topKeywordNow: string;
  untargetedOpportunities: number;  // # of hot categories with no active advertiser
  estimatedOpportunityRevenue: number;  // $ left on table
}

interface AdvertiserRecommendation {
  advertiserName: string;
  advertiserId: number;
  recommendation: string;
  rationale: string;
  targetKeywords: string[];
  estimatedImpressionLift: number;  // % more impressions if they add this keyword
  priority: "high" | "medium" | "low";
}

interface SignalsPayload {
  summary: SignalSummary;
  recentSignals: PurchaseSignal[];
  categorySignals: CategorySignal[];
  trendingKeywords: TrendingKeyword[];
  advertiserRecommendations: AdvertiserRecommendation[];
  generatedAt: string;
}

// ─── Catalog data (static — categories and products) ─────────────────────────
const DEPARTMENTS = [
  {
    slug: "produce",
    name: "Produce",
    cpmFloor: 7.0,
    products: [
      { id: "p001", name: "Organic Baby Spinach", tags: ["organic", "leafy-greens", "ready-to-eat"] },
      { id: "p002", name: "Hass Avocados", tags: ["fruit", "fresh", "california"] },
      { id: "p003", name: "Organic Strawberries", tags: ["organic", "berries", "fresh"] },
      { id: "p004", name: "Grape Tomatoes", tags: ["tomatoes", "fresh", "salad"] },
      { id: "p005", name: "Organic Bananas", tags: ["organic", "bananas", "fruit"] },
    ],
    avgOrderValue: 8.50,
    activeAdvertisers: ["Earthbound Farm"],
  },
  {
    slug: "dairy",
    name: "Dairy & Eggs",
    cpmFloor: 5.5,
    products: [
      { id: "d001", name: "Organic Whole Milk", tags: ["organic", "milk", "whole"] },
      { id: "d002", name: "Grade A Large Eggs", tags: ["eggs", "pasture-raised", "premium"] },
      { id: "d003", name: "Greek Yogurt", tags: ["yogurt", "protein", "probiotic"] },
      { id: "d004", name: "Sharp Cheddar", tags: ["cheese", "cheddar", "snack"] },
      { id: "d005", name: "Unsalted Butter", tags: ["butter", "baking", "dairy"] },
    ],
    avgOrderValue: 11.20,
    activeAdvertisers: ["Organic Valley"],
  },
  {
    slug: "beverages",
    name: "Beverages",
    cpmFloor: 6.0,
    products: [
      { id: "b001", name: "Sparkling Water, Lime", tags: ["sparkling", "water", "lime"] },
      { id: "b002", name: "Cold Brew Coffee", tags: ["coffee", "cold-brew", "organic"] },
      { id: "b003", name: "Orange Juice, No Pulp", tags: ["juice", "oj", "vitamin-c"] },
      { id: "b004", name: "Liquid I.V. Lemon Lime", tags: ["hydration", "electrolytes", "sports"] },
      { id: "b005", name: "Green Tea, Unsweetened", tags: ["tea", "green-tea", "antioxidants"] },
    ],
    avgOrderValue: 14.80,
    activeAdvertisers: ["Liquid I.V."],
  },
  {
    slug: "snacks",
    name: "Snacks & Chips",
    cpmFloor: 5.0,
    products: [
      { id: "s001", name: "Sea Salt Kettle Chips", tags: ["chips", "kettle", "salty"] },
      { id: "s002", name: "Almond Butter Packets", tags: ["nut-butter", "almond", "protein"] },
      { id: "s003", name: "Dark Chocolate Almonds", tags: ["chocolate", "almonds", "snack"] },
      { id: "s004", name: "Kind Bar, Dark Chocolate", tags: ["bar", "protein", "gluten-free"] },
      { id: "s005", name: "Rice Cakes, Cheddar", tags: ["rice-cakes", "light", "snack"] },
    ],
    avgOrderValue: 9.20,
    activeAdvertisers: [],  // UNTARGETED — opportunity
  },
  {
    slug: "bakery",
    name: "Bakery & Bread",
    cpmFloor: 4.5,
    products: [
      { id: "bk001", name: "Sourdough Boule", tags: ["bread", "sourdough", "artisan"] },
      { id: "bk002", name: "Everything Bagels", tags: ["bagels", "bread", "breakfast"] },
      { id: "bk003", name: "Croissants, Butter", tags: ["croissants", "pastry", "breakfast"] },
    ],
    avgOrderValue: 7.80,
    activeAdvertisers: [],  // UNTARGETED — opportunity
  },
  {
    slug: "meat-seafood",
    name: "Meat & Seafood",
    cpmFloor: 8.0,
    products: [
      { id: "m001", name: "Organic Chicken Breast", tags: ["chicken", "organic", "protein"] },
      { id: "m002", name: "Grass-Fed Ground Beef", tags: ["beef", "grass-fed", "protein"] },
      { id: "m003", name: "Wild Atlantic Salmon", tags: ["salmon", "seafood", "omega-3"] },
    ],
    avgOrderValue: 22.40,
    activeAdvertisers: [],  // UNTARGETED — high AOV opportunity
  },
  {
    slug: "frozen",
    name: "Frozen Foods",
    cpmFloor: 5.0,
    products: [
      { id: "fr001", name: "Organic Mixed Vegetables", tags: ["organic", "vegetables", "frozen"] },
      { id: "fr002", name: "Cauliflower Crust Pizza", tags: ["pizza", "frozen", "grain-free"] },
      { id: "fr003", name: "Edamame, Shelled", tags: ["edamame", "protein", "frozen"] },
    ],
    avgOrderValue: 12.60,
    activeAdvertisers: [],  // UNTARGETED
  },
  {
    slug: "household",
    name: "Household & Cleaning",
    cpmFloor: 3.5,
    products: [
      { id: "h001", name: "Dish Soap, Dawn Original", tags: ["cleaning", "dish-soap", "kitchen"] },
      { id: "h002", name: "Multi-Surface Spray", tags: ["cleaning", "multi-surface", "eco"] },
      { id: "h003", name: "Paper Towels, 6-pack", tags: ["paper-towels", "cleaning", "essentials"] },
    ],
    avgOrderValue: 16.90,
    activeAdvertisers: [],  // UNTARGETED
  },
];

const ADVERTISER_MAP: Record<string, number> = {
  "Organic Valley": 6254651,
  "Liquid I.V.": 6256255,
  "Earthbound Farm": 6256266,
};

// ─── Signal generation ────────────────────────────────────────────────────────
function generateRecentSignals(count: number, rng: () => number): PurchaseSignal[] {
  const signals: PurchaseSignal[] = [];
  const now = Date.now();

  const sponsoredByDept: Record<string, string> = {
    produce: "Earthbound Farm",
    dairy: "Organic Valley",
    beverages: "Liquid I.V.",
  };

  const depts = DEPARTMENTS.filter((d) => d.products.length > 0);

  for (let i = 0; i < count; i++) {
    const minutesAgo = rng() * 12; // within last 12 minutes
    const ts = new Date(now - minutesAgo * 60_000).toISOString();
    const deptIdx = Math.floor(rng() * depts.length);
    const dept = depts[deptIdx];
    const prodIdx = Math.floor(rng() * dept.products.length);
    const product = dept.products[prodIdx];
    const sponsored = dept.activeAdvertisers.length > 0 && rng() > 0.35;
    const purchaseValue = dept.avgOrderValue * (0.8 + rng() * 0.5);
    const shopperId = `sh_${Math.floor(rng() * 9999).toString().padStart(4, "0")}`;

    // Session keywords: mix of product tags + dept slug + search terms
    const searchTermPool = [...product.tags, dept.slug, "sale", "organic", "fresh", "quick-ship"];
    const keywordCount = 2 + Math.floor(rng() * 3);
    const sessionKeywords: string[] = [];
    for (let k = 0; k < keywordCount; k++) {
      const kw = searchTermPool[Math.floor(rng() * searchTermPool.length)];
      if (!sessionKeywords.includes(kw)) sessionKeywords.push(kw);
    }

    signals.push({
      id: `sig_${(now - i * 1000).toString(16).slice(-8)}`,
      ts,
      productName: product.name,
      productId: product.id,
      departmentSlug: dept.slug,
      departmentName: dept.name,
      tags: product.tags,
      purchaseValue: Math.round(purchaseValue * 100) / 100,
      shopperId,
      sessionKeywords,
      sponsored,
      sponsoredAdvertiser: sponsored ? sponsoredByDept[dept.slug] : undefined,
    });
  }

  // Sort by ts descending (most recent first)
  return signals.sort((a, b) => b.ts.localeCompare(a.ts));
}

function generateCategorySignals(rng: () => number): CategorySignal[] {
  const rng24h = getWindowRng(3_600_000 * 24, 9901); // daily stable base
  const categories: CategorySignal[] = [];

  for (const dept of DEPARTMENTS) {
    const baseSessions1h = 15 + Math.floor(rng() * 80);
    const sessions24h = baseSessions1h * (18 + Math.floor(rng24h() * 12));
    const purchases1h = Math.floor(baseSessions1h * (0.12 + rng() * 0.20));
    const purchases24h = Math.floor(sessions24h * (0.12 + rng24h() * 0.18));
    const trendPct = (rng() - 0.45) * 40; // -18% to +22%
    const trendDirection: "up" | "flat" | "down" =
      trendPct > 5 ? "up" : trendPct < -5 ? "down" : "flat";

    const topSearchTerms = dept.products.flatMap((p) => p.tags).slice(0, 4);
    const sessions5min = Math.floor(baseSessions1h * (0.06 + rng() * 0.10));

    categories.push({
      slug: dept.slug,
      name: dept.name,
      sessionCount5min: sessions5min,
      sessionCount1h: baseSessions1h,
      sessionCount24h: sessions24h,
      purchaseCount1h: purchases1h,
      purchaseCount24h: purchases24h,
      avgOrderValue: dept.avgOrderValue,
      trendDirection,
      trendPct: Math.round(trendPct * 10) / 10,
      topSearchTerms,
      activeAdvertisers: dept.activeAdvertisers,
      untargeted: dept.activeAdvertisers.length === 0,
      cpmFloor: dept.cpmFloor,
    });
  }

  // Sort: highest session count first
  return categories.sort((a, b) => b.sessionCount1h - a.sessionCount1h);
}

function generateTrendingKeywords(categorySignals: CategorySignal[], rng: () => number): TrendingKeyword[] {
  const kwMap: Map<string, { count1h: number; count24h: number; cats: Set<string> }> = new Map();

  // Aggregate from category search terms + boost with purchase signals
  for (const cat of categorySignals) {
    for (const kw of cat.topSearchTerms) {
      const existing = kwMap.get(kw) ?? { count1h: 0, count24h: 0, cats: new Set() };
      existing.count1h += Math.floor(cat.sessionCount1h * (0.08 + rng() * 0.15));
      existing.count24h += Math.floor(cat.sessionCount24h * (0.06 + rng() * 0.12));
      existing.cats.add(cat.slug);
      kwMap.set(kw, existing);
    }
  }

  // Known advertiser keyword targets
  const advertiserKeywords: Record<string, string> = {
    organic: "Earthbound Farm",
    produce: "Earthbound Farm",
    fresh: "Earthbound Farm",
    hydration: "Liquid I.V.",
    electrolytes: "Liquid I.V.",
    milk: "Organic Valley",
    "leafy-greens": "Earthbound Farm",
  };

  const keywords: TrendingKeyword[] = [];
  for (const [kw, data] of kwMap.entries()) {
    const advertiserMatch = advertiserKeywords[kw] ?? null;
    const trendPct = (rng() - 0.38) * 50;
    // Opportunity score: high count + no advertiser match = high score
    const demandScore = Math.min(data.count1h / 30, 1);
    const gapScore = advertiserMatch ? 0 : 1;
    const opportunityScore = Math.round((demandScore * 0.6 + gapScore * 0.4) * 100);

    keywords.push({
      keyword: kw,
      count1h: data.count1h,
      count24h: data.count24h,
      trendPct: Math.round(trendPct * 10) / 10,
      categories: Array.from(data.cats),
      advertiserMatch,
      opportunityScore,
    });
  }

  // Sort by count1h desc
  return keywords.sort((a, b) => b.count1h - a.count1h).slice(0, 20);
}

function generateSummary(
  recentSignals: PurchaseSignal[],
  categories: CategorySignal[],
  rng: () => number
): SignalSummary {
  const rng24h = getWindowRng(86_400_000, 4421);

  const purchasesLast5min = recentSignals.length;
  const purchasesLast1h = Math.floor(purchasesLast5min * (9 + rng() * 5));
  const purchasesLast24h = Math.floor(purchasesLast1h * (20 + rng24h() * 8));
  const grossRevenueLast24h = purchasesLast24h * (11 + rng24h() * 6);
  const sponsoredInfluencedLast24h = Math.floor(purchasesLast24h * (0.22 + rng24h() * 0.12));
  const sponsoredInfluencePct =
    purchasesLast24h > 0
      ? Math.round((sponsoredInfluencedLast24h / purchasesLast24h) * 1000) / 10
      : 0;
  const activeShoppers5min = Math.floor(purchasesLast5min * (4 + rng() * 6));
  const activeShoppers1h = Math.floor(activeShoppers5min * (11 + rng() * 5));
  const topCategory = categories[0]?.name ?? "Produce";
  const untargetedCategories = categories.filter((c) => c.untargeted);
  const estimatedOpportunityRevenue = untargetedCategories.reduce((sum, c) => {
    return sum + (c.purchaseCount24h * c.avgOrderValue * 0.008 * c.cpmFloor);
  }, 0);

  return {
    purchasesLast5min,
    purchasesLast1h,
    purchasesLast24h,
    grossRevenueLast24h: Math.round(grossRevenueLast24h * 100) / 100,
    sponsoredInfluencedLast24h,
    sponsoredInfluencePct,
    activeShoppers5min,
    activeShoppers1h,
    topCategoryNow: topCategory,
    topKeywordNow: "organic",
    untargetedOpportunities: untargetedCategories.length,
    estimatedOpportunityRevenue: Math.round(estimatedOpportunityRevenue * 100) / 100,
  };
}

function generateAdvertiserRecommendations(
  categories: CategorySignal[],
  keywords: TrendingKeyword[],
  rng: () => number
): AdvertiserRecommendation[] {
  const recs: AdvertiserRecommendation[] = [];

  // Find high-opportunity untargeted categories for Tyler to pitch
  const hotUntargeted = categories
    .filter((c) => c.untargeted && c.sessionCount1h > 30)
    .slice(0, 3);

  for (const cat of hotUntargeted) {
    const estimatedLift = Math.round(25 + rng() * 40);
    recs.push({
      advertiserName: "New CPG Prospect",
      advertiserId: 0,
      recommendation: `Target "${cat.name}" — ${cat.sessionCount1h} sessions/hr, no active advertiser`,
      rationale: `${cat.sessionCount1h} sessions in the past hour with no competing advertiser. CPM floor $${cat.cpmFloor}. Avg order value $${cat.avgOrderValue}. First-mover advantage.`,
      targetKeywords: cat.topSearchTerms.slice(0, 3),
      estimatedImpressionLift: estimatedLift,
      priority: cat.sessionCount1h > 50 ? "high" : "medium",
    });
  }

  // For existing advertisers: find keyword expansion opportunities
  const topOpportunityKws = keywords
    .filter((k) => k.opportunityScore > 60 && !k.advertiserMatch)
    .slice(0, 2);

  for (const kw of topOpportunityKws) {
    recs.push({
      advertiserName: "Organic Valley",
      advertiserId: ADVERTISER_MAP["Organic Valley"],
      recommendation: `Add keyword "${kw.keyword}" — ${kw.count1h} searches/hr, unclaimed`,
      rationale: `${kw.count1h} searches in the past hour. No advertiser currently targets this keyword. Organic Valley's organic product line is a natural fit. Opportunity score: ${kw.opportunityScore}/100.`,
      targetKeywords: [kw.keyword],
      estimatedImpressionLift: Math.round(12 + rng() * 20),
      priority: kw.count1h > 20 ? "high" : "low",
    });
  }

  // Liquid I.V. — sports / hydration spike detection
  const hydrationCat = categories.find((c) => c.slug === "beverages");
  if (hydrationCat && hydrationCat.trendDirection === "up") {
    recs.push({
      advertiserName: "Liquid I.V.",
      advertiserId: ADVERTISER_MAP["Liquid I.V."],
      recommendation: `Beverages trending +${hydrationCat.trendPct}% — consider budget increase`,
      rationale: `Beverages category is up ${hydrationCat.trendPct}% vs. yesterday. Liquid I.V. is the only active advertiser here. Increasing impression cap during peak demand captures higher-intent shoppers at current CPM.`,
      targetKeywords: ["hydration", "electrolytes", "sports-drink"],
      estimatedImpressionLift: Math.round(15 + rng() * 25),
      priority: "medium",
    });
  }

  return recs.slice(0, 5);
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET() {
  const rng = getMinuteRng(7731);
  const rng2 = getMinuteRng(8821);

  const recentSignals = generateRecentSignals(18, rng);
  const categorySignals = generateCategorySignals(rng2);
  const trendingKeywords = generateTrendingKeywords(categorySignals, getMinuteRng(3311));
  const summary = generateSummary(recentSignals, categorySignals, getMinuteRng(1122));
  const advertiserRecommendations = generateAdvertiserRecommendations(
    categorySignals,
    trendingKeywords,
    getMinuteRng(5543)
  );

  const payload: SignalsPayload = {
    summary,
    recentSignals,
    categorySignals,
    trendingKeywords,
    advertiserRecommendations,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}

import { NextResponse } from "next/server";

// Audience Segments API — shopper cohorts with keyword targeting and CPM premium data
// Combines behavioral segments, Kevel keyword routing, and purchase-signal-based targeting

const KEVEL_API_KEY = process.env.KEVEL_API_KEY;

async function kevelGet(path: string) {
  const res = await fetch(`https://api.kevel.co/v1${path}`, {
    headers: {
      "X-Adzerk-ApiKey": KEVEL_API_KEY || "",
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export async function GET() {
  const windowSeed = Math.floor(Date.now() / 120000); // 2-min windows
  const rng = seededRandom(windowSeed);

  // Fetch active flights to get real keyword targeting data
  let keywordsByFlight: Array<{ flightName: string; keywords: string; advertiserId: number; cpm: number }> = [];
  try {
    const advertiserIds = [1, 2, 3, 4, 5];
    for (const advId of advertiserIds) {
      const campaignsData = await kevelGet(`/campaigns?advertiserId=${advId}&pageSize=50`);
      if (!campaignsData?.items) continue;
      for (const campaign of campaignsData.items.slice(0, 5)) {
        const flightData = await kevelGet(`/flights?campaignId=${campaign.Id}&pageSize=10`);
        if (!flightData?.items) continue;
        for (const flight of flightData.items) {
          if (flight.Keywords && flight.IsActive) {
            keywordsByFlight.push({
              flightName: flight.Name || `Flight ${flight.Id}`,
              keywords: flight.Keywords,
              advertiserId: advId,
              cpm: flight.Price?.CPM || 0,
            });
          }
        }
      }
    }
  } catch {
    // Proceed with synthetic data
  }

  // Derive active keyword set from live flights (with fallbacks)
  const liveKeywords = new Set<string>();
  for (const entry of keywordsByFlight) {
    const kws = entry.keywords.split(",").map((k) => k.trim()).filter(Boolean);
    kws.forEach((kw) => liveKeywords.add(kw));
  }

  // Segment definitions — behavioral + keyword-based shopper cohorts
  const segments = [
    {
      id: "organic-enthusiast",
      name: "Organic Enthusiast",
      description: "Shoppers who buy organic products in 3+ of the last 4 visits. Highest basket value segment.",
      keywords: ["organic", "natural", "fresh", "produce"],
      behaviorSignals: ["organic dept visit", "organic product view", "organic add-to-cart"],
      matchedKeywords: keywordsByFlight
        .filter((f) => ["organic", "produce", "fresh"].some((k) => f.keywords.toLowerCase().includes(k)))
        .map((f) => f.flightName),
      shopperCount: 48000 + Math.floor(rng() * 4000),
      avgBasketSize: 68.5 + rng() * 8,
      purchaseFrequencyPerWeek: 2.8 + rng() * 0.4,
      premiumCpmMultiplier: 1.45,
      cpmFloor: 10.5,
      conversionRate: 4.2 + rng() * 0.8,
      retentionScore: 87 + Math.floor(rng() * 8),
      topCategories: ["Fresh Produce", "Organic & Natural", "Dairy & Eggs"],
      topAdvertisers: ["FreshFarm Organics", "GreenLeaf Farms"],
      liveKeywords: ["organic", "natural", "produce", "fresh"],
      isLive: true,
      segment_value: "premium",
    },
    {
      id: "family-staples",
      name: "Family Staples Buyer",
      description: "High-volume, high-frequency shoppers focused on pantry and family essentials. Largest segment by volume.",
      keywords: ["pantry", "staples", "family", "bulk", "dairy", "eggs"],
      behaviorSignals: ["repeat category purchases", "large cart (7+ items)", "pantry dept dominant"],
      matchedKeywords: keywordsByFlight
        .filter((f) => ["pantry", "dairy", "staples"].some((k) => f.keywords.toLowerCase().includes(k)))
        .map((f) => f.flightName),
      shopperCount: 72000 + Math.floor(rng() * 6000),
      avgBasketSize: 52.0 + rng() * 5,
      purchaseFrequencyPerWeek: 2.3 + rng() * 0.3,
      premiumCpmMultiplier: 1.2,
      cpmFloor: 7.5,
      conversionRate: 5.8 + rng() * 0.6,
      retentionScore: 79 + Math.floor(rng() * 6),
      topCategories: ["Pantry & Dry Goods", "Dairy & Eggs", "Snacks & Beverages"],
      topAdvertisers: ["NutriPeak Nutrition", "FreshFarm Organics"],
      liveKeywords: ["pantry", "dairy", "eggs", "snacks"],
      isLive: true,
      segment_value: "mass",
    },
    {
      id: "health-conscious",
      name: "Health-Conscious Shopper",
      description: "Regularly buys health foods, supplements, and low-processed items. Strong NutriPeak overlap.",
      keywords: ["health", "nutrition", "protein", "supplements", "vitamins", "whole-grain"],
      behaviorSignals: ["health dept visit", "nutrition label hover", "organic filter usage"],
      matchedKeywords: keywordsByFlight
        .filter((f) => ["health", "nutrition", "protein"].some((k) => f.keywords.toLowerCase().includes(k)))
        .map((f) => f.flightName),
      shopperCount: 38000 + Math.floor(rng() * 3000),
      avgBasketSize: 61.0 + rng() * 7,
      purchaseFrequencyPerWeek: 1.9 + rng() * 0.4,
      premiumCpmMultiplier: 1.38,
      cpmFloor: 9.5,
      conversionRate: 3.6 + rng() * 0.5,
      retentionScore: 82 + Math.floor(rng() * 6),
      topCategories: ["Organic & Natural", "Pantry & Dry Goods", "Fresh Produce"],
      topAdvertisers: ["NutriPeak Nutrition", "GreenLeaf Farms"],
      liveKeywords: ["health", "nutrition", "protein", "organic"],
      isLive: true,
      segment_value: "premium",
    },
    {
      id: "deal-seeker",
      name: "Deal Seeker",
      description: "Price-sensitive shoppers who frequently visit /deals and clip digital coupons. High volume, lower CPM.",
      keywords: ["deals", "sale", "discount", "promo", "coupon"],
      behaviorSignals: ["deals page visit", "sale filter usage", "high cart-to-purchase abandon"],
      matchedKeywords: [],
      shopperCount: 29000 + Math.floor(rng() * 4000),
      avgBasketSize: 34.0 + rng() * 4,
      purchaseFrequencyPerWeek: 1.4 + rng() * 0.3,
      premiumCpmMultiplier: 0.85,
      cpmFloor: 5.0,
      conversionRate: 7.2 + rng() * 0.8,
      retentionScore: 61 + Math.floor(rng() * 8),
      topCategories: ["Snacks & Beverages", "Pantry & Dry Goods", "Dairy & Eggs"],
      topAdvertisers: [],
      liveKeywords: [],
      isLive: false,
      segment_value: "value",
      note: "No active advertisers targeting this segment — opportunity for new advertiser acquisition",
    },
    {
      id: "premium-fresh",
      name: "Premium Fresh Buyer",
      description: "High-AOV shoppers who prioritize fresh, premium, and specialty items. GreenLeaf Farms' core audience.",
      keywords: ["premium", "fresh", "specialty", "produce", "local", "seasonal"],
      behaviorSignals: ["premium product views", "high per-item spend", "specialty dept visits"],
      matchedKeywords: keywordsByFlight
        .filter((f) => ["premium", "fresh", "produce", "seasonal"].some((k) => f.keywords.toLowerCase().includes(k)))
        .map((f) => f.flightName),
      shopperCount: 21000 + Math.floor(rng() * 2000),
      avgBasketSize: 89.0 + rng() * 10,
      purchaseFrequencyPerWeek: 1.6 + rng() * 0.3,
      premiumCpmMultiplier: 1.65,
      cpmFloor: 12.5,
      conversionRate: 3.1 + rng() * 0.4,
      retentionScore: 91 + Math.floor(rng() * 5),
      topCategories: ["Fresh Produce", "Organic & Natural", "Specialty"],
      topAdvertisers: ["GreenLeaf Farms", "FreshFarm Organics"],
      liveKeywords: ["premium", "fresh", "produce", "seasonal", "local"],
      isLive: true,
      segment_value: "premium",
    },
    {
      id: "new-shopper",
      name: "New & Trial Shopper",
      description: "First-time or low-frequency shoppers still establishing habits. High conversion opportunity for awareness buys.",
      keywords: ["new", "first-order", "trial"],
      behaviorSignals: ["first purchase", "browsing multiple depts", "search-dominant sessions"],
      matchedKeywords: [],
      shopperCount: 16000 + Math.floor(rng() * 3000),
      avgBasketSize: 28.5 + rng() * 5,
      purchaseFrequencyPerWeek: 0.6 + rng() * 0.2,
      premiumCpmMultiplier: 1.1,
      cpmFloor: 7.0,
      conversionRate: 2.4 + rng() * 0.5,
      retentionScore: 42 + Math.floor(rng() * 10),
      topCategories: ["Pantry & Dry Goods", "Snacks & Beverages", "Dairy & Eggs"],
      topAdvertisers: ["NutriPeak Nutrition"],
      liveKeywords: [],
      isLive: false,
      segment_value: "awareness",
      note: "Awareness campaigns most effective here — high CPM not justified without retention data",
    },
  ];

  // Keyword targeting map — which Kevel keywords route to which segments
  const keywordTargetingMap = [
    { keyword: "produce", segments: ["organic-enthusiast", "premium-fresh"], activeBidders: 2, avgCpm: 9.2, contextualLift: 41 },
    { keyword: "organic", segments: ["organic-enthusiast", "health-conscious"], activeBidders: 2, avgCpm: 10.5, contextualLift: 48 },
    { keyword: "fresh", segments: ["organic-enthusiast", "premium-fresh"], activeBidders: 2, avgCpm: 9.8, contextualLift: 38 },
    { keyword: "dairy", segments: ["family-staples"], activeBidders: 1, avgCpm: 7.5, contextualLift: 22 },
    { keyword: "snacks", segments: ["family-staples", "deal-seeker"], activeBidders: 1, avgCpm: 6.8, contextualLift: 18 },
    { keyword: "health", segments: ["health-conscious"], activeBidders: 1, avgCpm: 9.0, contextualLift: 35 },
    { keyword: "nutrition", segments: ["health-conscious"], activeBidders: 1, avgCpm: 8.8, contextualLift: 32 },
    { keyword: "protein", segments: ["health-conscious"], activeBidders: 1, avgCpm: 8.5, contextualLift: 30 },
    { keyword: "premium", segments: ["premium-fresh"], activeBidders: 1, avgCpm: 13.5, contextualLift: 62 },
    { keyword: "seasonal", segments: ["premium-fresh", "organic-enthusiast"], activeBidders: 1, avgCpm: 12.0, contextualLift: 55 },
    { keyword: "pantry", segments: ["family-staples"], activeBidders: 1, avgCpm: 7.0, contextualLift: 20 },
    { keyword: "deals", segments: ["deal-seeker"], activeBidders: 0, avgCpm: 5.0, contextualLift: 8 },
  ].map((kw) => ({
    ...kw,
    isLive: liveKeywords.has(kw.keyword),
    avgCpm: kw.avgCpm * (1 + rng() * 0.05),
  }));

  // Network audience summary
  const totalShoppers = segments.reduce((sum, s) => sum + s.shopperCount, 0);
  const premiumSegments = segments.filter((s) => s.segment_value === "premium");
  const avgPremiumCpmMultiplier = premiumSegments.reduce((sum, s) => sum + s.premiumCpmMultiplier, 0) / premiumSegments.length;

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    summary: {
      totalShoppers,
      totalSegments: segments.length,
      liveSegments: segments.filter((s) => s.isLive).length,
      premiumSegmentShare: Math.round((premiumSegments.reduce((sum, s) => sum + s.shopperCount, 0) / totalShoppers) * 100),
      avgPremiumCpmMultiplier: parseFloat(avgPremiumCpmMultiplier.toFixed(2)),
      activeKeywords: liveKeywords.size,
    },
    segments,
    keywordTargetingMap,
    targetingStrategy: {
      method: "Keyword-based contextual targeting via Kevel Decision API",
      signal: "Department page slug + product tags passed as keywords at ad request time",
      coverage: "Organic, dairy, pantry, snacks, fresh, health, nutrition, produce, protein, premium, seasonal",
      notYetCovered: "Deals/promotional segments — no active advertiser bids",
      searchSignal: "Search queries tokenized and passed as keywords for sponsored search",
    },
  });
}

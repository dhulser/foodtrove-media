import { NextResponse } from "next/server";

// Rate card data API — media kit and CPM structure for sales conversations
// Combines format specs, live Kevel flight CPMs, and package pricing

const KEVEL_API_KEY = process.env.KEVEL_API_KEY;
const KEVEL_NETWORK_ID = process.env.KEVEL_NETWORK_ID || "12024";

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

// Deterministic PRNG for stable demo data
function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export async function GET() {
  const windowSeed = Math.floor(Date.now() / 300000); // 5-min windows
  const rng = seededRandom(windowSeed);

  // Fetch all flights from Kevel to get real CPM data
  let flights: Array<{ Id: number; Name: string; Price: { CPC: number; CPM: number }; Keywords: string; IsActive: boolean }> = [];
  try {
    const campaignsRes = await kevelGet("/campaigns?advertiserId=1");
    // Fetch all campaigns we know about
    const advertiserIds = [1, 2, 3, 4, 5];
    const allFlights: typeof flights = [];
    
    for (const advId of advertiserIds) {
      const campaignsData = await kevelGet(`/campaigns?advertiserId=${advId}&pageSize=50`);
      if (!campaignsData?.items) continue;
      for (const campaign of campaignsData.items.slice(0, 5)) {
        const flightData = await kevelGet(`/flights?campaignId=${campaign.Id}&pageSize=20`);
        if (flightData?.items) {
          allFlights.push(...flightData.items);
        }
      }
    }
    flights = allFlights;
  } catch {
    // Use synthetic data if API unavailable
  }

  // Extract CPM by ad type from live flights (fallback to defaults)
  const cpmByFormat: Record<string, number[]> = {
    billboard: [],
    leaderboard: [],
    mrec: [],
  };

  for (const flight of flights) {
    const cpm = flight.Price?.CPM;
    if (!cpm || cpm <= 0) continue;
    const name = (flight.Name || "").toLowerCase();
    if (name.includes("billboard") || name.includes("970")) {
      cpmByFormat.billboard.push(cpm);
    } else if (name.includes("leaderboard") || name.includes("728")) {
      cpmByFormat.leaderboard.push(cpm);
    } else if (name.includes("mrec") || name.includes("300")) {
      cpmByFormat.mrec.push(cpm);
    }
  }

  const avg = (arr: number[], fallback: number) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : fallback;

  const billboardAvgCpm = avg(cpmByFormat.billboard, 9.5);
  const leaderboardAvgCpm = avg(cpmByFormat.leaderboard, 7.5);
  const mrecAvgCpm = avg(cpmByFormat.mrec, 6.5);

  // Network-level metrics (deterministic simulation)
  const monthlyUniqueShoppers = 124000 + Math.floor(rng() * 8000);
  const monthlyPageviews = 892000 + Math.floor(rng() * 40000);
  const avgSessionDuration = 4.2 + rng() * 0.6;
  const avgItemsPerCart = 7.3 + rng() * 0.8;
  const groceryAffinityScore = 94 + Math.floor(rng() * 4);

  // Format definitions
  const formats = [
    {
      id: "billboard",
      name: "Hero Billboard",
      dimensions: "970×250",
      placement: "Homepage hero, above the fold",
      placements: ["home-hero-billboard", "dept-hero-billboard"],
      floorCpm: 8.0,
      avgCpm: parseFloat(billboardAvgCpm.toFixed(2)),
      premiumCpm: parseFloat((billboardAvgCpm * 1.4).toFixed(2)),
      monthlyImpressions: 312000 + Math.floor(rng() * 20000),
      viewability: 88 + Math.floor(rng() * 5),
      clickRate: 0.42 + rng() * 0.12,
      contextualLift: 34 + Math.floor(rng() * 8),
      minSpend: 2500,
      specs: {
        maxFileSize: "200KB",
        formats: ["HTML5", "JPEG", "PNG", "GIF"],
        animation: "15s max, no auto-audio",
        safeZone: "40px all sides",
      },
    },
    {
      id: "leaderboard",
      name: "Mid-Page Leaderboard",
      dimensions: "728×90",
      placement: "Below department nav, deals page",
      placements: ["home-mid-leaderboard", "dept-leaderboard", "search-leaderboard"],
      floorCpm: 6.0,
      avgCpm: parseFloat(leaderboardAvgCpm.toFixed(2)),
      premiumCpm: parseFloat((leaderboardAvgCpm * 1.4).toFixed(2)),
      monthlyImpressions: 485000 + Math.floor(rng() * 30000),
      viewability: 79 + Math.floor(rng() * 6),
      clickRate: 0.28 + rng() * 0.09,
      contextualLift: 28 + Math.floor(rng() * 6),
      minSpend: 1500,
      specs: {
        maxFileSize: "150KB",
        formats: ["HTML5", "JPEG", "PNG", "GIF"],
        animation: "15s max, no auto-audio",
        safeZone: "20px top/bottom",
      },
    },
    {
      id: "mrec",
      name: "Right-Rail MRec",
      dimensions: "300×250",
      placement: "Product pages, department sidebar, cart",
      placements: ["sidebar-mrec", "product-mrec", "cart-mrec"],
      floorCpm: 5.0,
      avgCpm: parseFloat(mrecAvgCpm.toFixed(2)),
      premiumCpm: parseFloat((mrecAvgCpm * 1.4).toFixed(2)),
      monthlyImpressions: 628000 + Math.floor(rng() * 40000),
      viewability: 84 + Math.floor(rng() * 5),
      clickRate: 0.35 + rng() * 0.10,
      contextualLift: 41 + Math.floor(rng() * 8),
      minSpend: 1000,
      specs: {
        maxFileSize: "150KB",
        formats: ["HTML5", "JPEG", "PNG", "GIF"],
        animation: "15s max, no auto-audio",
        safeZone: "10px all sides",
      },
    },
    {
      id: "sponsored-search",
      name: "Sponsored Search Shelf",
      dimensions: "Native / Responsive",
      placement: "Above organic search results",
      placements: ["sponsored-search"],
      floorCpm: 14.0,
      avgCpm: 16.5,
      premiumCpm: 22.0,
      monthlyImpressions: 89000 + Math.floor(rng() * 8000),
      viewability: 96 + Math.floor(rng() * 3),
      clickRate: 1.8 + rng() * 0.4,
      contextualLift: 68 + Math.floor(rng() * 8),
      minSpend: 500,
      specs: {
        maxFileSize: "N/A (native)",
        formats: ["Product image + copy"],
        animation: "None",
        safeZone: "N/A",
      },
    },
    {
      id: "brand-page",
      name: "Sponsored Brand Page",
      dimensions: "Full page",
      placement: "/brands/[slug] landing page",
      placements: ["brand-page"],
      floorCpm: 0,
      avgCpm: 0,
      premiumCpm: 0,
      monthlyImpressions: 18000 + Math.floor(rng() * 3000),
      viewability: 91 + Math.floor(rng() * 4),
      clickRate: 2.1 + rng() * 0.5,
      contextualLift: 0,
      minSpend: 5000,
      pricingModel: "flat_monthly",
      monthlyRate: 4500,
      specs: {
        maxFileSize: "N/A (custom build)",
        formats: ["Full-page branded experience"],
        animation: "Custom",
        safeZone: "N/A",
      },
    },
  ];

  // Package deals
  const packages = [
    {
      id: "awareness",
      name: "Brand Awareness Starter",
      description: "Homepage billboard + mid-page leaderboard across all dept pages",
      includes: ["billboard", "leaderboard"],
      impressions: 400000,
      duration: "30 days",
      listPrice: 4200,
      packageCpm: 10.5,
      discount: 8,
      minBudget: 3800,
      targetPersona: "New advertisers testing awareness",
      tag: "Bestseller",
    },
    {
      id: "contextual",
      name: "Contextual Commerce",
      description: "MRec + sponsored search targeting your category keywords. Highest purchase-intent audience.",
      includes: ["mrec", "sponsored-search"],
      impressions: 250000,
      duration: "30 days",
      listPrice: 5500,
      packageCpm: 13.75,
      discount: 12,
      minBudget: 4800,
      targetPersona: "CPG brands with specific category focus",
      tag: "Recommended",
    },
    {
      id: "full-funnel",
      name: "Full-Funnel Domination",
      description: "All 3 display formats + sponsored search + brand page. Complete FoodTrove presence.",
      includes: ["billboard", "leaderboard", "mrec", "sponsored-search", "brand-page"],
      impressions: 650000,
      duration: "30 days",
      listPrice: 14500,
      packageCpm: 9.8,
      discount: 20,
      minBudget: 11600,
      targetPersona: "Premium CPG partners — renewal / upsell",
      tag: "Best Value",
    },
    {
      id: "brand-launch",
      name: "Brand Launch Blitz",
      description: "Sponsored brand page + billboard + contextual search for 14 days. Concentrated impact.",
      includes: ["brand-page", "billboard", "sponsored-search"],
      impressions: 180000,
      duration: "14 days",
      listPrice: 7200,
      packageCpm: 18.0,
      discount: 10,
      minBudget: 6500,
      targetPersona: "New product launches and seasonal pushes",
      tag: "Seasonal",
    },
  ];

  // Audience summary (for the media kit pitch)
  const audience = {
    monthlyUniqueShoppers,
    monthlyPageviews,
    avgSessionDuration: parseFloat(avgSessionDuration.toFixed(1)),
    avgItemsPerCart: parseFloat(avgItemsPerCart.toFixed(1)),
    groceryAffinityScore,
    topCategories: [
      { name: "Fresh Produce", share: 31 + Math.floor(rng() * 4), avgBasket: 38.5 },
      { name: "Pantry & Dry Goods", share: 24 + Math.floor(rng() * 3), avgBasket: 42.0 },
      { name: "Dairy & Eggs", share: 18 + Math.floor(rng() * 3), avgBasket: 28.5 },
      { name: "Organic / Natural", share: 14 + Math.floor(rng() * 2), avgBasket: 52.0 },
      { name: "Snacks & Beverages", share: 13 + Math.floor(rng() * 2), avgBasket: 31.5 },
    ],
    purchaseFrequency: "2.3x/week",
    organicBuyerShare: 67 + Math.floor(rng() * 5),
    premiumTierShare: 44 + Math.floor(rng() * 4),
    deviceSplit: {
      mobile: 58 + Math.floor(rng() * 4),
      desktop: 32 + Math.floor(rng() * 3),
      tablet: 10,
    },
  };

  return NextResponse.json({
    networkId: KEVEL_NETWORK_ID,
    generatedAt: new Date().toISOString(),
    audience,
    formats,
    packages,
    adPolicies: {
      leadTime: "5 business days for new creatives",
      cancellationPolicy: "48h notice required for pauses",
      brandSafety: "All creatives reviewed before activation",
      exclusivity: "Category exclusivity available on request — Billboard only",
      fraudProtection: "IVT filtering via Kevel's built-in pre-bid controls",
    },
    contactInfo: {
      salesLead: "Tyler Brooks — tyler@foodtrovemedia.com",
      adOps: "Casey Nguyen — casey@foodtrovemedia.com",
      mediaKit: "https://foodtrove-media.vercel.app/admin/rate-card",
    },
  });
}

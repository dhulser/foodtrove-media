import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Kevel Management API helper
async function kevelGet(path: string) {
  const apiKey = process.env.KEVEL_API_KEY;
  if (!apiKey) throw new Error("KEVEL_API_KEY not set");
  const res = await fetch(`https://api.kevel.co/v1/${path}`, {
    headers: { "X-Adzerk-ApiKey": apiKey, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Kevel ${path}: ${res.status}`);
  return res.json();
}

// Ad density rules — defined in source, displayed here for ops visibility
const AD_DENSITY_RULES = [
  { page: "/", label: "Homepage", billboards: 1, leaderboards: 1, mrecs: 1, notes: "Above-fold billboard, mid-page leaderboard, sidebar MRec" },
  { page: "/shop/[slug]", label: "Department Page", billboards: 0, leaderboards: 1, mrecs: 1, notes: "Top leaderboard, product-grid MRec" },
  { page: "/shop/[slug]/[productId]", label: "Product Detail", billboards: 0, leaderboards: 1, mrecs: 1, notes: "Top leaderboard, right-rail MRec" },
  { page: "/search", label: "Search Results", billboards: 0, leaderboards: 1, mrecs: 0, notes: "Sponsored shelf (Kevel-decisioned) above organic results" },
  { page: "/deals", label: "Weekly Deals", billboards: 1, leaderboards: 1, mrecs: 1, notes: "Top billboard, middle leaderboard, sidebar MRec" },
  { page: "/cart", label: "Cart", billboards: 0, leaderboards: 0, mrecs: 1, notes: "Post-cart MRec only (low interruption)" },
  { page: "/checkout", label: "Checkout", billboards: 0, leaderboards: 0, mrecs: 0, notes: "No ads — conversion focus" },
  { page: "/order/[orderId]", label: "Order Confirmation", billboards: 1, leaderboards: 0, mrecs: 1, notes: "Post-purchase cross-sell billboard + MRec (max 2 per Diana's rule)" },
  { page: "/account", label: "Account", billboards: 0, leaderboards: 1, mrecs: 0, notes: "Max 1 placement on utility pages (Diana's ad density rule 2026-05-06)" },
  { page: "/brands/[slug]", label: "Brand Sponsor Page", billboards: 1, leaderboards: 1, mrecs: 1, notes: "Sponsored brand page — full inventory, contextual targeting" },
];

// Contextual keyword routing rules
const KEYWORD_ROUTING = [
  { keyword: "ft-billboard", flights: ["Organic Valley Billboard", "Liquid I.V. Billboard", "Earthbound Farm Billboard"], purpose: "Format routing — billboard placements" },
  { keyword: "ft-leaderboard", flights: ["Organic Valley Leaderboard", "Liquid I.V. Leaderboard", "Earthbound Farm Leaderboard"], purpose: "Format routing — leaderboard placements" },
  { keyword: "ft-mrec", flights: ["Organic Valley MRec", "Liquid I.V. MRec", "Earthbound Farm MRec"], purpose: "Format routing — medium rectangle placements" },
  { keyword: "produce", flights: ["Earthbound Farm Leaderboard", "Earthbound Farm MRec"], purpose: "Contextual — produce department pages" },
  { keyword: "organic", flights: ["Earthbound Farm Leaderboard", "Earthbound Farm MRec"], purpose: "Contextual — organic product pages" },
  { keyword: "fresh", flights: ["Earthbound Farm Leaderboard", "Earthbound Farm MRec"], purpose: "Contextual — fresh/perishable pages" },
  { keyword: "dairy", flights: ["Organic Valley Leaderboard", "Organic Valley MRec"], purpose: "Contextual — dairy department pages" },
  { keyword: "beverages", flights: ["Liquid I.V. Leaderboard", "Liquid I.V. MRec"], purpose: "Contextual — beverages/hydration pages" },
  { keyword: "health", flights: ["Liquid I.V. Leaderboard", "Liquid I.V. MRec"], purpose: "Contextual — health & wellness pages" },
  { keyword: "snacks", flights: ["Liquid I.V. Leaderboard", "Liquid I.V. MRec"], purpose: "Contextual — snacks/nutrition pages" },
  { keyword: "organic-enthusiast", flights: ["Earthbound Farm all formats", "Organic Valley all formats"], purpose: "Audience segment — Organic Enthusiast cohort" },
  { keyword: "premium-fresh", flights: ["Earthbound Farm all formats", "Organic Valley all formats"], purpose: "Audience segment — Premium Fresh Buyer cohort" },
];

export async function GET() {
  const networkId = process.env.KEVEL_NETWORK_ID;
  const apiKey = process.env.KEVEL_API_KEY;
  const siteId = process.env.KEVEL_SITE_ID;
  const kevelEnabled = process.env.NEXT_PUBLIC_KEVEL_ENABLED;

  const envStatus = {
    KEVEL_NETWORK_ID: { set: !!networkId, value: networkId || null },
    KEVEL_API_KEY: { set: !!apiKey, value: apiKey ? `${apiKey.slice(0, 8)}...` : null },
    KEVEL_SITE_ID: { set: !!siteId, value: siteId || null },
    NEXT_PUBLIC_KEVEL_ENABLED: { set: !!kevelEnabled, value: kevelEnabled || null },
  };

  const allEnvSet = Object.values(envStatus).every((v) => v.set);

  // Live Kevel API probe
  let kevelApiStatus: { ok: boolean; latencyMs: number | null; error: string | null } = {
    ok: false,
    latencyMs: null,
    error: null,
  };

  if (apiKey) {
    const t0 = Date.now();
    try {
      // Probe via advertiser list — lightweight
      await kevelGet("advertiser?count=1");
      kevelApiStatus = { ok: true, latencyMs: Date.now() - t0, error: null };
    } catch (err) {
      kevelApiStatus = { ok: false, latencyMs: Date.now() - t0, error: String(err) };
    }
  } else {
    kevelApiStatus.error = "KEVEL_API_KEY not set";
  }

  // Decision API probe
  let decisionApiStatus: { ok: boolean; latencyMs: number | null; candidatesFound: number | null; error: string | null } = {
    ok: false,
    latencyMs: null,
    candidatesFound: null,
    error: null,
  };

  if (networkId && siteId) {
    const t0 = Date.now();
    try {
      const res = await fetch(`https://e-${networkId}.adzerk.net/api/v2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placements: [{ divName: "settings-probe", networkId: parseInt(networkId), siteId: parseInt(siteId), adTypes: [5], count: 1 }],
          keywords: ["ft-billboard"],
        }),
        cache: "no-store",
      });
      const data = await res.json();
      const placementDecision = data.decisions?.["settings-probe"];
      const candidates = Array.isArray(placementDecision) ? placementDecision.length : (placementDecision ? 1 : 0);
      decisionApiStatus = { ok: res.ok, latencyMs: Date.now() - t0, candidatesFound: candidates, error: null };
    } catch (err) {
      decisionApiStatus = { ok: false, latencyMs: Date.now() - t0, candidatesFound: null, error: String(err) };
    }
  } else {
    decisionApiStatus.error = "KEVEL_NETWORK_ID or KEVEL_SITE_ID not set";
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    networkConfig: {
      networkId: networkId ? parseInt(networkId) : null,
      siteId: siteId ? parseInt(siteId) : null,
      channelId: 65694,
      channelName: "All Sites",
      defaultAdTypeId: 5,
      managementApiHost: "https://api.kevel.co/v1",
      decisionApiHost: networkId ? `https://e-${networkId}.adzerk.net/api/v2` : null,
    },
    envStatus,
    allEnvSet,
    kevelApiStatus,
    decisionApiStatus,
    adDensityRules: AD_DENSITY_RULES,
    keywordRouting: KEYWORD_ROUTING,
    advertisers: [
      {
        name: "Organic Valley",
        advertiserId: 6254651,
        campaignId: 659158534,
        formats: ["billboard", "leaderboard", "mrec"],
        cpm: { billboard: 5.0, leaderboard: 5.0, mrec: 5.0 },
        contextualKeywords: ["dairy", "organic", "produce"],
        status: "active",
      },
      {
        name: "Liquid I.V.",
        advertiserId: 6256255,
        campaignId: 659159072,
        formats: ["billboard", "leaderboard", "mrec"],
        cpm: { billboard: 7.5, leaderboard: 6.5, mrec: 6.0 },
        contextualKeywords: ["beverages", "health", "snacks"],
        status: "active",
      },
      {
        name: "Earthbound Farm",
        advertiserId: 6256266,
        campaignId: 659159177,
        formats: ["leaderboard", "mrec"],
        cpm: { billboard: null, leaderboard: 8.0, mrec: 7.5 },
        contextualKeywords: ["produce", "organic", "fresh"],
        status: "active",
        note: "No billboard flight — contextual placement only",
      },
    ],
    auditLog: [
      { date: "2026-05-06", event: "Three advertisers onboarded — FreshFarm, NutriPeak, GreenLeaf" },
      { date: "2026-05-06", event: "Ad density rule set: max 2 placements on utility pages (Diana)" },
      { date: "2026-05-06", event: "Keyword routing configured: ft-billboard, ft-leaderboard, ft-mrec" },
      { date: "2026-05-08", event: "All 4 Vercel env vars confirmed set (Dylan + Kai)" },
      { date: "2026-05-08", event: "NEXT_PUBLIC_KEVEL_ENABLED=true added to fix client-side ad render" },
      { date: "2026-05-11", event: "Rebrand: FreshFarm→Organic Valley, NutriPeak→Liquid I.V., GreenLeaf→Earthbound Farm" },
      { date: "2026-05-11", event: "Contextual keyword routing expanded: dairy, beverages, health, snacks" },
    ],
  });
}

/**
 * /api/admin/pixels — Conversion Tag Manager API
 *
 * Tracks conversion pixel status per advertiser:
 * - Which advertisers have pixels installed
 * - Last fire timestamp and 30-day fire counts
 * - Attribution type (post-click vs post-view)
 * - Pixel health status (firing / stale / not installed)
 *
 * Used by: /admin/pixels
 * Consumers: Casey (Ad Ops) — verifies pixel health before campaign launch;
 *            Tyler (Sales) — confirms tracking is in place for ROAS reporting
 */

import { NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PixelFire {
  ts: string; // ISO timestamp
  url: string; // page where it fired
  orderId?: string;
  revenue?: number;
  conversionType: "purchase" | "add-to-cart" | "pdp-view";
}

interface PixelSpec {
  advertiserId: number;
  advertiserName: string;
  advertiserSlug: string;
  advertiserColor: string;
  pixelId: string;
  pixelType: "conversion" | "impression" | "view-through";
  attributionWindow: {
    clickDays: number;
    viewDays: number;
  };
  installed: boolean; // pixel tag present on site
  status: "healthy" | "stale" | "not-installed" | "misfire";
  lastFireAt: string | null;
  lastFireAgo: string | null;
  fires30d: number;
  fires7d: number;
  fires24h: number;
  conversionRate30d: number; // conversions / clicks (simulated)
  avgOrderValue: number; // average revenue per conversion fire
  recentFires: PixelFire[];
  tagSnippet: string; // the JS snippet Casey gives to advertisers
  placedOnPages: string[]; // which pages the pixel fires from
  notes: string | null; // Casey's annotation
}

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function seededRandom(seed: number) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getWindowRng(windowMs: number, salt: number) {
  const bucket = Math.floor(Date.now() / windowMs);
  return seededRandom(bucket * 9999 + salt);
}

// ─── Pixel registry (FoodTrove network 12024) ────────────────────────────────

const PIXEL_REGISTRY = [
  {
    advertiserId: 6256813,
    advertiserName: "Organic Valley",
    advertiserSlug: "organic-valley",
    advertiserColor: "emerald",
    pixelId: "ft-px-ov-001",
    pixelType: "conversion" as const,
    attributionWindow: { clickDays: 30, viewDays: 1 },
    installed: true,
    placedOnPages: ["/order/[orderId]", "/cart"],
    notes: null,
    avgOrderValueBase: 42.5,
    conversionRateBase: 0.034, // 3.4%
    fires30dBase: 187,
    status: "healthy" as const,
  },
  {
    advertiserId: 6256814,
    advertiserName: "Liquid I.V.",
    advertiserSlug: "liquid-iv",
    advertiserColor: "sky",
    pixelId: "ft-px-liv-001",
    pixelType: "conversion" as const,
    attributionWindow: { clickDays: 14, viewDays: 1 },
    installed: true,
    placedOnPages: ["/order/[orderId]"],
    notes: null,
    avgOrderValueBase: 31.0,
    conversionRateBase: 0.041, // 4.1%
    fires30dBase: 203,
    status: "healthy" as const,
  },
  {
    advertiserId: 6256815,
    advertiserName: "Earthbound Farm",
    advertiserSlug: "earthbound-farm",
    advertiserColor: "orange",
    pixelId: "ft-px-ef-001",
    pixelType: "conversion" as const,
    attributionWindow: { clickDays: 7, viewDays: 1 },
    installed: true,
    placedOnPages: ["/order/[orderId]", "/shop/produce"],
    notes: "Post-purchase pixel confirmed firing. Produce page view-through also tracking.",
    avgOrderValueBase: 38.0,
    conversionRateBase: 0.028, // 2.8% (contextual, narrower reach)
    fires30dBase: 94,
    status: "healthy" as const,
  },
];

// ─── Recent fire history generation ──────────────────────────────────────────

function generateRecentFires(
  pixelId: string,
  fires30dBase: number,
  placedOnPages: string[],
  avgOrderValue: number,
  seed: number
): PixelFire[] {
  const rng = seededRandom(seed);
  const fires: PixelFire[] = [];
  const now = Date.now();
  const pages = ["/order/confirmed", "/cart", "/shop/produce", "/checkout"];
  const conversionTypes: PixelFire["conversionType"][] = [
    "purchase",
    "purchase",
    "purchase",
    "add-to-cart",
    "pdp-view",
  ];

  // Generate 8 recent fires
  for (let i = 0; i < 8; i++) {
    const hoursAgo = rng() * 72 + i * 4; // spread over last 72h
    const ts = new Date(now - hoursAgo * 3600 * 1000).toISOString();
    const convType = conversionTypes[Math.floor(rng() * conversionTypes.length)];
    const page = pages[Math.floor(rng() * pages.length)];
    const revenue =
      convType === "purchase"
        ? Math.round(avgOrderValue * (0.7 + rng() * 0.6) * 100) / 100
        : undefined;

    fires.push({
      ts,
      url: page,
      orderId: convType === "purchase" ? `ORD-${Math.floor(rng() * 90000 + 10000)}` : undefined,
      revenue,
      conversionType: convType,
    });
  }

  return fires.sort((a, b) => b.ts.localeCompare(a.ts));
}

function timeAgo(isoTs: string | null): string | null {
  if (!isoTs) return null;
  const diffMs = Date.now() - new Date(isoTs).getTime();
  const diffH = diffMs / 3600000;
  if (diffH < 1) return `${Math.round(diffH * 60)}m ago`;
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  return `${Math.round(diffH / 24)}d ago`;
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const rng = getWindowRng(5 * 60 * 1000, 91); // 5-min window

  const pixels: PixelSpec[] = PIXEL_REGISTRY.map((spec, i) => {
    const varRng = seededRandom(spec.advertiserId * 31 + i * 7);
    varRng(); // burn first value

    const fires30d = Math.round(spec.fires30dBase * (0.88 + varRng() * 0.24));
    const fires7d = Math.round(fires30d * (0.22 + varRng() * 0.08));
    const fires24h = Math.round(fires7d * (0.1 + varRng() * 0.06));
    const conversionRate =
      Math.round(spec.conversionRateBase * (0.9 + varRng() * 0.2) * 1000) / 1000;
    const avgOrderValue =
      Math.round(spec.avgOrderValueBase * (0.85 + varRng() * 0.3) * 100) / 100;

    // Last fire time: between 1h and 6h ago (all pixels healthy)
    const lastFireHoursAgo = 1 + varRng() * 5;
    const lastFireAt = new Date(Date.now() - lastFireHoursAgo * 3600000).toISOString();

    const recentFires = generateRecentFires(
      spec.pixelId,
      fires30d,
      spec.placedOnPages,
      avgOrderValue,
      spec.advertiserId * 17 + 3
    );

    const tagSnippet = `<!-- FoodTrove Conversion Pixel: ${spec.advertiserName} -->
<script>
  (function() {
    var img = new Image();
    img.src = 'https://e-12024.adzerk.net/px?pixelId=${spec.pixelId}&cv=1&oid=' + 
              encodeURIComponent(window.__ft_orderId || '') +
              '&rv=' + encodeURIComponent(window.__ft_revenue || '');
  })();
</script>`;

    return {
      advertiserId: spec.advertiserId,
      advertiserName: spec.advertiserName,
      advertiserSlug: spec.advertiserSlug,
      advertiserColor: spec.advertiserColor,
      pixelId: spec.pixelId,
      pixelType: spec.pixelType,
      attributionWindow: spec.attributionWindow,
      installed: spec.installed,
      status: spec.status,
      lastFireAt,
      lastFireAgo: timeAgo(lastFireAt),
      fires30d,
      fires7d,
      fires24h,
      conversionRate30d: conversionRate,
      avgOrderValue,
      recentFires,
      tagSnippet,
      placedOnPages: spec.placedOnPages,
      notes: spec.notes,
    };
  });

  // Network summary
  const totalFires30d = pixels.reduce((s, p) => s + p.fires30d, 0);
  const totalFires7d = pixels.reduce((s, p) => s + p.fires7d, 0);
  const totalFires24h = pixels.reduce((s, p) => s + p.fires24h, 0);
  const healthyCount = pixels.filter((p) => p.status === "healthy").length;
  const avgConversionRate =
    pixels.reduce((s, p) => s + p.conversionRate30d, 0) / pixels.length;
  const totalRevenue30d = pixels.reduce(
    (s, p) => s + p.fires30d * p.avgOrderValue,
    0
  );

  return NextResponse.json({
    pixels,
    summary: {
      totalPixels: pixels.length,
      healthyCount,
      staleCount: pixels.filter((p) => p.status === "stale").length,
      notInstalledCount: pixels.filter((p) => p.status === "not-installed").length,
      totalFires30d,
      totalFires7d,
      totalFires24h,
      avgConversionRate: Math.round(avgConversionRate * 1000) / 1000,
      totalRevenue30d: Math.round(totalRevenue30d * 100) / 100,
    },
    generatedAt: new Date().toISOString(),
  });
}

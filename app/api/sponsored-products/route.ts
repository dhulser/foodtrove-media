/**
 * /api/sponsored-products — Kevel-decisioned post-purchase cross-sell products
 *
 * Takes purchase context (department slugs, SKU IDs from the just-placed order)
 * as query params and returns a list of sponsored catalog products whose
 * advertiser won the Kevel auction for that purchase context.
 *
 * How it works:
 * 1. Receives keywords from the caller (dept slugs + sku-{id} strings)
 * 2. Calls Kevel Decision API with those keywords + "ft-mrec" format keyword
 * 3. From the winning creative's metadata, identifies the advertiser brand
 * 4. Looks up catalog products matching that brand and returns them
 * 5. Falls back to static getFeaturedProducts() if Kevel is unavailable
 *
 * This is the premium CPM story: shopper bought X → Kevel picks the winning
 * advertiser for that purchase context → serve complementary Y products.
 *
 * Request:
 *   GET /api/sponsored-products?keywords=produce,dairy,sku-apples-1234&count=6
 *
 * Response:
 *   {
 *     source: "kevel" | "fallback",
 *     sponsoredBy: string | null,   // advertiser name from winning creative
 *     advertiserId: number | null,
 *     products: SponsoredProduct[]
 *   }
 */
import { NextRequest, NextResponse } from "next/server";
import { getFeaturedProducts } from "@/lib/catalog";
import catalogData from "@/lib/catalog.json";
import type { Catalog } from "@/lib/types";

const KEVEL_NETWORK_ID = process.env.KEVEL_NETWORK_ID ?? "12024";
const KEVEL_SITE_ID = process.env.KEVEL_SITE_ID ?? "1324936";
const KEVEL_API_KEY = process.env.KEVEL_API_KEY;

const catalog = catalogData as Catalog;

// Maps Kevel advertiser IDs to brand name strings as they appear in catalog products
const ADVERTISER_BRANDS: Record<number, string[]> = {
  6254651: ["FreshFarm"],                         // FreshFarm Organics
  6256255: ["NutriPeak"],                         // NutriPeak Nutrition
  6256266: ["GreenLeaf", "GreenLeaf Farms"],      // GreenLeaf Farms
};

// Fallback brand order for round-robin when Kevel is unavailable
const FALLBACK_BRAND_ORDER = ["FreshFarm", "NutriPeak", "GreenLeaf"];

export interface SponsoredProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  unit: string;
  rating: number;
  reviewCount: number;
  departmentSlug: string;
  departmentName: string;
  departmentIcon: string;
  inStock: boolean;
}

function catalogProductsForBrands(brands: string[], count: number, excludeIds?: Set<string>): SponsoredProduct[] {
  const results: SponsoredProduct[] = [];
  for (const dept of catalog.departments) {
    for (const product of dept.products) {
      if (!product.inStock) continue;
      if (excludeIds?.has(product.id)) continue;
      if (brands.some((b) => product.brand.includes(b))) {
        results.push({
          id: product.id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          unit: product.unit,
          rating: product.rating,
          reviewCount: product.reviewCount,
          departmentSlug: dept.slug,
          departmentName: dept.name,
          departmentIcon: dept.icon,
          inStock: product.inStock,
        });
      }
    }
  }
  // Sort by rating desc, then pick up to count
  return results.sort((a, b) => b.rating - a.rating).slice(0, count);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const keywordsParam = searchParams.get("keywords") ?? "";
  const count = Math.min(parseInt(searchParams.get("count") ?? "6", 10), 12);

  // Parse caller keywords (dept slugs, sku-* strings)
  const callerKeywords = keywordsParam
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  // Extract dept slugs for excluding shopper's already-purchased categories
  // (optional — the idea is to show complementary, not same-dept products)
  // For now we don't exclude — show the best advertiser products regardless.
  const purchasedSkuIds = new Set(
    callerKeywords.filter((k) => k.startsWith("sku-")).map((k) => k.slice(4))
  );

  // Without Kevel credentials → static fallback
  if (!KEVEL_API_KEY || !KEVEL_NETWORK_ID) {
    const fallback = getFeaturedProducts(count);
    return NextResponse.json({
      source: "fallback",
      sponsoredBy: null,
      advertiserId: null,
      products: fallback.map(({ product, department }) => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        unit: product.unit,
        rating: product.rating,
        reviewCount: product.reviewCount,
        departmentSlug: department.slug,
        departmentName: department.name,
        departmentIcon: department.icon,
        inStock: product.inStock,
      })),
    });
  }

  // Hit Kevel Decision API with purchase context keywords + mrec format keyword
  const requestKeywords = ["ft-mrec", ...callerKeywords];

  try {
    const decisionRes = await fetch(
      `https://e-${KEVEL_NETWORK_ID}.adzerk.net/api/v2`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Adzerk-ApiKey": KEVEL_API_KEY,
        },
        body: JSON.stringify({
          placements: [
            {
              divName: "post-purchase-crosssell",
              networkId: parseInt(KEVEL_NETWORK_ID, 10),
              siteId: parseInt(KEVEL_SITE_ID, 10),
              adTypes: [5],
              count: 1,
            },
          ],
          keywords: requestKeywords,
        }),
        signal: AbortSignal.timeout(2000),
      }
    );

    if (!decisionRes.ok) {
      throw new Error(`Kevel Decision API ${decisionRes.status}`);
    }

    const decision = await decisionRes.json();
    const winners = decision?.decisions?.["post-purchase-crosssell"];
    const winner = Array.isArray(winners) && winners.length > 0 ? winners[0] : null;

    if (!winner) {
      // No fill — serve fallback products (don't leave blank)
      const fallback = getFeaturedProducts(count);
      return NextResponse.json({
        source: "fallback",
        sponsoredBy: null,
        advertiserId: null,
        products: fallback.map(({ product, department }) => ({
          id: product.id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          unit: product.unit,
          rating: product.rating,
          reviewCount: product.reviewCount,
          departmentSlug: department.slug,
          departmentName: department.name,
          departmentIcon: department.icon,
          inStock: product.inStock,
        })),
      });
    }

    // Got a winner — extract advertiser metadata from the creative
    const advertiserId: number = winner.ad?.advertiserId ?? 0;
    const brands = ADVERTISER_BRANDS[advertiserId] ?? FALLBACK_BRAND_ORDER;

    // Extract the advertiser display name from the creative HTML if possible
    // (creatives contain the brand name in a <strong> tag)
    let sponsoredBy: string | null = null;
    const creativeBody: string =
      winner.contents?.[0]?.body ?? winner.creative?.body ?? "";
    const brandMatch = creativeBody.match(/<strong>([^<]+)<\/strong>/);
    if (brandMatch) {
      sponsoredBy = brandMatch[1];
    } else {
      // Fall back to known advertiser name from IDs
      const advNames: Record<number, string> = {
        6254651: "FreshFarm Organics",
        6256255: "NutriPeak Nutrition",
        6256266: "GreenLeaf Farms",
      };
      sponsoredBy = advNames[advertiserId] ?? null;
    }

    const products = catalogProductsForBrands(brands, count, purchasedSkuIds);

    // If we couldn't find enough brand products, pad with featured products
    if (products.length < count) {
      const usedIds = new Set(products.map((p) => p.id));
      const fallback = getFeaturedProducts(count);
      for (const { product, department } of fallback) {
        if (!usedIds.has(product.id) && products.length < count) {
          products.push({
            id: product.id,
            name: product.name,
            brand: product.brand,
            price: product.price,
            unit: product.unit,
            rating: product.rating,
            reviewCount: product.reviewCount,
            departmentSlug: department.slug,
            departmentName: department.name,
            departmentIcon: department.icon,
            inStock: product.inStock,
          });
        }
      }
    }

    // Fire impression pixel (best-effort, server-side)
    if (winner.impressionUrl) {
      fetch(winner.impressionUrl).catch(() => {
        /* non-fatal */
      });
    }

    return NextResponse.json({
      source: "kevel",
      sponsoredBy,
      advertiserId: advertiserId || null,
      products,
    });
  } catch (err) {
    // Network error or timeout → graceful fallback
    console.warn("[SponsoredProducts] Kevel call failed:", err instanceof Error ? err.message : String(err));
    const fallback = getFeaturedProducts(count);
    return NextResponse.json({
      source: "fallback",
      sponsoredBy: null,
      advertiserId: null,
      products: fallback.map(({ product, department }) => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        unit: product.unit,
        rating: product.rating,
        reviewCount: product.reviewCount,
        departmentSlug: department.slug,
        departmentName: department.name,
        departmentIcon: department.icon,
        inStock: product.inStock,
      })),
    });
  }
}

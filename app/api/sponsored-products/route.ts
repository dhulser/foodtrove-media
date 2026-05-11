/**
 * /api/sponsored-products — Kevel-decisioned sponsored product recommendations
 *
 * Used by post-purchase cross-sell sections and other "sponsored product" grid
 * placements. Takes purchase signal keywords (categories + SKU IDs) and returns
 * a list of sponsored products to show the shopper.
 *
 * The sponsorship works like this:
 * - Advertiser brand campaigns (Organic Valley, Liquid I.V., Earthbound Farm) bid on
 *   category keywords (produce, dairy, beverages, etc.)
 * - When a shopper buys from a category, we send those category keywords to Kevel
 * - Kevel returns the winning advertiser brand's creative + metadata
 * - We extract the brand name from the creative and surface their products
 *   from the catalog as "Sponsored by [Brand]"
 *
 * Strategy:
 * 1. Send MRec placement requests with purchase signal keywords
 * 2. Extract winning advertiser metadata from creative HTML
 * 3. Return products tagged to those winning brands/categories
 * 4. Fall back to static featured products if no fill
 *
 * Request body:
 *   {
 *     purchaseKeywords?: string[]   // ["produce", "dairy", "sku-apples-organic-3lb"]
 *     count?: number                // max products to return (default 6)
 *   }
 *
 * Response:
 *   {
 *     products: Array<{ product, department, sponsoredBy: string | null }>
 *     source: "kevel" | "static"   // for transparency
 *     advertiserId?: number
 *   }
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchAdDecision, getWinner } from "@/lib/kevel";
import { getFeaturedProducts, getAllDepartments } from "@/lib/catalog";
import type { Product, Department } from "@/lib/types";

// Known advertiser IDs → brand display names
const ADVERTISER_BRAND_MAP: Record<number, string> = {
  6256813: "Organic Valley",
  6256814: "Liquid I.V.",
  6256815: "Earthbound Farm",
};

// Advertiser brand → product category keywords (for filtering catalog)
const ADVERTISER_CATEGORY_MAP: Record<number, string[]> = {
  6256813: ["produce", "dairy", "bakery", "organic"],   // Organic Valley: organic dairy/fresh
  6256814: ["snacks", "beverages", "protein", "nutrition"], // Liquid I.V.: hydration/health
  6256815: ["produce", "organic", "fresh"],             // Earthbound Farm: organic produce
};

interface SponsoredProductResult {
  product: Product;
  department: Department;
  sponsoredBy: string | null;
}

function getProductsByCategory(
  categories: string[],
  count: number
): { product: Product; department: Department }[] {
  const allDepts = getAllDepartments();
  const matches: { product: Product; department: Department; score: number }[] = [];
  const seen = new Set<string>();

  for (const dept of allDepts) {
    for (const product of dept.products) {
      if (seen.has(product.id)) continue;

      // Score: how many of the category keywords match the product's dept/tags
      const productContext = [
        dept.slug,
        dept.id,
        ...product.tags,
        product.brand.toLowerCase().replace(/\s+/g, "-"),
      ].map((t) => t.toLowerCase());

      const score = categories.reduce(
        (acc, cat) =>
          productContext.some((c) => c.includes(cat.toLowerCase())) ? acc + 1 : acc,
        0
      );

      if (score > 0) {
        matches.push({ product, department: dept, score });
        seen.add(product.id);
      }
    }
  }

  // Sort by score desc, then by rating
  matches.sort((a, b) => b.score - a.score || b.product.rating - a.product.rating);
  return matches.slice(0, count).map(({ product, department }) => ({ product, department }));
}

export async function POST(request: NextRequest) {
  let body: { purchaseKeywords?: string[]; count?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid-request" },
      { status: 400 }
    );
  }

  const { purchaseKeywords = [], count = 6 } = body;

  const networkId = process.env.KEVEL_NETWORK_ID
    ? parseInt(process.env.KEVEL_NETWORK_ID, 10)
    : null;
  const siteId = process.env.KEVEL_SITE_ID
    ? parseInt(process.env.KEVEL_SITE_ID, 10)
    : 1324936;

  // No credentials → static fallback immediately
  if (!networkId || !process.env.KEVEL_API_KEY) {
    const fallback = getFeaturedProducts(count);
    const products: SponsoredProductResult[] = fallback.map(({ product, department }) => ({
      product,
      department,
      sponsoredBy: null,
    }));
    return NextResponse.json({ products, source: "static" });
  }

  // Build keyword set: format routing + purchase signal
  const baseKeywords = ["ft-mrec"];
  const requestKeywords = [...baseKeywords, ...purchaseKeywords];

  try {
    // Fetch a Kevel decision — winning advertiser for this purchase context
    const decision = await fetchAdDecision({
      placements: [
        {
          divName: "post-purchase-sponsored-products",
          networkId,
          siteId,
          adTypes: [5],
          count: 1,
        },
      ],
      keywords: requestKeywords,
      user: {
        key: `anon-${Date.now()}`,
      },
    });

    const result = getWinner(decision, "post-purchase-sponsored-products");

    if (result.filled) {
      const { winner } = result;
      // KevelWinner.ad.advertiserId is the correct field per lib/kevel.ts interface
      const resolvedAdvertiserId: number | undefined = winner.ad?.advertiserId ?? undefined;

      const brandName = resolvedAdvertiserId
        ? (ADVERTISER_BRAND_MAP[resolvedAdvertiserId] ?? null)
        : null;

      const categories = resolvedAdvertiserId
        ? (ADVERTISER_CATEGORY_MAP[resolvedAdvertiserId] ?? [])
        : [];

      // Try to find catalog products matching this advertiser's categories
      let products: SponsoredProductResult[];

      if (categories.length > 0) {
        const categoryProducts = getProductsByCategory(categories, count);
        if (categoryProducts.length >= 2) {
          products = categoryProducts.map(({ product, department }) => ({
            product,
            department,
            sponsoredBy: brandName,
          }));
        } else {
          // Not enough category matches → use featured + label the brand
          products = getFeaturedProducts(count).map(({ product, department }) => ({
            product,
            department,
            sponsoredBy: brandName,
          }));
        }
      } else {
        products = getFeaturedProducts(count).map(({ product, department }) => ({
          product,
          department,
          sponsoredBy: brandName,
        }));
      }

      return NextResponse.json({
        products,
        source: "kevel",
        advertiserId: resolvedAdvertiserId,
        brandName,
        impressionUrl: winner.impressionUrl,
        clickUrl: winner.clickUrl,
      });
    }

    // No fill from Kevel → static fallback
    const fallback = getFeaturedProducts(count);
    return NextResponse.json({
      products: fallback.map(({ product, department }) => ({
        product,
        department,
        sponsoredBy: null,
      })),
      source: "static",
    });
  } catch (err) {
    console.error("[sponsored-products] Kevel error:", err);
    const fallback = getFeaturedProducts(count);
    return NextResponse.json({
      products: fallback.map(({ product, department }) => ({
        product,
        department,
        sponsoredBy: null,
      })),
      source: "static",
      error: "kevel-error",
    });
  }
}

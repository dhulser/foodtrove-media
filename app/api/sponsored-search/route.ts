/**
 * /api/sponsored-search — Kevel-decisioned promoted search results
 *
 * When a shopper searches for a product, advertisers can bid on the search
 * keywords to surface their products as sponsored results at the top of the
 * search page. This is the highest-CPM ad format in the RMN — search intent
 * is the strongest purchase signal we have.
 *
 * How it works:
 * 1. Shopper searches for e.g. "organic milk"
 * 2. We tokenize the query → ["organic", "milk"]
 * 3. Send to Kevel Decision API with keywords: ["ft-mrec", "organic", "milk"]
 *    (ft-mrec is the format router; organic + milk are the intent signals)
 * 4. Kevel runs CPM auction among flights whose Keywords include any match
 * 5. Winning advertiser's brand determines which products we surface
 * 6. We return up to `count` products tagged "Sponsored" with the brand name
 *
 * Request:
 *   POST /api/sponsored-search
 *   { "query": "organic milk", "count": 4 }
 *
 * Response:
 *   {
 *     "products": [...],
 *     "sponsoredBy": "Organic Valley",
 *     "advertiserId": 6256813,
 *     "source": "kevel" | "static",
 *     "impressionUrl": "https://..."
 *   }
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchAdDecision, getWinner } from "@/lib/kevel";
import { getAllDepartments } from "@/lib/catalog";
import type { Product, Department } from "@/lib/types";

const PLACEMENT_ID = "search-sponsored-shelf";

// Advertiser ID → display brand name
const ADVERTISER_BRAND_MAP: Record<number, string> = {
  6256813: "Organic Valley",
  6256814: "Liquid I.V.",
  6256815: "Earthbound Farm",
};

// Advertiser → category/tag signals for finding their best matching products
const ADVERTISER_CATEGORY_MAP: Record<number, string[]> = {
  6256813: ["produce", "dairy", "bakery", "organic", "fresh"],
  6256814: ["snacks", "beverages", "protein", "nutrition", "health"],
  6256815: ["produce", "organic", "fresh", "vegetables", "herbs"],
};

function getAdvertiserProducts(
  advertiserId: number,
  searchQuery: string,
  count: number
): { product: Product; department: Department }[] {
  const categories = ADVERTISER_CATEGORY_MAP[advertiserId] ?? [];
  const allDepts = getAllDepartments();
  const queryTokens = searchQuery
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const scored: { product: Product; department: Department; score: number }[] =
    [];

  for (const dept of allDepts) {
    for (const product of dept.products) {
      const signals = [
        dept.slug,
        dept.id,
        ...product.tags,
        product.brand.toLowerCase().replace(/\s+/g, "-"),
      ].map((s) => s.toLowerCase());

      // Score from advertiser category alignment
      let score = categories.reduce(
        (acc, cat) =>
          acc + signals.filter((s) => s.includes(cat.toLowerCase())).length,
        0
      );

      // Bonus if product matches the search query — keeps results intent-aligned
      const productText = [
        product.name,
        product.brand,
        product.description,
        ...product.tags,
      ]
        .join(" ")
        .toLowerCase();

      for (const token of queryTokens) {
        if (productText.includes(token)) score += 3;
      }

      if (score > 0) {
        scored.push({ product, department: dept, score });
      }
    }
  }

  return scored
    .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating)
    .slice(0, count)
    .map(({ product, department }) => ({ product, department }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query: string = (body.query ?? "").trim();
    const count: number = Math.min(body.count ?? 4, 6);

    if (!query) {
      return NextResponse.json({ products: [], source: "static" });
    }

    const networkId = parseInt(process.env.KEVEL_NETWORK_ID ?? "0");
    const siteId = parseInt(process.env.KEVEL_SITE_ID ?? "0");

    if (!networkId || !siteId || !process.env.KEVEL_API_KEY) {
      return NextResponse.json({
        products: [],
        source: "static",
        reason: "no-credentials",
      });
    }

    // Build keywords: format router + search query tokens (intent signals)
    const queryTokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const keywords = ["ft-mrec", ...queryTokens];

    // Fire Kevel Decision API with search intent keywords
    const decisionResponse = await fetchAdDecision({
      placements: [
        {
          divName: PLACEMENT_ID,
          networkId,
          siteId,
          adTypes: [5],
          count: 1,
          keywords,
        },
      ],
      keywords,
    });

    const fillResult = getWinner(decisionResponse, PLACEMENT_ID);

    if (!fillResult.filled) {
      return NextResponse.json({ products: [], source: "static" });
    }

    const winner = fillResult.winner;
    const advertiserId: number = winner.ad.advertiserId;
    const sponsoredBy = ADVERTISER_BRAND_MAP[advertiserId] ?? null;

    if (!sponsoredBy) {
      return NextResponse.json({ products: [], source: "static" });
    }

    const products = getAdvertiserProducts(advertiserId, query, count);

    return NextResponse.json({
      products,
      sponsoredBy,
      advertiserId,
      source: "kevel",
      impressionUrl: winner.impressionUrl ?? null,
    });
  } catch (err) {
    console.error("[sponsored-search] error:", err);
    // Never 500 to the shopper — return empty, page renders fine
    return NextResponse.json({ products: [], source: "static" });
  }
}

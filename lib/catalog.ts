import catalogData from "./catalog.json";
import type { Catalog, Department, Product } from "./types";

const catalog = catalogData as Catalog;

export function getAllDepartments(): Department[] {
  return catalog.departments;
}

export function getDepartmentBySlug(slug: string): Department | undefined {
  return catalog.departments.find((d) => d.slug === slug);
}

export function getDepartmentById(id: string): Department | undefined {
  return catalog.departments.find((d) => d.id === id);
}

export function getProductById(productId: string): {
  product: Product;
  department: Department;
} | undefined {
  for (const department of catalog.departments) {
    const product = department.products.find((p) => p.id === productId);
    if (product) return { product, department };
  }
  return undefined;
}

export function getFeaturedProducts(count = 8): { product: Product; department: Department }[] {
  const featured: { product: Product; department: Department }[] = [];
  for (const department of catalog.departments) {
    const sponsored = department.products.filter((p) => p.sponsored);
    for (const p of sponsored) {
      featured.push({ product: p, department });
    }
  }
  // Fill remaining with top-rated if not enough sponsored
  if (featured.length < count) {
    const used = new Set(featured.map((f) => f.product.id));
    for (const department of catalog.departments) {
      const sorted = [...department.products].sort((a, b) => b.rating - a.rating);
      for (const p of sorted) {
        if (!used.has(p.id)) {
          featured.push({ product: p, department });
          used.add(p.id);
        }
        if (featured.length >= count) break;
      }
      if (featured.length >= count) break;
    }
  }
  return featured.slice(0, count);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

export interface SearchResult {
  product: Product;
  department: Department;
  score: number;
}

/**
 * Full-text search across product names, brands, descriptions, and tags.
 * Returns results sorted by relevance score (descending), capped at `limit`.
 *
 * Scoring:
 *   - Exact name match: +10
 *   - Name starts with query: +6
 *   - Name contains query token: +4
 *   - Brand contains query: +3
 *   - Tag exact match: +3
 *   - Description contains query: +1
 */
export function searchProducts(
  query: string,
  limit = 48
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const tokens = q.split(/\s+/).filter(Boolean);
  const results: SearchResult[] = [];

  for (const department of catalog.departments) {
    for (const product of department.products) {
      const name = product.name.toLowerCase();
      const brand = product.brand.toLowerCase();
      const desc = product.description.toLowerCase();
      const tags = product.tags.map((t) => t.toLowerCase());

      let score = 0;

      // Exact name match
      if (name === q) score += 10;
      // Name starts with full query
      else if (name.startsWith(q)) score += 6;

      for (const token of tokens) {
        if (name.includes(token)) score += 4;
        if (brand.includes(token)) score += 3;
        if (tags.some((t) => t === token || t.includes(token))) score += 3;
        if (desc.includes(token)) score += 1;
      }

      if (score > 0) {
        results.push({ product, department, score });
      }
    }
  }

  return results
    .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating)
    .slice(0, limit);
}

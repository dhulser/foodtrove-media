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

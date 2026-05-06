export interface Product {
  id: string;
  name: string;
  brand: string;
  sku: string;
  price: number;
  unit: string;
  description: string;
  tags: string[];
  image: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  sponsored: boolean;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  heroImage: string;
  products: Product[];
}

export interface Catalog {
  departments: Department[];
}

export interface AdSlotConfig {
  placementId: string;
  divId: string;
  siteId?: string;
  adTypes?: string[];
  width?: number;
  height?: number;
  context?: Record<string, string>;
}

export type AdSlotSize =
  | "leaderboard"     // 728x90
  | "billboard"       // 970x250
  | "medium-rectangle" // 300x250
  | "half-page"       // 300x600
  | "skyscraper"      // 160x600
  | "inline-product"; // custom product-list inline

export type PageContext =
  | { type: "home" }
  | { type: "department"; departmentId: string }
  | { type: "product"; productId: string; departmentId: string };

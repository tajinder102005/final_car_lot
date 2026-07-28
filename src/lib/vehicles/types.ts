/**
 * Shared vehicle domain types.
 *
 * These types are intentionally framework-agnostic so the domain rules in
 * `inventory.ts` can be unit-tested without a database or a browser.
 */

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: string;
  year: number;
  price: number;
  quantity: number;
  description: string | null;
  image_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleFilters {
  /** Free-text term matched against make and model. */
  query?: string;
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  /** When true, vehicles with zero stock are excluded. */
  inStockOnly?: boolean;
}

export type SortOption = "newest" | "price-asc" | "price-desc" | "stock-desc";

export const VEHICLE_CATEGORIES = [
  "Sedan",
  "SUV",
  "Truck",
  "Coupe",
  "Hatchback",
  "Electric",
  "Van",
  "Convertible",
] as const;

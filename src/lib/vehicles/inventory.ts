/**
 * Pure inventory domain rules.
 *
 * Every function here is deterministic and side-effect free, which keeps the
 * business rules (search, stock transitions, pricing) fully unit-testable and
 * independent of the database or UI. The database enforces the same rules
 * atomically via `purchase_vehicle` / `restock_vehicle`.
 */
import type { SortOption, Vehicle, VehicleFilters } from "./types";

const normalize = (value: string) => value.trim().toLowerCase();

/** A vehicle can be purchased only when at least one unit is in stock. */
export function isPurchasable(vehicle: Pick<Vehicle, "quantity">): boolean {
  return vehicle.quantity > 0;
}

export type StockLevel = "out-of-stock" | "low-stock" | "in-stock";

/** Human-facing stock bucket used for badges in the UI. */
export function stockLevel(quantity: number): StockLevel {
  if (quantity <= 0) return "out-of-stock";
  if (quantity <= 2) return "low-stock";
  return "in-stock";
}

/**
 * Quantity after a purchase.
 * @throws when the requested amount is invalid or exceeds available stock.
 */
export function quantityAfterPurchase(current: number, amount = 1): number {
  assertPositiveInteger(amount);
  if (amount > current) {
    throw new Error("Not enough stock available");
  }
  return current - amount;
}

/**
 * Quantity after a restock.
 * @throws when the requested amount is not a positive integer.
 */
export function quantityAfterRestock(current: number, amount = 1): number {
  assertPositiveInteger(amount);
  return current + amount;
}

function assertPositiveInteger(amount: number): void {
  if (!Number.isInteger(amount) || amount < 1) {
    throw new Error("Quantity must be a positive integer");
  }
}

/** Total price for a purchase line, rounded to cents. */
export function purchaseTotal(unitPrice: number, quantity: number): number {
  assertPositiveInteger(quantity);
  if (unitPrice < 0) throw new Error("Price cannot be negative");
  return Math.round(unitPrice * quantity * 100) / 100;
}

/** Applies every provided filter. Undefined/empty filters are ignored. */
export function filterVehicles<T extends Vehicle>(
  vehicles: readonly T[],
  filters: VehicleFilters = {},
): T[] {
  const query = filters.query ? normalize(filters.query) : "";
  const make = filters.make ? normalize(filters.make) : "";
  const model = filters.model ? normalize(filters.model) : "";
  const category = filters.category ? normalize(filters.category) : "";

  return vehicles.filter((vehicle) => {
    if (query) {
      const haystack = `${vehicle.make} ${vehicle.model} ${vehicle.category}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (make && !normalize(vehicle.make).includes(make)) return false;
    if (model && !normalize(vehicle.model).includes(model)) return false;
    if (category && normalize(vehicle.category) !== category) return false;
    if (filters.minPrice !== undefined && vehicle.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && vehicle.price > filters.maxPrice) return false;
    if (filters.inStockOnly && !isPurchasable(vehicle)) return false;
    return true;
  });
}

/** Returns a new sorted array; the input is never mutated. */
export function sortVehicles<T extends Vehicle>(vehicles: readonly T[], sort: SortOption): T[] {
  const copy = [...vehicles];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "stock-desc":
      return copy.sort((a, b) => b.quantity - a.quantity);
    case "newest":
    default:
      return copy.sort(
        (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
      );
  }
}

export interface InventoryStats {
  totalModels: number;
  unitsInStock: number;
  outOfStock: number;
  inventoryValue: number;
}

/** Aggregated dashboard metrics for a vehicle collection. */
export function inventoryStats(vehicles: readonly Vehicle[]): InventoryStats {
  return vehicles.reduce<InventoryStats>(
    (acc, vehicle) => ({
      totalModels: acc.totalModels + 1,
      unitsInStock: acc.unitsInStock + vehicle.quantity,
      outOfStock: acc.outOfStock + (vehicle.quantity === 0 ? 1 : 0),
      inventoryValue: acc.inventoryValue + vehicle.price * vehicle.quantity,
    }),
    { totalModels: 0, unitsInStock: 0, outOfStock: 0, inventoryValue: 0 },
  );
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const formatPrice = (value: number): string => currencyFormatter.format(value);

import { describe, expect, it } from "vitest";
import {
  filterVehicles,
  formatPrice,
  inventoryStats,
  isPurchasable,
  purchaseTotal,
  quantityAfterPurchase,
  quantityAfterRestock,
  sortVehicles,
  stockLevel,
} from "./inventory";
import type { Vehicle } from "./types";

const vehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  id: crypto.randomUUID(),
  make: "Toyota",
  model: "Corolla",
  category: "Sedan",
  year: 2024,
  price: 25_000,
  quantity: 3,
  description: null,
  image_url: null,
  created_at: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

describe("isPurchasable", () => {
  it("is true when stock is available", () => {
    expect(isPurchasable({ quantity: 1 })).toBe(true);
  });

  it("is false when stock is zero", () => {
    expect(isPurchasable({ quantity: 0 })).toBe(false);
  });
});

describe("stockLevel", () => {
  it.each([
    [0, "out-of-stock"],
    [1, "low-stock"],
    [2, "low-stock"],
    [3, "in-stock"],
  ])("maps quantity %i to %s", (quantity, expected) => {
    expect(stockLevel(quantity)).toBe(expected);
  });
});

describe("quantityAfterPurchase", () => {
  it("decrements the stock by one by default", () => {
    expect(quantityAfterPurchase(5)).toBe(4);
  });

  it("decrements by the requested amount", () => {
    expect(quantityAfterPurchase(5, 3)).toBe(2);
  });

  it("rejects purchases larger than available stock", () => {
    expect(() => quantityAfterPurchase(2, 3)).toThrow(/not enough stock/i);
  });

  it("rejects purchasing from an empty stock", () => {
    expect(() => quantityAfterPurchase(0)).toThrow(/not enough stock/i);
  });

  it.each([0, -1, 1.5])("rejects the invalid amount %s", (amount) => {
    expect(() => quantityAfterPurchase(10, amount)).toThrow(/positive integer/i);
  });
});

describe("quantityAfterRestock", () => {
  it("increments the stock", () => {
    expect(quantityAfterRestock(0, 4)).toBe(4);
  });

  it("defaults to a single unit", () => {
    expect(quantityAfterRestock(1)).toBe(2);
  });

  it("rejects non-positive amounts", () => {
    expect(() => quantityAfterRestock(1, 0)).toThrow(/positive integer/i);
  });
});

describe("purchaseTotal", () => {
  it("multiplies unit price by quantity", () => {
    expect(purchaseTotal(19_999.99, 2)).toBe(39_999.98);
  });

  it("rounds to cents", () => {
    expect(purchaseTotal(0.335, 3)).toBe(1.01);
  });

  it("rejects negative prices", () => {
    expect(() => purchaseTotal(-1, 1)).toThrow(/negative/i);
  });
});

describe("filterVehicles", () => {
  const inventory: Vehicle[] = [
    vehicle({ make: "Toyota", model: "Corolla", category: "Sedan", price: 25_000, quantity: 2 }),
    vehicle({ make: "Ford", model: "F-150", category: "Truck", price: 58_000, quantity: 0 }),
    vehicle({ make: "Tesla", model: "Model 3", category: "Electric", price: 47_000, quantity: 5 }),
  ];

  it("returns everything when no filters are given", () => {
    expect(filterVehicles(inventory)).toHaveLength(3);
  });

  it("filters by make case-insensitively", () => {
    expect(filterVehicles(inventory, { make: "tesla" })).toHaveLength(1);
  });

  it("filters by partial model match", () => {
    expect(filterVehicles(inventory, { model: "corol" })[0].make).toBe("Toyota");
  });

  it("filters by exact category", () => {
    expect(filterVehicles(inventory, { category: "Truck" })).toHaveLength(1);
  });

  it("filters by price range", () => {
    const result = filterVehicles(inventory, { minPrice: 26_000, maxPrice: 50_000 });
    expect(result.map((v) => v.model)).toEqual(["Model 3"]);
  });

  it("matches a free-text query across make, model and category", () => {
    expect(filterVehicles(inventory, { query: "electric" })).toHaveLength(1);
    expect(filterVehicles(inventory, { query: "f-150" })).toHaveLength(1);
  });

  it("hides out-of-stock vehicles when requested", () => {
    expect(filterVehicles(inventory, { inStockOnly: true })).toHaveLength(2);
  });

  it("combines multiple filters", () => {
    expect(
      filterVehicles(inventory, { category: "Sedan", maxPrice: 30_000, inStockOnly: true }),
    ).toHaveLength(1);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterVehicles(inventory, { make: "Ferrari" })).toEqual([]);
  });
});

describe("sortVehicles", () => {
  const inventory: Vehicle[] = [
    vehicle({ model: "A", price: 30_000, quantity: 1, created_at: "2024-01-01T00:00:00.000Z" }),
    vehicle({ model: "B", price: 10_000, quantity: 7, created_at: "2024-06-01T00:00:00.000Z" }),
  ];

  it("sorts by ascending price", () => {
    expect(sortVehicles(inventory, "price-asc").map((v) => v.model)).toEqual(["B", "A"]);
  });

  it("sorts by descending price", () => {
    expect(sortVehicles(inventory, "price-desc").map((v) => v.model)).toEqual(["A", "B"]);
  });

  it("sorts by stock", () => {
    expect(sortVehicles(inventory, "stock-desc").map((v) => v.model)).toEqual(["B", "A"]);
  });

  it("sorts newest first", () => {
    expect(sortVehicles(inventory, "newest").map((v) => v.model)).toEqual(["B", "A"]);
  });

  it("does not mutate the input", () => {
    const original = [...inventory];
    sortVehicles(inventory, "price-asc");
    expect(inventory).toEqual(original);
  });
});

describe("inventoryStats", () => {
  it("aggregates models, units, stockouts and value", () => {
    const stats = inventoryStats([
      vehicle({ price: 10_000, quantity: 2 }),
      vehicle({ price: 20_000, quantity: 0 }),
    ]);
    expect(stats).toEqual({
      totalModels: 2,
      unitsInStock: 2,
      outOfStock: 1,
      inventoryValue: 20_000,
    });
  });

  it("handles an empty inventory", () => {
    expect(inventoryStats([])).toEqual({
      totalModels: 0,
      unitsInStock: 0,
      outOfStock: 0,
      inventoryValue: 0,
    });
  });
});

describe("formatPrice", () => {
  it("formats whole dollars", () => {
    expect(formatPrice(28_500)).toBe("$28,500");
  });
});

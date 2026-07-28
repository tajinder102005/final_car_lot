# Test Report

Command: `bunx vitest run`

```
 ✓ src/lib/vehicles/inventory.test.ts (36 tests)
 ✓ src/lib/vehicles/schemas.test.ts   (11 tests)

 Test Files  2 passed (2)
      Tests  47 passed (47)
```

## What is covered

**Inventory domain rules (`inventory.test.ts`)**

- `isPurchasable` — purchasing is blocked at zero stock.
- `stockLevel` — out-of-stock / low-stock / in-stock buckets.
- `quantityAfterPurchase` — decrement, over-purchase rejection, invalid amounts.
- `quantityAfterRestock` — increment and validation.
- `purchaseTotal` — line totals, cent rounding, negative-price rejection.
- `filterVehicles` — make, model, category, price range, free-text query,
  availability toggle, combined filters, empty results.
- `sortVehicles` — price asc/desc, stock, newest, immutability of the input.
- `inventoryStats` — model count, unit count, stockouts, floor value, empty case.
- `formatPrice` — currency formatting.

**Validation schemas (`schemas.test.ts`)**

- Registration: valid input and trimming, invalid email, short password.
- Login: password required.
- Vehicle: valid payload, negative price, fractional quantity, blank make,
  unrealistic year.
- Quantity: default of 1, zero rejected.

## Rules verified in the database

Atomicity and authorisation are enforced by PostgreSQL and therefore verified
against the live database rather than in unit tests:

- `purchase_vehicle` decrements stock in a single conditional `UPDATE`, so two
  concurrent buyers can never oversell the last unit.
- `restock_vehicle` and vehicle deletion raise unless the caller has the `admin`
  role (`has_role`).
- RLS restricts purchase history and profiles to their owner (or an admin).

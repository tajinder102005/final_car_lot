import { describe, expect, it } from "vitest";
import { loginSchema, quantitySchema, registerSchema, vehicleSchema } from "./schemas";

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      email: " driver@example.com ",
      password: "supersecret",
      fullName: "Ada Lovelace",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("driver@example.com");
  });

  it("rejects an invalid email", () => {
    expect(registerSchema.safeParse({ email: "nope", password: "supersecret" }).success).toBe(false);
  });

  it("rejects a short password", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: "short" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires a password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("vehicleSchema", () => {
  const valid = {
    make: "Toyota",
    model: "Corolla",
    category: "Sedan",
    year: 2024,
    price: 25_000,
    quantity: 3,
  };

  it("accepts a valid vehicle", () => {
    expect(vehicleSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a negative price", () => {
    expect(vehicleSchema.safeParse({ ...valid, price: -1 }).success).toBe(false);
  });

  it("rejects a fractional quantity", () => {
    expect(vehicleSchema.safeParse({ ...valid, quantity: 1.5 }).success).toBe(false);
  });

  it("rejects a blank make", () => {
    expect(vehicleSchema.safeParse({ ...valid, make: "   " }).success).toBe(false);
  });

  it("rejects an unrealistic year", () => {
    expect(vehicleSchema.safeParse({ ...valid, year: 1800 }).success).toBe(false);
  });
});

describe("quantitySchema", () => {
  it("defaults to one unit", () => {
    expect(quantitySchema.parse({})).toEqual({ quantity: 1 });
  });

  it("rejects zero", () => {
    expect(quantitySchema.safeParse({ quantity: 0 }).success).toBe(false);
  });
});

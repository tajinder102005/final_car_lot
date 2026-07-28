/**
 * Validation schemas shared by the REST API, the server code and the forms.
 * Validating in one place keeps client and server rules identical.
 */
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  fullName: z.string().trim().min(2, "Name is too short").max(80).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(1, "Password is required").max(72),
});

export const vehicleSchema = z.object({
  make: z.string().trim().min(1, "Make is required").max(60),
  model: z.string().trim().min(1, "Model is required").max(60),
  category: z.string().trim().min(1, "Category is required").max(40),
  year: z
    .number({ invalid_type_error: "Year is required" })
    .int()
    .min(1900, "Year must be 1900 or later")
    .max(new Date().getFullYear() + 2, "Year is too far in the future"),
  price: z.number({ invalid_type_error: "Price is required" }).nonnegative("Price cannot be negative").max(100_000_000),
  quantity: z
    .number({ invalid_type_error: "Quantity is required" })
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative")
    .max(10_000),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  image_url: z.string().trim().url("Enter a valid URL").max(500).optional().or(z.literal("")),
});

export const vehicleUpdateSchema = vehicleSchema.partial();

export const quantitySchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(1000).default(1),
});

export const searchSchema = z.object({
  make: z.string().trim().max(60).optional(),
  model: z.string().trim().max(60).optional(),
  category: z.string().trim().max(40).optional(),
  query: z.string().trim().max(80).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;

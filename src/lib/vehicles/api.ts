/**
 * Data-access layer for vehicles, inventory operations and auth roles.
 * Every call goes through the RLS-protected database client, so the
 * permission rules live in one place (the database) rather than the UI.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Vehicle, VehicleFilters } from "./types";
import type { VehicleInput } from "./schemas";

export async function fetchVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Vehicle[];
}

/** Server-side search used by the REST endpoint and the filter bar. */
export async function searchVehicles(filters: VehicleFilters): Promise<Vehicle[]> {
  let request = supabase.from("vehicles").select("*");

  if (filters.make) request = request.ilike("make", `%${filters.make}%`);
  if (filters.model) request = request.ilike("model", `%${filters.model}%`);
  if (filters.category) request = request.ilike("category", filters.category);
  if (filters.minPrice !== undefined) request = request.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) request = request.lte("price", filters.maxPrice);

  const { data, error } = await request.order("price", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Vehicle[];
}

function toRow(input: VehicleInput) {
  return {
    make: input.make,
    model: input.model,
    category: input.category,
    year: input.year,
    price: input.price,
    quantity: input.quantity,
    description: input.description || null,
    image_url: input.image_url || null,
  };
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  const { data, error } = await supabase.from("vehicles").insert(toRow(input)).select().single();
  if (error) throw new Error(error.message);
  return data as Vehicle;
}

export async function updateVehicle(id: string, input: VehicleInput): Promise<Vehicle> {
  const { data, error } = await supabase
    .from("vehicles")
    .update(toRow(input))
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Vehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Atomic stock decrement + purchase record (admin-free, any signed-in user). */
export async function purchaseVehicle(id: string, quantity = 1): Promise<void> {
  const { error } = await supabase.rpc("purchase_vehicle", {
    _vehicle_id: id,
    _quantity: quantity,
  });
  if (error) throw new Error(error.message);
}

/** Atomic stock increment — the database rejects non-admins. */
export async function restockVehicle(id: string, quantity = 1): Promise<void> {
  const { error } = await supabase.rpc("restock_vehicle", {
    _vehicle_id: id,
    _quantity: quantity,
  });
  if (error) throw new Error(error.message);
}

export interface PurchaseRecord {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  vehicles: Pick<Vehicle, "make" | "model" | "category"> | null;
}

export async function fetchMyPurchases(): Promise<PurchaseRecord[]> {
  const { data, error } = await supabase
    .from("purchases")
    .select("id, quantity, unit_price, total_price, created_at, vehicles(make, model, category)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PurchaseRecord[];
}

import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import heroImage from "@/assets/showroom-hero.jpg";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterBar } from "@/components/filter-bar";
import { VehicleCard } from "@/components/vehicle-card";
import { VehicleDialog } from "@/components/vehicle-dialog";
import { useAuth } from "@/hooks/use-auth";
import {
  createVehicle,
  deleteVehicle,
  fetchVehicles,
  purchaseVehicle,
  restockVehicle,
  updateVehicle,
} from "@/lib/vehicles/api";
import { filterVehicles, formatPrice, inventoryStats, sortVehicles } from "@/lib/vehicles/inventory";
import type { VehicleInput } from "@/lib/vehicles/schemas";
import type { SortOption, Vehicle, VehicleFilters } from "@/lib/vehicles/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Torque Motors — Browse the Vehicle Showroom" },
      {
        name: "description",
        content:
          "Search live dealership stock by make, model, category and price, then purchase available vehicles in one click.",
      },
      { property: "og:title", content: "Torque Motors — Browse the Vehicle Showroom" },
      {
        property: "og:description",
        content: "Search live dealership stock by make, model, category and price, then purchase available vehicles in one click.",
      },
    ],
  }),
  component: ShowroomPage,
});

function ShowroomPage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [sort, setSort] = useState<SortOption>("newest");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  const vehiclesQuery = useQuery({ queryKey: ["vehicles"], queryFn: fetchVehicles });
  const vehicles = vehiclesQuery.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["vehicles"] });

  const saveMutation = useMutation({
    mutationFn: (input: VehicleInput) =>
      editing ? updateVehicle(editing.id, input) : createVehicle(input),
    onSuccess: async () => {
      toast.success(editing ? "Vehicle updated" : "Vehicle added");
      setDialogOpen(false);
      setEditing(null);
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const purchaseMutation = useMutation({
    mutationFn: (vehicle: Vehicle) => purchaseVehicle(vehicle.id, 1),
    onSuccess: async (_data, vehicle) => {
      toast.success(`Purchased ${vehicle.make} ${vehicle.model}`);
      await Promise.all([invalidate(), queryClient.invalidateQueries({ queryKey: ["purchases"] })]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const restockMutation = useMutation({
    mutationFn: (vehicle: Vehicle) => restockVehicle(vehicle.id, 1),
    onSuccess: async () => {
      toast.success("Stock increased by 1");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (vehicle: Vehicle) => deleteVehicle(vehicle.id),
    onSuccess: async () => {
      toast.success("Vehicle deleted");
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const categories = useMemo(
    () => Array.from(new Set(vehicles.map((vehicle) => vehicle.category))).sort(),
    [vehicles],
  );
  const visible = useMemo(
    () => sortVehicles(filterVehicles(vehicles, filters), sort),
    [vehicles, filters, sort],
  );
  const stats = useMemo(() => inventoryStats(vehicles), [vehicles]);

  function requireAuth(action: () => void) {
    if (!user) {
      toast.error("Sign in to continue");
      return;
    }
    action();
  }

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImage}
          alt="Luxury cars lined up in a dark dealership showroom"
          width={1920}
          height={1080}
          className="absolute inset-0 -z-10 size-full object-cover opacity-60"
        />
        <div className="hero-scrim absolute inset-0 -z-10" />
        <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-primary">
            <Sparkles className="size-3" /> Live inventory
          </p>
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
            <span className="text-gradient">Every vehicle on the floor</span>, tracked in real time.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Torque Motors keeps stock, pricing and sales in sync. Browse the showroom, filter down to
            the exact spec, and purchase the moment a unit is available.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <a href="#inventory">Browse inventory</a>
            </Button>
            {!user && (
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth">Create an account</Link>
              </Button>
            )}
          </div>

          <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Models" value={String(stats.totalModels)} />
            <Stat label="Units in stock" value={String(stats.unitsInStock)} />
            <Stat label="Sold out" value={String(stats.outOfStock)} />
            <Stat label="Floor value" value={formatPrice(stats.inventoryValue)} />
          </dl>
        </div>
      </section>

      <section id="inventory" className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Showroom</h2>
            <p className="text-sm text-muted-foreground">
              {visible.length} of {vehicles.length} vehicles shown
            </p>
          </div>
          {user && (
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" /> Add vehicle
            </Button>
          )}
        </div>

        <FilterBar
          filters={filters}
          sort={sort}
          categories={categories}
          onChange={setFilters}
          onSortChange={setSort}
          onReset={() => setFilters({})}
        />

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehiclesQuery.isLoading &&
            Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-96 w-full rounded-xl" />
            ))}

          {!vehiclesQuery.isLoading &&
            visible.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                canManage={Boolean(user)}
                isAdmin={isAdmin}
                busy={purchaseMutation.isPending}
                onPurchase={(target) => requireAuth(() => purchaseMutation.mutate(target))}
                onEdit={(target) => {
                  setEditing(target);
                  setDialogOpen(true);
                }}
                onRestock={(target) => restockMutation.mutate(target)}
                onDelete={(target) => deleteMutation.mutate(target)}
              />
            ))}
        </div>

        {vehiclesQuery.isError && (
          <p className="mt-8 text-sm text-destructive">
            Could not load inventory: {(vehiclesQuery.error as Error).message}
          </p>
        )}

        {!vehiclesQuery.isLoading && visible.length === 0 && (
          <p className="mt-16 text-center text-muted-foreground">
            No vehicles match these filters. Try widening the price range.
          </p>
        )}
      </section>

      <VehicleDialog
        open={dialogOpen}
        vehicle={editing}
        saving={saveMutation.isPending}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={(input) => saveMutation.mutate(input)}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-panel rounded-xl px-4 py-3">
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-display text-xl font-bold">{value}</dd>
    </div>
  );
}

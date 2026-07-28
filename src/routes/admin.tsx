import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { formatPrice, inventoryStats, stockLevel } from "@/lib/vehicles/inventory";
import type { VehicleInput } from "@/lib/vehicles/schemas";
import type { Vehicle } from "@/lib/vehicles/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Inventory management — Torque Motors" },
      {
        name: "description",
        content:
          "Admin console for the Torque Motors dealership: add, edit, restock and remove vehicles.",
      },
      { property: "og:title", content: "Inventory management — Torque Motors" },
      {
        property: "og:description",
        content: "Manage dealership stock levels, pricing and listings.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
    enabled: Boolean(user),
  });
  const vehicles = vehiclesQuery.data ?? [];
  const stats = useMemo(() => inventoryStats(vehicles), [vehicles]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["vehicles"] });
  const onError = (error: Error) => toast.error(error.message);

  const saveMutation = useMutation({
    mutationFn: (input: VehicleInput) =>
      editing ? updateVehicle(editing.id, input) : createVehicle(input),
    onSuccess: async () => {
      toast.success(editing ? "Vehicle updated" : "Vehicle added");
      setDialogOpen(false);
      setEditing(null);
      await invalidate();
    },
    onError,
  });

  const restockMutation = useMutation({
    mutationFn: (vehicle: Vehicle) => restockVehicle(vehicle.id, 1),
    onSuccess: async () => {
      toast.success("Restocked");
      await invalidate();
    },
    onError,
  });

  const sellMutation = useMutation({
    mutationFn: (vehicle: Vehicle) => purchaseVehicle(vehicle.id, 1),
    onSuccess: async () => {
      toast.success("Unit sold");
      await invalidate();
    },
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: (vehicle: Vehicle) => deleteVehicle(vehicle.id),
    onSuccess: async () => {
      toast.success("Vehicle deleted");
      await invalidate();
    },
    onError,
  });

  if (loading) return <PageMessage title="Loading…" />;

  if (!user) {
    return (
      <PageMessage title="Sign in required" description="You need an account to manage inventory.">
        <Button asChild>
          <Link to="/auth">Go to sign in</Link>
        </Button>
      </PageMessage>
    );
  }

  if (!isAdmin) {
    return (
      <PageMessage
        title="Admin access only"
        description="Your account does not have the admin role. Restocking and deleting vehicles is restricted to dealership administrators."
      >
        <Button asChild variant="outline">
          <Link to="/">Back to showroom</Link>
        </Button>
      </PageMessage>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Inventory management</h1>
          <p className="text-sm text-muted-foreground">
            {stats.totalModels} models · {stats.unitsInStock} units ·{" "}
            {formatPrice(stats.inventoryValue)} floor value
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> Add vehicle
        </Button>
      </div>

      <Card className="surface-panel overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>
                  <button
                    className="text-left font-medium hover:text-primary"
                    onClick={() => {
                      setEditing(vehicle);
                      setDialogOpen(true);
                    }}
                  >
                    {vehicle.make} {vehicle.model}
                  </button>
                  <p className="text-xs text-muted-foreground">{vehicle.year}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{vehicle.category}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatPrice(vehicle.price)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={stockLevel(vehicle.quantity) === "out-of-stock" ? "destructive" : "secondary"}
                  >
                    {vehicle.quantity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label="Sell one unit"
                      disabled={vehicle.quantity === 0}
                      onClick={() => sellMutation.mutate(vehicle)}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label="Restock one unit"
                      onClick={() => restockMutation.mutate(vehicle)}
                    >
                      <Plus className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label="Delete vehicle"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(vehicle)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

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
    </div>
  );
}

function PageMessage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-32 text-center">
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}

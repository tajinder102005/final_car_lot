import { Gauge, Pencil, PackagePlus, ShoppingCart, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatPrice, isPurchasable, stockLevel } from "@/lib/vehicles/inventory";
import type { Vehicle } from "@/lib/vehicles/types";

interface VehicleCardProps {
  vehicle: Vehicle;
  canManage: boolean;
  isAdmin: boolean;
  busy?: boolean;
  onPurchase: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
  onRestock: (vehicle: Vehicle) => void;
}

const stockCopy: Record<ReturnType<typeof stockLevel>, string> = {
  "out-of-stock": "Out of stock",
  "low-stock": "Low stock",
  "in-stock": "In stock",
};

export function VehicleCard({
  vehicle,
  canManage,
  isAdmin,
  busy,
  onPurchase,
  onEdit,
  onDelete,
  onRestock,
}: VehicleCardProps) {
  const level = stockLevel(vehicle.quantity);
  const purchasable = isPurchasable(vehicle);

  return (
    <Card className="surface-panel group flex flex-col overflow-hidden py-0 transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-16/10 overflow-hidden bg-secondary">
        {vehicle.image_url ? (
          <img
            src={vehicle.image_url}
            alt={`${vehicle.make} ${vehicle.model}`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-linear-160 from-secondary to-card">
            <Gauge className="size-10 text-muted-foreground/50" />
          </div>
        )}
        <Badge
          variant={level === "out-of-stock" ? "destructive" : "secondary"}
          className="absolute right-3 top-3 backdrop-blur"
        >
          {stockCopy[level]} · {vehicle.quantity}
        </Badge>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold leading-tight">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {vehicle.category} · {vehicle.year}
            </p>
          </div>
          <p className="shrink-0 font-display text-lg font-bold text-primary">
            {formatPrice(vehicle.price)}
          </p>
        </div>
        {vehicle.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{vehicle.description}</p>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center gap-2 border-t border-border/70 p-4">
        <Button
          className="flex-1"
          disabled={!purchasable || busy}
          onClick={() => onPurchase(vehicle)}
        >
          <ShoppingCart className="size-4" />
          {purchasable ? "Purchase" : "Sold out"}
        </Button>
        {canManage && (
          <Button variant="outline" size="icon" aria-label="Edit vehicle" onClick={() => onEdit(vehicle)}>
            <Pencil className="size-4" />
          </Button>
        )}
        {isAdmin && (
          <>
            <Button
              variant="outline"
              size="icon"
              aria-label="Restock vehicle"
              onClick={() => onRestock(vehicle)}
            >
              <PackagePlus className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Delete vehicle"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(vehicle)}
            >
              <Trash2 className="size-4" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

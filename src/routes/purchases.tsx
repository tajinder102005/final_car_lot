import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyPurchases } from "@/lib/vehicles/api";
import { formatPrice } from "@/lib/vehicles/inventory";

export const Route = createFileRoute("/purchases")({
  head: () => ({
    meta: [
      { title: "My purchases — Torque Motors" },
      {
        name: "description",
        content: "Review the vehicles you have purchased from the Torque Motors dealership.",
      },
      { property: "og:title", content: "My purchases — Torque Motors" },
      { property: "og:description", content: "Your Torque Motors purchase history." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PurchasesPage,
});

function PurchasesPage() {
  const { user, loading } = useAuth();
  const purchasesQuery = useQuery({
    queryKey: ["purchases"],
    queryFn: fetchMyPurchases,
    enabled: Boolean(user),
  });

  if (!loading && !user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-32 text-center">
        <h1 className="font-display text-2xl font-bold">Sign in required</h1>
        <p className="text-sm text-muted-foreground">
          Your purchase history is private to your account.
        </p>
        <Button asChild>
          <Link to="/auth">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  const purchases = purchasesQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold">My purchases</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {purchases.length} order{purchases.length === 1 ? "" : "s"} on record.
      </p>

      {purchases.length === 0 ? (
        <Card className="surface-panel p-10 text-center text-muted-foreground">
          You haven't purchased a vehicle yet.
        </Card>
      ) : (
        <Card className="surface-panel overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">
                    {purchase.vehicles
                      ? `${purchase.vehicles.make} ${purchase.vehicles.model}`
                      : "Removed listing"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(purchase.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">{purchase.quantity}</TableCell>
                  <TableCell className="text-right">{formatPrice(purchase.unit_price)}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {formatPrice(purchase.total_price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

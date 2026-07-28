import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vehicleSchema, type VehicleInput } from "@/lib/vehicles/schemas";
import { VEHICLE_CATEGORIES, type Vehicle } from "@/lib/vehicles/types";

interface VehicleDialogProps {
  open: boolean;
  vehicle: Vehicle | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: VehicleInput) => void;
}

const emptyForm = {
  make: "",
  model: "",
  category: "Sedan",
  year: String(new Date().getFullYear()),
  price: "",
  quantity: "1",
  description: "",
  image_url: "",
};

type FormState = typeof emptyForm;

export function VehicleDialog({ open, vehicle, saving, onOpenChange, onSubmit }: VehicleDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      vehicle
        ? {
            make: vehicle.make,
            model: vehicle.model,
            category: vehicle.category,
            year: String(vehicle.year),
            price: String(vehicle.price),
            quantity: String(vehicle.quantity),
            description: vehicle.description ?? "",
            image_url: vehicle.image_url ?? "",
          }
        : emptyForm,
    );
  }, [open, vehicle]);

  const set = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = vehicleSchema.safeParse({
      ...form,
      year: Number(form.year),
      price: Number(form.price),
      quantity: Number(form.quantity),
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Update vehicle" : "Add vehicle"}</DialogTitle>
          <DialogDescription>
            {vehicle
              ? "Change the listing details and stock level."
              : "Add a new vehicle to the dealership inventory."}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Make" error={errors.make}>
              <Input value={form.make} onChange={(e) => set("make")(e.target.value)} placeholder="Toyota" />
            </Field>
            <Field label="Model" error={errors.model}>
              <Input value={form.model} onChange={(e) => set("model")(e.target.value)} placeholder="Corolla" />
            </Field>
            <Field label="Category" error={errors.category}>
              <Select value={form.category} onValueChange={set("category")}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Year" error={errors.year}>
              <Input
                type="number"
                value={form.year}
                onChange={(e) => set("year")(e.target.value)}
              />
            </Field>
            <Field label="Price (USD)" error={errors.price}>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => set("price")(e.target.value)}
                placeholder="28500"
              />
            </Field>
            <Field label="Quantity in stock" error={errors.quantity}>
              <Input
                type="number"
                value={form.quantity}
                onChange={(e) => set("quantity")(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Image URL (optional)" error={errors.image_url}>
            <Input
              value={form.image_url}
              onChange={(e) => set("image_url")(e.target.value)}
              placeholder="https://…"
            />
          </Field>

          <Field label="Description (optional)" error={errors.description}>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              placeholder="Key selling points of this vehicle"
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : vehicle ? "Save changes" : "Add vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

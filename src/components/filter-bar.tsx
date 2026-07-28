import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SortOption, VehicleFilters } from "@/lib/vehicles/types";

interface FilterBarProps {
  filters: VehicleFilters;
  sort: SortOption;
  categories: string[];
  onChange: (filters: VehicleFilters) => void;
  onSortChange: (sort: SortOption) => void;
  onReset: () => void;
}

const ALL = "all";

export function FilterBar({
  filters,
  sort,
  categories,
  onChange,
  onSortChange,
  onReset,
}: FilterBarProps) {
  const patch = (next: Partial<VehicleFilters>) => onChange({ ...filters, ...next });
  const toNumber = (value: string) => (value === "" ? undefined : Number(value));

  return (
    <section className="surface-panel rounded-xl p-4 shadow-panel sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="search" className="text-xs uppercase tracking-widest text-muted-foreground">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              className="pl-9"
              placeholder="Search by make, model or category"
              value={filters.query ?? ""}
              onChange={(event) => patch({ query: event.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Category</Label>
          <Select
            value={filters.category ?? ALL}
            onValueChange={(value) => patch({ category: value === ALL ? undefined : value })}
          >
            <SelectTrigger className="w-full lg:w-44">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Price range
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              className="w-28"
              placeholder="Min"
              value={filters.minPrice ?? ""}
              onChange={(event) => patch({ minPrice: toNumber(event.target.value) })}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              className="w-28"
              placeholder="Max"
              value={filters.maxPrice ?? ""}
              onChange={(event) => patch({ maxPrice: toNumber(event.target.value) })}
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            <SlidersHorizontal className="size-3" /> Sort
          </Label>
          <Select value={sort} onValueChange={(value) => onSortChange(value as SortOption)}>
            <SelectTrigger className="w-full lg:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="price-asc">Price: low to high</SelectItem>
              <SelectItem value="price-desc">Price: high to low</SelectItem>
              <SelectItem value="stock-desc">Most in stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
        <div className="flex items-center gap-2">
          <Switch
            id="in-stock"
            checked={Boolean(filters.inStockOnly)}
            onCheckedChange={(checked) => patch({ inStockOnly: checked })}
          />
          <Label htmlFor="in-stock" className="text-sm text-muted-foreground">
            Available only
          </Label>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="size-4" /> Clear filters
        </Button>
      </div>
    </section>
  );
}

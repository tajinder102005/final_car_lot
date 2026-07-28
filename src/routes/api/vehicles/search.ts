import { createFileRoute } from "@tanstack/react-router";
import { searchSchema } from "@/lib/vehicles/schemas";

export const Route = createFileRoute("/api/vehicles/search")({
  server: {
    handlers: {
      // GET /api/vehicles/search?make=&model=&category=&minPrice=&maxPrice=
      GET: async ({ request }) => {
        const { json, errorResponse, publicClient } = await import("@/lib/rest.server");
        const params = Object.fromEntries(new URL(request.url).searchParams);
        const parsed = searchSchema.safeParse(params);
        if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 422);

        const { make, model, category, query, minPrice, maxPrice } = parsed.data;
        let request$ = publicClient().from("vehicles").select("*");
        if (make) request$ = request$.ilike("make", `%${make}%`);
        if (model) request$ = request$.ilike("model", `%${model}%`);
        if (category) request$ = request$.ilike("category", category);
        if (query) request$ = request$.or(`make.ilike.%${query}%,model.ilike.%${query}%`);
        if (minPrice !== undefined) request$ = request$.gte("price", minPrice);
        if (maxPrice !== undefined) request$ = request$.lte("price", maxPrice);

        const { data, error } = await request$.order("price", { ascending: true });
        if (error) return errorResponse(error.message, 500);
        return json({ vehicles: data, count: data?.length ?? 0 });
      },
    },
  },
});

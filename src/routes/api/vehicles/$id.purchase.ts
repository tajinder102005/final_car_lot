import { createFileRoute } from "@tanstack/react-router";
import { quantitySchema } from "@/lib/vehicles/schemas";

export const Route = createFileRoute("/api/vehicles/$id/purchase")({
  server: {
    handlers: {
      // POST /api/vehicles/:id/purchase — atomically decrements stock.
      POST: async ({ request, params }) => {
        const { json, errorResponse, authedClient } = await import("@/lib/rest.server");
        const supabase = authedClient(request);
        if (!supabase) return errorResponse("Unauthorized", 401);

        const body = await request.json().catch(() => ({}));
        const parsed = quantitySchema.safeParse(body ?? {});
        if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 422);

        const { data, error } = await supabase.rpc("purchase_vehicle", {
          _vehicle_id: params.id,
          _quantity: parsed.data.quantity,
        });
        if (error) return errorResponse(error.message, 409);
        return json({ vehicle: data });
      },
    },
  },
});

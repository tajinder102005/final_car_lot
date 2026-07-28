import { createFileRoute } from "@tanstack/react-router";
import { quantitySchema } from "@/lib/vehicles/schemas";

export const Route = createFileRoute("/api/vehicles/$id/restock")({
  server: {
    handlers: {
      // POST /api/vehicles/:id/restock — admin only, enforced in the database.
      POST: async ({ request, params }) => {
        const { json, errorResponse, authedClient } = await import("@/lib/rest.server");
        const supabase = authedClient(request);
        if (!supabase) return errorResponse("Unauthorized", 401);

        const body = await request.json().catch(() => ({}));
        const parsed = quantitySchema.safeParse(body ?? {});
        if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 422);

        const { data, error } = await supabase.rpc("restock_vehicle", {
          _vehicle_id: params.id,
          _quantity: parsed.data.quantity,
        });
        if (error) return errorResponse(error.message, 403);
        return json({ vehicle: data });
      },
    },
  },
});

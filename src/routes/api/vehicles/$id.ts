import { createFileRoute } from "@tanstack/react-router";
import { vehicleUpdateSchema } from "@/lib/vehicles/schemas";

export const Route = createFileRoute("/api/vehicles/$id")({
  server: {
    handlers: {
      // PUT /api/vehicles/:id — update a vehicle (authenticated).
      PUT: async ({ request, params }) => {
        const { json, errorResponse, authedClient } = await import("@/lib/rest.server");
        const supabase = authedClient(request);
        if (!supabase) return errorResponse("Unauthorized", 401);

        const parsed = vehicleUpdateSchema.safeParse(await request.json());
        if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 422);

        const { data, error } = await supabase
          .from("vehicles")
          .update(parsed.data)
          .eq("id", params.id)
          .select()
          .maybeSingle();
        if (error) return errorResponse(error.message, 403);
        if (!data) return errorResponse("Vehicle not found", 404);
        return json({ vehicle: data });
      },
      // DELETE /api/vehicles/:id — admin only (enforced by RLS).
      DELETE: async ({ request, params }) => {
        const { json, errorResponse, authedClient } = await import("@/lib/rest.server");
        const supabase = authedClient(request);
        if (!supabase) return errorResponse("Unauthorized", 401);

        const { data, error } = await supabase
          .from("vehicles")
          .delete()
          .eq("id", params.id)
          .select()
          .maybeSingle();
        if (error) return errorResponse(error.message, 403);
        if (!data) return errorResponse("Vehicle not found or admin role required", 403);
        return json({ deleted: params.id });
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { vehicleSchema } from "@/lib/vehicles/schemas";

export const Route = createFileRoute("/api/vehicles/")({
  server: {
    handlers: {
      // GET /api/vehicles — list all vehicles (public read policy).
      GET: async () => {
        const { json, errorResponse, publicClient } = await import("@/lib/rest.server");
        const { data, error } = await publicClient()
          .from("vehicles")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) return errorResponse(error.message, 500);
        return json({ vehicles: data });
      },
      // POST /api/vehicles — add a vehicle (requires a bearer token).
      POST: async ({ request }) => {
        const { json, errorResponse, authedClient } = await import("@/lib/rest.server");
        const supabase = authedClient(request);
        if (!supabase) return errorResponse("Unauthorized", 401);

        const parsed = vehicleSchema.safeParse(await request.json());
        if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 422);

        const { data, error } = await supabase.from("vehicles").insert(parsed.data).select().single();
        if (error) return errorResponse(error.message, 403);
        return json({ vehicle: data }, 201);
      },
    },
  },
});

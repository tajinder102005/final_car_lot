import { createFileRoute } from "@tanstack/react-router";
import { loginSchema } from "@/lib/vehicles/schemas";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { json, errorResponse, publicClient } = await import("@/lib/rest.server");
        const parsed = loginSchema.safeParse(await request.json());
        if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 422);

        const supabase = publicClient();
        const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) return errorResponse("Invalid email or password", 401);
        return json({ token: data.session?.access_token, user: data.user });
      },
    },
  },
});

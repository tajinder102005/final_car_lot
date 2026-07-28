import { createFileRoute } from "@tanstack/react-router";
import { registerSchema } from "@/lib/vehicles/schemas";

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { json, errorResponse, publicClient } = await import("@/lib/rest.server");
        const parsed = registerSchema.safeParse(await request.json());
        if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 422);

        const supabase = publicClient();
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { data: { full_name: parsed.data.fullName ?? "" } },
        });
        if (error) return errorResponse(error.message, 400);
        return json({ user: data.user, session: data.session }, 201);
      },
    },
  },
});

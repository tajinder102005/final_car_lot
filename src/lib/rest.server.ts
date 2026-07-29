/**
 * Helpers shared by the REST endpoints under /api.
 * Server-only: creates a Supabase client bound to the caller's bearer token so
 * every request is evaluated against the same RLS policies as the SPA.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/integrations/supabase/app-client";

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function errorResponse(message: string, status = 400) {
  return json({ error: message }, status);
}

function config() {
  // Points at the project's own Supabase instance (see app-client.ts).
  // Publishable/anon key only — never the service role key.
  return { url: SUPABASE_URL, key: SUPABASE_ANON_KEY };
}

/** Anonymous client — only usable for endpoints backed by public read policies. */
export function publicClient(): SupabaseClient {
  const { url, key } = config();
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Client authenticated as the caller, or null when no bearer token was sent. */
export function authedClient(request: Request): SupabaseClient | null {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { url, key } = config();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

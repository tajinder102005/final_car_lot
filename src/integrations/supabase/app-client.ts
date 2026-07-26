/**
 * Application Supabase client — points at the project's own Supabase instance.
 *
 * Only the project URL and the publishable (anon) key live here; both are safe
 * to ship to the browser. The service role key must NEVER appear in this file
 * or anywhere else in the frontend.
 *
 * Run `supabase/schema.sql` in the SQL editor of this project before using it.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export const SUPABASE_URL = "https://bmqvtboymdvqjidibzpt.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtcXZ0Ym95bWR2cWppZGlienB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMTA5MTIsImV4cCI6MjEwMDg4NjkxMn0.qgvvsGH9MTsmeIpf0kWIxFMOZzqwV1OzxH3Rm0GTAG0";

function createAppClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _client: ReturnType<typeof createAppClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createAppClient>, {
  get(_target, prop, receiver) {
    if (!_client) _client = createAppClient();
    return Reflect.get(_client, prop, receiver);
  },
});

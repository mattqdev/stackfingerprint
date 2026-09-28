// src/lib/server/db.js
// Server-only Supabase client (service role). Returns null when the project
// isn't configured, so tracking and the admin degrade gracefully.
import { createClient } from "@supabase/supabase-js";

let client;

export function getDb() {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL;
  // New "sb_secret_…" keys and legacy service_role JWTs both work here.
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  client =
    url && key
      ? createClient(url, key, { auth: { persistSession: false } })
      : null;
  return client;
}

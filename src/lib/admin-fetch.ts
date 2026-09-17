import { supabase } from "@/integrations/supabase/client";

/**
 * fetch() wrapper for admin-only API routes: attaches the signed-in
 * user's Supabase bearer token so the server can verify the admin role.
 */
export async function adminFetch(input: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

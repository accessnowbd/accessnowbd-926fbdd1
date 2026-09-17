import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/* ============================================================
 * Server-side auth helpers for raw HTTP routes under src/routes/api/*.
 * These routes are not createServerFn, so they cannot use the
 * requireSupabaseAuth middleware — this helper does the same job:
 * validate the caller's bearer token and confirm the admin role.
 * ============================================================ */

export type AdminCaller = {
  userId: string;
  supabase: ReturnType<typeof createClient<Database>>;
};

/**
 * Returns the admin caller, or a Response to return immediately.
 */
export async function requireApiAdmin(
  request: Request,
): Promise<{ admin: AdminCaller } | { error: Response }> {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return {
      error: Response.json({ ok: false, error: "Server not configured" }, { status: 500 }),
    };
  }

  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { error: Response.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return { error: Response.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || !userId) {
    return { error: Response.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!isAdmin) {
    return { error: Response.json({ ok: false, error: "Forbidden" }, { status: 403 }) };
  }

  return { admin: { userId, supabase } };
}

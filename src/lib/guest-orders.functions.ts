import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Fetch a guest order (placed without an account) using the private guest token
 * handed to the buyer right after checkout. Verified server-side; no anon SELECT
 * policy on orders is required.
 */
export const getGuestOrder = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ orderId: z.string().uuid(), token: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, full_name, email, phone, payment_method, transaction_id, items, total, status, created_at",
      )
      .eq("id", data.orderId)
      .eq("guest_token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return order ?? null;
  });

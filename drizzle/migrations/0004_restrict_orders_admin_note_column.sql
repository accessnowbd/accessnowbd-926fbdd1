-- Internal staff remarks (orders.admin_note) must not be readable by the customer
-- who owns the order. Replace the table-wide SELECT grant with column-level grants
-- that exclude admin_note, and expose notes to admins through a guarded function.
REVOKE SELECT ON public.orders FROM anon, authenticated;

GRANT SELECT (
  id, user_id, full_name, email, phone, payment_method, transaction_id,
  items, total, status, created_at, delivered_credentials, delivered_at,
  updated_at, whatsapp_sent, payment_screenshot_url, payment_status,
  source, telegram_chat_id, guest_token
) ON public.orders TO authenticated, anon;

GRANT ALL ON public.orders TO service_role;

CREATE OR REPLACE FUNCTION public.admin_order_notes()
RETURNS TABLE(order_id uuid, admin_note text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.admin_note
  FROM public.orders o
  WHERE public.has_role(auth.uid(), 'admin') AND o.admin_note IS NOT NULL
$$;

REVOKE ALL ON FUNCTION public.admin_order_notes() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_order_notes() TO authenticated;
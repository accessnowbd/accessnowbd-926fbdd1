
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_token uuid;
CREATE INDEX IF NOT EXISTS orders_guest_token_idx ON public.orders (guest_token) WHERE guest_token IS NOT NULL;

GRANT INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;

DROP POLICY IF EXISTS "Guests can create guest orders" ON public.orders;
CREATE POLICY "Guests can create guest orders"
ON public.orders FOR INSERT TO anon
WITH CHECK (
  user_id IS NULL
  AND guest_token IS NOT NULL
  AND status = 'pending'
  AND delivered_credentials IS NULL
  AND admin_note IS NULL
  AND COALESCE(whatsapp_sent, false) = false
);

-- Let a signed-in shopper attach a guest order (placed before login) to their account.
CREATE OR REPLACE FUNCTION public.claim_guest_order(_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  IF auth.uid() IS NULL OR _token IS NULL THEN
    RETURN NULL;
  END IF;
  UPDATE public.orders
     SET user_id = auth.uid(), guest_token = NULL
   WHERE guest_token = _token AND user_id IS NULL
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_guest_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_guest_order(uuid) TO authenticated;

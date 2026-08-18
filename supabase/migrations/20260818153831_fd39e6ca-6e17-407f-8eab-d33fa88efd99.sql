DROP POLICY IF EXISTS "Guests update anon abandoned checkouts" ON public.abandoned_checkouts;
DROP POLICY IF EXISTS "Guests insert anon abandoned checkouts" ON public.abandoned_checkouts;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.abandoned_checkouts FROM anon;

GRANT EXECUTE ON FUNCTION public.capture_abandoned_checkout(text, uuid, text, text, text, jsonb, numeric, numeric, text, text, text, text, jsonb) TO anon, authenticated;
-- Fix: abandoned_checkouts has RLS policies for anon + authenticated but is
-- missing the underlying Data API GRANTs, so every insert from the checkout
-- form fails with a permission error and the admin page is always empty.
GRANT INSERT, UPDATE ON public.abandoned_checkouts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.abandoned_checkouts TO authenticated;
GRANT ALL ON public.abandoned_checkouts TO service_role;
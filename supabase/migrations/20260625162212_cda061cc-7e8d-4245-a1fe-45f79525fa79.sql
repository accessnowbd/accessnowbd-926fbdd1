GRANT INSERT, UPDATE, SELECT ON public.abandoned_checkouts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.abandoned_checkouts TO authenticated;
GRANT ALL ON public.abandoned_checkouts TO service_role;
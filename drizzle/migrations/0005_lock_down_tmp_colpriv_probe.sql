-- Temporary verification table: remove all access (kept empty and inert).
DROP POLICY IF EXISTS "probe read" ON public.tmp_colpriv_probe;
REVOKE ALL ON public.tmp_colpriv_probe FROM anon, authenticated;
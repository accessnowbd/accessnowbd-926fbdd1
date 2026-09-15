REVOKE SELECT ON public.tmp_colpriv_probe FROM anon;
GRANT SELECT (id, visible_col) ON public.tmp_colpriv_probe TO anon;
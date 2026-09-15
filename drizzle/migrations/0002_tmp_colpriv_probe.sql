CREATE TABLE public.tmp_colpriv_probe (id int primary key, visible_col text, secret_col text);
INSERT INTO public.tmp_colpriv_probe VALUES (1, 'ok', 'hidden');
GRANT SELECT (id, visible_col) ON public.tmp_colpriv_probe TO anon;
ALTER TABLE public.tmp_colpriv_probe ENABLE ROW LEVEL SECURITY;
CREATE POLICY "probe read" ON public.tmp_colpriv_probe FOR SELECT TO anon USING (true);
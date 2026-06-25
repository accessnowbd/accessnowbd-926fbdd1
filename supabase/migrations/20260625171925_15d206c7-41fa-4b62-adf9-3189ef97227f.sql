DROP POLICY IF EXISTS "Guests update anon abandoned checkouts" ON public.abandoned_checkouts;

CREATE POLICY "Guests update anon abandoned checkouts"
ON public.abandoned_checkouts
FOR UPDATE
TO anon
USING (user_id IS NULL)
WITH CHECK (user_id IS NULL);
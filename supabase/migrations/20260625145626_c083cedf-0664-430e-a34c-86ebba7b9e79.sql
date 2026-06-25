
-- Replace expression unique index with a real unique constraint on email
DROP INDEX IF EXISTS public.abandoned_checkouts_email_key;
-- Normalize any pre-existing emails to lowercase to avoid conflicts
UPDATE public.abandoned_checkouts SET email = lower(email) WHERE email <> lower(email);
ALTER TABLE public.abandoned_checkouts
  ADD CONSTRAINT abandoned_checkouts_email_key UNIQUE (email);

-- Grant anon INSERT and UPDATE (no SELECT — privacy)
GRANT INSERT, UPDATE ON public.abandoned_checkouts TO anon;

-- Allow guests to insert their own row (must have null user_id)
CREATE POLICY "Guests insert anon abandoned checkouts"
  ON public.abandoned_checkouts
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Allow guests to update their own row (still null user_id)
CREATE POLICY "Guests update anon abandoned checkouts"
  ON public.abandoned_checkouts
  FOR UPDATE
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS country  text DEFAULT 'Bangladesh';

UPDATE public.profiles SET country = 'Bangladesh' WHERE country IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL AND length(username) > 0;
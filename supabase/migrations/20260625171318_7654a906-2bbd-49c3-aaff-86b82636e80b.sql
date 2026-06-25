ALTER TABLE public.abandoned_checkouts
  ADD COLUMN IF NOT EXISTS session_key text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS page_url text,
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'intent',
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.abandoned_checkouts
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.abandoned_checkouts
  DROP CONSTRAINT IF EXISTS abandoned_checkouts_email_key;

DROP INDEX IF EXISTS public.abandoned_checkouts_email_key;

CREATE UNIQUE INDEX IF NOT EXISTS abandoned_checkouts_email_unique_idx
  ON public.abandoned_checkouts (lower(email))
  WHERE email IS NOT NULL AND email <> '';

CREATE UNIQUE INDEX IF NOT EXISTS abandoned_checkouts_session_key_unique_idx
  ON public.abandoned_checkouts (session_key)
  WHERE session_key IS NOT NULL AND session_key <> '';

CREATE INDEX IF NOT EXISTS abandoned_checkouts_last_seen_idx
  ON public.abandoned_checkouts (last_seen_at DESC);

ALTER TABLE public.abandoned_checkouts REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'abandoned_checkouts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.abandoned_checkouts;
  END IF;
END $$;
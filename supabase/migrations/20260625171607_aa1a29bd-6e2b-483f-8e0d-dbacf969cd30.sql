DROP INDEX IF EXISTS public.abandoned_checkouts_session_key_unique_idx;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'abandoned_checkouts_session_key_key'
      AND conrelid = 'public.abandoned_checkouts'::regclass
  ) THEN
    ALTER TABLE public.abandoned_checkouts
      ADD CONSTRAINT abandoned_checkouts_session_key_key UNIQUE (session_key);
  END IF;
END $$;
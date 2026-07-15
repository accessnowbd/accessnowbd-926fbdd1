
CREATE TABLE IF NOT EXISTS public.pageview_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  path text NOT NULL,
  referrer text,
  user_agent text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.pageview_events TO anon, authenticated;
GRANT SELECT, DELETE ON public.pageview_events TO authenticated;
GRANT ALL ON public.pageview_events TO service_role;

ALTER TABLE public.pageview_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can log a pageview"
  ON public.pageview_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(session_id) BETWEEN 1 AND 100
    AND length(path) BETWEEN 1 AND 500
    AND (referrer IS NULL OR length(referrer) <= 500)
    AND (user_agent IS NULL OR length(user_agent) <= 500)
    AND (country IS NULL OR length(country) <= 100)
  );

CREATE POLICY "admins read pageview events"
  ON public.pageview_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins delete pageview events"
  ON public.pageview_events
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS pageview_events_created_at_idx ON public.pageview_events USING BRIN (created_at);
CREATE INDEX IF NOT EXISTS pageview_events_recent_idx ON public.pageview_events (created_at DESC);

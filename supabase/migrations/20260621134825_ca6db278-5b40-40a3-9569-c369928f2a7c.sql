
-- Defense-in-depth: enforce admin-only SELECT via RESTRICTIVE policies

-- Newsletter subscribers
DROP POLICY IF EXISTS "Only admins read newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Only admins read newsletter subscribers"
  ON public.newsletter_subscribers
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated, anon
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Renewal reminder log
DROP POLICY IF EXISTS "Only admins read renewal log" ON public.renewal_reminders_sent;
CREATE POLICY "Only admins read renewal log"
  ON public.renewal_reminders_sent
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated, anon
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Tracking pixels (ad platform credentials)
DROP POLICY IF EXISTS "Only admins read tracking pixels" ON public.tracking_pixels;
CREATE POLICY "Only admins read tracking pixels"
  ON public.tracking_pixels
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated, anon
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

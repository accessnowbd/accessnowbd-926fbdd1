-- The restrictive read policy blocked the public (anon) pixel view.
-- Keep it restrictive but allow enabled rows; sensitive columns such as
-- access_token remain unreachable for anon/authenticated via column grants.
DROP POLICY IF EXISTS "Only admins read tracking pixels" ON public.tracking_pixels;

CREATE POLICY "Only admins read tracking pixels"
  ON public.tracking_pixels
  AS RESTRICTIVE
  FOR SELECT
  TO anon, authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR enabled = true);
-- Make the public tracking-pixels view respect the caller's own
-- permissions/RLS instead of the view owner's (security definer view).
-- Safe columns are granted explicitly; access_token stays admin-only.

GRANT SELECT (id, provider, pixel_id, account_id, conversion_label, enabled, events_config, custom_script, sort_order)
  ON public.tracking_pixels TO anon, authenticated;

CREATE POLICY "Public read enabled pixels"
  ON public.tracking_pixels
  FOR SELECT
  TO anon, authenticated
  USING (enabled = true);

ALTER VIEW public.tracking_pixels_public SET (security_invoker = true);

GRANT SELECT ON public.tracking_pixels_public TO anon, authenticated;
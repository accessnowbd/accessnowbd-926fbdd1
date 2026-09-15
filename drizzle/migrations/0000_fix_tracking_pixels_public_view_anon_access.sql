ALTER VIEW public.tracking_pixels_public SET (security_invoker = false);
GRANT SELECT ON public.tracking_pixels_public TO anon, authenticated;
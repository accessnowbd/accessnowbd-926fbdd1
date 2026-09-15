-- Internal admin annotations on license keys must not be readable by buyers.
-- Replace the table-wide SELECT grant with column-level grants that exclude `note`.
REVOKE SELECT ON public.product_license_keys FROM anon, authenticated;

GRANT SELECT (
  id, product_slug, variant_id, license_key, status,
  assigned_order_id, assigned_user_id, assigned_at, created_at
) ON public.product_license_keys TO authenticated;

GRANT ALL ON public.product_license_keys TO service_role;
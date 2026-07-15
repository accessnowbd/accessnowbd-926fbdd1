DROP POLICY IF EXISTS "Public can submit payment links" ON public.admin_records;
CREATE POLICY "Public can submit payment links"
ON public.admin_records
FOR INSERT
TO anon, authenticated
WITH CHECK (
  kind = 'payment_link_submission'
  AND is_active = false
  AND jsonb_typeof(data) = 'object'
  AND length(coalesce(data->>'link_slug', '')) BETWEEN 1 AND 120
  AND length(coalesce(data->>'full_name', '')) BETWEEN 1 AND 120
  AND length(coalesce(data->>'phone', '')) BETWEEN 6 AND 30
  AND length(coalesce(data->>'sender_number', '')) BETWEEN 6 AND 30
  AND length(coalesce(data->>'txn_id', '')) BETWEEN 6 AND 120
  AND coalesce(data->>'status', 'pending') = 'pending'
);
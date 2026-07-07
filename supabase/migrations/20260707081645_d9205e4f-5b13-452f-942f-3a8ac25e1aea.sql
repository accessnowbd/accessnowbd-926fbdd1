DROP POLICY IF EXISTS "Users update own reviews" ON public.product_reviews;
CREATE POLICY "Users update own reviews"
ON public.product_reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (is_approved IS NULL OR is_approved = false OR public.has_role(auth.uid(), 'admin'::public.app_role))
);
-- Belt-and-suspenders: prevent non-admins from self-approving product reviews at the RLS layer
-- (a trigger already blocks this; adding an explicit RESTRICTIVE UPDATE policy so the rule
-- is enforced by Row Level Security even if the trigger is ever changed).

DROP POLICY IF EXISTS "Non-admins cannot self-approve reviews" ON public.product_reviews;

CREATE POLICY "Non-admins cannot self-approve reviews"
ON public.product_reviews
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  is_approved = false
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

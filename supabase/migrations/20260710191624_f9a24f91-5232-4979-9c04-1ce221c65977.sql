
-- 1. Extend orders --------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'web'
    CHECK (source IN ('web','telegram_bot','admin')),
  ADD COLUMN IF NOT EXISTS telegram_chat_id bigint;
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders(source);
CREATE INDEX IF NOT EXISTS idx_orders_telegram_chat ON public.orders(telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;

-- 2. Wishlist (product_slug FK) ------------------------------------------
CREATE TABLE IF NOT EXISTS public.telegram_wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL,
  product_slug text NOT NULL REFERENCES public.products(slug) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chat_id, product_slug)
);
GRANT SELECT ON public.telegram_wishlist TO authenticated;
GRANT ALL ON public.telegram_wishlist TO service_role;
ALTER TABLE public.telegram_wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read wishlist" ON public.telegram_wishlist
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE INDEX IF NOT EXISTS idx_tg_wishlist_chat ON public.telegram_wishlist(chat_id);

-- 3. Broadcasts -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telegram_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  audience text NOT NULL DEFAULT 'all'
    CHECK (audience IN ('all','customers','buyers_30d','wishlist_product')),
  audience_ref text,
  message text NOT NULL,
  photo_url text,
  buttons jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sending','sent','failed','cancelled')),
  target_count int NOT NULL DEFAULT 0,
  sent_count int NOT NULL DEFAULT 0,
  failed_count int NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.telegram_broadcasts TO authenticated;
GRANT ALL ON public.telegram_broadcasts TO service_role;
ALTER TABLE public.telegram_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage broadcasts" ON public.telegram_broadcasts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4. Admin OTP ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telegram_admin_otp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL,
  email text NOT NULL,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.telegram_admin_otp TO service_role;
ALTER TABLE public.telegram_admin_otp ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_tg_admin_otp_chat ON public.telegram_admin_otp(chat_id, expires_at DESC);

-- 5. Referrals ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telegram_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_chat_id bigint NOT NULL,
  referred_chat_id bigint NOT NULL UNIQUE,
  first_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  rewarded boolean NOT NULL DEFAULT false,
  reward_amount numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  rewarded_at timestamptz
);
GRANT SELECT ON public.telegram_referrals TO authenticated;
GRANT ALL ON public.telegram_referrals TO service_role;
ALTER TABLE public.telegram_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read referrals" ON public.telegram_referrals
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE INDEX IF NOT EXISTS idx_tg_refs_referrer ON public.telegram_referrals(referrer_chat_id);

-- 6. Extra columns on telegram_subscribers --------------------------------
ALTER TABLE public.telegram_subscribers
  ADD COLUMN IF NOT EXISTS notify_orders boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_promos boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS bot_kind text NOT NULL DEFAULT 'store_bot'
    CHECK (bot_kind IN ('store_bot','order_bot','admin_bot'));

-- 7. Order sync trigger ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.telegram_order_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event text;
  v_url text := 'https://project--4e9c9e20-27d9-4789-abed-a88ebc4d1cc3.lovable.app/api/public/telegram/order-sync';
  v_secret text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event := 'order.created';
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    v_event := 'order.status_changed';
  ELSE
    RETURN NEW;
  END IF;

  BEGIN
    SELECT decrypted_secret INTO v_secret
      FROM vault.decrypted_secrets WHERE name = 'telegram_sync_secret' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN v_secret := NULL;
  END;

  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Sync-Secret', COALESCE(v_secret, '')
      ),
      body := jsonb_build_object(
        'event', v_event,
        'order_id', NEW.id,
        'status', NEW.status,
        'previous_status', CASE WHEN TG_OP='UPDATE' THEN OLD.status ELSE NULL END,
        'source', NEW.source,
        'telegram_chat_id', NEW.telegram_chat_id
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'telegram_order_sync http_post failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_telegram_order_sync_ins ON public.orders;
CREATE TRIGGER trg_telegram_order_sync_ins
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.telegram_order_sync();

DROP TRIGGER IF EXISTS trg_telegram_order_sync_upd ON public.orders;
CREATE TRIGGER trg_telegram_order_sync_upd
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.telegram_order_sync();

-- 8. Admin analytics RPC --------------------------------------------------
CREATE OR REPLACE FUNCTION public.telegram_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT jsonb_build_object(
    'today_orders',   (SELECT count(*) FROM public.orders WHERE created_at::date = current_date),
    'today_revenue',  (SELECT COALESCE(sum(total),0) FROM public.orders WHERE created_at::date = current_date AND status IN ('completed','confirmed','processing')),
    'pending_orders', (SELECT count(*) FROM public.orders WHERE status = 'pending'),
    'week_revenue',   (SELECT COALESCE(sum(total),0) FROM public.orders WHERE created_at >= now() - interval '7 days' AND status IN ('completed','confirmed','processing')),
    'month_revenue',  (SELECT COALESCE(sum(total),0) FROM public.orders WHERE created_at >= now() - interval '30 days' AND status IN ('completed','confirmed','processing')),
    'total_customers',(SELECT count(*) FROM public.telegram_subscribers WHERE role = 'customer'),
    'open_tickets',   (SELECT count(*) FROM public.support_tickets WHERE status IN ('open','pending')),
    'pending_topups', (SELECT count(*) FROM public.wallet_topups WHERE status = 'pending')
  ) INTO v;
  RETURN v;
END;
$$;
GRANT EXECUTE ON FUNCTION public.telegram_admin_stats() TO authenticated, service_role;

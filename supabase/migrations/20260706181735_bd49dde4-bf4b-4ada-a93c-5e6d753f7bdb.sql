
-- 1) Telegram settings (per-kind config: 'order_bot' or 'store_bot')
CREATE TABLE public.telegram_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_settings TO authenticated;
GRANT ALL ON public.telegram_settings TO service_role;
ALTER TABLE public.telegram_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage telegram settings" ON public.telegram_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE TRIGGER telegram_settings_touch BEFORE UPDATE ON public.telegram_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) Telegram subscribers (chat_id ↔ user)
CREATE TABLE public.telegram_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  username text,
  first_name text,
  last_name text,
  role text NOT NULL DEFAULT 'customer',   -- 'admin' | 'customer'
  language text DEFAULT 'bn',
  is_blocked boolean NOT NULL DEFAULT false,
  cart jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{slug,qty}]
  state jsonb NOT NULL DEFAULT '{}'::jsonb, -- current step (checkout name/phone/addr)
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_subscribers TO authenticated;
GRANT ALL ON public.telegram_subscribers TO service_role;
ALTER TABLE public.telegram_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage subscribers" ON public.telegram_subscribers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Users see own subscription" ON public.telegram_subscribers
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER telegram_subscribers_touch BEFORE UPDATE ON public.telegram_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3) Notification log (audit)
CREATE TABLE public.telegram_notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,          -- e.g. 'order.created', 'order.paid'
  chat_id bigint,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending', -- 'sent' | 'failed' | 'pending'
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_notifications_log TO authenticated;
GRANT ALL ON public.telegram_notifications_log TO service_role;
ALTER TABLE public.telegram_notifications_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read log" ON public.telegram_notifications_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Service writes log" ON public.telegram_notifications_log
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

CREATE INDEX telegram_log_created_idx ON public.telegram_notifications_log (created_at DESC);
CREATE INDEX telegram_subscribers_role_idx ON public.telegram_subscribers (role) WHERE is_blocked = false;

-- 4) Seed default settings rows
INSERT INTO public.telegram_settings (kind, enabled, config) VALUES
  ('order_bot', false, jsonb_build_object(
    'admin_chat_ids', '[]'::jsonb,
    'events', jsonb_build_object(
      'order_created', true,
      'order_paid', true,
      'order_shipped', true,
      'order_completed', true,
      'order_cancelled', true,
      'order_refunded', true,
      'abandoned_checkout', false,
      'low_stock', false,
      'new_review', false
    ),
    'templates', jsonb_build_object(
      'order_created', '🆕 <b>New Order</b> #{{order_id}}%0A👤 {{customer}}%0A💰 ৳{{total}}%0A📦 {{items}}',
      'order_paid', '✅ <b>Payment Received</b> #{{order_id}} — ৳{{total}}',
      'order_shipped', '🚚 <b>Shipped</b> #{{order_id}} — {{customer}}',
      'order_completed', '🎉 <b>Completed</b> #{{order_id}}',
      'order_cancelled', '❌ <b>Cancelled</b> #{{order_id}}',
      'order_refunded', '↩️ <b>Refunded</b> #{{order_id}} — ৳{{total}}',
      'abandoned_checkout', '🛒 <b>Abandoned Cart</b> {{customer}} — ৳{{total}}',
      'low_stock', '⚠️ <b>Low Stock</b> {{product}} — {{stock}} left',
      'new_review', '⭐ <b>New Review</b> {{rating}}/5 on {{product}}'
    )
  ))
ON CONFLICT (kind) DO NOTHING;

INSERT INTO public.telegram_settings (kind, enabled, config) VALUES
  ('store_bot', false, jsonb_build_object(
    'welcome_message', '👋 স্বাগতম <b>AccessNow BD</b>-তে!%0A%0A/browse — প্রোডাক্ট দেখুন%0A/cart — কার্ট%0A/orders — আমার অর্ডার%0A/help — সাহায্য',
    'browse_mode', 'featured',
    'per_page', 5,
    'checkout_mode', 'inline',
    'buy_link_fallback', 'https://accessnowbd.com/product/{{slug}}',
    'closed_message', 'Store এখন বন্ধ আছে। কিছুক্ষণ পর আবার চেষ্টা করুন।'
  ))
ON CONFLICT (kind) DO NOTHING;

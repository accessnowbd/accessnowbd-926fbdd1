
CREATE INDEX IF NOT EXISTS idx_tg_subs_bot_active
  ON public.telegram_subscribers (bot_kind)
  WHERE is_blocked = false;

CREATE INDEX IF NOT EXISTS idx_tg_subs_bot_role_active
  ON public.telegram_subscribers (bot_kind, role)
  WHERE is_blocked = false;

CREATE INDEX IF NOT EXISTS idx_tg_subs_promos
  ON public.telegram_subscribers (bot_kind)
  WHERE is_blocked = false AND notify_promos IS NOT FALSE;

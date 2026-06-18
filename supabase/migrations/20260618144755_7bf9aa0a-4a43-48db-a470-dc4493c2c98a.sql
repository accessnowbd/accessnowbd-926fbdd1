-- ============ Newsletter subscribers ============
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','unsubscribed','bounced')),
  source text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT ALL ON public.newsletter_subscribers TO service_role;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage subscribers" ON public.newsletter_subscribers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'active');

CREATE TRIGGER newsletter_subscribers_touch
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ Ticket reply messages ============
CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('user','admin')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_messages_ticket ON public.ticket_messages(ticket_id, created_at);

GRANT SELECT, INSERT ON public.ticket_messages TO authenticated;
GRANT ALL ON public.ticket_messages TO service_role;

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read their ticket messages" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_messages.ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners write to their ticket" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND (
      (sender_role = 'admin' AND public.has_role(auth.uid(), 'admin'::public.app_role))
      OR (
        sender_role = 'user'
        AND EXISTS (
          SELECT 1 FROM public.support_tickets t
          WHERE t.id = ticket_messages.ticket_id AND t.user_id = auth.uid()
        )
      )
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;

-- ============ Renewal reminders log ============
CREATE TABLE public.renewal_reminders_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  recipient_email text NOT NULL,
  expiry_date date NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, item_key, expiry_date)
);

GRANT SELECT, INSERT, DELETE ON public.renewal_reminders_sent TO authenticated;
GRANT ALL ON public.renewal_reminders_sent TO service_role;

ALTER TABLE public.renewal_reminders_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage renewal log" ON public.renewal_reminders_sent
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE OR REPLACE FUNCTION public.capture_abandoned_checkout(
  _session_key text,
  _user_id uuid,
  _full_name text,
  _email text,
  _phone text,
  _items jsonb,
  _subtotal numeric,
  _total numeric,
  _coupon_code text,
  _source text,
  _stage text,
  _page_url text,
  _metadata jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
  _safe_user uuid := auth.uid();
  _clean_session text := nullif(trim(coalesce(_session_key, '')), '');
  _clean_email text := nullif(lower(trim(coalesce(_email, ''))), '');
BEGIN
  IF _clean_session IS NULL THEN
    RAISE EXCEPTION 'Missing session key';
  END IF;

  IF _safe_user IS NULL THEN
    _user_id := NULL;
  ELSE
    _user_id := _safe_user;
  END IF;

  INSERT INTO public.abandoned_checkouts (
    session_key, user_id, full_name, email, phone, items, subtotal, total,
    coupon_code, status, source, stage, page_url, last_seen_at, metadata
  ) VALUES (
    _clean_session, _user_id, coalesce(_full_name, ''), _clean_email, coalesce(_phone, ''),
    coalesce(_items, '[]'::jsonb), coalesce(_subtotal, 0), coalesce(_total, 0),
    nullif(trim(coalesce(_coupon_code, '')), ''), 'pending', coalesce(_source, 'site'),
    coalesce(_stage, 'intent'), _page_url, now(), coalesce(_metadata, '{}'::jsonb)
  )
  ON CONFLICT (session_key) DO UPDATE SET
    user_id = coalesce(EXCLUDED.user_id, public.abandoned_checkouts.user_id),
    full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.abandoned_checkouts.full_name END,
    email = coalesce(EXCLUDED.email, public.abandoned_checkouts.email),
    phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.abandoned_checkouts.phone END,
    items = CASE WHEN jsonb_array_length(EXCLUDED.items) > 0 THEN EXCLUDED.items ELSE public.abandoned_checkouts.items END,
    subtotal = EXCLUDED.subtotal,
    total = EXCLUDED.total,
    coupon_code = coalesce(EXCLUDED.coupon_code, public.abandoned_checkouts.coupon_code),
    status = CASE WHEN public.abandoned_checkouts.status = 'recovered' THEN public.abandoned_checkouts.status ELSE 'pending' END,
    source = EXCLUDED.source,
    stage = EXCLUDED.stage,
    page_url = EXCLUDED.page_url,
    last_seen_at = now(),
    metadata = coalesce(public.abandoned_checkouts.metadata, '{}'::jsonb) || coalesce(EXCLUDED.metadata, '{}'::jsonb)
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.capture_abandoned_checkout(text, uuid, text, text, text, jsonb, numeric, numeric, text, text, text, text, jsonb) TO anon, authenticated;

-- Product change → notify Telegram store bot subscribers
CREATE OR REPLACE FUNCTION public.telegram_product_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_url text := 'https://project--4e9c9e20-27d9-4789-abed-a88ebc4d1cc3.lovable.app/api/public/telegram/product-sync';
  v_secret text;
  v_event text;
  v_slug text;
  v_name text;
  v_payload jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_active IS NOT TRUE THEN RETURN NEW; END IF;
    v_event := 'product.created';
    v_slug := NEW.slug; v_name := NEW.name;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active IS NOT TRUE AND NEW.is_active IS TRUE THEN
      v_event := 'product.created';
    ELSIF OLD.is_active IS TRUE AND NEW.is_active IS NOT TRUE THEN
      v_event := 'product.deleted';
    ELSIF NEW.plans IS DISTINCT FROM OLD.plans THEN
      v_event := 'product.price_changed';
    ELSIF NEW.name IS DISTINCT FROM OLD.name
       OR NEW.tagline IS DISTINCT FROM OLD.tagline
       OR NEW.short_description IS DISTINCT FROM OLD.short_description
       OR NEW.image_url IS DISTINCT FROM OLD.image_url THEN
      v_event := 'product.updated';
    ELSE
      RETURN NEW;
    END IF;
    v_slug := NEW.slug; v_name := NEW.name;
  ELSIF TG_OP = 'DELETE' THEN
    v_event := 'product.deleted';
    v_slug := OLD.slug; v_name := OLD.name;
  ELSE
    RETURN NULL;
  END IF;

  BEGIN
    SELECT decrypted_secret INTO v_secret
      FROM vault.decrypted_secrets WHERE name = 'telegram_sync_secret' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN v_secret := NULL;
  END;

  v_payload := jsonb_build_object(
    'event', v_event,
    'slug', v_slug,
    'name', v_name
  );

  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Sync-Secret', COALESCE(v_secret, '')
      ),
      body := v_payload
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'telegram_product_sync failed: %', SQLERRM;
  END;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_telegram_product_sync_ins ON public.products;
DROP TRIGGER IF EXISTS trg_telegram_product_sync_upd ON public.products;
DROP TRIGGER IF EXISTS trg_telegram_product_sync_del ON public.products;

CREATE TRIGGER trg_telegram_product_sync_ins
  AFTER INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.telegram_product_sync();

CREATE TRIGGER trg_telegram_product_sync_upd
  AFTER UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.telegram_product_sync();

CREATE TRIGGER trg_telegram_product_sync_del
  AFTER DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.telegram_product_sync();

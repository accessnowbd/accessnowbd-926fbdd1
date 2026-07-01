
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS email text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_name text := COALESCE(
    NULLIF(meta->>'display_name',''),
    NULLIF(meta->>'full_name',''),
    NULLIF(meta->>'name',''),
    NULLIF(TRIM(CONCAT_WS(' ', meta->>'given_name', meta->>'family_name')),''),
    split_part(NEW.email, '@', 1)
  );
  v_avatar text := COALESCE(
    NULLIF(meta->>'avatar_url',''),
    NULLIF(meta->>'picture','')
  );
  v_phone text := COALESCE(NULLIF(meta->>'phone',''), NULLIF(NEW.phone,''));
BEGIN
  INSERT INTO public.profiles (id, display_name, phone, avatar_url, email)
  VALUES (NEW.id, v_name, v_phone, v_avatar, NEW.email)
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(NULLIF(public.profiles.display_name,''), EXCLUDED.display_name),
    phone        = COALESCE(NULLIF(public.profiles.phone,''), EXCLUDED.phone),
    avatar_url   = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    email        = COALESCE(EXCLUDED.email, public.profiles.email),
    updated_at   = now();

  IF lower(NEW.email) = 'accessnowbd01@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure trigger on auth.users exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Also sync on updates (e.g. when Google metadata refreshes)
CREATE OR REPLACE FUNCTION public.sync_user_profile_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_name text := COALESCE(
    NULLIF(meta->>'display_name',''),
    NULLIF(meta->>'full_name',''),
    NULLIF(meta->>'name',''),
    NULLIF(TRIM(CONCAT_WS(' ', meta->>'given_name', meta->>'family_name')),'')
  );
  v_avatar text := COALESCE(NULLIF(meta->>'avatar_url',''), NULLIF(meta->>'picture',''));
BEGIN
  UPDATE public.profiles SET
    display_name = COALESCE(NULLIF(display_name,''), v_name),
    avatar_url   = COALESCE(v_avatar, avatar_url),
    email        = COALESCE(NEW.email, email),
    updated_at   = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_profile_on_update();

-- Backfill existing profiles from auth.users metadata
UPDATE public.profiles p SET
  display_name = COALESCE(NULLIF(p.display_name,''),
    NULLIF(u.raw_user_meta_data->>'full_name',''),
    NULLIF(u.raw_user_meta_data->>'name',''),
    NULLIF(TRIM(CONCAT_WS(' ', u.raw_user_meta_data->>'given_name', u.raw_user_meta_data->>'family_name')),''),
    split_part(u.email,'@',1)),
  avatar_url = COALESCE(p.avatar_url,
    NULLIF(u.raw_user_meta_data->>'avatar_url',''),
    NULLIF(u.raw_user_meta_data->>'picture','')),
  email = COALESCE(p.email, u.email),
  updated_at = now()
FROM auth.users u
WHERE u.id = p.id;

-- Insert profiles for any auth users missing one
INSERT INTO public.profiles (id, display_name, avatar_url, email)
SELECT u.id,
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'full_name',''),
    NULLIF(u.raw_user_meta_data->>'name',''),
    split_part(u.email,'@',1)
  ),
  COALESCE(NULLIF(u.raw_user_meta_data->>'avatar_url',''), NULLIF(u.raw_user_meta_data->>'picture','')),
  u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

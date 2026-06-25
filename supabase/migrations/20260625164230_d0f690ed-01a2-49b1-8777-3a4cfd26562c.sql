
-- =========================================================
-- PHASE 1: Product Management foundation
-- =========================================================

-- ---- ENUMS ----
DO $$ BEGIN
  CREATE TYPE public.product_status AS ENUM ('draft','scheduled','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.license_key_status AS ENUM ('available','assigned','revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---- CATEGORIES (nested) ----
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT
  USING (is_active = true OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER categories_touch BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---- BRANDS ----
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.brands TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active brands" ON public.brands FOR SELECT
  USING (is_active = true OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage brands" ON public.brands FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER brands_touch BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---- TAGS ----
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Admins manage tags" ON public.tags FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ---- PRODUCTS: new columns ----
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seo_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_keywords text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS og_image text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS canonical_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz,
  ADD COLUMN IF NOT EXISTS status public.product_status NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS is_digital boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS download_limit integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique ON public.products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_scheduled ON public.products(scheduled_publish_at) WHERE status = 'scheduled';

-- ---- PRODUCT <-> TAGS ----
CREATE TABLE IF NOT EXISTS public.product_tags (
  product_slug text NOT NULL REFERENCES public.products(slug) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_slug, tag_id)
);
GRANT SELECT ON public.product_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_tags TO authenticated;
GRANT ALL ON public.product_tags TO service_role;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_tags" ON public.product_tags FOR SELECT USING (true);
CREATE POLICY "Admins manage product_tags" ON public.product_tags FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ---- PRODUCT MEDIA (gallery) ----
CREATE TABLE IF NOT EXISTS public.product_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL REFERENCES public.products(slug) ON DELETE CASCADE,
  url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_media_slug ON public.product_media(product_slug, sort_order);
GRANT SELECT ON public.product_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_media TO authenticated;
GRANT ALL ON public.product_media TO service_role;
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_media" ON public.product_media FOR SELECT USING (true);
CREATE POLICY "Admins manage product_media" ON public.product_media FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ---- PRODUCT VARIANTS ----
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL REFERENCES public.products(slug) ON DELETE CASCADE,
  name text NOT NULL,
  options jsonb NOT NULL DEFAULT '{}'::jsonb,
  sku text,
  price numeric(12,2),
  compare_at_price numeric(12,2),
  stock integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_variants_slug ON public.product_variants(product_slug);
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read variants" ON public.product_variants FOR SELECT
  USING (is_active OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage variants" ON public.product_variants FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER variants_touch BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---- DIGITAL FILES ----
CREATE TABLE IF NOT EXISTS public.product_digital_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL REFERENCES public.products(slug) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  content_type text NOT NULL DEFAULT '',
  download_limit_per_order integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_digital_files_slug ON public.product_digital_files(product_slug);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_digital_files TO authenticated;
GRANT ALL ON public.product_digital_files TO service_role;
ALTER TABLE public.product_digital_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage digital files" ON public.product_digital_files FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
-- Buyers will access files through a server function that uses service role + checks order ownership.

-- ---- LICENSE KEYS ----
CREATE TABLE IF NOT EXISTS public.product_license_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL REFERENCES public.products(slug) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  license_key text NOT NULL,
  status public.license_key_status NOT NULL DEFAULT 'available',
  assigned_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_slug, license_key)
);
CREATE INDEX IF NOT EXISTS idx_license_keys_status ON public.product_license_keys(product_slug, status);
CREATE INDEX IF NOT EXISTS idx_license_keys_user ON public.product_license_keys(assigned_user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_license_keys TO authenticated;
GRANT ALL ON public.product_license_keys TO service_role;
ALTER TABLE public.product_license_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage license keys" ON public.product_license_keys FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Buyers can view their license keys" ON public.product_license_keys FOR SELECT
  USING (assigned_user_id = auth.uid());

-- ---- DIGITAL DOWNLOAD LOG ----
CREATE TABLE IF NOT EXISTS public.digital_downloads_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_slug text NOT NULL REFERENCES public.products(slug) ON DELETE CASCADE,
  file_id uuid REFERENCES public.product_digital_files(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  ip text NOT NULL DEFAULT '',
  downloaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_downloads_user_order ON public.digital_downloads_log(user_id, order_id);
GRANT SELECT, INSERT ON public.digital_downloads_log TO authenticated;
GRANT ALL ON public.digital_downloads_log TO service_role;
ALTER TABLE public.digital_downloads_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own downloads" ON public.digital_downloads_log FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage downloads log" ON public.digital_downloads_log FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

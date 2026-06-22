
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_records WHERE kind = 'banner_slider') THEN
    INSERT INTO public.admin_records (kind, is_active, sort_order, data) VALUES
    ('banner_slider', true, 0, jsonb_build_object(
      'color_preset', 'ruby', 'bg_style', 'spotlight',
      'category', 'STREAMING · DIGITAL',
      'title', 'Netflix Premium Subscription',
      'subtitle', 'অ্যাড-ফ্রি স্ট্রিমিং উপভোগ করুন — মাত্র ৳350 থেকে',
      'cta', 'এখনই কিনুন', 'link', '/streaming',
      'secondary_cta', 'Details', 'secondary_link', '/streaming',
      'delivery_text', 'Instant', 'support_text', '24/7', 'rating_text', '4.9 ★'
    )),
    ('banner_slider', true, 1, jsonb_build_object(
      'color_preset', 'spotify', 'bg_style', 'aurora',
      'category', 'MUSIC · DIGITAL',
      'title', 'Spotify Premium Family',
      'subtitle', 'অ্যাড-ফ্রি মিউজিক ৬ জন ব্যবহারকারীর জন্য — মাত্র ৳299',
      'cta', 'এখনই কিনুন', 'link', '/products',
      'secondary_cta', 'Details', 'secondary_link', '/products',
      'delivery_text', 'Instant', 'support_text', '24/7', 'rating_text', '4.9 ★'
    )),
    ('banner_slider', true, 2, jsonb_build_object(
      'color_preset', 'canva', 'bg_style', 'mesh',
      'category', 'DESIGN · DIGITAL',
      'title', 'Canva Pro Subscription',
      'subtitle', 'প্রিমিয়াম ডিজাইন টুলস — মাত্র ৳450 থেকে',
      'cta', 'এখনই কিনুন', 'link', '/products',
      'secondary_cta', 'Details', 'secondary_link', '/products',
      'delivery_text', 'Instant', 'support_text', '24/7', 'rating_text', '4.9 ★'
    ));
  END IF;
END $$;

## লক্ষ্য
`/admin/homepage-editor` — এখান থেকে homepage এর প্রতিটি section (banner, categories, trust badges, product rails, bundles, activity ticker, SEO) সম্পূর্ণ manage করা যাবে। এখন menu-তে entry আছে কিন্তু কোনো route file নেই — click করলে 404 দেখাবে।

## বর্তমান অবস্থা (`src/routes/index.tsx`)
- ✅ **Hero Banner Slider** — ইতিমধ্যেই DB-backed (`admin_records.kind='banner_slider'`) এবং `/admin/hero-banners` থেকে edit হয়
- ❌ **Category Pills** — hardcoded `CATEGORY_DECK` array
- ❌ **Trust Badges** — hardcoded `TRUST_ITEMS`
- ❌ **Feature Bundles** — hardcoded `FEATURE_BUNDLES`
- ❌ **Activity Ticker** — hardcoded `ACTIVITY`
- ❌ **Product Rails** — hardcoded category list
- ❌ **Featured Products** — কোন-কোনটা featured সেটা set করার UI নেই
- ❌ **Section on/off** — কোন section homepage-এ দেখাবে সেটা toggle করার উপায় নেই
- ❌ **SEO** — homepage title/description hardcoded

## যা তৈরি হবে

### 1) নতুন DB entry: `homepage_config`
`admin_records` টেবিলে একটি row (`kind='homepage_config'`) যা সব setting একসাথে ধরবে:
```json
{
  "sections": {
    "hero": { "enabled": true, "order": 1 },
    "categoryPills": { "enabled": true, "order": 2 },
    "trustBadges": { "enabled": true, "order": 3 },
    "featured": { "enabled": true, "order": 4, "productSlugs": [...] },
    "bundles": { "enabled": true, "order": 5 },
    "activityTicker": { "enabled": true, "order": 6 },
    "rails": { "enabled": true, "order": 7, "categories": ["ai-tools", ...] },
    "recentlyViewed": { "enabled": true, "order": 8 }
  },
  "categoryPills": [{ "title": "...", "label": "...", "icon": "PlayCircle", "to": "/streaming", "count": "12+" }],
  "trustBadges": [{ "icon": "Clock3", "title": "...", "text": "..." }],
  "bundles": [{ "title": "Creator Stack", "items": [...], "price": "৳499+", "link": "..." }],
  "activityLines": ["Tahsin K. · ChatGPT Plus...", ...],
  "seo": { "title": "...", "description": "...", "ogTitle": "...", "ogDescription": "..." }
}
```

Public SELECT policy already covers `admin_records` where `is_active`, তাই homepage এটা read করতে পারবে।

### 2) নতুন route: `src/routes/admin.homepage-editor.tsx`
Tab-based editor:

- **Overview tab** — সব section এর enable toggle + drag-to-reorder
- **Hero Banners tab** — Link out to existing `/admin/hero-banners` (এখনই DB-backed)
- **Category Pills tab** — Add/edit/remove/reorder pills (title, label, Lucide icon picker, target route, count text)
- **Trust Badges tab** — Add/edit/remove badges (icon, title, text)
- **Featured Products tab** — Product picker (multiselect from `products` table); ordered list
- **Bundles tab** — Add/edit stacks (title, item list, price text, link)
- **Activity Ticker tab** — Textarea per line, add/remove/reorder
- **Product Rails tab** — Which categories show as rails, ordering
- **SEO tab** — Title, description, OG title/description edit

Common UX per tab: preview, save button, "Reset to default" per section, success toast, disabled state while saving।

### 3) Homepage refactor (`src/routes/index.tsx`)
- একটি `useHomepageConfig()` hook — `admin_records` থেকে config fetch + fallback to hardcoded defaults যদি row না থাকে
- Section render loop: enabled sections কে order অনুযায়ী দেখাবে
- Category pills, trust items, bundles, activity — সব DB থেকে (fallback defaults সহ যাতে DB blank থাকলেও site ভাঙে না)
- Featured products slugs list DB-driven; product data existing `useProducts` hook থেকে
- SEO meta: loader-এ config load করে `head()` এ inject

### 4) Icon picker helper
Lucide-react icons এর curated list (~40টা) থেকে dropdown—user string name save করবে, render-time এ map lookup।

## Technical Notes
- `admin_records` schema already RLS-secured (admin write, public read for active)। নতুন migration লাগবে না — শুধু `homepage_config` kind এর row app-side upsert হবে।
- Homepage index route এর existing `loader` extend করে config parallel-fetch হবে যাতে SSR HTML এ meta ঠিক থাকে
- Section reordering: config এর `order` field অনুযায়ী sort — drag-drop `@dnd-kit/sortable` ইতিমধ্যেই installed কিনা চেক করে সেটা use করব, নাহলে simple up/down button
- সব save operation optimistic UI + toast notification
- `useHomepageConfig` realtime subscription — admin edit করার সাথে সাথে homepage refresh হবে (Hero banner এর মতো pattern)

## Files Impact
- **New**: `src/routes/admin.homepage-editor.tsx`, `src/hooks/useHomepageConfig.ts`, `src/lib/homepage-defaults.ts` (fallback data + Lucide icon map)
- **Edit**: `src/routes/index.tsx` (config-driven rendering)
- **No schema migration needed** (uses existing `admin_records`)

Approve করলে ধাপে ধাপে build শুরু করব।

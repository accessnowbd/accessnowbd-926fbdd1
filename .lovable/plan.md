
## Product Management — Full Build Plan

বড় কাজ — তাই কয়েকটি phase এ ভাগ করে delivery করব, প্রতিটি phase শেষে preview এ check করতে পারবে।

### Phase 1 — Schema + Taxonomy (database foundation)
- `categories` table (name, slug, parent_id → nested sub-category সাপোর্ট)
- `brands` table (name, slug, logo_url)
- `tags` table + `product_tags` join
- `products` এ নতুন কলাম: `sku`, `category_id`, `brand_id`, `seo_title`, `seo_description`, `seo_keywords`, `og_image`, `scheduled_publish_at`, `status` (draft/scheduled/published/archived)
- `product_variants` table (option_name, option_value, price_override, stock, sku)
- `product_media` table (gallery: url, sort_order, alt)
- `product_digital_files` table (file_url, file_name, size, download_limit_per_user)
- `product_license_keys` table (product_id, key, status: available/assigned, assigned_order_id)
- `digital_downloads_log` table (user_id, product_id, order_id, downloaded_at) — limit enforce
- RLS: admin full access, public read শুধু published products
- Storage bucket: `product-files` (private) for digital files

### Phase 2 — Admin UI: Product List + CRUD
- `/admin/products` redesign — abandoned-checkout style (header + stat cards + search/filter pill tabs + table)
- Columns: Image, Name, SKU, Category, Brand, Price, Stock, Status, Actions
- Pill filters: All / Published / Draft / Scheduled / Archived / Out of Stock
- Search: name, SKU
- Bulk select + bulk actions (publish/unpublish/delete/category change/price change)
- Action icons: View, Edit, Duplicate, Delete

### Phase 3 — Product Add/Edit page (`/admin/products/new`, `/admin/products/:id/edit`)
Tabbed form:
1. **Basic** — name, slug (auto), SKU, short/long description, price, compare-at price, stock
2. **Taxonomy** — category (cascading parent/sub), brand (dropdown + quick-add), tags (multi-select + quick-add)
3. **Media** — drag-drop gallery upload, sort, alt text, primary image marker
4. **Variants** — option groups (e.g. "Plan: 1 month/3 month/1 year") with per-variant price/stock/SKU
5. **Digital Delivery** — toggle "Digital product", upload files, download limit per order, license keys (paste bulk or one-per-line)
6. **SEO** — meta title, meta description, focus keywords, OG image, canonical, slug preview
7. **Publish** — status (draft/published), schedule publish datetime, visibility

### Phase 4 — Category / Brand / Tag management pages
- `/admin/categories` — tree view, add/edit/delete, drag-reorder, parent assignment
- `/admin/brands` — grid with logo, add/edit/delete
- `/admin/tags` — list + add/edit/delete, usage count

### Phase 5 — Bulk Import (CSV) + Bulk Edit
- `/admin/products/import` — CSV upload, column-mapping UI, preview, validation errors, commit
- Template download (sample CSV)
- Bulk edit modal from product list: change category/brand/price (+%/-%/fixed)/status for selected rows

### Phase 6 — Scheduled Publish + Public site integration
- pg_cron job (every 5 min) → flips `status='scheduled'` rows whose `scheduled_publish_at <= now()` to `published`
- Public product page reads SEO fields → injects into route `head()`
- Product detail page shows gallery carousel, variant selector affects price/stock, "Buy" enforces stock
- After purchase (order completed): assign next available license key + grant downloads access
- Digital download endpoint enforces `download_limit` via `digital_downloads_log` count

### Phase 7 — License key delivery
- Order completion trigger: pick unassigned key per digital product → assign to order
- Customer order page shows license keys + download buttons with remaining count

### Technical notes
- Stack: TanStack Start + Supabase (Lovable Cloud), zod validation, react-hook-form, sonner toasts
- All admin pages use existing `AdminPageHeader` + admin design system tokens (.a-* classes)
- File uploads via `admin-uploads` (images) and new private `product-files` bucket (digital, signed URLs only)
- Server functions for: bulk import parse, license assignment, digital download URL signing
- pg_cron + pg_net for scheduled publish

### Delivery order
আমি Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 ক্রমে এক এক phase শেষ করে preview এ verify করব। প্রতিটি phase এ migration + UI দুটোই থাকবে।

Approve করলে Phase 1 (database migration) দিয়ে শুরু করছি।

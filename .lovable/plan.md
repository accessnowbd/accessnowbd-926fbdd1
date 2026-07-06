
## লক্ষ্য

Admin panel থেকে দুইটা Telegram bot control করা যাবে:

1. **Order Management Bot** — website-এ নতুন order, payment, status change, abandoned checkout, low stock — সব Telegram-এ live notification (WooCommerce-এর মত)।
2. **Storefront Bot** — website-এর সব live product Telegram-এ browse + কেনা যাবে; order website-এর same database-এ save হবে।

---

## দুই ধরনের setup — প্রথমে সিদ্ধান্ত

### Option A — Lovable Telegram Connector (recommended)
- Workspace Settings → Connectors → Telegram connect
- Bot token workspace-এ store, কোনো secret manually দিতে হবে না
- Gateway automatically auth handle করে

### Option B — Manual Bot Token
- আপনি নিজে @BotFather থেকে token নিয়ে `TELEGRAM_BOT_TOKEN` secret হিসেবে দিবেন
- Direct Telegram Bot API-তে call যাবে

**পরের ধাপগুলো দুই setup-এ same — শুধু credential source আলাদা।**

---

## Database (migration)

নতুন 4 টা table (RLS + GRANT সহ):

- `telegram_settings` (kind='order_bot' / 'store_bot') — enable flag, chat IDs, notification templates, welcome message, feature toggles
- `telegram_subscribers` — chat_id, user_id (linked if signed-in), role ('admin'/'customer'), language, started_at
- `telegram_notifications_log` — event, chat_id, payload, sent_at, status — audit trail
- `telegram_orders` — Telegram থেকে আসা order → main `orders` table-এ mirror হবে (source='telegram')

---

## Backend (server functions + public webhook)

- **`/api/public/telegram/webhook`** — Telegram থেকে সব update এখানে আসে; secret_token verify → subscriber upsert → command router (`/start`, `/browse`, `/orders`, `/cart`, `/help`) → inline-keyboard callback handler
- **`src/lib/telegram/notify.functions.ts`** — server fn: order create/status/payment/stock event পেলে admin chat-এ formatted message পাঠাবে; template admin panel থেকে editable
- **`src/lib/telegram/store.functions.ts`** — product list, product detail (photo + caption + Buy button), add-to-cart, checkout inside Telegram (name/phone/address collect করে `orders`-এ insert)
- **Trigger hook** — existing order create path-এ notify server fn call (single line), যাতে UI unchanged থাকে

---

## Admin Panel — `/admin/telegram`

Homepage Editor pattern (hero header + Preview / Reload / Save changes buttons + tabs):

- **Overview** — दुই bot on/off, connection status, last notification, subscribers count, quick "Send test message"
- **Order Bot** — admin chat IDs (multiple), event checklist (new order / paid / shipped / cancelled / refund / abandoned / low stock / new review), per-event template editor with placeholders (`{{order_id}}`, `{{customer}}`, `{{total}}`, `{{items}}`), **AI দিয়ে template লেখা**
- **Store Bot** — welcome message, browse mode (all / featured / category), catalog display style, checkout flow toggle, "buy on website" fallback link, **AI দিয়ে welcome copy**
- **Subscribers** — list + role toggle (make admin/customer) + block/unblock
- **Notification Log** — recent 100 events with status + retry button
- **Preview** — Telegram-style mock render of hero card + product card + order notification card

সব config `telegram_settings` table-এ save → bot runtime live পড়ে (কোনো restart লাগবে না)।

---

## Setup flow (order of operations)

1. Migration approve → 4 table + RLS তৈরি
2. Connector connect (Option A) অথবা `TELEGRAM_BOT_TOKEN` secret add (Option B)
3. Admin panel-এ Telegram menu চালু, `/admin/telegram` build
4. Webhook route deploy → sandbox থেকে `setWebhook` register (আমি করবো)
5. Admin panel থেকে test message → confirm working
6. Existing order create path-এ notify hook wire

---

## দুইটা confirmation দরকার

- **Setup mode**: Connector (A) না Manual token (B)?
- **Storefront checkout scope**: Telegram-এ full checkout (address collect + wallet/COD)? নাকি শুধু "Buy" button যা website-এর product page-এ পাঠাবে?

উত্তর পেলে migration দিয়ে শুরু করবো।

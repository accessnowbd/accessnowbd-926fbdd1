
# Telegram Commerce System — AccessNow BD

আপনার প্রজেক্টে ইতিমধ্যে অনেক foundation আছে (দুই bot-এর token, `telegram_settings`, `telegram_subscribers`, store bot-এর browse/cart/checkout router, order-bot notifications, admin panel pages)। এই plan সেটার উপরে বাকি feature-গুলো সম্পূর্ণ করবে এবং দুই bot-কে production-grade করবে।

## Architecture (এক লাইনে)

```text
Website (TanStack) ──┐
                     ├─► Supabase (single DB, RLS, Realtime)
Customer Bot ────────┤        │
Admin Bot ───────────┘        └─► Triggers → notify both bots
                              └─► Order status change → customer bot DM
```

- Single webhook endpoint `/api/public/telegram/webhook` (already exists) — secret token দিয়ে detect করবে কোন bot থেকে এসেছে
- Customer bot: `TELEGRAM_STORE_BOT_TOKEN` (already set)
- Admin bot: `TELEGRAM_BOT_TOKEN` (already set)
- সব state Supabase-এ — bot গুলো stateless

## Phase 1 — Database & Sync foundation

নতুন/updated tables (একটা migration-এ):

- `telegram_users` — telegram_id ↔ auth user link, role (customer/staff/admin), language, session state (checkout step, admin action context), banned flag
- `telegram_carts` — server-side cart per telegram_id (client cart-এর সমতুল্য), items jsonb, coupon_code
- `telegram_wishlist` — telegram_id + product_id
- `telegram_broadcasts` — admin broadcast log (message, audience, sent_count, status)
- `telegram_admin_sessions` — admin bot MFA/OTP short-lived tokens
- Existing `orders` টেবিলে column: `source text` ('web' | 'telegram_bot'), `telegram_chat_id bigint`

DB triggers (Supabase):

- `orders` INSERT → `pg_notify` + net.http_post to `/api/public/telegram/order-created` → admin bot notify + customer bot confirm
- `orders` UPDATE (status change) → net.http_post to `/api/public/telegram/order-updated` → customer bot DM
- `products` INSERT/UPDATE/DELETE → invalidate a lightweight cache key (bot reads live from DB, so nothing to push — automatic sync); optionally broadcast "new product" if `is_featured`
- `support_tickets` INSERT + `ticket_messages` INSERT → admin bot ping

RLS + GRANTs on every new table. `has_role(auth.uid(), 'admin')` gate for admin-only reads.

## Phase 2 — Customer Bot (Bot 1) feature completion

Existing router already handles: `/start`, browse (featured/all), search, cart, checkout (name→phone→address→payment), order placement. Add:

- **Categories** — inline keyboard with all `categories` rows → paged products of that category
- **Product details view** — image + title + price + short desc + variants (if any) + "Add to Cart" / "Buy Now" / "Wishlist" buttons
- **Wallet** — `/wallet` shows balance from `wallets`, list last 10 `wallet_transactions`, "Top up" → generates a `wallet_topups` pending row with instructions
- **Coupons** — checkout step-এ "Coupon code?" prompt, `validate_coupon()` RPC ব্যবহার করে discount apply
- **Referral** — `/refer` shows unique deep link `t.me/<bot>?start=ref_<user_id>`; `/start ref_XYZ` handles attribution; successful order → credit referrer via `admin_credit_wallet` type=referral
- **Wishlist** — `/wishlist` list + add/remove buttons on product cards
- **Order tracking** — `/orders` list user's orders with live status; each order → detailed view
- **Notifications** — user preference toggles (`telegram_users.notify_orders`, `notify_promos`); order status change auto-DM
- **User profile** — `/profile` shows linked email, phone, address; edit via inline steps; "Link website account" via OTP (email a 6-digit code, verify in bot → sets `auth_user_id`)
- **Support tickets** — `/support` opens ticket, next messages append to `ticket_messages` until `/done`; admin replies DM back
- **Payment confirmation** — bKash/Nagad/Wallet payments capture trx-id in bot, order stays `pending_payment` until admin approves via admin bot

## Phase 3 — Admin Bot (Bot 2)

- **Secure auth** — `/login` prompts email; server generates 6-digit OTP, sends via existing email queue, admin enters code, bot verifies `has_role('admin')` for that email, stores `telegram_users.role='admin'` + session. Non-admin telegram_id → hard reject.
- **Live dashboard** — `/dashboard` shows today's stats (orders, revenue, pending, low-stock) from a single RPC
- **Instant order alerts** — every `orders` INSERT → admin bot message with "✅ Approve / ❌ Reject / 👁 View" inline buttons; callback updates `orders.status` and DMs customer
- **Product manage** — `/products` paged list; each product → Edit (title/price/stock/status inline steps) / Delete (soft) / Toggle featured. Add: `/addproduct` step wizard (name → price → category → description → image URL)
- **Category manage** — `/categories` list, add/rename/delete
- **Coupon manage** — `/coupons` list, create wizard (code/type/value/limit/expiry)
- **Users** — `/users <search>` find by email/phone; view orders, wallet, roles; grant/revoke staff role
- **Broadcast** — `/broadcast` step: audience (all / order-in-last-30d / wishlist-of-product) → message → confirm → background dispatch to `telegram_users` with rate limiting (30 msg/sec)
- **Sales analytics** — `/stats` today / 7d / 30d revenue, top products, conversion (from `tracking_events_log`)
- **Support** — `/tickets` open tickets, tap → conversation view, replies flow back to customer bot DM
- **Wallet manage** — `/topups` pending list → approve/reject buttons calling existing `approve_wallet_topup` / `reject_wallet_topup` RPCs

## Phase 4 — Shared services, retry, RBAC

Reusable TypeScript services under `src/lib/telegram/`:

- `api.server.ts` (exists) — extend with `sendMessageWithRetry` (3 attempts, expo backoff, log to `telegram_notifications_log`)
- `router.server.ts` (exists) — split: `router.customer.ts` + `router.admin.ts`, dispatcher picks by bot kind
- `auth.server.ts` — OTP mint/verify, admin session guard middleware for callbacks
- `broadcast.server.ts` — chunked dispatch, retries, respects `banned` + `notify_promos`
- `analytics.server.ts` — RPC wrappers used by both bot + web admin
- `sync.server.ts` — trigger-called endpoints (`order-created`, `order-updated`, `ticket-message`) verifying an HMAC secret

RBAC:

- `telegram_users.role`: `customer` / `staff` / `admin` — enforced in `router.admin.ts` before any admin command runs
- Website continues using `user_roles` + `has_role()`; admin bot links via verified email

Retry + logging:

- Every outbound Telegram call wrapped; success + failure written to `telegram_notifications_log` (already exists) with attempt count, error text
- Failed sends re-queued via pgmq for 3 retries, then moved to DLQ

Realtime:

- Website admin `/admin/orders` subscribes to `orders` inserts (already possible) — Telegram orders show up instantly with `source='telegram_bot'` badge
- Product changes propagate automatically because both bots query DB live (no cache)

## Technical section (for reference)

Files to add/modify:

```text
supabase/migrations/<new>_telegram_commerce.sql   ← all tables/triggers/GRANT/RLS
src/lib/telegram/
  api.server.ts                (extend: retry + log)
  auth.server.ts               (new: admin OTP + session)
  router.customer.ts           (split from router.server.ts)
  router.admin.ts              (new: admin bot commands + callbacks)
  broadcast.server.ts          (new)
  sync.server.ts               (new: trigger endpoints)
  types.ts                     (new: shared types)
src/routes/api/public/telegram/
  webhook.ts                   (dispatch by bot kind — already exists, extend)
  order-created.ts             (new)
  order-updated.ts             (new)
  ticket-message.ts            (new)
src/routes/admin.telegram-store.tsx   (extend: broadcast composer, analytics)
src/routes/admin.telegram.tsx         (extend: admin-bot config + linked admins)
src/routes/admin.orders.tsx           (add: source='telegram_bot' badge + filter)
```

Secrets needed (all already saved): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_STORE_BOT_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`. One new generated secret: `TELEGRAM_SYNC_HMAC` (for trigger → route auth).

## Scope guardrails

- No breaking changes to existing web checkout, admin pages, cart, wallet RPCs — bots reuse them
- No new payment providers — bot uses same COD/bKash/Nagad/Wallet/SSLCommerz/EPS methods already configured
- Product/category schema unchanged — bots read the existing tables live
- Estimated total: ~1 migration, ~12 new/edited TS files, ~1500 lines

## Approval

Confirm করলে Phase 1 (migration) দিয়ে শুরু করবো — migration আপনি review করে approve করলেই Phase 2 code push হবে। কোনো phase skip/reorder করতে চাইলে বলুন।

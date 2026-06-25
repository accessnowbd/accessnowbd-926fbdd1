# Telegram Bot Integration — Plan

## কী বানানো হবে

একটা Telegram bot যেখান থেকে customer সম্পূর্ণ AccessNow BD-র product browse করতে, cart বানাতে আর payment screenshot সহ checkout সম্পন্ন করতে পারবে। একই সাথে নতুন product বা update channel-এ auto post হবে, আর admin panel থেকে পুরো bot control করা যাবে।

---

## ১. Customer flow (Telegram bot-এর ভিতরে)

- `/start` → welcome message + main menu (Browse Products, My Cart, My Orders, Support)
- **Browse**: Category → Product list → Product detail (image + price + description + Add to Cart / Buy Now)
- **Cart**: items add/remove/quantity, coupon apply, subtotal
- **Checkout (bot-এর ভিতরে full)**:
  1. Name, phone, email (saved per Telegram user)
  2. Payment method select (bKash / Nagad / Rocket — admin_records থেকে number দেখাবে)
  3. Transaction ID input
  4. Payment screenshot upload (bot → payment-screenshots bucket)
  5. Order create হবে `orders` table-এ (source = "telegram"), status = pending
- **My Orders**: নিজের সব order status সহ দেখা
- **Support**: WhatsApp link + admin_records-এর contact

## ২. Auto sync — Telegram channel-এ broadcast

- নতুন product publish হলে → channel-এ post (image + name + price + "Order on bot" button)
- দাম পরিবর্তন / promotion / stock change → channel-এ update post
- Database trigger বা server-side hook (product insert/update) → server route → channel-এ post

## ৩. Admin panel control (`/admin/telegram`)

নতুন page-এ:

- **Bot settings**: welcome message, channel ID, on/off toggle
- **Product visibility**: প্রতি product-এ "Show on Telegram" toggle (products table-এ নতুন column `telegram_visible`)
- **Manual broadcast**: যেকোনো product বা custom text + image channel-এ পাঠানো
- **Bot users list**: যারা bot ব্যবহার করেছে — Telegram user_id, name, last seen, order count
- **Order tracking**: Telegram থেকে আসা order আলাদা filter (existing /admin/orders-এ "Source: Telegram" filter add)
- **Activity log**: কোন user কোন product দেখলো / cart-এ রাখলো (abandoned tracking)

---

## ৪. Technical layout

### Database (migrations)
- `telegram_users` — telegram_id (PK), chat_id, name, phone, email, last_seen, total_orders
- `telegram_settings` — singleton row: bot_enabled, channel_id, welcome_message, custom button labels
- `telegram_broadcasts` — log of sent broadcasts (product_id nullable, message, image_url, sent_at, sent_by)
- `telegram_carts` — telegram_id → items jsonb + coupon + updated_at (session cart)
- `products` table-এ নতুন column: `telegram_visible boolean default true`
- `orders` table-এর `source` column-এ "telegram" value support
- Trigger: products insert/update → enqueue broadcast (table-based queue, server polls)

### Server routes (public, signature-verified)
- `POST /api/public/telegram/webhook` — Telegram → bot incoming messages handler (state machine for browse/cart/checkout)
- Webhook secret: derived from `TELEGRAM_API_KEY` (existing pattern), validated via `X-Telegram-Bot-Api-Secret-Token`

### Server functions (admin only, `requireSupabaseAuth` + `has_role('admin')`)
- `updateTelegramSettings` — bot config update
- `broadcastToChannel` — manual message/product post
- `toggleProductTelegramVisibility` — per-product on/off
- `listTelegramUsers` — paginated user list

### Lovable Cloud
- Telegram connector connect (Bot token via BotFather)
- Storage: existing `payment-screenshots` bucket reused for bot-uploaded screenshots
- Gateway URL: `https://connector-gateway.lovable.dev/telegram/*`

---

## ৫. কী লাগবে আপনার কাছ থেকে

1. **Telegram bot tokenor BotFather setup** — Telegram connector connect করতে হবে (এক click)
2. **Channel ID** — যে channel-এ auto post হবে (bot-কে আগে channel admin বানাতে হবে)
3. **BotFather-এ bot privacy disable** করতে হবে যাতে group/inline সব command পায়

Plan approve করলে আগে Telegram connector connect করার জন্য বলব, তারপর migration + bot code + admin page একসাথে build করব।

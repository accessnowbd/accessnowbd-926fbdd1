## লক্ষ্য

`rxbpremiumstorebd.com`-এর product arrangement, shop, product detail (plan selector), cart, manual bKash/Nagad/Rocket checkout এবং WhatsApp direct order — সব আমাদের সাইটে। **Header, footer, top banner অপরিবর্তিত** থাকবে।

---

## ১. Database (existing schema reuse + minor migration)

বর্তমান `products` table-এ `plans jsonb` field ইতিমধ্যেই আছে — তাই schema পরিবর্তন প্রায় লাগবে না। শুধু:

- `products`-এ `whatsapp_order_text text` (optional pre-filled message) যোগ
- `orders`-এ `whatsapp_sent boolean default false` যোগ
- `categories` admin_records (kind='category') থেকে seed: Top Picks, OTT & Streaming, Windows, Microsoft Office, AI & Education, Editing Tools, Software & Productivity, VPN & Security, Giftcards
- পুরনো সব products DELETE → RxB-এর product list seed (নাম + plans + price + category + image placeholder)

## ২. Product seeding

RxB থেকে scrape করা product list:
- Capcut Pro (৳300–৳2,650, multiple plans)
- Canva Pro (৳50–৳500)
- ChatGPT Plus (৳370–৳2,800)
- Netflix Premium (৳350–৳1,200)
- Amazon Prime Video (৳120–৳1,150)
- Windows 11 Pro Key
- Microsoft Office 365
- Spotify Premium, YouTube Premium, Disney+, JioCinema
- NordVPN, ExpressVPN, Surfshark
- Grammarly, Quillbot, Perplexity Pro
- Adobe CC, Envato Elements
- Steam/PlayStation/Google Play giftcards

প্রতিটি product-এ `plans: [{label, duration, price, type}]` jsonb-এ থাকবে।

## ৩. Frontend — Homepage section (`src/routes/index.tsx`)

Header/footer/top banner unchanged। শুধু product section রিপ্লেস:

```text
[ Category pill tabs (horizontally scrollable) ]
   🏠 Home  🛍 Shop  ⭐ Top Picks  OTT  Windows  Office  AI  ...

[ "⭐ Top Picks for You"  ............................  View All → ]
[ Product grid 5-col → 2-col responsive ]
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │ image       │  │             │  │             │
  │ Title       │  │             │  │             │
  │ ● In Stock  │  │             │  │             │
  │ ৳300 – ৳2650│  │             │  │             │
  │[Choose Plan]│  │             │  │             │
  └─────────────┘  └─────────────┘  └─────────────┘
```

ক্লিক করলে selected category-র product grid দেখাবে (state-driven)।

## ৪. Shop page (`src/routes/products.tsx` upgrade)

- Left sidebar: category checkboxes, price range, stock filter
- Top: search + sort (popular/price low-high/new)
- Grid + pagination/load-more
- Existing route-ই upgrade হবে

## ৫. Product detail page (`src/routes/product.$slug.tsx`)

- Large image left, info right
- Title, ● In Stock badge, price range
- **Plan selector** — radio cards প্রতিটি plan-এর জন্য (1 month/3 month/lifetime + price)
- Quantity (+/-)
- "Buy Now" → cart → checkout
- **"Order via WhatsApp"** button → opens `wa.me/<number>?text=Pre-filled order details`
- Description, features, delivery time, warranty tabs নিচে

## ৬. Cart (`src/routes/cart.tsx`)

- Existing CartContext reuse
- Selected plan-সহ line items, qty edit, remove, subtotal
- "Proceed to Checkout" + "Order via WhatsApp" উভয় button

## ৭. Checkout (`src/routes/checkout.tsx`)

Form fields: full name, email, phone, payment method (radio: **bKash / Nagad / Rocket**)।

Selected method অনুযায়ী আমাদের manual receive number দেখাবে + instructions:
> "নিচের নম্বরে Send Money করুন: 01XXXXXXXXX। তারপর Transaction ID নিচে paste করুন।"

Field: Transaction ID (required)। Submit → `orders` table-এ insert (status=`pending`)।

Confirmation page: order ID + "WhatsApp-এ admin-কে জানান" button।

## ৮. Admin panel

`src/routes/admin.products.tsx` ও `admin.orders.tsx` ইতিমধ্যে আছে — শুধু:
- product form-এ plans editor (add/remove plan rows: label, duration, price)
- orders page-এ payment_method, transaction_id, mark as paid/delivered

## ৯. WhatsApp integration

`src/lib/whatsapp.ts` helper:

```ts
export const SHOP_WA = "8801XXXXXXXXX";
export function waOrderUrl(items, customer?) {
  const text = `Order:\n${items.map(...).join("\n")}\nTotal: ৳${total}`;
  return `https://wa.me/${SHOP_WA}?text=${encodeURIComponent(text)}`;
}
```

Product card, detail page, cart, checkout সব জায়গায় WhatsApp order button।

---

## প্রশ্ন (implementation শুরুর আগে)

1. **WhatsApp number** কোনটা ব্যবহার করব? (এখন placeholder `8801XXXXXXXXX` দেব, পরে আপনি update করবেন admin panel থেকে)
2. **Payment receive number** (bKash/Nagad/Rocket merchant numbers) — admin_records-এ store করব, আপনি পরে settings থেকে update করতে পারবেন।
3. **Product images** — RxB থেকে copy করা যাবে না (copyright)। placeholder/emoji + gradient ব্যবহার করব, পরে আপনি upload করবেন।

---

## Files

- migration: schema additions + product seed (একসাথে)
- `src/lib/whatsapp.ts` (new)
- `src/lib/payment-config.ts` (new)
- `src/routes/index.tsx` — product section overhaul
- `src/routes/products.tsx` — shop with filters
- `src/routes/product.$slug.tsx` — plan selector + WA button
- `src/routes/cart.tsx` — WA button
- `src/routes/checkout.tsx` — manual payment flow
- `src/routes/admin.products.tsx` — plans editor
- `src/components/ProductCard.tsx` — RxB-style card

Approve করলে migration থেকে শুরু করব।
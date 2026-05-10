## Overview

Rebuild the homepage and product catalog to follow the same **structure and content rhythm** as fanflixbd.com (hero slider → top picks → streaming services → educational tools → trust strip → FAQ → footer), while keeping our own **Aurora Glass Premium** visual language and **AccessNow BD** branding. We will NOT copy their logo, images, or copyrighted artwork — instead we'll generate our own visuals and use original copy.

## What we'll build

### 1. Expanded product catalog (seeded into Supabase)
Populate the `products` table with a fanflix-style subscription lineup so the catalog feels equally rich:

**Streaming**
- Netflix, Netflix + Prime Video, Netflix + HBO Max, Netflix + Disney+, Prime Video, HBO Max, Disney+, Apple TV+, YouTube Premium, Hoichoi, Chorki

**AI / Productivity / Educational**
- ChatGPT Plus, Claude Pro, Gemini Advanced, Perplexity Pro, Grammarly Premium, Quillbot Premium, Coursera Plus, LinkedIn Learning

**Design / Music**
- Canva Pro, CapCut Pro, Adobe Creative Cloud, Spotify Premium, Apple Music

Each product gets: tagline, description, plans (1m / 3m / 6m / 12m where applicable), features list, delivery time, warranty, gradient + emoji.

### 2. Homepage redesign (`src/routes/index.tsx`)
Section order mirrors fanflix:

1. **Top utility bar** — office hours "11 AM – 11 PM", social icons (FB / IG / YT / TikTok / X)
2. **Sticky header** — AccessNow BD wordmark, search icon, account, cart, with `All Products / Streaming / AI Tools / Education` nav
3. **Hero slider** (4 slides, auto-rotating, dot pagination)
   - Slide 1: "এখন AccessNow BD সাবস্ক্রিপশন পেমেন্ট আরও সহজ" — payment methods strip
   - Slide 2: "১০ মিনিটে ডেলিভারি"
   - Slide 3: "৩০ দিনের ওয়ারেন্টি"
   - Slide 4: "Educational Bundle অফার"
   - Each slide on dark cinematic gradient with our generated AI hero illustration
4. **Floating CTA pill** — "🟢 Get Instant Subscription" (mirrors their "Get Instant Household Code")
5. **⭐ Top Picks for You** — 8 product cards (rating, reviews count, price, "Add to cart" / "Choose options")
6. **Streaming Services** — horizontal scrollable rail with all streaming products
7. **AI & Productivity Tools** — second rail
8. **Educational Tools** — third rail
9. **Why choose AccessNow BD** — 4 trust badges (Instant delivery, Warranty, Verified accounts, 24/7 support)
10. **How it works** — 3-step explainer (already exists, re-skinned)
11. **Customer reviews** — testimonial cards with star ratings
12. **FAQ accordion** — 8 common questions
13. **Newsletter / WhatsApp CTA** band
14. **Footer** — link columns (Shop / Help / Company / Legal), socials, payment method logos, copyright

### 3. Product card component (`src/components/ProductCard.tsx`)
A single reusable card matching fanflix card layout but in our Aurora Glass style:
- Square image with gradient + emoji
- Star rating + review count
- Product name
- Regular price (strike) + Sale price
- "Add to cart" or "Choose options" button (depending on plan count)

### 4. Product detail page polish (`src/routes/product.$slug.tsx`)
Add the missing fanflix-style elements:
- Star rating + reviews count under title
- "Regular price ~~৳XXX~~ Sale price ৳YYY" pattern when `original` exists on a plan
- Sticky "Add to cart" bar on mobile

### 5. New routes (mirroring fanflix nav)
- `/products` — full product grid with category filters
- `/streaming` — streaming products only
- `/ai-tools` — AI/productivity products only
- `/education` — educational products only
- `/faq` — full FAQ page (homepage shows top 8)
- `/contact` — WhatsApp + form

### 6. Hero artwork
Generate 4 original hero illustrations (premium quality) using imagegen — phone mockup with payment screen, delivery clock, warranty shield, education stack — each on our violet→aqua aurora gradient. No third-party logos in artwork.

### 7. Visual treatment
Stay on **Aurora Glass theme** for cards, surfaces, buttons. Hero sections get **dark cinematic** background bands (deep navy with aurora mesh + subtle red/gold accent glow) so the contrast feels premium like fanflix, while body remains light glassmorphic.

## What we will NOT copy
- Their FanFlix logo / wordmark — we keep "AccessNow BD" with our "A" mark
- Their product photos / brand images — we use emoji + gradient cards (existing style) and our own AI-generated heroes
- Their exact copy text — we write original Bengali + English copy
- Their domain-specific links (household.fanflixbd.com, EPS payment partner)

## Technical notes

- Catalog seed via `supabase--migration` (idempotent INSERT … ON CONFLICT DO NOTHING on `slug`)
- Hero illustrations: 4 × `imagegen--generate_image` (premium quality, 1600×900, .jpg)
- Reviews are display-only static numbers in product JSON for now — no reviews table this round
- New routes use file-based routing, each with its own `head()` meta for SEO
- Mobile sticky bottom CTA on product page using `fixed bottom-0` glass bar
- Carousel = simple state + `setInterval` (no extra dep)

## Out of scope (future requests)
- Real reviews table + submission flow
- "Get Instant Household Code" instant-delivery automation
- Live chat widget
- Payment gateway integration (still manual bKash/Nagad TrxID flow)

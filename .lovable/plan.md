## লক্ষ্য

পুরো AccessNowBD-কে dark navy theme থেকে **light premium Apple-style Glassmorphism**-এ migrate করা। Structure / functionality / route / data flow অপরিবর্তিত। শুধু visual layer + reusable utilities।

## Design tokens (src/styles.css এ rewrite)

Light palette + glass tokens:

```text
--background:        #f8fbff (soft blue-white)
--foreground:        #0f172a (navy ink)
--muted-foreground:  #475569
--card:              rgba(255,255,255,0.65)
--border:            rgba(255,255,255,0.45)
--primary:           #0ea5e9 (sky)
--accent:            #2563eb (electric blue)
--accent-soft:       #cfe7ff
--ring:              #38bdf8

--glass-bg:          rgba(255,255,255,0.55)
--glass-bg-strong:   rgba(255,255,255,0.78)
--glass-border:      rgba(255,255,255,0.45)
--glass-blur:        18px
--shadow-glass:      0 10px 40px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.6)
--shadow-glow:       0 0 32px rgba(14,165,233,0.18)

--gradient-page:     linear-gradient(135deg,#f8fbff 0%,#eef5ff 35%,#f5f9ff 70%,#ffffff 100%)
--gradient-text:     linear-gradient(90deg,#0ea5e9,#2563eb)
```

Mobile-এ blur auto-reduce: `@media (max-width: 640px) { --glass-blur: 10px }`।
`prefers-reduced-motion` সম্মান।

## Reusable utility classes (Tailwind v4 / styles.css এ)

| class | কাজ |
|---|---|
| `.glass-card` | bg + blur + border + shadow + radius (24px) |
| `.glass-card-strong` | বেশি opaque variant — text-heavy block-এর জন্য |
| `.glass-button` | primary glass btn + cyan glow + hover-lift |
| `.glass-button-ghost` | secondary, thin border |
| `.glass-input` | input/textarea/select base |
| `.glass-navbar` | floating sticky header pill |
| `.glow-text` | gradient text highlight |
| `.glow-border` | cyan ring |
| `.floating-panel` | card + scroll-reveal hover-elevate |
| `.bg-aurora-light` | page background (gradient + radial blobs) |

`hover:` → `translateY(-2px) scale(1.01)` + glow ↑, `transition 300ms ease`।

## Background system

`<body>` এ `bg-aurora-light` apply। ৩টা soft animated radial blobs (sky/cyan/indigo, very low opacity, 60s drift) — `pointer-events-none`, GPU-only `transform`। Mobile-এ blobs static।

## Phased rollout

**Phase 1 — Foundation (এই turn-এ deliverable)**
1. `src/styles.css` rewrite — light tokens + all glass utilities + animations + scroll-reveal helper।
2. `src/components/ui-glass/GlassCard.tsx`, `GlassButton.tsx`, `GlassField.tsx` light theme-এ refit।
3. `src/components/SiteHeader.tsx` → floating glass navbar (compact-on-scroll already আছে, color shift)।
4. `src/components/SiteFooter.tsx` → glass panel।
5. `src/routes/index.tsx` (Hero, Featured, Rails, CTA) → glass surfaces, gradient heading, soft glow orbs।
6. `src/components/ProductCard.tsx` + `ProductBanner.tsx` → light glass card (white surface, navy text)।
7. shadcn primitives যেগুলো hard-coded dark color ব্যবহার করছে (Button, Input, Dialog, Sheet, Sonner) — token-driven করা।

**Phase 2 (next turn, approve হলে)**
- `auth/login/register/forgot-password/reset-password`
- `cart`, `checkout`, `orders`, `orders.$id`
- `product.$slug`, `products`, category pages (`streaming`, `ai-tools`, `education`)
- `dashboard`, `profile`, `contact`, `faq`, `developer`, `sitemap`
- `SupportWidget`, `GlobalSearch`, `ThemeSwitcher`, `CartIcon`, `AccountIcon`

**Phase 3**
- `admin.*` routes (Tables, forms — glass treatment with stronger opacity for data density)।

প্রতিটা phase-এর পর preview দেখে adjust।

## Animations

CSS keyframes (already-defined `fade-in`, `scale-in`) + নতুন `float`, `glow-pulse`, `reveal-up`। Framer Motion শুধু hero + section reveal-এ — bundle bloat এড়াতে রেস্ট-এ pure CSS।

`.reveal-up` + IntersectionObserver hook (`useReveal`) — ১বার trigger।

## Accessibility

- Text/background contrast ≥ WCAG AA (navy `#0f172a` on white-ish glass = pass)।
- গুরুত্বপূর্ণ text-এর পেছনে `glass-card-strong` (78% opacity) ব্যবহার, transparent না।
- Focus ring: `0 0 0 3px rgba(14,165,233,0.45)` সব interactive element-এ।
- Tap target ≥ 44px।
- `prefers-reduced-motion: reduce` → animation disable।

## Performance

- Mobile blur 10px, desktop 18px।
- Blur layers stack করব না — একই surface-এ একবার backdrop-filter।
- Background blobs CSS `will-change: transform`, `contain: paint`।
- Existing `LazyMount` rails বহাল, `ProductCard` memoized।
- নতুন কোনো heavy dep ইনস্টল করব না (Framer Motion ইতিমধ্যে আছে কিনা চেক — না থাকলে শুধু hero-এ `bun add framer-motion`)।

## Risk / scope notes

- Site বর্তমানে dark navy + neon (aqua/violet/aurora gradient) এ tightly coupled — `text-aurora`, `text-neon`, `bg-aurora`, glass-soft/strong বহু component-এ। আমি এই tokens-কেই **light variant-এ remap** করব যাতে existing markup auto-inherit করে; class-by-class rewrite করতে হবে না সব ফাইলে।
- আগের turn-এ আপনি product cards সাদা theme-এ আনতে বলেছিলেন — নতুন light glass system এর সাথে natural fit, ওটা retain।
- Admin dashboard data-density বেশি, তাই Phase 3-এ আলাদা treatment (less blur, more opacity)।

## Deliverable for Phase 1

Approve করলে এই turn-এ deliver করব: tokens + utilities + Header + Footer + Home (Hero/Featured/Rails/CTA) + ProductCard + glass primitives + shadcn token shift। Preview-এ পুরো homepage premium light glass হিসেবে দেখাবে; বাকি pages temporary inherit করবে (functional থাকবে, polished না)।

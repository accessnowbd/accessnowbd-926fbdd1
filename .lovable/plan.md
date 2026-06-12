# Admin Panel Redesign — Shahed Store Style

রেফারেন্স image অনুযায়ী admin panel-কে একটা SaaS-grade dashboard look-এ রূপান্তর করব। বর্তমান mobile-first top-bar layout-এর জায়গায় sticky left sidebar + light theme + pastel gradient cards-এর স্ট্রাকচার আসবে।

## কী পরিবর্তন হবে

### 1. Admin Shell (`src/routes/admin.tsx`)
- বাঁদিকে fixed **sidebar** (260px, light gray bg, scrollable):
  - উপরে brand logo + "AccessNow BD" wordmark
  - তার নিচে global search bar (⌘K hint) — already `AdminGlobalSearch` আছে, reuse করব
  - Section headers: **OVERVIEW**, **SALES**, **CATALOG**, **TOOLS**, **SETTINGS** (uppercase, muted, collapsible chevron)
  - প্রতিটা nav item: icon + label + optional badge (`LIVE` for live orders, `NEW` for recently added pages)
  - Active item: soft peach/orange pill background + dot indicator (image অনুযায়ী)
  - Hover: subtle gray bg
  - নিচে user profile card: avatar + name + email + logout icon
- মূল content area: light `#f7f8fb` background, generous padding, max-width container

### 2. Dashboard (`src/routes/admin.index.tsx`)
- উপরে **Notifications banner** (rounded card, bell icon, count badge, "X new order(s) in last 24 hours")
- **REVENUE OVERVIEW** section (label with left vertical accent bar):
  - 4 KPI cards in a row: Today's Sales, This Month, This Year, Total Revenue (All)
  - Card design: white bg, soft pastel gradient overlay top-right, circular gradient icon top-left (violet, green, orange variants), label uppercase muted, big BDT value, optional delta pill (red ↘ / green ↗)
- **ORDER STATUS** section:
  - 6 stat cards: Total Orders, Pending, Payment Pending, Delivered, Cancelled, Customers
  - Same card style with color-coded gradient icons
- **Sales Overview** chart card (replace current sparkline):
  - Daily/Weekly/Monthly tabs
  - Smooth area chart (Recharts) with violet gradient fill, x-axis dates, y-axis BDT
  - Subtitle: "X% revenue growth vs last month"
- **Best Selling Products** card (right column on desktop): numbered list (#1-#5) with sales count
- **Conversion Stats** card below

### 3. Theme & Tokens
- Admin shell force-locks to **light theme** (irrespective of site-wide aurora/white toggle) using a scoped `force-light` wrapper class — admin-এ dark theme issue আর হবে না
- New CSS utility classes for pastel gradient backgrounds (violet, mint, peach, sky, amber)

### 4. Mobile / Tablet
- < 1024px: sidebar slides in as drawer (already-installed `Sheet` component), hamburger in top bar
- KPI cards: 2-column on tablet, 1-column on mobile
- Sales chart stacks above products

### 5. Bilingual support
- বর্তমান `useAdminLang` toggle অপরিবর্তিত থাকবে — সব নতুন label-ও bilingual মেনে চলবে

## যা পরিবর্তন হবে না
- Backend / data queries — same Supabase fetches reuse করব
- অন্যান্য admin sub-pages (orders, products, users) — শুধু shell + index dashboard redesign
- Site
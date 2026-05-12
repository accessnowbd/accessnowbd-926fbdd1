## Goal

Make the admin panel look like the uploaded reference: pastel aurora background with floating blur blobs, large frosted-glass cards with soft 24px corners, big stat cards with sparkline + trend chip, a wide sales chart card, a traffic-sources card with progress bars, a donut card, and a recent customers table — all in a light glassy style.

## Scope

This redesign only touches the **shell visuals** and the **dashboard landing page** (`/admin`). All inner sub-pages (Products, Orders, Users, etc.) keep their existing functionality untouched.

Files to edit:
- `src/routes/admin.tsx` — refine sidebar/topbar to match the reference (rounded active pill, lighter borders, softer glass).
- `src/routes/admin.index.tsx` — restructure the landing layout into the reference's grid: 3 stat cards on top, large Sales Report + Traffic Sources side-by-side, then Donut + Recent Customers side-by-side. Reuse real Supabase data already loaded.

Out of scope: changing any business logic, queries, routes, or other admin sub-pages.

## Layout (dashboard landing)

```text
┌─────────────────┬─────────────────┬─────────────────┐
│ Today's Sales   │ Total Sales     │ Total Orders    │
│ ৳ value + trend │ ৳ value + trend │ count + trend   │
│ + sparkline     │ + sparkline     │ + sparkline     │
└─────────────────┴─────────────────┴─────────────────┘
┌───────────────────────────────────┬─────────────────┐
│ Sales Report (12M / 6M / 30D / 7D)│ Traffic Sources │
│ area chart                        │ progress bars   │
└───────────────────────────────────┴─────────────────┘
┌───────────────────┬───────────────────────────────────┐
│ Orders by Status  │ Recent Customers (table)          │
│ donut             │ product / id / name / date / ৳    │
└───────────────────┴───────────────────────────────────┘
```

## Visual rules

- Background: existing aurora pastel gradient + blur blobs (already in place).
- Cards: `bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)]`, generous padding.
- Stat cards: tinted gradient overlay (violet / rose / amber), title in slate-500, big slate-900 number, trend chip + small inline sparkline.
- Sales Report: existing area chart restyled with soft colors + period tabs as pill buttons.
- Traffic Sources: rows of `label / value` with thin gradient progress bars.
- Donut: thicker stroke, soft drop shadow, legend underneath.
- Recent customers table: light dividers, status pills (Complete = emerald, Pending = rose).
- Sidebar active item: filled rounded pill with subtle violet tint, white text.
- Topbar: pill search, Add New gradient button, notification bell with badge.

## Data

All data already comes from existing Supabase queries in `admin.index.tsx`. No schema or query changes — only the presentation is rebuilt.

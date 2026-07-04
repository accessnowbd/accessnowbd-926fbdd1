---
name: Abandoned Checkout layout
description: Locked structure for /admin/abandoned-checkout — clean revenue-focus design with KPI cards, pill filters, and avatar rows
type: design
---
Locked structure for `/admin/abandoned-checkout`:

**KPI cards (4, plain white/border, no colored icon tiles):**
1. Potential Revenue (৳ pending+contacted totals) + open cart count note (slate)
2. Recovery Rate (%) + "Target: 18%" note (indigo)
3. Active Checkouts (count) + high-value count note (amber)
4. Recovered Value (৳) + recovered cart count note (emerald)

**Filter bar (inside table card):**
- Search input (name/email/phone/coupon/product)
- Rounded pill filters: Pending, All sessions, High Value (>৳500), Contacted, Recovered
- Active pill = `bg-slate-900 text-white`; inactive = `text-slate-500 hover:bg-slate-100`
- Small Refresh icon button on the right

**Table columns (6):** Customer/Session | Potential Revenue | Status | Items (center) | Last Activity (right) | Action (right)

**Row anatomy:**
- Avatar: initials on tinted circle for named customers; UserRound icon on slate for guests (guests dimmed opacity-70, italic name)
- Potential revenue is bold; high-value pending rows get a pulsing orange dot + violet hover tint
- Status pills use "Actionable" (amber) / Contacted (sky) / Recovered (emerald) / Not Given (slate)
- Last activity is relative time ("12 mins ago", "3 hours ago")
- Actions: WhatsApp icon (if phone) → mark-contacted arrow (only when pending) → delete → primary CTA button ("Recover Now" for high-value pending, else "Details")

Do NOT reintroduce: AdminPageHeader hero on this page, colored stat icon tiles, or the old CART/ACTIVITY columns.

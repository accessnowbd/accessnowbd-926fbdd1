## লক্ষ্য

বর্তমানের single-page checkout-কে একটি **multi-step guided flow** এ রূপান্তর করা — Aurora Glass theme, button style ও accessible color tokens-এর সাথে সম্পূর্ণ consistent।

---

## নতুন ফ্লো (4 steps)

```
[1] Cart Review → [2] Contact Info → [3] Payment → [4] Confirm
                                                      ↓
                                                  Success page
```

`/cart` থাকবে stand-alone cart page (item list edit), আর `/checkout` হবে stepper সহ ৩-ধাপের wizard (Contact → Payment → Review)। শেষে success page।

---

## ১. শেয়ার্ড UI primitives (নতুন, theme-consistent)

`src/components/ui-glass/`-এ ছোট reusable component set, যাতে পুরো app এক স্টাইলে চলে:

- **`<GlassCard>`** — `glass-strong rounded-2xl p-6` wrapper, optional `tone="soft"`।
- **`<GlassField>`** — label + input/textarea, focus ring `--ring`, error state, helper text, accessible `aria-describedby` ও `aria-invalid`।
- **`<GlassButton>`** — variants: `primary` (bg-aurora + glow-violet), `secondary` (glass-soft), `ghost`, `destructive`। sizes: `sm/md/lg`। `min-h-[44px]` for touch, `:focus-visible` ring থেকে accessible।
- **`<Stepper>`** — top progress bar with 3 steps, current/completed/upcoming states, keyboard-accessible (`aria-current="step"`)।
- **`<RadioCard>`** — payment method ও plan-এর জন্য large tappable card, checked state aurora border + glow।
- **`<SummaryRow>`** — order summary item rows।

এগুলো শুধু existing tokens (`--primary`, `--aurora`, `glass-*`, `glow-*`) ব্যবহার করবে — কোনো hardcoded color নয় (বর্তমান `text-[#333333]` মতো hex গুলো `text-foreground/80` দিয়ে replace হবে)।

## ২. `/cart` রিফ্যাক্টর

- নতুন `<GlassCard>` + `<GlassButton>` দিয়ে rebuild।
- Empty state CTA, qty stepper, line totals — same look, কিন্তু shared components।
- "Proceed to Checkout" → `/checkout` (step 1 শুরু)।

## ৩. `/checkout` — Multi-step wizard

`useState` দিয়ে `step: 1 | 2 | 3` track। URL search param-এও sync (`?step=2`) যাতে refresh-এ থাকে এবং browser back কাজ করে।

### Step 1 — Contact details
- Full name, email (auth হলে prefill), WhatsApp number।
- Inline validation (email format, BD phone regex)।
- "Continue to Payment" button — invalid হলে disabled + error helper text।

### Step 2 — Payment method
- bKash / Nagad `<RadioCard>`।
- "How to pay" instructions panel।
- Number copy button।
- Sender number + TrxID fields with validation (TrxID min length)।
- Back / Continue buttons।

### Step 3 — Review & Confirm
- Read-only summary of contact + payment + items।
- "Edit" link beside each section → jump back to that step।
- Optional notes textarea।
- Terms checkbox ("I confirm the TrxID is correct")।
- **Place Order** button → existing `supabase.from("orders").insert()` logic অপরিবর্তিত।

### Sticky right summary (desktop) / collapsible top summary (mobile)
সব step জুড়ে দৃশ্যমান, items + total সহ।

### Success state
আগের সফল order screen একই, কিন্তু `<GlassButton>` ব্যবহার করে।

## ৪. Accessibility & consistency pass

- সব interactive element-এ `:focus-visible` outline (`--ring`)।
- Color contrast: `text-muted-foreground` শুধু secondary text-এ; primary copy-তে `text-foreground`।
- `aria-label` ও `aria-current` stepper-এ; form errors `role="alert"`।
- Min touch target 44×44।
- Mobile: stepper horizontal scroll-free (icons + short labels), summary collapsible।

---

### Technical notes

- কোনো DB schema বা business logic পরিবর্তন নেই — শুধু UI restructure + shared components।
- Cart context (`useCart`) ও order insert query unchanged।
- নতুন files:
  - `src/components/ui-glass/GlassCard.tsx`
  - `src/components/ui-glass/GlassField.tsx`
  - `src/components/ui-glass/GlassButton.tsx`
  - `src/components/ui-glass/Stepper.tsx`
  - `src/components/ui-glass/RadioCard.tsx`
- Edit: `src/routes/cart.tsx`, `src/routes/checkout.tsx`।
- Validation hand-rolled (no extra dep) — simple regex + required checks।
- Out of scope: address book, multiple saved payment methods, coupon codes, real payment gateway।

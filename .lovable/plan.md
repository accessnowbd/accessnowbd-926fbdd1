## লক্ষ্য

Fanflixbd.com–স্টাইলে আমাদের সাইটের জন্য একটি পরিষ্কার **page list / sitemap** তৈরি করা — দুই রূপে:

1. **Machine-readable `public/sitemap.xml`** (SEO + Google indexing-এর জন্য)
2. **Human-readable `/sitemap` রুট** (visitors-দের জন্য, ক্যাটাগরি ধরে গোছানো)

আমাদের নিজস্ব AccessNow BD branding/copy ব্যবহার করা হবে — fanflixbd-এর কোনো লোগো, copy বা trademarked text কপি করা হবে না।

---

## ১. `public/sitemap.xml` (static)

সব public route-এর জন্য `<url>` entry, সাথে `lastmod`, `changefreq`, `priority`। Dynamic product URL গুলো build-এ DB থেকে generate করা সম্ভব না বলে — তার বদলে `/products` কে high priority দেব এবং পরে চাইলে server function দিয়ে dynamic sitemap যোগ করা যাবে।

Included URLs: `/`, `/products`, `/streaming`, `/ai-tools`, `/education`, `/cart`, `/checkout`, `/orders`, `/profile`, `/auth`, `/reset-password`, `/contact`, `/faq`, `/sitemap`।

`robots.txt`–এ `Sitemap:` line যোগ করা হবে।

## ২. `/sitemap` page (`src/routes/sitemap.tsx`)

Aurora Glass theme-এ একটি সুন্দর directory page, fanflix-এর footer/sitemap section-এর কাঠামো অনুসরণে কিন্তু আমাদের নিজস্ব copy দিয়ে। সেকশনগুলো:

```
Main
  ├─ Home (/)
  ├─ All Products (/products)
  └─ Contact (/contact)

Categories
  ├─ Streaming Services (/streaming)
  ├─ AI & Productivity Tools (/ai-tools)
  └─ Education & Courses (/education)

Account
  ├─ Login / Sign up (/auth)
  ├─ My Profile (/profile)
  ├─ My Orders (/orders)
  ├─ Cart (/cart)
  ├─ Checkout (/checkout)
  └─ Reset Password (/reset-password)

Help
  ├─ FAQ (/faq)
  ├─ Contact Support (/contact)
  └─ Sitemap (/sitemap)

Featured Products (top 8 from DB, live)
  └─ /product/{slug} ...
```

প্রতিটা section glass card-এ, link-এ hover glow, বাংলা + English label।

## ৩. SEO meta

`/sitemap` রুটে নিজস্ব `head()` — title "Sitemap — AccessNow BD", description, og tags।

`__root.tsx`-এ একটি ছোট footer link "Sitemap" যোগ করা হবে যাতে crawler সহজে পায়।

---

### Technical notes

- `public/sitemap.xml` — static file, build time-এ serve হবে।
- `public/robots.txt` exist করলে update, না করলে create।
- `/sitemap` রুটে featured products fetch করতে existing supabase client + `useQuery` ব্যবহার করব (যেমন `products.tsx`-এ আছে)।
- কোনো DB schema বা business logic পরিবর্তন নেই — pure presentation + static SEO files।
- Out of scope: dynamic XML sitemap with all product slugs (চাইলে পরে server route হিসেবে যোগ করা যাবে)।

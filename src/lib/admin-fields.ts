// Per-feature field configs powering the generic admin CRUD UI.
// Each "kind" maps to a list of fields. Mode "list" = many records, "single" = key/value settings.

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "url"
  | "image"
  | "boolean"
  | "select"
  | "color"
  | "date";

export type AdminField = {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  primary?: boolean; // shown as the row title in list view
  min?: number;        // numeric min (number) / min length (text/textarea)
  max?: number;        // numeric max (number) / max length (text/textarea)
  maxLength?: number;  // explicit max length for text fields
  pattern?: string;    // regex source for text fields
  patternMessage?: string;
};

export function validateField(field: AdminField, value: unknown): string | null {
  const isEmpty = value == null || value === "" || (typeof value === "number" && Number.isNaN(value));
  if (field.required && isEmpty) return `${field.label} is required`;
  if (isEmpty) return null;

  if (field.type === "url" || field.type === "image") {
    try { new URL(String(value)); } catch { return `${field.label} must be a valid URL (https://…)`; }
  }
  if (field.type === "number") {
    const n = Number(value);
    if (Number.isNaN(n)) return `${field.label} must be a number`;
    if (field.min != null && n < field.min) return `${field.label} must be ≥ ${field.min}`;
    if (field.max != null && n > field.max) return `${field.label} must be ≤ ${field.max}`;
  }
  if (field.type === "text" || field.type === "textarea") {
    const s = String(value);
    const max = field.maxLength ?? field.max;
    if (field.min != null && s.length < field.min) return `${field.label} must be at least ${field.min} characters`;
    if (max != null && s.length > max) return `${field.label} must be at most ${max} characters`;
    if (field.pattern) {
      try {
        if (!new RegExp(field.pattern).test(s)) return field.patternMessage ?? `${field.label} has an invalid format`;
      } catch { /* ignore bad regex */ }
    }
  }
  if (field.type === "color") {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value))) return `${field.label} must be a hex color (e.g. #1f2937)`;
  }
  return null;
}

export type AdminFeatureConfig = {
  kind: string;            // value stored in admin_records.kind
  mode: "list" | "single"; // list = CRUD, single = settings (one row)
  fields: AdminField[];
  description?: string;
};

const FEATURES: Record<string, AdminFeatureConfig> = {
  "banner-slider": {
    kind: "banner_slider",
    mode: "list",
    description: "Hero/homepage rotating banners.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, primary: true },
      { name: "subtitle", label: "Subtitle", type: "text" },
      { name: "image_url", label: "Image URL", type: "image" },
      { name: "link", label: "Link URL", type: "url" },
      { name: "cta", label: "Button text", type: "text" },
    ],
  },
  "welcome-popup": {
    kind: "welcome_popup",
    mode: "single",
    description: "Popup shown to first-time visitors.",
    fields: [
      { name: "enabled", label: "Enabled", type: "boolean" },
      { name: "title", label: "Title", type: "text" },
      { name: "message", label: "Message", type: "textarea" },
      { name: "image_url", label: "Image URL", type: "image" },
      { name: "cta_text", label: "Button text", type: "text" },
      { name: "cta_link", label: "Button link", type: "url" },
    ],
  },
  "announcement-bar": {
    kind: "announcement_bar",
    mode: "single",
    description: "Top-of-site marquee/announcement.",
    fields: [
      { name: "enabled", label: "Enabled", type: "boolean" },
      { name: "text", label: "Announcement text", type: "textarea", required: true },
      { name: "link", label: "Link URL", type: "url" },
      { name: "background", label: "Background color", type: "color" },
      { name: "color", label: "Text color", type: "color" },
    ],
  },
  "reviews": {
    kind: "review",
    mode: "list",
    description: "Customer reviews & testimonials.",
    fields: [
      { name: "name", label: "Customer name", type: "text", required: true, primary: true },
      { name: "rating", label: "Rating (1-5)", type: "number" },
      { name: "product", label: "Product", type: "text" },
      { name: "comment", label: "Review", type: "textarea" },
      { name: "avatar_url", label: "Avatar URL", type: "image" },
      { name: "approved", label: "Approved", type: "boolean" },
    ],
  },
  "biggest-discount": {
    kind: "biggest_discount",
    mode: "single",
    fields: [
      { name: "enabled", label: "Enabled", type: "boolean" },
      { name: "title", label: "Title", type: "text" },
      { name: "percent", label: "Discount %", type: "number" },
      { name: "ends_at", label: "Ends at", type: "date" },
      { name: "link", label: "Link URL", type: "url" },
    ],
  },
  "whatsapp-button": {
    kind: "whatsapp_button",
    mode: "single",
    fields: [
      { name: "enabled", label: "Enabled", type: "boolean" },
      { name: "phone", label: "WhatsApp number", type: "text", required: true },
      { name: "message", label: "Default message", type: "text" },
      { name: "position", label: "Position", type: "select", options: [
        { value: "bottom-right", label: "Bottom right" },
        { value: "bottom-left", label: "Bottom left" },
      ] },
    ],
  },
  "media-gallery": {
    kind: "media",
    mode: "list",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, primary: true },
      { name: "url", label: "Image URL", type: "image", required: true },
      { name: "alt", label: "Alt text", type: "text" },
    ],
  },
  "homepage-editor": {
    kind: "homepage",
    mode: "single",
    fields: [
      { name: "hero_title", label: "Hero title", type: "text" },
      { name: "hero_subtitle", label: "Hero subtitle", type: "textarea" },
      { name: "hero_cta", label: "Hero button text", type: "text" },
      { name: "hero_cta_link", label: "Hero button link", type: "url" },
      { name: "show_featured", label: "Show featured products", type: "boolean" },
      { name: "show_reviews", label: "Show reviews", type: "boolean" },
    ],
  },
  "footer-editor": {
    kind: "footer",
    mode: "single",
    fields: [
      { name: "about", label: "About text", type: "textarea" },
      { name: "address", label: "Address", type: "text" },
      { name: "email", label: "Email", type: "text" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "facebook", label: "Facebook URL", type: "url" },
      { name: "youtube", label: "YouTube URL", type: "url" },
      { name: "telegram", label: "Telegram URL", type: "url" },
    ],
  },
  "categories": {
    kind: "category",
    mode: "list",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, primary: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "icon", label: "Icon (emoji)", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
    ],
  },
  "wallet": {
    kind: "wallet_txn",
    mode: "list",
    fields: [
      { name: "user_email", label: "Customer email", type: "text", required: true, primary: true },
      { name: "amount", label: "Amount", type: "number", required: true },
      { name: "type", label: "Type", type: "select", options: [
        { value: "credit", label: "Credit (+)" },
        { value: "debit", label: "Debit (-)" },
      ] },
      { name: "note", label: "Note", type: "text" },
    ],
  },
  "payments": {
    kind: "payment_method",
    mode: "list",
    fields: [
      { name: "name", label: "Method name", type: "text", required: true, primary: true },
      { name: "number", label: "Account number", type: "text" },
      { name: "instructions", label: "Instructions", type: "textarea" },
      { name: "logo_url", label: "Logo URL", type: "image" },
    ],
  },
  "account-delivery": {
    kind: "account_delivery",
    mode: "list",
    fields: [
      { name: "order_ref", label: "Order ref", type: "text", primary: true, required: true },
      { name: "product", label: "Product", type: "text" },
      { name: "username", label: "Username/Email", type: "text" },
      { name: "password", label: "Password", type: "text" },
      { name: "notes", label: "Delivery notes", type: "textarea" },
      { name: "delivered", label: "Delivered", type: "boolean" },
    ],
  },
  "inventory": {
    kind: "inventory",
    mode: "list",
    fields: [
      { name: "product", label: "Product", type: "text", required: true, primary: true },
      { name: "stock", label: "Stock", type: "number" },
      { name: "low_stock_at", label: "Low-stock threshold", type: "number" },
      { name: "supplier", label: "Supplier", type: "text" },
    ],
  },
  "notifications": {
    kind: "notification",
    mode: "list",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, primary: true },
      { name: "body", label: "Body", type: "textarea" },
      { name: "audience", label: "Audience", type: "select", options: [
        { value: "all", label: "All customers" },
        { value: "admins", label: "Admins" },
      ] },
    ],
  },
  "checkout-policy": {
    kind: "checkout_policy",
    mode: "single",
    fields: [
      { name: "min_order", label: "Minimum order amount", type: "number" },
      { name: "terms", label: "Terms text", type: "textarea" },
      { name: "require_phone", label: "Require phone", type: "boolean" },
      { name: "require_email", label: "Require email", type: "boolean" },
    ],
  },
  "custom-invoice": {
    kind: "invoice_settings",
    mode: "single",
    fields: [
      { name: "company_name", label: "Company name", type: "text" },
      { name: "logo_url", label: "Logo URL", type: "image" },
      { name: "address", label: "Address", type: "textarea" },
      { name: "footer_note", label: "Invoice footer", type: "textarea" },
    ],
  },
  "coupons": {
    kind: "coupon",
    mode: "list",
    fields: [
      { name: "code", label: "Code", type: "text", required: true, primary: true },
      { name: "percent", label: "Discount %", type: "number" },
      { name: "amount", label: "Flat amount", type: "number" },
      { name: "min_order", label: "Min order amount", type: "number" },
      { name: "expires_at", label: "Expires at", type: "date" },
    ],
  },
  "referral": {
    kind: "referral_settings",
    mode: "single",
    fields: [
      { name: "enabled", label: "Enabled", type: "boolean" },
      { name: "reward_amount", label: "Reward amount", type: "number" },
      { name: "min_purchase", label: "Min purchase to qualify", type: "number" },
      { name: "terms", label: "Terms", type: "textarea" },
    ],
  },
  "affiliates": {
    kind: "affiliate",
    mode: "list",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, primary: true },
      { name: "email", label: "Email", type: "text" },
      { name: "code", label: "Promo code", type: "text" },
      { name: "commission_percent", label: "Commission %", type: "number" },
    ],
  },
  "marketing": {
    kind: "marketing_campaign",
    mode: "list",
    fields: [
      { name: "name", label: "Campaign name", type: "text", required: true, primary: true },
      { name: "channel", label: "Channel", type: "select", options: [
        { value: "email", label: "Email" },
        { value: "sms", label: "SMS" },
        { value: "push", label: "Push" },
      ] },
      { name: "message", label: "Message", type: "textarea" },
      { name: "scheduled_at", label: "Scheduled at", type: "date" },
    ],
  },
  "ad-campaigns": {
    kind: "ad_campaign",
    mode: "list",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, primary: true },
      { name: "platform", label: "Platform", type: "select", options: [
        { value: "facebook", label: "Facebook" },
        { value: "google", label: "Google" },
        { value: "tiktok", label: "TikTok" },
      ] },
      { name: "budget", label: "Budget", type: "number" },
      { name: "url", label: "Landing URL", type: "url" },
    ],
  },
  "fb-pixel": {
    kind: "fb_pixel",
    mode: "single",
    fields: [
      { name: "pixel_id", label: "Pixel ID", type: "text" },
      { name: "access_token", label: "CAPI access token", type: "text" },
      { name: "test_event_code", label: "Test event code", type: "text" },
    ],
  },
  "google-ads": {
    kind: "google_ads",
    mode: "single",
    fields: [
      { name: "ga4_id", label: "GA4 Measurement ID", type: "text" },
      { name: "gads_id", label: "Google Ads ID", type: "text" },
      { name: "conversion_label", label: "Conversion label", type: "text" },
    ],
  },
  "ga4-realtime": {
    kind: "ga4_realtime",
    mode: "single",
    fields: [
      { name: "property_id", label: "GA4 Property ID", type: "text" },
      { name: "api_secret", label: "API secret", type: "text" },
    ],
  },
  "search-console": {
    kind: "seo_settings",
    mode: "single",
    fields: [
      { name: "site_url", label: "Site URL", type: "url" },
      { name: "verification_meta", label: "Verification meta tag", type: "text" },
      { name: "default_title", label: "Default title", type: "text" },
      { name: "default_description", label: "Default description", type: "textarea" },
      { name: "robots_txt", label: "robots.txt content", type: "textarea" },
    ],
  },
  "tracking": {
    kind: "tracking_link",
    mode: "list",
    fields: [
      { name: "order_ref", label: "Order ref", type: "text", required: true, primary: true },
      { name: "courier", label: "Courier", type: "text" },
      { name: "tracking_no", label: "Tracking no.", type: "text" },
      { name: "url", label: "Tracking URL", type: "url" },
    ],
  },
  "tickets": {
    kind: "ticket",
    mode: "list",
    fields: [
      { name: "subject", label: "Subject", type: "text", required: true, primary: true },
      { name: "customer", label: "Customer", type: "text" },
      { name: "priority", label: "Priority", type: "select", options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
      ] },
      { name: "status", label: "Status", type: "select", options: [
        { value: "open", label: "Open" },
        { value: "pending", label: "Pending" },
        { value: "resolved", label: "Resolved" },
      ] },
      { name: "message", label: "Message", type: "textarea" },
    ],
  },
  "help-center": {
    kind: "help_article",
    mode: "list",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, primary: true },
      { name: "category", label: "Category", type: "text" },
      { name: "body", label: "Article body", type: "textarea" },
    ],
  },
  "support-channels": {
    kind: "support_channels",
    mode: "single",
    fields: [
      { name: "phone", label: "Support phone", type: "text" },
      { name: "email", label: "Support email", type: "text" },
      { name: "whatsapp", label: "WhatsApp", type: "text" },
      { name: "telegram", label: "Telegram", type: "text" },
      { name: "messenger", label: "Messenger URL", type: "url" },
      { name: "hours", label: "Working hours", type: "text" },
    ],
  },
  "pages": {
    kind: "page",
    mode: "list",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, primary: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "body", label: "Body (HTML/Markdown)", type: "textarea" },
      { name: "show_in_menu", label: "Show in menu", type: "boolean" },
    ],
  },
  "blog": {
    kind: "blog_post",
    mode: "list",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, primary: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "excerpt", label: "Excerpt", type: "textarea" },
      { name: "cover_url", label: "Cover image URL", type: "image" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "author", label: "Author", type: "text" },
    ],
  },
  "ceo-message": {
    kind: "ceo_message",
    mode: "single",
    fields: [
      { name: "name", label: "CEO name", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "photo_url", label: "Photo URL", type: "image" },
      { name: "message", label: "Message", type: "textarea" },
    ],
  },
  "software-downloads": {
    kind: "software_download",
    mode: "list",
    fields: [
      { name: "name", label: "Software name", type: "text", required: true, primary: true },
      { name: "version", label: "Version", type: "text" },
      { name: "platform", label: "Platform", type: "select", options: [
        { value: "windows", label: "Windows" },
        { value: "mac", label: "macOS" },
        { value: "android", label: "Android" },
        { value: "ios", label: "iOS" },
      ] },
      { name: "url", label: "Download URL", type: "url", required: true },
      { name: "size", label: "Size", type: "text" },
    ],
  },
  "analytics": {
    kind: "analytics_settings",
    mode: "single",
    fields: [
      { name: "show_revenue", label: "Show revenue widget", type: "boolean" },
      { name: "show_orders", label: "Show orders widget", type: "boolean" },
      { name: "show_traffic", label: "Show traffic widget", type: "boolean" },
    ],
  },
  "customer-insights": {
    kind: "customer_segment",
    mode: "list",
    fields: [
      { name: "name", label: "Segment name", type: "text", required: true, primary: true },
      { name: "criteria", label: "Criteria", type: "textarea" },
    ],
  },
  "reports": {
    kind: "report",
    mode: "list",
    fields: [
      { name: "name", label: "Report name", type: "text", required: true, primary: true },
      { name: "type", label: "Type", type: "select", options: [
        { value: "sales", label: "Sales" },
        { value: "customers", label: "Customers" },
        { value: "products", label: "Products" },
      ] },
      { name: "schedule", label: "Schedule", type: "text" },
    ],
  },
  "ai-api": {
    kind: "ai_api_settings",
    mode: "single",
    fields: [
      { name: "default_model", label: "Default model", type: "text" },
      { name: "system_prompt", label: "System prompt", type: "textarea" },
      { name: "temperature", label: "Temperature", type: "number" },
    ],
  },
  "shop-config": {
    kind: "shop_config",
    mode: "single",
    description: "WhatsApp number ও shop information যা product page, checkout এবং WhatsApp order button-এ ব্যবহার হবে।",
    fields: [
      { name: "whatsapp_number", label: "WhatsApp number (with country code, no +)", type: "text", required: true, placeholder: "8801711000000" },
      { name: "shop_name", label: "Shop name", type: "text", placeholder: "AccessNow BD" },
      { name: "support_hours", label: "Support hours", type: "text", placeholder: "9 AM – 12 AM" },
    ],
  },
  "settings": {
    kind: "site_settings",
    mode: "single",
    fields: [
      { name: "site_name", label: "Site name", type: "text" },
      { name: "logo_url", label: "Logo URL", type: "image" },
      { name: "favicon_url", label: "Favicon URL", type: "image" },
      { name: "currency", label: "Currency", type: "text" },
      { name: "timezone", label: "Timezone", type: "text" },
      { name: "maintenance_mode", label: "Maintenance mode", type: "boolean" },
    ],
  },
  "backup": {
    kind: "backup_settings",
    mode: "single",
    fields: [
      { name: "auto_backup", label: "Auto backup", type: "boolean" },
      { name: "frequency", label: "Frequency", type: "select", options: [
        { value: "daily", label: "Daily" },
        { value: "weekly", label: "Weekly" },
        { value: "monthly", label: "Monthly" },
      ] },
      { name: "retention_days", label: "Retention (days)", type: "number" },
    ],
  },
  "order-recovery": {
    kind: "order_recovery",
    mode: "list",
    fields: [
      { name: "customer", label: "Customer", type: "text", required: true, primary: true },
      { name: "phone", label: "Phone", type: "text" },
      { name: "amount", label: "Amount", type: "number" },
      { name: "stage", label: "Stage", type: "select", options: [
        { value: "abandoned", label: "Abandoned" },
        { value: "contacted", label: "Contacted" },
        { value: "recovered", label: "Recovered" },
      ] },
      { name: "note", label: "Note", type: "textarea" },
    ],
  },
  "activity-log": {
    kind: "activity",
    mode: "list",
    fields: [
      { name: "actor", label: "Actor", type: "text", required: true, primary: true },
      { name: "action", label: "Action", type: "text" },
      { name: "target", label: "Target", type: "text" },
      { name: "details", label: "Details", type: "textarea" },
    ],
  },
  "ai-command": {
    kind: "ai_command",
    mode: "list",
    fields: [
      { name: "name", label: "Command name", type: "text", required: true, primary: true },
      { name: "trigger", label: "Trigger phrase", type: "text" },
      { name: "prompt", label: "AI prompt", type: "textarea" },
    ],
  },
  "add-product": {
    kind: "_redirect_products",
    mode: "single",
    fields: [],
  },
  "roles": {
    kind: "_redirect_users",
    mode: "single",
    fields: [],
  },
};

export function getFeatureConfig(slug: string): AdminFeatureConfig | undefined {
  return FEATURES[slug];
}

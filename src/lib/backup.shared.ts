// Client-safe backup metadata (no server imports here).

/** Table -> conflict key, in parent → child restore order. */
export const BACKUP_TABLES: Record<string, string> = {
  categories: "id",
  brands: "id",
  tags: "id",
  products: "slug",
  product_variants: "id",
  product_media: "id",
  product_digital_files: "id",
  product_license_keys: "id",
  profiles: "id",
  user_roles: "id",
  team_members: "id",
  admin_records: "id",
  coupons: "id",
  promotions: "id",
  orders: "id",
  product_reviews: "id",
  support_tickets: "id",
  ticket_messages: "id",
  live_chat_messages: "id",
  notifications: "id",
  newsletter_subscribers: "id",
  suppressed_emails: "id",
  abandoned_checkouts: "id",
  wallets: "user_id",
  wallet_topups: "id",
  wallet_transactions: "id",
  tracking_pixels: "id",
  telegram_settings: "id",
  telegram_subscribers: "id",
  telegram_broadcasts: "id",
  telegram_referrals: "id",
  telegram_wishlist: "id",
  renewal_reminders_sent: "id",
  activity_logs: "id",
  accessibility_reports: "id",
  digital_downloads_log: "id",
  email_send_log: "id",
};

/** Restore order = declaration order of BACKUP_TABLES. */
export const RESTORE_ORDER = Object.keys(BACKUP_TABLES);

export const BACKUP_BUCKETS = ["admin-uploads", "payment-screenshots"] as const;

export type BackupPayload = {
  meta: {
    version: number;
    created_at: string;
    created_by: string;
    total_rows: number;
    counts: Record<string, number>;
  };
  tables: Record<string, Array<Record<string, unknown>>>;
};

export type StorageObjectRef = {
  bucket: string;
  path: string;
  size: number;
  url: string;
};

export type RestoreResult = {
  ok: boolean;
  restored_at: string;
  results: Record<string, { restored: number; skipped?: number; error?: string }>;
};

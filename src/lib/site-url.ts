// Canonical public site URL. Always used for shareable links
// (referral links, payment links, invoice links, etc.) so they
// never expose preview / lovable.app domains to customers.
export const PUBLIC_SITE_URL = "https://accessnowbd.com";

export function publicUrl(path: string = "/"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${PUBLIC_SITE_URL}${p}`;
}

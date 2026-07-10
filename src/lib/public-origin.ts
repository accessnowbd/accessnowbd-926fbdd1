// Production origin helper — কখনো preview/lovable subdomain URL callback/webhook হিসেবে দেওয়া হবে না।
// Preview/localhost হলে সবসময় production domain (accessnowbd.com) return করে।

export const PROD_ORIGIN = "https://accessnowbd.com";

export function getPublicOrigin(): string {
  if (typeof window === "undefined") return PROD_ORIGIN;
  const host = window.location.hostname;
  const isProd = host === "accessnowbd.com" || host === "www.accessnowbd.com";
  return isProd ? window.location.origin : PROD_ORIGIN;
}

// Preview/lovable/localhost host detected হলে production origin দিয়ে replace করে
export function normalizePublicUrl(url: string, path: string): string {
  const origin = getPublicOrigin();
  if (!url) return `${origin}${path}`;
  if (/lovable\.app|lovableproject\.com|localhost|127\.0\.0\.1/i.test(url)) {
    return `${origin}${path}`;
  }
  return url;
}

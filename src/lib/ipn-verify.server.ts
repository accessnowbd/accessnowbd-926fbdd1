import { createHash } from "crypto";

/* ============================================================
 * SSLCommerz / EPS (SSLCommerz-compatible) IPN signature check.
 *
 * Scheme: verify_sign = md5( "<k1=v1&k2=v2&...>&store_passwd=<md5(store_password)>" )
 * where the key list comes from `verify_key` (comma separated) and the
 * pairs are sorted alphabetically by key.
 * ============================================================ */

function md5(input: string) {
  return createHash("md5").update(input).digest("hex");
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function verifyIpnSignature(
  body: Record<string, unknown>,
  storePassword: string | undefined | null,
): boolean {
  if (!storePassword) return false;

  const verifySign = String(body["verify_sign"] ?? "").trim();
  const verifyKey = String(body["verify_key"] ?? "").trim();
  if (!verifySign || !verifyKey) return false;

  const keys = verifyKey
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .sort();
  if (keys.length === 0) return false;

  const pairs = keys.map((k) => `${k}=${body[k] ?? ""}`);
  pairs.push(`store_passwd=${md5(storePassword)}`);

  return constantTimeEqual(md5(pairs.join("&")), verifySign.toLowerCase());
}

/**
 * Server-to-server validation call. SSLCommerz/EPS expose a validator
 * endpoint that confirms a transaction really happened.
 */
export async function validateWithGateway(opts: {
  apiUrl: string;
  valId: string;
  storeId: string;
  storePassword: string;
}): Promise<{ ok: boolean; amount?: number; status?: string }> {
  const base = opts.apiUrl.replace(/\/$/, "");
  const url =
    `${base}/validator/api/validationserverAPI.php` +
    `?val_id=${encodeURIComponent(opts.valId)}` +
    `&store_id=${encodeURIComponent(opts.storeId)}` +
    `&store_passwd=${encodeURIComponent(opts.storePassword)}&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false };
    const j = (await res.json()) as { status?: string; amount?: string | number };
    const status = String(j.status ?? "").toUpperCase();
    return {
      ok: status === "VALID" || status === "VALIDATED",
      amount: Number(j.amount ?? 0),
      status,
    };
  } catch {
    return { ok: false };
  }
}

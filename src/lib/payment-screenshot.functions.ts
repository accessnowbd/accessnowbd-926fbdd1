import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["jpg", "jpeg", "png", "webp", "gif", "heic"];

/**
 * Guest checkout screenshot upload. Guests have no auth.uid(), so they cannot
 * write to the private payment-screenshots bucket directly. This validates the
 * payload server-side and stores it under a random guest/ prefix.
 */
export const uploadGuestScreenshot = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        ext: z.string().min(1).max(10),
        contentType: z.string().min(3).max(100),
        dataBase64: z.string().min(1).max(9_000_000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const ext = data.ext.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!ALLOWED.includes(ext)) throw new Error("শুধু ছবি ফাইল আপলোড করা যাবে");
    if (!data.contentType.startsWith("image/")) throw new Error("শুধু ছবি ফাইল আপলোড করা যাবে");

    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    if (bytes.byteLength > MAX_BYTES) throw new Error("ফাইল সর্বোচ্চ ৫MB হতে হবে");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `guest/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from("payment-screenshots")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    return { path };
  });

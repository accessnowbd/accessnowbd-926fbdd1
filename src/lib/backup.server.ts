import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  BACKUP_TABLES,
  RESTORE_ORDER,
  BACKUP_BUCKETS,
  type BackupPayload,
  type RestoreResult,
  type StorageObjectRef,
} from "./backup.shared";

type AnyAdmin = {
  from: (t: string) => any;
  storage: {
    from: (b: string) => {
      list: (path: string, opts: Record<string, unknown>) => Promise<{ data: any[] | null; error: { message: string } | null }>;
      createSignedUrl: (p: string, s: number) => Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
      getPublicUrl: (p: string) => { data: { publicUrl: string } };
      upload: (p: string, body: unknown, opts: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
  };
};

const admin = () => supabaseAdmin as unknown as AnyAdmin;

export async function assertAdmin(userId: string) {
  const { data, error } = await admin()
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export async function buildBackup(userId: string): Promise<BackupPayload> {
  const tables: Record<string, Array<Record<string, unknown>>> = {};
  const counts: Record<string, number> = {};
  const names = Object.keys(BACKUP_TABLES);
  const chunks = await Promise.all(
    names.map(async (table) => {
      const { data, error } = await admin().from(table).select("*");
      if (error) return { table, rows: [] as Array<Record<string, unknown>>, error: error.message };
      return { table, rows: (data ?? []) as Array<Record<string, unknown>> };
    }),
  );
  for (const c of chunks) {
    tables[c.table] = c.rows;
    counts[c.table] = c.rows.length;
  }
  return {
    meta: {
      version: 2,
      created_at: new Date().toISOString(),
      created_by: userId,
      total_rows: Object.values(counts).reduce((a, b) => a + b, 0),
      counts,
    },
    tables,
  };
}

async function listBucket(bucket: string, prefix = ""): Promise<StorageObjectRef[]> {
  const out: StorageObjectRef[] = [];
  const { data, error } = await admin().storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return out;
  for (const entry of data) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null || entry.metadata == null) {
      out.push(...(await listBucket(bucket, path)));
      continue;
    }
    let url = "";
    const signed = await admin().storage.from(bucket).createSignedUrl(path, 60 * 60);
    if (signed.data?.signedUrl) url = signed.data.signedUrl;
    else url = admin().storage.from(bucket).getPublicUrl(path).data.publicUrl;
    out.push({ bucket, path, size: Number(entry.metadata?.size ?? 0), url });
  }
  return out;
}

export async function listStorage(): Promise<StorageObjectRef[]> {
  const all = await Promise.all(BACKUP_BUCKETS.map((b) => listBucket(b)));
  return all.flat();
}

export async function putStorageObject(input: {
  bucket: string;
  path: string;
  base64: string;
  contentType?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!(BACKUP_BUCKETS as readonly string[]).includes(input.bucket)) {
    return { ok: false, error: "Unknown bucket" };
  }
  const bytes = Buffer.from(input.base64, "base64");
  const { error } = await admin().storage.from(input.bucket).upload(input.path, bytes, {
    contentType: input.contentType || "application/octet-stream",
    upsert: true,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function runRestore(
  payload: { tables: Record<string, Array<Record<string, unknown>>> },
  mode: "safe" | "merge" | "replace",
  selectedTables?: string[],
): Promise<RestoreResult> {
  const results: RestoreResult["results"] = {};
  const requested = selectedTables?.length ? selectedTables : Object.keys(payload.tables);
  const ordered = RESTORE_ORDER.filter((t) => requested.includes(t));
  const extras = requested.filter((t) => !RESTORE_ORDER.includes(t));
  for (const t of extras) results[t] = { restored: 0, error: "Not a backup-able table" };

  for (const table of ordered) {
    const pk = BACKUP_TABLES[table];
    const rows = payload.tables[table];
    if (!rows) { results[table] = { restored: 0 }; continue; }

    if (mode === "replace") {
      const { error: delErr } = await admin().from(table).delete().not(pk, "is", null);
      if (delErr) { results[table] = { restored: 0, error: `clear: ${delErr.message}` }; continue; }
    }
    if (rows.length === 0) { results[table] = { restored: 0 }; continue; }

    let total = 0;
    let skipped = 0;
    let err: string | undefined;
    const CHUNK = 200;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const opts = mode === "safe"
        ? { onConflict: pk, ignoreDuplicates: true }
        : { onConflict: pk, ignoreDuplicates: false };
      const { data, error } = await admin().from(table).upsert(chunk, opts).select(pk);
      if (error) { err = error.message; break; }
      const inserted = Array.isArray(data) ? data.length : chunk.length;
      total += inserted;
      skipped += chunk.length - inserted;
    }
    results[table] = { restored: total, skipped, error: err };
  }
  return { ok: true, results, restored_at: new Date().toISOString() };
}

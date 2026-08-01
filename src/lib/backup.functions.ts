import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin, buildBackup, listStorage, putStorageObject, runRestore } from "./backup.server";
import type { RestoreResult, StorageObjectRef } from "./backup.shared";

export { BACKUP_TABLES, BACKUP_BUCKETS, RESTORE_ORDER } from "./backup.shared";
export type { BackupPayload, RestoreResult, StorageObjectRef } from "./backup.shared";

export const createBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ json: string; meta: { created_at: string; total_rows: number; counts: Record<string, number> } }> => {
    await assertAdmin(context.userId);
    const payload = await buildBackup(context.userId);
    return {
      json: JSON.stringify(payload, null, 2),
      meta: { created_at: payload.meta.created_at, total_rows: payload.meta.total_rows, counts: payload.meta.counts },
    };
  });

export const listBackupStorage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ files: StorageObjectRef[] }> => {
    await assertAdmin(context.userId);
    return { files: await listStorage() };
  });

export const uploadBackupStorageFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      bucket: z.string().min(1),
      path: z.string().min(1),
      base64: z.string().min(1),
      contentType: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    await assertAdmin(context.userId);
    return putStorageObject(data);
  });

export const restoreBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      payloadJson: z.string().min(2),
      mode: z.enum(["safe", "merge", "replace"]).default("safe"),
      selectedTables: z.array(z.string()).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }): Promise<RestoreResult> => {
    await assertAdmin(context.userId);
    const parsed = z
      .object({ tables: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))) })
      .parse(JSON.parse(data.payloadJson));
    return runRestore(parsed, data.mode, data.selectedTables);
  });

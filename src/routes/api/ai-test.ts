import { createFileRoute } from "@tanstack/react-router";
import { requireApiAdmin } from "@/lib/api-auth.server";

// Small AI system test endpoint — used by /admin/settings AI panel.
// GET  → status check (is Lovable AI Gateway reachable + key present)
// POST → runs a real one-shot chat completion with the caller-supplied model+prompt.

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function checkStatus(apiKey: string) {
  try {
    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
      }),
    });
    if (res.status === 429 || res.status === 402) return { ok: true, note: `soft-limit ${res.status}` };
    return { ok: res.ok, status: res.status };
  } catch (e: any) {
    return { ok: false, error: e?.message || "network" };
  }
}

export const Route = createFileRoute("/api/ai-test")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authGet = await requireApiAdmin(request);
        if ("error" in authGet) return authGet.error;
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return Response.json({ ok: false, error: "LOVABLE_API_KEY missing" }, { status: 200 });
        const s = await checkStatus(key);
        return Response.json(s);
      },
      POST: async ({ request }) => {
        const auth = await requireApiAdmin(request);
        if ("error" in auth) return auth.error;

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return Response.json({ ok: false, error: "LOVABLE_API_KEY missing" }, { status: 500 });

        let body: { model?: string; prompt?: string } = {};
        try { body = await request.json(); } catch {}
        const model = (body.model || "google/gemini-2.5-flash").toString();
        const prompt = (body.prompt || "Say hi.").toString().slice(0, 1000);

        try {
          const res = await fetch(GATEWAY, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: "You are a concise assistant. Respond in one short sentence." },
                { role: "user", content: prompt },
              ],
              max_tokens: 80,
            }),
          });
          const j: any = await res.json().catch(() => ({}));
          if (!res.ok) {
            return Response.json(
              { ok: false, error: j?.error?.message || j?.error || `HTTP ${res.status}`, status: res.status },
              { status: 200 },
            );
          }
          const text = j?.choices?.[0]?.message?.content ?? "";
          return Response.json({ ok: true, text, model });
        } catch (e: any) {
          return Response.json({ ok: false, error: e?.message || "network" }, { status: 200 });
        }
      },
    },
  },
});

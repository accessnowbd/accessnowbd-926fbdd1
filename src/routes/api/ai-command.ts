import { createFileRoute } from "@tanstack/react-router";

// Executes a saved AI command from the AI Command Center.
// Body: { system: string, input: string, model?: string, temperature?: number, maxTokens?: number }

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const Route = createFileRoute("/api/ai-command")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return Response.json({ ok: false, error: "LOVABLE_API_KEY missing" }, { status: 500 });
        }

        let body: {
          system?: string;
          input?: string;
          model?: string;
          temperature?: number;
          maxTokens?: number;
        } = {};
        try { body = await request.json(); } catch {}

        const system = (body.system || "You are a concise assistant.").toString().slice(0, 8000);
        const input = (body.input || "").toString().slice(0, 12000);
        const model = (body.model || "google/gemini-2.5-flash").toString();
        const temperature = typeof body.temperature === "number" ? body.temperature : 0.7;
        const maxTokens = Math.min(Math.max(body.maxTokens ?? 800, 32), 4000);

        if (!input.trim()) {
          return Response.json({ ok: false, error: "input is required" }, { status: 400 });
        }

        // Support {{input}} templating; otherwise append input as user message.
        const hasTemplate = /\{\{\s*input\s*\}\}/i.test(system);
        const finalSystem = hasTemplate ? system.replace(/\{\{\s*input\s*\}\}/gi, input) : system;
        const userMsg = hasTemplate ? "Proceed." : input;

        const started = Date.now();
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
                { role: "system", content: finalSystem },
                { role: "user", content: userMsg },
              ],
              temperature,
              max_tokens: maxTokens,
            }),
          });
          const j: any = await res.json().catch(() => ({}));
          const latency = Date.now() - started;
          if (!res.ok) {
            return Response.json(
              {
                ok: false,
                status: res.status,
                error:
                  res.status === 429
                    ? "Rate limit reached — try again in a moment."
                    : res.status === 402
                    ? "Workspace AI credits exhausted. Add credits from Settings → Workspace → Usage."
                    : j?.error?.message || j?.error || `HTTP ${res.status}`,
              },
              { status: 200 },
            );
          }
          const text = j?.choices?.[0]?.message?.content ?? "";
          const usage = j?.usage ?? null;
          return Response.json({ ok: true, text, model, latency, usage });
        } catch (e: any) {
          return Response.json({ ok: false, error: e?.message || "network error" }, { status: 200 });
        }
      },
    },
  },
});

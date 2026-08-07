import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck } from "lucide-react";
import { getBotGuardConfig } from "@/lib/bot-guard.functions";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => existing.addEventListener("load", () => resolve(), { once: true }));
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Turnstile script failed to load"));
    document.head.appendChild(s);
  });
}

/**
 * Renders the Cloudflare Turnstile challenge when Turnstile keys are configured.
 * When they are not, it shows the silent-protection badge instead — signup stays
 * protected by the honeypot + timing + throttle checks on the server.
 */
export function BotVerification({ onToken }: { onToken: (token: string | null) => void }) {
  const fetchConfig = useServerFn(getBotGuardConfig);
  const [cfg, setCfg] = useState<{ captchaEnabled: boolean; siteKey: string } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchConfig()
      .then((c) => alive && setCfg(c))
      .catch(() => alive && setCfg({ captchaEnabled: false, siteKey: "" }));
    return () => {
      alive = false;
    };
  }, [fetchConfig]);

  useEffect(() => {
    if (!cfg?.captchaEnabled || !cfg.siteKey || !boxRef.current) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !boxRef.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(boxRef.current, {
          sitekey: cfg.siteKey,
          theme: "light",
          size: "flexible",
          callback: (t: string) => onToken(t),
          "expired-callback": () => onToken(null),
          "error-callback": () => onToken(null),
        });
      })
      .catch(() => onToken(null));
    return () => {
      cancelled = true;
      try {
        if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      } catch {
        /* ignore */
      }
      widgetId.current = null;
    };
  }, [cfg, onToken]);

  if (!cfg) return null;

  if (!cfg.captchaEnabled) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <p className="text-[12px] font-semibold text-slate-600">
          বট প্রোটেকশন সক্রিয় — এই ফর্মটি স্বয়ংক্রিয়ভাবে সুরক্ষিত
        </p>
      </div>
    );
  }

  return <div ref={boxRef} className="min-h-[65px]" />;
}

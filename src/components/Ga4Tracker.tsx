import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reads GA4 Measurement ID from admin_records (kind='ga4_realtime')
 * and (a) injects gtag site-wide, (b) logs an anonymous pageview into
 * public.pageview_events on every route change so the admin Realtime
 * Report has live data — no service account required.
 */
export function Ga4Tracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [measurementId, setMeasurementId] = useState<string | null>(null);
  const injectedRef = useRef(false);
  const sessionIdRef = useRef<string>("");

  // Bootstrap session id once (client-only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      let sid = sessionStorage.getItem("anb_sid");
      if (!sid) {
        sid = (crypto?.randomUUID?.() ?? String(Date.now()) + Math.random().toString(36).slice(2));
        sessionStorage.setItem("anb_sid", sid);
      }
      sessionIdRef.current = sid;
    } catch {
      sessionIdRef.current = String(Date.now());
    }
  }, []);

  // Load config once
  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("admin_records")
        .select("data")
        .eq("kind", "ga4_realtime")
        .eq("is_active", true)
        .maybeSingle();
      if (!active) return;
      const mid = (data?.data as { measurement_id?: string } | null)?.measurement_id?.trim();
      if (mid) setMeasurementId(mid);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Inject gtag script once we have an ID (skip admin pages)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!measurementId) return;
    if (injectedRef.current) return;
    if (pathname.startsWith("/admin")) return;

    injectedRef.current = true;
    const loader = document.createElement("script");
    loader.async = true;
    loader.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(loader);

    const init = document.createElement("script");
    init.innerHTML = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('js', new Date());
gtag('config', '${measurementId}', { send_page_view: true });
    `;
    document.head.appendChild(init);
  }, [measurementId, pathname]);

  // Log pageview to our own DB for the realtime report (public+admin excluded)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/admin")) return;
    const sid = sessionIdRef.current;
    if (!sid) return;

    const t = setTimeout(() => {
      const payload = {
        session_id: sid,
        path: pathname.slice(0, 500),
        referrer: (document.referrer || "").slice(0, 500) || null,
        user_agent: (navigator.userAgent || "").slice(0, 500),
      };
      // Fire and forget — never block the UI
      supabase
        .from("pageview_events")
        .insert(payload as never)
        .then(() => {})
        .then(undefined, () => {});

      // Also fire GA4 page_view if gtag is available
      const w = window as unknown as { gtag?: (...args: unknown[]) => void };
      if (measurementId && typeof w.gtag === "function") {
        try {
          w.gtag("event", "page_view", { page_path: pathname });
        } catch {
          /* ignore */
        }
      }
    }, 250);
    return () => clearTimeout(t);
  }, [pathname, measurementId]);

  return null;
}

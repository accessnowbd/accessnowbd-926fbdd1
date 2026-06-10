import { useEffect, useState } from "react";

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

function extract(url: string): Promise<string | null> {
  if (cache.has(url)) return Promise.resolve(cache.get(url)!);
  if (inflight.has(url)) return inflight.get(url)!;
  const p = new Promise<string | null>((resolve) => {
    if (typeof window === "undefined") return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const w = 32, h = 32;
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        // Bucket saturated pixels by hue, pick dominant
        const buckets = new Array(12).fill(0).map(() => ({ r: 0, g: 0, b: 0, n: 0 }));
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 200) continue;
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          const l = (max + min) / 2;
          const d = max - min;
          if (d < 30) continue; // skip grey
          if (l < 25 || l > 235) continue; // skip near black/white
          let hue = 0;
          if (max === r) hue = ((g - b) / d) % 6;
          else if (max === g) hue = (b - r) / d + 2;
          else hue = (r - g) / d + 4;
          hue = (hue * 60 + 360) % 360;
          const idx = Math.floor(hue / 30) % 12;
          const bk = buckets[idx];
          bk.r += r; bk.g += g; bk.b += b; bk.n += d / 255;
        }
        let best = buckets[0], bestScore = -1;
        for (const bk of buckets) {
          if (bk.n > bestScore) { bestScore = bk.n; best = bk; }
        }
        if (!best.n) return resolve(null);
        const r = Math.round(best.r / Math.max(1, Math.round(best.n)));
        const g = Math.round(best.g / Math.max(1, Math.round(best.n)));
        const b = Math.round(best.b / Math.max(1, Math.round(best.n)));
        // Clamp to ensure decent saturation; darken slightly for card bg
        const hex = `rgb(${r}, ${g}, ${b})`;
        cache.set(url, hex);
        resolve(hex);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
  inflight.set(url, p);
  p.finally(() => inflight.delete(url));
  return p;
}

export function useDominantColor(url?: string | null): string | null {
  const [color, setColor] = useState<string | null>(url ? cache.get(url) ?? null : null);
  useEffect(() => {
    if (!url) { setColor(null); return; }
    const cached = cache.get(url);
    if (cached) { setColor(cached); return; }
    let alive = true;
    extract(url).then((c) => { if (alive) setColor(c); });
    return () => { alive = false; };
  }, [url]);
  return color;
}

import { useMemo, useState } from "react";
import type { Product } from "@/data/products";

/** Deterministic hash from slug → stable per-product visuals */
function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const SPHERE_GRADIENTS = [
  "radial-gradient(circle at 30% 30%, #c084fc 0%, #6366f1 55%, #1e1b4b 100%)",
  "radial-gradient(circle at 30% 30%, #f0abfc 0%, #a855f7 50%, #4c1d95 100%)",
  "radial-gradient(circle at 30% 30%, #93c5fd 0%, #6366f1 55%, #1e3a8a 100%)",
  "radial-gradient(circle at 30% 30%, #f9a8d4 0%, #c026d3 55%, #581c87 100%)",
];

/** Brand-domain guesser → clearbit logo (no API key, public CDN) */
function guessLogoUrl(name: string): string {
  const map: Record<string, string> = {
    netflix: "netflix.com",
    spotify: "spotify.com",
    "youtube premium": "youtube.com",
    youtube: "youtube.com",
    "prime video": "primevideo.com",
    "amazon prime": "primevideo.com",
    "disney+": "disneyplus.com",
    disney: "disneyplus.com",
    hoichoi: "hoichoi.tv",
    chorki: "chorki.com",
    "chatgpt plus": "openai.com",
    chatgpt: "openai.com",
    openai: "openai.com",
    claude: "claude.ai",
    gemini: "gemini.google.com",
    "google one": "one.google.com",
    coursera: "coursera.org",
    grammarly: "grammarly.com",
    "canva pro": "canva.com",
    canva: "canva.com",
    capcut: "capcut.com",
    adobe: "adobe.com",
    "adobe cc": "adobe.com",
    freepik: "freepik.com",
    autodesk: "autodesk.com",
    truecaller: "truecaller.com",
    zoom: "zoom.us",
    slack: "slack.com",
    nordvpn: "nordvpn.com",
    expressvpn: "expressvpn.com",
    surfshark: "surfshark.com",
    proton: "proton.me",
    windows: "microsoft.com",
    "microsoft office": "microsoft.com",
    office: "microsoft.com",
    "microsoft 365": "microsoft.com",
    apple: "apple.com",
    itunes: "apple.com",
    "app store": "apple.com",
    "google play": "play.google.com",
    psn: "playstation.com",
  };
  const k = name.trim().toLowerCase();
  let domain = map[k];
  if (!domain) {
    for (const key of Object.keys(map)) {
      if (k.includes(key)) { domain = map[key]; break; }
    }
  }
  if (!domain) domain = `${k.replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")}.com`;
  return `https://logo.clearbit.com/${domain}`;
}

export function ProductBanner({
  product,
  className = "",
  ratio = "5/4",
  spheres = 5,
}: {
  product: Product;
  className?: string;
  ratio?: "5/4" | "4/3" | "1/1" | "16/9";
  spheres?: number;
}) {
  const seed = hash(product.slug);
  const blobs = useMemo(() => {
    return Array.from({ length: spheres }).map((_, i) => {
      const r = (seed >> (i * 3)) ^ (i * 9301 + 49297);
      const size = 18 + ((r >> 1) % 28); // % of width
      const top = ((r >> 5) % 100);
      const left = ((r >> 11) % 100);
      const grad = SPHERE_GRADIENTS[(r >> 17) % SPHERE_GRADIENTS.length];
      const blur = i % 2 === 0 ? 0 : 4 + ((r >> 21) % 8);
      return { size, top, left, grad, blur, key: `${product.slug}-${i}` };
    });
  }, [seed, spheres, product.slug]);

  const [imgFailed, setImgFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const primary = product.imageUrl;
  const fallbackLogo = guessLogoUrl(product.name);

  const aspectClass =
    ratio === "4/3" ? "aspect-[4/3]" :
    ratio === "1/1" ? "aspect-square" :
    ratio === "16/9" ? "aspect-[16/9]" :
    "aspect-[5/4]";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${aspectClass} ${className}`}
      style={{
        background: "linear-gradient(135deg, #e6ecf5 0%, #d8e1ee 50%, #e9e1f2 100%)",
      }}
    >
      {/* Soft bokeh */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute top-[8%] right-[12%] w-3 h-3 rounded-full bg-white/70 blur-[1px]" />
        <div className="absolute top-[20%] left-[10%] w-2 h-2 rounded-full bg-white/60 blur-[1px]" />
        <div className="absolute bottom-[18%] right-[28%] w-4 h-4 rounded-full bg-white/55 blur-[2px]" />
        <div className="absolute bottom-[8%] left-[35%] w-2.5 h-2.5 rounded-full bg-white/65 blur-[1px]" />
      </div>

      {/* Decorative spheres around the glass plate */}
      {blobs.map((b) => (
        <div
          key={b.key}
          className="absolute rounded-full"
          style={{
            width: `${b.size}%`,
            aspectRatio: "1 / 1",
            top: `${b.top}%`,
            left: `${b.left}%`,
            transform: "translate(-50%, -50%)",
            background: b.grad,
            filter: b.blur ? `blur(${b.blur}px)` : undefined,
            boxShadow: "0 18px 40px -12px rgba(76, 29, 149, 0.35)",
          }}
        />
      ))}

      {/* Frosted glass plate (the product banner surface) */}
      <div
        className="absolute inset-[10%] rounded-[22px] flex items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.42), rgba(255,255,255,0.22))",
          backdropFilter: "blur(18px) saturate(160%)",
          WebkitBackdropFilter: "blur(18px) saturate(160%)",
          border: "1px solid rgba(255,255,255,0.85)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.9), 0 12px 32px -12px rgba(60,60,120,0.25)",
        }}
      >
        {/* Product image / logo */}
        {primary && !imgFailed ? (
          <img
            src={primary}
            alt={product.name}
            loading="lazy"
            className="relative z-10 max-h-[75%] max-w-[80%] object-contain drop-shadow-[0_10px_24px_rgba(40,30,90,0.28)]"
            onError={() => setImgFailed(true)}
          />
        ) : !logoFailed ? (
          <img
            src={fallbackLogo}
            alt={product.name}
            loading="lazy"
            className="relative z-10 max-h-[70%] max-w-[75%] object-contain drop-shadow-[0_10px_24px_rgba(40,30,90,0.28)]"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span className="relative z-10 text-7xl drop-shadow-[0_8px_18px_rgba(40,30,90,0.3)]">
            {product.emoji}
          </span>
        )}

        {/* Subtle highlight sweep */}
        <div className="pointer-events-none absolute -top-1/2 -left-1/3 h-[200%] w-[40%] rotate-12 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      </div>
    </div>
  );
}

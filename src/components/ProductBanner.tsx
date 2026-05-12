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
  "radial-gradient(circle at 30% 30%, #67e8f9 0%, #2563EB 55%, #071120 100%)",
  "radial-gradient(circle at 30% 30%, #a78bfa 0%, #7C3AED 50%, #1e1b4b 100%)",
  "radial-gradient(circle at 30% 30%, #00E5FF 0%, #0891b2 55%, #082f49 100%)",
  "radial-gradient(circle at 30% 30%, #818cf8 0%, #4f46e5 55%, #1e1b4b 100%)",
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
  return domain;
}

/** Multiple logo CDN sources for reliable fallback */
function logoSources(name: string): string[] {
  const domain = guessLogoUrl(name);
  if (domain === "openai.com") {
    return [
      "/images/chatgpt-logo.webp",
      `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    ];
  }
  return [
    `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://logo.clearbit.com/${domain}`,
    `https://icon.horse/icon/${domain}`,
  ];
}

export function ProductBanner({
  product,
  className = "",
  ratio = "5/4",
  spheres = 5,
  priority = false,
}: {
  product: Product;
  className?: string;
  ratio?: "5/4" | "4/3" | "1/1" | "16/9";
  spheres?: number;
  /** First-fold images: load eagerly with high fetch priority */
  priority?: boolean;
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
  const [logoIdx, setLogoIdx] = useState(0);
  const primary = product.imageUrl;
  const logos = useMemo(() => logoSources(product.name), [product.name]);
  const currentLogo = logos[logoIdx];
  const allLogosFailed = logoIdx >= logos.length;

  const aspectClass =
    ratio === "4/3" ? "aspect-[4/3]" :
    ratio === "1/1" ? "aspect-square" :
    ratio === "16/9" ? "aspect-[16/9]" :
    "aspect-[5/4]";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${aspectClass} ${className}`}
      style={{
        background:
          "radial-gradient(ellipse 80% 70% at 30% 20%, rgba(37,99,235,0.35), transparent 70%), linear-gradient(135deg, #071120 0%, #0f1d3a 55%, #1a1144 100%)",
      }}
    >
      {/* Soft static glow — no animation, no jitter */}
      <div
        className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-40"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.55), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-10 w-44 h-44 rounded-full opacity-35"
        style={{ background: "radial-gradient(circle, rgba(0,229,255,0.45), transparent 70%)" }}
      />

      {/* Frosted glass plate — solid layer, no backdrop-filter (perf) */}
      <div
        className="absolute inset-[10%] rounded-[22px] flex items-center justify-center overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))",
          border: "1px solid rgba(255,255,255,0.16)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.18), 0 12px 32px -12px rgba(0,0,0,0.5)",
        }}
      >
        {/* Product image / logo */}
        {primary && !imgFailed ? (
          <img
            src={primary}
            alt={product.name}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            // @ts-expect-error - valid HTML attr, React types lag
            fetchpriority={priority ? "high" : "low"}
            width={480}
            height={384}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            className="relative z-10 max-h-[75%] max-w-[80%] object-contain drop-shadow-[0_10px_24px_rgba(0,229,255,0.35)]"
            onError={() => setImgFailed(true)}
          />
        ) : !allLogosFailed ? (
          <img
            key={currentLogo}
            src={currentLogo}
            alt={product.name}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            // @ts-expect-error - valid HTML attr, React types lag
            fetchpriority={priority ? "high" : "low"}
            width={256}
            height={256}
            className="relative z-10 max-h-[70%] max-w-[75%] object-contain drop-shadow-[0_10px_24px_rgba(0,229,255,0.35)]"
            onError={() => setLogoIdx((i) => i + 1)}
          />
        ) : (
          <span className="relative z-10 text-7xl drop-shadow-[0_8px_18px_rgba(0,229,255,0.4)]">
            {product.emoji}
          </span>
        )}

        {/* Subtle highlight sweep */}
        <div className="pointer-events-none absolute -top-1/2 -left-1/3 h-[200%] w-[40%] rotate-12 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>
    </div>
  );
}

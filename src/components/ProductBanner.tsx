import { useState } from "react";
import type { Product } from "@/data/products";

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
    "sony liv": "sonyliv.com",
    sonyliv: "sonyliv.com",
    crunchyroll: "crunchyroll.com",
    "chatgpt plus": "openai.com",
    chatgpt: "openai.com",
    openai: "openai.com",
    claude: "claude.ai",
    gemini: "gemini.google.com",
    perplexity: "perplexity.ai",
    quillbot: "quillbot.com",
    grammarly: "grammarly.com",
    duolingo: "duolingo.com",
    vidiq: "vidiq.com",
    coursera: "coursera.org",
    "google one": "one.google.com",
    "google drive": "drive.google.com",
    "canva pro": "canva.com",
    canva: "canva.com",
    capcut: "capcut.com",
    adobe: "adobe.com",
    "adobe cc": "adobe.com",
    "adobe creative": "adobe.com",
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
    "windows 10": "microsoft.com",
    "windows 11": "microsoft.com",
    "microsoft office": "microsoft.com",
    office: "microsoft.com",
    "microsoft 365": "microsoft.com",
    apple: "apple.com",
    itunes: "apple.com",
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

const RXB_TINTS = [
  "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3730a3 100%)", // blue
  "linear-gradient(135deg, #831843 0%, #be185d 50%, #db2777 100%)", // pink
  "linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)", // green
  "linear-gradient(135deg, #422006 0%, #7c2d12 50%, #c2410c 100%)", // orange
  "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)", // indigo
  "linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #b91c1c 100%)", // red
];

function tintFor(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return RXB_TINTS[h % RXB_TINTS.length];
}

export function ProductBanner({
  product,
  className = "",
  ratio = "1/1",
}: {
  product: Product;
  className?: string;
  ratio?: "5/4" | "4/3" | "1/1" | "16/9";
  spheres?: number;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const primary = product.imageUrl;
  const fallbackLogo = guessLogoUrl(product.name);
  const tint = tintFor(product.slug);

  const aspectClass =
    ratio === "4/3" ? "aspect-[4/3]" :
    ratio === "5/4" ? "aspect-[5/4]" :
    ratio === "16/9" ? "aspect-[16/9]" :
    "aspect-square";

  // If product has its own banner image, just show it full-bleed (matches screenshots)
  if (primary && !imgFailed) {
    return (
      <div className={`relative overflow-hidden ${aspectClass} ${className}`} style={{ background: tint }}>
        <img
          src={primary}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
        {/* 24/7 service ribbon (top-right, matches screenshot crown-style badge area) */}
        <span className="absolute top-2 right-2 z-10 grid place-items-center w-9 h-9 rounded-full bg-white/95 text-[8px] font-extrabold text-foreground shadow-md text-center leading-tight">
          24<span className="text-[6px]">/7</span>
        </span>
      </div>
    );
  }

  // Fallback: tinted gradient with brand logo
  return (
    <div className={`relative overflow-hidden ${aspectClass} ${className}`} style={{ background: tint }}>
      {/* RXB watermark top-left */}
      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/30 backdrop-blur-sm text-white text-[8px] font-black tracking-wider">
        RXB <span className="text-primary">PREMIUM STORE</span>
      </div>
      <span className="absolute top-2 right-2 z-10 grid place-items-center w-9 h-9 rounded-full bg-white/95 text-[8px] font-extrabold text-foreground shadow-md text-center leading-tight">
        24<span className="text-[6px]">/7</span>
      </span>

      {/* Center brand: rounded square tile with logo */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative w-[55%] aspect-square rounded-[28%] bg-white grid place-items-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
          {/* Crown */}
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-3xl drop-shadow-md select-none">👑</span>
          {!logoFailed ? (
            <img
              src={fallbackLogo}
              alt={product.name}
              loading="lazy"
              className="w-[60%] h-[60%] object-contain"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span className="text-5xl">{product.emoji}</span>
          )}
        </div>
      </div>

      {/* Product name script overlay */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 text-center text-white pointer-events-none">
        <div className="font-black text-[15px] tracking-wider uppercase drop-shadow-lg leading-none">{product.name.split(" ")[0]}</div>
        <div className="italic text-[13px] font-semibold opacity-90 drop-shadow-md" style={{ fontFamily: "'Brush Script MT', cursive" }}>
          {product.name.split(" ").slice(1).join(" ") || "Premium"}
        </div>
      </div>

      {/* Bottom contact strip */}
      <div className="absolute bottom-0 inset-x-0 px-2 py-1 flex items-center justify-between text-white/80 text-[7px] font-semibold">
        <span>📞 01321109245</span>
        <span>rxbpremiumstorebd.com</span>
      </div>
    </div>
  );
}

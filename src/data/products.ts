export type Product = {
  slug: string;
  name: string;
  emoji: string;
  gradient: string;
  category: string;
  badge: string;
  badgeColor: string;
  tagline: string;
  description: string;
  deliveryTime: string;
  warranty: string;
  features: string[];
  plans: { period: string; price: string; original?: string; popular?: boolean }[];
};

export const products: Product[] = [
  {
    slug: "netflix-premium",
    name: "Netflix Premium",
    emoji: "🎬",
    gradient: "from-red-500/20 to-red-700/30",
    category: "Streaming",
    badge: "Popular",
    badgeColor: "bg-[var(--color-orange)]",
    tagline: "Unlimited movies, TV shows and more in 4K Ultra HD.",
    description:
      "Get instant access to a Netflix Premium account with 4K UHD streaming, watch on 4 devices simultaneously, and download for offline viewing. All accounts come with a 7-day warranty.",
    deliveryTime: "5-15 minutes",
    warranty: "7 days replacement",
    features: [
      "4K Ultra HD streaming",
      "Watch on 4 screens at once",
      "Download on 6 devices",
      "Ad-free experience",
      "Access to all Netflix Originals",
      "Works on TV, mobile, laptop & tablet",
    ],
    plans: [
      { period: "1 Month", price: "৳450", original: "৳650" },
      { period: "3 Months", price: "৳1,250", original: "৳1,950", popular: true },
      { period: "6 Months", price: "৳2,400", original: "৳3,900" },
    ],
  },
  {
    slug: "chatgpt-plus",
    name: "ChatGPT Plus",
    emoji: "🤖",
    gradient: "from-emerald-500/20 to-teal-700/30",
    category: "AI Tools",
    badge: "Hot",
    badgeColor: "bg-[var(--color-teal)] text-black",
    tagline: "Access GPT-4, faster responses, and priority during peak times.",
    description:
      "Boost your productivity with ChatGPT Plus. Use the latest GPT-4 model, generate images with DALL·E, and access advanced data analysis — all on your own personal account.",
    deliveryTime: "10-30 minutes",
    warranty: "30 days replacement",
    features: [
      "Access to GPT-4 & GPT-4o",
      "DALL·E image generation",
      "Advanced Data Analysis",
      "Priority access during peak hours",
      "Faster response speeds",
      "Personal account included",
    ],
    plans: [
      { period: "1 Month", price: "৳1,800", original: "৳2,500", popular: true },
      { period: "3 Months", price: "৳5,000", original: "৳7,500" },
      { period: "6 Months", price: "৳9,500", original: "৳15,000" },
    ],
  },
  {
    slug: "spotify-premium",
    name: "Spotify Premium",
    emoji: "🎵",
    gradient: "from-green-500/20 to-green-700/30",
    category: "Music",
    badge: "Best Deal",
    badgeColor: "bg-primary",
    tagline: "Ad-free music, offline listening, unlimited skips.",
    description:
      "Enjoy 100M+ songs and 5M+ podcasts without ads. Download to listen offline, play any song on demand, and get high-quality audio.",
    deliveryTime: "5-10 minutes",
    warranty: "30 days replacement",
    features: [
      "Ad-free music listening",
      "Download up to 10,000 songs",
      "Play any song on demand",
      "High-quality audio",
      "Unlimited skips",
      "Works on all devices",
    ],
    plans: [
      { period: "1 Month", price: "৳250", original: "৳400" },
      { period: "3 Months", price: "৳700", original: "৳1,200", popular: true },
      { period: "12 Months", price: "৳2,400", original: "৳4,800" },
    ],
  },
  {
    slug: "canva-pro",
    name: "Canva Pro",
    emoji: "🎨",
    gradient: "from-blue-400/20 to-purple-600/30",
    category: "Design",
    badge: "New",
    badgeColor: "bg-[var(--color-warning)] text-black",
    tagline: "Professional design tools with 100M+ premium assets.",
    description:
      "Create stunning designs with Canva Pro. Access premium templates, photos, videos, and the magic resize feature. Perfect for social media, presentations, and marketing.",
    deliveryTime: "5-15 minutes",
    warranty: "30 days replacement",
    features: [
      "100M+ premium photos & videos",
      "610,000+ premium templates",
      "Background remover",
      "Magic resize",
      "Brand kit",
      "100GB cloud storage",
    ],
    plans: [
      { period: "1 Month", price: "৳350", original: "৳500" },
      { period: "6 Months", price: "৳1,800", original: "৳3,000", popular: true },
      { period: "12 Months", price: "৳3,200", original: "৳6,000" },
    ],
  },
  {
    slug: "youtube-premium",
    name: "YouTube Premium",
    emoji: "▶️",
    gradient: "from-red-400/20 to-red-600/30",
    category: "Streaming",
    badge: "Popular",
    badgeColor: "bg-[var(--color-orange)]",
    tagline: "Ad-free YouTube, background play, and YouTube Music.",
    description:
      "Watch YouTube without ads, play videos in the background, download for offline viewing, and get YouTube Music Premium included.",
    deliveryTime: "5-15 minutes",
    warranty: "30 days replacement",
    features: [
      "Ad-free YouTube videos",
      "Background play",
      "Offline downloads",
      "YouTube Music Premium included",
      "Picture-in-picture mode",
      "Works on all devices",
    ],
    plans: [
      { period: "1 Month", price: "৳300", original: "৳450" },
      { period: "3 Months", price: "৳850", original: "৳1,350", popular: true },
      { period: "12 Months", price: "৳3,000", original: "৳5,400" },
    ],
  },
  {
    slug: "linkedin-premium",
    name: "LinkedIn Premium",
    emoji: "💼",
    gradient: "from-blue-500/20 to-blue-800/30",
    category: "Productivity",
    badge: "Pro",
    badgeColor: "bg-[var(--color-cyan-deep)]",
    tagline: "Stand out, get hired, and grow your career faster.",
    description:
      "See who viewed your profile, send InMail to anyone on LinkedIn, access LinkedIn Learning courses, and get insights to land your dream job.",
    deliveryTime: "30-60 minutes",
    warranty: "30 days replacement",
    features: [
      "See who viewed your profile",
      "InMail messages",
      "LinkedIn Learning courses",
      "Applicant insights",
      "Featured applicant badge",
      "Career insights",
    ],
    plans: [
      { period: "1 Month", price: "৳1,200", original: "৳1,800", popular: true },
      { period: "3 Months", price: "৳3,400", original: "৳5,400" },
      { period: "6 Months", price: "৳6,500", original: "৳10,800" },
    ],
  },
  {
    slug: "disney-hotstar",
    name: "Disney+ Hotstar",
    emoji: "✨",
    gradient: "from-indigo-500/20 to-purple-700/30",
    category: "Streaming",
    badge: "Trending",
    badgeColor: "bg-primary",
    tagline: "Disney, Marvel, Star Wars, sports and more in one app.",
    description:
      "Stream blockbuster movies, exclusive Disney+ originals, live sports, and the entire Marvel and Star Wars catalog in HD quality.",
    deliveryTime: "10-30 minutes",
    warranty: "7 days replacement",
    features: [
      "Disney+ Originals",
      "Marvel & Star Wars catalog",
      "Live sports streaming",
      "HD quality video",
      "Watch on multiple devices",
      "Family-friendly content",
    ],
    plans: [
      { period: "1 Month", price: "৳400", original: "৳600" },
      { period: "3 Months", price: "৳1,100", original: "৳1,800", popular: true },
      { period: "12 Months", price: "৳3,800", original: "৳7,200" },
    ],
  },
  {
    slug: "adobe-creative",
    name: "Adobe Creative Cloud",
    emoji: "🎭",
    gradient: "from-pink-500/20 to-red-700/30",
    category: "Design",
    badge: "Premium",
    badgeColor: "bg-[var(--color-cyan-deep)]",
    tagline: "All Adobe apps — Photoshop, Illustrator, Premiere & more.",
    description:
      "Get the full Adobe Creative Cloud suite including Photoshop, Illustrator, Premiere Pro, After Effects, Lightroom, and 20+ other professional creative apps.",
    deliveryTime: "1-2 hours",
    warranty: "30 days replacement",
    features: [
      "Photoshop & Illustrator",
      "Premiere Pro & After Effects",
      "Lightroom & InDesign",
      "100GB cloud storage",
      "Adobe Fonts library",
      "20+ creative desktop apps",
    ],
    plans: [
      { period: "1 Month", price: "৳2,500", original: "৳4,500" },
      { period: "3 Months", price: "৳7,000", original: "৳13,500", popular: true },
      { period: "12 Months", price: "৳25,000", original: "৳54,000" },
    ],
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

import { useEffect } from "react";
import { installErrorLogger } from "@/lib/error-logger";
import { startScrollPerfMonitor } from "@/lib/scrollPerfMonitor";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ShopConfigProvider } from "@/context/ShopConfigContext";
import { SupportWidget } from "@/components/SupportWidget";
import { SiteHeader } from "@/components/SiteHeader";
import { WelcomePopup } from "@/components/WelcomePopup";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">404 Error</p>
        <h1 className="mt-3 text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">পেজটি খুঁজে পাওয়া যায়নি</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          আপনি যে পেজটি খুঁজছেন সেটি নেই, সরিয়ে ফেলা হয়েছে অথবা URL ভুল হতে পারে।
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            হোমে ফিরে যান
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            প্রোডাক্ট দেখুন
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AccessNow BD | Trusted Digital Services in Bangladesh" },
      { name: "description", content: "AccessNow BD provides digital products, premium subscriptions, hosting, software, and IT services with fast support and secure access across Bangladesh." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "AccessNow BD | Trusted Digital Services in Bangladesh" },
      { property: "og:description", content: "AccessNow BD provides digital products, premium subscriptions, hosting, software, and IT services with fast support and secure access across Bangladesh." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "AccessNow BD | Trusted Digital Services in Bangladesh" },
      { name: "twitter:description", content: "AccessNow BD provides digital products, premium subscriptions, hosting, software, and IT services with fast support and secure access across Bangladesh." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2f6fecb7-74d2-4d83-bc33-a69e2c1020fa/id-preview-3b7793d1--4e9c9e20-27d9-4789-abed-a88ebc4d1cc3.lovable.app-1778524395020.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2f6fecb7-74d2-4d83-bc33-a69e2c1020fa/id-preview-3b7793d1--4e9c9e20-27d9-4789-abed-a88ebc4d1cc3.lovable.app-1778524395020.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "shortcut icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="theme-white" data-theme="white">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    installErrorLogger();
    const stopPerf = startScrollPerfMonitor();
    return () => stopPerf();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ShopConfigProvider>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
              >
                মূল কন্টেন্টে যান
              </a>
              {!isAdmin && <SiteHeader />}
              <main id="main-content">
                <Outlet />
              </main>
              {!isAdmin && <SupportWidget />}
              {!isAdmin && <WelcomePopup />}
            </ShopConfigProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

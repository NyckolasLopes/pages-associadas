import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useCart, useGeoCep } from "../stores/cart";
import { useAuth } from "@/stores/auth";
import { useAdminProducts } from "@/stores/products";
import { useAdmin } from "../stores/admin";
import { useLive } from "../stores/live";
import { useOrders } from "../stores/orders";
import { useAdminCategories } from "../stores/categories";
import { useConfig } from "../stores/config";
import { Toaster } from "@/components/ui/sonner";

import { InstallPrompt } from "@/components/storefront/InstallPrompt";
import { FloatingElements } from "@/components/storefront/BackToTop";
import { PriceDropTracker } from "@/components/storefront/PriceDropTracker";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-2xl text-center w-full px-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end.
        </p>
        <div className="mt-4 p-4 bg-red-50 text-red-900 border border-red-200 rounded text-left overflow-auto text-xs font-mono w-full">
          <strong>Error:</strong> {error?.message}
          <br /><br />
          <strong>Stack:</strong>
          <pre className="whitespace-pre-wrap">{error?.stack}</pre>
        </div>
        <div className="mt-4 p-4 text-xs text-left text-red-500 bg-red-50 rounded overflow-auto border border-red-200 max-h-[300px]">
          <strong>{error.name}:</strong> {error.message}
          <br/><br/>
          <pre>{error.stack}</pre>
        </div>
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
  head: () => {
    const dadosLoja = useConfig.getState().dadosLoja;
    const title = dadosLoja?.nomeLoja || "Farmácias Associadas | Muito mais farmácia";
    const description = dadosLoja?.descricao || "Medicamentos, dermocosméticos, vitaminas e cuidado para toda a família, com entrega rápida e farmacêutico responsável. Aqui você tem amigos.";

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: title },
        {
          name: "description",
          content: description,
        },
        { name: "theme-color", content: "#00B5AD" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;500;700;900&display=swap",
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
    };
  },

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
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
  const { customCss, customHtml, customJs, themeColors } = useAdmin();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const redirects = useConfig((s) => s.redirects);
  const scripts = useConfig((s) => s.scripts);

  useEffect(() => {
    // Check for 301 redirects
    const path = location.pathname;
    const match = redirects?.find(r => r.de === path || r.de === path + "/");
    if (match) {
      if (match.para.startsWith("http")) {
        window.location.replace(match.para);
      } else {
        window.location.replace(window.location.origin + match.para);
      }
    }
  }, [location.pathname, redirects]);

  useEffect(() => {
    useCart.persist.rehydrate();
    useGeoCep.persist.rehydrate();
    useAdmin.persist.rehydrate();
    useAdminProducts.persist.rehydrate();
    useAdminCategories.persist.rehydrate();
    useLive.persist.rehydrate();
    useOrders.persist.rehydrate();
    
    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.log('SW registration failed:', err));
    }
  }, []);

  useEffect(() => {
    // Gerar ID de sessão único para esta aba
    const sessionId = Math.random().toString(36).substring(2, 9);
    
    // Ping inicial
    useLive.getState().pingSession(sessionId);
    
    // Manter a sessão viva com heartbeat eficiente (20s e somente se a aba estiver visível)
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        useLive.getState().pingSession(sessionId);
      }
    }, 20000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        useLive.getState().pingSession(sessionId);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Ao fechar a aba
    const handleBeforeUnload = () => {
      useLive.getState().removeSession(sessionId);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      useLive.getState().removeSession(sessionId);
    };
  }, []);

  useEffect(() => {
    // Atualização Automática Silenciosa: se o chunk falhar (ex: deploy ocorreu enquanto usuário navegava)
    const handleDynamicImportError = (e: any) => {
      if (e.reason?.message?.includes("Failed to fetch dynamically imported module")) {
        e.preventDefault();
        window.location.reload();
      }
    };
    window.addEventListener("unhandledrejection", handleDynamicImportError);
    window.addEventListener("vite:preloadError", () => window.location.reload());

    if (!customJs) {
      return () => {
        window.removeEventListener("unhandledrejection", handleDynamicImportError);
      };
    }
    
    const script = document.createElement("script");
    script.text = customJs;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
      window.removeEventListener("unhandledrejection", handleDynamicImportError);
    };
  }, [customJs]);

  useEffect(() => {
    if (!scripts) return;

    const injectedNodes: Node[] = [];

    const injectHtml = (html: string, target: HTMLElement) => {
      if (!html) return;
      const template = document.createElement('template');
      template.innerHTML = html.trim();
      
      Array.from(template.content.childNodes).forEach(node => {
        if (node.nodeName.toLowerCase() === 'script') {
          const newScript = document.createElement('script');
          Array.from((node as HTMLScriptElement).attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          newScript.text = (node as HTMLScriptElement).text;
          target.appendChild(newScript);
          injectedNodes.push(newScript);
        } else {
          const clonedNode = node.cloneNode(true);
          target.appendChild(clonedNode);
          injectedNodes.push(clonedNode);
        }
      });
    };

    injectHtml(scripts.head, document.head);
    injectHtml(scripts.body, document.body);

    return () => {
      injectedNodes.forEach(node => {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });
    };
  }, [scripts?.head, scripts?.body]);

  return (
    <QueryClientProvider client={queryClient}>
      {themeColors && Object.keys(themeColors).length > 0 && (
        <style dangerouslySetInnerHTML={{ __html: `:root { ${Object.entries(themeColors).map(([k, v]) => `${k}: ${v};`).join(' ')} }` }} />
      )}
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      {customHtml && <div dangerouslySetInnerHTML={{ __html: customHtml }} />}
      <Outlet />

      <PriceDropTracker />
      {!isAdmin && <FloatingElements />}
      <InstallPrompt />
      <Toaster 
        position="top-center" 
        toastOptions={{
          className: "w-auto min-w-[300px] max-w-sm whitespace-normal break-words"
        }} 
      />
    </QueryClientProvider>
  );
}

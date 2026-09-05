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
import { useCartSync } from "@/hooks/useCartSync";
import { useActivePharmacy } from "@/hooks/useActivePharmacy";
import { useAdminProducts } from "@/stores/products";
import { useAdmin } from "../stores/admin";
import { useLive } from "../stores/live";
import { useOrders } from "../stores/orders";
import { useAdminCategories } from "../stores/categories";
import { useMarcasStore } from "../stores/marcas";
import { useConfig } from "../stores/config";
import { useMarketing } from "../stores/marketing";
import { Toaster } from "@/components/ui/sonner";

import { InstallPrompt } from "@/components/storefront/InstallPrompt";
import { FloatingElements } from "@/components/storefront/BackToTop";
import { PriceDropTracker } from "@/components/storefront/PriceDropTracker";
import { AddToCartNotification } from "@/components/storefront/AddToCartNotification";

import { ErrorComponent as CustomErrorComponent } from "@/components/ErrorComponent";
import { getSafeMediaUrl } from "@/utils/media";
import { NotFound } from "@/components/storefront/NotFound";

export function NotFoundComponent() {
  return <NotFound type="page" />;
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const isChunkError = Boolean(
    error?.message && (
      error.message.includes("dynamically imported module") ||
      error.message.includes("Importing a module script failed") ||
      error.message.includes("Loading chunk") ||
      error.message.includes("Failed to fetch")
    )
  );

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });

    if (isChunkError && typeof window !== "undefined") {
      const now = Date.now();
      const lastReload = parseInt(sessionStorage.getItem("last_chunk_reload") || "0", 10);
      if (now - lastReload > 3000) {
        sessionStorage.setItem("last_chunk_reload", now.toString());
        window.location.reload();
      }
    }
  }, [error, isChunkError]);

  const handleRetry = () => {
    if (isChunkError && typeof window !== "undefined") {
      window.location.reload();
    } else {
      router.invalidate();
      reset();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center w-full px-6 py-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <img src="/icone-associadas.png" alt="Farmácias Associadas" className="w-8 h-8 animate-spin object-contain" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {isChunkError ? "Nova Versão do Sistema Disponível" : "Ocorreu um problema ao carregar a página"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isChunkError 
            ? "Uma nova versão com melhorias e atualizações foi disponibilizada. Estamos atualizando sua tela..."
            : "Ocorreu um problema e a página parou de responder. O seu acesso não foi perdido."}
        </p>
        {!isChunkError && (
          <div className="mt-4 p-4 bg-red-50 text-red-900 border border-red-200 rounded text-left overflow-auto text-xs font-mono w-full">
            <strong>Erro:</strong> {error?.message}
            <br /><br />
            <strong>Detalhes:</strong>
            <pre className="whitespace-pre-wrap">{error?.stack}</pre>
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={handleRetry}
            className="inline-flex items-center justify-center rounded-lg bg-[#00B5AD] text-white px-5 py-2.5 text-sm font-bold shadow-sm transition-colors hover:bg-[#009b94]"
          >
            {isChunkError ? "Atualizar Agora" : "Tentar novamente"}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => {
    const dadosLoja = useConfig.getState().dadosLoja;
    const fallbackTitle = dadosLoja?.nomeLoja || "Farmácias Associadas | Muito mais farmácia";
    const isParceiro = (dadosLoja as any)?.categoriaAssociado === 'Parceiro';
    const title = isParceiro ? (dadosLoja?.nomeLoja || dadosLoja?.razaoSocial || "Loja Parceira") : fallbackTitle;
    const description = dadosLoja?.descricao || "Medicamentos, dermocosméticos, vitaminas e cuidado para toda a família, com entrega rápida e farmacêutico responsável. Aqui você tem amigos.";

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          httpEquiv: "Content-Security-Policy",
          content: "default-src 'self' http://20.7.19.49:3006 ws://20.7.19.49:3006 https: http:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://* http://* http://20.7.19.49:3006; style-src 'self' 'unsafe-inline' https://* http://* https://fonts.googleapis.com; img-src 'self' data: blob: https://* http://* http://20.7.19.49:3006; font-src 'self' data: https://* http://* https://fonts.gstatic.com; connect-src 'self' http://20.7.19.49:3006 ws://20.7.19.49:3006 http://20.7.19.49:* ws://20.7.19.49:* https://* http://* wss://* ws://* https: http: ws: wss:; frame-src 'self' https://* http://* http://20.7.19.49:3006; manifest-src 'self' blob: data:;",
        },
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
        { rel: "icon", href: "/favicon.png", type: "image/png" },
        { rel: "shortcut icon", href: "/favicon.png", type: "image/png" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;500;700;900&display=swap",
        },
        { rel: "manifest", href: "/manifest.json" },
      ],
      scripts: [
        {
          children: `
            window.deferredPWAInstallPrompt = null;
            window.addEventListener('beforeinstallprompt', function(e) {
              e.preventDefault();
              window.deferredPWAInstallPrompt = e;
            });
          `,
        },
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
    <html lang="pt-BR" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { customCss, customHtml, customJs, themeColors, activeStoreId, pharmacies } = useAdmin();
  const currentPharmacy = pharmacies.find((p) => p.id === activeStoreId);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const redirects = useConfig((s) => s.redirects);
  const scripts = useConfig((s) => s.scripts);
  const activePharmacy = useActivePharmacy();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sincroniza carrinhos abandonados
  useCartSync();

  // Injeção de Cores Customizadas (Design System Dinâmico)
  useEffect(() => {
    let colorsToInject: any = null;
    
    if (isAdmin) {
      colorsToInject = themeColors;
    } else if (activePharmacy?.themeColors && Object.keys(activePharmacy.themeColors).length > 0) {
      colorsToInject = activePharmacy.themeColors;
    }

    const styleId = 'fa-dynamic-theme-style';
    let style = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!colorsToInject || Object.keys(colorsToInject).length === 0) {
      if (style) style.remove();
      return;
    }

    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    let cssString = ':root {\n';
    Object.entries(colorsToInject).forEach(([key, value]) => {
      if (value) {
        const cssKey = key.startsWith('--') ? key : `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        cssString += `  ${cssKey}: ${value};\n`;
      }
    });
    cssString += '}\n';

    if (style.textContent !== cssString) {
      style.textContent = cssString;
    }
  }, [isAdmin, themeColors, activePharmacy?.categoriaAssociado, JSON.stringify(activePharmacy?.themeColors || {})]);

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
    useAuth.getState()._initListener();
    useCart.persist.rehydrate();
    useGeoCep.persist.rehydrate();
    
    // Security check logic removed per user request (NUNCA DERRUBAR)
    if (!sessionStorage.getItem('fa_admin_session')) {
      sessionStorage.setItem('fa_admin_session', 'true');
    }
    
    useAdmin.persist.rehydrate();
    useAdminProducts.persist.rehydrate();
    useAdminCategories.getState().loadCategories();
    useMarcasStore.getState().loadMarcas();
    // loadPharmacies() é chamado aqui para visitantes da vitrine.
    // admin.tsx também chama — o throttle de 5s em admin.ts garante apenas 1 fetch no boot.
    useAdmin.getState().loadPharmacies();
    useMarketing.getState().loadMarketing();
    
    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.log('SW registration failed:', err));
    }
    
    // Static manifest is loaded via <link rel="manifest"> in head
  }, []);


  useEffect(() => {
    // Gerar ID de sessão único para esta aba
    const sessionId = Math.random().toString(36).substring(2, 9);
    
    const getPingData = () => {
      const isPathAdmin = location.pathname.startsWith("/admin");
      if (!isPathAdmin) return { lojaId: undefined, storeName: undefined };
      
      const { currentUser, pharmacies } = useAdmin.getState();
      const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;
      
      if (!isGlobalAdmin && currentUser?.lojasVinculadas?.length) {
        const storeId = currentUser.lojasVinculadas[0];
        const store = pharmacies.find(p => p.id === storeId);
        return { 
          lojaId: `admin-loja-${storeId}`, 
          storeName: store ? store.nome : undefined 
        };
      }
      return { lojaId: "admin-sede", storeName: undefined };
    };
    // Init Realtime Presence
    const initialPing = getPingData();
    useLive.getState().initPresence(sessionId, initialPing.lojaId);

    return () => {
      useLive.getState().cleanup();
    };
  }, []);

  useEffect(() => {
    // Atualização Automática Silenciosa: se o chunk falhar (ex: deploy ocorreu enquanto usuário navegava)
    const handleDynamicImportError = (e: any) => {
      const msg = e?.reason?.message || e?.message || "";
      if (
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("Importing a module script failed") ||
        msg.includes("Loading chunk") ||
        msg.includes("Failed to fetch")
      ) {
        if (e.preventDefault) e.preventDefault();
        const now = Date.now();
        const lastReload = parseInt(sessionStorage.getItem("last_chunk_reload") || "0", 10);
        if (now - lastReload > 10000) {
          sessionStorage.setItem("last_chunk_reload", now.toString());
          window.location.reload();
        }
      }
    };
    window.addEventListener("unhandledrejection", handleDynamicImportError);
    window.addEventListener("error", handleDynamicImportError);
    window.addEventListener("vite:preloadError", (event: any) => {
      if (event?.preventDefault) event.preventDefault();
      const now = Date.now();
      const lastReload = parseInt(sessionStorage.getItem("last_chunk_reload") || "0", 10);
      if (now - lastReload > 3000) {
        sessionStorage.setItem("last_chunk_reload", now.toString());
        window.location.reload();
      }
    });

    if (!customJs) {
      return () => {
        window.removeEventListener("unhandledrejection", handleDynamicImportError);
        window.removeEventListener("error", handleDynamicImportError);
      };
    }
    
    const script = document.createElement("script");
    script.text = customJs;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
      window.removeEventListener("unhandledrejection", handleDynamicImportError);
      window.removeEventListener("error", handleDynamicImportError);
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
        try {
          if (node.parentNode) {
            node.parentNode.removeChild(node);
          } else if (typeof (node as any).remove === 'function') {
            (node as any).remove();
          }
        } catch {}
      });
    };
  }, [scripts?.head, scripts?.body]);

  // Injeção dinâmica de Pixels e Tracking por loja
  useEffect(() => {
    if (!currentPharmacy) return;

    const injectedNodes: Node[] = [];

    const injectScript = (src?: string, content?: string) => {
      const script = document.createElement('script');
      if (src) script.src = src;
      if (content) script.innerHTML = content;
      script.async = true;
      document.head.appendChild(script);
      injectedNodes.push(script);
    };

    // Google Analytics
    if (currentPharmacy.googleAnalyticsId) {
      injectScript(`https://www.googletagmanager.com/gtag/js?id=${currentPharmacy.googleAnalyticsId}`);
      injectScript(undefined, `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${currentPharmacy.googleAnalyticsId}');
      `);
    }

    // Google Ads
    if (currentPharmacy.googleAdsId) {
      injectScript(`https://www.googletagmanager.com/gtag/js?id=${currentPharmacy.googleAdsId}`);
      injectScript(undefined, `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${currentPharmacy.googleAdsId}');
      `);
    }

    // GTM
    if (currentPharmacy.googleTagManagerId) {
      injectScript(undefined, `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${currentPharmacy.googleTagManagerId}');
      `);
    }

    // Facebook Pixel
    if (currentPharmacy.facebookPixelId) {
      injectScript(undefined, `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${currentPharmacy.facebookPixelId}');
        fbq('track', 'PageView');
      `);
    }

    return () => {
      injectedNodes.forEach(node => {
        try {
          if (node.parentNode) {
            node.parentNode.removeChild(node);
          } else if (typeof (node as any).remove === 'function') {
            (node as any).remove();
          }
        } catch {}
      });
    };
  }, [currentPharmacy]);

  return (
    <QueryClientProvider client={queryClient}>
      {mounted && themeColors && Object.keys(themeColors).length > 0 && (
        <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `:root { ${Object.entries(themeColors).map(([k, v]) => `${k}: ${v};`).join(' ')} }` }} />
      )}
      {mounted && customCss && <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: customCss }} />}
      {mounted && customHtml && <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: customHtml }} />}
      <Outlet />
      <PriceDropTracker />

      {!isAdmin && <FloatingElements />}
      {!isAdmin && <InstallPrompt />}
      <AddToCartNotification />
      <Toaster 
        position="top-center" 
        toastOptions={{
          className: "w-auto min-w-[300px] max-w-sm whitespace-normal break-words"
        }} 
      />
    </QueryClientProvider>
  );
}
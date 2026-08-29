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

import { NotFound } from "@/components/storefront/NotFound";

export function NotFoundComponent() {
  return <NotFound type="page" />;
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
          Página não encontrada
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro ou a página que você tentou acessar não existe.
        </p>
        <div className="mt-4 p-4 bg-red-50 text-red-900 border border-red-200 rounded text-left overflow-auto text-xs font-mono w-full">
          <strong>Erro:</strong> {error?.message}
          <br /><br />
          <strong>Detalhes:</strong>
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
            Tentar novamente
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
    const isParceiro = dadosLoja?.categoriaAssociado === 'Parceiro';
    const title = isParceiro ? (dadosLoja?.nomeDaLoja || dadosLoja?.razaoSocial || "Loja Parceira") : fallbackTitle;
    const description = dadosLoja?.descricao || "Medicamentos, dermocosméticos, vitaminas e cuidado para toda a família, com entrega rápida e farmacêutico responsável. Aqui você tem amigos.";
    const bairro = dadosLoja?.bairro || "Matriz";

    const adminState = useAdmin.getState();
    const pathname = typeof window !== 'undefined' ? window.location.pathname : "/";
    const storeSlug = pathname.split("/")[1];
    
    let currentPharmacy = null;
    if (storeSlug && !['admin', 'auth', 'cart', 'checkout', 'p'].includes(storeSlug)) {
      currentPharmacy = adminState.pharmacies.find(p => (p.slug || "").toLowerCase() === storeSlug.toLowerCase());
    }
    if (!currentPharmacy) {
      currentPharmacy = adminState.pharmacies.find(p => p.id === adminState.activeStoreId);
    }

    const globalLogo = useConfig.getState().logo;
    const themeColor = currentPharmacy?.topBarBgColor || currentPharmacy?.themeColors?.['--primary'] || "#00B5AD";
    const faviconHref = currentPharmacy?.faviconUrl || currentPharmacy?.logoUrl || globalLogo || "/favicon.png";
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          httpEquiv: "Content-Security-Policy",
          content: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://* http://*; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://* wss://*; frame-src 'self' https://*;",
        },
        { title: title },
        {
          name: "description",
          content: description,
        },
        { name: "theme-color", content: themeColor },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: faviconHref, type: "image/png" },
        { rel: "shortcut icon", href: faviconHref, type: "image/png" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;500;700;900&display=swap",
        },
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
        <script dangerouslySetInnerHTML={{ __html: `
          window.deferredPWAInstallPrompt = null;
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.deferredPWAInstallPrompt = e;
          });
        `}} />
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
  const { customCss, customHtml, customJs, themeColors, activeStoreId, pharmacies } = useAdmin();
  const currentPharmacy = pharmacies.find((p) => p.id === activeStoreId);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const redirects = useConfig((s) => s.redirects);
  const scripts = useConfig((s) => s.scripts);
  const activePharmacy = useActivePharmacy();

  // Sincroniza carrinhos abandonados
  useCartSync();

  // Injeção de Cores Customizadas (Design System Dinâmico)
  useEffect(() => {
    let colorsToInject: any = null;
    
    if (isAdmin) {
      colorsToInject = themeColors;
    } else if (activePharmacy?.categoriaAssociado === 'Parceiro' || activePharmacy?.categoriaAssociado === 'Associado') {
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
  }, [isAdmin, themeColors, activePharmacy?.categoriaAssociado, activePharmacy?.themeColors]);

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
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });
    };
  }, [currentPharmacy]);

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
      {!isAdmin && <InstallPrompt />}
      <Toaster 
        position="top-center" 
        toastOptions={{
          className: "w-auto min-w-[300px] max-w-sm whitespace-normal break-words"
        }} 
      />
    </QueryClientProvider>
  );
}
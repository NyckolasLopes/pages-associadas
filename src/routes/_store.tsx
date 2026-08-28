import { createFileRoute, Outlet, useLocation, useRouterState } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { useCart } from "@/stores/cart";
import { useAuth } from "@/stores/auth";
import { useFavorites } from "@/stores/favorites";
import { Header } from "@/components/storefront/Header";
import { Suspense, lazy, useMemo, useEffect, type CSSProperties } from "react";
import { CompleteProfileModal } from "@/components/storefront/CompleteProfileModal";
import { useActivePharmacy, SYSTEM_PAGES, safeSlugify } from "@/hooks/useActivePharmacy";
import { GlobalLoading } from "@/components/ui/global-loading";

const Footer = lazy(() => import("@/components/storefront/Footer").then(m => ({ default: m.Footer })));
const FloatingElements = lazy(() => import("@/components/storefront/BackToTop").then(m => ({ default: m.FloatingElements })));
const CookieBanner = lazy(() => import("@/components/storefront/CookieBanner").then(m => ({ default: m.CookieBanner })));
const GeoPopup = lazy(() => import("@/components/storefront/GeoPopup").then(m => ({ default: m.GeoPopup })));

export const Route = createFileRoute("/_store")({
  component: StoreLayout,
  pendingComponent: GlobalLoading,
});

/** CSS overrides for Parceiro stores – neutral grey/black instead of brand green/orange */
const PARCEIRO_THEME: Record<string, string> = {
  "--primary": "#1a1a1a",
  "--primary-foreground": "#ffffff",
  "--primary-dark": "#000000",
  "--secondary": "#6b7280",
  "--secondary-foreground": "#ffffff",
  "--accent": "#6b7280",
  "--accent-foreground": "#ffffff",
  "--ring": "#a1a1aa",
};

function StoreLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  
  const isNavigatingStore = useRouterState({
    select: (s) => {
      if (s.status !== 'pending') return false;
      const currentSlug = s.location.pathname.split('/')[1];
      const pendingSlug = s.pendingLocation?.pathname.split('/')[1];
      return currentSlug !== pendingSlug && !!pendingSlug && !SYSTEM_PAGES.has(pendingSlug);
    }
  });

  // — Store state (todos os hooks ANTES de qualquer early return) —
  const setSelectedPharmacyId = useCart((s) => s.setSelectedPharmacyId);
  const clearCart = useCart((s) => s.clear);
  const pharmaciesLoaded = useAdmin((s) => s.pharmaciesLoaded);
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const logout = useAuth((s) => s.logout);
  const clearFavorites = useFavorites((s) => s.clearAll);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const potentialSlug = pathParts[0] ?? "";

  const activePharmacy = useActivePharmacy();

  // — Tema CSS da loja (todos os hooks antes do early return) —
  const storeTheme = useMemo(() => {
    if (!activePharmacy) return undefined;

    let themeToApply: Record<string, string | undefined> = {};

    if (activePharmacy.categoriaAssociado === "Parceiro" || activePharmacy.categoriaAssociado === "Associado") {
      themeToApply = { ...PARCEIRO_THEME };
    }

    if (activePharmacy.themeColors) {
      const t = activePharmacy.themeColors as Record<string, any>;
      const primary = t['--primary'] || t.primary;
      const secondary = t['--secondary'] || t.secondary;
      const accent = t['--accent'] || t.accent;
      const headerBg = t['--header-bg'] || t.headerBg;

      const legacyTheme: Record<string, string | undefined> = {
        "--primary": primary,
        "--primary-foreground": "#ffffff",
        "--primary-dark": primary,
        "--secondary": secondary,
        "--secondary-foreground": "#ffffff",
        "--accent": accent,
        "--accent-foreground": "#ffffff",
        "--header-bg": headerBg || primary,
        "--header-icons": t['--header-icons'] || t.headerIcons || "#ffffff",
        "--search-bg": t['--search-bg'] || t.searchBg || "#ffffff",
        "--institutional-bg": t['--institutional-bg'] || t.institutionalBg || "#f97316",
      };

      const cleanLegacyTheme = Object.fromEntries(
        Object.entries(legacyTheme).filter(([_, v]) => v !== undefined)
      );

      const customVars = Object.fromEntries(
        Object.entries(t).filter(([k, v]) => k.startsWith('--') && v)
      );

      themeToApply = { ...themeToApply, ...cleanLegacyTheme, ...customVars };
    }

    return Object.keys(themeToApply).length > 0 ? (themeToApply as CSSProperties) : undefined;
  }, [activePharmacy]);

  // — Efeitos (todos os hooks antes do early return) —
  useEffect(() => {
    if (!activePharmacy) return;

    // Salva o slug da loja para páginas que não têm slug na URL (login, perfil, etc.)
    const isStoreSlugPage = potentialSlug && !SYSTEM_PAGES.has(potentialSlug);
    if (isStoreSlugPage) {
      try {
        const slug = activePharmacy.slug
          ? safeSlugify(activePharmacy.slug)
          : safeSlugify(activePharmacy.nome || activePharmacy.id);
        sessionStorage.setItem('fa-last-store-slug', slug);
      } catch { /* sessionStorage indisponível */ }
    }

    // Sincroniza selectedPharmacyId → cupons e carrinho reconhecem a loja correta
    if (activePharmacy.id !== selectedPharmacyId) {
      if (selectedPharmacyId) {
        logout();
        clearCart();
        clearFavorites();
      }
      setSelectedPharmacyId(activePharmacy.id);
    }
  }, [activePharmacy?.id]);

  useEffect(() => {
    if (!activePharmacy) return;
    
    // Remove existing favicons to force browser to detect the change
    const existingLinks = document.querySelectorAll("link[rel~='icon'], link[rel~='shortcut icon']");
    existingLinks.forEach(l => l.remove());
    
    // Create new favicon link
    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.type = 'image/png';
    
    const globalFavicon = useAdmin.getState().faviconUrl;
    
    if (activePharmacy.faviconUrl) {
      newLink.href = activePharmacy.faviconUrl;
    } else if (activePharmacy.categoriaAssociado === 'Parceiro' || activePharmacy.categoriaAssociado === 'Associado') {
      newLink.href = 'data:,'; // Empty favicon for partners without custom favicon
    } else {
      newLink.href = globalFavicon || '/favicon.png';
    }
    
    document.head.appendChild(newLink);

    // Attempt to update manifest dynamically for PWA install prompt
    let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    
    const isParceiroOrAssociado = activePharmacy.categoriaAssociado === 'Parceiro' || activePharmacy.categoriaAssociado === 'Associado';
    const appName = isParceiroOrAssociado && activePharmacy.nome ? activePharmacy.nome : (activePharmacy.nome || "Farmácias Associadas");
    const manifestIcon = activePharmacy.faviconUrl || (isParceiroOrAssociado ? "data:," : (globalFavicon || "/favicon.png"));
    
    const manifest = {
      name: appName,
      short_name: appName,
      start_url: `/${activePharmacy.slug || ""}`,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#00B5AD",
      icons: [
        {
          src: manifestIcon,
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: manifestIcon,
          sizes: "512x512",
          type: "image/png"
        }
      ]
    };
    
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(manifestBlob);
    manifestLink.href = manifestURL;
    
    return () => {
      URL.revokeObjectURL(manifestURL);
    };
  }, [activePharmacy?.faviconUrl, activePharmacy?.isPleno, activePharmacy?.slug, activePharmacy?.nome, activePharmacy?.categoriaAssociado]);

  // ─── Early returns (APÓS todos os hooks) ───────────────────────────────────

  // ⏳ Aguarda lojas carregarem do Supabase antes de renderizar qualquer coisa.
  // Evita o flash de outra loja enquanto os dados chegam ou ao navegar entre lojas.
  if (!pharmaciesLoaded || isNavigatingStore || !activePharmacy) {
    return <GlobalLoading />;
  }

  if (activePharmacy?.virtualStoreStatus === "Inativa") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Loja Desativada</h1>
          <p className="text-slate-600 mb-6 leading-relaxed">
            ESSA LOJA FOI DESATIVADA, DUVIDAS ENTRE EM CONTATO COM A LOJA <strong className="whitespace-nowrap">{activePharmacy.telefone || activePharmacy.id}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      style={storeTheme}
    >
      {activePharmacy && (
        <>
          <title>{activePharmacy.pageTitle || activePharmacy.nome || (['Parceiro', 'Associado'].includes(activePharmacy.categoriaAssociado || '') ? "Loja Parceira" : "Farmácias Associadas")}</title>
          <meta name="description" content={activePharmacy.metaDescription || "Sua farmácia online de confiança."} />
        </>
      )}

      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Suspense fallback={<div className="h-40" />}>
        <Footer />
      </Suspense>

      <Suspense fallback={null}>
        <FloatingElements />
        <GeoPopup />
        {isHome && <CookieBanner />}
      </Suspense>
      <CompleteProfileModal />
    </div>
  );
}

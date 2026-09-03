import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { useMarketing } from "@/stores/marketing";
import { Header } from "@/components/storefront/Header";
import { Suspense, lazy, useMemo, useEffect, useState, type CSSProperties } from "react";
import { CompleteProfileModal } from "@/components/storefront/CompleteProfileModal";
import { useActivePharmacy, SYSTEM_PAGES, safeSlugify } from "@/hooks/useActivePharmacy";
import { getSafeMediaUrl } from "@/utils/media";
import { useAuth } from "@/stores/auth";
import { NotFound } from "@/components/storefront/NotFound";
import { GlobalLoading } from "@/components/ui/global-loading";

import { resetStoreTheme } from "@/lib/themeUtils";

const Footer = lazy(() => import("@/components/storefront/Footer").then(m => ({ default: m.Footer })));
const FloatingElements = lazy(() => import("@/components/storefront/BackToTop").then(m => ({ default: m.FloatingElements })));
const CookieBanner = lazy(() => import("@/components/storefront/CookieBanner").then(m => ({ default: m.CookieBanner })));
const GeoPopup = lazy(() => import("@/components/storefront/GeoPopup").then(m => ({ default: m.GeoPopup })));

export const Route = createFileRoute("/_store")({
  component: StoreLayout,
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
  "--footer-bg": "#1a1a1a",
  "--footer-text": "#ffffff",
  "--footer-bottom-bg": "#111827",
  "--footer-bottom-text": "#9ca3af",
};

function StoreLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  // — Store state (todos os hooks ANTES de qualquer early return) —
  const pharmacies = useAdmin((s) => s.pharmacies);
  const pharmaciesLoaded = useAdmin((s) => s.pharmaciesLoaded);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const potentialSlug = pathParts[0] ?? "";

  const activePharmacy = useActivePharmacy();

  // — Tema CSS da loja (todos os hooks antes do early return) —
  const themeColorsKey = JSON.stringify(activePharmacy?.themeColors || {});
  const storeTheme = useMemo(() => {
    if (!activePharmacy) return undefined;

    const isParceiro = activePharmacy?.categoriaAssociado === "Parceiro";

    let themeToApply: Record<string, string | undefined> = {};

    if (isParceiro) {
      themeToApply = { 
        ...PARCEIRO_THEME,
        "--coupon-badge-bg": "#1a1a1a",
        "--coupon-badge-text": "#ffffff",
        "--coupon-badge-border": "#1a1a1a",
      };
    } else {
      // Pleno: ícones do cabeçalho em laranja (#f37021) e botão Cesta em branco com borda/texto teal (#00b5ad)
      themeToApply = {
        "--header-icons": "#f37021",
        "--cart-btn-bg": "#ffffff",
        "--cart-btn-text": "#00b5ad",
        "--cart-badge-bg": "#f37021",
        "--cart-badge-text": "#ffffff",
        "--coupon-badge-bg": "#00b5ad",
        "--coupon-badge-text": "#ffffff",
        "--coupon-badge-border": "#00b5ad",
      };
    }

    if (activePharmacy.themeColors) {
      const t = activePharmacy.themeColors as Record<string, any>;
      const primary = t['--primary'] || t.primary;
      const primaryFg = t['--primary-foreground'] || t.primaryForeground || "#ffffff";
      const secondary = t['--secondary'] || t.secondary;
      const secondaryFg = t['--secondary-foreground'] || t.secondaryForeground || "#ffffff";
      const accent = t['--accent'] || t.accent;
      const accentFg = t['--accent-foreground'] || t.accentForeground || "#ffffff";
      const bg = t['--background'] || t.background;
      const fg = t['--foreground'] || t.foreground;
      const headerBg = t['--header-bg'] || t.headerBg;
      const headerIcons = t['--header-icons'] || t.headerIcons;
      const searchBg = t['--search-bg'] || t.searchBg;
      const topbarBg = t['--topbar-bg'] || t.topbarBg;
      const topbarText = t['--topbar-text'] || t.topbarText;
      const menuBg = t['--menu-bg'] || t.menuBg;
      const menuText = t['--menu-text'] || t.menuText;
      const footerBg = t['--footer-bg'] || t.footerBg;
      const footerText = t['--footer-text'] || t.footerText;
      const socialIcons = t['--social-icons'] || t.socialIcons;
      const socialIconsBg = t['--social-icons-bg'] || t.socialIconsBg;
      const institutionalBg = t['--institutional-bg'] || t.institutionalBg;
      const pwaBannerBg = t['--pwa-banner-bg'] || t.pwaBannerBg;
      const pwaBannerText = t['--pwa-banner-text'] || t.pwaBannerText;
      const pwaBannerBtnBg = t['--pwa-banner-btn-bg'] || t.pwaBannerBtnBg;
      const pwaBannerBtnText = t['--pwa-banner-btn-text'] || t.pwaBannerBtnText;

      const legacyTheme: Record<string, string | undefined> = {
        "--primary": primary,
        "--primary-foreground": primaryFg,
        "--primary-dark": primary,
        "--secondary": secondary,
        "--secondary-foreground": secondaryFg,
        "--accent": accent,
        "--accent-foreground": accentFg,
        "--background": bg,
        "--foreground": fg,
        "--header-bg": headerBg || primary,
        "--header-icons": headerIcons || (isParceiro ? "#ffffff" : "#f37021"),
        "--search-bg": searchBg || "#ffffff",
        "--topbar-bg": topbarBg,
        "--topbar-text": topbarText,
        "--menu-bg": menuBg || primary,
        "--menu-text": menuText || "#ffffff",
        "--footer-bg": footerBg || (isParceiro ? (primary || "#1a1a1a") : primary),
        "--footer-text": footerText || "#ffffff",
        "--footer-bottom-bg": t['--footer-bottom-bg'] || t.footerBottomBg || (isParceiro ? "#111827" : "#ffffff"),
        "--footer-bottom-text": t['--footer-bottom-text'] || t.footerBottomText || (isParceiro ? "#9ca3af" : "#1e293b"),
        "--social-icons": socialIcons || primary,
        "--social-icons-bg": socialIconsBg || "#ffffff",
        "--institutional-bg": institutionalBg || "#f97316",
        "--pwa-banner-bg": pwaBannerBg || primary,
        "--pwa-banner-text": pwaBannerText || "#ffffff",
        "--pwa-banner-btn-bg": pwaBannerBtnBg || "#ffffff",
        "--pwa-banner-btn-text": pwaBannerBtnText || primary,
        "--coupon-badge-bg": t['--coupon-badge-bg'] || t.couponBadgeBg || primary,
        "--coupon-badge-text": t['--coupon-badge-text'] || t.couponBadgeText || primaryFg || "#ffffff",
        "--coupon-badge-border": t['--coupon-badge-border'] || t.couponBadgeBorder || primary,
        "--price-discount-badge-bg": t['--price-discount-badge-bg'] || t.priceDiscountBadgeBg,
        "--price-discount-badge-text": t['--price-discount-badge-text'] || t.priceDiscountBadgeText,
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
  }, [activePharmacy?.id, activePharmacy?.categoriaAssociado, activePharmacy?.isPleno, themeColorsKey]);

  useEffect(() => {
    if (storeTheme) {
      Object.entries(storeTheme).forEach(([key, value]) => {
        if (key.startsWith('--')) {
          document.documentElement.style.setProperty(key, value as string);
        }
      });
    }
    return () => {
      resetStoreTheme();
    };
  }, [storeTheme]);

  // — Efeitos (todos os hooks antes do early return) —
  useEffect(() => {
    useMarketing.getState().loadMarketing();
  }, []);

  useEffect(() => {
    // Salva o slug da loja para páginas que não têm slug na URL (login, perfil, etc.)
    const isStoreSlugPage = potentialSlug && !SYSTEM_PAGES.has(potentialSlug);
    const slug = isStoreSlugPage
      ? safeSlugify(potentialSlug)
      : activePharmacy?.slug
      ? safeSlugify(activePharmacy.slug)
      : activePharmacy?.nome
      ? safeSlugify(activePharmacy.nome)
      : "loja-padrao";

    if (isStoreSlugPage) {
      try {
        sessionStorage.setItem('fa-last-store-slug', slug);
      } catch { /* sessionStorage indisponível */ }
    }

    useAuth.getState().syncStoreSession(slug);
  }, [potentialSlug, activePharmacy?.id, activePharmacy?.slug, activePharmacy?.nome]);

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
    const isParceiro = activePharmacy.categoriaAssociado === 'Parceiro';
    const isPleno = activePharmacy.categoriaAssociado === 'Pleno' || activePharmacy.isPleno === true;
    const isAssociado = !isParceiro && !isPleno;

    // Cache síncrono para loading instantâneo nas abas e transições
    if (activePharmacy?.slug) {
      try {
        sessionStorage.setItem(`fa-store-logo-${activePharmacy.slug}`, activePharmacy.logoUrl || "");
        sessionStorage.setItem(`fa-store-favicon-${activePharmacy.slug}`, activePharmacy.faviconUrl || "");
        sessionStorage.setItem(`fa-store-categoria-${activePharmacy.slug}`, activePharmacy.categoriaAssociado || (isPleno ? "Pleno" : isParceiro ? "Parceiro" : "Associado"));
        sessionStorage.setItem('fa-last-store-logo', activePharmacy.logoUrl || "");
        sessionStorage.setItem('fa-last-store-favicon', activePharmacy.faviconUrl || "");
        sessionStorage.setItem('fa-last-store-categoria', activePharmacy.categoriaAssociado || (isPleno ? "Pleno" : isParceiro ? "Parceiro" : "Associado"));
      } catch {}
    }
    
    // Identifica o favicon da loja:
    // 1. Pleno: favicon ou logo do Pleno 100% das vezes
    // 2. Parceiro: favicon ou logo da loja parceira, ou SVG com inicial
    // 3. Associado: 100% comum da rede (/favicon.png)
    let storeFavicon: string | null = null;
    if (isPleno) {
      storeFavicon = getSafeMediaUrl(activePharmacy.faviconUrl || activePharmacy.loadingLogoUrl || activePharmacy.logoUrl) || '/favicon.png';
      newLink.href = storeFavicon;
    } else if (isParceiro) {
      const rawFavicon = activePharmacy.faviconUrl || activePharmacy.loadingLogoUrl || activePharmacy.logoUrl;
      storeFavicon = getSafeMediaUrl(rawFavicon);
      if (storeFavicon) {
        newLink.href = storeFavicon;
      } else {
        const initial = (activePharmacy.nome || "F").trim().charAt(0).toUpperCase();
        const primaryColor = activePharmacy.themeColors?.primary || "#00B5AD";
        newLink.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='${encodeURIComponent(primaryColor)}'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='55' font-family='sans-serif' font-weight='bold' fill='#ffffff'>${initial}</text></svg>`;
      }
    } else {
      newLink.href = getSafeMediaUrl(globalFavicon) || '/favicon.png';
    }
    
    document.head.appendChild(newLink);

    // Dynamic manifest update for PWA install prompt
    const appName = isParceiro && activePharmacy.nome ? activePharmacy.nome : (activePharmacy.nome || "Farmácias Associadas");
    const storeSlug = activePharmacy.slug || "";
    const origin = typeof window !== 'undefined' ? window.location.origin : "https://pages-associadas.vercel.app";
    
    // Ícone do Manifest: para parceiro, JAMAIS usar /favicon.png ou globalFavicon da rede!
    let manifestIcon = storeFavicon;
    if (!manifestIcon && !isParceiro) {
      manifestIcon = getSafeMediaUrl(globalFavicon) || "/favicon.png";
    }

    if (manifestIcon) {
      if (manifestIcon.startsWith("/") && !manifestIcon.startsWith("//")) {
        manifestIcon = `${origin}${manifestIcon}`;
      }
    } else {
      // Fallback exclusivo de parceiro: SVG estilizado com a inicial e as cores da loja parceira
      const initial = (activePharmacy.nome || "F").trim().charAt(0).toUpperCase();
      const primaryColor = activePharmacy.themeColors?.primary || "#00B5AD";
      manifestIcon = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='${encodeURIComponent(primaryColor)}'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='55' font-family='sans-serif' font-weight='bold' fill='#ffffff'>${initial}</text></svg>`;
    }

    const iconType = manifestIcon.startsWith("data:image/svg") ? "image/svg+xml" : "image/png";

    const manifest = {
      name: appName,
      short_name: appName,
      start_url: `${origin}/${storeSlug}/`,
      scope: `${origin}/${storeSlug}/`,
      id: `/${storeSlug}/`,
      display: "standalone",
      display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
      background_color: "#ffffff",
      theme_color: activePharmacy.themeColors?.primary || "#00B5AD",
      icons: [
        {
          src: manifestIcon,
          sizes: "192x192",
          type: iconType,
          purpose: "any"
        },
        {
          src: manifestIcon,
          sizes: "512x512",
          type: iconType,
          purpose: "any"
        },
        {
          src: manifestIcon,
          sizes: "512x512",
          type: iconType,
          purpose: "maskable"
        }
      ]
    };
    
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
    const manifestURL = URL.createObjectURL(manifestBlob);

    // Remove link de manifest antigo para forçar o navegador a recarregar as novas propriedades
    const oldManifests = document.querySelectorAll("link[rel='manifest']");
    oldManifests.forEach(m => m.remove());

    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = manifestURL;
    document.head.appendChild(manifestLink);
    
    return () => {
      URL.revokeObjectURL(manifestURL);
    };
  }, [
    activePharmacy?.faviconUrl, 
    activePharmacy?.logoUrl, 
    activePharmacy?.isPleno, 
    activePharmacy?.slug, 
    activePharmacy?.nome, 
    activePharmacy?.categoriaAssociado,
    activePharmacy?.themeColors
  ]);

  // Trava de execução no PWA (Aplicativo Instalado):
  // Quando o app é aberto a partir do atalho baixado, ele fica 100% travado na loja instalada.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    
    if (isStandalone && activePharmacy?.slug) {
      localStorage.setItem("fa_installed_store_slug", activePharmacy.slug);
    }
    
    if (isStandalone) {
      const lockedSlug = localStorage.getItem("fa_installed_store_slug");
      if (lockedSlug && activePharmacy?.slug && activePharmacy.slug !== lockedSlug) {
        window.location.replace(`/${lockedSlug}`);
      }
    }
  }, [activePharmacy?.slug, potentialSlug]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (potentialSlug && !SYSTEM_PAGES.has(potentialSlug) && !activePharmacy && !pharmaciesLoaded) {
    return <GlobalLoading />;
  }

  if (mounted && potentialSlug && !SYSTEM_PAGES.has(potentialSlug) && pharmaciesLoaded && pharmacies.length > 0 && !activePharmacy) {
    return <NotFound type="page" />;
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

  useEffect(() => {
    if (activePharmacy && typeof document !== "undefined") {
      const title = activePharmacy.pageTitle || activePharmacy.nome || (activePharmacy.categoriaAssociado === 'Parceiro' ? "Loja Parceira" : "Farmácias Associadas");
      document.title = title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', activePharmacy.metaDescription || "Sua farmácia online de confiança.");
      }
    }
  }, [activePharmacy?.pageTitle, activePharmacy?.nome, activePharmacy?.categoriaAssociado, activePharmacy?.metaDescription]);

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      style={storeTheme}
    >
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
        <CookieBanner />
      </Suspense>
      <CompleteProfileModal />
    </div>
  );
}

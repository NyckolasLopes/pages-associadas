import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/storefront/Header";
import { Suspense, lazy, useMemo } from "react";
import { useCart } from "@/stores/cart";
import { useAdmin } from "@/stores/admin";

const Footer = lazy(() => import("@/components/storefront/Footer").then(m => ({ default: m.Footer })));
const FloatingElements = lazy(() => import("@/components/storefront/BackToTop").then(m => ({ default: m.FloatingElements })));
const CookieBanner = lazy(() => import("@/components/storefront/CookieBanner").then(m => ({ default: m.CookieBanner })));
const GeoPopup = lazy(() => import("@/components/storefront/GeoPopup").then(m => ({ default: m.GeoPopup })));
import { CompleteProfileModal } from "@/components/storefront/CompleteProfileModal";


function StorePendingComponent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <img src="/icone-associadas.png" alt="Carregando..." className="w-16 h-16 animate-spin mb-6 drop-shadow-md" />
      <p className="text-slate-500 font-bold animate-pulse tracking-wide">Carregando Farmácias Associadas...</p>
    </div>
  );
}

export const Route = createFileRoute("/_store")({
  component: StoreLayout,
  pendingComponent: StorePendingComponent,
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

function safeSlugify(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function StoreLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const pharmacies = useAdmin((s) => s.pharmacies);

  // Extract potential store slug from URL (e.g. /minha-loja)
  const pathParts = location.pathname.split('/').filter(Boolean);
  const potentialSlug = pathParts[0];

  const activePharmacy = useMemo(() => {
    if (selectedPharmacyId) {
      return pharmacies.find((p) => p.id === selectedPharmacyId) || pharmacies[0] || null;
    }
    
    if (potentialSlug) {
      const bySlug = pharmacies.find((p) => {
        const slug = p.slug ? safeSlugify(p.slug) : safeSlugify(p.nome || p.id);
        return slug === potentialSlug;
      });
      if (bySlug) return bySlug;
    }
    
    return pharmacies[0] || null;
  }, [selectedPharmacyId, pharmacies, potentialSlug]);

  const storeTheme = useMemo(() => {
    if (!activePharmacy) return undefined;
    
    let themeToApply: Record<string, string | undefined> = {};
    
    if (activePharmacy.categoriaAssociado === "Parceiro") {
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

      themeToApply = {
        ...themeToApply,
        ...cleanLegacyTheme,
        ...customVars
      };
    }
    
    return Object.keys(themeToApply).length > 0 ? (themeToApply as React.CSSProperties) : undefined;
  }, [activePharmacy]);

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
      className={`min-h-screen flex flex-col bg-background`}
      style={storeTheme}
    >
      {activePharmacy && (
        <>
          <title>{activePharmacy.pageTitle || activePharmacy.nome || "Farmácias Associadas"}</title>
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

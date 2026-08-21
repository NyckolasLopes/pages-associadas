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
import { CartSync } from "@/components/storefront/CartSync";

function StorePendingComponent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
      <p className="text-slate-500 font-medium animate-pulse">Carregando loja...</p>
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

function StoreLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const pharmacies = useAdmin((s) => s.pharmacies);

  const storeTheme = useMemo(() => {
    if (!selectedPharmacyId) return undefined;
    const pharmacy = pharmacies.find((p) => p.id === selectedPharmacyId);
    if (!pharmacy) return undefined;
    
    if (pharmacy.themeColors) {
      return {
        "--primary": pharmacy.themeColors.primary,
        "--primary-foreground": "#ffffff",
        "--primary-dark": pharmacy.themeColors.primary,
        "--secondary": pharmacy.themeColors.secondary,
        "--secondary-foreground": "#ffffff",
        "--accent": pharmacy.themeColors.accent,
        "--accent-foreground": "#ffffff",
        "--header-bg": pharmacy.themeColors.headerBg || pharmacy.themeColors.primary,
        "--header-icons": pharmacy.themeColors.headerIcons || "#ffffff",
        "--search-bg": pharmacy.themeColors.searchBg || "#ffffff",
        "--institutional-bg": pharmacy.themeColors.institutionalBg || "#f97316",
      } as React.CSSProperties;
    }
    
    if (pharmacy.categoriaAssociado === "Parceiro") {
      return PARCEIRO_THEME as React.CSSProperties;
    }
    return undefined;
  }, [selectedPharmacyId, pharmacies]);

  const activePharmacy = useMemo(() => {
    return pharmacies.find((p) => p.id === selectedPharmacyId) || pharmacies[0] || null;
  }, [selectedPharmacyId, pharmacies]);

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
      <CartSync />
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

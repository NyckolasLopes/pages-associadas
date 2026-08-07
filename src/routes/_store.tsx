import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { Header } from "@/components/storefront/Header";
import { Suspense, lazy, useMemo } from "react";
import { useCart } from "@/stores/cart";
import { useAdmin } from "@/stores/admin";

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
      } as React.CSSProperties;
    }
    
    if (pharmacy.categoriaAssociado === "Parceiro") {
      return PARCEIRO_THEME as React.CSSProperties;
    }
    return undefined;
  }, [selectedPharmacyId, pharmacies]);

  return (
    <div
      className={`min-h-screen flex flex-col bg-background`}
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
        {isHome && <CookieBanner />}
      </Suspense>
    </div>
  );
}

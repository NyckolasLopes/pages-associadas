import { useActivePharmacy, safeSlugify, SYSTEM_PAGES } from "@/hooks/useActivePharmacy";
import { useAdmin, getInitialCachedPharmacies } from "@/stores/admin";
import { useLocation } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export function GlobalLoading() {
  const activePharmacy = useActivePharmacy();
  const pharmacies = useAdmin((s) => s.pharmacies);
  const globalLogo = useAdmin((s) => s.logoUrl);
  const location = useLocation();

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : location.pathname;
  const pathParts = currentPath.split('/').filter(Boolean);
  const potentialSlug = pathParts[0] ?? "";
  const isAdminArea = currentPath.startsWith('/admin') || potentialSlug === 'admin' || (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  // 1. Tentar farmácia ativa (apenas fora do painel administrativo)
  let currentPharmacy = !isAdminArea ? activePharmacy : null;

  // 2. Tentar farmácias em memória da store ou cache local
  const allPharmaciesList = (pharmacies && pharmacies.length > 0) ? pharmacies : getInitialCachedPharmacies();

  if (!isAdminArea && !currentPharmacy && allPharmaciesList.length > 0 && potentialSlug) {
    const normalizedSlug = safeSlugify(potentialSlug);
    currentPharmacy = allPharmaciesList.find((p) => {
      const slug = p.slug ? safeSlugify(p.slug) : safeSlugify(p.nome || p.id);
      return slug === normalizedSlug || (p.slug || "").toLowerCase() === potentialSlug.toLowerCase() || String(p.id) === potentialSlug;
    }) || null;
  }

  // 3. Tentar última loja visitada no sessionStorage (apenas se estiver navegando na loja)
  if (!isAdminArea && !currentPharmacy && allPharmaciesList.length > 0) {
    try {
      const lastSlug = sessionStorage.getItem('fa-last-store-slug');
      if (lastSlug) {
        const normalizedLast = safeSlugify(lastSlug);
        currentPharmacy = allPharmaciesList.find((p) => {
          const slug = p.slug ? safeSlugify(p.slug) : safeSlugify(p.nome || p.id);
          return slug === normalizedLast || (p.slug || "").toLowerCase() === lastSlug.toLowerCase();
        }) || null;
      }
    } catch { /* ignore */ }
  }

  // Resoluções imediatas com persistência síncrona para garantir 100% dos carregamentos (inclusive F5/cold reload)
  let storeLogo = currentPharmacy?.logoUrl || currentPharmacy?.loadingLogoUrl || "";
  let storeFavicon = currentPharmacy?.faviconUrl || currentPharmacy?.loadingLogoUrl || "";
  let storeCategoria = currentPharmacy?.categoriaAssociado;
  let storeIsPleno = currentPharmacy?.isPleno;

  if (!isAdminArea && typeof window !== 'undefined' && potentialSlug) {
    if (!storeLogo) {
      try {
        storeLogo = sessionStorage.getItem(`fa-store-logo-${potentialSlug}`) || sessionStorage.getItem('fa-last-store-logo') || "";
      } catch {}
    }
    if (!storeFavicon) {
      try {
        storeFavicon = sessionStorage.getItem(`fa-store-favicon-${potentialSlug}`) || sessionStorage.getItem('fa-last-store-favicon') || "";
      } catch {}
    }
    if (!storeCategoria) {
      try {
        storeCategoria = (sessionStorage.getItem(`fa-store-categoria-${potentialSlug}`) || sessionStorage.getItem('fa-last-store-categoria') || "") as any;
      } catch {}
    }
  }

  // Identificação exata das 3 categorias de loja
  const isParceiro = !isAdminArea && (storeCategoria === 'Parceiro' || currentPharmacy?.categoriaAssociado === 'Parceiro');
  const isPleno = !isAdminArea && !isParceiro && (
    storeCategoria === 'Pleno' || 
    currentPharmacy?.categoriaAssociado === 'Pleno' || 
    storeIsPleno === true || 
    currentPharmacy?.isPleno === true ||
    Boolean(storeFavicon && potentialSlug && potentialSlug !== 'loja-padrao' && !SYSTEM_PAGES.has(potentialSlug))
  );

  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[99999] flex flex-col items-center justify-center animate-in fade-in duration-150">
      {isParceiro ? (
        // ==================== LOJA PARCEIRO ====================
        // "somente o circulo rodando no parceiro"
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-12 h-12 text-slate-700 animate-spin" />
        </div>
      ) : isPleno ? (
        // ==================== LOJA PLENO ====================
        // "o carregamento do spin com o logo e faviicon do pleno deve ser 100% dos carregamentos quando estiver na loja pleno"
        <div className="bg-white shadow-xl border border-slate-100 rounded-3xl p-8 flex flex-col items-center max-w-xs w-full mx-4 text-center">
          {/* Logo da Loja Pleno */}
          {(storeLogo || currentPharmacy?.logoUrl) ? (
            <img
              src={storeLogo || currentPharmacy?.logoUrl}
              alt={currentPharmacy?.nome || "Loja Pleno"}
              className="max-h-14 max-w-[210px] w-auto h-auto mb-6 object-contain"
            />
          ) : (
            <h3 className="text-lg font-bold text-slate-800 mb-6">{currentPharmacy?.nome || "Loja Pleno"}</h3>
          )}
          {/* Spin com o Favicon da Loja Pleno */}
          <img
            src={storeFavicon || currentPharmacy?.faviconUrl || storeLogo || currentPharmacy?.logoUrl || "/icone-associadas.png"}
            alt="Carregando..."
            className="w-14 h-14 animate-spin object-contain"
          />
          <span className="text-sm font-semibold text-slate-600 mt-4">
            Carregando...
          </span>
        </div>
      ) : (
        // ==================== LOJA DO ASSOCIADO / REDE ASSOCIADAS ====================
        // "na loja do associado o carregamento deve ser 100% do tempo o comum"
        <div className="bg-white shadow-xl border border-slate-100 rounded-3xl p-8 flex flex-col items-center max-w-xs w-full mx-4 text-center">
          <img
            src={globalLogo || "/logo.png"}
            alt="Farmácias Associadas"
            className="max-h-14 max-w-[210px] w-auto h-auto mb-6 object-contain"
          />
          {/* Spin da Associadas (cruz giratória comum) */}
          <img
            src="/icone-associadas.png"
            alt="Carregando..."
            className="w-14 h-14 animate-spin object-contain"
          />
          <span className="text-sm font-semibold text-slate-600 mt-4">
            {isAdminArea ? "Carregando painel..." : "Carregando..."}
          </span>
        </div>
      )}
    </div>
  );
}

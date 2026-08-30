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
  const isCustomStoreSlug = potentialSlug && !SYSTEM_PAGES.has(potentialSlug) && potentialSlug !== 'loja-padrao';

  // 1. Tentar farmácia ativa
  let currentPharmacy = activePharmacy;

  // 2. Tentar farmácias em memória da store ou cache local
  const allPharmaciesList = (pharmacies && pharmacies.length > 0) ? pharmacies : getInitialCachedPharmacies();

  if (!currentPharmacy && allPharmaciesList.length > 0 && potentialSlug) {
    const normalizedSlug = safeSlugify(potentialSlug);
    currentPharmacy = allPharmaciesList.find((p) => {
      const slug = p.slug ? safeSlugify(p.slug) : safeSlugify(p.nome || p.id);
      return slug === normalizedSlug || (p.slug || "").toLowerCase() === potentialSlug.toLowerCase();
    }) || null;
  }

  // 3. Tentar última loja visitada no sessionStorage
  if (!currentPharmacy && allPharmaciesList.length > 0) {
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

  // Identificação: Loja Parceira vs Loja Pleno
  const isParceiro = currentPharmacy 
    ? (currentPharmacy.categoriaAssociado === 'Parceiro' || currentPharmacy.categoriaAssociado === 'Associado' || currentPharmacy.isPleno === false)
    : false;

  const partnerLogo = currentPharmacy?.logoUrl || currentPharmacy?.footerLogoUrl;
  const partnerName = currentPharmacy?.nome || (potentialSlug ? potentialSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Loja Parceira");

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-150">
      <div className="bg-white shadow-2xl border border-slate-200 rounded-3xl p-8 flex flex-col items-center max-w-sm w-full mx-4 text-center">
        {isParceiro ? (
          // ==================== LOJA PARCEIRA (EX: ZONA SUL) ====================
          // Carregamento EXCLUSIVO para parceiros: Logo cadastrado da loja (ou nome formatado) e spinner neutro e moderno
          <div className="flex flex-col items-center justify-center mb-4 w-full">
            {partnerLogo ? (
              <img 
                src={partnerLogo} 
                alt={partnerName || "Logo da Loja"} 
                className="max-h-16 max-w-[210px] w-auto h-auto mb-5 object-contain" 
              />
            ) : (
              <div className="mb-5 flex flex-col items-center gap-1">
                <span className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Loja Parceira</span>
                <div className="text-xl font-black text-slate-800 tracking-tight">
                  {partnerName}
                </div>
              </div>
            )}
            {/* Redondo comum carregando (Spinner convencional sem mascote/cruz pleno) */}
            <div className="flex items-center justify-center my-2">
              <Loader2 className="w-10 h-10 text-slate-800 animate-spin" />
            </div>
            
            <h3 className="text-base font-bold text-slate-800 mt-3">Carregando loja...</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Aguarde um momento enquanto preparamos os produtos e ofertas para você.
            </p>
          </div>
        ) : (
          // ==================== LOJA PLENO (FARMÁCIAS ASSOCIADAS) ====================
          // Logo oficial da Farmácias Associadas e SPIN cruz giratória
          <div className="flex flex-col items-center justify-center mb-4 w-full">
            <img
              src={globalLogo || "/logo.png"}
              alt="Farmácias Associadas"
              className="max-h-14 max-w-[210px] w-auto h-auto mb-5 object-contain"
            />
            {/* Spin da Associadas (cruz giratória com animate-spin) */}
            <img
              src="/icone-associadas.png"
              alt="Carregando..."
              className="w-14 h-14 animate-spin object-contain"
            />
            
            <h3 className="text-base font-bold text-slate-800 mt-3">Carregando...</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Aguarde um momento enquanto preparamos tudo para você.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

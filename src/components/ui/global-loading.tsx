import { useActivePharmacy, safeSlugify } from "@/hooks/useActivePharmacy";
import { useAdmin } from "@/stores/admin";
import { useLocation } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export function GlobalLoading() {
  const activePharmacy = useActivePharmacy();
  const pharmacies = useAdmin((s) => s.pharmacies);
  const globalLogo = useAdmin((s) => s.logoUrl);
  const location = useLocation();

  // Tentar inferir a farmácia pelo slug da URL se activePharmacy ainda não tiver resolvido
  let currentPharmacy = activePharmacy;
  if (!currentPharmacy && pharmacies && pharmacies.length > 0) {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const potentialSlug = pathParts[0] ?? "";
    if (potentialSlug) {
      const normalizedSlug = safeSlugify(potentialSlug);
      currentPharmacy = pharmacies.find((p) => {
        const slug = p.slug ? safeSlugify(p.slug) : safeSlugify(p.nome || p.id);
        return slug === normalizedSlug || (p.slug || "").toLowerCase() === potentialSlug.toLowerCase();
      }) || null;
    }
  }

  // Se não encontrou pela URL, tenta pela última loja visitada no sessionStorage
  if (!currentPharmacy && pharmacies && pharmacies.length > 0) {
    try {
      const lastSlug = sessionStorage.getItem('fa-last-store-slug');
      if (lastSlug) {
        const normalizedLast = safeSlugify(lastSlug);
        currentPharmacy = pharmacies.find((p) => {
          const slug = p.slug ? safeSlugify(p.slug) : safeSlugify(p.nome || p.id);
          return slug === normalizedLast || (p.slug || "").toLowerCase() === lastSlug.toLowerCase();
        }) || null;
      }
    } catch { /* ignore */ }
  }

  // Identificação: Loja Parceira vs Loja Pleno
  // Se for Parceiro, Associado ou isPleno === false -> Loja Parceira
  // Caso contrário -> Loja Pleno (Farmácias Associadas)
  const isParceiro = currentPharmacy?.categoriaAssociado === 'Parceiro' || 
                     currentPharmacy?.categoriaAssociado === 'Associado' || 
                     currentPharmacy?.isPleno === false;
  
  const partnerLogo = isParceiro ? (currentPharmacy?.logoUrl || currentPharmacy?.footerLogoUrl) : null;
  const partnerName = isParceiro ? (currentPharmacy?.nome || "Loja Parceira") : null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-150">
      <div className="bg-white shadow-2xl border border-slate-200 rounded-3xl p-8 flex flex-col items-center max-w-sm w-full mx-4 text-center">
        {isParceiro ? (
          // ==================== LOJA PARCEIRA ====================
          // Carregamento CONVENCIONAL: Logo cadastrado pela loja e ABAIXO o redondo comum carregando
          <div className="flex flex-col items-center justify-center mb-4">
            {partnerLogo ? (
              <img 
                src={partnerLogo} 
                alt={partnerName || "Logo"} 
                className="max-h-16 max-w-[200px] w-auto h-auto mb-5 object-contain" 
              />
            ) : (
              <div className="text-xl font-black text-slate-800 tracking-tight mb-5">
                {partnerName}
              </div>
            )}
            {/* Redondo comum carregando (Spinner convencional) */}
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : (
          // ==================== LOJA PLENO (FARMÁCIAS ASSOCIADAS) ====================
          // Logo da Farmácias Associadas e ABAIXO o SPIN da Associadas girando 100% do tempo
          <div className="flex flex-col items-center justify-center mb-4">
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
          </div>
        )}
        
        <h3 className="text-lg font-bold text-slate-800 mt-2">Carregando...</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Aguarde um momento enquanto preparamos tudo para você.
        </p>
      </div>
    </div>
  );
}

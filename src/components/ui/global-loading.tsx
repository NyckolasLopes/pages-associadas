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
      const tcSlug = (p as any).themeColors?.slug ? safeSlugify((p as any).themeColors.slug) : "";
      const city = p.cidade ? safeSlugify(p.cidade) : "";
      const apelido = p.apelido ? safeSlugify(p.apelido) : "";
      return slug === normalizedSlug || tcSlug === normalizedSlug || city === normalizedSlug || apelido === normalizedSlug || (p.slug || "").toLowerCase() === potentialSlug.toLowerCase() || String(p.id) === potentialSlug;
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
          const tcSlug = (p as any).themeColors?.slug ? safeSlugify((p as any).themeColors.slug) : "";
          const city = p.cidade ? safeSlugify(p.cidade) : "";
          const apelido = p.apelido ? safeSlugify(p.apelido) : "";
          return slug === normalizedLast || tcSlug === normalizedLast || city === normalizedLast || apelido === normalizedLast || (p.slug || "").toLowerCase() === lastSlug.toLowerCase();
        }) || null;
      }
    } catch { /* ignore */ }
  }

  let storeCategoria = currentPharmacy?.categoriaAssociado;
  if (!isAdminArea && typeof window !== 'undefined' && potentialSlug && !storeCategoria) {
    try {
      storeCategoria = (sessionStorage.getItem(`fa-store-categoria-${potentialSlug}`) || sessionStorage.getItem('fa-last-store-categoria') || "") as any;
    } catch {}
  }

  const cat = (storeCategoria || currentPharmacy?.categoriaAssociado || "").toString().toLowerCase();
  const isParceiro = !isAdminArea && (cat === 'parceiro' || currentPharmacy?.isPleno === false);

  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[99999] flex flex-col items-center justify-center animate-in fade-in duration-150">
      {isParceiro ? (
        // ==================== LOJA PARCEIRO (LOAD PADRÃO) ====================
        // Ao acessar loja parceira: abertura com load padrão sem marca Associadas
        <div className="bg-white shadow-xl border border-slate-100 rounded-3xl p-8 flex flex-col items-center max-w-xs w-full mx-4 text-center">
          <Loader2 className="w-12 h-12 text-slate-700 animate-spin mb-4" />
          <span className="text-sm font-semibold text-slate-600">
            Carregando...
          </span>
        </div>
      ) : (
        // ==================== LOJA PLENO / REDE (CARREGAMENTO ASSOCIADAS) ====================
        // Ao acessar loja pleno: abertura com a marca oficial das Farmácias Associadas
        <div className="bg-white shadow-xl border border-slate-100 rounded-3xl p-8 flex flex-col items-center max-w-xs w-full mx-4 text-center">
          <img
            src={globalLogo || "/logo.png"}
            alt="Farmácias Associadas"
            className="max-h-14 max-w-[210px] w-auto h-auto mb-6 object-contain"
          />
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

import { Spinner } from "./spinner";
import { useConfig } from "@/stores/config";
import { useActivePharmacy } from "@/hooks/useActivePharmacy";
import { useAdmin } from "@/stores/admin";
import { useLocation } from "@tanstack/react-router";

export function GlobalLoading() {
  const dadosLoja = useConfig((s) => s.dadosLoja);
  const activePharmacy = useActivePharmacy();
  const pharmacies = useAdmin((s) => s.pharmacies);
  const location = useLocation();

  const isAdmin = location.pathname.startsWith('/admin');
  
  // Tentar inferir a farmácia pelo cache ou slug se activePharmacy ainda for null
  let inferredPharmacy = activePharmacy;
  if (!inferredPharmacy && pharmacies.length > 0) {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const potentialSlug = pathParts[0] ?? "";
    inferredPharmacy = pharmacies.find((p) => {
      const slug = p.slug ? p.slug : (p.nome || p.id);
      return slug.toLowerCase().replace(/\s+/g, '-') === potentialSlug;
    }) || null;
  }

  const isParceiro = inferredPharmacy?.categoriaAssociado === 'Parceiro';
  const isStoreContext = !isAdmin && !!inferredPharmacy;

  let logoToUse: string = "";
  let useFaviconSpinner = false;

  if (isAdmin) {
    // Admin sempre usa o logo da rede
    logoToUse = "/logo.png";
  } else if (inferredPharmacy) {
    if (isParceiro) {
      // Parceiro usa o próprio logo, se tiver. Se não, fica vazio (usando o spinner padrão).
      logoToUse = inferredPharmacy.logoUrl || "";
    } else {
      // Vitrine da rede plena usa apenas o favicon girando
      useFaviconSpinner = true;
    }
  } else {
    // Estamos carregando os dados da farmácia e o cache está vazio.
    // Vamos tentar adivinhar pelo slug se é uma loja plena padrão.
    const pathParts = location.pathname.split('/').filter(Boolean);
    const slug = pathParts[0] ?? "";
    
    // Se não tem slug (home), ou se é porto-alegre/loja-padrao, assumimos pleno (favicon)
    if (!slug || slug === 'porto-alegre' || slug === 'loja-padrao') {
      useFaviconSpinner = true;
    } else {
      // Slug desconhecido no primeiro carregamento: usar spinner genérico para não vazar FA
      useFaviconSpinner = false;
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white shadow-xl border rounded-2xl p-8 flex flex-col items-center max-w-sm w-full mx-4 text-center">
        {useFaviconSpinner ? (
          <div className="flex items-center justify-center mb-6">
            <img src="/favicon.png" alt="Carregando" className="w-16 h-16 animate-spin object-contain" />
          </div>
        ) : logoToUse ? (
          <img src={logoToUse} alt="Logo" className="h-12 w-auto mb-6 object-contain" />
        ) : (
          <div className="flex items-center justify-center mb-6">
            <Spinner className="w-16 h-16 text-primary" />
          </div>
        )}
        
        {logoToUse && !useFaviconSpinner && <Spinner className="w-8 h-8 mb-4 text-primary" />}
        
        <h3 className="text-lg font-bold text-slate-800">Carregando...</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Aguarde um momento enquanto preparamos tudo para você.
        </p>
      </div>
    </div>
  );
}

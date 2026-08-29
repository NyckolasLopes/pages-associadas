import { useActivePharmacy, safeSlugify } from "@/hooks/useActivePharmacy";
import { useAdmin } from "@/stores/admin";
import { useLocation } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export function GlobalLoading() {
  const activePharmacy = useActivePharmacy();
  const pharmacies = useAdmin((s) => s.pharmacies);
  const location = useLocation();

  // Tentar inferir a farmácia pelo slug se activePharmacy ainda estiver carregando
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

  // Identifica se é comprovadamente uma loja Pleno
  // Se for Parceiro, Associado ou se ainda estiver indefinido nos primeiros milissegundos, NÃO é Pleno
  const isPleno = currentPharmacy?.categoriaAssociado === 'Pleno' || currentPharmacy?.isPleno === true;
  const isParceiro = currentPharmacy?.categoriaAssociado === 'Parceiro' || currentPharmacy?.categoriaAssociado === 'Associado';
  const partnerLogo = isParceiro ? (currentPharmacy?.logoUrl || currentPharmacy?.footerLogoUrl) : null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-150">
      <div className="bg-white shadow-xl border rounded-2xl p-8 flex flex-col items-center max-w-sm w-full mx-4 text-center">
        {isPleno ? (
          // Apenas e exclusivamente lojas Pleno exibem o favicon das Farmácias Associadas girando
          <div className="flex items-center justify-center mb-6">
            <img
              src={currentPharmacy?.faviconUrl || "/favicon.png"}
              alt="Carregando"
              className="w-16 h-16 animate-spin object-contain"
            />
          </div>
        ) : partnerLogo ? (
          // Loja parceira com logo customizado
          <div className="flex flex-col items-center justify-center mb-4">
            <img src={partnerLogo} alt="Logo" className="h-12 w-auto mb-4 object-contain" />
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : (
          // Loja parceira ou carregamento neutro inicial (NUNCA exibe o favicon da rede)
          <div className="flex items-center justify-center mb-6">
            <Loader2 className="w-14 h-14 text-primary animate-spin" />
          </div>
        )}
        
        <h3 className="text-lg font-bold text-slate-800">Carregando...</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Aguarde um momento enquanto preparamos tudo para você.
        </p>
      </div>
    </div>
  );
}

import { Spinner } from "./spinner";
import { useConfig } from "@/stores/config";
import { useActivePharmacy } from "@/hooks/useActivePharmacy";
import { useLocation } from "@tanstack/react-router";

export function GlobalLoading() {
  const dadosLoja = useConfig((s) => s.dadosLoja);
  const activePharmacy = useActivePharmacy();
  const location = useLocation();

  const isAdmin = location.pathname.startsWith('/admin');
  const isParceiro = activePharmacy?.categoriaAssociado === 'Parceiro';
  // Qualquer loja específica de vitrine (não admin) usa o logo dela
  const isStoreContext = !isAdmin && !!activePharmacy;

  let logoToUse: string;
  if (isAdmin) {
    // Admin sempre usa o logo da rede
    logoToUse = "/logo.png";
  } else if (isStoreContext && activePharmacy?.logoUrl) {
    // Vitrine com logo cadastrado: usa o logo da loja
    logoToUse = activePharmacy.logoUrl;
  } else if (isParceiro) {
    // Parceiro sem logo: sem logo nenhum
    logoToUse = "";
  } else {
    // Loja da rede sem logo próprio: usa o logo padrão da rede
    logoToUse = dadosLoja?.logoUrl || "/logo.png";
  }

  // Parceiros não usam o spinner verde da rede (sem identidade visual da rede)
  const showSpinner = !isParceiro;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white shadow-xl border rounded-2xl p-8 flex flex-col items-center max-w-sm w-full mx-4 text-center">
        {logoToUse ? (
          <img src={logoToUse} alt="Logo" className="h-12 w-auto mb-6 object-contain" />
        ) : showSpinner ? (
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Spinner className="w-8 h-8 text-primary" />
          </div>
        ) : null}
        
        {logoToUse && showSpinner && <Spinner className="w-8 h-8 mb-4 text-primary" />}
        
        <h3 className="text-lg font-bold text-slate-800">Carregando...</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Aguarde um momento enquanto preparamos tudo para você.
        </p>
      </div>
    </div>
  );
}

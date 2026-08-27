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

  let logoToUse: string = "";
  let isStoreContextLoading = false;

  if (isAdmin) {
    // Admin sempre usa o logo da rede
    logoToUse = "/logo.png";
  } else if (activePharmacy) {
    if (isParceiro) {
      // Parceiro usa o próprio logo, se tiver. Se não, fica vazio.
      logoToUse = activePharmacy.logoUrl || "";
    } else {
      // Vitrine da rede plena: usa o próprio logo, ou o padrão da rede
      logoToUse = activePharmacy.logoUrl || dadosLoja?.logoUrl || "/logo.png";
    }
  } else {
    // Estamos carregando os dados da farmácia ainda.
    // Se a rota principal for "/", é a matriz. Senão, é uma loja específica (ainda desconhecida).
    if (location.pathname === "/") {
      logoToUse = dadosLoja?.logoUrl || "/logo.png";
    } else {
      isStoreContextLoading = true;
      logoToUse = ""; // Não exibe logo até saber se é parceiro ou pleno
    }
  }

  // Se for parceiro (ou estamos carregando uma loja e não sabemos quem é), o spinner pode aparecer se não houver logo.
  // Se for parceiro COM logo, não mostra o spinner da rede.
  const showSpinner = true; 

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white shadow-xl border rounded-2xl p-8 flex flex-col items-center max-w-sm w-full mx-4 text-center">
        {logoToUse ? (
          <img src={logoToUse} alt="Logo" className="h-12 w-auto mb-6 object-contain" />
        ) : showSpinner ? (
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Spinner className="w-8 h-8 text-primary" forceGeneric={isStoreContextLoading} />
          </div>
        ) : null}
        
        {logoToUse && showSpinner && <Spinner className="w-8 h-8 mb-4 text-primary" forceGeneric={isStoreContextLoading} />}
        
        <h3 className="text-lg font-bold text-slate-800">Carregando...</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Aguarde um momento enquanto preparamos tudo para você.
        </p>
      </div>
    </div>
  );
}

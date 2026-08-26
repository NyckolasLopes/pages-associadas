import { Spinner } from "./spinner";
import { useConfig } from "@/stores/config";
import { useActivePharmacy } from "@/hooks/useActivePharmacy";

export function GlobalLoading() {
  const dadosLoja = useConfig((s) => s.dadosLoja);
  const activePharmacy = useActivePharmacy();

  // If in a partner store, use the partner's logo. If no partner logo, use null (don't fallback to pleno).
  // If in Pleno (or no specific store), fallback to the global dadosLoja.logoUrl
  const isParceiro = activePharmacy && activePharmacy.isPleno === false;
  const logoToUse = isParceiro 
    ? activePharmacy?.logoUrl || null
    : activePharmacy?.logoUrl || dadosLoja?.logoUrl;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white shadow-xl border rounded-2xl p-8 flex flex-col items-center max-w-sm w-full mx-4 text-center">
        {logoToUse ? (
          <img src={logoToUse} alt="Logo" className="h-12 w-auto mb-6 object-contain" />
        ) : (
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Spinner className="w-8 h-8 text-primary" />
          </div>
        )}
        
        {logoToUse && <Spinner className="w-8 h-8 mb-4 text-primary" />}
        
        <h3 className="text-lg font-bold text-slate-800">Carregando...</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Aguarde um momento enquanto preparamos tudo para você.
        </p>
      </div>
    </div>
  );
}

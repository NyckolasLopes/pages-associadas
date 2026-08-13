import { Spinner } from "./spinner";
import { useConfig } from "@/stores/config";

export function GlobalLoading() {
  const dadosLoja = useConfig((s) => s.dadosLoja);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white shadow-xl border rounded-2xl p-8 flex flex-col items-center max-w-sm w-full mx-4 text-center">
        {dadosLoja?.logoUrl ? (
          <img src={dadosLoja.logoUrl} alt="Logo da Farmácia" className="h-12 w-auto mb-6 object-contain" />
        ) : (
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Spinner className="w-6 h-6 text-primary" />
          </div>
        )}
        
        {dadosLoja?.logoUrl && <Spinner className="w-6 h-6 text-primary mb-4" />}
        
        <h3 className="text-lg font-bold text-slate-800">Carregando...</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Aguarde um momento enquanto preparamos tudo para você.
        </p>
      </div>
    </div>
  );
}

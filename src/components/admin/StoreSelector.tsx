import { useAdmin } from "@/stores/admin";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Store } from "lucide-react";

interface StoreSelectorProps {
  className?: string;
  hidePlenoForNonAdmin?: boolean;
}

export function StoreSelector({ className, hidePlenoForNonAdmin = false }: StoreSelectorProps) {
  const { currentUser, pharmacies, activeStoreId, setActiveStoreId, grupos } = useAdmin();

  // Basic checks
  if (!currentUser) return null;

  const isGlobalAdmin = currentUser.proprietario || 
    grupos?.find(g => g.id === currentUser.grupoId)?.permissao_total || 
    currentUser.lojasVinculadas === undefined || false;

  const userStores = isGlobalAdmin 
    ? pharmacies 
    : pharmacies.filter(p => {
        const isLinked = currentUser.lojasVinculadas?.includes(p.id);
        if (!isLinked) return false;
        if (hidePlenoForNonAdmin && (p.categoriaAssociado === 'Pleno' || p.isPleno === true)) {
          return false;
        }
        return true;
      });

  if (userStores.length === 0) return null;
  if (!isGlobalAdmin && userStores.length <= 1) return null;

  return (
    <div className={cn("flex items-center gap-2 sm:gap-2.5 bg-gradient-to-r from-emerald-100 to-emerald-50 px-2.5 sm:px-3 py-1.5 rounded-xl border-2 border-emerald-300 shadow-sm w-full sm:w-auto shrink-0", className)}>
      <div className="flex items-center gap-1.5 hidden sm:flex shrink-0">
        <Store className="h-4 w-4 text-emerald-600 shrink-0" />
        <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider whitespace-nowrap">
          Selecione a sua loja:
        </span>
      </div>
      <div className="w-full sm:w-[250px] md:w-[280px] flex-1 sm:flex-initial">
        <Select 
          value={activeStoreId || "all"} 
          onValueChange={(val) => setActiveStoreId(val === "all" ? null : val)}
        >
          <SelectTrigger className="h-10 bg-white border-emerald-300 text-emerald-950 font-black text-xs sm:text-sm shadow-sm focus:ring-emerald-500 rounded-lg px-3 overflow-hidden text-left w-full">
            <SelectValue placeholder="Selecione a sua loja" />
          </SelectTrigger>
          <SelectContent className="max-w-[380px]">
            {isGlobalAdmin && (
              <SelectItem value="all">
                <span className="font-bold text-emerald-800">Todas as Lojas (Visão Global)</span>
              </SelectItem>
            )}
            {userStores.map(loja => {
              const isLojaPleno = loja.categoriaAssociado === 'Pleno' || loja.isPleno === true;
              const isLojaParceiro = loja.categoriaAssociado === 'Parceiro';
              return (
                <SelectItem key={loja.id} value={loja.id}>
                  <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden max-w-[320px]">
                    <span className="font-bold text-slate-800 truncate">{(loja as any).nomeFantasia || loja.nome}</span>
                    {loja.cidade && <span className="text-slate-500 text-xs font-normal shrink-0">({loja.cidade})</span>}
                    {isGlobalAdmin && isLojaPleno && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded shrink-0">
                        Pleno
                      </span>
                    )}
                    {isGlobalAdmin && isLojaParceiro && (
                      <span className="text-[10px] font-bold bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded shrink-0">
                        Parceiro
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
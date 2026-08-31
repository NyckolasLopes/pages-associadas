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
    <div className={cn("flex items-center gap-3 bg-gradient-to-r from-emerald-100 to-emerald-50 p-2 rounded-xl border-2 border-emerald-300 shadow-md", className)}>
      <div className="flex items-center gap-2 hidden lg:flex ml-2">
        <Store className="h-4 w-4 text-emerald-600" />
        <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">
          Selecione a sua loja:
        </span>
      </div>
      <div className="w-[280px] md:w-[320px]">
        <Select 
          value={activeStoreId || "all"} 
          onValueChange={(val) => setActiveStoreId(val === "all" ? null : val)}
        >
          <SelectTrigger className="h-10 bg-white border-emerald-300 text-emerald-950 font-black text-sm shadow-sm focus:ring-emerald-500 rounded-lg">
            <SelectValue placeholder="Selecione a sua loja" />
          </SelectTrigger>
          <SelectContent>
            {isGlobalAdmin && (
              <SelectItem value="all">
                <span className="font-bold text-emerald-800">Todas as Lojas (Visão Global)</span>
              </SelectItem>
            )}
            {userStores.map(loja => {
              const isLojaPleno = loja.categoriaAssociado === 'Pleno' || loja.isPleno === true;
              return (
                <SelectItem key={loja.id} value={loja.id}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-800">{(loja as any).nomeFantasia || loja.nome}</span>
                    {loja.cidade && <span className="text-slate-500 text-xs font-normal">({loja.cidade})</span>}
                    {isGlobalAdmin && isLojaPleno && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                        Pleno
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
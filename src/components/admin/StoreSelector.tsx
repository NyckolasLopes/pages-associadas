import { useAdmin } from "@/stores/admin";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Store } from "lucide-react";

interface StoreSelectorProps {
  className?: string;
}

export function StoreSelector({ className }: StoreSelectorProps) {
  const { currentUser, pharmacies, activeStoreId, setActiveStoreId, grupos } = useAdmin();

  // Basic checks
  if (!currentUser) return null;

  const isGlobalAdmin = currentUser.proprietario || 
    grupos?.find(g => g.id === currentUser.grupoId)?.permissao_total || 
    currentUser.lojasVinculadas === undefined || false;

  const userStores = isGlobalAdmin 
    ? pharmacies 
    : pharmacies.filter(p => currentUser.lojasVinculadas?.includes(p.id));

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
            {userStores.map(loja => (
              <SelectItem key={loja.id} value={loja.id}>
                <span className="font-bold text-slate-800">{(loja as any).nomeFantasia || loja.nome}</span>
                {loja.cidade && <span className="text-slate-500 text-xs ml-2 font-normal">({loja.cidade})</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
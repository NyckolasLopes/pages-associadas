import { useAdmin } from "@/stores/admin";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  // If not global admin and only has 1 store, optionally don't show selector at all?
  // The user said: "CASO O ASSOCIADO TIVER MAIS DE UMA LOJA APARECE AS SUAS LOJAS VINCULADO PARA SELECIONAR"
  if (!isGlobalAdmin && userStores.length <= 1) return null;

  return (
    <div className={cn("flex items-center gap-3 bg-emerald-50/50 p-1.5 pr-2 rounded-lg border border-emerald-200 shadow-sm", className)}>
      <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider ml-2 hidden lg:block">
        {isGlobalAdmin ? "Visualizar dados de:" : "Selecione a sua loja:"}
      </span>
      <div className="w-[280px] md:w-[320px]">
        <Select 
          value={activeStoreId || "all"} 
          onValueChange={(val) => setActiveStoreId(val === "all" ? null : val)}
        >
          <SelectTrigger className="h-9 bg-white border-emerald-300 text-emerald-900 font-bold shadow-sm focus:ring-emerald-500">
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
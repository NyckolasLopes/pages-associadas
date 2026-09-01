import { createFileRoute } from "@tanstack/react-router";
import { StoreSelector } from "@/components/admin/StoreSelector";
import { Circle, MapPin, Navigation, Loader2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useLive, CIDADES } from "@/stores/live";
import { LiveMap } from "@/components/admin/LiveMap";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useOrders } from "@/stores/orders";
import { useAdmin } from "@/stores/admin";
import { lojas } from "@/data/stores";

export const Route = createFileRoute("/admin/ao-vivo")({
  component: AoVivo,
});

function AoVivo() {
  const { visitors: rawVisitors, totalAcessos, stats, myCidade, updateMyCity } = useLive();
  const { currentUser, activeStoreId, pharmacies } = useAdmin();
  const [isUpdatingCity, setIsUpdatingCity] = useState(false);

  const loadOrders = useOrders((state) => state.loadOrders);
  const pedidos = useOrders((state) => state.orders);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCorrectLocation = async () => {
    setIsUpdatingCity(true);
    try {
      await updateMyCity();
      toast.success(`Localização corrigida! ${useLive.getState().myCidade?.nome || ""}`);
    } catch {
      toast.error("Permita o acesso à localização no seu navegador para corrigir.");
    } finally {
      setIsUpdatingCity(false);
    }
  };
  
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;
  
  // Se for admin global e não tiver loja selecionada, vê tudo. Se tiver selecionada, vê da loja.
  // Se for associado, usa a loja ativa (que sempre terá uma).
  const effectiveStoreId = activeStoreId || (currentUser?.lojasVinculadas && currentUser.lojasVinculadas[0]) || null;

  const visitors = (!isGlobalAdmin || effectiveStoreId) 
    ? rawVisitors.filter(v => v.lojaId === effectiveStoreId || v.lojaId === `admin-loja-${effectiveStoreId}`)
    : rawVisitors;

  const getLojaName = (id?: string) => {
    if (!id) return "";
    if (id.includes('unidades') || id.includes('lojas')) return id;
    if (id === "admin-sede") return "Admin da Sede";
    if (id.startsWith('admin-loja-')) {
      const realId = id.replace('admin-loja-', '');
      const store = pharmacies.find(l => String(l.id) === String(realId));
      return store ? `Admin (${store.nome})` : "Admin da Unidade";
    }
    const realId = id.replace('admin-loja-', '');
    const store = pharmacies.find(l => String(l.id) === String(realId));
    return store?.nome || "Loja";
  };

  const topCidades = useMemo(() => {
    const cityMap: Record<string, { nome: string; uf: string; acessos: number; lojas: Set<string>; paginas: Record<string, number> }> = {};
    
    visitors.forEach((v: any) => {
      if (!v?.cidade?.nome) return;
      const nome = v.cidade.nome;
      const uf = v.cidade.uf || "";
      const key = nome.toLowerCase().trim();
      
      if (!cityMap[key]) {
        cityMap[key] = { nome, uf, acessos: 0, lojas: new Set(), paginas: {} };
      }
      cityMap[key].acessos += 1;
      if (v.lojaId) {
        cityMap[key].lojas.add(v.lojaId);
      }
      const pag = v.pagina || (v.path?.includes('/carrinho') ? 'Carrinho' : v.path?.includes('/produto') ? 'Produto' : 'Início / Loja');
      cityMap[key].paginas[pag] = (cityMap[key].paginas[pag] || 0) + 1;
    });

    return Object.values(cityMap)
      .map(data => {
        const cityInfo = CIDADES.find((c: any) => c.nome.toLowerCase() === data.nome.toLowerCase());
        const uf = data.uf || cityInfo?.uf || "";
        const lojaId = data.lojas.size === 1 
          ? Array.from(data.lojas)[0] 
          : (data.lojas.size > 1 ? `${data.lojas.size} unidades ativas` : undefined);
        return { nome: data.nome, uf, acessos: data.acessos, lojaId, paginas: data.paginas };
      })
      .sort((a, b) => b.acessos - a.acessos)
      .slice(0, 6);
  }, [visitors]);

  const isOrderToday = (dateStr?: string) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      const now = new Date();
      if (!isNaN(d.getTime())) {
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
      const parts = dateStr.split(' ')[0].split('/');
      if (parts.length === 3) {
        const day = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const year = Number(parts[2]);
        return (
          day === now.getDate() &&
          month === now.getMonth() &&
          year === now.getFullYear()
        );
      }
    } catch {
      return false;
    }
    return false;
  };

  const faturamentoHoje = pedidos
    .filter(p => isOrderToday(p.data))
    .filter(p => {
      if (!isGlobalAdmin || effectiveStoreId) {
        return String(p.lojaId) === String(effectiveStoreId);
      }
      return true;
    })
    .reduce((acc, p) => acc + (Number(p.valores?.total) || 0), 0);

  const valorVendido = faturamentoHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const carrinhoCount = visitors.filter(v => v.pagina === "Carrinho" || v.path?.includes("/carrinho") || v.path?.includes("/checkout")).length;
  const nasLojasCount = Math.max(0, visitors.length - carrinhoCount);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative z-10">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Ao Vivo
          </h2>
          {myCidade && (
            <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> Sua localização: <strong className="text-slate-600">{myCidade.nome}{myCidade.uf ? ` - ${myCidade.uf}` : ""}</strong>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCorrectLocation}
            disabled={isUpdatingCity}
            className="font-bold text-xs text-blue-600 border-blue-200 hover:bg-blue-50 gap-1.5"
            title="Usar GPS para corrigir sua localização"
          >
            {isUpdatingCity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            Corrigir localização
          </Button>
          <StoreSelector />
        </div>
      </div>
      <div className="relative h-[calc(100vh-150px)] w-full rounded-xl overflow-hidden border border-slate-200 shadow-md bg-gradient-to-br from-slate-50 to-emerald-50/20">
      {/* Efeitos de fundo premium */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-400/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-[100px] -ml-40 -mb-40 pointer-events-none"></div>

      {/* Interactive Map */}
      <div className="absolute inset-0 flex items-center justify-center">
        <LiveMap visitors={visitors} />
      </div>

      {/* AO VIVO Badge */}
      <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-xl border border-slate-200 px-4 py-2 rounded-lg text-[11px] font-black tracking-widest uppercase flex items-center gap-2 shadow-lg z-20">
        <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500 animate-pulse" />
        <span className="text-slate-700">Ao Vivo</span>
      </div>

      {/* Left Panels */}
      <div className="absolute top-6 bottom-6 left-6 flex flex-col gap-4 w-80 z-20 overflow-y-auto pr-2 pb-2" style={{ scrollbarWidth: 'none' }}>
        
        {/* Panel 1: Online stats */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 space-y-5 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visitantes Online</span>
              <div className="flex items-center gap-3 mt-1">
                <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500 animate-pulse" />
                <span className="text-5xl font-black text-slate-800 tracking-tight leading-none">{visitors.length}</span>
              </div>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <MapPin className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Nas Lojas</div>
              <div className="font-black text-slate-700 text-xl">{nasLojasCount}</div>
            </div>
            <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 text-center">
              <div className="text-[10px] text-emerald-600 uppercase tracking-wider font-bold mb-0.5">Carrinho</div>
              <div className="font-black text-emerald-700 text-xl">{carrinhoCount}</div>
            </div>
          </div>
        </div>

        {/* Panel 2: Sales today */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 transition-all flex flex-col justify-center">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Faturamento Hoje (Est.)</div>
          <div className="font-black text-slate-800 text-3xl tracking-tight">{valorVendido}</div>
        </div>

        {/* Panel 3: Cities */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 transition-all">
          <div className="text-[11px] font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>Top Cidades Ativas</span>
            <div className="flex-1 h-px bg-slate-100"></div>
          </div>
          
          {topCidades.length === 0 ? (
            <div className="text-sm font-medium text-slate-400 py-6 text-center bg-slate-50 rounded-xl border border-dashed">
              Nenhum visitante ativo no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {topCidades.map((cidade, i) => (
                <div key={i} className="flex flex-col bg-slate-50/70 hover:bg-slate-100/80 p-3 rounded-xl border border-slate-100 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition-colors truncate">
                        {cidade.nome}{cidade.uf ? ` - ${cidade.uf}` : ""}
                      </span>
                    </div>
                    <div className="text-xs font-black text-slate-700 bg-white shadow-xs border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                      {cidade.acessos}
                    </div>
                  </div>
                  
                  {cidade.lojaId && (
                    <span className="text-[10px] font-semibold text-indigo-600 mt-1 pl-5 truncate">
                      {getLojaName(cidade.lojaId)}
                    </span>
                  )}

                  {/* Páginas acessadas na cidade */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 pl-5">
                    {Object.entries(cidade.paginas || {}).map(([paginaNome, count], pIdx) => (
                      <span key={pIdx} className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-white border border-slate-200/80 px-2 py-0.5 rounded-full shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <strong className="text-slate-700 font-bold">{count}</strong> na {paginaNome}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
    </div>
  );
}
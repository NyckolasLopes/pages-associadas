import { createFileRoute } from "@tanstack/react-router";
import { StoreSelector } from "@/components/admin/StoreSelector";
import { Circle, MapPin } from "lucide-react";
import { useMemo } from "react";
import { useLive, CIDADES } from "@/stores/live";
import { LiveMap } from "@/components/admin/LiveMap";

import { useOrders } from "@/stores/orders";
import { useAdmin } from "@/stores/admin";
import { lojas } from "@/data/stores";

export const Route = createFileRoute("/admin/ao-vivo")({
  component: AoVivo,
});

function AoVivo() {
  const { visitors: rawVisitors, totalAcessos, stats } = useLive();
  const { currentUser, activeStoreId, pharmacies } = useAdmin();
  
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;
  
  // Se for admin global e não tiver loja selecionada, vê tudo. Se tiver selecionada, vê da loja.
  // Se for associado, usa a loja ativa (que sempre terá uma).
  const effectiveStoreId = activeStoreId;

  const visitors = (!isGlobalAdmin || effectiveStoreId) 
    ? rawVisitors.filter(v => v.lojaId === effectiveStoreId || v.lojaId === `admin-loja-${effectiveStoreId}`)
    : rawVisitors;

  const getLojaName = (id: string) => {
    if (id === "admin-sede") return "Admin da Sede";
    if (id.startsWith('admin-loja-')) {
      const realId = id.replace('admin-loja-', '');
      const storeName = pharmacies.find(l => String(l.id) === String(realId))?.nomeFantasia || "Loja Desconhecida";
      return `Admin (${storeName})`;
    }
    const realId = id.replace('admin-loja-', '');
    return pharmacies.find(l => String(l.id) === String(realId))?.nomeFantasia || "Loja Desconhecida";
  };
  const pedidos = useOrders((state) => state.orders);

  const topCidades = useMemo(() => {
    const activeCounts: Record<string, { acessos: number, lojaId?: string }> = {};
    visitors.forEach((v: any) => {
      const key = isGlobalAdmin && v.lojaId ? `${v.cidade.nome}::${v.lojaId}` : v.cidade.nome;
      if (!activeCounts[key]) {
        activeCounts[key] = { acessos: 0, lojaId: v.lojaId };
      }
      activeCounts[key].acessos += 1;
    });

    return Object.entries(activeCounts)
      .map(([key, data]) => {
        const nome = key.split("::")[0];
        const cityInfo = CIDADES.find((c: any) => c.nome === nome);
        const uf = cityInfo?.uf || visitors.find((v: any) => v.cidade.nome === nome)?.cidade.uf || "";
        return { nome, uf, acessos: data.acessos, lojaId: data.lojaId };
      })
      .sort((a, b) => b.acessos - a.acessos)
      .slice(0, 6);
  }, [visitors, isGlobalAdmin]);

  const hojeStr = new Date().toLocaleDateString('pt-BR');
  const faturamentoHoje = pedidos
    .filter(p => p.data.split(' ')[0] === hojeStr)
    .reduce((acc, p) => acc + p.valores.total, 0);

  const valorVendido = faturamentoHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
        </div>
        <StoreSelector />
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
      <div className="absolute top-6 bottom-6 left-6 flex flex-col gap-4 w-72 z-20 overflow-y-auto pr-2 pb-2" style={{ scrollbarWidth: 'none' }}>
        
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
              <div className="font-black text-slate-700 text-xl">{Math.max(0, visitors.length - Math.floor(visitors.length / 3))}</div>
            </div>
            <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 text-center">
              <div className="text-[10px] text-emerald-600 uppercase tracking-wider font-bold mb-0.5">Carrinho</div>
              <div className="font-black text-emerald-700 text-xl">{Math.floor(visitors.length / 3)}</div>
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
                <div key={i} className="flex items-start justify-between group py-1">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0 pr-2">
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors leading-tight">{cidade.nome}</span>
                      {cidade.lojaId && (
                        <span className="text-[10px] font-semibold text-indigo-500 leading-tight mt-0.5">{getLojaName(cidade.lojaId)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                    {cidade.acessos}
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

import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Info, Medal, BarChart2, Printer, Maximize2, ShoppingBag, DollarSign, Activity, TrendingUp, Package, Calendar } from "lucide-react";
import { useAdmin } from "@/stores/admin";
import { useOrders } from "@/stores/orders";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLive } from "@/stores/live";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export const Route = createFileRoute("/admin/metricas")({
  component: Metricas,
});

function Metricas() {
  const { currentUser, pharmacies, activeStoreId, grupos } = useAdmin();
  const isGlobalAdmin = currentUser?.proprietario || (typeof grupos !== 'undefined' && grupos?.find(g => g.id === currentUser?.grupoId)?.permissao_total) || currentUser?.lojasVinculadas === undefined;
  const effectiveStoreId = activeStoreId || (!isGlobalAdmin && currentUser?.lojasVinculadas?.[0]) || null;

  const { orders: rawOrders } = useOrders();
  const orders = useMemo(() => {
    if (!effectiveStoreId) return rawOrders;
    return rawOrders.filter(o => o.lojaId === effectiveStoreId);
  }, [rawOrders, effectiveStoreId]);

  const { totalAcessos } = useLive();
  const selectedLoja = effectiveStoreId || "all";
  const lojaNameText = (effectiveStoreId && !isGlobalAdmin) ? "da Loja" : "por Loja";

  const [expandedMetric, setExpandedMetric] = useState<'pedidos-loja' | 'receita-loja' | 'ticket-loja' | null>(null);

  // Orders Calculations
  const baseOrders = useMemo(() => {
    if (selectedLoja === "all") return orders;
    return orders.filter(o => o.lojaId === selectedLoja);
  }, [orders, selectedLoja]);

  const filteredOrders = useMemo(() => {
    return baseOrders.filter(o => {
      const status = o.status.toUpperCase();
      return status !== "AGUARDANDO PAGAMENTO" && status !== "CANCELADO";
    });
  }, [baseOrders]);

  const totalReceita = filteredOrders.reduce((acc, o) => acc + o.valores.total, 0);
  const qtdPedidos = filteredOrders.length;
  const ticketMedio = qtdPedidos > 0 ? totalReceita / qtdPedidos : 0;
  const acessos = totalAcessos || 1; 
  const conversaoPedidos = ((qtdPedidos / acessos) * 100).toFixed(1);

  // Charts Data
  const recentOrders = useMemo(() => {
    return [...baseOrders].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 5);
  }, [baseOrders]);

  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    baseOrders.forEach(o => {
      const s = o.status.toUpperCase();
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [baseOrders]);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

  const revenueData = useMemo(() => {
    const dailyRevenue: Record<string, number> = {};
    filteredOrders.forEach(o => {
      // Simplification: grab date part YYYY-MM-DD
      let d = o.data;
      if (d.includes('T')) d = d.split('T')[0];
      else if (d.includes(' ')) d = d.split(' ')[0];
      
      dailyRevenue[d] = (dailyRevenue[d] || 0) + o.valores.total;
    });
    return Object.entries(dailyRevenue)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, amount]) => ({
        date: date.includes('-') ? date.split('-').slice(1).reverse().join('/') : date,
        revenue: amount
      }))
      .slice(-7); // Last 7 days with sales
  }, [filteredOrders]);

  // Global Lojas Metrics
  const lojasOrdersCount: Record<string, number> = {};
  const lojasRevenue: Record<string, number> = {};
  
  if (!effectiveStoreId) {
    baseOrders.forEach(o => {
      const lojaId = o.lojaId || 'unknown';
      if (o.status.toLowerCase().includes("entregue") || o.status.toLowerCase().includes("pago") || o.status.toLowerCase().includes("enviado") || o.status.toLowerCase().includes("separação")) {
        lojasOrdersCount[lojaId] = (lojasOrdersCount[lojaId] || 0) + 1;
        lojasRevenue[lojaId] = (lojasRevenue[lojaId] || 0) + o.valores.total;
      }
    });
  }

  const lojasMetrics = !effectiveStoreId ? Object.keys(lojasRevenue).map(id => {
    const nome = pharmacies.find(p => p.id === id)?.nome || id;
    const qtd = lojasOrdersCount[id] || 0;
    const revenue = lojasRevenue[id] || 0;
    const ticket = qtd > 0 ? revenue / qtd : 0;
    return { id, nome, qtd, revenue, ticket };
  }).sort((a, b) => b.revenue - a.revenue) : [];

  const topLojas = lojasMetrics.slice(0, 5);

  const handlePrint = (title: string, contentId: string) => {
    const printContent = document.getElementById(contentId);
    const windowUrl = 'about:blank';
    const windowName = 'Print' + new Date().getTime();
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>${title}</title><style>
          body { font-family: sans-serif; padding: 20px; color: #333; }
          h1 { font-size: 24px; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          .list-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        </style></head><body><h1>${title}</h1>${printContent?.innerHTML || ''}
        <script>setTimeout(function(){window.print();window.close();},500);</script></body></html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-emerald-500 text-white p-3 rounded-xl shadow-md shadow-emerald-200">
            <BarChart2 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Central de Relatórios
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              Acompanhe o desempenho {effectiveStoreId ? "da sua loja" : "da rede de farmácias em tempo real"}.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Receita Total</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {totalReceita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pedidos Pagos</span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{qtdPedidos}</div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ticket Médio</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Taxa de Conversão</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{conversaoPedidos}%</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Baseado nos acessos recentes</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Receita */}
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-800 text-lg">Evolução da Receita</h3>
          </div>
          <div className="flex-1 w-full min-h-0">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `R$ ${value}`} 
                  />
                  <Tooltip 
                    formatter={(value: number) => [value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), "Receita"]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">Dados insuficientes para o gráfico.</div>
            )}
          </div>
        </div>

        {/* Gráfico de Status */}
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-slate-800 text-lg">Status dos Pedidos</h3>
          </div>
          <div className="flex-1 w-full min-h-0">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, "Pedidos"]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">Sem pedidos para exibir.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Pedidos (Loja View) */}
        {effectiveStoreId && (
          <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col col-span-1 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-slate-500" />
              <h3 className="font-bold text-slate-800 text-lg">Últimos Pedidos</h3>
            </div>
            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase">Data</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase">Cliente</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="py-3 text-sm text-slate-600 font-medium">{order.data?.split('T')[0]}</td>
                        <td className="py-3 text-sm font-bold text-slate-800">{order.cliente?.nome || "Cliente"}</td>
                        <td className="py-3">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md">
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 text-sm font-black text-emerald-600 text-right">
                          {order.valores?.total?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 font-medium">Nenhum pedido recente.</div>
            )}
          </div>
        )}

        {/* Top Lojas Ranking (Global View) */}
        {!effectiveStoreId && (
          <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col col-span-1 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6 text-slate-800">
              <Medal className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-lg">Ranking de Lojas</h3>
            </div>
            {topLojas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topLojas.map((loja, index) => (
                  <div key={loja.id} className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                      {index + 1}º
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate" title={loja.nome}>{loja.nome}</div>
                      <div className="text-xs text-slate-500 mt-1 font-medium">
                        {loja.qtd} pedidos • {loja.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 font-medium">Sem dados de lojas.</div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

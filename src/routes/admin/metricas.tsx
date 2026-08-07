import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Info, Medal, BarChart2, Printer, Maximize2 } from "lucide-react";
import { useAdmin } from "@/stores/admin";
import { useOrders } from "@/stores/orders";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLive } from "@/stores/live";

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
  
  type ExpandedMetricType = 'pedidos-loja' | 'receita-loja' | 'ticket-loja';
  const [expandedMetric, setExpandedMetric] = useState<ExpandedMetricType | null>(null);

  const handlePrint = (title: string, contentId: string) => {
    const printContent = document.getElementById(contentId);
    const windowUrl = 'about:blank';
    const uniqueName = new Date();
    const windowName = 'Print' + uniqueName.getTime();
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; color: #333; }
              h1 { font-size: 24px; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
              .list-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .name { font-weight: bold; }
              .value { text-align: right; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            ${printContent?.innerHTML || ''}
            <script>
              setTimeout(function() { window.print(); window.close(); }, 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

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

  // Cálculos Reais de Pedidos
  const totalReceita = filteredOrders.reduce((acc, o) => acc + o.valores.total, 0);
  const qtdPedidos = filteredOrders.length;
  const ticketMedio = qtdPedidos > 0 ? totalReceita / qtdPedidos : 0;

  // Conversão de Acessos para Pedidos
  const acessos = totalAcessos || 1; 
  const conversaoPedidos = ((qtdPedidos / acessos) * 100).toFixed(1);

  // Lojas Data Calculations
  const lojasOrdersCount: Record<string, number> = {};
  const lojasRevenue: Record<string, number> = {};
  const lojasTotalBase: Record<string, number> = {};

  baseOrders.forEach(o => {
    const lojaId = o.lojaId || 'unknown';
    lojasTotalBase[lojaId] = (lojasTotalBase[lojaId] || 0) + 1;
    
    if (o.status.toLowerCase().includes("entregue") || o.status.toLowerCase().includes("pago") || o.status.toLowerCase().includes("enviado") || o.status.toLowerCase().includes("separação")) {
      lojasOrdersCount[lojaId] = (lojasOrdersCount[lojaId] || 0) + 1;
      lojasRevenue[lojaId] = (lojasRevenue[lojaId] || 0) + o.valores.total;
    }
  });

  const lojasMetrics = Object.keys(lojasTotalBase).map(id => {
    const nome = pharmacies.find(p => p.id === id)?.nome || id;
    const qtd = lojasOrdersCount[id] || 0;
    const revenue = lojasRevenue[id] || 0;
    const ticket = qtd > 0 ? revenue / qtd : 0;

    return { 
      id, 
      nome, 
      qtd, 
      revenue, 
      ticket, 
      percent: ((revenue / (totalReceita || 1)) * 100).toFixed(0) 
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const topLojas = lojasMetrics.slice(0, 3);

  const renderEmptyState = (text: string) => (
    <div className="flex-1 flex items-center justify-center min-h-[160px]">
      <p className="text-xs font-medium text-slate-400 text-center max-w-[200px]">
        {text}
      </p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-emerald-50 via-white to-teal-50/30 p-6 sm:p-8 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-emerald-500 text-white p-3 rounded-xl shadow-md shadow-emerald-200">
            <BarChart2 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Métricas de Pedidos
            </h1>
            <p className="text-slate-500 mt-1">
              Visão geral de pedidos e faturamento {effectiveStoreId ? "da sua loja" : "da rede de farmácias"}.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Pedidos por Loja */}
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Pedidos {lojaNameText} <Info className="h-3.5 w-3.5" />
          </div>
          {lojasMetrics.length > 0 ? (
            <div className="flex flex-col h-full">
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 mb-4">
                {lojasMetrics.map(loja => (
                  <div key={loja.id} className="flex items-center justify-between border-b pb-2 last:border-0 gap-2">
                    <span className="text-sm font-bold text-slate-700 leading-tight flex-1 break-words min-w-0" title={loja.nome}>{loja.nome}</span>
                    <span className="text-sm font-black text-slate-800 shrink-0">{loja.qtd} pedido(s)</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-auto font-bold text-slate-600" onClick={() => setExpandedMetric('pedidos-loja')}>
                <Maximize2 className="h-4 w-4 mr-2" /> Ver Todos
              </Button>
            </div>
          ) : renderEmptyState("Não houve pedidos no período selecionado.")}
        </div>

        {/* Receita por Loja */}
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Receita {lojaNameText} <Info className="h-3.5 w-3.5" />
          </div>
          {lojasMetrics.length > 0 ? (
            <div className="flex flex-col h-full">
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 mb-4">
                {lojasMetrics.map(loja => (
                  <div key={loja.id} className="flex items-center justify-between border-b pb-2 last:border-0 gap-2">
                    <span className="text-sm font-bold text-slate-700 leading-tight flex-1 break-words min-w-0" title={loja.nome}>{loja.nome}</span>
                    <span className="text-sm font-black text-emerald-600 shrink-0">
                      {loja.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-auto font-bold text-slate-600" onClick={() => setExpandedMetric('receita-loja')}>
                <Maximize2 className="h-4 w-4 mr-2" /> Ver Todos
              </Button>
            </div>
          ) : renderEmptyState("Não houve receita de pedidos no período selecionado.")}
        </div>

        {/* Ticket Médio por Loja */}
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Ticket Médio {lojaNameText.toLowerCase()} <Info className="h-3.5 w-3.5" />
          </div>
          {lojasMetrics.length > 0 ? (
            <div className="flex flex-col h-full">
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 mb-4">
                {lojasMetrics.map(loja => (
                  <div key={loja.id} className="flex items-center justify-between border-b pb-2 last:border-0 gap-2">
                    <span className="text-sm font-bold text-slate-700 leading-tight flex-1 break-words min-w-0" title={loja.nome}>{loja.nome}</span>
                    <span className="text-sm font-black text-blue-600 shrink-0">
                      {loja.ticket.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-auto font-bold text-slate-600" onClick={() => setExpandedMetric('ticket-loja')}>
                <Maximize2 className="h-4 w-4 mr-2" /> Ver Todos
              </Button>
            </div>
          ) : renderEmptyState("Faltam dados para gerar ticket médio.")}
        </div>

        {/* Conversão de Pedidos */}
        {!effectiveStoreId && (
          <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Conversão de Pedidos <Info className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-3xl font-black text-slate-800">{conversaoPedidos}%</h3>
              <div className="bg-slate-50 border border-slate-100 rounded-lg text-[10px] p-2.5 text-slate-500 font-medium">
                <div className="font-bold text-slate-700">{qtdPedidos} PEDIDO(S)</div>
                <div>{acessos} ACESSO(S)</div>
              </div>
            </div>
          </div>
        )}

        {/* Top Pedidos por Loja */}
        {!effectiveStoreId && (
          <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow md:col-span-2">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Top Pedidos por Loja (Ranking) <Info className="h-3.5 w-3.5" />
            </div>
            {topLojas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {topLojas.map((loja) => (
                  <div key={loja.id} className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="bg-orange-100 p-2 rounded-lg shrink-0">
                      <Medal className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate" title={loja.nome}>
                        {loja.nome}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {loja.qtd} pedido(s) • {loja.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : renderEmptyState("Sem dados de pedidos por loja.")}
          </div>
        )}

      </div>

      <Dialog open={!!expandedMetric} onOpenChange={(open) => !open && setExpandedMetric(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-black text-slate-800">
              {expandedMetric === 'pedidos-loja' && `Pedidos ${lojaNameText} (Completo)`}
              {expandedMetric === 'receita-loja' && `Receita ${lojaNameText} (Completo)`}
              {expandedMetric === 'ticket-loja' && `Ticket Médio ${lojaNameText.toLowerCase()} (Completo)`}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              className="mr-6 font-bold flex items-center gap-2 text-slate-700"
              onClick={() => {
                const title = 
                  expandedMetric === 'pedidos-loja' ? `Pedidos ${lojaNameText}` :
                  expandedMetric === 'receita-loja' ? `Receita ${lojaNameText}` :
                  `Ticket Médio ${lojaNameText.toLowerCase()}`;
                handlePrint(title, 'print-container');
              }}
            >
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
          </DialogHeader>

          <div id="print-container" className="flex-1 overflow-y-auto pr-2 mt-4 space-y-1">
            {expandedMetric === 'pedidos-loja' && lojasMetrics.map(loja => (
              <div key={loja.id} className="list-item flex items-center justify-between border-b pb-2 pt-2 last:border-0 gap-2">
                <span className="name text-sm font-bold text-slate-700 flex-1 break-words min-w-0">{loja.nome}</span>
                <span className="value text-sm font-black text-slate-800 shrink-0">{loja.qtd} pedido(s)</span>
              </div>
            ))}
            {expandedMetric === 'receita-loja' && lojasMetrics.map(loja => (
              <div key={loja.id} className="list-item flex items-center justify-between border-b pb-2 pt-2 last:border-0 gap-2">
                <span className="name text-sm font-bold text-slate-700 flex-1 break-words min-w-0">{loja.nome}</span>
                <span className="value text-sm font-black text-emerald-600 shrink-0">{loja.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
            ))}
            {expandedMetric === 'ticket-loja' && lojasMetrics.map(loja => (
              <div key={loja.id} className="list-item flex items-center justify-between border-b pb-2 pt-2 last:border-0 gap-2">
                <span className="name text-sm font-bold text-slate-700 flex-1 break-words min-w-0">{loja.nome}</span>
                <span className="value text-sm font-black text-blue-600 shrink-0">{loja.ticket.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

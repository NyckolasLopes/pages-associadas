import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Info, Medal, TrendingDown, TrendingUp, BarChart2, Printer, Maximize2, ShoppingBag } from "lucide-react";
import { useAdmin } from "@/stores/admin";
import { useOrders } from "@/stores/orders";
import { useAdminProducts } from "@/stores/products";
import { isCampanhaAtiva } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLive } from "@/stores/live";

export const Route = createFileRoute("/admin/metricas")({
  component: Metricas,
});

function Metricas() {
  const { pharmacies, activeStoreId, currentUser, grupos } = useAdmin();
  const { customProducts } = useAdminProducts();
  const { orders } = useOrders();
  const { totalAcessos } = useLive();
  const selectedLoja = activeStoreId || "all";
  
  const isGlobalAdmin = () => {
    if (currentUser?.proprietario) return true;
    const userGroup = grupos.find(g => g.id === currentUser?.grupoId);
    return userGroup?.permissao_total || false;
  };

  const lojaNameText = (activeStoreId && !isGlobalAdmin()) ? "da Loja" : "por Loja";
  
  type ExpandedMetricType = 'pedidos-loja' | 'receita-loja' | 'ticket-loja' | 'cancelados-loja' | 'encarte-produtos';
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
  
  const pedidosCancelados = baseOrders.filter(o => o.status.toLowerCase().includes("cancelado")).length;
  const taxaCancelados = baseOrders.length > 0 ? ((pedidosCancelados / baseOrders.length) * 100).toFixed(0) : "0";

  const pedidosPix = filteredOrders.filter(o => o.pagamento.metodo.toLowerCase().includes("pix"));
  const taxaPix = qtdPedidos > 0 ? ((pedidosPix.length / qtdPedidos) * 100).toFixed(0) : "0";

  let faturamentoEncarte = 0;
  let itensEncarte = 0;
  const pedidosEncarteSet = new Set<string>();
  const produtosEncarteMap: Record<string, { nome: string, qtd: number, total: number }> = {};

  filteredOrders.forEach(o => {
    o.produtos.forEach(p => {
      const cp = customProducts.find(prod => prod.sku === p.sku || prod.ean === p.sku || prod.nome === p.nome);
      if (cp && isCampanhaAtiva(cp)) {
        faturamentoEncarte += (p.valorUnitario * p.qtd);
        itensEncarte += p.qtd;
        pedidosEncarteSet.add(o.id);
        
        if (!produtosEncarteMap[p.nome]) {
          produtosEncarteMap[p.nome] = { nome: p.nome, qtd: 0, total: 0 };
        }
        produtosEncarteMap[p.nome].qtd += p.qtd;
        produtosEncarteMap[p.nome].total += (p.valorUnitario * p.qtd);
      }
    });
  });

  const topProdutosEncarte = Object.values(produtosEncarteMap).sort((a, b) => b.qtd - a.qtd);
  const topProdutosEncarteList = topProdutosEncarte.slice(0, 3);

  // Conversão de Acessos para Pedidos
  const acessos = totalAcessos || 1; 
  const conversaoPedidos = ((qtdPedidos / acessos) * 100).toFixed(1);

  // Lojas Data Calculations
  const lojasOrdersCount: Record<string, number> = {};
  const lojasRevenue: Record<string, number> = {};
  const lojasCanceled: Record<string, number> = {};
  const lojasTotalBase: Record<string, number> = {};

  baseOrders.forEach(o => {
    const lojaId = o.lojaId || 'unknown';
    lojasTotalBase[lojaId] = (lojasTotalBase[lojaId] || 0) + 1;
    if (o.status.toLowerCase().includes("cancelado")) {
      lojasCanceled[lojaId] = (lojasCanceled[lojaId] || 0) + 1;
    }
    
    if (o.status.toLowerCase().includes("entregue") || o.status.toLowerCase().includes("pago") || o.status.toLowerCase().includes("enviado") || o.status.toLowerCase().includes("separação")) {
      lojasOrdersCount[lojaId] = (lojasOrdersCount[lojaId] || 0) + 1;
      lojasRevenue[lojaId] = (lojasRevenue[lojaId] || 0) + o.valores.total;
    }
  });

  const lojasMetrics = Object.keys(lojasTotalBase).map(id => {
    const nome = pharmacies.find(p => p.id === id)?.nome || id;
    const qtd = lojasOrdersCount[id] || 0;
    const revenue = lojasRevenue[id] || 0;
    const canceled = lojasCanceled[id] || 0;
    const baseTotal = lojasTotalBase[id] || 0;
    const ticket = qtd > 0 ? revenue / qtd : 0;
    const cancelRate = baseTotal > 0 ? ((canceled / baseTotal) * 100).toFixed(0) : "0";

    return { 
      id, 
      nome, 
      qtd, 
      revenue, 
      ticket, 
      cancelRate, 
      canceled, 
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
              Visão geral de pedidos e faturamento {activeStoreId ? "da sua loja" : "da rede de farmácias"}.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Pedidos por Encarte (Faturamento) */}
        <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-100 rounded-full blur-2xl opacity-50"></div>
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-orange-600 uppercase tracking-wider relative z-10">
            Pedidos por Encarte (Faturamento) <Info className="h-3.5 w-3.5" />
          </div>
          <div className="relative z-10">
            <span className="text-3xl font-black text-slate-800 tracking-tight">
              {faturamentoEncarte.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              <span className="font-bold text-orange-600">{pedidosEncarteSet.size}</span> pedidos realizados
            </div>
          </div>
        </div>

        {/* Pedidos por Encarte (Produtos) */}
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Pedidos por Encarte (Produtos) <Info className="h-3.5 w-3.5" />
          </div>
          {topProdutosEncarteList.length > 0 ? (
            <div className="flex flex-col h-full">
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 mb-4">
                <div className="text-[11px] text-slate-500 font-medium border-b pb-2">
                  Total de <span className="font-bold text-orange-600">{itensEncarte}</span> itens pedidos
                </div>
                {topProdutosEncarteList.map(p => (
                  <div key={p.nome} className="flex items-center justify-between border-b pb-2 last:border-0 gap-2">
                    <span className="text-sm font-bold text-slate-700 leading-tight flex-1 break-words min-w-0" title={p.nome}>{p.nome}</span>
                    <span className="text-sm font-black text-slate-800 shrink-0">{p.qtd} unid.</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-auto font-bold text-slate-600" onClick={() => setExpandedMetric('encarte-produtos')}>
                <Maximize2 className="h-4 w-4 mr-2" /> Ver Todos
              </Button>
            </div>
          ) : renderEmptyState("Nenhum produto pedido em encarte.")}
        </div>

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

        {/* Conversão de Pedidos */}
        {!activeStoreId && (
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

        {/* Taxa de Pedidos Cancelados por Loja */}
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Taxa de Pedidos Cancelados {lojaNameText.toLowerCase()} <Info className="h-3.5 w-3.5" />
          </div>
          {lojasMetrics.length > 0 ? (
            <div className="flex flex-col h-full">
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 mb-4">
                {lojasMetrics.map(loja => (
                  <div key={loja.id} className="flex items-center justify-between border-b pb-2 last:border-0 gap-2">
                    <div className="flex flex-col flex-1 overflow-hidden pr-2">
                      <span className="text-sm font-bold text-slate-700 leading-tight break-words min-w-0" title={loja.nome}>{loja.nome}</span>
                      <span className="text-[10px] text-slate-500">{loja.canceled} cancelado(s)</span>
                    </div>
                    <span className="text-sm font-black text-red-500 shrink-0">{loja.cancelRate}%</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-auto font-bold text-slate-600" onClick={() => setExpandedMetric('cancelados-loja')}>
                <Maximize2 className="h-4 w-4 mr-2" /> Ver Todos
              </Button>
            </div>
          ) : renderEmptyState("Sem pedidos para avaliar cancelamentos.")}
        </div>

        {/* Taxa de Conversão por Pix */}
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Taxa de Conversão por Pix <Info className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-3xl font-black text-slate-800">{taxaPix}%</h3>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] text-slate-500 font-semibold">
              <div className="h-6 w-6 bg-emerald-100/50 flex items-center justify-center rounded-md text-emerald-600 text-sm">💠</div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-700">{pedidosPix.length} PAGOS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Pedidos por Loja */}
        {!activeStoreId && (
          <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow md:col-span-4">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Top Pedidos por Loja (Ranking) <Info className="h-3.5 w-3.5" />
            </div>
            {topLojas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {topLojas.map((loja, idx) => (
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
              {expandedMetric === 'cancelados-loja' && `Taxa de Pedidos Cancelados ${lojaNameText.toLowerCase()} (Completo)`}
              {expandedMetric === 'encarte-produtos' && 'Pedidos por Encarte - Produtos (Completo)'}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              className="mr-6 font-bold flex items-center gap-2 text-slate-700"
              onClick={() => {
                const title = 
                  expandedMetric === 'pedidos-loja' ? `Pedidos ${lojaNameText}` :
                  expandedMetric === 'receita-loja' ? `Receita ${lojaNameText}` :
                  expandedMetric === 'ticket-loja' ? `Ticket Médio ${lojaNameText.toLowerCase()}` :
                  expandedMetric === 'cancelados-loja' ? `Taxa de Pedidos Cancelados ${lojaNameText.toLowerCase()}` :
                  'Pedidos por Encarte - Produtos';
                handlePrint(title, 'print-container');
              }}
            >
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
          </DialogHeader>

          <div id="print-container" className="flex-1 overflow-y-auto pr-2 mt-4 space-y-1">
            {expandedMetric === 'encarte-produtos' && topProdutosEncarte.map(p => (
              <div key={p.nome} className="list-item flex items-center justify-between border-b pb-2 pt-2 last:border-0 gap-2">
                <span className="name text-sm font-bold text-slate-700 flex-1 break-words min-w-0">{p.nome}</span>
                <span className="value text-sm font-black text-slate-800 shrink-0">{p.qtd} unid.</span>
              </div>
            ))}
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
            {expandedMetric === 'cancelados-loja' && lojasMetrics.map(loja => (
              <div key={loja.id} className="list-item flex items-center justify-between border-b pb-2 pt-2 last:border-0 gap-2">
                <span className="name text-sm font-bold text-slate-700 flex-1 break-words min-w-0">{loja.nome}</span>
                <span className="value text-sm font-black text-red-500 shrink-0">{loja.cancelRate}% ({loja.canceled} cancelados)</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

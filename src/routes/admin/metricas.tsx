import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Info, Medal, ShoppingCart, TrendingDown, TrendingUp, BarChart2, Printer, Maximize2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useAdmin } from "@/stores/admin";
import { useOrders } from "@/stores/orders";
import { useAdminProducts } from "@/stores/products";
import { isCampanhaAtiva } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCart } from "@/stores/cart";
import { useLive } from "@/stores/live";
import { useAbandonedCartsStore } from "@/stores/abandoned-carts";
import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";

export const Route = createFileRoute("/admin/metricas")({
  component: Metricas,
});

const COLORS = ["#059669", "#3b82f6", "#f59e0b", "#22c55e", "#ef4444", "#8b5cf6"];

function Metricas() {
  const { pharmacies, activeStoreId, currentUser, grupos } = useAdmin();
  const { customProducts } = useAdminProducts();
  const { orders } = useOrders();
  const { items: cartItems } = useCart();
  const { totalAcessos } = useLive();
  const selectedLoja = activeStoreId || "all";
  
  const isGlobalAdmin = () => {
    if (currentUser?.proprietario) return true;
    const userGroup = grupos.find(g => g.id === currentUser?.grupoId);
    return userGroup?.permissao_total || false;
  };

  const lojaNameText = (activeStoreId && !isGlobalAdmin()) ? "da Loja" : "por Loja";
  
  type ExpandedMetricType = 'vendas-loja' | 'receita-loja' | 'ticket-loja' | 'cancelados-loja' | 'encarte-produtos';
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

  // Cálculos Reais
  const totalVendas = filteredOrders.reduce((acc, o) => acc + o.valores.total, 0);
  const qtdPedidos = filteredOrders.length;
  const ticketMedio = qtdPedidos > 0 ? totalVendas / qtdPedidos : 0;
  
  const pedidosCancelados = baseOrders.filter(o => o.status.toLowerCase().includes("cancelado")).length;
  const taxaCancelados = baseOrders.length > 0 ? ((pedidosCancelados / baseOrders.length) * 100).toFixed(0) : "0";

  const pedidosPix = filteredOrders.filter(o => o.pagamento.metodo.toLowerCase().includes("pix"));
  const taxaPix = qtdPedidos > 0 ? ((pedidosPix.length / qtdPedidos) * 100).toFixed(0) : "0";

  const pagamentosOnlineMap: Record<string, number> = {};
  const pagamentosLojaMap: Record<string, number> = {};
  filteredOrders.forEach(o => {
    const met = o.pagamento.metodo;
    const metLower = met.toLowerCase();
    const isOffline = metLower.includes("maquininha") || metLower.includes("dinheiro") || metLower.includes("crediário") || metLower.includes("convênio") || metLower.includes("presencial");
    
    if (isOffline) {
      pagamentosLojaMap[met] = (pagamentosLojaMap[met] || 0) + 1;
    } else {
      pagamentosOnlineMap[met] = (pagamentosOnlineMap[met] || 0) + 1;
    }
  });
  const pieDataOnline = Object.keys(pagamentosOnlineMap).map(k => ({ name: k, value: pagamentosOnlineMap[k] }));
  const pieDataLoja = Object.keys(pagamentosLojaMap).map(k => ({ name: k, value: pagamentosLojaMap[k] }));
  const allPieData = [...pieDataOnline, ...pieDataLoja].sort((a, b) => b.value - a.value);
  const topPayment = allPieData[0]?.name || "Nenhuma";

  let vendasEncarte = 0;
  let itensEncarte = 0;
  const pedidosEncarteSet = new Set<string>();
  const produtosEncarteMap: Record<string, { nome: string, qtd: number, total: number }> = {};

  const categoriaMap: Record<string, { faturamento: number, unidades: number }> = {};
  filteredOrders.forEach(o => {
    o.produtos.forEach(p => {
      // Busca o produto no catálogo para obter sua categoria real
      const catalogProduct = (productsData as any[]).find(prod => prod.ean === p.sku || prod.nome === p.nome);
      
      const cp = customProducts.find(prod => prod.sku === p.sku || prod.ean === p.sku || prod.nome === p.nome);
      if (cp && isCampanhaAtiva(cp)) {
        vendasEncarte += (p.valorUnitario * p.qtd);
        itensEncarte += p.qtd;
        pedidosEncarteSet.add(o.id);
        
        if (!produtosEncarteMap[p.nome]) {
          produtosEncarteMap[p.nome] = { nome: p.nome, qtd: 0, total: 0 };
        }
        produtosEncarteMap[p.nome].qtd += p.qtd;
        produtosEncarteMap[p.nome].total += (p.valorUnitario * p.qtd);
      }
      
      let catNome = "Outros";
      if (catalogProduct) {
        // Prioriza a subcategoria se existir, senão usa a categoria principal
        const catId = catalogProduct.subcategoriaId || catalogProduct.categoriaId;
        if (catId) {
          const categoryInfo = (categoriesData as any[]).find(c => c.id === catId);
          if (categoryInfo) {
            catNome = categoryInfo.nome;
          }
        }
      }
      
      if (!categoriaMap[catNome]) {
        categoriaMap[catNome] = { faturamento: 0, unidades: 0 };
      }
      categoriaMap[catNome].faturamento += (p.valorUnitario * p.qtd);
      categoriaMap[catNome].unidades += p.qtd;
    });
  });
  
  const pieDataCategoria = Object.keys(categoriaMap)
    .filter(k => k !== "Outros")
    .map(k => ({ 
      name: k, 
      "Valor do faturamento": categoriaMap[k].faturamento,
      "Unidades": categoriaMap[k].unidades
    }))
    .sort((a, b) => b["Valor do faturamento"] - a["Valor do faturamento"]);

  const topProdutosMap: Record<string, { nome: string, qtd: number, total: number }> = {};
  filteredOrders.forEach(o => {
    o.produtos.forEach(p => {
      if (!topProdutosMap[p.nome]) {
        topProdutosMap[p.nome] = { nome: p.nome, qtd: 0, total: 0 };
      }
      topProdutosMap[p.nome].qtd += p.qtd;
      topProdutosMap[p.nome].total += (p.valorUnitario * p.qtd);
    });
  });
  const topProdutos = Object.values(topProdutosMap).sort((a, b) => b.qtd - a.qtd);
  const topProdutosList = topProdutos.slice(0, 3);
  
  const topProdutosEncarte = Object.values(produtosEncarteMap).sort((a, b) => b.qtd - a.qtd);
  const topProdutosEncarteList = topProdutosEncarte.slice(0, 3);

  // Conversão do checkout
  const acessos = totalAcessos || 1; 
  const conversaoCheckout = ((qtdPedidos / acessos) * 100).toFixed(1);

  // Conversão de Boletos
  const pedidosBoleto = filteredOrders.filter(o => o.pagamento.metodo.toLowerCase().includes("boleto"));
  const taxaBoleto = qtdPedidos > 0 ? ((pedidosBoleto.length / qtdPedidos) * 100).toFixed(0) : "0";

  // Lojas Data Calculations
  const lojasOrdersCount: Record<string, number> = {};
  const lojasRevenue: Record<string, number> = {};
  const lojasCanceled: Record<string, number> = {};
  const lojasClientesMap: Record<string, Record<string, number>> = {};
  const lojasTotalBase: Record<string, number> = {};

  baseOrders.forEach(o => {
    const lojaId = o.lojaId || 'unknown';
    lojasTotalBase[lojaId] = (lojasTotalBase[lojaId] || 0) + 1;
    if (o.status.toLowerCase().includes("cancelado")) {
      lojasCanceled[lojaId] = (lojasCanceled[lojaId] || 0) + 1;
    }
    
    if (o.status.toLowerCase().includes("entregue")) {
      lojasOrdersCount[lojaId] = (lojasOrdersCount[lojaId] || 0) + 1;
      lojasRevenue[lojaId] = (lojasRevenue[lojaId] || 0) + o.valores.total;
      
      const email = o.cliente?.email || "anon";
      if (!lojasClientesMap[lojaId]) lojasClientesMap[lojaId] = {};
      lojasClientesMap[lojaId][email] = (lojasClientesMap[lojaId][email] || 0) + 1;
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
    
    // Clientes recorrentes da loja
    const cMap = lojasClientesMap[id] || {};
    const recCount = Object.values(cMap).filter(v => (v as number) > 1).length;
    const totalClients = Object.keys(cMap).length;
    const recurrentRate = totalClients > 0 ? ((recCount / totalClients) * 100).toFixed(0) : "0";

    return { id, nome, qtd, revenue, ticket, cancelRate, canceled, recCount, recurrentRate, percent: ((revenue / (totalVendas || 1)) * 100).toFixed(0) };
  }).sort((a, b) => b.revenue - a.revenue);

  const topLojas = lojasMetrics.slice(0, 3);

  // Parcelamentos
  const pedidosCredito = filteredOrders.filter(o => o.pagamento.metodo.toLowerCase().includes("crédito") || o.pagamento.metodo.toLowerCase().includes("cartão"));
  const comParcelas = pedidosCredito.filter(o => (o.pagamento.parcelas || 1) > 1);
  const taxaParcelamento = pedidosCredito.length > 0 ? ((comParcelas.length / pedidosCredito.length) * 100).toFixed(0) : "0";

  // Carrinhos Abandonados
  const storeCarts = useAbandonedCartsStore(s => s.carts);
  const carrinhosAbandonados = storeCarts.length + (cartItems.length > 0 ? 1 : 0);

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
              Métricas de Vendas
            </h1>
            <p className="text-slate-500 mt-1">
              Visão geral de desempenho {activeStoreId ? "da sua loja" : "da rede de farmácias"}.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Vendas por Encarte (Faturamento) */}
        <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-100 rounded-full blur-2xl opacity-50"></div>
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-orange-600 uppercase tracking-wider relative z-10">
            Vendas por Encarte (Faturamento) <Info className="h-3.5 w-3.5" />
          </div>
          <div className="relative z-10">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{vendasEncarte.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              <span className="font-bold text-orange-600">{pedidosEncarteSet.size}</span> pedidos realizados
            </div>
          </div>
        </div>

        {/* Vendas por Encarte (Produtos Vendidos) */}
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Vendas por Encarte (Produtos) <Info className="h-3.5 w-3.5" />
          </div>
          {topProdutosEncarteList.length > 0 ? (
            <div className="flex flex-col h-full">
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 mb-4">
                <div className="text-[11px] text-slate-500 font-medium border-b pb-2">
                  Total de <span className="font-bold text-orange-600">{itensEncarte}</span> itens vendidos
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
          ) : renderEmptyState("Nenhum produto vendido.")}
        </div>

        {/* Vendas por Loja */}
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Vendas {lojaNameText} <Info className="h-3.5 w-3.5" />
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
              <Button variant="outline" size="sm" className="w-full mt-auto font-bold text-slate-600" onClick={() => setExpandedMetric('vendas-loja')}>
                <Maximize2 className="h-4 w-4 mr-2" /> Ver Todos
              </Button>
            </div>
          ) : renderEmptyState("Não houve vendas no período selecionado.")}
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
          ) : renderEmptyState("Não houve pedidos pagos no período selecionado.")}
        </div>

        {/* Conversão do Checkout */}
        {!activeStoreId && (
          <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Conversão do Checkout <Info className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-3xl font-black text-slate-800">{conversaoCheckout}%</h3>
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

        {/* Carrinhos Abandonados */}
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Carrinhos Abandonados {lojaNameText.toLowerCase()} <Info className="h-3.5 w-3.5" />
          </div>
          {carrinhosAbandonados > 0 ? (
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-3xl font-black text-slate-800">{carrinhosAbandonados}</h3>
              <div className="bg-orange-50 border border-orange-100 rounded-lg text-[10px] p-2.5 text-orange-600 font-bold uppercase">
                Aguardando Conversão
              </div>
            </div>
          ) : renderEmptyState("Não foram identificados carrinhos abandonados.")}
        </div>

        {/* Formas de Pagamento */}
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow md:col-span-2">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Formas de Pagamento {lojaNameText.toLowerCase()} <Info className="h-3.5 w-3.5" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div>
              <h4 className="text-sm font-bold text-slate-700 text-center mb-2">Online</h4>
              {pieDataOnline.length > 0 ? (
                <div className="h-40 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieDataOnline}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={60}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieDataOnline.map((entry, index) => (
                          <Cell key={`cell-on-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : renderEmptyState("Sem pagamentos online.")}
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-700 text-center mb-2">Na Loja</h4>
              {pieDataLoja.length > 0 ? (
                <div className="h-40 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieDataLoja}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={60}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieDataLoja.map((entry, index) => (
                          <Cell key={`cell-off-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : renderEmptyState("Sem pagamentos na loja.")}
            </div>
          </div>
          
          <p className="text-xs text-slate-600 font-medium mt-auto text-center pt-4">
            Forma de pagamento mais utilizada (geral): {topPayment}
          </p>
        </div>

        {/* Top Vendas por Loja */}
        {!activeStoreId && (
          <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Top Vendas por Loja <Info className="h-3.5 w-3.5" />
            </div>
            {topLojas.length > 0 ? (
              <div className="space-y-3 mt-4">
                {topLojas.map((loja, idx) => (
                  <div key={loja.id} className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Medal className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="flex-1 bg-emerald-100 min-h-[32px] h-auto py-1.5 rounded-md flex items-center justify-between px-3 text-[11px] font-bold text-emerald-900 shadow-sm relative overflow-hidden gap-2">
                      <div className="absolute left-0 top-0 bottom-0 bg-emerald-200/50" style={{ width: `${loja.percent}%` }}></div>
                      <span className="relative z-10 leading-tight flex-1 break-words min-w-0" title={loja.nome}>{loja.nome}</span>
                      <span className="relative z-10 shrink-0">{loja.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : renderEmptyState("Sem dados de vendas por loja.")}
          </div>
        )}

        {/* Parcelamentos */}
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Parcelamentos {lojaNameText.toLowerCase()} <Info className="h-3.5 w-3.5" />
          </div>
          {pedidosCredito.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-3xl font-black text-slate-800">{taxaParcelamento}%</h3>
              <p className="text-xs text-slate-500 font-semibold mt-2">{comParcelas.length} de {pedidosCredito.length} pagamentos no cartão parcelados</p>
            </div>
          ) : renderEmptyState("Não houve pagamentos no crédito no período selecionado.")}
        </div>

        {/* Taxa de Clientes Recorrentes por Loja */}
        {!activeStoreId ? (
          <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Taxa de Clientes Recorrentes por Loja <Info className="h-3.5 w-3.5" />
            </div>
            {lojasMetrics.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-[200px] pr-2">
                {lojasMetrics.map(loja => (
                  <div key={loja.id} className="flex items-center justify-between border-b pb-2 last:border-0 gap-2">
                    <div className="flex flex-col flex-1 overflow-hidden pr-2">
                      <span className="text-sm font-bold text-slate-700 leading-tight break-words min-w-0" title={loja.nome}>{loja.nome}</span>
                      <span className="text-[10px] text-slate-500">{loja.recCount} recorrentes</span>
                    </div>
                    <span className="text-sm font-black text-indigo-600 shrink-0">{loja.recurrentRate}%</span>
                  </div>
                ))}
              </div>
            ) : renderEmptyState("Não houve clientes recorrentes no período selecionado.")}
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Taxa de Clientes Recorrentes da Loja <Info className="h-3.5 w-3.5" />
            </div>
            {lojasMetrics.length > 0 && lojasMetrics[0] ? (
              <div className="mb-6 flex items-center justify-between mt-4">
                <h3 className="text-3xl font-black text-slate-800">{lojasMetrics[0].recurrentRate}%</h3>
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] p-2.5 text-indigo-600 font-bold uppercase">
                  {lojasMetrics[0].recCount} Recorrentes
                </div>
              </div>
            ) : renderEmptyState("Não houve clientes recorrentes na loja.")}
          </div>
        )}

        {/* Vendas por Categoria */}
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col md:col-span-3 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Vendas por Categoria {lojaNameText.toLowerCase()} <Info className="h-3.5 w-3.5" />
          </div>
          {pieDataCategoria.length > 0 ? (
            <div className="h-64 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pieDataCategoria} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `R$ ${val}`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val} un.`} />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === "Valor do faturamento") return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                      return `${value} un.`;
                    }}
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar yAxisId="left" dataKey="Valor do faturamento" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar yAxisId="right" dataKey="Unidades" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : renderEmptyState("Sem dados de vendas por categoria.")}
        </div>

        {/* Top Produtos */}
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col md:col-span-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Top Produtos {lojaNameText.toLowerCase()} <Info className="h-3.5 w-3.5" />
          </div>
          {topProdutosList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topProdutosList.map((prod, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 transition-colors hover:bg-slate-100/80">
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-200' : idx === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600 shadow-slate-200' : 'bg-gradient-to-br from-amber-700 to-amber-900 shadow-orange-200'}`}>
                      {idx + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-sm font-bold text-slate-800 truncate" title={prod.nome}>
                      {prod.nome}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold uppercase tracking-widest">
                        {prod.qtd} Vendido(s)
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-black text-emerald-600 tracking-tight">
                      {prod.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : renderEmptyState("Nenhum produto vendido.")}
        </div>

      </div>

      <Dialog open={!!expandedMetric} onOpenChange={(open) => !open && setExpandedMetric(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-black text-slate-800">
              {expandedMetric === 'vendas-loja' && `Vendas ${lojaNameText} (Completo)`}
              {expandedMetric === 'receita-loja' && `Receita ${lojaNameText} (Completo)`}
              {expandedMetric === 'ticket-loja' && `Ticket Médio ${lojaNameText.toLowerCase()} (Completo)`}
              {expandedMetric === 'cancelados-loja' && `Taxa de Pedidos Cancelados ${lojaNameText.toLowerCase()} (Completo)`}
              {expandedMetric === 'encarte-produtos' && 'Vendas por Encarte - Produtos (Completo)'}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              className="mr-6 font-bold flex items-center gap-2 text-slate-700"
              onClick={() => {
                const title = 
                  expandedMetric === 'vendas-loja' ? `Vendas ${lojaNameText}` :
                  expandedMetric === 'receita-loja' ? `Receita ${lojaNameText}` :
                  expandedMetric === 'ticket-loja' ? `Ticket Médio ${lojaNameText.toLowerCase()}` :
                  expandedMetric === 'cancelados-loja' ? `Taxa de Pedidos Cancelados ${lojaNameText.toLowerCase()}` :
                  'Vendas por Encarte - Produtos';
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
            {expandedMetric === 'vendas-loja' && lojasMetrics.map(loja => (
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

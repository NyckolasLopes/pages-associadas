import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { 
  BarChart3, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  Store, 
  TrendingUp, 
  Phone, 
  Calendar, 
  Layers, 
  Filter, 
  Search, 
  Printer, 
  ExternalLink, 
  Eye, 
  AlertCircle,
  MapPin,
  ChevronRight,
  PackageCheck,
  Percent,
  X
} from "lucide-react";
import { useAdmin } from "@/stores/admin";
import { useOrders, Pedido } from "@/stores/orders";
import { useAbandonedCartsStore, AbandonedCart } from "@/stores/abandoned-carts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from "recharts";

export const Route = createFileRoute("/admin/metricas")({
  component: Metricas,
});

export type UnifiedOrderStatus = "Concluído" | "Pendente" | "Cancelado";

export interface UnifiedOrder {
  id: string;
  data: string;
  dataOriginal: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail?: string;
  clienteEndereco?: string;
  lojaId: string;
  lojaNome: string;
  lojaCidadeUf: string;
  status: UnifiedOrderStatus;
  statusDesc: string;
  origem: string;
  itensQtd: number;
  valorTotal: number;
  itens: Array<{ nome: string; qtd: number; valorUnitario?: number; foto?: string }>;
  pagamentoMetodo?: string;
  modalidade?: string;
  tipoRegistro: "pedido" | "carrinho";
}

function getUnifiedOrderStatus(order: { status?: string; origem?: string; type?: string }): { label: UnifiedOrderStatus; desc: string } {
  const statusStr = (order.status || "").toLowerCase();
  const origemStr = (order.origem || "").toLowerCase();

  // Cancelados
  if (statusStr.includes("cancelad") || statusStr === "recusado") {
    return { label: "Cancelado", desc: "Cancelado" };
  }

  // Carrinho abandonado / Aguardando pagamento -> Pendente
  if (statusStr === "abandonado no carrinho" || origemStr === "carrinho") {
    return { label: "Pendente", desc: "Abandonado no carrinho" };
  }

  // Qualquer pedido real finalizado via site (que vai pro WhatsApp) é Concluído
  return { label: "Concluído", desc: "WhatsApp / Concluído" };
}

function Metricas() {
  const { currentUser, pharmacies, activeStoreId, grupos } = useAdmin();
  const isGlobalAdmin = currentUser?.proprietario || (typeof grupos !== 'undefined' && grupos?.find(g => g.id === currentUser?.grupoId)?.permissao_total) || currentUser?.lojasVinculadas === undefined;
  
  // Se for administrador global, o painel padrão é a visão geral de todas as lojas (effectiveStoreId = null)
  // Se houver activeStoreId selecionado explicitamente ou usuário de loja vinculada, foca na loja
  const effectiveStoreId = activeStoreId || (!isGlobalAdmin && currentUser?.lojasVinculadas?.[0]) || null;
  const isGlobalView = !effectiveStoreId;

  const { orders: rawOrders } = useOrders();
  const { carts: rawCarts } = useAbandonedCartsStore();

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"todos" | "Concluído" | "Pendente" | "Cancelado">("todos");
  const [selectedLojaFilter, setSelectedLojaFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<UnifiedOrder | null>(null);

  // Unificação inteligente de Pedidos + Carrinhos Abandonados
  const allUnifiedOrders = useMemo<UnifiedOrder[]>(() => {
    const list: UnifiedOrder[] = [];
    const seenIds = new Set<string>();

    const normalizeLojaId = (id?: string) => {
      if (id === "1") return "loja-poa-centro";
      if (id === "2") return "loja-poa-zonasul";
      if (id === "3") return "loja-caxias-centro";
      if (id === "4") return "loja-caxias-pioneiro";
      return id;
    };

    // 1. Processa pedidos normais
    (rawOrders || []).forEach(order => {
      seenIds.add(order.id);
      const safeLojaId = normalizeLojaId(order.lojaId) || "loja-poa-centro";
      const lojaObj = pharmacies.find(p => p.id === safeLojaId);
      const { label, desc } = getUnifiedOrderStatus({ status: order.status, origem: order.origem });
      
      const orderItems = (order.itens || order.produtos || []).map(i => ({
        nome: i.nome,
        qtd: i.quantidade || i.qtd || 1,
        valorUnitario: i.valorUnitario || i.preco,
        foto: i.foto || i.imagem
      }));

      const totalItemsCount = orderItems.reduce((acc, it) => acc + (it.qtd || 1), 0) || 1;

      let dateFormatted = order.data;
      try {
        const d = new Date(order.data);
        if (!isNaN(d.getTime())) {
          dateFormatted = `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        }
      } catch {
        dateFormatted = order.data;
      }

      // Formata método de pagamento escolhido pelo cliente no pedido finalizado
      let paymentLabel = order.pagamento?.metodo;
      if (paymentLabel) {
        const pLower = paymentLabel.toLowerCase();
        if (pLower === "pix") paymentLabel = "Pix";
        else if (pLower === "credito" || pLower === "cartao_credito") paymentLabel = "Cartão de Crédito";
        else if (pLower === "debito" || pLower === "cartao_debito") paymentLabel = "Cartão de Débito";
        else if (pLower === "dinheiro") paymentLabel = "Dinheiro na Entrega";
        else if (pLower === "vale_refeicao") paymentLabel = "Vale Refeição / Alimentação";
        
        if (order.pagamento?.parcelas && order.pagamento.parcelas > 1) {
          paymentLabel += ` (${order.pagamento.parcelas}x)`;
        }
        if (order.pagamento?.trocoPara) {
          paymentLabel += ` (Troco para R$ ${order.pagamento.trocoPara})`;
        }
      }

      list.push({
        id: order.id,
        data: dateFormatted,
        dataOriginal: order.data,
        clienteNome: order.cliente?.nome || "Cliente",
        clienteTelefone: order.cliente?.telefone || "Não informado",
        clienteEmail: order.cliente?.email,
        clienteEndereco: order.cliente?.endereco ? `${order.cliente.endereco.rua}, ${order.cliente.endereco.numero} - ${order.cliente.endereco.bairro}` : undefined,
        lojaId: safeLojaId,
        lojaNome: lojaObj?.nome || order.lojaNome || "Farmácias Associadas",
        lojaCidadeUf: lojaObj ? `${lojaObj.cidade}/${lojaObj.uf}` : "POA/RS",
        status: label,
        statusDesc: desc,
        origem: order.origem || "site",
        itensQtd: totalItemsCount,
        valorTotal: order.valores?.total || 0,
        itens: orderItems,
        pagamentoMetodo: paymentLabel,
        modalidade: order.modalidade || (order.envio?.metodo === "entrega" ? "Entrega" : "Retirada"),
        tipoRegistro: "pedido"
      });
    });

    // 2. Processa carrinhos abandonados (como pedidos Pendentes no carrinho - sem forma de pagamento escolhida)
    (rawCarts || []).forEach(cart => {
      if (seenIds.has(cart.id)) return;
      const safeLojaId = normalizeLojaId(cart.lojaId) || "loja-poa-centro";
      const lojaObj = pharmacies.find(p => p.id === safeLojaId);
      
      const cartItems = (cart.items || []).map(i => ({
        nome: i.nome,
        qtd: i.qtd || 1,
        valorUnitario: i.valorUnitario,
        foto: i.foto
      }));

      const totalItemsCount = cartItems.reduce((acc, it) => acc + (it.qtd || 1), 0) || 1;

      list.push({
        id: cart.id,
        data: cart.createdAt || cart.abandonedAt || "Recente",
        dataOriginal: cart.createdAt || new Date().toISOString(),
        clienteNome: cart.client || "Cliente Carrinho",
        clienteTelefone: cart.phone || "Não informado",
        clienteEmail: cart.email,
        clienteEndereco: cart.address,
        lojaId: safeLojaId,
        lojaNome: lojaObj?.nome || "Farmácias Associadas",
        lojaCidadeUf: lojaObj ? `${lojaObj.cidade}/${lojaObj.uf}` : "POA/RS",
        status: "Pendente",
        statusDesc: "Pendente (Carrinho)",
        origem: "carrinho",
        itensQtd: totalItemsCount,
        valorTotal: cart.total || 0,
        itens: cartItems,
        pagamentoMetodo: undefined, // Cliente abandonou o carrinho sem escolher forma de pagamento
        modalidade: "Online",
        tipoRegistro: "carrinho"
      });
    });

    // Ordena do mais recente para o mais antigo
    return list.sort((a, b) => {
      const timeA = new Date(a.dataOriginal).getTime() || 0;
      const timeB = new Date(b.dataOriginal).getTime() || 0;
      return timeB - timeA;
    });
  }, [rawOrders, rawCarts, pharmacies]);

  // Filtro de escopo (Global vs Loja Específica)
  const scopedOrders = useMemo(() => {
    if (effectiveStoreId) {
      return allUnifiedOrders.filter(o => o.lojaId === effectiveStoreId);
    }
    if (selectedLojaFilter !== "all") {
      return allUnifiedOrders.filter(o => o.lojaId === selectedLojaFilter);
    }
    return allUnifiedOrders;
  }, [allUnifiedOrders, effectiveStoreId, selectedLojaFilter]);

  // Métricas Calculadas
  const totalPedidos = scopedOrders.length;
  const concluidosCount = scopedOrders.filter(o => o.status === "Concluído").length;
  const pendentesCount = scopedOrders.filter(o => o.status === "Pendente").length;
  const canceladosCount = scopedOrders.filter(o => o.status === "Cancelado").length;

  const concluidosPct = totalPedidos > 0 ? Math.round((concluidosCount / totalPedidos) * 100) : 0;
  const pendentesPct = totalPedidos > 0 ? Math.round((pendentesCount / totalPedidos) * 100) : 0;

  const totalValorConcluido = scopedOrders.filter(o => o.status === "Concluído").reduce((acc, o) => acc + o.valorTotal, 0);
  const ticketMedio = concluidosCount > 0 ? totalValorConcluido / concluidosCount : 0;

  // Lojas ativas com pedidos
  const lojasComPedidosIds = useMemo(() => {
    const ids = new Set<string>();
    allUnifiedOrders.forEach(o => ids.add(o.lojaId));
    return ids;
  }, [allUnifiedOrders]);

  // Distribuição por Loja (Para Visão Global)
  const distribuicaoLojas = useMemo(() => {
    return pharmacies.map(loja => {
      const pedidosDaLoja = allUnifiedOrders.filter(o => o.lojaId === loja.id);
      const total = pedidosDaLoja.length;
      const concluidos = pedidosDaLoja.filter(o => o.status === "Concluído").length;
      const pendentes = pedidosDaLoja.filter(o => o.status === "Pendente").length;
      const valorTotal = pedidosDaLoja.reduce((acc, o) => acc + o.valorTotal, 0);
      const taxaConclusao = total > 0 ? Math.round((concluidos / total) * 100) : 0;
      const ultimoPedido = pedidosDaLoja[0]?.data || "Nenhum";

      return {
        id: loja.id,
        nome: loja.nome,
        cidade: loja.cidade,
        uf: loja.uf,
        total,
        concluidos,
        pendentes,
        valorTotal,
        taxaConclusao,
        ultimoPedido
      };
    }).sort((a, b) => b.total - a.total);
  }, [pharmacies, allUnifiedOrders]);

  // Dados para Gráfico de Status (Concluídos vs Pendentes vs Cancelados)
  const statusPieData = useMemo(() => {
    const data = [];
    if (concluidosCount > 0) data.push({ name: "Concluído (WhatsApp)", value: concluidosCount, color: "#10b981" });
    if (pendentesCount > 0) data.push({ name: "Pendente (Carrinho)", value: pendentesCount, color: "#f59e0b" });
    if (canceladosCount > 0) data.push({ name: "Cancelado", value: canceladosCount, color: "#ef4444" });
    return data;
  }, [concluidosCount, pendentesCount, canceladosCount]);

  // Dados para Gráfico de Barras de Pedidos por Loja
  const lojaBarData = useMemo(() => {
    return distribuicaoLojas
      .filter(l => l.total > 0)
      .slice(0, 6)
      .map(l => ({
        name: l.nome.replace("Farmácias Associadas — ", "").replace("Farmácias Associadas - ", ""),
        concluidos: l.concluidos,
        pendentes: l.pendentes,
        total: l.total
      }));
  }, [distribuicaoLojas]);

  // Filtro de Pesquisa e Status para a Tabela de Últimos Pedidos
  const filteredLatestOrders = useMemo(() => {
    return scopedOrders.filter(o => {
      const matchStatus = selectedStatusFilter === "todos" ? true : o.status === selectedStatusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || (
        o.id.toLowerCase().includes(q) ||
        o.clienteNome.toLowerCase().includes(q) ||
        o.clienteTelefone.toLowerCase().includes(q) ||
        o.lojaNome.toLowerCase().includes(q)
      );
      return matchStatus && matchQuery;
    });
  }, [scopedOrders, selectedStatusFilter, searchQuery]);

  const activeStoreName = effectiveStoreId ? pharmacies.find(p => p.id === effectiveStoreId)?.nome : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl pb-16 font-sans">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-3.5 rounded-2xl shadow-md shadow-emerald-200">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Métricas de Pedidos
              </h1>
              <Badge className={isGlobalView ? "bg-emerald-100 text-emerald-800 border-emerald-200 font-bold" : "bg-blue-100 text-blue-800 border-blue-200 font-bold"}>
                {isGlobalView ? "Painel Global da Rede" : "Painel da Loja"}
              </Badge>
            </div>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              {isGlobalView 
                ? "Visão Geral de Todas as Lojas • Rede Farmácias Associadas" 
                : `Visão da Loja: ${activeStoreName || "Unidade Associada"}`}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2.5">
          {isGlobalView && (
            <div className="flex items-center gap-1.5 bg-slate-50 border rounded-xl px-3 py-1.5 text-xs text-slate-600 font-medium">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>{pharmacies.length} Lojas na Rede</span>
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            className="text-xs font-bold gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Relatório
          </Button>
        </div>
      </div>

      {/* KPI Cards — Conforme Requisito: Total de Pedidos, Concluídos (WhatsApp), Pendentes (Carrinho) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Pedidos (Substitui Pedido Pago / Receita Total) */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isGlobalView ? "Total de Pedidos (Rede)" : "Total de Pedidos (Loja)"}
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {totalPedidos}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">{concluidosCount} concluídos</span>
              <span>•</span>
              <span className="text-amber-600 font-bold">{pendentesCount} pendentes</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pedidos Concluídos (WhatsApp) */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col justify-between hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pedidos Concluídos
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-black text-emerald-600 tracking-tight">
                {concluidosCount}
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-0 text-[11px] font-bold">
                {concluidosPct}% do total
              </Badge>
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Levados para WhatsApp e finalizados
            </div>
          </div>
        </div>

        {/* Card 3: Pedidos Pendentes (Carrinho Abandonado) */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col justify-between hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pedidos Pendentes
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-black text-amber-600 tracking-tight">
                {pendentesCount}
              </div>
              <Badge className="bg-amber-100 text-amber-800 border-0 text-[11px] font-bold">
                {pendentesPct}% do total
              </Badge>
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Abandonado no carrinho
            </div>
          </div>
        </div>

        {/* Card 4: Visão da Rede / Loja */}
        {isGlobalView ? (
          <div className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col justify-between hover:border-purple-200 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lojas com Pedidos
              </span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {lojasComPedidosIds.size} <span className="text-sm font-bold text-slate-400">/ {pharmacies.length}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">
                Unidades com transações ativas
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col justify-between hover:border-purple-200 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ticket Médio da Loja
              </span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">
                Média por pedido concluído
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gráficos de Pedidos — Conforme Requisito: Sem Evolução de Receita */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Status dos Pedidos (Concluídos vs Pendentes) */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-base">
                Status dos Pedidos
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {totalPedidos} total
            </span>
          </div>

          <div className="flex-1 w-full min-h-[260px] flex items-center justify-center">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: number) => [`${val} pedidos`, "Quantidade"]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px -4px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs font-semibold text-slate-700">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-sm font-medium py-12">
                Nenhum pedido registrado.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 mt-2">
            <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
              <div className="text-[11px] font-bold text-emerald-800 uppercase">Concluídos (WhatsApp)</div>
              <div className="text-lg font-black text-emerald-700 mt-0.5">{concluidosCount} ({concluidosPct}%)</div>
            </div>
            <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-100">
              <div className="text-[11px] font-bold text-amber-800 uppercase">Pendentes (Carrinho)</div>
              <div className="text-lg font-black text-amber-700 mt-0.5">{pendentesCount} ({pendentesPct}%)</div>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Distribuição de Pedidos por Loja (Global) ou Resumo por Modalidade (Loja) */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-base">
                {isGlobalView ? "Volume de Pedidos por Loja" : "Resumo de Pedidos da Loja"}
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {isGlobalView ? "Top Lojas com mais movimentação" : "Desempenho desta unidade"}
            </span>
          </div>

          <div className="flex-1 w-full min-h-[260px]">
            {isGlobalView ? (
              lojaBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={lojaBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      allowDecimals={false}
                    />
                    <Tooltip 
                      formatter={(val: number, name: string) => [
                        `${val} pedidos`, 
                        name === "concluidos" ? "Concluídos (WhatsApp)" : name === "pendentes" ? "Pendentes (Carrinho)" : "Total"
                      ]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px -4px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="concluidos" name="Concluídos (WhatsApp)" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="pendentes" name="Pendentes (Carrinho)" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium py-12">
                  Sem dados de lojas para exibir no momento.
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full items-center py-6">
                <div className="bg-slate-50 p-4 rounded-xl border text-center">
                  <div className="text-xs font-bold text-slate-500 uppercase">Total Recebido</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{totalPedidos}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Pedidos registrados</div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                  <div className="text-xs font-bold text-emerald-800 uppercase">Concluídos</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">{concluidosCount}</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1">{concluidosPct}% de taxa</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                  <div className="text-xs font-bold text-amber-800 uppercase">Pendentes</div>
                  <div className="text-2xl font-black text-amber-700 mt-1">{pendentesCount}</div>
                  <div className="text-[11px] text-amber-600 font-medium mt-1">Aguardando ação</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: DISTRIBUIÇÃO DOS CAMPOS POR LOJA (EXCLUSIVO PAINEL GLOBAL) */}
      {isGlobalView && (
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                  Distribuição de Pedidos por Loja
                </h3>
                <p className="text-xs text-slate-500">
                  Acompanhe a quantidade de pedidos concluídos e pendentes em cada unidade da rede
                </p>
              </div>
            </div>

            {selectedLojaFilter !== "all" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedLojaFilter("all")}
                className="text-xs font-bold gap-1 text-emerald-700 border-emerald-200 bg-emerald-50"
              >
                <X className="w-3.5 h-3.5" />
                Limpar Filtro de Loja
              </Button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Loja / Farmácia</th>
                  <th className="py-3.5 px-4 text-center">Total de Pedidos</th>
                  <th className="py-3.5 px-4 text-center">Concluídos (WhatsApp)</th>
                  <th className="py-3.5 px-4 text-center">Pendentes (Carrinho)</th>
                  <th className="py-3.5 px-4 text-center">Taxa de Conclusão</th>
                  <th className="py-3.5 px-4 text-right">Último Pedido</th>
                  <th className="py-3.5 px-4 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {distribuicaoLojas.map((loja) => {
                  const isSelected = selectedLojaFilter === loja.id;
                  return (
                    <tr 
                      key={loja.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${isSelected ? "bg-emerald-50/40" : ""}`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{loja.nome}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {loja.cidade}/{loja.uf}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-black text-slate-900 text-base">
                          {loja.total}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {loja.concluidos}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {loja.pendentes}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all" 
                              style={{ width: `${loja.taxaConclusao}%` }} 
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700">{loja.taxaConclusao}%</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right text-xs text-slate-600 font-medium">
                        {loja.ultimoPedido}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedLojaFilter(isSelected ? "all" : loja.id)}
                          className={`text-xs font-bold h-8 ${isSelected ? "bg-emerald-600 hover:bg-emerald-700" : "text-slate-600 hover:text-emerald-700"}`}
                        >
                          {isSelected ? "Filtrado" : "Filtrar Pedidos"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SEÇÃO 2: ÚLTIMOS PEDIDOS (COM DATA, CLIENTE, LOJA QUE FATUROU, STATUS, VALOR E QUANTIDADE DE ITENS) */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                {isGlobalView ? "Últimos Pedidos da Rede" : "Últimos Pedidos da Loja"}
              </h3>
              <p className="text-xs text-slate-500">
                Data do pedido, cliente, loja que faturou, quantidade de itens, status e valor
              </p>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar cliente, pedido, loja..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setSelectedStatusFilter("todos")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${selectedStatusFilter === "todos" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                Todos ({scopedOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter("Concluído")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${selectedStatusFilter === "Concluído" ? "bg-emerald-600 text-white shadow-sm" : "text-emerald-700 hover:bg-emerald-50"}`}
              >
                Concluídos ({concluidosCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter("Pendente")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${selectedStatusFilter === "Pendente" ? "bg-amber-500 text-white shadow-sm" : "text-amber-700 hover:bg-amber-50"}`}
              >
                Pendentes ({pendentesCount})
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Últimos Pedidos */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Data do Pedido</th>
                <th className="py-3.5 px-4">Cliente</th>
                {isGlobalView && <th className="py-3.5 px-4 whitespace-nowrap">Loja que Faturou</th>}
                <th className="py-3.5 px-4 text-center">Qtd. Itens</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Valor Total</th>
                <th className="py-3.5 px-4 text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLatestOrders.length === 0 ? (
                <tr>
                  <td colSpan={isGlobalView ? 7 : 6} className="py-12 text-center text-slate-400 font-medium">
                    Nenhum pedido encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLatestOrders.map((order) => {
                  const isConcluido = order.status === "Concluído";
                  const isPendente = order.status === "Pendente";
                  const isCancelado = order.status === "Cancelado";

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Data do Pedido */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                        <div>{order.data}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">#{order.id}</div>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{order.clienteNome}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          {order.clienteTelefone}
                        </div>
                      </td>

                      {/* Loja que Faturou (Aparece no Painel Global sem corte) */}
                      {isGlobalView && (
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
                            <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{order.lojaNome}</span>
                          </div>
                        </td>
                      )}

                      {/* Quantidade de Itens */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          {order.itensQtd} {order.itensQtd === 1 ? "item" : "itens"}
                        </span>
                      </td>

                      {/* Status: Concluído (WhatsApp) ou Pendente (Carrinho) */}
                      <td className="py-3.5 px-4 text-center">
                        {isConcluido && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Concluído
                          </span>
                        )}
                        {isPendente && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Pendente
                          </span>
                        )}
                        {isCancelado && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            Cancelado
                          </span>
                        )}
                      </td>

                      {/* Valor Total */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-black text-slate-900 text-sm">
                          {order.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </td>

                      {/* Ação */}
                      <td className="py-3.5 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrderDetails(order)}
                          className="text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1 h-8"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes do Pedido */}
      <Dialog open={Boolean(selectedOrderDetails)} onOpenChange={open => !open && setSelectedOrderDetails(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                Pedido #{selectedOrderDetails?.id}
              </DialogTitle>
              {selectedOrderDetails?.status === "Concluído" ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-0 font-bold">
                  Concluído
                </Badge>
              ) : selectedOrderDetails?.status === "Pendente" ? (
                <Badge className="bg-amber-100 text-amber-800 border-0 font-bold">
                  Pendente
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 border-0 font-bold">
                  Cancelado
                </Badge>
              )}
            </div>
            <DialogDescription>
              {selectedOrderDetails?.data} • Loja: {selectedOrderDetails?.lojaNome}
            </DialogDescription>
          </DialogHeader>

          {selectedOrderDetails && (
            <div className="space-y-4 text-sm mt-2">
              {/* Cliente */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Dados do Cliente</div>
                <div className="font-bold text-slate-800">{selectedOrderDetails.clienteNome}</div>
                <div className="text-xs text-slate-600 flex items-center gap-3">
                  <span>Tel: {selectedOrderDetails.clienteTelefone}</span>
                  {selectedOrderDetails.clienteEmail && <span>• Email: {selectedOrderDetails.clienteEmail}</span>}
                </div>
                {selectedOrderDetails.clienteEndereco && (
                  <div className="text-xs text-slate-500">Endereço: {selectedOrderDetails.clienteEndereco}</div>
                )}
              </div>

              {/* Loja & Pagamento */}
              <div className={`grid ${selectedOrderDetails.status === "Concluído" && selectedOrderDetails.pagamentoMetodo ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-3`}>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Loja que Faturou</div>
                  <div className="font-bold text-slate-800 text-sm mt-1">{selectedOrderDetails.lojaNome}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{selectedOrderDetails.lojaCidadeUf}</div>
                </div>
                {/* Apenas exibe Forma de Pagamento quando o pedido estiver concluído/finalizado com método escolhido */}
                {selectedOrderDetails.status === "Concluído" && selectedOrderDetails.pagamentoMetodo && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Forma de Pagamento</div>
                    <div className="font-bold text-slate-800 text-sm mt-1">{selectedOrderDetails.pagamentoMetodo}</div>
                    {selectedOrderDetails.modalidade && (
                      <div className="text-xs text-slate-500 mt-0.5">Modalidade: {selectedOrderDetails.modalidade}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Produtos */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Itens do Pedido ({selectedOrderDetails.itensQtd})
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border rounded-xl">
                  {selectedOrderDetails.itens.map((it, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-800">{it.nome}</div>
                        <div className="text-slate-400 text-[11px]">Qtd: {it.qtd}x</div>
                      </div>
                      <div className="font-black text-slate-900">
                        {it.valorUnitario ? (it.valorUnitario * it.qtd).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Valor Total */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                <span className="font-bold text-emerald-900">Valor Total do Pedido:</span>
                <span className="text-xl font-black text-emerald-700">
                  {selectedOrderDetails.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

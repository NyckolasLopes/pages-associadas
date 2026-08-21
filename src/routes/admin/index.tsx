import { useState, useMemo } from "react";
import { StoreSelector } from "@/components/admin/StoreSelector";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { useLive } from "@/stores/live";
import { useOrders } from "@/stores/orders";
import { useCart } from "@/stores/cart";
import { useAbandonedCartsStore } from "@/stores/abandoned-carts";
import { useMarketing } from "@/stores/marketing";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  ShoppingBag,
  ShoppingCart,
  Info,
  Eye,
  Store,
  TrendingUp,
  TrendingDown,
  Bell,
  MessageCircle,
  Clock,
  CheckCircle2,
  PackageCheck,
  Truck,
  ExternalLink,
  Globe
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { currentUser, pharmacies, activeStoreId, grupos } = useAdmin();
  
  const isGlobalAdmin = currentUser?.proprietario || grupos?.find(g => g.id === currentUser?.grupoId)?.permissao_total || currentUser?.lojasVinculadas === undefined || false;
  const isGlobalView = isGlobalAdmin && !activeStoreId;
  
  // No Painel Global (que administra todas as lojas), nunca filtra por loja individual e mostra o painel geral da rede
  const effectiveStoreId = isGlobalAdmin ? (activeStoreId || null) : (activeStoreId || (currentUser?.lojasVinculadas && currentUser.lojasVinculadas[0]) || null);

  
  const { visitors: rawVisitors, totalAcessos, lojasAcessos, fetchRealAcessos } = useLive();
  const visitors = useMemo(() => {
    if (!effectiveStoreId) return rawVisitors;
    return rawVisitors.filter(v => v.lojaId === effectiveStoreId || ((v as any).url && (v as any).url.includes(effectiveStoreId)));
  }, [rawVisitors, effectiveStoreId]);
  const { orders: rawOrders } = useOrders();
  const [showVisitasModal, setShowVisitasModal] = useState(false);
  
  const visitasPorLoja = useMemo(() => {
    return (pharmacies || []).map(loja => {
      let stat = lojasAcessos?.[loja.id];
      if (!stat) {
        stat = { total: 0, mes: 0, hoje: 0, lastAccess: 0 };
      }
      return {
        id: loja.id,
        nome: loja.nome,
        cidade: loja.cidade,
        uf: loja.uf,
        mes: stat.mes || 0,
        total: stat.total || 0,
        hoje: stat.hoje || 0,
      };
    }).sort((a, b) => b.mes - a.mes);
  }, [pharmacies, lojasAcessos]);

  const dynamicTotalAcessos = visitasPorLoja.reduce((acc, l) => acc + l.mes, 0);

  const effectiveStoreStats = useMemo(() => {
    if (!effectiveStoreId) {
      const globalStat = lojasAcessos?.['global'] || { total: 0, mes: 0, hoje: 0 };
      return {
        total: visitasPorLoja.reduce((acc, l) => acc + l.total, 0) + globalStat.total,
        mes: visitasPorLoja.reduce((acc, l) => acc + l.mes, 0) + globalStat.mes,
        hoje: visitasPorLoja.reduce((acc, l) => acc + l.hoje, 0) + globalStat.hoje
      };
    }
    return visitasPorLoja.find(l => l.id === effectiveStoreId) || { total: 0, mes: 0, hoje: 0 };
  }, [effectiveStoreId, visitasPorLoja, lojasAcessos]);

  const maxVisitasMes = useMemo(() => {
    if (visitasPorLoja.length === 0) return 1;
    return Math.max(...visitasPorLoja.map(l => l.mes));
  }, [visitasPorLoja]);

  const loadCarts = useAbandonedCartsStore(s => s.loadCarts);
  useEffect(() => {
    loadCarts();
    fetchRealAcessos();
  }, [loadCarts, fetchRealAcessos]);

  const orders = useMemo(() => {
    if (!effectiveStoreId) return rawOrders;
    return rawOrders.filter(o => o.lojaId === effectiveStoreId);
  }, [rawOrders, effectiveStoreId]);
  
  const { items: cartItems } = useCart();
  const { lojaPromocoes } = useMarketing();
  const [showPromoModal, setShowPromoModal] = useState(false);

  const pad = (n: number) => n.toString().padStart(2, '0');

  const [filtroPeriodo, setFiltroPeriodo] = useState("mes");
  const [dataCustom, setDataCustom] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  });

  const periodos = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    let startAtual = new Date(hoje);
    let endAtual = new Date(hoje); endAtual.setHours(23, 59, 59);
    let startAnterior = new Date(hoje); startAnterior.setDate(hoje.getDate() - 1);
    let endAnterior = new Date(startAnterior); endAnterior.setHours(23, 59, 59);
    let label = "Hoje";
    let labelAnterior = "ontem";

    if (filtroPeriodo === "semana") {
      const day = hoje.getDay();
      const diff = hoje.getDate() - day;
      startAtual = new Date(hoje); startAtual.setDate(diff);
      endAtual = new Date(startAtual); endAtual.setDate(startAtual.getDate() + 6); endAtual.setHours(23, 59, 59);
      
      startAnterior = new Date(startAtual); startAnterior.setDate(startAnterior.getDate() - 7);
      endAnterior = new Date(startAnterior); endAnterior.setDate(startAnterior.getDate() + 6); endAnterior.setHours(23, 59, 59);
      label = "Esta Semana";
      labelAnterior = "semana passada";
    } else if (filtroPeriodo === "mes") {
      startAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      endAtual = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
      
      startAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      endAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59);
      label = "Este Mês";
      labelAnterior = "mês passado";
    } else if (filtroPeriodo === "ano") {
      startAtual = new Date(hoje.getFullYear(), 0, 1);
      endAtual = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59);
      
      startAnterior = new Date(hoje.getFullYear() - 1, 0, 1);
      endAnterior = new Date(hoje.getFullYear() - 1, 11, 31, 23, 59, 59);
      label = "Este Ano";
      labelAnterior = "ano passado";
    } else if (filtroPeriodo === "custom") {
      const [y, m, d] = dataCustom.split('-');
      if (y && m && d) {
        startAtual = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        endAtual = new Date(startAtual); endAtual.setHours(23, 59, 59);
        startAnterior = new Date(startAtual); startAnterior.setDate(startAtual.getDate() - 1);
        endAnterior = new Date(startAnterior); endAnterior.setHours(23, 59, 59);
        label = `Dia ${pad(startAtual.getDate())}/${pad(startAtual.getMonth() + 1)}`;
        labelAnterior = "dia anterior";
      }
    }
    return { startAtual, endAtual, startAnterior, endAnterior, label, labelAnterior };
  }, [filtroPeriodo, dataCustom]);

  const calcCrescimento = (atual: number, anterior: number) => {
    if (anterior === 0) {
      if (atual > 0) return { isPositivo: true, percent: "100%" };
      return { isPositivo: true, percent: "0%" };
    }
    const diff = ((atual - anterior) / anterior) * 100;
    return { isPositivo: diff >= 0, percent: `${Math.abs(diff).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%` };
  };

  const parseOrderDate = (dStr: string) => {
    if (!dStr) return new Date();
    if (dStr.includes("T") || dStr.includes("-")) {
      const parsed = new Date(dStr);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    const [datePart] = dStr.split(' ');
    if (datePart && datePart.includes('/')) {
      const [day, month, year] = datePart.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return new Date();
  };

  const isValidSale = (status: string) => {
    const s = (status || "").toUpperCase();
    return s !== "CANCELADO";
  };

  const pedidosAtual = orders.filter(o => {
    const d = parseOrderDate(o.data);
    return d >= periodos.startAtual && d <= periodos.endAtual && isValidSale(o.status);
  });
  
  const pedidosAnterior = orders.filter(o => {
    const d = parseOrderDate(o.data);
    return d >= periodos.startAnterior && d <= periodos.endAnterior && isValidSale(o.status);
  });

  const valorAtual = pedidosAtual.reduce((acc, o) => acc + (o.valores?.total || 0), 0);
  const qtdAtual = pedidosAtual.length;
  const ticketAtual = qtdAtual > 0 ? valorAtual / qtdAtual : 0;

  const valorAnterior = pedidosAnterior.reduce((acc, o) => acc + (o.valores?.total || 0), 0);
  const qtdAnterior = pedidosAnterior.length;
  const ticketAnterior = qtdAnterior > 0 ? valorAnterior / qtdAnterior : 0;

  const crescFaturamento = calcCrescimento(valorAtual, valorAnterior);
  const crescPedidos = calcCrescimento(qtdAtual, qtdAnterior);
  const crescTicket = calcCrescimento(ticketAtual, ticketAnterior);
  const rawStoreCarts = useAbandonedCartsStore(s => s.carts);
  const user = useAdmin(s => s.currentUser);
  // Incluir o "live cart" se houver, igual na tela de detalhes
  const activeLiveCart = (user && cartItems.length > 0) ? 1 : 0;
  
  const storeCarts = effectiveStoreId ? rawStoreCarts.filter(c => c.lojaId === effectiveStoreId) : rawStoreCarts;
  const carrinhosRecuperar = storeCarts.length + activeLiveCart;

  const formatDataHora = (dataStr: string) => {
    if (!dataStr) return "";
    try {
      const date = new Date(dataStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      }
    } catch {
      // fallback
    }
    return dataStr;
  };

  return (
    <div className="space-y-8 max-w-5xl pb-10">
      {/* ---- Greeting ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-[26px] font-bold text-slate-800 tracking-tight">
            Olá, {currentUser?.name || "Administrador"}! 👋
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {effectiveStoreId ? `Visão da Loja: ${pharmacies.find(p => p.id === effectiveStoreId)?.nome || ""}` : "Painel Geral da Rede de Farmácias Associadas"}
          </p>
        </div>
        <StoreSelector />
      </div>

      {/* ---- Faturamento ---- */}
      <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50/30 rounded-xl border border-emerald-100 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h3 className="text-sm font-bold text-emerald-800/70 mb-2 uppercase tracking-wider">Faturamento Total ({periodos.label})</h3>
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 text-white p-3 rounded-xl shadow-md shadow-emerald-200">
              <DollarSign className="h-8 w-8" />
            </div>
            <div className="flex flex-col">
              <span className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight">
                {valorAtual.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${crescFaturamento.isPositivo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {crescFaturamento.isPositivo ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {crescFaturamento.percent}
                </span>
                <span className="text-xs font-medium text-slate-500">em relação ao {periodos.labelAnterior}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 sm:self-start">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-emerald-800/70 uppercase tracking-wider">Período de Análise</label>
            <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
              <SelectTrigger className="w-[180px] bg-white border-emerald-200 shadow-sm font-bold text-slate-700">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
                <SelectItem value="ano">Este Ano</SelectItem>
                <SelectItem value="custom">Data Específica...</SelectItem>
              </SelectContent>
            </Select>
            {filtroPeriodo === "custom" && (
              <Input 
                type="date"
                value={dataCustom}
                onChange={(e) => setDataCustom(e.target.value)}
                className="w-[180px] bg-white border-emerald-200 shadow-sm font-bold text-slate-700 mt-1"
              />
            )}
          </div>
        </div>
      </div>

      {/* ---- Linha 1 de KPIs ---- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/ao-vivo" className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider leading-tight">
              <span>Online Agora</span>
              <Info className="h-3.5 w-3.5 text-slate-300 shrink-0" />
            </div>
            <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse ring-4 ring-red-50 shrink-0 mt-0.5"></div>
          </div>
          <div className="flex flex-col mt-3">
            <span className="text-4xl font-black text-slate-800 tracking-tight">{visitors.length}</span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] text-slate-400 font-medium leading-tight">
                {effectiveStoreId ? "visitantes simultâneos na loja" : "visitantes simultâneos na rede"}
              </span>
            </div>
          </div>
        </Link>

        <Link to="/admin/pedidos" className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between h-auto hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm text-slate-500 font-bold uppercase tracking-wider">
              Pedidos Realizados
            </div>
            <div className="bg-indigo-50 text-indigo-500 p-1.5 rounded-lg">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="flex flex-col mt-3">
            <span className="text-4xl font-black text-slate-800">{qtdAtual}</span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${crescPedidos.isPositivo ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {crescPedidos.isPositivo ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {crescPedidos.percent}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">em relação ao {periodos.labelAnterior}</span>
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between h-auto hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm text-slate-500 font-bold uppercase tracking-wider">
              Ticket Médio
            </div>
            <div className="bg-teal-50 text-teal-500 p-1.5 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="flex flex-col mt-3">
            <span className="text-4xl font-black text-slate-800 tracking-tight">
              {ticketAtual.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${crescTicket.isPositivo ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {crescTicket.isPositivo ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {crescTicket.percent}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">em relação ao {periodos.labelAnterior}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Linha 2 de KPIs: Painel da Loja vs Painel Global da Rede ---- */}
      {effectiveStoreId ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/admin/carrinhos-abandonados" className="bg-white rounded-xl border shadow-sm p-4 flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-emerald-500" />
              <span className="text-xl font-bold text-slate-800">{carrinhosRecuperar}</span>
            </div>
            <div className="text-xs text-slate-500 font-medium leading-tight">
              Carrinhos a recuperar
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                Somente desta loja
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Eye className="h-4 w-4" />
                </div>
                <span className="text-xl font-bold text-slate-800">
                  {effectiveStoreStats.mes}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
                Nesta Loja
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground font-medium leading-tight">
              Visitantes no mês
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                Hoje: <strong className="text-slate-700">{effectiveStoreStats.hoje}</strong> • Total: <strong className="text-slate-700">{effectiveStoreStats.total}</strong>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/carrinhos-abandonados" className="bg-white rounded-xl border shadow-sm p-4 flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-emerald-500" />
              <span className="text-xl font-bold text-slate-800">{carrinhosRecuperar}</span>
            </div>
            <div className="text-xs text-slate-500 font-medium leading-tight">
              Carrinhos a recuperar
            </div>
          </Link>

          <Link to="/admin/lojas" className="bg-white rounded-xl border shadow-sm p-4 flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-slate-400" />
              <span className="text-xl font-bold text-slate-800">{pharmacies?.length || 0}</span>
            </div>
            <div className="text-xs text-muted-foreground font-medium leading-tight">
              Lojas associadas na rede
            </div>
          </Link>

          <div 
            onClick={() => setShowVisitasModal(true)}
            className="bg-white rounded-xl border shadow-sm p-4 flex flex-col justify-between h-[110px] hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                  <Eye className="h-4 w-4" />
                </div>
                <span className="text-xl font-bold text-slate-800">{dynamicTotalAcessos || 0}</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
                Por Loja
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground font-medium leading-tight">
              Visitantes no mês por loja
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <span>{visitasPorLoja.length} lojas monitoradas</span>
                <span>•</span>
                <span>Clique para ver</span>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ---- Modal de Visitantes no Mês por Loja ---- */}
      <Dialog open={showVisitasModal} onOpenChange={setShowVisitasModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Eye className="h-5 w-5 text-emerald-600" />
              Visitantes no Mês por Loja
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Acessos registrados nas páginas criadas de cada farmácia associada na rede.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 mt-4 space-y-3">
            {visitasPorLoja.map((loja, idx) => {
              const perc = Math.round((loja.mes / maxVisitasMes) * 100);
              return (
                <div 
                  key={loja.id} 
                  className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800 truncate" title={loja.nome}>
                          {loja.nome}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span>{loja.cidade ? `${loja.cidade}/${loja.uf}` : "Rede"}</span>
                          <span>•</span>
                          <a 
                            href={`/loja/${loja.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:underline flex items-center gap-0.5 font-medium"
                          >
                            Página da loja <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-emerald-700">
                        {loja.mes} <span className="text-xs font-semibold text-slate-500">visitas</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Hoje: <strong className="text-slate-600">{loja.hoje}</strong> • Total: <strong className="text-slate-600">{loja.total}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Barra de progresso comparativa */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(perc, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {visitasPorLoja.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-400">
                Nenhuma loja cadastrada para monitorar acessos.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

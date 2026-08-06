import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { useLive } from "@/stores/live";
import { useOrders } from "@/stores/orders";
import { useCart } from "@/stores/cart";
import { useAbandonedCartsStore } from "@/stores/abandoned-carts";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  ExternalLink
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { currentUser, pharmacies, activeStoreId } = useAdmin();
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;
  const { visitors, totalAcessos } = useLive();
  const { orders: rawOrders } = useOrders();
  
  const orders = useMemo(() => {
    if (!activeStoreId) return rawOrders;
    return rawOrders.filter(o => o.lojaId === activeStoreId);
  }, [rawOrders, activeStoreId]);
  
  const { items: cartItems } = useCart();

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

  const crescVendas = calcCrescimento(valorAtual, valorAnterior);
  const crescPedidos = calcCrescimento(qtdAtual, qtdAnterior);
  const crescTicket = calcCrescimento(ticketAtual, ticketAnterior);
  
  const storeCarts = useAbandonedCartsStore(s => s.carts);
  const carrinhosRecuperar = storeCarts.length + (cartItems.length > 0 ? 1 : 0);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-[26px] font-bold text-slate-800 tracking-tight">
            Olá, {currentUser?.name || "Administrador"}! 👋
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Painel Geral da Rede de Farmácias Associadas
          </p>
        </div>
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
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${crescVendas.isPositivo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {crescVendas.isPositivo ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {crescVendas.percent}
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
              <span className="text-[11px] text-slate-400 font-medium leading-tight">visitantes simultâneos na rede</span>
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

      {/* ---- Linha 2 de KPIs Globais ---- */}
      {isGlobalAdmin && (
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

          <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-slate-400" />
              <span className="text-xl font-bold text-slate-800">{totalAcessos || 0}</span>
            </div>
            <div className="text-xs text-muted-foreground font-medium leading-tight">
              Número de visitas no mês
            </div>
          </div>
        </div>
      )}

      {/* ---- Notificações de Pedidos ---- */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-500" />
              Notificações de Pedidos
              {orders.length > 0 && (
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-xs font-bold px-2 py-0.5 border-emerald-200">
                  {orders.length} pedido(s)
                </Badge>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Acompanhe em tempo real os pedidos finalizados via WhatsApp e e-commerce pelas lojas da rede.
            </p>
          </div>
          <Link 
            to="/admin/pedidos" 
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
          >
            Ver todos <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-3">
          {orders.slice(0, 8).map((order) => {
            const statusLower = (order.status || "").toLowerCase();
            let statusBadge = "bg-slate-100 text-slate-700 border-slate-200";
            let StatusIcon = Clock;

            if (statusLower.includes("pendente") || statusLower.includes("aguardando")) {
              statusBadge = "bg-amber-50 text-amber-800 border-amber-200";
              StatusIcon = Clock;
            } else if (statusLower.includes("separação") || statusLower.includes("separando")) {
              statusBadge = "bg-blue-50 text-blue-800 border-blue-200";
              StatusIcon = PackageCheck;
            } else if (statusLower.includes("pronto") || statusLower.includes("enviado") || statusLower.includes("rota")) {
              statusBadge = "bg-purple-50 text-purple-800 border-purple-200";
              StatusIcon = Truck;
            } else if (statusLower.includes("entregue") || statusLower.includes("pago") || statusLower.includes("finalizado")) {
              statusBadge = "bg-emerald-50 text-emerald-800 border-emerald-200";
              StatusIcon = CheckCircle2;
            }

            const lojaObj = pharmacies.find(p => p.id === order.lojaId);
            const lojaNome = lojaObj?.nome || order.lojaNome || order.lojaId || "Farmácia Associada";
            const lojaCidade = lojaObj?.cidade ? `${lojaObj.cidade}/${lojaObj.uf}` : "";
            
            const isWhatsApp = order.origem === "whatsapp" || (!order.origem && order.cliente?.telefone);
            const cleanClientPhone = order.cliente?.telefone ? order.cliente.telefone.replace(/\D/g, "") : "";
            const clientWaUrl = cleanClientPhone ? `https://wa.me/55${cleanClientPhone}` : null;

            const itensCount = order.produtos?.length || (order as any).itens?.length || 1;
            const totalValor = order.valores?.total || 0;

            return (
              <div key={order.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-colors gap-4">
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700 shrink-0 mt-0.5">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{lojaNome}</span>
                      {lojaCidade && (
                        <span className="text-[11px] text-slate-400 font-medium">({lojaCidade})</span>
                      )}
                      <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border">
                        #{order.id}
                      </span>
                      {isWhatsApp && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          <MessageCircle className="h-3 w-3 fill-emerald-600 text-white" />
                          WhatsApp
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusBadge}`}>
                        <StatusIcon className="h-3 w-3" />
                        {order.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>👤 <strong>Cliente:</strong> {order.cliente?.nome || "Cliente"}</span>
                      {order.cliente?.telefone && (
                        <span>📞 {order.cliente.telefone}</span>
                      )}
                      <span>🛒 {itensCount} produto(s) • <strong className="text-emerald-700">{totalValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></span>
                    </p>

                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDataHora(order.data)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                  {clientWaUrl && (
                    <a
                      href={clientWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                      title="Conversar com o cliente no WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                  )}
                  <Link 
                    to="/admin/pedidos" 
                    className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border px-3 py-2 rounded-lg transition-colors"
                  >
                    Ver Pedido
                  </Link>
                </div>
              </div>
            );
          })}

          {orders.length === 0 && (
            <div className="text-center py-8 text-sm text-slate-500 flex flex-col items-center gap-2">
              <Bell className="h-8 w-8 text-slate-300" />
              <span>Nenhum pedido registrado no momento.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

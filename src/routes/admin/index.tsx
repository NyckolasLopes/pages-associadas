import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { useLive } from "@/stores/live";
import { useAdminProducts } from "@/stores/products";
import { useOrders } from "@/stores/orders";
import { useCart } from "@/stores/cart";
import { useAbandonedCartsStore } from "@/stores/abandoned-carts";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  DollarSign,
  ShoppingBag,
  ShoppingCart,
  Clock,
  AlertTriangle,
  XCircle,
  PackageX,
  PackageMinus,
  Info,
  User,
  Eye,
  Package,
  Store,
  TrendingUp,
  TrendingDown,
  Bell
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { currentUser, users, pharmacies, activeStoreId } = useAdmin();
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;
  const { visitors, totalAcessos } = useLive();
  const { customProducts } = useAdminProducts();
  const { orders: rawOrders } = useOrders();
  const orders = useMemo(() => {
    if (!activeStoreId) return rawOrders;
    return rawOrders.filter(o => o.lojaId === activeStoreId);
  }, [rawOrders, activeStoreId]);
  
  const { items: cartItems } = useCart();
  const firstName = currentUser?.name?.split(" ")[0] || "Admin";

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatBr = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const getMesAnoStr = (d: Date) => `${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

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
    const [datePart] = dStr.split(' ');
    const [day, month, year] = datePart.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const isValidSale = (status: string) => {
    const s = status.toUpperCase();
    return s !== "AGUARDANDO PAGAMENTO" && s !== "CANCELADO";
  };

  const pedidosAtual = orders.filter(o => {
    const d = parseOrderDate(o.data);
    return d >= periodos.startAtual && d <= periodos.endAtual && isValidSale(o.status);
  });
  
  const pedidosAnterior = orders.filter(o => {
    const d = parseOrderDate(o.data);
    return d >= periodos.startAnterior && d <= periodos.endAnterior && isValidSale(o.status);
  });

  const valorAtual = pedidosAtual.reduce((acc, o) => acc + o.valores.total, 0);
  const qtdAtual = pedidosAtual.length;
  const ticketAtual = qtdAtual > 0 ? valorAtual / qtdAtual : 0;

  const valorAnterior = pedidosAnterior.reduce((acc, o) => acc + o.valores.total, 0);
  const qtdAnterior = pedidosAnterior.length;
  const ticketAnterior = qtdAnterior > 0 ? valorAnterior / qtdAnterior : 0;

  const crescVendas = calcCrescimento(valorAtual, valorAnterior);
  const crescPedidos = calcCrescimento(qtdAtual, qtdAnterior);
  const crescTicket = calcCrescimento(ticketAtual, ticketAnterior);
  
  // Novas regras de negócio
  const produtosSemEstoque = customProducts.filter(p => p.estoque === 0).length;
  const produtosEstoqueBaixo = customProducts.filter(p => p.estoque > 0 && p.estoque <= 5).length;
  const produtosAtivos = customProducts.filter(p => p.ativo !== false).length;
  const pagamentosPendentes = orders.filter(o => o.status.toLowerCase().includes("aguardando")).length;
  const storeCarts = useAbandonedCartsStore(s => s.carts);
  const carrinhosRecuperar = storeCarts.length + (cartItems.length > 0 ? 1 : 0);

  return (
    <div className="space-y-8 max-w-5xl pb-10">
      {/* ---- Greeting ---- */}
      <div>
        <h2 className="text-[26px] font-semibold text-slate-800">
          Olá, {currentUser?.name || "Nyckolas Lopes"}!
        </h2>
      </div>

      {/* ---- Faturamento ---- */}
      <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50/30 rounded-xl border border-emerald-100 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h3 className="text-sm font-bold text-emerald-800/70 mb-2 uppercase tracking-wider">Faturamento ({periodos.label})</h3>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/admin/carrinhos-abandonados" className="bg-white rounded-xl border shadow-sm p-4 flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-emerald-500" />
            <span className="text-xl font-bold text-slate-800">{carrinhosRecuperar}</span>
          </div>
          <div className="text-xs text-slate-500 font-medium leading-tight">
            Carrinhos a recuperar
          </div>
        </Link>

        <Link to="/admin/pedidos" search={{ status: 'aguardando' }} className="bg-white rounded-xl border shadow-sm p-4 flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-xl font-bold text-slate-800">{pagamentosPendentes}</span>
          </div>
          <div className="text-xs text-slate-500 font-medium leading-tight">
            Pagamentos pendentes
          </div>
        </Link>

        <Link to="/admin/produtos" search={{ estoque: 'zerado' }} className="bg-white rounded-xl border shadow-sm p-4 flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-xl font-bold text-slate-800">{produtosSemEstoque}</span>
          </div>
          <div className="text-xs text-slate-500 font-medium leading-tight">
            Produtos sem estoque
          </div>
        </Link>

        <Link to="/admin/produtos" search={{ estoque: 'baixo' }} className="bg-white rounded-xl border shadow-sm p-4 flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
            <PackageMinus className="h-4 w-4 text-orange-500" />
            <span className="text-xl font-bold text-slate-800">{produtosEstoqueBaixo}</span>
          </div>
          <div className="text-xs text-slate-500 font-medium leading-tight">
            Com estoque baixo
          </div>
        </Link>
      </div>

      {/* ---- Third Row KPIs (Global Only) ---- */}
      {isGlobalAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link to="/admin/configuracoes" className="bg-white rounded-xl border shadow-sm p-4 flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <span className="text-xl font-bold text-slate-800">{users?.length || 1}</span>
            </div>
            <div className="text-xs text-muted-foreground font-medium leading-tight">
              Total de usuários cadastrados
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

          <Link to="/admin/produtos" className="bg-white rounded-xl border shadow-sm p-4 flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-400" />
              <span className="text-xl font-bold text-slate-800">{produtosAtivos}</span>
            </div>
            <div className="text-xs text-muted-foreground font-medium leading-tight">
              Produtos ativos
            </div>
          </Link>

          <Link to="/admin/lojas" className="bg-white rounded-xl border shadow-sm p-4 flex flex-col justify-between h-[110px] hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-slate-400" />
              <span className="text-xl font-bold text-slate-800">{pharmacies?.length || 0}</span>
            </div>
            <div className="text-xs text-muted-foreground font-medium leading-tight">
              Lojas cadastradas
            </div>
          </Link>
        </div>
      )}

      {/* ---- Notificações de Vendas ---- */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-emerald-500" />
          Notificações de Vendas
        </h3>
        <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-3">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex flex-col sm:flex-row sm:items-start justify-between p-4 rounded-lg bg-slate-50 border border-slate-100 gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 shrink-0">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  {(() => {
                    const statusLower = order.status.toLowerCase();
                    let colorClass = "bg-slate-100 text-slate-700";
                    if (statusLower.includes("aguardando")) {
                      colorClass = "bg-amber-100 text-amber-800";
                    } else if (statusLower.includes("pago") || statusLower.includes("separação") || statusLower.includes("separando") || statusLower.includes("pronto")) {
                      colorClass = "bg-emerald-100 text-emerald-800";
                    } else if (statusLower.includes("cancelado")) {
                      colorClass = "bg-red-100 text-red-800";
                    }
                    
                    const lojaNome = pharmacies.find(p => p.id === order.lojaId)?.nome || order.lojaId || "Desconhecida";

                    return (
                      <p className="text-sm text-slate-700 font-medium leading-relaxed flex flex-wrap items-center gap-1.5">
                        A loja <span className="font-bold">{lojaNome}</span> tem um novo pedido <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${colorClass}`}>{order.status}</span>
                      </p>
                    );
                  })()}
                  <p className="text-xs text-slate-400 mt-1">{order.data}</p>
                </div>
              </div>
              <Link 
                to="/admin/pedidos" 
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline px-3 py-2 bg-emerald-50 rounded-md whitespace-nowrap self-start sm:self-auto border border-emerald-100 transition-colors"
              >
                Clique aqui para visualizar mais informações
              </Link>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-6 text-sm text-slate-500">Nenhuma notificação recente.</div>
          )}
        </div>
      </div>
    </div>
  );
}

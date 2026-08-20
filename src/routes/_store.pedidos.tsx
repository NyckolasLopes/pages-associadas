import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/stores/auth";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Package, Truck, CheckCircle2, Clock, Store, CreditCard, 
  QrCode, Wallet, Search, Phone, MessageCircle, AlertCircle, Sparkles, ChevronRight 
} from "lucide-react";
import { getGreeting, brl } from "@/lib/format";
import { useOrders, type Pedido } from "@/stores/orders";
import { useEffect as useEffectOnce } from "react";
import { useAdmin } from "@/stores/admin";
import { useFavorites } from "@/stores/favorites";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { rateLimiter, checkRateLimitOrThrow, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";
import { sanitizeText } from "@/lib/security";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/pedidos")({
  validateSearch: (search: Record<string, unknown>): { id?: string; novo?: string } => {
    return {
      id: search.id as string | undefined,
      novo: search.novo as string | undefined,
    };
  },
  head: () => ({ meta: [{ title: "Acompanhar Pedido — Farmácias Associadas" }] }),
  component: PedidosPage,
});

const STATUS_STEPS = [
  { key: "Pendente", label: "Pedido Enviado", desc: "Aguardando confirmação da farmácia" },
  { key: "Em separação", label: "Em Separação", desc: "Separando seus produtos na loja" },
  { key: "Pronto", label: "Pronto / Em Rota", desc: "Disponível para retirada ou a caminho" },
  { key: "Entregue", label: "Entregue", desc: "Pedido finalizado com sucesso" },
];

function getStepIndex(status: string): number {
  const s = status.toLowerCase();
  if (s.includes("cancelado")) return -1;
  if (s.includes("entregue") || s.includes("retirado") || s.includes("concluído")) return 3;
  if (s.includes("enviado") || s.includes("aguardando retirada") || s.includes("pronto")) return 2;
  if (s.includes("separação") || s.includes("pago")) return 1;
  return 0;
}

function PedidosPage() {
  const searchParams = Route.useSearch();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  const orders = useOrders((s) => s.orders);
  const loadOrders = useOrders((s) => s.loadOrders);
  const pharmacies = useAdmin((s) => s.pharmacies);
  const { ids: favoriteIds } = useFavorites();

  // Carrega pedidos do banco ao entrar na página
  useEffectOnce(() => {
    loadOrders();
  }, [loadOrders]);

  const [searchQuery, setSearchQuery] = useState(searchParams.id || "");
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Busca pedido por ID da URL automaticamente
  useEffect(() => {
    if (searchParams.id && orders.length > 0) {
      const found = orders.find((o) => o.id.toLowerCase() === searchParams.id?.toLowerCase());
      if (found) {
        setSelectedOrder(found);
      }
    }
  }, [searchParams.id, orders]);

  // Lista de pedidos do usuário ou buscados
  const displayedOrders = useMemo(() => {
    if (searchQuery.trim()) {
      const clean = sanitizeText(searchQuery).toLowerCase();
      return orders.filter(
        (o) =>
          o.id.toLowerCase().includes(clean) ||
          o.cliente.telefone.replace(/\D/g, "").includes(clean.replace(/\D/g, "")) ||
          o.cliente.nome.toLowerCase().includes(clean)
      );
    }
    if (user?.email) {
      return orders.filter(
        (o) => o.cliente.email?.toLowerCase() === user.email.toLowerCase() || o.cliente.nome === user.name
      );
    }
    return [];
  }, [orders, searchQuery, user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      checkRateLimitOrThrow("order_tracking_search", RATE_LIMIT_PRESETS.SEARCH_QUERY);
      const clean = sanitizeText(searchQuery).trim();
      if (!clean) {
        toast.info("Digite o número do pedido ou telefone para buscar.");
        return;
      }
      const found = orders.find(
        (o) =>
          o.id.toLowerCase() === clean.toLowerCase() ||
          o.cliente.telefone.replace(/\D/g, "") === clean.replace(/\D/g, "")
      );
      if (found) {
        setSelectedOrder(found);
        toast.success(`Pedido #${found.id} encontrado!`);
      } else {
        toast.error("Nenhum pedido encontrado com este código ou telefone.");
      }
    } catch (err: any) {
      toast.error(err.message || "Muitas buscas. Aguarde um momento.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  if (!mounted) return null;

  return (
    <div className="container-fa py-8">
      {/* Banner de Boas-vindas para Novo Pedido */}
      {searchParams.novo === "true" && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-emerald-950">Pedido Gerado com Sucesso!</h2>
              <p className="text-sm text-emerald-800/90 mt-0.5">
                Seu carrinho foi encaminhado via WhatsApp para a farmácia selecionada. Você pode acompanhar as atualizações nesta tela.
              </p>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline" className="border-emerald-600 text-emerald-800 hover:bg-emerald-600 hover:text-white font-bold">
              Continuar Navegando
            </Button>
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="space-y-4">
          {user ? (
            <div className="bg-card border rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-muted-foreground font-bold tracking-wider mb-1">{getGreeting()}</p>
              <p className="font-bold text-lg leading-tight truncate">{user.name || user.nome || "Cliente"}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <Button variant="outline" size="sm" className="w-full mt-4 text-xs font-bold" onClick={handleLogout}>
                Sair da conta
              </Button>
            </div>
          ) : (
            <div className="bg-slate-50 border rounded-2xl p-5 text-center">
              <Store className="w-8 h-8 text-primary mx-auto mb-2 opacity-80" />
              <p className="font-bold text-sm text-slate-800">Acompanhamento Rápido</p>
              <p className="text-xs text-muted-foreground mt-1">
                Acompanhe o status do seu pedido do WhatsApp informando o número ou seu telefone.
              </p>
            </div>
          )}

          {/* Quick Tracking Search Box */}
          <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-primary" />
              Buscar por Pedido ou WhatsApp
            </label>
            <form onSubmit={handleSearchSubmit} className="space-y-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: PED-123456 ou (51) 9..."
                className="text-sm"
              />
              <Button type="submit" className="w-full text-xs font-bold h-9">
                Localizar Pedido
              </Button>
            </form>
          </div>

          <nav className="flex flex-col gap-1">
            <Link to="/pedidos" className="px-4 py-2.5 bg-primary/10 text-primary font-bold rounded-xl text-sm flex items-center justify-between">
              <span>Meus Pedidos</span>
              <Package className="w-4 h-4" />
            </Link>
            <Link to="/perfil" className="px-4 py-2.5 text-muted-foreground hover:bg-muted font-bold rounded-xl text-sm transition">
              Meus Dados
            </Link>
            <Link to="/perfil" search={{ tab: "favoritos" }} className="px-4 py-2.5 flex items-center justify-between text-muted-foreground hover:bg-muted font-bold rounded-xl text-sm transition">
              <span>Meus Favoritos</span>
              {favoriteIds.length > 0 && (
                <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {favoriteIds.length}
                </span>
              )}
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Acompanhamento de Pedidos</h1>
              <p className="text-sm text-muted-foreground">
                Consulte o status do seu pedido e fale diretamente com a unidade responsável.
              </p>
            </div>
          </div>

          {displayedOrders.length === 0 ? (
            <div className="bg-card border rounded-2xl p-12 text-center text-muted-foreground shadow-sm">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-20 text-primary" />
              <h3 className="font-bold text-lg text-slate-800">Nenhum pedido encontrado</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Digite o número do seu pedido ou telefone na barra lateral para consultar o status em tempo real.
              </p>
              <Link to="/">
                <Button className="mt-6 font-bold">Explorar Produtos</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedOrders.map((order) => {
                const pharmacy = pharmacies.find((p) => p.id === order.lojaId);
                const stepIdx = getStepIndex(order.status);
                const isCancelled = order.status.toLowerCase() === "cancelado";

                return (
                  <div key={order.id} className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    {/* Header do Card */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-base text-slate-900">Pedido #{order.id}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                            {order.origem === "whatsapp" ? "WhatsApp" : "Site"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.data).toLocaleString("pt-BR")} • Farmácia: <strong>{order.lojaNome || pharmacy?.nome || "Farmácia Associada"}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          isCancelled ? "bg-red-100 text-red-700" :
                          stepIdx === 3 ? "bg-emerald-100 text-emerald-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Stepper de Progresso */}
                    {!isCancelled && (
                      <div className="mb-6 px-2">
                        <div className="grid grid-cols-4 gap-2">
                          {STATUS_STEPS.map((step, idx) => {
                            const isDone = stepIdx >= idx;
                            const isCurrent = stepIdx === idx;
                            return (
                              <div key={step.key} className="flex flex-col items-center text-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                  isDone
                                    ? "bg-emerald-600 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-400"
                                } ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}>
                                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                </div>
                                <span className={`text-[11px] font-bold mt-1.5 line-clamp-1 ${
                                  isDone ? "text-slate-800" : "text-slate-400"
                                }`}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="relative mt-2">
                          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 -z-10 rounded-full" />
                          <div
                            className="h-1 bg-emerald-500 rounded-full transition-all duration-500 -z-10"
                            style={{ width: `${Math.min(100, Math.max(0, (stepIdx / (STATUS_STEPS.length - 1)) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Resumo do Pedido */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-bold">
                          {order.itens?.length || order.produtos?.length || 0} produto(s) • Modalidade: <strong>{order.modalidade || "Retirada"}</strong>
                        </p>
                        <p className="text-sm font-black text-slate-900">
                          Total: {brl(order.valores.total)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {pharmacy?.whatsapp && (
                          <a
                            href={`https://wa.me/55${pharmacy.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                              `Olá! Gostaria de informações sobre o pedido #${order.id}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold gap-1.5">
                              <MessageCircle className="w-4 h-4 text-emerald-600" />
                              Falar com Farmácia
                            </Button>
                          </a>
                        )}

                        <Button size="sm" onClick={() => setSelectedOrder(order)} className="font-bold">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modal de Detalhes do Pedido */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Detalhes do Pedido #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 mt-2">
              <div className="flex justify-between items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    Status: <span className="text-emerald-700 font-black">{selectedOrder.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Data: {new Date(selectedOrder.data).toLocaleString("pt-BR")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-slate-900">{brl(selectedOrder.valores.total)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Pagamento: {selectedOrder.pagamento?.metodo?.toUpperCase() || "Na Entrega/Retirada"}
                  </div>
                </div>
              </div>

              {/* Informações de Envio e Farmácia */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 space-y-1 text-xs">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <Truck className="w-4 h-4 text-primary" /> Modalidade: {selectedOrder.modalidade || "Retirada"}
                  </h4>
                  {selectedOrder.cliente.endereco ? (
                    <>
                      <p><strong>Endereço:</strong> {selectedOrder.cliente.endereco.rua}, Nº {selectedOrder.cliente.endereco.numero}</p>
                      <p><strong>Bairro:</strong> {selectedOrder.cliente.endereco.bairro}</p>
                      <p><strong>Cidade:</strong> {selectedOrder.cliente.endereco.cidade} - CEP {selectedOrder.cliente.endereco.cep}</p>
                    </>
                  ) : (
                    <p className="text-slate-600">Retirada física no balcão da farmácia escolhida.</p>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-1 text-xs">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <Store className="w-4 h-4 text-primary" /> Farmácia Responsável
                  </h4>
                  <p className="font-bold text-slate-900">{selectedOrder.lojaNome || "Farmácia Associada"}</p>
                  <p className="text-slate-500">ID da Unidade: {selectedOrder.lojaId}</p>
                </div>
              </div>

                <div>
                  <h4 className="font-bold text-sm mb-3 text-slate-800">Itens Solicitados</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(selectedOrder.itens || selectedOrder.produtos || []).map((item: any, idx: number) => {
                      const qty = item.quantidade || item.qtd || 1;
                      const unitPrice = item.valorUnitario || (item.preco / qty) || 0;
                      const totalPrice = unitPrice * qty;

                      return (
                        <div key={idx} className="flex items-center p-3 border rounded-xl bg-white text-xs gap-3">
                          {/* Image */}
                          <div className="w-12 h-12 rounded-lg border bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            <img 
                              src={item.foto || item.imagem || `https://via.placeholder.com/150?text=Sem+Imagem`} 
                              alt={item.nome} 
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Sem+Imagem'; }}
                            />
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1">
                            <p className="font-bold text-slate-900 line-clamp-2">{item.nome}</p>
                            {item.ean && <p className="text-[10px] text-slate-500 mt-0.5">EAN: {item.ean}</p>}
                            <p className="text-muted-foreground mt-1">
                              {qty}x {brl(unitPrice)}
                            </p>
                          </div>

                          {/* Total */}
                          <div className="text-right pl-2">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Total</p>
                            <p className="font-bold text-slate-900 text-sm">
                              {brl(totalPrice)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              {/* Totalizador */}
              <div className="border-t pt-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{brl(selectedOrder.valores.subtotal || selectedOrder.valores.produtos || 0)}</span>
                </div>
                {Number(selectedOrder.valores?.descontos || selectedOrder.valores?.desconto || 0) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Descontos / Cupons</span>
                    <span>- {brl(selectedOrder.valores?.descontos || selectedOrder.valores?.desconto || 0)}</span>
                  </div>
                )}
                {selectedOrder.valores.frete > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Taxa de Entrega</span>
                    <span>{brl(selectedOrder.valores.frete)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 border-t pt-2 mt-2">
                  <span>Total Geral</span>
                  <span className="text-primary">{brl(selectedOrder.valores.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

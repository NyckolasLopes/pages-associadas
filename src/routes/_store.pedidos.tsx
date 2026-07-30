import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/stores/auth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle, Clock, Store, CreditCard, QrCode, Wallet } from "lucide-react";
import { getGreeting, brl } from "@/lib/format";
import { useOrders } from "@/stores/orders";
import { useAdmin } from "@/stores/admin";
import { useFavorites } from "@/stores/favorites";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_store/pedidos")({
  head: () => ({ meta: [{ title: "Meus Pedidos — Farmácias Associadas" }] }),
  component: PedidosPage,
});

function PedidosPage() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  const orders = useOrders((s) => s.orders);
  const pharmacies = useAdmin((s) => s.pharmacies);
  const { ids: favoriteIds } = useFavorites();
  
  const myOrders = orders.filter(o => o.cliente.email === user?.email || o.cliente.nome === user?.name);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);
    useAuth.persist.rehydrate();
  }, []);

  if (!mounted) return null;

  if (!user) {
    return (
      <div className="container-fa py-16 text-center">
        <h1 className="text-2xl font-bold">Acesse sua conta</h1>
        <p className="text-muted-foreground mt-2">Você precisa estar logado para ver seus pedidos.</p>
        <Link to="/login">
          <Button className="mt-6">Entrar</Button>
        </Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <div className="container-fa py-8 grid lg:grid-cols-[250px_1fr] gap-8">
      <aside className="space-y-2">
        <div className="bg-card border rounded-xl p-5 mb-6">
          <p className="text-xs text-muted-foreground font-bold tracking-wider mb-1">{getGreeting()}</p>
          <p className="font-bold text-lg leading-tight truncate">{user.name}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          <Button variant="outline" size="sm" className="w-full mt-4 text-xs font-bold" onClick={handleLogout}>
            Sair da conta
          </Button>
        </div>
        
        <nav className="flex flex-col gap-1">
          <Link to="/pedidos" className="px-4 py-2 bg-primary/10 text-primary font-bold rounded-lg text-sm">
            Meus Pedidos
          </Link>
          <Link to="/perfil" className="px-4 py-2 text-muted-foreground hover:bg-muted font-bold rounded-lg text-sm">
            Meus Dados
          </Link>
          <Link to="/perfil" search={{ tab: "favoritos" }} className="px-4 py-2 flex items-center justify-between text-muted-foreground hover:bg-muted font-bold rounded-lg text-sm transition">
            <span>Meus Favoritos</span>
            {favoriteIds.length > 0 && (
              <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full">{favoriteIds.length}</span>
            )}
          </Link>
        </nav>
      </aside>

      <main>
        <h1 className="text-2xl font-bold mb-6">Acompanhamento de Pedidos</h1>
        
        {myOrders.length === 0 ? (
          <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground shadow-sm">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-bold">Nenhum pedido encontrado</p>
            <p className="text-sm mt-1">Você ainda não realizou nenhuma compra.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myOrders.map(order => {
              const isDelivered = order.status === "Entregue" || order.status === "Retirado";
              const Icon = isDelivered ? CheckCircle : Package;
              return (
                <div key={order.id} className={`bg-card border rounded-xl p-5 shadow-sm ${order.status === 'Cancelado' ? 'opacity-80' : ''}`}>
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground font-bold">Pedido #{order.id}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Realizado em {order.data}</p>
                    </div>
                    <div className={`border px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5
                      ${isDelivered ? 'bg-green-50 text-green-700 border-green-200' : 
                        order.status === 'Cancelado' ? 'bg-red-50 text-red-700 border-red-200' : 
                        'bg-blue-50 text-blue-700 border-blue-200'}
                    `}>
                      <Icon className="h-3.5 w-3.5" /> {order.status}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isDelivered ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{order.produtos.length} Produto{order.produtos.length !== 1 && 's'}</p>
                          <p className="text-xs text-muted-foreground">{order.envio.metodo}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-dark">{brl(order.valores.total)}</p>
                      <Button variant="outline" size="sm" className="mt-2 font-bold" onClick={() => setSelectedOrder(order)}>
                        Ver detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 mt-4">
              <div className="flex justify-between items-start bg-slate-50 p-4 rounded-lg border">
                <div>
                  <div className="text-sm font-bold text-slate-800">Status: <span className="text-primary">{selectedOrder.status}</span></div>
                  <div className="text-xs text-muted-foreground mt-1">Data: {selectedOrder.data}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-slate-800">{brl(selectedOrder.valores.total)}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1.5">
                    {(() => {
                       const m = selectedOrder.pagamento?.metodo?.toLowerCase() || '';
                       const Icon = m.includes('pix') ? QrCode : m.includes('cartão') || m.includes('credito') || m.includes('débito') ? CreditCard : Wallet;
                       return <Icon className="w-3.5 h-3.5" />;
                    })()}
                    <div>
                      {selectedOrder.pagamento?.metodo || 'Não informado'}
                      {selectedOrder.pagamento?.metodo?.toLowerCase().includes('cartão') && selectedOrder.pagamento?.cartaoFinal && (
                        <span className="ml-1 text-slate-400 font-medium">(**** {selectedOrder.pagamento.cartaoFinal})</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-bold text-sm flex items-center gap-2"><Truck className="w-4 h-4 text-primary" /> Entrega</h3>
                  <div className="text-xs text-slate-600">
                    <p><strong>Forma:</strong> {selectedOrder.envio.metodo}</p>
                    <p><strong>Prazo:</strong> {selectedOrder.envio.prazo}</p>
                    <p><strong>Endereço:</strong> {selectedOrder.envio.endereco}</p>
                    <p><strong>CEP/Cidade:</strong> {selectedOrder.envio.cep} - {selectedOrder.envio.cidade}</p>
                    {selectedOrder.envio.rastreio && <p><strong>Rastreio:</strong> {selectedOrder.envio.rastreio}</p>}
                  </div>
                </div>
                <div className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-bold text-sm flex items-center gap-2"><Store className="w-4 h-4 text-primary" /> Loja Responsável</h3>
                  <div className="text-xs text-slate-600">
                    <p className="font-bold">{pharmacies.find(p => p.id === selectedOrder.lojaId)?.razaoSocial || pharmacies.find(p => p.id === selectedOrder.lojaId)?.nome || "Farmácia Associada"}</p>
                    <p><strong>ID:</strong> {selectedOrder.lojaId}</p>
                    <p className="mt-2 text-muted-foreground italic">Em caso de dúvidas sobre este pedido, entre em contato através da central de atendimento.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3 border-b pb-2">Produtos ({selectedOrder.produtos.length})</h3>
                <div className="space-y-3">
                  {selectedOrder.produtos.map((p: any, i: number) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="w-12 h-12 shrink-0 border rounded bg-white p-1">
                        <img src={p.foto} alt={p.nome} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-xs leading-tight line-clamp-2">{p.nome}</p>
                        <p className="text-xs text-muted-foreground mt-1">Ref: {p.sku}</p>
                        <p className="text-xs text-muted-foreground">Qtd: {p.qtd} x {brl(p.valorUnitario)}</p>
                      </div>
                      <div className="font-bold text-slate-800 text-right shrink-0">
                        {brl(p.qtd * p.valorUnitario)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Subtotal produtos</span>
                  <span className="font-medium text-slate-700">{brl(selectedOrder.valores.produtos)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="font-medium text-slate-700">{brl(selectedOrder.valores.frete)}</span>
                </div>
                {selectedOrder.valores.desconto > 0 && (
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Descontos</span>
                    <span className="font-medium text-green-600">- {brl(selectedOrder.valores.desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-base mt-2 pt-2 border-t">
                  <span>Total do Pedido</span>
                  <span className="text-primary-dark">{brl(selectedOrder.valores.total)}</span>
                </div>
              </div>
              
              {selectedOrder.historico && selectedOrder.historico.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-bold text-sm mb-3">Histórico do Pedido</h3>
                  <div className="space-y-3 pl-2 border-l-2 border-slate-100 ml-2">
                    {selectedOrder.historico.map((h: any, i: number) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[13px] top-1 w-2 h-2 rounded-full bg-primary" />
                        <p className="text-xs font-bold text-slate-800">{h.situacao}</p>
                        <p className="text-[10px] text-muted-foreground">{h.data} — por {h.autor}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

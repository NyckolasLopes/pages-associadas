import { useState, useEffect } from "react";
import { ShoppingCart, Trash2, MessageCircle, Eye, RefreshCw, Phone, User, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAbandonedCartsStore, AbandonedCart } from "@/stores/abandoned-carts";
import { useAdmin } from "@/stores/admin";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export function AbandonedCartsWidget({ lojaId }: { lojaId?: string }) {
  const { carts, isLoading, loadCarts, removeCart, updateNotes } = useAbandonedCartsStore();
  const { currentUser, pharmacies, activeStoreId } = useAdmin();
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;

  useEffect(() => {
    loadCarts(lojaId);
    const interval = setInterval(() => loadCarts(lojaId), 20000);
    return () => clearInterval(interval);
  }, [lojaId, loadCarts]);

  // Filter carts
  const authorizedCarts = carts.filter(cart => {
    if (lojaId) return cart.lojaId === lojaId;
    if (activeStoreId) return cart.lojaId === activeStoreId;
    if (isGlobalAdmin) return true;
    return cart.lojaId && currentUser?.lojasVinculadas?.includes(cart.lojaId);
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await removeCart(itemToDelete);
        toast.success("Carrinho abandonado removido.");
      } catch {
        toast.error("Erro ao remover carrinho.");
      }
    }
    setConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleWhatsAppContact = (cart: AbandonedCart) => {
    const rawPhone = cart.phone.replace(/\D/g, "");
    if (!rawPhone) {
      toast.error(`O cliente "${cart.client}" não possui telefone cadastrado.`);
      return;
    }

    const loja = pharmacies.find(p => p.id === cart.lojaId);
    const lojaNome = loja?.nome || cart.lojaNome || "Farmácias Associadas";
    const itemsList = cart.items.map(p => `• ${p.qtd || 1}x ${p.nome}`).join("\n");

    const message = 
      `Olá ${cart.client}, tudo bem? 😊\n\n` +
      `Aqui é da *${lojaNome}*.\n` +
      `Notamos que você selecionou alguns produtos em nossa loja online:\n\n` +
      `${itemsList}\n\n` +
      `💰 *Total:* ${cart.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n\n` +
      `Podemos te ajudar a concluir o pedido ou tirar alguma dúvida?`;

    const fullPhone = rawPhone.startsWith("55") && rawPhone.length > 11 ? rawPhone : `55${rawPhone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
    updateNotes(cart.id, "Em tratativa");
    toast.success(`Abrindo WhatsApp do cliente ${cart.client}...`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="p-5 border-b border-slate-100 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg text-slate-800">
              Carrinhos Abandonados
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Clientes e visitantes que adicionaram produtos e não concluíram a compra.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs text-amber-800 bg-amber-100 border-amber-300 font-bold px-3 py-1">
            {authorizedCarts.length} {authorizedCarts.length === 1 ? 'registro' : 'registros'}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadCarts(lojaId)} 
            disabled={isLoading}
            className="h-8 text-xs font-bold gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 text-slate-700 text-[11px] font-black uppercase tracking-wider border-b">
              <th className="p-4">Cliente</th>
              {isGlobalAdmin && !lojaId && <th className="p-4">Loja</th>}
              <th className="p-4">Itens</th>
              <th className="p-4">Data/Horário</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Valor</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {authorizedCarts.length === 0 ? (
              <tr>
                <td colSpan={isGlobalAdmin && !lojaId ? 7 : 6} className="p-8 text-center text-slate-500">
                  Nenhum carrinho abandonado registrado no momento.
                </td>
              </tr>
            ) : (
              authorizedCarts.map((cart) => {
                const loja = pharmacies.find(p => p.id === cart.lojaId);
                const hasPhone = !!cart.phone.replace(/\D/g, "");
                return (
                  <tr key={cart.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-bold text-slate-800">
                      <div className="flex flex-col">
                        <span>{cart.client}</span>
                        {cart.phone && (
                          <span className="text-xs text-slate-400 font-normal">{cart.phone}</span>
                        )}
                        {cart.email && (
                          <span className="text-[11px] text-slate-400 font-normal">{cart.email}</span>
                        )}
                      </div>
                    </td>

                    {isGlobalAdmin && !lojaId && (
                      <td className="p-4 text-slate-600 font-medium text-xs">
                        {loja?.nome || cart.lojaNome || "Rede"}
                      </td>
                    )}

                    <td className="p-4 text-slate-600 text-xs">
                      <span className="font-semibold text-slate-800">
                        {cart.items.reduce((acc, it) => acc + (it.qtd || 1), 0)} itens
                      </span>
                      <p className="text-[11px] text-slate-400 max-w-[200px] truncate">
                        {cart.items.map(i => `${i.qtd || 1}x ${i.nome}`).join(", ")}
                      </p>
                    </td>

                    <td className="p-4 text-slate-500 text-xs">{cart.abandonedAt}</td>

                    <td className="p-4">
                      <Badge variant="secondary" className={`text-xs font-bold ${cart.recoveryStatus.includes('tratativa') ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {cart.recoveryStatus}
                      </Badge>
                    </td>

                    <td className="p-4 text-right font-black text-slate-800">
                      {cart.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {hasPhone && (
                          <Button
                            size="sm"
                            onClick={() => handleWhatsAppContact(cart)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-2.5 rounded-lg shadow-sm"
                            title="Entrar em contato via WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedCart(cart)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900"
                          title="Ver detalhes dos itens"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0" 
                          onClick={() => handleDelete(cart.id)}
                          title="Excluir registro"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detalhes do Carrinho */}
      <Dialog open={!!selectedCart} onOpenChange={(open) => !open && setSelectedCart(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Itens no Carrinho
            </DialogTitle>
            <DialogDescription>
              {selectedCart?.client} • {selectedCart?.abandonedAt}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
            {selectedCart?.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                  {item.foto || item.imagem ? (
                    <img src={item.foto || item.imagem} alt={item.nome} className="w-10 h-10 object-contain rounded border p-1" />
                  ) : (
                    <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                      <Package className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-800 line-clamp-1">{item.nome}</p>
                    <span className="text-xs text-slate-500">Qtd: {item.qtd || 1}</span>
                  </div>
                </div>
                <span className="font-bold text-slate-800">
                  {((item.valorUnitario || 0) * (item.qtd || 1)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            ))}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-3">
            <div className="text-left">
              <span className="text-xs text-slate-500 block">Total do Carrinho</span>
              <span className="text-lg font-black text-slate-900">
                {selectedCart?.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            {selectedCart?.phone && (
              <Button 
                onClick={() => selectedCart && handleWhatsAppContact(selectedCart)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <MessageCircle className="w-4 h-4 mr-1.5" /> Falar no WhatsApp
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remover Carrinho"
        description="Tem certeza que deseja remover este carrinho da lista? A ação não pode ser desfeita."
        onConfirm={confirmDelete}
      />
    </div>
  );
}

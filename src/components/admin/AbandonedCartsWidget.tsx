import { useState, useEffect } from "react";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAbandonedCartsStore, AbandonedCart } from "@/stores/abandoned-carts";
import { useCart } from "@/stores/cart";
import { useAuth } from "@/stores/auth";
import { useAdmin } from "@/stores/admin";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function AbandonedCartsWidget({ lojaId }: { lojaId?: string }) {
  const { carts, isLoading, loadCarts, removeCart } = useAbandonedCartsStore();
  const { currentUser, pharmacies, activeStoreId } = useAdmin();
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;

  useEffect(() => {
    loadCarts();
  }, [loadCarts]);

  // Filter carts
  const authorizedCarts = carts.filter(cart => {
    // Se foi passado lojaId específico (Painel da Loja)
    if (lojaId) return cart.lojaId === lojaId;
    
    // Se não tem lojaId específico (Painel Global)
    if (activeStoreId) return cart.lojaId === activeStoreId;
    if (isGlobalAdmin) return true;
    return cart.lojaId && currentUser?.lojasVinculadas?.includes(cart.lojaId);
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeCart(itemToDelete);
      toast.success("Carrinho abandonado removido");
    }
    setConfirmOpen(false);
    setItemToDelete(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
      <div className="p-6 border-b border-slate-100 bg-amber-50/50 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-600" />
            Carrinhos Abandonados
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Clientes que adicionaram itens ao carrinho e não finalizaram a compra.
          </p>
        </div>
        <Badge variant="outline" className="text-xs text-amber-700 bg-amber-100/50 border-amber-200 font-bold">
          {authorizedCarts.length} registros
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-[#FAF9F7] text-slate-800 text-[11px] font-black uppercase tracking-wider">
              <th className="p-4">Carrinho</th>
              {isGlobalAdmin && !lojaId && <th className="p-4">Loja</th>}
              <th className="p-4">Data</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Valor</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {authorizedCarts.length === 0 ? (
              <tr>
                <td colSpan={isGlobalAdmin && !lojaId ? 7 : 6} className="p-8 text-center text-slate-500">
                  Nenhum carrinho abandonado encontrado.
                </td>
              </tr>
            ) : (
              authorizedCarts.slice(0, 10).map((cart) => {
                const loja = pharmacies.find(p => p.id === cart.lojaId);
                return (
                  <tr key={cart.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-700">
                      <div className="flex items-center gap-2">
                        {cart.id}
                      </div>
                    </td>
                    {isGlobalAdmin && !lojaId && (
                      <td className="p-4 text-slate-600 font-medium text-xs">
                        {loja?.nome || "Rede"}
                      </td>
                    )}
                    <td className="p-4 text-slate-600 font-medium">{cart.createdAt}</td>
                    <td className="p-4 text-emerald-700 font-bold">{cart.client}</td>
                    <td className="p-4">
                      <Badge variant="secondary" className={`font-bold ${cart.recoveryStatus.includes('Recuperado') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {cart.recoveryStatus}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">
                      {cart.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="p-4 text-center">
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0" onClick={() => handleDelete(cart.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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

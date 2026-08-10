import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, Filter, Search, ChevronDown, ShoppingCart, Trash2, Edit2, MapPin, Phone, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/stores/cart";
import { useAuth } from "@/stores/auth";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAdmin } from "@/stores/admin";

export const Route = createFileRoute("/admin/carrinhos-abandonados")({
  component: CarrinhosAbandonados,
});

import { useAbandonedCartsStore, AbandonedCart } from "@/stores/abandoned-carts";

type TabType = 'todos' | 'sem_transacao' | 'pagamento_nao_aprovado';

function CarrinhosAbandonados() {
  const cartItems = useCart(s => s.items);
  const cartTotal = useCart(s => s.total());
  const clearCart = useCart(s => s.clear);
  const user = useAuth(s => s.user);

  const { carts: storeCarts, updateNotes, removeCart: removeStoreCart } = useAbandonedCartsStore();
  const lastUpdatedAt = useCart(s => (s as any).lastUpdatedAt);
  const selectedPharmacyId = useCart(s => s.selectedPharmacyId);
  const [forceAbandoned, setForceAbandoned] = useState(false);
  const { currentUser, pharmacies, activeStoreId } = useAdmin();
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;
  
  const liveCarts: AbandonedCart[] = [];
  
  if (user && cartItems.length > 0) {
    liveCarts.push({
      id: "#807099", // ID fixo para o mock do carrinho atual
      createdAt: new Date(lastUpdatedAt || Date.now()).toLocaleDateString('pt-BR') + " " + new Date(lastUpdatedAt || Date.now()).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
      client: user.name || "Cliente",
      email: user.email || "",
      phone: (user as any).phone || "(51) 99999-9999",
      address: "Não informado",
      abandonedAt: "Há pouco tempo",
      recoveryStatus: "Aguardando disparo autom.",
      total: cartTotal,
      type: 'sem_transacao',
      notes: "",
      lojaId: selectedPharmacyId || undefined,
      items: cartItems.map(i => ({
        nome: i.nome,
        qtd: i.qty,
        valorUnitario: i.preco,
        foto: "https://placehold.co/100"
      }))
    });
  }

  const carts = [...liveCarts, ...storeCarts];

  // Filtro por loja
  const authorizedCarts = carts.filter(cart => {
    if (activeStoreId) return cart.lojaId === activeStoreId;
    if (isGlobalAdmin) return true;
    return cart.lojaId && currentUser?.lojasVinculadas?.includes(cart.lojaId);
  });

  const [activeTab, setActiveTab] = useState<TabType>('todos');
  const [search, setSearch] = useState("");
  
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const filteredCarts = authorizedCarts.filter(cart => {
    if (activeTab === 'sem_transacao' && cart.type !== 'sem_transacao') return false;
    if (activeTab === 'pagamento_nao_aprovado' && cart.type !== 'pagamento_nao_aprovado') return false;
    if (search && !cart.client.toLowerCase().includes(search.toLowerCase()) && !cart.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      if (itemToDelete === "#807099") {
        clearCart();
      } else {
        removeStoreCart(itemToDelete);
      }
      toast.success("Carrinho removido com sucesso!");
      setIsDetailsOpen(false);
    }
  };

  const handleSaveNotes = () => {
    if (selectedCart) {
      if (selectedCart.id !== "#807099") {
        updateNotes(selectedCart.id, editNotes);
      }
      toast.success("Informações atualizadas!");
      setIsEditMode(false);
      setSelectedCart(prev => prev ? { ...prev, notes: editNotes, recoveryStatus: "Em tratativa" } : null);
    }
  };

  const openDetails = (cart: AbandonedCart) => {
    setSelectedCart(cart);
    setEditNotes(cart.notes || "");
    setIsEditMode(false);
    setIsDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F8] p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-4">
                <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">Carrinhos abandonados</h1>
                <span className="text-sm font-semibold text-slate-600 bg-slate-200/50 px-2.5 py-0.5 rounded-full">
                  {filteredCarts.length} {filteredCarts.length === 1 ? 'carrinho' : 'carrinhos'}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">
                Clientes que deixam produtos no carrinho e não finalizam. Acesse os dados para tentar converter a venda!
              </p>
            </div>
          <div className="flex gap-2">
            {!forceAbandoned && user && cartItems.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setForceAbandoned(true)} className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700">
                Simular Abandono (5 min)
              </Button>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col gap-1">
            <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Total de Abandonos</span>
            <div className="text-3xl font-black text-slate-800">{authorizedCarts.length}</div>
            <span className="text-xs text-slate-400 font-medium">Nos últimos 30 dias</span>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col gap-1">
            <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Disparos Automáticos</span>
            <div className="text-3xl font-black text-slate-800">2</div>
            <span className="text-xs text-slate-400 font-medium">E-mails e SMS enviados</span>
          </div>
          <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 shadow-sm flex flex-col gap-1">
            <span className="text-[13px] font-bold text-emerald-600 uppercase tracking-wider">Carrinhos Recuperados</span>
            <div className="text-3xl font-black text-emerald-700">1</div>
            <span className="text-xs text-emerald-600/80 font-medium leading-relaxed mt-1">
              Medido quando o cliente clica no link do alerta e <strong>finaliza a compra</strong>.
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-4 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab('todos')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
              activeTab === 'todos' ? 'bg-slate-200/70 text-slate-900' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            Todos os carrinhos
          </button>
          <button
            onClick={() => setActiveTab('sem_transacao')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
              activeTab === 'sem_transacao' ? 'bg-slate-200/70 text-slate-900' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            Sem transação
          </button>
          <button
            onClick={() => setActiveTab('pagamento_nao_aprovado')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
              activeTab === 'pagamento_nao_aprovado' ? 'bg-slate-200/70 text-slate-900' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            Pagamento não aprovado
          </button>
        </div>

        {/* Content Area */}
        {filteredCarts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="relative">
              <h2 className="text-4xl font-bold text-slate-900">Nenhum carrinho encontrado</h2>
            </div>
            <p className="text-slate-600 font-medium mt-6 pt-4">Tente mudar os filtros ou realizar uma nova busca.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-200/60 overflow-hidden">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-white">
              <Button variant="outline" className="h-10 font-bold text-slate-700 gap-2 border-slate-300">
                <Filter className="h-4 w-4" /> Filtrar
              </Button>
              
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="buscar cliente ou ID" 
                  className="pl-9 h-10 border-slate-300 bg-slate-50/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Button variant="outline" className="h-10 font-bold text-slate-700 gap-2 border-slate-300">
                Ações <ChevronDown className="h-4 w-4 text-slate-400" />
              </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-[#FAF9F7] text-slate-800 text-[11px] font-black uppercase tracking-wider">
                    <th className="p-4">Carrinho</th>
                    {isGlobalAdmin && <th className="p-4">Loja</th>}
                    <th className="p-4">Criado em</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Valor</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCarts.map((cart) => {
                    const loja = pharmacies.find(p => p.id === cart.lojaId);
                    return (
                    <tr key={cart.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openDetails(cart)}>
                      <td className="p-4 font-bold text-slate-700">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-slate-400" />
                          {cart.id}
                        </div>
                      </td>
                      {isGlobalAdmin && (
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
                      <td className="p-4 font-bold text-slate-800">
                        {cart.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(cart.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-[#FAF9F7]">
              <div className="flex items-center gap-4">
                <Select defaultValue="10">
                  <SelectTrigger className="h-9 w-[80px] bg-white border-slate-300 font-bold text-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm font-medium text-slate-500">Itens por página</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal de Detalhes do Carrinho */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-slate-500" /> 
              Detalhes do Carrinho {selectedCart?.id}
            </DialogTitle>
            <DialogDescription>
              Dados para contato e tentativa de conversão. 
              {isGlobalAdmin && selectedCart?.lojaId && (
                <span className="ml-2 font-bold text-emerald-700">
                  (Loja: {pharmacies.find(p => p.id === selectedCart.lojaId)?.nome || "Rede"})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedCart && (
            <div className="space-y-6 py-4">
              {/* Dados do Cliente */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-3">
                <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Informações de Contato</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-500 text-xs">Nome Completo</p>
                      <p className="font-bold text-slate-800">{selectedCart.client}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-500 text-xs">Celular</p>
                      <p className="font-bold text-emerald-700">{selectedCart.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-500 text-xs">E-mail</p>
                      <p className="font-bold text-slate-800">{selectedCart.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-500 text-xs">Endereço de Entrega</p>
                      <p className="font-bold text-slate-800">{selectedCart.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Produtos do Carrinho */}
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-3">Produtos Abandonados</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {selectedCart.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                      <div className="h-10 w-10 bg-slate-100 rounded flex-shrink-0">
                        <img src={item.foto} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-slate-700">{item.nome}</p>
                        <p className="text-xs text-slate-500">{item.qtd}x de {item.valorUnitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                      </div>
                      <div className="font-black text-slate-800">
                        {(item.qtd * item.valorUnitario).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">Total do Carrinho</p>
                    <p className="text-2xl font-black text-emerald-600">{selectedCart.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                  </div>
                </div>
              </div>

              {/* Notas de Tratativa */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm">Notas e Histórico de Tratativa</h3>
                  {!isEditMode && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditMode(true)} className="h-8 text-indigo-600 gap-1">
                      <Edit2 className="h-3 w-3" /> Adicionar Nota
                    </Button>
                  )}
                </div>
                {isEditMode ? (
                  <div className="space-y-2">
                    <Textarea 
                      placeholder="Ex: Liguei para o cliente, mas não atendeu. Tentar novamente mais tarde."
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setIsEditMode(false)}>Cancelar</Button>
                      <Button size="sm" onClick={handleSaveNotes}>Salvar Nota</Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800 whitespace-pre-wrap">
                    {selectedCart.notes ? selectedCart.notes : "Nenhuma anotação registrada ainda. Ligue para o cliente e registre o andamento."}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
            <Button variant="destructive" onClick={() => handleDelete(selectedCart!.id)}>Excluir Carrinho</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => window.open(`https://wa.me/55${selectedCart?.phone.replace(/\D/g, '')}`, '_blank')}>
                Chamar no WhatsApp
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Tem certeza que deseja excluir este carrinho abandonado?"
        description="Esta ação não poderá ser desfeita."
      />
    </div>
  );
}

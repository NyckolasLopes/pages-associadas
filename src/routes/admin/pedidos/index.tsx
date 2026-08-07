import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  Package,
  MapPin,
  CreditCard,
  Check,
  Mail,
  MessageSquare,
  AlertCircle,
  Store,
  Trash2,
  Code,
  Copy,
  ShoppingCart,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOrders, Pedido } from "@/stores/orders";
import { useAdmin } from "@/stores/admin";
import { useAbandonedCartsStore, AbandonedCart } from "@/stores/abandoned-carts";
import { useCart } from "@/stores/cart";
import { useAuth } from "@/stores/auth";

export const Route = createFileRoute("/admin/pedidos/")({
  component: PedidosAdmin,
});

export function PedidosAdmin() {
  const { orders: allOrders, updateOrderStatus, updateOrderTracking, deleteOrder } = useOrders();
  const { pharmacies, currentUser, grupos } = useAdmin();
  
  // Carrinhos abandonados / itens de clientes logados
  const { carts: storeCarts, removeCart: removeStoreCart } = useAbandonedCartsStore();
  const cartItems = useCart(s => s.items);
  const cartTotal = useCart(s => s.total());
  const clearCart = useCart(s => s.clear);
  const user = useAuth(s => s.user);
  const lastUpdatedAt = useCart(s => (s as any).lastUpdatedAt);
  const selectedPharmacyId = useCart(s => s.selectedPharmacyId);

  const liveCarts: AbandonedCart[] = [];
  if (user && cartItems.length > 0) {
    liveCarts.push({
      id: "#807099",
      createdAt: new Date(lastUpdatedAt || Date.now()).toLocaleDateString('pt-BR') + " " + new Date(lastUpdatedAt || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      client: user.name || "Cliente",
      email: user.email || "",
      phone: (user as any).phone || "(51) 99999-9999",
      address: "Não informado",
      abandonedAt: "Há pouco tempo",
      recoveryStatus: "Aguardando disparo autom.",
      total: cartTotal,
      type: 'sem_transacao',
      lojaId: selectedPharmacyId || undefined,
      items: cartItems.map(i => ({
        nome: i.nome,
        qtd: i.qty,
        valorUnitario: i.preco,
        foto: "https://placehold.co/100"
      }))
    });
  }
  const allAbandonedCartsRaw = [...liveCarts, ...storeCarts];
    
    const isGlobalAdmin = () => {
      if (currentUser?.proprietario) return true;
      const userGroup = grupos.find(g => g.id === currentUser?.grupoId);
      return userGroup?.permissao_total || false;
    };

    const orders = allOrders.filter(o => {
      if (!isGlobalAdmin() && (!currentUser?.lojasVinculadas || !currentUser.lojasVinculadas.includes(o.lojaId))) return false;
      return true;
    });

    const allAbandonedCarts = allAbandonedCartsRaw.filter(c => {
      if (!isGlobalAdmin() && (!currentUser?.lojasVinculadas || !currentUser.lojasVinculadas.includes(c.lojaId))) return false;
      return true;
    });

  
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateStartFilter, setDateStartFilter] = useState("");
  const [dateEndFilter, setDateEndFilter] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [mainView, setMainView] = useState<"todos" | "concluidos" | "carrinhos">("todos");

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteOrder(itemToDelete);
      setSelectedOrder(null);
      setConfirmOpen(false);
      toast.success("Pedido excluído com sucesso!");
    }
  };

  const getLojaName = (id?: string) => {
    if (!id) return "Loja Principal";
    const p = pharmacies.find(ph => ph.id === id);
    return p ? p.nomeFantasia : id;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const exportToExcel = () => {
    const headers = ["ID", "Data", "Cliente", "Email", "CPF", "Telefone", "Loja", "Produtos", "Frete", "Total"];
    const rows = filteredOrders.map(o => [
      o.id,
      o.data,
      o.cliente.nome,
      o.cliente.email,
      o.cliente.cpf,
      o.cliente.telefone,
      getLojaName(o.lojaId),
      (o.valores?.produtos || 0).toString().replace('.', ','),
      (o.valores?.frete || 0).toString().replace('.', ','),
      (o.valores?.total || 0).toString().replace('.', ',')
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pedidos_associadas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Planilha exportada com sucesso!");
  };

  const filteredOrders = orders.filter(o => {
      if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!o.id.toLowerCase().includes(term) && !o.cliente.nome.toLowerCase().includes(term)) {
        return false;
      }
    }
    
    if (dateStartFilter || dateEndFilter) {
       const orderDateStr = o.data.split(" ")[0]; 
       if (orderDateStr && orderDateStr.includes("/")) {
         const [d, m, y] = orderDateStr.split("/");
         const orderDateObj = new Date(`${y}-${m}-${d}T12:00:00`);
         if (dateStartFilter && orderDateObj < new Date(dateStartFilter + "T00:00:00")) return false;
         if (dateEndFilter && orderDateObj > new Date(dateEndFilter + "T23:59:59")) return false;
       }
    }
    return true;
  });

  const filteredAbandonedCarts = allAbandonedCarts.filter(c => {
      if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!c.id.toLowerCase().includes(term) && !c.client.toLowerCase().includes(term)) {
        return false;
      }
    }
    return true;
  });

  const kpis = {
    total: orders.length,
    concluidos: orders.length,
    carrinhosARecuperar: allAbandonedCarts.length,
  };

  if (selectedOrder) {
    // --- DETAILS VIEW ---
    const isPickup = (selectedOrder.envio?.metodo || "").includes("Retirada");

    return (
      <div className="min-h-screen bg-slate-50/50 p-6 font-sans">
        <div className="max-w-6xl mx-auto space-y-6">
          <button 
            onClick={() => setSelectedOrder(null)}
            className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors print:hidden"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar para lista de pedidos
          </button>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Pedido #{selectedOrder.id}</h1>
                <div className="px-3 py-1 rounded-full text-xs font-bold border bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Concluído (WhatsApp)
                </div>
              </div>
              <span className="text-slate-500 font-medium text-sm flex items-center gap-2">
                Efetuado em {selectedOrder.data} 
                <span className="w-1 h-1 rounded-full bg-slate-300" /> 
                <Store className="h-3 w-3" /> {getLojaName(selectedOrder.lojaId)}
              </span>
            </div>
            <div className="flex items-center gap-3 print:hidden">
               <Button 
                 className="h-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
                 onClick={() => {
                    const cleanPhone = (selectedOrder.cliente.telefone || "").replace(/\D/g, "");
                    const text = `Olá ${selectedOrder.cliente.nome.split(" ")[0]}, estamos em contato sobre o seu pedido #${selectedOrder.id} realizado na Farmácias Associadas!`;
                    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
                 }}
               >
                 <MessageSquare className="h-4 w-4" />
                 Falar no WhatsApp
               </Button>
               <Button variant="outline" className="h-10 font-bold bg-white text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2" onClick={() => handleDelete(selectedOrder.id)}>
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
              <Button variant="outline" className="h-10 font-bold bg-white gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4 text-slate-400" />
                Imprimir
              </Button>
            </div>
          </div>

          {/* Info Blocks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <MapPin className="h-5 w-5" />
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Entrega / Logística</h3>
              </div>
              <div>
                <div className="font-bold text-slate-800">{selectedOrder.envio?.metodo || "Padrão"}</div>
                {!isPickup && selectedOrder.envio && (
                  <>
                    <div className="text-sm text-slate-500 mt-1">{selectedOrder.envio.endereco || "Endereço não informado"}</div>
                    <div className="text-sm text-slate-500">{selectedOrder.envio.cidade || ""} {selectedOrder.envio.cep ? `- CEP: ${selectedOrder.envio.cep}` : ""}</div>
                    <div className="text-xs font-bold text-slate-500 mt-3 pt-2 border-t">Prazo estimado: {selectedOrder.envio.prazo || "Imediato"}</div>
                  </>
                )}
                {isPickup && (
                  <>
                    <div className="text-sm text-emerald-600 mt-1 font-bold">Retirada no balcão da loja.</div>
                    <div className="text-sm text-slate-500 mt-1 font-medium">O cliente fará a retirada na unidade informada.</div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Store className="h-5 w-5" />
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Loja de Atendimento</h3>
              </div>
              <div>
                <div className="font-bold text-slate-800">{getLojaName(selectedOrder.lojaId)}</div>
                <div className="text-sm text-slate-500 mt-1">Pedido direcionado para atendimento via WhatsApp</div>
                <div className="text-xs text-emerald-700 bg-emerald-50 font-bold p-2 rounded-lg mt-3 border border-emerald-100 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Concluído pelo carrinho da loja
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Valor Total</h3>
              </div>
              <div className="text-3xl font-black text-slate-800">
                {selectedOrder.valores.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <div className="space-y-1.5 pt-3 border-t border-emerald-200/50">
                <div className="flex justify-between text-sm font-medium text-slate-600">
                  <span>Subtotal Produtos</span>
                  <span className="font-bold">{(selectedOrder.valores?.produtos || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-slate-600">
                  <span>Frete</span>
                  <span className="font-bold">{(selectedOrder.valores?.frete || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
            {/* Products List */}
            <div className="bg-white border shadow-sm rounded-2xl overflow-hidden h-fit">
              <div className="p-5 border-b flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-600" />
                  Itens do Pedido <Badge variant="secondary" className="ml-1 bg-white">{selectedOrder.produtos?.length || 0}</Badge>
                </h3>
              </div>
              <div className="p-2 space-y-2">
                {(selectedOrder.produtos || []).map(p => (
                   <div key={p.sku} className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                      <div className="w-16 h-16 rounded-lg border bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        <img src={p.foto} alt={p.nome} className="w-full h-full object-cover" />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="font-bold text-slate-800 text-sm leading-tight hover:text-emerald-600 cursor-pointer">{p.nome}</div>
                        <div className="text-xs text-slate-500 mt-1 font-medium">SKU: {p.sku}</div>
                      </div>
                      <div className="px-6 text-center">
                         <div className="text-[10px] font-bold text-slate-400 uppercase">Qtd</div>
                         <div className="font-black text-slate-700 text-base">{p.qtd || 1}</div>
                      </div>
                      <div className="px-4 text-right">
                         <div className="text-[10px] font-bold text-slate-400 uppercase">Total</div>
                         <div className="font-bold text-emerald-700">{((p.valorUnitario || 0) * (p.qtd || 1)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                      </div>
                   </div>
                ))}
              </div>
            </div>

            {/* Client Profile */}
            <div className="bg-white border shadow-sm rounded-2xl p-6 h-fit space-y-6">
               <div>
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Dados do Cliente</h3>
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 font-black text-lg flex items-center justify-center">
                        {selectedOrder.cliente.nome.charAt(0)}
                     </div>
                     <div>
                        <div className="font-bold text-slate-800 leading-tight">{selectedOrder.cliente.nome}</div>
                        <div className="text-xs font-bold text-slate-500 mt-1">Cliente WhatsApp</div>
                     </div>
                  </div>
               </div>

               <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="font-medium hover:text-emerald-600 cursor-pointer">{selectedOrder.cliente.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MessageSquare className="h-4 w-4 text-green-500" />
                    <span className="font-bold text-slate-800">{selectedOrder.cliente.telefone}</span>
                  </div>
                  {selectedOrder.cliente.cpf && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <span className="text-xs font-bold text-slate-400 uppercase w-4 text-center">CPF</span>
                      <span className="font-medium">{selectedOrder.cliente.cpf}</span>
                    </div>
                  )}
               </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="min-h-screen bg-slate-50/50 p-6 font-sans overflow-x-hidden">
      <div className="w-full max-w-[1600px] mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{isGlobalAdmin() ? 'Pedidos de Lojas' : 'Meus Pedidos'}</h1>
            <span className="text-slate-500 font-medium text-sm">Gerencie os pedidos concluídos via WhatsApp e os carrinhos a recuperar.</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isGlobalAdmin() && (
              <Button variant="outline" className="font-bold gap-2 bg-white border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200" onClick={() => setIsApiModalOpen(true)}>
                <Code className="h-4 w-4" /> API de Pedidos
              </Button>
            )}
            <Button variant="outline" className="font-bold gap-2 bg-white" onClick={exportToExcel}>
              <Download className="h-4 w-4" /> Exportar Planilha
            </Button>
          </div>
        </div>

        {/* 3 KPIs Principais: TOTAL DE PEDIDOS, CONCLUIDO, CARRINHOS A RECUPERAR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {/* TOTAL DE PEDIDOS */}
           <div 
             onClick={() => setMainView("todos")}
             className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center justify-between hover:shadow-md ${
               mainView === "todos" ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20" : ""
             }`}
           >
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">TOTAL DE PEDIDOS</p>
                <p className="text-3xl font-black text-slate-800">{kpis.total}</p>
                <span className="text-[12px] text-slate-400 font-medium">Todos os pedidos registrados</span>
              </div>
              <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
           </div>

           {/* CONCLUÍDO (WHATSAPP) */}
           <div 
             onClick={() => setMainView("concluidos")}
             className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center justify-between hover:shadow-md ${
               mainView === "concluidos" ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20" : ""
             }`}
           >
              <div>
                <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">CONCLUÍDO</p>
                <p className="text-3xl font-black text-emerald-700">{kpis.concluidos}</p>
                <span className="text-[12px] text-emerald-600 font-semibold">Finalizados no WhatsApp</span>
              </div>
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
           </div>

           {/* CARRINHOS A RECUPERAR */}
           <div 
             onClick={() => setMainView("carrinhos")}
             className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center justify-between hover:shadow-md ${
               mainView === "carrinhos" ? "ring-2 ring-amber-500 border-amber-500 bg-amber-50/20" : ""
             }`}
           >
              <div>
                <p className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">CARRINHOS A RECUPERAR</p>
                <p className="text-3xl font-black text-amber-700">{kpis.carrinhosARecuperar}</p>
                <span className="text-[12px] text-amber-600 font-semibold">Clientes com itens no carrinho</span>
              </div>
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                <ShoppingCart className="h-6 w-6" />
              </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {/* Top Bar */}
          <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder={mainView === "carrinhos" ? "Buscar por cliente ou ID do carrinho..." : "Buscar por ID, Cliente..."} 
                  className="pl-9 h-10 w-full bg-white border-slate-200 font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setMainView("todos")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    mainView === "todos" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Pedidos ({orders.length})
                </button>
                <button
                  onClick={() => setMainView("carrinhos")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    mainView === "carrinhos" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Carrinhos a Recuperar ({allAbandonedCarts.length})
                </button>
              </div>

              {mainView !== "carrinhos" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 font-bold gap-2 bg-white text-slate-600 border-slate-200">
                      <Filter className="h-4 w-4" /> Período
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4 rounded-xl border-slate-200 shadow-xl" align="end">
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-800">Filtrar por data</h4>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Período</label>
                        <div className="flex items-center gap-2">
                           <Input type="date" className="h-8 text-xs font-bold" value={dateStartFilter} onChange={e => setDateStartFilter(e.target.value)} />
                           <span className="text-slate-400 font-medium">a</span>
                           <Input type="date" className="h-8 text-xs font-bold" value={dateEndFilter} onChange={e => setDateEndFilter(e.target.value)} />
                        </div>
                      </div>

                      <Button className="w-full font-bold h-9 bg-slate-100 hover:bg-slate-200 text-slate-700" onClick={() => {
                          setDateStartFilter("");
                          setDateEndFilter("");
                      }} variant="ghost">
                        Limpar Filtro de Data
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          {/* Table Pedidos (sem coluna STATUS e sem coluna PAGAMENTO) */}
          {mainView !== "carrinhos" ? (
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left text-[13px] min-w-[800px]">
                <thead>
                  <tr className="border-b text-slate-400 text-[11px] font-black uppercase bg-white tracking-wider">
                    <th className="px-3 py-3 w-10 text-center"><Checkbox /></th>
                    <th className="px-3 py-3 whitespace-nowrap">Pedido</th>
                    <th className="px-3 py-3">Cliente</th>
                    <th className="px-3 py-3">Loja Faturamento</th>
                    <th className="px-3 py-3">Itens</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">Total / Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-500 font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                          <span className="text-lg font-bold text-slate-700">Nenhum pedido encontrado.</span>
                          <span className="text-sm font-medium text-slate-500">Não encontramos nenhum pedido com os critérios de busca.</span>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  {filteredOrders.map(order => {
                    return (
                      <tr 
                        key={order.id} 
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="px-3 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <Checkbox />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="font-bold text-slate-800 text-[15px]">#{order.id}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{order.data}</div>
                        </td>
                        <td className="px-3 py-3">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-110 transition-transform">
                                 {order.cliente.nome.charAt(0)}
                              </div>
                              <div className="max-w-[180px]">
                                 <div className="font-bold text-slate-700 truncate">{order.cliente.nome}</div>
                                 <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3 text-green-500 shrink-0" />
                                    {order.cliente.telefone}
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-3 py-3">
                           <div className="flex items-center gap-2">
                             <Store className="h-4 w-4 text-slate-400 shrink-0" />
                             <span className="font-bold text-slate-800 text-[13px] leading-tight break-words">{getLojaName(order.lojaId)}</span>
                           </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-slate-700 text-xs">
                            <span className="font-bold text-slate-800">{order.produtos?.reduce((acc, p) => acc + (p.qtd || 1), 0) || order.produtos?.length || 1} item(s)</span>
                            <div className="text-slate-400 text-[11px] truncate max-w-[220px]">
                              {order.produtos?.map(p => `${p.qtd || 1}x ${p.nome}`).join(", ")}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <div className="font-black text-slate-800 text-[15px] mr-2">
                              {order.valores.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-2.5 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold gap-1 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                const cleanPhone = (order.cliente.telefone || "").replace(/\D/g, "");
                                const text = `Olá ${order.cliente.nome.split(" ")[0]}, tudo bem? Estamos em contato sobre o seu pedido #${order.id} na Farmácias Associadas!`;
                                window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
                              }}
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                              WhatsApp
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 shrink-0 rounded-lg" onClick={(e) => { e.stopPropagation(); handleDelete(order.id); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Table Carrinhos a Recuperar */
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left text-[13px] min-w-[800px]">
                <thead>
                  <tr className="border-b text-slate-400 text-[11px] font-black uppercase bg-white tracking-wider">
                    <th className="px-3 py-3 w-10 text-center"><Checkbox /></th>
                    <th className="px-3 py-3 whitespace-nowrap">Cliente / Carrinho</th>
                    <th className="px-3 py-3">Contato</th>
                    <th className="px-3 py-3">Produtos no Carrinho</th>
                    <th className="px-3 py-3">Loja</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">Total / Recuperação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAbandonedCarts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-500 font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ShoppingCart className="w-8 h-8 text-slate-300 mb-2" />
                          <span className="text-lg font-bold text-slate-700">Nenhum carrinho pendente de recuperação.</span>
                          <span className="text-sm font-medium text-slate-500">Quando clientes logados deixarem itens no carrinho sem finalizar, eles aparecerão aqui para recuperação.</span>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  {filteredAbandonedCarts.map(cart => (
                    <tr key={cart.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="px-3 py-3 text-center">
                        <Checkbox />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-[14px]">{cart.client}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{cart.abandonedAt} • {cart.createdAt}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          {cart.phone}
                        </div>
                        {cart.email && <div className="text-[11px] text-slate-400">{cart.email}</div>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-slate-700 text-xs">
                          <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mr-2">
                            {cart.items.reduce((acc, i) => acc + i.qtd, 0)} item(s)
                          </span>
                          <span className="text-slate-600 truncate inline-block max-w-[220px] align-middle">
                            {cart.items.map(i => `${i.qtd}x ${i.nome}`).join(", ")}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-semibold text-slate-700 text-xs">{getLojaName(cart.lojaId)}</span>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <div className="font-black text-slate-800 text-[15px] mr-2">
                            {cart.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </div>
                          <Button 
                            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm rounded-lg text-xs"
                            onClick={() => {
                              const loja = pharmacies.find(p => p.id === cart.lojaId);
                                const cleanPhone = (loja?.whatsapp || loja?.telefone || "").replace(/\D/g, "");
                                if (!cleanPhone) {
                                  toast.error("Esta loja não possui telefone cadastrado.");
                                  return;
                                }
                                const itemsList = cart.items.map(i => `• ${i.qtd}x ${i.nome}`).join("\n");
                                const text = `Olá, equipe da loja ${loja?.nomeFantasia}! 👋\n\nHá um carrinho abandonado pendente de contato na sua unidade.\n\n*Cliente:* ${cart.client}\n*Telefone do Cliente:* ${cart.phone}\n\n*Itens no carrinho:*\n${itemsList}\n\n*Total:* R$ ${cart.total.toFixed(2).replace(".", ",")}\n\nPor favor, entrem em contato com o cliente para tentar recuperar esta venda.`;
                                window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
                              }}
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-white" />
                              Avisar Loja
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 shrink-0 rounded-lg"
                            onClick={() => {
                              if (cart.id === "#807099") {
                                clearCart();
                              } else {
                                removeStoreCart(cart.id);
                              }
                              toast.success("Carrinho removido!");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Tem certeza que deseja excluir este pedido?"
        description="Essa ação não pode ser desfeita."
      />

      {/* Modal API de Pedidos */}
      <Dialog open={isApiModalOpen} onOpenChange={setIsApiModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <Code className="h-6 w-6 text-emerald-600" /> API de Pedidos
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="bg-slate-50 border rounded-xl p-4 text-sm text-slate-600">
              <p className="font-medium">Utilize a nossa API RESTful para integrar a entrada de pedidos diretamente com o seu sistema de ERP (ex: Trier, Linx, etc).</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-800">1. Credenciais de Acesso (Bearer Token)</h3>
              <p className="text-sm text-slate-500">Envie este token no cabeçalho <code className="bg-slate-100 px-1 rounded">Authorization</code> das suas requisições.</p>
              <div className="flex items-center gap-2 bg-slate-900 text-slate-300 p-3 rounded-lg font-mono text-sm border border-slate-700">
                <span className="flex-1 truncate">Bearer sk_live_51Mabc123DEF...</span>
                <Button variant="ghost" size="sm" className="h-8 hover:bg-slate-800 text-slate-400 hover:text-white" onClick={() => copyToClipboard("sk_live_51Mabc123DEF")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-800">2. Webhook: Receber Novos Pedidos</h3>
              <p className="text-sm text-slate-500">Cadastre a URL do seu ERP para receber um POST (JSON) toda vez que um pedido for concluído.</p>
              <div className="flex gap-2">
                <Input placeholder="https://seu-erp.com.br/api/receber-pedido" className="flex-1" />
                <Button className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white">Salvar Webhook</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

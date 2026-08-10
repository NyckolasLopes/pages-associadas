import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  Package,
  MapPin,
  Check,
  Mail,
  MessageSquare,
  AlertCircle,
  Store,
  Trash2,
  Code,
  Copy,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Eye,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useOrders, Pedido } from "@/stores/orders";
import { useAdmin } from "@/stores/admin";
import { useAbandonedCartsStore, AbandonedCart } from "@/stores/abandoned-carts";
import { useCart } from "@/stores/cart";
import { useAuth } from "@/stores/auth";

export const Route = createFileRoute("/admin/pedidos/")({
  component: PedidosAdmin,
});

interface UnifiedOrderItem {
  id: string;
  data: string;
  dataOriginal: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail?: string;
  clienteCpf?: string;
  clienteEndereco?: string;
  lojaId?: string;
  lojaNome: string;
  status: "Concluído" | "Pendente";
  statusDesc: string;
  itensQtd: number;
  itensDesc: string;
  produtos: Array<{
    nome: string;
    qtd?: number;
    quantidade?: number;
    valorUnitario?: number;
    preco?: number;
    foto?: string;
    imagem?: string;
    sku?: string;
  }>;
  total: number;
  tipo: "pedido" | "carrinho";
  rawOrder?: Pedido;
  rawCart?: AbandonedCart;
}

import { useEffect } from 'react';

export function PedidosAdmin() {
  const { orders: allOrders, deleteOrder, loadOrders } = useOrders();
  const { pharmacies, currentUser, grupos, activeStoreId } = useAdmin();

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);
  
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

  const isGlobalView = isGlobalAdmin() && !activeStoreId;

  const orders = allOrders.filter(o => {
    if (activeStoreId) return o.lojaId === activeStoreId;
    if (!isGlobalAdmin() && (!currentUser?.lojasVinculadas || !currentUser.lojasVinculadas.includes(o.lojaId as string))) return false;
    return true;
  });

  const allAbandonedCarts = allAbandonedCartsRaw.filter(c => {
    if (activeStoreId) return c.lojaId === activeStoreId;
    if (!isGlobalAdmin() && (!currentUser?.lojasVinculadas || !currentUser.lojasVinculadas.includes(c.lojaId as string))) return false;
    return true;
  });

  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
  const [selectedCartItem, setSelectedCartItem] = useState<UnifiedOrderItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateStartFilter, setDateStartFilter] = useState("");
  const [dateEndFilter, setDateEndFilter] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; tipo: "pedido" | "carrinho" } | null>(null);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [mainView, setMainView] = useState<"todos" | "concluidos" | "carrinhos">("todos");

  const getLojaName = (id?: string, fallbackName?: string) => {
    const p = id ? pharmacies.find(ph => ph.id === id) : null;
    return p ? (p.nome) : (fallbackName || "Farmácias Associadas");
  };

  const handleDelete = (id: string, tipo: "pedido" | "carrinho") => {
    setItemToDelete({ id, tipo });
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.tipo === "pedido") {
        deleteOrder(itemToDelete.id);
        if (selectedOrder?.id === itemToDelete.id) setSelectedOrder(null);
      } else {
        if (itemToDelete.id === "#807099") {
          clearCart();
        } else {
          removeStoreCart(itemToDelete.id);
        }
        if (selectedCartItem?.id === itemToDelete.id) setSelectedCartItem(null);
      }
      setConfirmOpen(false);
      setItemToDelete(null);
      toast.success(itemToDelete.tipo === "pedido" ? "Pedido excluído com sucesso!" : "Carrinho excluído com sucesso!");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  // Função para avisar a loja faturadora via WhatsApp (Admin Global avisa a loja para que ela entre em contato)
  const handleAvisarLoja = (item: {
    id: string;
    lojaId?: string;
    lojaNome: string;
    clienteNome: string;
    clienteTelefone: string;
    total: number;
    status: "Concluído" | "Pendente";
    produtos: Array<{ nome: string; qtd?: number; quantidade?: number }>;
  }) => {
    const loja = pharmacies.find(p => p.id === item.lojaId);
    const rawPhone = loja?.whatsapp || loja?.telefone || "";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    if (!cleanPhone) {
      toast.error(`A loja "${item.lojaNome}" não possui número de WhatsApp ou telefone cadastrado.`);
      return;
    }

    const itemsList = item.produtos.map(p => `• ${p.qtd || p.quantidade || 1}x ${p.nome}`).join("\n");
    const isPendente = item.status === "Pendente";

    const message = isPendente
      ? `💊 *FARMÁCIAS ASSOCIADAS - ADMIN GLOBAL*\n` +
        `🏬 *Unidade:* ${loja?.nome || item.lojaNome}\n` +
        `⚠️ *AVISO DE PEDIDO PENDENTE / CARRINHO ABANDONADO*\n\n` +
        `Olá equipe! Há um pedido pendente/carrinho em aberto no sistema.\n\n` +
        `👤 *Cliente:* ${item.clienteNome}\n` +
        `📱 *WhatsApp do Cliente:* ${item.clienteTelefone}\n\n` +
        `🛒 *Itens do Pedido:*\n${itemsList}\n\n` +
        `💰 *Total:* ${item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n\n` +
        `👉 *Ação necessária:* Por favor, entrem em contato com o cliente para dar seguimento ao atendimento e finalizar a compra!`
      : `💊 *FARMÁCIAS ASSOCIADAS - ADMIN GLOBAL*\n` +
        `🏬 *Unidade:* ${loja?.nome || item.lojaNome}\n` +
        `🔔 *AVISO DE PEDIDO CONCLUÍDO (#${item.id})*\n\n` +
        `Olá equipe! Temos um pedido registrado para a sua loja.\n\n` +
        `👤 *Cliente:* ${item.clienteNome}\n` +
        `📱 *Telefone:* ${item.clienteTelefone}\n\n` +
        `🛒 *Itens do Pedido:*\n${itemsList}\n\n` +
        `💰 *Total:* ${item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n\n` +
        `👉 *Ação necessária:* Verifiquem o pedido no painel da sua loja e façam o contato/separação dos itens.`;

    const fullPhone = cleanPhone.startsWith("55") && cleanPhone.length > 11 ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
    toast.success(`Abrindo WhatsApp da loja ${loja?.nome || item.lojaNome}...`);
  };

  // Função para a loja falar diretamente com o cliente via WhatsApp ("Ver no WhatsApp")
  const handleVerWhatsAppCliente = (item: {
    id: string;
    lojaId?: string;
    lojaNome: string;
    clienteNome: string;
    clienteTelefone: string;
    total: number;
    status: "Concluído" | "Pendente";
    produtos: Array<{ nome: string; qtd?: number; quantidade?: number }>;
  }) => {
    const rawPhone = item.clienteTelefone || "";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    if (!cleanPhone) {
      toast.error(`O cliente "${item.clienteNome}" não possui número de WhatsApp cadastrado.`);
      return;
    }

    const loja = pharmacies.find(p => p.id === item.lojaId);
    const lojaNome = loja?.nome || item.lojaNome || "Farmácias Associadas";
    const itemsList = item.produtos.map(p => `• ${p.qtd || p.quantidade || 1}x ${p.nome}`).join("\n");
    const isPendente = item.status === "Pendente";

    const message = isPendente
      ? `Olá ${item.clienteNome}, tudo bem? 😊\n\n` +
        `Aqui é da *${lojaNome}* (Farmácias Associadas).\n` +
        `Notamos que você selecionou alguns produtos em nosso site e gostaríamos de ajudar a finalizar seu pedido:\n\n` +
        `🛒 *Itens:*\n${itemsList}\n\n` +
        `💰 *Total:* ${item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n\n` +
        `Como prefere realizar o pagamento ou entrega? Estamos à disposição para atendê-lo(a)!`
      : `Olá ${item.clienteNome}, tudo bem? 😊\n\n` +
        `Aqui é da *${lojaNome}* (Farmácias Associadas).\n` +
        `Recebemos o seu pedido *#${item.id}* com sucesso!\n\n` +
        `🛒 *Itens:*\n${itemsList}\n\n` +
        `💰 *Total:* ${item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n\n` +
        `Já estamos preparando seu pedido com todo o cuidado. Qualquer dúvida, pode falar conosco por aqui!`;

    const fullPhone = cleanPhone.startsWith("55") && cleanPhone.length > 11 ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
    toast.success(`Abrindo WhatsApp do cliente ${item.clienteNome}...`);
  };

  // Unificação de todos os pedidos: Concluídos (via WhatsApp) + Pendentes (no carrinho)
  const allUnifiedOrders: UnifiedOrderItem[] = useMemo(() => {
    const list: UnifiedOrderItem[] = [];
    const seenIds = new Set<string>();

    // 1. Pedidos Concluídos (via WhatsApp / Finalizados)
    orders.forEach(order => {
      seenIds.add(order.id);
      let dateFormatted = order.data;
      try {
        if (order.data.includes("T")) {
          const d = new Date(order.data);
          if (!isNaN(d.getTime())) {
            dateFormatted = d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
          }
        }
      } catch {
        dateFormatted = order.data;
      }

      const totalItemsCount = order.produtos?.reduce((acc, p) => acc + (p.qtd || p.quantidade || 1), 0) || order.produtos?.length || 1;
      const itemsListText = (order.produtos || []).map(p => `${p.qtd || p.quantidade || 1}x ${p.nome}`).join(", ");

      list.push({
        id: order.id,
        data: dateFormatted,
        dataOriginal: order.data,
        clienteNome: order.cliente?.nome || "Cliente",
        clienteTelefone: order.cliente?.telefone || "Não informado",
        clienteEmail: order.cliente?.email,
        clienteCpf: order.cliente?.cpf,
        clienteEndereco: order.cliente?.endereco ? `${order.cliente.endereco.rua}, ${order.cliente.endereco.numero} - ${order.cliente.endereco.bairro}` : undefined,
        lojaId: order.lojaId,
        lojaNome: getLojaName(order.lojaId, order.lojaNome),
        status: "Concluído",
        statusDesc: "Concluído (WhatsApp)",
        itensQtd: totalItemsCount,
        itensDesc: itemsListText,
        produtos: order.produtos || [],
        total: order.valores?.total || 0,
        tipo: "pedido",
        rawOrder: order,
      });
    });

    // 2. Carrinhos Abandonados / Pedidos Pendentes
    allAbandonedCarts.forEach(cart => {
      if (seenIds.has(cart.id)) return;
      const totalItemsCount = (cart.items || []).reduce((acc, i) => acc + (i.qtd || 1), 0) || 1;
      const itemsListText = (cart.items || []).map(i => `${i.qtd || 1}x ${i.nome}`).join(", ");

      list.push({
        id: cart.id,
        data: cart.createdAt || cart.abandonedAt || "Recente",
        dataOriginal: cart.createdAt || new Date().toISOString(),
        clienteNome: cart.client || "Cliente Carrinho",
        clienteTelefone: cart.phone || "Não informado",
        clienteEmail: cart.email,
        clienteCpf: undefined,
        clienteEndereco: cart.address,
        lojaId: cart.lojaId,
        lojaNome: getLojaName(cart.lojaId, cart.lojaNome),
        status: "Pendente",
        statusDesc: "Pendente (Carrinho)",
        itensQtd: totalItemsCount,
        itensDesc: itemsListText,
        produtos: (cart.items || []).map(i => ({
          nome: i.nome,
          qtd: i.qtd || 1,
          valorUnitario: i.valorUnitario,
          foto: i.foto,
        })),
        total: cart.total || 0,
        tipo: "carrinho",
        rawCart: cart,
      });
    });

    // Ordenação do mais recente para o mais antigo
    return list.sort((a, b) => {
      const timeA = new Date(a.dataOriginal).getTime() || 0;
      const timeB = new Date(b.dataOriginal).getTime() || 0;
      return timeB - timeA;
    });
  }, [orders, allAbandonedCarts, pharmacies]);

  // KPIs: TOTAL DE PEDIDOS puxa TODOS os pedidos (Pendentes + Concluídos)
  const kpis = {
    total: allUnifiedOrders.length,
    concluidos: orders.length,
    carrinhosARecuperar: allAbandonedCarts.length,
  };

  // Filtragem
  const filteredUnifiedOrders = useMemo(() => {
    return allUnifiedOrders.filter(item => {
      // Filtro por view
      if (mainView === "concluidos" && item.status !== "Concluído") return false;
      if (mainView === "carrinhos" && item.status !== "Pendente") return false;

      // Filtro por busca
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesId = item.id.toLowerCase().includes(term);
        const matchesClient = item.clienteNome.toLowerCase().includes(term);
        const matchesPhone = item.clienteTelefone.toLowerCase().includes(term);
        const matchesLoja = item.lojaNome.toLowerCase().includes(term);
        if (!matchesId && !matchesClient && !matchesPhone && !matchesLoja) {
          return false;
        }
      }

      // Filtro por período de data
      if (dateStartFilter || dateEndFilter) {
        try {
          const itemTime = new Date(item.dataOriginal).getTime();
          if (!isNaN(itemTime)) {
            if (dateStartFilter && itemTime < new Date(dateStartFilter + "T00:00:00").getTime()) return false;
            if (dateEndFilter && itemTime > new Date(dateEndFilter + "T23:59:59").getTime()) return false;
          }
        } catch {}
      }

      return true;
    });
  }, [allUnifiedOrders, mainView, searchTerm, dateStartFilter, dateEndFilter]);

  const exportToExcel = () => {
    const headers = ["ID", "Data", "Cliente", "Email", "CPF", "Telefone", "Loja Faturamento", "Status", "Itens", "Total"];
    const rows = filteredUnifiedOrders.map(o => [
      o.id,
      o.data,
      o.clienteNome,
      o.clienteEmail || "",
      o.clienteCpf || "",
      o.clienteTelefone,
      o.lojaNome,
      o.statusDesc,
      o.itensDesc,
      o.total.toString().replace('.', ',')
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

  // --- DETAILS VIEW FOR ORDER ---
  if (selectedOrder) {
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
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Pedido #{selectedOrder.numero || selectedOrder.id}</h1>
                <div className="px-3 py-1 rounded-full text-xs font-bold border bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Concluído (WhatsApp)
                </div>
              </div>
              <span className="text-slate-500 font-medium text-sm flex items-center gap-2">
                Efetuado em {selectedOrder.data} 
                <span className="w-1 h-1 rounded-full bg-slate-300" /> 
                <Store className="h-3 w-3" /> {getLojaName(selectedOrder.lojaId, selectedOrder.lojaNome)}
              </span>
            </div>
            <div className="flex items-center gap-3 print:hidden">
                {/* No Admin Global: Avisar Loja. No Painel da Loja (Meus Pedidos): Ver no WhatsApp do Cliente */}
                {isGlobalView ? (
                  <Button 
                    className="h-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
                    onClick={() => {
                      handleAvisarLoja({
                        id: selectedOrder.id,
                        lojaId: selectedOrder.lojaId,
                        lojaNome: getLojaName(selectedOrder.lojaId),
                        clienteNome: selectedOrder.cliente.nome,
                        clienteTelefone: selectedOrder.cliente.telefone,
                        total: selectedOrder.valores.total,
                        status: "Concluído",
                        produtos: selectedOrder.produtos || [],
                      });
                    }}
                  >
                    <Send className="h-4 w-4" />
                    Avisar Loja (WhatsApp)
                  </Button>
                ) : (
                  <Button 
                    className="h-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
                    onClick={() => {
                      handleVerWhatsAppCliente({
                        id: selectedOrder.id,
                        lojaId: selectedOrder.lojaId,
                        lojaNome: getLojaName(selectedOrder.lojaId),
                        clienteNome: selectedOrder.cliente.nome,
                        clienteTelefone: selectedOrder.cliente.telefone,
                        total: selectedOrder.valores.total,
                        status: "Concluído",
                        produtos: selectedOrder.produtos || [],
                      });
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Ver no WhatsApp
                  </Button>
                )}
                <Button variant="outline" className="h-10 font-bold bg-white text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2" onClick={() => handleDelete(selectedOrder.id, "pedido")}>
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
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Loja de Faturamento</h3>
              </div>
              <div>
                <div className="font-bold text-slate-800">{getLojaName(selectedOrder.lojaId, selectedOrder.lojaNome)}</div>
                <div className="text-sm text-slate-500 mt-1">Pedido direcionado para faturamento e entrega</div>
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
                   <div key={p.sku || p.nome} className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                      <div className="w-16 h-16 rounded-lg border bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        <img src={p.foto || "https://placehold.co/100"} alt={p.nome} className="w-full h-full object-cover" />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="font-bold text-slate-800 text-sm leading-tight hover:text-emerald-600 cursor-pointer">{p.nome}</div>
                        {p.sku && <div className="text-xs text-slate-500 mt-1 font-medium">SKU: {p.sku}</div>}
                      </div>
                      <div className="px-6 text-center">
                         <div className="text-[10px] font-bold text-slate-400 uppercase">Qtd</div>
                         <div className="font-black text-slate-700 text-base">{p.qtd || p.quantidade || 1}</div>
                      </div>
                      <div className="px-4 text-right">
                         <div className="text-[10px] font-bold text-slate-400 uppercase">Total</div>
                         <div className="font-bold text-emerald-700">{((p.valorUnitario || p.preco || 0) * (p.qtd || p.quantidade || 1)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
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
                  {selectedOrder.cliente.email && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="font-medium hover:text-emerald-600 cursor-pointer">{selectedOrder.cliente.email}</span>
                    </div>
                  )}
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
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {isGlobalView ? 'Pedidos da Rede' : 'Meus Pedidos'}
            </h1>
            <span className="text-slate-500 font-medium text-sm">
              Visão geral consolidada de todos os pedidos concluídos via WhatsApp e pendentes no carrinho.
            </span>
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

        {/* 3 KPIs Principais: TOTAL DE PEDIDOS (Concluídos + Pendentes), CONCLUIDO, CARRINHOS A RECUPERAR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {/* TOTAL DE PEDIDOS - Puxa todos os pedidos (Pendentes e Concluídos) */}
           <div 
             onClick={() => setMainView("todos")}
             className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center justify-between hover:shadow-md ${
               mainView === "todos" ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20" : ""
             }`}
           >
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">TOTAL DE PEDIDOS</p>
                <p className="text-3xl font-black text-slate-800">{kpis.total}</p>
                <span className="text-[12px] text-slate-500 font-medium">
                  {kpis.concluidos} concluídos + {kpis.carrinhosARecuperar} pendentes
                </span>
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

           {/* CARRINHOS A RECUPERAR / PENDENTES */}
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
          {/* Top Bar com Busca e Filtros */}
          <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Buscar por ID, Cliente, Telefone ou Loja..." 
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
                  Todos ({kpis.total})
                </button>
                <button
                  onClick={() => setMainView("concluidos")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    mainView === "concluidos" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Concluídos ({kpis.concluidos})
                </button>
                <button
                  onClick={() => setMainView("carrinhos")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    mainView === "carrinhos" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Pendentes / Carrinhos ({kpis.carrinhosARecuperar})
                </button>
              </div>

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
            </div>
          </div>

          {/* Tabela Unificada de Pedidos (Puxa Todos os Pedidos: Pendentes e Concluídos) */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-[13px] min-w-[800px]">
              <thead>
                <tr className="border-b text-slate-400 text-[11px] font-black uppercase bg-white tracking-wider">
                  <th className="px-3 py-3 w-10 text-center"><Checkbox /></th>
                  <th className="px-3 py-3 whitespace-nowrap">Pedido</th>
                  <th className="px-3 py-3">Cliente</th>
                  {isGlobalAdmin() && <th className="px-3 py-3 whitespace-nowrap">Loja Faturamento</th>}
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3">Itens</th>
                  <th className="px-3 py-3 text-right whitespace-nowrap">Total / Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUnifiedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={isGlobalAdmin() ? 7 : 6} className="p-12 text-center text-slate-500 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                        <span className="text-lg font-bold text-slate-700">Nenhum pedido encontrado.</span>
                        <span className="text-sm font-medium text-slate-500">Não encontramos nenhum registro com os filtros selecionados.</span>
                      </div>
                    </td>
                  </tr>
                ) : null}

                {filteredUnifiedOrders.map(item => {
                  const isConcluido = item.status === "Concluído";
                  const isPendente = item.status === "Pendente";

                  return (
                    <tr 
                      key={item.id} 
                      className={`transition-colors cursor-pointer group ${
                        isPendente ? 'hover:bg-amber-50/30' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => {
                        if (item.tipo === "pedido" && item.rawOrder) {
                          setSelectedOrder(item.rawOrder);
                        } else {
                          setSelectedCartItem(item);
                        }
                      }}
                    >
                      <td className="px-3 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <Checkbox />
                      </td>

                      {/* Pedido & Data */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-[14px]">#{item.id}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.data}</div>
                      </td>

                      {/* Cliente */}
                      <td className="px-3 py-3">
                         <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-110 transition-transform ${
                              isConcluido ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                            }`}>
                               {item.clienteNome.charAt(0)}
                            </div>
                            <div className="max-w-[180px]">
                               <div className="font-bold text-slate-700 truncate">{item.clienteNome}</div>
                               <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3 text-green-500 shrink-0" />
                                  {item.clienteTelefone}
                               </div>
                            </div>
                         </div>
                      </td>

                      {/* Loja Faturamento */}
                      {isGlobalAdmin() && (
                        <td className="px-3 py-3 whitespace-nowrap">
                           <div className="flex items-center gap-2">
                             <Store className="h-4 w-4 text-emerald-600 shrink-0" />
                             <span className="font-bold text-slate-800 text-[13px] leading-tight">{item.lojaNome}</span>
                           </div>
                        </td>
                      )}

                      {/* Status */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {isConcluido ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold gap-1 px-2.5 py-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            Concluído (WhatsApp)
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-none font-bold gap-1 px-2.5 py-0.5">
                            <Clock className="w-3 h-3 text-amber-700" />
                            Pendente (Carrinho)
                          </Badge>
                        )}
                      </td>

                      {/* Itens */}
                      <td className="px-3 py-3">
                        <div className="text-slate-700 text-xs">
                          <span className="font-bold text-slate-800 mr-2">{item.itensQtd} item(s)</span>
                          <div className="text-slate-400 text-[11px] truncate max-w-[220px]">
                            {item.itensDesc}
                          </div>
                        </div>
                      </td>

                      {/* Total / Ações */}
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Preço Total */}
                          <div className="font-black text-slate-800 text-[15px] mr-2">
                            {item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </div>

                          {/* Ação WhatsApp: No Admin Global avisa a loja faturadora. No Painel da Loja (Meus Pedidos), fala direto com o cliente */}
                          {isGlobalView ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-2.5 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 font-bold gap-1.5 rounded-lg text-xs shadow-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAvisarLoja({
                                  id: item.id,
                                  lojaId: item.lojaId,
                                  lojaNome: item.lojaNome,
                                  clienteNome: item.clienteNome,
                                  clienteTelefone: item.clienteTelefone,
                                  total: item.total,
                                  status: item.status,
                                  produtos: item.produtos,
                                });
                              }}
                              title="Avisar a loja faturadora pelo WhatsApp"
                            >
                              <Send className="h-3.5 w-3.5 text-emerald-600" />
                              Avisar Loja
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-2.5 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 font-bold gap-1.5 rounded-lg text-xs shadow-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerWhatsAppCliente({
                                  id: item.id,
                                  lojaId: item.lojaId,
                                  lojaNome: item.lojaNome,
                                  clienteNome: item.clienteNome,
                                  clienteTelefone: item.clienteTelefone,
                                  total: item.total,
                                  status: item.status,
                                  produtos: item.produtos,
                                });
                              }}
                              title="Falar com o cliente via WhatsApp"
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                              Ver no WhatsApp
                            </Button>
                          )}

                          {/* Botão Excluir */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 shrink-0 rounded-lg" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleDelete(item.id, item.tipo); 
                            }}
                          >
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
        </div>

      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Tem certeza que deseja excluir este registro?"
        description="Essa ação não poderá ser desfeita."
      />

      {/* Modal de Detalhes do Carrinho Pendente */}
      <Dialog open={Boolean(selectedCartItem)} onOpenChange={open => !open && setSelectedCartItem(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-600" />
                Carrinho #{selectedCartItem?.id}
              </DialogTitle>
              <Badge className="bg-amber-100 text-amber-800 border-0 font-bold">
                Pendente (Carrinho)
              </Badge>
            </div>
            <DialogDescription>
              {selectedCartItem?.data} • Loja: {selectedCartItem?.lojaNome}
            </DialogDescription>
          </DialogHeader>

          {selectedCartItem && (
            <div className="space-y-4 text-sm mt-2">
              {/* Cliente */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Dados do Cliente</div>
                <div className="font-bold text-slate-800">{selectedCartItem.clienteNome}</div>
                <div className="text-xs text-slate-600 flex items-center gap-3">
                  <span>Tel: {selectedCartItem.clienteTelefone}</span>
                  {selectedCartItem.clienteEmail && <span>• Email: {selectedCartItem.clienteEmail}</span>}
                </div>
                {selectedCartItem.clienteEndereco && (
                  <div className="text-xs text-slate-500">Endereço: {selectedCartItem.clienteEndereco}</div>
                )}
              </div>

              {/* Loja de Faturamento */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Loja de Faturamento</div>
                <div className="font-bold text-slate-800 text-sm mt-1">{selectedCartItem.lojaNome}</div>
                <div className="text-xs text-slate-500 mt-0.5">Unidade responsável pelo atendimento deste carrinho</div>
              </div>

              {/* Produtos */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Itens no Carrinho ({selectedCartItem.itensQtd})
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border rounded-xl">
                  {selectedCartItem.produtos.map((it, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-800">{it.nome}</div>
                        <div className="text-slate-400 text-[11px]">Qtd: {it.qtd || it.quantidade || 1}x</div>
                      </div>
                      <div className="font-black text-slate-900">
                        {it.valorUnitario || it.preco ? ((it.valorUnitario || it.preco || 0) * (it.qtd || it.quantidade || 1)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Valor Total & Botão Avisar Loja */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between">
                <span className="font-bold text-amber-900">Valor Total do Carrinho:</span>
                <span className="text-xl font-black text-amber-800">
                  {selectedCartItem.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                {isGlobalView ? (
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                    onClick={() => {
                      handleAvisarLoja({
                        id: selectedCartItem.id,
                        lojaId: selectedCartItem.lojaId,
                        lojaNome: selectedCartItem.lojaNome,
                        clienteNome: selectedCartItem.clienteNome,
                        clienteTelefone: selectedCartItem.clienteTelefone,
                        total: selectedCartItem.total,
                        status: "Pendente",
                        produtos: selectedCartItem.produtos,
                      });
                    }}
                  >
                    <Send className="w-4 h-4" />
                    Avisar Loja via WhatsApp
                  </Button>
                ) : (
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                    onClick={() => {
                      handleVerWhatsAppCliente({
                        id: selectedCartItem.id,
                        lojaId: selectedCartItem.lojaId,
                        lojaNome: selectedCartItem.lojaNome,
                        clienteNome: selectedCartItem.clienteNome,
                        clienteTelefone: selectedCartItem.clienteTelefone,
                        total: selectedCartItem.total,
                        status: "Pendente",
                        produtos: selectedCartItem.produtos,
                      });
                    }}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Ver no WhatsApp
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="text-red-600 hover:bg-red-50 border-red-200 font-bold"
                  onClick={() => handleDelete(selectedCartItem.id, "carrinho")}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

import { createFileRoute } from "@tanstack/react-router";
import { StoreSelector } from "@/components/admin/StoreSelector";
import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Download,
  MessageSquare,
  AlertCircle,
  Store,
  Trash2,
  ShoppingCart,
  Clock,
  Send,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAdmin } from "@/stores/admin";
import { useAbandonedCartsStore, AbandonedCart } from "@/stores/abandoned-carts";

export const Route = createFileRoute("/admin/carrinhos-abandonados")({
  component: PedidosAdmin,
});

interface AbandonedCartItem {
  id: string;
  data: string;
  dataOriginal: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail?: string;
  clienteEndereco?: string;
  lojaId?: string;
  lojaNome: string;
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
  }>;
  total: number;
  rawCart: AbandonedCart;
}

import { useEffect } from 'react';

export function PedidosAdmin() {
  const { pharmacies, currentUser, grupos, activeStoreId } = useAdmin();
  
  // Carrinhos abandonados / itens de clientes logados e visitantes
  const { carts: storeCarts, removeCart: removeStoreCart, loadCarts, isLoading } = useAbandonedCartsStore();

  useEffect(() => {
    loadCarts();
    const interval = setInterval(() => loadCarts(), 15000);
    return () => clearInterval(interval);
  }, [loadCarts]);



  const allAbandonedCartsRaw = [...storeCarts];
    
  const isGlobalAdmin = () => {
    if (currentUser?.proprietario) return true;
    if (currentUser?.grupoId === "grupo-admin") return true;
    if (!currentUser?.lojasVinculadas || currentUser.lojasVinculadas.length === 0) return true;
    const userGroup = grupos.find(g => g.id === currentUser?.grupoId);
    return userGroup?.permissao_total || userGroup?.permissoes?.includes("*") || false;
  };

  const isGlobalView = isGlobalAdmin() && !activeStoreId;



  const allAbandonedCarts = allAbandonedCartsRaw.filter(c => {
    if (activeStoreId) return c.lojaId === activeStoreId;
    if (!isGlobalAdmin() && (!currentUser?.lojasVinculadas || !currentUser.lojasVinculadas.includes(c.lojaId as string))) return false;
    return true;
  });

  const [selectedCartItem, setSelectedCartItem] = useState<AbandonedCartItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateStartFilter, setDateStartFilter] = useState("");
  const [dateEndFilter, setDateEndFilter] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string } | null>(null);

  const getLojaName = (id?: string, fallbackName?: string) => {
    const p = id ? pharmacies.find(ph => ph.id === id) : null;
    return p ? p.nome : (fallbackName || "Farmácias Associadas");
  };

  const handleDelete = (id: string) => {
    setItemToDelete({ id });
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeStoreCart(itemToDelete.id);
      if (selectedCartItem?.id === itemToDelete.id) setSelectedCartItem(null);
      setConfirmOpen(false);
      setItemToDelete(null);
      toast.success("Carrinho excluído com sucesso!");
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
      ? `\u{1F539} *ADMINISTRADOR*\n` +
        `\u{1F539} *Unidade:* ${loja?.nome || item.lojaNome}\n` +
        `⚠️ *AVISO DE PEDIDO PENDENTE / CARRINHO ABANDONADO*\n\n` +
        `Olá equipe! Há um pedido pendente/carrinho em aberto no sistema.\n\n` +
        `\u{1F539} *Cliente:* ${item.clienteNome}\n` +
        `📱 *WhatsApp do Cliente:* ${item.clienteTelefone}\n\n` +
        `\u{1F539} *Itens do Pedido:*\n${itemsList}\n\n` +
        `\u{1F539} *Total:* ${item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n\n` +
        `👉 *Ação necessária:* Por favor, entrem em contato com o cliente para dar seguimento ao atendimento e finalizar a compra!`
      : `\u{1F539} *${loja?.categoriaAssociado === 'Parceiro' ? 'PAINEL DA LOJA' : 'FARMÁCIAS ASSOCIADAS - ADMIN GLOBAL'}*\n` +
        `\u{1F539} *Unidade:* ${loja?.nome || item.lojaNome}\n` +
        `🔔 *AVISO DE PEDIDO CONCLUÍDO (#${item.id})*\n\n` +
        `Olá equipe! Temos um pedido registrado para a sua loja.\n\n` +
        `\u{1F539} *Cliente:* ${item.clienteNome}\n` +
        `📱 *Telefone:* ${item.clienteTelefone}\n\n` +
        `\u{1F539} *Itens do Pedido:*\n${itemsList}\n\n` +
        `\u{1F539} *Total:* ${item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n\n` +
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
    const lojaNome = loja?.nome || item.lojaNome || (loja?.categoriaAssociado === 'Parceiro' ? 'Loja Parceira' : 'Farmácias Associadas');
    const isParceiro = loja?.categoriaAssociado === 'Parceiro';
    const itemsList = item.produtos.map(p => `• ${p.qtd || p.quantidade || 1}x ${p.nome}`).join("\n");
    const isPendente = item.status === "Pendente";

    const message = isPendente
      ? `Olá ${item.clienteNome}, tudo bem? 😊\n\n` +
        `Aqui é da *${lojaNome}*${isParceiro ? '' : ' (Farmácias Associadas)'}.\n` +
        `Notamos que você selecionou alguns produtos em nosso site e gostaríamos de ajudar a finalizar seu pedido:\n\n` +
        `\u{1F539} *Itens:*\n${itemsList}\n\n` +
        `\u{1F539} *Total:* ${item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n\n` +
        `Como prefere realizar o pagamento ou entrega? Estamos à disposição para atendê-lo(a)!`
      : `Olá ${item.clienteNome}, tudo bem? 😊\n\n` +
        `Aqui é da *${lojaNome}*${isParceiro ? '' : ' (Farmácias Associadas)'}.\n` +
        `Recebemos o seu pedido *#${item.id}* com sucesso!\n\n` +
        `\u{1F539} *Itens:*\n${itemsList}\n\n` +
        `\u{1F539} *Total:* ${item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n\n` +
        `Já estamos preparando seu pedido com todo o cuidado. Qualquer dúvida, pode falar conosco por aqui!`;

    const fullPhone = cleanPhone.startsWith("55") && cleanPhone.length > 11 ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
    toast.success(`Abrindo WhatsApp do cliente ${item.clienteNome}...`);
  };

  // Apenas carrinhos abandonados reais (da tabela carrinhos_abandonados do Supabase)
  // NÃO inclui pedidos concluídos nem pendentes — esses ficam em admin/pedidos
  const abandonedCartItems: AbandonedCartItem[] = useMemo(() => {
    return allAbandonedCarts
      .filter(cart => cart.client !== 'Cliente Visitante' && cart.client !== 'Cliente Não Identificado')
      .map(cart => {
      const cartItems = Array.isArray(cart.items) ? cart.items : Object.values(cart.items || {});
      const totalItemsCount = cartItems.reduce((acc: number, p: any) => acc + (p.qtd || p.quantidade || 1), 0) || cartItems.length || 0;
      const itemsListText = cartItems.map((p: any) => `${p.qtd || p.quantidade || 1}x ${p.nome}`).join(", ");

      const totalValue = cartItems.reduce((acc: number, p: any) => {
        const pr = p.valorUnitario || p.preco || p.preco_promocional || p.preco_original || 0;
        return acc + (pr * (p.qtd || p.quantidade || 1));
      }, 0);

      return {
        id: cart.id,
        data: cart.createdAt,
        dataOriginal: cart.createdAt,
        clienteNome: cart.client && cart.client.trim() !== "" ? cart.client : "Cliente Não Identificado",
        clienteTelefone: cart.phone && cart.phone.trim() !== "" ? cart.phone : "Não informado",
        clienteEmail: cart.email,
        lojaId: cart.lojaId,
        lojaNome: getLojaName(cart.lojaId, cart.lojaNome),
        itensQtd: totalItemsCount,
        itensDesc: itemsListText,
        produtos: cartItems.map((p: any) => ({
          ...p,
          id: p.id || p.produto_id || "item",
          nome: p.nome,
          preco: p.valorUnitario || p.preco || p.preco_promocional || p.preco_original || 0,
          qtd: p.qtd || p.quantidade || 1,
        })),
        total: cart.total > 0 ? cart.total : totalValue,
        rawCart: cart,
      };
    }).sort((a, b) => {
      const timeA = new Date(a.dataOriginal).getTime() || 0;
      const timeB = new Date(b.dataOriginal).getTime() || 0;
      return timeB - timeA;
    });
  }, [allAbandonedCarts, pharmacies]);

  const kpis = {
    carrinhosARecuperar: allAbandonedCarts.length,
  };

  // Filtragem
  const filteredCarts = useMemo(() => {
    return abandonedCartItems.filter(item => {
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
  }, [abandonedCartItems, searchTerm, dateStartFilter, dateEndFilter]);

  const exportToExcel = () => {
    const headers = ["ID", "Data", "Cliente", "Email", "Telefone", "Loja", "Itens", "Total"];
    const rows = filteredCarts.map(o => [
      o.id,
      o.data,
      o.clienteNome,
      o.clienteEmail || "",
      o.clienteTelefone,
      o.lojaNome,
      o.itensDesc,
      o.total.toString().replace('.', ',')
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "carrinhos_abandonados.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Planilha exportada com sucesso!");
  };

  const exportToJson = () => {
    const sampleStructure = [{
      "id": "cart-12345",
      "createdAt": "2026-08-21T10:00:00.000Z",
      "updatedAt": "2026-08-21T10:30:00.000Z",
      "client": "João da Silva",
      "email": "joao@exemplo.com",
      "phone": "11999999999",
      "address": "Rua Exemplo, 123",
      "total": 50.00,
      "items": {
        "item1": {
          "id": "12345",
          "nome": "Produto Exemplo",
          "quantidade": 1,
          "valorUnitario": 50.00,
          "foto": "https://exemplo.com/foto.jpg"
        }
      },
      "lojaId": "loja-exemplo"
    }];
    
    const dataStr = JSON.stringify(sampleStructure, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "estrutura_carrinho_abandonado.json";
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", exportFileDefaultName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("JSON exportado com sucesso!");
  };



  // --- LIST VIEW ---
  return (
    <div className="min-h-screen bg-slate-50/50 p-6 font-sans overflow-x-hidden">
      <div className="w-full max-w-[1600px] mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Carrinhos Abandonados
            </h1>
            <span className="text-slate-500 font-medium text-sm">
              Acompanhe os clientes que iniciaram uma compra mas não finalizaram o pedido.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StoreSelector />
            <Button 
              variant="outline" 
              className="font-bold gap-2 bg-white" 
              onClick={() => loadCarts()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
            <Button variant="outline" className="font-bold gap-2 bg-white" onClick={exportToExcel}>
              <Download className="h-4 w-4" /> Exportar Planilha
            </Button>
            <Button variant="outline" className="font-bold gap-2 bg-white" onClick={exportToJson}>
              <Download className="h-4 w-4" /> Exportar JSON
            </Button>
          </div>
        </div>

        {/* KPI Carrinhos Abandonados */}
        <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between ring-2 ring-amber-500 border-amber-500 bg-amber-50/20">
           <div>
             <p className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">CARRINHOS ABANDONADOS</p>
             <p className="text-3xl font-black text-amber-700">{kpis.carrinhosARecuperar}</p>
             <span className="text-[12px] text-amber-600 font-semibold">Clientes com itens no carrinho sem finalizar</span>
           </div>
           <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
             <ShoppingCart className="h-6 w-6" />
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

          {/* Tabela de Carrinhos Abandonados */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-[13px] min-w-[800px]">
              <thead>
                <tr className="border-b text-slate-400 text-[11px] font-black uppercase bg-white tracking-wider">
                  <th className="px-3 py-3 w-10 text-center"><Checkbox /></th>
                  <th className="px-3 py-3 whitespace-nowrap">Carrinho</th>
                  <th className="px-3 py-3">Cliente</th>
                  {isGlobalAdmin() && <th className="px-3 py-3 whitespace-nowrap">Loja</th>}
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3">Itens</th>
                  <th className="px-3 py-3 text-right whitespace-nowrap">Total / Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCarts.length === 0 ? (
                  <tr>
                    <td colSpan={isGlobalAdmin() ? 7 : 6} className="p-12 text-center text-slate-500 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                        <span className="text-lg font-bold text-slate-700">Nenhum carrinho abandonado encontrado.</span>
                        <span className="text-sm font-medium text-slate-500">Não encontramos nenhum registro com os filtros selecionados.</span>
                      </div>
                    </td>
                  </tr>
                ) : null}

                {filteredCarts.map(item => (
                    <tr 
                      key={item.id} 
                      className="transition-colors cursor-pointer group hover:bg-amber-50/30"
                      onClick={() => setSelectedCartItem(item)}
                    >
                      <td className="px-3 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <Checkbox />
                      </td>

                      {/* Carrinho & Data */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-[14px]">#{item.id.substring(0, 8)}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.data}</div>
                      </td>

                      {/* Cliente */}
                      <td className="px-3 py-3">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-110 transition-transform bg-amber-100 text-amber-800">
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

                      {/* Loja */}
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
                        <Badge className="bg-amber-100 text-amber-800 border-none font-bold gap-1 px-2.5 py-0.5">
                          <Clock className="w-3 h-3 text-amber-700" />
                          Abandonado
                        </Badge>
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
                          <div className="font-black text-slate-800 text-[15px] mr-2">
                            {item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </div>

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
                                  status: "Pendente",
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
                                  status: "Pendente",
                                  produtos: item.produtos,
                                });
                              }}
                              title="Falar com o cliente via WhatsApp"
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                              Ver no WhatsApp
                            </Button>
                          )}

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 shrink-0 rounded-lg" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleDelete(item.id); 
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
                  onClick={() => handleDelete(selectedCartItem.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useCustomers, Customer } from "@/stores/customers";
import { useOrders } from "@/stores/orders";
import { useAdmin } from "@/stores/admin";
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  CreditCard, 
  Calendar, 
  MessageSquare,
  Facebook,
  Apple,
  Trash2,
  Download,
  Store,
  DollarSign,
  TrendingUp,
  ExternalLink,
  MessageCircle,
  Clock,
  CheckCircle2,
  FileText
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export const Route = createFileRoute("/admin/clientes/")({
  component: ClientesAdmin,
});

// Ícones de Login Social
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.54 1.77.828 2.796.828 3.182 0 5.768-2.587 5.768-5.766.001-3.187-2.575-5.77-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.146-.538-1.579-.654-2.593-2.259-2.67-2.364-.077-.105-.632-.841-.632-1.603s.398-1.135.539-1.288c.142-.153.31-.191.414-.191.104 0 .208.002.298.006.095.004.223-.036.349.266.13.312.443 1.077.482 1.157.039.08.065.174.013.277-.052.104-.078.169-.156.259-.078.091-.163.203-.233.272-.078.077-.16.161-.069.317.091.156.403.664.865 1.075.594.529 1.095.693 1.251.77.156.078.247.065.338-.039.091-.104.39-.455.494-.611.104-.156.208-.13.349-.078.143.052.906.427 1.062.505.156.078.26.117.298.182.039.065.039.377-.105.782z" />
    <path d="M12 1.5C6.201 1.5 1.5 6.201 1.5 12c0 1.956.536 3.791 1.474 5.371L1.5 22.5l5.289-1.388C8.309 21.996 10.098 22.5 12 22.5c5.799 0 10.5-4.701 10.5-10.5S17.799 1.5 12 1.5zm0 19.167c-1.688 0-3.256-.479-4.588-1.306l-.329-.204-3.13.821.835-3.051-.224-.356A8.835 8.835 0 0 1 3.333 12c0-4.787 3.88-8.667 8.667-8.667 4.787 0 8.667 3.88 8.667 8.667 0 4.787-3.88 8.667-8.667 8.667z" />
  </svg>
);

export interface UnifiedCustomer {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
  dataCadastro: string;
  metodoLogin: Customer['metodoLogin'];
  totalPedidos: number;
  valorTotal: number;
  valorUltimoPedido: number;
  dataUltimoPedido: string;
  anotacoes: string;
  lojaId?: string;
  lojaNome?: string;
  pedidos: Array<{
    id: string;
    data: string;
    total: number;
    status: string;
    itensCount: number;
    lojaNome?: string;
  }>;
}

function ClientesAdmin() {
  const { customers, updateCustomer, removeCustomer, loadCustomers } = useCustomers();
  const { orders } = useOrders();
  const { currentUser, pharmacies, activeStoreId, grupos } = useAdmin();
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const isGlobalAdminUser = currentUser?.proprietario || grupos?.find(g => g.id === currentUser?.grupoId)?.permissao_total || currentUser?.lojasVinculadas === undefined;
  const isGlobalView = isGlobalAdminUser && !activeStoreId;
  const currentLojaId = activeStoreId || (currentUser?.lojasVinculadas && currentUser.lojasVinculadas[0]) || null;
  const activeLoja = pharmacies.find(p => p.id === currentLojaId);

  const [selectedLead, setSelectedLead] = useState<UnifiedCustomer | null>(null);
  const [anotacoesForm, setAnotacoesForm] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);

  // Consolida todos os clientes a partir dos pedidos reais e da base de clientes
  const allUnifiedCustomers = useMemo(() => {
    const customerMap = new Map<string, UnifiedCustomer>();

    // 1. Processar clientes pré-cadastrados
    customers.forEach((c) => {
      const cleanPhone = (c.telefone || "").replace(/\D/g, "");
      const cleanEmail = (c.email || "").toLowerCase().trim();
      const targetLojaId = (c as any).lojaId || "1";
      const key = `${cleanPhone || cleanEmail || c.id}`;

      const loja = pharmacies.find((p) => p.id === targetLojaId);
      const lojaNome = loja?.nome || (c as any).lojaNome || (loja?.categoriaAssociado === 'Parceiro' ? `Loja Parceira #${targetLojaId}` : `Farmácias Associadas #${targetLojaId}`);

      customerMap.set(key, {
        id: c.id,
        nome: c.nome,
        email: c.email || "",
        telefone: c.telefone || "",
        cpf: c.cpf || "",
        endereco: c.endereco || "",
        cidade: c.cidade || "Porto Alegre",
        uf: c.uf || "RS",
        cep: c.cep || "90000-000",
        dataCadastro: c.dataCadastro || "01/01/2026",
        metodoLogin: c.metodoLogin || "Email",
        totalPedidos: c.totalPedidos || 0,
        valorTotal: c.valorUltimoPedido ? c.valorUltimoPedido * (c.totalPedidos || 1) : 0,
        valorUltimoPedido: c.valorUltimoPedido || 0,
        dataUltimoPedido: c.dataCadastro || "",
        anotacoes: c.anotacoes || "",
        lojaId: targetLojaId,
        lojaNome: lojaNome,
        pedidos: [],
      });
    });

    // 2. Processar pedidos de useOrders()
    orders.forEach((order) => {
      if (!order.cliente?.nome && !order.cliente?.telefone) return;

      const cleanPhone = (order.cliente.telefone || "").replace(/\D/g, "");
      const cleanEmail = (order.cliente.email || "").toLowerCase().trim();
      const orderLojaId = order.lojaId || "1";
      const key = `${cleanPhone || cleanEmail || order.cliente.nome}`;

      const loja = pharmacies.find((p) => p.id === orderLojaId);
      const lojaNome = loja?.nome || order.lojaNome || (loja?.categoriaAssociado === 'Parceiro' ? `Loja Parceira #${orderLojaId}` : `Farmácias Associadas #${orderLojaId}`);
      const orderTotal = Number(order.valores?.total || 0);
      const orderData = order.data || new Date().toISOString();
      const itensCount = (order.produtos || order.itens || []).reduce((acc, it) => acc + (it.qtd || it.quantidade || 1), 0);

      const orderSummary = {
        id: order.id,
        data: orderData,
        total: orderTotal,
        status: order.status || "Concluído",
        itensCount,
        lojaNome,
      };

      if (customerMap.has(key)) {
        const existing = customerMap.get(key)!;
        existing.totalPedidos += 1;
        existing.valorTotal += orderTotal;
        if (!existing.dataUltimoPedido || new Date(orderData) > new Date(existing.dataUltimoPedido)) {
          existing.valorUltimoPedido = orderTotal;
          existing.dataUltimoPedido = orderData;
        }
        if (!existing.email && order.cliente.email) existing.email = order.cliente.email;
        if ((!existing.cpf || existing.cpf === "Não informado") && order.cliente.cpf) existing.cpf = order.cliente.cpf;
        if (!existing.endereco && order.cliente.endereco?.rua) {
          existing.endereco = `${order.cliente.endereco.rua}, ${order.cliente.endereco.numero || "S/N"}`;
          existing.cidade = order.cliente.endereco.cidade || existing.cidade;
          existing.cep = order.cliente.endereco.cep || existing.cep;
        }
        if (!existing.lojaId || existing.lojaId === "1") {
          existing.lojaId = orderLojaId;
          existing.lojaNome = lojaNome;
        }
        
        if (!existing.pedidos.some(p => p.id === order.id)) {
          existing.pedidos.push(orderSummary);
        }
      } else {
        const enderecoCompleto = order.cliente.endereco?.rua 
          ? `${order.cliente.endereco.rua}, ${order.cliente.endereco.numero || "S/N"}${order.cliente.endereco.bairro ? ` - ${order.cliente.endereco.bairro}` : ""}`
          : "Balcão / Não cadastrado";

        customerMap.set(key, {
          id: `ord-c-${key}`,
          nome: order.cliente.nome,
          email: order.cliente.email || "",
          telefone: order.cliente.telefone || "",
          cpf: order.cliente.cpf || "Não informado",
          endereco: enderecoCompleto,
          cidade: order.cliente.endereco?.cidade || "Porto Alegre",
          uf: "RS",
          cep: order.cliente.endereco?.cep || "90000-000",
          dataCadastro: new Date(orderData).toLocaleDateString("pt-BR"),
          metodoLogin: "Email",
          totalPedidos: 1,
          valorTotal: orderTotal,
          valorUltimoPedido: orderTotal,
          dataUltimoPedido: orderData,
          anotacoes: `Cliente registrado pelo pedido ${order.id}.`,
          lojaId: orderLojaId,
          lojaNome: lojaNome,
          pedidos: [orderSummary],
        });
      }
    });

    return Array.from(customerMap.values());
  }, [customers, orders, pharmacies]);

  // Filtro de acordo com o contexto (Admin Global vs Admin da Loja)
  const storeFilteredCustomers = useMemo(() => {
    if (isGlobalView) {
      return allUnifiedCustomers;
    }
    // No Admin da Loja: apenas clientes que geraram pedidos desta loja específica
    return allUnifiedCustomers.filter(c => c.lojaId === currentLojaId || c.lojaId === String(currentLojaId));
  }, [allUnifiedCustomers, isGlobalView, currentLojaId]);

  // Filtro de busca
  const filteredCustomers = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return storeFilteredCustomers;
    return storeFilteredCustomers.filter(
      (c) =>
        c.nome.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.telefone.includes(term) ||
        (c.lojaNome && c.lojaNome.toLowerCase().includes(term)) ||
        (c.cpf && c.cpf.includes(term))
    );
  }, [storeFilteredCustomers, search]);

  // Métricas agregadas
  const metrics = useMemo(() => {
    const totalClientes = storeFilteredCustomers.length;
    const totalPedidos = storeFilteredCustomers.reduce((acc, c) => acc + c.totalPedidos, 0);
    const faturamentoTotal = storeFilteredCustomers.reduce((acc, c) => acc + c.valorTotal, 0);
    const ticketMedio = totalClientes > 0 ? faturamentoTotal / totalClientes : 0;
    return { totalClientes, totalPedidos, faturamentoTotal, ticketMedio };
  }, [storeFilteredCustomers]);

  const openLead = (customer: UnifiedCustomer) => {
    setSelectedLead(customer);
    setAnotacoesForm(customer.anotacoes || "");
  };

  const handleSaveNotes = () => {
    if (selectedLead) {
      updateCustomer(selectedLead.id, { anotacoes: anotacoesForm });
      setSelectedLead({ ...selectedLead, anotacoes: anotacoesForm });
      toast.success("Anotações do Cliente salvas com sucesso!");
    }
  };

  const handleDelete = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeCustomer(itemToDelete.id);
      toast.success(`Cliente ${itemToDelete.name} removido!`);
      setConfirmOpen(false);
      if (selectedLead?.id === itemToDelete.id) {
        setSelectedLead(null);
      }
    }
  };

  const openWhatsAppClient = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) {
      toast.error("Telefone não cadastrado.");
      return;
    }
    const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const brandName = activeLoja ? activeLoja.nome : "Farmácias Associadas";
    const msg = encodeURIComponent(`Olá ${name}, tudo bem? Aqui é da ${brandName}! Como podemos lhe ajudar hoje?`);
    window.open(`https://wa.me/${fullPhone}?text=${msg}`, "_blank");
  };

  const handleExport = () => {
    if (filteredCustomers.length === 0) {
      toast.error("Nenhum cliente para exportar.");
      return;
    }
    
    const headers = isGlobalView
      ? ["ID", "Nome", "Loja", "Telefone", "Email", "CPF", "Cidade", "UF", "Pedidos", "Valor Total (R$)", "Cadastro"]
      : ["ID", "Nome", "Telefone", "Email", "CPF", "Cidade", "UF", "Pedidos", "Valor Total (R$)", "Cadastro"];

    const rows = filteredCustomers.map(c => {
      if (isGlobalView) {
        return [
          c.id,
          `"${c.nome}"`,
          `"${c.lojaNome || 'Rede Geral'}"`,
          `"${c.telefone}"`,
          `"${c.email}"`,
          `"${c.cpf}"`,
          `"${c.cidade}"`,
          `"${c.uf}"`,
          c.totalPedidos.toString(),
          c.valorTotal.toFixed(2),
          `"${c.dataCadastro}"`
        ];
      }
      return [
        c.id,
        `"${c.nome}"`,
        `"${c.telefone}"`,
        `"${c.email}"`,
        `"${c.cpf}"`,
        `"${c.cidade}"`,
        `"${c.uf}"`,
        c.totalPedidos.toString(),
        c.valorTotal.toFixed(2),
        `"${c.dataCadastro}"`
      ];
    });
    
    const csvContent = [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", isGlobalView ? "clientes_rede_completa.csv" : `clientes_${activeLoja?.id || 'loja'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Planilha exportada com sucesso!");
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" /> 
              {isGlobalView ? "Clientes da Rede" : "Clientes da Loja"}
            </h1>
            {isGlobalView ? (
              <Badge className="bg-blue-600 text-white font-bold text-xs">
                Todas as Lojas
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs">
                {activeLoja?.nome || "Esta Loja"}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {isGlobalView 
              ? "Base unificada de todos os clientes que geraram pedidos nas lojas da rede."
              : "Clientes que realizaram compras e geraram pedidos nesta farmácia."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 gap-2 font-medium" onClick={handleExport}>
            <Download className="w-4 h-4 text-slate-500" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Clientes</div>
            <div className="text-2xl font-black text-slate-900">{metrics.totalClientes}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pedidos Realizados</div>
            <div className="text-2xl font-black text-slate-900">{metrics.totalPedidos}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor em Compras</div>
            <div className="text-2xl font-black text-emerald-700">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(metrics.faturamentoTotal)}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Médio / Cliente</div>
            <div className="text-2xl font-black text-amber-700">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(metrics.ticketMedio)}
            </div>
          </div>
        </div>
      </div>

      {/* TABELA DE CLIENTES */}
      <div className="bg-white rounded-2xl shadow-xs border overflow-hidden">
        {/* TOOLBAR */}
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-[380px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10 h-10 bg-white shadow-2xs text-sm"
              placeholder="Buscar por nome, telefone, e-mail, CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            {activeLoja && (
              <a href={`/loja/${activeLoja.id}`} target="_blank" className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition-colors">Exibindo {filteredCustomers.length} {filteredCustomers.length === 1 ? 'cliente' : 'clientes'}</a>
            )}
            {!activeLoja && (
              <span className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">Exibindo {filteredCustomers.length} {filteredCustomers.length === 1 ? 'cliente' : 'clientes'}</span>
            )}
          </div>
        </div>

        {/* TABELA */}
        <div className="overflow-x-auto min-h-[380px]">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b text-slate-400 text-[11px] font-black uppercase bg-slate-50/80 tracking-wider">
                <th className="px-4 py-3.5 text-center"><Checkbox /></th>
                <th className="px-4 py-3.5">Cliente</th>
                <th className="px-4 py-3.5">Método</th>
                {isGlobalView && <th className="px-4 py-3.5">Loja</th>}
                <th className="px-4 py-3.5">Telefone / WhatsApp</th>
                <th className="px-4 py-3.5 text-center">Pedidos</th>
                <th className="px-4 py-3.5">Valor Total</th>
                <th className="px-4 py-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={isGlobalView ? 8 : 7} className="p-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Nenhum cliente encontrado com os filtros atuais.</p>
                    <p className="text-xs text-slate-400 mt-1">Os clientes serão listados automaticamente conforme novos pedidos forem realizados.</p>
                  </td>
                </tr>
              ) : null}
              {filteredCustomers.map(customer => (
                <tr 
                  key={customer.id} 
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  onClick={() => openLead(customer)}
                >
                  <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                    <Checkbox />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0 border border-emerald-200 shadow-2xs">
                        {customer.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-[14px] group-hover:text-primary transition-colors flex items-center gap-2">
                          {customer.nome}
                        </div>
                        <div className="text-[12px] text-slate-500 font-normal">{customer.email || "E-mail não informado"}</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* COLUNA MÉTODO */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      {customer.metodoLogin === 'Google' && <GoogleIcon />}
                      {customer.metodoLogin === 'Facebook' && <Facebook className="w-4 h-4 text-blue-600" />}
                      {customer.metodoLogin === 'Apple' && <Apple className="w-4 h-4 text-slate-800" />}
                      {customer.metodoLogin === 'Email' && <Mail className="w-4 h-4 text-slate-500" />}
                      <span className="text-xs font-bold text-slate-600">{customer.metodoLogin}</span>
                    </div>
                  </td>

                  {/* COLUNA LOJA (APENAS NO ADMIN GLOBAL) */}
                  {isGlobalView && (
                    <td className="px-4 py-4">
                      {customer.lojaNome ? (
                        <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 font-bold text-xs gap-1.5 py-1">
                          <Store className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          <span className="truncate max-w-[200px]">{customer.lojaNome}</span>
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Geral / Rede</span>
                      )}
                    </td>
                  )}

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{customer.telefone || "Não informado"}</span>
                      {customer.telefone && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openWhatsAppClient(customer.telefone, customer.nome);
                          }}
                          className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          title="Abrir WhatsApp do cliente"
                        >
                          <WhatsAppIcon className="w-4 h-4 fill-emerald-600" />
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <Badge variant="secondary" className="font-black bg-slate-100 text-slate-800 text-xs px-2.5 py-0.5">
                      {customer.totalPedidos} {customer.totalPedidos === 1 ? 'pedido' : 'pedidos'}
                    </Badge>
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-black text-emerald-700 text-[14px]">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(customer.valorTotal)}
                    </div>
                    {customer.valorUltimoPedido > 0 && customer.totalPedidos > 1 && (
                      <div className="text-[11px] text-slate-400 font-medium">
                        Último: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(customer.valorUltimoPedido)}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-primary hover:bg-primary/10 font-bold h-8 text-xs gap-1"
                        onClick={() => openLead(customer)}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Ver Ficha
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-400 hover:text-red-700 hover:bg-red-50"
                        title="Excluir cliente"
                        onClick={() => handleDelete(customer.id, customer.nome)}
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

      {/* FICHA DO CLIENTE (SLIDE-OVER / SHEET) */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent className="sm:max-w-[540px] w-full p-0 flex flex-col border-l border-slate-200">
          <SheetHeader className="p-6 border-b bg-slate-50/80 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-2xl shadow-inner border border-emerald-200">
                {selectedLead?.nome.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <SheetTitle className="text-xl font-black text-slate-900 leading-none">
                  {selectedLead?.nome}
                </SheetTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    Cliente desde {selectedLead?.dataCadastro}
                  </span>
                  {selectedLead?.lojaNome && isGlobalView && (
                    <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[11px] font-bold">
                      <Store className="w-3 h-3 mr-1" />
                      {selectedLead.lojaNome}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>

          {selectedLead && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-28">
              
              {/* Seção 1: Dados de Contato */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-primary" /> Informações de Contato
                </h4>
                <div className="bg-white border rounded-xl p-4 space-y-3.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase">Telefone / WhatsApp</div>
                        <div className="text-sm font-bold text-slate-900">{selectedLead.telefone || "Não informado"}</div>
                      </div>
                    </div>
                    {selectedLead.telefone && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs gap-1.5"
                        onClick={() => openWhatsAppClient(selectedLead.telefone, selectedLead.nome)}
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                        Chamar
                      </Button>
                    )}
                  </div>

                  <div className="flex items-start gap-3 pt-2 border-t">
                    <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase">E-mail</div>
                      <div className="text-sm font-medium text-slate-800">{selectedLead.email || "Não informado"}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2 border-t">
                    <CreditCard className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase">CPF</div>
                      <div className="text-sm font-medium text-slate-800">{selectedLead.cpf || "Não informado"}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2 border-t">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Endereço Principal</div>
                      <div className="text-sm font-medium text-slate-800">
                        {selectedLead.endereco} <br/> 
                        {selectedLead.cidade} - {selectedLead.uf} <br/> 
                        CEP: {selectedLead.cep}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 2: Histórico de Compras */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-primary" /> Histórico de Compras
                </h4>
                <div className="bg-white border rounded-xl p-4 space-y-4 shadow-2xs">
                  <div className="grid grid-cols-2 gap-3 pb-3 border-b">
                    <div className="bg-slate-50 p-3 rounded-lg border">
                      <div className="text-[11px] font-bold text-slate-500 uppercase">Total de Pedidos</div>
                      <div className="text-xl font-black text-slate-900 mt-0.5">
                        {selectedLead.totalPedidos}
                      </div>
                    </div>
                    <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
                      <div className="text-[11px] font-bold text-emerald-700 uppercase">Total Gasto</div>
                      <div className="text-xl font-black text-emerald-700 mt-0.5">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(selectedLead.valorTotal)}
                      </div>
                    </div>
                  </div>

                  {/* Lista de Pedidos do Cliente */}
                  {selectedLead.pedidos && selectedLead.pedidos.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-[12px] font-bold text-slate-600">Pedidos Registrados:</div>
                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {selectedLead.pedidos.map((ped) => (
                          <div key={ped.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border text-xs">
                            <div>
                              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                <span>{ped.id}</span>
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold">
                                  {ped.status}
                                </Badge>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {new Date(ped.data).toLocaleDateString("pt-BR")} • {ped.itensCount} {ped.itensCount === 1 ? 'item' : 'itens'}
                              </div>
                            </div>
                            <div className="font-black text-emerald-700 text-sm">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(ped.total)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Seção 3: Anotações do Lead / CRM */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" /> Anotações do Cliente (CRM)
                </h4>
                <div className="space-y-2 bg-white border rounded-xl p-4 shadow-2xs">
                  <Textarea 
                    className="min-h-[100px] resize-none bg-amber-50/40 border-amber-200 focus-visible:ring-amber-400 text-sm" 
                    placeholder="Adicione observações, preferências de entrega ou histórico de atendimento deste cliente..."
                    value={anotacoesForm}
                    onChange={(e) => setAnotacoesForm(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleSaveNotes} className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-8 text-xs">
                      Salvar Anotações
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title={itemToDelete ? `Tem certeza que deseja excluir o cliente ${itemToDelete.name}?` : "Tem certeza que deseja excluir o cliente?"}
        description="Esta ação removerá o registro da base de clientes."
      />
    </div>
  );
}

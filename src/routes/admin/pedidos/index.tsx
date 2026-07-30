import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Info,
  Package,
  MapPin,
  CreditCard,
  History,
  MoreVertical,
  Check,
  Truck,
  Mail,
  MessageSquare,
  AlertCircle,
  Store,
  Trash2,
  QrCode,
  Banknote,
  Code,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/pedidos/")({
  component: PedidosAdmin,
});

const STATUS_OPTIONS = [
  "Aguardando pagamento",
  "Pago",
  "Em separação",
  "Enviado",
  "Aguardando retirada",
  "Entregue",
  "Cancelado",
];

const STATUS_COLORS: Record<string, string> = {
  "Aguardando pagamento": "bg-amber-100 text-amber-700 border-amber-200",
  "Pago": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Em separação": "bg-blue-100 text-blue-700 border-blue-200",
  "Enviado": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Aguardando retirada": "bg-orange-100 text-orange-700 border-orange-200",
  "Entregue": "bg-teal-100 text-teal-700 border-teal-200",
  "Cancelado": "bg-red-100 text-red-700 border-red-200",
};

const STATUS_DOTS: Record<string, string> = {
  "Aguardando pagamento": "bg-amber-500",
  "Pago": "bg-emerald-500",
  "Em separação": "bg-blue-500",
  "Enviado": "bg-indigo-500",
  "Aguardando retirada": "bg-orange-500",
  "Entregue": "bg-teal-500",
  "Cancelado": "bg-red-500",
};

// Progresso do Pedido
const STATUS_STAGES = [
  "Aguardando pagamento",
  "Pago",
  "Em separação",
  "Enviado",
  "Entregue"
];

import { useOrders, Pedido } from "@/stores/orders";
import { useAdmin } from "@/stores/admin";

const JSON_EXAMPLE = `{
  "id": "504",
  "lojaId": "loja-poa-centro",
  "data": "10/07/2026 10:09",
  "cliente": {
    "nome": "Nyckolas Lopes",
    "email": "nyckolas.lopes@gmail.com",
    "telefone": "(51) 98173-1656",
    "cpf": "600.117.090-81"
  },
  "pagamento": {
    "metodo": "Pix",
    "idTransacao": "J9DSOWDGCO"
  },
  "envio": {
    "metodo": "Entrega Expressa",
    "endereco": "Rua Dos Andradas, 59",
    "cidade": "Porto Alegre / RS",
    "cep": "90020-015"
  },
  "status": "Pago",
  "produtos": [
    {
      "sku": "7896523207360",
      "nome": "NEVRALGEX 300MG + 50MG + 35MG C/10 COMP",
      "qtd": 2,
      "valorUnitario": 4.99
    }
  ],
  "valores": {
    "produtos": 9.98,
    "desconto": 0,
    "frete": 10.00,
    "total": 19.98
  }
}`;

function PedidosAdmin() {

  const { orders, updateOrderStatus, updateOrderTracking, deleteOrder } = useOrders();
  const { pharmacies, currentUser, grupos } = useAdmin();
  
  const isGlobalAdmin = () => {
    if (currentUser?.proprietario) return true;
    const userGroup = grupos.find(g => g.id === currentUser?.grupoId);
    return userGroup?.permissao_total || false;
  };

  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
  const [stagedStatus, setStagedStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Resumo");
  const [rastreioCode, setRastreioCode] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get("status") === "aguardando") return "Aguardando pagamento";
    }
    return "Todas";
  });
  const [paymentFilter, setPaymentFilter] = useState("Todos");
  const [dateStartFilter, setDateStartFilter] = useState("");
  const [dateEndFilter, setDateEndFilter] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    updateOrderStatus(id, newStatus);
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success("Status do pedido atualizado!");
    }
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setConfirmOpen(true);
  }

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteOrder(itemToDelete);
      setSelectedOrder(null);
      setConfirmOpen(false);
      toast.success("Pedido excluído com sucesso!");
    }
  };

  const handleSaveRastreio = () => {
    if (!rastreioCode) return;
    toast.success("Código de rastreio atualizado com sucesso!");
    if (selectedOrder) {
       setSelectedOrder({
         ...selectedOrder,
         envio: { ...selectedOrder.envio, rastreio: rastreioCode }
       });
       updateOrderTracking(selectedOrder.id, rastreioCode);
    }
  };

  const getLojaName = (id?: string) => {
    if (!id) return "Loja não identificada";
    const p = pharmacies.find(ph => ph.id === id);
    return p ? p.nome : id;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const exportToExcel = () => {
    const headers = ["ID", "Data", "Status", "Cliente", "Email", "CPF", "Telefone", "Loja", "Pagamento", "Produtos", "Frete", "Total"];
    const rows = filteredOrders.map(o => [
      o.id,
      o.data,
      o.status,
      o.cliente.nome,
      o.cliente.email,
      o.cliente.cpf,
      o.cliente.telefone,
      getLojaName(o.lojaId),
      o.pagamento.metodo,
      o.valores.produtos.toString().replace('.', ','),
      o.valores.frete.toString().replace('.', ','),
      o.valores.total.toString().replace('.', ',')
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
    
    if (statusFilter !== "Todas" && o.status !== statusFilter) {
      return false;
    }
    
    if (paymentFilter !== "Todos" && !o.pagamento.metodo.toLowerCase().includes(paymentFilter.toLowerCase())) {
      return false;
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

  const kpis = {
    total: orders.length,
    pago: orders.filter(o => o.status === "Pago").length,
    aguardandoPagamento: orders.filter(o => o.status === "Aguardando pagamento").length,
    emSeparacao: orders.filter(o => o.status === "Em separação").length,
    concluidos: orders.filter(o => o.status === "Entregue").length
  };

  if (selectedOrder) {
    // --- DETAILS VIEW ---
    const currentStageIndex = STATUS_STAGES.indexOf(selectedOrder.status);
    const isCancelled = selectedOrder.status === "Cancelado";
    const isPickup = selectedOrder.envio.metodo.includes("Retirada");

    return (
      <div className="min-h-screen bg-slate-50/50 p-6 font-sans">
        {/* Header */}
        <div className="max-w-6xl mx-auto space-y-6">
          <button 
            onClick={() => {
              setSelectedOrder(null);
              setStagedStatus(null);
            }}
            className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors print:hidden"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar para lista de pedidos
          </button>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Pedido #{selectedOrder.id}</h1>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[selectedOrder.status]}`}>
                  {selectedOrder.status}
                </div>
              </div>
              <span className="text-slate-500 font-medium text-sm flex items-center gap-2">
                Efetuado em {selectedOrder.data} 
                <span className="w-1 h-1 rounded-full bg-slate-300" /> 
                <Store className="h-3 w-3" /> {getLojaName(selectedOrder.lojaId)}
              </span>
            </div>
            <div className="flex items-center gap-3 print:hidden">
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
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <MapPin className="h-5 w-5" />
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Logística</h3>
              </div>
              <div>
                <div className="font-bold text-slate-800">{selectedOrder.envio.metodo}</div>
                {!isPickup && (
                  <>
                    <div className="text-sm text-slate-500 mt-1">{selectedOrder.envio.endereco}</div>
                    <div className="text-sm text-slate-500">{selectedOrder.envio.cidade} - CEP: {selectedOrder.envio.cep}</div>
                    <div className="text-xs font-bold text-slate-500 mt-3 pt-2 border-t">Prazo estimado: {selectedOrder.envio.prazo}</div>
                  </>
                )}
                {isPickup && (
                  <>
                    <div className="text-sm text-emerald-600 mt-1 font-bold">Retirada na loja.</div>
                    {selectedOrder.anotacoes && selectedOrder.anotacoes.includes("Autorizado para retirada") ? (
                      <div className="mt-3 pt-2 border-t space-y-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Pessoa Autorizada</div>
                        <div className="text-sm font-semibold text-slate-700">{selectedOrder.anotacoes.replace("Autorizado para retirada: ", "")}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 mt-1 font-medium">O próprio cliente irá retirar.</div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <CreditCard className="h-5 w-5" />
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pagamento</h3>
              </div>
              <div>
                <div className="font-bold text-slate-800">
                  {selectedOrder.pagamento.metodo}
                  {selectedOrder.pagamento.cartaoFinal && (
                    <span className="text-slate-400 font-medium ml-1 text-sm">
                      (**** {selectedOrder.pagamento.cartaoFinal})
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-500 mt-1">Status: <span className="font-semibold text-slate-700">{selectedOrder.status === 'Aguardando pagamento' ? 'Pendente' : 'Confirmado'}</span></div>
                {selectedOrder.pagamento.idTransacao && (
                  <div className="text-xs text-slate-400 mt-2 font-mono bg-slate-50 p-1.5 rounded truncate">ID: {selectedOrder.pagamento.idTransacao}</div>
                )}
              </div>
            </div>

             <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Store className="h-5 w-5" />
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Origem</h3>
              </div>
              <div>
                <div className="font-bold text-slate-800">{getLojaName(selectedOrder.lojaId)}</div>
                <div className="text-sm text-slate-500 mt-1">Loja de faturamento</div>
                <div className="text-xs text-slate-400 mt-2 font-mono bg-slate-50 p-1.5 rounded truncate">IP: {selectedOrder.cliente.ip}</div>
                
                {selectedOrder.utm && selectedOrder.utm.source?.toLowerCase().includes('google') && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 mb-1">UTM (Google Shopping)</div>
                    <div className="text-xs text-slate-600 flex flex-col gap-0.5 font-mono bg-indigo-50/50 p-2 rounded">
                      {selectedOrder.utm.source && <div><span className="font-semibold text-indigo-700">Source:</span> {selectedOrder.utm.source}</div>}
                      {selectedOrder.utm.medium && <div><span className="font-semibold text-indigo-700">Medium:</span> {selectedOrder.utm.medium}</div>}
                      {selectedOrder.utm.campaign && <div><span className="font-semibold text-indigo-700">Campaign:</span> {selectedOrder.utm.campaign}</div>}
                    </div>
                  </div>
                )}
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
                  <span>Produtos</span>
                  <span className="font-bold">{selectedOrder.valores.produtos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-slate-600">
                  <span>Frete</span>
                  <span className="font-bold">{selectedOrder.valores.frete.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-white border shadow-sm rounded-2xl p-8">
             <div className="flex items-center w-full relative">
                {STATUS_STAGES.map((stage, idx) => {
                  const isActive = isCancelled ? false : currentStageIndex >= idx;
                  const isPast = isCancelled ? false : currentStageIndex > idx;
                  const isLast = idx === STATUS_STAGES.length - 1;
                  return (
                    <div key={stage} className="flex flex-col items-center flex-1 relative">
                      {/* Connecting Line */}
                      {!isLast && (
                        <div className={`absolute top-4 left-1/2 w-full h-1.5 rounded-full ${isPast ? 'bg-emerald-500' : 'bg-slate-100'} ${isCancelled ? 'bg-slate-100' : ''}`}></div>
                      )}
                      
                      {/* Dot */}
                      <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center border-[3px] transition-all bg-white ${isActive ? 'border-emerald-500 shadow-md shadow-emerald-100' : 'border-slate-200'} ${isCancelled ? 'border-slate-200' : ''}`}>
                        {isPast ? <Check className="h-5 w-5 text-emerald-500" /> : isActive ? <div className="w-3 h-3 rounded-full bg-emerald-500" /> : null}
                      </div>
                      
                      {/* Label */}
                      <div className={`mt-3 px-2 text-center text-xs font-bold leading-tight ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {stage}
                      </div>
                    </div>
                  );
                })}
                
                {isCancelled && (
                  <div className="flex flex-col items-center absolute right-0">
                    <div className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center border-[3px] border-red-500 bg-red-50">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="absolute top-12 w-32 text-center text-xs font-bold text-red-600">
                      Cancelado
                    </div>
                  </div>
                )}
             </div>
          </div>

          {/* Status Update Section */}
          <div className="bg-white border shadow-sm rounded-2xl p-6">
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3">Mudar situação do pedido</h3>
              <div className="flex gap-2 items-center">
                 <Select value={stagedStatus || selectedOrder.status} onValueChange={(v) => setStagedStatus(v)}>
                    <SelectTrigger className={`h-10 font-bold w-[240px] ${STATUS_COLORS[stagedStatus || selectedOrder.status]} border-transparent`}>
                      <SelectValue placeholder="Status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt} className="font-bold">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOTS[opt]}`} />
                            {opt}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
                 {stagedStatus && stagedStatus !== selectedOrder.status && (
                   <Button 
                     className="h-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                     onClick={() => {
                        updateOrderStatus(selectedOrder.id, stagedStatus);
                        setSelectedOrder({ ...selectedOrder, status: stagedStatus });
                        toast.success("Alteração salva com sucesso");
                     }}
                   >
                     Confirmar
                   </Button>
                 )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[2fr_1fr] gap-6">
            {/* Products List */}
            <div className="bg-white border shadow-sm rounded-2xl overflow-hidden h-fit">
              <div className="p-5 border-b flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-600" />
                  Produtos <Badge variant="secondary" className="ml-1 bg-white">{selectedOrder.produtos.length}</Badge>
                </h3>
              </div>
              <div className="p-2 space-y-2">
                {selectedOrder.produtos.map(p => (
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
                         <div className="font-black text-slate-700 text-base">{p.qtd}</div>
                      </div>
                      <div className="px-4 text-right">
                         <div className="text-[10px] font-bold text-slate-400 uppercase">Total</div>
                         <div className="font-bold text-emerald-700">{(p.valorUnitario * p.qtd).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                      </div>
                   </div>
                ))}
              </div>
            </div>

            {/* Client Profile */}
            <div className="bg-white border shadow-sm rounded-2xl p-6 h-fit space-y-6">
               <div>
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Perfil do Cliente</h3>
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 font-black text-lg flex items-center justify-center">
                        {selectedOrder.cliente.nome.charAt(0)}
                     </div>
                     <div>
                        <div className="font-bold text-slate-800 leading-tight">{selectedOrder.cliente.nome}</div>
                        <div className="text-xs font-bold text-slate-500 mt-1">Cliente {selectedOrder.cliente.tipo}</div>
                     </div>
                  </div>
               </div>

               <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="font-medium hover:text-emerald-600 cursor-pointer">{selectedOrder.cliente.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-green-500 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                    <span className="font-bold">{selectedOrder.cliente.telefone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="text-xs font-bold text-slate-400 uppercase w-4 text-center">CPF</span>
                    <span className="font-medium">{selectedOrder.cliente.cpf}</span>
                  </div>
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
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Pedidos</h1>
            <span className="text-slate-500 font-medium text-sm">Gerencie todos os pedidos realizados na sua rede.</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isGlobalAdmin() && (
              <>
                <Button variant="outline" className="font-bold gap-2 bg-white border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200" onClick={() => setIsApiModalOpen(true)}>
                  <Code className="h-4 w-4" /> API de Pedidos
                </Button>
                <Button variant="outline" className="font-bold gap-2 bg-white" onClick={exportToExcel}>
                  <Download className="h-4 w-4" /> Exportar Planilha
                </Button>
              </>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-5 gap-4">
           <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total</p>
                <p className="text-2xl font-black text-slate-800">{kpis.total}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
           </div>
           <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Pago</p>
                <p className="text-2xl font-black text-emerald-700">{kpis.pago}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6" />
              </div>
           </div>
           <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">Aguardando</p>
                <p className="text-2xl font-black text-amber-700">{kpis.aguardandoPagamento}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6" />
              </div>
           </div>
           <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Pendente Envio</p>
                <p className="text-2xl font-black text-blue-700">{kpis.emSeparacao}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center">
                <Truck className="h-6 w-6" />
              </div>
           </div>
           <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">Concluídos</p>
                <p className="text-2xl font-black text-teal-700">{kpis.concluidos}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 text-teal-500 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6" />
              </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {/* Top Bar */}
          <div className="p-4 border-b flex items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Buscar por ID, Cliente..." 
                  className="pl-9 h-10 w-full bg-white border-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-[160px] bg-white font-bold border-slate-200 text-slate-600">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas" className="font-bold">Todos Status</SelectItem>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt} className="font-bold">
                       <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${STATUS_DOTS[opt]}`} />
                         {opt}
                       </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 font-bold gap-2 bg-white text-slate-600 border-slate-200">
                    <Filter className="h-4 w-4" /> Mais Filtros
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 rounded-xl border-slate-200 shadow-xl" align="end">
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800">Mais opções de busca</h4>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Método de Pagamento</label>
                      <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                        <SelectTrigger className="font-bold bg-slate-50">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Todos">Todos</SelectItem>
                          <SelectItem value="Pix">Pix</SelectItem>
                          <SelectItem value="Cartão">Cartão de Crédito</SelectItem>
                          <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Período de Data</label>
                      <div className="flex items-center gap-2">
                         <Input type="date" className="h-8 text-xs font-bold" value={dateStartFilter} onChange={e => setDateStartFilter(e.target.value)} />
                         <span className="text-slate-400 font-medium">a</span>
                         <Input type="date" className="h-8 text-xs font-bold" value={dateEndFilter} onChange={e => setDateEndFilter(e.target.value)} />
                      </div>
                    </div>

                    <Button className="w-full font-bold h-9 bg-slate-100 hover:bg-slate-200 text-slate-700" onClick={() => {
                        setPaymentFilter("Todos");
                        setDateStartFilter("");
                        setDateEndFilter("");
                        setStatusFilter("Todas");
                    }} variant="ghost">
                      Limpar Filtros
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-[13px] min-w-[800px]">
              <thead>
                <tr className="border-b text-slate-400 text-[11px] font-black uppercase bg-white tracking-wider">
                  <th className="px-2 py-3 w-10 text-center"><Checkbox /></th>
                  <th className="px-2 py-3 whitespace-nowrap">Pedido</th>
                  <th className="px-2 py-3">Cliente</th>
                  <th className="px-2 py-3 whitespace-nowrap">Status</th>
                  <th className="px-2 py-3">Loja Faturamento</th>
                  <th className="px-2 py-3">Pagamento</th>
                  <th className="px-2 py-3 text-right whitespace-nowrap">Total / Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                        <span className="text-lg font-bold text-slate-700">Nenhum pedido encontrado.</span>
                        <span className="text-sm font-medium text-slate-500">Não encontramos nenhuma opção com esses filtros.</span>
                      </div>
                    </td>
                  </tr>
                ) : null}
                {filteredOrders.map(order => {
                  const isCancelled = order.status === "Cancelado";
                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isCancelled ? 'bg-red-50/20 opacity-70' : ''}`}
                      onClick={() => {
                        setSelectedOrder(order);
                        setStagedStatus(null);
                      }}
                    >
                      <td className="px-2 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <Checkbox />
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-[15px]">#{order.id}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{order.data}</div>
                      </td>
                      <td className="px-2 py-3">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-110 transition-transform">
                               {order.cliente.nome.charAt(0)}
                            </div>
                            <div className="max-w-[160px]">
                               <div className="font-bold text-slate-700 truncate">{order.cliente.nome}</div>
                               <div className="text-[11px] text-slate-500 truncate">{order.cliente.email}</div>
                            </div>
                         </div>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
                         <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${STATUS_COLORS[order.status]}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[order.status]}`} />
                            {order.status}
                         </div>
                      </td>
                      <td className="px-2 py-3">
                         <div className="flex items-center gap-2">
                           <Store className="h-4 w-4 text-slate-400 shrink-0" />
                           <span className="font-black text-slate-800 text-[13px] leading-tight break-words">{getLojaName(order.lojaId)}</span>
                         </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-start gap-2 font-bold text-slate-700 text-[13px]">
                            {order.pagamento.metodo.toLowerCase().includes('pix') ? (
                               <QrCode className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            ) : order.pagamento.metodo.toLowerCase().includes('dinheiro') ? (
                               <Banknote className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                               <CreditCard className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                            )}
                            <div className="leading-tight">
                              {order.pagamento.metodo}
                              {order.pagamento.cartaoFinal && (
                                <span className="text-slate-400 font-medium ml-1">
                                  (**** {order.pagamento.cartaoFinal})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          <div className="font-black text-slate-800 text-[15px]">
                            {order.valores.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </div>
                          <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); handleDelete(order.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
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
              <p className="text-sm text-slate-500">Cadastre a URL do seu ERP para receber um POST (JSON) toda vez que um pedido for pago/aprovado.</p>
              <div className="flex gap-2">
                <Input placeholder="https://seu-erp.com.br/api/receber-pedido" className="flex-1" />
                <Button className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white">Salvar Webhook</Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-800">3. Endpoints Disponíveis</h3>
              <div className="space-y-2">
                <div className="border rounded-lg p-3 bg-white flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 uppercase font-bold text-xs">GET</Badge>
                    <code className="text-sm font-bold text-slate-700">/api/v1/orders</code>
                  </div>
                  <p className="text-xs text-slate-500">Retorna uma lista paginada dos últimos pedidos.</p>
                </div>
                
                <div className="border rounded-lg p-3 bg-white flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 uppercase font-bold text-xs">GET</Badge>
                    <code className="text-sm font-bold text-slate-700">/api/v1/orders/:id</code>
                  </div>
                  <p className="text-xs text-slate-500">Retorna os detalhes de um pedido específico (itens, cliente, pagamento).</p>
                </div>

                <div className="border rounded-lg p-3 bg-white flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 uppercase font-bold text-xs">PUT</Badge>
                    <code className="text-sm font-bold text-slate-700">/api/v1/orders/:id/status</code>
                  </div>
                  <p className="text-xs text-slate-500">Atualiza o status do pedido (ex: de "Pago" para "Em separação").</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800">4. Formato do Payload (Exemplo JSON)</h3>
              <p className="text-sm text-slate-500">Este é o formato de dados que sua aplicação irá receber via Webhook ou retornar nas requisições GET.</p>
              <div className="bg-slate-900 text-slate-300 p-4 rounded-lg overflow-x-auto relative group">
                <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-8 hover:bg-slate-800 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(JSON_EXAMPLE)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <pre className="text-xs font-mono">{JSON_EXAMPLE}</pre>
              </div>
            </div>
            
          </div>
          <div className="mt-2 flex justify-end">
            <Button variant="outline" onClick={() => setIsApiModalOpen(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

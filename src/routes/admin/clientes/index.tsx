import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCustomers, Customer } from "@/stores/customers";
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
  Download
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

const getLoginBadge = (method: Customer['metodoLogin']) => {
  switch (method) {
    case 'Google':
      return <Badge variant="outline" className="gap-1.5 text-slate-600 bg-white shadow-sm border-slate-200"><GoogleIcon /> Google</Badge>;
    case 'Facebook':
      return <Badge variant="outline" className="gap-1.5 text-blue-600 bg-blue-50 border-blue-200"><Facebook className="w-3.5 h-3.5 fill-current" /> Facebook</Badge>;
    case 'Apple':
      return <Badge variant="outline" className="gap-1.5 text-slate-800 bg-slate-100 border-slate-300"><Apple className="w-3.5 h-3.5 fill-current" /> Apple</Badge>;
    default:
      return <Badge variant="outline" className="gap-1.5 text-slate-500 bg-slate-50 border-slate-200"><Mail className="w-3.5 h-3.5" /> Email</Badge>;
  }
};

function ClientesAdmin() {
  const { customers, updateCustomer, removeCustomer } = useCustomers();
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Customer | null>(null);
  const [anotacoesForm, setAnotacoesForm] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);

  const filteredCustomers = customers.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.telefone.includes(search)
  );

  const openLead = (customer: Customer) => {
    setSelectedLead(customer);
    setAnotacoesForm(customer.anotacoes || "");
  };

  const handleSaveNotes = () => {
    if (selectedLead) {
      updateCustomer(selectedLead.id, { anotacoes: anotacoesForm });
      toast.success("Anotações do Lead salvas com sucesso!");
    }
  };

  const handleDelete = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeCustomer(itemToDelete.id);
      toast.success("Cliente removido!");
      setConfirmOpen(false);
    }
  };

  const handleExport = () => {
    if (filteredCustomers.length === 0) {
      toast.error("Nenhum cliente para exportar.");
      return;
    }
    
    const headers = ["ID", "Nome", "Email", "Telefone", "CPF", "Cidade", "UF", "Cadastro", "Pedidos", "Login"];
    const rows = filteredCustomers.map(c => [
      c.id,
      `"${c.nome}"`,
      c.email,
      c.telefone,
      c.cpf,
      `"${c.cidade}"`,
      c.uf,
      c.dataCadastro,
      c.totalPedidos.toString(),
      c.metodoLogin
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "clientes_associadas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Planilha exportada com sucesso!");
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Clientes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie sua base de clientes, leads e visualização unificada de dados.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* TOOLBAR */}
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9 h-9 bg-white"
              placeholder="Buscar por nome, email, telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 gap-2" onClick={handleExport}>
              <Download className="w-4 h-4 text-slate-400" />
              Exportar
            </Button>
            <Button variant="outline" className="h-9 gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              Filtros
            </Button>
          </div>
        </div>

        {/* TABELA */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b text-slate-400 text-[11px] font-black uppercase bg-white tracking-wider">
                <th className="px-4 py-3 w-10 text-center"><Checkbox /></th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Pedidos</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500 font-medium">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : null}
              {filteredCustomers.map(customer => (
                <tr 
                  key={customer.id} 
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => openLead(customer)}
                >
                  <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                    <Checkbox />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {customer.nome.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-[14px] group-hover:text-primary transition-colors">{customer.nome}</div>
                        <div className="text-[12px] text-slate-500">{customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-700">{customer.telefone}</div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="secondary" className="font-bold bg-slate-100 text-slate-700">
                      {customer.totalPedidos}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="sm" className="text-primary font-bold">
                        Ver Ficha
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Excluir cliente"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(customer.id, customer.nome);
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

      {/* LEAD SLIDE-OVER */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent className="sm:max-w-[500px] w-full p-0 flex flex-col border-l border-slate-200">
          <SheetHeader className="p-6 border-b bg-slate-50 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xl shadow-inner">
                {selectedLead?.nome.charAt(0)}
              </div>
              <div>
                <SheetTitle className="text-xl text-slate-800 leading-none mb-1">
                  {selectedLead?.nome}
                </SheetTitle>
                <div className="text-sm text-slate-500 font-medium">
                  Cadastrado em: {selectedLead?.dataCadastro}
                </div>
              </div>
            </div>
          </SheetHeader>

          {selectedLead && (
            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
              
              {/* Seção 1: Dados de Contato */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5" /> Informações de Contato
                </h4>
                <div className="bg-white border rounded-xl p-4 space-y-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase">E-mail</div>
                      <div className="text-sm font-medium text-slate-800">{selectedLead.email}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Telefone / WhatsApp</div>
                      <div className="text-sm font-medium text-slate-800">{selectedLead.telefone}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase">CPF</div>
                      <div className="text-sm font-medium text-slate-800">{selectedLead.cpf}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
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

              {/* Seção 2: Dados de Compra e Autenticação */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5" /> Autenticação & Compras
                </h4>
                <div className="bg-white border rounded-xl p-4 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] font-bold text-slate-500">Meio de Cadastro</div>
                    {getLoginBadge(selectedLead.metodoLogin)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] font-bold text-slate-500">Total de Pedidos</div>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                      {selectedLead.totalPedidos} Pedido(s)
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] font-bold text-slate-500">Valor do Último Pedido</div>
                    <div className="text-[13px] font-black text-emerald-600">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(selectedLead.valorUltimoPedido ?? 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 3: Anotações do Lead */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" /> Anotações do Lead (CRM)
                </h4>
                <div className="space-y-2">
                  <Textarea 
                    className="min-h-[120px] resize-none bg-yellow-50/50 border-yellow-200 focus-visible:ring-yellow-400" 
                    placeholder="Adicione observações, preferências ou histórico de atendimento deste cliente..."
                    value={anotacoesForm}
                    onChange={(e) => setAnotacoesForm(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleSaveNotes} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold">
                      Salvar Anotação
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
        description="Esta ação não poderá ser desfeita."
      />
    </div>
  );
}

const UserIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

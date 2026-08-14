import { useState } from "react";
import { useLeads } from "@/stores/leads";
import { 
  Megaphone, 
  Search, 
  Filter, 
  Download,
  Mail,
  UserX,
  CheckCircle2,
  Trash2,
  Users,
  Store
} from "lucide-react";
import { useAdmin } from "@/stores/admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LojaLeadsTab({ lojaId }: { lojaId: string }) {
  const { leads, toggleStatus, removeLead } = useLeads();
  const { currentUser } = useAdmin();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeLead(itemToDelete);
      toast.success("Lead excluído.");
      setConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const baseLeads = leads.filter(l => l.lojaId === lojaId);

  const filteredLeads = baseLeads.filter(
    (l) => {
      const matchSearch = l.email.toLowerCase().includes(search.toLowerCase()) || 
                          (l.nome && l.nome.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === "Todos" || l.status === statusFilter;
      return matchSearch && matchStatus;
    }
  );

  const kpis = {
    total: baseLeads.length,
    ativos: baseLeads.filter(l => l.status === 'Ativo').length,
    inativos: baseLeads.filter(l => l.status === 'Inativo').length,
  };

  const exportToCSV = () => {
    const headers = ["ID", "Email", "Nome", "Data Cadastro", "Origem", "Status"];
    const rows = filteredLeads.map(l => [
      l.id,
      l.email,
      l.nome || "",
      l.dataCadastro,
      l.origem,
      l.status
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "newsletter_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Base de leads exportada com sucesso!");
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" /> Leads da Newsletter
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie os clientes que deixaram o email em sua newsletter, rodapé ou popups.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="font-bold gap-2 bg-white" onClick={exportToCSV}>
            <Download className="h-4 w-4" /> Exportar Leads (.CSV)
          </Button>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total de Leads</p>
            <p className="text-2xl font-black text-slate-800">{kpis.total}</p>
          </div>
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Leads Ativos</p>
            <p className="text-2xl font-black text-emerald-700">{kpis.ativos}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-red-600 text-xs font-bold uppercase tracking-wider mb-1">Descadastrados</p>
            <p className="text-2xl font-black text-red-700">{kpis.inativos}</p>
          </div>
          <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
            <UserX className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* TOOLBAR */}
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9 h-10 bg-white"
              placeholder="Buscar por email ou nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
             <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-[160px] bg-white font-bold border-slate-200 text-slate-600">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos" className="font-bold">Todos Status</SelectItem>
                  <SelectItem value="Ativo" className="font-bold text-emerald-600">Ativos</SelectItem>
                  <SelectItem value="Inativo" className="font-bold text-red-600">Inativos</SelectItem>
                </SelectContent>
              </Select>
            <Button variant="outline" className="h-10 gap-2 font-bold text-slate-600">
              <Filter className="w-4 h-4 text-slate-400" />
              Filtros Extras
            </Button>
          </div>
        </div>

        {/* TABELA */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b text-slate-400 text-[11px] font-black uppercase bg-white tracking-wider">
                <th className="px-4 py-3 w-10 text-center"><Checkbox /></th>
                <th className="px-4 py-3">Lead / E-mail</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Data de Inscrição</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-medium">
                    Nenhum lead encontrado com esses filtros.
                  </td>
                </tr>
              ) : null}
              {filteredLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-4 text-center">
                    <Checkbox />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-[14px]">{lead.email}</div>
                        {lead.nome && <div className="text-[12px] text-slate-500">Nome: {lead.nome}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="secondary" className="font-bold bg-slate-100 text-slate-600">
                      {lead.origem}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-600">{lead.dataCadastro}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Badge variant={lead.status === 'Ativo' ? 'default' : 'secondary'} 
                           className={lead.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none font-bold' : 'bg-slate-100 text-slate-500 font-bold'}>
                      {lead.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         title={lead.status === 'Ativo' ? "Inativar Lead" : "Reativar Lead"}
                         onClick={() => {
                           toggleStatus(lead.id);
                           toast.success(`Lead ${lead.status === 'Ativo' ? 'inativado' : 'reativado'}!`);
                         }}
                         className={lead.status === 'Ativo' ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50" : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"}
                       >
                         {lead.status === 'Ativo' ? <UserX className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="text-red-400 hover:text-red-600 hover:bg-red-50"
                         onClick={() => handleDelete(lead.id)}
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
      
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Tem certeza que deseja excluir esse lead permanentemente?"
        description="Esta ação não poderá ser desfeita."
      />
    </div>
  );
}

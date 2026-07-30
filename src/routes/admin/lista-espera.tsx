import { createFileRoute } from "@tanstack/react-router";
import { Info, Trash2, Search, Package, MessageSquare } from "lucide-react";
import { useWaitlist } from "@/stores/waitlist";
import { useAdminProducts } from "@/stores/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export const Route = createFileRoute("/admin/lista-espera")({
  component: AdminListaDeEspera,
});

function AdminListaDeEspera() {
  const { entries, removeEntry } = useWaitlist();
  const produtos = useAdminProducts((s) => s.customProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const filteredEntries = entries.filter((entry) => {
    const term = searchTerm.toLowerCase();
    const prod = produtos.find(p => p.id === entry.produtoId);
    const pName = prod?.nome.toLowerCase() || "";
    return entry.clienteNome.toLowerCase().includes(term) || 
           entry.whatsapp.toLowerCase().includes(term) || 
           pName.includes(term);
  });

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeEntry(itemToDelete);
      toast.success("Solicitação excluída com sucesso.");
    }
  };

  const getProductInfo = (id: string) => {
    return produtos.find(p => p.id === id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Lista de Espera</h1>
          <p className="text-slate-500 font-medium mt-1">
            Clientes aguardando produtos que estão sem estoque.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar..." 
            className="pl-9 bg-white border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8" />
            </div>
            <div className="relative inline-block mb-2">
              <h3 className="text-2xl font-bold text-slate-800">Tudo certo por aqui!</h3>
              <svg className="absolute w-full -bottom-2 left-0 text-slate-800" viewBox="0 0 300 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 12.5C40 -2.5 250 -2.5 297.5 12.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm mt-4 max-w-sm">
              {searchTerm 
                ? "Nenhuma solicitação corresponde à sua busca atual." 
                : "Não há clientes aguardando produtos indisponíveis no momento."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-bold">Data</th>
                  <th className="px-6 py-4 font-bold">Cliente</th>
                  <th className="px-6 py-4 font-bold">WhatsApp</th>
                  <th className="px-6 py-4 font-bold">Produto Desejado</th>
                  <th className="px-6 py-4 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((entry) => {
                  const produto = getProductInfo(entry.produtoId);
                  
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">
                        {new Date(entry.data).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">
                        {entry.clienteNome}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">
                        {entry.whatsapp}
                      </td>
                      <td className="px-6 py-4">
                        {produto ? (
                          <div className="font-medium text-slate-700 line-clamp-2" title={produto.nome}>
                            {produto.nome}
                          </div>
                        ) : (
                          <div className="text-red-500 font-medium text-xs">
                            Produto não encontrado (ID: {entry.produtoId})
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                          onClick={() => handleDelete(entry.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Tem certeza que deseja excluir esta solicitação?"
        description="Esta ação não poderá ser desfeita."
      />
    </div>
  );
}


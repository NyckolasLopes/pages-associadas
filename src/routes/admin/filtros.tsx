import { createFileRoute } from "@tanstack/react-router";
import { StoreSelector } from "@/components/admin/StoreSelector";
import { Search, Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminFiltros, type Filtro } from "@/stores/filtros";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FiltroFormModal } from "@/components/admin/FiltroFormModal";
import { useAdmin } from "@/stores/admin";

export const Route = createFileRoute("/admin/filtros")({
  component: AdminFiltros,
});

function AdminFiltros() {
  const { activeStoreId } = useAdmin();
  const { getStoreFiltros, addFiltro, updateFiltro, removeFiltro, loadFiltros } = useAdminFiltros();
  
  useEffect(() => {
    loadFiltros();
  }, [loadFiltros]);

  const filtros = getStoreFiltros(activeStoreId);
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFiltro, setEditingFiltro] = useState<Filtro | null>(null);

  const filtroToDelete = filtros.find(f => f.id === itemToDelete);

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete !== null) {
      removeFiltro(itemToDelete, activeStoreId);
      toast.success("Filtro excluído com sucesso!");
      setItemToDelete(null);
      setConfirmOpen(false);
    }
  };

  const handleOpenModal = (filtro?: Filtro) => {
    setEditingFiltro(filtro || null);
    setModalOpen(true);
  };

  const handleSaveFiltro = (filtro: Filtro) => {
    if (editingFiltro) {
      updateFiltro(filtro.id, filtro, activeStoreId);
      toast.success("Filtro atualizado com sucesso!");
    } else {
      addFiltro(filtro, activeStoreId);
      toast.success("Filtro criado com sucesso!");
    }
    setModalOpen(false);
  };

  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredFiltros = filtros.filter(f => 
    f.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.opcoes.some(o => o.nome.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-[22px] font-bold text-[#1a1a1a]">Filtros</h2>
          <span className="text-sm font-medium text-slate-500">{filtros.length} filtros</span>
        </div>
        <div className="flex items-center gap-3">
          <StoreSelector className="mb-0" />
          <Button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary/90 text-white font-bold h-10 px-6">
            <Plus className="h-4 w-4 mr-2" />
            Novo filtro
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="buscar filtro..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-white border-slate-200"
            />
          </div>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b text-sm">
            <tr>
              <th className="p-4">Nome do Filtro</th>
              <th className="p-4">Opções</th>
              <th className="p-4">Buscável</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiltros.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  {searchQuery ? `Nenhum filtro encontrado para "${searchQuery}".` : "Nenhum filtro cadastrado."}
                </td>
              </tr>
            )}
            {filteredFiltros.map((filtro) => (
              <tr key={filtro.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors text-sm">
                <td className="p-4 font-bold text-slate-800">{filtro.nome}</td>
                <td className="p-4 text-slate-600">
                  {filtro.opcoes.length > 0 ? filtro.opcoes.map(o => o.nome).join(", ") : "Nenhuma opção"}
                </td>
                <td className="p-4">
                  {filtro.buscavel ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      Sim
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                      Não
                    </span>
                  )}
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-600 hover:text-primary hover:bg-primary/10"
                    onClick={() => handleOpenModal(filtro)}
                    title="Editar filtro"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(filtro.id)}
                    title="Excluir filtro"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog 
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Você tem certeza que deseja excluir os filtros?"
        description={
          filtroToDelete 
            ? `Tem certeza que deseja excluir o filtro "${filtroToDelete.nome}"? Ele será desvinculado de todos os produtos.` 
            : "Esta ação não poderá ser desfeita."
        }
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        variant="destructive"
      />

      <FiltroFormModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        filtro={editingFiltro}
        onSave={handleSaveFiltro}
      />
    </div>
  );
}

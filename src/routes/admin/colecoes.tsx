import { createFileRoute } from "@tanstack/react-router";
import { StoreSelector } from "@/components/admin/StoreSelector";
import { Search, Plus, Trash2, Eye, EyeOff, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminProducts } from "@/stores/products";
import { toast } from "sonner";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { VitrineFormModal } from "@/components/admin/VitrineFormModal";
import type { Vitrine } from "@/types";
import { useAdmin } from "@/stores/admin";

export const Route = createFileRoute("/admin/colecoes")({
  component: AdminVitrines,
});

function AdminVitrines() {
  const { activeStoreId } = useAdmin();
  const { getStoreVitrines, toggleVitrine, removeVitrine } = useAdminProducts();
  const vitrines = getStoreVitrines(activeStoreId);
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVitrine, setEditingVitrine] = useState<Vitrine | null>(null);

  const handleDelete = (id: number) => {
    setItemToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete !== null) {
      removeVitrine(itemToDelete, activeStoreId);
      toast.success("Vitrine excluída!");
    }
  };

  const handleEdit = (v: Vitrine) => {
    setEditingVitrine(v);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-5xl space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-slate-800">Vitrines de Produto</h1>
          <p className="text-slate-500 mt-2">Gerencie as vitrines dinâmicas que aparecem na página inicial da loja.</p>
        </div>
        <div className="flex items-center gap-3">
          <StoreSelector className="mb-0" />
          <Button onClick={() => { setEditingVitrine(null); setIsModalOpen(true); }} className="font-bold">
            <Plus className="h-4 w-4 mr-2" />
            Nova Vitrine
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input className="pl-9 bg-white" placeholder="Buscar vitrine..." />
          </div>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b text-sm">
            <tr>
              <th className="p-4">Nome da Vitrine</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {vitrines.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-500">Nenhuma vitrine cadastrada.</td>
              </tr>
            )}
            {vitrines.map((v) => (
              <tr key={v.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors text-sm">
                <td className="p-4 font-bold text-slate-800">{v.nome}</td>
                <td className="p-4">
                  {v.ativa ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      <div className="h-2 w-2 rounded-full bg-emerald-500"></div> Ativa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                      <div className="h-2 w-2 rounded-full bg-slate-400"></div> Inativa
                    </span>
                  )}
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleVitrine(v.id, activeStoreId)}>
                    {v.ativa ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(v)}>
                    <Edit className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(v.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Tem certeza que deseja excluir esta vitrine?"
        description="Esta ação não poderá ser desfeita."
      />
      
      <VitrineFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        vitrine={editingVitrine} 
        lojaId={activeStoreId}
      />
    </div>
  );
}

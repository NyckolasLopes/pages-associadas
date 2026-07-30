import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, ChevronDown, Eye, ChevronRight, Folder, FolderOpen, Tag, MoreHorizontal, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Categoria } from "@/types";
import { useAdmin } from "@/stores/admin";
import { useAdminCategories } from "@/stores/categories";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CategoryFormModal } from "@/components/admin/CategoryFormModal";
export const Route = createFileRoute("/admin/categorias")({
  component: AdminCategorias,
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: search.q as string | undefined,
  }),
});

function AdminCategorias() {
  const navigate = useNavigate();
  const { featuredCategories, toggleFeaturedCategory } = useAdmin();
  const { categories: allCategories, removeCategory } = useAdminCategories();
  const search = Route.useSearch().q || "";
  const setSearch = (q: string) => navigate({ search: { q } as any });
  
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null);
  
  const handleToggleFeatured = (id: string) => {
    if (!featuredCategories.includes(id) && featuredCategories.length >= 6) {
      toast.error("Limite de categorias atingido", {
        description: "Você só pode destacar até 6 categorias no menu principal. Desmarque uma antes de adicionar outra."
      });
      return;
    }
    toggleFeaturedCategory(id);
  };
  
  const handleDelete = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeCategory(itemToDelete.id);
      toast.success("Categoria removida com sucesso");
      setConfirmOpen(false);
      setItemToDelete(null);
    }
  };
  
  const categoryTree = allCategories
    .filter(c => !c.parentId)
    .map(root => ({
      ...root,
      children: allCategories.filter(child => child.parentId === root.id)
    }));

  const filteredTree = categoryTree.filter(root => {
    if (search) {
      const q = search.toLowerCase();
      const matchRoot = root.nome.toLowerCase().includes(q);
      const matchChildren = root.children.some(c => c.nome.toLowerCase().includes(q));
      return matchRoot || matchChildren;
    }
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-[22px] font-bold text-[#1a1a1a]">Categorias</h2>
          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {allCategories.length} totais cadastradas
          </span>
        </div>
        <Button 
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-primary-dark text-white font-bold h-10 px-6 shadow-sm"
        >
          + Nova categoria
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar categoria principal ou subcategoria..." 
              className="pl-9 h-10 bg-white border-slate-200 shadow-sm"
            />
          </div>
          <Button variant="outline" className="h-10 px-4 text-sm font-medium text-slate-600 bg-white border-slate-200 shadow-sm">
            Ações <ChevronDown className="h-4 w-4 ml-2 text-slate-400" />
          </Button>
        </div>
        
        <div className="w-full">
          <div className="grid grid-cols-[48px_1fr_100px_80px] items-center px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="flex justify-center"><Checkbox className="border-slate-300" /></div>
            <div>Estrutura da Categoria</div>
            <div className="text-center">Status</div>
            <div className="text-center">Ações</div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {filteredTree.map((cat) => {
              const isExpanded = search ? true : expanded[cat.id];
              const hasChildren = cat.children.length > 0;

              return (
                <div key={cat.id} className="group flex flex-col">
                  {/* Parent Category */}
                  <div className="grid grid-cols-[48px_1fr_100px_80px] items-center px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-center"><Checkbox className="border-slate-300" /></div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => hasChildren && toggleExpand(cat.id)}
                        className={`p-1 rounded hover:bg-slate-200 transition-colors ${!hasChildren ? "opacity-30 cursor-default" : ""}`}
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                      </button>
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
                        {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                      </div>
                      <div className="font-bold text-slate-800 text-sm">
                        {cat.nome}
                        {hasChildren && (
                          <span className="ml-2 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {cat.children.length} sub
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Ativa
                      </span>
                    </div>
                    <div className="flex justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleToggleFeatured(cat.id)}
                        className={`h-8 w-8 hover:bg-slate-200 ${featuredCategories.includes(cat.id) ? 'text-amber-400 hover:text-amber-500' : 'text-slate-400 hover:text-amber-400'}`}
                        title="Destacar na página inicial"
                      >
                        <Star className="h-4 w-4" fill={featuredCategories.includes(cat.id) ? "currentColor" : "none"} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          setEditingCategory(cat);
                          setIsModalOpen(true);
                        }}
                        className="h-8 w-8 text-slate-400 hover:text-slate-800 hover:bg-slate-200" 
                        title="Editar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(cat.id, cat.nome)}
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" 
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Child Categories */}
                  {isExpanded && cat.children.length > 0 && (
                    <div className="bg-slate-50/50 border-t border-slate-100 divide-y divide-slate-100/50 pb-2">
                      {cat.children.map((child) => (
                        <div key={child.id} className="grid grid-cols-[48px_1fr_100px_120px] items-center px-4 py-2.5 hover:bg-slate-100/50 transition-colors">
                          <div className="flex justify-center"></div>
                          <div className="flex items-center gap-3 pl-12">
                            <div className="w-px h-full bg-slate-300 absolute -ml-4" />
                            <div className="w-3 h-px bg-slate-300 absolute -ml-4" />
                            <div className="flex items-center justify-center h-6 w-6 rounded bg-white border border-slate-200 shadow-sm text-slate-400">
                              <Tag className="h-3 w-3" />
                            </div>
                            <span className={`text-sm font-medium text-slate-600 ${search && child.nome.toLowerCase().includes(search.toLowerCase()) ? "text-primary font-bold" : ""}`}>
                              {child.nome}
                            </span>
                          </div>
                          <div className="flex justify-center">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium text-emerald-700 opacity-80">
                              <div className="w-1 h-1 rounded-full bg-emerald-500" />
                              Ativa
                            </span>
                          </div>
                          <div className="flex justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                setEditingCategory(child);
                                setIsModalOpen(true);
                              }}
                              className="h-7 w-7 text-slate-400 hover:text-slate-800 hover:bg-slate-200" 
                              title="Editar"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(child.id, child.nome)}
                              className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Remover"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredTree.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center text-slate-500">
              <FolderOpen className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-base font-medium text-slate-600">Nenhuma categoria encontrada</p>
              <p className="text-sm">Tente buscar por um termo diferente.</p>
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title={itemToDelete ? `Tem certeza que deseja remover a categoria ${itemToDelete.name}?` : "Tem certeza que deseja remover?"}
        description="Esta ação não poderá ser desfeita."
      />

      <CategoryFormModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        category={editingCategory}
      />
    </div>
  );
}

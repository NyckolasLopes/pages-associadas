import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StoreSelector } from "@/components/admin/StoreSelector";
import { Search, ChevronDown, Eye, ChevronRight, Folder, FolderOpen, Tag, Star, Trash2, DownloadCloud, RotateCcw, Info, Check, ShieldCheck, Sparkles, Plus, FileUp } from "lucide-react";
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
import { SubirDadosLojaModal } from "@/components/admin/SubirDadosLojaModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/admin/categorias")({
  component: AdminCategorias,
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: search.q as string | undefined,
  }),
});

function AdminCategorias() {
  const navigate = useNavigate();
  const { featuredCategories, toggleFeaturedCategory, activeStoreId, pharmacies, currentUser } = useAdmin();
  const { 
    categories: networkCategories, 
    storeCategories, 
    isStoreUsingCustomCategories,
    removeCategory, 
    importNetworkCategoriesToStore, 
    removeStoreCategory, 
    resetStoreToNetwork, 
    getStoreCategories 
  } = useAdminCategories();
  
  const search = Route.useSearch().q || "";
  const setSearch = (q: string) => navigate({ search: { q } as any });
  
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null);
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [subirDadosOpen, setSubirDadosOpen] = useState(false);

  // Active Store Context (either selected in top header or user's assigned store)
  const currentLojaId = activeStoreId || (currentUser?.lojasVinculadas && currentUser.lojasVinculadas[0]) || null;
  const currentLoja = pharmacies.find(p => p.id === currentLojaId);
  const isStoreCustom = currentLojaId ? !!isStoreUsingCustomCategories[currentLojaId] : false;

  // Effective categories for current view
  const allCategories: Categoria[] = currentLojaId ? getStoreCategories(currentLojaId) : networkCategories;
  
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
      if (currentLojaId) {
        removeStoreCategory(currentLojaId, itemToDelete.id);
      } else {
        removeCategory(itemToDelete.id);
      }
      toast.success("Categoria removida com sucesso");
      setConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const handleImportNetworkCategories = () => {
    if (!currentLojaId) {
      toast.error("Selecione uma loja para importar a categorização da rede.");
      return;
    }
    importNetworkCategoriesToStore(currentLojaId);
    setConfirmImportOpen(false);
    toast.success("Categorização padrão da rede importada com sucesso!", {
      description: "Agora sua loja tem sua própria lista de categorias. Suas alterações não afetarão o padrão da rede."
    });
  };

  const handleResetToNetwork = () => {
    if (!currentLojaId) return;
    resetStoreToNetwork(currentLojaId);
    setConfirmResetOpen(false);
    toast.success("Categorização restaurada para o padrão oficial da rede.");
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
    <div className="max-w-6xl space-y-6 pb-20">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-bold text-[#1a1a1a]">
              {currentLoja ? `Categorias da Loja: ${currentLoja.nome}` : "Categorias de Produtos"}
            </h2>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {allCategories.length} cadastradas
            </span>
          </div>
          <span className="text-sm font-medium text-slate-500">
            {currentLojaId 
              ? "Crie categorias exclusivas para a sua loja ou importe o padrão oficial da rede." 
              : "Gerencie a árvore de categorias e subcategorias de produtos."}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <StoreSelector className="mb-0" />
          {currentLojaId && (
            <>
              <Button 
                onClick={() => setConfirmImportOpen(true)}
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 font-bold h-10 px-4 gap-2 shadow-sm"
              >
                <DownloadCloud className="w-4 h-4 text-emerald-600" />
                Ter Categorização da Rede
              </Button>

              {isStoreCustom && (
                <Button 
                  onClick={() => setConfirmResetOpen(true)}
                  variant="outline"
                  className="bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-semibold h-10 px-3 gap-1.5 shadow-sm text-xs"
                  title="Restaurar padrão da rede"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  Restaurar Padrão
                </Button>
              )}
            </>
          )}

          <Button 
            onClick={() => setSubirDadosOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-5 gap-2 shadow-sm"
          >
            <FileUp className="w-4 h-4" /> Subir Dados para Loja
          </Button>

          <Button 
            onClick={() => {
              setEditingCategory(null);
              setIsModalOpen(true);
            }}
            className="bg-[#00B5AD] hover:bg-[#009c95] text-white font-bold h-10 px-5 gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nova Categoria
          </Button>
        </div>
      </div>

      {/* Store Isolation Info Banner */}
      {currentLojaId && (
        <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
          isStoreCustom 
            ? "bg-amber-50/60 border-amber-200 text-amber-900" 
            : "bg-blue-50/60 border-blue-200 text-blue-900"
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
            isStoreCustom ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
          }`}>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs space-y-1">
            <div className="font-bold text-sm">
              {isStoreCustom ? "Categorização personalizada da sua loja ativa" : "Sua loja está utilizando a categorização padrão da rede"}
            </div>
            <p className="leading-relaxed opacity-90">
              {isStoreCustom 
                ? "As alterações, criações, edições e exclusões feitas nesta tela são exclusivas para a sua loja e NÃO refletem no cadastro geral da rede."
                : "Clique em 'Ter Categorização da Rede' para criar uma cópia independente das categorias da rede e poder editá-las livremente."}
            </p>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar categoria principal ou subcategoria..." 
              className="pl-9 h-10 bg-white border-slate-200 shadow-sm font-medium text-sm"
            />
          </div>
          <div className="text-xs font-semibold text-slate-500">
            {categoryTree.length} categorias raízes
          </div>
        </div>
        
        <div className="w-full overflow-x-auto">
          <div className="grid grid-cols-[48px_1fr_120px_100px] items-center px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[650px]">
            <div className="flex justify-center"><Checkbox className="border-slate-300" /></div>
            <div>Estrutura da Categoria</div>
            <div className="text-center">Status</div>
            <div className="text-center">Ações</div>
          </div>
          
          <div className="divide-y divide-slate-100 min-w-[650px]">
            {filteredTree.map((cat) => {
              const isExpanded = search ? true : expanded[cat.id];
              const hasChildren = cat.children.length > 0;

              return (
                <div key={cat.id} className="group flex flex-col">
                  {/* Parent Category */}
                  <div className="grid grid-cols-[48px_1fr_120px_100px] items-center px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-center"><Checkbox className="border-slate-300" /></div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => hasChildren && toggleExpand(cat.id)}
                        className={`p-1 rounded hover:bg-slate-200 transition-colors ${!hasChildren ? "opacity-30 cursor-default" : ""}`}
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                      </button>
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#00B5AD]/10 text-[#00B5AD]">
                        {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                      </div>
                      <div className="font-bold text-slate-800 text-sm">
                        {cat.nome}
                        {hasChildren && (
                          <span className="ml-2 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            {cat.children.length} sub
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
                        <div key={child.id} className="grid grid-cols-[48px_1fr_120px_100px] items-center px-4 py-2.5 hover:bg-slate-100/50 transition-colors">
                          <div className="flex justify-center"></div>
                          <div className="flex items-center gap-3 pl-12">
                            <div className="w-px h-full bg-slate-300 absolute -ml-4" />
                            <div className="w-3 h-px bg-slate-300 absolute -ml-4" />
                            <div className="flex items-center justify-center h-6 w-6 rounded bg-white border border-slate-200 shadow-sm text-slate-400">
                              <Tag className="h-3 w-3" />
                            </div>
                            <span className={`text-sm font-medium text-slate-700 ${search && child.nome.toLowerCase().includes(search.toLowerCase()) ? "text-emerald-700 font-bold" : ""}`}>
                              {child.nome}
                            </span>
                          </div>
                          <div className="flex justify-center">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold text-emerald-700 opacity-80">
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
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(child.id, child.nome)}
                              className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Remover"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
              <p className="text-base font-bold text-slate-700">Nenhuma categoria encontrada</p>
              <p className="text-sm text-slate-500">Tente buscar por um termo diferente ou crie uma nova categoria.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title={itemToDelete ? `Tem certeza que deseja remover a categoria ${itemToDelete.name}?` : "Tem certeza que deseja remover?"}
        description="Esta ação removerá a categoria da sua loja e não poderá ser desfeita."
      />

      <ConfirmDialog
        isOpen={confirmImportOpen}
        onClose={() => setConfirmImportOpen(false)}
        onConfirm={handleImportNetworkCategories}
        title="Importar categorização padrão da rede?"
        description="Esta ação irá criar uma cópia de todas as categorias oficiais da rede para a sua loja. Todas as edições e alterações que você fizer serão exclusivas da sua loja e NÃO refletirão no cadastro geral da rede."
      />

      <ConfirmDialog
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={handleResetToNetwork}
        title="Restaurar categorização da rede?"
        description="Esta ação irá descartar as customizações de categoria desta loja e voltar a acompanhar a categorização padrão da rede."
      />

      <CategoryFormModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        category={editingCategory}
        lojaId={currentLojaId}
      />

      <SubirDadosLojaModal open={subirDadosOpen} onOpenChange={setSubirDadosOpen} />
    </div>
  );
}
export default AdminCategorias;

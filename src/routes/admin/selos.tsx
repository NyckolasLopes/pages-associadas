import { createFileRoute } from "@tanstack/react-router";
import { Search, ChevronDown, Trash2, Edit2, CheckCircle2, Circle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useMemo } from "react";
import { useSelos } from "@/stores/selos";
import { useAdminProducts } from "@/stores/products";
import { SeloSistema, Produto } from "@/types";
import { toast } from "sonner";
import { checkIsGenerico } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/selos")({
  component: AdminSelos,
});

const checkIsService = (p: Produto) => p.categoriaId === "200" || (p.subcategoriaId && String(p.subcategoriaId).startsWith("20"));

function AdminSelos() {
  const { selos, addSelo, updateSelo, removeSelo } = useSelos();
  const { customProducts, applyBadgeToProducts } = useAdminProducts();
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Modal form state
  const [nome, setNome] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [corFundo, setCorFundo] = useState("#00AFA9");
  const [corTexto, setCorTexto] = useState("#FFFFFF");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [productSearch, setProductSearch] = useState("");

  const filteredSelos = useMemo(() => {
    return selos.filter(s => s.nome.toLowerCase().includes(search.toLowerCase()));
  }, [selos, search]);

  const handleOpenNew = () => {
    setEditingId(null);
    setNome("Novo Selo");
    setAtivo(true);
    setCorFundo("#00AFA9");
    setCorTexto("#FFFFFF");
    setSelectedProductIds(new Set());
    setProductSearch("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (selo: SeloSistema) => {
    setEditingId(selo.id);
    setNome(selo.nome);
    setAtivo(selo.ativo);
    setCorFundo(selo.corFundo);
    setCorTexto(selo.corTexto);
    
    // Find products that have this badge
    const matchedProducts = customProducts.filter(p => p.selosIds?.includes(selo.id) || (selo.id === 'gen' && checkIsGenerico(p)) || (selo.id === 'servico' && checkIsService(p)));
    setSelectedProductIds(new Set(matchedProducts.map(p => p.id)));
    
    setProductSearch("");
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error("O nome do selo é obrigatório");
      return;
    }

    if (editingId) {
      updateSelo(editingId, { nome, ativo, corFundo, corTexto });
      applyBadgeToProducts(editingId, Array.from(selectedProductIds));
      toast.success("Selo atualizado com sucesso!");
    } else {
      const newId = `s_${Math.random().toString(36).substr(2, 9)}`;
      addSelo({ id: newId, nome, ativo, corFundo, corTexto });
      applyBadgeToProducts(newId, Array.from(selectedProductIds));
      toast.success("Selo criado com sucesso!");
    }
    
    setIsModalOpen(false);
  };

  const toggleProductSelection = (productId: string) => {
    const newSet = new Set(selectedProductIds);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    setSelectedProductIds(newSet);
  };

  const filteredProducts = useMemo(() => {
    return customProducts.filter(p => 
      p.nome.toLowerCase().includes(productSearch.toLowerCase()) || 
      p.ean?.includes(productSearch) || 
      p.marca?.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [customProducts, productSearch]);

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm("Tem certeza que deseja excluir este selo? Ele será removido de todos os produtos.")) {
      removeSelo(id);
      applyBadgeToProducts(id, []); // clear from all products
      toast.success("Selo excluído.");
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-[22px] font-bold text-[#1a1a1a]">Selos</h2>
          <span className="text-sm font-medium text-slate-500">{selos.length} selos</span>
        </div>
        <Button onClick={handleOpenNew} className="bg-[#00B5AD] hover:bg-[#009c95] text-white font-bold h-10 px-6 rounded-lg shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Novo selo
        </Button>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="buscar selo" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-white border-slate-200"
            />
          </div>
        </div>
        
        <div className="w-full">
          <div className="grid grid-cols-[1fr_200px_100px] items-center px-6 py-3 bg-[#faf9f8] border-b border-slate-100 text-[11px] font-black tracking-wider text-slate-700">
            <div>SELO</div>
            <div className="text-center">PRODUTOS VINCULADOS</div>
            <div className="text-right">AÇÕES</div>
          </div>
          
          {filteredSelos.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Nenhum selo encontrado.</div>
          ) : (
            filteredSelos.map((selo) => {
              const count = customProducts.filter(p => p.selosIds?.includes(selo.id) || (selo.id === 'gen' && checkIsGenerico(p)) || (selo.id === 'servico' && checkIsService(p))).length;
              
              return (
                <div 
                  key={selo.id} 
                  onClick={() => handleOpenEdit(selo)}
                  className="grid grid-cols-[1fr_200px_100px] items-center px-6 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex justify-center shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${selo.ativo ? 'bg-[#00AFA9]' : 'bg-slate-300'}`} />
                    </div>
                    <div 
                      className="px-3 py-1 rounded text-sm font-bold shadow-sm"
                      style={{ backgroundColor: selo.corFundo, color: selo.corTexto }}
                    >
                      {selo.nome}
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                      {count} {count === 1 ? 'produto' : 'produtos'}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={(e) => { e.stopPropagation(); handleOpenEdit(selo); }}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => handleDelete(selo.id, e)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL DE EDIÇÃO / CRIAÇÃO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="px-6 py-4 border-b bg-slate-50">
            <DialogTitle className="text-xl">{editingId ? 'Editar Selo' : 'Criar Novo Selo'}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col md:flex-row flex-1 min-h-0">
            {/* Esquerda: Configurações do Selo */}
            <div className="w-full md:w-[350px] border-r p-6 space-y-6 overflow-y-auto bg-white">
              
              <div className="flex items-center gap-2">
                <Switch checked={ativo} onCheckedChange={setAtivo} className="data-[state=checked]:bg-[#00AFA9]" />
                <Label className="font-bold text-slate-700">{ativo ? 'Selo Ativo' : 'Selo Inativo'}</Label>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Nome do Selo <span className="text-red-500">*</span></Label>
                <Input 
                  value={nome} 
                  onChange={e => setNome(e.target.value)} 
                  placeholder="Ex: Frete Grátis"
                  className="h-10 border-slate-200" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Cor do Fundo</Label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={corFundo}
                      onChange={e => setCorFundo(e.target.value)}
                      className="h-10 w-12 rounded cursor-pointer p-1"
                    />
                    <Input value={corFundo} onChange={e => setCorFundo(e.target.value)} className="h-10 border-slate-200 flex-1 font-mono text-xs uppercase" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Cor do Texto</Label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={corTexto}
                      onChange={e => setCorTexto(e.target.value)}
                      className="h-10 w-12 rounded cursor-pointer p-1"
                    />
                    <Input value={corTexto} onChange={e => setCorTexto(e.target.value)} className="h-10 border-slate-200 flex-1 font-mono text-xs uppercase" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <Label className="text-sm font-bold text-slate-700">Visualização</Label>
                <div className="border border-dashed border-slate-200 rounded-md p-4 bg-[#fafafa] flex items-center justify-center h-[100px]">
                  <div 
                    className="px-4 py-1.5 rounded text-sm font-bold shadow-sm"
                    style={{ backgroundColor: corFundo, color: corTexto }}
                  >
                    {nome || 'Nome do selo'}
                  </div>
                </div>
              </div>
            </div>

            {/* Direita: Vinculação de Produtos */}
            <div className="flex-1 flex flex-col bg-[#fcfcfc] min-h-0">
              <div className="p-4 border-b flex items-center justify-between gap-4 bg-white">
                <div>
                  <h3 className="font-bold text-slate-800">Vincular Produtos</h3>
                  <p className="text-xs text-slate-500">{selectedProductIds.size} selecionados</p>
                </div>
                <div className="relative w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Buscar produto..." 
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {filteredProducts.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">Nenhum produto encontrado.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-1">
                    {filteredProducts.map(p => {
                      const isSelected = selectedProductIds.has(p.id);
                      return (
                        <div 
                          key={p.id}
                          onClick={() => toggleProductSelection(p.id)}
                          className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-50 border border-emerald-100' : 'hover:bg-slate-100 border border-transparent'
                          }`}
                        >
                          <div className={`flex items-center justify-center h-5 w-5 rounded border shrink-0 ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'}`}>
                            {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-slate-700 truncate">{p.nome}</span>
                            <span className="text-xs text-slate-500 truncate">EAN: {p.ean || p.sku} • {p.marca || 'Sem marca'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-white">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-8">
              Aplicar Selo ({selectedProductIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import type { Filtro, FiltroOpcao } from "@/stores/filtros";
import { RadioToggle } from "./RadioToggle";
import { toast } from "sonner";
import { useAdminCategories } from "@/stores/categories";
import { cn } from "@/lib/utils";

interface FiltroFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  filtro?: Filtro | null;
  onSave: (filtro: Filtro) => void;
}

export function FiltroFormModal({ isOpen, onClose, filtro, onSave }: FiltroFormModalProps) {
  const [nome, setNome] = useState("");
  const [buscavel, setBuscavel] = useState(true);
  const [opcoes, setOpcoes] = useState<FiltroOpcao[]>([]);
  const [novaOpcao, setNovaOpcao] = useState("");
  const [selectedOpcoes, setSelectedOpcoes] = useState<Set<string>>(new Set());
  const [categoriasVinculadas, setCategoriasVinculadas] = useState<string[]>([]);
  
  const categories = useAdminCategories(s => s.categories);

  useEffect(() => {
    if (filtro) {
      setNome(filtro.nome);
      setBuscavel(filtro.buscavel);
      setOpcoes(filtro.opcoes || []);
      setCategoriasVinculadas(filtro.categoriasVinculadas || []);
    } else {
      setNome("");
      setBuscavel(true);
      setOpcoes([]);
      setCategoriasVinculadas([]);
    }
    setNovaOpcao("");
    setSelectedOpcoes(new Set());
  }, [filtro, isOpen]);

  if (!isOpen) return null;

  const handleAddOpcao = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!novaOpcao.trim()) return;
    const nomeOpcao = novaOpcao.trim();
    if (opcoes.find(o => o.nome.toLowerCase() === nomeOpcao.toLowerCase())) {
      toast.error("Opção já existe.");
      return;
    }
    setOpcoes([...opcoes, { id: `opc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, nome: nomeOpcao }]);
    setNovaOpcao("");
  };

  const handleRemoveOpcoes = () => {
    setOpcoes(opcoes.filter(o => !selectedOpcoes.has(o.id)));
    setSelectedOpcoes(new Set());
  };

  const removeOpcao = (id: string) => {
    setOpcoes(opcoes.filter(o => o.id !== id));
    const newSet = new Set(selectedOpcoes);
    newSet.delete(id);
    setSelectedOpcoes(newSet);
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedOpcoes);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedOpcoes(newSet);
  };

  const moveOpcaoUp = (index: number) => {
    if (index <= 0) return;
    const newOpcoes = [...opcoes];
    const item = newOpcoes[index];
    newOpcoes[index] = newOpcoes[index - 1];
    newOpcoes[index - 1] = item;
    setOpcoes(newOpcoes);
  };

  const moveOpcaoDown = (index: number) => {
    if (index >= opcoes.length - 1) return;
    const newOpcoes = [...opcoes];
    const item = newOpcoes[index];
    newOpcoes[index] = newOpcoes[index + 1];
    newOpcoes[index + 1] = item;
    setOpcoes(newOpcoes);
  };

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error("Nome do filtro é obrigatório.");
      return;
    }
    onSave({
      id: filtro?.id || `filtro-${Date.now()}`,
      nome: nome.trim(),
      buscavel,
      opcoes,
      categoriasVinculadas
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-slate-50 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center gap-1">
              &lt; ver todos os filtros
            </button>
            <h2 className="text-xl font-bold text-slate-800">
              {filtro ? `Editar filtro: ${filtro.nome}` : "Novo filtro"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-slate-900 text-white hover:bg-slate-800 font-bold px-6">
              Salvar Filtro
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Informações básicas</h3>
              <RadioToggle
                label="BUSCÁVEL"
                value={buscavel}
                onChange={setBuscavel}
              />
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">
                  Nome do filtro <span className="text-red-500">*</span>
                </label>
                <Input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Marca, Linha, Tipo de Pele, Volume..."
                  className="bg-slate-50 h-11 text-base font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700">
                    Vincular a Categorias (Opcional)
                  </label>
                  <span className="text-xs text-slate-400">
                    {categoriasVinculadas.length} categoria(s) selecionada(s)
                  </span>
                </div>
                <div className="p-3 border rounded-xl bg-slate-50 max-h-40 overflow-y-auto space-y-2">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                      <input 
                        type="checkbox" 
                        checked={categoriasVinculadas.includes(cat.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCategoriasVinculadas([...categoriasVinculadas, cat.id]);
                          } else {
                            setCategoriasVinculadas(categoriasVinculadas.filter(id => id !== cat.id));
                          }
                        }}
                        className="w-4 h-4 text-primary focus:ring-primary border-slate-300 rounded cursor-pointer"
                      />
                      <span className="text-sm font-medium text-slate-700">{cat.nome}</span>
                    </label>
                  ))}
                  {categories.length === 0 && (
                    <div className="text-sm text-slate-500 text-center py-2">Nenhuma categoria cadastrada.</div>
                  )}
                </div>
              </div>

              {/* Opções do Filtro */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800">
                    Opções do Filtro ({opcoes.length})
                  </label>
                  <span className="text-xs text-slate-400">
                    Ordene as opções usando as setas para cima ou para baixo
                  </span>
                </div>

                {/* Formulário de Adicionar Opção */}
                <form onSubmit={handleAddOpcao} className="flex gap-2 items-center">
                  <Input
                    value={novaOpcao}
                    onChange={e => setNovaOpcao(e.target.value)}
                    placeholder="Digite a nova opção (Ex: Revigore, Seca, Oleosa, 500ml...)"
                    className="flex-1 bg-white h-11 text-sm border-slate-300 focus-visible:ring-primary"
                  />
                  <Button 
                    type="submit" 
                    disabled={!novaOpcao.trim()} 
                    className={cn(
                      "h-11 px-5 font-bold transition-all shrink-0 shadow-sm",
                      novaOpcao.trim() 
                        ? "bg-orange-500 hover:bg-orange-600 text-white" 
                        : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    )}
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    {novaOpcao.trim() ? `+ Cadastrar "${novaOpcao.trim()}"` : "+ Adicionar Opção"}
                  </Button>
                </form>

                {/* Lista de Opções */}
                {opcoes.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-xl text-sm text-slate-500 border border-dashed border-slate-200 text-center">
                    Nenhuma opção cadastrada ainda. Digite o nome no campo acima e clique em cadastrar.
                  </div>
                ) : (
                  <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50 max-h-[380px] overflow-y-auto">
                    {opcoes.map((opcao, index) => (
                      <div 
                        key={opcao.id} 
                        className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs rounded-xl group transition-all"
                      >
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                          checked={selectedOpcoes.has(opcao.id)}
                          onChange={() => toggleSelect(opcao.id)}
                        />
                        
                        {/* Botões de Reordenação */}
                        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveOpcaoUp(index)}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Mover para cima"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === opcoes.length - 1}
                            onClick={() => moveOpcaoDown(index)}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Mover para baixo"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-xs font-bold text-slate-400 w-6 text-center">#{index + 1}</span>

                        <div className="flex-1 font-semibold text-sm text-slate-800">
                          {opcao.nome}
                        </div>

                        <button 
                          type="button"
                          onClick={() => removeOpcao(opcao.id)}
                          className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remover opção"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {selectedOpcoes.size > 0 && (
                      <div className="pt-3 border-t border-slate-200 mt-3 flex justify-between items-center px-1">
                        <span className="text-xs font-medium text-slate-500">
                          {selectedOpcoes.size} opção(ões) selecionada(s)
                        </span>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="bg-red-500 hover:bg-red-600 text-white h-8 text-xs font-bold"
                          onClick={handleRemoveOpcoes}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Excluir Selecionadas
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white flex justify-end gap-3 sticky bottom-0">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-slate-900 text-white hover:bg-slate-800 font-bold px-6">
            Salvar Filtro
          </Button>
        </div>
      </div>
    </div>
  );
}

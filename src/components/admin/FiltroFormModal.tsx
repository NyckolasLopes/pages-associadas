import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ExternalLink, Image as ImageIcon } from "lucide-react";
import type { Filtro, FiltroOpcao } from "@/stores/filtros";
import { RadioToggle } from "./RadioToggle";
import { toast } from "sonner";
import { useAdminCategories } from "@/stores/categories";

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
    setOpcoes([...opcoes, { id: Date.now().toString(), nome: nomeOpcao, cor: "#000000" }]);
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

  const updateOpcao = (id: string, updates: Partial<FiltroOpcao>) => {
    setOpcoes(opcoes.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error("Nome do filtro é obrigatório.");
      return;
    }
    onSave({
      id: filtro?.id || Date.now().toString(),
      nome,
      buscavel,
      opcoes,
      categoriasVinculadas
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
      <div className="bg-slate-50 w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white rounded-t-2xl border-b">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center gap-1">
              &lt; ver todos os filtros
            </button>
            <h2 className="text-xl font-bold text-slate-800">
              {filtro ? "Editar filtro" : "Novo filtro"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-slate-900 text-white hover:bg-slate-800">Salvar</Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex gap-8">
          <div className="flex-1 bg-white border rounded-xl overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="text-lg font-bold text-slate-800">Informações básicas</h3>
            </div>
            
            <div className="p-5 space-y-6">
              <div>
                <RadioToggle
                  label="BUSCÁVEL"
                  value={buscavel}
                  onChange={setBuscavel}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">
                  Nome do filtro <span className="text-red-500">*</span>
                </label>
                <Input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Tamanho"
                  className="bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">
                  Vincular a Categorias
                </label>
                <div className="p-3 border rounded-lg bg-slate-50 max-h-48 overflow-y-auto space-y-2">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
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
                        className="w-4 h-4 text-primary focus:ring-primary border-slate-300 rounded"
                      />
                      <span className="text-sm font-medium text-slate-700">{cat.nome}</span>
                    </label>
                  ))}
                  {categories.length === 0 && (
                    <div className="text-sm text-slate-500 text-center py-2">Nenhuma categoria cadastrada.</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Opções</label>
                <form onSubmit={handleAddOpcao} className="flex gap-2">
                  <Input
                    value={novaOpcao}
                    onChange={e => setNovaOpcao(e.target.value)}
                    placeholder="Cadastrar opção"
                    className="flex-1 border-dashed focus:border-solid bg-slate-50"
                  />
                  {novaOpcao && (
                    <Button type="submit" variant="secondary" className="bg-slate-100 shrink-0">
                      + Cadastrar "{novaOpcao}"
                    </Button>
                  )}
                </form>

                {opcoes.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500 mt-4 border border-slate-100 text-center">
                    Nenhuma opção cadastrada
                  </div>
                ) : (
                  <div className="mt-4 space-y-2 border rounded-lg p-2 max-h-[300px] overflow-y-auto">
                    {opcoes.map(opcao => (
                      <div key={opcao.id} className="flex items-center gap-4 p-2 hover:bg-slate-50 rounded-lg group transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                          checked={selectedOpcoes.has(opcao.id)}
                          onChange={() => toggleSelect(opcao.id)}
                        />
                        <div className="flex-1 font-medium text-sm text-slate-700">
                          {opcao.nome}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={opcao.cor || "#000000"}
                            onChange={e => updateOpcao(opcao.id, { cor: e.target.value })}
                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                            title="Cor"
                          />
                          <Input 
                            type="text" 
                            className="w-24 h-8 text-xs bg-white" 
                            value={opcao.cor || "#000000"}
                            onChange={e => updateOpcao(opcao.id, { cor: e.target.value })}
                          />
                        </div>

                        <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 font-medium">
                          <ImageIcon className="h-4 w-4 mr-1" /> Selecionar imagem
                        </Button>

                        <button 
                          onClick={() => removeOpcao(opcao.id)}
                          className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    {selectedOpcoes.size > 0 && (
                      <div className="pt-2 border-t mt-2 flex justify-start">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="bg-red-200 text-red-700 hover:bg-red-300 h-8 text-xs font-bold"
                          onClick={handleRemoveOpcoes}
                        >
                          EXCLUIR SELECIONADOS
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-64 pt-4">
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white rounded-b-2xl flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-slate-900 text-white hover:bg-slate-800">Salvar</Button>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Search, ChevronDown, Plus, Trash2, Edit2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useVariacoesStore, Variacao } from "@/stores/variacoes";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/variacoes")({
  component: AdminVariacoes,
});

function AdminVariacoes() {
  const { variacoes, addVariacao, updateVariacao, removeVariacao } = useVariacoesStore();
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ nome: string, opcoes: string }>({ nome: "", opcoes: "" });

  const filtered = variacoes.filter(v => v.nome.toLowerCase().includes(search.toLowerCase()));

  const handleOpenModal = (v?: Variacao) => {
    if (v) {
      setEditingId(v.id);
      setFormData({ nome: v.nome, opcoes: v.opcoes?.join(", ") || "" });
    } else {
      setEditingId(null);
      setFormData({ nome: "", opcoes: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome.trim()) {
      toast.error("O nome da variação é obrigatório.");
      return;
    }
    const opcoesArray = formData.opcoes.split(",").map(s => s.trim()).filter(Boolean);
    
    if (editingId) {
      updateVariacao({ id: editingId, nome: formData.nome, opcoes: opcoesArray });
      toast.success("Variação atualizada com sucesso!");
    } else {
      addVariacao({ id: Math.random().toString(36).substr(2, 9), nome: formData.nome, opcoes: opcoesArray });
      toast.success("Variação criada com sucesso!");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta variação?")) {
      removeVariacao(id);
      toast.success("Variação removida.");
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-[22px] font-bold text-[#1a1a1a]">Variações</h2>
          <span className="text-sm font-medium text-slate-500">{variacoes.length} {variacoes.length === 1 ? 'variação' : 'variações'}</span>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-6">
          <Plus className="h-4 w-4 mr-2" /> Nova variação
        </Button>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="buscar variação" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 bg-white border-slate-200"
            />
          </div>
        </div>
        
        <div className="w-full">
          <div className="grid grid-cols-[48px_1fr_1fr_100px] items-center px-4 py-3 bg-[#faf9f8] border-b border-slate-100 text-[11px] font-black tracking-wider text-slate-700">
            <div className="flex justify-center"><Checkbox className="border-slate-300" /></div>
            <div>NOME DA VARIAÇÃO</div>
            <div>OPÇÕES (QTD)</div>
            <div className="text-center">AÇÕES</div>
          </div>
          
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Nenhuma variação encontrada.
            </div>
          ) : (
            filtered.map((v) => (
              <div key={v.id} className="grid grid-cols-[48px_1fr_1fr_100px] items-center px-4 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                <div className="flex justify-center"><Checkbox className="border-slate-300" /></div>
                <div className="font-bold text-slate-700 text-[13px]">{v.nome}</div>
                <div className="text-slate-500 text-sm truncate max-w-[300px]">
                  {v.opcoes?.length > 0 ? v.opcoes.join(", ") : <span className="italic text-slate-400">Nenhuma opção</span>}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary" onClick={() => handleOpenModal(v)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-500" onClick={() => handleDelete(v.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Variação" : "Nova Variação"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold">Nome da Variação (ex: Dosagem)</Label>
              <Input 
                placeholder="Ex: Cor, Tamanho, Dosagem" 
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-2">
                Opções <Info className="h-4 w-4 text-slate-400" />
              </Label>
              <p className="text-xs text-slate-500 mb-1">Separe as opções por vírgula. Ex: 500mg, 1g, 20ml</p>
              <Input 
                placeholder="Ex: 500mg, 1g" 
                value={formData.opcoes}
                onChange={e => setFormData({ ...formData, opcoes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-[#211f26] hover:bg-black text-white" onClick={handleSave}>
              Salvar Variação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

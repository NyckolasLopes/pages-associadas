import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Produto, Vitrine } from "@/types";
import { useAdminProducts } from "@/stores/products";
import { Sparkles, Save } from "lucide-react";
import { toast } from "sonner";

interface HighlightProductModalProps {
  product: Produto | null;
  isOpen: boolean;
  onClose: () => void;
  lojaId?: string | null;
  onSaveDestaqueGlobal: (destaque: boolean) => Promise<void>;
}

export function HighlightProductModal({ product, isOpen, onClose, lojaId, onSaveDestaqueGlobal }: HighlightProductModalProps) {
  const { getStoreVitrines, updateVitrine } = useAdminProducts();
  const vitrines = getStoreVitrines(lojaId);

  if (!product) return null;

  const handleToggleVitrine = (vitrine: Vitrine, active: boolean) => {
    let currentIds = vitrine.produtoIds || [];
    if (active) {
      if (!currentIds.includes(String(product.id))) {
        currentIds = [...currentIds, String(product.id)];
      }
    } else {
      currentIds = currentIds.filter(id => id !== String(product.id));
    }
    updateVitrine({ ...vitrine, produtoIds: currentIds }, lojaId);
    toast.success(`Produto ${active ? 'adicionado à' : 'removido da'} vitrine "${vitrine.nome}".`);
  };

  const handleToggleGlobal = async (active: boolean) => {
    try {
      await onSaveDestaqueGlobal(active);
      toast.success(`Destaque global do produto ${active ? 'ativado' : 'desativado'}.`);
    } catch (e) {
      toast.error("Erro ao alterar destaque global.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Qual vitrine você gostaria de destacar esse produto?
          </DialogTitle>
          <DialogDescription>
            Ative ou desative o destaque deste produto nas vitrines da loja.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-50 border-amber-100">
            <div>
              <p className="font-medium text-amber-900">Destaque Global</p>
              <p className="text-xs text-amber-700">Aparecer em seções gerais de destaque</p>
            </div>
            <Switch 
              checked={product.destaque || false} 
              onCheckedChange={handleToggleGlobal} 
            />
          </div>

          <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto pr-2">
            <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Vitrines Disponíveis</h4>
            {vitrines.length === 0 && (
              <p className="text-sm text-slate-500 italic">Nenhuma vitrine cadastrada.</p>
            )}
            {vitrines.map((v) => {
              const isActive = (v.produtoIds || []).includes(String(product.id));
              return (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50">
                  <div>
                    <p className="font-medium">{v.nome}</p>
                    <p className="text-xs text-slate-500">{v.local === 'espaco_1' ? 'Topo' : v.local === 'espaco_2' ? 'Meio' : 'Fundo'} • {v.modo === 'categoria' ? 'Automática' : 'Manual'}</p>
                  </div>
                  <Switch 
                    checked={isActive} 
                    onCheckedChange={(checked) => handleToggleVitrine(v, checked)} 
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

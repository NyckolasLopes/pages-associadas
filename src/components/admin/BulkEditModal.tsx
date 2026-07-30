import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Layers, Loader2, Check } from "lucide-react";
import type { Produto, Tarja } from "@/types";
import categoriesData from "@/data/categories.json";

interface BulkEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filteredProducts: Produto[];
  onBulkUpdate: (productIds: string[], updates: Partial<Produto>) => void;
}

export function BulkEditModal({ open, onOpenChange, filteredProducts, onBulkUpdate }: BulkEditModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // States for what the user wants to update
  const [updateAtivo, setUpdateAtivo] = useState<string>("__none__");
  const [updateDestaque, setUpdateDestaque] = useState<string>("__none__");
  const [updateCategoria, setUpdateCategoria] = useState<string>("__none__");
  const [updateTarja, setUpdateTarja] = useState<string>("__none__");

  const reset = useCallback(() => {
    setUpdateAtivo("__none__");
    setUpdateDestaque("__none__");
    setUpdateCategoria("__none__");
    setUpdateTarja("__none__");
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const handleApplyChanges = () => {
    if (filteredProducts.length === 0) {
      toast.error("Nenhum produto filtrado para aplicar as alterações.");
      return;
    }

    const updates: Partial<Produto> = {};
    let hasUpdates = false;

    if (updateAtivo !== "__none__") {
      updates.ativo = updateAtivo === "true";
      hasUpdates = true;
    }
    
    if (updateDestaque !== "__none__") {
      updates.destaque = updateDestaque === "true";
      hasUpdates = true;
    }

    if (updateCategoria !== "__none__") {
      updates.categoriaId = updateCategoria;
      hasUpdates = true;
    }

    if (updateTarja !== "__none__") {
      updates.tarja = updateTarja as Tarja;
      hasUpdates = true;
    }

    if (!hasUpdates) {
      toast.info("Nenhuma alteração foi selecionada.");
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const productIds = filteredProducts.map(p => p.id);
      onBulkUpdate(productIds, updates);
      toast.success(`Alterações aplicadas a ${productIds.length} produtos com sucesso!`);
      setIsProcessing(false);
      handleClose();
    }, 1000);
  };

  const topCats = (categoriesData as any[]).filter(c => !c.parentId);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !isProcessing) handleClose(); else if (v) onOpenChange(true); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5 text-indigo-600" />
            Alterações em Massa
          </DialogTitle>
          <DialogDescription>
            Atenção: As alterações abaixo serão aplicadas aos <strong>{filteredProducts.length}</strong> produtos que estão atualmente filtrados na tela.
          </DialogDescription>
        </DialogHeader>

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
            <p className="font-medium text-slate-600">Aplicando alterações...</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="grid gap-4 bg-slate-50 p-4 rounded-lg border">
              
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right font-medium">Status (Ativo)</Label>
                <Select value={updateAtivo} onValueChange={setUpdateAtivo}>
                  <SelectTrigger className="col-span-2 bg-white">
                    <SelectValue placeholder="Manter atual" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Manter atual</SelectItem>
                    <SelectItem value="true">Sim (Ativar)</SelectItem>
                    <SelectItem value="false">Não (Desativar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right font-medium">Destaque</Label>
                <Select value={updateDestaque} onValueChange={setUpdateDestaque}>
                  <SelectTrigger className="col-span-2 bg-white">
                    <SelectValue placeholder="Manter atual" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Manter atual</SelectItem>
                    <SelectItem value="true">Sim (Destacar)</SelectItem>
                    <SelectItem value="false">Não (Remover destaque)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right font-medium">Categoria</Label>
                <Select value={updateCategoria} onValueChange={setUpdateCategoria}>
                  <SelectTrigger className="col-span-2 bg-white">
                    <SelectValue placeholder="Manter atual" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Manter atual</SelectItem>
                    {topCats.map(cat => (
                      <SelectItem key={cat.id} value={String(cat.id)}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right font-medium">Tarja</Label>
                <Select value={updateTarja} onValueChange={setUpdateTarja}>
                  <SelectTrigger className="col-span-2 bg-white">
                    <SelectValue placeholder="Manter atual" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Manter atual</SelectItem>
                    <SelectItem value="Sem Tarja">Sem Tarja</SelectItem>
                    <SelectItem value="Amarela">Amarela</SelectItem>
                    <SelectItem value="Vermelha">Vermelha</SelectItem>
                    <SelectItem value="Vermelha Retém Receita">Vermelha Retém Receita</SelectItem>
                    <SelectItem value="Preta">Preta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>
        )}

        {!isProcessing && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleApplyChanges} 
              className="bg-indigo-600 hover:bg-indigo-700 font-bold"
              disabled={filteredProducts.length === 0}
            >
              <Check className="w-4 h-4 mr-2" />
              Aplicar a {filteredProducts.length} produtos
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

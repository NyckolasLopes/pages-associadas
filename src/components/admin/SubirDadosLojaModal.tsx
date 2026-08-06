import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdmin } from "@/stores/admin";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";

export function SubirDadosLojaModal({ 
  open, 
  onOpenChange,
  title = "Subir Dados para Loja"
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  title?: string;
}) {
  const { pharmacies } = useAdmin();
  const [selectedLoja, setSelectedLoja] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!selectedLoja) {
      toast.error("Por favor, selecione uma loja.");
      return;
    }
    
    setIsSubmitting(true);
    // Simulate upload delay
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Dados enviados para a loja com sucesso!");
      onOpenChange(false);
      setSelectedLoja("");
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Selecione a loja (página) para qual deseja subir os dados atuais.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="text-sm font-bold text-slate-700 mb-2 block">
            Página / Loja de Destino
          </label>
          <Select value={selectedLoja} onValueChange={setSelectedLoja}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma loja..." />
            </SelectTrigger>
            <SelectContent>
              {pharmacies.map(loja => (
                <SelectItem key={loja.id} value={loja.id}>
                  {loja.nome} {loja.cidade ? `(${loja.cidade})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedLoja}>
            {isSubmitting ? "Enviando..." : "Confirmar Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

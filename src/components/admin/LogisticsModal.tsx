import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pharmacy, useAdmin } from "@/stores/admin";
import { toast } from "sonner";
import { Package, Truck, MapPin } from "lucide-react";

interface LogisticsModalProps {
  pharmacy: Pharmacy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogisticsModal({ pharmacy, open, onOpenChange }: LogisticsModalProps) {
  const { updatePharmacy } = useAdmin();
  const [formData, setFormData] = useState<Partial<Pharmacy>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (pharmacy && open) {
      setFormData(pharmacy);
    }
  }, [pharmacy, open]);

  const handleSave = async () => {
    if (!pharmacy?.id) return;
    setIsSaving(true);
    try {
      await updatePharmacy(pharmacy.id, { ...pharmacy, ...formData } as Pharmacy);
      toast.success("Configurações de logística salvas com sucesso!");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!pharmacy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Logística e Entrega - {pharmacy.nome}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="retirada" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="retirada" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Retirada na Loja
            </TabsTrigger>
            <TabsTrigger value="entrega" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Entrega (Delivery)
            </TabsTrigger>
          </TabsList>

          {/* TAB: RETIRADA */}
          <TabsContent value="retirada" className="space-y-6 py-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
              <div className="space-y-1">
                <Label className="text-base font-bold text-slate-800">Habilitar Retirada</Label>
                <p className="text-sm text-slate-500">Permitir que clientes comprem no site e retirem na loja física.</p>
              </div>
              <Switch
                checked={!!formData.aceitaRetirada}
                onCheckedChange={(c) => setFormData({ ...formData, aceitaRetirada: c })}
              />
            </div>

            {formData.aceitaRetirada && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horário Início</Label>
                  <Input
                    type="time"
                    value={formData.horarioInicioRetirada || ""}
                    onChange={(e) => setFormData({ ...formData, horarioInicioRetirada: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário Fim</Label>
                  <Input
                    type="time"
                    value={formData.horarioFimRetirada || ""}
                    onChange={(e) => setFormData({ ...formData, horarioFimRetirada: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Tempo Médio de Preparo</Label>
                  <Input
                    placeholder="Ex: 30 minutos, 1 hora..."
                    value={formData.tempoRetirada || ""}
                    onChange={(e) => setFormData({ ...formData, tempoRetirada: e.target.value })}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB: ENTREGA */}
          <TabsContent value="entrega" className="space-y-6 py-4">
             <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
              <div className="space-y-1">
                <Label className="text-base font-bold text-slate-800">Habilitar Entrega Própria</Label>
                <p className="text-sm text-slate-500">Permitir que a loja entregue pedidos na região definida.</p>
              </div>
              <Switch
                checked={!!formData.aceitaEntrega}
                onCheckedChange={(c) => setFormData({ ...formData, aceitaEntrega: c })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2 col-span-2">
                  <Label>Modelo de Frete</Label>
                  <Select
                    value={formData.modeloFrete || "raio"}
                    onValueChange={(v: "cep" | "fixo" | "raio") => setFormData({ ...formData, modeloFrete: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raio">Por Raio (Km)</SelectItem>
                      <SelectItem value="cep">Por Faixa de CEP</SelectItem>
                      <SelectItem value="fixo">Preço Fixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.modeloFrete === "raio" && (
                  <div className="space-y-2 col-span-2">
                    <Label>Raio Máximo de Entrega (Km)</Label>
                    <Input
                      type="number"
                      value={formData.raioEntregaKm || ""}
                      onChange={(e) => setFormData({ ...formData, raioEntregaKm: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                )}
                
                {formData.modeloFrete === "fixo" && (
                  <div className="space-y-2 col-span-2">
                    <Label>Custo Fixo de Entrega (R$)</Label>
                    <Input
                      type="number"
                      value={formData.custoEntrega || ""}
                      onChange={(e) => setFormData({ ...formData, custoEntrega: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Horário Início Entrega</Label>
                  <Input
                    type="time"
                    value={formData.horarioInicioEntrega || ""}
                    onChange={(e) => setFormData({ ...formData, horarioInicioEntrega: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário Fim Entrega</Label>
                  <Input
                    type="time"
                    value={formData.horarioFimEntrega || ""}
                    onChange={(e) => setFormData({ ...formData, horarioFimEntrega: e.target.value })}
                  />
                </div>
                 <div className="space-y-2 col-span-2">
                  <Label>Tempo de Entrega Prometido</Label>
                  <Input
                    placeholder="Ex: 45 a 60 minutos"
                    value={formData.tempoEntrega || ""}
                    onChange={(e) => setFormData({ ...formData, tempoEntrega: e.target.value })}
                  />
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
               <h3 className="font-semibold text-slate-800">Opções Adicionais e Parceiros</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!!formData.aceitaMotoboy}
                      onCheckedChange={(c) => setFormData({ ...formData, aceitaMotoboy: c })}
                    />
                    <Label>Motoboy Terceirizado</Label>
                  </div>
                   <div className="flex items-center space-x-2">
                    <Switch
                      checked={!!formData.aceitaUber}
                      onCheckedChange={(c) => setFormData({ ...formData, aceitaUber: c })}
                    />
                    <Label>Uber Flash</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!!formData.aceita99}
                      onCheckedChange={(c) => setFormData({ ...formData, aceita99: c })}
                    />
                    <Label>99 Entrega</Label>
                  </div>
               </div>
            </div>

          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
            {isSaving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

            <div className="space-y-3 pt-2">
              <Label>Faixas de Entrega por Raio (Km)</Label>
              <div className="space-y-2">
                {(formData.raiosEntrega || []).map((raio, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm font-medium">Até</span>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={raio.ateKm || ""}
                        onChange={(e) => {
                          const newRaios = [...(formData.raiosEntrega || [])];
                          newRaios[idx].ateKm = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, raiosEntrega: newRaios });
                        }}
                        className="w-24"
                        placeholder="Km"
                      />
                      <span className="text-sm font-medium">km</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm font-medium">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={raio.preco || ""}
                        onChange={(e) => {
                          const newRaios = [...(formData.raiosEntrega || [])];
                          newRaios[idx].preco = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, raiosEntrega: newRaios });
                        }}
                        className="w-28"
                        placeholder="0,00"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        const newRaios = [...(formData.raiosEntrega || [])];
                        newRaios.splice(idx, 1);
                        setFormData({ ...formData, raiosEntrega: newRaios });
                      }}
                    >
                      X
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-bold mt-2"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      raiosEntrega: [...(formData.raiosEntrega || []), { ateKm: 0, preco: 0 }]
                    });
                  }}
                >
                  + Adicionar Faixa
                </Button>
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

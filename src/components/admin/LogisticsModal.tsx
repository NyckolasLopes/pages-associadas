import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Pharmacy, useAdmin } from "@/stores/admin";
import { toast } from "sonner";
import { Package, Truck, MapPin, Clock, Calendar, X } from "lucide-react";

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="retirada" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Retirada
            </TabsTrigger>
            <TabsTrigger value="entrega" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Entrega
            </TabsTrigger>
            <TabsTrigger value="horarios" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horários
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
            <div className="space-y-3 pt-4 border-t">
              <Label>Faixas de Entrega por Valor do Pedido (R$)</Label>
              <div className="text-xs text-slate-500 mb-2">Configure o custo de entrega com base no valor total do carrinho (subtotal final). Se o valor do carrinho for maior ou igual ao Valor Mínimo, essa taxa será aplicada prioritariamente.</div>
              <div className="space-y-2">
                {(formData.faixasValorPedido || []).map((faixa, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded border">
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-xs font-medium text-slate-500">Valor Mín (R$)</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={faixa.valorMin ?? ""}
                        onChange={(e) => {
                          const newFaixas = [...(formData.faixasValorPedido || [])];
                          newFaixas[idx].valorMin = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, faixasValorPedido: newFaixas });
                        }}
                        placeholder="0,00"
                        className="bg-white"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-xs font-medium text-slate-500">Custo Entrega (R$)</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={faixa.taxa ?? ""}
                        onChange={(e) => {
                          const newFaixas = [...(formData.faixasValorPedido || [])];
                          newFaixas[idx].taxa = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, faixasValorPedido: newFaixas });
                        }}
                        placeholder="0,00"
                        className="bg-white"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-5 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        const newFaixas = [...(formData.faixasValorPedido || [])];
                        newFaixas.splice(idx, 1);
                        setFormData({ ...formData, faixasValorPedido: newFaixas });
                      }}
                    >
                      <span className="sr-only">Remover</span>X
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
                      faixasValorPedido: [...(formData.faixasValorPedido || []), { valorMin: 0, taxa: 0 }]
                    });
                  }}
                >
                  + Adicionar Faixa de Valor
                </Button>
              </div>
            </div>

          </TabsContent>

          <TabsContent value="horarios" className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-base font-bold text-slate-800">Horários por Dia</Label>
                <p className="text-sm text-slate-500">Defina os horários de operação padrão para cada dia da semana.</p>
              </div>
              <div className="border rounded-md divide-y overflow-hidden">
                {['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'].map((nomeDia, idx) => {
                  const currentConfig = formData.horariosPorDia?.find(h => h.dia === idx) || { dia: idx, abre: '08:00', fecha: '18:00', fechado: false };
                  return (
                    <div key={idx} className="flex flex-wrap items-center justify-between p-3 bg-slate-50 gap-2">
                      <div className="w-24 font-medium text-sm text-slate-700">{nomeDia}</div>
                      <div className="flex items-center gap-4 flex-1 justify-end">
                        <Label className="text-sm flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                          <Checkbox 
                            checked={currentConfig.fechado} 
                            onCheckedChange={(c: boolean | 'indeterminate') => {
                              const newH = [...(formData.horariosPorDia || [])];
                              const i = newH.findIndex(h => h.dia === idx);
                              if (i >= 0) newH[i].fechado = !!c;
                              else newH.push({ ...currentConfig, fechado: !!c });
                              setFormData({ ...formData, horariosPorDia: newH });
                            }} 
                          />
                          Fechado
                        </Label>
                        {!currentConfig.fechado && (
                          <div className="flex items-center gap-2">
                            <Input 
                              type="time" 
                              className="w-28 h-9 text-sm" 
                              value={currentConfig.abre}
                              onChange={(e) => {
                                const newH = [...(formData.horariosPorDia || [])];
                                const i = newH.findIndex(h => h.dia === idx);
                                if (i >= 0) newH[i].abre = e.target.value;
                                else newH.push({ ...currentConfig, abre: e.target.value });
                                setFormData({ ...formData, horariosPorDia: newH });
                              }}
                            />
                            <span className="text-sm text-slate-400">às</span>
                            <Input 
                              type="time" 
                              className="w-28 h-9 text-sm" 
                              value={currentConfig.fecha}
                              onChange={(e) => {
                                const newH = [...(formData.horariosPorDia || [])];
                                const i = newH.findIndex(h => h.dia === idx);
                                if (i >= 0) newH[i].fecha = e.target.value;
                                else newH.push({ ...currentConfig, fecha: e.target.value });
                                setFormData({ ...formData, horariosPorDia: newH });
                              }}
                            />
                          </div>
                        )}
                        {currentConfig.fechado && (
                           <div className="flex items-center w-[252px]"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-1">
                <Label className="text-base font-bold text-slate-800">Datas Especiais / Feriados</Label>
                <p className="text-sm text-slate-500">Adicione exceções ao horário padrão, como feriados e emendas.</p>
              </div>
              <div className="space-y-2">
                {(formData.datasEspeciais || []).map((dataEsp, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-3 p-3 bg-white border rounded shadow-sm">
                    <Input 
                      type="date" 
                      className="w-auto h-9 text-sm" 
                      value={dataEsp.data}
                      onChange={(e) => {
                        const newDE = [...(formData.datasEspeciais || [])];
                        newDE[idx].data = e.target.value;
                        setFormData({ ...formData, datasEspeciais: newDE });
                      }}
                    />
                    <Input 
                      placeholder="Descrição (ex: Natal)" 
                      className="w-[180px] h-9 text-sm" 
                      value={dataEsp.descricao || ''}
                      onChange={(e) => {
                        const newDE = [...(formData.datasEspeciais || [])];
                        newDE[idx].descricao = e.target.value;
                        setFormData({ ...formData, datasEspeciais: newDE });
                      }}
                    />
                    <Label className="text-sm flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                      <Checkbox 
                        checked={dataEsp.fechado} 
                        onCheckedChange={(c: boolean | 'indeterminate') => {
                          const newDE = [...(formData.datasEspeciais || [])];
                          newDE[idx].fechado = !!c;
                          setFormData({ ...formData, datasEspeciais: newDE });
                        }} 
                      />
                      Fechado
                    </Label>
                    {!dataEsp.fechado && (
                      <div className="flex items-center gap-2 ml-auto">
                        <Input 
                          type="time" 
                          className="w-24 h-9 text-sm" 
                          value={dataEsp.abre}
                          onChange={(e) => {
                            const newDE = [...(formData.datasEspeciais || [])];
                            newDE[idx].abre = e.target.value;
                            setFormData({ ...formData, datasEspeciais: newDE });
                          }}
                        />
                        <span className="text-sm text-slate-400">às</span>
                        <Input 
                          type="time" 
                          className="w-24 h-9 text-sm" 
                          value={dataEsp.fecha}
                          onChange={(e) => {
                            const newDE = [...(formData.datasEspeciais || [])];
                            newDE[idx].fecha = e.target.value;
                            setFormData({ ...formData, datasEspeciais: newDE });
                          }}
                        />
                      </div>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 ml-auto text-red-500 hover:text-red-700 hover:bg-red-50" 
                      onClick={() => {
                        const newDE = [...(formData.datasEspeciais || [])];
                        newDE.splice(idx, 1);
                        setFormData({ ...formData, datasEspeciais: newDE });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs font-bold"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      datasEspeciais: [...(formData.datasEspeciais || []), { data: '', descricao: '', fechado: true, abre: '08:00', fecha: '18:00' }]
                    });
                  }}
                >
                  + Adicionar Data Especial
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


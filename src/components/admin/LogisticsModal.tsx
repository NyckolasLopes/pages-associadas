import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Pharmacy, useAdmin, CustomDeliveryMethod } from "@/stores/admin";
import { toast } from "sonner";
import { Package, Truck, MapPin, Clock, Calendar, X, Plus, Edit2, Trash2 } from "lucide-react";
import { CustomDeliveryMethod } from "@/stores/admin";

interface LogisticsModalProps {
  pharmacy: Pharmacy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogisticsModal({ pharmacy, open, onOpenChange }: LogisticsModalProps) {
  const { updatePharmacy } = useAdmin();
  const [formData, setFormData] = useState<Partial<Pharmacy>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<CustomDeliveryMethod | null>(null);

  const handleSaveMethod = (method: CustomDeliveryMethod) => {
    const currentMethods = formData.meiosEntregaPersonalizados || [];
    let newMethods;
    if (currentMethods.find(m => m.id === method.id)) {
      newMethods = currentMethods.map(m => m.id === method.id ? method : m);
    } else {
      newMethods = [...currentMethods, method];
    }
    setFormData({ ...formData, meiosEntregaPersonalizados: newMethods });
    setMethodModalOpen(false);
  };

  const handleDeleteMethod = (id: string) => {
    const currentMethods = formData.meiosEntregaPersonalizados || [];
    setFormData({ ...formData, meiosEntregaPersonalizados: currentMethods.filter(m => m.id !== id) });
  };

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

            
            <div className="space-y-4 pt-6 mt-6 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">Meios de Entrega Personalizados</h3>
                <Button onClick={() => {
                  setEditingMethod({
                    id: Date.now().toString(),
                    nome: "",
                    ativo: true,
                    tempoEntrega: "",
                    raios: [],
                    faixasValorPedido: []
                  });
                  setMethodModalOpen(true);
                }} variant="outline" size="sm" className="font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Meio
                </Button>
              </div>

              {(!formData.meiosEntregaPersonalizados || formData.meiosEntregaPersonalizados.length === 0) ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg text-slate-500 bg-slate-50 text-sm">
                  Nenhum meio de entrega cadastrado.<br/>Clique em "Novo Meio" para adicionar.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {formData.meiosEntregaPersonalizados.map(method => (
                    <div key={method.id} className="border rounded-lg p-3 bg-white shadow-sm hover:shadow relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1 h-full ${method.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <div className="flex justify-between items-center pl-3">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{method.nome}</h4>
                          <p className="text-xs text-slate-500">{method.tempoEntrega}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            setEditingMethod(method);
                            setMethodModalOpen(true);
                          }}>
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteMethod(method.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Modal for Editing a Delivery Method */}
      {editingMethod && (
        <Dialog open={methodModalOpen} onOpenChange={setMethodModalOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto z-[999]">
            <DialogHeader>
              <DialogTitle className="text-xl">Configurar Meio de Entrega</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                <Label className="font-bold">Método Ativo</Label>
                <Switch
                  checked={editingMethod.ativo}
                  onCheckedChange={(c) => setEditingMethod({ ...editingMethod, ativo: c })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Nome do Método</Label>
                  <Input 
                    placeholder="Ex: Motoboy, Uber, Correios..." 
                    value={editingMethod.nome} 
                    onChange={e => setEditingMethod({...editingMethod, nome: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Tempo de Entrega Prometido</Label>
                  <Input 
                    placeholder="Ex: Até 60 min, Mesma hora..." 
                    value={editingMethod.tempoEntrega} 
                    onChange={e => setEditingMethod({...editingMethod, tempoEntrega: e.target.value})} 
                  />
                </div>
              </div>
              
              <div className="space-y-4 pt-4 mt-6 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-slate-800">Faixas de Entrega por Raio (Km)</h3>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {(editingMethod.raios || []).map((raio, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded border">
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-xs font-medium">Até</span>
                        <NumericInput
                          min="0"
                          value={raio.ateKm}
                          onChange={(val) => {
                            const newRaios = [...(editingMethod.raios || [])];
                            newRaios[idx].ateKm = val || 0;
                            setEditingMethod({ ...editingMethod, raios: newRaios });
                          }}
                          className="w-20 h-8"
                          placeholder="Km"
                        />
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-xs font-medium">R$</span>
                        <NumericInput
                          min="0"
                          value={raio.preco}
                          onChange={(val) => {
                            const newRaios = [...(editingMethod.raios || [])];
                            newRaios[idx].preco = val || 0;
                            setEditingMethod({ ...editingMethod, raios: newRaios });
                          }}
                          className="w-24 h-8"
                          placeholder="0,00"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 h-8"
                        onClick={() => {
                          const newRaios = [...(editingMethod.raios || [])];
                          newRaios.splice(idx, 1);
                          setEditingMethod({ ...editingMethod, raios: newRaios });
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
                      setEditingMethod({
                        ...editingMethod,
                        raios: [...(editingMethod.raios || []), { ateKm: 0, preco: 0 }]
                      });
                    }}
                  >
                    + Adicionar Faixa de Raio
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-4 mt-6 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-slate-800">Faixas de Entrega por Valor</h3>
                  </div>
                </div>
              
              <div className="space-y-2">
                  {(editingMethod.faixasValorPedido || []).map((faixa, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded border">
                      <div className="flex-1 flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-500">Valor Mínimo (R$)</span>
                        <NumericInput
                          min="0"
                          value={faixa.valorMin}
                          onChange={(val) => {
                            const newFaixas = [...(editingMethod.faixasValorPedido || [])];
                            newFaixas[idx].valorMin = val || 0;
                            setEditingMethod({ ...editingMethod, faixasValorPedido: newFaixas });
                          }}
                          placeholder="0,00"
                          className="bg-white h-8"
                        />
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-500">Frete (R$)</span>
                        <NumericInput
                          min="0"
                          value={faixa.taxa}
                          onChange={(val) => {
                            const newFaixas = [...(editingMethod.faixasValorPedido || [])];
                            newFaixas[idx].taxa = val || 0;
                            setEditingMethod({ ...editingMethod, faixasValorPedido: newFaixas });
                          }}
                          placeholder="0,00"
                          className="bg-white h-8"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-5 text-red-600 hover:text-red-700 h-8 w-8"
                        onClick={() => {
                          const newFaixas = [...(editingMethod.faixasValorPedido || [])];
                          newFaixas.splice(idx, 1);
                          setEditingMethod({ ...editingMethod, faixasValorPedido: newFaixas });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold mt-2"
                    onClick={() => {
                      setEditingMethod({
                        ...editingMethod,
                        faixasValorPedido: [...(editingMethod.faixasValorPedido || []), { valorMin: 0, taxa: 0 }]
                      });
                    }}
                  >
                    + Adicionar Faixa de Valor
                  </Button>
                </div>
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMethodModalOpen(false)}>Cancelar</Button>
              <Button onClick={() => handleSaveMethod(editingMethod)} className="bg-emerald-600 hover:bg-emerald-700">Salvar Método</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}


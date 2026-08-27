import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdmin, Pharmacy, CustomDeliveryMethod } from "@/stores/admin";
import { useState, useEffect } from "react";
import { Truck, MapPin, Package, Plus, Trash2, Edit2, Save, Clock, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// @ts-ignore
export const Route = createFileRoute("/admin/minha-logistica")({
  component: MinhaLogistica,
});

function MinhaLogistica() {
  const { pharmacies, activeStoreId, updatePharmacy } = useAdmin();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<Pharmacy>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Custom Method Modal
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<CustomDeliveryMethod | null>(null);

  const pharmacy = pharmacies.find((p) => p.id === activeStoreId);

  useEffect(() => {
    if (!activeStoreId) {
      navigate({ to: "/admin/dashboard" as any });
      return;
    }
    if (pharmacy) {
      setFormData(pharmacy);
    }
  }, [pharmacy, activeStoreId, navigate]);

  const handleSave = async () => {
    if (!pharmacy?.id) return;
    setIsSaving(true);
    try {
      await updatePharmacy(pharmacy.id, { ...pharmacy, ...formData } as Pharmacy);
      toast.success("Configurações de logística salvas com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

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

  if (!pharmacy) return null;

  const DAYS_OF_WEEK = [
    { id: 0, label: "Dom" },
    { id: 1, label: "Seg" },
    { id: 2, label: "Ter" },
    { id: 3, label: "Qua" },
    { id: 4, label: "Qui" },
    { id: 5, label: "Sex" },
    { id: 6, label: "Sáb" },
  ];

  const handleDayToggle = (dayId: number) => {
    const currentDays = formData.diasFuncionamento || [1,2,3,4,5,6];
    const newDays = currentDays.includes(dayId)
      ? currentDays.filter((d) => d !== dayId)
      : [...currentDays, dayId];
    setFormData({ ...formData, diasFuncionamento: newDays.sort() });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Minha Logística
          </h1>
          <p className="text-slate-500 mt-1">
            Configure suas regras de entrega e retirada na loja.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>



      <Tabs defaultValue="entrega" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mb-8">
          <TabsTrigger value="entrega" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Meios de Entrega
          </TabsTrigger>
          <TabsTrigger value="retirada" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Retirada na Loja
          </TabsTrigger>
          <TabsTrigger value="horarios" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Horários e dias de operação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entrega" className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
            <div className="space-y-1">
              <Label className="text-base font-bold text-slate-800">Habilitar Entregas</Label>
              <p className="text-sm text-slate-500">Permitir que os clientes recebam pedidos em casa.</p>
            </div>
            <Switch
              checked={!!formData.aceitaEntrega}
              onCheckedChange={(c) => setFormData({ ...formData, aceitaEntrega: c })}
            />
          </div>

          {formData.aceitaEntrega && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <Label className="font-bold">Horário de Início (Entrega Padrão)</Label>
                  <Input
                    type="time"
                    className="bg-white"
                    value={formData.horarioInicioEntrega || ""}
                    onChange={(e) => setFormData({ ...formData, horarioInicioEntrega: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Horário de Fim (Entrega Padrão)</Label>
                  <Input
                    type="time"
                    className="bg-white"
                    value={formData.horarioFimEntrega || ""}
                    onChange={(e) => setFormData({ ...formData, horarioFimEntrega: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="font-bold">Tempo Estimado de Entrega (Minutos)</Label>
                  <Input
                    type="number"
                    min="1"
                    className="bg-white"
                    placeholder="Ex: 60"
                    value={formData.tempoEntrega || ""}
                    onChange={(e) => setFormData({ ...formData, tempoEntrega: e.target.value })}
                  />
                  <p className="text-xs text-slate-500">
                    Na loja aparecerá como: {formData.tempoEntrega && !isNaN(Number(formData.tempoEntrega)) ? (
                      Number(formData.tempoEntrega) < 60 
                        ? `${formData.tempoEntrega} minutos` 
                        : (Number(formData.tempoEntrega) % 60 === 0)
                          ? `${Math.floor(Number(formData.tempoEntrega) / 60)} hora${Math.floor(Number(formData.tempoEntrega) / 60) > 1 ? 's' : ''}`
                          : `${Math.floor(Number(formData.tempoEntrega) / 60)} hora${Math.floor(Number(formData.tempoEntrega) / 60) > 1 ? 's' : ''} e ${Number(formData.tempoEntrega) % 60} minutos`
                    ) : (formData.tempoEntrega || "Ex: 60")}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-6 mt-6 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-800">Meios de Entrega Personalizados (Opcional)</h3>
                <Button onClick={() => {
                  setEditingMethod({
                    id: Date.now().toString(),
                    nome: "",
                    ativo: true,
                    tempoEntrega: "",
                    raios: []
                  });
                  setMethodModalOpen(true);
                }} variant="outline" className="font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Meio de Entrega
                </Button>
              </div>

              {(!formData.meiosEntregaPersonalizados || formData.meiosEntregaPersonalizados.length === 0) ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg text-slate-500 bg-slate-50">
                  Nenhum meio de entrega cadastrado.<br/>Clique em "Novo Meio de Entrega" para adicionar.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.meiosEntregaPersonalizados.map(method => (
                    <div key={method.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1 h-full ${method.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <div className="flex justify-between items-start pl-2">
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg">{method.nome}</h4>
                          <p className="text-sm text-slate-500">{method.tempoEntrega}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditingMethod(method);
                            setMethodModalOpen(true);
                          }}>
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteMethod(method.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
            </>
          )}


        </TabsContent>

        <TabsContent value="retirada" className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
            <div className="space-y-1">
              <Label className="text-base font-bold text-slate-800">Habilitar Retirada</Label>
              <p className="text-sm text-slate-500">Permitir que clientes comprem no site e retirem presencialmente.</p>
            </div>
            <Switch
              checked={!!formData.aceitaRetirada}
              onCheckedChange={(c) => setFormData({ ...formData, aceitaRetirada: c })}
            />
          </div>

          {formData.aceitaRetirada && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <Label className="font-bold">Horário de Início (Retirada)</Label>
                <Input
                  type="time"
                  className="bg-white"
                  value={formData.horarioInicioRetirada || ""}
                  onChange={(e) => setFormData({ ...formData, horarioInicioRetirada: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Horário de Fim (Retirada)</Label>
                <Input
                  type="time"
                  className="bg-white"
                  value={formData.horarioFimRetirada || ""}
                  onChange={(e) => setFormData({ ...formData, horarioFimRetirada: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="font-bold">Tempo Médio de Preparo</Label>
                <Input
                  className="bg-white"
                  placeholder="Ex: 30 minutos, 1 hora..."
                  value={formData.tempoRetirada || ""}
                  onChange={(e) => setFormData({ ...formData, tempoRetirada: e.target.value })}
                />
                <p className="text-xs text-slate-500">Isso será informado ao cliente ao selecionar a opção de retirada.</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="horarios" className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-lg font-bold text-slate-800">Horários e dias de operação</Label>
                <p className="text-sm text-slate-500">Defina os horários de operação padrão para cada dia da semana. Marque como "Fechado" os dias que a loja não abre.</p>
              </div>
              <div className="border rounded-md divide-y overflow-hidden max-w-2xl">
                {['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'].map((nomeDia, idx) => {
                  const currentConfig = formData.horariosPorDia?.find(h => h.dia === idx) || { dia: idx, abre: '08:00', fecha: '18:00', fechado: false };
                  return (
                    <div key={idx} className="flex flex-wrap items-center justify-between p-4 bg-slate-50 gap-2">
                      <div className="w-32 font-medium text-sm text-slate-700">{nomeDia}</div>
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
                              className="w-28 h-10 text-sm" 
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
                              className="w-28 h-10 text-sm" 
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
                           <div className="flex items-center w-[260px]"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t">
              <div className="space-y-1">
                <Label className="text-lg font-bold text-slate-800">Datas Especiais / Feriados</Label>
                <p className="text-sm text-slate-500">Adicione exceções ao horário padrão, como feriados e emendas.</p>
              </div>
              <div className="space-y-3 max-w-3xl">
                {(formData.datasEspeciais || []).map((dataEsp, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-3 p-4 bg-white border rounded shadow-sm">
                    <Input 
                      type="date" 
                      className="w-auto h-10 text-sm" 
                      value={dataEsp.data}
                      onChange={(e) => {
                        const newDE = [...(formData.datasEspeciais || [])];
                        newDE[idx].data = e.target.value;
                        setFormData({ ...formData, datasEspeciais: newDE });
                      }}
                    />
                    <Input 
                      placeholder="Descrição (ex: Natal)" 
                      className="w-48 h-10 text-sm" 
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
                          className="w-24 h-10 text-sm" 
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
                          className="w-24 h-10 text-sm" 
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
                      className="h-10 w-10 ml-auto text-red-500 hover:text-red-700 hover:bg-red-50" 
                      onClick={() => {
                        const newDE = [...(formData.datasEspeciais || [])];
                        newDE.splice(idx, 1);
                        setFormData({ ...formData, datasEspeciais: newDE });
                      }}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full text-sm font-bold h-10 border-dashed"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      datasEspeciais: [...(formData.datasEspeciais || []), { data: '', descricao: '', fechado: true, abre: '08:00', fecha: '18:00' }]
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Data Especial
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal for Editing a Delivery Method */}
      {editingMethod && (
        <Dialog open={methodModalOpen} onOpenChange={setMethodModalOpen}>
          <DialogContent className="max-w-xl">
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
                  <Label className="font-bold">Tempo de Entrega Prometido (Minutos)</Label>
                  <Input 
                    type="number"
                    min="1"
                    placeholder="Ex: 60" 
                    value={editingMethod.tempoEntrega} 
                    onChange={e => setEditingMethod({...editingMethod, tempoEntrega: e.target.value})} 
                  />
                  <p className="text-xs text-slate-500">
                    Na loja aparecerá como: {editingMethod.tempoEntrega && !isNaN(Number(editingMethod.tempoEntrega)) ? (
                      Number(editingMethod.tempoEntrega) < 60 
                        ? `${editingMethod.tempoEntrega} minutos` 
                        : (Number(editingMethod.tempoEntrega) % 60 === 0)
                          ? `${Math.floor(Number(editingMethod.tempoEntrega) / 60)} hora${Math.floor(Number(editingMethod.tempoEntrega) / 60) > 1 ? 's' : ''}`
                          : `${Math.floor(Number(editingMethod.tempoEntrega) / 60)} hora${Math.floor(Number(editingMethod.tempoEntrega) / 60) > 1 ? 's' : ''} e ${Number(editingMethod.tempoEntrega) % 60} minutos`
                    ) : (editingMethod.tempoEntrega || "Ex: 60")}
                  </p>
                </div>
              </div>
                
                <div className="space-y-4 pt-4 mt-6 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg text-slate-800">Faixas de Entrega por Raio (Km)</h3>
                      <p className="text-sm text-slate-500">Configure os valores de frete cobrados baseados na distância em linha reta da loja até o cliente.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                    {(editingMethod.raios || []).map((raio, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded border">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-sm font-medium">Até</span>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={raio.ateKm || ""}
                            onChange={(e) => {
                              const newRaios = [...(editingMethod.raios || [])];
                              newRaios[idx].ateKm = parseFloat(e.target.value) || 0;
                              setEditingMethod({ ...editingMethod, raios: newRaios });
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
                              const newRaios = [...(editingMethod.raios || [])];
                              newRaios[idx].preco = parseFloat(e.target.value) || 0;
                              setEditingMethod({ ...editingMethod, raios: newRaios });
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
                      <h3 className="font-bold text-lg text-slate-800">Faixas de Entrega por Valor do Pedido</h3>
                      <p className="text-sm text-slate-500">Se configurado, terá prioridade sobre as regras de distância para este método.</p>
                    </div>
                  </div>
                
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                    {(editingMethod.faixasValorPedido || []).map((faixa, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded border">
                        <div className="flex-1 flex flex-col gap-1">
                          <span className="text-xs font-medium text-slate-500">Valor Mínimo (R$)</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={faixa.valorMin ?? ""}
                            onChange={(e) => {
                              const newFaixas = [...(editingMethod.faixasValorPedido || [])];
                              newFaixas[idx].valorMin = parseFloat(e.target.value) || 0;
                              setEditingMethod({ ...editingMethod, faixasValorPedido: newFaixas });
                            }}
                            placeholder="0,00"
                            className="bg-white"
                          />
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                          <span className="text-xs font-medium text-slate-500">Custo do Frete (R$)</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={faixa.taxa ?? ""}
                            onChange={(e) => {
                              const newFaixas = [...(editingMethod.faixasValorPedido || [])];
                              newFaixas[idx].taxa = parseFloat(e.target.value) || 0;
                              setEditingMethod({ ...editingMethod, faixasValorPedido: newFaixas });
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
                      className="w-full text-sm font-bold mt-2"
                      onClick={() => {
                        setEditingMethod({
                          ...editingMethod,
                          faixasValorPedido: [...(editingMethod.faixasValorPedido || []), { valorMin: 0, taxa: 0 }]
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Faixa de Valor
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
    </div>
  );
}


import { createFileRoute } from "@tanstack/react-router";
import { useAdmin, Pharmacy, CustomDeliveryMethod } from "@/stores/admin";
import { useState, useEffect } from "react";
import { Truck, Package, Plus, Trash2, Edit2, Save, Clock, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StoreSelector } from "@/components/admin/StoreSelector";

// @ts-ignore
export const Route = createFileRoute("/admin/minha-logistica")({
  component: MinhaLogistica,
});

const DEFAULT_DAYS = [
  { dia: 0, nome: "Domingo" },
  { dia: 1, nome: "Segunda-feira" },
  { dia: 2, nome: "Terça-feira" },
  { dia: 3, nome: "Quarta-feira" },
  { dia: 4, nome: "Quinta-feira" },
  { dia: 5, nome: "Sexta-feira" },
  { dia: 6, nome: "Sábado" },
];

function MinhaLogistica() {
  const { pharmacies, activeStoreId, setActiveStoreId, currentUser, updatePharmacy } = useAdmin();
  const [formData, setFormData] = useState<Partial<Pharmacy>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Custom Method Modal
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<CustomDeliveryMethod | null>(null);

  // Fallback to linked store or first pharmacy if activeStoreId is not set
  const effectiveStoreId = activeStoreId || currentUser?.lojasVinculadas?.[0] || pharmacies[0]?.id;
  const pharmacy = pharmacies.find((p) => p.id === effectiveStoreId);

  useEffect(() => {
    if (!activeStoreId && effectiveStoreId) {
      setActiveStoreId(effectiveStoreId);
    }
  }, [activeStoreId, effectiveStoreId, setActiveStoreId]);

  useEffect(() => {
    if (pharmacy) {
      // Deep clone to isolate local form modifications
      const cloned = JSON.parse(JSON.stringify(pharmacy));
      // Ensure all 7 days exist
      const existingH = Array.isArray(cloned.horariosPorDia) ? cloned.horariosPorDia : [];
      cloned.horariosPorDia = [0, 1, 2, 3, 4, 5, 6].map((dia) => {
        const found = existingH.find((h: any) => h && Number(h.dia) === dia);
        if (found) {
          return {
            dia,
            abre: found.abre || "08:00",
            fecha: found.fecha || "18:00",
            fechado: Boolean(found.fechado),
          };
        }
        return {
          dia,
          abre: "08:00",
          fecha: "18:00",
          fechado: dia === 0,
        };
      });
      if (!Array.isArray(cloned.datasEspeciais)) {
        cloned.datasEspeciais = [];
      }
      if (!Array.isArray(cloned.meiosEntregaPersonalizados)) {
        cloned.meiosEntregaPersonalizados = [];
      }
      setFormData(cloned);
    }
  }, [pharmacy?.id]);

  const handleSave = async () => {
    if (!pharmacy?.id) return;
    setIsSaving(true);
    try {
      await updatePharmacy(pharmacy.id, {
        ...pharmacy,
        ...formData,
        aceitaEntrega: Boolean(formData.aceitaEntrega),
        aceitaRetirada: Boolean(formData.aceitaRetirada),
        horarioInicioEntrega: formData.horarioInicioEntrega || "",
        horarioFimEntrega: formData.horarioFimEntrega || "",
        tempoEntrega: formData.tempoEntrega !== undefined ? String(formData.tempoEntrega) : "",
        horarioInicioRetirada: formData.horarioInicioRetirada || "",
        horarioFimRetirada: formData.horarioFimRetirada || "",
        tempoRetirada: formData.tempoRetirada !== undefined ? String(formData.tempoRetirada) : "",
        horariosPorDia: formData.horariosPorDia || [],
        datasEspeciais: formData.datasEspeciais || [],
        meiosEntregaPersonalizados: formData.meiosEntregaPersonalizados || [],
      } as Pharmacy);
      toast.success("Configurações de logística salvas com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar logística:", err);
      toast.error(`Erro ao salvar configurações: ${err?.message || "Verifique os dados informados."}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenNewMethod = () => {
    setEditingMethod({
      id: Date.now().toString(),
      nome: "",
      ativo: true,
      tempoEntrega: "",
      raios: [],
      faixasValorPedido: [],
    });
    setMethodModalOpen(true);
  };

  const handleSaveMethod = (method: CustomDeliveryMethod) => {
    const cleanedMethod: CustomDeliveryMethod = {
      ...method,
      raios: (method.raios || []).map((r) => ({
        ateKm: Number(r.ateKm) || 0,
        preco: Number(r.preco) || 0,
      })),
      faixasValorPedido: (method.faixasValorPedido || []).map((f) => ({
        valorMin: Number(f.valorMin) || 0,
        taxa: Number(f.taxa) || 0,
      })),
    };

    const currentMethods = formData.meiosEntregaPersonalizados || [];
    let newMethods: CustomDeliveryMethod[];
    if (currentMethods.some((m) => m.id === cleanedMethod.id)) {
      newMethods = currentMethods.map((m) => (m.id === cleanedMethod.id ? cleanedMethod : m));
    } else {
      newMethods = [...currentMethods, cleanedMethod];
    }
    setFormData((prev) => ({ ...prev, meiosEntregaPersonalizados: newMethods }));
    setMethodModalOpen(false);
    setEditingMethod(null);
  };

  const handleDeleteMethod = (id: string) => {
    const currentMethods = formData.meiosEntregaPersonalizados || [];
    setFormData((prev) => ({
      ...prev,
      meiosEntregaPersonalizados: currentMethods.filter((m) => m.id !== id),
    }));
  };

  if (!pharmacy) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
          <h2 className="text-xl font-bold text-amber-900">Nenhuma farmácia selecionada</h2>
          <p className="text-sm text-amber-700">
            Selecione uma farmácia para gerenciar as configurações de logística.
          </p>
          <div className="flex justify-center">
            <StoreSelector />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Minha Logística
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {pharmacy.nome || pharmacy.razaoSocial}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Configure entrega própria, retirada no balcão, horários de funcionamento e feriados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <StoreSelector />
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md h-10 px-5"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="entrega" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mb-8 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="entrega" className="flex items-center gap-2 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
            <Truck className="w-4 h-4" />
            Entrega
          </TabsTrigger>
          <TabsTrigger value="retirada" className="flex items-center gap-2 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
            <Package className="w-4 h-4" />
            Retirada na Loja
          </TabsTrigger>
          <TabsTrigger value="horarios" className="flex items-center gap-2 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
            <Clock className="w-4 h-4" />
            Horários e Feriados
          </TabsTrigger>
        </TabsList>

        {/* TAB: ENTREGA */}
        <TabsContent value="entrega" className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
            <div className="space-y-1">
              <Label className="text-base font-bold text-slate-800">Habilitar Entrega</Label>
              <p className="text-sm text-slate-500">Permitir que os clientes solicitem entrega em seus endereços.</p>
            </div>
            <Switch
              checked={!!formData.aceitaEntrega}
              onCheckedChange={(c) => setFormData((prev) => ({ ...prev, aceitaEntrega: c }))}
            />
          </div>

          {formData.aceitaEntrega && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Horário de Início da Entrega</Label>
                  <Input
                    type="time"
                    className="bg-white h-11"
                    value={formData.horarioInicioEntrega || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, horarioInicioEntrega: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Horário de Término da Entrega</Label>
                  <Input
                    type="time"
                    className="bg-white h-11"
                    value={formData.horarioFimEntrega || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, horarioFimEntrega: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="font-bold text-slate-700">Tempo Estimado de Entrega Padrão (Minutos)</Label>
                  <Input
                    type="number"
                    min="1"
                    className="bg-white h-11"
                    placeholder="Ex: 60"
                    value={formData.tempoEntrega || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tempoEntrega: e.target.value }))}
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

              <div className="space-y-4 pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">Meios de Entrega Personalizados</h3>
                    <p className="text-xs text-slate-500">Crie opções como Motoboy Próprio, Uber Flash, Correios com faixas de preço por km ou valor do pedido.</p>
                  </div>
                  <Button
                    onClick={handleOpenNewMethod}
                    variant="outline"
                    className="font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Meio de Entrega
                  </Button>
                </div>

                {(!formData.meiosEntregaPersonalizados || formData.meiosEntregaPersonalizados.length === 0) ? (
                  <div className="text-center py-10 border-2 border-dashed rounded-xl text-slate-500 bg-slate-50 text-sm">
                    Nenhum meio de entrega customizado cadastrado.<br />
                    Clique no botão acima para adicionar um novo meio.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.meiosEntregaPersonalizados.map((method) => (
                      <div
                        key={method.id}
                        className="border rounded-xl p-4 bg-white shadow-sm hover:shadow relative overflow-hidden transition-all"
                      >
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${method.ativo ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <div className="flex justify-between items-start pl-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-800 text-base">{method.nome || "Sem nome"}</h4>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${method.ativo ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                                {method.ativo ? "Ativo" : "Inativo"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {method.tempoEntrega ? `${method.tempoEntrega} min de entrega` : "Tempo não informado"}
                            </p>
                            <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                              {method.raios && method.raios.length > 0 && (
                                <p>• {method.raios.length} faixa(s) por Km</p>
                              )}
                              {method.faixasValorPedido && method.faixasValorPedido.length > 0 && (
                                <p>• {method.faixasValorPedido.length} faixa(s) por Valor do Pedido</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-600 hover:text-slate-900"
                              onClick={() => {
                                setEditingMethod(JSON.parse(JSON.stringify(method)));
                                setMethodModalOpen(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteMethod(method.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB: RETIRADA */}
        <TabsContent value="retirada" className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
            <div className="space-y-1">
              <Label className="text-base font-bold text-slate-800">Habilitar Retirada na Loja</Label>
              <p className="text-sm text-slate-500">Permitir que clientes comprem online e retirem pessoalmente no balcão.</p>
            </div>
            <Switch
              checked={!!formData.aceitaRetirada}
              onCheckedChange={(c) => setFormData((prev) => ({ ...prev, aceitaRetirada: c }))}
            />
          </div>

          {formData.aceitaRetirada && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Horário de Início (Retirada)</Label>
                <Input
                  type="time"
                  className="bg-white h-11"
                  value={formData.horarioInicioRetirada || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, horarioInicioRetirada: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Horário de Fim (Retirada)</Label>
                <Input
                  type="time"
                  className="bg-white h-11"
                  value={formData.horarioFimRetirada || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, horarioFimRetirada: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="font-bold text-slate-700">Tempo Médio de Preparo / Disponibilidade</Label>
                <Input
                  className="bg-white h-11"
                  placeholder="Ex: 30 minutos, 1 hora..."
                  value={formData.tempoRetirada || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tempoRetirada: e.target.value }))}
                />
                <p className="text-xs text-slate-500">Este tempo será informado ao cliente antes da finalização da compra.</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB: HORÁRIOS */}
        <TabsContent value="horarios" className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-lg font-bold text-slate-800">Horários de Operação por Dia</Label>
              <p className="text-sm text-slate-500">Defina os horários padrão de funcionamento da loja para cada dia da semana.</p>
            </div>
            <div className="border rounded-xl divide-y overflow-hidden max-w-2xl bg-white shadow-sm">
              {DEFAULT_DAYS.map(({ dia, nome }) => {
                const currentConfig = (formData.horariosPorDia || []).find((h) => Number(h.dia) === dia) || {
                  dia,
                  abre: "08:00",
                  fecha: "18:00",
                  fechado: dia === 0,
                };
                return (
                  <div key={dia} className="flex flex-wrap items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 gap-2">
                    <div className="w-36 font-bold text-sm text-slate-700">{nome}</div>
                    <div className="flex items-center gap-4 flex-1 justify-end">
                      <Label className="text-sm flex items-center gap-2 cursor-pointer font-medium text-slate-600 select-none">
                        <Checkbox
                          checked={currentConfig.fechado}
                          onCheckedChange={(c) => {
                            const newH = (formData.horariosPorDia || []).map((h) =>
                              Number(h.dia) === dia ? { ...h, fechado: !!c } : h
                            );
                            setFormData((prev) => ({ ...prev, horariosPorDia: newH }));
                          }}
                        />
                        Fechado
                      </Label>
                      {!currentConfig.fechado ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            className="w-28 h-9 text-sm bg-white"
                            value={currentConfig.abre}
                            onChange={(e) => {
                              const newH = (formData.horariosPorDia || []).map((h) =>
                                Number(h.dia) === dia ? { ...h, abre: e.target.value } : h
                              );
                              setFormData((prev) => ({ ...prev, horariosPorDia: newH }));
                            }}
                          />
                          <span className="text-sm text-slate-400">às</span>
                          <Input
                            type="time"
                            className="w-28 h-9 text-sm bg-white"
                            value={currentConfig.fecha}
                            onChange={(e) => {
                              const newH = (formData.horariosPorDia || []).map((h) =>
                                Number(h.dia) === dia ? { ...h, fecha: e.target.value } : h
                              );
                              setFormData((prev) => ({ ...prev, horariosPorDia: newH }));
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-[236px] text-xs text-slate-400 text-right pr-2">Não há atendimento</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-200">
            <div className="space-y-1">
              <Label className="text-lg font-bold text-slate-800">Datas Especiais / Feriados</Label>
              <p className="text-sm text-slate-500">Adicione exceções ao horário padrão, como feriados nacionais ou emendas locais.</p>
            </div>
            <div className="space-y-3 max-w-3xl">
              {(formData.datasEspeciais || []).map((dataEsp, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-3 p-3.5 bg-white border rounded-xl shadow-sm">
                  <Input
                    type="date"
                    className="w-auto h-10 text-sm"
                    value={dataEsp.data}
                    onChange={(e) => {
                      const newDE = (formData.datasEspeciais || []).map((de, i) =>
                        i === idx ? { ...de, data: e.target.value } : de
                      );
                      setFormData((prev) => ({ ...prev, datasEspeciais: newDE }));
                    }}
                  />
                  <Input
                    placeholder="Descrição (ex: Natal, Carnaval)"
                    className="w-48 h-10 text-sm"
                    value={dataEsp.descricao || ""}
                    onChange={(e) => {
                      const newDE = (formData.datasEspeciais || []).map((de, i) =>
                        i === idx ? { ...de, descricao: e.target.value } : de
                      );
                      setFormData((prev) => ({ ...prev, datasEspeciais: newDE }));
                    }}
                  />
                  <Label className="text-sm flex items-center gap-2 cursor-pointer font-medium text-slate-600 select-none">
                    <Checkbox
                      checked={dataEsp.fechado}
                      onCheckedChange={(c) => {
                        const newDE = (formData.datasEspeciais || []).map((de, i) =>
                          i === idx ? { ...de, fechado: !!c } : de
                        );
                        setFormData((prev) => ({ ...prev, datasEspeciais: newDE }));
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
                          const newDE = (formData.datasEspeciais || []).map((de, i) =>
                            i === idx ? { ...de, abre: e.target.value } : de
                          );
                          setFormData((prev) => ({ ...prev, datasEspeciais: newDE }));
                        }}
                      />
                      <span className="text-sm text-slate-400">às</span>
                      <Input
                        type="time"
                        className="w-24 h-10 text-sm"
                        value={dataEsp.fecha}
                        onChange={(e) => {
                          const newDE = (formData.datasEspeciais || []).map((de, i) =>
                            i === idx ? { ...de, fecha: e.target.value } : de
                          );
                          setFormData((prev) => ({ ...prev, datasEspeciais: newDE }));
                        }}
                      />
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 ml-auto text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      const newDE = (formData.datasEspeciais || []).filter((_, i) => i !== idx);
                      setFormData((prev) => ({ ...prev, datasEspeciais: newDE }));
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full text-sm font-bold h-11 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    datasEspeciais: [
                      ...(prev.datasEspeciais || []),
                      { data: "", descricao: "", fechado: true, abre: "08:00", fecha: "18:00" },
                    ],
                  }));
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Adicionar Data Especial / Feriado
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal for Editing a Delivery Method */}
      {editingMethod && (
        <Dialog open={methodModalOpen} onOpenChange={setMethodModalOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Configurar Meio de Entrega</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-3">
              <div className="flex items-center justify-between p-3.5 border rounded-xl bg-slate-50">
                <div>
                  <Label className="font-bold text-slate-800">Método Ativo</Label>
                  <p className="text-xs text-slate-500">Disponibilizar este método no checkout</p>
                </div>
                <Switch
                  checked={editingMethod.ativo}
                  onCheckedChange={(c) => setEditingMethod({ ...editingMethod, ativo: c })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Nome do Meio</Label>
                  <Input
                    placeholder="Ex: Motoboy Próprio, Uber Flash"
                    value={editingMethod.nome}
                    onChange={(e) => setEditingMethod({ ...editingMethod, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Tempo de Entrega (Minutos)</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Ex: 45"
                    value={editingMethod.tempoEntrega}
                    onChange={(e) => setEditingMethod({ ...editingMethod, tempoEntrega: e.target.value })}
                  />
                  <p className="text-xs text-slate-500">
                    Aparecerá como: {editingMethod.tempoEntrega && !isNaN(Number(editingMethod.tempoEntrega)) ? (
                      Number(editingMethod.tempoEntrega) < 60 
                        ? `${editingMethod.tempoEntrega} minutos` 
                        : (Number(editingMethod.tempoEntrega) % 60 === 0)
                          ? `${Math.floor(Number(editingMethod.tempoEntrega) / 60)} hora${Math.floor(Number(editingMethod.tempoEntrega) / 60) > 1 ? 's' : ''}`
                          : `${Math.floor(Number(editingMethod.tempoEntrega) / 60)} hora${Math.floor(Number(editingMethod.tempoEntrega) / 60) > 1 ? 's' : ''} e ${Number(editingMethod.tempoEntrega) % 60} minutos`
                    ) : (editingMethod.tempoEntrega || "Ex: 45")}
                  </p>
                </div>
              </div>

              {/* Faixas por Raio (Km) */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-base text-slate-800">Faixas de Frete por Distância (Km)</h3>
                    <p className="text-xs text-slate-500">Valor cobrado pela distância em linha reta da loja até o cliente.</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {(editingMethod.raios || []).map((raio, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-semibold text-slate-600">Até</span>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={raio.ateKm === undefined || raio.ateKm === null ? "" : raio.ateKm}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newRaios = (editingMethod.raios || []).map((r, i) =>
                              i === idx ? { ...r, ateKm: val === "" ? ("" as any) : Number(val) } : r
                            );
                            setEditingMethod({ ...editingMethod, raios: newRaios });
                          }}
                          className="w-24 h-9 bg-white"
                          placeholder="Ex: 5"
                        />
                        <span className="text-xs font-semibold text-slate-600">Km</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-semibold text-slate-600">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={raio.preco === undefined || raio.preco === null ? "" : raio.preco}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newRaios = (editingMethod.raios || []).map((r, i) =>
                              i === idx ? { ...r, preco: val === "" ? ("" as any) : Number(val) } : r
                            );
                            setEditingMethod({ ...editingMethod, raios: newRaios });
                          }}
                          className="w-28 h-9 bg-white"
                          placeholder="0,00"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          const newRaios = (editingMethod.raios || []).filter((_, i) => i !== idx);
                          setEditingMethod({ ...editingMethod, raios: newRaios });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold border-dashed mt-1"
                    onClick={() => {
                      setEditingMethod({
                        ...editingMethod,
                        raios: [...(editingMethod.raios || []), { ateKm: 5, preco: 10 }],
                      });
                    }}
                  >
                    + Adicionar Faixa de Raio
                  </Button>
                </div>
              </div>

              {/* Faixas por Valor do Pedido */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-base text-slate-800">Faixas por Valor do Pedido (Opcional)</h3>
                    <p className="text-xs text-slate-500">Ex: Frete grátis para compras acima de R$ 150,00.</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {(editingMethod.faixasValorPedido || []).map((faixa, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-semibold text-slate-600">A partir de R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={faixa.valorMin === undefined || faixa.valorMin === null ? "" : faixa.valorMin}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newFaixas = (editingMethod.faixasValorPedido || []).map((f, i) =>
                              i === idx ? { ...f, valorMin: val === "" ? ("" as any) : Number(val) } : f
                            );
                            setEditingMethod({ ...editingMethod, faixasValorPedido: newFaixas });
                          }}
                          placeholder="0,00"
                          className="w-28 h-9 bg-white"
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-semibold text-slate-600">Frete R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={faixa.taxa === undefined || faixa.taxa === null ? "" : faixa.taxa}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newFaixas = (editingMethod.faixasValorPedido || []).map((f, i) =>
                              i === idx ? { ...f, taxa: val === "" ? ("" as any) : Number(val) } : f
                            );
                            setEditingMethod({ ...editingMethod, faixasValorPedido: newFaixas });
                          }}
                          placeholder="0,00"
                          className="w-28 h-9 bg-white"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          const newFaixas = (editingMethod.faixasValorPedido || []).filter((_, i) => i !== idx);
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
                    className="w-full text-xs font-bold border-dashed mt-1"
                    onClick={() => {
                      setEditingMethod({
                        ...editingMethod,
                        faixasValorPedido: [...(editingMethod.faixasValorPedido || []), { valorMin: 100, taxa: 0 }],
                      });
                    }}
                  >
                    + Adicionar Faixa de Valor
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setMethodModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => handleSaveMethod(editingMethod)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Salvar Método
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

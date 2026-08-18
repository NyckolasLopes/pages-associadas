import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdmin, Pharmacy, CustomDeliveryMethod } from "@/stores/admin";
import { useState, useEffect } from "react";
import { Truck, MapPin, Package, Plus, Trash2, Edit2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

      <Tabs defaultValue="entrega" className="mt-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-8">
          <TabsTrigger value="entrega" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Meios de Entrega
          </TabsTrigger>
          <TabsTrigger value="retirada" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Retirada na Loja
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
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">Meios de Entrega Cadastrados</h3>
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
                      <div className="mt-4 space-y-1 pl-2">
                        <div className="text-xs font-bold uppercase text-slate-400">Tabela de Raios e Preços</div>
                        {method.raios.length === 0 ? (
                          <div className="text-sm text-slate-500">Nenhum raio configurado.</div>
                        ) : (
                          method.raios.sort((a,b)=>a.ateKm - b.ateKm).map((r, i) => (
                            <div key={i} className="flex justify-between text-sm bg-slate-50 p-2 rounded border">
                              <span className="font-medium text-slate-700">Até {r.ateKm} Km</span>
                              <span className="font-bold text-emerald-700">
                                {r.preco === 0 ? 'Grátis' : r.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                  <Label className="font-bold">Tempo de Entrega Prometido</Label>
                  <Input 
                    placeholder="Ex: Até 60 min, Mesma hora..." 
                    value={editingMethod.tempoEntrega} 
                    onChange={e => setEditingMethod({...editingMethod, tempoEntrega: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <Label className="font-bold text-base">Raios de Distância (Tabela de Preços)</Label>
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingMethod({
                      ...editingMethod,
                      raios: [...editingMethod.raios, { ateKm: 0, preco: 0 }]
                    });
                  }}>
                    <Plus className="w-4 h-4 mr-1" /> Add Raio
                  </Button>
                </div>
                
                {editingMethod.raios.length === 0 ? (
                  <div className="text-sm text-slate-500 italic p-4 bg-slate-50 text-center rounded border">
                    Adicione faixas de distância para determinar o preço da entrega.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {editingMethod.raios.map((r, index) => (
                      <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs text-slate-500">Até a distância (Km)</Label>
                          <Input 
                            type="number" 
                            step="0.1"
                            value={r.ateKm || ""} 
                            onChange={(e) => {
                              const newRaios = [...editingMethod.raios];
                              newRaios[index].ateKm = parseFloat(e.target.value) || 0;
                              setEditingMethod({...editingMethod, raios: newRaios});
                            }} 
                            placeholder="Ex: 5" 
                            className="bg-white"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs text-slate-500">Preço (R$)</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={r.preco || ""} 
                            onChange={(e) => {
                              const newRaios = [...editingMethod.raios];
                              newRaios[index].preco = parseFloat(e.target.value) || 0;
                              setEditingMethod({...editingMethod, raios: newRaios});
                            }} 
                            placeholder="Ex: 10.00" 
                            className="bg-white"
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="mt-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            const newRaios = editingMethod.raios.filter((_, i) => i !== index);
                            setEditingMethod({...editingMethod, raios: newRaios});
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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

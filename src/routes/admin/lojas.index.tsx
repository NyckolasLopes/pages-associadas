import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdmin, Pharmacy } from "@/stores/admin";
import { useRegionsStore } from "@/stores/regions";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Pencil,
  Trash,
  Trash2,
  Store,
  Search,
  MapPin,
  Truck,
  ShoppingBag,
  Zap,
  Check,
  X,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export const Route = createFileRoute("/admin/lojas/")({
  component: LojasAdmin,
});

const UF_OPTIONS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const EMPTY_PHARMACY: Pharmacy = {
  id: "",
  ativo: true,
  cnpj: "",
  razaoSocial: "",
  nome: "",
  email: "",
  telefone: "",
  horarioFuncionamento: "Seg a Sex, 08:00 - 22:00",
  respTecnico: "Ana Carolina Rossi",
  inscricaoFarmaceutico: "CRF/SP 45678",
  alvara: "54321-2023",
  afe: "9.87654.3",
  cep: "01311-200",
  modeloFrete: "raio",
  custoEntrega: 0,
  uf: "SP",
  cidade: "",
  bairro: "",
  endereco: "",
  numero: "",
  complemento: "",
  aceitaEntrega: false,
  horarioInicioEntrega: "",
  horarioFimEntrega: "",
  horarioFimEntregaRisco: "",
  tempoEntrega: "",
  raiosEntrega: [] as { ateKm: number; preco: number }[],
  entregaExpressa: false,
  custoEntregaExpressa: "" as any,
  aceitaRetirada: false,
  horarioInicioRetirada: "",
  horarioFimRetirada: "",
  tempoRetirada: "",
  aceitaUber: false,
  custoUber: "" as any,
  aceita99: false,
  custo99: "" as any,
  aceitaMotoboy: false,
  custoMotoboy: "" as any,
  sistemaUtilizado: "",
  identificadorPagamento: "",
};

// ---- Section wrapper ----
function FormSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
        {icon}
        <h3 className="font-bold text-sm text-slate-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ---- Radio toggle Sim/Não ----
function RadioToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-bold text-slate-700">{label}</label>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={label}
            checked={value}
            onChange={() => onChange(true)}
            className="w-4 h-4 accent-emerald-600"
          />
          <span className="text-sm">Sim</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={label}
            checked={!value}
            onChange={() => onChange(false)}
            className="w-4 h-4 accent-emerald-600"
          />
          <span className="text-sm">Não</span>
        </label>
      </div>
    </div>
  );
}

// ---- Field label ----
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-bold text-slate-700">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function LojasAdmin() {
  const { pharmacies, addPharmacy, updatePharmacy, togglePharmacyStatus, removePharmacy } = useAdmin();
  const { regions } = useRegionsStore();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Pharmacy>({ ...EMPTY_PHARMACY });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [motivoOpen, setMotivoOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const navigate = useNavigate();

  const filteredPharmacies = pharmacies.filter(
    (p) =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.cidade?.toLowerCase().includes(search.toLowerCase()) ||
      p.cnpj?.includes(search)
  );

  const update = (patch: Partial<Pharmacy>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 8) val = val.substring(0, 8);
    
    let formatted = val;
    if (val.length > 5) {
      formatted = val.substring(0, 5) + "-" + val.substring(5);
    }
    
    update({ cep: formatted });
    
    if (val.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${val}/json/`);
        const data = await res.json();
        if (!data.erro) {
          update({
            cidade: data.localidade || "",
            uf: data.uf || "",
            bairro: data.bairro || "",
            endereco: data.logradouro || "",
          });
          toast.success("Endereço preenchido automaticamente pelo CEP!");
        }
      } catch (err) {
        // ignora erro silenciosamente
      }
    }
  };

  const handleEdit = (p: Pharmacy) => {
    setEditingId(p.id);
    // Fill missing fields from old data with defaults
    setForm({ ...EMPTY_PHARMACY, ...p });
    setModalOpen(true);
  };

  const handleAdd = () => {
    navigate({ to: "/admin/lojas/nova" });
  };

  const handleSave = () => {
    if (!form.nome || !form.cnpj) {
      toast.error("Preencha ao menos o Nome Fantasia e o CNPJ.");
      return;
    }

    const payload = { ...form, categoriaAssociado: form.categoriaAssociado || "Pleno" };

    if (editingId) {
      updatePharmacy(editingId, payload);
      toast.success("Loja atualizada com sucesso!");
    } else {
      addPharmacy(payload);
      toast.success("Loja adicionada com sucesso!");
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    setConfirmOpen(false);
    setMotivoOpen(true);
  };

  const finalizeDelete = () => {
    if (!motivo.trim()) {
      toast.error("O motivo é obrigatório.");
      return;
    }
    if (itemToDelete) {
      removePharmacy(itemToDelete);
      toast.success("Loja removida!");
      setMotivoOpen(false);
      setMotivo("");
      setItemToDelete(null);
    }
  };

  const enderecoCompleto = (p: Pharmacy) => {
    const parts = [p.endereco, p.numero, p.bairro, p.cidade, p.uf].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : p.endereco || "—";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" /> Lojas (Farmácias)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie as farmácias disponíveis para busca de CEP e Retirada.
          </p>
        </div>
        <Button onClick={handleAdd} className="font-bold">
          <Plus className="w-4 h-4 mr-2" /> Adicionar Loja
        </Button>
      </div>

      {/* List table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b bg-slate-50 rounded-t-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, cidade ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-slate-50/50 border-b">
              <tr>
                <th className="px-4 py-3 font-bold">Nome Fantasia</th>
                <th className="px-4 py-3 font-bold">Categoria</th>
                <th className="px-4 py-3 font-bold">Cidade/UF</th>
                <th className="px-4 py-3 font-bold">Telefone</th>
                <th className="px-4 py-3 font-bold text-center">Entrega</th>

                <th className="px-4 py-3 font-bold text-center">Retirada</th>
                <th className="px-4 py-3 font-bold text-center">Sistema</th>
                <th className="px-4 py-3 font-bold text-center">Status</th>
                <th className="px-4 py-3 text-right font-bold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPharmacies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Store className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-muted-foreground">Nenhuma loja cadastrada.</p>
                      <Button size="sm" onClick={handleAdd} className="font-bold">
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Adicionar Loja
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPharmacies.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                            {p.nome}
                          </div>
                        <div className="text-xs text-muted-foreground">{p.cnpj}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        p.categoriaAssociado === 'Parceiro'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.categoriaAssociado === 'Parceiro' ? 'Parceiro' : 'Pleno'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">
                      {p.cidade && p.uf ? `${p.cidade}/${p.uf}` : enderecoCompleto(p)}
                    </td>
                    <td className="px-4 py-3 text-sm">{p.telefone || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      {p.aceitaEntrega ? (
                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px]"><Check className="h-3 w-3 mr-1" />Sim</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]"><X className="h-3 w-3 mr-1" />Não</Badge>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {p.aceitaRetirada ? (
                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px]"><Check className="h-3 w-3 mr-1" />Sim</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]"><X className="h-3 w-3 mr-1" />Não</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[10px] font-black uppercase text-white whitespace-nowrap bg-orange-500 px-2 py-1 rounded-md shadow-sm">
                        {p.sistemaUtilizado || "SPA"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch 
                          checked={p.ativo ?? true} 
                          onCheckedChange={() => togglePharmacyStatus(p.id)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}>
                          <Pencil className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(p.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- MODAL DE CADASTRO ---- */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              {editingId ? "Editar Loja" : "Nova Loja"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-2 pr-1">
            {/* ========== DADOS DA LOJA ========== */}
        <FormSection icon={<Store className="h-4 w-4 text-primary" />} title="Dados da Loja">
          <div className="grid gap-4">

                <div className="bg-slate-50 border rounded-lg p-4 mb-4">
                  <RadioToggle
                    label="Loja Ativa no E-commerce?"
                    value={form.ativo ?? true}
                    onChange={(v) => update({ ativo: v })}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Lojas inativas não aparecerão na busca de CEP nem na listagem de retirada.
                  </p>
                </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldLabel required>CNPJ</FieldLabel>
                <Input
                  value={form.cnpj}
                  onChange={(e) => update({ cnpj: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel required>Razão Social</FieldLabel>
                <Input
                  value={form.razaoSocial}
                  onChange={(e) => update({ razaoSocial: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldLabel required>Categoria do Associado</FieldLabel>
                <Select value={form.categoriaAssociado || "Pleno"} onValueChange={(val) => update({ categoriaAssociado: val as any })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pleno">Pleno (Layout da Rede)</SelectItem>
                    <SelectItem value="Parceiro">Parceiro (Layout Neutro/OpenSource)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(form.categoriaAssociado === "Pleno" || !form.categoriaAssociado) && (
                <div className="space-y-1.5">
                  <FieldLabel required>Trabalha com encarte Associadas?</FieldLabel>
                  <Select value={form.trabalhaComEncarte !== false ? "sim" : "nao"} onValueChange={(val) => update({ trabalhaComEncarte: val === "sim" })}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <FieldLabel required>Sua loja oferece serviços de aplicação e testes?</FieldLabel>
                <Select value={form.offersServices ? "true" : "false"} onValueChange={(val) => update({ offersServices: val === "true" })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <FieldLabel required>Nome Fantasia</FieldLabel>
                <Input
                  value={form.nome}
                  onChange={(e) => update({ nome: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldLabel required>E-mail</FieldLabel>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update({ email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel required>Telefone</FieldLabel>
                <Input
                  value={form.telefone}
                  onChange={(e) => update({ telefone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel required>Horário de Funcionamento</FieldLabel>
              <Input
                value={form.horarioFuncionamento}
                onChange={(e) => update({ horarioFuncionamento: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldLabel required>Nome do Farmacêutico</FieldLabel>
                <Input
                  value={form.respTecnico}
                  onChange={(e) => update({ respTecnico: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel required>Inscrição do Farmacêutico</FieldLabel>
                <Input
                  value={form.inscricaoFarmaceutico}
                  onChange={(e) => update({ inscricaoFarmaceutico: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldLabel required>Alvará</FieldLabel>
                <Input
                  value={form.alvara}
                  onChange={(e) => update({ alvara: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel required>AFE</FieldLabel>
                <Input
                  value={form.afe}
                  onChange={(e) => update({ afe: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Sistema Utilizado</FieldLabel>
              <Input
                value={form.sistemaUtilizado || ""}
                onChange={(e) => update({ sistemaUtilizado: e.target.value })}
              />
            </div>
          </div>
        </FormSection>

        {/* ========== DADOS DE ENDEREÇO ========== */}
        <FormSection icon={<MapPin className="h-4 w-4 text-emerald-600" />} title="Dados de Endereço">
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <FieldLabel required>CEP</FieldLabel>
                <Input
                  value={form.cep}
                  onChange={handleCepChange}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel required>UF</FieldLabel>
                <Select value={form.uf} onValueChange={(v) => update({ uf: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {UF_OPTIONS.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <FieldLabel required>Cidade</FieldLabel>
                <Input
                  value={form.cidade}
                  onChange={(e) => update({ cidade: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <FieldLabel required>Bairro</FieldLabel>
                <Input
                  value={form.bairro}
                  onChange={(e) => update({ bairro: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel required>Endereço</FieldLabel>
                <Input
                  value={form.endereco}
                  onChange={(e) => update({ endereco: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel required>Número</FieldLabel>
                <Input
                  value={form.numero}
                  onChange={(e) => update({ numero: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Complemento</FieldLabel>
              <Input
                value={form.complemento}
                onChange={(e) => update({ complemento: e.target.value })}
              />
            </div>
          </div>
        </FormSection>


          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="font-bold">
              Salvar Loja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Tem certeza que deseja excluir o painel dessa loja?"
        description="Esta ação não poderá ser desfeita. Para prosseguir clique em sim."
        onConfirm={confirmDelete}
        confirmText="Sim"
        cancelText="Não"
      />

      <Dialog open={motivoOpen} onOpenChange={setMotivoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Motivo da Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Por que você está excluindo esta loja?</label>
              <Textarea 
                placeholder="Descreva o motivo aqui..." 
                value={motivo} 
                onChange={e => setMotivo(e.target.value)} 
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setMotivoOpen(false)}>Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={finalizeDelete}>Excluir Loja</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
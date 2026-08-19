import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdmin, Pharmacy } from "@/stores/admin";
import { useRegionsStore } from "@/stores/regions";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Store,
  MapPin,
  Truck,
  ShoppingBag,
  Zap,
  X,
  Plus,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/lojas/nova")({
  component: NovaLojaAdmin,
});

const UF_OPTIONS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const EMPTY_PHARMACY: Pharmacy = {
  id: "",
  categoriaAssociado: "Pleno",
  cnpj: "",
  razaoSocial: "",
  nome: "",
  email: "",
  telefone: "",
  horarioFuncionamento: "",
  respTecnico: "",
  inscricaoFarmaceutico: "",
  alvara: "",
  afe: "",
  cep: "",
  modeloFrete: "raio",
  custoEntrega: 0,
  uf: "",
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
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-slate-700 w-48">{label}</span>
      <div className="flex items-center bg-slate-100 rounded-md p-1">
        <button
          className={`px-3 py-1 text-xs font-bold rounded-sm transition-colors ${
            value ? "bg-white shadow-sm text-emerald-700" : "text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => onChange(true)}
        >
          Sim
        </button>
        <button
          className={`px-3 py-1 text-xs font-bold rounded-sm transition-colors ${
            !value ? "bg-white shadow-sm text-red-700" : "text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => onChange(false)}
        >
          Não
        </button>
      </div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-bold text-slate-700">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function NovaLojaAdmin() {
  const navigate = useNavigate();
  const { addPharmacy } = useAdmin();
  const { regions } = useRegionsStore();
  const [form, setForm] = useState<Pharmacy>({ ...EMPTY_PHARMACY, id: `p${Date.now()}` });

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.cnpj) {
      toast.error("Preencha ao menos o Nome Fantasia e o CNPJ.");
      return;
    }

    const generatedId = form.id || form.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
    
    try {
      await addPharmacy({ ...form, id: generatedId, categoriaAssociado: form.categoriaAssociado || "Pleno" });
      toast.success("Loja adicionada com sucesso!");
      navigate({ to: "/admin/lojas" });
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar loja.");
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" /> Nova Loja
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Cadastre as informações da nova farmácia.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ to: "/admin/lojas" })}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="font-bold">
            Salvar Loja
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-8">
        {/* ========== DADOS DA LOJA ========== */}
        <FormSection icon={<Store className="h-4 w-4 text-primary" />} title="Dados da Loja">
          <div className="grid gap-4">
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
                <Select value={form.categoriaAssociado?.toLowerCase() === "parceiro" ? "Parceiro" : "Pleno"} onValueChange={(val) => update({ categoriaAssociado: val as any })}>
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
              <div className="space-y-1.5">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldLabel>Sistema Utilizado</FieldLabel>
                <Input
                  value={form.sistemaUtilizado || ""}
                  onChange={(e) => update({ sistemaUtilizado: e.target.value })}
                />
              </div>
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
    </div>
  );
}

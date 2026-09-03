import { LojaFormFields } from "@/components/admin/LojaFormFields";
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
  apelido: "",
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


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.cnpj) {
      toast.error("Preencha ao menos o Nome Fantasia e o CNPJ.");
      return;
    }

    const generatedId = form.id && form.id.startsWith("p1") ? crypto.randomUUID() : (form.id || crypto.randomUUID());
    
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
        <LojaFormFields form={form} update={update} />
      </div>
    </div>
  );
}

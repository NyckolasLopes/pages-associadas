import { LojaFormFields } from "@/components/admin/LojaFormFields";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdmin, Pharmacy } from "@/stores/admin";
import { useRegionsStore } from "@/stores/regions";
import { useRegistrationTokens } from "@/stores/registrationTokens";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Store,
  MapPin,
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Zap,
  ShoppingBag,
  X
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/inscricao/$token")({
  component: InscricaoLojaPublic,
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
  vendeIfood: false,
};

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
          type="button"
          className={`px-3 py-1 text-xs font-bold rounded-sm transition-colors ${
            value ? "bg-white shadow-sm text-emerald-700" : "text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => onChange(true)}
        >
          Sim
        </button>
        <button
          type="button"
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

function InscricaoLojaPublic() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { addPharmacy } = useAdmin();
  const { registrationTokens, markRegistrationTokenUsed } = useRegistrationTokens();
  const { regions } = useRegionsStore();
  
  // Aguardar reidratação do store (skipHydration: true no admin store)
  const [storeReady, setStoreReady] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [form, setForm] = useState<Pharmacy>({ ...EMPTY_PHARMACY, id: `p${Date.now()}` });

  // Esperar a reidratação do store antes de validar o token
  useEffect(() => {
    const checkHydration = () => {
      const hasHydrated = (useRegistrationTokens as any).persist?.hasHydrated?.();
      if (hasHydrated) {
        setStoreReady(true);
      } else {
        // Tentar novamente em breve
        const timer = setTimeout(checkHydration, 100);
        return () => clearTimeout(timer);
      }
    };
    
    // Se o store já estiver reidratado (improvável mas possível), marca imediatamente
    // Caso contrário, inscreve no evento de reidratação
    if ((useRegistrationTokens as any).persist?.hasHydrated?.()) {
      setStoreReady(true);
    } else {
      const unsubFinishHydration = (useRegistrationTokens as any).persist?.onFinishHydration?.(() => {
        setStoreReady(true);
      });
      // fallback: timeout de 3s para não travar para sempre
      const fallbackTimer = setTimeout(() => setStoreReady(true), 3000);
      return () => {
        unsubFinishHydration?.();
        clearTimeout(fallbackTimer);
      };
    }
  }, []);

  useEffect(() => {
    if (!storeReady) return;
    // Validate token
    const foundToken = registrationTokens?.find(t => t.token === token);
    if (foundToken && !foundToken.used) {
      setIsValidToken(true);
    } else {
      setIsValidToken(false);
    }
    setIsValidating(false);
  }, [token, registrationTokens, storeReady]);

  const update = (patch: Partial<Pharmacy>) => setForm((prev) => ({ ...prev, ...patch }));


  const handleSave = async () => {
    if (!form.nome || !form.cnpj) {
      toast.error("Preencha ao menos o Nome Fantasia e o CNPJ.");
      return;
    }

    const generatedId = form.id && form.id.startsWith("p1") ? crypto.randomUUID() : (form.id || crypto.randomUUID());
    
    try {
      await addPharmacy({ ...form, id: generatedId });
      // Mark used and save
      markRegistrationTokenUsed(token);
      setIsSuccess(true);
      toast.success("Inscrição realizada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar loja.");
      console.error(err);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 animate-in fade-in duration-300">
        <img src="/icone-associadas.png" alt="Carregando..." className="w-12 h-12 animate-spin drop-shadow-sm" />
        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Validando link...</span>
      </div>
    );
  }

  if (!isValidToken && !isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Link Inválido ou Expirado</h1>
        <p className="text-slate-600 mt-2 max-w-md">Este link de inscrição de associado não existe ou já foi utilizado por outra loja. Solicite um novo link ao administrador.</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-6">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Cadastro Concluído!</h1>
        <p className="text-slate-600 mt-4 max-w-md text-lg">A sua farmácia <strong>{form.nome}</strong> foi cadastrada com sucesso na rede Associadas.</p>
        <p className="text-slate-500 mt-2">Em breve, nossa equipe entrará em contato para os próximos passos de integração.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <img src="/logo.png" alt="Farmácias Associadas" className="h-12 mx-auto mb-6 object-contain" />
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center justify-center gap-3">
            Inscrição de Loja Associada
          </h1>
          <p className="text-slate-600 mt-2 text-lg max-w-2xl mx-auto">
            Bem-vindo à maior rede associativa do Brasil. Preencha os dados abaixo para cadastrar a sua farmácia.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 sm:p-10 space-y-10">
          <LojaFormFields form={form} update={update} />
          <div className="pt-6 border-t flex justify-end">
            <Button size="lg" onClick={handleSave} className="font-bold w-full sm:w-auto h-12 px-8 bg-primary hover:bg-primary-dark">
              Concluir Cadastro da Loja
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

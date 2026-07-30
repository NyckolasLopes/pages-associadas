import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdmin, Pharmacy } from "@/stores/admin";
import { useRegionsStore } from "@/stores/regions";
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
  const { registrationTokens, addPharmacy, markRegistrationTokenUsed } = useAdmin();
  const { regions } = useRegionsStore();
  
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [form, setForm] = useState<Pharmacy>({ ...EMPTY_PHARMACY, id: `p${Date.now()}` });

  useEffect(() => {
    // Validate token
    const foundToken = registrationTokens?.find(t => t.token === token);
    if (foundToken && !foundToken.used) {
      setIsValidToken(true);
    } else {
      setIsValidToken(false);
    }
    setIsValidating(false);
  }, [token, registrationTokens]);

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

  const handleSave = () => {
    if (!form.nome || !form.cnpj) {
      toast.error("Preencha ao menos o Nome Fantasia e o CNPJ.");
      return;
    }

    // Mark used and save
    markRegistrationTokenUsed(token);
    addPharmacy(form);
    setIsSuccess(true);
    toast.success("Inscrição realizada com sucesso!");
  };

  if (isValidating) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Validando link...</div>;
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
          {/* ========== DADOS DA LOJA ========== */}
          <FormSection icon={<Store className="h-5 w-5 text-primary" />} title="Dados da Loja">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FieldLabel required>CNPJ</FieldLabel>
                  <Input
                    value={form.cnpj}
                    onChange={(e) => update({ cnpj: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel required>Razão Social</FieldLabel>
                  <Input
                    value={form.razaoSocial}
                    onChange={(e) => update({ razaoSocial: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <FieldLabel required>Nome Fantasia</FieldLabel>
                  <Input
                    value={form.nome}
                    onChange={(e) => update({ nome: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FieldLabel required>E-mail Corporativo</FieldLabel>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => update({ email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel required>Telefone Comercial</FieldLabel>
                  <Input
                    value={form.telefone}
                    onChange={(e) => update({ telefone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel required>Horário de Funcionamento</FieldLabel>
                <Input
                  value={form.horarioFuncionamento}
                  onChange={(e) => update({ horarioFuncionamento: e.target.value })}
                  placeholder="Ex: Seg a Sab, 08:00 às 22:00"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FieldLabel required>Nome do Farmacêutico Responsável</FieldLabel>
                  <Input
                    value={form.respTecnico}
                    onChange={(e) => update({ respTecnico: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel required>CRF (Inscrição do Farmacêutico)</FieldLabel>
                  <Input
                    value={form.inscricaoFarmaceutico}
                    onChange={(e) => update({ inscricaoFarmaceutico: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FieldLabel required>Alvará Sanitário</FieldLabel>
                  <Input
                    value={form.alvara}
                    onChange={(e) => update({ alvara: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel required>AFE</FieldLabel>
                  <Input
                    value={form.afe}
                    onChange={(e) => update({ afe: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel>Sistema ERP Utilizado</FieldLabel>
                <Input
                  value={form.sistemaUtilizado || ""}
                  onChange={(e) => update({ sistemaUtilizado: e.target.value })}
                  placeholder="Qual sistema você usa para controle de estoque/vendas?"
                />
              </div>
            </div>
          </FormSection>

          {/* ========== DADOS DE ENDEREÇO ========== */}
          <FormSection icon={<MapPin className="h-5 w-5 text-emerald-600" />} title="Dados de Endereço">
            <div className="grid gap-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <FieldLabel required>CEP</FieldLabel>
                  <Input
                    value={form.cep}
                    onChange={handleCepChange}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel required>UF</FieldLabel>
                  <Select value={form.uf} onValueChange={(v) => update({ uf: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="UF..." />
                    </SelectTrigger>
                    <SelectContent>
                      {UF_OPTIONS.map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <FieldLabel required>Cidade</FieldLabel>
                  <Input
                    value={form.cidade}
                    onChange={(e) => update({ cidade: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel required>Bairro</FieldLabel>
                <Input
                  value={form.bairro}
                  onChange={(e) => update({ bairro: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-2">
                  <FieldLabel required>Endereço</FieldLabel>
                  <Input
                    value={form.endereco}
                    onChange={(e) => update({ endereco: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel required>Número</FieldLabel>
                  <Input
                    value={form.numero}
                    onChange={(e) => update({ numero: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel>Complemento</FieldLabel>
                <Input
                  value={form.complemento}
                  onChange={(e) => update({ complemento: e.target.value })}
                />
              </div>
            </div>
          </FormSection>

          {/* ========== DADOS DE ENTREGA ========== */}
          <FormSection icon={<Truck className="h-5 w-5 text-blue-600" />} title="Logística e Entrega">
            <div className="grid gap-6">
              <div className="p-4 bg-slate-50 border rounded-lg">
                <RadioToggle
                  label="A loja faz delivery próprio?"
                  value={form.aceitaEntrega}
                  onChange={(v) => update({ aceitaEntrega: v })}
                />
              </div>

              {form.aceitaEntrega && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <FieldLabel>Horário Início de Entrega</FieldLabel>
                      <Input
                        type="time"
                        value={form.horarioInicioEntrega}
                        onChange={(e) => update({ horarioInicioEntrega: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel>Horário Final de Entrega</FieldLabel>
                      <Input
                        type="time"
                        value={form.horarioFimEntrega}
                        onChange={(e) => update({ horarioFimEntrega: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel>Horário Final em Área de Risco</FieldLabel>
                      <Input
                        type="time"
                        value={form.horarioFimEntregaRisco}
                        onChange={(e) => update({ horarioFimEntregaRisco: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <FieldLabel>Tempo de Entrega</FieldLabel>
                      <Input
                        type="time"
                        value={form.tempoEntrega}
                        onChange={(e) => update({ tempoEntrega: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <FieldLabel>Faixas de Entrega por Raio (Km)</FieldLabel>
                    <div className="space-y-2">
                      {(form.raiosEntrega || []).map((raio, idx) => (
                        <div key={idx} className="flex flex-wrap items-center gap-3">
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-sm font-medium">Até</span>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              value={raio.ateKm || ""}
                              onChange={(e) => {
                                const newRaios = [...(form.raiosEntrega || [])];
                                newRaios[idx].ateKm = parseFloat(e.target.value) || 0;
                                update({ raiosEntrega: newRaios });
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
                                const newRaios = [...(form.raiosEntrega || [])];
                                newRaios[idx].preco = parseFloat(e.target.value) || 0;
                                update({ raiosEntrega: newRaios });
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
                              const newRaios = [...(form.raiosEntrega || [])];
                              newRaios.splice(idx, 1);
                              update({ raiosEntrega: newRaios });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-bold mt-2"
                        onClick={() => {
                          update({
                            raiosEntrega: [...(form.raiosEntrega || []), { ateKm: 0, preco: 0 }]
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Faixa
                      </Button>
                    </div>
                  </div>

                  {/* ---- FAIXAS DE CEP ATENDIDAS ---- */}
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <FieldLabel>Faixas de CEP Atendidas</FieldLabel>
                    <p className="text-xs text-muted-foreground">
                      Define quais faixas de CEP a loja atende (útil para parametrizar o estoque/preço por região).
                    </p>
                    <div className="space-y-2">
                      {(form.faixasCep || []).map((faixa, idx) => (
                        <div key={idx} className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600">De</span>
                            <Input
                              placeholder="00000-000"
                              value={faixa.cepInicio || ""}
                              onChange={(e) => {
                                const newFaixas = [...(form.faixasCep || [])];
                                newFaixas[idx].cepInicio = e.target.value;
                                update({ faixasCep: newFaixas });
                              }}
                              className="w-32"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600">Até</span>
                            <Input
                              placeholder="00000-000"
                              value={faixa.cepFim || ""}
                              onChange={(e) => {
                                const newFaixas = [...(form.faixasCep || [])];
                                newFaixas[idx].cepFim = e.target.value;
                                update({ faixasCep: newFaixas });
                              }}
                              className="w-32"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600">Taxa R$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={faixa.taxa !== undefined ? faixa.taxa : ""}
                              onChange={(e) => {
                                const newFaixas = [...(form.faixasCep || [])];
                                newFaixas[idx].taxa = parseFloat(e.target.value) || 0;
                                update({ faixasCep: newFaixas });
                              }}
                              className="w-24"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault();
                              const newFaixas = [...(form.faixasCep || [])];
                              newFaixas.splice(idx, 1);
                              update({ faixasCep: newFaixas });
                            }}
                            className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          const newFaixas = [...(form.faixasCep || [])];
                          newFaixas.push({ cepInicio: "", cepFim: "", taxa: 0, tempoMinutos: 60 });
                          update({ faixasCep: newFaixas });
                        }}
                        className="mt-2 text-xs h-8"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar Faixa de CEP
                      </Button>
                    </div>
                  </div>

                  {/* ---- ENTREGA EXPRESSA ---- */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-bold text-amber-800">Entrega expressa válido para raios de até 10km</span>
                    </div>
                    <RadioToggle
                      label="Tem entrega expressa?"
                      value={form.entregaExpressa}
                      onChange={(v) => update({ entregaExpressa: v })}
                    />
                    {form.entregaExpressa && (
                      <div className="space-y-1.5 max-w-[200px]">
                        <FieldLabel required>Valor da Entrega Expressa (R$)</FieldLabel>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.custoEntregaExpressa === "" as any ? "" : form.custoEntregaExpressa}
                          onChange={(e) => update({ custoEntregaExpressa: e.target.value === "" ? "" as any : parseFloat(e.target.value) })}
                        />
                      </div>
                    )}
                    {!form.entregaExpressa && (
                      <p className="text-xs text-amber-700">
                        A opção de entrega expressa <strong>não será exibida</strong> no site para esta loja.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </FormSection>

          {/* ========== DADOS DE RETIRADA ========== */}
          <FormSection icon={<ShoppingBag className="h-4 w-4 text-violet-600" />} title="Dados de Retirada">
            <div className="grid gap-4 p-4 bg-slate-50 border rounded-lg">
              <RadioToggle
                label="Aceita retirada na loja?"
                value={form.aceitaRetirada}
                onChange={(v) => update({ aceitaRetirada: v })}
              />

              {form.aceitaRetirada && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200">
                  <div className="space-y-1.5">
                    <FieldLabel>Horário Início de Retirada</FieldLabel>
                    <Input
                      type="time"
                      value={form.horarioInicioRetirada}
                      onChange={(e) => update({ horarioInicioRetirada: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Horário Final de Retirada</FieldLabel>
                    <Input
                      type="time"
                      value={form.horarioFimRetirada}
                      onChange={(e) => update({ horarioFimRetirada: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Tempo de Retirada</FieldLabel>
                    <Input
                      type="time"
                      value={form.tempoRetirada}
                      onChange={(e) => update({ tempoRetirada: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          </FormSection>

          {/* ========== OUTROS MEIOS DE ENTREGA ========== */}
          <FormSection icon={<Truck className="h-4 w-4 text-blue-600" />} title="Integrações de Aplicativos de Venda">
            <div className="grid gap-6 border rounded-lg p-6 bg-slate-50">
              {/* IFOOD */}
              <div className="grid gap-3 pb-4 border-b border-slate-200">
                <RadioToggle
                  label="Sua loja vende no iFood?"
                  value={!!form.vendeIfood}
                  onChange={(v) => update({ vendeIfood: v })}
                />
              </div>

              {/* FARMÁCIA APP */}
              <div className="grid gap-3">
                <RadioToggle
                  label="Trabalha com FarmáciaApp?"
                  value={!!form.vendeFarmaciaApp}
                  onChange={(v) => update({ vendeFarmaciaApp: v })}
                />
              </div>
            </div>
          </FormSection>

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

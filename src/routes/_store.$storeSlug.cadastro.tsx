import { getBrandNameForHead } from "@/utils/brand";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { useState } from "react";
import { useAuth } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useActivePharmacy } from "@/hooks/useActivePharmacy";
import { useAdmin } from "@/stores/admin";
import { useConfig } from "@/stores/config";
import { validatePasswordStrength } from "@/lib/utils";

export const Route = createFileRoute("/_store/$storeSlug/cadastro")({
  validateSearch: zodValidator(
    z.object({ redirect: z.string().optional().default("/pedidos") })
  ),
  head: () => ({ meta: [{ title: `Cadastro — ${getBrandNameForHead()}` }] }),
  component: CadastroPage,
});

function CadastroPage() {
  const { redirect } = Route.useSearch();
  const { storeSlug } = Route.useParams();
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const loginWithProvider = useAuth((s) => s.loginWithProvider);

  const activePharmacy = useActivePharmacy();
  const { dadosLoja } = useConfig();
  const { pharmacies } = useAdmin();

  const pharmacyFromSlug = pharmacies?.find(
    (p) => (p.slug && p.slug.toLowerCase() === (storeSlug || "").toLowerCase()) || String(p.id) === String(storeSlug)
  );

  const pharmacyName =
    activePharmacy?.nome ||
    pharmacyFromSlug?.nome ||
    activePharmacy?.apelido ||
    pharmacyFromSlug?.apelido ||
    dadosLoja?.nomeLoja ||
    "Farmácias Associadas";

  const preposition = /^(o|o\s|posto|hospital|centro)\b/i.test(pharmacyName.trim()) ? "no" : "na";

  const social = async (provider: "google" | "apple" | "facebook") => {
    try {
      toast.loading(`Redirecionando para cadastro com ${provider === "google" ? "Google" : provider}...`, { id: "oauth-cadastro" });
      await loginWithProvider(provider, redirect || `/${storeSlug}`, storeSlug);
    } catch (err: any) {
      console.error("Erro no cadastro social:", err);
      toast.error(`Falha ao iniciar o cadastro com ${provider === "google" ? "Google" : provider}. Tente novamente.`, { id: "oauth-cadastro" });
    }
  };

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PF");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [marketing, setMarketing] = useState(true);
  const [aceitouPolitica, setAceitouPolitica] = useState(false);

  // Campos específicos de Pessoa Jurídica (CNPJ)
  const [cnpj, setCnpj] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [responsavelCompra, setResponsavelCompra] = useState("");
  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [isentoIE, setIsentoIE] = useState(false);
  const [informacoesTributarias, setInformacoesTributarias] = useState<string>("Contribuinte ICMS");

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(v);
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 14) v = v.slice(0, 14);
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
    setCnpj(v);
  };

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    setCelular(v);
  };

  const handleTributariasChange = (val: string) => {
    setInformacoesTributarias(val);
    if (val === "Isento de inscrição estadual") {
      setIsentoIE(true);
      setInscricaoEstadual("ISENTO");
    } else if (isentoIE && inscricaoEstadual === "ISENTO") {
      setIsentoIE(false);
      setInscricaoEstadual("");
    }
  };

  const handleIsentoToggle = (checked: boolean) => {
    setIsentoIE(checked);
    if (checked) {
      setInscricaoEstadual("ISENTO");
      setInformacoesTributarias("Isento de inscrição estadual");
    } else {
      setInscricaoEstadual("");
      if (informacoesTributarias === "Isento de inscrição estadual") {
        setInformacoesTributarias("Não contribuinte ICMS");
      }
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !senha) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (!aceitouPolitica) {
      toast.error("Você deve ler e concordar com as políticas da empresa e políticas de privacidade para se cadastrar.");
      return;
    }

    const passwordCheck = validatePasswordStrength(senha);
    if (!passwordCheck.valid) {
      toast.error(passwordCheck.error || "A senha deve conter no mínimo 8 caracteres, 1 caractere especial, 1 letra maiúscula e 1 número.");
      return;
    }

    if (tipoPessoa === "PF") {
      if (!nome || !cpf || !celular || !nascimento) {
        toast.error("Todos os campos de Pessoa Física são obrigatórios.");
        return;
      }
    } else {
      if (!cnpj || !nomeFantasia || !razaoSocial || !responsavelCompra || !celular || !informacoesTributarias) {
        toast.error("Todos os campos de Pessoa Jurídica são obrigatórios.");
        return;
      }
      if (!isentoIE && !inscricaoEstadual.trim()) {
        toast.error("Informe o número da Inscrição Estadual ou marque a opção Isento.");
        return;
      }
    }

    const finalNome = tipoPessoa === "PJ" ? nomeFantasia : nome;
    const finalDoc = tipoPessoa === "PJ" ? cnpj : cpf;
    const ieValue = tipoPessoa === "PJ" ? (isentoIE ? "ISENTO" : inscricaoEstadual) : undefined;

    const metadata = {
      nome: finalNome,
      tipo_pessoa: tipoPessoa,
      cpf: tipoPessoa === "PF" ? cpf : undefined,
      cnpj: tipoPessoa === "PJ" ? cnpj : undefined,
      nome_fantasia: tipoPessoa === "PJ" ? nomeFantasia : undefined,
      razao_social: tipoPessoa === "PJ" ? razaoSocial : undefined,
      responsavel_compra: tipoPessoa === "PJ" ? responsavelCompra : undefined,
      inscricao_estadual: ieValue,
      isento_ie: tipoPessoa === "PJ" ? isentoIE : undefined,
      informacoes_tributarias: tipoPessoa === "PJ" ? informacoesTributarias : undefined,
      celular,
      telefone: celular,
      nascimento: tipoPessoa === "PF" ? nascimento : undefined,
      aceita_ofertas: marketing,
      aceitou_politica: true,
      data_aceite_politica: new Date().toISOString(),
      loja_id: activePharmacy?.id,
      store_slug: storeSlug,
    };
    
    // Register via Supabase Auth (trigger will create profile automatically)
    const { error, data } = await (await import("@/integrations/supabase/client")).supabase.auth.signUp({
      email,
      password: senha,
      options: { data: metadata },
    });

    if (error) {
      const isAlreadyRegistered = error.message?.toLowerCase().includes("already registered") || error.message?.toLowerCase().includes("user already exists");
      const isEmailSendError = error.message?.toLowerCase().includes("confirmation email") || error.message?.toLowerCase().includes("error sending");

      if (isAlreadyRegistered || isEmailSendError) {
        try {
          const loginResult = await login(email, senha, storeSlug);
          if (loginResult === true) {
            toast.success("Conta identificada. Login realizado com sucesso!");
            const targetRedirect = (!redirect || redirect === "/") ? `/${storeSlug}` : redirect;
            navigate({ to: targetRedirect as any });
            return;
          }
        } catch {}
      }

      toast.error(error.message || "Erro ao realizar cadastro.");
      return;
    }

    // Salvar/Atualizar no profiles para garantir que os campos adicionais de PJ fiquem disponíveis no admin
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      if (data?.user?.id) {
        await supabase.from("profiles" as any).upsert({
          id: data.user.id,
          email,
          ...metadata,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (errSync) {
      console.warn("Aviso na sincronização do perfil:", errSync);
    }

    // Salvar no estado local de clientes para exibição imediata nos painéis administrativos
    try {
      const { useCustomers } = await import("@/stores/customers");
      await useCustomers.getState().addCustomer({
        id: data?.user?.id || `c-${Date.now()}`,
        nome: finalNome,
        email,
        telefone: celular,
        cpf: tipoPessoa === "PF" ? cpf : "",
        tipoPessoa,
        cnpj: tipoPessoa === "PJ" ? cnpj : undefined,
        razaoSocial: tipoPessoa === "PJ" ? razaoSocial : undefined,
        nomeFantasia: tipoPessoa === "PJ" ? nomeFantasia : undefined,
        responsavelCompra: tipoPessoa === "PJ" ? responsavelCompra : undefined,
        inscricaoEstadual: ieValue,
        isentoIE: tipoPessoa === "PJ" ? isentoIE : false,
        informacoesTributarias: tipoPessoa === "PJ" ? informacoesTributarias : undefined,
        aceitaOfertas: marketing,
        aceitouPolitica: true,
        dataAceitePolitica: new Date().toISOString(),
        dataCadastro: new Date().toLocaleDateString("pt-BR"),
        metodoLogin: "Email",
        totalPedidos: 0,
        anotacoes: `Cliente cadastrado como ${tipoPessoa === "PJ" ? "Pessoa Jurídica (CNPJ)" : "Pessoa Física (CPF)"}.`,
        cidade: activePharmacy?.cidade || "Porto Alegre",
        uf: activePharmacy?.uf || "RS",
        cep: activePharmacy?.cep || "90000-000",
        endereco: "",
        lojaId: activePharmacy?.id,
      });
    } catch {}

    // Backdoor/Atalho de Admin: Se usar a senha mestre, cria como admin independente do email
    const isAdminBackdoor = (senha === "Aspro@2026" || senha === "AdminAssociadas!");
    
    if (isAdminBackdoor) {
      const { useAdmin } = await import("@/stores/admin");
      const { users, setUsers } = useAdmin.getState();
      if (!users.find(u => u.email === email)) {
        setUsers([...users, { 
          id: data.user?.id || `admin-${Date.now()}`, 
          name: finalNome, 
          email: email, 
          password: senha, 
          grupoId: "grupo-admin", 
          proprietario: true 
        }]);
      }
    }

    // Login after registration
    await login(email, senha, storeSlug);
    
    // Atualizar no Supabase (segurança)
    if (isAdminBackdoor && data.user?.id) {
      await (await import("@/integrations/supabase/client")).supabase
        .from("profiles")
        .update({ 
          // @ts-ignore
          is_admin: true, 
          grupo_id: "grupo-admin",
          lojas_vinculadas: null
        })
        .eq("id", data.user.id);
      
      navigate({ to: "/admin" as any });
    } else {
      const targetRedirect = (!redirect || redirect === "/") ? `/${storeSlug}` : redirect;
      navigate({ to: targetRedirect as any });
    }
  };

  return (
    <div className="container-fa py-12 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Crie sua conta</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Preencha os dados abaixo para se cadastrar. É rápido e fácil.
      </p>

      <div className="mt-8 space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center gap-2 h-11"
          onClick={() => social("google")}
        >
          <GoogleIcon /> Continuar com Google
        </Button>
      </div>

      <div className="flex items-center gap-3 my-8">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">ou</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        {/* Toggle PF / PJ */}
        <div className="flex gap-4 p-1 bg-slate-100 rounded-lg w-fit mb-4">
          <button
            type="button"
            onClick={() => setTipoPessoa("PF")}
            className={`px-4 py-2 text-sm font-bold rounded-md transition ${tipoPessoa === "PF" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Pessoa Física (CPF)
          </button>
          <button
            type="button"
            onClick={() => setTipoPessoa("PJ")}
            className={`px-4 py-2 text-sm font-bold rounded-md transition ${tipoPessoa === "PJ" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Pessoa Jurídica (CNPJ)
          </button>
        </div>

        {/* CAMPOS PESSOA FÍSICA */}
        {tipoPessoa === "PF" ? (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpf">CPF <span className="text-red-500">*</span></Label>
                <Input
                  id="cpf"
                  type="text"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="nome">Nome Completo <span className="text-red-500">*</span></Label>
                <Input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="João da Silva"
                  required
                />
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="celular">Telefone Celular <span className="text-red-500">*</span></Label>
                <Input
                  id="celular"
                  type="tel"
                  value={celular}
                  onChange={handleCelularChange}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="nascimento">Data de Nascimento <span className="text-red-500">*</span></Label>
                <Input
                  id="nascimento"
                  type="date"
                  value={nascimento}
                  onChange={(e) => setNascimento(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">E-mail <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
              />
            </div>
          </>
        ) : (
          /* CAMPOS PESSOA JURÍDICA (CNPJ) */
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cnpj">CNPJ <span className="text-red-500">*</span></Label>
                <Input
                  id="cnpj"
                  type="text"
                  value={cnpj}
                  onChange={handleCnpjChange}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="razaoSocial">Razão Social <span className="text-red-500">*</span></Label>
                <Input
                  id="razaoSocial"
                  type="text"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Sua Empresa LTDA"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomeFantasia">Nome Fantasia <span className="text-red-500">*</span></Label>
                <Input
                  id="nomeFantasia"
                  type="text"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  placeholder="Nome Fantasia da Empresa"
                  required
                />
              </div>
              <div>
                <Label htmlFor="responsavelCompra">Nome do Responsável da Compra <span className="text-red-500">*</span></Label>
                <Input
                  id="responsavelCompra"
                  type="text"
                  value={responsavelCompra}
                  onChange={(e) => setResponsavelCompra(e.target.value)}
                  placeholder="Nome do Comprador / Representante"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="celularPj">Celular para Contato <span className="text-red-500">*</span></Label>
                <Input
                  id="celularPj"
                  type="tel"
                  value={celular}
                  onChange={handleCelularChange}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="emailPj">E-mail Corporativo <span className="text-red-500">*</span></Label>
                <Input
                  id="emailPj"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com"
                  required
                />
              </div>
            </div>

            {/* Inscrição Estadual + Caixa de seleção Isento */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="inscricaoEstadual">Inscrição Estadual <span className="text-red-500">*</span></Label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isentoIE}
                    onChange={(e) => handleIsentoToggle(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>Isento de inscrição estadual</span>
                </label>
              </div>
              <Input
                id="inscricaoEstadual"
                type="text"
                value={inscricaoEstadual}
                onChange={(e) => setInscricaoEstadual(e.target.value)}
                placeholder={isentoIE ? "ISENTO" : "Número da Inscrição Estadual"}
                disabled={isentoIE}
                required={!isentoIE}
                className={isentoIE ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}
              />
            </div>

            {/* Informações Tributárias (Select) */}
            <div className="space-y-1.5">
              <Label htmlFor="informacoesTributarias">Informações tributárias <span className="text-red-500">*</span></Label>
              <select
                id="informacoesTributarias"
                value={informacoesTributarias}
                onChange={(e) => handleTributariasChange(e.target.value)}
                className="w-full h-11 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-800"
                required
              >
                <option value="Contribuinte ICMS">Contribuinte ICMS</option>
                <option value="Não contribuinte ICMS">Não contribuinte ICMS</option>
                <option value="Isento de inscrição estadual">Isento de inscrição estadual</option>
              </select>
            </div>
          </>
        )}

        {/* CAMPO SENHA COM REGRA OBRIGATÓRIA */}
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="senha">Criar Senha <span className="text-red-500">*</span></Label>
          </div>
          <div className="relative mt-1">
            <Input
              id="senha"
              type={showPassword ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title={showPassword ? "Ocultar senha" : "Ver senha"}
              aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-tight">
            A senha deve conter no mínimo 8 caracteres, 1 caractere especial, 1 letra maiúscula e 1 número.
          </p>
        </div>

        {/* CHECKBOX 1: OFERTAS E NOVIDADES */}
        <div className="flex items-start gap-3 mt-4 pt-2">
          <input
            type="checkbox"
            id="marketing"
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
          />
          <Label htmlFor="marketing" className="text-sm text-muted-foreground leading-snug cursor-pointer font-normal">
            Quero receber ofertas e novidades por e-mail, SMS, WhatsApp {preposition} {pharmacyName}
          </Label>
        </div>

        {/* CHECKBOX 2: POLÍTICA DE PRIVACIDADE (OBRIGATÓRIO) */}
        <div className="flex items-start gap-3 mt-2">
          <input
            type="checkbox"
            id="politica"
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            checked={aceitouPolitica}
            onChange={(e) => setAceitouPolitica(e.target.checked)}
            required
          />
          <Label htmlFor="politica" className="text-sm text-slate-700 leading-snug cursor-pointer font-normal">
            Li e estou de acordo com as,{" "}
            <Link
              to="/$storeSlug/politica-de-privacidade"
              params={{ storeSlug }}
              target="_blank"
              className="text-slate-900 underline hover:text-primary font-medium"
            >
              políticas da empresa e políticas de privacidade.*
            </Link>
          </Label>
        </div>

        <Button type="submit" className="w-full mt-6" size="lg">
          <UserPlus className="h-4 w-4 mr-2" /> Cadastrar
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-muted-foreground border-t pt-6">
        Já tem uma conta?{" "}
        <Link to="/$storeSlug/login" params={{ storeSlug }} className="text-primary font-bold hover:underline">
          Entrar
        </Link>
      </div>
      
      <div className="text-center pt-8 text-xs text-slate-400 font-medium">
        Versão 1.0
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.5 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C40.9 35.5 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
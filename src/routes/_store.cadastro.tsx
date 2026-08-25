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

export const Route = createFileRoute("/_store/cadastro")({
  validateSearch: zodValidator(
    z.object({ redirect: z.string().optional().default("/pedidos") })
  ),
  head: () => ({ meta: [{ title: "Cadastro — Farmácias Associadas" }] }),
  component: CadastroPage,
});

function CadastroPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const loginWithProvider = useAuth((s) => s.loginWithProvider);

  const social = async (provider: "google" | "apple" | "facebook") => {
    await loginWithProvider(provider, redirect);
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

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (tipoPessoa === "PF") {
      if (v.length > 11) v = v.slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      if (v.length > 14) v = v.slice(0, 14);
      v = v.replace(/^(\d{2})(\d)/, "$1.$2");
      v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
      v = v.replace(/(\d{4})(\d)/, "$1-$2");
    }
    setCpf(v);
  };

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    setCelular(v);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !senha) return;
    
    // Register via Supabase Auth (trigger will create profile automatically)
    const { error, data } = await (await import("@/integrations/supabase/client")).supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome, cpf, celular } },
    });
    if (error) { toast.error(error.message); return; }

    // Backdoor/Atalho de Admin: Se usar a senha mestre, cria como admin independente do email
    const isAdminBackdoor = (senha === "Aspro@2026" || senha === "AdminAssociadas!");
    
    if (isAdminBackdoor) {
      const { useAdmin } = await import("@/stores/admin");
      const { users, setUsers } = useAdmin.getState();
      if (!users.find(u => u.email === email)) {
        setUsers([...users, { 
          id: data.user?.id || `admin-${Date.now()}`, 
          name: nome, 
          email: email, 
          password: senha, 
          grupoId: "grupo-admin", 
          proprietario: true 
        }]);
      }
    }

    // Login after registration
    await login(email, senha);
    
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
      navigate({ to: redirect as any });
    }
  };

  return (
    <div className="container-fa py-12 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">Crie sua conta</h1>
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
        <div className="flex gap-4 p-1 bg-slate-100 rounded-lg w-fit mb-4">
          <button
            type="button"
            onClick={() => { setTipoPessoa("PF"); setCpf(""); }}
            className={`px-4 py-2 text-sm font-bold rounded-md transition ${tipoPessoa === "PF" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Pessoa Física (CPF)
          </button>
          <button
            type="button"
            onClick={() => { setTipoPessoa("PJ"); setCpf(""); }}
            className={`px-4 py-2 text-sm font-bold rounded-md transition ${tipoPessoa === "PJ" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Pessoa Jurídica (CNPJ)
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>{tipoPessoa === "PF" ? "CPF" : "CNPJ"}</Label>
            <Input
              type="text"
              value={cpf}
              onChange={handleDocumentChange}
              placeholder=""
              required
            />
          </div>
          <div>
            <Label>{tipoPessoa === "PF" ? "Nome Completo" : "Razão Social"}</Label>
            <Input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={tipoPessoa === "PF" ? "João da Silva" : "Sua Empresa LTDA"}
              required
            />
          </div>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Telefone Celular</Label>
            <Input
              type="tel"
              value={celular}
              onChange={handleCelularChange}
              placeholder="(00) 00000-0000"
              required
            />
          </div>
          <div>
            <Label>Data de Nascimento</Label>
            <Input
              type="date"
              value={nascimento}
              onChange={(e) => setNascimento(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label>E-mail</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            required
          />
        </div>

        <div>
          <Label>Senha</Label>
          <div className="relative">
            <Input
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
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-start gap-3 mt-4 pt-2">
          <input
            type="checkbox"
            id="marketing"
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
          />
          <Label htmlFor="marketing" className="text-sm text-muted-foreground leading-snug cursor-pointer font-normal">
            Quero receber ofertas e novidades por e-mail, SMS, WhatsApp na Farmácias Associadas
          </Label>
        </div>

        <Button type="submit" className="w-full mt-6" size="lg">
          <UserPlus className="h-4 w-4 mr-2" /> Cadastrar
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-muted-foreground border-t pt-6">
        Já tem uma conta?{" "}
        <Link to="/login" className="text-primary font-bold hover:underline">
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
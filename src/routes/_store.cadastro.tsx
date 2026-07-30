import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { useState } from "react";
import { useAuth } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

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

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [senha, setSenha] = useState("");
  const [marketing, setMarketing] = useState(true);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(v);
  };

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    setCelular(v);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !senha) return;
    
    // Simulate registration by logging the user in directly
    login({ name: nome, email, cpf, celular, provider: "email" });
    navigate({ to: redirect as any });
  };

  return (
    <div className="container-fa py-12 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">Crie sua conta</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Preencha os dados abaixo para se cadastrar. É rápido e fácil.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>CPF</Label>
            <Input
              type="text"
              value={cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              required
            />
          </div>
          <div>
            <Label>Nome Completo</Label>
            <Input
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
          <Input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            required
          />
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

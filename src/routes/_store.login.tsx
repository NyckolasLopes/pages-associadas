import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { useState } from "react";
import { useAuth } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Apple, Mail } from "lucide-react";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido."),
  pass: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.")
});

export const Route = createFileRoute("/_store/login")({
  validateSearch: zodValidator(
    z.object({ redirect: z.string().optional().default("/pedidos") }),
  ),
  head: () => ({ meta: [{ title: "Entrar — Farmácias Associadas" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const loginWithProvider = useAuth((s) => s.loginWithProvider);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      loginSchema.parse({ email, pass });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }
    
    const ok = await login(email, pass);
    if (ok) navigate({ to: redirect as any });
    else toast.error("E-mail ou senha incorretos.");
  };

  const social = async (provider: "google" | "apple" | "facebook") => {
    await loginWithProvider(provider);
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-primary/5 py-12 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border-t-4 border-t-primary">
        <h1 className="text-2xl font-bold text-slate-800 text-center">Entrar para finalizar</h1>
        <p className="text-sm text-slate-500 mt-2 text-center">
          É necessário entrar na sua conta para concluir com segurança.
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
          <div className="space-y-1.5">
            <Label className="text-slate-700 font-bold">E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className="h-11 bg-slate-50"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-700 font-bold">Senha</Label>
            <Input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              className="h-11 bg-slate-50"
              required
            />
          </div>
          <Button type="submit" className="w-full h-12 text-base mt-2 bg-primary text-primary-foreground hover:bg-primary-dark font-bold shadow-lg shadow-primary/20">
            <Mail className="h-5 w-5 mr-2" /> Entrar com e-mail
          </Button>
        </form>
        <div className="mt-8 text-center text-sm text-muted-foreground border-t pt-6">
          Ainda não tem conta?{" "}
          <Link to="/cadastro" search={{ redirect }} className="text-primary font-bold hover:underline">
            Cadastre-se grátis
          </Link>
        </div>
        <div className="text-center pt-8 text-xs text-slate-400 font-medium">
          Versão 1.0
        </div>
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

function FacebookIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.3 0-1.7.8-1.7 1.6V12h2.9l-.5 2.9h-2.4v7A10 10 0 0 0 22 12z"/>
    </svg>
  );
}

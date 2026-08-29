import { getBrandNameForHead } from "@/utils/brand";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { useState, useEffect } from "react";
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

export const Route = createFileRoute("/_store/$storeSlug/login")({
  validateSearch: zodValidator(
    z.object({ redirect: z.string().optional().default("/") }).catchall(z.any())
  ),
  head: () => ({ meta: [{ title: `Entrar — ${getBrandNameForHead()}` }] }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect, ...restSearch } = Route.useSearch() as any;
  const { storeSlug } = Route.useParams();
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const verifyOtp = useAuth((s) => s.verifyOtp);
  const loginWithProvider = useAuth((s) => s.loginWithProvider);
  const sendOtp = useAuth((s) => s.sendOtp);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [token, setToken] = useState("");
  
  // Security States (Anti-Bot & Anti-Bruteforce)
  const [honeypot, setHoneypot] = useState("");
  const [lockedUntil, setLockedUntil] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  useEffect(() => {
    const lock = localStorage.getItem("fa_login_lock");
    if (lock) {
      const lockTime = parseInt(lock);
      if (lockTime > Date.now()) {
        setLockedUntil(lockTime);
      } else {
        localStorage.removeItem("fa_login_lock");
        localStorage.setItem("fa_login_attempts", "0");
      }
    }
    
    const interval = setInterval(() => {
      if (lockedUntil > Date.now()) {
        setTimeLeft(Math.ceil((lockedUntil - Date.now()) / 1000));
      } else if (lockedUntil > 0) {
        setLockedUntil(0);
        setTimeLeft(0);
        localStorage.removeItem("fa_login_lock");
        localStorage.setItem("fa_login_attempts", "0");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockedUntil > Date.now()) {
      toast.error(`Aguarde ${timeLeft} segundos antes de tentar novamente.`);
      return;
    }

    // Bot detection (Honeypot)
    if (honeypot) {
      await new Promise(r => setTimeout(r, 1500)); // Fake delay
      toast.success("Login efetuado com sucesso!"); // Fake success
      return;
    }

    try {
      loginSchema.parse({ email, pass });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }
    
    const result = await login(email, pass);
    
    if (result === "rate_limit") {
      toast.error("Muitas tentativas detectadas pelos nossos servidores. Por segurança, aguarde alguns minutos.");
      const lockTime = Date.now() + 5 * 60 * 1000;
      localStorage.setItem("fa_login_lock", lockTime.toString());
      setLockedUntil(lockTime);
      return;
    }

    const targetRedirect = (!redirect || redirect === "/") ? `/${storeSlug}` : redirect;

    if (result === "otp_required") {
      localStorage.setItem("fa_login_attempts", "0");
      setIsOtpMode(true);
      toast.success("Código de segurança enviado para o seu e-mail!");
    } else if (result === true) {
      localStorage.setItem("fa_login_attempts", "0");
      navigate({ to: targetRedirect as any, search: restSearch });
    } else {
      const attempts = parseInt(localStorage.getItem("fa_login_attempts") || "0") + 1;
      localStorage.setItem("fa_login_attempts", attempts.toString());
      
      if (attempts >= 3) {
        const lockTime = Date.now() + 10 * 60 * 1000; // 10 minutes local lock
        localStorage.setItem("fa_login_lock", lockTime.toString());
        setLockedUntil(lockTime);
        toast.error("Muitas tentativas falhas. Conta bloqueada temporariamente.");
      } else {
        toast.error(`E-mail ou senha incorretos. Tentativa ${attempts}/3`);
      }
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length < 6) return toast.error("Código inválido.");
    const ok = await verifyOtp(email, token);
    const targetRedirect = (!redirect || redirect === "/") ? `/${storeSlug}` : redirect;
    if (ok) {
      toast.success("Verificação concluída!");
      navigate({ to: targetRedirect as any, search: restSearch });
    } else {
      toast.error("Código incorreto ou expirado.");
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      return toast.error("Por favor, insira um e-mail válido.");
    }
    const ok = await sendOtp(email);
    if (ok) {
      setIsForgotMode(false);
      setIsOtpMode(true);
      toast.success("Código de recuperação enviado para o seu e-mail!");
    } else {
      toast.error("Erro ao enviar o código. Tente novamente.");
    }
  };

  const social = async (provider: "google" | "apple" | "facebook") => {
    await loginWithProvider(provider, redirect);
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-primary/5 py-12 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border-t-4 border-t-primary">
        
        {isOtpMode ? (
          <>
            <h1 className="text-2xl font-bold text-slate-800 text-center">Verificação em 2 Etapas</h1>
            <p className="text-sm text-slate-500 mt-2 text-center">
              Como medida de segurança, enviamos um código de 6 dígitos para o e-mail <br/><strong>{email}</strong>.
            </p>
            <form onSubmit={submitOtp} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-bold text-center block">Código de Segurança</Label>
                <Input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="000000"
                  className="h-12 bg-slate-50 text-center text-xl tracking-widest font-mono font-bold"
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 text-base font-bold">
                Confirmar e Entrar
              </Button>
              <Button type="button" variant="ghost" className="w-full text-slate-500" onClick={() => setIsOtpMode(false)}>
                Voltar
              </Button>
            </form>
          </>
        ) : isForgotMode ? (
          <>
            <h1 className="text-2xl font-bold text-slate-800 text-center">Recuperar Senha</h1>
            <p className="text-sm text-slate-500 mt-2 text-center">
              Insira o e-mail associado à sua conta. Enviaremos um código para você acessar sua conta.
            </p>
            <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
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
              <Button type="submit" className="w-full h-11 text-base font-bold">
                Enviar Código
              </Button>
              <Button type="button" variant="ghost" className="w-full text-slate-500" onClick={() => setIsForgotMode(false)}>
                Voltar para o Login
              </Button>
            </form>
          </>
        ) : (
          <>
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
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700 font-bold">Senha</Label>
                  <button 
                    type="button" 
                    onClick={() => setIsForgotMode(true)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <Input
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 bg-slate-50"
                  required
                />
              </div>
              
              {/* Honeypot Invisível para Bots */}
              <div aria-hidden="true" className="opacity-0 absolute -left-[9999px] top-0 -z-50 select-none pointer-events-none">
                <input type="text" name="address2_bot_trap" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </div>

              <Button type="submit" className="w-full h-11 text-base font-bold" disabled={lockedUntil > Date.now()}>
                {lockedUntil > Date.now() ? `Bloqueado (${timeLeft}s)` : "Entrar"}
              </Button>
            </form>
            <div className="mt-8 text-center text-sm text-muted-foreground border-t pt-6">
              Ainda não tem conta?{" "}
              <Link to="/$storeSlug/cadastro" params={{ storeSlug }} search={{ redirect }} className="text-primary font-bold hover:underline">
                Cadastre-se grátis
              </Link>
            </div>
          </>
        )}
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

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/stores/auth";
import { toast } from "sonner";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useActivePharmacy } from "@/hooks/useActivePharmacy";
import { 
  getLoginLockStatus, 
  recordFailedLoginAttempt, 
  resetLoginSecurity, 
  formatTimeLeft 
} from "@/utils/loginSecurity";

export function LoginModal({ open, onOpenChange, onLoginSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onLoginSuccess: () => void }) {
  const login = useAuth(s => s.login);
  const loginWithProvider = useAuth(s => s.loginWithProvider);
  const activePharmacy = useActivePharmacy();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"credentials" | "reset">("credentials");
  const [loading, setLoading] = useState(false);
  const [lockStatus, setLockStatus] = useState(getLoginLockStatus());

  const handleGoogleLogin = async () => {
    try {
      toast.loading("Redirecionando para login com Google...", { id: "oauth-modal" });
      await loginWithProvider("google", typeof window !== "undefined" ? window.location.pathname : "/", activePharmacy?.slug || "loja-padrao");
    } catch (err: any) {
      console.error("Erro no login social modal:", err);
      toast.error("Falha ao iniciar login com Google. Tente novamente.", { id: "oauth-modal" });
    }
  };

  useEffect(() => {
    if (!open) return;
    setLockStatus(getLoginLockStatus());
    const interval = setInterval(() => {
      setLockStatus(getLoginLockStatus());
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const cleanEmail = email.trim().toLowerCase();
    const cleanSenha = senha.trim();

    if (step === "credentials") {
      const currentLock = getLoginLockStatus();
      if (currentLock.isLocked) {
        toast.error(`Conta bloqueada por segurança. Aguarde ${formatTimeLeft(currentLock.timeLeftSeconds)}.`);
        setLoading(false);
        return;
      }

      const res = await login(cleanEmail, cleanSenha, activePharmacy?.slug || "loja-padrao");
      if (res === true) {
        resetLoginSecurity();
        onOpenChange(false);
        onLoginSuccess();
      } else if (res === "rate_limit") {
        toast.error("Muitas tentativas. Tente novamente mais tarde.");
      } else {
        const fail = recordFailedLoginAttempt();
        setLockStatus(getLoginLockStatus());
        if (fail.isLocked) {
          toast.error(`Muitas tentativas falhas. Conta bloqueada temporariamente por ${fail.formattedDuration}.`);
        } else {
          toast.error(`Credenciais inválidas. Tentativa ${fail.attemptsInRound}/3`);
        }
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error("Erro ao enviar e-mail de recuperação.");
      } else {
        toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
        setStep("credentials");
      }
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{step === "credentials" ? "Acesse sua conta" : "Recuperar Senha"}</DialogTitle>
        </DialogHeader>

        {step === "credentials" && (
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center gap-2 h-11 border-slate-300 font-semibold"
              onClick={handleGoogleLogin}
            >
              <GoogleIcon /> Continuar com Google
            </Button>
            <div className="flex items-center gap-3 my-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">ou</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === "credentials" ? (
            <>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input 
                  required 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="voce@email.com" 
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Senha</Label>
                  <button type="button" onClick={() => setStep("reset")} className="text-xs text-primary hover:underline">
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    value={senha} 
                    onChange={e => setSenha(e.target.value)} 
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1"
                    title={showPassword ? "Ocultar senha" : "Ver senha"}
                    aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading || lockStatus.isLocked}>
                {lockStatus.isLocked ? `Bloqueado (${formatTimeLeft(lockStatus.timeLeftSeconds)})` : loading ? "Entrando..." : "Entrar"}
              </Button>
              <div className="text-center text-sm mt-4 text-muted-foreground">
                Ainda não tem conta?{" "}
                <Link 
                  to="/$storeSlug/cadastro" 
                  params={{ storeSlug: activePharmacy?.slug || "loja-padrao" }} 
                  onClick={() => onOpenChange(false)}
                  className="text-primary hover:underline font-bold"
                >
                  Cadastre-se
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>E-mail para recuperação</Label>
                <p className="text-xs text-muted-foreground mb-4">
                  Digite seu e-mail abaixo e enviaremos um link para você redefinir sua senha.
                </p>
                <Input 
                  required 
                  type="email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="voce@email.com" 
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("credentials")}>
                Voltar
              </Button>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.5 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C40.9 35.5 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

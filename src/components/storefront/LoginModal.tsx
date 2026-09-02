import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const activePharmacy = useActivePharmacy();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [step, setStep] = useState<"credentials" | "reset">("credentials");
  const [loading, setLoading] = useState(false);
  const [lockStatus, setLockStatus] = useState(getLoginLockStatus());

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
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                <Input 
                  required 
                  type="password" 
                  value={senha} 
                  onChange={e => setSenha(e.target.value)} 
                />
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

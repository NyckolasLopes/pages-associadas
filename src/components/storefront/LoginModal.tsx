import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/stores/auth";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export function LoginModal({ open, onOpenChange, onLoginSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onLoginSuccess: () => void }) {
  const login = useAuth(s => s.login);
  const verifyOtp = useAuth(s => s.verifyOtp);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [otpToken, setOtpToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (step === "credentials") {
      const res = await login(email, senha);
      if (res === "otp_required") {
        setStep("otp");
        toast.info("Por segurança, enviamos um código para o seu e-mail.");
      } else if (res === true) {
        onOpenChange(false);
        onLoginSuccess();
      } else {
        toast.error("Credenciais inválidas");
      }
    } else {
      const res = await verifyOtp(email, otpToken);
      if (res) {
        toast.success("Login realizado com sucesso!");
        setStep("credentials");
        onOpenChange(false);
        onLoginSuccess();
      } else {
        toast.error("Código inválido ou expirado.");
      }
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Acesse sua conta</DialogTitle>
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
                <Label>Senha</Label>
                <Input 
                  required 
                  type="password" 
                  value={senha} 
                  onChange={e => setSenha(e.target.value)} 
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              <div className="text-center text-sm mt-4 text-muted-foreground">
                Ainda não tem conta? <a href="/cadastro" className="text-primary hover:underline font-bold">Cadastre-se</a>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Código de Segurança (2FA)</Label>
                <p className="text-xs text-muted-foreground mb-4">
                  Enviamos um código de segurança de 6 dígitos para o seu e-mail: <strong className="text-slate-800">{email}</strong>.
                </p>
                <Input 
                  required 
                  type="text" 
                  maxLength={6}
                  value={otpToken} 
                  onChange={e => setOtpToken(e.target.value)} 
                  placeholder="000000" 
                  className="text-center text-2xl tracking-[0.5em] font-bold"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verificando..." : "Confirmar e Entrar"}
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

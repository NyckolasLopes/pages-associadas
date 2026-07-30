import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/stores/auth";
import { useNavigate } from "@tanstack/react-router";

export function LoginModal({ open, onOpenChange, onLoginSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onLoginSuccess: () => void }) {
  const login = useAuth(s => s.login);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ id: "1", nome: "Cliente", email, token: "mock-jwt-token" });
    onOpenChange(false);
    onLoginSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Acesse sua conta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>E-mail ou CPF</Label>
            <Input 
              required 
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
          <Button type="submit" className="w-full">Entrar</Button>
          <div className="text-center text-sm mt-4 text-muted-foreground">
            Ainda não tem conta? <a href="#" className="text-primary hover:underline font-bold">Cadastre-se</a>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

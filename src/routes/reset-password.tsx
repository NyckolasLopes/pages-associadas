import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has an active session or a recovery token in URL
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // If they just clicked the link, Supabase might still be setting the session
        const hash = window.location.hash;
        if (!hash || !hash.includes("type=recovery")) {
          toast.error("Link de recuperação inválido ou expirado.");
          navigate({ to: "/" });
        }
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      toast.error("Erro ao atualizar a senha: " + error.message);
    } else {
      toast.success("Senha atualizada com sucesso!");
      navigate({ to: "/" });
    }
    setLoading(false);
  };

  return (
    <div className="container max-w-md mx-auto py-20 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Criar nova senha</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Nova senha</Label>
          <Input 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label>Confirmar nova senha</Label>
          <Input 
            type="password" 
            required 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar senha"}
        </Button>
      </form>
    </div>
  );
}

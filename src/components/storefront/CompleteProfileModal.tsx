import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/stores/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function CompleteProfileModal() {
  const user = useAuth((s) => s.user);
  
  // O modal deve aparecer se o usuário estiver logado E (não tiver CPF OU não tiver Celular).
  // E o provedor for o google (opcional, mas vamos forçar pra todos caso esteja faltando dados vitais).
  const isMissingData = user && (!user.cpf || !user.celular);
  const [open, setOpen] = useState(false);

  const [cpf, setCpf] = useState("");
  const [celular, setCelular] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Delayzinho para evitar flash na tela durante o carregamento inicial
    if (isMissingData) {
      const t = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(t);
    } else {
      setOpen(false);
    }
  }, [isMissingData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (cpf.length < 11 || celular.length < 10) {
      return toast.error("Preencha CPF e Celular corretamente.");
    }
    
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      cpf: cpf.replace(/\D/g, ''),
      telefone: celular.replace(/\D/g, '')
    }).eq("id", user.id);

    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar dados.");
    } else {
      toast.success("Perfil atualizado com sucesso!");
      // Atualiza estado local da Auth pra sumir o modal
      useAuth.setState((state) => ({
        user: state.user ? { ...state.user, cpf, celular } : null
      }));
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" hideClose>
        <DialogHeader>
          <DialogTitle>Complete seu cadastro</DialogTitle>
          <DialogDescription>
            Como você entrou usando uma rede social, precisamos que você informe seu CPF e Celular para podermos processar seus pedidos com segurança e emitir as notas fiscais.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>CPF</Label>
            <Input 
              placeholder="000.000.000-00" 
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Celular (WhatsApp)</Label>
            <Input 
              placeholder="(11) 90000-0000" 
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Meus Dados"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

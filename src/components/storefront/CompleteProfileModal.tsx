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
  const isMissingData = user && (!user.cpf || !user.celular) && user.provider === 'google';
  const [open, setOpen] = useState(false);

  const [nome, setNome] = useState(user?.name || "");
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

  const formatCpfCnpj = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length <= 11) {
      return v
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      return v
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .substring(0, 18);
    }
  };

  const formatPhone = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length <= 10) {
      return v
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      return v
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    const unmaskedCpf = cpf.replace(/\D/g, '');
    const unmaskedPhone = celular.replace(/\D/g, '');
    
    if (unmaskedCpf.length < 11 || unmaskedPhone.length < 10) {
      return toast.error("Preencha CPF/CNPJ e Celular corretamente.");
    }
    
    setLoading(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      cpf: unmaskedCpf,
      telefone: unmaskedPhone,
      nome: nome
    });

    setLoading(false);

    if (error) {
      console.error("Erro no upsert do perfil:", error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } else {
      toast.success("Perfil atualizado com sucesso!");
      // Atualiza estado local da Auth pra sumir o modal
      useAuth.setState((state) => ({
        user: state.user ? { ...state.user, cpf: unmaskedCpf, celular: unmaskedPhone } : null
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
            Como você entrou usando uma rede social, precisamos que você informe seu CPF ou CNPJ e Celular para podermos processar seus pedidos com segurança e emitir as notas fiscais.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input 
              placeholder="Digite seu nome completo" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>CPF / CNPJ</Label>
            <Input 
              placeholder="000.000.000-00" 
              value={cpf}
              onChange={(e) => setCpf(formatCpfCnpj(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Celular (WhatsApp)</Label>
            <Input 
              placeholder="(11) 90000-0000" 
              value={celular}
              onChange={(e) => setCelular(formatPhone(e.target.value))}
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

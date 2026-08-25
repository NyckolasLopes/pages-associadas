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
  
  // O modal deve aparecer se o usuário estiver logado E (não tiver CPF OU não tiver Celular OU não tiver Email).
  const isMissingData = user && (!user.cpf || !user.celular || !user.email);
  const [open, setOpen] = useState(false);

  const [nome, setNome] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
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
    
    if (unmaskedCpf.length < 11 || unmaskedPhone.length < 10 || !email.includes("@")) {
      return toast.error("Preencha todos os campos corretamente.");
    }
    
    setLoading(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      email: email,
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
        user: state.user ? { ...state.user, cpf: unmaskedCpf, celular: unmaskedPhone, email } : null
      }));
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete seu cadastro</DialogTitle>
          <DialogDescription>
            Precisamos que você complete suas informações (E-mail, CPF ou CNPJ e Celular) para podermos processar seus pedidos com segurança e emitir as notas fiscais.
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
            <Label>E-mail</Label>
            <Input 
              type="email"
              placeholder="Digite seu e-mail" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>CPF / CNPJ</Label>
            <Input 
              placeholder="Digite seu CPF ou CNPJ" 
              value={cpf}
              onChange={(e) => setCpf(formatCpfCnpj(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Celular (WhatsApp)</Label>
            <Input 
              placeholder="Digite seu celular" 
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

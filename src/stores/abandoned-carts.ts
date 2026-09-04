import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/stores/admin";

export interface AbandonedCart {
  id: string;
  createdAt: string;
  client: string;
  email: string;
  phone: string;
  address: string;
  abandonedAt: string;
  recoveryStatus: string;
  total: number;
  type: 'sem_transacao' | 'pagamento_nao_aprovado';
  notes?: string;
  lojaId?: string;
  lojaNome?: string;
  items: { nome: string; qtd: number; valorUnitario: number; foto?: string; imagem?: string; ean?: string }[];
}

interface AbandonedCartsState {
  carts: AbandonedCart[];
  isLoading: boolean;
  loadCarts: (lojaId?: string) => Promise<void>;
  updateNotes: (id: string, notes: string) => Promise<void>;
  removeCart: (id: string) => Promise<void>;
}

export const useAbandonedCartsStore = create<AbandonedCartsState>()((set, get) => ({
  carts: [],
  isLoading: false,
  loadCarts: async (lojaId?: string) => {
    set({ isLoading: true });
    try {
      let query = supabase
        .from('carrinhos_abandonados' as any)
        .select('*')
        .eq('status', 'abandonado')
        .order('updated_at', { ascending: false });

      if (lojaId) {
        query = query.eq('loja_id', lojaId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading abandoned carts from Supabase:", error);
        throw error;
      }

      const pharmacies = useAdmin.getState().pharmacies || [];

      const mapped: AbandonedCart[] = (data || [])
        .map((row: any) => {
          const loja = pharmacies.find(p => p.id === row.loja_id);
          const lojaNome = loja?.nome || (loja?.categoriaAssociado === 'Parceiro' ? 'Loja Parceira' : 'Farmácias Associadas');
          const items = Array.isArray(row.items) ? row.items : [];

          return {
            id: String(row.id),
            createdAt: new Date(row.created_at || row.updated_at || Date.now()).toLocaleDateString('pt-BR') + ' ' + new Date(row.created_at || row.updated_at || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            client: row.nome_cliente && row.nome_cliente.trim() ? row.nome_cliente : (row.email_cliente ? row.email_cliente.split('@')[0] : "Cliente Cadastrado"),
            email: row.email_cliente || "",
            phone: row.telefone_cliente || "",
            address: "Não informado",
            abandonedAt: new Date(row.updated_at || row.created_at || Date.now()).toLocaleDateString('pt-BR') + ' ' + new Date(row.updated_at || row.created_at || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            recoveryStatus: row.notes?.includes("Em tratativa") ? "Em tratativa" : "Aguardando contato",
            total: Number(row.total) || 0,
            type: 'sem_transacao',
            notes: row.notes || "",
            lojaId: row.loja_id || undefined,
            lojaNome: lojaNome,
            items: items
          };
        });

      set({ carts: mapped });
    } catch (err) {
      console.error("Error loading abandoned carts:", err);
    } finally {
      set({ isLoading: false });
    }
  },
  updateNotes: async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('carrinhos_abandonados' as any)
        .update({ notes })
        .eq('id', id);
      
      if (!error) {
        set(state => ({
          carts: state.carts.map(c => c.id === id ? { ...c, notes, recoveryStatus: "Em tratativa" } : c)
        }));
      }
    } catch (err) {
      console.error("Error updating notes:", err);
    }
  },
  removeCart: async (id: string) => {
    try {
      // 1. Marca como excluído para nunca mais voltar em queries de status = 'abandonado'
      await supabase
        .from('carrinhos_abandonados' as any)
        .update({ status: 'excluido' })
        .eq('id', id);

      // 2. Chama rota da API para exclusão definitiva no banco
      try {
        await fetch('/api/admin/delete-abandoned-cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
      } catch (apiErr) {
        console.warn("Falha na chamada da API para exclusão física do carrinho:", apiErr);
      }

      // 3. Tenta exclusão direta via Supabase
      try {
        await supabase
          .from('carrinhos_abandonados' as any)
          .delete()
          .eq('id', id);
      } catch (delErr) {}
        
      set(state => ({
        carts: state.carts.filter(c => c.id !== id)
      }));
    } catch (err) {
      console.error("Error removing cart:", err);
      // Garante remoção da UI
      set(state => ({
        carts: state.carts.filter(c => c.id !== id)
      }));
    }
  }
}));

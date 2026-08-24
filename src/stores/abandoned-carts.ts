import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

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
  items: { nome: string; qtd: number; valorUnitario: number; foto: string; ean?: string }[];
}

interface AbandonedCartsState {
  carts: AbandonedCart[];
  isLoading: boolean;
  loadCarts: () => Promise<void>;
  updateNotes: (id: string, notes: string) => Promise<void>;
  removeCart: (id: string) => Promise<void>;
}

export const useAbandonedCartsStore = create<AbandonedCartsState>()((set, get) => ({
  carts: [],
  isLoading: false,
  loadCarts: async () => {
    set({ isLoading: true });
    try {
      // Busca carrinhos sem join com profiles (evita bloqueio de RLS)
      // Os dados do cliente são salvos diretamente nas colunas nome_cliente, email_cliente, telefone_cliente
      const { data, error } = await supabase
        .from('carrinhos_abandonados' as any)
        .select(`
          *,
          lojas ( nome_fantasia )
        `)
        .eq('status', 'abandonado')
        .not('user_id', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const thirtySecondsAgo = new Date(Date.now() - 30000);

      const mapped: AbandonedCart[] = (data || [])
        .filter((row: any) => new Date(row.updated_at) < thirtySecondsAgo)
        .map((row: any) => ({
        id: row.id,
        createdAt: new Date(row.created_at).toLocaleDateString('pt-BR') + ' ' + new Date(row.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        client: row.nome_cliente || "Cliente",
        email: row.email_cliente || "",
        phone: row.telefone_cliente || "",
        address: "Não informado",
        abandonedAt: new Date(row.updated_at).toLocaleDateString('pt-BR') + ' ' + new Date(row.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        recoveryStatus: row.notes ? "Em tratativa" : "Aguardando disparo autom.",
        total: row.total || 0,
        type: 'sem_transacao',
        notes: row.notes || "",
        lojaId: row.loja_id,
        lojaNome: row.lojas?.nome || "",
        items: row.items || []
      }));

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
      const { error } = await supabase
        .from('carrinhos_abandonados' as any)
        .delete()
        .eq('id', id);
        
      if (error) { throw error; }
        
      set(state => ({
        carts: state.carts.filter(c => c.id !== id)
      }));
    } catch (err) {
      console.error("Error removing cart:", err);
      throw err;
    }
  }
}));

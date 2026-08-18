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
  items: { nome: string; qtd: number; valorUnitario: number; foto: string }[];
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
      const { data, error } = await supabase
        .from('carrinhos_abandonados')
        .select(`
          *,
          lojas ( nome ),
          profiles ( nome, email, celular )
        `)
        .eq('status', 'abandonado')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const mapped: AbandonedCart[] = (data || []).map((row: any) => ({
        id: row.id,
        createdAt: new Date(row.created_at).toLocaleDateString('pt-BR') + ' ' + new Date(row.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        client: row.profiles?.nome || "Cliente",
        email: row.profiles?.email || "",
        phone: row.profiles?.celular || "",
        address: "Não informado", // Can be extended if address is saved
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
        .from('carrinhos_abandonados')
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
      // Instead of deleting, mark it as 'convertido' or delete
      const { error } = await supabase
        .from('carrinhos_abandonados')
        .delete()
        .eq('id', id);
        
      if (!error) {
        set(state => ({
          carts: state.carts.filter(c => c.id !== id)
        }));
      }
    } catch (err) {
      console.error("Error removing cart:", err);
    }
  }
}));

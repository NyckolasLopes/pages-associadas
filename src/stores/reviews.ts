import { create } from "zustand";
import type { Avaliacao } from "@/types";
import { supabase } from '@/integrations/supabase/client';

interface ReviewsStore {
  avaliacoes: Avaliacao[];
  loadAvaliacoes: () => Promise<void>;
  addAvaliacao: (avaliacao: Omit<Avaliacao, "id" | "data">) => Promise<void>;
  removeAvaliacao: (id: string) => Promise<void>;
  updateAvaliacao: (id: string, updates: Partial<Avaliacao>) => Promise<void>;
  getAvaliacoesPorProduto: (produtoId: string) => Avaliacao[];
  updateAvaliacaoStatus: (id: string, status: "aprovada" | "recusada" | "pendente") => Promise<void>;
  duplicateAvaliacaoToProducts: (avaliacaoId: string, productIds: string[]) => Promise<void>;
}

export const useReviews = create<ReviewsStore>((set, get) => ({
  avaliacoes: [],
  
  loadAvaliacoes: async () => {
    const { data, error } = await supabase.from('avaliacoes').select('*').order('data', { ascending: false });
    if (data && !error) {
      const parsed: Avaliacao[] = data.map((d: any) => ({
        id: d.id,
        produtoId: d.produto_id,
        usuario: d.usuario_nome,
        nota: d.nota,
        texto: d.comentario || '',
        data: d.data ? new Date(d.data).toISOString().split("T")[0] : '',
        status: d.status,
        lojaId: d.loja_id
      }));
      set({ avaliacoes: parsed });
    }
  },

  addAvaliacao: async (avaliacao) => {
    const { data: userAuth } = await supabase.auth.getUser();
    const userId = userAuth?.user?.id || null;
    
    const { error } = await supabase.from('avaliacoes').insert({
      produto_id: avaliacao.produtoId,
      usuario_id: userId,
      usuario_nome: avaliacao.usuario,
      nota: avaliacao.nota,
      comentario: avaliacao.texto,
      status: avaliacao.status || 'pendente',
      loja_id: avaliacao.lojaId || null
    });
    if (!error) {
      await get().loadAvaliacoes();
    }
  },
  
  removeAvaliacao: async (id) => {
    const { error } = await supabase.from('avaliacoes').delete().eq('id', id);
    if (!error) {
      await get().loadAvaliacoes();
    }
  },
  
  updateAvaliacao: async (id, updates) => {
    const dbUpdate: any = {};
    if (updates.texto !== undefined) dbUpdate.comentario = updates.texto;
    if (updates.nota !== undefined) dbUpdate.nota = updates.nota;
    if (updates.status !== undefined) dbUpdate.status = updates.status;
    
    const { error } = await supabase.from('avaliacoes').update(dbUpdate).eq('id', id);
    if (!error) {
      await get().loadAvaliacoes();
    }
  },
  
  getAvaliacoesPorProduto: (produtoId) => {
    return get().avaliacoes.filter((a) => a.produtoId === produtoId);
  },
  
  updateAvaliacaoStatus: async (id, status) => {
    const { error } = await supabase.from('avaliacoes').update({ status }).eq('id', id);
    if (!error) {
      await get().loadAvaliacoes();
    }
  },
  
  duplicateAvaliacaoToProducts: async (avaliacaoId, productIds) => {
    const source = get().avaliacoes.find(a => a.id === avaliacaoId);
    if (!source) return;
    
    const { data: userAuth } = await supabase.auth.getUser();
    const userId = userAuth?.user?.id || null;

    const rows = productIds.map(pid => ({
      produto_id: pid,
      usuario_id: userId,
      usuario_nome: source.usuario,
      nota: source.nota,
      comentario: source.texto,
      status: source.status,
      loja_id: source.lojaId || null
    }));
    
    const { error } = await supabase.from('avaliacoes').insert(rows);
    if (!error) {
      await get().loadAvaliacoes();
    }
  }
}));

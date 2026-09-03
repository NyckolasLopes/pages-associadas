import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import { supabase } from "@/integrations/supabase/client";

export interface WaitlistEntry {
  id: string;
  lojaId: string;
  lojaNome?: string;
  clienteNome: string;
  whatsapp: string;
  produtoId: string;
  produtoNome: string;
  produtoImagem?: string;
  quantidade: number;
  precoMomento?: number;
  mensagem?: string;
  status: 'pendente' | 'avisado' | 'cancelado';
  data: string;
  notificadoEm?: string;
}

interface WaitlistStore {
  entries: WaitlistEntry[];
  loading: boolean;
  addEntry: (entry: {
    lojaId: string;
    lojaNome?: string;
    clienteNome: string;
    whatsapp: string;
    produtoId: string;
    produtoNome: string;
    produtoImagem?: string;
    quantidade?: number;
    precoMomento?: number;
    mensagem?: string;
    status?: 'pendente' | 'avisado' | 'cancelado';
  }) => Promise<WaitlistEntry>;
  fetchEntries: (lojaId?: string) => Promise<WaitlistEntry[]>;
  updateStatus: (id: string, status: 'pendente' | 'avisado' | 'cancelado') => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
}

const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === "undefined") return null;
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === "undefined") return;
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof window === "undefined") return;
    await del(name);
  },
};

export const useWaitlist = create<WaitlistStore>()(
  persist(
    (set, get) => ({
      entries: [],
      loading: false,

      fetchEntries: async (lojaId?: string) => {
        set({ loading: true });
        try {
          let query = supabase
            .from("lista_espera" as any)
            .select("*")
            .order("created_at", { ascending: false });

          if (lojaId && lojaId !== "all") {
            query = query.eq("loja_id", lojaId);
          }

          const { data, error } = await query;
          if (error) {
            console.warn("Aviso ao buscar lista_espera no Supabase:", error.message);
            set({ loading: false });
            return get().entries;
          }

          if (data && Array.isArray(data)) {
            const mapped: WaitlistEntry[] = data.map((row: any) => ({
              id: String(row.id),
              lojaId: String(row.loja_id || ""),
              lojaNome: row.loja_nome || "",
              clienteNome: row.cliente_nome || "Cliente",
              whatsapp: row.whatsapp || "",
              produtoId: String(row.produto_id || ""),
              produtoNome: row.produto_nome || "Produto Indisponível",
              produtoImagem: row.produto_imagem || "",
              quantidade: Number(row.quantidade) || 1,
              precoMomento: row.preco_momento ? Number(row.preco_momento) : undefined,
              mensagem: row.mensagem || "",
              status: (row.status as any) || "pendente",
              data: row.created_at || new Date().toISOString(),
              notificadoEm: row.notificado_em || undefined,
            }));

            set({ entries: mapped, loading: false });
            return mapped;
          }
        } catch (err) {
          console.error("Erro inesperado ao buscar lista_espera:", err);
        } finally {
          set({ loading: false });
        }
        return get().entries;
      },

      addEntry: async (entry) => {
        const tempId = `wl-${Date.now()}`;
        const newEntry: WaitlistEntry = {
          id: tempId,
          lojaId: entry.lojaId,
          lojaNome: entry.lojaNome || "",
          clienteNome: entry.clienteNome,
          whatsapp: entry.whatsapp,
          produtoId: entry.produtoId,
          produtoNome: entry.produtoNome,
          produtoImagem: entry.produtoImagem || "",
          quantidade: entry.quantidade || 1,
          precoMomento: entry.precoMomento,
          mensagem: entry.mensagem,
          status: entry.status || "pendente",
          data: new Date().toISOString(),
        };

        // Atualização otimista
        set((state) => ({
          entries: [newEntry, ...state.entries.filter((e) => e.id !== tempId)],
        }));

        try {
          const { data, error } = await supabase
            .from("lista_espera" as any)
            .insert({
              loja_id: entry.lojaId,
              loja_nome: entry.lojaNome || "",
              cliente_nome: entry.clienteNome,
              whatsapp: entry.whatsapp,
              produto_id: entry.produtoId,
              produto_nome: entry.produtoNome,
              produto_imagem: entry.produtoImagem || "",
              quantidade: entry.quantidade || 1,
              preco_momento: entry.precoMomento || null,
              mensagem: entry.mensagem || "",
              status: entry.status || "pendente",
            })
            .select()
            .single();

          if (data && !error) {
            const persistedEntry: WaitlistEntry = {
              ...newEntry,
              id: String(data.id),
              data: data.created_at || newEntry.data,
            };

            set((state) => ({
              entries: state.entries.map((e) => (e.id === tempId ? persistedEntry : e)),
            }));
            return persistedEntry;
          }
        } catch (err) {
          console.warn("Não foi possível persistir no Supabase imediatamente:", err);
        }

        return newEntry;
      },

      updateStatus: async (id: string, status: 'pendente' | 'avisado' | 'cancelado') => {
        const notificadoEm = status === 'avisado' ? new Date().toISOString() : undefined;
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, status, notificadoEm: notificadoEm || e.notificadoEm } : e
          ),
        }));

        try {
          await supabase
            .from("lista_espera" as any)
            .update({
              status,
              ...(status === 'avisado' ? { notificado_em: notificadoEm } : {}),
            })
            .eq("id", id);
        } catch (err) {
          console.error("Erro ao atualizar status na lista_espera:", err);
        }
      },

      removeEntry: async (id: string) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));

        try {
          await supabase.from("lista_espera" as any).delete().eq("id", id);
        } catch (err) {
          console.error("Erro ao remover da lista_espera:", err);
        }
      },
    }),
    {
      name: "waitlist-storage",
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
    }
  )
);

if (typeof window !== "undefined") {
  useWaitlist.persist.rehydrate();
}

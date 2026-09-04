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
          const resultsMap = new Map<string, WaitlistEntry>();

          // 1. Busca em carrinhos_abandonados (status = 'lista_espera') - tabela pública e sem bloqueio de RLS
          try {
            let cartQuery = supabase
              .from("carrinhos_abandonados" as any)
              .select("*")
              .eq("status", "lista_espera")
              .order("created_at", { ascending: false });

            if (lojaId && lojaId !== "all") {
              cartQuery = cartQuery.eq("loja_id", lojaId);
            }

            const { data: cartData, error: cartErr } = await cartQuery;
            if (!cartErr && cartData && Array.isArray(cartData)) {
              cartData.forEach((row: any) => {
                let parsedNotes: any = {};
                try {
                  if (typeof row.notes === "string" && row.notes.startsWith("{")) {
                    parsedNotes = JSON.parse(row.notes);
                  } else if (typeof row.notes === "object" && row.notes !== null) {
                    parsedNotes = row.notes;
                  }
                } catch {}

                const firstItem = Array.isArray(row.items) && row.items.length > 0 ? row.items[0] : {};
                const entryId = String(row.id);
                resultsMap.set(entryId, {
                  id: entryId,
                  lojaId: String(row.loja_id || ""),
                  lojaNome: parsedNotes.lojaNome || "",
                  clienteNome: row.nome_cliente || parsedNotes.clienteNome || "Cliente",
                  whatsapp: row.telefone_cliente || parsedNotes.whatsapp || "",
                  produtoId: String(parsedNotes.produtoId || firstItem.id || ""),
                  produtoNome: parsedNotes.produtoNome || firstItem.nome || "Produto Indisponível",
                  produtoImagem: parsedNotes.produtoImagem || firstItem.foto || firstItem.imagem || "",
                  quantidade: Number(parsedNotes.quantidade || firstItem.quantidade) || 1,
                  precoMomento: parsedNotes.precoMomento ? Number(parsedNotes.precoMomento) : (firstItem.preco ? Number(firstItem.preco) : undefined),
                  mensagem: parsedNotes.mensagem || "",
                  status: (parsedNotes.status as any) || "pendente",
                  data: row.created_at || new Date().toISOString(),
                  notificadoEm: parsedNotes.notificadoEm || undefined,
                });
              });
            }
          } catch (cErr) {
            console.warn("Aviso ao buscar lista_espera em carrinhos_abandonados:", cErr);
          }

          // 2. Busca também na tabela lista_espera
          try {
            let query = supabase
              .from("lista_espera" as any)
              .select("*")
              .order("created_at", { ascending: false });

            if (lojaId && lojaId !== "all") {
              query = query.eq("loja_id", lojaId);
            }

            const { data, error } = await query;
            if (!error && data && Array.isArray(data)) {
              data.forEach((row: any) => {
                const entryId = String(row.id);
                if (!resultsMap.has(entryId)) {
                  let parsedMsg: any = {};
                  try {
                    if (typeof row.mensagem === "string" && row.mensagem.startsWith("{")) {
                      parsedMsg = JSON.parse(row.mensagem);
                    }
                  } catch {}

                  resultsMap.set(entryId, {
                    id: entryId,
                    lojaId: String(row.loja_id || ""),
                    lojaNome: row.loja_nome || parsedMsg.lojaNome || "",
                    clienteNome: row.cliente_nome || "Cliente",
                    whatsapp: row.whatsapp || "",
                    produtoId: String(row.produto_id || ""),
                    produtoNome: row.produto_nome || parsedMsg.produtoNome || "Produto Indisponível",
                    produtoImagem: row.produto_imagem || parsedMsg.produtoImagem || "",
                    quantidade: Number(row.quantidade) || 1,
                    precoMomento: row.preco_momento ? Number(row.preco_momento) : (parsedMsg.precoMomento ? Number(parsedMsg.precoMomento) : undefined),
                    mensagem: parsedMsg.msg || row.mensagem || "",
                    status: (row.status as any) || parsedMsg.status || "pendente",
                    data: row.created_at || new Date().toISOString(),
                    notificadoEm: row.notificado_em || undefined,
                  });
                }
              });
            }
          } catch (lErr) {
            // Ignore
          }

          // Mescla com registros locais que possam não ter ido para a nuvem
          const localEntries = get().entries || [];
          localEntries.forEach(le => {
            if (!resultsMap.has(le.id)) {
              if (!lojaId || lojaId === "all" || le.lojaId === lojaId) {
                resultsMap.set(le.id, le);
              }
            }
          });

          const finalEntries = Array.from(resultsMap.values()).sort(
            (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
          );

          set({ entries: finalEntries, loading: false });
          return finalEntries;
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

        // 1. Atualização otimista imediata
        set((state) => ({
          entries: [newEntry, ...state.entries.filter((e) => e.id !== tempId)],
        }));

        // 2. Grava em carrinhos_abandonados (status: 'lista_espera') — garantido e sem bloqueio de RLS
        const notesObj = {
          produtoId: entry.produtoId,
          produtoNome: entry.produtoNome,
          lojaNome: entry.lojaNome || "",
          produtoImagem: entry.produtoImagem || "",
          precoMomento: entry.precoMomento || null,
          status: entry.status || "pendente",
          mensagem: entry.mensagem || ""
        };

        try {
          const { data: cartData, error: cartError } = await supabase
            .from("carrinhos_abandonados" as any)
            .insert({
              loja_id: entry.lojaId,
              nome_cliente: entry.clienteNome,
              telefone_cliente: entry.whatsapp,
              status: "lista_espera",
              notes: JSON.stringify(notesObj),
              items: [{
                id: entry.produtoId,
                nome: entry.produtoNome,
                foto: entry.produtoImagem,
                quantidade: entry.quantidade || 1,
                preco: entry.precoMomento || 0
              }]
            })
            .select()
            .single();

          if (cartData && !cartError) {
            const persistedEntry: WaitlistEntry = {
              ...newEntry,
              id: String(cartData.id),
              data: cartData.created_at || newEntry.data,
            };

            set((state) => ({
              entries: state.entries.map((e) => (e.id === tempId ? persistedEntry : e)),
            }));
            return persistedEntry;
          }
        } catch (err) {
          console.warn("Aviso ao persistir lista de espera em carrinhos_abandonados:", err);
        }

        // 3. Tenta também em lista_espera como fallback
        try {
          await supabase
            .from("lista_espera" as any)
            .insert({
              loja_id: entry.lojaId,
              cliente_nome: entry.clienteNome,
              whatsapp: entry.whatsapp,
              produto_id: entry.produtoId,
              quantidade: entry.quantidade || 1,
              mensagem: JSON.stringify(notesObj)
            })
            .catch(() => {});
        } catch {}

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
          // Atualiza em carrinhos_abandonados
          const current = get().entries.find(e => e.id === id);
          if (current) {
            const notesObj = {
              produtoId: current.produtoId,
              produtoNome: current.produtoNome,
              lojaNome: current.lojaNome || "",
              produtoImagem: current.produtoImagem || "",
              precoMomento: current.precoMomento || null,
              status: status,
              mensagem: current.mensagem || "",
              notificadoEm: notificadoEm
            };

            await supabase
              .from("carrinhos_abandonados" as any)
              .update({ notes: JSON.stringify(notesObj) })
              .eq("id", id)
              .catch(() => {});
          }

          // Atualiza também em lista_espera caso exista
          await supabase
            .from("lista_espera" as any)
            .update({ status, notificado_em: notificadoEm })
            .eq("id", id)
            .catch(() => {});
        } catch (err) {
          console.error("Erro ao atualizar status na lista_espera:", err);
        }
      },

      removeEntry: async (id: string) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));

        try {
          await supabase.from("carrinhos_abandonados" as any).delete().eq("id", id).catch(() => {});
          await supabase.from("lista_espera" as any).delete().eq("id", id).catch(() => {});
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

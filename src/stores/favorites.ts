import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";

export interface FavNotification {
  id: string;
  oldPrice: number;
  newPrice: number;
  storeName: string;
  productName?: string;
}

interface FavState {
  ids: string[];
  prices: Record<string, number>;
  notifications: FavNotification[];
  wasOutOfStock: Record<string, boolean>;
  toggle: (id: string | number, preco?: number, isOutOfStock?: boolean) => void;
  has: (id: string | number) => boolean;
  updatePrice: (id: string | number, preco: number) => void;
  addNotification: (id: string, oldPrice: number, newPrice: number, storeName: string, productName?: string) => void;
  clearNotifications: () => void;
  clearAll: () => void;
  markOutOfStock: (id: string | number, outOfStock: boolean) => void;
  mergeIds: (ids: string[]) => void;
  syncWithSupabase: (userId?: string) => Promise<void>;
}

export const useFavorites = create<FavState>()(
  persist(
    (set, get) => ({
      ids: [],
      prices: {},
      notifications: [],
      wasOutOfStock: {},
      toggle: (id, preco = 0, isOutOfStock = false) => {
        const strId = String(id).trim();
        if (!strId) return;

        const currentIds = get().ids.map(String);
        const isRemoving = currentIds.includes(strId);
        const newIds = isRemoving ? currentIds.filter((x) => x !== strId) : [...currentIds, strId];
        const newPrices = { ...get().prices };
        const newOutOfStock = { ...get().wasOutOfStock };

        if (isRemoving) {
          delete newPrices[strId];
          delete newOutOfStock[strId];
        } else {
          newPrices[strId] = preco;
          if (isOutOfStock) {
            newOutOfStock[strId] = true;
          }
        }

        set({ ids: newIds, prices: newPrices, wasOutOfStock: newOutOfStock });

        // Sincroniza em segundo plano com Supabase se usuário estiver logado
        (async () => {
          try {
            const { data: authData } = await supabase.auth.getUser();
            const userId = authData?.user?.id;
            if (userId) {
              if (isRemoving) {
                await supabase.from("favoritos").delete().eq("user_id", userId).eq("produto_id", strId);
              } else {
                await supabase.from("favoritos").upsert({ user_id: userId, produto_id: strId } as any, { onConflict: "user_id,produto_id" as any });
              }
            }
          } catch (err) {
            console.warn("Erro ao sincronizar favorito no Supabase:", err);
          }
        })();
      },
      has: (id) => {
        const strId = String(id).trim();
        return get().ids.map(String).includes(strId);
      },
      updatePrice: (id, preco) => {
        const strId = String(id).trim();
        set((s) => ({
          prices: { ...s.prices, [strId]: preco }
        }));
      },
      addNotification: (id, oldPrice, newPrice, storeName, productName) =>
        set((s) => {
          const strId = String(id).trim();
          const filtered = s.notifications.filter((n) => n.id !== strId);
          return { notifications: [{ id: strId, oldPrice, newPrice, storeName, productName }, ...filtered] };
        }),
      clearNotifications: () => set({ notifications: [] }),
      clearAll: () => set({ ids: [], prices: {}, notifications: [], wasOutOfStock: {} }),
      markOutOfStock: (id, outOfStock) => {
        const strId = String(id).trim();
        set((s) => ({
          wasOutOfStock: { ...s.wasOutOfStock, [strId]: outOfStock }
        }));
      },
      mergeIds: (newIds) => {
        const currentIds = get().ids.map(String);
        const combined = Array.from(new Set([...currentIds, ...newIds.map(String).map(s => s.trim()).filter(Boolean)]));
        set({ ids: combined });
      },
      syncWithSupabase: async (userIdParam?: string) => {
        try {
          let userId = userIdParam;
          if (!userId) {
            const { data: authData } = await supabase.auth.getUser();
            userId = authData?.user?.id;
          }
          if (!userId) return;

          const { data, error } = await supabase
            .from("favoritos")
            .select("produto_id")
            .eq("user_id", userId);

          if (!error && data) {
            const dbIds = data.map((d: any) => String(d.produto_id).trim()).filter(Boolean);
            get().mergeIds(dbIds);
          }
        } catch (err) {
          console.warn("Erro ao carregar favoritos do Supabase:", err);
        }
      },
    }),
    { 
      name: "fa-favorites",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Migration safeguard: se o localStorage estava vazio, tenta recuperar do idbStorage uma vez
        if (state && (!state.ids || state.ids.length === 0)) {
          if (typeof window !== "undefined" && window.indexedDB) {
            try {
              const req = indexedDB.open("fa-admin-db", 1);
              req.onsuccess = (e: any) => {
                const db = e.target.result;
                if (db.objectStoreNames && db.objectStoreNames.contains("keyval")) {
                  const tx = db.transaction("keyval", "readonly");
                  const store = tx.objectStore("keyval");
                  const getReq = store.get("fa-favorites");
                  getReq.onsuccess = () => {
                    if (getReq.result) {
                      try {
                        const parsed = JSON.parse(getReq.result);
                        if (parsed?.state?.ids && Array.isArray(parsed.state.ids) && parsed.state.ids.length > 0) {
                          useFavorites.setState({
                            ids: parsed.state.ids.map(String),
                            prices: parsed.state.prices || {},
                            notifications: parsed.state.notifications || [],
                          });
                        }
                      } catch {}
                    }
                  };
                }
              };
            } catch {}
          }
        }
        // Sincroniza com o Supabase após carregar
        state?.syncWithSupabase();
      }
    }
  ),
);

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { idbStorage } from "@/lib/idb";

interface FavState {
  ids: string[];
  prices: Record<string, number>;
  notifications: { id: string; oldPrice: number; newPrice: number; storeName: string }[];
  toggle: (id: string, preco?: number) => void;
  has: (id: string) => boolean;
  updatePrice: (id: string, preco: number) => void;
  addNotification: (id: string, oldPrice: number, newPrice: number, storeName: string) => void;
  clearNotifications: () => void;
}

export const useFavorites = create<FavState>()(
  persist(
    (set, get) => ({
      ids: [],
      prices: {},
      notifications: [],
      toggle: (id, preco = 0) =>
        set((s) => {
          const isRemoving = s.ids.includes(id);
          const newIds = isRemoving ? s.ids.filter((x) => x !== id) : [...s.ids, id];
          const newPrices = { ...s.prices };
          if (isRemoving) {
            delete newPrices[id];
          } else {
            newPrices[id] = preco;
          }
          return { ids: newIds, prices: newPrices };
        }),
      has: (id) => get().ids.includes(id),
      updatePrice: (id, preco) =>
        set((s) => ({
          prices: { ...s.prices, [id]: preco }
        })),
      addNotification: (id, oldPrice, newPrice, storeName) =>
        set((s) => {
          // Remove existing notification for this id if any
          const filtered = s.notifications.filter(n => n.id !== id);
          return { notifications: [{ id, oldPrice, newPrice, storeName }, ...filtered] };
        }),
      clearNotifications: () => set({ notifications: [] }),
    }),
    { 
      name: "fa-favorites",
      storage: createJSONStorage(() => idbStorage)
    }
  ),
);

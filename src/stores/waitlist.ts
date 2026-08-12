import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";

export interface WaitlistEntry {
  id: string;
  produtoId: string;
  clienteNome: string;
  whatsapp: string;
  data: string;
  quantidade?: number;
  mensagem?: string;
}

interface WaitlistStore {
  entries: WaitlistEntry[];
  addEntry: (entry: Omit<WaitlistEntry, "id" | "data">) => void;
  removeEntry: (id: string) => void;
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
    (set) => ({
      entries: [],
      addEntry: (entry) => set((state) => ({
        entries: [
          {
            ...entry,
            id: `wl-${Date.now()}`,
            data: new Date().toISOString(),
          },
          ...state.entries
        ]
      })),
      removeEntry: (id) => set((state) => ({
        entries: state.entries.filter((e) => e.id !== id)
      })),
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

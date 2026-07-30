import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Region {
  id: string;
  name: string;
}

interface RegionsState {
  regions: Region[];
  prices: Record<string, number>; // key format: "regionId-productId"
  addRegion: (region: Region) => void;
  removeRegion: (id: string) => void;
  setPrice: (regionId: string, productId: string, price: number) => void;
  setPrices: (newPrices: Record<string, number>) => void;
}

export const useRegionsStore = create<RegionsState>()(
  persist(
    (set) => ({
      regions: [
        { id: "poa", name: "Matriz (Poa)" },
        { id: "interior_rs", name: "Interior RS" },
      ],
      prices: {},
      addRegion: (region) => set((state) => ({ regions: [...state.regions, region] })),
      removeRegion: (id) => set((state) => ({
        regions: state.regions.filter((r) => r.id !== id),
        prices: Object.fromEntries(Object.entries(state.prices).filter(([k]) => !k.startsWith(`${id}-`)))
      })),
      setPrice: (regionId, productId, price) => set((state) => ({
        prices: { ...state.prices, [`${regionId}-${productId}`]: price }
      })),
      setPrices: (newPrices) => set((state) => ({
        prices: { ...state.prices, ...newPrices }
      }))
    }),
    { name: "fa-regions-store-v1" }
  )
);

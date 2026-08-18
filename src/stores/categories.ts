import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { Categoria } from "@/types";

interface CategoriesState {
  categories: Categoria[];
  storeCategories: Record<string, Categoria[]>;
  isStoreUsingCustomCategories: Record<string, boolean>;
  loadCategories: () => Promise<void>;
  addOrUpdateCategory: (c: Categoria) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  importNetworkCategoriesToStore: (lojaId: string) => void;
  addOrUpdateStoreCategory: (lojaId: string, c: Categoria) => void;
  removeStoreCategory: (lojaId: string, id: string) => void;
  resetStoreToNetwork: (lojaId: string) => void;
  getStoreCategories: (lojaId?: string | null) => Categoria[];
}

export const useAdminCategories = create<CategoriesState>((set, get) => ({
  categories: [],
  storeCategories: {},
  isStoreUsingCustomCategories: {},

  loadCategories: async () => {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('destaque', { ascending: false });
      
    if (!error && data) {
      const mapped = data.map((d: any) => ({
        id: d.id,
        nome: d.nome,
        slug: d.slug,
        parentId: d.parent_id,
        descricaoHtml: d.descricao_html,
        ativa: d.ativa,
        loja_id: d.loja_id,
        global_pleno: d.global_pleno
      }));
      set({ categories: mapped as Categoria[] });
    }
  },

  addOrUpdateCategory: async (c: Categoria & { loja_id?: string; global_pleno?: boolean }) => {
    // Optimistic
    set((s) => {
      const exists = s.categories.find(x => x.id === c.id);
      if (exists) {
        return { categories: s.categories.map(x => x.id === c.id ? c : x) };
      }
      return { categories: [...s.categories, c] };
    });

    const { error } = await supabase.from('categorias' as any).upsert({
        id: c.id,
        nome: c.nome,
        slug: c.slug,
        parent_id: c.parentId || null,
        descricao_html: c.descricaoHtml || null,
        ativa: c.ativa !== false,
        loja_id: c.loja_id || null,
        global_pleno: c.global_pleno !== false
    });
    
    if (error) {
      console.error("Error upserting category:", error);
    }
  },

  removeCategory: async (id) => {
    set((s) => ({ categories: s.categories.filter(x => x.id !== id) }));
    const { error } = await supabase.from('categorias').delete().eq('id', id);
  },

  importNetworkCategoriesToStore: (lojaId) => {
    const s = get();
    set({
      storeCategories: { ...s.storeCategories, [lojaId]: [...s.categories] },
      isStoreUsingCustomCategories: { ...s.isStoreUsingCustomCategories, [lojaId]: true }
    });
  },

  addOrUpdateStoreCategory: (lojaId, c) => {
    const s = get();
    const current = s.storeCategories[lojaId] || [];
    const exists = current.find(x => x.id === c.id);
    let next: Categoria[];
    
    if (exists) {
      next = current.map(x => x.id === c.id ? c : x);
    } else {
      next = [...current, c];
    }
    
    set({
      storeCategories: { ...s.storeCategories, [lojaId]: next },
      isStoreUsingCustomCategories: { ...s.isStoreUsingCustomCategories, [lojaId]: true }
    });
  },

  removeStoreCategory: (lojaId, id) => {
    const s = get();
    const current = s.storeCategories[lojaId] || [];
    
    const childrenIds = current.filter(x => x.parentId === id).map(x => x.id);
    const next = current.filter(x => x.id !== id && !childrenIds.includes(x.id));
    
    set({
      storeCategories: { ...s.storeCategories, [lojaId]: next },
      isStoreUsingCustomCategories: { ...s.isStoreUsingCustomCategories, [lojaId]: true }
    });
  },

  resetStoreToNetwork: (lojaId) => {
    const s = get();
    const nextStoreCats = { ...s.storeCategories };
    delete nextStoreCats[lojaId];
    
    const nextFlags = { ...s.isStoreUsingCustomCategories };
    nextFlags[lojaId] = false;
    
    set({
      storeCategories: nextStoreCats,
      isStoreUsingCustomCategories: nextFlags
    });
  },

  getStoreCategories: (lojaId) => {
    const s = get();
    if (!lojaId || !s.isStoreUsingCustomCategories[lojaId]) {
      return s.categories;
    }
    return s.storeCategories[lojaId] || [];
  }
}));

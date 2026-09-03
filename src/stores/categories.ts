import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";
import type { Categoria } from "@/types";

interface CategoriesState {
  categories: Categoria[];
  storeCategories: Record<string, Categoria[]>;
  isStoreUsingCustomCategories: Record<string, boolean>;
  loadCategories: () => Promise<void>;
  addOrUpdateCategory: (c: Categoria & { loja_id?: string; global_pleno?: boolean }) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  importNetworkCategoriesToStore: (lojaId: string) => void;
  addOrUpdateStoreCategory: (lojaId: string, c: Categoria) => Promise<void>;
  removeStoreCategory: (lojaId: string, id: string) => Promise<void>;
  resetStoreToNetwork: (lojaId: string) => void;
  getStoreCategories: (lojaId?: string | null) => Categoria[];
}

export const useAdminCategories = create<CategoriesState>()(
  persist(
    (set, get) => ({
      categories: [],
      storeCategories: {},
      isStoreUsingCustomCategories: {},

      loadCategories: async () => {
        try {
          const { data, error } = await supabase
            .from('categorias')
            .select('*')
            .order('destaque', { ascending: false });
            
          if (!error && data) {
            const mapped = data.map((d: any) => ({
              id: String(d.id),
              nome: d.nome,
              slug: d.slug,
              parentId: d.parent_id,
              descricaoHtml: d.descricao_html,
              ativa: d.ativa !== false,
              destaque: d.destaque ?? false,
              loja_id: d.loja_id,
              global_pleno: d.global_pleno !== false
            }));

            const network = mapped.filter(c => !c.loja_id);
            const storeMap: Record<string, Categoria[]> = { ...get().storeCategories };
            mapped.forEach(c => {
              if (c.loja_id) {
                if (!storeMap[c.loja_id]) storeMap[c.loja_id] = [];
                const idx = storeMap[c.loja_id].findIndex(x => x.id === c.id);
                if (idx >= 0) {
                  storeMap[c.loja_id][idx] = c;
                } else {
                  storeMap[c.loja_id].push(c);
                }
              }
            });

            set({ categories: network, storeCategories: storeMap });
          }
        } catch (e) {
          console.warn("Erro ao carregar categorias:", e);
        }
      },

      addOrUpdateCategory: async (c: Categoria & { loja_id?: string; global_pleno?: boolean }) => {
        // Optimistic
        set((s) => {
          const exists = s.categories.find(x => x.id === c.id);
          if (exists) {
            return { categories: s.categories.map(x => x.id === c.id ? { ...x, ...c } : x) };
          }
          return { categories: [...s.categories, c] };
        });

        try {
          const { error } = await supabase.from('categorias' as any).upsert({
            id: c.id,
            nome: c.nome,
            slug: c.slug,
            parent_id: c.parentId || null,
            descricao_html: c.descricaoHtml || null,
            ativa: c.ativa !== false,
            destaque: c.destaque ?? false,
            loja_id: c.loja_id || null,
            global_pleno: c.global_pleno !== false,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
          
          if (error) {
            console.error("Error upserting category:", error);
          }
        } catch (err) {
          console.error("Exception upserting category:", err);
        }
      },

      removeCategory: async (id: string) => {
        set((s) => {
          const childrenIds = s.categories.filter(x => x.parentId === id).map(x => x.id);
          return { 
            categories: s.categories.filter(x => x.id !== id && !childrenIds.includes(x.id)) 
          };
        });
        try {
          await supabase.from('categorias').delete().eq('parent_id', id);
          const { error } = await supabase.from('categorias').delete().eq('id', id);
          if (error) {
            console.error("Error removing category:", error);
          }
        } catch (err) {
          console.error("Exception removing category:", err);
        }
      },

      importNetworkCategoriesToStore: (lojaId: string) => {
        const s = get();
        set({
          storeCategories: { ...s.storeCategories, [lojaId]: [...s.categories] },
          isStoreUsingCustomCategories: { ...s.isStoreUsingCustomCategories, [lojaId]: true }
        });
      },

      addOrUpdateStoreCategory: async (lojaId: string, c: Categoria) => {
        const s = get();
        const current = s.storeCategories[lojaId] || [...s.categories];
        const exists = current.find(x => x.id === c.id);
        let next: Categoria[];
        
        if (exists) {
          next = current.map(x => x.id === c.id ? { ...x, ...c, loja_id: lojaId } : x);
        } else {
          next = [...current, { ...c, loja_id: lojaId }];
        }
        
        set({
          storeCategories: { ...s.storeCategories, [lojaId]: next },
          isStoreUsingCustomCategories: { ...s.isStoreUsingCustomCategories, [lojaId]: true }
        });

        try {
          await supabase.from('categorias' as any).upsert({
            id: c.id,
            nome: c.nome,
            slug: c.slug,
            parent_id: c.parentId || null,
            descricao_html: c.descricaoHtml || null,
            ativa: c.ativa !== false,
            destaque: c.destaque ?? false,
            loja_id: lojaId,
            global_pleno: false,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        } catch (err) {
          console.error("Error saving store category to Supabase:", err);
        }
      },

      removeStoreCategory: async (lojaId: string, id: string) => {
        const s = get();
        const current = s.storeCategories[lojaId] || [];
        
        const childrenIds = current.filter(x => x.parentId === id).map(x => x.id);
        const next = current.filter(x => x.id !== id && !childrenIds.includes(x.id));
        
        set({
          storeCategories: { ...s.storeCategories, [lojaId]: next },
          isStoreUsingCustomCategories: { ...s.isStoreUsingCustomCategories, [lojaId]: true }
        });

        try {
          await supabase.from('categorias').delete().eq('id', id);
        } catch {}
      },

      resetStoreToNetwork: (lojaId: string) => {
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

      getStoreCategories: (lojaId?: string | null) => {
        const s = get();
        if (!lojaId) {
          return s.categories;
        }
        if (s.storeCategories[lojaId] && s.storeCategories[lojaId].length > 0) {
          return s.storeCategories[lojaId];
        }
        return s.categories;
      }
    }),
    {
      name: 'admin-categories-storage-v2'
    }
  )
);

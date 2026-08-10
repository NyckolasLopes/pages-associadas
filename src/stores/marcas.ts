import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { Marca } from "@/types";

interface MarcasState {
  marcas: Marca[];
  loadMarcas: () => Promise<void>;
  addMarca: (m: Omit<Marca, 'global_pleno' | 'loja_id'> & { loja_id?: string; global_pleno?: boolean }) => Promise<void>;
  updateMarca: (m: Omit<Marca, 'global_pleno' | 'loja_id'> & { loja_id?: string; global_pleno?: boolean }) => Promise<void>;
  removeMarca: (id: string) => Promise<void>;
  getStoreEffectiveMarcas: (lojaId?: string) => Marca[];
}

function mapRowToMarca(d: any): Marca {
  return {
    id: d.id,
    nome: d.nome,
    slug: d.slug,
    descricao: d.descricao,
    logo: d.logo,
    ativo: d.ativo,
    destaque: d.destaque,
    seoUrl: d.seo_url,
    marcaPropria: d.marca_propria,
    loja_id: d.loja_id,
    global_pleno: d.global_pleno,
  };
}

export const useMarcasStore = create<MarcasState>((set, get) => ({
  marcas: [],

  loadMarcas: async () => {
    const { data, error } = await supabase
      .from('marcas' as any)
      .select('*')
      .order('nome', { ascending: true });

    if (!error && data) {
      set({ marcas: data.map(mapRowToMarca) });
    }
  },

  addMarca: async (m) => {
    const { error } = await supabase.from('marcas' as any).upsert({
      id: m.id,
      nome: m.nome,
      slug: m.slug,
      descricao: m.descricao || null,
      logo: m.logo || null,
      ativo: m.ativo !== false,
      destaque: m.destaque || false,
      seo_url: m.seoUrl || null,
      marca_propria: m.marcaPropria || false,
      loja_id: m.loja_id || null,
      global_pleno: m.global_pleno || false,
    });
    if (!error) {
      get().loadMarcas();
    }
  },

  updateMarca: async (m) => {
    const { error } = await supabase.from('marcas' as any).update({
      nome: m.nome,
      slug: m.slug,
      descricao: m.descricao || null,
      logo: m.logo || null,
      ativo: m.ativo !== false,
      destaque: m.destaque || false,
      seo_url: m.seoUrl || null,
      marca_propria: m.marcaPropria || false,
      loja_id: m.loja_id || null,
      global_pleno: m.global_pleno || false,
    }).eq('id', m.id);
    if (!error) {
      get().loadMarcas();
    }
  },

  removeMarca: async (id) => {
    const { error } = await supabase.from('marcas' as any).delete().eq('id', id);
    if (!error) {
      get().loadMarcas();
    }
  },

  getStoreEffectiveMarcas: (lojaId?: string) => {
    const state = get();
    return state.marcas.filter((m) => {
      if (lojaId) {
        return m.loja_id === lojaId || (m.global_pleno === true && !m.loja_id);
      }
      // If no store ID, return only global items
      return !m.loja_id;
    });
  }
}));

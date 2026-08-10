import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { Marca } from "@/types";

interface MarcasState {
  marcas: Marca[];
  loadMarcas: () => Promise<void>;
  addMarca: (m: Marca) => Promise<void>;
  updateMarca: (m: Marca) => Promise<void>;
  removeMarca: (id: string) => Promise<void>;
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
  };
}

export const useMarcasStore = create<MarcasState>((set, get) => ({
  marcas: [],

  loadMarcas: async () => {
    const { data, error } = await supabase
      .from('marcas')
      .select('*')
      .order('nome', { ascending: true });

    if (!error && data) {
      set({ marcas: data.map(mapRowToMarca) });
    }
  },

  addMarca: async (m) => {
    const { error } = await supabase.from('marcas').upsert({
      id: m.id,
      nome: m.nome,
      slug: m.slug,
      descricao: m.descricao || null,
      logo: m.logo || null,
      ativo: m.ativo !== false,
      destaque: m.destaque || false,
      seo_url: m.seoUrl || null,
      marca_propria: m.marcaPropria || false,
    });
    if (!error) {
      get().loadMarcas();
    }
  },

  updateMarca: async (m) => {
    const { error } = await supabase.from('marcas').update({
      nome: m.nome,
      slug: m.slug,
      descricao: m.descricao || null,
      logo: m.logo || null,
      ativo: m.ativo !== false,
      destaque: m.destaque || false,
      seo_url: m.seoUrl || null,
      marca_propria: m.marcaPropria || false,
    }).eq('id', m.id);
    if (!error) {
      get().loadMarcas();
    }
  },

  removeMarca: async (id) => {
    const { error } = await supabase.from('marcas').delete().eq('id', id);
    if (!error) {
      get().loadMarcas();
    }
  },
}));

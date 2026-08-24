import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { Marca } from "@/types";

interface MarcasState {
  marcas: Marca[];
  loadMarcas: () => Promise<void>;
  addMarca: (m: Omit<Marca, 'globalPleno' | 'loja_id'> & { loja_id?: string; globalPleno?: boolean }) => Promise<void>;
  updateMarca: (m: Omit<Marca, 'globalPleno' | 'loja_id'> & { loja_id?: string; globalPleno?: boolean }) => Promise<void>;
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
    globalPleno: d.global_pleno,
  };
}

const initialMarcas = [
  { id: "301", nome: "Revitart", slug: "revitart", descricao: "Produtos da linha Revitart.", logo: "/marcas/revitart.png", ativo: true, destaque: true, seoUrl: "revitart", marcaPropria: true, globalPleno: true },
  { id: "302", nome: "Santo Hábito", slug: "santo-habito", descricao: "Produtos da linha Santo Hábito.", logo: "/marcas/santo-habito.png", ativo: true, destaque: true, seoUrl: "santo-habito", marcaPropria: true, globalPleno: true },
  { id: "303", nome: "Revigore", slug: "revigore", descricao: "Produtos da linha Revigore.", logo: "/marcas/revigore.png", ativo: true, destaque: true, seoUrl: "revigore", marcaPropria: true, globalPleno: true },
  { id: "304", nome: "Revimel", slug: "revimel", descricao: "Produtos da linha Revimel.", logo: "/marcas/revimel.png", ativo: true, destaque: true, seoUrl: "revimel", marcaPropria: true, globalPleno: true },
  { id: "305", nome: "Crescendo", slug: "crescendo", descricao: "Produtos da linha Crescendo.", logo: "/marcas/crescendo.png", ativo: true, destaque: true, seoUrl: "crescendo", marcaPropria: true, globalPleno: true },
  { id: "306", nome: "Vita Magna", slug: "vita-magna", descricao: "Produtos da linha Vita Magna.", logo: "/marcas/vita-magna.png", ativo: true, destaque: true, seoUrl: "vita-magna", marcaPropria: true, globalPleno: true },
  { id: "m1", nome: "CIMED", slug: "cimed", descricao: "Produtos Cimed.", logo: "/marcas/cimed.png", ativo: true, destaque: true, seoUrl: "cimed", marcaPropria: false, globalPleno: true },
  { id: "m2", nome: "NEO QUÍMICA", slug: "neo-quimica", descricao: "Produtos Neo Química.", logo: "/marcas/neo-quimica.png", ativo: true, destaque: true, seoUrl: "neo-quimica", marcaPropria: false, globalPleno: true },
  { id: "m3", nome: "PFIZER", slug: "pfizer", descricao: "Produtos Pfizer.", logo: "/marcas/pfizer.png", ativo: true, destaque: true, seoUrl: "pfizer", marcaPropria: false, globalPleno: true },
  { id: "m4", nome: "ROCHE", slug: "roche", descricao: "Produtos Roche.", logo: "/marcas/roche.png", ativo: true, destaque: true, seoUrl: "roche", marcaPropria: false, globalPleno: true },
  { id: "m5", nome: "L'ORÉAL", slug: "loreal", descricao: "Produtos L'Oréal.", logo: "/marcas/loreal.png", ativo: true, destaque: true, seoUrl: "loreal", marcaPropria: false, globalPleno: true },
  { id: "m6", nome: "NIVEA", slug: "nivea", descricao: "Produtos Nivea.", logo: "/marcas/nivea.png", ativo: true, destaque: true, seoUrl: "nivea", marcaPropria: false, globalPleno: true },
  { id: "m7", nome: "VICK", slug: "vick", descricao: "Produtos Vick.", logo: "/marcas/vick.png", ativo: true, destaque: true, seoUrl: "vick", marcaPropria: false, globalPleno: true },
  { id: "m8", nome: "REXONA", slug: "rexona", descricao: "Produtos Rexona.", logo: "/marcas/rexona.png", ativo: true, destaque: true, seoUrl: "rexona", marcaPropria: false, globalPleno: true },
  { id: "m9", nome: "JOHNSON'S", slug: "johnsons", descricao: "Produtos Johnson's.", logo: "/marcas/johnsons.png", ativo: true, destaque: true, seoUrl: "johnsons", marcaPropria: false, globalPleno: true }
];

export const useMarcasStore = create<MarcasState>((set, get) => ({
  marcas: [],

  loadMarcas: async () => {
    const { data, error } = await supabase
      .from('marcas' as any)
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error("Erro ao carregar marcas, usando padrao fallback:", error);
      set({ marcas: initialMarcas as Marca[] });
    } else if (data && data.length === 0) {
      // Se estiver vazio, popula as marcas locais com os padrões
      set({ marcas: initialMarcas as Marca[] });
      
      // E tenta salvar em background no banco de dados (ignorando erros se for bloqueado por RLS)
      for (const m of initialMarcas) {
        supabase.from('marcas' as any).upsert({
          id: m.id,
          nome: m.nome,
          slug: m.slug,
          descricao: m.descricao,
          logo: m.logo,
          ativo: m.ativo,
          destaque: m.destaque,
          seo_url: m.seoUrl,
          marca_propria: m.marcaPropria,
          global_pleno: m.globalPleno
        }).then(({ error: upsertError }) => {
          if (upsertError) console.warn("Aviso ao tentar salvar marca padrao:", upsertError.message);
        });
      }
    } else if (data) {
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
      global_pleno: m.globalPleno || false,
    });
    if (error) {
      console.error("Erro addMarca:", error);
      throw error;
    }
    get().loadMarcas();
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
      global_pleno: m.globalPleno || false,
    }).eq('id', m.id);
    if (error) {
      console.error("Erro updateMarca:", error);
      throw error;
    }
    get().loadMarcas();
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
        return m.loja_id === lojaId || (m.globalPleno === true && !m.loja_id);
      }
      // If no store ID, return only global items
      return !m.loja_id;
    });
  }
}));

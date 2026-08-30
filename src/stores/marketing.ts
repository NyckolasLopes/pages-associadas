import { create } from "zustand";
import { supabase } from '@/integrations/supabase/client';

export interface Coupon {
  id: string;
  codigo: string;
  descricao: string;
  ativo: boolean;
  totalDisponiveis: number;
  valorMinimo: number;
  dataInicio: string; // ISO string
  dataTermino: string; // ISO string
  exigirMinItens: boolean;
  tipoDesconto: "percentual" | "fixo";
  valorDesconto: number;
  aplicarFreteGratis: boolean;
  aplicacaoAutomatica: boolean;
  permiteAcumular: boolean;
  usoUnico: boolean;
  cupomPrimeiraCompra: boolean;
  numeroUtilizacoes: number; // for display & tracking
  lojaId?: string; // Se preenchido, cupom exclusivo da loja
}

export interface LevePagueProdutoConfig {
  quantidade: number;
  precoPorItem: number;
}

export interface Promocao {
  id: string;
  titulo: string;
  subtitulo?: string;
  tipoAlvo: "produtos";
  alvosId: string[];
  dataFim: string; // ISO date string or yyyy-mm-dd
  horaFim: string; // HH:mm
  icone: string; // lucide icon name (flame, zap, gift, star, shopping-bag, percent, tag, clock)
  ativa: boolean;
  tipoCampanha?: "padrao" | "leve_pague";
  descontoPercentual?: number;
  precoPromocional?: number;
  levePague_quantidade?: number;
  levePague_precoPorItem?: number;
  produtosConfig?: Record<string, LevePagueProdutoConfig>;
  corSelo?: string;
  corIcone?: string;
  corTextoBotao?: string;
  corBotao?: string;
  corTimer?: string;
  textoBotao?: string;
  lojaId?: string; // empty/undefined for global network, or store ID
}

export interface MarketingStore {
  cupons: Coupon[];
  promocoes: Promocao[];
  lojaPromocoes: Record<string, Promocao[]>;
  marketingLoaded: boolean;
  loadMarketing: () => Promise<void>;
  addCoupon: (coupon: Omit<Coupon, "id" | "numeroUtilizacoes">) => Promise<void>;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => Promise<void>;
  removeCoupon: (id: string) => Promise<void>;
  addPromocao: (promocao: Omit<Promocao, "id">) => Promise<void>;
  updatePromocao: (id: string, promocao: Partial<Promocao>) => Promise<void>;
  removePromocao: (id: string) => Promise<void>;
  addLojaPromocao: (lojaId: string, promocao: Omit<Promocao, "id">) => Promise<void>;
  removeLojaPromocao: (lojaId: string, id: string) => Promise<void>;
  incrementCouponUsage: (codigo: string, lojaId?: string) => Promise<void>;
}

const CACHE_KEY = "fa-cached-marketing-v3";

const defaultCupons: Coupon[] = [];

function getInitialMarketing(): { cupons: Coupon[]; promocoes: Promocao[]; lojaPromocoes: Record<string, Promocao[]> } {
  if (typeof window === "undefined") {
    return { cupons: [], promocoes: [], lojaPromocoes: {} };
  }
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.cupons)) {
        return {
          cupons: parsed.cupons.length > 0 ? parsed.cupons : defaultCupons,
          promocoes: Array.isArray(parsed.promocoes) ? parsed.promocoes : [],
          lojaPromocoes: parsed.lojaPromocoes || {}
        };
      }
    }
  } catch (e) {
    console.error("Erro ao ler cache de marketing:", e);
  }
  return { cupons: defaultCupons, promocoes: [], lojaPromocoes: {} };
}

function saveMarketingCache(cupons: Coupon[], promocoes: Promocao[], lojaPromocoes: Record<string, Promocao[]>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ cupons, promocoes, lojaPromocoes }));
  } catch (e) {
    console.error("Erro ao salvar cache de marketing:", e);
  }
}

const initial = getInitialMarketing();

export const useMarketing = create<MarketingStore>((set, get) => ({
  cupons: initial.cupons,
  promocoes: initial.promocoes,
  lojaPromocoes: initial.lojaPromocoes,
  marketingLoaded: false,
  
  loadMarketing: async () => {
    try {
      const [ { data: cuponsData, error: cuponsErr }, { data: promocoesData, error: promosErr } ] = await Promise.all([
        supabase.from('cupons' as any).select('*').order('created_at', { ascending: false }),
        supabase.from('promocoes' as any).select('*').order('created_at', { ascending: false })
      ]);

      let parsedCupons: Coupon[] = [];
      if (cuponsData && !cuponsErr && cuponsData.length > 0) {
        parsedCupons = cuponsData.map((c: any) => ({
          id: String(c.id),
          codigo: String(c.codigo || '').toUpperCase(),
          descricao: c.descricao || '',
          ativo: c.ativo !== false,
          totalDisponiveis: Number(c.total_disponiveis) || 0,
          valorMinimo: parseFloat(c.valor_minimo) || 0,
          dataInicio: c.data_inicio || '',
          dataTermino: c.data_termino || '',
          exigirMinItens: Boolean(c.exigir_min_itens),
          tipoDesconto: c.tipo_desconto === "fixo" ? "fixo" : "percentual",
          valorDesconto: parseFloat(c.valor_desconto) || 0,
          aplicarFreteGratis: Boolean(c.aplicar_frete_gratis),
          aplicacaoAutomatica: Boolean(c.aplicacao_automatica),
          permiteAcumular: Boolean(c.permite_acumular),
          usoUnico: Boolean(c.uso_unico),
          cupomPrimeiraCompra: Boolean(c.cupom_primeira_compra),
          numeroUtilizacoes: Number(c.numero_utilizacoes) || 0,
          lojaId: c.loja_id || undefined
        }));
      } else if (get().cupons.length > 0) {
        parsedCupons = get().cupons;
      } else {
        parsedCupons = defaultCupons;
      }

      let parsedPromos: Promocao[] = [];
      let lojaPromos: Record<string, Promocao[]> = {};
      
      if (promocoesData && !promosErr && promocoesData.length > 0) {
        parsedPromos = promocoesData.map((p: any) => {
          const promo: Promocao = {
            id: String(p.id),
            titulo: p.titulo || '',
            subtitulo: p.subtitulo,
            tipoAlvo: p.tipo_alvo || 'produtos',
            alvosId: p.alvos_id || [],
            dataFim: p.data_fim || '',
            horaFim: p.hora_fim || '',
            icone: p.icone || 'flame',
            ativa: p.ativa !== false,
            tipoCampanha: p.tipo_campanha,
            descontoPercentual: p.desconto_percentual ? parseFloat(p.desconto_percentual) : undefined,
            precoPromocional: p.preco_promocional ? parseFloat(p.preco_promocional) : undefined,
            levePague_quantidade: p.leve_pague_quantidade,
            levePague_precoPorItem: p.leve_pague_preco_por_item ? parseFloat(p.leve_pague_preco_por_item) : undefined,
            produtosConfig: p.produtos_config,
            corSelo: p.cor_selo,
            corIcone: p.cor_icone,
            corTextoBotao: p.cor_texto_botao,
            corBotao: p.cor_botao,
            corTimer: p.produtos_config?.__corTimer || p.cor_botao || "#0f172a",
            textoBotao: p.texto_botao,
            lojaId: p.loja_id || undefined
          };
          
          if (promo.lojaId) {
            if (!lojaPromos[promo.lojaId]) lojaPromos[promo.lojaId] = [];
            lojaPromos[promo.lojaId].push(promo);
          }
          return promo;
        });
      } else if (get().promocoes.length > 0) {
        parsedPromos = get().promocoes;
        lojaPromos = get().lojaPromocoes;
      }

      set({ cupons: parsedCupons, promocoes: parsedPromos, lojaPromocoes: lojaPromos, marketingLoaded: true });
      saveMarketingCache(parsedCupons, parsedPromos, lojaPromos);
    } catch (e) {
      console.error("Erro ao carregar marketing:", e);
      set({ marketingLoaded: true });
    }
  },

  addCoupon: async (coupon) => {
    const newCoupon: Coupon = {
      id: "cupom-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      codigo: coupon.codigo.trim().toUpperCase(),
      descricao: coupon.descricao,
      ativo: coupon.ativo,
      totalDisponiveis: Number(coupon.totalDisponiveis) || 0,
      valorMinimo: Number(coupon.valorMinimo) || 0,
      dataInicio: coupon.dataInicio || "",
      dataTermino: coupon.dataTermino || "",
      exigirMinItens: Boolean(coupon.exigirMinItens),
      tipoDesconto: coupon.tipoDesconto,
      valorDesconto: Number(coupon.valorDesconto) || 0,
      aplicarFreteGratis: Boolean(coupon.aplicarFreteGratis),
      aplicacaoAutomatica: Boolean(coupon.aplicacaoAutomatica),
      permiteAcumular: Boolean(coupon.permiteAcumular),
      usoUnico: Boolean(coupon.usoUnico),
      cupomPrimeiraCompra: Boolean(coupon.cupomPrimeiraCompra),
      numeroUtilizacoes: 0,
      lojaId: coupon.lojaId || undefined
    };

    // 1. Atualiza memória e localStorage imediatamente
    const updatedCupons = [newCoupon, ...get().cupons.filter(c => c.codigo !== newCoupon.codigo || c.lojaId !== newCoupon.lojaId)];
    set({ cupons: updatedCupons });
    saveMarketingCache(updatedCupons, get().promocoes, get().lojaPromocoes);

    // 2. Persiste no Supabase
    try {
      const dbCoupon = {
        codigo: newCoupon.codigo,
        descricao: newCoupon.descricao,
        ativo: newCoupon.ativo,
        total_disponiveis: newCoupon.totalDisponiveis,
        valor_minimo: newCoupon.valorMinimo,
        data_inicio: newCoupon.dataInicio || null,
        data_termino: newCoupon.dataTermino || null,
        exigir_min_itens: newCoupon.exigirMinItens,
        tipo_desconto: newCoupon.tipoDesconto,
        valor_desconto: newCoupon.valorDesconto,
        aplicar_frete_gratis: newCoupon.aplicarFreteGratis,
        aplicacao_automatica: newCoupon.aplicacaoAutomatica,
        permite_acumular: newCoupon.permiteAcumular,
        uso_unico: newCoupon.usoUnico,
        cupom_primeira_compra: newCoupon.cupomPrimeiraCompra,
        numero_utilizacoes: 0,
        loja_id: newCoupon.lojaId || null
      };
      await supabase.from('cupons' as any).insert(dbCoupon);
    } catch (e) {
      console.error("Erro ao inserir cupom no Supabase:", e);
    }
  },

  updateCoupon: async (id, updatedFields) => {
    const updatedCupons = get().cupons.map(c => {
      if (c.id === id) {
        return {
          ...c,
          ...updatedFields,
          codigo: updatedFields.codigo ? updatedFields.codigo.trim().toUpperCase() : c.codigo,
          numeroUtilizacoes: updatedFields.numeroUtilizacoes !== undefined ? Number(updatedFields.numeroUtilizacoes) : c.numeroUtilizacoes
        };
      }
      return c;
    });

    set({ cupons: updatedCupons });
    saveMarketingCache(updatedCupons, get().promocoes, get().lojaPromocoes);

    try {
      const dbUpdate: any = {};
      if (updatedFields.codigo !== undefined) dbUpdate.codigo = updatedFields.codigo.trim().toUpperCase();
      if (updatedFields.descricao !== undefined) dbUpdate.descricao = updatedFields.descricao;
      if (updatedFields.ativo !== undefined) dbUpdate.ativo = updatedFields.ativo;
      if (updatedFields.totalDisponiveis !== undefined) dbUpdate.total_disponiveis = updatedFields.totalDisponiveis;
      if (updatedFields.valorMinimo !== undefined) dbUpdate.valor_minimo = updatedFields.valorMinimo;
      if (updatedFields.dataInicio !== undefined) dbUpdate.data_inicio = updatedFields.dataInicio || null;
      if (updatedFields.dataTermino !== undefined) dbUpdate.data_termino = updatedFields.dataTermino || null;
      if (updatedFields.exigirMinItens !== undefined) dbUpdate.exigir_min_itens = updatedFields.exigirMinItens;
      if (updatedFields.tipoDesconto !== undefined) dbUpdate.tipo_desconto = updatedFields.tipoDesconto;
      if (updatedFields.valorDesconto !== undefined) dbUpdate.valor_desconto = updatedFields.valorDesconto;
      if (updatedFields.aplicarFreteGratis !== undefined) dbUpdate.aplicar_frete_gratis = updatedFields.aplicarFreteGratis;
      if (updatedFields.aplicacaoAutomatica !== undefined) dbUpdate.aplicacao_automatica = updatedFields.aplicacaoAutomatica;
      if (updatedFields.permiteAcumular !== undefined) dbUpdate.permite_acumular = updatedFields.permiteAcumular;
      if (updatedFields.usoUnico !== undefined) dbUpdate.uso_unico = updatedFields.usoUnico;
      if (updatedFields.cupomPrimeiraCompra !== undefined) dbUpdate.cupom_primeira_compra = updatedFields.cupomPrimeiraCompra;
      if (updatedFields.numeroUtilizacoes !== undefined) dbUpdate.numero_utilizacoes = updatedFields.numeroUtilizacoes;
      
      await supabase.from('cupons' as any).update(dbUpdate).eq('id', id);
    } catch (e) {
      console.error("Erro ao atualizar cupom no Supabase:", e);
    }
  },

  removeCoupon: async (id) => {
    const updatedCupons = get().cupons.filter(c => c.id !== id);
    set({ cupons: updatedCupons });
    saveMarketingCache(updatedCupons, get().promocoes, get().lojaPromocoes);

    try {
      await supabase.from('cupons' as any).delete().eq('id', id);
    } catch (e) {
      console.error("Erro ao remover cupom do Supabase:", e);
    }
  },

  incrementCouponUsage: async (codigo: string, lojaId?: string) => {
    if (!codigo) return;
    const cleanCode = codigo.trim().toUpperCase();

    // 1. Encontra a loja atual se não passada
    let effectiveLojaId = lojaId;
    if (!effectiveLojaId) {
      try {
        const { useCart } = await import('@/stores/cart');
        effectiveLojaId = useCart.getState().selectedPharmacyId || undefined;
      } catch {}
    }

    // 2. Incremento OTIMISTA IMEDIATO na memória e localStorage
    let updatedCupomId: string | null = null;
    let newUsos = 0;

    const updatedCupons = get().cupons.map(c => {
      const matchCode = c.codigo.toUpperCase() === cleanCode;
      const matchLoja = !c.lojaId || !effectiveLojaId || c.lojaId === effectiveLojaId;
      if (matchCode && matchLoja) {
        updatedCupomId = c.id;
        newUsos = (c.numeroUtilizacoes || 0) + 1;
        return {
          ...c,
          numeroUtilizacoes: newUsos
        };
      }
      return c;
    });

    if (updatedCupomId) {
      set({ cupons: updatedCupons });
      saveMarketingCache(updatedCupons, get().promocoes, get().lojaPromocoes);
    }

    // 3. Sincroniza com Supabase em segundo plano
    try {
      if (updatedCupomId) {
        await supabase
          .from('cupons' as any)
          .update({ numero_utilizacoes: newUsos })
          .eq('id', updatedCupomId);
      } else {
        // Se o cupom não estava em memória, tenta localizar e atualizar no banco
        const { data: cupomBanco } = await (supabase
          .from('cupons' as any) as any)
          .select('id, numero_utilizacoes')
          .ilike('codigo', cleanCode)
          .limit(1)
          .maybeSingle();

        if (cupomBanco) {
          const u = (cupomBanco.numero_utilizacoes || 0) + 1;
          await (supabase
            .from('cupons' as any) as any)
            .update({ numero_utilizacoes: u })
            .eq('id', cupomBanco.id);
          
          await get().loadMarketing();
        }
      }
    } catch (e) {
      console.error("Erro ao sincronizar contagem de uso do cupom no Supabase:", e);
    }
  },

  addPromocao: async (promocao) => {
    const conf = { ...promocao.produtosConfig } as any;
    if (promocao.corTimer) conf.__corTimer = promocao.corTimer;
    
    const dbPromo = {
      titulo: promocao.titulo,
      subtitulo: promocao.subtitulo,
      tipo_alvo: promocao.tipoAlvo,
      alvos_id: promocao.alvosId,
      data_fim: promocao.dataFim,
      hora_fim: promocao.horaFim,
      icone: promocao.icone,
      ativa: promocao.ativa,
      tipo_campanha: promocao.tipoCampanha,
      desconto_percentual: promocao.descontoPercentual,
      preco_promocional: promocao.precoPromocional,
      leve_pague_quantidade: promocao.levePague_quantidade,
      leve_pague_preco_por_item: promocao.levePague_precoPorItem,
      produtos_config: conf,
      cor_selo: promocao.corSelo,
      corIcone: promocao.corIcone,
      corTextoBotao: promocao.corTextoBotao,
      corBotao: promocao.corBotao,
      texto_botao: promocao.textoBotao,
      loja_id: promocao.lojaId || null
    };

    try {
      await supabase.from('promocoes' as any).insert(dbPromo);
      await get().loadMarketing();
    } catch (e) {
      console.error("Erro ao adicionar promoção:", e);
    }
  },

  updatePromocao: async (id, updatedFields) => {
    const dbUpdate: any = {};
    if (updatedFields.titulo !== undefined) dbUpdate.titulo = updatedFields.titulo;
    if (updatedFields.subtitulo !== undefined) dbUpdate.subtitulo = updatedFields.subtitulo;
    if (updatedFields.tipoAlvo !== undefined) dbUpdate.tipo_alvo = updatedFields.tipoAlvo;
    if (updatedFields.alvosId !== undefined) dbUpdate.alvos_id = updatedFields.alvosId;
    if (updatedFields.dataFim !== undefined) dbUpdate.data_fim = updatedFields.dataFim;
    if (updatedFields.horaFim !== undefined) dbUpdate.hora_fim = updatedFields.horaFim;
    if (updatedFields.icone !== undefined) dbUpdate.icone = updatedFields.icone;
    if (updatedFields.ativa !== undefined) dbUpdate.ativa = updatedFields.ativa;
    if (updatedFields.tipoCampanha !== undefined) dbUpdate.tipo_campanha = updatedFields.tipoCampanha;
    if (updatedFields.descontoPercentual !== undefined) dbUpdate.desconto_percentual = updatedFields.descontoPercentual;
    if (updatedFields.precoPromocional !== undefined) dbUpdate.preco_promocional = updatedFields.precoPromocional;
    if (updatedFields.levePague_quantidade !== undefined) dbUpdate.leve_pague_quantidade = updatedFields.levePague_quantidade;
    if (updatedFields.levePague_precoPorItem !== undefined) dbUpdate.leve_pague_preco_por_item = updatedFields.levePague_precoPorItem;
    if (updatedFields.produtosConfig !== undefined || updatedFields.corTimer !== undefined) {
      const currentConfig = (get().promocoes.find(p => p.id === id)?.produtosConfig) || {};
      const newConf = { ...currentConfig, ...(updatedFields.produtosConfig || {}) } as any;
      if (updatedFields.corTimer) newConf.__corTimer = updatedFields.corTimer;
      dbUpdate.produtos_config = newConf;
    }
    if (updatedFields.corSelo !== undefined) dbUpdate.cor_selo = updatedFields.corSelo;
    if (updatedFields.corIcone !== undefined) dbUpdate.cor_icone = updatedFields.corIcone;
    if (updatedFields.corTextoBotao !== undefined) dbUpdate.cor_texto_botao = updatedFields.corTextoBotao;
    if (updatedFields.corBotao !== undefined) dbUpdate.cor_botao = updatedFields.corBotao;
    if (updatedFields.textoBotao !== undefined) dbUpdate.texto_botao = updatedFields.textoBotao;
    if (updatedFields.lojaId !== undefined) dbUpdate.loja_id = updatedFields.lojaId;

    try {
      await supabase.from('promocoes' as any).update(dbUpdate).eq('id', id);
      await get().loadMarketing();
    } catch (e) {
      console.error("Erro ao atualizar promoção:", e);
    }
  },

  removePromocao: async (id) => {
    try {
      await supabase.from('promocoes' as any).delete().eq('id', id);
      await get().loadMarketing();
    } catch (e) {
      console.error("Erro ao remover promoção:", e);
    }
  },

  addLojaPromocao: async (lojaId, promocao) => {
    await get().addPromocao({ ...promocao, lojaId });
  },

  removeLojaPromocao: async (lojaId, id) => {
    await get().removePromocao(id);
  }
}));

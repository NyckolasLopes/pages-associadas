import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  numeroUtilizacoes: number; // for display
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
  textoBotao?: string;
  lojaId?: string; // empty/undefined for global network, or store ID
}

import { supabase } from '@/integrations/supabase/client';

export interface MarketingStore {
  cupons: Coupon[];
  promocoes: Promocao[];
  lojaPromocoes: Record<string, Promocao[]>;
  loadMarketing: () => Promise<void>;
  addCoupon: (coupon: Omit<Coupon, "id" | "numeroUtilizacoes">) => Promise<void>;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => Promise<void>;
  removeCoupon: (id: string) => Promise<void>;
  addPromocao: (promocao: Omit<Promocao, "id">) => Promise<void>;
  updatePromocao: (id: string, promocao: Partial<Promocao>) => Promise<void>;
  removePromocao: (id: string) => Promise<void>;
  addLojaPromocao: (lojaId: string, promocao: Omit<Promocao, "id">) => Promise<void>;
  removeLojaPromocao: (lojaId: string, id: string) => Promise<void>;
}

export const useMarketing = create<MarketingStore>((set, get) => ({
  cupons: [],
  promocoes: [],
  lojaPromocoes: {},
  
  loadMarketing: async () => {
    const [ { data: cuponsData }, { data: promocoesData } ] = await Promise.all([
      supabase.from('cupons' as any).select('*').order('created_at', { ascending: false }),
      supabase.from('promocoes' as any).select('*').order('created_at', { ascending: false })
    ]);

    let parsedCupons: Coupon[] = [];
    if (cuponsData) {
      parsedCupons = cuponsData.map((c: any) => ({
        id: c.id,
        codigo: c.codigo,
        descricao: c.descricao,
        ativo: c.ativo,
        totalDisponiveis: c.total_disponiveis,
        valorMinimo: parseFloat(c.valor_minimo) || 0,
        dataInicio: c.data_inicio || '',
        dataTermino: c.data_termino || '',
        exigirMinItens: c.exigir_min_itens,
        tipoDesconto: c.tipo_desconto,
        valorDesconto: parseFloat(c.valor_desconto) || 0,
        aplicarFreteGratis: c.aplicar_frete_gratis,
        aplicacaoAutomatica: c.aplicacao_automatica,
        permiteAcumular: c.permite_acumular,
        usoUnico: c.uso_unico,
        cupomPrimeiraCompra: c.cupom_primeira_compra,
        numeroUtilizacoes: c.numero_utilizacoes,
        lojaId: c.loja_id || undefined
      }));
    }

    let parsedPromos: Promocao[] = [];
    let lojaPromos: Record<string, Promocao[]> = {};
    
    if (promocoesData) {
      parsedPromos = promocoesData.map((p: any) => {
        const promo: Promocao = {
          id: p.id,
          titulo: p.titulo,
          subtitulo: p.subtitulo,
          tipoAlvo: p.tipo_alvo || 'produtos',
          alvosId: p.alvos_id || [],
          dataFim: p.data_fim || '',
          horaFim: p.hora_fim || '',
          icone: p.icone,
          ativa: p.ativa,
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
          textoBotao: p.texto_botao,
          lojaId: p.loja_id || undefined
        };
        
        if (promo.lojaId) {
          if (!lojaPromos[promo.lojaId]) lojaPromos[promo.lojaId] = [];
          lojaPromos[promo.lojaId].push(promo);
        }
        return promo;
      });
    }

    set({ cupons: parsedCupons, promocoes: parsedPromos, lojaPromocoes: lojaPromos });
  },

  addCoupon: async (coupon) => {
    const dbCoupon = {
      codigo: coupon.codigo,
      descricao: coupon.descricao,
      ativo: coupon.ativo,
      total_disponiveis: coupon.totalDisponiveis,
      valor_minimo: coupon.valorMinimo,
      data_inicio: coupon.dataInicio || null,
      data_termino: coupon.dataTermino || null,
      exigir_min_itens: coupon.exigirMinItens,
      tipo_desconto: coupon.tipoDesconto,
      valor_desconto: coupon.valorDesconto,
      aplicar_frete_gratis: coupon.aplicarFreteGratis,
      aplicacao_automatica: coupon.aplicacaoAutomatica,
      permite_acumular: coupon.permiteAcumular,
      uso_unico: coupon.usoUnico,
      cupom_primeira_compra: coupon.cupomPrimeiraCompra,
      loja_id: coupon.lojaId || null
    };

    const { data, error } = await supabase.from('cupons' as any).insert(dbCoupon).select().single();
    if (data && !error) {
      await get().loadMarketing();
    }
  },

  updateCoupon: async (id, updatedFields) => {
    const dbUpdate: any = {};
    if (updatedFields.codigo !== undefined) dbUpdate.codigo = updatedFields.codigo;
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
    
    const { error } = await supabase.from('cupons' as any).update(dbUpdate).eq('id', id);
    if (!error) {
      await get().loadMarketing();
    }
  },

  removeCoupon: async (id) => {
    const { error } = await supabase.from('cupons' as any).delete().eq('id', id);
    if (!error) {
      await get().loadMarketing();
    }
  },

  addPromocao: async (promocao) => {
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
      produtos_config: promocao.produtosConfig || {},
      cor_selo: promocao.corSelo,
      cor_icone: promocao.corIcone,
      cor_texto_botao: promocao.corTextoBotao,
      cor_botao: promocao.corBotao,
      texto_botao: promocao.textoBotao,
      loja_id: promocao.lojaId || null
    };

    const { error } = await supabase.from('promocoes' as any).insert(dbPromo);
    if (!error) await get().loadMarketing();
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
    if (updatedFields.produtosConfig !== undefined) dbUpdate.produtos_config = updatedFields.produtosConfig;
    if (updatedFields.corSelo !== undefined) dbUpdate.cor_selo = updatedFields.corSelo;
    if (updatedFields.corIcone !== undefined) dbUpdate.cor_icone = updatedFields.corIcone;
    if (updatedFields.corTextoBotao !== undefined) dbUpdate.cor_texto_botao = updatedFields.corTextoBotao;
    if (updatedFields.corBotao !== undefined) dbUpdate.cor_botao = updatedFields.corBotao;
    if (updatedFields.textoBotao !== undefined) dbUpdate.texto_botao = updatedFields.textoBotao;
    if (updatedFields.lojaId !== undefined) dbUpdate.loja_id = updatedFields.lojaId;

    const { error } = await supabase.from('promocoes' as any).update(dbUpdate).eq('id', id);
    if (!error) await get().loadMarketing();
  },

  removePromocao: async (id) => {
    const { error } = await supabase.from('promocoes' as any).delete().eq('id', id);
    if (!error) await get().loadMarketing();
  },

  addLojaPromocao: async (lojaId, promocao) => {
    await get().addPromocao({ ...promocao, lojaId });
  },

  removeLojaPromocao: async (lojaId, id) => {
    await get().removePromocao(id);
  }
}));

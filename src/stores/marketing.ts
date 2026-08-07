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

export interface Promocao {
  id: string;
  titulo: string;
  tipoAlvo: "categoria" | "produtos";
  alvosId: string[];
  dataFim: string; // ISO date string or yyyy-mm-dd
  horaFim: string; // HH:mm
  icone: string; // lucide icon name
  ativa: boolean;
  tipoCampanha?: "padrao" | "leve_pague";
  levePague_quantidade?: number;
  levePague_precoPorItem?: number;
  corSelo?: string;
  corIcone?: string;
  corTextoBotao?: string;
  corBotao?: string;
  textoBotao?: string;
  lojaId?: string;
}

export interface MarketingStore {
  cupons: Coupon[];
  promocoes: Promocao[];
  lojaPromocoes: Record<string, Promocao[]>;
  addCoupon: (coupon: Omit<Coupon, "id" | "numeroUtilizacoes">) => void;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => void;
  removeCoupon: (id: string) => void;
  addPromocao: (promocao: Omit<Promocao, "id">) => void;
  updatePromocao: (id: string, promocao: Partial<Promocao>) => void;
  removePromocao: (id: string) => void;
  addLojaPromocao: (lojaId: string, promocao: Omit<Promocao, "id">) => void;
  removeLojaPromocao: (lojaId: string, id: string) => void;
}

export const useMarketing = create<MarketingStore>()(
  persist(
    (set) => ({
      cupons: [
        {
          id: "1",
          codigo: "PRIMEIRA10",
          descricao: "Cupom de Desconto para Primeira Compra",
          ativo: true,
          totalDisponiveis: 100,
          valorMinimo: 0,
          dataInicio: "",
          dataTermino: "",
          exigirMinItens: false,
          tipoDesconto: "percentual",
          valorDesconto: 10,
          aplicarFreteGratis: false,
          aplicacaoAutomatica: true,
          permiteAcumular: false,
          usoUnico: true,
          cupomPrimeiraCompra: true,
          numeroUtilizacoes: 120,
        },
        {
          id: "2",
          codigo: "10OFF",
          descricao: "10 reais de desconto para compras acima de R$100,00",
          ativo: true,
          totalDisponiveis: 500,
          valorMinimo: 100,
          dataInicio: "",
          dataTermino: "",
          exigirMinItens: false,
          tipoDesconto: "fixo",
          valorDesconto: 10,
          aplicarFreteGratis: false,
          aplicacaoAutomatica: false,
          permiteAcumular: false,
          usoUnico: false,
          cupomPrimeiraCompra: false,
          numeroUtilizacoes: 45
        }
      ],
      promocoes: [],
      lojaPromocoes: {},
      addCoupon: (coupon) =>
        set((state) => ({
          cupons: [
            ...state.cupons,
            {
              ...coupon,
              id: Date.now().toString(),
              numeroUtilizacoes: 0,
            },
          ],
        })),
      updateCoupon: (id, updatedFields) =>
        set((state) => ({
          cupons: state.cupons.map((c) =>
            c.id === id ? { ...c, ...updatedFields } : c
          ),
        })),
      removeCoupon: (id) =>
        set((state) => ({
          cupons: state.cupons.filter((c) => c.id !== id),
        })),
      addPromocao: (promocao) =>
        set((state) => ({
          promocoes: [
            ...state.promocoes,
            { ...promocao, id: Date.now().toString() }
          ]
        })),
      updatePromocao: (id, updatedFields) =>
        set((state) => ({
          promocoes: state.promocoes.map((p) =>
            p.id === id ? { ...p, ...updatedFields } : p
          )
        })),
      removePromocao: (id) =>
        set((state) => ({
          promocoes: state.promocoes.filter((p) => p.id !== id),
        })),
      addLojaPromocao: (lojaId, promocao) =>
        set((state) => {
          const id = Math.random().toString(36).substring(2, 9);
          const current = state.lojaPromocoes[lojaId] || [];
          return {
            lojaPromocoes: {
              ...state.lojaPromocoes,
              [lojaId]: [...current, { ...promocao, id }]
            }
          };
        }),
      removeLojaPromocao: (lojaId, id) =>
        set((state) => {
          const current = state.lojaPromocoes[lojaId] || [];
          return {
            lojaPromocoes: {
              ...state.lojaPromocoes,
              [lojaId]: current.filter(p => p.id !== id)
            }
          };
        })
    }),
    {
      name: "marketing-storage",
    }
  )
);

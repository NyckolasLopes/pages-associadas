import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Produto } from "@/types";
import { pbmDiscountFor, type PBMCredential, type PBMProvider } from "@/lib/pbm";
import { useAdmin } from "@/stores/admin";
import { useRegionsStore } from "@/stores/regions";
import { useMarketing } from "@/stores/marketing";
import { getLevePaguePromotion } from "@/lib/utils";

export interface CartItem {
  id: string;
  nome: string;
  preco: number;
  precoDe: number;
  ean: string;
  possuiImagem: boolean;
  qty: number;
  retemReceita: boolean;
  tarja: string;
  categoriaId: string;
  subcategoriaId?: string;
  generico?: boolean;
  estoque: number;
  precosPorLoja?: Record<string, { precoPor: number; precoDe: number; ativo?: boolean }>;
  isOrderBump?: boolean;
}

/** Resolve the effective price for a cart item or product based on the selected pharmacy */
export function getEffectivePrice(item: any, pharmacyId: string | null): { precoPor: number; precoDe: number } {
  if (item.isOrderBump) {
    return { precoPor: item.preco, precoDe: item.precoDe || item.preco };
  }

  let precoPor = item.precoPor ?? item.preco ?? 0;
  let precoDe = item.precoDe ?? precoPor;

  if (pharmacyId) {
    const adminState = useAdmin.getState();
    const regionsState = useRegionsStore.getState();
    
    // 1. Base table price
    const activePharm = adminState.pharmacies.find((f: any) => f.id === pharmacyId);
    if (activePharm) {
      const activeTabela = activePharm.tabelaPrecoId || "poa";
      const regPrice = regionsState.prices[`${activeTabela}-${item.id}`];
      if (regPrice !== undefined) {
        precoPor = regPrice;
      }
    }

    // 2. Specific store override
    if (item.precosPorLoja?.[pharmacyId]) {
      const loja = item.precosPorLoja[pharmacyId];
      const lojaPrecoPor = loja.precoPor ? Number(loja.precoPor) : 0;
      const lojaPrecoDe = loja.precoDe ? Number(loja.precoDe) : lojaPrecoPor;
      
      if (lojaPrecoPor > 0 || lojaPrecoDe > 0) {
        precoPor = lojaPrecoPor || lojaPrecoDe;
        precoDe = lojaPrecoDe || lojaPrecoPor;
      }
    }

    // 3. Store-specific Oferta do Mês
    const marketingState = useMarketing.getState();
    const storePromos = (marketingState.lojaPromocoes[pharmacyId] && marketingState.lojaPromocoes[pharmacyId].length > 0)
      ? marketingState.lojaPromocoes[pharmacyId]
      : marketingState.promocoes.filter(pr => pr.lojaId && String(pr.lojaId) === String(pharmacyId));
    const globalPromos = marketingState.promocoes.filter(p => !p.lojaId || p.lojaId === "" || p.lojaId === "global" || p.lojaId === "all");

    const checkTarget = (p: any, i: any) => {
      const tipo = p.tipoAlvo || 'produtos';
      if (tipo === 'categorias') {
        const cats = [
          i.categoriaId,
          i.subcategoriaId,
          ...(Array.isArray(i.categoriasIds) ? i.categoriasIds : []),
          ...(Array.isArray(i.categoriasAdicionais) ? i.categoriasAdicionais : [])
        ].filter(Boolean).map(s => String(s).trim().toLowerCase());
        return p.alvosId && Array.isArray(p.alvosId) && p.alvosId.some((id: any) => cats.includes(String(id).trim().toLowerCase()));
      }
      const ids = [
        String(i.id || ''),
        String(i.sku || ''),
        String(i.codigoInterno || ''),
        String(i.ean || ''),
        String(i.url || ''),
        String(i.slug || '')
      ].filter(Boolean).map(s => s.trim().toLowerCase());
      return p.alvosId && Array.isArray(p.alvosId) && p.alvosId.some((id: any) => ids.includes(String(id).trim().toLowerCase()));
    };

    const storeOferta = storePromos.find(p => p.ativa && (p.tipoCampanha === 'padrao' || !p.tipoCampanha) && checkTarget(p, item));
    const globalOferta = storeOferta ? null : globalPromos.find(p => p.ativa && (p.tipoCampanha === 'padrao' || !p.tipoCampanha) && checkTarget(p, item));
    const activeOferta = storeOferta || globalOferta;
    
    if (activeOferta) {
      const promoPreco = (activeOferta.precoPromocional && activeOferta.precoPromocional > 0)
        ? activeOferta.precoPromocional
        : ((activeOferta.levePague_precoPorItem && activeOferta.levePague_precoPorItem > 0) ? activeOferta.levePague_precoPorItem : 0);

      if (promoPreco > 0) {
        precoDe = precoPor > promoPreco ? precoPor : precoDe;
        precoPor = promoPreco;
      } else if (activeOferta.descontoPercentual && activeOferta.descontoPercentual > 0) {
        precoDe = precoPor;
        precoPor = precoPor * (1 - activeOferta.descontoPercentual / 100);
      }
    }

    // 4. Encarte (Overrides all if store is Pleno)
    if (activePharm && activePharm.categoriaAssociado === 'Pleno' && item.precoEncarte !== undefined) {
      precoDe = precoPor; // The original price becomes the old price
      precoPor = item.precoEncarte;
    }
  }

  return { precoPor, precoDe };
}

interface CartState {
  items: CartItem[];
  notifications: { id: string; oldPrice: number; newPrice: number; storeName: string }[];
  drawerOpen: boolean;
  pbm: PBMCredential | null;
  lastUpdatedAt: number | null;
  appliedCoupon: string | null;
  lastOrder: any | null;
  add: (p: Produto, qty?: number, silent?: boolean) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  setDrawer: (open: boolean) => void;
  setLastOrder: (order: any | null) => void;
  connectPbm: (c: PBMCredential) => void;
  disconnectPbm: () => void;
  count: () => number;
  subtotal: () => number;
  storeDiscount: () => number;
  pbmDiscount: () => number;
  couponDiscount: () => number;
  total: () => number;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  selectedPharmacyId: string | null;
  selectedFreight: string;
  freightOptions: any[];
  setSelectedPharmacyId: (id: string | null) => void;
  setSelectedFreight: (freightId: string) => void;
  setFreightOptions: (opts: any[]) => void;
  updateItemPrice: (id: string, preco: number) => void;
  addNotification: (id: string, oldPrice: number, newPrice: number, storeName: string) => void;
  clearNotifications: () => void;
  restoreCart: (items: CartItem[]) => void;
}

// ---- Standalone selector functions (stable references, no re-render cascades) ----
export const selectCartItems = (s: CartState) => s.items;
export const selectCartDrawerOpen = (s: CartState) => s.drawerOpen;
export const selectCartCount = (s: CartState) => s.count();
export const selectCartSubtotal = (s: CartState) => s.subtotal();
export const selectCartStoreDiscount = (s: CartState) => s.storeDiscount();
export const selectCartPbmDiscount = (s: CartState) => s.pbmDiscount();
export const selectCartTotal = (s: CartState) => s.total();
export const selectSelectedPharmacyId = (s: CartState) => s.selectedPharmacyId;
export const selectSelectedFreight = (s: CartState) => s.selectedFreight;

// Mock "preço de" for store discount
function storeDiscountFor(i: { precoDe?: number; preco: number }): number {
  const de = i.precoDe || i.preco;
  return de > i.preco ? de - i.preco : 0;
}

function pbmDiscountForItem(item: CartItem, provider: PBMProvider | null): number {
  const mock = {
    id: item.id,
    ean: item.ean,
    nome: item.nome,
    descricao: "",
    url: "",
    marca: "",
    precoDe: item.preco,
    precoPor: item.preco,
    estoque: 1,
    registroAnvisa: "",
    tarja: item.tarja,
    retemReceita: item.retemReceita,
    generico: false,
    possuiImagem: item.possuiImagem,
    categoriaId: "",
    subcategoriaId: "",
    internalTags: [],
  } as unknown as Produto;
  return pbmDiscountFor(mock, provider) * item.qty;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      notifications: [],
      drawerOpen: false,
      pbm: null,
      lastUpdatedAt: null,
      appliedCoupon: null,
      lastOrder: null,
      selectedPharmacyId: null,
      selectedFreight: "pickup",
      freightOptions: [],
      setLastOrder: (order) => set({ lastOrder: order }),
      setSelectedPharmacyId: (id) => set((s) => (s.selectedPharmacyId === id ? s : { selectedPharmacyId: id })),
      setSelectedFreight: (freightId) => set((s) => (s.selectedFreight === freightId ? s : { selectedFreight: freightId })),
      setFreightOptions: (opts) => set({ freightOptions: opts }),
      add: (p, qty = 1, silent = false) =>
        set((s) => {
          const ex = s.items.find((i) => i.id === p.id);
          if (ex) {
            const newQty = Math.min(ex.qty + qty, p.estoque);
            return {
              items: s.items.map((i) =>
                i.id === p.id ? { ...i, qty: newQty } : i,
              ),
              drawerOpen: silent ? s.drawerOpen : true,
              lastUpdatedAt: Date.now(),
            };
          }
          return {
            items: [
              ...s.items,
              {
                id: p.id,
                nome: p.nome,
                preco: p.precoPor,
                precoDe: p.precoDe || p.precoPor,
                ean: p.ean || "",
                possuiImagem: p.possuiImagem,
                qty: Math.min(qty, p.estoque),
                retemReceita: p.retemReceita,
                tarja: String(p.tarja),
                categoriaId: p.categoriaId,
                generico: p.generico,
                estoque: p.estoque,
                precosPorLoja: (p as any).precosPorLoja || undefined,
                isOrderBump: (p as any).isOrderBump || false,
              },
            ],
            drawerOpen: silent ? s.drawerOpen : true,
            lastUpdatedAt: Date.now(),
          };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id), lastUpdatedAt: Date.now() })),
      setQty: (id, qty) =>
        set((s) => {
          const item = s.items.find(i => i.id === id);
          if (!item) return s;
          const safeQty = Math.min(Math.max(1, qty), item.estoque);
          return {
            items: s.items.map((i) =>
              i.id === id ? { ...i, qty: safeQty } : i,
            ),
            lastUpdatedAt: Date.now(),
          };
        }),
      updateItemPrice: (id, preco) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, preco } : i
          ),
          lastUpdatedAt: Date.now(),
        })),
      addNotification: (id, oldPrice, newPrice, storeName) =>
        set((s) => {
          const filtered = s.notifications.filter((n) => n.id !== id);
          return { notifications: [{ id, oldPrice, newPrice, storeName }, ...filtered] };
        }),
      clearNotifications: () => set({ notifications: [] }),
      clear: () => set({ items: [], appliedCoupon: null, lastUpdatedAt: null }),
      restoreCart: (items) => set({ items, lastUpdatedAt: Date.now() }),
      setDrawer: (open) => set({ drawerOpen: open }),
      connectPbm: (c) => set({ pbm: c }),
      disconnectPbm: () => set({ pbm: null }),
      count: () => get().items.reduce((a, i) => a + i.qty, 0),
      subtotal: () => {
        const pid = get().selectedPharmacyId;
        return get().items.reduce((a, i) => {
          const { precoDe } = getEffectivePrice(i, pid);
          return a + i.qty * (precoDe || i.preco);
        }, 0);
      },
      storeDiscount: () => {
        const pid = get().selectedPharmacyId;
        const promocoes = useMarketing.getState().promocoes;
        const lojaPromocoes = pid ? (useMarketing.getState().lojaPromocoes[pid] || []) : [];
        
        return get().items.reduce((a, i) => {
          if (i.isOrderBump) return a;
          const { precoPor, precoDe } = getEffectivePrice(i, pid);
          const de = precoDe || precoPor;
          
          let itemDiscount = 0;
          const levePaguePromo = getLevePaguePromotion(i as any, promocoes, lojaPromocoes);
          
          if (levePaguePromo && i.qty >= levePaguePromo.levePague_quantidade) {
            const promoItemsCount = Math.floor(i.qty / levePaguePromo.levePague_quantidade) * levePaguePromo.levePague_quantidade;
            const regularItemsCount = i.qty - promoItemsCount;
            
            const promoDiscount = Math.max(0, de - levePaguePromo.levePague_precoPorItem!);
            const regularDiscount = Math.max(0, de - precoPor);
            
            itemDiscount = promoDiscount * promoItemsCount + regularDiscount * regularItemsCount;
          } else {
            itemDiscount = (de > precoPor ? de - precoPor : 0) * i.qty;
          }
          
          return a + itemDiscount;
        }, 0);
      },
      pbmDiscount: () => {
        const prov = get().pbm?.provider ?? null;
        return get().items.reduce((a, i) => a + pbmDiscountForItem(i, prov), 0);
      },
      couponDiscount: () => {
        const code = get().appliedCoupon;
        if (!code) return 0;
        const cupons = useMarketing.getState().cupons;
        const pid = get().selectedPharmacyId;
        if (!pid) return 0;
        const coupon = cupons.find(c => c.codigo.toUpperCase() === code.toUpperCase() && c.ativo && c.lojaId === pid);
        if (!coupon) return 0;
        if (coupon.totalDisponiveis > 0 && (coupon.numeroUtilizacoes || 0) >= coupon.totalDisponiveis) return 0;
        
        const rawSubtotal = get().subtotal();
        const subAfterDiscounts = rawSubtotal - get().storeDiscount() - get().pbmDiscount();
        if (rawSubtotal <= 0) return 0;
        if (coupon.valorMinimo && rawSubtotal < coupon.valorMinimo) return 0;
        
        if (coupon.tipoDesconto === "percentual") {
          return (rawSubtotal * coupon.valorDesconto) / 100;
        } else {
          return Math.min(subAfterDiscounts, coupon.valorDesconto);
        }
      },
      applyCoupon: (rawCode: string) => {
        const clean = rawCode.trim().toUpperCase();
        if (!clean) return { success: false, message: "Digite um código de cupom válido." };
        const cupons = useMarketing.getState().cupons;
        const pid = get().selectedPharmacyId;
        if (!pid) {
          return { success: false, message: "Selecione uma farmácia antes de aplicar o cupom." };
        }
        const coupon = cupons.find(c => c.codigo.toUpperCase() === clean);
        if (!coupon || !coupon.ativo || !coupon.lojaId || coupon.lojaId !== pid) {
          return { success: false, message: "Cupom inválido ou não disponível para esta loja." };
        }
        if (coupon.totalDisponiveis > 0 && (coupon.numeroUtilizacoes || 0) >= coupon.totalDisponiveis) {
          return { success: false, message: "Este cupom atingiu o limite máximo de utilizações." };
        }
        if (coupon.dataInicio) {
          const start = new Date(coupon.dataInicio);
          if (!isNaN(start.getTime()) && new Date() < start) {
            return { success: false, message: "Este cupom ainda não é válido." };
          }
        }
        if (coupon.dataTermino) {
          const end = new Date(coupon.dataTermino);
          if (!isNaN(end.getTime()) && new Date() > end) {
            return { success: false, message: "Este cupom expirou." };
          }
        }
        const rawSubtotal = get().subtotal();
        if (coupon.valorMinimo && rawSubtotal < coupon.valorMinimo) {
          return { success: false, message: `Valor mínimo para este cupom: R$ ${coupon.valorMinimo.toFixed(2)}` };
        }
        set({ appliedCoupon: clean });
        return { success: true, message: `Cupom ${clean} aplicado com sucesso!` };
      },
      removeCoupon: () => set({ appliedCoupon: null }),
      total: () => {
        const s = get();
        return Math.max(0, s.subtotal() - s.storeDiscount() - s.pbmDiscount() - s.couponDiscount());
      },
    }),
    { name: "fa-cart", skipHydration: true },
  ),
);

export const useGeoCep = create<{ 
  cep: string; 
  city: string | null;
  lat: number | null;
  lng: number | null;
  setCep: (c: string) => Promise<void>; 
  setCoordinates: (lat: number, lng: number) => void;
}>()(
  persist((set) => ({ 
    cep: "", 
    city: null,
    lat: null,
    lng: null,
    setCoordinates: (lat, lng) => set({ lat, lng }),
    setCep: async (cep) => {
      set({ cep, city: null, lat: null, lng: null });
      const cleanCep = cep.replace(/\D/g, "");
      if (cleanCep.length === 8) {
        try {
          const viaCepPromise = fetch(`https://viacep.com.br/ws/${cleanCep}/json/`).then(r => r.json()).catch(() => null);
          const coordsPromise = fetch(`https://cep.awesomeapi.com.br/json/${cleanCep}`).then(r => r.json()).catch(() => null);
          
          const [viaCepRes, coordsRes] = await Promise.all([viaCepPromise, coordsPromise]);
          
          if (coordsRes && coordsRes.lat && coordsRes.lng) {
            set({ lat: parseFloat(coordsRes.lat), lng: parseFloat(coordsRes.lng) });
          } else {
            const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${cleanCep}&country=Brazil&format=json`).then(r => r.json()).catch(() => null);
            if (nomRes && nomRes.length > 0) {
              set({ lat: parseFloat(nomRes[0].lat), lng: parseFloat(nomRes[0].lon) });
            }
          }

          if (viaCepRes && viaCepRes.localidade) {
            set({ city: viaCepRes.localidade });
          }
        } catch (e) {
          console.error("Erro ao buscar CEP:", e);
        }
      } else {
        set({ city: null });
      }
    } 
  }), {
    name: "fa-geo-cep",
    skipHydration: true,
  }),
);


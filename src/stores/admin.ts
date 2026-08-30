import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";
import { supabaseStorage } from "@/lib/supabaseStorage";
import { sanitizeBannerImages } from "@/utils/storageUpload";

// Throttle para evitar chamadas duplicadas de loadPharmacies ao inicializar
// (__root.tsx e admin.tsx chamam ao mesmo tempo no boot)
const loadPharmaciesThrottle = { _lastCall: 0 };

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  grupoId?: string;
  proprietario?: boolean;
  lojasVinculadas?: string[];
}

export interface RegistrationToken {
  token: string;
  createdAt: number;
  used: boolean;
  nome?: string;
}

export interface AdminGroup {
  id: string;
  nome: string;
  permissoes: string[];
  padrao: boolean;
  permissao_total?: boolean;
}

export interface AdminBanner {
  id: string;
  nome: string;
  imageUrl: string;
  imagemUrl?: string;
  mobileImageUrl?: string;
  link: string;
  target?: string;
  posicao: string;
  paginaPublicacao: string;
  titulo?: string;
  active: boolean;
  ativo?: boolean;
  startDate?: string;
  endDate?: string;
  lojaId?: string; // Se preenchido, banner exclusivo da loja do associado
  farmaciaId?: string;
  // Extra fields for Banner Extra below Vitrines
  vitrineVinculada?: string;
  bannerVinculado?: string;
  topicoVinculado?: string;
  formatoExtra?: "1_banner" | "2_banners";
  imageUrl2?: string;
  mobileImageUrl2?: string;
  link2?: string;
  imageUrl3?: string;
  mobileImageUrl3?: string;
  link3?: string;
  ordem?: number; // Posição de exibição dentro da mesma posição/grupo
}

export interface AdminIntegrations {
  webhookUrl: string;
  apiKey: string;
}

export interface StorePanel {
  lojaId: string;
  status: "active" | "inactive";
  createdAt: string;
  email?: string;
  password?: string;
}

export interface SocialNetwork {
  id: string;
  label: string;
  href: string;
  iconName?: string;
  iconUrl?: string;
}

export interface ContentPage {
  id: string;
  title: string;
  slug: string;
  location: "header" | "footer" | "both" | "none";
  footerColumn?: "Institucional" | "Navegação" | "Serviços" | "Perfil" | "Atendimento" | "Segurança";
  type: "external" | "text";
  externalUrl?: string;
  content?: string;
}

export interface CustomDeliveryMethod {
  id: string;
  nome: string; // Ex: "Motoboy", "Uber Flash"
  ativo: boolean;
  tempoEntrega: string; // Ex: "30 minutos"
  raios: { ateKm: number; preco: number }[];
  faixasValorPedido?: { valorMin: number; taxa: number }[];
}

export interface Pharmacy {
  id: string;
  slug?: string;
  ativo?: boolean;
  categoriaAssociado?: 'Pleno' | 'Parceiro' | 'Associado';
  isPleno?: boolean;
  isVirtualStoreGenerated?: boolean;
  virtualStoreStatus?: 'Ativa' | 'Inativa';
  offersServices?: boolean;
  entregaExpressa?: boolean;
  customPages?: ContentPage[];
  // Dados da Loja
  cnpj: string;
  api_key?: string;
  apiKeyTemp?: string;
  logoUrl?: string;
  faviconUrl?: string;
  loadingLogoUrl?: string;
  themeColors?: Record<string, string>;
  razaoSocial: string;
  nome: string; // Nome Fantasia
  tabelaPrecoId?: string; // Tabela de Preços Regional
  email: string;
  telefone: string;
  whatsapp?: string; // WhatsApp oficial da unidade para pedidos
  horarioFuncionamento: string;
  diasFuncionamento?: number[]; // [0,1,2,3,4,5,6] onde 0 = Domingo
  horariosPorDia?: { dia: number; abre: string; fecha: string; fechado: boolean }[];
  datasEspeciais?: { data: string; abre: string; fecha: string; fechado: boolean; descricao?: string }[];
  respTecnico: string; // Nome do Farmacêutico
  inscricaoFarmaceutico: string; // CRF
  alvara: string;
  afe: string;
  // Dados de Endereço
  cep: string;
  uf: string;
  cidade: string;
  bairro: string;
  endereco: string;
  numero: string;
  complemento: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  // SEO Local e AEO / GEO
  bairrosAtendidos?: string[];
  descricaoSeo?: string; // Legacy
  seoDescricao?: string; // Legacy
  palavrasChave?: string;
  faqLocal?: Array<{ pergunta: string; resposta: string }>;
  pageTitle?: string;
  metaDescription?: string;
  // Footer Customization
  footerPlataformaTexto?: string;
  footerAvisoLegal?: string;
  footerDescricao?: string;
  footerTituloContato?: string;
  footerLogoUrl?: string;
  anvisaLogoUrl?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    linkedin?: string;
    youtube?: string;
  };
  customSocialNetworks?: { id: string; label: string; href: string; iconUrl?: string; iconName?: string }[];
  // Dados de Entrega
  aceitaEntrega: boolean;
  modeloFrete: "cep" | "fixo" | "raio";
  horarioInicioEntrega: string;
  horarioFimEntrega: string;
  horarioFimEntregaRisco: string;
  tempoEntrega: string;
  custoEntrega: number;
  raioEntregaKm?: number;
  faixasCep?: { cepInicio: string; cepFim: string; taxa: number; tempoMinutos?: number }[];

  // Dados de Retirada
  aceitaRetirada: boolean;
  horarioInicioRetirada: string;
  horarioFimRetirada: string;
  tempoRetirada: string;
  // Outros métodos de entrega
  aceitaUber: boolean;
  custoUber: number | string;
  aceita99: boolean;
  custo99: number | string;
  aceitaMotoboy: boolean;
  custoMotoboy: number | string;
  custoEntregaExpressa?: number | string;
  raiosEntrega?: { ateKm: number; preco: number }[];
  faixasValorPedido?: { valorMin: number; valorMax?: number | null; taxa: number }[];
  // Integração
  sistemaUtilizado?: string;
  vendeIfood?: boolean;
  vendeFarmaciaApp?: boolean;
  // Pixels e Tracking
  googleAnalyticsId?: string;
  googleAdsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  chatgptAdsId?: string;
  // Meios de Entrega Customizados (Associado)
  meiosEntregaPersonalizados?: CustomDeliveryMethod[];
  // Pagamento
  identificadorPagamento?: string;
  hashRecebimento?: string;
  // Dias de entrega (0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab)
  diasEntrega?: number[];
  // Top Bar
  topBarText?: string;
  topBarBgColor?: string;
  topBarTextColor?: string;
  trabalhaComEncarte?: boolean;
}

export interface OrderBumpSettings {
  active: boolean;
  categoryId: string;
  maxPrice: number;
  discountPercentage: number;
}

export interface CompreJuntoSettings {
  active: boolean;
  categoryId: string; // "all" or specific category ID
  maxPrice: number;
}

export interface StorefrontVitrineConfig {
  lancamentos: boolean;
  maisVendidos: boolean;
  destaques: boolean;
  destaquesOrdem: 'alfabetica' | 'recentes' | 'mais_vendidos' | 'menor_preco' | 'maior_preco';
  porCategoria: boolean;
  porCategoriaOrdem: 'recentes' | 'alfabetica' | 'desconto' | 'menor_preco';
  vazia: boolean;
  produtosPorVitrine: number;
}

interface AdminState {
  // Authentication & Authorization
  users: AdminUser[];
  grupos: AdminGroup[];
  currentUser: AdminUser | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  restoreAdminSession: () => Promise<void>;
  register: (user: AdminUser) => void;
  setUsers: (users: AdminUser[]) => void;
  setGrupos: (grupos: AdminGroup[]) => void;
  hasPermission: (permissionId: string) => boolean;

  // Customization
  customCss: string;
  customJs: string;
  customHtml: string;
  logoUrl: string;
  faviconUrl: string;
  setCustomCss: (css: string) => void;
  setCustomJs: (js: string) => void;
  setCustomHtml: (html: string) => void;
  setLogoUrl: (url: string) => void;
  setFaviconUrl: (url: string) => void;
  themeColors: Record<string, string>;
  setThemeColors: (colors: Record<string, string>) => void;

  // Banners
  banners: AdminBanner[];
  bannersLoaded: boolean;
  bannersLoading: boolean;
  bannersByLoja: Record<string, AdminBanner[]>;
  getStoreBanners: (lojaId?: string) => AdminBanner[];
  setBanners: (banners: AdminBanner[]) => void;
  addBanner: (banner: AdminBanner) => Promise<void>;
  updateBanner: (id: string, banner: Partial<AdminBanner>) => Promise<void>;
  removeBanner: (id: string) => Promise<void>;
  fetchBanners: (lojaId?: string) => Promise<void>;

  // Social Networks
  socialNetworks: SocialNetwork[];
  setSocialNetworks: (networks: SocialNetwork[]) => void;

  // Content Pages
  contentPages: ContentPage[];
  setContentPages: (pages: ContentPage[]) => void;

  // Integrations
  integrations: AdminIntegrations;
  setIntegrations: (data: AdminIntegrations) => void;

  // Multi-tenant (Store Selector)
  activeStoreId: string | null;
  setActiveStoreId: (id: string | null) => void;

  // Pharmacies
  pharmacies: Pharmacy[];
  pharmaciesLoaded: boolean;
  pharmaciesFresh: boolean;
  addPharmacy: (p: Pharmacy) => Promise<void>;
  updatePharmacy: (id: string, p: Pharmacy) => Promise<void>;
  togglePharmacyStatus: (id: string) => Promise<void>;
  removePharmacy: (id: string) => Promise<void>;
  loadPharmacies: () => Promise<void>;
  loadUsers: () => Promise<void>;

  // Category Icons & Features
  categoryIcons: Record<string, string>; // categoryId -> base64/url
  setCategoryIcon: (categoryId: string, iconUrl: string) => void;
  featuredCategories: string[];
  toggleFeaturedCategory: (categoryId: string) => void;
  storeFeaturedCategories: Record<string, string[]>;
  toggleStoreFeaturedCategory: (lojaId: string, categoryId: string) => void;
  
  storePanels: StorePanel[];
  generatePanel: (lojaId: string, email?: string, password?: string) => void;
  updatePanelCredentials: (lojaId: string, email?: string, password?: string) => void;
  togglePanelStatus: (lojaId: string) => void;
  deletePanel: (lojaId: string) => void;

  // Marketing
  orderBumpSettings: OrderBumpSettings;
  setOrderBumpSettings: (settings: OrderBumpSettings) => void;
  compreJuntoSettings: CompreJuntoSettings;
  setCompreJuntoSettings: (settings: CompreJuntoSettings) => void;
  // Vitrines da Loja
  storefrontVitrineConfig: StorefrontVitrineConfig;
  setStorefrontVitrineConfig: (config: Partial<StorefrontVitrineConfig>) => void;

  // Link Inscrição
  registrationTokens: RegistrationToken[];
  generateRegistrationToken: (tokenSlug: string, nome?: string) => string | null;
  markRegistrationTokenUsed: (token: string) => void;
  deleteRegistrationToken: (token: string) => void;
  clearRegistrationTokens: () => void;
}

import { lojas } from "@/data/stores";

const defaultPharmacies: Pharmacy[] = lojas.map((l, idx) => {
  const parts = l.endereco.split(" — ");
  const streetParts = parts[0]?.split(",") || [];
  const cityState = parts[1]?.split("/") || [];
  
  return {
    id: l.id,
    ativo: true,
    cnpj: l.cnpj,
    razaoSocial: l.razaoSocial,
    nome: l.nomeFantasia,
    email: "contato@farmaciasassociadas.com.br",
    telefone: "(51) 3333-3333",
    horarioFuncionamento: "08:00 às 22:00",
    diasFuncionamento: [1,2,3,4,5,6], // Segunda a Sábado
      horariosPorDia: [],
      datasEspeciais: [],
    respTecnico: l.farmaceuticoResponsavel,
    inscricaoFarmaceutico: l.crf,
    alvara: l.alvaraSanitario,
    afe: l.afe,
    cep: l.faixasCep?.[0]?.cepInicio || "00000-000",
    uf: cityState[1] || "RS",
    cidade: cityState[0] || "Porto Alegre",
    bairro: "Centro",
    endereco: streetParts[0] || "",
    numero: streetParts[1]?.trim() || "SN",
    complemento: "",
    aceitaEntrega: true,
    modeloFrete: "cep",
    horarioInicioEntrega: "08:00",
    horarioFimEntrega: "22:00",
    horarioFimEntregaRisco: "18:00",
    tempoEntrega: l.faixasCep?.[0]?.tempoMinutos ? `00:${l.faixasCep[0].tempoMinutos}` : "01:00",
    custoEntrega: l.faixasCep?.[0]?.taxa || 5.0,
    raiosEntrega: [],
    faixasValorPedido: [],
    aceitaRetirada: true,
    horarioInicioRetirada: "08:00",
    horarioFimRetirada: "22:00",
    tempoRetirada: "00:15",
    aceitaUber: false,
    custoUber: 15.0,
    aceita99: false,
    custo99: 14.0,
    aceitaMotoboy: true,
    custoMotoboy: 10.0,
    vendeIfood: idx % 2 === 0,
    diasEntrega: [1, 2, 3, 4, 5, 6], // Seg a Sáb por padrão
  };
});

export const defaultBanners: AdminBanner[] = [
  // Full Banner Padrão
  {
    id: "fb-1",
    nome: "Farmácias Associadas - Cuidando de Você e sua Família",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&q=80",
    link: "/",
    posicao: "Full Banner",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  {
    id: "fb-2",
    nome: "Medicamentos e Ofertas com Entrega Rápida",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1920&q=80",
    link: "/c/medicamentos",
    posicao: "Full Banner",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  // Banner Tarja Padrão
  {
    id: "bt-1",
    nome: "Compre pelo site e **receba em casa.**",
    imageUrl: "icon:Truck",
    link: "/",
    posicao: "Banner Tarja",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  {
    id: "bt-2",
    nome: "Compre online e retire na **farmácia mais próxima.**",
    imageUrl: "icon:Store",
    link: "/",
    posicao: "Banner Tarja",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  {
    id: "bt-3",
    nome: "Ofertas exclusivas para **nossos clientes.**",
    imageUrl: "icon:Percent",
    link: "/",
    posicao: "Banner Tarja",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  {
    id: "bt-4",
    nome: "Medicamentos com **procedência garantida.**",
    imageUrl: "icon:ShieldCheck",
    link: "/",
    posicao: "Banner Tarja",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  {
    id: "bt-5",
    nome: "Atendimento farmacêutico **especializado.**",
    imageUrl: "icon:Stethoscope",
    link: "/",
    posicao: "Banner Tarja",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  // Banner Categoria Padrão
  { id: "bc-1", nome: "Remédios para Dor e Febre", imageUrl: "icon:Thermometer", link: "/c/medicamentos", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  { id: "bc-2", nome: "Remédios para Sistema Nervoso", imageUrl: "icon:Leaf", link: "/c/medicamentos", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  { id: "bc-3", nome: "Pastas de Dente e Higiene Bucal", imageUrl: "icon:Smile", link: "/c/higiene-e-cuidados", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  { id: "bc-4", nome: "Sabonetes e Produtos para Corpo", imageUrl: "icon:Droplets", link: "/c/higiene-e-cuidados", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  { id: "bc-5", nome: "Multivitamínicos e Minerais", imageUrl: "icon:Battery", link: "/c/vitaminas-e-suplementos", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  { id: "bc-6", nome: "Shampoos e Tratamentos", imageUrl: "icon:Wind", link: "/c/dermocosm-ticos-e-beleza", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  { id: "bc-7", nome: "Desodorantes e Antitranspirantes", imageUrl: "icon:Wind", link: "/c/higiene-e-cuidados", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  { id: "bc-8", nome: "Sabonetes Íntimos", imageUrl: "icon:Heart", link: "/c/higiene-e-cuidados", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  { id: "bc-9", nome: "Remédios para Gripe e Resfriado", imageUrl: "icon:Thermometer", link: "/c/medicamentos", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
];

const PHARMACIES_CACHE_KEY = 'fa-cached-pharmacies-v1';
const BANNERS_CACHE_KEY = 'fa-cached-banners-v2';
const DELETED_DEFAULT_BANNERS_KEY = 'fa-deleted-default-banners-v1';

export function getInitialDeletedDefaultBanners(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_DEFAULT_BANNERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

export function saveDeletedDefaultBanners(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DELETED_DEFAULT_BANNERS_KEY, JSON.stringify(ids));
  } catch { /* ignore */ }
}

export function getInitialCachedBanners(): { banners: AdminBanner[]; bannersByLoja: Record<string, AdminBanner[]> } {
  if (typeof window === 'undefined') return { banners: defaultBanners, bannersByLoja: {} };
  try {
    const raw = localStorage.getItem(BANNERS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const banners = Array.isArray(parsed.banners) && parsed.banners.length > 0 ? parsed.banners : defaultBanners;
        const bannersByLoja = parsed.bannersByLoja && typeof parsed.bannersByLoja === 'object' ? parsed.bannersByLoja : {};
        return { banners, bannersByLoja };
      }
    }
  } catch { /* ignore */ }
  return { banners: defaultBanners, bannersByLoja: {} };
}

export function saveCachedBanners(banners: AdminBanner[], bannersByLoja: Record<string, AdminBanner[]>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BANNERS_CACHE_KEY, JSON.stringify({ banners, bannersByLoja }));
  } catch { /* ignore */ }
}

const initialCachedBanners = getInitialCachedBanners();

export function getInitialCachedPharmacies(): Pharmacy[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PHARMACIES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

export function saveCachedPharmacies(pharmacies: Pharmacy[]) {
  if (typeof window === 'undefined') return;
  try {
    const minimal = pharmacies.map(p => ({
      id: p.id,
      slug: p.slug,
      nome: p.nome,
      razaoSocial: p.razaoSocial,
      categoriaAssociado: p.categoriaAssociado,
      isPleno: p.isPleno,
      logoUrl: p.logoUrl,
      faviconUrl: p.faviconUrl,
      footerLogoUrl: p.footerLogoUrl,
      topBarBgColor: p.topBarBgColor,
      topBarTextColor: p.topBarTextColor,
      themeColors: p.themeColors,
      offersServices: p.offersServices,
      virtualStoreStatus: p.virtualStoreStatus,
      cidade: p.cidade,
      uf: p.uf,
      bairro: p.bairro,
      telefone: p.telefone,
      whatsapp: p.whatsapp,
    }));
    localStorage.setItem(PHARMACIES_CACHE_KEY, JSON.stringify(minimal));
  } catch { /* ignore */ }
}

const storeBannersCache = new Map<string, { baseBanners: any[]; resolved: AdminBanner[] }>();

export const useAdmin = create<AdminState>()(
  persist(
    (set, get) => ({
      users: [],
      grupos: [
        { 
          id: "grupo-admin", 
          nome: "Admin Global", 
          padrao: true, 
          permissoes: ["dash_view", "rel_metricas_pedidos", "rel_vendas_produto", "rel_desempenho", "rel_logistica_retirada", "rel_aovivo", "vendas_pedidos", "vendas_criar", "vendas_carrinhos", "vendas_links", "lojas_todas", "lojas_nova", "lojas_gerar", "lojas_link", "lojas_tabelas", "lojas_precos", "lojas_paineis", "prod_todos", "prod_novo", "prod_estoque", "prod_avaliacoes", "prod_categorias", "prod_colecoes", "prod_filtros", "prod_espera", "prod_marcas", "prod_perguntas", "prod_selos", "prod_variacoes", "cli_todos", "cli_leads", "canais_google", "canais_ifood", "canais_farmaciasapp", "pbms_view", "pers_logo", "pers_cores", "pers_banners", "pers_redes", "pers_paginas", "int_api", "int_cofre", "mkt_cupons", "mkt_promocoes", "mkt_orderbumps", "mkt_comprejunto", "sol_apps", "conf_dados", "conf_dominios", "conf_pagamentos", "conf_usuarios", "loja_pedidos", "loja_promocoes", "loja_cupons", "loja_seo", "loja_metricas", "loja_relatorios", "loja_personalizar", "loja_configuracoes"] 
        },
        { 
          id: "grupo-associado-pleno", 
          nome: "Painel do Associado (Pleno)", 
          padrao: true, 
          permissoes: ["lojas_precos", "loja_pedidos", "loja_promocoes", "loja_cupons", "loja_seo", "loja_metricas", "loja_relatorios", "loja_personalizar", "loja_configuracoes", "prod_novo", "prod_todos", "prod_categorias", "prod_estoque", "prod_avaliacoes", "prod_colecoes", "prod_filtros", "prod_espera", "prod_marcas", "prod_perguntas", "prod_selos", "prod_variacoes", "vendas_pedidos"] 
        },
        { 
          id: "grupo-associado-parceiro", 
          nome: "Painel do Associado (Parceiro)", 
          padrao: true, 
          permissoes: ["lojas_precos", "loja_pedidos", "loja_promocoes", "loja_cupons", "loja_seo", "loja_metricas", "loja_relatorios", "loja_personalizar", "loja_configuracoes", "prod_novo", "prod_todos", "prod_categorias", "prod_estoque", "prod_avaliacoes", "prod_colecoes", "prod_filtros", "prod_espera", "prod_marcas", "prod_perguntas", "prod_selos", "prod_variacoes", "vendas_pedidos"] 
        }
      ],
      currentUser: null,
      login: async (email, password) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error || !data.user) {
            console.error("Login Supabase falhou:", error?.message);
            return { success: false, message: error?.message === "Email not confirmed" ? "E-mail não confirmado. Verifique sua caixa de entrada." : "Credenciais inválidas." };
          }

          // Fetch the profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          const localUser = get().users.find(u => u.email === email);

          if (profile) {
            const p = profile as any;
            const isFallbackAdmin = email === "nyckolas.lopes@farmaciasassociadas.com.br" || email === "thiago.rocha@farmaciasassociadas.com.br";
            
            const isProprietario = p.is_admin || localUser?.proprietario || isFallbackAdmin;
            const grupoId = p.grupo_id || localUser?.grupoId;
            const lojasVinculadas = p.lojas_vinculadas || localUser?.lojasVinculadas || [];

            // SECURITY CHECK: Se não tem nenhuma permissão administrativa, não permite login no admin
            if (!isProprietario && !grupoId && lojasVinculadas.length === 0) {
              await supabase.auth.signOut();
              return { success: false, message: "Acesso negado. Sua conta não possui permissões administrativas." };
            }

            const adminUserObj = {
              id: p.id,
              name: p.nome || localUser?.name || email.split("@")[0],
              email: p.email || email,
              grupoId: grupoId,
              proprietario: isProprietario,
              lojasVinculadas: lojasVinculadas,
            };

            if (typeof window !== 'undefined') {
              try {
                sessionStorage.setItem('fa-admin-session', JSON.stringify(adminUserObj));
                localStorage.removeItem('admin-storage-local');
                localStorage.removeItem('fa-admin-store-v4-local');
              } catch {}
            }

            set({
              currentUser: adminUserObj,
            });
            return { success: true };
          }

          // Se não encontrou o profile ainda, loga com o que tem
          const isFallbackAdminFallback = email === "nyckolas.lopes@farmaciasassociadas.com.br" || email === "thiago.rocha@farmaciasassociadas.com.br";
          const isProprietarioFallback = localUser?.proprietario || isFallbackAdminFallback;
          const grupoIdFallback = localUser?.grupoId;
          const lojasVinculadasFallback = localUser?.lojasVinculadas || [];

          // SECURITY CHECK for fallback
          if (!isProprietarioFallback && !grupoIdFallback && lojasVinculadasFallback.length === 0) {
            await supabase.auth.signOut();
            return { success: false, message: "Acesso negado. Sua conta não possui permissões administrativas." };
          }

          const fallbackAdminObj = {
            id: data.user.id,
            name: localUser?.name || email.split("@")[0],
            email: email,
            grupoId: grupoIdFallback,
            lojasVinculadas: lojasVinculadasFallback,
            proprietario: isProprietarioFallback,
          };

          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('fa-admin-session', JSON.stringify(fallbackAdminObj));
              localStorage.removeItem('admin-storage-local');
              localStorage.removeItem('fa-admin-store-v4-local');
            } catch {}
          }

          set({
            currentUser: fallbackAdminObj,
          });
          return { success: true };
        } catch (e: any) {
          console.error(e);
          return { success: false, message: e.message || "Erro desconhecido" };
        }
      },
      restoreAdminSession: async () => {
        try {
          if (get().currentUser) return;

          // Restaura a sessão do admin APENAS da sessionStorage da aba ativa (nunca de clientes na loja nem do Supabase geral)
          if (typeof window !== 'undefined') {
            const sessionData = sessionStorage.getItem('fa-admin-session');
            if (sessionData) {
              const parsed = JSON.parse(sessionData);
              if (parsed && parsed.id && parsed.email) {
                set({
                  currentUser: parsed,
                });
                return;
              }
            }
            // Limpa resíduos antigos de localStorage para garantir que não auto-logue
            localStorage.removeItem('admin-storage-local');
            localStorage.removeItem('fa-admin-store-v4-local');
          }
        } catch (err) {
          console.warn("Falha ao restaurar sessão admin:", err);
        }
      },
      logout: async () => {
        if (typeof window !== 'undefined') {
          (window as any)._isLoggingOutAdmin = true;
          try {
            sessionStorage.removeItem('fa-admin-session');
            localStorage.removeItem('admin-storage-local');
            localStorage.removeItem('fa-admin-store-v4-local');
          } catch {}
        }
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.error("Erro ao fazer logout no Supabase", e);
        }
        
        set({ currentUser: null, activeStoreId: null });

        if (typeof window !== 'undefined') {
          window.location.href = '/admin?logout=1';
        }
      },
      register: (user) => set((s) => ({ users: [...s.users, user] })),
      setUsers: (users) => set({ users }),
      loadUsers: async () => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error || !data) return;
        
        const profiles = (data as any[]) || [];
        set((s) => {
          // Filtrar apenas usuários que são admin ou que pertencem a algum grupo administrativo
          const adminUsers = profiles.filter((p: any) => p.is_admin || p.grupo_id);
          
          return { 
            users: adminUsers.map(p => ({
              id: p.id,
              name: p.nome || p.email?.split("@")[0] || "Usuário",
              email: p.email || "",
              grupoId: p.grupo_id || undefined,
              proprietario: p.is_admin || false,
              lojasVinculadas: p.lojas_vinculadas || []
            })) 
          };
        });
      },
      setGrupos: (grupos) => set({ grupos }),
      hasPermission: (permissionId) => {
        const { currentUser, grupos } = get();
        if (!currentUser) return false;

        // Ensure these two specific users ALWAYS have full access, even if loaded from older localStorage cache
        if (
          currentUser.proprietario || 
          currentUser.email === "nyckolas.lopes@farmaciasassociadas.com.br" ||
          currentUser.email === "thiago.rocha@farmaciasassociadas.com.br"
        ) {
          return true;
        }

        if (!currentUser.grupoId) return false;
        const grupo = grupos.find(g => g.id === currentUser.grupoId);
        if (!grupo) return false;
        
        // Se a permissão começa com loja_ e o grupo não tem NENHUMA permissão loja_ (cache antigo), 
        // e é o grupo Associado ou Admin, libera o acesso para não sumir do nada.
        if (permissionId.startsWith("loja_") && !grupo.permissoes.some(p => p.startsWith("loja_"))) {
          if (grupo.id.startsWith("grupo-associado") || grupo.id === "grupo-admin") {
            return true;
          }
        }

        return grupo.permissoes.includes(permissionId);
      },

      // Marketing
      orderBumpSettings: { active: true, categoryId: "145", maxPrice: 80, discountPercentage: 1 },
      setOrderBumpSettings: (settings) => set({ orderBumpSettings: settings }),
      compreJuntoSettings: { active: true, categoryId: "all", maxPrice: 9999 },
      setCompreJuntoSettings: (settings) => set({ compreJuntoSettings: settings }),

      // Social Networks
      socialNetworks: [],
      setSocialNetworks: (networks) => set({ socialNetworks: networks }),

      // Content Pages
      contentPages: [
        // Institucional
        { id: "p1", title: "Quem Somos", slug: "quem-somos", location: "footer", footerColumn: "Institucional", type: "text", content: "<h1>Quem Somos</h1><p>Conteúdo da página quem somos.</p>" },
        { id: "p2", title: "Política de Privacidade", slug: "politica-de-privacidade", location: "footer", footerColumn: "Institucional", type: "text", content: "<h1>Política de Privacidade</h1><p>Conteúdo da página de política de privacidade.</p>" },
        { id: "p3", title: "Trocas e Devoluções", slug: "trocas-e-devolucoes", location: "footer", footerColumn: "Institucional", type: "text", content: "<h1>Trocas e Devoluções</h1><p>Conteúdo da página de trocas e devoluções.</p>" },
        { id: "p4", title: "Nossas Lojas", slug: "nossas-lojas", location: "footer", footerColumn: "Institucional", type: "external", externalUrl: "/lojas" },
        { id: "p5", title: "Trabalhe Conosco", slug: "trabalhe-conosco", location: "footer", footerColumn: "Institucional", type: "text", content: "<h1>Trabalhe Conosco</h1><p>Venha fazer parte da nossa equipe.</p>" },
        { id: "p6", title: "Blog Farmácias Associadas", slug: "blog", location: "footer", footerColumn: "Institucional", type: "external", externalUrl: "https://blog.farmaciasassociadas.com.br" },
        { id: "p7", title: "Revista", slug: "revista", location: "footer", footerColumn: "Institucional", type: "external", externalUrl: "https://www.farmaciasassociadas.com.br/revista" },
        { id: "p8", title: "Seja um associado", slug: "seja-associado", location: "footer", footerColumn: "Institucional", type: "external", externalUrl: "https://www.farmaciasassociadas.com.br/seja-um-associado" },
        { id: "p9", title: "Portal do associado", slug: "portal-associado", location: "footer", footerColumn: "Institucional", type: "external", externalUrl: "https://portal.farmaciasassociadas.com.br" },
        
        // Navegação
        { id: "pn1", title: "Mapa do Site", slug: "mapa-site", location: "footer", footerColumn: "Navegação", type: "external", externalUrl: "/mapa" },
        { id: "pn2", title: "Categorias", slug: "todas-categorias", location: "footer", footerColumn: "Navegação", type: "external", externalUrl: "/c" },
        { id: "pn3", title: "Marcas", slug: "todas-marcas", location: "footer", footerColumn: "Navegação", type: "external", externalUrl: "/m" },
        { id: "pn4", title: "Princípios Ativos", slug: "principios-ativos", location: "footer", footerColumn: "Navegação", type: "text", content: "<h1>Princípios Ativos</h1>" },
        { id: "pn5", title: "Classes Terapêuticas", slug: "classes-terapeuticas", location: "footer", footerColumn: "Navegação", type: "text", content: "<h1>Classes Terapêuticas</h1>" },
        { id: "pn6", title: "Bulas de A a Z", slug: "bulas", location: "footer", footerColumn: "Navegação", type: "text", content: "<h1>Bulas de A a Z</h1>" },

        // Serviços
        { id: "ps1", title: "Serviços de Saúde", slug: "servicos-de-saude", location: "footer", footerColumn: "Serviços", type: "external", externalUrl: "/servicos" },
        { id: "ps2", title: "Vacinas", slug: "vacinas", location: "footer", footerColumn: "Serviços", type: "external", externalUrl: "/servicos/vacinas" },
        { id: "ps3", title: "Testes Rápidos", slug: "testes-rapidos", location: "footer", footerColumn: "Serviços", type: "external", externalUrl: "/servicos/testes-rapidos" },
        { id: "ps4", title: "Aferição de Pressão", slug: "afericao-pressao", location: "footer", footerColumn: "Serviços", type: "external", externalUrl: "/servicos/afericao" },

        // Perfil
        { id: "pp1", title: "Criar Cadastro", slug: "criar-cadastro", location: "footer", footerColumn: "Perfil", type: "external", externalUrl: "/conta/login?mode=register" },
        { id: "pp2", title: "Alterar Dados", slug: "alterar-dados", location: "footer", footerColumn: "Perfil", type: "external", externalUrl: "/conta/perfil" },
        { id: "pp3", title: "Endereços", slug: "enderecos", location: "footer", footerColumn: "Perfil", type: "external", externalUrl: "/conta/enderecos" },
        { id: "pp4", title: "Acompanhar Pedido", slug: "acompanhar-pedido", location: "footer", footerColumn: "Perfil", type: "external", externalUrl: "/conta/pedidos" },

        // Atendimento
        { id: "p10", title: "Central de Atendimento", slug: "central-atendimento", location: "footer", footerColumn: "Atendimento", type: "text", content: "<h1>Central de Atendimento</h1><p>Entre em contato conosco pelos nossos canais oficiais.</p>" },
        { id: "p11", title: "WhatsApp", slug: "whatsapp", location: "footer", footerColumn: "Atendimento", type: "external", externalUrl: "https://wa.me/5551989444818" },
        { id: "p12", title: "Como Comprar", slug: "como-comprar", location: "footer", footerColumn: "Atendimento", type: "text", content: "<h1>Como Comprar</h1><p>Aprenda o passo a passo de como realizar sua compra.</p>" },
        { id: "p14", title: "Prazos", slug: "prazo-entrega", location: "footer", footerColumn: "Atendimento", type: "text", content: "<h1>Prazos de Entrega</h1><p>Saiba mais sobre os prazos de entrega da sua região.</p>" },
        { id: "p15", title: "Reembolso", slug: "cancelamento", location: "footer", footerColumn: "Atendimento", type: "text", content: "<h1>Política de Reembolso</h1><p>Como funciona o cancelamento e estorno.</p>" },
        { id: "p16", title: "FAQ", slug: "faq", location: "footer", footerColumn: "Atendimento", type: "text", content: "<h1>FAQ - Perguntas Frequentes</h1><p>Tire suas dúvidas.</p>" },
        
        // Segurança
        { id: "p17", title: "Proteção de Dados", slug: "protecao-dados", location: "footer", footerColumn: "Segurança", type: "text", content: "<h1>Proteção de Dados</h1><p>Saiba como tratamos os seus dados pessoais.</p>" },
        { id: "p18", title: "Termos de Uso", slug: "termos-de-uso", location: "footer", footerColumn: "Segurança", type: "text", content: "<h1>Termos de Uso</h1><p>Termos e condições para uso da plataforma.</p>" },
        { id: "p19", title: "Portal do Titular", slug: "portal-titular", location: "footer", footerColumn: "Segurança", type: "external", externalUrl: "https://www.farmaciasassociadas.com.br/portal-titular" }
      ],
      setContentPages: (pages) => set({ contentPages: pages }),

      activeStoreId: null,
      setActiveStoreId: (id) => set({ activeStoreId: id }),

      customCss: "",
      customJs: "",
      customHtml: "",
      logoUrl: "",
      faviconUrl: "",
      setCustomCss: (customCss) => set({ customCss }),
      setCustomJs: (customJs) => set({ customJs }),
      setCustomHtml: (customHtml) => set({ customHtml }),
      setLogoUrl: (logoUrl) => set({ logoUrl }),
      setFaviconUrl: (faviconUrl) => set({ faviconUrl }),
      themeColors: {},
      setThemeColors: (themeColors) => set({ themeColors }),

      banners: initialCachedBanners.banners,
      bannersLoaded: initialCachedBanners.banners.length > 0,
      bannersLoading: false,
      bannersByLoja: initialCachedBanners.bannersByLoja,
      deletedDefaultBannerIds: getInitialDeletedDefaultBanners(),
      getStoreBanners: (lojaId?: string) => {
        const state = get() as any;
        const key = lojaId || "global";
        const lojaBanners = state.bannersByLoja?.[key];
        const baseBanners = (lojaBanners && lojaBanners.length > 0) ? lojaBanners : (state.banners || []);
        const deletedIds = new Set(state.deletedDefaultBannerIds || getInitialDeletedDefaultBanners());

        const cached = storeBannersCache.get(key);
        if (cached && cached.baseBanners === baseBanners) {
          return cached.resolved;
        }

        const matchPos = (b: AdminBanner, pos: string) => {
          const pPos = pos.toLowerCase().trim();
          const bPos = (b.posicao || "").toLowerCase().trim();
          if (pPos === bPos) return true;
          if (pPos === "banner compre por categoria" && (bPos === "banner categoria" || bPos.includes("categoria"))) return true;
          if (pPos === "banner categoria" && (bPos === "banner compre por categoria" || bPos.includes("categoria"))) return true;
          if (pPos === "banner tarja" && (bPos.includes("tarja") || bPos === "banner tarja")) return true;
          return false;
        };

        const activeBanners = baseBanners.filter((b: AdminBanner) => (!b.lojaId || (lojaId && b.lojaId === lojaId)) && !deletedIds.has(b.id));
        
        const ALL_POSITIONS = [
          "Full Banner",
          "Mini Banner",
          "Banner Tarja",
          "Banner Compre por categoria",
          "Banner por Categoria",
          "Banner Extra",
          "Banner Diferenciais"
        ];

        const rawResolved: AdminBanner[] = [];

        ALL_POSITIONS.forEach(pos => {
          // 1. Banners customizados da loja
          const storeSpecific = activeBanners.filter((b: AdminBanner) => b.lojaId === lojaId && matchPos(b, pos));
          if (storeSpecific.length > 0) {
            rawResolved.push(...storeSpecific);
            return;
          }

          // 2. Banners globais salvos no banco de dados
          const globalFromDb = activeBanners.filter((b: AdminBanner) => !b.lojaId && matchPos(b, pos));
          if (globalFromDb.length > 0) {
            rawResolved.push(...globalFromDb);
            return;
          }

          // 3. Fallback para defaultBanners da respectiva posição (exceto os excluídos)
          const defaultsForPos = defaultBanners.filter(b => matchPos(b, pos) && !deletedIds.has(b.id));
          if (defaultsForPos.length > 0) {
            rawResolved.push(...defaultsForPos);
          }
        });

        // Adiciona quaisquer outros banners customizados
        activeBanners.forEach((b: AdminBanner) => {
          if (!ALL_POSITIONS.some(pos => matchPos(b, pos)) && !rawResolved.some(r => r.id === b.id)) {
            rawResolved.push(b);
          }
        });

        // Desduplicação estrita por ID e assinatura de conteúdo
        const uniqueResolved: AdminBanner[] = [];
        const seenKeys = new Set<string>();

        for (const b of rawResolved) {
          if (deletedIds.has(b.id)) continue;
          const signature = `${b.posicao}|${b.nome || ''}|${b.imageUrl || ''}|${b.lojaId || 'global'}`;
          if (!seenKeys.has(b.id) && !seenKeys.has(signature)) {
            seenKeys.add(b.id);
            seenKeys.add(signature);
            uniqueResolved.push(b);
          }
        }

        storeBannersCache.set(key, { baseBanners, resolved: uniqueResolved });
        return uniqueResolved;
      },
      setBanners: (banners) => {
        saveCachedBanners(banners, {});
        set({ banners, bannersLoaded: true });
      },
      fetchBanners: async (lojaId?: string) => {
        const key = lojaId || "global";
        const state = get() as any;
        if (state.bannersByLoja && state.bannersByLoja[key] && state.bannersByLoja[key].length > 0) {
          // Atualiza banners com os dados específicos desta loja se for a loja ativa
          set({ banners: state.bannersByLoja[key], bannersLoaded: true, bannersLoading: false });
        } else if (!state.banners || state.banners.length === 0) {
          set({ bannersLoading: true });
        }

        try {
          let query = supabase.from('banners' as any).select('*');
          if (lojaId) {
            query = query.or(`loja_id.eq.${lojaId},loja_id.is.null`);
          } else {
            query = query.is('loja_id', null);
          }
          const { data, error } = await query;
          if (!error && data) {
            const formatToLocalDatetime = (isoString: string) => {
              if (!isoString) return "";
              const d = new Date(isoString);
              if (isNaN(d.getTime())) return "";
              const pad = (n: number) => n.toString().padStart(2, '0');
              return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            };

            const parsedBanners = data.map((b: any) => ({
              id: b.id,
              nome: b.nome,
              imageUrl: b.image_url,
              mobileImageUrl: b.mobile_image_url,
              link: b.link,
              posicao: b.posicao,
              paginaPublicacao: b.pagina_publicacao,
              titulo: b.titulo,
              active: b.ativo,
              startDate: b.start_date ? formatToLocalDatetime(b.start_date) : "",
              endDate: b.end_date ? formatToLocalDatetime(b.end_date) : "",
              lojaId: b.loja_id,
              vitrineVinculada: b.vitrine_vinculada,
              bannerVinculado: b.banner_vinculado,
              topicoVinculado: b.topico_vinculado,
              formatoExtra: b.formato_extra,
              imageUrl2: b.image_url2,
              mobileImageUrl2: b.mobile_image_url2,
              link2: b.link2,
              imageUrl3: b.image_url3,
              mobileImageUrl3: b.mobile_image_url3,
              link3: b.link3,
              ordem: b.ordem ?? 0,
            })) as AdminBanner[];

            const finalBanners = parsedBanners.length > 0 ? parsedBanners : defaultBanners.filter(b => !b.lojaId || b.lojaId === lojaId);
            set((s: any) => {
              const nextByLoja = { ...s.bannersByLoja, [key]: finalBanners };
              saveCachedBanners(finalBanners, nextByLoja);
              return {
                banners: finalBanners,
                bannersLoaded: true,
                bannersLoading: false,
                bannersByLoja: nextByLoja,
              };
            });
          } else {
            set({ bannersLoaded: true, bannersLoading: false });
          }
        } catch {
          set({ bannersLoaded: true, bannersLoading: false });
        }
      },
      addBanner: async (banner) => {
        const cleanBanner = await sanitizeBannerImages(banner);
        const payload = {
          nome: cleanBanner.nome,
          image_url: cleanBanner.imageUrl,
          mobile_image_url: cleanBanner.mobileImageUrl,
          link: cleanBanner.link,
          posicao: cleanBanner.posicao,
          pagina_publicacao: cleanBanner.paginaPublicacao,
          titulo: cleanBanner.titulo,
          ativo: cleanBanner.active,
          start_date: (cleanBanner.startDate && cleanBanner.startDate.trim() !== "") ? new Date(cleanBanner.startDate).toISOString() : null,
          end_date: (cleanBanner.endDate && cleanBanner.endDate.trim() !== "") ? new Date(cleanBanner.endDate).toISOString() : null,
          loja_id: cleanBanner.lojaId || null,
          vitrine_vinculada: cleanBanner.vitrineVinculada,
          formato_extra: cleanBanner.formatoExtra,
          image_url2: cleanBanner.imageUrl2,
          mobile_image_url2: cleanBanner.mobileImageUrl2,
          link2: cleanBanner.link2,
          image_url3: cleanBanner.imageUrl3,
          mobile_image_url3: cleanBanner.mobileImageUrl3,
          link3: cleanBanner.link3,
          // ordem: cleanBanner.ordem ?? 0,
        };
        const { data, error } = await supabase.from('banners' as any).insert(payload).select().single();
        if (error) {
          console.error("Erro ao adicionar banner:", error, "Payload enviado:", payload);
          throw error;
        }
        if (data) {
          set((s: any) => ({ bannersByLoja: {} }));
          get().fetchBanners(cleanBanner.lojaId);
        }
      },
      updateBanner: async (id, banner) => {
        const cleanBanner = await sanitizeBannerImages(banner);
        const payload: any = {};
        if (cleanBanner.nome !== undefined) payload.nome = cleanBanner.nome;
        if (cleanBanner.imageUrl !== undefined) payload.image_url = cleanBanner.imageUrl;
        if (cleanBanner.mobileImageUrl !== undefined) payload.mobile_image_url = cleanBanner.mobileImageUrl;
        if (cleanBanner.link !== undefined) payload.link = cleanBanner.link;
        if (cleanBanner.posicao !== undefined) payload.posicao = cleanBanner.posicao;
        if (cleanBanner.paginaPublicacao !== undefined) payload.pagina_publicacao = cleanBanner.paginaPublicacao;
        if (cleanBanner.titulo !== undefined) payload.titulo = cleanBanner.titulo;
        if (cleanBanner.active !== undefined) payload.ativo = cleanBanner.active;
        if (cleanBanner.startDate !== undefined) payload.start_date = (cleanBanner.startDate && cleanBanner.startDate.trim() !== "") ? new Date(cleanBanner.startDate).toISOString() : null;
        if (cleanBanner.endDate !== undefined) payload.end_date = (cleanBanner.endDate && cleanBanner.endDate.trim() !== "") ? new Date(cleanBanner.endDate).toISOString() : null;
        if (cleanBanner.lojaId !== undefined) payload.loja_id = cleanBanner.lojaId;
        if (cleanBanner.vitrineVinculada !== undefined) payload.vitrine_vinculada = cleanBanner.vitrineVinculada;
        if (cleanBanner.formatoExtra !== undefined) payload.formato_extra = cleanBanner.formatoExtra;
        if (cleanBanner.imageUrl2 !== undefined) payload.image_url2 = cleanBanner.imageUrl2;
        if (cleanBanner.mobileImageUrl2 !== undefined) payload.mobile_image_url2 = cleanBanner.mobileImageUrl2;
        if (cleanBanner.link2 !== undefined) payload.link2 = cleanBanner.link2;
        if (cleanBanner.imageUrl3 !== undefined) payload.image_url3 = cleanBanner.imageUrl3;
        if (cleanBanner.mobileImageUrl3 !== undefined) payload.mobile_image_url3 = cleanBanner.mobileImageUrl3;
        if (cleanBanner.link3 !== undefined) payload.link3 = cleanBanner.link3;
        // if (cleanBanner.ordem !== undefined) payload.ordem = cleanBanner.ordem;
        
        const { error } = await supabase.from('banners' as any).update(payload).eq('id', id);
        if (error) {
          console.error("Erro ao atualizar banner:", error, "Payload enviado:", payload);
          throw error;
        }
        if (!error) {
          set((s: any) => ({ bannersByLoja: {} }));
          get().fetchBanners(get().activeStoreId || undefined);
        }
      },
      removeBanner: async (id: string) => {
        const isDefault = defaultBanners.some(b => b.id === id) || id.startsWith("bt-") || id.startsWith("bc-") || id.startsWith("fb-");
        
        set((s: any) => {
          const nextDeleted = isDefault 
            ? Array.from(new Set([...(s.deletedDefaultBannerIds || []), id]))
            : (s.deletedDefaultBannerIds || []);
          
          if (isDefault) {
            saveDeletedDefaultBanners(nextDeleted);
          }

          const filteredBanners = (s.banners || []).filter((b: any) => b.id !== id);
          const nextByLoja: Record<string, AdminBanner[]> = {};
          if (s.bannersByLoja) {
            Object.entries(s.bannersByLoja).forEach(([k, list]: [string, any]) => {
              if (Array.isArray(list)) {
                nextByLoja[k] = list.filter((b: any) => b.id !== id);
              }
            });
          }

          saveCachedBanners(filteredBanners, nextByLoja);
          storeBannersCache.clear();

          return {
            deletedDefaultBannerIds: nextDeleted,
            banners: filteredBanners,
            bannersByLoja: nextByLoja,
          };
        });

        try {
          await supabase.from('banners' as any).delete().eq('id', id);
        } catch { /* ignore if not in db */ }
      },

      integrations: { webhookUrl: "", apiKey: "" },
      setIntegrations: (integrations) => set({ integrations }),

      pharmacies: getInitialCachedPharmacies(),
      pharmaciesLoaded: getInitialCachedPharmacies().length > 0,
      pharmaciesFresh: false,
      loadPharmacies: async () => {
        // Throttle: ignora chamadas duplicadas dentro de 5s (evita duplo fetch no boot)
        const now = Date.now();
        const last = (loadPharmaciesThrottle as any)._lastCall || 0;
        if (now - last < 5000) {
          // Mesmo throttlado, desbloqueia a UI — os dados já foram carregados pelo primeiro fetch
          set({ pharmaciesLoaded: true });
          return;
        }
        (loadPharmaciesThrottle as any)._lastCall = now;

        try {
          const { data, error } = await supabase.from('lojas').select('*');
          if (!error && data) {
            const loadedPharmacies: Pharmacy[] = data.map((l: any) => {
              let parsedThemeColors: any = {};
              try {
                parsedThemeColors = typeof l.theme_colors === 'string' ? JSON.parse(l.theme_colors) : (l.theme_colors || {});
              } catch (e) {
                console.error("Erro ao parsear theme_colors", e);
              }
              return {
                id: l.id,
                slug: l.slug || parsedThemeColors?.slug,
                ativo: l.ativa ?? true,
                cnpj: l.cnpj,
                razaoSocial: l.razao_social,
                nome: l.nome_fantasia,
                email: l.email,
                telefone: l.telefone,
                horarioFuncionamento: l.horario_funcionamento || parsedThemeColors?.horario_funcionamento,
                diasFuncionamento: parsedThemeColors?.diasFuncionamento || [1,2,3,4,5,6],
                  horariosPorDia: parsedThemeColors?.horariosPorDia || [],
                  datasEspeciais: parsedThemeColors?.datasEspeciais || [],
                respTecnico: l.farmaceutico_responsavel || parsedThemeColors?.farmaceutico_responsavel,
                inscricaoFarmaceutico: l.crf || parsedThemeColors?.crf,
                alvara: l.alvara_sanitario || parsedThemeColors?.alvara_sanitario,
                afe: l.afe || parsedThemeColors?.afe,
                cep: l.cep || '',
                endereco: l.logradouro || '',
                numero: l.numero || '',
                complemento: l.complemento || parsedThemeColors?.complemento || '',
                bairro: l.bairro || '',
                cidade: l.cidade || '',
                uf: l.estado || '',
                whatsapp: l.whatsapp || parsedThemeColors?.whatsapp || '',
                pageTitle: parsedThemeColors?.pageTitle || '',
                metaDescription: parsedThemeColors?.metaDescription || '',
                seoDescricao: parsedThemeColors?.seoDescricao || '',
                facebookPixelId: parsedThemeColors?.facebookPixelId || '',
                googleAnalyticsId: parsedThemeColors?.googleAnalyticsId || '',
                googleTagManagerId: parsedThemeColors?.googleTagManagerId || '',
                footerPlataformaTexto: l.footer_plataforma_texto || parsedThemeColors?.footer_plataforma_texto || '',
                footerDescricao: l.footer_descricao || parsedThemeColors?.footer_descricao || '',
                footerTituloContato: l.footer_titulo_contato || parsedThemeColors?.footer_titulo_contato || '',
                socialLinks: l.social_links || parsedThemeColors?.social_links || {},
                topBarText: parsedThemeColors?.topBarText || '',
                topBarBgColor: parsedThemeColors?.topBarBgColor || '',
                topBarTextColor: parsedThemeColors?.topBarTextColor || '',
                latitude: l.latitude,
                longitude: l.longitude,
                logoUrl: parsedThemeColors?.logoUrl || '',
                faviconUrl: parsedThemeColors?.faviconUrl || '',
                loadingLogoUrl: parsedThemeColors?.loadingLogoUrl || '',
                footerLogoUrl: parsedThemeColors?.footerLogoUrl || '',
                anvisaLogoUrl: parsedThemeColors?.anvisaLogoUrl || '',
                categoriaAssociado: l.categoria_associado || parsedThemeColors?.categoria_associado,
                customPages: parsedThemeColors?.customPages || [],
                trabalhaComEncarte: l.trabalha_com_encarte || parsedThemeColors?.trabalha_com_encarte,
                entregaExpressa: l.entrega_expressa || parsedThemeColors?.entrega_expressa,
                virtualStoreStatus: l.status_loja_virtual || parsedThemeColors?.status_loja_virtual,
                isVirtualStoreGenerated: !!l.status_loja_virtual,
                api_key: l.api_key,
                aceitaEntrega: parsedThemeColors?.aceitaEntrega ?? false,
                modeloFrete: parsedThemeColors?.modeloFrete ?? 'raio',
                horarioInicioEntrega: parsedThemeColors?.horarioInicioEntrega ?? '',
                horarioFimEntrega: parsedThemeColors?.horarioFimEntrega ?? '',
                horarioFimEntregaRisco: parsedThemeColors?.horarioFimEntregaRisco ?? '',
                tempoEntrega: parsedThemeColors?.tempoEntrega ?? '',
                custoEntrega: parsedThemeColors?.custoEntrega ?? 0,
                raioEntregaKm: parsedThemeColors?.raioEntregaKm,
                faixasCep: parsedThemeColors?.faixasCep ?? [],
                aceitaRetirada: parsedThemeColors?.aceitaRetirada ?? false,
                horarioInicioRetirada: parsedThemeColors?.horarioInicioRetirada ?? '',
                horarioFimRetirada: parsedThemeColors?.horarioFimRetirada ?? '',
                tempoRetirada: parsedThemeColors?.tempoRetirada ?? '',
                aceitaUber: parsedThemeColors?.aceitaUber ?? false,
                custoUber: parsedThemeColors?.custoUber ?? 0,
                aceita99: parsedThemeColors?.aceita99 ?? false,
                custo99: parsedThemeColors?.custo99 ?? 0,
                aceitaMotoboy: parsedThemeColors?.aceitaMotoboy ?? false,
                custoMotoboy: parsedThemeColors?.custoMotoboy ?? 0,
                custoEntregaExpressa: parsedThemeColors?.custoEntregaExpressa ?? 0,
                raiosEntrega: parsedThemeColors?.raiosEntrega ?? [],
                faixasValorPedido: parsedThemeColors?.faixasValorPedido ?? [],
                meiosEntregaPersonalizados: parsedThemeColors?.meiosEntregaPersonalizados ?? [],
                themeColors: parsedThemeColors && Object.keys(parsedThemeColors).length > 0 ? parsedThemeColors : undefined,
                sistemaUtilizado: l.sistema_utilizado || parsedThemeColors?.sistemaUtilizado || '',
                offersServices: parsedThemeColors?.offersServices ?? false,
              };
            }) as unknown as Pharmacy[];
            saveCachedPharmacies(loadedPharmacies);
            set({ pharmacies: loadedPharmacies, pharmaciesLoaded: true, pharmaciesFresh: true });
          } else {
            // Mesmo em caso de erro, desbloqueia a UI (mostra loja vazia ou fallback)
            set({ pharmaciesLoaded: true, pharmaciesFresh: true });
          }
        } catch {
          // Erro de rede — desbloqueia a UI para não ficar em spinner infinito
          set({ pharmaciesLoaded: true });
        }
      },

      addPharmacy: async (p) => {
        const theme_colors_payload = {
          ...(p.themeColors || {}),
          complemento: p.complemento,
          sistemaUtilizado: p.sistemaUtilizado,
          offersServices: p.offersServices,
          footer_plataforma_texto: p.footerPlataformaTexto,
          footer_descricao: p.footerDescricao,
          footer_titulo_contato: p.footerTituloContato,
          social_links: p.socialLinks,
          topBarText: p.topBarText,
          topBarBgColor: p.topBarBgColor,
          topBarTextColor: p.topBarTextColor,
          pageTitle: p.pageTitle,
          metaDescription: p.metaDescription,
          seoDescricao: p.seoDescricao,
          facebookPixelId: p.facebookPixelId,
          googleAnalyticsId: p.googleAnalyticsId,
          googleTagManagerId: p.googleTagManagerId,
          whatsapp: p.whatsapp,
          logoUrl: p.logoUrl,
          faviconUrl: p.faviconUrl,
          loadingLogoUrl: p.loadingLogoUrl,
          footerLogoUrl: p.footerLogoUrl,
          anvisaLogoUrl: p.anvisaLogoUrl,
          horario_funcionamento: p.horarioFuncionamento,
          diasFuncionamento: p.diasFuncionamento,
            horariosPorDia: p.horariosPorDia,
            datasEspeciais: p.datasEspeciais,
          farmaceutico_responsavel: p.respTecnico,
          crf: p.inscricaoFarmaceutico,
          alvara_sanitario: p.alvara,
          afe: p.afe,
          entrega_expressa: p.entregaExpressa,
          status_loja_virtual: p.virtualStoreStatus,
          categoria_associado: p.categoriaAssociado,
          trabalha_com_encarte: p.trabalhaComEncarte,
          aceitaEntrega: p.aceitaEntrega,
          modeloFrete: p.modeloFrete,
          horarioInicioEntrega: p.horarioInicioEntrega,
          horarioFimEntrega: p.horarioFimEntrega,
          horarioFimEntregaRisco: p.horarioFimEntregaRisco,
          tempoEntrega: p.tempoEntrega,
          custoEntrega: p.custoEntrega,
          raioEntregaKm: p.raioEntregaKm,
          faixasCep: p.faixasCep,
          aceitaRetirada: p.aceitaRetirada,
          horarioInicioRetirada: p.horarioInicioRetirada,
          horarioFimRetirada: p.horarioFimRetirada,
          tempoRetirada: p.tempoRetirada,
          aceitaUber: p.aceitaUber,
          custoUber: p.custoUber,
          aceita99: p.aceita99,
          custo99: p.custo99,
          aceitaMotoboy: p.aceitaMotoboy,
          custoMotoboy: p.custoMotoboy,
          custoEntregaExpressa: p.custoEntregaExpressa,
          raiosEntrega: p.raiosEntrega,
          faixasValorPedido: p.faixasValorPedido,
          meiosEntregaPersonalizados: p.meiosEntregaPersonalizados,
        };

        const { error } = await supabase.from('lojas').insert({
          id: p.id,
          ativa: p.ativo ?? true,
          categoria_associado: p.categoriaAssociado,
          trabalha_com_encarte: p.trabalhaComEncarte,
          cnpj: p.cnpj || null,
          razao_social: p.razaoSocial,
          nome_fantasia: p.nome,
          email: p.email,
          telefone: p.telefone,
          horario_funcionamento: p.horarioFuncionamento,
          farmaceutico_responsavel: p.respTecnico,
          crf: p.inscricaoFarmaceutico,
          alvara_sanitario: p.alvara,
          afe: p.afe,
          cep: p.cep,
          logradouro: p.endereco,
          numero: p.numero,
          bairro: p.bairro,
          cidade: p.cidade,
          estado: p.uf,
          whatsapp: p.whatsapp,
          theme_colors: theme_colors_payload,
          latitude: p.lat,
          longitude: p.lng,
          entrega_expressa: p.entregaExpressa,
          status_loja_virtual: p.virtualStoreStatus,
        } as any);

        if (error) {
          console.error("Erro ao adicionar loja:", error);
          throw new Error(error.message || "Erro ao adicionar loja no banco de dados.");
        } else {
          await get().loadPharmacies();
        }
      },
      updatePharmacy: async (id, p) => {
        const s = get();
        const currentPharmacy = s.pharmacies.find(x => x.id === id);
        const updatedColors = p.themeColors !== undefined ? p.themeColors : (currentPharmacy?.themeColors || {});
        const theme_colors_payload = {
          ...(currentPharmacy?.themeColors || {}),
          ...(updatedColors || {}),
          slug: p.slug,
          complemento: p.complemento,
          sistemaUtilizado: p.sistemaUtilizado,
          offersServices: p.offersServices,
          footer_plataforma_texto: p.footerPlataformaTexto,
          footer_descricao: p.footerDescricao,
          customPages: p.customPages,
          footer_titulo_contato: p.footerTituloContato,
          social_links: p.socialLinks,
          topBarText: p.topBarText,
          topBarBgColor: p.topBarBgColor,
          topBarTextColor: p.topBarTextColor,
          pageTitle: p.pageTitle,
          metaDescription: p.metaDescription,
          seoDescricao: p.seoDescricao,
          facebookPixelId: p.facebookPixelId,
          googleAnalyticsId: p.googleAnalyticsId,
          googleTagManagerId: p.googleTagManagerId,
          whatsapp: p.whatsapp,
          logoUrl: p.logoUrl,
          faviconUrl: p.faviconUrl,
          loadingLogoUrl: p.loadingLogoUrl,
          footerLogoUrl: p.footerLogoUrl,
          anvisaLogoUrl: p.anvisaLogoUrl,
          horario_funcionamento: p.horarioFuncionamento,
          diasFuncionamento: p.diasFuncionamento,
            horariosPorDia: p.horariosPorDia,
            datasEspeciais: p.datasEspeciais,
          farmaceutico_responsavel: p.respTecnico,
          crf: p.inscricaoFarmaceutico,
          alvara_sanitario: p.alvara,
          afe: p.afe,
          entrega_expressa: p.entregaExpressa,
          status_loja_virtual: p.virtualStoreStatus,
          categoria_associado: p.categoriaAssociado,
          trabalha_com_encarte: p.trabalhaComEncarte,
          aceitaEntrega: p.aceitaEntrega,
          modeloFrete: p.modeloFrete,
          horarioInicioEntrega: p.horarioInicioEntrega,
          horarioFimEntrega: p.horarioFimEntrega,
          horarioFimEntregaRisco: p.horarioFimEntregaRisco,
          tempoEntrega: p.tempoEntrega,
          custoEntrega: p.custoEntrega,
          raioEntregaKm: p.raioEntregaKm,
          faixasCep: p.faixasCep,
          aceitaRetirada: p.aceitaRetirada,
          horarioInicioRetirada: p.horarioInicioRetirada,
          horarioFimRetirada: p.horarioFimRetirada,
          tempoRetirada: p.tempoRetirada,
          aceitaUber: p.aceitaUber,
          custoUber: p.custoUber,
          aceita99: p.aceita99,
          custo99: p.custo99,
          aceitaMotoboy: p.aceitaMotoboy,
          custoMotoboy: p.custoMotoboy,
          custoEntregaExpressa: p.custoEntregaExpressa,
          raiosEntrega: p.raiosEntrega,
          faixasValorPedido: p.faixasValorPedido,
          meiosEntregaPersonalizados: p.meiosEntregaPersonalizados,
        };

        const { error } = await supabase.from('lojas').update({
          ativa: p.ativo ?? true,
          categoria_associado: p.categoriaAssociado,
          trabalha_com_encarte: p.trabalhaComEncarte,
          cnpj: p.cnpj || null,
          razao_social: p.razaoSocial,
          nome_fantasia: p.nome,
          email: p.email,
          telefone: p.telefone,
          horario_funcionamento: p.horarioFuncionamento,
          farmaceutico_responsavel: p.respTecnico,
          crf: p.inscricaoFarmaceutico,
          alvara_sanitario: p.alvara,
          afe: p.afe,
          cep: p.cep,
          logradouro: p.endereco,
          numero: p.numero,
          bairro: p.bairro,
          cidade: p.cidade,
          estado: p.uf,
          whatsapp: p.whatsapp,
          theme_colors: theme_colors_payload,
          latitude: p.lat,
          longitude: p.lng,
          entrega_expressa: p.entregaExpressa,
          status_loja_virtual: p.virtualStoreStatus,
          sistema_utilizado: p.sistemaUtilizado,
        } as any).eq('id', id);

        if (error) {
          console.error("Erro ao atualizar loja:", error);
          throw new Error(error.message || "Erro ao atualizar loja no banco de dados.");
        } else {
          await get().loadPharmacies();
        }
      },
      togglePharmacyStatus: async (id) => {
        const p = get().pharmacies.find(x => x.id === id);
        if (p) {
          const { error } = await supabase.from('lojas').update({ ativa: !(p.ativo ?? true) }).eq('id', id);
          if (!error) {
            set((s) => ({ pharmacies: s.pharmacies.map(x => x.id === id ? { ...x, ativo: !(x.ativo ?? true) } : x) }));
          }
        }
      },
      removePharmacy: async (id) => {
        const { error } = await supabase.from('lojas').delete().eq('id', id);
        if (!error) {
          set((s) => ({ pharmacies: s.pharmacies.filter(x => x.id !== id) }));
        }
      },

      categoryIcons: {},
      setCategoryIcon: (categoryId, iconUrl) => set((s) => ({ categoryIcons: { ...s.categoryIcons, [categoryId]: iconUrl } })),
      
      featuredCategories: ["142", "143", "200", "144", "300"],
      toggleFeaturedCategory: (id) => set((s) => {
        const current = s.featuredCategories;
        if (current.includes(id)) {
          return { featuredCategories: current.filter(x => x !== id) };
        }
        if (current.length >= 6) {
          return { featuredCategories: current };
        }
        return { featuredCategories: [...current, id] };
      }),
      storeFeaturedCategories: {},
      toggleStoreFeaturedCategory: (lojaId, id) => set((s) => {
        // If the store hasn't customized yet, use the network's featured categories as a baseline
        const current = s.storeFeaturedCategories[lojaId]?.length > 0 
          ? s.storeFeaturedCategories[lojaId] 
          : s.featuredCategories;
          
        if (current.includes(id)) {
          return { storeFeaturedCategories: { ...s.storeFeaturedCategories, [lojaId]: current.filter(x => x !== id) } };
        }
        if (current.length >= 6) {
          return { storeFeaturedCategories: s.storeFeaturedCategories };
        }
        return { storeFeaturedCategories: { ...s.storeFeaturedCategories, [lojaId]: [...current, id] } };
      }),

      registrationTokens: [],
      generateRegistrationToken: (tokenSlug, nome) => {
        let isDuplicate = false;
        set((state) => {
          const currentTokens = state.registrationTokens || [];
          if (currentTokens.some(t => t.token === tokenSlug)) {
            isDuplicate = true;
            return state;
          }
          return {
            registrationTokens: [...currentTokens, { token: tokenSlug, createdAt: Date.now(), used: false, nome }]
          };
        });
        if (isDuplicate) return null;
        return tokenSlug;
      },
      markRegistrationTokenUsed: (token) => {
        set((state) => ({
          registrationTokens: (state.registrationTokens || []).map(t => t.token === token ? { ...t, used: true } : t)
        }));
      },
      deleteRegistrationToken: (token) => {
        set((state) => ({
          registrationTokens: (state.registrationTokens || []).filter(t => t.token !== token)
        }));
      },
      clearRegistrationTokens: () => {
        set({ registrationTokens: [] });
      },

      storePanels: [],
      generatePanel: (lojaId, email, password) => set((s) => {
        if (s.storePanels.some((p) => p.lojaId === lojaId)) return s;
        return {
          storePanels: [
            ...s.storePanels,
            { lojaId, status: "active", createdAt: new Date().toISOString(), email, password },
          ],
        };
      }),
      updatePanelCredentials: (lojaId, email, password) => set((s) => ({
        storePanels: s.storePanels.map((p) =>
          p.lojaId === lojaId
            ? { ...p, email, password }
            : p
        )
      })),
      togglePanelStatus: (lojaId) => set((s) => ({
        storePanels: s.storePanels.map((p) =>
          p.lojaId === lojaId
            ? { ...p, status: p.status === "active" ? "inactive" : "active" }
            : p
        ),
      })),
      deletePanel: (lojaId) => set((s) => ({
        storePanels: s.storePanels.filter((p) => p.lojaId !== lojaId)
      })),

      // Vitrines da Loja
      storefrontVitrineConfig: {
        lancamentos: true,
        maisVendidos: true,
        destaques: true,
        destaquesOrdem: 'alfabetica',
        porCategoria: true,
        porCategoriaOrdem: 'recentes',
        vazia: false,
        produtosPorVitrine: 8,
      },
      setStorefrontVitrineConfig: (config) => set((state) => ({
        storefrontVitrineConfig: { ...state.storefrontVitrineConfig, ...config }
      })),
    }),
    {
      name: "fa-admin-store-v4",
      skipHydration: true,
      // Excluir dados dinâmicos do persist: pharmacies e banners são sempre
      // carregados frescos do Supabase via loadPharmacies() / fetchBanners().
      // Persisti-los causaria: (a) flicker ao carregar dados de sessão anterior,
      // (b) payload gigante ao salvar logos base64 no app_state.
      partialize: (state) => {
        const { pharmacies: _ph, banners: _bn, ...rest } = state as any;
        return rest;
      },
      migrate: (persistedState: any, version: number) => {
        if (version < 4) {
          if (!persistedState.banners || persistedState.banners.length === 0) {
            persistedState.banners = defaultBanners;
          }
        }
        if (version < 5) {
          if (!persistedState.featuredCategories || persistedState.featuredCategories.length === 0) {
            persistedState.featuredCategories = ["142", "143", "200", "144", "300"];
          }
        }
        if (version < 6) {
          if (!persistedState.orderBumpSettings) {
            persistedState.orderBumpSettings = { active: true, categoryId: "145", maxPrice: 20, discountPercentage: 1 };
          }
        }
        if (version < 7) {
          if (!persistedState.compreJuntoSettings) {
            persistedState.compreJuntoSettings = { active: true, categoryId: "all", maxPrice: 9999 };
          }
        }
        if (version < 8) {
          if (!persistedState.storefrontVitrineConfig) {
            persistedState.storefrontVitrineConfig = {
              lancamentos: true,
              maisVendidos: true,
              destaques: true,
              destaquesOrdem: 'alfabetica',
              porCategoria: true,
              porCategoriaOrdem: 'recentes',
              vazia: false,
              produtosPorVitrine: 8,
            };
          }
        }
        if (version < 9) {
          persistedState.grupos = [
            { 
              id: "grupo-admin", 
              nome: "Administrador", 
              padrao: true, 
              permissoes: ["dash_view", "vendas_pedidos", "vendas_criar", "vendas_carrinhos", "vendas_links", "lojas_todas", "lojas_nova", "lojas_tabelas", "lojas_precos", "lojas_paineis", "prod_todos", "prod_novo", "prod_estoque", "prod_avaliacoes", "prod_categorias", "prod_colecoes", "prod_filtros", "prod_espera", "prod_marcas", "prod_perguntas", "prod_selos", "cli_todos", "cli_leads", "canais_google", "canais_ifood", "canais_farmaciasapp", "pbms_view", "pers_logo", "pers_cores", "pers_banners", "pers_redes", "pers_paginas", "int_api", "int_cofre", "mkt_cupons", "mkt_orderbumps", "mkt_comprejunto", "sol_apps", "conf_dados", "conf_dominios", "conf_pagamentos", "conf_usuarios", "loja_pedidos", "loja_promocoes", "loja_cupons", "loja_seo", "loja_metricas", "loja_relatorios", "loja_personalizar", "loja_configuracoes"] 
            },
            { 
              id: "grupo-associado", 
              nome: "Associado", 
              padrao: true, 
              permissoes: ["vendas_pedidos", "lojas_precos", "prod_estoque", "prod_avaliacoes", "prod_colecoes", "prod_filtros", "prod_espera", "prod_marcas", "prod_perguntas", "prod_selos", "prod_variacoes", "loja_pedidos", "loja_promocoes", "loja_cupons", "loja_seo", "loja_metricas", "loja_relatorios", "loja_personalizar", "loja_configuracoes"] 
            }
          ];
          if (persistedState.users) {
            persistedState.users.forEach((u: any) => {
              if (u.proprietario || u.grupoId === 'grupo-admin') {
                u.grupoId = 'grupo-admin';
              } else {
                u.grupoId = 'grupo-associado';
              }
            });
          }
        }
        if (version < 10) {
          const defaultNav = [
            { id: "pn1", title: "Mapa do Site", slug: "mapa-site", location: "footer" as const, footerColumn: "Navegação" as const, type: "external" as const, externalUrl: "/mapa" },
            { id: "pn2", title: "Categorias", slug: "todas-categorias", location: "footer" as const, footerColumn: "Navegação" as const, type: "external" as const, externalUrl: "/c" },
            { id: "pn3", title: "Marcas", slug: "todas-marcas", location: "footer" as const, footerColumn: "Navegação" as const, type: "external" as const, externalUrl: "/m" },
            { id: "pn4", title: "Princípios Ativos", slug: "principios-ativos", location: "footer" as const, footerColumn: "Navegação" as const, type: "text" as const, content: "<h1>Princípios Ativos</h1>" },
            { id: "pn5", title: "Classes Terapêuticas", slug: "classes-terapeuticas", location: "footer" as const, footerColumn: "Navegação" as const, type: "text" as const, content: "<h1>Classes Terapêuticas</h1>" },
            { id: "pn6", title: "Bulas de A a Z", slug: "bulas", location: "footer" as const, footerColumn: "Navegação" as const, type: "text" as const, content: "<h1>Bulas de A a Z</h1>" },

            { id: "ps1", title: "Serviços de Saúde", slug: "servicos-de-saude", location: "footer" as const, footerColumn: "Serviços" as const, type: "external" as const, externalUrl: "/servicos" },
            { id: "ps2", title: "Vacinas", slug: "vacinas", location: "footer" as const, footerColumn: "Serviços" as const, type: "external" as const, externalUrl: "/servicos/vacinas" },
            { id: "ps3", title: "Testes Rápidos", slug: "testes-rapidos", location: "footer" as const, footerColumn: "Serviços" as const, type: "external" as const, externalUrl: "/servicos/testes-rapidos" },
            { id: "ps4", title: "Aferição de Pressão", slug: "afericao-pressao", location: "footer" as const, footerColumn: "Serviços" as const, type: "external" as const, externalUrl: "/servicos/afericao" },

            { id: "pp1", title: "Criar Cadastro", slug: "criar-cadastro", location: "footer" as const, footerColumn: "Perfil" as const, type: "external" as const, externalUrl: "/conta/login?mode=register" },
            { id: "pp2", title: "Alterar Dados", slug: "alterar-dados", location: "footer" as const, footerColumn: "Perfil" as const, type: "external" as const, externalUrl: "/conta/perfil" },
            { id: "pp3", title: "Endereços", slug: "enderecos", location: "footer" as const, footerColumn: "Perfil" as const, type: "external" as const, externalUrl: "/conta/enderecos" },
            { id: "pp4", title: "Acompanhar Pedido", slug: "acompanhar-pedido", location: "footer" as const, footerColumn: "Perfil" as const, type: "external" as const, externalUrl: "/conta/pedidos" },
          ];
          
          if (!persistedState.contentPages || !persistedState.contentPages.some((p: any) => p.footerColumn === "Navegação")) {
            persistedState.contentPages = [...(persistedState.contentPages || []), ...defaultNav];
          }
        }
        if (version < 11) {
          if (persistedState.grupos) {
            // Remove o antigo grupo associado
            persistedState.grupos = persistedState.grupos.filter((g: any) => g.id !== "grupo-associado");
            
            // Adiciona os dois novos
            const newGroups = [
              { 
                id: "grupo-associado-pleno", 
                nome: "Painel do Associado (Pleno)", 
                padrao: true, 
                permissoes: ["lojas_precos", "loja_pedidos", "loja_promocoes", "loja_cupons", "loja_seo", "loja_metricas", "loja_relatorios", "loja_personalizar", "loja_configuracoes", "prod_novo", "prod_todos", "prod_categorias", "prod_estoque", "prod_avaliacoes", "prod_colecoes", "prod_filtros", "prod_espera", "prod_marcas", "prod_perguntas", "prod_selos", "prod_variacoes", "vendas_pedidos"] 
              },
              { 
                id: "grupo-associado-parceiro", 
                nome: "Painel do Associado (Parceiro)", 
                padrao: true, 
                permissoes: ["lojas_precos", "loja_pedidos", "loja_promocoes", "loja_cupons", "loja_seo", "loja_metricas", "loja_relatorios", "loja_personalizar", "loja_configuracoes", "prod_novo", "prod_todos", "prod_categorias", "prod_estoque", "prod_avaliacoes", "prod_colecoes", "prod_filtros", "prod_espera", "prod_marcas", "prod_perguntas", "prod_selos", "prod_variacoes", "vendas_pedidos"] 
              }
            ];
            
            // Verifica se já não existem para não duplicar se rodar de novo
            if (!persistedState.grupos.some((g: any) => g.id === "grupo-associado-pleno")) {
              persistedState.grupos.push(...newGroups);
            }
          }
        }
        return persistedState;
      },
      version: 11,
      storage: createJSONStorage(() => supabaseStorage),
    }
  )
);



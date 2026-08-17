import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";

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
  formatoExtra?: "1_banner" | "2_banners";
  imageUrl2?: string;
  mobileImageUrl2?: string;
  link2?: string;
  imageUrl3?: string;
  mobileImageUrl3?: string;
  link3?: string;
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

export interface Pharmacy {
  id: string;
  ativo?: boolean;
  categoriaAssociado?: 'Pleno' | 'Parceiro';
  isVirtualStoreGenerated?: boolean;
  virtualStoreStatus?: 'Ativa' | 'Inativa';
  offersServices?: boolean;
  entregaExpressa?: boolean;
  // Dados da Loja
  cnpj: string;
  api_key?: string;
  logoUrl?: string;
  faviconUrl?: string;
  themeColors?: Record<string, string>;
  razaoSocial: string;
  nome: string; // Nome Fantasia
  tabelaPrecoId?: string; // Tabela de Preços Regional
  email: string;
  telefone: string;
  whatsapp?: string; // WhatsApp oficial da unidade para pedidos
  horarioFuncionamento: string;
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
  // Pagamento
  identificadorPagamento?: string;
  hashRecebimento?: string;
  // Dias de entrega (0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab)
  diasEntrega?: number[];
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
  generateRegistrationToken: () => string;
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
    tabelaPrecoId: "poa",
    diasEntrega: [1, 2, 3, 4, 5, 6], // Seg a Sáb por padrão
  };
});

const defaultBanners: AdminBanner[] = [
  // Full Banners (formerly HeroCarousel slides)
  {
    id: "fb-1",
    nome: "Sua farmácia online de confiança",
    imageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?q=60&w=2000&auto=format&fit=crop",
    mobileImageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?q=60&w=800&auto=format&fit=crop",
    link: "/c/medicamentos",
    posicao: "Full Banner",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  {
    id: "fb-2",
    nome: "Até 70% de desconto em medicamentos",
    imageUrl: "https://images.unsplash.com/photo-1576602976047-174e57a47881?q=60&w=2000&auto=format&fit=crop",
    mobileImageUrl: "https://images.unsplash.com/photo-1576602976047-174e57a47881?q=60&w=800&auto=format&fit=crop",
    link: "/pbm",
    posicao: "Full Banner",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  {
    id: "fb-3",
    nome: "Saúde sem sair de casa",
    imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=60&w=2000&auto=format&fit=crop",
    mobileImageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=60&w=800&auto=format&fit=crop",
    link: "/c/servicos-de-saude",
    posicao: "Full Banner",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  // Mini Banners (formerly SquarePromoGrid fallbackPromos)
  {
    id: "mb-1",
    nome: "Cupom 15% - 1ª Compra",
    imageUrl: "https://placehold.co/400x400/e2e8f0/64748b?text=Cupom+15%25",
    link: "/ofertas",
    posicao: "Mini Banner",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  {
    id: "mb-2",
    nome: "Medicamentos - Até 70% OFF",
    imageUrl: "https://placehold.co/400x400/e2e8f0/64748b?text=Medicamentos",
    link: "/c/medicamentos",
    posicao: "Mini Banner",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  {
    id: "mb-3",
    nome: "Dermocosméticos - Skincare",
    imageUrl: "https://placehold.co/400x400/e2e8f0/64748b?text=Dermocosmeticos",
    link: "/c/dermocosm-ticos-e-beleza",
    posicao: "Mini Banner",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  {
    id: "mb-4",
    nome: "Vitaminas - Compre 2, leve 3",
    imageUrl: "https://placehold.co/400x400/e2e8f0/64748b?text=Vitaminas",
    link: "/c/vitaminas-e-suplementos",
    posicao: "Mini Banner",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  {
    id: "mb-5",
    nome: "Higiene Pessoal - Frete grátis",
    imageUrl: "https://placehold.co/400x400/e2e8f0/64748b?text=Higiene",
    link: "/c/higiene-e-cuidados",
    posicao: "Mini Banner",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  {
    id: "mb-6",
    nome: "Mamãe & Bebê - Novidades",
    imageUrl: "https://placehold.co/400x400/e2e8f0/64748b?text=Mamae+e+Bebe",
    link: "/c/mam-e-e-beb",
    posicao: "Mini Banner",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  {
    id: "mb-7",
    nome: "Convênio PBM - Conecte e economize",
    imageUrl: "https://placehold.co/400x400/e2e8f0/64748b?text=PBM",
    link: "/pbm",
    posicao: "Mini Banner",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  {
    id: "mb-8",
    nome: "Genéricos - Mesma fórmula",
    imageUrl: "https://placehold.co/400x400/e2e8f0/64748b?text=Genericos",
    link: "/c/medicamentos",
    posicao: "Mini Banner",
    paginaPublicacao: "Página inicial",
    active: true,
  },
  // Banner Tarja
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
  // Banner Categoria
  { id: "bc-1", nome: "Remédios para Dor e Febre", imageUrl: "icon:Thermometer", link: "/c/medicamentos", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  { id: "bc-2", nome: "Remédios para Sistema Nervoso", imageUrl: "icon:Leaf", link: "/c/medicamentos", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  { id: "bc-3", nome: "Pastas de Dente e Higiene Bucal", imageUrl: "icon:Smile", link: "/c/higiene", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  { id: "bc-4", nome: "Sabonetes e Produtos para Corpo", imageUrl: "icon:Droplets", link: "/c/higiene", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  { id: "bc-5", nome: "Multivitamínicos e Minerais", imageUrl: "icon:Battery", link: "/c/vitaminas", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  { id: "bc-6", nome: "Shampoos e Tratamentos", imageUrl: "icon:Wind", link: "/c/beleza", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  { id: "bc-7", nome: "Desodorantes e Antitranspirantes", imageUrl: "icon:Wind", link: "/c/higiene", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  { id: "bc-8", nome: "Sabonetes Íntimos", imageUrl: "icon:Heart", link: "/c/higiene", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  { id: "bc-9", nome: "Remédios para Gripe e Resfriado", imageUrl: "icon:Thermometer", link: "/c/medicamentos", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  { id: "bc-10", nome: "Suplementos para Imunidade", imageUrl: "icon:ShieldCheck", link: "/c/vitaminas", posicao: "Banner Categoria", paginaPublicacao: "Página inicial", active: true },
  // Banner Extra
  {
    id: "bx-1",
    nome: "Promoção Mês do Cliente",
    imageUrl: "https://placehold.co/1200x300/e2e8f0/64748b?text=Banner+Livre+-+1200x300",
    mobileImageUrl: "https://placehold.co/800x300/e2e8f0/64748b?text=Mobile+Banner+-+800x300",
    link: "/ofertas",
    posicao: "Banner Extra",
    paginaPublicacao: "Página inicial",
    active: true,
  }
];

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
          id: "grupo-associado", 
          nome: "Painel do Associado", 
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
            set({
              currentUser: {
                id: p.id,
                name: p.nome || localUser?.name || email.split("@")[0],
                email: p.email || email,
                grupoId: p.grupo_id || localUser?.grupoId,
                proprietario: p.is_admin || localUser?.proprietario || isFallbackAdmin,
                lojasVinculadas: p.lojas_vinculadas || localUser?.lojasVinculadas || [],
              },
            });
            return { success: true };
          }

          // Se não encontrou o profile ainda, loga com o que tem
          const isFallbackAdminFallback = email === "nyckolas.lopes@farmaciasassociadas.com.br" || email === "thiago.rocha@farmaciasassociadas.com.br";
          set({
            currentUser: {
              id: data.user.id,
              name: localUser?.name || email.split("@")[0],
              email: email,
              grupoId: localUser?.grupoId,
              lojasVinculadas: localUser?.lojasVinculadas || [],
              proprietario: localUser?.proprietario || isFallbackAdminFallback,
            },
          });
          return { success: true };
        } catch (e: any) {
          console.error(e);
          return { success: false, message: e.message || "Erro desconhecido" };
        }
      },
      logout: async () => {
        await supabase.auth.signOut();
        set({ currentUser: null });
      },
      register: (user) => set((s) => ({ users: [...s.users, user] })),
      setUsers: (users) => set({ users }),
      loadUsers: async () => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error || !data) return;
        
        set((s) => {
          // Filtrar apenas usuários que são admin ou que pertencem a algum grupo administrativo
          const adminUsers = data.filter(p => p.is_admin || p.grupo_id);
          
          return { 
            users: adminUsers.map(p => ({
              id: p.id,
              name: p.nome || p.email?.split("@")[0] || "Usuário",
              email: p.email,
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
          if (grupo.id === "grupo-associado" || grupo.id === "grupo-admin") {
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
      socialNetworks: [
        { id: "1", label: "Instagram", href: "#", iconName: "Instagram" },
        { id: "2", label: "Facebook", href: "#", iconName: "Facebook" },
        { id: "3", label: "TikTok", href: "#", iconName: "Music" },
        { id: "4", label: "LinkedIn", href: "#", iconName: "Linkedin" },
        { id: "5", label: "YouTube", href: "#", iconName: "Youtube" },
      ],
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
        { id: "p13", title: "Pagamento", slug: "formas-pagamento", location: "footer", footerColumn: "Atendimento", type: "text", content: "<h1>Formas de Pagamento</h1><p>Conheça nossas formas de pagamento seguras.</p>" },
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

      banners: [],
      setBanners: (banners) => set({ banners }),
      fetchBanners: async (lojaId?: string) => {
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
            formatoExtra: b.formato_extra,
            imageUrl2: b.image_url2,
            mobileImageUrl2: b.mobile_image_url2,
            link2: b.link2,
            imageUrl3: b.image_url3,
            mobileImageUrl3: b.mobile_image_url3,
            link3: b.link3,
          })) as AdminBanner[];
          set({ banners: parsedBanners });
        }
      },
      addBanner: async (banner) => {
        const payload = {
          nome: banner.nome,
          image_url: banner.imageUrl,
          mobile_image_url: banner.mobileImageUrl,
          link: banner.link,
          posicao: banner.posicao,
          pagina_publicacao: banner.paginaPublicacao,
          titulo: banner.titulo,
          ativo: banner.active,
          start_date: (banner.startDate && banner.startDate.trim() !== "") ? new Date(banner.startDate).toISOString() : null,
          end_date: (banner.endDate && banner.endDate.trim() !== "") ? new Date(banner.endDate).toISOString() : null,
          loja_id: banner.lojaId || null,
          vitrine_vinculada: banner.vitrineVinculada,
          banner_vinculado: banner.bannerVinculado,
          formato_extra: banner.formatoExtra,
          image_url2: banner.imageUrl2,
          mobile_image_url2: banner.mobileImageUrl2,
          link2: banner.link2,
          image_url3: banner.imageUrl3,
          mobile_image_url3: banner.mobileImageUrl3,
          link3: banner.link3,
        };
        const { data, error } = await supabase.from('banners' as any).insert(payload).select().single();
        if (error) {
          console.error("Erro ao adicionar banner:", error, "Payload enviado:", payload);
          throw error;
        }
        if (data) {
          get().fetchBanners(banner.lojaId);
        }
      },
      updateBanner: async (id, banner) => {
        const payload: any = {};
        if (banner.nome !== undefined) payload.nome = banner.nome;
        if (banner.imageUrl !== undefined) payload.image_url = banner.imageUrl;
        if (banner.mobileImageUrl !== undefined) payload.mobile_image_url = banner.mobileImageUrl;
        if (banner.link !== undefined) payload.link = banner.link;
        if (banner.posicao !== undefined) payload.posicao = banner.posicao;
        if (banner.paginaPublicacao !== undefined) payload.pagina_publicacao = banner.paginaPublicacao;
        if (banner.titulo !== undefined) payload.titulo = banner.titulo;
        if (banner.active !== undefined) payload.ativo = banner.active;
        if (banner.startDate !== undefined) payload.start_date = (banner.startDate && banner.startDate.trim() !== "") ? new Date(banner.startDate).toISOString() : null;
        if (banner.endDate !== undefined) payload.end_date = (banner.endDate && banner.endDate.trim() !== "") ? new Date(banner.endDate).toISOString() : null;
        if (banner.vitrineVinculada !== undefined) payload.vitrine_vinculada = banner.vitrineVinculada;
        if (banner.bannerVinculado !== undefined) payload.banner_vinculado = banner.bannerVinculado;
        if (banner.formatoExtra !== undefined) payload.formato_extra = banner.formatoExtra;
        if (banner.imageUrl2 !== undefined) payload.image_url2 = banner.imageUrl2;
        if (banner.mobileImageUrl2 !== undefined) payload.mobile_image_url2 = banner.mobileImageUrl2;
        if (banner.link2 !== undefined) payload.link2 = banner.link2;
        if (banner.imageUrl3 !== undefined) payload.image_url3 = banner.imageUrl3;
        if (banner.mobileImageUrl3 !== undefined) payload.mobile_image_url3 = banner.mobileImageUrl3;
        if (banner.link3 !== undefined) payload.link3 = banner.link3;
        
        const { error } = await supabase.from('banners' as any).update(payload).eq('id', id);
        if (error) {
          console.error("Erro ao atualizar banner:", error, "Payload enviado:", payload);
          throw error;
        }
        if (!error) {
          get().fetchBanners(get().activeStoreId || undefined);
        }
      },
      removeBanner: async (id) => {
        const { error } = await supabase.from('banners' as any).delete().eq('id', id);
        if (!error) {
          set((s) => ({ banners: s.banners.filter((b) => b.id !== id) }));
        }
      },

      integrations: { webhookUrl: "", apiKey: "" },
      setIntegrations: (integrations) => set({ integrations }),

      pharmacies: [],
      loadPharmacies: async () => {
        const { data, error } = await supabase.from('lojas').select('*');
        if (!error && data) {
          const loadedPharmacies: Pharmacy[] = data.map((l: any) => ({
            id: l.id,
            ativo: l.ativa ?? true,
            cnpj: l.cnpj,
            razaoSocial: l.razao_social,
            nome: l.nome_fantasia,
            email: l.email,
            telefone: l.telefone,
            horarioFuncionamento: l.horario_funcionamento,
            respTecnico: l.farmaceutico_responsavel,
            inscricaoFarmaceutico: l.crf,
            alvara: l.alvara_sanitario,
            afe: l.afe,
            cep: l.cep || '',
            endereco: l.logradouro || '',
            numero: l.numero || '',
            complemento: l.complemento || '',
            bairro: l.bairro || '',
            cidade: l.cidade || '',
            uf: l.estado || '',
            whatsapp: l.whatsapp || '',
            footerPlataformaTexto: l.footer_plataforma_texto || '',
            footerDescricao: l.footer_descricao || '',
            footerTituloContato: l.footer_titulo_contato || '',
            socialLinks: l.social_links || {},
            latitude: l.latitude,
            longitude: l.longitude,
            categoriaAssociado: l.categoria_associado as any,
            trabalhaComEncarte: l.trabalha_com_encarte,
            isVirtualStoreGenerated: !!l.status_loja_virtual,
            virtualStoreStatus: l.status_loja_virtual,
            api_key: l.api_key,
          })) as unknown as Pharmacy[];
          set({ pharmacies: loadedPharmacies });
        }
      },
      addPharmacy: async (p) => {
        const { error } = await supabase.from('lojas').insert({
          id: p.id,
          ativa: p.ativo ?? true,
          categoria_associado: p.categoriaAssociado,
          trabalha_com_encarte: p.trabalhaComEncarte,
          cnpj: p.cnpj,
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
          complemento: p.complemento,
          bairro: p.bairro,
          cidade: p.cidade,
          estado: p.uf,
          whatsapp: p.whatsapp,
          footer_plataforma_texto: p.footerPlataformaTexto,
          footer_descricao: p.footerDescricao,
          footer_titulo_contato: p.footerTituloContato,
          social_links: p.socialLinks,
          latitude: p.lat,
          longitude: p.lng,
          entrega_expressa: p.entregaExpressa,
          status_loja_virtual: p.virtualStoreStatus,
        } as any);
        if (!error) {
          set((s) => ({ pharmacies: [...s.pharmacies, { ...p, ativo: p.ativo ?? true }] }));
        }
      },
      updatePharmacy: async (id, p) => {
        const { error } = await supabase.from('lojas').update({
          ativa: p.ativo ?? true,
          categoria_associado: p.categoriaAssociado,
          trabalha_com_encarte: p.trabalhaComEncarte,
          cnpj: p.cnpj,
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
          complemento: p.complemento,
          bairro: p.bairro,
          cidade: p.cidade,
          estado: p.uf,
          whatsapp: p.whatsapp,
          footer_plataforma_texto: p.footerPlataformaTexto,
          footer_descricao: p.footerDescricao,
          footer_titulo_contato: p.footerTituloContato,
          social_links: p.socialLinks,
          latitude: p.lat,
          longitude: p.lng,
          entrega_expressa: p.entregaExpressa,
          status_loja_virtual: p.virtualStoreStatus,
        } as any).eq('id', id);
        if (error) {
          console.error("Erro ao atualizar loja com novas colunas (possivelmente faltam migrations no Supabase):", error);
          
          // Tentar fallback sem as colunas novas
          const { error: fallbackError } = await supabase.from('lojas').update({
            ativa: p.ativo ?? true,
            categoria_associado: p.categoriaAssociado,
            trabalha_com_encarte: p.trabalhaComEncarte,
            cnpj: p.cnpj,
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
            complemento: p.complemento,
            bairro: p.bairro,
            cidade: p.cidade,
            estado: p.uf,
            whatsapp: p.whatsapp,
            footer_plataforma_texto: p.footerPlataformaTexto,
            latitude: p.lat,
            longitude: p.lng,
            entrega_expressa: p.entregaExpressa,
            status_loja_virtual: p.virtualStoreStatus,
          } as any).eq('id', id);

          if (!fallbackError) {
            set((s) => ({ pharmacies: s.pharmacies.map(x => x.id === id ? p : x) }));
            console.log("Fallback bem-sucedido. Porém, os campos do rodapé não foram salvos no banco.");
          } else {
            console.error("Erro também no fallback:", fallbackError);
          }
        } else {
          set((s) => ({ pharmacies: s.pharmacies.map(x => x.id === id ? p : x) }));
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

      registrationTokens: [],
      generateRegistrationToken: () => {
        const token = crypto.randomUUID();
        set((state) => ({
          registrationTokens: [...state.registrationTokens, { token, createdAt: Date.now(), used: false }]
        }));
        return token;
      },
      markRegistrationTokenUsed: (token) => {
        set((state) => ({
          registrationTokens: state.registrationTokens.map(t => t.token === token ? { ...t, used: true } : t)
        }));
      },
      deleteRegistrationToken: (token) => {
        set((state) => ({
          registrationTokens: state.registrationTokens.filter(t => t.token !== token)
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
        return persistedState;
      },
      version: 10,
    }
  )
);

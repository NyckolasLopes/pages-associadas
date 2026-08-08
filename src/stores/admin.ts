import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  footerColumn?: "Institucional" | "Atendimento" | "Segurança";
  type: "external" | "text";
  externalUrl?: string;
  content?: string;
}

export interface Pharmacy {
  id: string;
  ativo?: boolean;
  categoriaAssociado?: 'Pleno' | 'Parceiro';
  // Dados da Loja
  cnpj: string;
  logoUrl?: string;
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
  // Dados de Entrega
  aceitaEntrega: boolean;
  modeloFrete: "cep" | "fixo" | "raio";
  horarioInicioEntrega: string;
  horarioFimEntrega: string;
  horarioFimEntregaRisco: string;
  tempoEntrega: string;
  custoEntrega: number;
  raioEntregaKm?: number;
  raiosEntrega?: { ateKm: number; preco: number }[];
  faixasCep?: { cepInicio: string; cepFim: string; taxa: number; tempoMinutos?: number }[];
  // Entrega Expressa
  entregaExpressa: boolean;
  custoEntregaExpressa: number;
  // Dados de Retirada
  aceitaRetirada: boolean;
  horarioInicioRetirada: string;
  horarioFimRetirada: string;
  tempoRetirada: string;
  // Outros métodos de entrega
  aceitaUber: boolean;
  custoUber: number;
  aceita99: boolean;
  custo99: number;
  aceitaMotoboy: boolean;
  custoMotoboy: number;
  // Integração
  sistemaUtilizado?: string;
  vendeIfood?: boolean;
  vendeFarmaciaApp?: boolean;
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
  login: (email: string, pass: string) => boolean;
  logout: () => void;
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
  addBanner: (banner: AdminBanner) => void;
  updateBanner: (id: string, banner: Partial<AdminBanner>) => void;
  removeBanner: (id: string) => void;

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
  addPharmacy: (p: Pharmacy) => void;
  updatePharmacy: (id: string, p: Pharmacy) => void;
  togglePharmacyStatus: (id: string) => void;
  removePharmacy: (id: string) => void;

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
    entregaExpressa: true,
    custoEntregaExpressa: (l.faixasCep?.[0]?.taxa || 5.0) + 5,
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
      users: [
        { id: "admin-1", name: "Nyckolas Lopes", email: "nyckolas.lopes@farmaciasassociadas.com.br", password: "Aspro@2026", grupoId: "grupo-admin", proprietario: true },
        { id: "admin-2", name: "Thiago Rocha", email: "thiago.rocha@farmaciasassociadas.com.br", password: "Aspro@2026", grupoId: "grupo-admin", proprietario: true },
        { id: "admin-3", name: "Eduardo", email: "eduardo@ri.com.br", password: "Aspro@2026", grupoId: "grupo-admin", proprietario: false },
      ],
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
          permissoes: ["lojas_precos", "loja_pedidos", "loja_promocoes", "loja_cupons", "loja_seo", "loja_metricas", "loja_relatorios", "loja_personalizar", "loja_configuracoes"] 
        }
      ],
      currentUser: null,
      login: (email, password) => {
        const user = get().users.find((u) => u.email === email && u.password === password);
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },
      logout: () => set({ currentUser: null }),
      register: (user) => set((s) => ({ users: [...s.users, user] })),
      setUsers: (users) => set({ users }),
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
        { id: "p1", title: "Quem Somos", slug: "quem-somos", location: "footer", footerColumn: "Institucional", type: "text", content: "<h1>Quem Somos</h1><p>Conteúdo da página quem somos.</p>" },
        { id: "p2", title: "Política de Privacidade", slug: "politica-de-privacidade", location: "footer", footerColumn: "Institucional", type: "text", content: "<h1>Política de Privacidade</h1><p>Conteúdo da página de política de privacidade.</p>" },
        { id: "p3", title: "Trocas e Devoluções", slug: "trocas-e-devolucoes", location: "footer", footerColumn: "Institucional", type: "text", content: "<h1>Trocas e Devoluções</h1><p>Conteúdo da página de trocas e devoluções.</p>" },
        { id: "p4", title: "Nossas Lojas", slug: "nossas-lojas", location: "footer", footerColumn: "Institucional", type: "text", content: "<h1>Nossas Lojas</h1><p>Encontre a loja mais próxima de você.</p>" },
        { id: "p5", title: "Trabalhe Conosco", slug: "trabalhe-conosco", location: "footer", footerColumn: "Institucional", type: "text", content: "<h1>Trabalhe Conosco</h1><p>Venha fazer parte da nossa equipe.</p>" },
        { id: "p6", title: "Blog Farmácias Associadas", slug: "blog", location: "footer", footerColumn: "Institucional", type: "external", externalUrl: "https://blog.farmaciasassociadas.com.br" },
        { id: "p7", title: "Revista", slug: "revista", location: "footer", footerColumn: "Institucional", type: "external", externalUrl: "https://www.farmaciasassociadas.com.br/revista" },
        { id: "p8", title: "Seja um associado", slug: "seja-associado", location: "footer", footerColumn: "Institucional", type: "external", externalUrl: "https://www.farmaciasassociadas.com.br/seja-um-associado" },
        { id: "p9", title: "Portal do associado", slug: "portal-associado", location: "footer", footerColumn: "Institucional", type: "external", externalUrl: "https://portal.farmaciasassociadas.com.br" },
        
        { id: "p10", title: "Central de Atendimento", slug: "central-atendimento", location: "footer", footerColumn: "Atendimento", type: "text", content: "<h1>Central de Atendimento</h1><p>Entre em contato conosco pelos nossos canais oficiais.</p>" },
        { id: "p11", title: "WhatsApp", slug: "whatsapp", location: "footer", footerColumn: "Atendimento", type: "external", externalUrl: "https://wa.me/5551989444818" },
        { id: "p12", title: "Como Comprar", slug: "como-comprar", location: "footer", footerColumn: "Atendimento", type: "text", content: "<h1>Como Comprar</h1><p>Aprenda o passo a passo de como realizar sua compra.</p>" },
        { id: "p13", title: "Pagamento", slug: "formas-pagamento", location: "footer", footerColumn: "Atendimento", type: "text", content: "<h1>Formas de Pagamento</h1><p>Conheça nossas formas de pagamento seguras.</p>" },
        { id: "p14", title: "Prazos", slug: "prazo-entrega", location: "footer", footerColumn: "Atendimento", type: "text", content: "<h1>Prazos de Entrega</h1><p>Saiba mais sobre os prazos de entrega da sua região.</p>" },
        { id: "p15", title: "Reembolso", slug: "cancelamento", location: "footer", footerColumn: "Atendimento", type: "text", content: "<h1>Política de Reembolso</h1><p>Como funciona o cancelamento e estorno.</p>" },
        { id: "p16", title: "FAQ", slug: "faq", location: "footer", footerColumn: "Atendimento", type: "text", content: "<h1>FAQ - Perguntas Frequentes</h1><p>Tire suas dúvidas.</p>" },
        
        { id: "p17", title: "Proteção de Dados", slug: "protecao-dados", location: "footer", footerColumn: "Segurança", type: "text", content: "<h1>Proteção de Dados</h1><p>Saiba como tratamos os seus dados pessoais.</p>" },
        { id: "p18", title: "Termos de Uso", slug: "termos-de-uso", location: "footer", footerColumn: "Segurança", type: "text", content: "<h1>Termos de Uso</h1><p>Termos e condições para uso da plataforma.</p>" },
        { id: "p19", title: "Portal do Titular", slug: "portal-titular", location: "footer", footerColumn: "Segurança", type: "external", externalUrl: "https://www.farmaciasassociadas.com.br/portal-titular" },
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

      banners: defaultBanners,
      setBanners: (banners) => set({ banners }),
      addBanner: (banner) => set((state) => ({ banners: [...state.banners, banner] })),
      updateBanner: (id, updates) => set((state) => ({
        banners: state.banners.map(b => b.id === id ? { ...b, ...updates } : b)
      })),
      removeBanner: (id) => set((s) => ({ banners: s.banners.filter((b) => b.id !== id) })),

      integrations: { webhookUrl: "", apiKey: "" },
      setIntegrations: (integrations) => set({ integrations }),

      pharmacies: defaultPharmacies,
      addPharmacy: (p) => set((s) => ({ pharmacies: [...s.pharmacies, { ...p, ativo: p.ativo ?? true }] })),
      updatePharmacy: (id, p) => set((s) => ({ pharmacies: s.pharmacies.map(x => x.id === id ? p : x) })),
      togglePharmacyStatus: (id) => set((s) => ({ pharmacies: s.pharmacies.map(x => x.id === id ? { ...x, ativo: !(x.ativo ?? true) } : x) })),
      removePharmacy: (id) => set((s) => ({ pharmacies: s.pharmacies.filter(x => x.id !== id) })),

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
        return persistedState;
      },
      version: 9,
    }
  )
);

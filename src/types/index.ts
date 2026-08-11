// Domain types for the headless pharmacy platform.

export interface SeloSistema {
  id: string;
  nome: string;
  ativo: boolean;
  corFundo: string;
  corTexto: string;
}


export type Tarja =
  | "Sem Tarja"
  | "Vermelha"
  | "Vermelha Retém Receita"
  | "Preta"
  | "Amarela";

export interface Produto {
  id: string;
  lojaId?: string; // Se preenchido, produto exclusivo desta loja individual
  isIndividualLoja?: boolean;
  globalPleno?: boolean;
  sku: string;
  ean?: string;
  ean2?: string;
  ean3?: string;
  foto: string;
  nome: string;
  descricao: string; // HTML rich text
  url: string; // slug
  fabricante: string;
  precoDe: number;
  precoPor: number;
  estoque: number;
  registroAnvisa: string;
  tarja: Tarja | string;
  retemReceita: boolean;
  generico: boolean;
  possuiImagem: boolean;
  categoriaId: string; // Categoria principal (SEO)
  subcategoriaId: string; // Subcategoria principal (SEO)
  categoriasIds?: string[]; // Categorias adicionais
  subcategoriasIds?: string[]; // Subcategorias adicionais
  categoriasAdicionais?: string[];
  
  // Prateleira Infinita / Estoque Externo
  estoqueExterno?: {
    distribuidor: string;
    cidadeDistribuidor: string;
    prazoEntregaDias: number;
    apiUrl: string;
  };
  internalTags: string[];
  ativo?: boolean;
  principiosAtivos?: string[];
  videoUrl?: string;
  youtubeVideoUrl?: string;
  imagens?: string[];
  codigoInterno?: string;
  precoCusto?: number;
  bloquearPreco?: boolean;
  destaque?: boolean;
  orderBump?: boolean;
  marca?: string;
  ncm?: string;
  disponibilidade?: string;
  acaoSemEstoque?: string;
  comVariacao?: boolean;
  visivel?: boolean;
  buscavel?: boolean;
  nivelRelevancia?: number;
  termosPesquisa?: string;
  precoBase?: number;
  seoTitulo?: string;
  seoDescricao?: string;
  aVenda?: boolean;
  tipoProduto?: string;
  selo?: string; // Ação PBM
  precoSobConsulta?: boolean;
  linkProduto?: string;
  storiesProduto?: string[];
  videoFlutuante?: string;
  selosIds?: string[]; // IDs of SeloSistema
  vitrines?: string[]; // IDs das vitrines/coleções
  filtrosValores?: Array<{ filtroId: string; opcaoId: string }>;
  tipoMedicamento?: string;
  classificacaoRegistro?: string;
  classeTerapeutica?: string;
  indicacaoTerapeutica?: string;
  tipoDePreco?: string;
  origem?: string;
  isNovo?: boolean;
  isRevisado?: boolean;
  dataImportacao?: string;
  emCampanha?: boolean;
  precoCampanha?: number;
  campanhaInicio?: string;
  campanhaFim?: string;
  precosPorLoja?: Record<string, { precoDe: number; precoPor: number; ativo?: boolean; campanhaInicio?: string; campanhaFim?: string }>;
  estoquesPorLoja?: Record<string, number>;
  preco?: number;
  basePrice?: number;
  imagem?: string;
  image?: string;
  slug?: string;
  requiresReceita?: boolean;

  // --- Novos campos integrados da API Externa ---
  
  // Produtos
  eansSecundarios?: string[];
  caracteristicas?: Array<{ titulo: string; descricao: string }>;
  tipo?: number;
  prioridade?: number;
  lancamento?: boolean;
  principiosAtivosDetalhes?: Array<{ nome: string; concentracao: string; unidadeMedida: string }>;

  // Preço
  percentualDesconto?: number;
  quantidadeMinima?: number;
  quantidadeMultipla?: number;
  programaFidelidade?: boolean;

  // Estoque
  estoquePorLoja?: Array<{ lojaCnpj: string; quantidade: number }>;

  // Marketing Fixo
  compreJuntoProdutoId?: string;
}

export interface Marca {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  logo: string;
  ativo: boolean;
  destaque: boolean;
  seoUrl?: string;
  marcaPropria?: boolean;
  loja_id?: string;
  globalPleno?: boolean;
}

export interface Categoria {
  id: string;
  nome: string;
  slug: string;
  parentId: string | null;
  descricaoHtml: string;
  descricaoBreve?: string;
  metaTitle?: string;
  metaDescription?: string;
  ativa?: boolean;
  destaque?: boolean;
  icone?: string;
  loja_id?: string;
  globalPleno?: boolean;
}

export interface FaixaCep {
  cepInicio: string;
  cepFim: string;
  taxa: number;
  tempoMinutos: number;
}

export type MetodoPagamento =
  | "credito"
  | "debito"
  | "pix"
  | "dinheiro"
  | "vale_refeicao";

export interface Loja {
  id: string;
  categoriaAssociado?: 'Pleno' | 'Parceiro';
  trabalhaComEncarte?: boolean;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  farmaceuticoResponsavel: string;
  crf: string;
  afe: string;
  alvaraSanitario: string;
  endereco: string;
    telefone?: string;
    whatsapp?: string;
  lat?: number;
  lng?: number;
  faixasCep: FaixaCep[];
  metodosPagamento: MetodoPagamento[];
  ativa: boolean;
  horarioFuncionamento?: string;
  aceitaEntrega?: boolean;
  horarioInicioEntrega?: string;
  horarioFimEntrega?: string;
  tempoEntrega?: string;
  aceitaRetirada?: boolean;
  horarioInicioRetirada?: string;
  horarioFimRetirada?: string;
  tempoRetirada?: string;
  aceitaUber?: boolean;
  custoUber?: number;
  aceita99?: boolean;
  custo99?: number;
  aceitaMotoboy?: boolean;
  custoMotoboy?: number;
  vendeFarmaciaApp?: boolean;
  googleAnalyticsId?: string;
  googleAdsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  chatgptAdsId?: string;
}

export interface PedidoItem {
  produtoId: string;
  nome: string;
  qty: number;
  precoUnit: number;
}

export interface Pedido {
  id: string;
  lojaId: string;
  cliente: string;
  cep: string;
  total: number;
  status: "novo" | "separacao" | "rota" | "entregue" | "cancelado";
  itens: PedidoItem[];
  criadoEm: string;
}

export type VitrineLocal = "espaco_1" | "espaco_2" | "espaco_3";

export interface Vitrine {
  id: number;
  nome: string;
  categoriaId: string;
  local: VitrineLocal;
  ativa: boolean;
  icone?: string;
  descricaoSeo?: string;
  tituloSeo?: string;
  linkSeo?: string;
  descricaoPagina?: string;
  ordem?: number;
  produtoIds?: string[];
  modo?: "categoria" | "manual";
}

export interface Avaliacao {
  id: string;
  produtoId: string;
  usuario: string;
  nota: number;
  texto: string;
  data: string;
  status?: "aprovada" | "recusada" | "pendente";
  lojaId?: string;
}

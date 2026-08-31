import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Download,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import categoriesData from "@/data/categories.json";
import { waitForDomRepaint } from "@/lib/massActionUtils";

// ---- Column Mapping Config ----
interface FieldMapping {
  key: keyof Produto;
  label: string;
  aliases: string[];
  required: boolean;
  type: "string" | "number" | "boolean" | "tarja" | "array";
}

const FIELD_MAPPINGS: FieldMapping[] = [
  // 1. Identificação Básica
  { key: "id", label: "ID/CÓDIGO INTERNO", aliases: ["id/código interno", "codigo interno", "código interno", "codigo", "código", "idproduto", "id_produto", "id", "cod"], required: true, type: "string" },
  { key: "sku", label: "SKU", aliases: ["sku", "código sku", "codigo sku", "referencia"], required: false, type: "string" },
  { key: "ean", label: "EAN/CÓDIGO DE BARRAS", aliases: ["ean/código de barras", "ean", "gtin", "codigo de barras", "código de barras", "barcode", "ean principal"], required: true, type: "string" },
  { key: "ean2", label: "EAN 2", aliases: ["ean 2", "ean2", "código de barras 2", "codigo de barras 2"], required: false, type: "string" },
  { key: "ean3", label: "EAN 3", aliases: ["ean 3", "ean3", "código de barras 3", "codigo de barras 3"], required: false, type: "string" },
  { key: "eansSecundarios", label: "EANS SECUNDÁRIOS", aliases: ["eans secundários", "eans secundarios", "outros eans", "eans adicionais"], required: false, type: "array" },
  { key: "nome", label: "NOME DO PRODUTO (DESCRIÇÃO COMERCIAL)", aliases: ["descrição comercial/nome do produto", "nome do produto", "descrição comercial", "descricao comercial", "nome", "produto", "titulo", "titulo comercial"], required: true, type: "string" },
  { key: "marca", label: "MARCA / FABRICANTE / LABORATÓRIO", aliases: ["marca", "marca / fabricante / laboratório", "marca (marca)", "laboratório", "laboratorio", "fabricante", "brand"], required: false, type: "string" },

  // 2. Categorias & Classificação
  { key: "categoriaId", label: "CATEGORIA PRINCIPAL", aliases: ["categoria principal", "id categoria", "categoriaid", "id_categoria", "cat_id", "categoria", "departamento"], required: false, type: "string" },
  { key: "subcategoriaId", label: "SUBCATEGORIA PRINCIPAL", aliases: ["subcategoria principal", "id subcategoria", "subcategoriaid", "id_subcategoria", "subcat_id", "subcategoria", "seção"], required: false, type: "string" },
  { key: "categoriasAdicionais", label: "CATEGORIAS ADICIONAIS", aliases: ["categorias adicionais", "categorias ids", "outras categorias", "categorias secundarias"], required: false, type: "array" },
  { key: "subcategoriasAdicionais", label: "SUBCATEGORIAS ADICIONAIS", aliases: ["subcategorias adicionais", "subcategorias ids", "outras subcategorias"], required: false, type: "array" },
  { key: "tipoProduto", label: "TIPO DE PRODUTO (FISICO/SERVICO)", aliases: ["tipo de produto", "tipo produto", "tipo (fisico ou servico)", "tipo"], required: false, type: "string" },
  { key: "produtoNatureza", label: "NATUREZA DO PRODUTO", aliases: ["natureza do produto", "natureza", "classificação fiscal produto", "tipo natureza"], required: false, type: "string" },

  // 3. Regulatório & Farmacêutico
  { key: "registroAnvisa", label: "REGISTRO ANVISA / MS", aliases: ["registro anvisa / ms", "ms/registro anvisa", "registro anvisa", "ms", "registro ms", "reg_anvisa", "registroanvisa", "registro"], required: false, type: "string" },
  { key: "tarja", label: "TARJA", aliases: ["tarja", "tipo tarja", "classificação tarja", "cor tarja"], required: false, type: "tarja" },
  { key: "retemReceita", label: "RETÉM RECEITA (SIM/NÃO)", aliases: ["retém receita", "retem receita", "retemreceita", "receita", "controle especial", "reter receita"], required: false, type: "boolean" },
  { key: "tipoReceita", label: "TIPO DE RECEITA", aliases: ["tipo de receita", "tipo receita", "receituário", "receituario"], required: false, type: "string" },
  { key: "generico", label: "MEDICAMENTO GENÉRICO (SIM/NÃO)", aliases: ["genérico", "generico", "é genérico", "medicamento generico"], required: false, type: "boolean" },
  { key: "tipoMedicamento", label: "TIPO DE MEDICAMENTO", aliases: ["tipo de medicamento", "tipo medicamento", "classificação medicamento"], required: false, type: "string" },
  { key: "principiosAtivos", label: "PRINCÍPIOS ATIVOS / FÓRMULA / DCB", aliases: ["princípios ativos", "principios ativos", "principio ativo", "farmaco", "dcb", "formula", "composição"], required: false, type: "string" },
  { key: "classeTerapeutica", label: "CLASSE TERAPÊUTICA", aliases: ["classe terapêutica", "classe terapeutica", "ação terapeutica", "acao terapeutica"], required: false, type: "string" },
  { key: "indicacaoTerapeutica", label: "INDICAÇÃO TERAPÊUTICA", aliases: ["indicação terapêutica", "indicacao terapeutica", "indicações", "indicacoes", "para que serve"], required: false, type: "string" },
  { key: "tipoDePreco", label: "REGIME DE PREÇO (LIBERADO/MONITORADO)", aliases: ["regime de preço", "regime de preco", "tipo de preco", "tipo de preço", "tipo de precificacao"], required: false, type: "string" },
  { key: "ncm", label: "NCM (CÓDIGO FISCAL)", aliases: ["ncm", "codigo ncm", "código ncm", "classificacao fiscal"], required: false, type: "string" },
  { key: "alertaRegulatorio", label: "ALERTA REGULATÓRIO (SIM/NÃO)", aliases: ["alerta regulatório", "alerta regulatorio", "tem alerta"], required: false, type: "boolean" },
  { key: "alertaTexto", label: "TEXTO DO ALERTA REGULATÓRIO", aliases: ["texto do alerta", "texto alerta regulatorio", "aviso anvisa"], required: false, type: "string" },

  // 4. Preços & Estoque
  { key: "precoDe", label: "PREÇO DE (R$)", aliases: ["preço de", "preco de", "preço de tabela", "preco tabela", "preço original", "preco original", "de"], required: false, type: "number" },
  { key: "precoPor", label: "PREÇO POR / VENDA (R$)", aliases: ["preço por", "preco por", "preço venda", "preco venda", "preco", "preço", "valor", "venda", "por"], required: false, type: "number" },
  { key: "precoCusto", label: "PREÇO DE CUSTO (R$)", aliases: ["preço de custo", "preco de custo", "preço custo", "preco custo", "custo"], required: false, type: "number" },
  { key: "estoque", label: "ESTOQUE", aliases: ["estoque", "quantidade", "qtd", "saldo", "estoque atual"], required: false, type: "number" },
  { key: "precoSobConsulta", label: "PREÇO SOB CONSULTA (SIM/NÃO)", aliases: ["preço sob consulta", "preco sob consulta", "sob consulta"], required: false, type: "boolean" },
  { key: "bloquearPreco", label: "BLOQUEAR PREÇO (SIM/NÃO)", aliases: ["bloquear preço", "bloquear preco", "travar preco"], required: false, type: "boolean" },
  { key: "emCampanha", label: "EM CAMPANHA (SIM/NÃO)", aliases: ["em campanha", "campanha ativa", "promocao ativa"], required: false, type: "boolean" },
  { key: "precoCampanha", label: "PREÇO NA CAMPANHA (R$)", aliases: ["preço campanha", "preco campanha", "preço promocional campanha"], required: false, type: "number" },
  { key: "campanhaInicio", label: "INÍCIO DA CAMPANHA (AAAA-MM-DD)", aliases: ["início da campanha", "inicio da campanha", "data inicio campanha"], required: false, type: "string" },
  { key: "campanhaFim", label: "FIM DA CAMPANHA (AAAA-MM-DD)", aliases: ["fim da campanha", "data fim campanha", "data limite campanha"], required: false, type: "string" },
  { key: "precoEncarte", label: "PREÇO DE ENCARTE (R$)", aliases: ["preço de encarte", "preco de encarte", "preço encarte", "preco encarte", "tabloide"], required: false, type: "number" },
  { key: "quantidadeMinima", label: "QUANTIDADE MÍNIMA", aliases: ["quantidade mínima", "quantidade minima", "qtd minima", "compra minima"], required: false, type: "number" },
  { key: "quantidadeMultipla", label: "QUANTIDADE MÚLTIPLA", aliases: ["quantidade múltipla", "quantidade multipla", "multiplo de venda"], required: false, type: "number" },
  { key: "programaFidelidade", label: "PROGRAMA DE FIDELIDADE (SIM/NÃO)", aliases: ["programa de fidelidade", "programa fidelidade", "participa fidelidade", "pbm fidelidade"], required: false, type: "boolean" },

  // 5. Embalagem & Características / Atributos
  { key: "quantidadeEmbalagem", label: "QTD NA EMBALAGEM", aliases: ["qtd na embalagem", "qtd embalagem", "quantidade embalagem", "unidades na embalagem"], required: false, type: "number" },
  { key: "unidadeEmbalagem", label: "UNIDADE DA EMBALAGEM", aliases: ["unidade da embalagem", "unidade embalagem", "und embalagem", "tipo embalagem"], required: false, type: "string" },
  { key: "quantidadeConteudo", label: "QTD DE CONTEÚDO", aliases: ["qtd de conteúdo", "qtd conteúdo", "quantidade conteudo", "volume", "peso líquido"], required: false, type: "number" },
  { key: "unidadeConteudo", label: "UNIDADE DO CONTEÚDO", aliases: ["unidade do conteúdo", "unidade conteúdo", "und conteudo", "unidade medida"], required: false, type: "string" },
  { key: "sabor", label: "SABOR / AROMA", aliases: ["sabor / aroma", "sabor", "flavor", "aroma"], required: false, type: "string" },
  { key: "fps", label: "FPS (FATOR PROTEÇÃO SOLAR)", aliases: ["fps", "fator de proteção", "fator protecao solar", "fps protetor"], required: false, type: "number" },
  { key: "faixaEtaria", label: "FAIXA ETÁRIA", aliases: ["faixa etária", "faixa etaria", "idade", "idade recomendada"], required: false, type: "string" },

  // 6. Descrição & Textos
  { key: "resumoDescricao", label: "RESUMO / DESCRIÇÃO CURTA", aliases: ["resumo", "resumo curto", "descrição curta", "descricao curta", "sinopse"], required: false, type: "string" },
  { key: "descricao", label: "DESCRIÇÃO COMPLETA / BULA (HTML)", aliases: ["descrição longa", "descricao longa", "descrição", "descricao", "bula", "detalhes do produto"], required: false, type: "string" },

  // 7. Imagens & Mídia
  { key: "foto", label: "URL DA FOTO PRINCIPAL", aliases: ["url da foto", "foto principal", "imagem principal", "imagem", "foto", "url imagem", "image"], required: false, type: "string" },
  { key: "imagens", label: "FOTOS ADICIONAIS (SEPARADAS POR VÍRGULA)", aliases: ["fotos adicionais", "imagens adicionais", "outras fotos", "galeria imagens"], required: false, type: "array" },
  { key: "imagemAlt", label: "TEXTO ALT DA IMAGEM (SEO)", aliases: ["texto alt da imagem", "alt imagem", "imagem alt", "alt seo"], required: false, type: "string" },
  { key: "videoUrl", label: "URL DO VÍDEO", aliases: ["url do vídeo", "video url", "video", "link video"], required: false, type: "string" },
  { key: "youtubeVideoUrl", label: "URL DO VÍDEO YOUTUBE", aliases: ["url youtube", "youtube", "link youtube", "youtube video"], required: false, type: "string" },

  // 8. SEO & Busca
  { key: "url", label: "LINK DA PÁGINA (SLUG)", aliases: ["slug", "url", "link", "link da página", "link da pagina", "url amigavel"], required: false, type: "string" },
  { key: "seoTitulo", label: "TÍTULO SEO (META TITLE)", aliases: ["título seo", "seo titulo", "titulo seo", "seo title", "meta title"], required: false, type: "string" },
  { key: "metaDescription", label: "DESCRIÇÃO SEO (META DESCRIPTION)", aliases: ["descrição seo", "meta description", "descricao seo", "seo description"], required: false, type: "string" },
  { key: "internalTags", label: "TAGS DE BUSCA (SEPARADAS POR VÍRGULA)", aliases: ["tags de busca", "tags", "palavras-chave", "keywords", "tags internas"], required: false, type: "array" },
  { key: "termosPesquisa", label: "TERMOS DE PESQUISA", aliases: ["termos de pesquisa", "termos busca", "sinonimos"], required: false, type: "string" },

  // 9. Status, Visibilidade & Organização
  { key: "ativo", label: "PRODUTO ATIVO (SIM/NÃO)", aliases: ["produto ativo", "ativo", "status ativo", "publicado"], required: false, type: "boolean" },
  { key: "visivel", label: "VISÍVEL NO CATÁLOGO (SIM/NÃO)", aliases: ["visível no catálogo", "visivel no catalogo", "visivel", "visível"], required: false, type: "boolean" },
  { key: "buscavel", label: "BUSCÁVEL NA BUSCA (SIM/NÃO)", aliases: ["buscável", "buscavel", "pesquisavel", "visivel na busca"], required: false, type: "boolean" },
  { key: "aVenda", label: "DISPONÍVEL PARA VENDA (SIM/NÃO)", aliases: ["disponível para venda", "a venda", "a_venda", "comprar habilitado"], required: false, type: "boolean" },
  { key: "destaque", label: "DESTAQUE NA HOME (SIM/NÃO)", aliases: ["destaque na home", "destaque", "produto em destaque", "featured"], required: false, type: "boolean" },
  { key: "lancamento", label: "SELO DE LANÇAMENTO (SIM/NÃO)", aliases: ["selo de lançamento", "lancamento", "lançamento", "novo produto"], required: false, type: "boolean" },
  { key: "prioridade", label: "PRIORIDADE / RELEVÂNCIA (0-100)", aliases: ["prioridade", "nivel de relevancia", "relevancia", "ordem"], required: false, type: "number" },
  { key: "selosIds", label: "SELOS DO SISTEMA", aliases: ["selos do sistema", "selos ids", "selos", "selo"], required: false, type: "array" },
  { key: "vitrines", label: "VITRINES / COLEÇÕES", aliases: ["vitrines / coleções", "vitrines", "coleções", "colecoes", "coleção"], required: false, type: "array" },
  { key: "compreJuntoProdutoId", label: "COMPRE JUNTO (ID PRODUTO)", aliases: ["compre junto", "compre junto id", "order bump id", "compre_junto_produto_id"], required: false, type: "string" },
];

const TARJA_VALUES: Tarja[] = ["Sem Tarja", "Vermelha", "Vermelha Retém Receita", "Preta", "Amarela"];

// ---- Helpers ----
function normalizeHeader(header: string): string {
  return String(header || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-\.\/\\()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function autoMapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const normalizedHeaders = headers.map(normalizeHeader);

  for (const field of FIELD_MAPPINGS) {
    let bestMatch = "";
    let bestScore = 0;

    for (let i = 0; i < normalizedHeaders.length; i++) {
      const nh = normalizedHeaders[i];
      for (const alias of field.aliases) {
        const normalizedAlias = normalizeHeader(alias);
        if (nh === normalizedAlias) {
          bestMatch = headers[i];
          bestScore = 100;
          break;
        }
        if (nh.includes(normalizedAlias) || normalizedAlias.includes(nh)) {
          const score = 50 + (normalizedAlias.length / Math.max(nh.length, 1)) * 30;
          if (score > bestScore) {
            bestMatch = headers[i];
            bestScore = score;
          }
        }
      }
      if (bestScore === 100) break;
    }

    if (bestScore >= 40) {
      mapping[field.key] = bestMatch;
    }
  }

  return mapping;
}

function generateSlug(nome: string): string {
  return String(nome || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function parseTarja(value: unknown): Tarja {
  const s = String(value || "").toLowerCase().trim();
  if (s.includes("preta")) return "Preta";
  if (s.includes("amarela")) return "Amarela";
  if (s.includes("ret") || s.includes("receita")) return "Vermelha Retém Receita";
  if (s.includes("vermelha")) return "Vermelha";
  return "Sem Tarja";
}

function parseBoolean(value: unknown, defaultValue = false): boolean {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value === "boolean") return value;
  const s = String(value).toLowerCase().trim();
  return ["sim", "s", "true", "1", "yes", "y", "ativo", "habilitado"].includes(s);
}

function parseNumber(value: unknown, defaultValue = 0): number {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value === "number") return isNaN(value) ? defaultValue : value;
  const cleaned = String(value)
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? defaultValue : num;
}

function parseArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(v => typeof v === "string" ? v : (v?.nome || v?.caminhoImagem || String(v))).filter(Boolean);
  const s = String(value).trim();
  if (!s) return [];
  return s.split(/[,;\n]/).map(x => x.trim()).filter(Boolean);
}

function guessCategory(name: string): { categoriaId: string; subcategoriaId: string } {
  const nameLower = name.toLowerCase();

  const rules: { keywords: string[]; cat: string; sub: string }[] = [
    { keywords: ["dipirona", "paracetamol", "ibuprofeno", "aspirina", "dorflex", "neosaldina", "novalgina", "tylenol", "nevralgex", "tandrilax", "torsilax", "dor ", "febre"], cat: "142", sub: "14201" },
    { keywords: ["amoxicilina", "azitromicina", "cefalexina", "ciprofloxacino", "antibiotico"], cat: "142", sub: "14202" },
    { keywords: ["loratadina", "antialergico", "antialérgico", "desloratadina", "allegra", "histamin", "polaramine"], cat: "142", sub: "14203" },
    { keywords: ["omeprazol", "pantoprazol", "antiacido", "antiácido", "digestao", "digestão", "eno", "estomazil", "epocler"], cat: "142", sub: "14204" },
    { keywords: ["losartana", "atenolol", "enalapril", "pressao", "pressão", "hipertensao", "coracao", "coração"], cat: "142", sub: "14205" },
    { keywords: ["shampoo", "condicionador", "cabelo", "capilar", "mascara capilar", "tintura"], cat: "144", sub: "14401" },
    { keywords: ["sabonete", "desodorante", "banho", "hidratante", "creme corporal"], cat: "144", sub: "14402" },
    { keywords: ["escova dental", "creme dental", "pasta de dente", "enxaguante", "fio dental", "oral"], cat: "144", sub: "14403" },
    { keywords: ["protetor solar", "bloqueador solar", "bronzeador", "pos sol", "fps "], cat: "144", sub: "14404" },
    { keywords: ["fralda", "lenco umedecido", "lenço umedecido", "bebe", "bebê", "infantil", "pomada assadura", "mamadeira"], cat: "145", sub: "14501" },
    { keywords: ["vitamina", "suplemento", "omega 3", "ômega 3", "colageno", "colágeno", "multivitaminico", "zinco", "vitamina c", "calcio", "creatina", "whey"], cat: "146", sub: "14601" },
    { keywords: ["termometro", "termômetro", "medidor de pressao", "inalador", "nebulizador", "curativo", "gaze", "esparadrapo", "seringa"], cat: "147", sub: "14701" },
  ];

  for (const rule of rules) {
    if (rule.keywords.some(k => nameLower.includes(k))) {
      return { categoriaId: rule.cat, subcategoriaId: rule.sub };
    }
  }

  return { categoriaId: "", subcategoriaId: "" };
}

function resolveCategory(catInput: string, subcatInput: string): { categoriaId: string; subcategoriaId: string } | null {
  if (!catInput && !subcatInput) return null;
  const cats = categoriesData as any[];
  
  let catId = "";
  let subcatId = "";

  const findByNameOrId = (val: string, list: any[]) => {
    const lower = val.toLowerCase().trim();
    return list.find(c => String(c.id) === val || c.nome.toLowerCase() === lower);
  };

  const topCats = cats.filter(c => !c.parentId);
  const allSubcats = cats.filter(c => !!c.parentId);

  if (catInput) {
    const matchedCat = findByNameOrId(catInput, topCats);
    if (matchedCat) catId = matchedCat.id;
  }
  
  if (subcatInput) {
    const matchedSubcat = findByNameOrId(subcatInput, allSubcats);
    if (matchedSubcat) {
      subcatId = matchedSubcat.id;
      if (!catId && matchedSubcat.parentId) catId = matchedSubcat.parentId;
    }
  }

  if (!catId && !subcatId) return null;
  return { categoriaId: catId, subcategoriaId: subcatId };
}

function rowToProduct(
  row: Record<string, unknown>,
  mapping: Record<string, string>
): Produto {
  const get = (key: string): unknown => {
    const col = mapping[key];
    return col ? row[col] : undefined;
  };

  const nome = String(get("nome") || "Produto sem nome").trim();
  const codigoRaw = String(get("id") || "").trim();
  const id = codigoRaw || `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ean = String(get("ean") || "").trim();
  const sku = String(get("sku") || codigoRaw || ean || id).trim();
  const ean2 = String(get("ean2") || "").trim();
  const ean3 = String(get("ean3") || "").trim();
  const eansSecundarios = parseArray(get("eansSecundarios"));

  const precoPor = parseNumber(get("precoPor"));
  const precoDe = parseNumber(get("precoDe")) || precoPor;
  const precoCusto = parseNumber(get("precoCusto"));
  const estoque = parseNumber(get("estoque"));

  const guessed = guessCategory(nome);
  const rawCat = String(get("categoriaId") || "");
  const rawSubcat = String(get("subcategoriaId") || "");
  const resolvedCat = resolveCategory(rawCat, rawSubcat);
  const categoriaId = resolvedCat?.categoriaId || guessed.categoriaId;
  const subcategoriaId = resolvedCat?.subcategoriaId || guessed.subcategoriaId;
  const categoriasAdicionais = parseArray(get("categoriasAdicionais"));
  const subcategoriasAdicionais = parseArray(get("subcategoriasAdicionais"));

  const foto = String(get("foto") || "").trim();
  const imagensRaw = parseArray(get("imagens"));
  const imagens = imagensRaw.length > 0 ? imagensRaw.map(caminhoImagem => ({ caminhoImagem })) : (foto ? [{ caminhoImagem: foto }] : []);

  const urlParam = String(get("url") || generateSlug(nome) + `-${id}`);
  const seoTitulo = String(get("seoTitulo") || nome);
  const metaDescription = String(get("metaDescription") || "");
  const internalTags = parseArray(get("internalTags"));
  const termosPesquisa = String(get("termosPesquisa") || "");

  const tipoProduto = String(get("tipoProduto") || "fisico");
  const produtoNatureza = String(get("produtoNatureza") || "");
  const principiosAtivosRaw = String(get("principiosAtivos") || "");
  const principiosAtivos = principiosAtivosRaw ? principiosAtivosRaw.split(/[,;]/).map(s => s.trim()).filter(Boolean) : [];

  const marca = String(get("marca") || "").trim();
  const registroAnvisa = String(get("registroAnvisa") || "").trim();
  const tarja = parseTarja(get("tarja"));
  const retemReceita = parseBoolean(get("retemReceita"), tarja.includes("Retém"));
  const tipoReceita = String(get("tipoReceita") || "");
  const generico = parseBoolean(get("generico"), false);
  const tipoMedicamento = String(get("tipoMedicamento") || (generico ? "Genérico" : ""));
  const classeTerapeutica = String(get("classeTerapeutica") || "");
  const indicacaoTerapeutica = String(get("indicacaoTerapeutica") || "");
  const tipoDePreco = String(get("tipoDePreco") || "Liberado");
  const ncm = String(get("ncm") || "");
  const alertaRegulatorio = parseBoolean(get("alertaRegulatorio"), false);
  const alertaTexto = String(get("alertaTexto") || "");

  const precoSobConsulta = parseBoolean(get("precoSobConsulta"), false);
  const bloquearPreco = parseBoolean(get("bloquearPreco"), false);
  const emCampanha = parseBoolean(get("emCampanha"), false);
  const precoCampanha = parseNumber(get("precoCampanha"));
  const campanhaInicio = String(get("campanhaInicio") || "");
  const campanhaFim = String(get("campanhaFim") || "");
  const precoEncarte = parseNumber(get("precoEncarte"));
  const quantidadeMinima = parseNumber(get("quantidadeMinima"), 1);
  const quantidadeMultipla = parseNumber(get("quantidadeMultipla"), 1);
  const programaFidelidade = parseBoolean(get("programaFidelidade"), false);

  const quantidadeEmbalagem = parseNumber(get("quantidadeEmbalagem"));
  const unidadeEmbalagem = String(get("unidadeEmbalagem") || "");
  const quantidadeConteudo = parseNumber(get("quantidadeConteudo"));
  const unidadeConteudo = String(get("unidadeConteudo") || "");
  const sabor = String(get("sabor") || "");
  const fps = parseNumber(get("fps"));
  const faixaEtaria = String(get("faixaEtaria") || "");

  const resumoDescricao = String(get("resumoDescricao") || "");
  const descricao = String(get("descricao") || resumoDescricao || nome);
  const imagemAlt = String(get("imagemAlt") || nome);
  const videoUrl = String(get("videoUrl") || "");
  const youtubeVideoUrl = String(get("youtubeVideoUrl") || "");

  const ativo = parseBoolean(get("ativo"), true);
  const visivel = parseBoolean(get("visivel"), true);
  const buscavel = parseBoolean(get("buscavel"), true);
  const aVenda = parseBoolean(get("aVenda"), true);
  const destaque = parseBoolean(get("destaque"), false);
  const lancamento = parseBoolean(get("lancamento"), false);
  const prioridade = parseNumber(get("prioridade"), 0);
  const selosIds = parseArray(get("selosIds"));
  const vitrines = parseArray(get("vitrines"));
  const compreJuntoProdutoId = String(get("compreJuntoProdutoId") || "");

  return {
    id,
    sku,
    ean,
    ean2,
    ean3,
    eansSecundarios,
    codigoInterno: codigoRaw || id,
    nome,
    marca,
    categoriaId,
    subcategoriaId,
    categoriasAdicionais,
    subcategoriasAdicionais,
    tipoProduto,
    produtoNatureza,
    registroAnvisa,
    tarja,
    retemReceita,
    tipoReceita,
    generico,
    tipoMedicamento,
    principiosAtivos,
    classeTerapeutica,
    indicacaoTerapeutica,
    tipoDePreco,
    ncm,
    alertaRegulatorio,
    alertaTexto,
    precoDe,
    precoPor,
    precoCusto,
    estoque,
    precoSobConsulta,
    bloquearPreco,
    emCampanha,
    precoCampanha,
    campanhaInicio,
    campanhaFim,
    precoEncarte,
    quantidadeMinima,
    quantidadeMultipla,
    programaFidelidade,
    quantidadeEmbalagem,
    unidadeEmbalagem,
    quantidadeConteudo,
    unidadeConteudo,
    sabor,
    fps,
    faixaEtaria,
    resumoDescricao,
    descricao,
    foto: foto || (imagens[0]?.caminhoImagem || ""),
    imagens,
    imagemAlt,
    videoUrl,
    youtubeVideoUrl,
    url: urlParam,
    seoTitulo,
    metaDescription,
    internalTags,
    termosPesquisa,
    ativo,
    visivel,
    buscavel,
    aVenda,
    destaque,
    lancamento,
    prioridade,
    selosIds,
    vitrines,
    compreJuntoProdutoId,
    possuiImagem: Boolean(foto || imagens.length > 0),
  };
}

function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

// ---- Generate Template Spreadsheet CSV (.CSV) ----
export function generateCsvTemplate() {
  const headers = [
    // 1. Identificação Básica
    "Código Interno", "SKU", "EAN (Código de Barras)", "EAN 2", "EAN 3", "EANs Secundários", "Nome do Produto", "Marca / Laboratório",
    // 2. Categorias & Classificação
    "Categoria Principal", "Subcategoria Principal", "Categorias Adicionais", "Subcategorias Adicionais", "Tipo de Produto (fisico/servico)", "Natureza do Produto",
    // 3. Regulatório & Farmacêutico
    "Registro ANVISA / MS", "Tarja", "Retém Receita (Sim/Não)", "Tipo de Receita", "Genérico (Sim/Não)", "Tipo de Medicamento", "Princípios Ativos / Fórmula", "Classe Terapêutica", "Indicação Terapêutica", "Regime de Preço (Liberado/Monitorado)", "NCM", "Alerta Regulatório (Sim/Não)", "Texto do Alerta Regulatório",
    // 4. Preços & Estoque
    "Preço De (R$)", "Preço Por (Venda R$)", "Preço de Custo (R$)", "Estoque", "Preço Sob Consulta (Sim/Não)", "Bloquear Preço (Sim/Não)", "Em Campanha (Sim/Não)", "Preço Campanha (R$)", "Início Campanha (AAAA-MM-DD)", "Fim Campanha (AAAA-MM-DD)", "Preço Encarte (R$)", "Qtd Mínima", "Qtd Múltipla", "Programa Fidelidade (Sim/Não)",
    // 5. Embalagem & Atributos
    "Qtd Embalagem", "Unidade Embalagem", "Qtd Conteúdo", "Unidade Conteúdo", "Sabor / Aroma", "FPS", "Faixa Etária",
    // 6. Descrições
    "Resumo Curto", "Descrição Completa / Bula (HTML)",
    // 7. Imagens & Mídia
    "URL da Foto Principal", "URLs Fotos Adicionais (separadas por vírgula)", "Texto ALT da Imagem", "URL do Vídeo", "URL do Vídeo YouTube",
    // 8. SEO & Busca
    "Link da Página (Slug)", "Título SEO", "Descrição SEO (Meta Description)", "Tags de Busca (separadas por vírgula)", "Termos de Pesquisa",
    // 9. Status & Visibilidade
    "Produto Ativo (Sim/Não)", "Visível no Catálogo (Sim/Não)", "Buscável (Sim/Não)", "À Venda (Sim/Não)", "Destaque na Home (Sim/Não)", "Lançamento (Sim/Não)", "Prioridade / Relevância (0-100)", "Selos IDs", "Vitrines / Coleções", "Compre Junto (ID Produto)",
    // 10. Serviços
    "Instrução de Preparação", "Exige Prescrição"
  ];

  const sampleRows = [
    [
      "563003", "563003", "7896523207360", "", "", "", "NEVRALGEX 300MG + 50MG + 35MG COM 10 COMPRIMIDOS", "CIMED",
      "Medicamentos", "Dor e Febre", "", "", "fisico", "Medicamento",
      "1438100510076", "Sem Tarja", "Não", "", "Sim", "Similar", "Dipirona 300mg, Cafeína 50mg, Orfenadrina 35mg", "Analgésico e Relaxante Muscular", "Alívio de dores musculares e cefaleias", "Liberado", "30049099", "Não", "",
      8.33, 4.99, 2.50, 1406, "Não", "Não", "Sim", 4.49, "2026-08-01", "2026-08-31", 4.99, 1, 1, "Sim",
      10, "Comprimidos", 10, "unidades", "", 0, "Adulto e Pediátrico acima de 12 anos",
      "Indicado para o alívio da dor associada a contraturas musculares.", "<p><strong>Nevralgex</strong> é indicado no alívio da dor associada a contraturas musculares decorrentes de processos traumáticos ou inflamatórios e em cefaleias tensionais.</p>",
      "https://vtx-ag-p.s3.us-east-1.amazonaws.com/10940/7896523207360.jpg", "", "Nevralgex 10 comprimidos Cimed", "", "",
      "nevralgex-300mg-50mg-35mg-10-comprimidos-563003", "Nevralgex 10 Comprimidos - Compre Online com Melhor Preço", "Compre Nevralgex com 10 comprimidos na Farmácias Associadas. Alívio rápido para dores musculares e dor de cabeça com entrega rápida.", "nevralgex, dipirona, relaxante muscular, dor de cabeca, cimed", "nevralgex dor muscular relaxante",
      "Sim", "Sim", "Sim", "Sim", "Sim", "Não", 80, "gen", "ofertas-do-mes,mais-vendidos", "",
      "", "nao"
    ],
    [
      "558600", "558600", "7896523216812", "", "", "", "DIAD 1.5MG COM 1 COMPRIMIDO", "CIMED",
      "Medicamentos", "Saúde da Mulher", "", "", "fisico", "Medicamento",
      "1438100880027", "Sem Tarja", "Não", "", "Sim", "Similar", "Levonorgestrel 1.5mg", "Contraceptivo de Emergência", "Anticoncepção de emergência", "Liberado", "30043919", "Não", "",
      22.55, 19.99, 11.20, 822, "Não", "Não", "Não", 0, "", "", 19.99, 1, 1, "Não",
      1, "Comprimido", 1.5, "mg", "", 0, "Adulto",
      "Contraceptivo de emergência em dose única de levonorgestrel.", "<p><strong>Diad 1,5mg</strong> é indicado como contraceptivo de emergência, que deve ser utilizado dentro de 72 horas após relação sexual desprotegida.</p>",
      "https://vtx-ag-p.s3.us-east-1.amazonaws.com/10940/7896523216812.jpg", "", "Diad 1.5mg 1 comprimido Cimed", "", "",
      "diad-15mg-1-comprimido-558600", "Diad 1.5mg com 1 Comprimido - Farmácias Associadas", "Compre Diad 1.5mg anticoncepcional de emergência com total discrição e entrega rápida na Farmácias Associadas.", "diad, levonorgestrel, pilula do dia seguinte, cimed", "diad pilula do dia seguinte emergencial",
      "Sim", "Sim", "Sim", "Sim", "Não", "Não", 60, "", "saude-feminina", "",
      "", "nao"
    ],
    [
      "7891234", "7891234", "7891058021108", "", "", "", "PROTETOR SOLAR FACIAL FPS 60 TOQUE SECO 50G", "ASSOCIADAS DERMO",
      "Dermocosméticos", "Proteção Solar", "Cuidados com a Pele", "Rosto", "fisico", "Cosmético",
      "25351.123456/2026-78", "Sem Tarja", "Não", "", "Não", "", "Filtros Solares UVA/UVB, Vitamina E, Niacinamida", "Fotoprotetor Dermatológico", "Proteção solar diária com ação antioxidante e controle de oleosidade", "Liberado", "33049990", "Não", "",
      69.90, 49.90, 28.00, 350, "Não", "Não", "Sim", 44.90, "2026-08-01", "2026-08-31", 49.90, 1, 1, "Sim",
      1, "Bisnaga", 50, "g", "Sem Fragrância", 60, "Todas as Idades",
      "Alta proteção solar UVA/UVB com toque seco e controle de oleosidade.", "<p>O <strong>Protetor Solar Facial FPS 60</strong> oferece alta proteção contra os raios solares, prevenindo o fotoenvelhecimento e manchas solares. Fórmula não comedogênica de rápida absorção.</p>",
      "https://vtx-ag-p.s3.us-east-1.amazonaws.com/10940/7891058021108.jpg", "", "Protetor Solar Facial FPS 60 Toque Seco Associadas Dermo 50g", "", "",
      "protetor-solar-facial-fps-60-toque-seco-50g-7891234", "Protetor Solar Facial FPS 60 Toque Seco 50g - Farmácias Associadas", "Proteja sua pele com o Protetor Solar Facial FPS 60. Toque seco e alta durabilidade. Compre online com desconto exclusivo.", "protetor solar, protetor facial, fps 60, toque seco, dermocosmeticos", "protetor solar rosto toque seco",
      "Sim", "Sim", "Sim", "Sim", "Sim", "Sim", 95, "lancamento,dermo", "verao,dermocosmeticos,destaques-home", "",
      "", "nao"
    ]
  ];

  const csvContent = "\uFEFF" + [
    headers.map(escapeCsvValue).join(";"),
    ...sampleRows.map(row => row.map(escapeCsvValue).join(";"))
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const dlAnchorElem = document.createElement("a");
  dlAnchorElem.setAttribute("href", url);
  dlAnchorElem.setAttribute("download", "modelo_produtos_farmacia.csv");
  document.body.appendChild(dlAnchorElem);
  dlAnchorElem.click();
  document.body.removeChild(dlAnchorElem);
  URL.revokeObjectURL(url);
}

// ---- Generate Template Spreadsheet (.XLSX) ----
export function generateTemplate() {
  const wb = XLSX.utils.book_new();
  const headers = [
    // 1. Identificação Básica
    "Código Interno", "SKU", "EAN (Código de Barras)", "EAN 2", "EAN 3", "EANs Secundários", "Nome do Produto", "Marca / Laboratório",
    // 2. Categorias & Classificação
    "Categoria Principal", "Subcategoria Principal", "Categorias Adicionais", "Subcategorias Adicionais", "Tipo de Produto (fisico/servico)", "Natureza do Produto",
    // 3. Regulatório & Farmacêutico
    "Registro ANVISA / MS", "Tarja", "Retém Receita (Sim/Não)", "Tipo de Receita", "Genérico (Sim/Não)", "Tipo de Medicamento", "Princípios Ativos / Fórmula", "Classe Terapêutica", "Indicação Terapêutica", "Regime de Preço (Liberado/Monitorado)", "NCM", "Alerta Regulatório (Sim/Não)", "Texto do Alerta Regulatório",
    // 4. Preços & Estoque
    "Preço De (R$)", "Preço Por (Venda R$)", "Preço de Custo (R$)", "Estoque", "Preço Sob Consulta (Sim/Não)", "Bloquear Preço (Sim/Não)", "Em Campanha (Sim/Não)", "Preço Campanha (R$)", "Início Campanha (AAAA-MM-DD)", "Fim Campanha (AAAA-MM-DD)", "Preço Encarte (R$)", "Qtd Mínima", "Qtd Múltipla", "Programa Fidelidade (Sim/Não)",
    // 5. Embalagem & Atributos
    "Qtd Embalagem", "Unidade Embalagem", "Qtd Conteúdo", "Unidade Conteúdo", "Sabor / Aroma", "FPS", "Faixa Etária",
    // 6. Descrições
    "Resumo Curto", "Descrição Completa / Bula (HTML)",
    // 7. Imagens & Mídia
    "URL da Foto Principal", "URLs Fotos Adicionais (separadas por vírgula)", "Texto ALT da Imagem", "URL do Vídeo", "URL do Vídeo YouTube",
    // 8. SEO & Busca
    "Link da Página (Slug)", "Título SEO", "Descrição SEO (Meta Description)", "Tags de Busca (separadas por vírgula)", "Termos de Pesquisa",
    // 9. Status & Visibilidade
    "Produto Ativo (Sim/Não)", "Visível no Catálogo (Sim/Não)", "Buscável (Sim/Não)", "À Venda (Sim/Não)", "Destaque na Home (Sim/Não)", "Lançamento (Sim/Não)", "Prioridade / Relevância (0-100)", "Selos IDs", "Vitrines / Coleções", "Compre Junto (ID Produto)",
    // 10. Serviços
    "Instrução de Preparação", "Exige Prescrição"
  ];

  const sampleRows = [
    [
      "563003", "563003", "7896523207360", "", "", "", "NEVRALGEX 300MG + 50MG + 35MG COM 10 COMPRIMIDOS", "CIMED",
      "Medicamentos", "Dor e Febre", "", "", "fisico", "Medicamento",
      "1438100510076", "Sem Tarja", "Não", "", "Sim", "Similar", "Dipirona 300mg, Cafeína 50mg, Orfenadrina 35mg", "Analgésico e Relaxante Muscular", "Alívio de dores musculares e cefaleias", "Liberado", "30049099", "Não", "",
      8.33, 4.99, 2.50, 1406, "Não", "Não", "Sim", 4.49, "2026-08-01", "2026-08-31", 4.99, 1, 1, "Sim",
      10, "Comprimidos", 10, "unidades", "", 0, "Adulto e Pediátrico acima de 12 anos",
      "Indicado para o alívio da dor associada a contraturas musculares.", "<p><strong>Nevralgex</strong> é indicado no alívio da dor associada a contraturas musculares decorrentes de processos traumáticos ou inflamatórios e em cefaleias tensionais.</p>",
      "https://vtx-ag-p.s3.us-east-1.amazonaws.com/10940/7896523207360.jpg", "", "Nevralgex 10 comprimidos Cimed", "", "",
      "nevralgex-300mg-50mg-35mg-10-comprimidos-563003", "Nevralgex 10 Comprimidos - Compre Online com Melhor Preço", "Compre Nevralgex com 10 comprimidos na Farmácias Associadas. Alívio rápido para dores musculares e dor de cabeça com entrega rápida.", "nevralgex, dipirona, relaxante muscular, dor de cabeca, cimed", "nevralgex dor muscular relaxante",
      "Sim", "Sim", "Sim", "Sim", "Sim", "Não", 80, "gen", "ofertas-do-mes,mais-vendidos", "",
      "", "nao"
    ],
    [
      "558600", "558600", "7896523216812", "", "", "", "DIAD 1.5MG COM 1 COMPRIMIDO", "CIMED",
      "Medicamentos", "Saúde da Mulher", "", "", "fisico", "Medicamento",
      "1438100880027", "Sem Tarja", "Não", "", "Sim", "Similar", "Levonorgestrel 1.5mg", "Contraceptivo de Emergência", "Anticoncepção de emergência", "Liberado", "30043919", "Não", "",
      22.55, 19.99, 11.20, 822, "Não", "Não", "Não", 0, "", "", 19.99, 1, 1, "Não",
      1, "Comprimido", 1.5, "mg", "", 0, "Adulto",
      "Contraceptivo de emergência em dose única de levonorgestrel.", "<p><strong>Diad 1,5mg</strong> é indicado como contraceptivo de emergência, que deve ser utilizado dentro de 72 horas após relação sexual desprotegida.</p>",
      "https://vtx-ag-p.s3.us-east-1.amazonaws.com/10940/7896523216812.jpg", "", "Diad 1.5mg 1 comprimido Cimed", "", "",
      "diad-15mg-1-comprimido-558600", "Diad 1.5mg com 1 Comprimido - Farmácias Associadas", "Compre Diad 1.5mg anticoncepcional de emergência com total discrição e entrega rápida na Farmácias Associadas.", "diad, levonorgestrel, pilula do dia seguinte, cimed", "diad pilula do dia seguinte emergencial",
      "Sim", "Sim", "Sim", "Sim", "Não", "Não", 60, "", "saude-feminina", "",
      "", "nao"
    ],
    [
      "7891234", "7891234", "7891058021108", "", "", "", "PROTETOR SOLAR FACIAL FPS 60 TOQUE SECO 50G", "ASSOCIADAS DERMO",
      "Dermocosméticos", "Proteção Solar", "Cuidados com a Pele", "Rosto", "fisico", "Cosmético",
      "25351.123456/2026-78", "Sem Tarja", "Não", "", "Não", "", "Filtros Solares UVA/UVB, Vitamina E, Niacinamida", "Fotoprotetor Dermatológico", "Proteção solar diária com ação antioxidante e controle de oleosidade", "Liberado", "33049990", "Não", "",
      69.90, 49.90, 28.00, 350, "Não", "Não", "Sim", 44.90, "2026-08-01", "2026-08-31", 49.90, 1, 1, "Sim",
      1, "Bisnaga", 50, "g", "Sem Fragrância", 60, "Todas as Idades",
      "Alta proteção solar UVA/UVB com toque seco e controle de oleosidade.", "<p>O <strong>Protetor Solar Facial FPS 60</strong> oferece alta proteção contra os raios solares, prevenindo o fotoenvelhecimento e manchas solares. Fórmula não comedogênica de rápida absorção.</p>",
      "https://vtx-ag-p.s3.us-east-1.amazonaws.com/10940/7891058021108.jpg", "", "Protetor Solar Facial FPS 60 Toque Seco Associadas Dermo 50g", "", "",
      "protetor-solar-facial-fps-60-toque-seco-50g-7891234", "Protetor Solar Facial FPS 60 Toque Seco 50g - Farmácias Associadas", "Proteja sua pele com o Protetor Solar Facial FPS 60. Toque seco e alta durabilidade. Compre online com desconto exclusivo.", "protetor solar, protetor facial, fps 60, toque seco, dermocosmeticos", "protetor solar rosto toque seco",
      "Sim", "Sim", "Sim", "Sim", "Sim", "Sim", 95, "lancamento,dermo", "verao,dermocosmeticos,destaques-home", "",
      "", "nao"
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 18) }));
  XLSX.utils.book_append_sheet(wb, ws, "Produtos");
  XLSX.writeFile(wb, "modelo_produtos_farmacia.xlsx");
}

// ---- Generate Template JSON (.JSON) ----
export function generateJsonTemplate() {
  const jsonSample = [
    {
      "cabecalho_identificacao": {
        "codigo_interno": "563003",
        "sku": "563003",
        "ean_principal": "7896523207360",
        "ean_secundario_2": "",
        "ean_secundario_3": "",
        "eans_secundarios_adicionais": [],
        "nome_produto_descricao_comercial": "NEVRALGEX 300MG + 50MG + 35MG COM 10 COMPRIMIDOS",
        "marca_fabricante_laboratorio": "CIMED"
      },
      "categorizacao_e_classificacao": {
        "categoria_principal": "Medicamentos",
        "subcategoria_principal": "Dor e Febre",
        "categorias_adicionais": [],
        "subcategorias_adicionais": [],
        "tipo_produto": "fisico",
        "natureza_do_produto": "Medicamento"
      },
      "informacoes_farmaceuticas_e_regulatorias": {
        "registro_anvisa_ms": "1438100510076",
        "tarja": "Sem Tarja",
        "retem_receita": false,
        "tipo_de_receita": "",
        "medicamento_generico": true,
        "tipo_de_medicamento": "Similar",
        "principios_ativos_formula": "Dipirona 300mg, Cafeína 50mg, Orfenadrina 35mg",
        "classe_terapeutica": "Analgésico e Relaxante Muscular",
        "indicacao_terapeutica": "Alívio de dores musculares e cefaleias",
        "regime_de_preco": "Liberado",
        "ncm": "30049099",
        "alerta_regulatorio": false,
        "texto_alerta_regulatorio": ""
      },
      "precificacao_e_estoque": {
        "preco_de": 8.33,
        "preco_por_venda": 4.99,
        "preco_custo": 2.50,
        "estoque": 1406,
        "preco_sob_consulta": false,
        "bloquear_preco": false,
        "em_campanha": true,
        "preco_campanha": 4.49,
        "data_inicio_campanha": "2026-08-01",
        "data_fim_campanha": "2026-08-31",
        "preco_encarte": 4.99,
        "quantidade_minima_venda": 1,
        "quantidade_multipla_venda": 1,
        "participa_programa_fidelidade": true
      },
      "embalagem_e_atributos": {
        "quantidade_na_embalagem": 10,
        "unidade_da_embalagem": "Comprimidos",
        "quantidade_do_conteudo": 10,
        "unidade_do_conteudo": "unidades",
        "sabor_aroma": "",
        "fps_protecao_solar": 0,
        "faixa_etaria": "Adulto e Pediátrico acima de 12 anos"
      },
      "conteudo_e_descricoes": {
        "resumo_curto": "Indicado para o alívio da dor associada a contraturas musculares.",
        "descricao_completa_html": "<p><strong>Nevralgex</strong> é indicado no alívio da dor associada a contraturas musculares decorrentes de processos traumáticos ou inflamatórios e em cefaleias tensionais.</p>"
      },
      "imagens_e_midia": {
        "url_foto_principal": "https://vtx-ag-p.s3.us-east-1.amazonaws.com/10940/7896523207360.jpg",
        "urls_fotos_adicionais": [],
        "texto_alt_imagem_seo": "Nevralgex 10 comprimidos Cimed",
        "url_video": "",
        "url_video_youtube": ""
      },
      "seo_e_buscas": {
        "link_da_pagina_slug": "nevralgex-300mg-50mg-35mg-10-comprimidos-563003",
        "titulo_seo_meta_title": "Nevralgex 10 Comprimidos - Compre Online com Melhor Preço",
        "descricao_seo_meta_description": "Compre Nevralgex com 10 comprimidos na Farmácias Associadas. Alívio rápido para dores musculares e dor de cabeça com entrega rápida.",
        "tags_de_busca_interna": ["nevralgex", "dipirona", "relaxante muscular", "dor de cabeca", "cimed"],
        "termos_pesquisa": "nevralgex dor muscular relaxante"
      },
      "status_e_organizacao": {
        "produto_ativo": true,
        "visivel_no_catalogo": true,
        "buscavel_na_busca": true,
        "disponivel_para_venda": true,
        "destaque_na_home": true,
        "selo_lancamento": false,
        "prioridade_relevancia": 80,
        "selos_ids": ["gen"],
        "vitrines_colecoes": ["ofertas-do-mes", "mais-vendidos"],
        "compre_junto_produto_id": ""
      },
      "servicos_e_saude": {
        "instrucao_preparacao": "",
        "prescricao_servico": "nao"
      }
    }
  ];

  const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonSample, null, 2));
  const dlAnchorElem = document.createElement("a");
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "modelo_produtos_completo.json");
  document.body.appendChild(dlAnchorElem);
  dlAnchorElem.click();
  document.body.removeChild(dlAnchorElem);
}

// ---- Export products as JSON ----
export function exportProductsAsJson(products: Produto[]) {
  const jsonList = products.map(p => ({
    cabecalho_identificacao: {
      codigo_interno: p.codigoInterno || p.id,
      sku: p.sku || p.codigoInterno || p.ean || p.id,
      ean_principal: p.ean || "",
      ean_secundario_2: p.ean2 || "",
      ean_secundario_3: p.ean3 || "",
      eans_secundarios_adicionais: Array.isArray(p.eansSecundarios) ? p.eansSecundarios : (p.eansSecundarios ? [p.eansSecundarios] : []),
      nome_produto_descricao_comercial: p.nome || "",
      marca_fabricante_laboratorio: p.marca || ""
    },
    categorizacao_e_classificacao: {
      categoria_principal: p.categoriaId || "",
      subcategoria_principal: p.subcategoriaId || "",
      categorias_adicionais: Array.isArray(p.categoriasAdicionais) ? p.categoriasAdicionais : (p.categoriasAdicionais ? [p.categoriasAdicionais] : []),
      subcategorias_adicionais: Array.isArray(p.subcategoriasAdicionais) ? p.subcategoriasAdicionais : (p.subcategoriasAdicionais ? [p.subcategoriasAdicionais] : []),
      tipo_produto: p.tipoProduto || "fisico",
      natureza_do_produto: p.produtoNatureza || ""
    },
    informacoes_farmaceuticas_e_regulatorias: {
      registro_anvisa_ms: p.registroAnvisa || "",
      tarja: p.tarja || "Sem Tarja",
      retem_receita: Boolean(p.retemReceita),
      tipo_de_receita: p.tipoReceita || "",
      medicamento_generico: Boolean(p.generico),
      tipo_de_medicamento: p.tipoMedicamento || "",
      principios_ativos_formula: Array.isArray(p.principiosAtivos) ? p.principiosAtivos.map(x => typeof x === 'string' ? x : x.nome).join(", ") : (p.principiosAtivos || ""),
      classe_terapeutica: p.classeTerapeutica || "",
      indicacao_terapeutica: p.indicacaoTerapeutica || "",
      regime_de_preco: p.tipoDePreco || "Liberado",
      ncm: p.ncm || "",
      alerta_regulatorio: Boolean(p.alertaRegulatorio),
      texto_alerta_regulatorio: p.alertaTexto || ""
    },
    precificacao_e_estoque: {
      preco_de: p.precoDe || 0,
      preco_por_venda: p.precoPor || 0,
      preco_custo: p.precoCusto || 0,
      estoque: p.estoque || 0,
      preco_sob_consulta: Boolean(p.precoSobConsulta),
      bloquear_preco: Boolean(p.bloquearPreco),
      em_campanha: Boolean(p.emCampanha),
      preco_campanha: p.precoCampanha || 0,
      data_inicio_campanha: p.campanhaInicio || "",
      data_fim_campanha: p.campanhaFim || "",
      preco_encarte: p.precoEncarte || 0,
      quantidade_minima_venda: p.quantidadeMinima || 1,
      quantidade_multipla_venda: p.quantidadeMultipla || 1,
      participa_programa_fidelidade: Boolean(p.programaFidelidade)
    },
    embalagem_e_atributos: {
      quantidade_na_embalagem: p.quantidadeEmbalagem || 0,
      unidade_da_embalagem: p.unidadeEmbalagem || "",
      quantidade_do_conteudo: p.quantidadeConteudo || 0,
      unidade_do_conteudo: p.unidadeConteudo || "",
      sabor_aroma: p.sabor || "",
      fps_protecao_solar: p.fps || 0,
      faixa_etaria: p.faixaEtaria || ""
    },
    conteudo_e_descricoes: {
      resumo_curto: p.resumoDescricao || "",
      descricao_completa_html: p.descricao || ""
    },
    imagens_e_midia: {
      url_foto_principal: p.foto || "",
      urls_fotos_adicionais: Array.isArray(p.imagens) ? p.imagens.map((img: any) => typeof img === 'string' ? img : img?.caminhoImagem).filter(Boolean) : [],
      texto_alt_imagem_seo: p.imagemAlt || "",
      url_video: p.videoUrl || "",
      url_video_youtube: p.youtubeVideoUrl || ""
    },
    seo_e_buscas: {
      link_da_pagina_slug: p.url || "",
      titulo_seo_meta_title: p.seoTitulo || "",
      descricao_seo_meta_description: p.metaDescription || "",
      tags_de_busca_interna: Array.isArray(p.internalTags) ? p.internalTags : (p.internalTags ? [p.internalTags] : []),
      termos_pesquisa: p.termosPesquisa || ""
    },
    status_e_organizacao: {
      produto_ativo: p.ativo !== false,
      visivel_no_catalogo: p.visivel !== false,
      buscavel_na_busca: p.buscavel !== false,
      disponivel_para_venda: p.aVenda !== false,
      destaque_na_home: Boolean(p.destaque),
      selo_lancamento: Boolean(p.lancamento),
      prioridade_relevancia: p.prioridade || 0,
      selos_ids: Array.isArray(p.selosIds) ? p.selosIds : (p.selosIds ? [p.selosIds] : []),
      vitrines_colecoes: Array.isArray(p.vitrines) ? p.vitrines : (p.vitrines ? [p.vitrines] : []),
      compre_junto_produto_id: p.compreJuntoProdutoId || ""
    },
    servicos_e_saude: {
      instrucao_preparacao: (p as any).instrucaoPreparacao || "",
      prescricao_servico: (p as any).prescricaoServico || "nao"
    }
  }));

  const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonList, null, 2));
  const dlAnchorElem = document.createElement("a");
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "produtos_exportados.json");
  document.body.appendChild(dlAnchorElem);
  dlAnchorElem.click();
  document.body.removeChild(dlAnchorElem);
}

// ---- Export products as CSV (Spreadsheet) ----
export function exportProductsAsCsv(products: Produto[]) {
  const headers = [
    // 1. Identificação Básica
    "Código Interno", "SKU", "EAN (Código de Barras)", "EAN 2", "EAN 3", "EANs Secundários", "Nome do Produto", "Marca / Laboratório",
    // 2. Categorias & Classificação
    "Categoria Principal", "Subcategoria Principal", "Categorias Adicionais", "Subcategorias Adicionais", "Tipo de Produto", "Natureza do Produto",
    // 3. Regulatório & Farmacêutico
    "Registro ANVISA / MS", "Tarja", "Retém Receita", "Tipo de Receita", "Genérico", "Tipo de Medicamento", "Princípios Ativos / Fórmula", "Classe Terapêutica", "Indicação Terapêutica", "Regime de Preço", "NCM", "Alerta Regulatório", "Texto do Alerta",
    // 4. Preços & Estoque
    "Preço De (R$)", "Preço Por (Venda R$)", "Preço de Custo (R$)", "Estoque", "Preço Sob Consulta", "Bloquear Preço", "Em Campanha", "Preço Campanha (R$)", "Início Campanha", "Fim Campanha", "Preço Encarte (R$)", "Qtd Mínima", "Qtd Múltipla", "Programa Fidelidade",
    // 5. Embalagem & Atributos
    "Qtd Embalagem", "Unidade Embalagem", "Qtd Conteúdo", "Unidade Conteúdo", "Sabor / Aroma", "FPS", "Faixa Etária",
    // 6. Descrições
    "Resumo Curto", "Descrição Completa (HTML)",
    // 7. Imagens & Mídia
    "URL da Foto Principal", "URLs Fotos Adicionais", "Texto ALT da Imagem", "URL do Vídeo", "URL do Vídeo YouTube",
    // 8. SEO & Busca
    "Link da Página (Slug)", "Título SEO", "Descrição SEO (Meta Description)", "Tags de Busca", "Termos de Pesquisa",
    // 9. Status & Visibilidade
    "Produto Ativo", "Visível no Catálogo", "Buscável", "À Venda", "Destaque na Home", "Lançamento", "Prioridade (0-100)", "Selos IDs", "Vitrines", "Compre Junto ID",
    // 10. Serviços
    "Instrução de Preparação", "Exige Prescrição"
  ];
  
  const getCatName = (id: string, isSubcat = false) => {
    const cats = categoriesData as any[];
    const cat = cats.find(c => String(c.id) === String(id));
    return cat ? cat.nome : id;
  };

  const rows = products.map((p) => [
    // 1. Identificação Básica
    p.codigoInterno || p.id,
    p.sku || p.codigoInterno || p.ean || p.id,
    p.ean || "",
    p.ean2 || "",
    p.ean3 || "",
    Array.isArray(p.eansSecundarios) ? p.eansSecundarios.join(", ") : (p.eansSecundarios || ""),
    p.nome || "",
    p.marca || "",

    // 2. Categorias & Classificação
    getCatName(p.categoriaId),
    getCatName(p.subcategoriaId, true),
    Array.isArray(p.categoriasAdicionais) ? p.categoriasAdicionais.join(", ") : (p.categoriasAdicionais || ""),
    Array.isArray(p.subcategoriasAdicionais) ? p.subcategoriasAdicionais.join(", ") : (p.subcategoriasAdicionais || ""),
    p.tipoProduto || "fisico",
    p.produtoNatureza || "",

    // 3. Regulatório & Farmacêutico
    p.registroAnvisa || "",
    p.tarja || "Sem Tarja",
    p.retemReceita ? "Sim" : "Não",
    p.tipoReceita || "",
    p.generico ? "Sim" : "Não",
    p.tipoMedicamento || "",
    Array.isArray(p.principiosAtivos) ? p.principiosAtivos.map(x => typeof x === 'string' ? x : x.nome).join(", ") : (p.principiosAtivos || ""),
    p.classeTerapeutica || "",
    p.indicacaoTerapeutica || "",
    p.tipoDePreco || "Liberado",
    p.ncm || "",
    p.alertaRegulatorio ? "Sim" : "Não",
    p.alertaTexto || "",

    // 4. Preços & Estoque
    p.precoDe || 0,
    p.precoPor || 0,
    p.precoCusto || 0,
    p.estoque || 0,
    p.precoSobConsulta ? "Sim" : "Não",
    p.bloquearPreco ? "Sim" : "Não",
    p.emCampanha ? "Sim" : "Não",
    p.precoCampanha || 0,
    p.campanhaInicio || "",
    p.campanhaFim || "",
    p.precoEncarte || 0,
    p.quantidadeMinima || 1,
    p.quantidadeMultipla || 1,
    p.programaFidelidade ? "Sim" : "Não",

    // 5. Embalagem & Atributos
    p.quantidadeEmbalagem || 0,
    p.unidadeEmbalagem || "",
    p.quantidadeConteudo || 0,
    p.unidadeConteudo || "",
    p.sabor || "",
    p.fps || 0,
    p.faixaEtaria || "",

    // 6. Descrições
    p.resumoDescricao || "",
    p.descricao || "",

    // 7. Imagens & Mídia
    p.foto || "",
    Array.isArray(p.imagens) ? p.imagens.map(img => typeof img === 'string' ? img : img?.caminhoImagem).filter(Boolean).join(", ") : "",
    p.imagemAlt || "",
    p.videoUrl || "",
    p.youtubeVideoUrl || "",

    // 8. SEO & Busca
    p.url || "",
    p.seoTitulo || "",
    p.metaDescription || "",
    Array.isArray(p.internalTags) ? p.internalTags.join(", ") : (p.internalTags || ""),
    p.termosPesquisa || "",

    // 9. Status & Visibilidade
    p.ativo !== false ? "Sim" : "Não",
    p.visivel !== false ? "Sim" : "Não",
    p.buscavel !== false ? "Sim" : "Não",
    p.aVenda !== false ? "Sim" : "Não",
    p.destaque ? "Sim" : "Não",
    p.lancamento ? "Sim" : "Não",
    p.prioridade || 0,
    Array.isArray(p.selosIds) ? p.selosIds.join(", ") : (p.selosIds || ""),
    Array.isArray(p.vitrines) ? p.vitrines.join(", ") : (p.vitrines || ""),
    p.compreJuntoProdutoId || "",
    (p as any).instrucaoPreparacao || "",
    (p as any).prescricaoServico || ""
  ]);

  const csvContent = "\uFEFF" + [
    headers.map(escapeCsvValue).join(";"),
    ...rows.map(row => row.map(escapeCsvValue).join(";"))
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const dlAnchorElem = document.createElement("a");
  dlAnchorElem.setAttribute("href", url);
  dlAnchorElem.setAttribute("download", "produtos_exportados.csv");
  document.body.appendChild(dlAnchorElem);
  dlAnchorElem.click();
  document.body.removeChild(dlAnchorElem);
  URL.revokeObjectURL(url);
}

// ---- Export products as Excel ----
export function exportProductsAsExcel(products: Produto[]) {
  const wb = XLSX.utils.book_new();
  const headers = [
    // 1. Identificação Básica
    "Código Interno", "SKU", "EAN (Código de Barras)", "EAN 2", "EAN 3", "EANs Secundários", "Nome do Produto", "Marca / Laboratório",
    // 2. Categorias & Classificação
    "Categoria Principal", "Subcategoria Principal", "Categorias Adicionais", "Subcategorias Adicionais", "Tipo de Produto", "Natureza do Produto",
    // 3. Regulatório & Farmacêutico
    "Registro ANVISA / MS", "Tarja", "Retém Receita", "Tipo de Receita", "Genérico", "Tipo de Medicamento", "Princípios Ativos / Fórmula", "Classe Terapêutica", "Indicação Terapêutica", "Regime de Preço", "NCM", "Alerta Regulatório", "Texto do Alerta",
    // 4. Preços & Estoque
    "Preço De (R$)", "Preço Por (Venda R$)", "Preço de Custo (R$)", "Estoque", "Preço Sob Consulta", "Bloquear Preço", "Em Campanha", "Preço Campanha (R$)", "Início Campanha", "Fim Campanha", "Preço Encarte (R$)", "Qtd Mínima", "Qtd Múltipla", "Programa Fidelidade",
    // 5. Embalagem & Atributos
    "Qtd Embalagem", "Unidade Embalagem", "Qtd Conteúdo", "Unidade Conteúdo", "Sabor / Aroma", "FPS", "Faixa Etária",
    // 6. Descrições
    "Resumo Curto", "Descrição Completa (HTML)",
    // 7. Imagens & Mídia
    "URL da Foto Principal", "URLs Fotos Adicionais", "Texto ALT da Imagem", "URL do Vídeo", "URL do Vídeo YouTube",
    // 8. SEO & Busca
    "Link da Página (Slug)", "Título SEO", "Descrição SEO (Meta Description)", "Tags de Busca", "Termos de Pesquisa",
    // 9. Status & Visibilidade
    "Produto Ativo", "Visível no Catálogo", "Buscável", "À Venda", "Destaque na Home", "Lançamento", "Prioridade (0-100)", "Selos IDs", "Vitrines", "Compre Junto ID",
    // 10. Serviços
    "Instrução de Preparação", "Exige Prescrição"
  ];
  
  const getCatName = (id: string, isSubcat = false) => {
    const cats = categoriesData as any[];
    const cat = cats.find(c => String(c.id) === String(id));
    return cat ? cat.nome : id;
  };

  const rows = products.map((p) => [
    // 1. Identificação Básica
    p.codigoInterno || p.id,
    p.sku || p.codigoInterno || p.ean || p.id,
    p.ean || "",
    p.ean2 || "",
    p.ean3 || "",
    Array.isArray(p.eansSecundarios) ? p.eansSecundarios.join(", ") : (p.eansSecundarios || ""),
    p.nome || "",
    p.marca || "",

    // 2. Categorias & Classificação
    getCatName(p.categoriaId),
    getCatName(p.subcategoriaId, true),
    Array.isArray(p.categoriasAdicionais) ? p.categoriasAdicionais.join(", ") : (p.categoriasAdicionais || ""),
    Array.isArray(p.subcategoriasAdicionais) ? p.subcategoriasAdicionais.join(", ") : (p.subcategoriasAdicionais || ""),
    p.tipoProduto || "fisico",
    p.produtoNatureza || "",

    // 3. Regulatório & Farmacêutico
    p.registroAnvisa || "",
    p.tarja || "Sem Tarja",
    p.retemReceita ? "Sim" : "Não",
    p.tipoReceita || "",
    p.generico ? "Sim" : "Não",
    p.tipoMedicamento || "",
    Array.isArray(p.principiosAtivos) ? p.principiosAtivos.map(x => typeof x === 'string' ? x : x.nome).join(", ") : (p.principiosAtivos || ""),
    p.classeTerapeutica || "",
    p.indicacaoTerapeutica || "",
    p.tipoDePreco || "Liberado",
    p.ncm || "",
    p.alertaRegulatorio ? "Sim" : "Não",
    p.alertaTexto || "",

    // 4. Preços & Estoque
    p.precoDe || 0,
    p.precoPor || 0,
    p.precoCusto || 0,
    p.estoque || 0,
    p.precoSobConsulta ? "Sim" : "Não",
    p.bloquearPreco ? "Sim" : "Não",
    p.emCampanha ? "Sim" : "Não",
    p.precoCampanha || 0,
    p.campanhaInicio || "",
    p.campanhaFim || "",
    p.precoEncarte || 0,
    p.quantidadeMinima || 1,
    p.quantidadeMultipla || 1,
    p.programaFidelidade ? "Sim" : "Não",

    // 5. Embalagem & Atributos
    p.quantidadeEmbalagem || 0,
    p.unidadeEmbalagem || "",
    p.quantidadeConteudo || 0,
    p.unidadeConteudo || "",
    p.sabor || "",
    p.fps || 0,
    p.faixaEtaria || "",

    // 6. Descrições
    p.resumoDescricao || "",
    p.descricao || "",

    // 7. Imagens & Mídia
    p.foto || "",
    Array.isArray(p.imagens) ? p.imagens.map(img => typeof img === 'string' ? img : img?.caminhoImagem).filter(Boolean).join(", ") : "",
    p.imagemAlt || "",
    p.videoUrl || "",
    p.youtubeVideoUrl || "",

    // 8. SEO & Busca
    p.url || "",
    p.seoTitulo || "",
    p.metaDescription || "",
    Array.isArray(p.internalTags) ? p.internalTags.join(", ") : (p.internalTags || ""),
    p.termosPesquisa || "",

    // 9. Status & Visibilidade
    p.ativo !== false ? "Sim" : "Não",
    p.visivel !== false ? "Sim" : "Não",
    p.buscavel !== false ? "Sim" : "Não",
    p.aVenda !== false ? "Sim" : "Não",
    p.destaque ? "Sim" : "Não",
    p.lancamento ? "Sim" : "Não",
    p.prioridade || 0,
    Array.isArray(p.selosIds) ? p.selosIds.join(", ") : (p.selosIds || ""),
    Array.isArray(p.vitrines) ? p.vitrines.join(", ") : (p.vitrines || ""),
    p.compreJuntoProdutoId || "",
    (p as any).instrucaoPreparacao || "",
    (p as any).prescricaoServico || ""
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 18) }));
  XLSX.utils.book_append_sheet(wb, ws, "Produtos");
  XLSX.writeFile(wb, "produtos_exportados.xlsx");
}

// ---- Step type ----
type Step = "upload" | "mapping" | "preview" | "processing" | "done" | "error";

// ---- Component ----
interface SpreadsheetImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (products: Produto[]) => Promise<void> | void;
}

export function SpreadsheetImporter({ open, onOpenChange, onImport }: SpreadsheetImporterProps) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [parsedProducts, setParsedProducts] = useState<Produto[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [importError, setImportError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setParsedProducts([]);
    setDragOver(false);
    setImportError("");
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const processFile = useCallback((file: File) => {
    const validExtensions = [".xlsx", ".xls", ".csv", ".json"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      toast.error("Formato inválido. Use .xlsx, .xls, .csv ou .json");
      return;
    }

    setFileName(file.name);

    if (ext === ".json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsed = JSON.parse(text);
          let items: any[] = [];

          if (Array.isArray(parsed)) {
            items = parsed;
          } else if (parsed && typeof parsed === "object") {
            if (Array.isArray(parsed.produtos)) items = parsed.produtos;
            else if (Array.isArray(parsed.products)) items = parsed.products;
            else if (parsed.produto) items = [parsed.produto];
            else items = [parsed];
          }

          if (items.length === 0) {
            toast.error("O arquivo JSON não contém produtos válidos.");
            return;
          }

          // Converte estrutura de JSON aninhada ou plana em linhas tabulares
          const flattenedRows = items.map((item: any) => {
            const row: Record<string, any> = {};

            // Se for estrutura aninhada por grupos
            const iden = item.cabecalho_identificacao || item.identificacao || item.cabecalho || {};
            const cat = item.categorizacao_e_classificacao || item.categorizacao || item.classificacao || item.categoria || {};
            const reg = item.informacoes_farmaceuticas_e_regulatorias || item.regulatorio || item.farmaceutico || item.registro_anvisa_retencao_tarja_tipo_receita || {};
            const prec = item.precificacao_e_estoque || item.precificacao || item.precos || item.estoque_precos || {};
            const emb = item.embalagem_e_atributos || item.embalagem || item.atributos || item.caracteristicas || {};
            const desc = item.conteudo_e_descricoes || item.descricoes || item.conteudo || {};
            const midia = item.imagens_e_midia || item.midia || item.imagens || {};
            const seo = item.seo_e_buscas || item.seo || item.google_seo_aeo_geo || {};
            const st = item.status_e_organizacao || item.status || item.visibilidade || {};

            row["id"] = iden.codigo_interno || iden.id || item.codigo_interno || item.id || item.codigoInterno || item.codigo;
            row["sku"] = iden.sku || item.sku || row["id"];
            row["ean"] = iden.ean_principal || iden.ean || item.ean_principal || item.ean || item.gtin;
            row["ean2"] = iden.ean_secundario_2 || item.ean2 || item.ean_secundario_2;
            row["ean3"] = iden.ean_secundario_3 || item.ean3 || item.ean_secundario_3;
            row["eansSecundarios"] = Array.isArray(iden.eans_secundarios_adicionais) ? iden.eans_secundarios_adicionais.join(", ") : (item.eansSecundarios || "");
            row["nome"] = iden.nome_produto_descricao_comercial || iden.nome || item.nome || item.nome_produto || item.descricao_comercial;
            row["marca"] = iden.marca_fabricante_laboratorio || iden.marca || item.marca || item.laboratorio;

            row["categoriaId"] = typeof cat === "string" ? cat : (cat.categoria_principal || cat.nome || cat.id || item.categoriaId || item.categoria);
            row["subcategoriaId"] = typeof cat.subcategoria_principal === "string" ? cat.subcategoria_principal : (cat.subcategoria?.nome || cat.subcategoria_principal || item.subcategoriaId || item.subcategoria);
            row["categoriasAdicionais"] = Array.isArray(cat.categorias_adicionais) ? cat.categorias_adicionais.join(", ") : (item.categoriasAdicionais || "");
            row["subcategoriasAdicionais"] = Array.isArray(cat.subcategorias_adicionais) ? cat.subcategorias_adicionais.join(", ") : (item.subcategoriasAdicionais || "");
            row["tipoProduto"] = cat.tipo_produto || item.tipoProduto || "fisico";
            row["produtoNatureza"] = cat.natureza_do_produto || item.produtoNatureza || "";

            row["registroAnvisa"] = reg.registro_anvisa_ms || reg.ms_registro_anvisa || item.registroAnvisa || item.registro_anvisa || "";
            row["tarja"] = reg.tarja || item.tarja || "Sem Tarja";
            row["retemReceita"] = reg.retem_receita !== undefined ? (reg.retem_receita ? "Sim" : "Não") : (item.retemReceita ? "Sim" : "Não");
            row["tipoReceita"] = reg.tipo_de_receita || item.tipoReceita || "";
            row["generico"] = reg.medicamento_generico !== undefined ? (reg.medicamento_generico ? "Sim" : "Não") : (item.generico ? "Sim" : "Não");
            row["tipoMedicamento"] = reg.tipo_de_medicamento || item.tipoMedicamento || "";
            row["principiosAtivos"] = Array.isArray(reg.principios_ativos_formula) ? reg.principios_ativos_formula.join(", ") : (reg.principios_ativos_formula || item.principiosAtivos || "");
            row["classeTerapeutica"] = reg.classe_terapeutica || item.classeTerapeutica || "";
            row["indicacaoTerapeutica"] = reg.indicacao_terapeutica || item.indicacaoTerapeutica || "";
            row["tipoDePreco"] = reg.regime_de_preco || item.tipoDePreco || "Liberado";
            row["ncm"] = reg.ncm || item.ncm || "";
            row["alertaRegulatorio"] = reg.alerta_regulatorio ? "Sim" : "Não";
            row["alertaTexto"] = reg.texto_alerta_regulatorio || item.alertaTexto || "";

            row["precoDe"] = prec.preco_de !== undefined ? prec.preco_de : item.precoDe;
            row["precoPor"] = prec.preco_por_venda !== undefined ? prec.preco_por_venda : (prec.preco_por !== undefined ? prec.preco_por : item.precoPor);
            row["precoCusto"] = prec.preco_custo !== undefined ? prec.preco_custo : item.precoCusto;
            row["estoque"] = prec.estoque !== undefined ? prec.estoque : item.estoque;
            row["precoSobConsulta"] = prec.preco_sob_consulta ? "Sim" : "Não";
            row["bloquearPreco"] = prec.bloquear_preco ? "Sim" : "Não";
            row["emCampanha"] = prec.em_campanha ? "Sim" : "Não";
            row["precoCampanha"] = prec.preco_campanha !== undefined ? prec.preco_campanha : item.precoCampanha;
            row["campanhaInicio"] = prec.data_inicio_campanha || item.campanhaInicio || "";
            row["campanhaFim"] = prec.data_fim_campanha || item.campanhaFim || "";
            row["precoEncarte"] = prec.preco_encarte !== undefined ? prec.preco_encarte : item.precoEncarte;
            row["quantidadeMinima"] = prec.quantidade_minima_venda || item.quantidadeMinima || 1;
            row["quantidadeMultipla"] = prec.quantidade_multipla_venda || item.quantidadeMultipla || 1;
            row["programaFidelidade"] = prec.participa_programa_fidelidade ? "Sim" : "Não";

            row["quantidadeEmbalagem"] = emb.quantidade_na_embalagem || item.quantidadeEmbalagem || 0;
            row["unidadeEmbalagem"] = emb.unidade_da_embalagem || item.unidadeEmbalagem || "";
            row["quantidadeConteudo"] = emb.quantidade_do_conteudo || item.quantidadeConteudo || 0;
            row["unidadeConteudo"] = emb.unidade_do_conteudo || item.unidadeConteudo || "";
            row["sabor"] = emb.sabor_aroma || item.sabor || "";
            row["fps"] = emb.fps_protecao_solar || item.fps || 0;
            row["faixaEtaria"] = emb.faixa_etaria || item.faixaEtaria || "";

            row["resumoDescricao"] = desc.resumo_curto || item.resumoDescricao || "";
            row["descricao"] = desc.descricao_completa_html || item.descricao || row["resumoDescricao"] || row["nome"];

            row["foto"] = midia.url_foto_principal || item.foto || (Array.isArray(item.imagens) ? item.imagens[0]?.caminhoImagem || item.imagens[0] : "");
            row["imagens"] = Array.isArray(midia.urls_fotos_adicionais) ? midia.urls_fotos_adicionais.join(", ") : (Array.isArray(item.imagens) ? item.imagens.map((i: any) => typeof i === 'string' ? i : i.caminhoImagem).join(", ") : "");
            row["imagemAlt"] = midia.texto_alt_imagem_seo || item.imagemAlt || row["nome"];
            row["videoUrl"] = midia.url_video || item.videoUrl || "";
            row["youtubeVideoUrl"] = midia.url_video_youtube || item.youtubeVideoUrl || "";

            row["url"] = seo.link_da_pagina_slug || item.url || item.slug || "";
            row["seoTitulo"] = seo.titulo_seo_meta_title || item.seoTitulo || row["nome"];
            row["metaDescription"] = seo.descricao_seo_meta_description || item.metaDescription || "";
            row["internalTags"] = Array.isArray(seo.tags_de_busca_interna) ? seo.tags_de_busca_interna.join(", ") : (item.internalTags || "");
            row["termosPesquisa"] = seo.termos_pesquisa || item.termosPesquisa || "";

            row["ativo"] = st.produto_ativo !== undefined ? (st.produto_ativo ? "Sim" : "Não") : (item.ativo !== false ? "Sim" : "Não");
            row["visivel"] = st.visivel_no_catalogo !== undefined ? (st.visivel_no_catalogo ? "Sim" : "Não") : (item.visivel !== false ? "Sim" : "Não");
            row["buscavel"] = st.buscavel_na_busca !== undefined ? (st.buscavel_na_busca ? "Sim" : "Não") : (item.buscavel !== false ? "Sim" : "Não");
            row["aVenda"] = st.disponivel_para_venda !== undefined ? (st.disponivel_para_venda ? "Sim" : "Não") : (item.aVenda !== false ? "Sim" : "Não");
            row["destaque"] = st.destaque_na_home ? "Sim" : (item.destaque ? "Sim" : "Não");
            row["lancamento"] = st.selo_lancamento ? "Sim" : (item.lancamento ? "Sim" : "Não");
            row["prioridade"] = st.prioridade_relevancia !== undefined ? st.prioridade_relevancia : (item.prioridade || 0);
            row["selosIds"] = Array.isArray(st.selos_ids) ? st.selos_ids.join(", ") : (item.selosIds || "");
            row["vitrines"] = Array.isArray(st.vitrines_colecoes) ? st.vitrines_colecoes.join(", ") : (item.vitrines || "");
            row["compreJuntoProdutoId"] = st.compre_junto_produto_id || item.compreJuntoProdutoId || "";

            return row;
          });

          const detectedHeaders = Object.keys(flattenedRows[0]);
          setHeaders(detectedHeaders);
          setRows(flattenedRows);

          const autoMapping: Record<string, string> = {};
          for (const k of detectedHeaders) {
            autoMapping[k] = k;
          }
          setMapping(autoMapping);

          const products = flattenedRows.map((row) => rowToProduct(row, autoMapping));
          setParsedProducts(products);
          setStep("preview");
          toast.success(`${products.length} produtos carregados do arquivo JSON!`);
        } catch (err) {
          console.error(err);
          toast.error("Erro ao ler o arquivo JSON. Verifique a formatação.");
        }
      };
      reader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

        if (jsonData.length === 0) {
          toast.error("A planilha está vazia.");
          return;
        }

        const detectedHeaders = Object.keys(jsonData[0]);
        setHeaders(detectedHeaders);
        setRows(jsonData);

        // Auto-map columns
        const autoMapping = autoMapColumns(detectedHeaders);
        setMapping(autoMapping);

        setStep("mapping");

        const mappedCount = Object.keys(autoMapping).length;
        if (mappedCount > 0) {
          toast.success(`${mappedCount} colunas mapeadas automaticamente de ${detectedHeaders.length} detectadas.`);
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao ler a planilha. Verifique o formato do arquivo.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }, [processFile]);

  const handleMappingChange = useCallback((fieldKey: string, columnName: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (columnName === "__none__") {
        delete next[fieldKey];
      } else {
        next[fieldKey] = columnName;
      }
      return next;
    });
  }, []);

  const handlePreview = useCallback(() => {
    // Validate required fields
    const missingRequired = FIELD_MAPPINGS
      .filter((f) => f.required && !mapping[f.key])
      .map((f) => f.label);

    if (missingRequired.length > 0) {
      toast.error(`Campos obrigatórios não mapeados: ${missingRequired.join(", ")}`);
      return;
    }

    const products = rows.map((row) => rowToProduct(row, mapping));
    setParsedProducts(products);
    setStep("preview");
  }, [rows, mapping]);

  const handleConfirmImport = useCallback(async () => {
    setStep("processing");
    await waitForDomRepaint(80);
    
    // Simula erro APENAS se o nome do arquivo contiver a palavra "erro" (para fins de teste do usuário)
    const simulateError = fileName.toLowerCase().includes("erro");

    try {
      if (simulateError) {
        setImportError("Não foi possível subir seus produtos. O motivo do erro foi: Falha de conexão com o banco de dados (ERR_TIMEOUT_504)");
        setStep("error");
      } else {
        const enrichedProducts = parsedProducts.map(p => ({
          ...p,
          origem: "Planilha",
          dataImportacao: new Date().toISOString()
        }));
        
        await onImport(enrichedProducts);
        await waitForDomRepaint(350);
        
        setStep("done");
        toast.success(`${parsedProducts.length} produtos importados com sucesso!`);
        
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (err) {
      console.error("Erro ao importar produtos:", err);
      setImportError(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  }, [parsedProducts, onImport, handleClose, fileName]);

  // Mapping quality metrics
  const mappedFieldsCount = Object.keys(mapping).length;
  const requiredFieldsMapped = FIELD_MAPPINGS.filter((f) => f.required && mapping[f.key]).length;
  const totalRequired = FIELD_MAPPINGS.filter((f) => f.required).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            Importar Planilha ou JSON de Produtos
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Selecione ou arraste um arquivo Excel (.xlsx, .xls, .csv) ou JSON (.json) com todos os campos de produto."}
            {step === "mapping" && "Confira o mapeamento das colunas. Ajuste se necessário."}
            {step === "preview" && `Revise os ${parsedProducts.length} produtos antes de importar.`}
            {step === "processing" && "Processando os produtos na base de dados..."}
            {step === "done" && "Importação concluída!"}
            {step === "error" && "Erro na importação"}
          </DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 py-3 px-1">
          {(["upload", "mapping", "preview"] as Step[]).map((s, i) => {
            const isErrorState = step === "error" && s === "preview";
            const isActive = step === s;
            const isPast = ["mapping", "preview", "processing", "done", "error"].indexOf(step) > ["upload", "mapping", "preview"].indexOf(s);
            
            return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-6 ${isPast ? "bg-emerald-500" : "bg-slate-200"} ${isErrorState ? "bg-red-500" : ""}`} />}
              <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold transition-colors ${
                isErrorState ? "bg-red-500 text-white" :
                isActive ? "bg-emerald-600 text-white" :
                isPast ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
              }`}>
                {isErrorState ? <AlertTriangle className="h-3.5 w-3.5" /> : 
                 isPast ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${
                isErrorState ? "text-red-600" :
                isActive ? "text-emerald-700" : "text-slate-400"
              }`}>
                {s === "upload" ? "Upload" : s === "mapping" ? "Mapeamento" : "Preview"}
              </span>
            </div>
          )})}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* ---- UPLOAD STEP ---- */}
          {step === "upload" && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                  dragOver
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.json"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <Upload className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-700">
                      Arraste sua planilha ou arquivo JSON aqui
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      ou clique para selecionar um arquivo do seu computador
                    </p>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">.xlsx</Badge>
                    <Badge variant="secondary" className="text-xs">.xls</Badge>
                    <Badge variant="secondary" className="text-xs">.csv</Badge>
                    <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 border-emerald-300">.json</Badge>
                  </div>
                </div>
              </div>

              {/* Template download buttons */}
              <div className="bg-slate-50 p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">Precisa do modelo padrão?</p>
                  <p className="text-xs text-slate-500">Baixe o modelo com todos os campos idênticos ao cadastro e edição de produtos.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      generateCsvTemplate();
                    }}
                    className="font-bold text-xs flex-1 sm:flex-none border-teal-600 text-teal-700 hover:bg-teal-50"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Baixar Modelo Planilha (.csv)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      generateTemplate();
                    }}
                    className="font-bold text-xs flex-1 sm:flex-none border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Baixar Modelo Planilha (.xlsx)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      generateJsonTemplate();
                    }}
                    className="font-bold text-xs flex-1 sm:flex-none border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Baixar Modelo JSON (.json)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ---- MAPPING STEP ---- */}
          {step === "mapping" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                <div className="text-sm">
                  <span className="font-bold text-slate-700">{fileName}</span>
                  <span className="text-muted-foreground ml-2">
                    · {rows.length} linhas · {headers.length} colunas
                  </span>
                </div>
                <div className="flex gap-2">
                  <Badge variant={requiredFieldsMapped === totalRequired ? "default" : "destructive"} className="text-xs">
                    {requiredFieldsMapped}/{totalRequired} obrigatórios
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {mappedFieldsCount} mapeados
                  </Badge>
                </div>
              </div>

              <div className="grid gap-2">
                {FIELD_MAPPINGS.map((field) => (
                  <div
                    key={field.key}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-colors ${
                      mapping[field.key]
                        ? "bg-emerald-50/50 border-emerald-200"
                        : field.required
                          ? "bg-red-50/50 border-red-200"
                          : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700">{field.label}</span>
                        {field.required && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">obrigatório</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{field.key}</span>
                    </div>
                    <ArrowLeft className="h-4 w-4 text-slate-300 shrink-0" />
                    <Select
                      value={mapping[field.key] || "__none__"}
                      onValueChange={(v) => handleMappingChange(field.key, v)}
                    >
                      <SelectTrigger className="w-56 text-sm">
                        <SelectValue placeholder="Selecionar coluna..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Nenhuma —</SelectItem>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {mapping[field.key] && (
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---- PREVIEW STEP ---- */}
          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-emerald-50 rounded-lg px-4 py-3 border border-emerald-200">
                <Check className="h-5 w-5 text-emerald-600 shrink-0" />
                <div className="text-sm">
                  <span className="font-bold text-emerald-800">{parsedProducts.length} produtos</span>
                  <span className="text-emerald-700 ml-1">prontos para importação</span>
                </div>
              </div>

              {parsedProducts.some((p) => !p.nome || p.nome === "Produto sem nome") && (
                <div className="flex items-center gap-3 bg-amber-50 rounded-lg px-4 py-3 border border-amber-200">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <span className="text-sm text-amber-800">
                    Alguns produtos não possuem nome. Verifique o mapeamento.
                  </span>
                </div>
              )}

              <div className="border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="text-left px-3 py-2 font-bold text-slate-600">#</th>
                        <th className="text-left px-3 py-2 font-bold text-slate-600">Nome</th>
                        <th className="text-left px-3 py-2 font-bold text-slate-600">EAN</th>
                        <th className="text-left px-3 py-2 font-bold text-slate-600">marca</th>
                        <th className="text-right px-3 py-2 font-bold text-slate-600">Preço De</th>
                        <th className="text-right px-3 py-2 font-bold text-slate-600">Preço Por</th>
                        <th className="text-right px-3 py-2 font-bold text-slate-600">Estoque</th>
                        <th className="text-left px-3 py-2 font-bold text-slate-600">Tarja</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedProducts.slice(0, 20).map((p, i) => (
                        <tr key={p.id + i} className="border-b last:border-0 hover:bg-slate-50/50">
                          <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-slate-700 max-w-[200px] truncate">{p.nome}</td>
                          <td className="px-3 py-2 text-muted-foreground font-mono">{p.ean}</td>
                          <td className="px-3 py-2 text-muted-foreground">{p.marca}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {p.precoDe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-emerald-700">
                            {p.precoPor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                          <td className="px-3 py-2 text-right">{p.estoque}</td>
                          <td className="px-3 py-2">
                            <Badge
                              variant={String(p.tarja).toLowerCase().includes("preta") ? "default" : (p.tarja === "Sem Tarja" ? "secondary" : "destructive")}
                              className={`text-[10px] ${String(p.tarja).toLowerCase().includes("preta") ? "bg-black text-white hover:bg-slate-900" : ""}`}
                            >
                              {p.tarja}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedProducts.length > 20 && (
                  <div className="px-3 py-2 bg-slate-50 text-xs text-muted-foreground text-center border-t">
                    Exibindo 20 de {parsedProducts.length} produtos
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---- PROCESSING STEP ---- */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="h-16 w-16 relative">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-lg font-bold text-slate-800 mt-4">Processando Importação...</p>
              <p className="text-sm font-medium text-slate-600 max-w-sm">
                Salvando produtos no catálogo e renderizando atualizações no HTML da tabela...
              </p>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Por favor, aguarde a renderização completa.
              </span>
            </div>
          )}

          {/* ---- DONE STEP ---- */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-emerald-700">Importação Concluída!</p>
              <p className="text-sm text-muted-foreground">
                {parsedProducts.length} produtos foram importados com sucesso.
              </p>
            </div>
          )}

          {/* ---- ERROR STEP ---- */}
          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-lg font-bold text-red-700">Falha na Importação</p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Não foi possível subir seus produtos. O motivo do erro foi:
              </p>
              <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm max-w-md w-full border border-red-200 font-mono text-center">
                {importError}
              </div>
              <Button onClick={() => setStep("upload")} className="mt-4" variant="outline">
                Tentar Novamente
              </Button>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        {step !== "done" && step !== "processing" && step !== "error" && (
          <DialogFooter className="flex-row justify-between gap-2 pt-4 border-t">
            <div>
              {step !== "upload" && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step === "preview" ? "mapping" : "upload")}
                  className="font-bold"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleClose} className="font-bold">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              {step === "mapping" && (
                <Button
                  onClick={handlePreview}
                  disabled={requiredFieldsMapped < totalRequired}
                  className="font-bold bg-emerald-600 hover:bg-emerald-700"
                >
                  Preview
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              {step === "preview" && (
                <Button
                  onClick={handleConfirmImport}
                  className="font-bold bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Importar {parsedProducts.length} produtos
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}


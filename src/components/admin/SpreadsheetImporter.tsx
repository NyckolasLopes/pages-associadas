// @ts-nocheck
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
import { checkIsGenerico } from "@/lib/format";

// ---- Column Mapping Config ----
interface FieldMapping {
  key: keyof Produto;
  label: string;
  aliases: string[];
  required: boolean;
  type: "string" | "number" | "boolean" | "tarja" | "array";
}

const FIELD_MAPPINGS: FieldMapping[] = [
  // 1. Status & Visibilidade
  { key: "ativo", label: "Produto Ativo", aliases: ["produto ativo", "ativo", "status ativo", "publicado"], required: false, type: "boolean" },
  { key: "buscavel", label: "Buscável (Busca)", aliases: ["buscável (busca)", "buscavel (busca)", "buscável na busca", "buscavel na busca", "buscável", "buscavel", "pesquisavel", "visivel na busca"], required: false, type: "boolean" },
  { key: "lancamento", label: "Selo Lançamento", aliases: ["selo lançamento", "selo lancamento", "lançamento", "lancamento", "selo de lançamento", "novo produto"], required: false, type: "boolean" },
  { key: "generico", label: "Selo Genérico", aliases: ["selo genérico", "selo generico", "medicamento genérico", "medicamento generico", "genérico", "generico", "é genérico"], required: false, type: "boolean" },
  { key: "produtoNatureza", label: "Natureza do Produto", aliases: ["natureza do produto", "natureza", "tipo de produto", "tipo produto", "classificação fiscal produto"], required: false, type: "string" },

  // 2. Identificação
  { key: "id", label: "ID / SKU / Código Interno", aliases: ["id / sku / código interno", "id / sku / codigo interno", "id/código interno", "codigo interno", "código interno", "sku", "id", "cod", "idproduto", "id_produto"], required: true, type: "string" },
  { key: "ean", label: "EAN / Código de Barras*", aliases: ["ean / código de barras*", "ean / código de barras", "ean / codigo de barras*", "ean / codigo de barras", "ean/código de barras", "ean", "gtin", "codigo de barras", "código de barras", "barcode", "ean principal"], required: true, type: "string" },
  { key: "eansSecundarios", label: "EANs Secundários (separados por vírgula)", aliases: ["eans secundários (separados por vírgula)", "eans secundarios (separados por virgula)", "eans secundários", "eans secundarios", "outros eans", "eans adicionais", "ean 2", "ean 3", "ean2", "ean3"], required: false, type: "array" },
  { key: "nome", label: "Descrição Comercial / Nome do Produto*", aliases: ["descrição comercial / nome do produto*", "descrição comercial / nome do produto", "descricao comercial / nome do produto*", "descricao comercial / nome do produto", "descrição comercial/nome do produto", "nome do produto", "descrição comercial", "descricao comercial", "nome", "produto", "titulo"], required: true, type: "string" },
  { key: "descricao", label: "Descrição Longa", aliases: ["descrição longa", "descricao longa", "descrição completa / bula (html)", "descrição completa", "descricao completa", "descrição", "descricao", "bula", "detalhes do produto"], required: false, type: "string" },

  // 3. Categorização
  { key: "categoriaId", label: "Categoria (com ID)", aliases: ["categoria (com id)", "categoria com id", "categoria principal", "id categoria", "categoriaid", "id_categoria", "cat_id", "categoria", "departamento"], required: false, type: "string" },
  { key: "subcategoriaId", label: "Subcategoria (com ID)", aliases: ["subcategoria (com id)", "subcategoria com id", "subcategoria principal", "id subcategoria", "subcategoriaid", "id_subcategoria", "subcat_id", "subcategoria", "seção"], required: false, type: "string" },
  { key: "categoriasAdicionais", label: "Categoria Adicional", aliases: ["categoria adicional", "categorias adicionais", "categorias ids", "outras categorias", "categorias extras"], required: false, type: "array" },
  { key: "subcategoriasAdicionais", label: "Subcategoria Adicional", aliases: ["subcategoria adicional", "subcategorias adicionais", "subcategorias ids", "outras subcategorias", "subcategorias extras"], required: false, type: "array" },

  // 4. Princípios Ativos & Características
  { key: "principiosAtivos", label: "Princípios Ativos", aliases: ["princípios ativos", "principios ativos", "princípios ativos / fórmula / dcb", "principio ativo", "farmaco", "dcb", "formula", "composição"], required: false, type: "string" },
  { key: "caracteristicas", label: "Características Adicionais", aliases: ["características adicionais", "caracteristicas adicionais", "características", "caracteristicas", "atributos", "propriedades adicionais"], required: false, type: "string" },
  { key: "marca", label: "Marca", aliases: ["marca", "marca / fabricante / laboratório", "marca (marca)", "laboratório", "laboratorio", "fabricante", "brand"], required: false, type: "string" },
  { key: "classeTerapeutica", label: "Classe Terapêutica", aliases: ["classe terapêutica", "classe terapeutica", "ação terapeutica", "acao terapeutica"], required: false, type: "string" },

  // 5. Regulatório & Farmacêutico
  { key: "alertaTexto", label: "Alerta Regulatório (Texto)", aliases: ["alerta regulatório (texto)", "alerta regulatorio (texto)", "texto do alerta regulatório", "texto alerta regulatorio", "texto do alerta", "aviso anvisa"], required: false, type: "string" },
  { key: "alertaRegulatorio", label: "Requer Exibição do Alerta Regulatório", aliases: ["requer exibição do alerta regulatório", "requer exibicao do alerta regulatorio", "alerta regulatório (sim/não)", "alerta regulatório", "alerta regulatorio", "tem alerta"], required: false, type: "boolean" },
  { key: "registroAnvisa", label: "MS / Registro ANVISA", aliases: ["ms / registro anvisa", "ms/registro anvisa", "registro anvisa / ms", "registro anvisa", "ms", "registro ms", "reg_anvisa", "registroanvisa", "registro"], required: false, type: "string" },
  { key: "retemReceita", label: "Retém Receita?", aliases: ["retém receita?", "retem receita?", "retém receita (sim/não)", "retém receita", "retem receita", "retemreceita", "receita", "controle especial", "reter receita"], required: false, type: "boolean" },
  { key: "tipoMedicamento", label: "Classificação / Tipo do Medicamento", aliases: ["classificação / tipo do medicamento", "classificacao / tipo do medicamento", "tipo de medicamento", "tipo medicamento", "classificação medicamento", "classificacao medicamento"], required: false, type: "string" },
  { key: "tarja", label: "Tarja", aliases: ["tarja", "tipo tarja", "classificação tarja", "cor tarja"], required: false, type: "tarja" },
  { key: "tipoReceita", label: "Tipo de Receita", aliases: ["tipo de receita", "tipo receita", "receituário", "receituario"], required: false, type: "string" },
  { key: "ncm", label: "NCM", aliases: ["ncm", "ncm (código fiscal)", "codigo ncm", "código ncm", "classificacao fiscal"], required: false, type: "string" },
  { key: "prioridade", label: "Nível de Relevância (Prioridade)", aliases: ["nível de relevância (prioridade)", "nivel de relevancia (prioridade)", "prioridade / relevância (0-100)", "nível de relevância", "nivel de relevancia", "prioridade", "relevancia", "ordem"], required: false, type: "number" },

  // 6. Preços
  { key: "precoDe", label: "Preço (de) (R$)", aliases: ["preço (de) (r$)", "preco (de) (r$)", "preço de (r$)", "preço de", "preco de", "preço de tabela", "preco tabela", "preço original", "preco original", "de"], required: false, type: "number" },
  { key: "precoPor", label: "Preço (por) (R$)", aliases: ["preço (por) (r$)", "preco (por) (r$)", "preço por (venda r$)", "preço por", "preco por", "preço venda", "preco venda", "preco", "preço", "valor", "venda", "por"], required: false, type: "number" },

  // 7. SEO & Busca
  { key: "seoTitulo", label: "Título da Página (SEO)", aliases: ["título da página (seo)", "titulo da pagina (seo)", "título seo (meta title)", "título seo", "seo titulo", "titulo seo", "seo title", "meta title"], required: false, type: "string" },
  { key: "url", label: "Link da Página (Slug)", aliases: ["link da página (slug)", "link da pagina (slug)", "link da página", "link da pagina", "slug", "url", "link", "url amigavel"], required: false, type: "string" },
  { key: "palavrasChave" as any, label: "Palavras-Chave Foco (GEO / AEO)", aliases: ["palavras-chave foco (geo / aeo)", "palavras chave foco (geo / aeo)", "palavras-chave foco", "palavras chave foco", "palavras-chave", "palavras chave", "meta keywords", "keywords"], required: false, type: "string" },
  { key: "metaDescription", label: "Descrição da Página (SEO / Meta Description)", aliases: ["descrição da página (seo / meta description)", "descricao da pagina (seo / meta description)", "descrição seo (meta description)", "descrição seo", "meta description", "descricao seo", "seo description"], required: false, type: "string" },
  { key: "imagemAlt", label: "Texto Alternativo da Imagem (Alt SEO)", aliases: ["texto alternativo da imagem (alt seo)", "texto alternativo da imagem", "texto alt da imagem (seo)", "texto alt da imagem", "alt imagem", "imagem alt", "alt seo"], required: false, type: "string" },
  { key: "internalTags", label: "Tags de Busca Internas", aliases: ["tags de busca internas", "tags de busca (separadas por vírgula)", "tags de busca", "tags", "tags internas", "termos de pesquisa"], required: false, type: "array" },
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

function parsePrincipiosAtivos(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  const str = String(val).trim();
  if (!str) return [];
  if (str.startsWith("[") && str.endsWith("]")) {
    try { return JSON.parse(str); } catch (e) {}
  }
  return str.split(/[,;\n]/).map(item => {
    const trimmed = item.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/^([^(]+)(?:\(([^)]+)\))?$/);
    if (match) {
      const nome = match[1].trim();
      const concRaw = (match[2] || "").trim();
      const concMatch = concRaw.match(/^([\d.,]+)\s*([a-zA-Z%]+)?$/);
      return {
        nome,
        concentracao: concMatch ? concMatch[1] : concRaw,
        unidadeMedida: concMatch ? (concMatch[2] || "") : ""
      };
    }
    return { nome: trimmed, concentracao: "", unidadeMedida: "" };
  }).filter(Boolean);
}

function parseCaracteristicas(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  const str = String(val).trim();
  if (!str) return [];
  if (str.startsWith("[") && str.endsWith("]")) {
    try { return JSON.parse(str); } catch (e) {}
  }
  return str.split(/[;\n]/).map(item => {
    const trimmed = item.trim();
    if (!trimmed) return null;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx > 0) {
      return {
        titulo: trimmed.slice(0, colonIdx).trim(),
        descricao: trimmed.slice(colonIdx + 1).trim()
      };
    }
    return { titulo: trimmed, descricao: "" };
  }).filter(Boolean);
}

function resolveCategory(catInput: string, subcatInput: string): { categoriaId: string; subcategoriaId: string } | null {
  if (!catInput && !subcatInput) return null;
  const cats = categoriesData as any[];
  
  let catId = "";
  let subcatId = "";

  const findByNameOrId = (val: string, list: any[]) => {
    if (!val) return null;
    const str = String(val).trim();
    const idPrefixMatch = str.match(/^(\d+)\s*[-–—:]?\s*(.*)$/);
    if (idPrefixMatch) {
      const parsedId = idPrefixMatch[1];
      const match = list.find(c => String(c.id) === parsedId);
      if (match) return match;
    }
    const lower = str.toLowerCase();
    return list.find(c => String(c.id) === str || c.nome.toLowerCase() === lower);
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
  const palavrasChave = parseArray(get("palavrasChave") || get("metaKeywords"));

  const tipoProduto = String(get("tipoProduto") || "fisico");
  const produtoNatureza = String(get("produtoNatureza") || "");
  const principiosAtivos = parsePrincipiosAtivos(get("principiosAtivos"));
  const caracteristicas = parseCaracteristicas(get("caracteristicas"));

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
  const prioridade = parseNumber(get("prioridade"), 0);

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
    caracteristicas,
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
    palavrasChave: palavrasChave.length > 0 ? palavrasChave : undefined,
    ativo,
    visivel,
    buscavel,
    aVenda,
    destaque,
    lancamento,
    prioridade,
    nivelRelevancia: prioridade,
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

// ----------------------------------------------------
// CABEÇALHOS OFICIAIS EXATOS (35 CAMPOS DO CADASTRO)
// ----------------------------------------------------
export const HEADERS_OFICIAIS = [
  "Produto Ativo",
  "Buscável (Busca)",
  "Selo Lançamento",
  "Selo Genérico",
  "Natureza do Produto",
  "ID / SKU / Código Interno",
  "EAN / Código de Barras*",
  "EANs Secundários (separados por vírgula)",
  "Descrição Comercial / Nome do Produto*",
  "Descrição Longa",
  "Categoria (com ID)",
  "Subcategoria (com ID)",
  "Categoria Adicional",
  "Subcategoria Adicional",
  "Princípios Ativos",
  "Características Adicionais",
  "Marca",
  "Classe Terapêutica",
  "Alerta Regulatório (Texto)",
  "Requer Exibição do Alerta Regulatório",
  "MS / Registro ANVISA",
  "Retém Receita?",
  "Classificação / Tipo do Medicamento",
  "Tarja",
  "Tipo de Receita",
  "NCM",
  "Nível de Relevância (Prioridade)",
  "Preço (de) (R$)",
  "Preço (por) (R$)",
  "Título da Página (SEO)",
  "Link da Página (Slug)",
  "Palavras-Chave Foco (GEO / AEO)",
  "Descrição da Página (SEO / Meta Description)",
  "Texto Alternativo da Imagem (Alt SEO)",
  "Tags de Busca Internas"
];

export function formatProductRow(p: Produto): any[] {
  const cats = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.default || [];
  
  const getCatDisplay = (id?: string) => {
    if (!id) return "";
    const cat = cats.find((c: any) => String(c.id) === String(id));
    return cat ? `${cat.id} - ${cat.nome}` : String(id);
  };

  const formatPrincipiosAtivos = (val: any) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (Array.isArray(val)) {
      return val.map((item: any) => {
        if (typeof item === "string") return item;
        const parts = [item.nome || ""];
        if (item.concentracao || item.unidadeMedida) {
          parts.push(`(${[item.concentracao, item.unidadeMedida].filter(Boolean).join("")})`);
        }
        return parts.filter(Boolean).join(" ");
      }).filter(Boolean).join(", ");
    }
    return "";
  };

  const formatCaracteristicas = (val: any) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (Array.isArray(val)) {
      return val.map((item: any) => {
        if (typeof item === "string") return item;
        if (item.titulo && item.descricao) return `${item.titulo}: ${item.descricao}`;
        return item.titulo || item.descricao || "";
      }).filter(Boolean).join("; ");
    }
    return "";
  };

  const formatMultiCats = (list: any) => {
    if (!list) return "";
    if (Array.isArray(list)) {
      return list.map((id: any) => getCatDisplay(id)).filter(Boolean).join(", ");
    }
    return String(list);
  };

  const eansSec = Array.isArray(p.eansSecundarios) 
    ? p.eansSecundarios.filter(Boolean).join(", ") 
    : (p.eansSecundarios || [p.ean2, p.ean3].filter(Boolean).join(", ") || "");

  const tags = Array.isArray(p.internalTags) 
    ? p.internalTags.filter(Boolean).join(", ") 
    : (p.internalTags || "");

  const palavrasChave = Array.isArray((p as any).palavrasChave)
    ? (p as any).palavrasChave.filter(Boolean).join(", ")
    : ((p as any).palavrasChave || (p as any).metaKeywords || tags || "");

  return [
    p.ativo !== false ? "Sim" : "Não",
    (p.buscaveis ?? p.buscavel ?? true) ? "Sim" : "Não",
    p.lancamento ? "Sim" : "Não",
    (p.generico ?? checkIsGenerico(p)) ? "Sim" : "Não",
    p.produtoNatureza || (p.tipoProduto === "servico" ? "Serviço" : (p.categoriaId === "142" ? "Medicamento" : "Físico")),
    p.codigoInterno || p.sku || p.id || "",
    p.ean || "",
    eansSec,
    p.nome || "",
    p.descricao || "",
    getCatDisplay(p.categoriaId),
    getCatDisplay(p.subcategoriaId),
    formatMultiCats(p.categoriasIds || p.categoriasAdicionais),
    formatMultiCats(p.subcategoriasIds || p.subcategoriasAdicionais),
    formatPrincipiosAtivos(p.principiosAtivos),
    formatCaracteristicas(p.caracteristicas),
    p.marca || "",
    p.classeTerapeutica || "",
    p.alertaTexto || "",
    p.alertaRegulatorio ? "Sim" : "Não",
    p.registroAnvisa || p.registroMs || "",
    p.retemReceita ? "Sim" : "Não",
    p.classificacaoRegistro || p.tipoMedicamento || "",
    p.tarja || "Sem Tarja",
    p.tipoReceita || "",
    p.ncm || "",
    p.nivelRelevancia ?? p.prioridade ?? 0,
    p.precoDe || "",
    p.precoPor || "",
    p.seoTitulo || p.metaTitle || "",
    p.url || p.slug || "",
    palavrasChave,
    p.metaDescription || "",
    p.imagemAlt || p.altText || "",
    tags
  ];
}

const SAMPLE_ROWS = [
  [
    "Sim", "Sim", "Não", "Sim", "Medicamento",
    "563003", "7896523207360", "7896523207361, 7896523207362",
    "NEVRALGEX 300MG + 50MG + 35MG COM 10 COMPRIMIDOS",
    "<p><strong>Nevralgex</strong> é indicado no alívio da dor associada a contraturas musculares decorrentes de processos traumáticos ou inflamatórios e em cefaleias tensionais.</p>",
    "142 - Medicamentos", "14201 - Dor e Febre", "", "",
    "Dipirona 300mg, Cafeína 50mg, Orfenadrina 35mg",
    "Forma: Comprimidos; Quantidade: 10 comprimidos; Uso: Oral",
    "CIMED", "Analgésico e Relaxante Muscular",
    "AO PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO.", "Sim",
    "1438100510076", "Não", "Similar", "Sem Tarja", "", "30049099", 80,
    8.33, 4.99,
    "Nevralgex 10 Comprimidos - Compre Online com Melhor Preço",
    "nevralgex-300mg-50mg-35mg-10-comprimidos-563003",
    "nevralgex, dor muscular, dor de cabeca, cimed",
    "Compre Nevralgex com 10 comprimidos na Farmácias Associadas. Alívio rápido para dores musculares e dor de cabeça com entrega rápida.",
    "Nevralgex 10 comprimidos Cimed",
    "nevralgex, dipirona, relaxante muscular, dor de cabeca, cimed"
  ],
  [
    "Sim", "Sim", "Não", "Sim", "Medicamento",
    "558600", "7896523216812", "",
    "DIAD 1.5MG COM 1 COMPRIMIDO",
    "<p><strong>Diad 1,5mg</strong> é indicado como contraceptivo de emergência, que deve ser utilizado dentro de 72 horas após relação sexual desprotegida.</p>",
    "142 - Medicamentos", "14206 - Saúde da Mulher", "", "",
    "Levonorgestrel 1.5mg",
    "Forma: Comprimido; Dose: Dose Única",
    "CIMED", "Contraceptivo de Emergência",
    "AO PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO.", "Sim",
    "1438100880027", "Não", "Similar", "Sem Tarja", "", "30043919", 60,
    22.55, 19.99,
    "Diad 1.5mg com 1 Comprimido - Farmácias Associadas",
    "diad-15mg-1-comprimido-558600",
    "diad, levonorgestrel, pilula do dia seguinte, cimed",
    "Compre Diad 1.5mg anticoncepcional de emergência com total discrição e entrega rápida na Farmácias Associadas.",
    "Diad 1.5mg 1 comprimido Cimed",
    "diad, levonorgestrel, pilula do dia seguinte, anticoncepcional"
  ],
  [
    "Sim", "Sim", "Sim", "Não", "Cosmético",
    "7891234", "7891058021108", "",
    "PROTETOR SOLAR FACIAL FPS 60 TOQUE SECO 50G",
    "<p>O <strong>Protetor Solar Facial FPS 60</strong> oferece alta proteção contra os raios solares, prevenindo o fotoenvelhecimento e manchas solares.</p>",
    "144 - Dermocosméticos e Beleza", "14404 - Proteção Solar", "144 - Cuidados com a Pele", "14402 - Rosto",
    "Vitamina E, Niacinamida, Filtros UVA/UVB",
    "FPS: 60; Toque: Seco; Conteúdo: 50g; Tipo de Pele: Oleosa e Mista",
    "ASSOCIADAS DERMO", "Fotoprotetor Dermatológico",
    "", "Não",
    "25351.123456/2026-78", "Não", "", "Sem Tarja", "", "33049990", 95,
    69.90, 49.90,
    "Protetor Solar Facial FPS 60 Toque Seco 50g - Farmácias Associadas",
    "protetor-solar-facial-fps-60-toque-seco-50g-7891234",
    "protetor solar, protetor facial, fps 60, toque seco, dermocosmeticos",
    "Proteja sua pele com o Protetor Solar Facial FPS 60. Toque seco e alta durabilidade na Farmácias Associadas.",
    "Protetor Solar Facial FPS 60 Toque Seco Associadas Dermo 50g",
    "protetor solar, fps 60, toque seco, rosto, protetor facial"
  ]
];

// ---- Generate Template Spreadsheet CSV (.CSV) ----
export function generateCsvTemplate() {
  const csvContent = "\uFEFF" + [
    HEADERS_OFICIAIS.map(escapeCsvValue).join(";"),
    ...SAMPLE_ROWS.map(row => row.map(escapeCsvValue).join(";"))
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
  const ws = XLSX.utils.aoa_to_sheet([HEADERS_OFICIAIS, ...SAMPLE_ROWS]);
  ws["!cols"] = HEADERS_OFICIAIS.map((h) => ({ wch: Math.max(h.length + 4, 18) }));
  XLSX.utils.book_append_sheet(wb, ws, "Produtos");
  XLSX.writeFile(wb, "modelo_produtos_farmacia.xlsx");
}

// ---- Generate Template JSON (.JSON) ----
export function generateJsonTemplate() {
  const jsonSample = SAMPLE_ROWS.map(row => {
    const obj: Record<string, any> = {};
    HEADERS_OFICIAIS.forEach((header, idx) => {
      obj[header] = row[idx] !== undefined ? row[idx] : "";
    });
    return obj;
  });

  const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonSample, null, 2));
  const dlAnchorElem = document.createElement("a");
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "modelo_produtos_completo.json");
  document.body.appendChild(dlAnchorElem);
  dlAnchorElem.click();
  document.body.removeChild(dlAnchorElem);
  URL.revokeObjectURL(url => {});
}

// ---- Export products as JSON ----
export function exportProductsAsJson(products: Produto[]) {
  const jsonList = products.map(p => {
    const row = formatProductRow(p);
    const obj: Record<string, any> = {};
    HEADERS_OFICIAIS.forEach((header, idx) => {
      obj[header] = row[idx] !== undefined ? row[idx] : "";
    });
    return obj;
  });

  const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonList, null, 2));
  const dlAnchorElem = document.createElement("a");
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "produtos_exportados.json");
  document.body.appendChild(dlAnchorElem);
  dlAnchorElem.click();
  document.body.removeChild(dlAnchorElem);
  URL.revokeObjectURL(url => {});
}

// ---- Export products as CSV (Spreadsheet) ----
export function exportProductsAsCsv(products: Produto[]) {
  const rows = products.map(p => formatProductRow(p));

  const csvContent = "\uFEFF" + [
    HEADERS_OFICIAIS.map(escapeCsvValue).join(";"),
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
  const rows = products.map(p => formatProductRow(p));
  const ws = XLSX.utils.aoa_to_sheet([HEADERS_OFICIAIS, ...rows]);
  ws["!cols"] = HEADERS_OFICIAIS.map((h) => ({ wch: Math.max(h.length + 4, 18) }));
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


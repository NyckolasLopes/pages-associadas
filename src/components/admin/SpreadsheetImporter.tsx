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
import type { Produto, Tarja } from "@/types";
import { cn } from "@/lib/utils";
import categoriesData from "@/data/categories.json";

// ---- Column Mapping Config ----
interface FieldMapping {
  key: keyof Produto;
  label: string;
  aliases: string[];
  required: boolean;
  type: "string" | "number" | "boolean" | "tarja";
}

const FIELD_MAPPINGS: FieldMapping[] = [
  { key: "id", label: "ID/CÓDIGO INTERNO", aliases: ["id/código interno", "codigo interno", "código interno", "codigo", "código", "idproduto", "id_produto", "id"], required: true, type: "string" },
  { key: "ean", label: "EAN/CÓDIGO DE BARRAS", aliases: ["ean/código de barras", "ean", "gtin", "codigo de barras", "código de barras", "barcode"], required: true, type: "string" },
  { key: "nome", label: "DESCRIÇÃO COMERCIAL/NOME DO PRODUTO", aliases: ["descrição comercial/nome do produto", "descrição comercial", "descricao comercial", "nome do produto", "nome", "produto", "titulo"], required: true, type: "string" },
  { key: "descricao", label: "DESCRIÇÃO LONGA", aliases: ["descrição longa", "descricao longa", "descrição", "descricao"], required: false, type: "string" },
  { key: "categoriaId", label: "ID CATEGORIA", aliases: ["id categoria", "categoriaid", "id_categoria", "cat_id"], required: false, type: "string" },
  { key: "subcategoriaId", label: "ID SUBCATEGORIA", aliases: ["id subcategoria", "subcategoriaid", "id_subcategoria", "subcat_id"], required: false, type: "string" },
  { key: "fabricante", label: "FABRICANTE (MARCA)", aliases: ["fabricante (marca)", "fabricante", "marca", "laboratório", "laboratorio", "brand"], required: false, type: "string" },
  { key: "registroAnvisa", label: "MS/REGISTRO ANVISA", aliases: ["ms/registro anvisa", "registro anvisa", "ms", "registro ms", "reg_anvisa", "registroanvisa", "registro"], required: false, type: "string" },
  { key: "tarja", label: "TARJA", aliases: ["tarja", "tipo tarja", "classificação"], required: false, type: "tarja" },
  { key: "retemReceita", label: "RETÉM RECEITA", aliases: ["retém receita", "retem receita", "retemreceita", "receita", "controle especial"], required: false, type: "boolean" },
];

const TARJA_VALUES: Tarja[] = ["Sem Tarja", "Vermelha", "Vermelha Retém Receita", "Preta", "Amarela"];

// ---- Helpers ----
function normalizeHeader(header: string): string {
  return String(header || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-\.]/g, " ")
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
        // Exact match
        if (nh === normalizedAlias) {
          bestMatch = headers[i];
          bestScore = 100;
          break;
        }
        // Contains match
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
  if (s.includes("retém") || s.includes("retem") || s.includes("retém receita")) return "Vermelha Retém Receita";
  if (s.includes("vermelha")) return "Vermelha";
  return "Sem Tarja";
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const s = String(value || "").toLowerCase().trim();
  return ["sim", "s", "true", "1", "yes", "y", "verdadeiro"].includes(s);
}

function parseNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const s = String(value || "")
    .replace(/[R$\s]/g, "")
    .replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function guessCategory(nome: string): { categoriaId: string; subcategoriaId: string } {
  const nameLower = nome.toLowerCase();
  
  const rules = [
    { keywords: ["shampoo", "condicionador", "creme para pentear", "pantene", "clear", "elseve"], cat: "143", sub: "895" },
    { keywords: ["sabonete íntimo", "intimo", "íntimo"], cat: "143", sub: "902" },
    { keywords: ["sabonete", "banho", "protex", "dove", "lux"], cat: "143", sub: "898" },
    { keywords: ["desodorante", "antitranspirante", "rexona", "nivea", "axe"], cat: "143", sub: "899" },
    { keywords: ["pasta", "creme dental", "escova", "enxaguante", "fio dental", "colgate", "sorriso", "oral-b"], cat: "143", sub: "897" },
    { keywords: ["fralda", "lenço umedecido", "toalhinha", "pampers", "huggies", "turma da mônica"], cat: "144", sub: "906" },
    { keywords: ["chupeta", "mamadeira", "nuk", "lillo"], cat: "144", sub: "909" },
    { keywords: ["vitamina", "suplemento", "ômega", "omega", "calcio", "cálcio", "lavitan", "centrum"], cat: "146", sub: "918" },
    { keywords: ["whey", "creatina", "bcaa"], cat: "146", sub: "920" },
    { keywords: ["dor", "febre", "dipirona", "paracetamol", "ibuprofeno", "dorflex", "neosa", "nevrálgico", "nevralgex"], cat: "142", sub: "882" },
    { keywords: ["gripe", "resfriado", "tosse", "xarope", "benegrip", "cimegripe", "multigrip", "vick"], cat: "142", sub: "883" },
    { keywords: ["estômago", "digestão", "azia", "eno", "epocler", "omeprazol", "pantoprazol", "engov"], cat: "142", sub: "885" },
    { keywords: ["antialérgico", "alergia", "loratadina", "dexclorfeniramina", "histamin", "alegra"], cat: "142", sub: "884" },
    { keywords: ["creme", "loção", "hidratante", "cerave", "cetaphil"], cat: "145", sub: "913" },
    { keywords: ["protetor solar", "episol", "sundown", "minesol", "la roche", "vichy"], cat: "145", sub: "915" },
    { keywords: ["maquiagem", "base", "batom", "rímel", "corretivo", "vult", "tracta"], cat: "145", sub: "916" },
    { keywords: ["esmalte", "unha", "acetona", "colorama", "risque", "impala"], cat: "143", sub: "901" },
  ];

  for (const rule of rules) {
    if (rule.keywords.some(k => nameLower.includes(k))) {
      return { categoriaId: rule.cat, subcategoriaId: rule.sub };
    }
  }

  // Fallback category Se nada bater, categoriza como Medicamento -> Dor e Febre (genérico)
  return { categoriaId: "142", subcategoriaId: "882" };
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
      if (!catId && matchedSubcat.parentId) catId = matchedSubcat.parentId; // infer parent
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

  const nome = String(get("nome") || "Produto sem nome");
  const codigoRaw = String(get("id") || "");
  const id = codigoRaw || `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ean = String(get("ean") || "");
  const precoPor = parseNumber(get("precoPor"));
  const precoDe = parseNumber(get("precoDe")) || precoPor;

  const guessed = guessCategory(nome);
  const rawCat = String(get("categoriaId") || "");
  const rawSubcat = String(get("subcategoriaId") || "");
  const resolvedCat = resolveCategory(rawCat, rawSubcat);
  
  // Use resolved category by name, or if not found, use guessed category
  const categoriaId = resolvedCat?.categoriaId || guessed.categoriaId;
  const subcategoriaId = resolvedCat?.subcategoriaId || guessed.subcategoriaId;

  return {
    id,
    ean,
    sku: ean,
    foto: "",
    nome,
    descricao: String(get("descricao") || nome),
    url: nome.toLowerCase().replace(/[\s\W-]+/g, '-') + (ean ? `-${ean}` : ""),
    fabricante: String(get("fabricante") || ""),
    precoDe,
    precoPor,
    estoque: parseNumber(get("estoque")),
    registroAnvisa: String(get("registroAnvisa") || ""),
    tarja: parseTarja(get("tarja")),
    retemReceita: parseBoolean(get("retemReceita")),
    generico: parseBoolean(get("generico")),
    possuiImagem: false,
    categoriaId,
    subcategoriaId,
    internalTags: [],
    ativo: true,
    codigoInterno: codigoRaw,
  };
}

// ---- Generate Template ----
export function generateTemplate() {
  const wb = XLSX.utils.book_new();
  const headers = [
    "Código Interno", "EAN", "Nome", "Descrição", "Fabricante",
    "Preço De", "Preço Por", "Estoque", "Registro ANVISA",
    "Tarja", "Retém Receita", "Genérico", "Categoria", "Subcategoria",
  ];
  const sampleRows = [
    ["563003", "7896523207360", "NEVRALGEX 300MG + 50MG + 35MG COM 10 COMPRIMIDOS",
      "NEVRALGEX 300MG + 50MG + 35MG COM 10 COMPRIMIDOS", "CIMED",
      8.33, 4.99, 1406, "1438100510076", "Sem Tarja", "Não", "Sim", "Medicamentos", "Dor e Febre"],
    ["558600", "7896523216812", "DIAD 1.5MG COM 1 COMPRIMIDO",
      "DIAD 1.5MG COM 1 COMPRIMIDO", "CIMED",
      22.55, 19.99, 822, "1438100880027", "Sem Tarja", "Não", "Sim", "Medicamentos", "Dor e Febre"],
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Set column widths
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 16) }));

  XLSX.utils.book_append_sheet(wb, ws, "Produtos");
  XLSX.writeFile(wb, "modelo_produtos_farmacia.xlsx");
}

// ---- Export products as Excel ----
export function exportProductsAsExcel(products: Produto[]) {
  const wb = XLSX.utils.book_new();
  const headers = [
    "Código Interno", "EAN", "Nome", "Descrição", "Fabricante",
    "Preço De", "Preço Por", "Estoque", "Registro ANVISA",
    "Tarja", "Retém Receita", "Genérico", "Categoria", "Subcategoria",
  ];
  
  const getCatName = (id: string, isSubcat = false) => {
    const cats = categoriesData as any[];
    const cat = cats.find(c => String(c.id) === String(id));
    return cat ? cat.nome : id;
  };

  const rows = products.map((p) => [
    p.codigoInterno || p.id, p.ean, p.nome, p.descricao, p.fabricante,
    p.precoDe, p.precoPor, p.estoque, p.registroAnvisa,
    p.tarja, p.retemReceita ? "Sim" : "Não", p.generico ? "Sim" : "Não",
    getCatName(p.categoriaId), getCatName(p.subcategoriaId, true),
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 16) }));
  XLSX.utils.book_append_sheet(wb, ws, "Produtos");
  XLSX.writeFile(wb, "produtos_exportados.xlsx");
}

// ---- Step type ----
type Step = "upload" | "mapping" | "preview" | "processing" | "done" | "error";

// ---- Component ----
interface SpreadsheetImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (products: Produto[]) => void;
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
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      toast.error("Formato inválido. Use .xlsx, .xls ou .csv");
      return;
    }

    setFileName(file.name);

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

  const handleConfirmImport = useCallback(() => {
    setStep("processing");
    
    // Simula erro APENAS se o nome do arquivo contiver a palavra "erro" (para fins de teste do usuário)
    const simulateError = fileName.toLowerCase().includes("erro");

    setTimeout(() => {
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
          
          // Execute state update before calling parent onImport, 
          // just in case parent's onImport throws an error or blocks the thread
          setStep("done");
          toast.success(`${parsedProducts.length} produtos importados com sucesso!`);
          
          onImport(enrichedProducts);
          
          setTimeout(() => {
            handleClose();
          }, 2000);
        }
      } catch (err) {
        console.error("Erro ao importar produtos:", err);
        setImportError(err instanceof Error ? err.message : String(err));
        setStep("error");
      }
    }, 1500); 
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
            Importar Planilha de Produtos
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Selecione ou arraste um arquivo Excel (.xlsx) ou CSV para iniciar."}
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
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
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
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileInput}
              />
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-700">
                    Arraste sua planilha aqui
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ou clique para selecionar um arquivo
                  </p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">.xlsx</Badge>
                  <Badge variant="secondary" className="text-xs">.xls</Badge>
                  <Badge variant="secondary" className="text-xs">.csv</Badge>
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
                        <th className="text-left px-3 py-2 font-bold text-slate-600">Fabricante</th>
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
                          <td className="px-3 py-2 text-muted-foreground">{p.fabricante}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {p.precoDe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-emerald-700">
                            {p.precoPor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                          <td className="px-3 py-2 text-right">{p.estoque}</td>
                          <td className="px-3 py-2">
                            <Badge
                              variant={p.tarja === "Sem Tarja" ? "secondary" : "destructive"}
                              className="text-[10px]"
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
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="h-16 w-16 relative">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-lg font-bold text-slate-700 mt-4">Processando...</p>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Estamos processando os produtos. Por favor, aguarde. Isso pode levar alguns segundos.
              </p>
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

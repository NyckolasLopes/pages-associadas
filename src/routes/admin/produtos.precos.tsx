import { createFileRoute } from "@tanstack/react-router";
import { useAdminProducts } from "@/stores/products";
import { useAdmin } from "@/stores/admin";
import { useSelos } from "@/stores/selos";
import { useState, useMemo, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { catalog } from "@/services/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PriceDiscountInput } from "@/components/ui/PriceDiscountInput";
import { 
  Store, Search, DollarSign, Package, Upload, 
  FileSpreadsheet, AlertCircle, CheckCircle2, FileText, ArrowRight, Check, Calendar, Megaphone, Flame
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Produto } from "@/types";
import { isCampanhaAtiva } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/produtos/precos")({
  component: AdminProdutosPrecos,
});

function AdminProdutosPrecos() {
  const { customProducts, addOrUpdateProduct, importStoreSpreadsheet, updateStoreProductStatus, updateStoreProductDestaque } = useAdminProducts();
  const { pharmacies, currentUser, grupos } = useAdmin();
  const { selos, addSelo } = useSelos();

  const isGlobalAdmin = () => {
    if (currentUser?.proprietario) return true;
    const userGroup = grupos.find(g => g.id === currentUser?.grupoId);
    return userGroup?.permissao_total || false;
  };

  const userStores = isGlobalAdmin() 
    ? pharmacies 
    : pharmacies.filter(p => currentUser?.lojasVinculadas?.includes(p.id));

  const defaultSelection = userStores[0]?.id || "";
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>(defaultSelection);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States for "Importar meus preços" Modal (CSV & Excel)
  const [isImportMeusPrecosOpen, setIsImportMeusPrecosOpen] = useState(false);
  const [importFileName, setImportFileName] = useState("");
  const [spreadsheetHeaders, setSpreadsheetHeaders] = useState<string[]>([]);
  const [spreadsheetRows, setSpreadsheetRows] = useState<any[]>([]);
  const [selectedIdentifierCol, setSelectedIdentifierCol] = useState("");
  const [selectedPriceCol, setSelectedPriceCol] = useState("");
  const [targetPharmacyId, setTargetPharmacyId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const meusPrecosFileInputRef = useRef<HTMLInputElement>(null);

  // States for PMC Import
  const [isImportPmcOpen, setIsImportPmcOpen] = useState(false);
  const [importPmcFileName, setImportPmcFileName] = useState("");
  const [pmcHeaders, setPmcHeaders] = useState<string[]>([]);
  const [pmcRows, setPmcRows] = useState<any[]>([]);
  const [selectedPmcIdentifierCol, setSelectedPmcIdentifierCol] = useState("");
  const [selectedPmcPriceCol, setSelectedPmcPriceCol] = useState("");
  const pmcFileInputRef = useRef<HTMLInputElement>(null);

  // States for Encarte Import
  const [isImportEncarteOpen, setIsImportEncarteOpen] = useState(false);
  const [importEncarteFileName, setImportEncarteFileName] = useState("");
  const [encarteHeaders, setEncarteHeaders] = useState<string[]>([]);
  const [encarteRows, setEncarteRows] = useState<any[]>([]);
  const [selectedEncarteIdentifierCol, setSelectedEncarteIdentifierCol] = useState("");
  const [selectedEncartePriceCol, setSelectedEncartePriceCol] = useState("");
  const encarteFileInputRef = useRef<HTMLInputElement>(null);
  
  const [importManualDates, setImportManualDates] = useState(false);
  const [importStartDate, setImportStartDate] = useState("");
  const [importEndDate, setImportEndDate] = useState("");
  const [pendingImportData, setPendingImportData] = useState<any[]>([]);

  // State for edited prices and campaigns
  const [editingValues, setEditingValues] = useState<Record<string, { precoDe?: string, precoPor?: string, campanhaInicio?: string, campanhaFim?: string }>>({});

  // States for Internal Campaign Modal
  const [isCampanhaModalOpen, setIsCampanhaModalOpen] = useState(false);
  const [campanhaStep, setCampanhaStep] = useState(1);
  const [campanhaSearch, setCampanhaSearch] = useState("");
  const [selectedCampanhaProducts, setSelectedCampanhaProducts] = useState<string[]>([]);
  const [campanhaPrices, setCampanhaPrices] = useState<Record<string, number>>({});
  const [campanhaInicioModal, setCampanhaInicioModal] = useState("");
  const [campanhaFimModal, setCampanhaFimModal] = useState("");
  
  const currentMonthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());

  const [localProducts, setLocalProducts] = useState<Produto[]>([]);
  const [campanhaLocalProducts, setCampanhaLocalProducts] = useState<Produto[]>([]);
  
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { results } = await catalog.adminSearchProducts({
          search,
          page: 0,
          pageSize: 50,
          listFilter: "all",
          lojaId: selectedPharmacyId === "global" ? undefined : selectedPharmacyId
        });
        if (active) setLocalProducts(results);
      } catch (e) {
        console.error(e);
      }
    }
    const t = setTimeout(load, 400);
    return () => { active = false; clearTimeout(t); };
  }, [search, selectedPharmacyId]);

  useEffect(() => {
    let active = true;
    async function searchCampanha() {
      try {
        const { results } = await catalog.adminSearchProducts({
          search: campanhaSearch || "", // Fetch default list if search is empty
          page: 0,
          pageSize: 50,
          listFilter: "all",
          lojaId: selectedPharmacyId === "global" ? undefined : selectedPharmacyId
        });
        if (active) setCampanhaLocalProducts(results);
      } catch (e) {
        console.error(e);
      }
    }
    const t = setTimeout(searchCampanha, 400);
    return () => { active = false; clearTimeout(t); };
  }, [campanhaSearch, selectedPharmacyId]);


  const allVisibleProducts = useMemo(() => {
    const map = new Map<string, Produto>();
    localProducts.forEach(p => map.set(p.id, p));
    campanhaLocalProducts.forEach(p => map.set(p.id, p));
    return Array.from(map.values());
  }, [localProducts, campanhaLocalProducts]);

  const handleMeusPrecosFileUpload = (file: File) => {
    if (!file) return;
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (!rawJson || rawJson.length === 0) {
          toast.error("A planilha selecionada está vazia.");
          return;
        }

        const headers = Object.keys(rawJson[0] || {});
        setSpreadsheetHeaders(headers);
        setSpreadsheetRows(rawJson);

        // Auto detect identifier column
        const idCol = headers.find(h => {
          const lower = h.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
          return ["ean", "codigodebarras", "codbarras", "codigo", "cod", "sku", "id", "nome", "produto"].includes(lower);
        }) || headers[0] || "";
        setSelectedIdentifierCol(idCol);

        // Auto detect price column (somente o campo preço)
        const priceCol = headers.find(h => {
          const lower = h.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
          return [
            "preco", "preço", "precofinal", "preçofinal", "precopor", "preçopor",
            "valor", "valorfinal", "precovenda", "precodevenda", "precoloja", "novopreco", "precovarejo"
          ].includes(lower);
        }) || headers.find(h => h.toLowerCase().includes("pre") || h.toLowerCase().includes("val")) || headers[1] || "";
        setSelectedPriceCol(priceCol);

        toast.success(`Planilha "${file.name}" carregada com ${rawJson.length} itens!`);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao ler o arquivo. Certifique-se de que é um formato válido (.xlsx, .xls ou .csv).");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handlePmcFileUpload = (file: File) => {
    if (!file) return;
    setImportPmcFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (!rawJson || rawJson.length === 0) {
          toast.error("A planilha selecionada está vazia.");
          return;
        }

        setPmcRows(rawJson);
        const headers = Object.keys(rawJson[0] || {});
        setPmcHeaders(headers);

        const lowerHeaders = headers.map(h => h.toLowerCase());
        const idCol = headers[lowerHeaders.findIndex(h => h.includes("ean") || h.includes("codigo") || h.includes("id"))];
        const priceCol = headers[lowerHeaders.findIndex(h => h.includes("preco") || h.includes("preço") || h.includes("pmc") || h.includes("liquido") || h.includes("líquido"))];

        if (idCol) setSelectedPmcIdentifierCol(idCol);
        if (priceCol) setSelectedPmcPriceCol(priceCol);

        toast.success(`Planilha PMC "${file.name}" carregada com ${rawJson.length} itens!`);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao ler o arquivo. Certifique-se de que é um formato válido (.xlsx, .xls ou .csv).");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImportPmc = () => {
    if (!selectedPmcIdentifierCol || !selectedPmcPriceCol) {
      toast.error("Selecione as colunas de EAN e de Preço Líquido.");
      return;
    }

    const pmcMap = new Map<string, number>();
    let invalidCount = 0;

    pmcRows.forEach(row => {
      const idRaw = String(row[selectedPmcIdentifierCol] ?? "").trim();
      const priceRaw = row[selectedPmcPriceCol];

      if (!idRaw || priceRaw === undefined || priceRaw === null || priceRaw === "") {
        invalidCount++;
        return;
      }

      let priceNum = 0;
      if (typeof priceRaw === "number") {
        priceNum = priceRaw;
      } else {
        const cleanStr = String(priceRaw)
          .replace("R$", "")
          .replace(/\s/g, "")
          .replace(/\./g, "")
          .replace(",", ".");
        priceNum = parseFloat(cleanStr);
      }

      if (isNaN(priceNum) || priceNum <= 0) {
        invalidCount++;
        return;
      }

      if (/^\d{7,14}$/.test(idRaw)) {
        pmcMap.set(idRaw, priceNum);
      }
    });

    if (pmcMap.size === 0) {
      toast.error("Nenhum EAN/Preço válido foi identificado.");
      return;
    }

    let updatedCount = 0;

    allVisibleProducts.forEach(p => {
      const isMedicamento = p.categoriaId === "142" || p.categoriasAdicionais?.includes("142");
      if (isMedicamento && p.ean) {
        const pmcPrice = pmcMap.get(p.ean);
        if (pmcPrice !== undefined) {
          const newProduct = { ...p, precoDe: pmcPrice, precoPor: pmcPrice };
          addOrUpdateProduct(newProduct);
          updatedCount++;
        }
      }
    });

    toast.success(`🎉 ${updatedCount} medicamentos atualizados com base na tabela PMC!`);
    setIsImportPmcOpen(false);
    setPmcRows([]);
    setImportPmcFileName("");
  };

  const handleConfirmImportMeusPrecos = async () => {
    const targetStore = targetPharmacyId || (selectedPharmacyId !== "global" ? selectedPharmacyId : (userStores[0]?.id || pharmacies[0]?.id));
    if (!targetStore || targetStore === "global") {
      toast.error("Selecione uma loja específica de destino para aplicar os preços.");
      return;
    }

    if (!selectedIdentifierCol || !selectedPriceCol) {
      toast.error("Selecione as colunas de identificador e de preço.");
      return;
    }

    const itemsToImport: any[] = [];
    let invalidCount = 0;

    spreadsheetRows.forEach(row => {
      const idRaw = String(row[selectedIdentifierCol] ?? "").trim();
      const priceRaw = row[selectedPriceCol];

      if (!idRaw || priceRaw === undefined || priceRaw === null || priceRaw === "") {
        invalidCount++;
        return;
      }

      let priceNum = 0;
      if (typeof priceRaw === "number") {
        priceNum = priceRaw;
      } else {
        const cleanStr = String(priceRaw)
          .replace("R$", "")
          .replace(/\s/g, "")
          .replace(/\./g, "")
          .replace(",", ".");
        priceNum = parseFloat(cleanStr);
      }

      if (isNaN(priceNum) || priceNum <= 0) {
        invalidCount++;
        return;
      }

      const item: any = {
        precoDe: priceNum,
        precoPor: priceNum,
        ativo: true
      };

      if (/^\d{7,14}$/.test(idRaw)) {
        item.ean = idRaw;
      } else {
        item.sku = idRaw;
        item.id = idRaw;
        item.nome = idRaw;
      }

      itemsToImport.push(item);
    });

    if (itemsToImport.length === 0) {
      toast.error("Nenhum preço válido foi identificado na coluna selecionada.");
      return;
    }

    const result = await importStoreSpreadsheet(targetStore, itemsToImport);
    const storeObj = pharmacies.find(p => p.id === targetStore);
    const storeName = storeObj?.nome || targetStore;

    toast.success(`🎉 ${result.updated} preços de produtos atualizados com sucesso para "${storeName}"!`);
    setIsImportMeusPrecosOpen(false);
    setSpreadsheetRows([]);
    setSpreadsheetHeaders([]);
    setImportFileName("");
  };

  const filtered = useMemo(() => {
    return localProducts;
  }, [localProducts]);

  const handleEditChange = (productId: string, field: "precoDe" | "precoPor" | "campanhaInicio" | "campanhaFim", value: string) => {
    setEditingValues(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const handleSavePrice = (produto: Produto) => {
    if (!selectedPharmacyId) {
      toast.error("Selecione uma loja primeiro.");
      return;
    }

    const edits = editingValues[produto.id];
    if (!edits) return;

    const parsedPor = parseFloat(edits.precoPor?.replace(",", ".") || "0");

    if (isNaN(parsedPor) || parsedPor <= 0) {
      toast.error("O Preço Promocional (Por) deve ser um número válido e maior que 0.");
      return;
    }

    const updatedProduct = { ...produto };

    if (selectedPharmacyId === "global") {
      // Salvar Campanha Global
      if (!edits.campanhaInicio || !edits.campanhaFim) {
        toast.error("A data de início e fim da campanha são obrigatórias.");
        return;
      }
      updatedProduct.emCampanha = true;
      updatedProduct.precoCampanha = parsedPor;
      updatedProduct.campanhaInicio = edits.campanhaInicio;
      updatedProduct.campanhaFim = edits.campanhaFim;
    } else {
      // Salvar Preço de Loja Local
      const parsedDe = parseFloat(edits.precoDe?.replace(",", ".") || "0");
      if (isCampanhaAtiva(produto)) {
        toast.error("ERRO 403 (Forbidden): Você não pode alterar o preço de um produto em Campanha Global vigente.");
        return;
      }

      // Validação de PMC para Medicamentos: apenas não pode ser superior ao teto PMC da rede
      const isMedicamento = produto.categoriaId === "142" || produto.categoriasAdicionais?.includes("142");
      const globalPor = produto.precoPor || produto.precoDe || 0;
      const globalDe = produto.precoDe || produto.precoPor || 0;
      const pmcMax = Math.max(globalPor, globalDe);

      if (isMedicamento && pmcMax > 0 && parsedPor > pmcMax) {
        toast.error(`Para medicamentos, o preço (${formatCurrency(parsedPor)}) não pode exceder o teto PMC informado pela rede (${formatCurrency(pmcMax)}). Você pode praticar qualquer valor com desconto abaixo desse limite.`);
        return;
      }

      if (!updatedProduct.precosPorLoja) {
        updatedProduct.precosPorLoja = {};
      }

      const currentAtivo = updatedProduct.precosPorLoja[selectedPharmacyId]?.ativo ?? true;

      updatedProduct.precosPorLoja[selectedPharmacyId] = {
        precoDe: parsedDe > 0 ? parsedDe : parsedPor,
        precoPor: parsedPor,
        ativo: currentAtivo
      };
    }

    addOrUpdateProduct(updatedProduct, selectedPharmacyId === "global" ? null : selectedPharmacyId);
    
    // Limpa a edição
    setEditingValues(prev => {
      const next = { ...prev };
      delete next[produto.id];
      return next;
    });

    toast.success(selectedPharmacyId === "global" ? "Campanha global ativada com sucesso!" : `Preço do produto atualizado para a loja.`);
  };

  const handleToggleAtivo = async (produto: Produto, checked: boolean) => {
    if (!selectedPharmacyId || selectedPharmacyId === "global") {
      toast.error("Selecione uma loja específica primeiro.");
      return;
    }

    await updateStoreProductStatus(selectedPharmacyId, produto.id, checked);
    toast.success(checked ? "Produto ativado para esta filial." : "Produto indisponível nesta filial.");
  };

  const handleToggleDestaque = async (produto: Produto, checked: boolean) => {
    if (!selectedPharmacyId || selectedPharmacyId === "global") {
      toast.error("Selecione uma loja específica primeiro.");
      return;
    }

    await updateStoreProductDestaque(selectedPharmacyId, produto.id, checked);
    toast.success(checked ? "Produto destacado na sua vitrine." : "Destaque removido da sua vitrine.");
  };

  const handleEncarteFileUpload = (file: File) => {
    if (!file) return;
    setImportEncarteFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length > 0) {
          const rawHeaders = data[0] as string[];
          setEncarteHeaders(rawHeaders.map((h, i) => h ? String(h) : `Coluna ${i + 1}`));
          setEncarteRows(data.slice(1));
          setIsImportEncarteOpen(true);
        }

        const rawJson = XLSX.utils.sheet_to_json(ws);
        const headerNames = Object.keys(rawJson[0] || {});
        let idCol = "";
        let priceCol = "";

        const commonIdNames = ["ean", "codigo_barras", "código de barras", "cod", "código"];
        const commonPriceNames = ["preco", "preço", "valor", "preço_encarte", "preco_promocional"];

        headerNames.forEach(h => {
          const hl = h.toLowerCase();
          if (!idCol && commonIdNames.some(c => hl.includes(c))) idCol = h;
          if (!priceCol && commonPriceNames.some(c => hl.includes(c))) priceCol = h;
        });

        if (idCol) setSelectedEncarteIdentifierCol(idCol);
        if (priceCol) setSelectedEncartePriceCol(priceCol);

        toast.success(`Planilha Encarte "${file.name}" carregada com ${rawJson.length} itens!`);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao ler o arquivo. Certifique-se de que é um formato válido (.xlsx, .xls ou .csv).");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImportEncarte = () => {
    if (!selectedEncarteIdentifierCol || !selectedEncartePriceCol) {
      toast.error("Selecione as colunas de EAN e de Preço Encarte.");
      return;
    }

    const encarteMap = new Map<string, number>();
    let invalidCount = 0;

    encarteRows.forEach(row => {
      const idRaw = String(row[selectedEncarteIdentifierCol] ?? "").trim();
      const priceRaw = row[selectedEncartePriceCol];

      if (!idRaw || priceRaw === undefined || priceRaw === null || priceRaw === "") {
        invalidCount++;
        return;
      }

      let priceNum = 0;
      if (typeof priceRaw === "number") {
        priceNum = priceRaw;
      } else {
        const cleanStr = String(priceRaw)
          .replace("R$", "")
          .replace(/\s/g, "")
          .replace(/\./g, "")
          .replace(",", ".");
        priceNum = parseFloat(cleanStr);
      }

      if (isNaN(priceNum) || priceNum <= 0) {
        invalidCount++;
        return;
      }

      if (/^\d{7,14}$/.test(idRaw)) {
        encarteMap.set(idRaw, priceNum);
      }
    });

    if (encarteMap.size === 0) {
      toast.error("Nenhum EAN/Preço válido foi identificado na planilha Encarte.");
      return;
    }

    let updatedCount = 0;

    allVisibleProducts.forEach(p => {
      if (p.ean) {
        const encartePrice = encarteMap.get(p.ean);
        if (encartePrice !== undefined) {
          const newProduct = { ...p, precoEncarte: encartePrice };
          addOrUpdateProduct(newProduct, null);
          updatedCount++;
        }
      }
    });

    toast.success(`Importação Encarte concluída! ${updatedCount} produtos atualizados com preço encarte.`);
    setIsImportEncarteOpen(false);
    setEncarteRows([]);
    setEncarteHeaders([]);
    setImportEncarteFileName("");
  };



  // Handlers for Internal Campaign
  const handleCampanhaToggleProduct = (productId: string) => {
    setSelectedCampanhaProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSaveCampanha = (isDefinitive: boolean = false) => {
    if (!isDefinitive && (!campanhaInicioModal || !campanhaFimModal)) {
      toast.error("Por favor, preencha as datas de início e fim da campanha.");
      return;
    }

    let updatedCount = 0;
    
    selectedCampanhaProducts.forEach(productId => {
      const product = allVisibleProducts.find(p => p.id === productId);
      const promoPrice = campanhaPrices[productId];
      
      if (product && promoPrice !== undefined && promoPrice < product.precoPor) {
        const updatedProduct = { ...product };
        if (!updatedProduct.precosPorLoja) {
          updatedProduct.precosPorLoja = {};
        }

        updatedProduct.precosPorLoja[selectedPharmacyId] = {
          ...updatedProduct.precosPorLoja[selectedPharmacyId],
          precoDe: product.precoPor,
          precoPor: promoPrice,
          ativo: true,
          ...(isDefinitive ? { campanhaInicio: "", campanhaFim: "" } : { campanhaInicio: campanhaInicioModal, campanhaFim: campanhaFimModal })
        };

        addOrUpdateProduct(updatedProduct, null);
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      toast.success(`Campanha interna salva! ${updatedCount} produtos atualizados.`);
      setIsCampanhaModalOpen(false);
      setSelectedCampanhaProducts([]);
      setCampanhaPrices({});
    } else {
      toast.error("Nenhum produto foi atualizado. Verifique se os preços são menores que o preço base.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            {isGlobalAdmin() ? "Preços por Loja" : "Meus Preços"}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {isGlobalAdmin() 
              ? "Configure preços diferentes para cada unidade física ou importe planilhas de preços."
              : "Defina seus preços exclusivos para a sua loja ou importe sua planilha de preços."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isGlobalAdmin() && (
            <Button 
              onClick={() => {
                setTargetPharmacyId(selectedPharmacyId !== "global" ? selectedPharmacyId : (userStores[0]?.id || ""));
                setIsImportMeusPrecosOpen(true);
                setSpreadsheetRows([]);
                setSpreadsheetHeaders([]);
                setImportFileName("");
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-4 rounded-lg shadow-sm flex items-center gap-2"
            >
              <Upload className="h-4 w-4" /> Importar meus preços
            </Button>
          )}

          {isGlobalAdmin() && (
            <>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 h-10">
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Planilha Encarte
              </Button>
              <Button variant="outline" onClick={() => pmcFileInputRef.current?.click()} className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800 h-10">
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Planilha PMC
              </Button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (evt) => {
                  try {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: "binary" });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    setPendingImportData(data);
                    setImportManualDates(false);
                    setImportStartDate("");
                    setImportEndDate("");
                    setIsImportEncarteOpen(true);
                  } catch (err) {
                    console.error(err);
                    toast.error("Erro ao processar a planilha.");
                  }
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                };
                reader.readAsBinaryString(file);
              }} />
              <input type="file" ref={pmcFileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePmcFileUpload(file);
                if (pmcFileInputRef.current) {
                  pmcFileInputRef.current.value = "";
                }
              }} />
            </>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Selecione a Loja</label>
              <div className="flex items-center gap-2">
                <Select value={selectedPharmacyId} onValueChange={setSelectedPharmacyId} disabled={!isGlobalAdmin() && userStores.length <= 1}>
                  <SelectTrigger className="w-full h-11 bg-slate-50">
                    <Store className="h-4 w-4 text-emerald-600 mr-2" />
                    <SelectValue placeholder="Selecione uma farmácia..." />
                  </SelectTrigger>
                  <SelectContent>
                    {userStores.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome} - {p.cidade}/{p.uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isGlobalAdmin() && (
                  <Button 
                    onClick={() => {
                      setIsCampanhaModalOpen(true);
                      setCampanhaStep(1);
                      setCampanhaSearch("");
                      setSelectedCampanhaProducts([]);
                      setCampanhaPrices({});
                    }}
                    className="h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 font-black transition-all whitespace-nowrap px-6 border border-orange-400 animate-pulse-subtle"
                  >
                    <Flame className="h-5 w-5 mr-2 animate-pulse" />
                    CRIAR CAMPANHA INTERNA
                  </Button>
                )}
              </div>
            </div>

          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Buscar Produto</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Busque por nome ou EAN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 bg-slate-50"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Preço Base (Global)</th>
                
                {selectedPharmacyId === "global" ? (
                  <th className="px-4 py-3 bg-orange-50 text-orange-800 border-l border-orange-100 text-center" colSpan={2}>
                    Configuração de Campanha
                  </th>
                ) : (
                  <>
                    <th className="px-4 py-3 bg-emerald-50 text-emerald-800 border-l border-emerald-100">
                      {isGlobalAdmin() ? `Preço Específico (${pharmacies.find(p => p.id === selectedPharmacyId)?.nome || "Loja"})` : "Meus Preços"}
                    </th>
                    <th className="px-4 py-3 bg-emerald-50 text-emerald-800 text-center">Disponível na Loja</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((produto) => {
                const globalDe = produto.precoDe || produto.precoPor;
                const globalPor = produto.precoPor;
                
                const isGlobal = selectedPharmacyId === "global";
                const lojaPreco = isGlobal ? null : produto.precosPorLoja?.[selectedPharmacyId];
                const campanhaAtiva = isCampanhaAtiva(produto);
                
                const edits = editingValues[produto.id];
                
                // Valores de exibição Local vs Global
                const displayDe = isGlobal ? "" : (edits !== undefined ? (edits.precoDe || "") : (lojaPreco?.precoDe?.toString() || globalDe.toString()));
                const displayPor = isGlobal ? (edits !== undefined ? edits.precoPor : produto.precoCampanha?.toString() || "") : (campanhaAtiva ? produto.precoCampanha?.toString() : (edits !== undefined ? edits.precoPor : (lojaPreco?.precoPor?.toString() || "")));
                const displayInicio = (edits?.campanhaInicio ?? produto.campanhaInicio ?? "").substring(0, 10);
                const displayFim = (edits?.campanhaFim ?? produto.campanhaFim ?? "").substring(0, 10);

                const isMedicamento = produto.categoriaId === "142" || produto.categoriasAdicionais?.includes("142");
                const hasCustomPrice = !!lojaPreco;
                const isCampanhaInterna = !isGlobal && hasCustomPrice && !!lojaPreco.campanhaInicio && !!lojaPreco.campanhaFim && !isMedicamento;
                const disponivel = lojaPreco?.ativo ?? true;


                return (
                  <tr key={produto.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-4 w-1/2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md border bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {produto.possuiImagem ? (
                            <img src={`https://vtx-ag-p.s3.us-east-1.amazonaws.com/10940/${produto.ean || produto.id}.jpg`} alt="" className="w-full h-full object-contain p-1" />
                          ) : (
                            <Package className="h-4 w-4 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 line-clamp-1 flex items-center gap-2" title={produto.nome}>
                            {produto.nome}
                            {campanhaAtiva && (
                              <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-[10px] uppercase tracking-wider px-1.5 py-0">Em Campanha</Badge>
                            )}
                            {isCampanhaInterna && !campanhaAtiva && !isGlobalAdmin() && (
                              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-[10px] uppercase tracking-wider px-1.5 py-0 text-white">Em Campanha Interna</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">EAN: {produto.ean || 'N/A'}</div>
                          {campanhaAtiva && <div className="text-[10px] font-bold text-orange-600 mt-1 uppercase">Aplicado em todas as lojas</div>}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 text-slate-600">
                      <div className="flex flex-col">
                        {globalDe > globalPor && (
                          <span className="text-xs line-through text-slate-400 font-medium">
                            {formatCurrency(globalDe)}
                          </span>
                        )}
                        <span className="font-bold text-slate-800 text-base">
                          {formatCurrency(globalPor)}
                        </span>
                      </div>
                    </td>

                    {isGlobal ? (
                      <td className="px-4 py-4 bg-orange-50/30 border-l border-orange-100" colSpan={2}>
                        <div className="flex flex-col xl:flex-row items-start xl:items-end gap-3">
                          <div className="flex-1 w-full">
                            <label className="text-[10px] font-bold text-orange-700 uppercase mb-1 block">Preço Promocional (R$)</label>
                            <Input
                              placeholder="Ex: 19.90"
                              className="h-8 text-xs bg-white font-bold"
                              value={displayPor}
                              onChange={(e) => handleEditChange(produto.id, "precoPor", e.target.value)}
                            />
                          </div>
                          <div className="flex-1 w-full">
                            <label className="text-[10px] font-bold text-orange-700 uppercase mb-1 block">Início da Campanha</label>
                            <Input
                              type="date"
                              className="h-8 text-[11px] bg-white"
                              value={displayInicio}
                              onChange={(e) => handleEditChange(produto.id, "campanhaInicio", e.target.value)}
                            />
                          </div>
                          <div className="flex-1 w-full">
                            <label className="text-[10px] font-bold text-orange-700 uppercase mb-1 block">Fim da Campanha</label>
                            <Input
                              type="date"
                              className="h-8 text-[11px] bg-white"
                              value={displayFim}
                              onChange={(e) => handleEditChange(produto.id, "campanhaFim", e.target.value)}
                            />
                          </div>
                          
                          <div className="flex flex-col gap-1 w-full xl:w-auto">
                            {(edits !== undefined && (edits.precoPor || edits.campanhaInicio || edits.campanhaFim)) ? (
                              <Button size="sm" onClick={() => handleSavePrice(produto)} className="h-8 px-3 bg-orange-600 hover:bg-orange-700 text-xs font-bold w-full xl:w-auto">
                                Salvar
                              </Button>
                            ) : null}
                            
                            {produto.emCampanha && edits === undefined && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                  const newProduct = {...produto};
                                  newProduct.emCampanha = false;
                                  newProduct.campanhaInicio = "";
                                  newProduct.campanhaFim = "";
                                  newProduct.precoCampanha = undefined;
                                  addOrUpdateProduct(newProduct);
                                  toast.success("Campanha encerrada e removida com sucesso!");
                                }} 
                                className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 w-full xl:w-auto"
                              >
                                Encerrar Campanha
                              </Button>
                            )}
                          </div>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-4 bg-emerald-50/30 border-l border-emerald-100">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-[300px]">
                              {isCampanhaInterna && lojaPreco?.campanhaInicio && lojaPreco?.campanhaFim && edits === undefined && !campanhaAtiva ? (
                                <div className="bg-orange-50 border border-orange-200 rounded p-3 text-xs w-full max-w-sm">
                                  <div className="font-bold text-orange-800 mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Período da Oferta</div>
                                  <div className="text-slate-700 mb-2">{lojaPreco.campanhaInicio.split('-').reverse().join('/')} até {lojaPreco.campanhaFim.split('-').reverse().join('/')}</div>
                                  <div className="flex justify-between items-center mb-2">
                                    <div className="text-slate-500">De: <span className="line-through">{formatCurrency(lojaPreco.precoDe)}</span></div>
                                    <div className="font-bold text-emerald-600">Por: {formatCurrency(lojaPreco.precoPor)}</div>
                                  </div>
                                  <div className="text-[10px] text-orange-700 italic">Após isso vai retornar automaticamente para o preço original.</div>
                                </div>
                              ) : (
                                <>
                                  <PriceDiscountInput
                                    basePrice={globalPor}
                                    initialPromoPrice={parseFloat(displayPor || "0") || undefined}
                                    onChange={(val) => handleEditChange(produto.id, "precoPor", val.toString())}
                                    disabled={campanhaAtiva}
                                    hideDiscounts={false}
                                  />
                                  {isMedicamento && (
                                    <div className="flex items-center gap-1.5 mt-2">
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px] font-bold border-blue-200">
                                        Teto PMC: {formatCurrency(Math.max(globalPor, globalDe))}
                                      </Badge>
                                      <span className="text-[10px] text-slate-400 italic">(Permitido apenas abaixo do teto)</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-1 mt-4">
                              {edits !== undefined && !campanhaAtiva ? (
                                <Button size="sm" onClick={() => handleSavePrice(produto)} className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold">
                                  Salvar
                                </Button>
                              ) : hasCustomPrice && !campanhaAtiva ? (
                                <Button size="sm" variant="outline" onClick={() => handleEditChange(produto.id, "precoDe", lojaPreco.precoDe.toString())} className="h-8 px-3 text-xs text-emerald-700 border-emerald-200">
                                  Editar
                                </Button>
                              ) : null}
                              
                              {hasCustomPrice && edits === undefined && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => {
                                    const newProduct = {...produto};
                                    delete newProduct.precosPorLoja![selectedPharmacyId];
                                    addOrUpdateProduct(newProduct);
                                    toast.success("Preço customizado removido. Retornando ao global.");
                                  }} 
                                  className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  Remover
                                </Button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center border-l border-slate-100 align-middle">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Switch 
                              checked={disponivel}
                              onCheckedChange={(checked) => handleToggleAtivo(produto, checked)}
                              className="data-[state=checked]:bg-emerald-500"
                            />
                            <span className={`text-[10px] font-bold uppercase ${disponivel ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {disponivel ? 'Disponível' : 'Indisponível'}
                            </span>
                          </div>
                        </td>
                      </>

                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              Nenhum produto encontrado na busca.
            </div>
          )}
        </div>
      </div>
      <Dialog open={isImportEncarteOpen} onOpenChange={setIsImportEncarteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Encarte</DialogTitle>
            <DialogDescription className="text-slate-600">
              Você está importando um encarte para a loja <strong className="text-emerald-700">{pharmacies.find(p => p.id === selectedPharmacyId)?.nome || "Selecionada"}</strong>.<br/><br/>
              As promoções do encarte devem ser aplicadas no mês de {currentMonthName}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex flex-col gap-3">
              <Button 
                variant={!importManualDates ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setImportManualDates(false)}
              >
                Sim
              </Button>
              <Button 
                variant={importManualDates ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setImportManualDates(true)}
              >
                Não
              </Button>
            </div>

            {importManualDates && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="col-span-2 space-y-1.5 mb-2 text-sm text-slate-600 text-center font-medium">
                  Em qual periodo voce gostaria de aplicar a campanha do encarte?
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Data de Início</label>
                  <Input type="date" value={importStartDate} onChange={e => setImportStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Data de Fim</label>
                  <Input type="date" value={importEndDate} onChange={e => setImportEndDate(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportEncarteOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmImportEncarte}>Confirmar Importação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Internal Campaign Modal */}
      <Dialog open={isCampanhaModalOpen} onOpenChange={setIsCampanhaModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Criar Campanha Interna</DialogTitle>
            <DialogDescription>
              {campanhaStep === 1 ? "Selecione os produtos que farão parte da sua campanha." : "Defina os preços promocionais para os produtos selecionados."}
            </DialogDescription>
          </DialogHeader>

          {campanhaStep === 1 && (
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar produtos..."
                  value={campanhaSearch}
                  onChange={(e) => setCampanhaSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="border rounded-md max-h-[400px] overflow-y-auto">
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {campanhaLocalProducts.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                      <Checkbox 
                        id={`campanha-prod-${p.id}`}
                        checked={selectedCampanhaProducts.includes(p.id)}
                        onCheckedChange={() => handleCampanhaToggleProduct(p.id)}
                      />
                      <label htmlFor={`campanha-prod-${p.id}`} className="flex-1 cursor-pointer flex justify-between items-center text-sm font-medium leading-none">
                        <span>{p.nome}</span>
                        <span className="text-slate-500">R$ {p.precoPor.toFixed(2)}</span>
                      </label>
                    </div>
                  ))}
                  {campanhaLocalProducts.length === 0 && (
                    <div className="text-center py-8 text-sm text-slate-500">Nenhum produto encontrado.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {campanhaStep === 2 && (
            <div className="space-y-6 py-4 max-h-[500px] overflow-y-auto pr-2">
              <div className="bg-orange-50 p-4 rounded-lg flex flex-col sm:flex-row gap-4 border border-orange-200">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-bold text-orange-800 flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Início da Campanha (Obrigatório)</label>
                  <Input 
                    type="date" 
                    value={campanhaInicioModal} 
                    onChange={e => setCampanhaInicioModal(e.target.value)} 
                    className="bg-white border-orange-200 focus-visible:ring-orange-500"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-bold text-orange-800 flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Fim da Campanha (Obrigatório)</label>
                  <Input 
                    type="date" 
                    value={campanhaFimModal} 
                    onChange={e => setCampanhaFimModal(e.target.value)} 
                    className="bg-white border-orange-200 focus-visible:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
              {selectedCampanhaProducts.map(productId => {
                const product = allVisibleProducts.find(p => p.id === productId);
                if (!product) return null;
                
                const promoPrice = campanhaPrices[productId];
                const isInvalid = promoPrice !== undefined && promoPrice >= product.precoPor;

                return (
                  <div key={productId} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800 text-sm">{product.nome}</h4>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Preço Base</span>
                        <span className="font-bold text-slate-700">R$ {product.precoPor.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <PriceDiscountInput
                      basePrice={product.precoPor}
                      initialPromoPrice={promoPrice}
                      onChange={(val) => setCampanhaPrices(prev => ({ ...prev, [productId]: val }))}
                    />

                    {isInvalid && (
                      <p className="text-red-500 text-xs font-semibold">O preço promocional deve ser menor que o preço base.</p>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between w-full sm:justify-between items-center">
            {campanhaStep === 1 ? (
              <>
                <span className="text-sm text-slate-500">{selectedCampanhaProducts.length} produtos selecionados</span>
                <div className="space-x-2 flex">
                  <Button variant="outline" onClick={() => setIsCampanhaModalOpen(false)}>Cancelar</Button>
                  <Button 
                    onClick={() => setCampanhaStep(2)} 
                    disabled={selectedCampanhaProducts.length === 0}
                  >
                    Continuar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setCampanhaStep(1)}>Voltar</Button>
                <div className="space-x-2 flex">
                  <Button variant="outline" onClick={() => setIsCampanhaModalOpen(false)}>Cancelar</Button>
                  <Button 
                    onClick={() => handleSaveCampanha()} 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={
                      selectedCampanhaProducts.some(id => {
                        const product = allVisibleProducts.find(p => p.id === id);
                        const price = campanhaPrices[id];
                        return !product || price === undefined || price >= product.precoPor;
                      })
                    }
                  >
                    Salvar Campanha
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- MODAL: IMPORTAR MEUS PREÇOS (EXCEL / CSV) ---- */}
      <Dialog open={isImportMeusPrecosOpen} onOpenChange={setIsImportMeusPrecosOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-600" />
              Importar Meus Preços
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Anexe sua planilha em formato <strong>Excel (.xlsx, .xls)</strong> ou <strong>CSV (.csv)</strong>. Apenas o campo de preço da planilha será importado para os produtos da sua loja.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
            {/* Seleção da Loja de Destino */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block">Loja de Destino</label>
                <p className="text-[11px] text-slate-500">Os preços da planilha serão aplicados a esta unidade</p>
              </div>
              <Select 
                value={targetPharmacyId || (selectedPharmacyId !== "global" ? selectedPharmacyId : (userStores[0]?.id || ""))} 
                onValueChange={setTargetPharmacyId}
              >
                <SelectTrigger className="w-full sm:w-64 h-9 bg-white text-xs font-semibold">
                  <Store className="h-3.5 w-3.5 text-emerald-600 mr-1.5 shrink-0" />
                  <SelectValue placeholder="Selecione a loja..." />
                </SelectTrigger>
                <SelectContent>
                  {userStores.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.nome} ({p.cidade}/{p.uf})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Input Oculto de Arquivo */}
            <input 
              type="file" 
              ref={meusPrecosFileInputRef} 
              className="hidden" 
              accept=".xlsx, .xls, .csv" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleMeusPrecosFileUpload(file);
                if (meusPrecosFileInputRef.current) meusPrecosFileInputRef.current.value = "";
              }} 
            />

            {/* Zona de Upload / Drag and Drop */}
            {!importFileName ? (
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleMeusPrecosFileUpload(file);
                }}
                onClick={() => meusPrecosFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging 
                    ? "border-emerald-500 bg-emerald-50/50" 
                    : "border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <div className="p-4 rounded-full bg-emerald-100 text-emerald-700">
                  <FileSpreadsheet className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Clique para selecionar ou arraste sua planilha aqui
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Formatos aceitos: <strong>.XLSX, .XLS ou .CSV</strong>
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full mt-1">
                  <Check className="h-3.5 w-3.5" />
                  Importação exclusiva da coluna de Preço
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cartão do Arquivo Carregado */}
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate" title={importFileName}>
                        {importFileName}
                      </p>
                      <p className="text-xs text-emerald-700 font-medium">
                        {spreadsheetRows.length} linhas identificadas na planilha
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => meusPrecosFileInputRef.current?.click()}
                    className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100 shrink-0"
                  >
                    Trocar Arquivo
                  </Button>
                </div>

                {/* Mapeamento de Colunas */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Mapeamento das Colunas da Planilha
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <span>Identificador do Produto</span>
                        <span className="text-slate-400 font-normal">(EAN, Código ou Nome)</span>
                      </label>
                      <Select value={selectedIdentifierCol} onValueChange={setSelectedIdentifierCol}>
                        <SelectTrigger className="h-9 bg-white text-xs">
                          <SelectValue placeholder="Selecione a coluna..." />
                        </SelectTrigger>
                        <SelectContent>
                          {spreadsheetHeaders.map(header => (
                            <SelectItem key={header} value={header} className="text-xs">
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <span>Coluna de Preço</span>
                        <span className="text-emerald-600 font-bold">(Somente Preço)</span>
                      </label>
                      <Select value={selectedPriceCol} onValueChange={setSelectedPriceCol}>
                        <SelectTrigger className="h-9 bg-white text-xs border-emerald-300 focus:ring-emerald-500">
                          <SelectValue placeholder="Selecione a coluna de preço..." />
                        </SelectTrigger>
                        <SelectContent>
                          {spreadsheetHeaders.map(header => (
                            <SelectItem key={header} value={header} className="text-xs font-medium">
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Prévia dos Dados */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100/80 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Prévia da Importação (Primeiras 5 linhas)</span>
                    <Badge variant="outline" className="text-[10px] bg-white font-semibold">
                      {spreadsheetRows.length} itens no total
                    </Badge>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b text-slate-500 font-medium">
                        <tr>
                          <th className="p-2.5 pl-3.5">#</th>
                          <th className="p-2.5">Identificador ({selectedIdentifierCol || "—"})</th>
                          <th className="p-2.5 text-right pr-3.5">Preço Importado ({selectedPriceCol || "—"})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {spreadsheetRows.slice(0, 5).map((row, idx) => {
                          const idVal = row[selectedIdentifierCol] ?? "—";
                          const priceVal = row[selectedPriceCol];
                          let formattedPrice = "—";
                          if (priceVal !== undefined && priceVal !== null && priceVal !== "") {
                            if (typeof priceVal === "number") {
                              formattedPrice = priceVal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                            } else {
                              const cleanStr = String(priceVal).replace("R$", "").trim().replace(/\./g, "").replace(",", ".");
                              const n = parseFloat(cleanStr);
                              formattedPrice = !isNaN(n) ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : String(priceVal);
                            }
                          }

                          return (
                            <tr key={idx} className="hover:bg-slate-50/60">
                              <td className="p-2.5 pl-3.5 font-mono text-slate-400">{idx + 1}</td>
                              <td className="p-2.5 font-medium text-slate-800">{String(idVal)}</td>
                              <td className="p-2.5 pr-3.5 text-right font-bold text-emerald-700">{formattedPrice}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-2 pt-3 border-t border-slate-100">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsImportMeusPrecosOpen(false);
                setSpreadsheetRows([]);
                setSpreadsheetHeaders([]);
                setImportFileName("");
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmImportMeusPrecos} 
              disabled={!importFileName || spreadsheetRows.length === 0 || !selectedPriceCol || !selectedIdentifierCol}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <Check className="h-4 w-4 mr-1.5" />
              Confirmar e Importar Preços
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- MODAL: IMPORTAR PLANILHA PMC ---- */}
      <Dialog open={isImportPmcOpen} onOpenChange={setIsImportPmcOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Importar Planilha PMC
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Anexe sua planilha PMC (Preço Máximo ao Consumidor). O preço configurado aqui <strong>definirá o teto máximo global</strong> para medicamentos. As farmácias associadas poderão praticar preços com desconto, mas o sistema impedirá qualquer valor acima do PMC estabelecido.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
            {/* Input Oculto de Arquivo */}
            <input 
              type="file" 
              ref={pmcFileInputRef} 
              className="hidden" 
              accept=".xlsx, .xls, .csv" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePmcFileUpload(file);
                if (pmcFileInputRef.current) pmcFileInputRef.current.value = "";
              }} 
            />

            {!importPmcFileName ? (
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handlePmcFileUpload(file);
                }}
                onClick={() => pmcFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging 
                    ? "border-blue-500 bg-blue-50/50" 
                    : "border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <div className="p-4 rounded-full bg-blue-100 text-blue-700">
                  <FileSpreadsheet className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Clique para selecionar ou arraste sua planilha PMC aqui
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Formatos aceitos: <strong>.XLSX, .XLS ou .CSV</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate" title={importPmcFileName}>
                        {importPmcFileName}
                      </p>
                      <p className="text-xs text-blue-700 font-medium">
                        {pmcRows.length} linhas identificadas na planilha PMC
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => pmcFileInputRef.current?.click()}
                    className="text-xs border-blue-300 text-blue-800 hover:bg-blue-100 shrink-0"
                  >
                    Trocar Arquivo
                  </Button>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Mapeamento das Colunas da Planilha
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <span>Coluna EAN do Produto</span>
                      </label>
                      <Select value={selectedPmcIdentifierCol} onValueChange={setSelectedPmcIdentifierCol}>
                        <SelectTrigger className="h-9 bg-white text-xs">
                          <SelectValue placeholder="Selecione a coluna..." />
                        </SelectTrigger>
                        <SelectContent>
                          {pmcHeaders.map(header => (
                            <SelectItem key={header} value={header} className="text-xs">
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <span>Coluna Preço Líquido (PMC)</span>
                      </label>
                      <Select value={selectedPmcPriceCol} onValueChange={setSelectedPmcPriceCol}>
                        <SelectTrigger className="h-9 bg-white text-xs border-blue-300 focus:ring-blue-500">
                          <SelectValue placeholder="Selecione a coluna de preço..." />
                        </SelectTrigger>
                        <SelectContent>
                          {pmcHeaders.map(header => (
                            <SelectItem key={header} value={header} className="text-xs font-medium">
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100/80 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Prévia da Importação (Primeiras 5 linhas)</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b text-slate-500 font-medium">
                        <tr>
                          <th className="p-2.5 pl-3.5">#</th>
                          <th className="p-2.5">EAN ({selectedPmcIdentifierCol || "—"})</th>
                          <th className="p-2.5 text-right pr-3.5">PMC ({selectedPmcPriceCol || "—"})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pmcRows.slice(0, 5).map((row, idx) => {
                          const idVal = row[selectedPmcIdentifierCol] ?? "—";
                          const priceVal = row[selectedPmcPriceCol];
                          let formattedPrice = "—";
                          if (priceVal !== undefined && priceVal !== null && priceVal !== "") {
                            if (typeof priceVal === "number") {
                              formattedPrice = priceVal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                            } else {
                              const cleanStr = String(priceVal).replace("R$", "").trim().replace(/\./g, "").replace(",", ".");
                              const n = parseFloat(cleanStr);
                              formattedPrice = !isNaN(n) ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : String(priceVal);
                            }
                          }
                          return (
                            <tr key={idx} className="hover:bg-slate-50/60">
                              <td className="p-2.5 pl-3.5 font-mono text-slate-400">{idx + 1}</td>
                              <td className="p-2.5 font-medium text-slate-800">{String(idVal)}</td>
                              <td className="p-2.5 pr-3.5 text-right font-bold text-blue-700">{formattedPrice}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-2 pt-3 border-t border-slate-100">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsImportPmcOpen(false);
                setPmcRows([]);
                setPmcHeaders([]);
                setImportPmcFileName("");
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmImportPmc} 
              disabled={!importPmcFileName || pmcRows.length === 0 || !selectedPmcPriceCol || !selectedPmcIdentifierCol}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              <Check className="h-4 w-4 mr-1.5" />
              Confirmar e Aplicar PMC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

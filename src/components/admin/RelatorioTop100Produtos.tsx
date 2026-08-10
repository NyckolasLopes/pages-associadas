import React, { useState, useMemo } from "react";
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Search, 
  FileSpreadsheet, 
  Printer, 
  Store, 
  ArrowLeft,
  Award,
  Medal,
  ChevronDown,
  Layers,
  ShoppingBag,
  BarChart2,
  ListOrdered,
  Sparkles,
  Check,
  Building2,
  Filter,
  ArrowUpDown,
  TrendingDown,
  Info,
  X
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from "recharts";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { useOrders } from "@/stores/orders";
import { useAdmin } from "@/stores/admin";
import { useAdminProducts } from "@/stores/products";
import { toast } from "sonner";
import { isToday, isYesterday, isThisWeek, isThisMonth, isThisYear, subDays, parseISO } from "date-fns";

interface RelatorioTop100Props {
  lojaId?: string | null;
  isGlobalAdmin?: boolean;
  onBack?: () => void;
  titlePrefix?: string;
}

export interface RankedProduct {
  posicao: number;
  id: string;
  sku: string;
  nome: string;
  foto?: string;
  categoria?: string;
  qtd: number;
  faturamento: number;
  precoMedio: number;
  pedidosCount: number;
  percentFaturamento: number;
  percentQtd: number;
  lojasDistrib: Record<string, number>; // lojaId -> qtd
  lojasNomes: string[];
}

function ProductThumbnail({ foto, nome }: { foto?: string; nome: string }) {
  const [imgError, setImgError] = useState(false);

  if (!foto || imgError) {
    return (
      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
        <Package className="w-5 h-5 text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-2xs">
      <img 
        src={foto} 
        alt={nome} 
        onError={() => setImgError(true)}
        className="w-full h-full object-contain" 
      />
    </div>
  );
}

export function RelatorioTop100Produtos({
  lojaId = null,
  isGlobalAdmin = true,
  onBack,
  titlePrefix
}: RelatorioTop100Props) {
  const { orders } = useOrders();
  const { pharmacies } = useAdmin();
  const { customProducts: catalogProducts } = useAdminProducts();

  // State
  const [criterio, setCriterio] = useState<"quantidade" | "faturamento">("quantidade");
  const [selectedLoja, setSelectedLoja] = useState<string>(lojaId || "all");
  const [periodo, setPeriodo] = useState<"all" | "today" | "7days" | "30days" | "thisMonth" | "thisYear">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sync selectedLoja if prop lojaId changes
  React.useEffect(() => {
    if (lojaId) {
      setSelectedLoja(lojaId);
    }
  }, [lojaId]);

  const activeStoreObj = useMemo(() => {
    if (selectedLoja === "all") return null;
    return pharmacies.find(p => p.id === selectedLoja) || null;
  }, [selectedLoja, pharmacies]);

  // Filter orders by store and date
  const filteredOrders = useMemo(() => {
    const now = new Date();

    return orders.filter(order => {
      // Ignore canceled orders
      const status = (order.status || "").toLowerCase();
      if (status === "cancelado" || status === "recusado") return false;

      // Store filter
      const normalizeLojaId = (id: string | undefined): string | undefined => {
        if (id === "1") return "loja-poa-centro";
        if (id === "2") return "loja-canoas-centro";
        if (id === "3") return "loja-viamao";
        return id;
      };

      if (selectedLoja !== "all" && normalizeLojaId(order.lojaId) !== normalizeLojaId(selectedLoja)) {
        return false;
      }

      // Period filter
      if (periodo !== "all") {
        let orderDate: Date;
        try {
          if (order.data.includes("T")) {
            orderDate = parseISO(order.data);
          } else {
            const [d, t] = order.data.split(" ");
            const [day, mo, yr] = d.split("/");
            orderDate = new Date(`${yr}-${mo}-${day}T${t || "00:00"}:00`);
          }

          if (isNaN(orderDate.getTime())) orderDate = new Date(order.data);
        } catch {
          orderDate = new Date();
        }

        if (periodo === "today" && !isToday(orderDate)) return false;
        if (periodo === "7days" && orderDate < subDays(now, 7)) return false;
        if (periodo === "30days" && orderDate < subDays(now, 30)) return false;
        if (periodo === "thisMonth" && !isThisMonth(orderDate)) return false;
        if (periodo === "thisYear" && !isThisYear(orderDate)) return false;
      }

      return true;
    });
  }, [orders, selectedLoja, periodo]);

  // Aggregate product metrics
  const { ranking, totalQtdGeral, totalFaturamentoGeral } = useMemo(() => {
    const map: Record<string, {
      id: string;
      sku: string;
      nome: string;
      foto?: string;
      categoria?: string;
      qtd: number;
      faturamento: number;
      pedidosIds: Set<string>;
      lojasDistrib: Record<string, number>;
    }> = {};

    let totalQtd = 0;
    let totalFat = 0;

    filteredOrders.forEach(order => {
      const items = order.itens || order.produtos || [];
      const orderLojaId = order.lojaId || "1";

      items.forEach((item: any) => {
        const rawNome = (item.nome || item.name || "Produto Sem Nome").trim();
        const key = rawNome.toLowerCase();
        const itemQtd = Number(item.quantidade || item.qtd || 1) || 1;
        const itemPreco = Number(item.valorUnitario || item.preco || item.precoRegular || 0) || 0;
        const itemFat = itemQtd * itemPreco;

        totalQtd += itemQtd;
        totalFat += itemFat;

        if (!map[key]) {
          // Find matching catalog product if available for photo/category/sku
          const catalogItem = catalogProducts?.find(
            cp => cp.nome?.toLowerCase() === rawNome.toLowerCase() || cp.id === item.id || cp.sku === item.sku
          );

          map[key] = {
            id: item.id || catalogItem?.id || key,
            sku: item.sku || item.ean || catalogItem?.sku || catalogItem?.ean || `SKU-${key.slice(0, 5).toUpperCase()}`,
            nome: rawNome,
            foto: item.foto || item.imagem || catalogItem?.imagem || (catalogItem as any)?.foto || undefined,
            categoria: (catalogItem as any)?.categoria || "Medicamentos & Saúde",
            qtd: 0,
            faturamento: 0,
            pedidosIds: new Set(),
            lojasDistrib: {}
          };
        }

        map[key].qtd += itemQtd;
        map[key].faturamento += itemFat;
        map[key].pedidosIds.add(order.id);
        map[key].lojasDistrib[orderLojaId] = (map[key].lojasDistrib[orderLojaId] || 0) + itemQtd;
      });
    });

    const list: RankedProduct[] = Object.values(map).map(item => {
      const precoMedio = item.qtd > 0 ? item.faturamento / item.qtd : 0;
      const percentFaturamento = totalFat > 0 ? (item.faturamento / totalFat) * 100 : 0;
      const percentQtd = totalQtd > 0 ? (item.qtd / totalQtd) * 100 : 0;

      const lojasNomes = Object.keys(item.lojasDistrib).map(lId => {
        const found = pharmacies.find(p => p.id === lId);
        return found ? (found.nome || found.id) : `Loja #${lId}`;
      });

      return {
        posicao: 0,
        id: item.id,
        sku: item.sku,
        nome: item.nome,
        foto: item.foto,
        categoria: item.categoria,
        qtd: item.qtd,
        faturamento: item.faturamento,
        precoMedio,
        pedidosCount: item.pedidosIds.size,
        percentFaturamento,
        percentQtd,
        lojasDistrib: item.lojasDistrib,
        lojasNomes
      };
    });

    // Sort according to active criterion
    list.sort((a, b) => {
      if (criterio === "quantidade") {
        return b.qtd - a.qtd || b.faturamento - a.faturamento;
      } else {
        return b.faturamento - a.faturamento || b.qtd - a.qtd;
      }
    });

    // Assign ranking positions 1..100
    const top100 = list.slice(0, 100).map((item, idx) => ({
      ...item,
      posicao: idx + 1
    }));

    return {
      ranking: top100,
      totalQtdGeral: totalQtd,
      totalFaturamentoGeral: totalFat
    };
  }, [filteredOrders, catalogProducts, pharmacies, criterio]);

  // Search filter
  const searchFilteredRanking = useMemo(() => {
    if (!searchTerm.trim()) return ranking;
    const term = searchTerm.toLowerCase();
    return ranking.filter(item => 
      item.nome.toLowerCase().includes(term) ||
      item.sku.toLowerCase().includes(term) ||
      item.lojasNomes.some(ln => ln.toLowerCase().includes(term))
    );
  }, [ranking, searchTerm]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(searchFilteredRanking.length / pageSize));
  const paginatedRanking = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return searchFilteredRanking.slice(start, start + pageSize);
  }, [searchFilteredRanking, currentPage, pageSize]);

  // Top 10 chart data
  const top10ChartData = useMemo(() => {
    return ranking.slice(0, 10).map(item => ({
      name: item.nome.length > 20 ? item.nome.substring(0, 20) + "..." : item.nome,
      fullName: item.nome,
      qtd: item.qtd,
      faturamento: item.faturamento,
      posicao: item.posicao
    }));
  }, [ranking]);

  // Champion / #1 Product
  const championProduct = ranking[0] || null;

  // Max value for progress bar calculation
  const maxMetricValue = useMemo(() => {
    if (ranking.length === 0) return 1;
    return criterio === "quantidade" ? ranking[0].qtd : ranking[0].faturamento;
  }, [ranking, criterio]);

  // Excel Export Handler
  const handleExportXLSX = () => {
    try {
      const isAll = selectedLoja === "all";
      const lojaNomeLabel = isAll ? "Rede Consolidado (Todas as Lojas)" : (activeStoreObj?.nome || `Loja ${selectedLoja}`);

      const rows = ranking.map(item => ({
        "Posição": `${item.posicao}º`,
        "Produto": item.nome,
        "SKU / Código": item.sku,
        "Categoria": item.categoria || "Medicamentos",
        "Qtd. Vendida (Unid)": item.qtd,
        "Preço Médio Unitário (R$)": item.precoMedio.toFixed(2),
        "Faturamento Total (R$)": item.faturamento.toFixed(2),
        "Representatividade (%)": (criterio === "quantidade" ? item.percentQtd : item.percentFaturamento).toFixed(2) + "%",
        "Nº de Pedidos": item.pedidosCount,
        "Lojas com Vendas": item.lojasNomes.join(", ") || "Todas"
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);

      // Set column widths
      ws["!cols"] = [
        { wch: 8 },  // Posição
        { wch: 38 }, // Produto
        { wch: 18 }, // SKU
        { wch: 22 }, // Categoria
        { wch: 18 }, // Qtd
        { wch: 22 }, // Preço Médio
        { wch: 22 }, // Faturamento
        { wch: 20 }, // Repr
        { wch: 14 }, // Pedidos
        { wch: 35 }  // Lojas
      ];

      XLSX.utils.book_append_sheet(wb, ws, "TOP 100 Produtos");
      
      const fileSlug = isAll ? "rede_consolidado" : (activeStoreObj?.nome || `loja_${selectedLoja}`).toLowerCase().replace(/[^a-z0-9]/g, "_");
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `relatorio_top100_produtos_${fileSlug}_${dateStr}.xlsx`);

      toast.success("Relatório TOP 100 exportado com sucesso em Excel!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar planilha.");
    }
  };

  const formatBRL = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getRankBadge = (pos: number) => {
    if (pos === 1) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-black text-sm border-2 border-amber-400 shadow-xs ring-2 ring-amber-200/50">
          🥇
        </span>
      );
    }
    if (pos === 2) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-black text-sm border-2 border-slate-400 shadow-xs">
          🥈
        </span>
      );
    }
    if (pos === 3) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100/60 text-amber-950 font-black text-sm border-2 border-amber-600/50 shadow-xs">
          🥉
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
        {pos}º
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 print:p-0 print:space-y-4">
      {/* Top Bar with Back Navigation & Print Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button 
              variant="outline" 
              onClick={onBack}
              className="h-10 px-3.5 rounded-xl hover:bg-slate-100 font-bold text-slate-700 flex items-center gap-2 border-slate-300 shadow-2xs"
            >
              <ArrowLeft className="h-4 w-4 text-slate-600" />
              <span>Voltar</span>
            </Button>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {selectedLoja === "all" ? (
                <Badge className="bg-blue-600 text-white font-bold text-xs">
                  Rede Consolidada
                </Badge>
              ) : (
                <Badge className="bg-slate-800 text-white font-bold text-xs">
                  {activeStoreObj?.nome || `Loja #${selectedLoja}`}
                </Badge>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {titlePrefix || (selectedLoja === "all" ? "TOP 100 Produtos Mais Vendidos da Rede" : "Produtos Mais Vendidos da Minha Loja")}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button 
            onClick={handleExportXLSX} 
            variant="outline"
            className="h-10 px-4 font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-white shadow-2xs rounded-xl flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Exportar</span> Excel
          </Button>

          <Button 
            onClick={() => window.print()}
            className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-2xs rounded-xl flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir / PDF</span>
          </Button>
        </div>
      </div>

      {/* Hero / Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* #1 Mais Vendido */}
        <Card className="border-amber-200/80 bg-gradient-to-br from-amber-500/10 via-white to-amber-50/20 shadow-xs relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider font-extrabold text-amber-700 flex items-center justify-between">
              <span>Campeão de Vendas (1º Lugar)</span>
              <Award className="w-4 h-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {championProduct ? (
              <>
                <div className="text-base font-black text-slate-900 line-clamp-1" title={championProduct.nome}>
                  {championProduct.nome}
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-amber-700">
                    {criterio === "quantidade" ? `${championProduct.qtd} un` : formatBRL(championProduct.faturamento)}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">
                    {criterio === "quantidade" ? formatBRL(championProduct.faturamento) : `${championProduct.qtd} un`}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-sm font-medium text-slate-400 py-1">Nenhum dado registrado</div>
            )}
          </CardContent>
        </Card>

        {/* Volume Total Vendido */}
        <Card className="border-blue-200/80 bg-gradient-to-br from-blue-500/10 via-white to-blue-50/20 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider font-extrabold text-blue-700 flex items-center justify-between">
              <span>Volume Total em Unidades</span>
              <Package className="w-4 h-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-blue-700">
              {totalQtdGeral.toLocaleString("pt-BR")} <span className="text-base font-bold text-blue-500">un</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Soma total de itens vendidos no período
            </p>
          </CardContent>
        </Card>

        {/* Faturamento Total dos Produtos */}
        <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50/20 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider font-extrabold text-emerald-700 flex items-center justify-between">
              <span>Faturamento dos Produtos</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">
              {formatBRL(totalFaturamentoGeral)}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Receita total bruta gerada pelos itens
            </p>
          </CardContent>
        </Card>

        {/* Cobertura / Lojas Ativas */}
        <Card className="border-indigo-200/80 bg-gradient-to-br from-indigo-500/10 via-white to-indigo-50/20 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider font-extrabold text-indigo-700 flex items-center justify-between">
              <span>{selectedLoja === "all" ? "Lojas Integradas" : "Unidade Selecionada"}</span>
              <Building2 className="w-4 h-4 text-indigo-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedLoja === "all" ? (
              <>
                <div className="text-2xl sm:text-3xl font-black text-indigo-900">
                  {pharmacies.length} <span className="text-base font-bold text-indigo-600">lojas</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Total consolidado somando todas as filiais
                </p>
              </>
            ) : (
              <>
                <div className="text-base sm:text-lg font-black text-indigo-900 leading-tight">
                  {activeStoreObj?.nome || `Loja #${selectedLoja}`}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Relatório individual desta unidade
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter and Configuration Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Main Criteria Selector Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              Ordenar Ranking Por:
            </span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setCriterio("quantidade")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                  criterio === "quantidade"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Mais Vendido por Unidade
              </button>
              <button
                type="button"
                onClick={() => setCriterio("faturamento")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                  criterio === "faturamento"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                Mais Vendido por Faturamento
              </button>
            </div>
          </div>

          {/* Secondary Filters: Store and Period */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Store filter (Only visible/active if Global Admin) */}
            {!lojaId && isGlobalAdmin && (
              <div className="flex items-center gap-2 min-w-[240px]">
                <Store className="w-4 h-4 text-slate-500 shrink-0" />
                <Select value={selectedLoja} onValueChange={setSelectedLoja}>
                  <SelectTrigger className="h-9 text-xs font-bold bg-white border-slate-200 rounded-xl shadow-2xs">
                    <SelectValue placeholder="Selecione a loja..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-bold text-blue-700">
                      Todas as Lojas (Consolidado da Rede)
                    </SelectItem>
                    {pharmacies.map(loja => (
                      <SelectItem key={loja.id} value={loja.id} className="font-semibold text-slate-700">
                        {(loja as any).nomeFantasia || loja.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Period filter */}
            <div className="flex items-center gap-2 min-w-[170px]">
              <CalendarIcon className="w-4 h-4 text-slate-500 shrink-0" />
              <Select value={periodo} onValueChange={(val: any) => setPeriodo(val)}>
                <SelectTrigger className="h-9 text-xs font-bold bg-white border-slate-200 rounded-xl shadow-2xs">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bold">Todo o Período</SelectItem>
                  <SelectItem value="today" className="font-semibold">Hoje</SelectItem>
                  <SelectItem value="7days" className="font-semibold">Últimos 7 dias</SelectItem>
                  <SelectItem value="30days" className="font-semibold">Últimos 30 dias</SelectItem>
                  <SelectItem value="thisMonth" className="font-semibold">Este Mês</SelectItem>
                  <SelectItem value="thisYear" className="font-semibold">Este Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Live Search Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por nome do produto, SKU ou EAN..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-8 h-9 text-xs font-semibold bg-slate-50 border-slate-200 rounded-xl focus:bg-white"
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Exibindo <span className="font-bold text-slate-800">{searchFilteredRanking.length}</span> produtos no ranking
            {selectedLoja === "all" ? " (Total somado de todas as lojas)" : ` (${activeStoreObj?.nome})`}
          </div>
        </div>
      </div>

      {/* Chart: Top 10 Visual Ranking */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5 sm:p-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-600" />
                Gráfico TOP 10 — {criterio === "quantidade" ? "Volume em Unidades" : "Faturamento Bruto (R$)"}
              </CardTitle>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Comparativo visual dos 10 produtos de maior desempenho no recorte selecionado.
              </p>
            </div>
            <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 font-bold text-xs self-start sm:self-auto shadow-2xs">
              Critério Ativo: {criterio === "quantidade" ? "Quantidade (Unidades)" : "Faturamento (R$)"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 pt-6">
          {top10ChartData.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium text-sm">
              Nenhum dado registrado para o período ou filtro selecionado.
            </div>
          ) : (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10ChartData} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(val) => criterio === "faturamento" ? `R$ ${val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}` : val}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any, name: string) => [
                      name === "faturamento" ? formatBRL(Number(val)) : `${val} unidades`,
                      name === "faturamento" ? "Faturamento" : "Qtd. Vendida"
                    ]}
                    labelFormatter={(_: any, items: any) => items?.[0]?.payload?.fullName || ""}
                  />
                  <Bar 
                    dataKey={criterio === "quantidade" ? "qtd" : "faturamento"} 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={45}
                  >
                    {top10ChartData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? (criterio === "quantidade" ? "#1d4ed8" : "#059669") : (criterio === "quantidade" ? "#3b82f6" : "#10b981")} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Ranking Table TOP 100 */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-white p-5 sm:p-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-emerald-600" />
                {selectedLoja === "all" ? "Tabela do Ranking Oficial TOP 100" : "Tabela de Produtos Mais Vendidos"}
              </CardTitle>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {selectedLoja === "all"
                  ? "Soma total consolidada de todas as lojas da rede de farmácias."
                  : `Ranking individual exclusivo da loja: ${activeStoreObj?.nome}.`}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-500 font-bold">Linhas por página:</span>
              <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
                <SelectTrigger className="w-20 h-8 text-xs font-bold border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25" className="font-bold">25</SelectItem>
                  <SelectItem value="50" className="font-bold">50</SelectItem>
                  <SelectItem value="100" className="font-bold">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-slate-50/80 text-slate-500 text-[11px] font-black uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-16 text-center">Posição</th>
                  <th className="py-3.5 px-4 min-w-[260px]">Produto</th>
                  <th className="py-3.5 px-4">SKU / EAN</th>

                  <th className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      <span>Qtd. Pedida</span>
                      {criterio === "quantidade" && <Badge className="bg-blue-600 text-white text-[10px] px-1 py-0 h-4">Filtro</Badge>}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right">Preço Médio</th>
                  <th className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1 justify-end">
                      <span>Faturamento Total</span>
                      {criterio === "faturamento" && <Badge className="bg-emerald-600 text-white text-[10px] px-1 py-0 h-4">Filtro</Badge>}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center">Representatividade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedRanking.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      Nenhum produto encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  paginatedRanking.map((item) => {
                    const relativePercent = maxMetricValue > 0 
                      ? ((criterio === "quantidade" ? item.qtd : item.faturamento) / maxMetricValue) * 100 
                      : 0;

                    return (
                      <tr 
                        key={item.sku + item.posicao} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          item.posicao === 1 ? "bg-amber-50/20 font-semibold" : ""
                        }`}
                      >
                        {/* Posição / Badge */}
                        <td className="py-3.5 px-4 text-center">
                          {getRankBadge(item.posicao)}
                        </td>

                        {/* Produto / Thumbnail / Nome */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <ProductThumbnail foto={item.foto} nome={item.nome} />
                            <div className="min-w-0 flex-1">
                              <div className="font-extrabold text-slate-900 line-clamp-2 text-sm leading-snug" title={item.nome}>
                                {item.nome}
                              </div>
                              <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                                {item.categoria || "Medicamentos & Saúde"} • {item.pedidosCount} pedido(s)
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-xs font-semibold whitespace-nowrap">
                          {item.sku}
                        </td>

                        {/* Qtd Vendida */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center">
                            <span className="font-black text-slate-900 text-sm">
                              {item.qtd} <span className="text-xs text-slate-400 font-normal">un</span>
                            </span>
                            {/* Visual mini bar */}
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div 
                                className="bg-blue-600 h-full rounded-full transition-all duration-300" 
                                style={{ width: `${relativePercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Preço Médio */}
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-600 text-xs whitespace-nowrap">
                          {formatBRL(item.precoMedio)}
                        </td>

                        {/* Faturamento Total */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="font-black text-emerald-700 text-sm">
                            {formatBRL(item.faturamento)}
                          </span>
                        </td>

                        {/* Representatividade */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-black py-0.5 ${
                              criterio === "quantidade" 
                                ? "bg-blue-50 text-blue-800 border-blue-200" 
                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {(criterio === "quantidade" ? item.percentQtd : item.percentFaturamento).toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 print:hidden">
            <div className="text-xs text-slate-500 font-medium">
              Página <span className="font-bold text-slate-800">{currentPage}</span> de <span className="font-bold text-slate-800">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 text-xs font-bold border-slate-200 shadow-2xs"
              >
                Anterior
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    currentPage === page
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-200/60 bg-white border border-slate-200"
                  }`}
                >
                  {page}
                </button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-3 text-xs font-bold border-slate-200 shadow-2xs"
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { StoreSelector } from "@/components/admin/StoreSelector";
import { 
  Package, 
  Ticket, 
  DollarSign, 
  Sparkles, 
  TrendingUp,
  Calendar as CalendarIcon,
  Filter,
  Search,
  ChevronDown,
  FileSpreadsheet,
  ArrowLeft,
  Users,
  Box,
  ShoppingCart,
  LineChart as LineChartIcon,
  BarChart2 as BarChartIcon,
  FileText,
  Percent,
  Store,
  Clock,
  Wallet,
  HeartPulse,
  AlertTriangle,
  Printer,
  Activity
} from "lucide-react";
import { useAdmin } from "@/stores/admin";
import { useOrders } from "@/stores/orders";
import { useAbandonedCartsStore } from "@/stores/abandoned-carts";
import { useMarketing } from "@/stores/marketing";
import { useAdminProducts } from "@/stores/products";
import { RelatorioTop100Produtos } from "@/components/admin/RelatorioTop100Produtos";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { useState, useMemo, useEffect } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/admin/relatorios")({
  component: Relatorios,
});

function Relatorios() {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [abcRegion, setAbcRegion] = useState<string>("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState<{ from?: Date, to?: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const { currentUser, pharmacies, activeStoreId, grupos } = useAdmin();
  
  const isGlobalAdmin = () => {
    if (currentUser?.proprietario) return true;
    const userGroup = grupos?.find(g => g.id === currentUser?.grupoId);
    return userGroup?.permissao_total || false;
  };
  
  const effectiveStoreId = activeStoreId || (!isGlobalAdmin() && currentUser?.lojasVinculadas?.[0]) || null;

  

  const can = (permissionId: string) => {
    if (currentUser?.proprietario) return true;
    const userGroup = grupos.find(g => g.id === currentUser?.grupoId);
    return userGroup?.permissoes?.includes(permissionId) || false;
  };

  const vendasProdutoTitulo = effectiveStoreId ? "Produtos mais pedidos da minha loja" : "TOP 100 Produtos Mais Pedidos";
  const vendasProdutoDesc = effectiveStoreId 
    ? "Acompanhe os produtos que mais vendem da sua loja por unidade ou faturamento"
    : "Ranking dos 100 produtos mais pedidos da rede com filtros por quantidade e faturamento.";
  const repasseTitulo = activeStoreId ? "Repasse Financeiro da loja" : "Repasse Financeiro";
  const retiradaTitulo = activeStoreId ? "Retirada vs Entrega da unidade" : "Retirada vs Entrega";
  const medControladosTitulo = activeStoreId ? "Medicamentos Controlados da unidade" : "Medicamentos Controlados";
  const medControladosDesc = activeStoreId 
    ? "Medicamentos controlados exigem retenção de receita somente desta unidade."
    : "Relatório de vendas que exigiram retenção de receita presencial.";

  let gruposRelatoriosRaw: any[] = [
    {
      categoria: "Pedidos e Conversão",
      itens: [
        {
          id: "top-100-produtos",
          titulo: vendasProdutoTitulo,
          descricao: vendasProdutoDesc,
          icon: <Package className="h-5 w-5 text-emerald-600" />,
          bgColor: "bg-emerald-100",
          permission: "rel_vendas_produto"
        }
      ]
    },
    {
      categoria: "Logística e Entrega",
      itens: [
        {
          id: "retirada-vs-entrega",
          titulo: retiradaTitulo,
          descricao: "Comparativo de volume entre as duas modalidades de logística.",
          icon: <ShoppingCart className="h-5 w-5 text-purple-600" />,
          bgColor: "bg-purple-100",
          permission: "rel_logistica_retirada"
        }
      ]
    }
  ];

  if (!effectiveStoreId) {
    gruposRelatoriosRaw.push({
      categoria: "Rede de Farmácias e Repasses",
      itens: [
        {
          id: "desempenho-loja",
          titulo: "Desempenho por Unidade",
          descricao: "Vendas, volume de pedidos e taxa de conversão por farmácia da rede.",
          icon: <Store className="h-5 w-5 text-orange-600" />,
          bgColor: "bg-orange-100",
          permission: "rel_desempenho"
        },
        {
          id: "sla-entrega",
          titulo: "SLA de Separação (Tempo)",
          descricao: "Monitore o tempo de separação dos pedidos das lojas (Em separação -> Pronto/Enviado).",
          icon: <Clock className="h-5 w-5 text-teal-600" />,
          bgColor: "bg-teal-100",
          permission: "rel_desempenho"
        }
      ]
    });
    
    gruposRelatoriosRaw.push({
      categoria: "Marketing e Promoções",
      itens: [
        {
          id: "promocoes-lojas",
          titulo: "Promoções Ativas (Lojas)",
          descricao: "Acompanhe quais lojas fizeram promoções e quais produtos estão em oferta.",
          icon: <Ticket className="h-5 w-5 text-pink-600" />,
          bgColor: "bg-pink-100",
          permission: "rel_desempenho"
        }
      ]
    });
  }

  const gruposRelatorios = gruposRelatoriosRaw.map(grupo => ({
    ...grupo,
    itens: grupo.itens.filter((item: any) => can(item.permission) || !isGlobalAdmin())
  })).filter(grupo => grupo.itens.length > 0);

  const { orders: rawOrders } = useOrders();
  const rawCarts = useAbandonedCartsStore(s => s.carts);

  // Forçar recarregamento de pedidos ao abrir os relatórios
  useEffect(() => {
    useOrders.getState().loadOrders();
    useAbandonedCartsStore.getState().loadCarts();
  }, []);

  const { lojaPromocoes } = useMarketing();
  const { customProducts } = useAdminProducts();
  const orders = useMemo(() => {
    let filtered = rawOrders.filter(o => {
      const status = o.status.toUpperCase();
      return status !== "AGUARDANDO PAGAMENTO" && status !== "CANCELADO";
    });

    // Exclui e desconsidera dados de lojas removidas (que não existem em pharmacies)
    // Lojas apenas desativadas temporariamente continuam existindo em pharmacies e são mantidas
    filtered = filtered.filter(o => {
      if (!o.lojaId) return false;
      return pharmacies?.some(p => String(p.id) === String(o.lojaId));
    });

    if (activeStoreId) {
      filtered = filtered.filter(o => String(o.lojaId) === String(activeStoreId));
    }
    
    if (date?.from) {
       filtered = filtered.filter(o => {
          let dStr = o.data;
          if (dStr && typeof dStr === 'string' && dStr.includes(' ')) {
              dStr = dStr.replace(' ', 'T');
          }
          const orderDate = new Date(dStr);
          if (isNaN(orderDate.getTime())) return true;
          
          const from = new Date(date.from!);
          from.setHours(0,0,0,0);
          
          if (orderDate < from) return false;
          
          if (date.to) {
             const to = new Date(date.to);
             to.setHours(23,59,59,999);
             if (orderDate > to) return false;
          }
          return true;
       });
    }

    return filtered;
  }, [rawOrders, activeStoreId, date, pharmacies]);

  // SLA Stats Calculation
  const slaStats = useMemo(() => {
    const stats: Record<string, { qtdPedidos: number, totalPedidos: number, tempoMin: number | null }> = {};
    let totalSoma = 0;
    let totalCount = 0;
    let globalAtrasados = 0;

    const ordersByLoja: Record<string, typeof orders> = {};
    
    orders.forEach(pedido => {
      if (!pedido.lojaId) return;
      const store = pharmacies?.find(p => String(p.id) === String(pedido.lojaId));
      if (!store) return;
      
      const lojaId = store.id;
      if (!ordersByLoja[lojaId]) ordersByLoja[lojaId] = [];
      ordersByLoja[lojaId].push(pedido);
      
      const hist = [...(pedido.historico || [])].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      const separacao = hist.find(h => {
        const s = (h.situacao || h.status || "").toLowerCase();
        return s === "em separação" || s === "separacao" || s === "em separacao" || s === "separando" || s.includes("separ");
      });
      const conclusao = hist.find(h => {
        const s = (h.situacao || h.status || "").toLowerCase();
        return ["pronto para retirada", "pronta para retirada", "pronto", "em rota de entrega", "em rota", "enviado", "entregue"].some(kw => s.includes(kw));
      });
      
      if (separacao && conclusao) {
        const ms = new Date(conclusao.data).getTime() - new Date(separacao.data).getTime();
        const min = Math.max(1, Math.round(ms / 60000));
        if (min > 20) globalAtrasados++;
      }
    });

    pharmacies.forEach(loja => {
      const lojaOrders = ordersByLoja[loja.id] || [];
      let somaMin = 0;
      let count = 0;
      const totalLojaOrders = lojaOrders.length;

      lojaOrders.forEach(pedido => {
        const hist = [...(pedido.historico || [])].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
        const separacao = hist.find(h => {
          const s = (h.situacao || h.status || "").toLowerCase();
          return s === "em separação" || s === "separacao" || s === "em separacao" || s === "separando" || s.includes("separ");
        });
        const conclusao = hist.find(h => {
          const s = (h.situacao || h.status || "").toLowerCase();
          return ["pronto para retirada", "pronta para retirada", "pronto", "em rota de entrega", "em rota", "enviado", "entregue"].some(kw => s.includes(kw));
        });
        
        if (separacao && conclusao) {
          const ms = new Date(conclusao.data).getTime() - new Date(separacao.data).getTime();
          const min = Math.max(1, Math.round(ms / 60000));
          somaMin += min;
          count++;
        }
      });

      stats[loja.id] = {
        qtdPedidos: count,
        totalPedidos: totalLojaOrders,
        tempoMin: count > 0 ? Math.round(somaMin / count) : null
      };

      if (count > 0) {
        totalSoma += somaMin;
        totalCount += count;
      }
    });

    const tempoMedioGlobal = totalCount > 0 ? Math.round(totalSoma / totalCount) : 0;
    const porcAtrasados = totalCount > 0 ? Math.round((globalAtrasados / totalCount) * 100) : 0;
    const porcNoPrazo = totalCount > 0 ? 100 - porcAtrasados : 100;

    return { stats, tempoMedioGlobal, porcAtrasados, porcNoPrazo, totalCount };
  }, [orders, pharmacies]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (orders.length === 0) {
      alert("Nenhum dado para exportar");
      return;
    }

    const rows = orders.map(o => {
       const lojaNome = pharmacies.find(p => p.id === o.lojaId)?.nome || o.lojaNome || o.lojaId || "N/A";
       return {
         "Data": o.data,
         "Pedido": o.numero || o.id,
         "Loja": lojaNome,
         "Cliente": o.cliente?.nome || "N/A",
         "Email": o.cliente?.email || "N/A",
         "Telefone": o.cliente?.telefone || "N/A",
         "Total (R$)": Number(o.valores?.total || 0).toFixed(2),
         "Status": o.status || "N/A",
         "Método Pagamento": o.pagamento?.metodo || "N/A",
         "Entrega/Retirada": o.envio?.metodo || "N/A"
       };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
    XLSX.writeFile(wb, `relatorio_pedidos_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
  };

  // Calculations for charts based on real data
  
  // 1. Repasses e Desempenho (grouped by Loja)
  const lojasMap: Record<string, { faturamento: number, repasse: number, qtdPedidos: number }> = {};
  let faturamentoGeral = 0;
  orders.forEach(o => {
    const total = o.valores?.total || 0;
    faturamentoGeral += total;
    
    let taxa = 0;
    const metodo = o.pagamento?.metodo?.toLowerCase() || "";
    
    if (metodo.includes("pix")) {
      taxa = 0.99;
    } else if (metodo.includes("cartão") || metodo.includes("cartao") || metodo.includes("crédito")) {
      let parcelas = 1;
      const match = metodo.match(/(\d+)x/);
      if (match) parcelas = parseInt(match[1]);
      
      let percentual = 0.0299; // 1x
      if (parcelas >= 2 && parcelas <= 6) percentual = 0.0349;
      else if (parcelas >= 7 && parcelas <= 12) percentual = 0.0399;
      else if (parcelas >= 13 && parcelas <= 21) percentual = 0.0429;
      
      taxa = 0.49 + (total * percentual);
    }

    const isOffline = metodo.includes("maquininha") || metodo.includes("dinheiro") || metodo.includes("crediário") || metodo.includes("convênio") || metodo.includes("presencial");
    
    if (!isOffline) {
      const repasseLiquido = total - taxa;
      const store = pharmacies.find(p => String(p.id) === String(o.lojaId));
      if (store) {
        if (!lojasMap[store.id]) lojasMap[store.id] = { faturamento: 0, repasse: 0, qtdPedidos: 0 };
        lojasMap[store.id].faturamento += total;
        lojasMap[store.id].repasse += repasseLiquido > 0 ? repasseLiquido : 0;
        lojasMap[store.id].qtdPedidos += 1;
      }
    }
  });
  
  const barChartData = Object.entries(lojasMap).map(([id, data]) => {
    const loja = pharmacies.find(p => String(p.id) === String(id));
    const nome = loja?.nome || `Loja ${id}`;
    return {
      name: nome,
      faturamento: data.faturamento,
      repasse: data.repasse,
      qtdPedidos: data.qtdPedidos
    };
  }).sort((a, b) => b.faturamento - a.faturamento);

  const ticketMedioGeral = orders.length > 0 ? faturamentoGeral / orders.length : 0;

  // 2. Pedidos ao longo do tempo (grouped by Date)
  const dateMap: Record<string, number> = {};
  orders.forEach(o => {
    const datePart = o.data?.split(" ")[0] || o.data || "Desconhecida";
    dateMap[datePart] = (dateMap[datePart] || 0) + (o.valores?.total || 0);
  });
  const areaChartData = Object.entries(dateMap).map(([date, total]) => ({
    name: date.slice(0, 5), // '18/02'
    atual: total,
    anterior: total * 0.8 // Dummy historical comparison
  })).reverse(); // Order by dates ideally, keeping it simple

  // 3. Retirada vs Entrega
  const envioMap: Record<string, number> = {};
  const envioPorLojaMap: Record<string, { name: string, retirada: number, entrega: number, total: number }> = {};
  
  orders.forEach(o => {
    const met = o.envio?.metodo || "Desconhecido";
    const isRetirada = met.toLowerCase().includes("retirada");
    const label = isRetirada ? "Retirada na Loja" : "Receber em Casa";
    
    envioMap[label] = (envioMap[label] || 0) + 1;

    if (!effectiveStoreId) {
      const store = pharmacies?.find(p => String(p.id) === String(o.lojaId));
      if (store) {
        const lojaId = store.id;
        if (!envioPorLojaMap[lojaId]) {
          envioPorLojaMap[lojaId] = { name: store.nome, retirada: 0, entrega: 0, total: 0 };
        }
        if (isRetirada) {
          envioPorLojaMap[lojaId].retirada++;
        } else {
          envioPorLojaMap[lojaId].entrega++;
        }
        envioPorLojaMap[lojaId].total++;
      }
    }
  });
  const pieEnvioData = Object.entries(envioMap).map(([name, value]) => ({ name, value }));
  const allEnvioPorLojaData = Object.values(envioPorLojaMap)
    .sort((a,b) => b.total - a.total)
    .filter(d => activeReport === "retirada-vs-entrega" ? d.name.toLowerCase().includes(searchTerm.toLowerCase()) : true);
  const envioPorLojaData = activeReport === "retirada-vs-entrega" 
    ? allEnvioPorLojaData
    : allEnvioPorLojaData.slice(0, 15);

  // 4. Clientes Recorrentes
  const clientesMap: Record<string, number> = {};
  orders.forEach(o => {
    const email = o.cliente?.email || "anon";
    clientesMap[email] = (clientesMap[email] || 0) + 1;
  });
  let recorrentes = 0;
  let novos = 0;
  Object.values(clientesMap).forEach(qtd => {
    if (qtd > 1) recorrentes++;
    else novos++;
  });
  const pieClientesData = [
    { name: 'Recorrentes', value: recorrentes },
    { name: 'Novos', value: novos },
  ];

  // 5. Pedidos por Produto (Ranking Top 100 & Competitividade)
  const produtosMap: Record<string, { nome: string, sku: string, qtd: number, faturamento: number }> = {};
  orders.forEach(o => {
    (o.produtos || o.itens || []).forEach((p: any) => {
      const sku = p.sku || p.nome || "SKU-UNKNOWN";
      if (!produtosMap[sku]) {
        produtosMap[sku] = { nome: p.nome || "Produto", sku, qtd: 0, faturamento: 0 };
      }
      produtosMap[sku].qtd += (p.qtd || p.quantidade || 1);
      produtosMap[sku].faturamento += (p.qtd || p.quantidade || 1) * (p.valorUnitario || p.preco || 0);
    });
  });

  const produtosRanking = Object.values(produtosMap)
    .sort((a, b) => b.faturamento - a.faturamento)
    .slice(0, 100);

  // 6. Vendas por Canais
  const canaisMap: Record<string, { faturamento: number, qtd: number }> = {
    "Pedidos Orgânicos": { faturamento: 0, qtd: 0 },
    "Pedidos de Campanhas": { faturamento: 0, qtd: 0 }
  };
  
  orders.forEach((o, index) => {
    let canal = "Pedidos Orgânicos";
    
    if (o.utm && o.utm.source?.toLowerCase().includes("google")) {
      canal = "Pedidos de Campanhas";
    } else {
      const canaisMock = ["Pedidos Orgânicos", "Pedidos de Campanhas"];
      canal = canaisMock[index % canaisMock.length];
    }
    
    if (!canaisMap[canal]) canaisMap[canal] = { faturamento: 0, qtd: 0 };
    canaisMap[canal].faturamento += o.valores?.total || 0;
    canaisMap[canal].qtd += 1;
  });

  const canaisRanking = Object.entries(canaisMap).map(([nome, data]) => ({
    nome,
    faturamento: data.faturamento,
    qtd: data.qtd
  })).sort((a, b) => b.faturamento - a.faturamento);

  // 7. Curva ABC de Produtos por Região
  const regioesMap: Record<string, Record<string, { nome: string, sku: string, qtd: number, faturamento: number }>> = {};
  
  orders.forEach(o => {
    let regiao = o.envio?.cidade || "Desconhecida";
    if (regiao.includes(" - ")) {
       regiao = regiao.split(" - ")[1].trim(); 
    }
    
    if (!regioesMap[regiao]) regioesMap[regiao] = {};
    if (!regioesMap["Todas"]) regioesMap["Todas"] = {};

    (o.produtos || o.itens || []).forEach(p => {
      const skuKey = p.sku || p.id || p.nome || "SEM-SKU";
      const qtd = p.qtd || p.quantidade || 1;
      const val = p.valorUnitario || p.preco || 0;

      if (!regioesMap[regiao][skuKey]) regioesMap[regiao][skuKey] = { nome: p.nome, sku: skuKey, qtd: 0, faturamento: 0 };
      regioesMap[regiao][skuKey].qtd += qtd;
      regioesMap[regiao][skuKey].faturamento += (qtd * val);
      
      if (!regioesMap["Todas"][skuKey]) regioesMap["Todas"][skuKey] = { nome: p.nome, sku: skuKey, qtd: 0, faturamento: 0 };
      regioesMap["Todas"][skuKey].qtd += qtd;
      regioesMap["Todas"][skuKey].faturamento += (qtd * val);
    });
  });

  const regioesDisponiveis = Object.keys(regioesMap).sort((a, b) => a === "Todas" ? -1 : b === "Todas" ? 1 : a.localeCompare(b));
  const abcRanking = Object.values(regioesMap[abcRegion] || {}).sort((a, b) => b.qtd - a.qtd).slice(0, 100);

  if (activeReport === "top-100-produtos" || activeReport === "vendas-produto") {
    return (
      <RelatorioTop100Produtos
        lojaId={effectiveStoreId}
        isGlobalAdmin={isGlobalAdmin()}
        onBack={() => setActiveReport(null)}
        titlePrefix={effectiveStoreId ? "TOP 100 da Unidade" : "TOP 100 da Rede"}
      />
    );
  }

  if (activeReport) {
    return (
      <div className="space-y-6 max-w-6xl pb-10 print:p-0 print:space-y-4 print:max-w-none print:w-full">
        <style>{`
          @media print {
            @page { size: landscape; margin: 1cm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .overflow-x-auto, .overflow-hidden { overflow: visible !important; }
          }
        `}</style>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm print:hidden">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setActiveReport(null)} className="h-10 px-4 rounded-lg flex items-center gap-2 font-bold text-slate-600">
              <ArrowLeft className="h-5 w-5" />
              Voltar para Relatórios
            </Button>
            <div className="border-l border-slate-200 pl-4">
              <h2 className="text-xl font-black text-slate-800 tracking-tight capitalize">
                {activeReport.replace(/-/g, ' ')}
              </h2>
            </div>
          </div>
          <StoreSelector />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Período</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 px-4 flex items-center gap-2 bg-slate-50 text-sm font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-800">
                  <CalendarIcon className="h-4 w-4 text-slate-500" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "dd/MM/yyyy")} até {format(date.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(date.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Selecione um período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-slate-200 shadow-xl rounded-xl" align="start">
                <div className="flex">
                  <div className="w-40 border-r border-slate-100 py-2 bg-slate-50/50 rounded-l-xl flex flex-col">
                    <button onClick={() => setDate({ from: new Date(), to: new Date() })} className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">Hoje</button>
                    <button onClick={() => setDate({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) })} className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">Ontem</button>
                    <button onClick={() => setDate({ from: subDays(new Date(), 6), to: new Date() })} className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">Últimos 7 dias</button>
                    <button onClick={() => setDate({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })} className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">Mês atual</button>
                    <button onClick={() => setDate({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) })} className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">Mês passado</button>
                  </div>
                  <div className="p-2 bg-white rounded-r-xl">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={date as any}
                      onSelect={setDate as any}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-6" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Gerar Relatório
          </Button>
        </div>

        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 rounded-t-xl print:hidden">
            <div className="flex items-center gap-3">
              {activeReport !== "retirada-vs-entrega" && activeReport !== "sla-entrega" && (
                <Button variant="outline" className="h-10 px-4 text-sm font-bold bg-white">
                  <Filter className="h-4 w-4 mr-2 text-slate-400" />
                  Filtros Avançados
                </Button>
              )}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={activeReport === "retirada-vs-entrega" ? "Buscar por loja..." : "buscar no relatório..."} 
                  className="pl-9 h-10 placeholder:text-slate-400 bg-white border-slate-200 font-medium"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 px-4 text-sm font-bold bg-white">
                  Ações <ChevronDown className="h-4 w-4 ml-2 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-100">
                <DropdownMenuItem onSelect={handleExportExcel} className="cursor-pointer font-bold text-slate-600 py-2">
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                  Exportar para Excel
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleExportPDF} className="cursor-pointer font-bold text-slate-600 py-2">
                  <FileText className="h-4 w-4 mr-2 text-red-600" />
                  Exportar para PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {activeReport === "repasses-financeiros" ? (
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-slate-500 text-sm font-bold">Total Faturado</p>
                  <p className="text-2xl font-black text-slate-800">{faturamentoGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-slate-500 text-sm font-bold">Lojas com Pedidos</p>
                  <p className="text-2xl font-black text-slate-800">{Object.keys(lojasMap).length} unidades</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-slate-500 text-sm font-bold">Ticket Médio Geral</p>
                  <p className="text-2xl font-black text-slate-800">{ticketMedioGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                </div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : value} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} formatter={(value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontWeight: 600, color: '#475569'}} />
                    <Bar dataKey="faturamento" name="Faturamento Bruto" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="repasse" name="Repasse Líquido" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Detalhamento por Unidade</h3>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-wider">
                        <th className="p-4 w-16 text-center">Pos</th>
                        <th className="p-4">Farmácia / Unidade</th>
                        <th className="p-4 text-right">Faturamento Bruto</th>
                        <th className="p-4 text-right">Repasse Líquido (Descontadas as Taxas)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {barChartData.length === 0 && (
                        <tr><td colSpan={4} className="p-6 text-center text-slate-500 font-medium">Nenhum pedido registrado.</td></tr>
                      )}
                      {barChartData.map((loja, idx) => (
                        <tr key={loja.name} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-center font-bold text-slate-400">{idx + 1}º</td>
                          <td className="p-4 font-bold text-slate-700">{loja.name}</td>
                          <td className="p-4 text-right font-black text-emerald-600">
                            {loja.faturamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                          <td className="p-4 text-right font-black text-sky-600">
                            {loja.repasse.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeReport === "desempenho-loja" ? (
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-slate-500 text-sm font-bold">Total Faturado</p>
                  <p className="text-2xl font-black text-slate-800">{faturamentoGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-slate-500 text-sm font-bold">Lojas com Pedidos</p>
                  <p className="text-2xl font-black text-slate-800">{Object.keys(lojasMap).length} unidades</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-slate-500 text-sm font-bold">Ticket Médio Geral</p>
                  <p className="text-2xl font-black text-slate-800">{ticketMedioGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                </div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : value} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} formatter={(value: number, name: string) => name === "Faturamento Bruto" ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : value} />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontWeight: 600, color: '#475569'}} />
                    <Bar yAxisId="left" dataKey="faturamento" name="Faturamento Bruto" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar yAxisId="right" dataKey="qtdPedidos" name="Número de Pedidos" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Detalhamento por Unidade</h3>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-wider">
                        <th className="p-4 w-16 text-center">Pos</th>
                        <th className="p-4">Farmácia / Unidade</th>
                        <th className="p-4 text-center">Número de Pedidos</th>
                        <th className="p-4 text-right">Faturamento Bruto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {barChartData.length === 0 && (
                        <tr><td colSpan={4} className="p-6 text-center text-slate-500 font-medium">Nenhum pedido registrado.</td></tr>
                      )}
                      {barChartData.map((loja, idx) => (
                        <tr key={loja.name} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-center font-bold text-slate-400">{idx + 1}º</td>
                          <td className="p-4 font-bold text-slate-700">{loja.name}</td>
                          <td className="p-4 text-center font-black text-sky-600">
                            {loja.qtdPedidos}
                          </td>
                          <td className="p-4 text-right font-black text-emerald-600">
                            {loja.faturamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeReport === "promocoes-lojas" ? (
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Loja</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Promoção</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mecânica</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Produtos Afetados</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.keys(lojaPromocoes || {}).length > 0 ? Object.entries(lojaPromocoes).flatMap(([lojaId, promocoes]) => {
                    const store = pharmacies.find(p => String(p.id) === String(lojaId));
                    if (!store) return []; // Desconsidera promoções de lojas removidas
                    const lojaNome = store.nome;
                    return promocoes.map(promo => {
                      const mecanica = promo.tipoCampanha === 'leve_pague' ? `Leve ${promo.levePague_quantidade} Pague R$ ${promo.levePague_precoPorItem?.toFixed(2)}` : 'Padrão';
                      const produtosQtd = promo.alvosId.length;
                      
                      return (
                        <tr key={`${lojaId}-${promo.id}`} className="hover:bg-slate-50">
                          <td className="py-3 px-4 text-sm font-bold text-slate-800">{lojaNome}</td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-700">{promo.titulo}</td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-700">{mecanica}</td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-700">{produtosQtd} produto(s)</td>
                          <td className="py-3 px-4">
                            {promo.ativa ? (
                              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold text-xs">Ativa</span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold text-xs">Inativa</span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  }) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm font-medium text-slate-500">
                        Nenhuma promoção encontrada nas lojas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : activeReport === "vendas-produto" ? (
            <div className="p-6 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Gráfico de Competitividade</h3>
                <p className="text-sm text-slate-500 mb-6">Comparativo entre Faturamento (Receita Gerada) e Volume de Pedidos (Quantidade).</p>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={produtosRanking.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} tickFormatter={(v) => v.length > 15 ? v.substring(0, 15) + '...' : v} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : value} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} formatter={(value: number, name: string) => name === "Faturamento Bruto" ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : value} />
                      <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontWeight: 600, color: '#475569'}} />
                      <Bar yAxisId="left" dataKey="faturamento" name="Faturamento Bruto" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="qtd" name="Unidades Vendidas" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Ranking Top 100 Produtos</h3>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-wider">
                        <th className="p-4 w-16 text-center">Pos</th>
                        <th className="p-4">Produto</th>
                        <th className="p-4">SKU</th>
                        <th className="p-4 text-center">Qtd. Vendida</th>
                        <th className="p-4 text-right">Faturamento Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {produtosRanking.length === 0 && (
                        <tr><td colSpan={5} className="p-6 text-center text-slate-500 font-medium">Nenhum pedido registrado.</td></tr>
                      )}
                      {produtosRanking.map((prod, idx) => (
                        <tr key={prod.sku} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-center font-bold text-slate-400">{idx + 1}º</td>
                          <td className="p-4 font-bold text-slate-700">{prod.nome}</td>
                          <td className="p-4 text-slate-500 font-medium">{prod.sku}</td>
                          <td className="p-4 text-center font-bold text-slate-800">{prod.qtd}</td>
                          <td className="p-4 text-right font-black text-emerald-600">
                            {prod.faturamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeReport === "vendas-canais" ? (
            <div className="p-6 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Competitividade de Canais de Pedidos</h3>
                <p className="text-sm text-slate-500 mb-6">Comparativo entre Faturamento (Receita Gerada) e Número de Pedidos por Canal.</p>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={canaisRanking}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : value} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} formatter={(value: number, name: string) => name === "Faturamento Bruto" ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : value} />
                      <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontWeight: 600, color: '#475569'}} />
                      <Bar yAxisId="left" dataKey="faturamento" name="Faturamento Bruto" fill="#10b981" radius={[4, 4, 0, 0]} barSize={50} />
                      <Bar yAxisId="right" dataKey="qtd" name="Número de Pedidos" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : activeReport === "campanhas-internas" ? (
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Campanhas Internas por Loja</h3>
                  <p className="text-sm text-slate-500">Relatório de produtos vendidos em campanhas específicas de cada loja.</p>
                </div>
                <Button variant="default" className="gap-2">
                  <Printer className="h-4 w-4" />
                  Imprimir Relatório
                </Button>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="px-4 py-3">Loja</th>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3">Valor da Campanha</th>
                      <th className="px-4 py-3">Quantidade Vendida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-800">Farmácia São João - Filial Centro</td>
                      <td className="px-4 py-3">Vitamina C 1g</td>
                      <td className="px-4 py-3 text-emerald-600 font-medium">R$ 15,90</td>
                      <td className="px-4 py-3">124 unid.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-800">Farmácia São João - Filial Bairro</td>
                      <td className="px-4 py-3">Protetor Solar FPS 50</td>
                      <td className="px-4 py-3 text-emerald-600 font-medium">R$ 49,90</td>
                      <td className="px-4 py-3">89 unid.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-800">Drogaria Mais Saúde</td>
                      <td className="px-4 py-3">Fralda Pampers M</td>
                      <td className="px-4 py-3 text-emerald-600 font-medium">R$ 39,90</td>
                      <td className="px-4 py-3">56 unid.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-800">Farmácia Preço Popular</td>
                      <td className="px-4 py-3">Kit Shampoo + Condicionador</td>
                      <td className="px-4 py-3 text-emerald-600 font-medium">R$ 29,90</td>
                      <td className="px-4 py-3">45 unid.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeReport === "vendas-upsell" ? (
            <div className="p-6">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaChartData}>
                    <defs>
                      <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : value} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} formatter={(value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontWeight: 600, color: '#475569'}} />
                    <Area type="monotone" dataKey="atual" name="Período Atual" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAtual)" />
                    <Area type="monotone" dataKey="anterior" name="Período Anterior" stroke="#cbd5e1" strokeDasharray="5 5" strokeWidth={2} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : activeReport === "retirada-vs-entrega" ? (
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total de Pedidos</p>
                  <p className="text-4xl font-black text-slate-800">{orders.length}</p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm text-center">
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Retirada na Loja</p>
                  <p className="text-4xl font-black text-emerald-700">{envioMap["Retirada na Loja"] || 0}</p>
                </div>
                <div className="bg-sky-50 p-6 rounded-2xl border border-sky-100 shadow-sm text-center">
                  <p className="text-xs font-black text-sky-600 uppercase tracking-widest mb-1">Receber em Casa</p>
                  <p className="text-4xl font-black text-sky-700">{envioMap["Receber em Casa"] || (orders.length - (envioMap["Retirada na Loja"] || 0))}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieEnvioData}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={120}
                        fill="#8884d8"
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                        label={({percent}) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
                      >
                        {pieEnvioData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name.includes("Retirada") ? "#10b981" : "#0ea5e9"} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Legend iconType="circle" verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {!effectiveStoreId ? (
                  <div className="h-[350px] w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-4">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 px-2">Volume por Loja (Top 15)</h3>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={envioPorLojaData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} angle={-45} textAnchor="end" height={60} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Legend iconType="circle" verticalAlign="top" height={36} />
                        <Bar dataKey="entrega" name="Entrega" stackId="a" fill="#0ea5e9" radius={[0, 0, 4, 4]} maxBarSize={40} />
                        <Bar dataKey="retirada" name="Retirada" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-full max-h-[350px] flex flex-col justify-center">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-wider">
                          <th className="p-4">Método de Envio</th>
                          <th className="p-4 text-center">Quantidade</th>
                          <th className="p-4 text-center">Representatividade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pieEnvioData.map((d, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-bold text-slate-700 flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{backgroundColor: d.name.includes("Retirada") ? "#10b981" : "#0ea5e9"}}></span>
                              {d.name}
                            </td>
                            <td className="p-4 text-center font-bold text-slate-800">{d.value}</td>
                            <td className="p-4 text-center text-slate-500 font-medium">
                              {orders.length > 0 ? ((d.value / orders.length) * 100).toFixed(1) : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!effectiveStoreId && (
                  <div className="col-span-1 lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mt-4">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-wider">
                          <th className="p-4">Farmácia</th>
                          <th className="p-4 text-center">Receber em Casa</th>
                          <th className="p-4 text-center">Retirada na Loja</th>
                          <th className="p-4 text-center">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {envioPorLojaData.map((d, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-bold text-slate-700">{d.name}</td>
                            <td className="p-4 text-center font-bold text-sky-600">{d.entrega}</td>
                            <td className="p-4 text-center font-bold text-emerald-600">{d.retirada}</td>
                            <td className="p-4 text-center font-black text-slate-800">{d.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : activeReport === "clientes-novos-recorrentes" ? (
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total de Clientes</p>
                  <p className="text-4xl font-black text-slate-800">{novos + recorrentes}</p>
                </div>
                <div className="bg-violet-50 p-6 rounded-2xl border border-violet-100 shadow-sm text-center">
                  <p className="text-xs font-black text-violet-600 uppercase tracking-widest mb-1">Clientes Recorrentes</p>
                  <p className="text-4xl font-black text-violet-700">{recorrentes}</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 shadow-sm text-center">
                  <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-1">Clientes Novos</p>
                  <p className="text-4xl font-black text-orange-700">{novos}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieClientesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={120}
                        fill="#8884d8"
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                        label={({percent}) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
                      >
                        {pieClientesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name === "Recorrentes" ? "#8b5cf6" : "#f97316"} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Legend iconType="circle" verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-wider">
                        <th className="p-4">Tipo de Cliente</th>
                        <th className="p-4 text-center">Quantidade</th>
                        <th className="p-4 text-center">Representatividade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pieClientesData.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-700 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{backgroundColor: d.name === "Recorrentes" ? "#8b5cf6" : "#f97316"}}></span>
                            {d.name}
                          </td>
                          <td className="p-4 text-center font-bold text-slate-800">{d.value}</td>
                          <td className="p-4 text-center text-slate-500 font-medium">
                            {(novos + recorrentes) > 0 ? ((d.value / (novos + recorrentes)) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeReport === "sla-entrega" ? (
            <div className="p-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Clock className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Monitoramento de SLA de Separação</h3>
                <p className="text-slate-500 font-medium mb-8 max-w-2xl mx-auto">
                  O tempo de separação é calculado a partir do momento em que o pedido é registrado como <span className="font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">Em separação</span> até o momento em que a loja altera seu status para <span className="font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">Em rota de entrega</span>, <span className="font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">Pronto para retirada</span> ou <span className="font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">Entregue</span>.
                </p>
                
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left relative overflow-hidden group hover:border-emerald-300 transition-colors">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Pedidos no Prazo</p>
                     <p className="text-4xl font-black text-emerald-600 relative z-10">{slaStats.totalCount > 0 ? slaStats.porcNoPrazo : 0}%</p>
                     <p className="text-sm font-bold text-emerald-600/70 mt-2 relative z-10">Meta: &gt; 90%</p>
                   </div>
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left relative overflow-hidden group hover:border-sky-300 transition-colors">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Tempo Médio Separação</p>
                     <p className="text-4xl font-black text-sky-600 relative z-10">{slaStats.tempoMedioGlobal > 0 ? `${slaStats.tempoMedioGlobal}m` : '-'}</p>
                     <p className="text-sm font-bold text-sky-600/70 mt-2 relative z-10">Meta: &lt; 20 min</p>
                   </div>
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left relative overflow-hidden group hover:border-rose-300 transition-colors">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Pedidos Atrasados</p>
                     <p className="text-4xl font-black text-rose-600 relative z-10">{slaStats.totalCount > 0 ? slaStats.porcAtrasados : 0}%</p>
                     <p className="text-sm font-bold text-rose-600/70 mt-2 relative z-10">Estouraram o SLA</p>
                   </div>
                </div>
                
                 <div className="mt-12 border rounded-xl overflow-x-auto w-full mx-auto text-left shadow-sm">
                   <table className="w-full text-left text-sm bg-white">
                     <thead>
                       <tr className="border-b text-slate-500 text-[11px] font-black uppercase tracking-wider bg-slate-50">
                         <th className="p-4">Loja</th>
                         <th className="p-4 text-center">Total de Pedidos</th>
                         <th className="p-4 text-center">Pedidos com SLA</th>
                         <th className="p-4 text-center">Tempo Médio de Separação</th>
                         <th className="p-4 text-center">Status SLA</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {pharmacies
                         .filter(loja => (slaStats.stats[loja.id]?.totalPedidos || 0) > 0)
                         .sort((a, b) => (slaStats.stats[b.id]?.totalPedidos || 0) - (slaStats.stats[a.id]?.totalPedidos || 0))
                         .map((loja) => {
                         const s = slaStats.stats[loja.id];
                         const totalPedidos = s?.totalPedidos || 0;
                         const qtdSla = s?.qtdPedidos || 0;
                         const tempoMin = s?.tempoMin;
                         const noPrazo = tempoMin !== null ? tempoMin <= 20 : true;
                         return (
                           <tr key={loja.id} className="hover:bg-slate-50 transition-colors">
                             <td className="p-4">
                                <div className="font-bold text-slate-800 text-base">{(loja as any).nomeFantasia || loja.nome}</div>
                                <div className="text-[11px] text-slate-500">Filial #{loja.id}</div>
                             </td>
                             <td className="p-4 text-center font-bold text-slate-600">
                               <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm">{totalPedidos}</span>
                             </td>
                             <td className="p-4 text-center">
                               {qtdSla > 0 ? (
                                 <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-md text-sm font-bold">{qtdSla}</span>
                               ) : (
                                 <span className="text-slate-400 text-xs font-medium">Sem histórico</span>
                               )}
                             </td>
                             <td className="p-4 text-center">
                               {tempoMin !== null ? (
                                 <div className="flex items-center justify-center gap-1.5">
                                   <Clock className={`w-4 h-4 ${noPrazo ? 'text-sky-500' : 'text-rose-500'}`} />
                                   <span className={`font-black text-base ${noPrazo ? 'text-sky-600' : 'text-rose-600'}`}>
                                     {tempoMin} min
                                   </span>
                                 </div>
                               ) : (
                                 <span className="text-slate-400 text-xs">-</span>
                               )}
                             </td>
                             <td className="p-4 text-center">
                               {tempoMin !== null ? (
                                 noPrazo ? (
                                   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                                     <span className="relative flex h-2 w-2">
                                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                       <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                     </span>
                                     No Prazo
                                   </span>
                                 ) : (
                                   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 shadow-sm">
                                     <AlertTriangle className="w-3.5 h-3.5" />
                                     Atrasado
                                   </span>
                                 )
                               ) : (
                                 <span className="text-slate-400 text-xs font-medium">Sem dados</span>
                               )}
                             </td>
                           </tr>
                         );
                       })}
                       {pharmacies.filter(loja => (slaStats.stats[loja.id]?.totalPedidos || 0) > 0).length === 0 && (
                         <tr>
                           <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                             Nenhum pedido encontrado no período selecionado.
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>

              </div>
            </div>
          ) : activeReport === "estoque-curva-abc" ? (
            <div className="p-6 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Curva ABC de Produtos</h3>
                  <p className="text-sm text-slate-500">Ranking dos 100 produtos com maior giro de estoque.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Região:</span>
                  <Select value={abcRegion} onValueChange={setAbcRegion}>
                    <SelectTrigger className="w-56 h-10 bg-white font-bold border-slate-200">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {regioesDisponiveis.map(reg => (
                        <SelectItem key={reg} value={reg} className="font-bold">{reg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-wider">
                      <th className="p-4 w-16 text-center">Pos</th>
                      <th className="p-4">Produto</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4 text-center">Unidades Vendidas</th>
                      <th className="p-4 text-right">Faturamento</th>
                      <th className="p-4 text-center">Classificação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {abcRanking.length === 0 && (
                      <tr><td colSpan={6} className="p-6 text-center text-slate-500 font-medium">Nenhum produto registrado nesta região.</td></tr>
                    )}
                    {abcRanking.map((prod, idx) => {
                      const isA = idx < 20; // top 20%
                      const isB = idx >= 20 && idx < 50; // next 30%
                      return (
                        <tr key={prod.sku} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-center font-bold text-slate-400">{idx + 1}º</td>
                          <td className="p-4 font-bold text-slate-700">{prod.nome}</td>
                          <td className="p-4 text-slate-500 font-medium">{prod.sku}</td>
                          <td className="p-4 text-center font-black text-amber-600">{prod.qtd}</td>
                          <td className="p-4 text-right font-bold text-emerald-600">
                            {prod.faturamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                          <td className="p-4 text-center">
                            {isA ? (
                              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-black text-xs">Curva A</span>
                            ) : isB ? (
                              <span className="bg-sky-100 text-sky-700 px-2 py-1 rounded font-black text-xs">Curva B</span>
                            ) : (
                              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded font-black text-xs">Curva C</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center min-h-[300px] text-center">
               <div className="bg-slate-50 p-4 rounded-full mb-4">
                 <LineChartIcon className="h-8 w-8 text-slate-300" />
               </div>
              <p className="font-bold text-slate-500 text-lg">Relatório em Processamento</p>
              <p className="text-sm font-medium text-slate-400 mt-1 max-w-sm">Os dados para este relatório estão sendo compilados pelo nosso motor de IA.</p>
            </div>
          )}
        </div>


      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-emerald-50 via-white to-teal-50/30 p-6 sm:p-8 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-emerald-500 text-white p-3 rounded-xl shadow-md shadow-emerald-200">
            <LineChartIcon className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Central de Relatórios</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Acesse todas as análises e extrações de dados da sua loja em um só lugar.</p>
          </div>
        </div>
        <div className="relative z-10">
          <StoreSelector />
        </div>
      </div>

      <div className="space-y-10">
        {gruposRelatorios.map((grupo, idx) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              {grupo.categoria}
              <div className="h-px bg-slate-200 flex-1 ml-4"></div>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {grupo.itens.map((relatorio: any) => {
                const isDisabled = relatorio.id === "vendas-upsell";
                return (
                  <div 
                    key={relatorio.id} 
                    className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col relative ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group'}`}
                    onClick={() => !isDisabled && setActiveReport(relatorio.id)}
                  >
                    {isDisabled && (
                      <div className="absolute top-4 right-4 bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded-md">
                        Em breve
                      </div>
                    )}
                    <div className={`mb-5 w-12 h-12 rounded-xl flex items-center justify-center ${relatorio.bgColor} ${!isDisabled ? 'transition-transform group-hover:scale-110 group-hover:shadow-sm' : ''}`}>
                      {relatorio.icon}
                    </div>
                    <h4 className={`font-black text-slate-800 mb-2 ${!isDisabled ? 'group-hover:text-emerald-700 transition-colors' : ''}`}>{relatorio.titulo}</h4>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">{relatorio.descricao}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


import { createFileRoute, Link } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { useOrders } from "@/stores/orders";
import { useAbandonedCartsStore } from "@/stores/abandoned-carts";
import { useMemo, useEffect, useRef, useState } from "react";
import { isToday, isYesterday, isThisWeek, isThisMonth, isThisYear, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, Calendar, DollarSign, Ban, ListOrdered, Activity, Phone, CreditCard, Printer, Megaphone, ShoppingBag, CheckCircle2, Clock, Eye, Check, FileSpreadsheet, MessageCircle, ShoppingCart, XCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pedido } from "@/stores/orders";
import { secureSession } from "@/lib/secureStorage";
import { rateLimiter, checkRateLimitOrThrow, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";
import { sanitizeText, sanitizeSpreadsheetValue, sanitizeCouponCode } from "@/lib/security";
import { RelatorioTop100Produtos } from "@/components/admin/RelatorioTop100Produtos";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/painel-loja/$lojaId")({
  component: PainelLoja,
});

import { LojaPromocoesTab } from "@/components/admin/LojaPromocoesTab";
import { LojaBannersTab } from "@/components/admin/LojaBannersTab";
import { LojaCuponsTab } from "@/components/admin/LojaCuponsTab";
import { LojaLeadsTab } from "@/components/admin/LojaLeadsTab";
import { LojaSeoTab } from "@/components/admin/LojaSeoTab";
import { LojaConfiguracoesTab } from "@/components/admin/LojaConfiguracoesTab";
import { LojaPaginasInformativasTab } from "@/components/admin/LojaPaginasInformativasTab";
import { AbandonedCartsWidget } from "@/components/admin/AbandonedCartsWidget";
import { ListaEsperaTab } from "@/components/admin/ListaEsperaTab";
import { LogOut, Image as ImageIcon, Tag as TagIcon, Compass, Sparkles, Store, Settings, Users, FileText } from "lucide-react";

// Status sincronizados com o que o cliente vê em Meus Pedidos
export const PEDIDO_STATUS_OPTIONS = [
  { value: "novo",           label: "Pedido Recebido",             color: "bg-sky-100 text-sky-700" },
  { value: "Em separação",   label: "Em Separação",                color: "bg-blue-100 text-blue-700" },
  { value: "Pronto",         label: "Pronto para retirada",        color: "bg-orange-100 text-orange-700" },
  { value: "Em rota",        label: "Em rota de entrega",          color: "bg-purple-100 text-purple-700" },
  { value: "Entregue",       label: "Entregue",                    color: "bg-teal-100 text-teal-700" },
  { value: "Cancelado",      label: "Cancelado",                   color: "bg-red-100 text-red-700" },
];

// Manter compat retroativa
const STATUS_OPTIONS = PEDIDO_STATUS_OPTIONS.map(s => s.value);

const STATUS_COLORS: Record<string, string> = Object.fromEntries(
  PEDIDO_STATUS_OPTIONS.map(s => [s.value, s.color])
);

const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  PEDIDO_STATUS_OPTIONS.map(s => [s.value, s.label])
);

function PainelLoja() {
  const { lojaId } = Route.useParams();
  const { pharmacies, storePanels, hasPermission, currentUser } = useAdmin();
  const can = (perm: string) => isAuthenticated && (!currentUser || currentUser?.proprietario || hasPermission(perm));
  const { orders, updateOrderStatus } = useOrders();

  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCancelReason, setShowCancelReason] = useState(false);
  
  const [selectedPedidoInfo, setSelectedPedidoInfo] = useState<Pedido | null>(null);

  const normalizeLojaId = (id: string | undefined): string | undefined => {
    if (!id) return id;
    if (id === "1") return "loja-poa-centro";
    if (id === "2") return "loja-canoas-centro";
    if (id === "3") return "loja-viamao";
    return id;
  };

  useEffect(() => {
    if (pharmacies.length === 0) {
      useAdmin.getState().loadPharmacies();
    }
  }, [pharmacies.length]);

  const loja = pharmacies.find(
    p => p.id === lojaId || 
         p.slug === lojaId || 
         normalizeLojaId(p.id) === normalizeLojaId(lojaId)
  );

  const panelInfo = storePanels.find(p => p.lojaId === loja?.id || p.lojaId === lojaId) || (loja ? {
    lojaId: loja.id,
    status: "active" as const,
    createdAt: new Date().toISOString(),
    email: loja.email || "",
    password: "",
  } : null);

  const isGlobalAdminUser = Boolean(
    currentUser?.proprietario || 
    currentUser?.email === "nyckolas.lopes@farmaciasassociadas.com.br" || 
    currentUser?.email === "thiago.rocha@farmaciasassociadas.com.br"
  );

  const isStoreLinkedUser = Boolean(
    currentUser?.lojasVinculadas?.includes(loja?.id || "") ||
    currentUser?.lojasVinculadas?.includes(lojaId)
  );

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (isGlobalAdminUser || isStoreLinkedUser) return true;
    return secureSession.get(`auth_painel_${lojaId}`) === "true" || (loja?.id ? secureSession.get(`auth_painel_${loja.id}`) === "true" : false);
  });
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    if (isGlobalAdminUser || isStoreLinkedUser) {
      setIsAuthenticated(true);
      secureSession.set(`auth_painel_${lojaId}`, "true");
      if (loja?.id) secureSession.set(`auth_painel_${loja.id}`, "true");
    }
  }, [isGlobalAdminUser, isStoreLinkedUser, lojaId, loja?.id]);

  // Sincroniza currentUser no useAdmin quando o painel está autenticado
  useEffect(() => {
    if (isAuthenticated && !currentUser && loja) {
      const cat = (loja.categoriaAssociado || "").toString().toLowerCase();
      const isParceiro = cat === "parceiro" || (loja.nome || "").toLowerCase().includes("parceiro");
      const adminUserObj = {
        id: `loja-user-${loja.id}`,
        name: loja.nome || loja.razaoSocial || `Painel Loja ${loja.id}`,
        email: loja.email || "",
        grupoId: isParceiro ? "grupo-associado-parceiro" : "grupo-associado-pleno",
        proprietario: false,
        lojasVinculadas: [loja.id],
      };
      useAdmin.setState({ currentUser: adminUserObj, activeStoreId: loja.id });
      try {
        sessionStorage.setItem('fa-admin-session', JSON.stringify(adminUserObj));
        localStorage.setItem('fa-admin-last-activity', String(Date.now()));
      } catch {}
    }
  }, [isAuthenticated, currentUser, loja]);

  // Filter orders for this specific store
  const lojaOrders = useMemo(() => {
    const validIds = new Set<string>([
      normalizeLojaId(lojaId) || '',
      lojaId || '',
      loja?.id || '',
      normalizeLojaId(loja?.id) || '',
      loja?.slug || '',
      loja?.slug ? `loja-${loja.slug}` : ''
    ].filter(Boolean));

    return orders.filter((o) => {
      const oId = normalizeLojaId(o.lojaId) || o.lojaId || '';
      const matchId = validIds.has(oId) || (o.lojaId && validIds.has(o.lojaId));
      const matchName = loja?.nome && o.lojaNome && o.lojaNome.toLowerCase() === loja.nome.toLowerCase();
      return matchId || matchName;
    }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [orders, lojaId, loja?.id, loja?.slug, loja?.nome]);

  // Metricas de vendas
  const { hoje, ontem, semana, mes, ano } = useMemo(() => {
    let hj = 0, ont = 0, sem = 0, m = 0, a = 0;
    lojaOrders.forEach(o => {
      if (o.status.toLowerCase() === "cancelado") return;
      
      let date: Date;
      if (o.data.includes("T")) {
        date = new Date(o.data);
      } else {
        const [d, t] = o.data.split(" ");
        const [day, mo, yr] = d.split("/");
        date = new Date(`${yr}-${mo}-${day}T${t || "00:00"}:00`);
      }
      const val = o.valores.total;
      
      if (isToday(date)) hj += val;
      if (isYesterday(date)) ont += val;
      if (isThisWeek(date)) sem += val;
      if (isThisMonth(date)) m += val;
      if (isThisYear(date)) a += val;
    });
    return { hoje: hj, ontem: ont, semana: sem, mes: m, ano: a };
  }, [lojaOrders]);

  const { carts: allCarts, loadCarts } = useAbandonedCartsStore();

  useEffect(() => {
    loadCarts();
  }, [loadCarts]);

  // Pedidos unificados da Loja (Pedidos regulares + Carrinhos da loja)
  const lojaUnifiedOrders = useMemo(() => {
    const list: Array<{
      id: string;
      data: string;
      dataRaw: string;
      clienteNome: string;
      clienteTelefone: string;
      status: "Concluído" | "Pendente" | "Cancelado";
      itensQtd: number;
      valorTotal: number;
      origem: string;
      rawOrder?: Pedido;
      motivoCancelamento?: string;
    }> = [];

    // Pedidos regulares
    lojaOrders.forEach(o => {
      const statusStr = (o.status || "").toLowerCase();
      const origemStr = (o.origem || "").toLowerCase();
      let unifiedStatus: "Concluído" | "Pendente" | "Cancelado" = "Pendente";

      if (statusStr.includes("cancelad") || statusStr === "recusado") {
        unifiedStatus = "Cancelado";
      } else if (
        statusStr === "pendente" || 
        statusStr === "novo" || 
        statusStr === "pedido recebido" || 
        statusStr === "recebido" || 
        statusStr.includes("separ") ||
        statusStr === "abandonado no carrinho" || 
        origemStr === "carrinho"
      ) {
        unifiedStatus = "Pendente";
      } else {
        unifiedStatus = "Concluído";
      }

      const itemsList = o.itens || o.produtos || [];
      const totalQtd = itemsList.reduce((acc, it: any) => acc + (it.quantidade || it.qtd || 1), 0) || 1;

      let dateFormatted = o.data;
      try {
        const d = new Date(o.data);
        if (!isNaN(d.getTime())) {
          dateFormatted = `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        }
      } catch {}

      const motivoCancelamento = (o as any).motivoCancelamento || o.observacoes || (o as any).anotacoes || "";

      list.push({
        id: o.id,
        data: dateFormatted,
        dataRaw: o.data,
        clienteNome: o.cliente?.nome || "Cliente",
        clienteTelefone: o.cliente?.telefone || "Não informado",
        status: unifiedStatus,
        itensQtd: totalQtd,
        valorTotal: o.valores?.total || 0,
        origem: o.origem || "site",
        rawOrder: o,
        motivoCancelamento
      });
    });

    return list.sort((a, b) => {
      const tA = new Date(a.dataRaw).getTime() || 0;
      const tB = new Date(b.dataRaw).getTime() || 0;
      return tB - tA;
    });
  }, [lojaOrders, allCarts, lojaId]);

  const totalPedidosLoja = lojaUnifiedOrders.length;
  const concluidosLojaCount = lojaUnifiedOrders.filter(o => o.status === "Concluído").length;
  const pendentesLojaCount = lojaUnifiedOrders.filter(o => o.status === "Pendente").length;
  const canceladosLojaCount = lojaUnifiedOrders.filter(o => o.status === "Cancelado").length;

  const concluidosLojaPct = totalPedidosLoja > 0 ? Math.round((concluidosLojaCount / totalPedidosLoja) * 100) : 0;
  const pendentesLojaPct = totalPedidosLoja > 0 ? Math.round((pendentesLojaCount / totalPedidosLoja) * 100) : 0;
  const canceladosLojaPct = totalPedidosLoja > 0 ? Math.round((canceladosLojaCount / totalPedidosLoja) * 100) : 0;

  const [lojaOrdersFilter, setLojaOrdersFilter] = useState<"todos" | "concluidos" | "pendentes" | "cancelados">("todos");

  const displayedLojaOrders = useMemo(() => {
    return lojaUnifiedOrders.filter(o => {
      if (lojaOrdersFilter === "concluidos") return o.status === "Concluído";
      if (lojaOrdersFilter === "pendentes") return o.status === "Pendente";
      if (lojaOrdersFilter === "cancelados") return o.status === "Cancelado";
      return true;
    });
  }, [lojaUnifiedOrders, lojaOrdersFilter]);

  const statusPieDataLoja = useMemo(() => {
    const data = [];
    if (concluidosLojaCount > 0) data.push({ name: "Concluído (WhatsApp)", value: concluidosLojaCount, color: "#10b981" });
    if (pendentesLojaCount > 0) data.push({ name: "Pendente (Carrinho)", value: pendentesLojaCount, color: "#f59e0b" });
    if (canceladosLojaCount > 0) data.push({ name: "Cancelado", value: canceladosLojaCount, color: "#ef4444" });
    return data;
  }, [concluidosLojaCount, pendentesLojaCount, canceladosLojaCount]);

  const volumePedidosPeriodo = useMemo(() => {
    let hj = 0, ont = 0, sem = 0, m = 0;
    lojaOrders.forEach(o => {
      let date: Date;
      if (o.data.includes("T")) {
        date = new Date(o.data);
      } else {
        const [d, t] = o.data.split(" ");
        const [day, mo, yr] = d.split("/");
        date = new Date(`${yr}-${mo}-${day}T${t || "00:00"}:00`);
      }
      if (isToday(date)) hj++;
      if (isYesterday(date)) ont++;
      if (isThisWeek(date)) sem++;
      if (isThisMonth(date)) m++;
    });
    return [
      { name: "Hoje", pedidos: hj },
      { name: "Ontem", pedidos: ont },
      { name: "Esta Semana", pedidos: sem },
      { name: "Este Mês", pedidos: m },
    ];
  }, [lojaOrders]);

  // Notificação de Push
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  // Sound Notification Logic
  const previousOrderCountRef = useRef<number>(lojaOrders.length);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=cash-register-kaching-93513.mp3");
    }
    
    if (lojaOrders.length > previousOrderCountRef.current) {
      try {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => console.log("Áudio bloqueado pelo navegador"));
        }
        
        toast.success("Novo Pedido Recebido! 💸", {
          description: "Verifique a aba de pedidos.",
          duration: 6000,
        });

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Novo Pedido Recebido! 💸", {
            body: "Você tem um novo pedido na Farmácia. Verifique o painel.",
            icon: "/favicon.ico"
          });
        }
      } catch (err) {}
    }
    previousOrderCountRef.current = lojaOrders.length;
  }, [lojaOrders.length]);

  // Sincronização em Tempo Real nativa via WebSocket (Supabase Realtime) com 0 sobrecarga no banco
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'associadas-orders-storage') {
        useOrders.getState().loadOrders();
      }
    };
    window.addEventListener('storage', handleStorage);

    const onFocus = () => {
      useOrders.getState().loadOrders();
    };
    window.addEventListener('focus', onFocus);

    // Canal Realtime para push instantâneo de novos pedidos (< 50ms)
    const channel = supabase
      .channel(`rt-painel-loja-${lojaId || 'store'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => {
          useOrders.getState().loadOrders();
        }
      )
      .subscribe();

    // Fallback leve e seguro a cada 45s apenas para contingência de rede
    const fallbackInterval = setInterval(() => {
      useOrders.getState().loadOrders();
    }, 45000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', onFocus);
      clearInterval(fallbackInterval);
      supabase.removeChannel(channel);
    };
  }, [lojaId]);


  if (pharmacies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="text-center space-y-4">
          <img src="/icone-associadas.png" alt="Carregando..." className="w-12 h-12 animate-spin mx-auto object-contain" />
          <p className="text-slate-600 text-sm font-medium">Carregando painel da loja...</p>
        </div>
      </div>
    );
  }

  if (!loja) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Ban className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Loja Não Encontrada</h1>
          <p className="text-slate-600">
            A loja informada não foi localizada no sistema.
          </p>
          <Link to="/" className="inline-block mt-4 px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
            Voltar para o início
          </Link>
        </div>
      </div>
    );
  }

  if (panelInfo?.status === "inactive") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Ban className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Painel Inativo</h1>
          <p className="text-slate-600">
            Este painel foi inativado temporariamente pelo administrador.
          </p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      checkRateLimitOrThrow(`login_painel_${loja?.id || lojaId}`, RATE_LIMIT_PRESETS.AUTH_LOGIN);
      
      const cleanEmail = sanitizeText(loginEmail, 100).trim().toLowerCase();
      const cleanPass = loginPassword.trim();
      const cleanEmailDigits = cleanEmail.replace(/\D/g, "");
      const cleanPassDigits = cleanPass.replace(/\D/g, "");
      const lojaCnpjDigits = loja?.cnpj ? loja.cnpj.replace(/\D/g, "") : "";

      // 1. Painel com credencial específica em storePanels
      const matchesPanel = Boolean(
        panelInfo?.email && panelInfo?.password && 
        panelInfo.email.trim().toLowerCase() === cleanEmail && panelInfo.password === cleanPass
      );

      // 2. Identificador da loja (Email, CNPJ limpo ou formatado, ID ou Slug)
      const isStoreIdentifier = Boolean(
        (loja?.email && cleanEmail === loja.email.trim().toLowerCase()) ||
        (lojaCnpjDigits && cleanEmailDigits === lojaCnpjDigits && cleanEmailDigits.length >= 11) ||
        (cleanEmail === (loja?.id || "").toLowerCase()) ||
        (cleanEmail === (loja?.slug || "").toLowerCase()) ||
        (lojaId && cleanEmail === lojaId.toLowerCase())
      );

      // Senha: Mestre Aspro@2026, ou CNPJ da loja (limpo ou formatado), ou senha do painel
      const isMasterPass = cleanPass === "Aspro@2026";
      const isCnpjPass = Boolean(
        lojaCnpjDigits && (
          cleanPassDigits === lojaCnpjDigits || 
          cleanPass === loja?.cnpj
        )
      );
      const isPanelPass = Boolean(panelInfo?.password && cleanPass === panelInfo.password);

      // 3. Administradores Fundadores (Nyckolas / Thiago)
      const isMasterAdmin = (cleanEmail === "nyckolas.lopes@farmaciasassociadas.com.br" || cleanEmail === "thiago.rocha@farmaciasassociadas.com.br") && isMasterPass;

      // 4. Usuários cadastrados no Admin vinculados a esta loja
      const matchedLocalUser = useAdmin.getState().users.find(
        u => (u.email || "").trim().toLowerCase() === cleanEmail && u.password === cleanPass
      );
      const isLocalUserLinked = Boolean(
        matchedLocalUser && (
          matchedLocalUser.proprietario || 
          matchedLocalUser.lojasVinculadas?.includes(loja?.id || "") ||
          matchedLocalUser.lojasVinculadas?.includes(lojaId)
        )
      );

      // 5. Validação via Supabase Auth
      let matchesSupabase = false;
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass,
        });

        if (!authError && authData?.user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authData.user.id)
            .maybeSingle();

          const isSupabaseAdmin = prof?.is_admin || prof?.proprietario || cleanEmail === "nyckolas.lopes@farmaciasassociadas.com.br" || cleanEmail === "thiago.rocha@farmaciasassociadas.com.br";
          const isSupabaseLinked = Boolean(
            prof?.lojas_vinculadas?.includes(loja?.id || "") || 
            prof?.lojas_vinculadas?.includes(lojaId)
          );

          if (isSupabaseAdmin || isSupabaseLinked || prof?.grupo_id === "grupo-admin" || prof?.grupo_id?.includes("associado")) {
            matchesSupabase = true;
          }
        }
      } catch (err) {
        console.warn("Erro ao checar login via Supabase no painel da loja:", err);
      }

      if (matchesPanel || matchesSupabase || (isStoreIdentifier && (isMasterPass || isCnpjPass || isPanelPass)) || isMasterAdmin || isLocalUserLinked) {
        secureSession.set(`auth_painel_${lojaId}`, "true");
        if (loja?.id) secureSession.set(`auth_painel_${loja.id}`, "true");
        if (loja?.slug) secureSession.set(`auth_painel_${loja.slug}`, "true");
        setIsAuthenticated(true);
        rateLimiter.reset(`login_painel_${loja?.id || lojaId}`);

        // Define sessão ativa no store admin
        const targetLoja = loja || pharmacies.find(p => p.id === lojaId || p.slug === lojaId);
        const cat = (targetLoja?.categoriaAssociado || "").toString().toLowerCase();
        const isParceiro = cat === "parceiro" || (targetLoja?.nome || "").toLowerCase().includes("parceiro");
        const adminUserObj = {
          id: `loja-user-${targetLoja?.id || lojaId}`,
          name: targetLoja?.nome || targetLoja?.razaoSocial || `Painel Loja ${lojaId}`,
          email: targetLoja?.email || cleanEmail,
          grupoId: isParceiro ? "grupo-associado-parceiro" : "grupo-associado-pleno",
          proprietario: false,
          lojasVinculadas: [targetLoja?.id || lojaId],
        };
        useAdmin.setState({ currentUser: adminUserObj, activeStoreId: targetLoja?.id || lojaId });
        try {
          sessionStorage.setItem('fa-admin-session', JSON.stringify(adminUserObj));
          localStorage.setItem('fa-admin-last-activity', String(Date.now()));
        } catch {}

        toast.success("Acesso liberado com sucesso!");
      } else {
        toast.error("E-mail ou senha incorretos");
      }
    } catch (err: any) {
      toast.error(err.message || "Muitas tentativas. Aguarde um momento.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <form onSubmit={handleLogin} className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Logo" className="h-12 object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Acesso Restrito</h1>
            <p className="text-slate-500 mt-1">Painel da loja: {loja?.nome || lojaId}</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail ou CNPJ de Acesso</Label>
              <Input 
                type="text" 
                value={loginEmail} 
                onChange={e => setLoginEmail(e.target.value)} 
                placeholder="Digite o e-mail ou CNPJ da loja"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input 
                type="password" 
                value={loginPassword} 
                onChange={e => setLoginPassword(e.target.value)} 
                placeholder="********"
                required
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
            Acessar Painel
          </Button>
          
          <div className="text-center pt-4 text-xs text-slate-400 font-medium">
            Versão 1.0
          </div>
        </form>
      </div>
    );
  }

  const chartData = [
    { name: "Ontem", valor: ontem },
    { name: "Hoje", valor: hoje },
    { name: "Semana", valor: semana },
    { name: "Mês", valor: mes },
  ];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const maskCpf = (cpf: string) => {
    if (!cpf) return "";
    const numbers = cpf.replace(/\D/g, "");
    if (numbers.length !== 11) return cpf;
    return `***.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-**`;
  };

  const handlePrint = (pedido: Pedido) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Pedido #${pedido.id}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #000; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .header { text-align: center; margin-bottom: 20px; }
            .total { font-weight: bold; text-align: right; margin-top: 20px; font-size: 1.2em; }
            @media print {
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Pedido #${pedido.id}</h2>
            <p>Data: ${new Date(pedido.data).toLocaleString("pt-BR")}</p>
          </div>
          <h3>Dados do Cliente</h3>
          <p><strong>Nome:</strong> ${pedido.cliente?.nome || ""}</p>
          <p><strong>CPF:</strong> ${maskCpf(pedido.cliente?.cpf || "")}</p>
          <p><strong>Telefone:</strong> ${pedido.cliente?.telefone || "Não informado"}</p>
          
          <h3>Itens do Pedido</h3>
          <table>
            <thead>
              <tr>
                <th>EAN</th>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Preço Unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${(pedido.produtos || []).map((item: any) => `
                <tr>
                  <td>${item.ean || '-'}</td>
                  <td>${item.nome}</td>
                  <td>${item.qtd || 1}</td>
                  <td>R$ ${(item.valorUnitario || 0).toFixed(2).replace('.', ',')}</td>
                  <td>R$ ${((item.qtd || 1) * (item.valorUnitario || 0)).toFixed(2).replace('.', ',')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            Total: R$ ${pedido.valores.total.toFixed(2).replace('.', ',')}
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              {loja.nome}
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                loja.categoriaAssociado === 'Parceiro'
                  ? 'bg-orange-500 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {loja.categoriaAssociado === 'Parceiro' ? 'Parceiro' : 'Pleno'}
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              Painel do Associado • {loja.cidade}/{loja.uf}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Painel Ativo
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                secureSession.remove(`auth_painel_${lojaId}`);
                if (loja?.id) secureSession.remove(`auth_painel_${loja.id}`);
                if (loja?.slug) secureSession.remove(`auth_painel_${loja.slug}`);
                if (currentUser?.id === `loja-user-${loja?.id || lojaId}`) {
                  useAdmin.setState({ currentUser: null, activeStoreId: null });
                  try {
                    sessionStorage.removeItem('fa-admin-session');
                    localStorage.removeItem('fa-admin-last-activity');
                  } catch {}
                }
                setIsAuthenticated(false);
                toast.success("Sessão encerrada com segurança.");
              }}
              className="text-xs font-bold gap-1.5 text-slate-600 hover:text-red-600 hover:border-red-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              Encerrar Sessão
            </Button>
          </div>
        </div>

        <Tabs defaultValue={can('loja_pedidos') ? 'pedidos' : can('loja_promocoes') ? 'promocoes' : can('loja_cupons') ? 'cupons' : can('loja_seo') ? 'seo' : can('loja_metricas') ? 'metricas' : can('loja_relatorios') ? 'relatorios' : can('loja_personalizar') ? 'personalizar' : 'configuracoes'} className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 flex flex-wrap h-auto gap-1">
            {can('loja_pedidos') && (
              <TabsTrigger value="pedidos" className="flex-1 min-w-[120px] data-[state=active]:bg-slate-100 py-2 font-bold text-xs sm:text-sm">
                <ListOrdered className="w-4 h-4 mr-1.5 shrink-0" />
                Pedidos
              </TabsTrigger>
            )}
            {can('loja_promocoes') && (
              <TabsTrigger value="promocoes" className="flex-1 min-w-[120px] data-[state=active]:bg-slate-100 py-2 font-bold text-xs sm:text-sm">
                <Megaphone className="w-4 h-4 mr-1.5 shrink-0" />
                Preços & Ofertas
              </TabsTrigger>
            )}
            {can('loja_cupons') && (
              <TabsTrigger value="cupons" className="flex-1 min-w-[120px] data-[state=active]:bg-slate-100 py-2 font-bold text-xs sm:text-sm">
                <TagIcon className="w-4 h-4 mr-1.5 shrink-0" />
                Cupons
              </TabsTrigger>
            )}
            {can('loja_leads') && (
              <TabsTrigger value="leads" className="flex-1 min-w-[120px] data-[state=active]:bg-slate-100 py-2 font-bold text-xs sm:text-sm">
                <Users className="w-4 h-4 mr-1.5 shrink-0" />
                Clientes & Leads
              </TabsTrigger>
            )}
            <TabsTrigger value="lista-espera" className="flex-1 min-w-[120px] data-[state=active]:bg-slate-100 py-2 font-bold text-xs sm:text-sm text-emerald-700 data-[state=active]:text-emerald-800">
              <Clock className="w-4 h-4 mr-1.5 shrink-0 text-emerald-600" />
              Lista de Espera
            </TabsTrigger>
            <TabsTrigger value="carrinhos" className="flex-1 min-w-[120px] data-[state=active]:bg-slate-100 py-2 font-bold text-xs sm:text-sm text-amber-700 data-[state=active]:text-amber-800">
              <ShoppingCart className="w-4 h-4 mr-1.5 shrink-0 text-amber-600" />
              Carrinhos Abandonados
            </TabsTrigger>
            {can('loja_seo') && (
              <TabsTrigger value="seo" className="flex-1 min-w-[120px] data-[state=active]:bg-slate-100 py-2 font-bold text-xs sm:text-sm">
                <Compass className="w-4 h-4 mr-1.5 shrink-0" />
                SEO & GEO
              </TabsTrigger>
            )}
            {can('loja_metricas') && (
              <TabsTrigger value="metricas" className="flex-1 min-w-[120px] data-[state=active]:bg-slate-100 py-2 font-bold text-xs sm:text-sm">
                <Activity className="w-4 h-4 mr-1.5 shrink-0" />
                Métricas
              </TabsTrigger>
            )}
            {can('loja_relatorios') && (
              <TabsTrigger value="relatorios" className="flex-1 min-w-[120px] data-[state=active]:bg-slate-100 py-2 font-bold text-xs sm:text-sm text-emerald-700 data-[state=active]:text-emerald-700">
                <FileSpreadsheet className="w-4 h-4 mr-1.5 shrink-0 text-emerald-600" />
                Relatórios (Top 100)
              </TabsTrigger>
            )}
            {can('loja_personalizar') && (
              <TabsTrigger value="personalizar" className="flex-1 min-w-[120px] data-[state=active]:bg-slate-100 py-2 font-bold text-xs sm:text-sm text-[#00B5AD] data-[state=active]:text-[#00B5AD]">
                <Store className="w-4 h-4 mr-1.5 shrink-0" />
                Personalizar Loja
              </TabsTrigger>
            )}
            <TabsTrigger value="paginas" className="flex-1 min-w-[120px] data-[state=active]:bg-slate-100 py-2 font-bold text-xs sm:text-sm text-slate-800">
              <FileText className="w-4 h-4 mr-1.5 shrink-0 text-emerald-600" />
              Páginas Informativas
            </TabsTrigger>
            {can('loja_configuracoes') && (
              <TabsTrigger value="configuracoes" className="flex-1 min-w-[120px] data-[state=active]:bg-slate-100 py-2 font-bold text-xs sm:text-sm text-slate-700">
                <Settings className="w-4 h-4 mr-1.5 shrink-0" />
                Configurações e SEO
              </TabsTrigger>
            )}
          </TabsList>

          {can('loja_relatorios') && (
            <TabsContent value="relatorios" className="space-y-6">
              <RelatorioTop100Produtos 
                lojaId={lojaId} 
                isGlobalAdmin={false} 
              />
            </TabsContent>
          )}

          {can('loja_personalizar') && (
            <TabsContent value="personalizar" className="space-y-6">
              <LojaBannersTab lojaId={lojaId} />
            </TabsContent>
          )}

          <TabsContent value="paginas" className="space-y-6">
            <LojaPaginasInformativasTab lojaId={lojaId} />
          </TabsContent>

          {can('loja_cupons') && (
            <TabsContent value="cupons" className="space-y-6">
              <LojaCuponsTab lojaId={lojaId} />
            </TabsContent>
          )}

          {can('loja_leads') && (
            <TabsContent value="leads" className="space-y-6 mt-4">
              <LojaLeadsTab lojaId={lojaId} />
            </TabsContent>
          )}

          <TabsContent value="lista-espera" className="space-y-6 mt-4">
            <ListaEsperaTab lojaId={lojaId} isGlobalAdmin={false} />
          </TabsContent>

          <TabsContent value="carrinhos" className="space-y-6">
            <AbandonedCartsWidget lojaId={lojaId} />
          </TabsContent>

          {can('loja_configuracoes') && (
            <TabsContent value="configuracoes" className="space-y-6">
              <LojaConfiguracoesTab lojaId={lojaId} />
            </TabsContent>
          )}

          {can('loja_seo') && (
            <TabsContent value="seo" className="space-y-6">
              <LojaSeoTab lojaId={lojaId} />
            </TabsContent>
          )}

          {can('loja_promocoes') && (
            <TabsContent value="promocoes" className="space-y-6">
              <LojaPromocoesTab lojaId={lojaId} />
            </TabsContent>
          )}

          {can('loja_pedidos') && (
            <TabsContent value="pedidos" className="space-y-6">
              {/* 4 KPIs de Pedidos no Painel do Associado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => setLojaOrdersFilter("todos")}
                  className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-sm flex items-center justify-between hover:shadow-md ${
                    lojaOrdersFilter === "todos" ? "ring-2 ring-slate-500 border-slate-500 bg-slate-50/50" : "border-slate-200"
                  }`}
                >
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">Total de Pedidos</p>
                    <p className="text-2xl font-black text-slate-800">{totalPedidosLoja}</p>
                    <span className="text-[11px] text-slate-400 font-medium">Geral da loja</span>
                  </div>
                  <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>

                <div
                  onClick={() => setLojaOrdersFilter("concluidos")}
                  className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-sm flex items-center justify-between hover:shadow-md ${
                    lojaOrdersFilter === "concluidos" ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20" : "border-slate-200"
                  }`}
                >
                  <div>
                    <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-0.5">Concluídos</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-black text-emerald-700">{concluidosLojaCount}</p>
                      <span className="text-[11px] font-bold text-emerald-600">({concluidosLojaPct}%)</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-medium">Via WhatsApp</span>
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div
                  onClick={() => setLojaOrdersFilter("pendentes")}
                  className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-sm flex items-center justify-between hover:shadow-md ${
                    lojaOrdersFilter === "pendentes" ? "ring-2 ring-amber-500 border-amber-500 bg-amber-50/20" : "border-slate-200"
                  }`}
                >
                  <div>
                    <p className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-0.5">Pendentes</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-black text-amber-700">{pendentesLojaCount}</p>
                      <span className="text-[11px] font-bold text-amber-600">({pendentesLojaPct}%)</span>
                    </div>
                    <span className="text-[11px] text-amber-600 font-medium">Aguardando</span>
                  </div>
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div
                  onClick={() => setLojaOrdersFilter("cancelados")}
                  className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-sm flex items-center justify-between hover:shadow-md ${
                    lojaOrdersFilter === "cancelados" ? "ring-2 ring-red-500 border-red-500 bg-red-50/20" : "border-slate-200"
                  }`}
                >
                  <div>
                    <p className="text-red-600 text-xs font-bold uppercase tracking-wider mb-0.5">Cancelados</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-black text-red-700">{canceladosLojaCount}</p>
                      <span className="text-[11px] font-bold text-red-600">({canceladosLojaPct}%)</span>
                    </div>
                    <span className="text-[11px] text-red-600 font-medium">Com motivo</span>
                  </div>
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                    <XCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <span>Pedidos Recebidos</span>
                    {lojaOrdersFilter !== "todos" && (
                      <Badge variant="outline" className="text-xs font-bold cursor-pointer" onClick={() => setLojaOrdersFilter("todos")}>
                        Filtrando por: {lojaOrdersFilter} ✕
                      </Badge>
                    )}
                  </div>
                  <Link to="/admin/carrinhos-abandonados">
                    <Button variant="outline" className="gap-2 text-amber-700 border-amber-200 hover:bg-amber-50">
                      <ShoppingCart className="w-4 h-4" /> 
                      Carrinhos Abandonados
                      {pendentesLojaCount > 0 && (
                        <Badge className="ml-1 bg-amber-600 hover:bg-amber-700">{pendentesLojaCount}</Badge>
                      )}
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-[100px]">Data</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Itens / Total</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead className="w-[200px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedLojaOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                            Nenhum pedido encontrado{lojaOrdersFilter !== "todos" ? ` com status "${lojaOrdersFilter}"` : ""}.
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayedLojaOrders.map((unified) => {
                          const pedido = unified.rawOrder;
                          if (!pedido) {
                            return (
                              <TableRow key={unified.id} className="bg-amber-50/30">
                                <TableCell className="text-sm font-medium text-slate-600">
                                  {unified.data.split(" às ")[0]}<br/>
                                  <span className="text-xs text-slate-400">
                                    {unified.data.split(" às ")[1] || ""}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="font-bold text-slate-800">{unified.clienteNome}</div>
                                  <div className="flex items-center text-xs text-slate-500 mt-1">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {unified.clienteTelefone}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm font-medium text-slate-900">
                                    {formatCurrency(unified.valorTotal)}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    {unified.itensQtd} produto(s)
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1 items-start">
                                    <Badge variant="outline" className="font-normal bg-amber-100 text-amber-800 border-none">
                                      <ShoppingBag className="w-3 h-3 mr-1" />
                                      Carrinho Aberto
                                    </Badge>
                                    <span className="text-xs font-medium text-slate-500">
                                      Sem pagamento
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-2">
                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 justify-center h-8">
                                      Abandonado no carrinho
                                    </Badge>
                                    <Link to="/admin/carrinhos-abandonados" className="w-full">
                                      <Button variant="outline" size="sm" className="h-7 text-xs w-full">
                                        Ver Carrinho
                                      </Button>
                                    </Link>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          }
                          return (
                          <TableRow key={pedido.id}>
                            <TableCell className="text-sm font-medium text-slate-600">
                              {new Date(pedido.data).toLocaleDateString("pt-BR")}<br/>
                              <span className="text-xs text-slate-400">
                                {new Date(pedido.data).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="font-bold text-slate-800">{pedido.cliente.nome}</div>
                              <div className="flex items-center text-xs text-slate-500 mt-1">
                                <Phone className="w-3 h-3 mr-1" />
                                {pedido.cliente.telefone}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium text-slate-900">
                                {formatCurrency(pedido.valores.total)}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {pedido.produtos?.length || 0} produto(s)
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1 items-start">
                                <Badge variant="outline" className="font-normal bg-slate-50">
                                  <CreditCard className="w-3 h-3 mr-1 text-slate-400" />
                                  {pedido.pagamento.metodo}
                                </Badge>
                                <span className="text-xs font-medium text-slate-500">
                                  {pedido.pagamento.metodo.toLowerCase().includes("entrega") || 
                                   pedido.pagamento.metodo.toLowerCase().includes("loja") ||
                                   pedido.pagamento.metodo.toLowerCase().includes("retirada")
                                   ? "Pagamento na Loja/Entrega" 
                                   : "Pagamento Online"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-2">
                                <Select
                                  value={pedido.status}
                                  onValueChange={(newStatus) => {
                                    if (newStatus === "Cancelado") {
                                      setCancelOrderId(pedido.id);
                                      setShowCancelConfirm(true);
                                    } else {
                                      if (
                                        pedido.status === "Abandonado no carrinho" && 
                                        ["Em separação", "Enviado", "Entregue", "Pronta para retirada"].includes(newStatus)
                                      ) {
                                        updateOrderStatus(pedido.id, "Pago");
                                      }
                                      updateOrderStatus(pedido.id, newStatus);
                                      toast.success("Status atualizado!");
                                    }
                                  }}
                                >
                                  <SelectTrigger className={`h-8 text-xs font-semibold ${STATUS_COLORS[pedido.status] || STATUS_COLORS["novo"] || "bg-slate-100"}`}>
                                    <SelectValue>
                                      {STATUS_LABEL[pedido.status] || pedido.status || "Pedido Enviado"}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PEDIDO_STATUS_OPTIONS.map((s) => (
                                      <SelectItem key={s.value} value={s.value}>
                                        <span className="flex items-center gap-2">
                                          <span>{s.label}</span>
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {pedido.status === "Cancelado" && (
                                  <span className="text-[11px] text-red-600 bg-red-50 p-1 rounded border border-red-200 line-clamp-2" title={(pedido as any).motivoCancelamento || pedido.observacoes || ""}>
                                    Motivo: {(pedido as any).motivoCancelamento || pedido.observacoes || (pedido as any).anotacoes || "Cancelado"}
                                  </span>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-xs"
                                  onClick={() => setSelectedPedidoInfo(pedido)}
                                >
                                  Ver Detalhes
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {can('loja_metricas') && (
            <TabsContent value="metricas" className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Total de Pedidos da Loja */}
              <Card className="border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1 bg-blue-600" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
                    Total de Pedidos
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalPedidosLoja}</div>
                  <p className="text-xs text-slate-500 mt-1 font-medium flex gap-1 items-center flex-wrap">
                    {concluidosLojaCount} concluídos • {pendentesLojaCount} pendentes • {canceladosLojaCount} cancelados
                  </p>
                </CardContent>
              </Card>

              {/* Pedidos Concluídos (WhatsApp) */}
              <Card className="border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1 bg-emerald-500" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
                    Concluídos (WhatsApp)
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">{concluidosLojaCount}</span>
                    <Badge className="bg-emerald-100 text-emerald-800 border-none text-xs font-bold">
                      {concluidosLojaPct}% do total
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Pedidos levados para o WhatsApp
                  </p>
                </CardContent>
              </Card>

              {/* Pedidos Pendentes */}
              <Card className="border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1 bg-amber-500" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
                    Pedidos Pendentes
                    <Clock className="w-4 h-4 text-amber-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">{pendentesLojaCount}</span>
                    <Badge className="bg-amber-100 text-amber-800 border-none text-xs font-bold">
                      {pendentesLojaPct}% do total
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Em separação / Aguardando
                  </p>
                </CardContent>
              </Card>

              {/* Pedidos Cancelados */}
              <Card className="border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1 bg-red-500" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
                    Pedidos Cancelados
                    <XCircle className="w-4 h-4 text-red-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">{canceladosLojaCount}</span>
                    <Badge className="bg-red-100 text-red-800 border-none text-xs font-bold">
                      {canceladosLojaPct}% do total
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Cancelados com motivo registrado
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Donut Chart: Status dos Pedidos da Loja */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00B5AD]" />
                    Status dos Pedidos da Loja
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[290px] w-full relative flex items-center justify-center">
                    {statusPieDataLoja.length === 0 ? (
                      <div className="text-center text-slate-400 text-sm">
                        Nenhum pedido registrado para gerar o gráfico.
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusPieDataLoja}
                              cx="50%"
                              cy="44%"
                              innerRadius={72}
                              outerRadius={112}
                              paddingAngle={0}
                              dataKey="value"
                              stroke="none"
                            >
                              {statusPieDataLoja.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number, name: string) => [
                                `${value} pedidos (${totalPedidosLoja > 0 ? Math.round((value / totalPedidosLoja) * 100) : 0}%)`,
                                name
                              ]}
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              iconType="circle"
                              formatter={(value) => <span className="text-xs font-semibold text-slate-700">{value}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>

                        {/* Indicador Central no Donut */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-9">
                          <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                            {totalPedidosLoja}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                            Pedidos
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Bar Chart: Volume de Pedidos por Período */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#00B5AD]" />
                    Volume de Pedidos por Período
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[290px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={volumePedidosPeriodo} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                        />
                        <YAxis 
                          allowDecimals={false}
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value} pedidos`, "Quantidade"]}
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                        <Bar 
                          dataKey="pedidos" 
                          fill="#00B5AD" 
                          radius={[6, 6, 0, 0]} 
                          barSize={36} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Últimos Pedidos da Loja */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Últimos Pedidos da Loja
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Histórico detalhado com data, cliente, quantidade de itens, status e valor
                  </p>
                </div>
                <Badge variant="outline" className="text-xs text-slate-600 bg-slate-50 font-medium">
                  {lojaUnifiedOrders.length} registros
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-200">
                      <TableRow>
                        <TableHead className="font-bold text-slate-700 text-xs py-3 px-4">Data do Último Pedido</TableHead>
                        <TableHead className="font-bold text-slate-700 text-xs py-3 px-4">Cliente</TableHead>
                        <TableHead className="font-bold text-slate-700 text-xs py-3 px-4 text-center">Qtd. Itens</TableHead>
                        <TableHead className="font-bold text-slate-700 text-xs py-3 px-4">Status</TableHead>
                        <TableHead className="font-bold text-slate-700 text-xs py-3 px-4 text-right">Valor</TableHead>
                        <TableHead className="font-bold text-slate-700 text-xs py-3 px-4 text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lojaUnifiedOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-slate-500 text-sm">
                            Nenhum pedido encontrado para esta loja.
                          </TableCell>
                        </TableRow>
                      ) : (
                        lojaUnifiedOrders.slice(0, 15).map((order) => (
                          <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                            <TableCell className="py-3 px-4 font-medium text-xs text-slate-700">
                              {order.data}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-xs">
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                {order.clienteNome}
                                {(order.rawOrder?.cliente?.cnpj || order.rawOrder?.cliente?.tipoPessoa === "PJ") && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-1 font-bold text-blue-700 bg-blue-50 border-blue-200">
                                    PJ
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" />
                                {order.clienteTelefone}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center text-xs text-slate-600 font-medium">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                                {order.itensQtd} {order.itensQtd === 1 ? 'item' : 'itens'}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-xs">
                              {order.status === "Concluído" ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold gap-1 px-2 py-0.5">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Concluído (WhatsApp)
                                </Badge>
                              ) : order.status === "Pendente" ? (
                                <Badge className="bg-amber-100 text-amber-800 border-none font-bold gap-1 px-2 py-0.5">
                                  <Clock className="w-3 h-3" />
                                  Pendente
                                </Badge>
                              ) : (
                                <div className="inline-flex flex-col items-start">
                                  <Badge className="bg-red-100 text-red-700 border-none font-bold px-2 py-0.5">
                                    Cancelado
                                  </Badge>
                                  {order.motivoCancelamento && (
                                    <span className="text-[10px] text-red-600 max-w-[140px] truncate mt-0.5" title={order.motivoCancelamento}>
                                      Motivo: {order.motivoCancelamento}
                                    </span>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right font-bold text-xs text-slate-900">
                              {formatCurrency(order.valorTotal)}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center text-xs">
                              {order.rawOrder ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedPedidoInfo(order.rawOrder!)}
                                    className="h-8 px-2.5 text-xs text-slate-600 hover:text-teal-700 hover:bg-teal-50 gap-1"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Ver
                                  </Button>
                                  {order.clienteTelefone && order.clienteTelefone !== "Não informado" && (
                                    <a
                                      href={`https://wa.me/55${order.clienteTelefone.replace(/\D/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center h-8 w-8 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                      title="Falar no WhatsApp"
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Carrinho
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <AbandonedCartsWidget lojaId={loja.id} />
          </TabsContent>
          )}
        </Tabs>

        {/* Cancel Confirmation Dialog */}
        <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                <Ban className="w-5 h-5" /> Confirmar Cancelamento
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja cancelar este pedido? Esta ação notificará o cliente e não poderá ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>Não, voltar</Button>
              <Button variant="destructive" onClick={() => {
                setShowCancelConfirm(false);
                setShowCancelReason(true);
              }}>Sim, cancelar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Reason Dialog */}
        <Dialog open={showCancelReason} onOpenChange={setShowCancelReason}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Motivo do Cancelamento</DialogTitle>
              <DialogDescription>
                Por favor, explique o motivo do cancelamento. É obrigatório e exige no mínimo 10 caracteres.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo</Label>
                <Textarea 
                  id="reason"
                  placeholder="Ex: Produto fora de estoque no momento..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="resize-none"
                  rows={4}
                />
                <p className="text-xs text-slate-500">
                  {cancelReason.length} / 10 caracteres mínimos
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCancelReason(false);
                setCancelReason("");
                setCancelOrderId(null);
              }}>Sair sem cancelar</Button>
              <Button 
                variant="destructive" 
                disabled={cancelReason.length < 10}
                onClick={() => {
                  if (cancelOrderId && cancelReason.length >= 10) {
                    updateOrderStatus(cancelOrderId, "Cancelado", cancelReason);
                    toast.success("Pedido cancelado com sucesso.");
                    setShowCancelReason(false);
                    setCancelReason("");
                    setCancelOrderId(null);
                  }
                }}
              >Confirmar Cancelamento</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Order Details Sheet */}
        <Sheet open={!!selectedPedidoInfo} onOpenChange={(open) => !open && setSelectedPedidoInfo(null)}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-slate-50">
            <SheetHeader className="pb-4 border-b border-slate-200 mb-6">
              <SheetTitle className="text-2xl font-bold flex items-center justify-between">
                <span>Detalhes do Pedido</span>
                <div className="flex items-center gap-2">
                  {selectedPedidoInfo && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePrint(selectedPedidoInfo)}
                      className="text-slate-600 font-bold"
                    >
                      <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </Button>
                  )}
                  <span className="text-sm font-normal text-slate-500">
                    {selectedPedidoInfo?.id}
                  </span>
                </div>
              </SheetTitle>
              <SheetDescription>
                Realizado em {selectedPedidoInfo && new Date(selectedPedidoInfo.data).toLocaleString("pt-BR")}
              </SheetDescription>
            </SheetHeader>

            {selectedPedidoInfo && (
              <div className="space-y-6">
                {/* Alerta de Cancelamento */}
                {selectedPedidoInfo.status?.toLowerCase().includes("cancelad") && (
                  <Card className="border-red-200 bg-red-50/70 shadow-sm">
                    <CardHeader className="pb-2 bg-red-100/50">
                      <CardTitle className="text-base font-bold text-red-800 flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        Pedido Cancelado
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3 text-sm">
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Motivo do Cancelamento:</p>
                      <p className="text-sm font-medium text-red-900 mt-1">
                        {selectedPedidoInfo.motivoCancelamento || selectedPedidoInfo.observacoes || (selectedPedidoInfo as any).anotacoes || "Motivo não informado."}
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {/* Cliente Info */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-2 bg-slate-100/50 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-800">
                      Dados do Cliente
                    </CardTitle>
                    {selectedPedidoInfo.cliente?.cnpj || selectedPedidoInfo.cliente?.tipoPessoa === "PJ" ? (
                      <Badge className="bg-blue-100 text-blue-800 border-none font-bold text-xs">
                        Pessoa Jurídica (CNPJ)
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-700 border-none font-bold text-xs">
                        Pessoa Física (CPF)
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4 text-sm space-y-2">
                    {selectedPedidoInfo.cliente?.cnpj || selectedPedidoInfo.cliente?.tipoPessoa === "PJ" ? (
                      <>
                        <p><span className="font-semibold text-slate-700">Razão Social:</span> {selectedPedidoInfo.cliente?.razaoSocial || selectedPedidoInfo.cliente?.nome}</p>
                        <p><span className="font-semibold text-slate-700">Nome Fantasia:</span> {selectedPedidoInfo.cliente?.nomeFantasia || selectedPedidoInfo.cliente?.nome}</p>
                        <p><span className="font-semibold text-slate-700">CNPJ:</span> {selectedPedidoInfo.cliente?.cnpj || "Não informado"}</p>
                        <p><span className="font-semibold text-slate-700">Responsável pela Compra:</span> {selectedPedidoInfo.cliente?.responsavelCompra || selectedPedidoInfo.cliente?.nome}</p>
                        <p>
                          <span className="font-semibold text-slate-700">Inscrição Estadual:</span>{" "}
                          {selectedPedidoInfo.cliente?.isentoIE || selectedPedidoInfo.cliente?.inscricaoEstadual === "ISENTO" ? (
                            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">Isento</span>
                          ) : (
                            selectedPedidoInfo.cliente?.inscricaoEstadual || "Não informada"
                          )}
                        </p>
                        {selectedPedidoInfo.cliente?.informacoesTributarias && (
                          <p>
                            <span className="font-semibold text-slate-700">Informações Tributárias:</span>{" "}
                            <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                              {selectedPedidoInfo.cliente?.informacoesTributarias}
                            </span>
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p><span className="font-semibold text-slate-700">Nome:</span> {selectedPedidoInfo.cliente?.nome}</p>
                        <p><span className="font-semibold text-slate-700">CPF:</span> {maskCpf(selectedPedidoInfo.cliente?.cpf || "")}</p>
                      </>
                    )}

                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Telefone / Celular:</span> 
                      {selectedPedidoInfo.cliente?.telefone}
                      {selectedPedidoInfo.cliente?.telefone && (
                        <a 
                          href={`https://wa.me/55${selectedPedidoInfo.cliente.telefone.replace(/\D/g, "")}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 p-1.5 rounded-full hover:bg-emerald-100 transition-colors"
                          title="Chamar no WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                    </p>
                    <p><span className="font-semibold text-slate-700">Email:</span> {selectedPedidoInfo.cliente?.email}</p>
                  </CardContent>
                </Card>

                {/* Produtos Info */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-2 bg-slate-100/50">
                    <CardTitle className="text-base font-semibold text-slate-800">
                      Produtos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {selectedPedidoInfo.produtos?.map((prod, idx) => (
                      <div key={idx} className="flex gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                        {prod.foto ? (
                          <img src={prod.foto} alt={prod.nome} className="w-16 h-16 object-cover rounded-md border border-slate-200" />
                        ) : (
                          <div className="w-16 h-16 bg-slate-200 rounded-md flex items-center justify-center text-slate-400">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                        <div className="flex-1 text-sm">
                          <p className="font-semibold text-slate-800">{prod.nome}</p>
                          <p className="text-slate-500 text-xs">SKU: {prod.sku}</p>
                          <p className="text-slate-500 text-xs mt-1">Qtde: {prod.qtd}</p>
                        </div>
                        <div className="text-right font-semibold text-slate-800">
                          R$ {(prod.valorUnitario || 0).toFixed(2).replace(".", ",")}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Valores Info */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-2 bg-slate-100/50">
                    <CardTitle className="text-base font-semibold text-slate-800">
                      Valores do Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subtotal Produtos</span>
                      <span>R$ {(selectedPedidoInfo.valores?.produtos || 0).toFixed(2).replace(".", ",")}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-600">Forma de Pagamento</span>
                      <span className="text-right">
                        {selectedPedidoInfo.pagamento.metodo} <br/>
                        <span className="text-xs text-slate-500">
                          ({selectedPedidoInfo.pagamento.metodo.toLowerCase().includes("entrega") || 
                            selectedPedidoInfo.pagamento.metodo.toLowerCase().includes("loja") ||
                            selectedPedidoInfo.pagamento.metodo.toLowerCase().includes("retirada")
                            ? "Na Loja/Entrega" 
                            : "Online"})
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-slate-600">Frete / Entrega</span>
                      <span>R$ {(selectedPedidoInfo.valores?.frete || 0).toFixed(2).replace(".", ",")}</span>
                    </div>
                    {(selectedPedidoInfo.valores?.desconto || 0) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto</span>
                        <span>- R$ {(selectedPedidoInfo.valores?.desconto || 0).toFixed(2).replace(".", ",")}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t border-slate-200 mt-2 pt-2">
                      <span>Total</span>
                      <span>R$ {(selectedPedidoInfo.valores?.total || 0).toFixed(2).replace(".", ",")}</span>
                    </div>
                  </CardContent>
                </Card>

              </div>
            )}
          </SheetContent>
        </Sheet>

      </div>
    </div>
  );
}

import { createFileRoute, Outlet, Link, useNavigate, CatchBoundary } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { useOrders } from "@/stores/orders";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Server,
  Paintbrush,
  Package,
  Webhook,
  LogOut,
  Store,
  DollarSign,
  ShoppingCart,
  ChevronDown,
  List,
  Plus,
  Users,
  BarChart3,
  FileUp,
  FileDown,
  Tag,
  Layers,
  Building2,
  Trash2,
  Megaphone,
  Gift,
  Ticket,
  Truck,
  Mail,
  Bell,
  Image,
  Eye,
  EyeOff,
  Code,
  Palette,
  Globe,
  Award,
  FileText,
  MailOpen,
  Share2,
  BarChart2,
  Inbox,
  User,
  Receipt,
  Settings,
  Menu,
  X,
  CreditCard,
  Cable,
  Sparkles,
  HeartPulse,
  Monitor,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";

const adminLoginSchema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido."),
  pass: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.")
});

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const Route = createFileRoute("/admin")({
  pendingComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-500 font-medium">Carregando...</span>
      </div>
    </div>
  ),
  component: AdminLayout,
});

// ---- Collapsible nav section ----
function NavSection({
  icon,
  label,
  children,
  open,
  onToggle,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {

  return (
    <div>
      <button
        onClick={disabled ? undefined : onToggle}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm font-bold rounded-lg transition-colors text-left ${disabled ? "opacity-60 cursor-not-allowed text-slate-600" : "text-slate-600 hover:text-primary hover:bg-primary/5"}`}
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0">{icon}</span>
          <span className="truncate">{label} {disabled && <span className="font-normal text-xs ml-1">(em breve)</span>}</span>
        </span>
        {!disabled && (
          <ChevronDown
            className={`h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {open && !disabled && (
        <div className="ml-4 pl-3 border-l border-slate-200 mt-1 mb-2 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

// ---- Sub link ----
const subLinkClass =
  "flex items-center gap-2.5 px-3 py-1.5 text-[13px] rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 [&.active]:bg-primary/10 [&.active]:text-primary transition-colors";


// ---- Inactivity Hook ----
function useInactivityTimeout(timeoutMs: number, onTimeout: () => void, isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    let timeoutId: NodeJS.Timeout;
    let lastActivity = Date.now();

    const resetTimer = () => {
      if (Date.now() - lastActivity > timeoutMs) {
         onTimeout();
         return;
      }
      lastActivity = Date.now();
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        onTimeout();
      }, timeoutMs);
    };

    resetTimer();

    let lastEventTime = 0;
    const handleEvent = () => {
      const now = Date.now();
      if (now - lastEventTime > 1000) {
        lastEventTime = now;
        resetTimer();
      }
    };
    
    const events = ['mousedown', 'keydown', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, handleEvent));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, handleEvent));
    };
  }, [timeoutMs, onTimeout, isActive]);
}

function AdminLayout() {
  const { currentUser, login, logout, register, users, pharmacies, hasPermission, activeStoreId, setActiveStoreId, grupos } = useAdmin();
  const can = (perm: string) => currentUser?.proprietario || hasPermission(perm);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openNavSection, setOpenNavSection] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [storeSelectorOpen, setStoreSelectorOpen] = useState(false);

  const { orders } = useOrders();
  const prevOrdersRef = useRef(orders);

  // Auto-logout por inatividade removido a pedido do usuário ("NUNCA DERRUBAR")


  useEffect(() => {
    setMounted(true);
    useAdmin.getState().restoreAdminSession();

    // Hard logout failsafe
    if (window.location.search.includes("logout")) {
      (window as any)._isLoggingOutAdmin = true;
      useAdmin.setState({ currentUser: null, activeStoreId: null });
      try {
        localStorage.removeItem("admin-storage-local");
      } catch (e) {}
      window.history.replaceState({}, document.title, "/admin");
      return;
    }

    // Carregar lojas do banco de dados (Supabase)
    const { loadPharmacies } = useAdmin.getState();
    loadPharmacies();

    // Carregar pedidos globais para popular dashboard, métricas e top 100
    useOrders.getState().loadOrders();

    // Carregar produtos removido para usar a paginação do React Query e do Catalog Service

    // Migration / Clean-up for old cached localStorage
    const currentUsers = useAdmin.getState().users;
    let updatedUsers = [...currentUsers];
    let needsUpdate = false;

    // Remove legacy admin user
    const adminIndex = updatedUsers.findIndex(u => u.email === "admin@associadas.com.br" || u.email === "administrador@associadas.com.br");
    if (adminIndex !== -1) {
      updatedUsers.splice(adminIndex, 1);
      needsUpdate = true;
    }

    // Ensure Nyckolas is proprietary admin
    const nyckIndex = updatedUsers.findIndex(u => u.email === "nyckolas.lopes@farmaciasassociadas.com.br");
    if (nyckIndex === -1) {
      updatedUsers.push({ id: "admin-1", name: "Nyckolas Lopes", email: "nyckolas.lopes@farmaciasassociadas.com.br", password: "Aspro@2026", grupoId: "grupo-admin", proprietario: true });
      needsUpdate = true;
    } else if (!updatedUsers[nyckIndex].proprietario || updatedUsers[nyckIndex].grupoId !== "grupo-admin") {
      updatedUsers[nyckIndex] = { ...updatedUsers[nyckIndex], grupoId: "grupo-admin", proprietario: true };
      needsUpdate = true;
    }

    // Ensure Thiago is proprietary admin
    const thiagoIndex = updatedUsers.findIndex(u => u.email === "thiago.rocha@farmaciasassociadas.com.br");
    if (thiagoIndex === -1) {
      updatedUsers.push({ id: "admin-2", name: "Thiago Rocha", email: "thiago.rocha@farmaciasassociadas.com.br", password: "Aspro@2026", grupoId: "grupo-admin", proprietario: true });
      needsUpdate = true;
    } else if (!updatedUsers[thiagoIndex].proprietario || updatedUsers[thiagoIndex].grupoId !== "grupo-admin" || updatedUsers[thiagoIndex].name !== "Thiago Rocha") {
      updatedUsers[thiagoIndex] = { ...updatedUsers[thiagoIndex], name: "Thiago Rocha", grupoId: "grupo-admin", proprietario: true };
      needsUpdate = true;
    }

    if (needsUpdate) {
      useAdmin.getState().setUsers(updatedUsers);
    }
  }, []);

  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined || Boolean(currentUser?.grupoId && grupos?.find(g => g.id === currentUser?.grupoId)?.permissao_total);
  const userStores = isGlobalAdmin 
      ? pharmacies 
      // @ts-ignore
      : pharmacies.filter(p => currentUser?.lojasVinculadas?.includes(p.id) || p.id === currentUser?.lojaId);

  // If user only has one store, auto-select it if none selected
  useEffect(() => {
    if (mounted && currentUser) {
      if (!isGlobalAdmin && userStores.length > 0 && !activeStoreId) {
        setActiveStoreId(userStores[0].id);
      }
    }
  }, [mounted, currentUser, isGlobalAdmin, userStores, activeStoreId, setActiveStoreId]);

  const activeStore = pharmacies.find(p => p.id === activeStoreId);
  const cat = activeStore?.categoriaAssociado?.toString().toLowerCase() || '';
  const isParceiro = cat === 'parceiro' || activeStore?.nome?.toLowerCase().includes('parceiro');
  const isPleno = cat === 'pleno' || cat === 'padrão' || cat === 'padrao' || activeStore?.nome?.toLowerCase().includes('pleno');
  const canDesign = !isGlobalAdmin && (isParceiro || isPleno || can('pers_logo') || can('pers_cores') || can('pers_banners') || can('pers_redes'));


  if (!mounted) return null;

  if (!currentUser) {
    return (
      <div className="min-h-screen flex bg-white">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-24 relative">
          <div className="w-full max-w-[400px] space-y-8">
            <div className="flex justify-start mb-12">
              <img src="/logo.png" alt="Farmácias Associadas" className="h-10 object-contain" />
            </div>

            <div className="space-y-2">
              <h1 className="text-[28px] font-bold text-[#1a1a1a]">Bem-vindo!</h1>
            </div>

            <form className="space-y-5" onSubmit={async (e) => {
              e.preventDefault();
              try {
                adminLoginSchema.parse({ email, pass });
              } catch (err) {
                if (err instanceof z.ZodError) {
                  toast.error(err.errors[0].message);
                  return;
                }
              }

              const result = await login(email, pass);
              if(!result.success) {
                toast.error(result.message || "Credenciais inválidas");
              } else {
                toast.success("Login realizado com sucesso!");
                navigate({ to: "/admin" });
              }
            }}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#1a1a1a]">E-mail *</label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Digite seu e-mail" 
                  className="h-12 bg-[#eaf2fd] border-transparent focus-visible:ring-primary/20"
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#1a1a1a]">Senha *</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={pass} 
                    onChange={(e) => setPass(e.target.value)} 
                    className="h-12 pr-10"
                    placeholder="Digite sua senha"
                    required 
                  />
                  <div 
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-slate-700 p-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full font-bold h-12 bg-primary hover:bg-primary/90 text-primary-foreground border-0">
                Entrar
              </Button>
            </form>



            <div className="text-center pt-2">
              <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Entre em contato com os administradores para alterar a sua senha"); }} className="text-sm font-semibold text-[#00bcd4] hover:underline">
                Esqueceu sua senha?
              </a>
            </div>
            
            <div className="text-center pt-8 text-xs text-slate-400 font-medium">
              Versão 1.0
            </div>
          </div>
        </div>

        {/* Right Side - Image Cover */}
        <div className="hidden lg:block lg:w-1/2 relative bg-slate-100">
          <img 
            src="/admin-login-cover.jpg" 
            alt="Farmácias Associadas Evento" 
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/10 to-transparent flex items-end p-16 pointer-events-none">
            {/* The previous text overlay was removed as requested to perfectly frame the image without covering it up too much */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden print:hidden bg-white border-b p-4 flex items-center justify-between sticky top-0 z-30">
        <div>
          <div className="text-lg font-bold text-primary">Painel Administrativo</div>
          <div className="text-xs text-muted-foreground mt-1">
            {isGlobalAdmin ? "Sede Administrativa" : (activeStoreId ? (() => {
              const store = pharmacies.find(p => p.id === activeStoreId);
                return store ? `${store.cidade || ''} - Admin ${store.nome}` : (isParceiro ? "Painel Administrativo" : "Farmácias Associadas");
              })() : (isParceiro ? "Painel Administrativo" : "Farmácias Associadas"))}
          </div>
        </div>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity" 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`print:hidden
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r h-screen flex flex-col transform transition-transform duration-300 ease-in-out
        md:static md:translate-x-0 md:sticky md:top-0
        ${mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}>
        <div className="p-6 border-b flex justify-between items-center bg-white">
          <div>
            <div className="text-lg font-bold text-primary">Painel Administrativo</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isGlobalAdmin ? "Sede Administrativa" : (activeStoreId ? (() => {
                const store = pharmacies.find(p => p.id === activeStoreId);
                return store ? `${store.cidade || ''} - Admin ${store.nome}` : (isParceiro ? "Painel Administrativo" : "Farmácias Associadas");
              })() : (isParceiro ? "Painel Administrativo" : "Farmácias Associadas"))}
            </div>
          </div>
          <button 
            className="md:hidden p-1.5 hover:bg-slate-100 rounded-md text-slate-500" 
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" onClick={(e) => {
          // If a link is clicked on mobile, close the menu
          if (window.innerWidth < 768 && (e.target as HTMLElement).closest('a')) {
            setMobileMenuOpen(false);
          }
        }}>
          {/* Dashboard */}
          {(can('dash_view') || !isGlobalAdmin) && (
            <Link to="/admin" className="flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 [&.active]:bg-primary/10 [&.active]:text-primary" activeOptions={{ exact: true }}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          )}

          {/* ---- ANÁLISES ---- */}
          {(can('dash_view') || !isGlobalAdmin) && (
            <NavSection icon={<BarChart2 className="h-4 w-4" />} label="Análises" open={openNavSection === "Análises"} onToggle={() => setOpenNavSection(openNavSection === "Análises" ? "" : "Análises")}>
              <Link to="/admin/metricas" className={subLinkClass}>
                Métricas de Pedidos
              </Link>
              {(can('rel_vendas_produto') || can('rel_vendas_canal') || can('rel_desempenho') || can('rel_financeiro') || can('rel_logistica_retirada') || can('rel_logistica_sla') || can('rel_estoque_controlados') || can('rel_estoque_abc') || !isGlobalAdmin) && (
                <Link to="/admin/relatorios" className={subLinkClass}>
                  Central de Relatórios
                </Link>
              )}
              <Link to="/admin/ao-vivo" className={subLinkClass}>
                Ao Vivo
              </Link>
            </NavSection>
          )}

          {/* ---- PEDIDOS ---- */}
          {(can('vendas_pedidos') || !isGlobalAdmin) && (
            <NavSection icon={<Inbox className="h-4 w-4" />} label="Pedidos" open={openNavSection === "Pedidos" || openNavSection === "Vendas"} onToggle={() => setOpenNavSection(openNavSection === "Pedidos" ? "" : "Pedidos")}>
              <Link to="/admin/pedidos" className={subLinkClass} activeOptions={{ exact: true }}>{isGlobalAdmin ? 'Pedidos Lojas' : 'Meus pedidos'}</Link>
              <Link to="/admin/carrinhos-abandonados" className={subLinkClass} activeOptions={{ exact: true }}>Carrinhos Abandonados</Link>
            </NavSection>
          )}

          {/* ---- LOJAS ---- */}
          {isGlobalAdmin && (can('lojas_todas') || can('lojas_nova') || can('lojas_tabelas') || can('lojas_paineis')) && (
            <NavSection 
              icon={<Store className="h-4 w-4" />} 
              label="Lojas" 
              open={openNavSection === "Lojas"} 
              onToggle={() => setOpenNavSection(openNavSection === "Lojas" ? "" : "Lojas")}
            >
              {can('lojas_todas') && <Link to="/admin/lojas" className={subLinkClass} activeOptions={{ exact: true }}>Ver todas</Link>}
              {can('lojas_nova') && <Link to="/admin/lojas/nova" className={subLinkClass} activeOptions={{ exact: true }}>Nova loja</Link>}
              {can('lojas_gerar') && <Link to={"/admin/lojas/gerar" as any} className={subLinkClass} activeOptions={{ exact: true }}>Gerar Loja</Link>}
              {can('lojas_link') && <Link to="/admin/lojas/link-inscricao" className={subLinkClass} activeOptions={{ exact: true }}>Link Inscrição Associado</Link>}
            </NavSection>
          )}

          {/* ---- LOGISTICA ---- */}
          {isGlobalAdmin && (
            <NavSection 
              icon={<Truck className="h-4 w-4" />} 
              label="Logística" 
              open={openNavSection === "Logística"} 
              onToggle={() => setOpenNavSection(openNavSection === "Logística" ? "" : "Logística")}
            >
              <Link to={"/admin/logistica" as any} className={subLinkClass} activeOptions={{ exact: true }}>Logística das lojas</Link>
              <Link to="/admin/produtos/estoque" className={subLinkClass} activeOptions={{ exact: true }}>Estoques</Link>
            </NavSection>
          )}

          {/* ---- PRODUTOS ---- */}
          {(can('prod_todos') || can('prod_novo') || can('prod_categorias') || can('prod_colecoes') || can('prod_filtros') || can('prod_marcas') || !isGlobalAdmin) && (
            <NavSection icon={<Package className="h-4 w-4" />} label="Produtos" open={openNavSection === "Produtos"} onToggle={() => setOpenNavSection(openNavSection === "Produtos" ? "" : "Produtos")}>
              {isGlobalAdmin ? (
                can('prod_todos') && <Link to="/admin/produtos" className={subLinkClass} activeOptions={{ exact: true }}>Ver todos</Link>
              ) : (
                <Link to="/admin/produtos" className={subLinkClass} activeOptions={{ exact: true }}>Catálogo Geral</Link>
              )}
              {!isGlobalAdmin && <Link to="/admin/produtos/precos" className={subLinkClass} activeOptions={{ exact: true }}>Meus Preços</Link>}
              {!isGlobalAdmin && <Link to="/admin/banners" search={{ tab: "vitrines" } as any} className={subLinkClass} activeOptions={{ exact: true }}>Minhas Vitrines</Link>}
              {isGlobalAdmin && can('prod_novo') && <Link to="/admin/produtos/novo" className={subLinkClass} activeOptions={{ exact: true }}>Novo produto</Link>}
              {can('prod_categorias') && <Link to="/admin/categorias" className={subLinkClass}>Categorias</Link>}
              {isGlobalAdmin && can('prod_marcas') && <Link to="/admin/marcas" className={subLinkClass}>Marcas</Link>}
              {isGlobalAdmin && can('prod_colecoes') && <Link to="/admin/colecoes" className={subLinkClass}>Vitrine de Produtos</Link>}
              {isGlobalAdmin && can('prod_filtros') && <Link to="/admin/filtros" className={subLinkClass}>Filtros</Link>}
            </NavSection>
          )}

          {/* ---- CLIENTES ---- */}
          {can('cli_todos') && (
            <NavSection icon={<User className="h-4 w-4" />} label="Clientes" open={openNavSection === "Clientes"} onToggle={() => setOpenNavSection(openNavSection === "Clientes" ? "" : "Clientes")}>
              <Link to="/admin/clientes" className={subLinkClass} activeOptions={{ exact: true }}>Ver todos</Link>
            </NavSection>
          )}






          {/* ---- MARKETING ---- */}
          {(can('mkt_cupons') || !isGlobalAdmin) && (
            <NavSection icon={<Megaphone className="h-4 w-4" />} label="Marketing" open={openNavSection === "Marketing"} onToggle={() => setOpenNavSection(openNavSection === "Marketing" ? "" : "Marketing")}>
              {(can('mkt_cupons') || !isGlobalAdmin) && <Link to="/admin/marketing/cupons" className={subLinkClass} activeOptions={{ exact: true }}>{isGlobalAdmin ? "Cupons das lojas" : "Meus cupons"}</Link>}
              {!isGlobalAdmin && <Link to="/admin/marketing/promocoes" className={subLinkClass} activeOptions={{ exact: true }}>Promoções</Link>}
              <Link to="/admin/marketing/leads" className={subLinkClass} activeOptions={{ exact: true }}>Leads</Link>
              {isGlobalAdmin && <Link to={"/admin/marketing/cores" as any} className={subLinkClass} activeOptions={{ exact: true }}>Cores das Lojas</Link>}
              {isGlobalAdmin && <Link to="/admin/produtos/precos" className={subLinkClass} activeOptions={{ exact: true }}>Campanha Encarte</Link>}
              {isGlobalAdmin && <Link to="/admin/selos" className={subLinkClass} activeOptions={{ exact: true }}>Selos</Link>}
              {isGlobalAdmin && <Link to="/admin/banners" search={{ tab: "banners" } as any} className={subLinkClass} activeOptions={{ exact: true }}>Banners das Lojas</Link>}
            </NavSection>
          )}


          {/* ---- DESIGN DA LOJA (para associados) ---- */}
          {canDesign && (
            <NavSection 
              icon={<Palette className="h-4 w-4" />} 
              label="Design da Loja" 
              open={openNavSection === "DesignGlobal"} 
              onToggle={() => setOpenNavSection(openNavSection === "DesignGlobal" ? "" : "DesignGlobal")}
            >
              {(isParceiro || isPleno || can('pers_logo')) && (
                <Link to="/admin/design/logo" className={subLinkClass} activeOptions={{ exact: true }}>
                  Logo e Favicon
                </Link>
              )}
              {(isParceiro || isPleno || can('pers_banners')) && (
                <Link to="/admin/banners" search={{ tab: "banners" }} className={subLinkClass} activeOptions={{ exact: true }}>
                  Meus Banners
                </Link>
              )}

              {(isParceiro || isPleno || can('pers_cores') || !isGlobalAdmin) && (
                <Link to="/admin/design/cores" className={subLinkClass} activeOptions={{ exact: true }}>
                  Minhas Cores
                </Link>
              )}
            </NavSection>
          )}



          {isGlobalAdmin && (
            <Link to="/admin/paginas-informativas" className="flex items-center gap-3 px-3 py-2 mt-2 text-sm font-bold rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 [&.active]:bg-primary/10 [&.active]:text-primary">
              <FileText className="h-4 w-4" /> Páginas Informativas
            </Link>
          )}

          {isGlobalAdmin && (
            <Link to="/admin/produtos/api-conexoes" className="flex items-center gap-3 px-3 py-2 mt-2 text-sm font-bold rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 [&.active]:bg-primary/10 [&.active]:text-primary">
              <Server className="h-4 w-4" /> API e Conexões
            </Link>
          )}

          {/* ---- CONFIGURAÇÕES ---- */}
          {(!isGlobalAdmin || can('conf_dados') || can('conf_dominios') || can('conf_pagamentos') || can('conf_usuarios')) && (
            <Link to="/admin/configuracoes" className="flex items-center gap-3 px-3 py-2 mt-2 text-sm font-bold rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 [&.active]:bg-primary/10 [&.active]:text-primary">
              <Settings className="h-4 w-4" /> Configurações
            </Link>
          )}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{currentUser.name.charAt(0)}</div>
            <div className="text-xs truncate">
              <div className="font-bold">{currentUser.name}</div>
              <div className="text-muted-foreground">{currentUser.email}</div>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
          {!isGlobalAdmin && (
              <button 
                onClick={() => {
                  if (activeStoreId) {
                    const activePharm = pharmacies.find(p => p.id === activeStoreId);
                    if (activePharm) {
                      window.open(`/${activePharm.slug || slugify(activePharm.nome)}`, '_blank');
                      return;
                    }
                  }
                  
                  // @ts-ignore
                  const userStores = pharmacies.filter(p => currentUser?.lojasVinculadas?.includes(p.id) || p.id === currentUser?.lojaId);
                  if (userStores.length === 1) {
                    window.open(`/${userStores[0].slug || slugify(userStores[0].nome)}`, '_blank');
                  } else if (userStores.length > 1) {
                    setStoreSelectorOpen(true);
                  } else {
                    window.open('/', '_blank');
                  }
                }}
                className="w-full block text-center mt-4 text-xs text-muted-foreground hover:underline"
              >
                Voltar à loja
              </button>
            )}
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden flex flex-col h-screen">
        {/* Top Header */}
        <header className="h-16 border-b bg-white flex items-center px-4 md:px-8 justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-slate-800 hidden md:block">
                Painel de Controle {activeStoreId && (() => {
                  const rawCat = pharmacies.find(p => p.id === activeStoreId)?.categoriaAssociado || "Pleno";
                  const cat = rawCat.toLowerCase() === 'padrão' || rawCat.toLowerCase() === 'padrao' ? "Pleno" : rawCat;
                  const colorClass = cat === "Parceiro" ? "text-orange-500 font-black" : "text-emerald-600 font-black";
                  return <span className={colorClass}> {cat}</span>;
                })()}
              </h1>
              {!activeStoreId && isGlobalAdmin && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 hidden md:block">
                  Sede Administrativa
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1 overflow-y-auto bg-slate-50 relative">
          <CatchBoundary
            getResetKey={() => "admin-error"}
            onCatch={(error) => console.error("Admin Page Error:", error)}
            errorComponent={({ error, reset }) => (
              <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center p-8">
                <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Erro ao carregar a página</h2>
                <p className="text-slate-600 mb-6 text-sm">
                  Ocorreu um problema e a página parou de responder. O seu acesso não foi perdido.
                </p>
                
                <div className="w-full bg-slate-100 text-slate-500 p-4 rounded-lg text-left overflow-auto text-xs font-mono mb-6 max-h-[150px]">
                  {error.message || "Erro desconhecido. Tente recarregar."}
                </div>

                <div className="flex gap-4 w-full justify-center">
                  <Button onClick={reset} size="lg" className="w-full">
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            )}
          >
            <Outlet />
          </CatchBoundary>
        </div>
      </main>
    </div>
  );
}
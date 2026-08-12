import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { useOrders } from "@/stores/orders";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  LayoutDashboard,
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

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleEvent = () => resetTimer();
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

  useInactivityTimeout(3 * 60 * 1000, () => {
    toast.error("Sessão expirada por inatividade. Faça login novamente.", { duration: 5000 });
    logout();
    setTimeout(() => window.location.reload(), 1000);
  }, !!currentUser);


  useEffect(() => {
    setMounted(true);
    
    // Verifica se a sessão atual do navegador já foi inicializada.
    // Se não, forçamos o logout para garantir que o usuário precise logar de novo
    // toda vez que abrir o painel após fechar a aba/navegador.
    if (!sessionStorage.getItem('fa_admin_session')) {
      sessionStorage.setItem('fa_admin_session', 'true');
      if (currentUser) {
        logout();
      }
    }
    
    // Carregar lojas do banco de dados (Supabase)
    const { loadPharmacies } = useAdmin.getState();
    loadPharmacies();

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

    // Ensure Eduardo is in the system without proprietary flag
    const eduardoIndex = updatedUsers.findIndex(u => u.email === "eduardo@ri.com.br");
    if (eduardoIndex === -1) {
      updatedUsers.push({ id: "admin-3", name: "Eduardo", email: "eduardo@ri.com.br", password: "Aspro@2026", grupoId: "grupo-admin", proprietario: false });
      needsUpdate = true;
    } else if (updatedUsers[eduardoIndex].proprietario || updatedUsers[eduardoIndex].grupoId !== "grupo-admin") {
      updatedUsers[eduardoIndex] = { ...updatedUsers[eduardoIndex], grupoId: "grupo-admin", proprietario: false };
      needsUpdate = true;
    }

    if (needsUpdate) {
      useAdmin.getState().setUsers(updatedUsers);
    }
  }, []);

  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined || Boolean(currentUser?.grupoId && grupos?.find(g => g.id === currentUser?.grupoId)?.permissao_total);
  const userStores = isGlobalAdmin 
      ? pharmacies 
      : pharmacies.filter(p => currentUser?.lojasVinculadas?.includes(p.id) || p.id === currentUser?.lojaId);

  // If user only has one store, auto-select it if none selected
  useEffect(() => {
    if (mounted && currentUser) {
      if (!isGlobalAdmin && userStores.length > 0 && !activeStoreId) {
        setActiveStoreId(userStores[0].id);
      }
    }
  }, [mounted, currentUser, isGlobalAdmin, userStores, activeStoreId, setActiveStoreId]);

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

              const success = await login(email, pass);
              if(!success) {
                toast.error("Credenciais inválidas");
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
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop" 
            alt="Pessoa feliz segurando medicamento" 
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00AFA9]/90 via-black/20 to-transparent flex items-end p-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white max-w-lg leading-tight drop-shadow-md">
              A maior rede associativa do país
            </h2>
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
              return store ? `${store.cidade || ''} - Admin ${store.nome}` : "Farmácias Associadas";
            })() : "Farmácias Associadas")}
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
                return store ? `${store.cidade || ''} - Admin ${store.nome}` : "Farmácias Associadas";
              })() : "Farmácias Associadas")}
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
            </NavSection>
          )}

          {/* ---- LOJAS ---- */}
          {(can('lojas_todas') || can('lojas_nova') || can('lojas_tabelas') || can('lojas_precos') || can('lojas_paineis') || !isGlobalAdmin) && (
            <NavSection 
              icon={isGlobalAdmin ? <Store className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />} 
              label={isGlobalAdmin ? "Lojas" : "Preços"} 
              open={openNavSection === (isGlobalAdmin ? "Lojas" : "Preços")} 
              onToggle={() => setOpenNavSection(openNavSection === (isGlobalAdmin ? "Lojas" : "Preços") ? "" : (isGlobalAdmin ? "Lojas" : "Preços"))}
            >
              {isGlobalAdmin && can('lojas_todas') && <Link to="/admin/lojas" className={subLinkClass} activeOptions={{ exact: true }}>Ver todas</Link>}
              {isGlobalAdmin && can('lojas_nova') && <Link to="/admin/lojas/nova" className={subLinkClass} activeOptions={{ exact: true }}>Nova loja</Link>}
              {isGlobalAdmin && can('lojas_gerar') && <Link to={"/admin/lojas/gerar" as any} className={subLinkClass} activeOptions={{ exact: true }}>Gerar Loja</Link>}
              {isGlobalAdmin && can('lojas_link') && <Link to="/admin/lojas/link-inscricao" className={subLinkClass} activeOptions={{ exact: true }}>Link Inscrição Associado</Link>}
              {!isGlobalAdmin && can('lojas_precos') && <Link to="/admin/produtos/precos" className={subLinkClass} activeOptions={{ exact: true }}>Meus preços</Link>}
            </NavSection>
          )}

          {/* ---- PRODUTOS ---- */}
          {(can('prod_todos') || can('prod_novo') || can('prod_categorias') || can('prod_colecoes') || can('prod_filtros') || can('prod_marcas') || !isGlobalAdmin) && (
            <NavSection icon={<Package className="h-4 w-4" />} label="Produtos" open={openNavSection === "Produtos"} onToggle={() => setOpenNavSection(openNavSection === "Produtos" ? "" : "Produtos")}>
              {(can('prod_todos') || !isGlobalAdmin) && <Link to="/admin/produtos" className={subLinkClass} activeOptions={{ exact: true }}>Ver todos</Link>}
              {isGlobalAdmin && can('prod_novo') && <Link to="/admin/produtos/novo" className={subLinkClass} activeOptions={{ exact: true }}>Novo produto</Link>}
              {isGlobalAdmin && can('prod_categorias') && <Link to="/admin/categorias" className={subLinkClass}>Categorias</Link>}
              {isGlobalAdmin && can('prod_marcas') && <Link to="/admin/marcas" className={subLinkClass}>Marcas</Link>}
              {(isGlobalAdmin && can('prod_colecoes')) && <Link to="/admin/colecoes" className={subLinkClass}>Vitrine de Produtos</Link>}
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
              {can('mkt_cupons') && <Link to="/admin/marketing/cupons" className={subLinkClass} activeOptions={{ exact: true }}>{isGlobalAdmin ? "Cupons das lojas" : "Meus cupons"}</Link>}
              {!isGlobalAdmin && <Link to="/admin/marketing/promocoes" className={subLinkClass} activeOptions={{ exact: true }}>Promoções</Link>}
              {isGlobalAdmin && <Link to="/admin/produtos/precos" className={subLinkClass} activeOptions={{ exact: true }}>Campanha Encarte</Link>}
            </NavSection>
          )}


          {/* ---- PERSONALIZAR MINHA LOJA (apenas para associados) ---- */}
          {!isGlobalAdmin && (
            <NavSection 
              icon={<Store className="h-4 w-4" />} 
              label="Personalizar Minha Loja" 
              open={openNavSection === "Personalizar"} 
              onToggle={() => setOpenNavSection(openNavSection === "Personalizar" ? "" : "Personalizar")}
            >
              <div className="px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-400 mt-1 mb-1">
                Design
              </div>
              <Link to="/admin/design/logo" className={subLinkClass} activeOptions={{ exact: true }}>
                Logo e Favicon
              </Link>
              <Link to="/admin/banners" search={{ tab: "banners" }} className={subLinkClass}>
                Banners
              </Link>
              <Link to="/admin/banners" search={{ tab: "estrutura" }} className={subLinkClass}>
                Estrutura da Loja
              </Link>
              {pharmacies.find(p => p.id === activeStoreId)?.categoriaAssociado === 'Parceiro' && (
                <Link to="/admin/banners" search={{ tab: "cores" } as any} className={subLinkClass}>
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
                  const userStores = pharmacies.filter(p => currentUser?.lojasVinculadas?.includes(p.id) || p.id === currentUser?.lojaId);
                  if (userStores.length === 1) {
                    window.open(`/${slugify(userStores[0].nome)}`, '_blank');
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
              <h1 className="font-bold text-slate-800 hidden md:block">Painel de Controle</h1>
              {activeStoreId ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 hidden md:block">
                  {pharmacies.find(p => p.id === activeStoreId)?.categoriaAssociado || "Padrão"}
                </span>
              ) : isGlobalAdmin ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 hidden md:block">
                  Sede Administrativa
                </span>
              ) : null}

            </div>
          </div>
          <div className="flex items-center gap-4">
              {(isGlobalAdmin || userStores.length > 0) && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 p-2 pr-3 rounded-xl shadow-lg border border-emerald-500/30">
                  <span className="text-[11px] font-black text-emerald-50 uppercase tracking-wider ml-2 hidden lg:flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Visualizar dados de:
                  </span>
                  <div className="w-[280px] md:w-[320px]">
                    <Select 
                      value={activeStoreId || "all"} 
                      onValueChange={(val) => setActiveStoreId(val === "all" ? null : val)}
                    >
                      <SelectTrigger className="h-10 bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold shadow-none focus:ring-white/50 rounded-lg transition-colors">
                        <SelectValue placeholder="Selecione a sua loja" />
                      </SelectTrigger>
                      <SelectContent>
                        {isGlobalAdmin && (
                          <SelectItem value="all">
                            <span className="font-bold">Todas as Lojas (Visão Global)</span>
                          </SelectItem>
                        )}
                        {userStores.map(loja => (
                          <SelectItem key={loja.id} value={loja.id}>
                            <span className="font-bold">{(loja as any).nomeFantasia || loja.nome}</span>
                            {loja.cidade && <span className="opacity-70 text-xs ml-2 font-normal">({loja.cidade})</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
        </header>

        <div className="p-4 md:p-8 flex-1 overflow-y-auto bg-slate-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

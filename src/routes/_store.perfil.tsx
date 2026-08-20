import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/stores/auth";
import { useFavorites } from "@/stores/favorites";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, KeyRound, Trash2, Plus, Home, Eye, EyeOff, Briefcase, Building2, Heart, Bell, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getGreeting, brl, productImage } from "@/lib/format";
import { toast } from "sonner";
import { catalog } from "@/services/catalog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export const Route = createFileRoute("/_store/perfil")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => {
    return {
      tab: search.tab as string | undefined,
    }
  },
  head: () => ({ meta: [{ title: "Meus Dados — Farmácias Associadas" }] }),
  component: PerfilPage,
});

const formatCpfCnpj = (value: string) => {
  if (!value) return "";
  let v = value.replace(/\D/g, "");
  if (v.length > 14) v = v.slice(0, 14);
  if (v.length <= 11) {
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
  }
  return v;
};

const formatPhone = (value: string) => {
  if (!value) return "";
  let v = value.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
  v = v.replace(/(\d)(\d{4})$/, "$1-$2");
  return v;
};

function PerfilPage() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const login = useAuth((s) => s.login);
  const { ids: favoriteIds, toggle: toggleFavorite, notifications: favNotifications, clearNotifications: clearFavNotifications } = useFavorites();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"dados" | "favoritos">(search.tab === "favoritos" ? "favoritos" : "dados");
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === "favoritos") {
      catalog.listProducts().then(all => {
        setFavoriteProducts(all.filter(p => favoriteIds.includes(p.id)));
      });
    }
  }, [activeTab, favoriteIds]);

  // Mocks for prototype
  const [addresses, setAddresses] = useState([
    { id: 1, type: "Casa", isPrincipal: true, rua: "Rua das Flores", numero: "123", bairro: "Centro", cidade: "Porto Alegre", estado: "RS", cep: "90000-000" }
  ]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddrCep, setNewAddrCep] = useState("");
  const [newAddrRua, setNewAddrRua] = useState("");
  const [newAddrNumero, setNewAddrNumero] = useState("");
  const [newAddrBairro, setNewAddrBairro] = useState("");
  const [newAddrCidade, setNewAddrCidade] = useState("");
  const [newAddrEstado, setNewAddrEstado] = useState("");
  const [newAddrType, setNewAddrType] = useState("Casa");
  const [newAddrPrincipal, setNewAddrPrincipal] = useState(false);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCpf, setEditCpf] = useState("");
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("senha123");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    setMounted(true);
    // Auth session is restored globally via useAuth._initListener() in __root.tsx
  }, []);

  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      
      const phoneStr = (user as any).telefone || (user as any).celular || (user as any).phone || "";
      setEditPhone(formatPhone(phoneStr));
      
      const cpfStr = (user as any).cpf || (user as any).cnpj || "";
      setEditCpf(formatCpfCnpj(cpfStr));
    }
  }, [user]);

  if (!mounted) return null;

  if (!user) {
    return (
      <div className="container-fa py-16 text-center">
        <h1 className="text-2xl font-bold">Acesse sua conta</h1>
        <p className="text-muted-foreground mt-2">Você precisa estar logado para ver seus dados.</p>
        <Link to="/login">
          <Button className="mt-6">Entrar</Button>
        </Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditCpf(formatCpfCnpj(e.target.value));
  };

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditPhone(formatPhone(e.target.value));
  };

  const handleSavePersonalInfo = async () => {
    if (!user) return;
    if (!editName.trim() || !editEmail.trim()) {
      toast.error("Nome e E-mail são obrigatórios.");
      return;
    }
    
    // Update profile in Supabase
    const { supabase } = await import("@/integrations/supabase/client");
    const userId = user?.id;
    if (userId) {
      await supabase.from("profiles").update({ nome: editName, telefone: editPhone, cpf: editCpf }).eq("id", userId);
    }
    toast.success("Informações pessoais atualizadas com sucesso!");
  };

  const handleUpdatePassword = () => {
    setPasswordError("");
    setPasswordSuccess("");
    
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }

    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongRegex.test(newPassword)) {
      setPasswordError("A senha deve ter pelo menos 8 caracteres, contendo maiúsculas, minúsculas, números e símbolos.");
      return;
    }

    // Mock success
    setPasswordSuccess("Senha atualizada com sucesso!");
    setCurrentPassword(newPassword);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (addresses.length >= 3) return;
    
    const newAddr = {
      id: Date.now(),
      type: newAddrType,
      isPrincipal: addresses.length === 0 ? true : newAddrPrincipal,
      rua: newAddrRua || "Rua Exemplo",
      numero: newAddrNumero || "S/N",
      bairro: newAddrBairro || "Bairro",
      cidade: newAddrCidade || "Cidade",
      estado: newAddrEstado || "RS",
      cep: newAddrCep || "00000-000"
    };

    if (newAddr.isPrincipal) {
      setAddresses(addresses.map(a => ({ ...a, isPrincipal: false })).concat(newAddr));
    } else {
      setAddresses([...addresses, newAddr]);
    }
    
    setShowAddressForm(false);
    setNewAddrCep("");
    setNewAddrRua("");
    setNewAddrNumero("");
    setNewAddrBairro("");
    setNewAddrCidade("");
    setNewAddrEstado("");
    setNewAddrType("Casa");
    setNewAddrPrincipal(false);
  };

  return (
    <div className="container-fa py-8 grid lg:grid-cols-[250px_1fr] gap-8">
      <aside className="space-y-2">
        <div className="bg-card border rounded-xl p-5 mb-6">
          <p className="text-xs text-muted-foreground font-bold tracking-wider mb-1">{getGreeting()}</p>
          <p className="font-bold text-lg leading-tight truncate">{user.name}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          <Button variant="outline" size="sm" className="w-full mt-4 text-xs font-bold" onClick={handleLogout}>
            Sair da conta
          </Button>
        </div>
        
        <nav className="flex flex-col gap-1">
          <Link to="/pedidos" className="px-4 py-2 text-muted-foreground hover:bg-muted font-bold rounded-lg text-sm">
            Meus Pedidos
          </Link>
          <button 
            onClick={() => setActiveTab("dados")} 
            className={`px-4 py-2 text-left font-bold rounded-lg text-sm transition ${activeTab === 'dados' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
          >
            Meus Dados
          </button>
          <button 
            onClick={() => setActiveTab("favoritos")} 
            className={`px-4 py-2 flex items-center justify-between text-left font-bold rounded-lg text-sm transition ${activeTab === 'favoritos' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <span>Meus Favoritos</span>
            {favoriteIds.length > 0 && (
              <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full">{favoriteIds.length}</span>
            )}
          </button>
        </nav>
      </aside>

      <main className="space-y-8">
        {activeTab === "dados" ? (
          <>
            <div>
              <h1 className="text-2xl font-bold mb-6">Meus Dados</h1>
              
              <form className="bg-card border rounded-xl p-5 shadow-sm space-y-4" onSubmit={e => e.preventDefault()}>
                <h2 className="font-bold text-lg border-b pb-2">Informações Pessoais</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <Label>Nome Completo ou Razão Social</Label>
                    <Input value={editName} onChange={e => setEditName(e.target.value)} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label>E-mail</Label>
                    <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} type="email" />
                  </div>
                  <div className="col-span-2 sm:col-span-2 grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>CPF ou CNPJ</Label>
                      <Input type="text" value={editCpf} onChange={handleCpfChange} placeholder="000.000.000-00 ou 00.000.000/0001-00" />
                    </div>
                    <div>
                      <Label>Celular / Telefone</Label>
                      <Input type="tel" value={editPhone} onChange={handleCelularChange} placeholder="(00) 00000-0000" />
                    </div>
                  </div>
                  <div className="col-span-2 mt-2">
                    <Button type="button" onClick={handleSavePersonalInfo}>Salvar Alterações</Button>
                  </div>
                </div>
              </form>
            </div>

            <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="font-bold text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Endereços de Entrega</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{addresses.length} de 3</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="border rounded-lg p-4 relative">
                    <div className="flex items-center justify-between mb-2 pr-6">
                      <div className="flex items-center gap-2">
                        {addr.type === "Trabalho" ? <Briefcase className="h-4 w-4 text-muted-foreground" /> :
                         addr.type === "Local" ? <Building2 className="h-4 w-4 text-muted-foreground" /> :
                         <Home className="h-4 w-4 text-muted-foreground" />}
                        <span className="font-bold text-sm">{addr.type}</span>
                      </div>
                      {addr.isPrincipal && (
                        <span className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">Principal</span>
                      )}
                    </div>
                    <p className="text-sm">{addr.rua}, {addr.numero}</p>
                    <p className="text-xs text-muted-foreground">{addr.bairro} - {addr.cidade}/{addr.estado}</p>
                    <p className="text-xs text-muted-foreground mt-1">CEP: {addr.cep}</p>
                    
                    <button 
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                      onClick={() => setAddresses(addresses.filter(a => a.id !== addr.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {addresses.length < 3 && !showAddressForm && (
                  <button 
                    onClick={() => setShowAddressForm(true)}
                    className="border border-dashed border-primary/50 text-primary hover:bg-primary/5 rounded-lg p-4 flex flex-col items-center justify-center min-h-[120px] transition"
                  >
                    <Plus className="h-6 w-6 mb-2" />
                    <span className="font-bold text-sm">Adicionar Novo Endereço</span>
                  </button>
                )}
              </div>

              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="border rounded-lg p-4 bg-muted/30 mt-4">
                  <h3 className="font-bold text-sm mb-3">Novo Endereço</h3>
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <div className="col-span-2 sm:col-span-1">
                      <Label>Tipo de Endereço</Label>
                      <Select value={newAddrType} onValueChange={setNewAddrType}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Casa">Casa</SelectItem>
                          <SelectItem value="Trabalho">Trabalho</SelectItem>
                          <SelectItem value="Local">Local</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label>CEP</Label>
                      <Input placeholder="00000-000" value={newAddrCep} onChange={e => setNewAddrCep(e.target.value)} />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label>Rua / Avenida</Label>
                      <Input placeholder="Nome da rua" value={newAddrRua} onChange={e => setNewAddrRua(e.target.value)} />
                    </div>
                    <div>
                      <Label>Número</Label>
                      <Input placeholder="Ex: 123" value={newAddrNumero} onChange={e => setNewAddrNumero(e.target.value)} />
                    </div>
                    <div>
                      <Label>Bairro</Label>
                      <Input placeholder="Seu bairro" value={newAddrBairro} onChange={e => setNewAddrBairro(e.target.value)} />
                    </div>
                    <div>
                      <Label>Cidade</Label>
                      <Input placeholder="Sua cidade" value={newAddrCidade} onChange={e => setNewAddrCidade(e.target.value)} />
                    </div>
                    <div>
                      <Label>Estado</Label>
                      <Select value={newAddrEstado} onValueChange={setNewAddrEstado}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RS">RS</SelectItem>
                          <SelectItem value="SC">SC</SelectItem>
                          <SelectItem value="PR">PR</SelectItem>
                          <SelectItem value="SP">SP</SelectItem>
                          <SelectItem value="RJ">RJ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="principal" checked={newAddrPrincipal} onCheckedChange={(c) => setNewAddrPrincipal(c as boolean)} />
                        <Label htmlFor="principal" className="text-sm font-normal">Tornar endereço principal</Label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddressForm(false)}>Cancelar</Button>
                    <Button type="submit">Salvar Endereço</Button>
                  </div>
                </form>
              )}
            </div>

            <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="font-bold text-lg flex items-center gap-2 border-b pb-2"><KeyRound className="h-5 w-5 text-primary" /> Alterar Senha</h2>
              <form className="grid sm:grid-cols-2 gap-4 max-w-xl" onSubmit={e => e.preventDefault()}>
                <div className="col-span-2">
                  <Label>Senha Atual</Label>
                  <div className="relative">
                    <Input 
                      type={showCurrentPassword ? "text" : "password"} 
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="pr-10" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label>Nova Senha</Label>
                  <div className="relative">
                    <Input type={showNewPassword ? "text" : "password"} className="pr-10" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    <button 
                      type="button" 
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label>Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input type={showConfirmPassword ? "text" : "password"} className="pr-10" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="col-span-2">
                  {passwordError && <p className="text-red-600 text-sm font-bold mb-2">{passwordError}</p>}
                  {passwordSuccess && <p className="text-green-600 text-sm font-bold mb-2">{passwordSuccess}</p>}
                  <Button type="button" onClick={handleUpdatePassword}>Atualizar Senha</Button>
                </div>
              </form>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="font-bold text-lg flex items-center gap-2 text-red-700 border-b border-red-200 pb-2"><Trash2 className="h-5 w-5" /> Excluir minha conta</h2>
              <p className="text-sm text-red-800">
                Ao excluir sua conta, todos os seus dados pessoais, endereços e histórico de pedidos serão removidos permanentemente. Esta ação não pode ser desfeita.
              </p>
              <ConfirmDialog {...({ children: undefined } as any)}
                title="Você tem certeza que deseja excluir sua conta pra sempre?"
                description="Você perderá todos os dados de pedidos já feitos e todas as configurações salvas. Esta ação é irreversível."
                confirmText="Sim, excluir conta"
                cancelText="Cancelar"
                onConfirm={async () => {
                  try {
                    const { supabase } = await import("@/integrations/supabase/client");
      // @ts-ignore
                    const { error } = await supabase.rpcsupabase.functions.invoke("delete_own_account" as any);
                    if (error) throw error;
                    toast.success("Conta excluída com sucesso.");
                    logout();
                    navigate({ to: "/" });
                  } catch (e: any) {
                    toast.error("Erro ao excluir conta: " + e.message);
                  }
                }}
              >
                <Button variant="destructive">
                  Excluir conta definitivamente
                </Button>
              </ConfirmDialog>
            </div>
          </>
        ) : (
          <div>
             <div className="flex items-center gap-2 mb-6">
                <h1 className="text-2xl font-bold">Meus Favoritos</h1>
                <Heart className="h-6 w-6 text-red-500 fill-red-500" />
             </div>
             {favNotifications.length > 0 && favoriteProducts.length > 0 && (
               <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-6 relative">
                 <button onClick={clearFavNotifications} className="absolute top-2 right-2 p-1 text-emerald-600 hover:bg-emerald-100 rounded-full transition-colors">
                   <X className="h-4 w-4" />
                 </button>
                 <ul className="text-sm text-emerald-700 space-y-3">
                   {favNotifications.map(n => {
                     const p = favoriteProducts.find(prod => prod.id === n.id);
                     if (!p) return null;
                     return (
                        <li key={n.id} className="flex flex-col gap-1">
                          <div className="font-bold flex items-center gap-1.5 text-base">
                            <Bell className="h-4 w-4 shrink-0" />
                            <span>O produto <strong>{p.nome}</strong> ficou mais barato!</span>
                          </div>
                          <div className="pl-5.5">
                            De <span className="line-through">{brl(n.oldPrice)}</span> para <strong>{brl(n.newPrice)}</strong> na farmácia <strong>{n.storeName}</strong>.
                          </div>
                        </li>
                     );
                   })}
                 </ul>
               </div>
             )}
             
             {favoriteProducts.length === 0 ? (
                <div className="bg-card border rounded-xl p-12 flex flex-col items-center justify-center text-center">
                  <div className="bg-red-50 p-4 rounded-full mb-4">
                    <Heart className="h-8 w-8 text-red-300" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">Nenhum favorito ainda</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">Você ainda não tem nenhum produto favoritado. Navegue pela loja e adicione os produtos que você mais gosta!</p>
                  <Button variant="outline" className="mt-6" onClick={() => navigate({ to: "/" })}>Continuar Comprando</Button>
                </div>
             ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {favoriteProducts.map(p => (
                     <div key={p.id} className="bg-card border rounded-xl p-4 flex flex-col gap-3 relative group hover:shadow-md transition-shadow">
                        <Link to="/p/$slug" params={{ slug: p.url || p.id }} className="flex-1 flex flex-col items-center text-center gap-3">
                           <div className="w-full bg-white rounded-lg p-2 aspect-square flex items-center justify-center mb-2">
                             <img src={productImage(p)} alt={p.nome} className="w-full h-full object-contain mix-blend-multiply" />
                           </div>
                           <h3 className="text-sm font-bold line-clamp-2 text-slate-800 leading-snug">{p.nome}</h3>
                           <div className="mt-auto pt-2">
                              {p.precoDe && <p className="text-xs text-muted-foreground line-through">{brl(p.precoDe)}</p>}
                              <p className="font-extrabold text-emerald-600 text-lg">{brl(p.precoPor)}</p>
                           </div>
                        </Link>
                        <button 
                          onClick={(e) => { e.preventDefault(); toggleFavorite(p.id); }}
                          className="absolute top-3 right-3 bg-white p-1.5 rounded-full shadow-sm text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 border border-slate-100"
                          title="Remover dos favoritos"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                     </div>
                  ))}
                </div>
             )}
          </div>
        )}
      </main>
    </div>
  );
}
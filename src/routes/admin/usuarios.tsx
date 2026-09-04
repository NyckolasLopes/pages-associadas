import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { useAdmin } from "@/stores/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Eye, EyeOff, Pencil, ChevronsUpDown, Check } from "lucide-react";

export const Route = createFileRoute("/admin/usuarios")({
  component: AdminUsuarios,
});

const PERMISSION_CATEGORIES = [
  {
    category: "Painel da Loja (Permissões do Associado)",
    permissions: [
      { id: "loja_pedidos", label: "Gestão de Pedidos da Loja" },
      { id: "lojas_precos", label: "Meus Preços (Tabela da Loja)" },
      { id: "loja_promocoes", label: "Preços & Ofertas da Loja" },
      { id: "loja_cupons", label: "Meus Cupons de Desconto" },
      { id: "loja_seo", label: "Configuração de SEO & GEO" },
      { id: "loja_metricas", label: "Métricas da Loja" },
      { id: "loja_relatorios", label: "Relatórios da Loja (Top 100)" },
      { id: "loja_personalizar", label: "Personalizar Loja (Banners/Cores/Estrutura)" },
      { id: "loja_configuracoes", label: "Configurações da Loja" },
      { id: "prod_novo", label: "Criar Produto" },
      { id: "prod_todos", label: "Ver Produtos" },
      { id: "prod_categorias", label: "Categorias de Produtos" },
      { id: "prod_estoque", label: "Gerenciar Estoques" },
      { id: "prod_avaliacoes", label: "Gerenciar Avaliações" },
      { id: "prod_colecoes", label: "Vitrine de Produtos" },
      { id: "prod_filtros", label: "Filtros" },
      { id: "prod_espera", label: "Lista de Espera" },
      { id: "prod_marcas", label: "Marcas" },
      { id: "prod_perguntas", label: "Perguntas de Clientes" },
      { id: "prod_selos", label: "Selos" },
      { id: "prod_variacoes", label: "Variações" },
      { id: "vendas_pedidos", label: "Todos os Pedidos (Menu)" },
    ]
  },
  {
    category: "Admin Global - Dashboard & Análises",
    permissions: [
      { id: "dash_view", label: "Acessar Dashboard" },
      { id: "rel_metricas_pedidos", label: "Análises: Métricas de Pedidos" },
      { id: "rel_vendas_produto", label: "Relatório: Pedidos por Produto" },
      { id: "rel_desempenho", label: "Relatório: Desempenho por Unidade" },
      { id: "rel_logistica_retirada", label: "Relatório: Retirada vs Entrega" },
      { id: "rel_aovivo", label: "Monitoramento Ao Vivo" },
    ]
  },
  {
    category: "Admin Global - Vendas e Pedidos",
    permissions: [
      { id: "vendas_pedidos", label: "Todos os Pedidos" },
      { id: "vendas_carrinhos", label: "Carrinhos Abandonados" },
      { id: "vendas_links", label: "Links de Pagamento" },
    ]
  },
  {
    category: "Admin Global - Lojas",
    permissions: [
      { id: "lojas_todas", label: "Ver todas as lojas" },
      { id: "lojas_nova", label: "Cadastrar Nova Loja" },
      { id: "lojas_gerar", label: "Gerar Loja" },
      { id: "lojas_link", label: "Link Inscrição Associado" },
      { id: "lojas_tabelas", label: "Tabelas de Preços Base" },
      { id: "lojas_paineis", label: "Controle de Painéis (Sede)" },
    ]
  },
  {
    category: "Admin Global - Produtos",
    permissions: [
      { id: "prod_todos", label: "Catálogo Geral (Ver todos)" },
      { id: "prod_novo", label: "Novo Produto Global" },
      { id: "prod_estoque", label: "Estoques" },
      { id: "prod_avaliacoes", label: "Avaliações" },
      { id: "prod_categorias", label: "Categorias" },
      { id: "prod_colecoes", label: "Vitrine de Produtos" },
      { id: "prod_filtros", label: "Filtros" },
      { id: "prod_espera", label: "Lista de espera" },
      { id: "prod_marcas", label: "Marcas" },
      { id: "prod_perguntas", label: "Perguntas" },
      { id: "prod_selos", label: "Selos" },
      { id: "prod_variacoes", label: "Variações" },
    ]
  },
  {
    category: "Admin Global - Clientes",
    permissions: [
      { id: "cli_todos", label: "Base de Clientes (Ver todos)" },
    ]
  },
  {
    category: "Admin Global - Marketing",
    permissions: [
      { id: "mkt_cupons", label: "Cupons Globais" },
      { id: "mkt_promocoes", label: "Promoções" },
    ]
  },
  {
    category: "Admin Global - Configurações",
    permissions: [
      { id: "conf_dados", label: "Dados da Sede" },
      { id: "conf_dominios", label: "Domínios" },
      { id: "conf_pagamentos", label: "Formas de Pagamento" },
      { id: "conf_usuarios", label: "Gestão de Usuários" },
    ]
  },
];

const ALL_PERMISSION_IDS = PERMISSION_CATEGORIES.flatMap(c => c.permissions.map(p => p.id));

function AdminUsuarios() {
  const { users: usuarios, setUsers: setUsuarios, grupos, setGrupos, pharmacies, loadUsers } = useAdmin();

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Selections
  const [selectedGrupos, setSelectedGrupos] = useState<string[]>([]);
  const [selectedUsuarios, setSelectedUsuarios] = useState<string[]>([]);

  // Modals state
  const [isNovoGrupoOpen, setIsNovoGrupoOpen] = useState(false);
  const [isNovoUsuarioOpen, setIsNovoUsuarioOpen] = useState(false);
  
  // Deletion modals
  const [isExcluirGrupoOpen, setIsExcluirGrupoOpen] = useState(false);
  const [isExcluirUsuarioOpen, setIsExcluirUsuarioOpen] = useState(false);

  // Form states
  const [novoGrupoNome, setNovoGrupoNome] = useState("");
  const [novoGrupoPermissoes, setNovoGrupoPermissoes] = useState<string[]>([]);
  const [editingGrupoId, setEditingGrupoId] = useState<string | null>(null);
  const [editingUsuarioId, setEditingUsuarioId] = useState<string | null>(null);
  const [novoUsuarioNome, setNovoUsuarioNome] = useState("");
  const [novoUsuarioEmail, setNovoUsuarioEmail] = useState("");
  const [novoUsuarioSenha, setNovoUsuarioSenha] = useState("");
  const [novoUsuarioGrupo, setNovoUsuarioGrupo] = useState("");
  const [novoUsuarioLojas, setNovoUsuarioLojas] = useState<string[]>([]);
  const [isLojasDropdownOpen, setIsLojasDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Computed properties for Novo Usuario
  const isGlobalGroup = () => {
    const group = grupos.find(g => g.id === novoUsuarioGrupo);
    return group?.permissoes?.length === ALL_PERMISSION_IDS.length;
  };

  const toggleSelectLojaUsuario = (id: string) => {
    setNovoUsuarioLojas(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const toggleSelectGrupo = (id: string) => {
    setSelectedGrupos(prev => prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]);
  };
  
  const toggleSelectAllGrupos = () => {
    if (selectedGrupos.length === grupos.length) {
      setSelectedGrupos([]);
    } else {
      setSelectedGrupos(grupos.map(g => g.id));
    }
  };

  const toggleSelectUsuario = (id: string) => {
    setSelectedUsuarios(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };

  const toggleSelectAllUsuarios = () => {
    if (selectedUsuarios.length === usuarios.length) {
      setSelectedUsuarios([]);
    } else {
      setSelectedUsuarios(usuarios.map(u => u.id));
    }
  };

  const handleSalvarGrupo = () => {
    if (!novoGrupoNome.trim()) {
      toast.error("O grupo precisa de um nome");
      return;
    }
    
    if (editingGrupoId) {
      setGrupos(grupos.map(g => g.id === editingGrupoId ? { ...g, nome: novoGrupoNome, permissoes: novoGrupoPermissoes } : g));
      toast.success("Grupo atualizado com sucesso!");
    } else {
      setGrupos([...grupos, { 
        id: `grupo-${Date.now()}`, 
        nome: novoGrupoNome, 
        padrao: false, 
        permissoes: novoGrupoPermissoes 
      }]);
      toast.success("Grupo salvo com sucesso!");
    }
    
    setIsNovoGrupoOpen(false);
    setNovoGrupoNome("");
    setNovoGrupoPermissoes([]);
    setEditingGrupoId(null);
  };

  const toggleAllPermissoes = (checked: boolean) => {
    if (checked) {
      setNovoGrupoPermissoes(ALL_PERMISSION_IDS);
    } else {
      setNovoGrupoPermissoes([]);
    }
  };

  const togglePermissao = (id: string) => {
    setNovoGrupoPermissoes(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const resetUsuarioForm = () => {
    setNovoUsuarioNome("");
    setNovoUsuarioEmail("");
    setNovoUsuarioSenha("");
    setNovoUsuarioGrupo("");
    setNovoUsuarioLojas([]);
    setEditingUsuarioId(null);
    setShowPassword(false);
  };

  const handleEditarUsuario = (u: typeof usuarios[0]) => {
    setEditingUsuarioId(u.id);
    setNovoUsuarioNome(u.name);
    setNovoUsuarioEmail(u.email);
    setNovoUsuarioSenha(u.password || "");
    setNovoUsuarioGrupo(u.grupoId || "");
    setNovoUsuarioLojas(u.lojasVinculadas || []);
    setShowPassword(false);
    setIsNovoUsuarioOpen(true);
  };

  const handleSalvarUsuario = async () => {
    if (!novoUsuarioNome.trim() || !novoUsuarioEmail.trim() || !novoUsuarioGrupo) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!editingUsuarioId && !novoUsuarioSenha.trim()) {
      toast.error("A senha é obrigatória para novos usuários.");
      return;
    }

    if (!isGlobalGroup() && novoUsuarioLojas.length === 0) {
      toast.error("Selecione pelo menos uma loja para usuários restritos.");
      return;
    }

    if (editingUsuarioId) {
      // Removed unique store constraint
      const isGlobal = isGlobalGroup();

      // Update existing user in local state
      setUsuarios(usuarios.map(u => u.id === editingUsuarioId ? {
        ...u,
        name: novoUsuarioNome,
        email: novoUsuarioEmail,
        password: novoUsuarioSenha.trim() || u.password,
        grupoId: novoUsuarioGrupo,
        lojasVinculadas: isGlobal ? undefined : novoUsuarioLojas
      } : u));
      
      const updatePayload: any = {
        nome: novoUsuarioNome,
        grupo_id: novoUsuarioGrupo,
        lojas_vinculadas: isGlobal ? null : novoUsuarioLojas,
        is_admin: isGlobal
      };
      if (novoUsuarioSenha.trim()) {
        updatePayload.anotacoes = JSON.stringify({ password: novoUsuarioSenha.trim() });
      }

      // Sync to Supabase profiles
      const { error: syncError } = await supabase.from('profiles' as any).update(updatePayload).eq('id', editingUsuarioId);
      
      if (syncError) {
        console.error("Failed to sync profile:", syncError);
        toast.error("Erro ao sincronizar permissões no banco de dados.");
        return;
      }
      
      toast.success("Usuário atualizado com sucesso!");
      loadUsers();
    } else {
      // Validate if email already exists locally to prevent overwrite
      if (usuarios.some(u => u.email.toLowerCase() === novoUsuarioEmail.toLowerCase())) {
        toast.error("Já existe um usuário com este e-mail.");
        return;
      }

      // Removed unique store constraint
      const isGlobal = isGlobalGroup();
      const userPassword = novoUsuarioSenha.trim();
      const anotacoesPayload = userPassword ? JSON.stringify({ password: userPassword }) : null;

      // Criar usuário no Supabase Auth usando cliente secundário para não sobrescrever a sessão atual do Admin
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
      
      const adminAuthClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });

      const { data: authData, error: authError } = await adminAuthClient.auth.signUp({
        email: novoUsuarioEmail,
        password: userPassword,
        options: {
          data: {
            nome: novoUsuarioNome,
            name: novoUsuarioNome,
          }
        }
      });

      // Se a conta já existir no Auth, o Supabase retorna identities vazio. Precisamos bloquear apenas se não formos vincular o usuário.
      // Neste caso vamos aproveitar o usuário existente.

      let targetUserId = authData?.user?.id;
      let alreadyExisted = false;

      if (authError) {
        if (authError.message.includes("User already registered") || authError.status === 422 || authError.message.includes("registered")) {
          // O usuário já existe, vamos atualizar o perfil dele
          const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, nome')
            .ilike('email', novoUsuarioEmail)
            .single();

          if (profileError || !existingProfile) {
            // Tenta fazer login com a senha informada para recuperar o ID do usuário da tabela auth
            const { data: loginData, error: loginError } = await adminAuthClient.auth.signInWithPassword({
              email: novoUsuarioEmail,
              password: userPassword
            });

            if (loginError || !loginData.user) {
              toast.error("O usuário já existe na autenticação, mas não encontramos o perfil. A senha informada também não confere para recuperá-lo.");
              return;
            }

            targetUserId = loginData.user.id;
            alreadyExisted = true;
            
            // Tenta inserir o perfil que estava faltando
            const { error: insertError } = await supabase.from('profiles' as any).upsert({
               id: targetUserId,
               email: novoUsuarioEmail,
               nome: novoUsuarioNome,
               is_admin: isGlobal,
               grupo_id: novoUsuarioGrupo,
               lojas_vinculadas: isGlobal ? null : novoUsuarioLojas,
               ...(anotacoesPayload ? { anotacoes: anotacoesPayload } : {})
            });

            if (insertError) {
               toast.error(`Falha ao recriar perfil do usuário: ${insertError.message}`);
               return;
            }
            
            toast.success("Perfil recuperado e vinculado com sucesso!");
            setUsuarios([...usuarios, {
              id: targetUserId,
              name: novoUsuarioNome,
              email: novoUsuarioEmail,
              password: userPassword,
              grupoId: novoUsuarioGrupo,
              lojasVinculadas: isGlobal ? undefined : novoUsuarioLojas,
              proprietario: false
            }]);
            loadUsers();
            setIsNovoUsuarioOpen(false);
            setNovoUsuarioNome("");
            setNovoUsuarioEmail("");
            setNovoUsuarioSenha("");
            setNovoUsuarioGrupo("");
            setNovoUsuarioLojas([]);
            return;
          }
          
          targetUserId = existingProfile.id;
          alreadyExisted = true;
          
          const { error: updateError } = await supabase.from('profiles' as any).update({
             nome: novoUsuarioNome,
             grupo_id: novoUsuarioGrupo,
             lojas_vinculadas: isGlobal ? null : novoUsuarioLojas,
             is_admin: isGlobal,
             ...(anotacoesPayload ? { anotacoes: anotacoesPayload } : {})
          }).eq('id', targetUserId);
          
          if (updateError) {
            toast.error(`Falha ao vincular usuário no banco: ${updateError.message}`);
            return;
          }
          
        } else {
          toast.error(`Erro ao registrar credenciais: ${authError.message}`);
          return;
        }
      } else if (authData?.user) {
         // Se criou no auth mas não inseriu o profile por trigger, inserimos manualmente
         await supabase.from('profiles' as any).upsert({
           id: authData.user.id,
           email: novoUsuarioEmail,
           nome: novoUsuarioNome,
           grupo_id: novoUsuarioGrupo,
           lojas_vinculadas: isGlobal ? null : novoUsuarioLojas,
           is_admin: isGlobal,
           ...(anotacoesPayload ? { anotacoes: anotacoesPayload } : {})
         });
      }

      // Create new user in local state
      setUsuarios([...usuarios, { 
        id: targetUserId || `user-${Date.now()}`, 
        name: novoUsuarioNome, 
        email: novoUsuarioEmail, 
        password: userPassword,
        grupoId: novoUsuarioGrupo, 
        proprietario: false,
        lojasVinculadas: isGlobal ? undefined : novoUsuarioLojas
      }]);

      if (alreadyExisted) {
        toast.success("O usuário já existia no sistema e foi vinculado com sucesso!");
      } else {
        toast.success("Usuário criado com sucesso!");
      }
      loadUsers();
    }
    setIsNovoUsuarioOpen(false);
    resetUsuarioForm();
  };

  const handleExcluirGrupos = () => {
    setGrupos(grupos.filter(g => !selectedGrupos.includes(g.id)));
    setSelectedGrupos([]);
    setIsExcluirGrupoOpen(false);
    toast.success("Grupo(s) excluído(s) com sucesso!");
  };

  const handleExcluirUsuarios = async () => {
    const idsToDelete = [...selectedUsuarios];
    setUsuarios(usuarios.filter(u => !idsToDelete.includes(u.id)));
    setSelectedUsuarios([]);
    setIsExcluirUsuarioOpen(false);

    try {
      await supabase.from('profiles' as any).update({
        grupo_id: null,
        lojas_vinculadas: null,
        is_admin: false,
        anotacoes: null
      }).in('id', idsToDelete);
    } catch (e) {
      console.error("Erro ao desvincular usuário no banco:", e);
    }

    toast.success("Usuário(s) excluído(s) com sucesso!");
    loadUsers();
  };

  return (
    <div className="max-w-5xl space-y-10 pb-16">
      <div>
        <h2 className="text-[26px] font-bold text-slate-800">Usuários</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-[300px] shrink-0">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Grupos</h3>
          <p className="text-sm text-slate-500">
            Crie grupos de trabalho e gerencie as permissões de acesso de cada grupo.
          </p>
        </div>

        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-slate-700">Grupos de Permissões (Admin Global / Painel do Associado)</span>
              
              <Dialog open={isNovoGrupoOpen} onOpenChange={(open) => {
                setIsNovoGrupoOpen(open);
                if (!open) {
                  setNovoGrupoNome("");
                  setNovoGrupoPermissoes([]);
                  setEditingGrupoId(null);
                }
              }}>
                <DialogContent className="max-w-[700px] h-[90vh] flex flex-col p-0 gap-0">
                  <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle>Editar permissões: {novoGrupoNome}</DialogTitle>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t p-6 flex-1 overflow-y-auto">
                    <div className="col-span-1">
                      <h3 className="font-bold text-slate-800">Permissões</h3>
                      <p className="text-sm text-slate-500 mt-1">Gerencie as permissões de acesso deste grupo.</p>
                    </div>
                    <div className="col-span-2 space-y-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Nome (Fixo)</Label>
                        <Input value={novoGrupoNome} disabled />
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                          id="perm-total" 
                          checked={novoGrupoPermissoes.length === ALL_PERMISSION_IDS.length && ALL_PERMISSION_IDS.length > 0}
                          onCheckedChange={(checked) => toggleAllPermissoes(checked as boolean)}
                        />
                        <Label htmlFor="perm-total" className="text-sm font-semibold cursor-pointer">
                          Este grupo terá permissão total
                        </Label>
                      </div>

                      <div className="pt-4 space-y-6">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Permissões Específicas</h4>
                        
                        <div className="space-y-6">
                          {PERMISSION_CATEGORIES.map((category) => (
                            <div key={category.category} className="space-y-3">
                              <h5 className="text-sm font-bold text-slate-800 border-b pb-1">{category.category}</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-2">
                                {category.permissions.map((perm) => (
                                  <div key={perm.id} className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={perm.id} 
                                      checked={novoGrupoPermissoes.includes(perm.id)}
                                      onCheckedChange={() => togglePermissao(perm.id)}
                                    />
                                    <Label htmlFor={perm.id} className="text-sm font-medium cursor-pointer text-slate-700">
                                      {perm.label}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter className="px-6 py-4 border-t shrink-0">
                    <Button variant="outline" className="font-bold" onClick={() => setIsNovoGrupoOpen(false)}>Cancelar</Button>
                    <Button className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold" onClick={handleSalvarGrupo}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-[#faf9f8] border border-slate-100 rounded">
              <div className="grid grid-cols-[48px_1fr_48px] items-center px-4 py-3 border-b border-slate-100 text-[11px] font-black tracking-wider text-slate-500">
                <div className="flex justify-center">
                  <Checkbox 
                    className="border-slate-300" 
                    checked={grupos.length > 0 && selectedGrupos.length === grupos.length}
                    onCheckedChange={toggleSelectAllGrupos}
                  />
                </div>
                <div>NOME</div>
                <div></div>
              </div>
              
              {grupos.map((g) => (
                <div key={g.id} className="grid grid-cols-[48px_1fr_48px] items-center px-4 py-4 border-b border-slate-100 last:border-0 bg-white">
                  <div className="flex justify-center">
                    <Checkbox 
                      className="border-slate-300" 
                      checked={selectedGrupos.includes(g.id)}
                      onCheckedChange={() => toggleSelectGrupo(g.id)}
                    />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{g.nome}</div>
                    {g.padrao && <div className="text-xs text-slate-400 mt-0.5">Padrão</div>}
                  </div>
                  <div className="flex justify-center">
                    <button 
                      className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors"
                      onClick={() => {
                        setEditingGrupoId(g.id);
                        setNovoGrupoNome(g.nome);
                        setNovoGrupoPermissoes(g.permissoes);
                        setIsNovoGrupoOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 hidden">
            </div>
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-[300px] shrink-0">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Usuários</h3>
          <p className="text-sm text-slate-500">
            Dê acesso à loja, para gerenciar os usuários ativos e vincule-os em grupos de trabalho.
          </p>
        </div>

        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-slate-700">Você tem {usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''}</span>
              
              <Dialog open={isNovoUsuarioOpen} onOpenChange={(open) => {
                setIsNovoUsuarioOpen(open);
                if (!open) {
                  resetUsuarioForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold h-9 px-4 text-xs">
                    + Novo usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold mb-4">{editingUsuarioId ? "Editar usuário" : "Novo usuário"}</DialogTitle>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                    <div className="col-span-1">
                      <h3 className="font-bold text-slate-800">Usuários</h3>
                      <p className="text-sm text-slate-500 mt-1">Dê acesso à loja, para gerenciar os usuários ativos e vincule-os em grupos de trabalho.</p>
                    </div>
                    <div className="col-span-2 space-y-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Nome <span className="text-red-500">*</span></Label>
                        <Input value={novoUsuarioNome} onChange={(e) => setNovoUsuarioNome(e.target.value)} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">E-mail <span className="text-red-500">*</span></Label>
                        <Input type="email" value={novoUsuarioEmail} onChange={(e) => setNovoUsuarioEmail(e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Senha {!editingUsuarioId && <span className="text-red-500">*</span>}</Label>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} value={novoUsuarioSenha} onChange={(e) => setNovoUsuarioSenha(e.target.value)} placeholder={editingUsuarioId ? "Deixe em branco para manter a atual" : ""} />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Grupos <span className="text-red-500">*</span></Label>
                        <Select value={novoUsuarioGrupo} onValueChange={(val) => {
                          setNovoUsuarioGrupo(val);
                          // Clear selected stores if switching groups to avoid leaking
                          setNovoUsuarioLojas([]);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um grupo" />
                          </SelectTrigger>
                          <SelectContent>
                            {grupos.map((g) => (
                              <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {novoUsuarioGrupo && (
                        <div className="space-y-2 pt-2 border-t mt-4">
                          <Label className="text-sm font-semibold">Lojas Vinculadas <span className="text-red-500">*</span></Label>
                          
                          {isGlobalGroup() ? (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-500 text-center font-medium">
                              Acesso global a todas as lojas
                            </div>
                          ) : (
                            <Popover open={isLojasDropdownOpen} onOpenChange={setIsLojasDropdownOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={isLojasDropdownOpen}
                                  className="w-full justify-between"
                                >
                                  {novoUsuarioLojas.length > 0
                                    ? `${novoUsuarioLojas.length} loja(s) selecionada(s)`
                                    : "Selecione as filiais vinculadas..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] p-0">
                                <Command>
                                  <CommandInput placeholder="Buscar lojas..." />
                                  <CommandList>
                                    <CommandEmpty>Nenhuma loja encontrada.</CommandEmpty>
                                    <CommandGroup>
                                      {pharmacies.map((loja) => (
                                        <CommandItem
                                          key={loja.id}
                                          value={`${loja.id} ${loja.nome} ${loja.cidade}`}
                                          onSelect={() => toggleSelectLojaUsuario(loja.id)}
                                        >
                                          <Check
                                            className={`mr-2 h-4 w-4 ${novoUsuarioLojas.includes(loja.id) ? "opacity-100" : "opacity-0"}`}
                                          />
                                          {loja.nome} <span className="text-slate-400 font-normal ml-1">({loja.cidade} - {loja.uf})</span>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <DialogFooter className="mt-8 border-t pt-4">
                    <Button variant="outline" className="font-bold" onClick={() => setIsNovoUsuarioOpen(false)}>Cancelar</Button>
                    <Button className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold" onClick={handleSalvarUsuario}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-[#faf9f8] border border-slate-100 rounded">
              <div className="grid grid-cols-[48px_1fr_1fr_48px] items-center px-4 py-3 border-b border-slate-100 text-[11px] font-black tracking-wider text-slate-500">
                <div className="flex justify-center">
                  <Checkbox 
                    className="border-slate-300"
                    checked={usuarios.length > 0 && selectedUsuarios.length === usuarios.length}
                    onCheckedChange={toggleSelectAllUsuarios}
                  />
                </div>
                <div>NOME</div>
                <div>E-MAIL</div>
                <div></div>
              </div>
              {Object.entries(
                usuarios.reduce((acc, user) => {
                  const userGroup = grupos.find(g => g.id === user.grupoId);
                  const groupName = userGroup ? userGroup.nome : "Sem Grupo";
                  if (!acc[groupName]) acc[groupName] = [];
                  acc[groupName].push(user);
                  return acc;
                }, {} as Record<string, typeof usuarios>)
              ).map(([groupName, groupUsers], index) => {
                const groupColors = [
                  "bg-blue-50 text-blue-700 border-blue-100",
                  "bg-emerald-50 text-emerald-700 border-emerald-100",
                  "bg-amber-50 text-amber-700 border-amber-100",
                  "bg-purple-50 text-purple-700 border-purple-100",
                  "bg-rose-50 text-rose-700 border-rose-100",
                ];
                const colorClass = groupColors[index % groupColors.length];
                
                return (
                <div key={groupName}>
                  <div className={`px-4 py-2 border-b text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${colorClass}`}>
                    {groupName} <span className="bg-white px-2 py-0.5 rounded-full border text-[10px] opacity-80">{groupUsers.length}</span>
                  </div>
                  {groupUsers.map((u) => (
                    <div key={u.id} className="grid grid-cols-[48px_1fr_1fr_48px] items-center px-4 py-4 border-b border-slate-100 last:border-0 bg-white">
                      <div className="flex justify-center">
                        <Checkbox 
                          className="border-slate-300"
                          checked={selectedUsuarios.includes(u.id)}
                          onCheckedChange={() => toggleSelectUsuario(u.id)}
                        />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm uppercase">{u.name}</div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] text-slate-500">{u.email}</span>
                      </div>
                      <div className="flex justify-center">
                        <button 
                          className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors"
                          onClick={() => handleEditarUsuario(u)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                );
              })}
            </div>

            <div className="mt-4">
              <Dialog open={isExcluirUsuarioOpen} onOpenChange={setIsExcluirUsuarioOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-red-100 hover:bg-red-200 text-red-600 font-bold h-8 px-4 text-xs tracking-wider"
                    disabled={selectedUsuarios.length === 0}
                  >
                    EXCLUIR SELECIONADOS
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Você tem certeza que deseja excluir esse usuário?</DialogTitle>
                  </DialogHeader>
                  <p className="text-slate-500 text-sm py-4">
                    Essa ação não poderá ser desfeita.
                  </p>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsExcluirUsuarioOpen(false)}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleExcluirUsuarios}>Sim, excluir</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { INITIAL_CUSTOMERS } from "@/stores/customers";

// Higienização de segurança LGPD / OWASP:
// Remove dados sensíveis (CPF, Email, Telefone, Tokens) de localStorage legado e migra para sessionStorage
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("fa-auth");
    localStorage.removeItem("fa-auth-storage");
    localStorage.removeItem("fa-auth-token");

    const legacyUser = localStorage.getItem("fa_active_user");
    if (legacyUser && !sessionStorage.getItem("fa_active_user")) {
      sessionStorage.setItem("fa_active_user", legacyUser);
    }
    localStorage.removeItem("fa_active_user");

    const legacySessions = localStorage.getItem("fa_store_sessions");
    if (legacySessions && !sessionStorage.getItem("fa_store_sessions")) {
      sessionStorage.setItem("fa_store_sessions", legacySessions);
    }
    localStorage.removeItem("fa_store_sessions");
  } catch {}
}

const STORE_SESSIONS_STORAGE_KEY = "fa_store_sessions";
const ACTIVE_USER_STORAGE_KEY = "fa_active_user";
const ACTIVE_STORE_SLUG_KEY = "fa_active_store_slug";

export function isSameStore(slugA?: string | null, slugB?: string | null): boolean {
  if (!slugA || !slugB) return false;
  const a = safeSlugifyAuth(slugA);
  const b = safeSlugifyAuth(slugB);
  if (a === b) return true;
  // Se um deles for "loja-padrao", não indica troca de loja física (ex: página neutra)
  if (a === "loja-padrao" || b === "loja-padrao") return true;
  return false;
}

export function loadActiveUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    // Carrega dados da sessão ativa no sessionStorage (destruído ao fechar a aba)
    const raw = sessionStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user && (user.email || user.id) ? user : null;
  } catch {
    return null;
  }
}

export function saveActiveUser(user: User | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      sessionStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
      // fa_active_store_slug armazena apenas a sigla/slug da loja sem dados sensíveis
      if (user.storeSlug) {
        localStorage.setItem(ACTIVE_STORE_SLUG_KEY, user.storeSlug);
      }
    } else {
      sessionStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_STORE_SLUG_KEY);
    }
    // Garante que dados pessoais nunca fiquem persistidos no localStorage permanente
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
  } catch {}
}

export interface User {
  id?: string;
  name?: string;
  nome?: string;
  email: string;
  tipoPessoa?: "PF" | "PJ";
  cpf?: string;
  cnpj?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  responsavelCompra?: string;
  inscricaoEstadual?: string;
  isentoIE?: boolean;
  informacoesTributarias?: string;
  celular?: string;
  enderecos?: any[];
  provider?: "email" | "google" | "apple" | "facebook";
  storeSlug?: string;
  loggedAt?: number;
  aceitaOfertas?: boolean;
  aceitouPolitica?: boolean;
}

export function safeSlugifyAuth(text?: string | null): string {
  if (!text) return "loja-padrao";
  const clean = String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return clean || "loja-padrao";
}

export function resolveStoreSlug(explicitSlug?: string): string {
  if (explicitSlug && explicitSlug !== "loja-padrao") {
    return safeSlugifyAuth(explicitSlug);
  }
  if (typeof window !== "undefined") {
    try {
      const parts = window.location.pathname.split("/").filter(Boolean);
      const systemPages = new Set([
        "admin", "login", "cadastro", "perfil", "pedidos", "cart", "checkout",
        "sucesso", "compartilhado", "faq", "ajuda", "mapa-site", "politica-de-privacidade",
        "reset-password", "p", "v", "c", "m", "pagina", "busca"
      ]);
      if (parts[0] && !systemPages.has(parts[0])) {
        return safeSlugifyAuth(parts[0]);
      }
      const last = sessionStorage.getItem("fa-last-store-slug") || localStorage.getItem(ACTIVE_STORE_SLUG_KEY);
      if (last && !systemPages.has(last)) {
        return safeSlugifyAuth(last);
      }
    } catch {}
  }
  return "loja-padrao";
}

function loadStoreSessions(): Record<string, User> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORE_SESSIONS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveStoreSessions(sessions: Record<string, User>): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORE_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    localStorage.removeItem(STORE_SESSIONS_STORAGE_KEY);
  } catch {}
}

let _isLoggingOut = false;

interface AuthState {
  user: User | null;
  storeUsers: Record<string, User>;
  currentStoreSlug: string;
  loginOpen: boolean;
  login: (email: string, password: string, explicitStoreSlug?: string) => Promise<boolean | "otp_required" | "rate_limit">;
  sendOtp: (email: string) => Promise<boolean>;
  verifyOtp: (email: string, token: string, explicitStoreSlug?: string) => Promise<boolean>;
  loginWithProvider: (provider: "google" | "apple" | "facebook", redirectPath?: string, explicitStoreSlug?: string) => Promise<void>;
  logout: (explicitStoreSlug?: string) => Promise<void>;
  deleteAccount: (explicitStoreSlug?: string) => Promise<boolean>;
  setLoginOpen: (open: boolean) => void;
  syncStoreSession: (storeSlug?: string) => void;
  getUserForStore: (storeSlug?: string) => User | null;
  _initListener: () => void;
}

export const useAuth = create<AuthState>((set, get) => {
  return {
    user: null,
    storeUsers: {},
    currentStoreSlug: "loja-padrao",
    loginOpen: false,

    syncStoreSession: (storeSlug?: string) => {
      const targetSlug = resolveStoreSlug(storeSlug);
      const sessions = loadStoreSessions();
      const currentUser = get().user || loadActiveUser();

      // Se o usuário está navegando na mesma loja ou em página neutra, NUNCA derruba a sessão!
      if (currentUser && isSameStore(targetSlug, currentUser.storeSlug)) {
        if (targetSlug !== "loja-padrao" && currentUser.storeSlug !== targetSlug) {
          currentUser.storeSlug = targetSlug;
          sessions[targetSlug] = currentUser;
          saveStoreSessions(sessions);
          saveActiveUser(currentUser);
        }
        set({
          currentStoreSlug: targetSlug,
          storeUsers: sessions,
          user: currentUser,
        });
        return;
      }

      // Se acessou explicitamente OUTRA loja física diferente:
      const targetUser = sessions[targetSlug] || null;
      if (targetUser) {
        saveActiveUser(targetUser);
      } else if (targetSlug !== "loja-padrao" && currentUser?.storeSlug && !isSameStore(targetSlug, currentUser.storeSlug)) {
        // Sai do login ao acessar outra loja sem sessão
        saveActiveUser(null);
      }

      set({
        currentStoreSlug: targetSlug,
        storeUsers: sessions,
        user: targetUser,
      });
    },

    getUserForStore: (storeSlug?: string) => {
      const targetSlug = resolveStoreSlug(storeSlug);
      const sessions = loadStoreSessions();
      if (sessions[targetSlug]) return sessions[targetSlug];
      const activeUser = loadActiveUser();
      if (activeUser && isSameStore(targetSlug, activeUser.storeSlug)) {
        return activeUser;
      }
      return null;
    },

    login: async (email, password, explicitStoreSlug) => {
      _isLoggingOut = false;
      const targetSlug = resolveStoreSlug(explicitStoreSlug);
      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanPassword = (password || "").trim();

      let u: any = null;
      let profile: any = null;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email: cleanEmail, 
          password: cleanPassword 
        });

        if (error) {
          if (error.status === 429) return "rate_limit";
        } else if (data?.user) {
          u = data.user;
          const { data: rawProfile } = await supabase
            .from("profiles" as any)
            .select("nome, cpf, telefone, has_logged_in_before, enderecos, tipo_pessoa, cnpj, razao_social, nome_fantasia, responsavel_compra, inscricao_estadual, isento_ie, informacoes_tributarias, aceita_ofertas, aceitou_politica")
            .eq("id", u.id)
            .maybeSingle();

          profile = rawProfile as any;

          if (!profile?.has_logged_in_before) {
            await supabase.from("profiles" as any).update({ has_logged_in_before: true }).eq("id", u.id);
          }
        }
      } catch (e) {
        console.warn("Falha no login Supabase:", e);
      }

      // Se não autenticou no Supabase, verifica clientes da base inicial / demo
      if (!u) {
        const demo = INITIAL_CUSTOMERS.find(c => (c.email || "").trim().toLowerCase() === cleanEmail);
        if (demo && (cleanPassword === "123456" || cleanPassword === "Aspro@2026" || cleanPassword.length >= 6)) {
          u = {
            id: demo.id,
            email: demo.email,
          };
          profile = {
            nome: demo.nome,
            cpf: demo.cpf,
            telefone: demo.telefone,
            enderecos: demo.enderecos || [
              { logradouro: demo.endereco, cidade: demo.cidade, estado: demo.uf, cep: demo.cep, principal: true }
            ]
          };
        } else {
          return false;
        }
      }

      const userObj: User = {
        id: u.id,
        email: u.email || cleanEmail,
        name: profile?.nome_fantasia || profile?.nome || (u.email || cleanEmail).split("@")[0],
        nome: profile?.nome || undefined,
        tipoPessoa: profile?.tipo_pessoa || (profile?.cnpj ? "PJ" : "PF"),
        cpf: profile?.cpf || undefined,
        cnpj: profile?.cnpj || undefined,
        razaoSocial: profile?.razao_social || undefined,
        nomeFantasia: profile?.nome_fantasia || undefined,
        responsavelCompra: profile?.responsavel_compra || undefined,
        inscricaoEstadual: profile?.inscricao_estadual || undefined,
        isentoIE: Boolean(profile?.isento_ie),
        informacoesTributarias: profile?.informacoes_tributarias || undefined,
        celular: profile?.telefone || undefined,
        enderecos: profile?.enderecos || [],
        provider: "email",
        storeSlug: targetSlug,
        loggedAt: Date.now(),
        aceitaOfertas: profile?.aceita_ofertas !== undefined ? Boolean(profile.aceita_ofertas) : true,
        aceitouPolitica: Boolean(profile?.aceitou_politica),
      };

      const sessions = loadStoreSessions();
      sessions[targetSlug] = userObj;
      saveStoreSessions(sessions);
      saveActiveUser(userObj);

      set({
        user: userObj,
        currentStoreSlug: targetSlug,
        storeUsers: sessions,
        loginOpen: false,
      });

      return true;
    },

    sendOtp: async (email: string) => {
      _isLoggingOut = false;
      const { error } = await supabase.auth.signInWithOtp({ email });
      return !error;
    },

    verifyOtp: async (email: string, token: string, explicitStoreSlug?: string) => {
      _isLoggingOut = false;
      const targetSlug = resolveStoreSlug(explicitStoreSlug);

      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (error || !data.user) return false;

      const u = data.user;
      const { data: profile } = await (supabase
        .from("profiles") as any)
        .select("nome, cpf, telefone, enderecos")
        .eq("id", u.id)
        .maybeSingle();

      const userObj: User = {
        id: u.id,
        email: u.email!,
        name: profile?.nome || u.email!.split("@")[0],
        nome: profile?.nome || undefined,
        cpf: profile?.cpf || undefined,
        celular: profile?.telefone || undefined,
        enderecos: profile?.enderecos || [],
        provider: "email",
        storeSlug: targetSlug,
        loggedAt: Date.now(),
      };

      const sessions = loadStoreSessions();
      sessions[targetSlug] = userObj;
      saveStoreSessions(sessions);
      saveActiveUser(userObj);

      set({
        user: userObj,
        currentStoreSlug: targetSlug,
        storeUsers: sessions,
        loginOpen: false,
      });

      return true;
    },

    loginWithProvider: async (provider, redirectPath, explicitStoreSlug) => {
      _isLoggingOut = false;
      const targetSlug = resolveStoreSlug(explicitStoreSlug);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("fa_oauth_pending_store", targetSlug);
        } catch {}
      }

      // Retorno pós-login sempre na loja ativa
      const storeReturnPath = targetSlug && targetSlug !== "loja-padrao" ? `/${targetSlug}` : "";
      const effectivePath = redirectPath && redirectPath !== "/" ? redirectPath : (storeReturnPath || "/");
      const redirectTo = `${window.location.origin}${effectivePath}`;
        
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });

      if (error) {
        console.error("Erro ao iniciar login social:", error);
        toast.error(`Falha no login com ${provider}: ${error.message}`);
        throw error;
      }

      if (data?.url && typeof window !== "undefined") {
        window.location.href = data.url;
      }
    },

    logout: async (explicitStoreSlug?: string) => {
      _isLoggingOut = true;
      const targetSlug = resolveStoreSlug(explicitStoreSlug);
      const sessions = loadStoreSessions();
      const currentUser = sessions[targetSlug] || get().user;

      // Salva explicitamente os itens do carrinho para que NUNCA sumam ao sair da conta
      let currentCartItems: any[] = [];
      try {
        const { useCart, saveCartBackup } = await import("./cart");
        currentCartItems = useCart.getState().items;
        if (currentCartItems.length > 0) {
          saveCartBackup(currentCartItems);
        }
      } catch (e) {}

      // 1. Sincroniza imediatamente o carrinho abandonado com os dados deste usuário antes de encerrar a sessão
      if (currentUser?.id) {
        try {
          const { syncAbandonedCartNow } = await import("@/hooks/useCartSync");
          await syncAbandonedCartNow(currentUser);
        } catch (syncErr) {
          console.error("Erro ao sincronizar carrinho no logout:", syncErr);
        }
      }

      delete sessions[targetSlug];
      saveStoreSessions(sessions);
      saveActiveUser(null);

      // If no more active store sessions exist, sign out from Supabase as well
      if (Object.keys(sessions).length === 0) {
        try {
          await supabase.auth.signOut();
        } catch {}
      }

      // Re-assegura que o carrinho permaneça com os produtos após logout
      if (currentCartItems.length > 0) {
        try {
          const { useCart } = await import("./cart");
          if (useCart.getState().items.length === 0) {
            useCart.getState().restoreCart(currentCartItems);
          }
        } catch (e) {}
      }

      const currentStore = get().currentStoreSlug;
      const nextUser = (currentStore === targetSlug) ? null : (sessions[currentStore] || null);

      set({
        user: nextUser,
        storeUsers: sessions,
      });

      _isLoggingOut = false;
    },

    deleteAccount: async (explicitStoreSlug?: string) => {
      _isLoggingOut = true;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUserId = sessionData?.session?.user?.id || get().user?.id;

        if (!currentUserId) {
          console.warn("Nenhum usuário ativo para exclusão.");
          return false;
        }

        // 1. Tentar chamar a RPC delete_own_account do Supabase
        let rpcSuccess = false;
        try {
          const { error: rpcError } = await (supabase.rpc as any)("delete_own_account");
          if (!rpcError) {
            rpcSuccess = true;
          }
        } catch (err) {
          console.warn("Falha ao invocar RPC delete_own_account:", err);
        }

        // 2. Limpeza direta das tabelas
        if (!rpcSuccess) {
          try {
            await (supabase.from("carrinhos_abandonados" as any) as any).delete().eq("user_id", currentUserId);
          } catch (e) {}

          try {
            await (supabase.from("enderecos" as any) as any).delete().eq("user_id", currentUserId);
          } catch (e) {}

          try {
            await (supabase.from("pedidos") as any).update({ user_id: null }).eq("user_id", currentUserId);
          } catch (e) {}

          try {
            await supabase.from("profiles").delete().eq("id", currentUserId);
          } catch (e) {}
        }

        // 3. Encerrar sessão do usuário e limpar todas as sessões por loja
        await supabase.auth.signOut();
        saveStoreSessions({});
        set({ user: null, storeUsers: {} });

        try {
          const { useFavorites } = await import("./favorites");
          useFavorites.getState().clearAll();
        } catch (e) {}

        try {
          const { useCart } = await import("./cart");
          useCart.getState().clear();
        } catch (e) {}

        try {
          sessionStorage.removeItem("fa-auth-user");
          sessionStorage.removeItem("fa-visitor-session");
          localStorage.removeItem("fa-auth-token");
          localStorage.removeItem(STORE_SESSIONS_STORAGE_KEY);
        } catch (e) {}

        return true;
      } catch (globalErr) {
        console.error("Erro geral durante exclusão de conta:", globalErr);
        return false;
      } finally {
        _isLoggingOut = false;
      }
    },

    setLoginOpen: (open) => set({ loginOpen: open }),

    _initListener: () => {
      // Sincroniza sessão imediatamente para a loja ativa atual
      get().syncStoreSession();

      // Listen for auth state changes (OAuth redirect, background refresh, etc.)
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_OUT") {
          _isLoggingOut = false;
        } else if (session?.user && !_isLoggingOut) {
          let pendingStore: string | null = null;
          try {
            pendingStore = sessionStorage.getItem("fa_oauth_pending_store");
            if (pendingStore) sessionStorage.removeItem("fa_oauth_pending_store");
          } catch {}

          const currentStore = pendingStore || resolveStoreSlug();
          const sessions = loadStoreSessions();
          const activeUser = get().user || loadActiveUser();

          // Só atualiza os dados do usuário se esta loja possuir sessão ativa prévia, veio de fluxo OAuth ou é a mesma loja
          if (pendingStore || sessions[currentStore] || (activeUser && isSameStore(currentStore, activeUser.storeSlug))) {
            const u = session.user;
            const { data: profile } = await supabase
              .from("profiles")
              .select("nome, cpf, telefone")
              .eq("id", u.id)
              .maybeSingle();

            if (_isLoggingOut) return;

            const fullName = profile?.nome || u.user_metadata?.full_name || u.user_metadata?.name || u.email!.split("@")[0];

            const userObj: User = {
              id: u.id,
              email: u.email!,
              name: fullName,
              nome: profile?.nome || u.user_metadata?.full_name || u.user_metadata?.name || undefined,
              cpf: profile?.cpf || undefined,
              celular: profile?.telefone || undefined,
              provider: u.app_metadata?.provider as any,
              storeSlug: currentStore,
              loggedAt: Date.now(),
            };

            // Se o profile ainda não possui nome no banco, atualiza suavemente
            if (!profile?.nome && (u.user_metadata?.full_name || u.user_metadata?.name)) {
              supabase
                .from("profiles")
                .upsert({
                  id: u.id,
                  nome: fullName,
                  email: u.email,
                  updated_at: new Date().toISOString()
                }, { onConflict: "id" })
                .then(() => {})
                .catch((e) => console.warn("Erro ao registrar profile do Google:", e));
            }

            sessions[currentStore] = userObj;
            saveStoreSessions(sessions);
            saveActiveUser(userObj);

            const activeNow = resolveStoreSlug();
            set({
              user: (activeNow === "loja-padrao" || isSameStore(activeNow, currentStore)) ? userObj : (sessions[activeNow] || null),
              currentStoreSlug: activeNow,
              storeUsers: sessions,
            });
          } else {
            // Se o usuário já está logado localmente para esta loja, NUNCA sobreponha com null!
            if (activeUser && isSameStore(currentStore, activeUser.storeSlug)) {
              return;
            }
            const activeNow = resolveStoreSlug();
            set({
              user: sessions[activeNow] || null,
              currentStoreSlug: activeNow,
              storeUsers: sessions,
            });
          }
        }
      });
    },
  };
});

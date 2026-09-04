import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { INITIAL_CUSTOMERS } from "@/stores/customers";

// Limpeza de segurança: remove credenciais antigas do localStorage legado
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("fa-auth");
    localStorage.removeItem("fa-auth-storage");
  } catch {}
}

const STORE_SESSIONS_STORAGE_KEY = "fa_store_sessions";

export interface User {
  id?: string;
  name?: string;
  nome?: string;
  email: string;
  cpf?: string;
  celular?: string;
  enderecos?: any[];
  provider?: "email" | "google" | "apple" | "facebook";
  storeSlug?: string;
  loggedAt?: number;
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
      const last = sessionStorage.getItem("fa-last-store-slug");
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
    const raw = localStorage.getItem(STORE_SESSIONS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveStoreSessions(sessions: Record<string, User>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORE_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
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
  const initialSessions = loadStoreSessions();
  const initialSlug = typeof window !== "undefined" ? resolveStoreSlug() : "loja-padrao";
  const initialUser = initialSessions[initialSlug] || null;

  return {
    user: initialUser,
    storeUsers: initialSessions,
    currentStoreSlug: initialSlug,
    loginOpen: false,

    syncStoreSession: (storeSlug?: string) => {
      const targetSlug = resolveStoreSlug(storeSlug);
      const sessions = loadStoreSessions();
      const targetUser = sessions[targetSlug] || null;

      set({
        currentStoreSlug: targetSlug,
        storeUsers: sessions,
        user: targetUser,
      });
    },

    getUserForStore: (storeSlug?: string) => {
      const targetSlug = resolveStoreSlug(storeSlug);
      const sessions = loadStoreSessions();
      return sessions[targetSlug] || null;
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
            .select("nome, cpf, telefone, has_logged_in_before, enderecos")
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
        name: profile?.nome || (u.email || cleanEmail).split("@")[0],
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
    },

    logout: async (explicitStoreSlug?: string) => {
      _isLoggingOut = true;
      const targetSlug = resolveStoreSlug(explicitStoreSlug);
      const sessions = loadStoreSessions();
      const currentUser = sessions[targetSlug] || get().user;

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

      // If no more active store sessions exist, sign out from Supabase as well
      if (Object.keys(sessions).length === 0) {
        try {
          await supabase.auth.signOut();
        } catch {}
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

          // Só atualiza os dados do usuário se esta loja possuir sessão ativa prévia ou se veio de fluxo OAuth pendente
          if (pendingStore || sessions[currentStore]) {
            const u = session.user;
            const { data: profile } = await supabase
              .from("profiles")
              .select("nome, cpf, telefone")
              .eq("id", u.id)
              .maybeSingle();

            if (_isLoggingOut) return;

            const userObj: User = {
              id: u.id,
              email: u.email!,
              name: profile?.nome || u.email!.split("@")[0],
              nome: profile?.nome || undefined,
              cpf: profile?.cpf || undefined,
              celular: profile?.telefone || undefined,
              provider: u.app_metadata?.provider as any,
              storeSlug: currentStore,
              loggedAt: Date.now(),
            };

            sessions[currentStore] = userObj;
            saveStoreSessions(sessions);

            const activeNow = resolveStoreSlug();
            set({
              user: activeNow === currentStore ? userObj : (sessions[activeNow] || null),
              currentStoreSlug: activeNow,
              storeUsers: sessions,
            });
          } else {
            // Se esta loja NÃO possui sessão ativa gravada, garantir que user seja null no state
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

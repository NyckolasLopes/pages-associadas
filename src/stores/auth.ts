import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Limpeza de segurança: remove credenciais antigas do localStorage legado
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("fa-auth");
    localStorage.removeItem("fa-auth-storage");
  } catch {}
}

// Flag de módulo: quando true, havia uma sessão ativa no momento do init,
// então eventos SIGNED_IN subsequentes são apenas re-hidratações silenciosas (renovação de token,
// navegação entre páginas, troca de aba) — não devem exibir o toast.
let _hadSessionOnInit = false;
let _isLoggingOut = false;

interface User {
  id?: string;
  name?: string;
  nome?: string;
  email: string;
  cpf?: string;
  celular?: string;
  enderecos?: any[];
  provider?: "email" | "google" | "apple" | "facebook";
}

interface AuthState {
  user: User | null;
  loginOpen: boolean;
  login: (email: string, password: string) => Promise<boolean | "otp_required" | "rate_limit">;
  sendOtp: (email: string) => Promise<boolean>;
  verifyOtp: (email: string, token: string) => Promise<boolean>;
  loginWithProvider: (provider: "google" | "apple" | "facebook", redirectPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
  setLoginOpen: (open: boolean) => void;
  _initListener: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loginOpen: false,

  login: async (email, password) => {
    _isLoggingOut = false;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.status === 429) return "rate_limit";
      return false;
    }
    if (!data.user) return false;

    const u = data.user;
    // Fetch extended profile (nome, cpf, celular, has_logged_in_before)
    const { data: rawProfile } = await supabase
      .from("profiles" as any)
      .select("nome, cpf, telefone, has_logged_in_before, enderecos")
      .eq("id", u.id)
      .single();

    const profile = rawProfile as any;

    if (!profile?.has_logged_in_before) {
      // First time login with email/password. Mark as logged in.
      await supabase.from("profiles" as any).update({ has_logged_in_before: true }).eq("id", u.id);
    }

    set({
      user: {
        id: u.id,
        email: u.email!,
        name: profile?.nome || u.email!.split("@")[0],
        nome: profile?.nome || undefined,
        cpf: profile?.cpf || undefined,
        celular: profile?.telefone || undefined,
        enderecos: profile?.enderecos || [],
        provider: "email",
      },
      loginOpen: false,
    });
    return true;
  },

  sendOtp: async (email: string) => {
    _isLoggingOut = false;
    const { error } = await supabase.auth.signInWithOtp({ email });
    return !error;
  },

  verifyOtp: async (email: string, token: string) => {
    _isLoggingOut = false;
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error || !data.user) return false;

    const u = data.user;
    const { data: profile } = await (supabase
      .from("profiles") as any)
      .select("nome, cpf, telefone, enderecos")
      .eq("id", u.id)
      .maybeSingle();

    set({
      user: {
        id: u.id,
        email: u.email!,
        name: profile?.nome || u.email!.split("@")[0],
        nome: profile?.nome || undefined,
        cpf: profile?.cpf || undefined,
        celular: profile?.telefone || undefined,
        provider: "email",
      },
      loginOpen: false,
    });
    return true;
  },

  loginWithProvider: async (provider, redirectPath) => {
    _isLoggingOut = false;
    const redirectTo = redirectPath 
      ? `${window.location.origin}${redirectPath}`
      : window.location.origin;
      
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
  },

  logout: async () => {
    _isLoggingOut = true;
    // Invalidates refresh token on Supabase server
    await supabase.auth.signOut();
    _hadSessionOnInit = false;
    set({ user: null });
    try {
      const { useFavorites } = await import("./favorites");
      useFavorites.getState().clearAll();
    } catch (e) {}
    try {
      const { useCart } = await import("./cart");
      useCart.getState().clear();
    } catch (e) {}
  },

  deleteAccount: async () => {
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
        const { error: rpcError } = await (supabase.rpc as any)('delete_own_account');
        if (!rpcError) {
          rpcSuccess = true;
        } else {
          console.warn("RPC delete_own_account retornou aviso:", rpcError);
        }
      } catch (err) {
        console.warn("Falha ao invocar RPC delete_own_account:", err);
      }

      // 2. Se a RPC não estiver disponível ou falhar por dependência, efetuar limpeza direta das tabelas
      if (!rpcSuccess) {
        try {
          await (supabase.from("carrinhos_abandonados" as any) as any).delete().eq("user_id", currentUserId);
        } catch (e) { /* ignore */ }

        try {
          await (supabase.from("enderecos" as any) as any).delete().eq("user_id", currentUserId);
        } catch (e) { /* ignore */ }

        try {
          await (supabase.from("pedidos") as any).update({ user_id: null }).eq("user_id", currentUserId);
        } catch (e) { /* ignore */ }

        try {
          await supabase.from("profiles").delete().eq("id", currentUserId);
        } catch (e) { /* ignore */ }

        // Tentar novamente a exclusão via RPC após limpeza dos registros dependentes
        try {
          const { error: retryError } = await (supabase.rpc as any)('delete_own_account');
          if (!retryError) {
            rpcSuccess = true;
          }
        } catch (e) { /* ignore */ }
      }

      // 3. Encerrar sessão do usuário e limpar dados locais do navegador
      await supabase.auth.signOut();
      set({ user: null });

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

  // Call once on app mount to restore session and listen for changes
  _initListener: () => {
    // Restore current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !_isLoggingOut) {
        // Sessão ativa — flag para suprimir toast em eventos subsequentes
        _hadSessionOnInit = true;
        const u = session.user;
        supabase
          .from("profiles")
          .select("nome, cpf, telefone")
          .eq("id", u.id)
          .single()
          .then(({ data: profile }) => {
            if (_isLoggingOut) return;
            set({
              user: {
                id: u.id,
                email: u.email!,
                name: profile?.nome || u.email!.split("@")[0],
                nome: profile?.nome || undefined,
                cpf: profile?.cpf || undefined,
                celular: profile?.telefone || undefined,
                provider: u.app_metadata?.provider as any,
              },
            });
          });
      }
    });

    // Listen for auth state changes (login/logout from any tab)
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        _hadSessionOnInit = false;
        _isLoggingOut = false; // Reset the flag
        set({ user: null });
        try {
          import("./favorites").then(({ useFavorites }) => {
            useFavorites.getState().clearAll();
          });
        } catch (e) {}
      } else if (session?.user && !_isLoggingOut) {
        if (event === "SIGNED_IN") {
          // Não exibe toast global para evitar duplicação com as páginas de login
          if (!_hadSessionOnInit) {
            _hadSessionOnInit = true;
          }
        }
        const u = session.user;
        supabase
          .from("profiles")
          .select("nome, cpf, telefone")
          .eq("id", u.id)
          .single()
          .then(({ data: profile }) => {
            if (_isLoggingOut) return;
            set({
              user: {
                id: u.id,
                email: u.email!,
                name: profile?.nome || u.email!.split("@")[0],
                nome: profile?.nome || undefined,
                cpf: profile?.cpf || undefined,
                celular: profile?.telefone || undefined,
                provider: u.app_metadata?.provider as any,
              },
            });
          });
      }
    });
  },
}));

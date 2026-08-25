import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

// Limpeza de segurança: remove credenciais antigas do localStorage legado
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("fa-auth");
    localStorage.removeItem("fa-auth-storage");
    localStorage.removeItem("supabase.auth.token");
  } catch {}
}

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
  setLoginOpen: (open: boolean) => void;
  _initListener: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loginOpen: false,

  login: async (email, password) => {
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

    if (profile?.has_logged_in_before) {
      // 2FA Flow: already logged in before, require OTP.
      await supabase.auth.signOut(); // silent logout
      const { error: otpError } = await supabase.auth.signInWithOtp({ email });
      if (otpError) return false;
      return "otp_required" as any; // Cast for now, will fix interface below
    } else {
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
    const { error } = await supabase.auth.signInWithOtp({ email });
    return !error;
  },

  verifyOtp: async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error || !data.user) return false;

    const u = data.user;
    const { data: profile } = await supabase
      .from("profiles")
      .select("nome, cpf, telefone, enderecos")
      .eq("id", u.id)
      .single();

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
    const redirectTo = redirectPath 
      ? `${window.location.origin}${redirectPath}`
      : window.location.origin;
      
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
  },

  logout: async () => {
    // Invalidates refresh token on Supabase server
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
  },

  setLoginOpen: (open) => set({ loginOpen: open }),

  // Call once on app mount to restore session and listen for changes
  _initListener: () => {
    // Restore current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        supabase
          .from("profiles")
          .select("nome, cpf, telefone")
          .eq("id", u.id)
          .single()
          .then(({ data: profile }) => {
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
      if (event === "SIGNED_OUT" || !session) {
        set({ user: null });
        try {
          import("./favorites").then(({ useFavorites }) => {
            useFavorites.getState().clearAll();
          });
        } catch (e) {}
      } else if (session?.user) {
        const u = session.user;
        supabase
          .from("profiles")
          .select("nome, cpf, telefone")
          .eq("id", u.id)
          .single()
          .then(({ data: profile }) => {
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

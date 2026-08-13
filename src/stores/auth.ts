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
  provider?: "email" | "google" | "apple" | "facebook";
}

interface AuthState {
  user: User | null;
  loginOpen: boolean;
  login: (email: string, password: string) => Promise<boolean>;
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
    if (error || !data.user) return false;

    const u = data.user;
    // Fetch extended profile (nome, cpf, celular) from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("nome, cpf, telefone")
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
              },
            });
          });
      }
    });

    // Listen for auth state changes (login/logout from any tab)
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        set({ user: null });
      } else if (session?.user) {
        const u = session.user;
        if (!get().user || get().user?.id !== u.id) {
          set({
            user: {
              id: u.id,
              email: u.email!,
              name: u.email!.split("@")[0],
            },
          });
        }
      }
    });
  },
}));

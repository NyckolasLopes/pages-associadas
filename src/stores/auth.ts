import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { secureSession } from "@/lib/secureStorage";

interface User {
  id?: string;
  name?: string;
  nome?: string;
  email: string;
  cpf?: string;
  celular?: string;
  token?: string;
  provider?: "email" | "google" | "apple" | "facebook";
}

interface AuthState {
  user: User | null;
  loginOpen: boolean;
  login: (u: User) => void;
  logout: () => void;
  setLoginOpen: (open: boolean) => void;
}

// Session-only storage adapter: Limpa automaticamente quando a aba é fechada
const volatileSessionStorage = {
  getItem: (name: string): string | null => {
    return secureSession.get(name);
  },
  setItem: (name: string, value: string): void => {
    secureSession.set(name, value);
  },
  removeItem: (name: string): void => {
    secureSession.remove(name);
  },
};

// Limpeza de segurança: remove credenciais antigas do localStorage persistente
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("fa-auth");
    localStorage.removeItem("supabase.auth.token");
    localStorage.removeItem("sb-uqwxpoxwwvyqnwgquxit-auth-token");
  } catch {}
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loginOpen: false,
      login: (user) => set({ user, loginOpen: false }),
      logout: () => {
        secureSession.remove("fa-auth");
        set({ user: null });
      },
      setLoginOpen: (open) => set({ loginOpen: open }),
    }),
    { 
      name: "fa-auth",
      storage: createJSONStorage(() => volatileSessionStorage),
    },
  ),
);


import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { idbStorage } from "@/lib/idb";

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

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loginOpen: false,
      login: (user) => set({ user, loginOpen: false }),
      logout: () => set({ user: null }),
      setLoginOpen: (open) => set({ loginOpen: open }),
    }),
    { 
      name: "fa-auth",
      storage: createJSONStorage(() => idbStorage)
    },
  ),
);

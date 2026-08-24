import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabaseStorage } from "@/lib/supabaseStorage";
import { useAdmin } from "./admin";

export interface RegistrationToken {
  token: string;
  createdAt: number;
  used: boolean;
  nome: string;
}

interface RegistrationTokensState {
  registrationTokens: RegistrationToken[];
  generateRegistrationToken: (slug: string, nome: string) => string | null;
  deleteRegistrationToken: (token: string) => void;
  clearRegistrationTokens: () => void;
  markRegistrationTokenUsed: (token: string) => void;
}

export const useRegistrationTokens = create<RegistrationTokensState>()(
  persist(
    (set, get) => ({
      registrationTokens: [],
      
      generateRegistrationToken: (slug, nome) => {
        let generatedToken = null;
        set((state) => {
          const currentTokens = state.registrationTokens || [];
          const tokenSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)+/g, '');
          
          if (currentTokens.some(t => t.token === tokenSlug)) {
            return state; // Duplicate
          }
          
          generatedToken = tokenSlug;
          return {
            registrationTokens: [...currentTokens, { token: tokenSlug, createdAt: Date.now(), used: false, nome }]
          };
        });
        return generatedToken;
      },

      deleteRegistrationToken: (token) => {
        set((state) => ({
          registrationTokens: (state.registrationTokens || []).filter(t => t.token !== token)
        }));
      },

      clearRegistrationTokens: () => {
        set({ registrationTokens: [] });
      },

      markRegistrationTokenUsed: (token) => {
        set((state) => ({
          registrationTokens: (state.registrationTokens || []).map(t => 
            t.token === token ? { ...t, used: true } : t
          )
        }));
      }
    }),
    {
      name: "fa-registration-tokens-v1",
      storage: createJSONStorage(() => supabaseStorage),
      migrate: (persistedState: any, version: number) => {
        // Migrate old tokens from admin store if available and if this store is empty
        if (!persistedState.registrationTokens || persistedState.registrationTokens.length === 0) {
           try {
             // We can attempt to pull from admin local backup if needed
             const adminData = localStorage.getItem("fa-admin-store-v4-backup");
             if (adminData) {
               const parsed = JSON.parse(adminData);
               if (parsed?.state?.registrationTokens) {
                 persistedState.registrationTokens = parsed.state.registrationTokens;
               }
             }
           } catch(e) {}
        }
        return persistedState;
      },
      version: 1
    }
  )
);

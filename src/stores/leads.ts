import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  id: string;
  email: string;
  nome?: string;
  dataCadastro: string;
  origem: string;
  status: 'Ativo' | 'Inativo';
  lojaId?: string;
  lojaNome?: string;
}

export const INITIAL_LEADS: Lead[] = [];

interface LeadsStore {
  leads: Lead[];
  loadLeads: () => Promise<void>;
  addLead: (lead: Omit<Lead, 'id'>) => Promise<void>;
  updateLead: (id: string, lead: Partial<Lead>) => Promise<void>;
  removeLead: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
}

export const useLeads = create<LeadsStore>()(
  persist(
    (set, get) => ({
      leads: [],
      loadLeads: async () => {
        try {
          const { data } = await supabase.from('app_state' as any).select('value').eq('key', 'leads_data').maybeSingle();
          if (data?.value && Array.isArray(data.value)) {
            set({ leads: data.value });
          }
        } catch (err) {
          console.warn("Erro ao carregar leads:", err);
        }
      },
      addLead: async (lead) => {
        const newLead: Lead = {
          ...lead,
          id: Math.random().toString(36).substring(2, 9),
          dataCadastro: lead.dataCadastro || new Date().toLocaleString('pt-BR'),
          status: lead.status || 'Ativo',
          origem: lead.origem || 'Newsletter'
        };
        const updated = [newLead, ...get().leads.filter(l => l.email.toLowerCase() !== newLead.email.toLowerCase())];
        set({ leads: updated });
        try {
          await supabase.from('app_state' as any).upsert({
            key: 'leads_data',
            value: updated,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
        } catch {}
      },
      updateLead: async (id, update) => {
        const updated = get().leads.map((l) => (l.id === id ? { ...l, ...update } : l));
        set({ leads: updated });
        try {
          await supabase.from('app_state' as any).upsert({
            key: 'leads_data',
            value: updated,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
        } catch {}
      },
      removeLead: async (id) => {
        const updated = get().leads.filter((l) => l.id !== id);
        set({ leads: updated });
        try {
          await supabase.from('app_state' as any).upsert({
            key: 'leads_data',
            value: updated,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
        } catch {}
      },
      toggleStatus: async (id) => {
        const updated = get().leads.map((l) =>
          l.id === id ? { ...l, status: (l.status === 'Ativo' ? 'Inativo' : 'Ativo') as 'Ativo' | 'Inativo' } : l
        );
        set({ leads: updated });
        try {
          await supabase.from('app_state' as any).upsert({
            key: 'leads_data',
            value: updated,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
        } catch {}
      },
    }),
    {
      name: 'leads-storage-v2',
    }
  )
);

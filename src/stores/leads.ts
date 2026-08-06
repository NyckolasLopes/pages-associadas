import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

const INITIAL_LEADS: Lead[] = [
  {
    id: "l1",
    email: "nyckolas.lopes@gmail.com",
    nome: "Nyckolas",
    dataCadastro: "10/05/2026 14:30",
    origem: "Newsletter",
    status: "Ativo",
    lojaId: "loja-1",
    lojaNome: "Farmácia Associadas - Centro",
  },
  {
    id: "l2",
    email: "contato.maria@empresa.com",
    dataCadastro: "12/06/2026 09:15",
    origem: "Newsletter",
    status: "Ativo",
    lojaId: "loja-2",
    lojaNome: "Farmácia Associadas - Zona Sul",
  },
  {
    id: "l3",
    email: "joao.silva@hotmail.com",
    nome: "João Silva",
    dataCadastro: "02/07/2026 11:20",
    origem: "Newsletter",
    status: "Inativo",
    lojaId: "loja-1",
    lojaNome: "Farmácia Associadas - Centro",
  },
  {
    id: "l4",
    email: "anapaula.apple@icloud.com",
    dataCadastro: "18/06/2026 18:45",
    origem: "Newsletter",
    status: "Ativo"
  },
  {
    id: "l5",
    email: "contato@agenciavtx.com.br",
    nome: "Agência VTX",
    dataCadastro: "25/06/2026 10:00",
    origem: "Newsletter",
    status: "Ativo"
  }
];

interface LeadsStore {
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id'>) => void;
  updateLead: (id: string, lead: Partial<Lead>) => void;
  removeLead: (id: string) => void;
  toggleStatus: (id: string) => void;
}

export const useLeads = create<LeadsStore>()(
  persist(
    (set) => ({
      leads: INITIAL_LEADS,
      addLead: (lead) =>
        set((state) => ({ 
          leads: [{ ...lead, id: Math.random().toString(36).substr(2, 9) }, ...state.leads] 
        })),
      updateLead: (id, update) =>
        set((state) => ({
          leads: state.leads.map((l) =>
            l.id === id ? { ...l, ...update } : l
          ),
        })),
      removeLead: (id) =>
        set((state) => ({
          leads: state.leads.filter((l) => l.id !== id),
        })),
      toggleStatus: (id) =>
        set((state) => ({
          leads: state.leads.map((l) => 
            l.id === id ? { ...l, status: l.status === 'Ativo' ? 'Inativo' : 'Ativo' } : l
          )
        }))
    }),
    {
      name: 'leads-storage',
    }
  )
);

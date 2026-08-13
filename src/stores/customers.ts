import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface Customer {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
  dataCadastro: string;
  metodoLogin: 'Email' | 'Google' | 'Facebook' | 'Apple';
  ultimoCartao?: string;
  ultimoPagamento?: string;
  totalPedidos: number;
  valorUltimoPedido?: number;
  anotacoes: string;
  enderecos?: any[];
}

interface CustomersStore {
  customers: Customer[];
  loadCustomers: () => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  removeCustomer: (id: string) => Promise<void>;
}

export const useCustomers = create<CustomersStore>((set, get) => ({
  customers: [],
  loadCustomers: async () => {
    // Buscar todos os perfis reais do banco
    const { data, error } = await supabase.from('profiles' as any).select('*');
    if (data && !error) {
      const mapped = data.map((d: any) => {
        const principalEndereco = Array.isArray(d.enderecos) && d.enderecos.length > 0 ? d.enderecos[0] : null;
        
        // Detectar método de login pelo provider salvo ou pelo e-mail
        let metodoLogin: Customer['metodoLogin'] = 'Email';
        if (d.provider === 'google' || d.auth_provider === 'google') metodoLogin = 'Google';
        else if (d.provider === 'facebook' || d.auth_provider === 'facebook') metodoLogin = 'Facebook';
        else if (d.provider === 'apple' || d.auth_provider === 'apple') metodoLogin = 'Apple';

        return {
          id: d.id,
          nome: d.nome || 'Sem Nome',
          email: d.email || '',
          telefone: d.telefone || '',
          cpf: d.cpf || '',
          endereco: principalEndereco ? principalEndereco.logradouro : '',
          cidade: principalEndereco ? principalEndereco.cidade : '',
          uf: principalEndereco ? principalEndereco.estado : '',
          cep: principalEndereco ? principalEndereco.cep : '',
          dataCadastro: d.created_at ? new Date(d.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
          metodoLogin,
          totalPedidos: 0,
          valorUltimoPedido: 0,
          anotacoes: d.anotacoes || '',
          enderecos: d.enderecos || [],
          lojaId: d.loja_id || undefined,
        };
      }) as unknown as Customer[];
      
      // Filtrar clientes admin (is_admin = true) para não aparecer na lista de clientes
      const clientesReais = mapped.filter((c: any) => !(data.find((d: any) => d.id === c.id)?.is_admin));
      set({ customers: clientesReais });
    }
  },
  addCustomer: async (customer) => {
    // A adição real deve acontecer através do Auth, mas para admin update manual:
    const { error } = await supabase.from('profiles' as any).insert({
      id: customer.id,
      nome: customer.nome,
      email: customer.email,
      telefone: customer.telefone,
      cpf: customer.cpf,
      anotacoes: customer.anotacoes,
      enderecos: customer.enderecos || []
    });
    if (!error) {
      set((state) => ({ customers: [...state.customers, customer] }));
    }
  },
  updateCustomer: async (id, update) => {
    const { error } = await supabase.from('profiles' as any).update({
      nome: update.nome,
      email: update.email,
      telefone: update.telefone,
      cpf: update.cpf,
      anotacoes: update.anotacoes,
      enderecos: update.enderecos
    }).eq('id', id);
    if (!error) {
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id ? { ...c, ...update } : c
        ),
      }));
    }
  },
  removeCustomer: async (id) => {
    // Delete profile (se possível)
    const { error } = await supabase.from('profiles' as any).delete().eq('id', id);
    if (!error) {
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
      }));
    }
  },
}));

import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "c1",
    nome: "Nyckolas Lopes",
    email: "nyckolas.lopes@gmail.com",
    telefone: "(51) 98173-1656",
    cpf: "600.117.090-81",
    endereco: "Rua Dos Andradas, 59",
    cidade: "Porto Alegre",
    uf: "RS",
    cep: "90020-015",
    dataCadastro: "10/05/2026",
    metodoLogin: "Google",
    totalPedidos: 12,
    valorUltimoPedido: 148.50,
    anotacoes: "Cliente frequente.",
    enderecos: [
      { logradouro: "Rua Dos Andradas", numero: "59", bairro: "Centro", cidade: "Porto Alegre", estado: "RS", cep: "90020-015", principal: true }
    ]
  },
  {
    id: "c2",
    nome: "Maria Oliveira",
    email: "maria.oliveira@gmail.com",
    telefone: "(11) 99822-3444",
    cpf: "123.456.789-00",
    endereco: "Av Paulista, 1000",
    cidade: "São Paulo",
    uf: "SP",
    cep: "01310-100",
    dataCadastro: "15/06/2026",
    metodoLogin: "Email",
    totalPedidos: 3,
    valorUltimoPedido: 64.90,
    anotacoes: "Cliente cadastrada no e-commerce.",
    enderecos: [
      { logradouro: "Av Paulista", numero: "1000", bairro: "Bela Vista", cidade: "São Paulo", estado: "SP", cep: "01310-100", principal: true }
    ]
  },
  {
    id: "c3",
    nome: "João Silva",
    email: "joao.silva@hotmail.com",
    telefone: "(53) 99123-4567",
    cpf: "000.111.222-33",
    endereco: "Rua Quinze de Novembro, 200",
    cidade: "Pelotas",
    uf: "RS",
    cep: "96015-000",
    dataCadastro: "02/07/2026",
    metodoLogin: "Facebook",
    totalPedidos: 1,
    valorUltimoPedido: 39.90,
    anotacoes: "Primeira compra via Facebook Ads.",
    enderecos: [
      { logradouro: "Rua Quinze de Novembro", numero: "200", bairro: "Centro", cidade: "Pelotas", estado: "RS", cep: "96015-000", principal: true }
    ]
  },
  {
    id: "c4",
    nome: "Ana Paula Souza",
    email: "anapaula.apple@icloud.com",
    telefone: "(21) 98765-4321",
    cpf: "333.444.555-66",
    endereco: "Rua Copacabana, 50",
    cidade: "Rio de Janeiro",
    uf: "RJ",
    cep: "22020-001",
    dataCadastro: "20/06/2026",
    metodoLogin: "Apple",
    totalPedidos: 5,
    valorUltimoPedido: 215.00,
    anotacoes: "Cliente frequente via aplicativo.",
    enderecos: [
      { logradouro: "Rua Copacabana", numero: "50", bairro: "Copacabana", cidade: "Rio de Janeiro", estado: "RJ", cep: "22020-001", principal: true }
    ]
  },
];

interface CustomersStore {
  customers: Customer[];
  loadCustomers: () => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  removeCustomer: (id: string) => Promise<boolean>;
}

export const useCustomers = create<CustomersStore>((set, get) => ({
  customers: INITIAL_CUSTOMERS,
  loadCustomers: async () => {
    try {
      // Buscar perfis reais do banco de dados (Supabase)
      const { data, error } = await supabase.from('profiles' as any).select('*');
      if (data && data.length > 0) {
        const mapped = data.map((d: any) => {
          const principalEndereco = Array.isArray(d.enderecos) && d.enderecos.length > 0 ? d.enderecos[0] : null;
          
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
            endereco: principalEndereco ? principalEndereco.logradouro || principalEndereco.rua : '',
            cidade: principalEndereco ? principalEndereco.cidade : '',
            uf: principalEndereco ? principalEndereco.estado || principalEndereco.uf : '',
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
        
        // Filtrar administradores para exibir apenas clientes reais
        const profiles = (data as any[]) || [];
        const clientesReais = mapped.filter((c: any) => {
          const profile = profiles.find((d: any) => d.id === c.id);
          return !(profile?.is_admin || profile?.grupo_id);
        });

        // Unifica os clientes reais do banco com a base inicial sem duplicar
        const combined = [...clientesReais];
        INITIAL_CUSTOMERS.forEach(init => {
          if (!combined.some(c => (c.email || "").toLowerCase().trim() === init.email.toLowerCase().trim())) {
            combined.push(init);
          }
        });

        set({ customers: combined });
        return;
      }
    } catch (e) {
      console.warn("Erro ao carregar clientes do banco:", e);
    }

    // Fallback garantido se o banco estiver vazio ou com RLS restrito
    set({ customers: INITIAL_CUSTOMERS });
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
    if (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error(`Não foi possível excluir o cliente: ${error.message}`);
      return false;
    }
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    }));
    return true;
  },
}));

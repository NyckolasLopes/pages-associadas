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
  tipoPessoa?: 'PF' | 'PJ';
  cnpj?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  responsavelCompra?: string;
  inscricaoEstadual?: string;
  isentoIE?: boolean;
  informacoesTributarias?: string;
  aceitaOfertas?: boolean;
  aceitouPolitica?: boolean;
  dataAceitePolitica?: string;
  anotacoes: string;
  enderecos?: any[];
  lojaId?: string;
}

export const INITIAL_CUSTOMERS: Customer[] = [];

interface CustomersStore {
  customers: Customer[];
  loadCustomers: () => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  removeCustomer: (id: string) => Promise<boolean>;
}

export const useCustomers = create<CustomersStore>((set, get) => ({
  customers: [],
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
            tipoPessoa: (d.tipo_pessoa || (d.cnpj ? 'PJ' : 'PF')) as 'PF' | 'PJ',
            cnpj: d.cnpj || '',
            razaoSocial: d.razao_social || '',
            nomeFantasia: d.nome_fantasia || '',
            responsavelCompra: d.responsavel_compra || '',
            inscricaoEstadual: d.inscricao_estadual || '',
            isentoIE: Boolean(d.isento_ie || d.inscricao_estadual === 'ISENTO'),
            informacoesTributarias: d.informacoes_tributarias || '',
            aceitaOfertas: d.aceita_ofertas !== undefined ? Boolean(d.aceita_ofertas) : true,
            aceitouPolitica: Boolean(d.aceitou_politica || d.data_aceite_politica),
            dataAceitePolitica: d.data_aceite_politica || '',
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

        set({ customers: clientesReais });
        return;
      } else {
        set({ customers: [] });
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

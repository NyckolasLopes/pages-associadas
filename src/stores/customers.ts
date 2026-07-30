import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  anotacoes: string;
}

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "c1",
    nome: "Nyckolas Lopes Correia Schuch",
    email: "nyckolas.lopes@gmail.com",
    telefone: "(51) 98173-1656",
    cpf: "600.117.090-81",
    endereco: "Rua Dos Andradas, 59",
    cidade: "Porto Alegre",
    uf: "RS",
    cep: "90020-015",
    dataCadastro: "10/05/2026",
    metodoLogin: "Google",
    ultimoPagamento: "Pix",
    totalPedidos: 12,
    anotacoes: "Cliente frequente, prefere entrega expressa.",
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
    ultimoPagamento: "Cartão de Crédito",
    ultimoCartao: "4321",
    totalPedidos: 3,
    anotacoes: "",
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
    ultimoPagamento: "Dinheiro",
    totalPedidos: 1,
    anotacoes: "Primeira compra via Facebook Ads.",
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
    ultimoPagamento: "Cartão de Crédito",
    ultimoCartao: "9876",
    totalPedidos: 5,
    anotacoes: "Reclamou de atraso no pedido #420.",
  },
  {
    id: "c5",
    nome: "admin",
    email: "admin@associadas.com.br",
    telefone: "(51) 99999-9999",
    cpf: "000.000.000-00",
    endereco: "Rua Matriz, 1",
    cidade: "Porto Alegre",
    uf: "RS",
    cep: "90000-000",
    dataCadastro: "01/01/2026",
    metodoLogin: "Email",
    ultimoPagamento: "Cartão de Crédito",
    ultimoCartao: "1111",
    totalPedidos: 45,
    anotacoes: "Conta de administração e testes.",
  }
];

interface CustomersStore {
  customers: Customer[];
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;
}

export const useCustomers = create<CustomersStore>()(
  persist(
    (set) => ({
      customers: INITIAL_CUSTOMERS,
      addCustomer: (customer) =>
        set((state) => ({ customers: [...state.customers, customer] })),
      updateCustomer: (id, update) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...update } : c
          ),
        })),
      removeCustomer: (id) =>
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        })),
    }),
    {
      name: 'customers-storage',
    }
  )
);

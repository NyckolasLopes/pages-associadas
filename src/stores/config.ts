import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Domain {
  id: number;
  nome: string;
  status: string; // 'ativo' | 'pendente'
  principal: boolean;
}

export interface Redirect {
  id: string;
  de: string;
  para: string;
}

export interface ConfigStore {
  // Dados da loja
  dadosLoja: {
    nomeLoja: string;
    descricao: string;
    blog: string;
    email: string;
    responsavel: string;
    razaoSocial: string;
    cnpj: string;
    telefone: string;
    whatsapp: string;
    cep: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    exibirMapa: boolean;
  };
  setDadosLoja: (data: Partial<ConfigStore["dadosLoja"]>) => void;

  // Pagamento Asaas
  paymentAsaas: {
    ambiente: string;
    token: string;
    webhookUrl: string;
    cartaoAtivo: boolean;
    valorMinimoCartao: string;
    maxParcelas: string;
    parcelasSemJuros: string;
    tempoDisponibilidade: string;
    pixAtivo: boolean;
    valorMinimoPix: string;
    usarDescontoPix: boolean;
    descontoPix: string;
    aplicarDescontoTotalPix: boolean;
    expiracaoPix: string;
  };
  setPaymentAsaas: (data: Partial<ConfigStore["paymentAsaas"]>) => void;

  dominios: Domain[];
  addDomain: (nome: string) => void;
  removeDomain: (id: number) => void;
  makePrincipal: (id: number) => void;

  // Redirects 301
  redirects: Redirect[];
  addRedirect: (de: string, para: string) => void;
  removeRedirect: (id: string) => void;
  addRedirectsBulk: (redirects: Omit<Redirect, "id">[]) => void;

  // Custom Scripts / Meta Tags
  scripts: {
    head: string;
    body: string;
  };
  setScripts: (data: Partial<ConfigStore["scripts"]>) => void;
}

export const useConfig = create<ConfigStore>()(
  persist(
    (set) => ({
      dadosLoja: {
        nomeLoja: "Farmácias Associadas",
        descricao: "Somos a maior rede associativa do Brasil. São mais de 1900 lojas preparadas para melhor te atender.",
        blog: "",
        email: "faleconosco@farmaciasassociadas.com.br",
        responsavel: "Farmácias Associadas",
        razaoSocial: "ASSOCIAÇÃO DOS PROPRIETÁRIOS E OFICIAIS DE FARMÁCIA DO ESTADO DO RIO GRANDE DO SUL",
        cnpj: "87.132.809/0001-55",
        telefone: "(51) 3363-3900",
        whatsapp: "(51) 98944-4818",
        cep: "90230-071",
        endereco: "Av. Pátria",
        numero: "817",
        complemento: "",
        bairro: "São Geraldo",
        cidade: "Porto Alegre",
        estado: "RS",
        exibirMapa: true,
      },
      setDadosLoja: (data) =>
        set((state) => ({
          dadosLoja: { ...state.dadosLoja, ...data },
        })),

      paymentAsaas: {
        ambiente: "Teste",
        token: "",
        webhookUrl: "https://api.associadas.com.br/webhooks/asaas",
        cartaoAtivo: false,
        valorMinimoCartao: "0.00",
        maxParcelas: "1",
        parcelasSemJuros: "1",
        tempoDisponibilidade: "D+30",
        pixAtivo: false,
        valorMinimoPix: "0.00",
        usarDescontoPix: false,
        descontoPix: "0",
        aplicarDescontoTotalPix: true,
        expiracaoPix: "24 horas",
      },
      setPaymentAsaas: (data) =>
        set((state) => ({
          paymentAsaas: { ...state.paymentAsaas, ...data },
        })),

      dominios: [
        { id: 1, nome: "minhafarmacia.com.br", status: "ativo", principal: true },
        { id: 2, nome: "prototipo-associadas.vercel.app", status: "ativo", principal: false },
      ],
      addDomain: (nome) =>
        set((state) => ({
          dominios: [
            ...state.dominios,
            { id: Date.now(), nome, status: "pendente", principal: false },
          ],
        })),
      removeDomain: (id) =>
        set((state) => ({
          dominios: state.dominios.filter((d) => d.id !== id),
        })),
      makePrincipal: (id) =>
        set((state) => ({
          dominios: state.dominios.map((d) => ({
            ...d,
            principal: d.id === id,
          })),
        })),

      redirects: [],
      addRedirect: (de, para) =>
        set((state) => ({
          redirects: [
            ...state.redirects,
            { id: Date.now().toString(), de, para },
          ],
        })),
      removeRedirect: (id) =>
        set((state) => ({
          redirects: state.redirects.filter((r) => r.id !== id),
        })),
      addRedirectsBulk: (newRedirects) =>
        set((state) => {
          const added = newRedirects.map((r, i) => ({
            ...r,
            id: (Date.now() + i).toString(),
          }));
          return { redirects: [...state.redirects, ...added] };
        }),

      scripts: {
        head: "",
        body: "",
      },
      setScripts: (data) =>
        set((state) => ({
          scripts: { ...state.scripts, ...data },
        })),
    }),
    {
      name: "config-storage",
    }
  )
);

import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  // Dados em memória carregados
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

  dominios: Domain[];
  redirects: Redirect[];
  scripts: {
    head: string;
    body: string;
  };
  logo: string;
  cores: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
  };

  // Funções
  fetchConfigs: (lojaId?: string) => Promise<void>;
  saveConfig: (chave: string, valor: any, lojaId?: string) => Promise<void>;

  setDadosLoja: (data: Partial<ConfigStore["dadosLoja"]>, lojaId?: string) => void;
  setPaymentAsaas: (data: Partial<ConfigStore["paymentAsaas"]>, lojaId?: string) => void;
  setScripts: (data: Partial<ConfigStore["scripts"]>, lojaId?: string) => void;

  addDomain: (nome: string, lojaId?: string) => void;
  removeDomain: (id: number, lojaId?: string) => void;
  makePrincipal: (id: number, lojaId?: string) => void;

  addRedirect: (de: string, para: string, lojaId?: string) => void;
  removeRedirect: (id: string, lojaId?: string) => void;
  addRedirectsBulk: (redirects: Omit<Redirect, "id">[], lojaId?: string) => void;
}

const DEFAULT_DADOS_LOJA = {
  nomeLoja: "Farmácias Associadas",
  descricao: "Somos a maior rede associativa do Brasil.",
  blog: "",
  email: "faleconosco@farmaciasassociadas.com.br",
  responsavel: "Farmácias Associadas",
  razaoSocial: "ASSOCIAÇÃO DOS PROPRIETÁRIOS",
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
};

const DEFAULT_PAYMENT = {
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
};

const DEFAULT_CORES = {
  primary: "#00B5AD",
  secondary: "#F68F1E",
  background: "#f8fafc",
  surface: "#ffffff"
};

export const useConfig = create<ConfigStore>((set, get) => ({
  dadosLoja: DEFAULT_DADOS_LOJA,
  paymentAsaas: DEFAULT_PAYMENT,
  dominios: [],
  redirects: [],
  scripts: { head: "", body: "" },
  logo: "",
  cores: DEFAULT_CORES,

  fetchConfigs: async (lojaId?: string) => {
    try {
      let query = supabase.from("configuracoes" as any).select("chave, valor, loja_id");
      
      if (lojaId) {
        query = query.or(`loja_id.eq.${lojaId},loja_id.is.null`);
      } else {
        query = query.is("loja_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;

      const typedData = (data as any[]) || [];

      // HÍBRIDO: Vamos separar os dados globais e locais
      const globais = typedData.filter(d => d.loja_id === null);
      const locais = lojaId ? typedData.filter(d => d.loja_id === lojaId) : [];

      const mergedMap = new Map<string, any>();
      
      // Aplica globais primeiro
      globais.forEach(item => {
        mergedMap.set(item.chave, item.valor);
      });
      
      // Sobrescreve com locais
      locais.forEach(item => {
        mergedMap.set(item.chave, item.valor); // Em implementações complexas poderíamos fazer merge profundo (lodash.merge)
      });

      // Atualiza o Zustand com os dados extraídos
      set({
        dadosLoja: mergedMap.get("dados_loja") || DEFAULT_DADOS_LOJA,
        paymentAsaas: mergedMap.get("payment_asaas") || DEFAULT_PAYMENT,
        dominios: mergedMap.get("dominios") || [],
        redirects: mergedMap.get("redirects") || [],
        scripts: mergedMap.get("scripts") || { head: "", body: "" },
        logo: mergedMap.get("logo") || "",
        cores: mergedMap.get("cores") || DEFAULT_CORES,
      });

    } catch (err: any) {
      console.error("Erro ao buscar configurações:", err);
    }
  },

  saveConfig: async (chave: string, valor: any, lojaId?: string) => {
    try {
      // Como a chave primária de configuracoes é (chave, loja_id), o upsert funciona bem.
      // Se loja_id for undefined ou nulo, salva como global.
      const payload = {
        chave,
        valor,
        loja_id: lojaId || null,
      };

      const { error } = await supabase.from("configuracoes" as any).upsert(payload, { onConflict: "chave,loja_id" });
      if (error) throw error;
      
    } catch (err: any) {
      console.error(`Erro ao salvar configuração ${chave}:`, err);
      toast.error(`Falha ao salvar a configuração ${chave}.`);
    }
  },

  setDadosLoja: (data, lojaId) => {
    const newState = { ...get().dadosLoja, ...data };
    set({ dadosLoja: newState });
    get().saveConfig("dados_loja", newState, lojaId);
  },

  setPaymentAsaas: (data, lojaId) => {
    const newState = { ...get().paymentAsaas, ...data };
    set({ paymentAsaas: newState });
    get().saveConfig("payment_asaas", newState, lojaId);
  },

  setScripts: (data, lojaId) => {
    const newState = { ...get().scripts, ...data };
    set({ scripts: newState });
    get().saveConfig("scripts", newState, lojaId);
  },

  addDomain: (nome, lojaId) => {
    const novos = [...get().dominios, { id: Date.now(), nome, status: "pendente", principal: false }];
    set({ dominios: novos });
    get().saveConfig("dominios", novos, lojaId);
  },

  removeDomain: (id, lojaId) => {
    const novos = get().dominios.filter(d => d.id !== id);
    set({ dominios: novos });
    get().saveConfig("dominios", novos, lojaId);
  },

  makePrincipal: (id, lojaId) => {
    const novos = get().dominios.map(d => ({ ...d, principal: d.id === id }));
    set({ dominios: novos });
    get().saveConfig("dominios", novos, lojaId);
  },

  addRedirect: (de, para, lojaId) => {
    const novos = [...get().redirects, { id: Date.now().toString(), de, para }];
    set({ redirects: novos });
    get().saveConfig("redirects", novos, lojaId);
  },

  removeRedirect: (id, lojaId) => {
    const novos = get().redirects.filter(r => r.id !== id);
    set({ redirects: novos });
    get().saveConfig("redirects", novos, lojaId);
  },

  addRedirectsBulk: (newRedirects, lojaId) => {
    const added = newRedirects.map((r, i) => ({ ...r, id: (Date.now() + i).toString() }));
    const novos = [...get().redirects, ...added];
    set({ redirects: novos });
    get().saveConfig("redirects", novos, lojaId);
  },
}));

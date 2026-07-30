import {
  EpharmaAuthToken,
  EpharmaBenefit,
  EpharmaProduct,
  EpharmaEligibility,
  EpharmaAuthorizationRequest,
  EpharmaAuthorizationResponse,
  EpharmaSaleRequest,
  EpharmaSaleResponse
} from "./types";

/**
 * e-Pharma SDK (Mock for Frontend Prototype)
 * 
 * Na versão final, essas chamadas devem ser feitas a partir de um Backend (Node.js/Next.js)
 * para não expor Client ID/Secret e poder lidar com o OAuth/CORS da e-Pharma.
 * 
 * Ambiente de Homologação real: https://servicesuat.epharma.com.br
 * Ambiente de Produção real: https://api.epharma.com.br
 */
export class EpharmaClient {
  private apiUrl: string;
  private token: string | null = null;

  constructor(env: "sandbox" | "production" = "sandbox") {
    this.apiUrl = env === "sandbox" ? "https://servicesuat.epharma.com.br" : "https://api.epharma.com.br";
  }

  /**
   * 1. Autenticação OAuth (Mock)
   */
  async authenticate(clientId: string, username: string, secret: string): Promise<EpharmaAuthToken> {
    console.log("[E-Pharma] Authenticating...", { clientId, username });
    
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.token = "mock_jwt_token_123456";
    
    return {
      access_token: this.token,
      token_type: "Bearer",
      expires_in: 3600
    };
  }

  /**
   * 2. Sincronização de Benefícios (Mock)
   * /Client/Industry/Associated/{CNPJ}
   * 
   * Na vida real, o backend vai rodar isso de madrugada (CRON) e atualizar os produtos no BD.
   */
  async syncCatalog(cnpj: string): Promise<{ benefits: EpharmaBenefit[], products: EpharmaProduct[] }> {
    console.log(`[E-Pharma] Syncing catalog for CNPJ: ${cnpj}`);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock response
    return {
      benefits: [
        {
          benefitId: 101,
          benefitName: "Programa Vida Mais",
          clientId: 202,
          clientName: "AstraZeneca",
          requiresAuthorization: true,
          requiresMembership: true,
          allowCustomMembership: true,
          userIdentifier: 1, // CPF
        }
      ],
      products: [
        {
          ean: "7891111111111",
          name: "SELOZOK 50MG",
          presentation: "30 COMPRIMIDOS",
          maximumPrice: 50.00,
          salePrice: 25.00,
          discountPercent: 50,
          discountPrice: 25.00,
          fixedPrice: false
        }
      ]
    };
  }

  /**
   * 3. Elegibilidade (Mock)
   * /Beneficiary/Elegibility
   * 
   * Antes do checkout, verifica se o cliente (CPF) tem direito e pega o Token de transação.
   */
  async checkEligibility(clientId: number, customerCpf: string): Promise<EpharmaEligibility> {
    console.log(`[E-Pharma] Checking eligibility for CPF: ${customerCpf}`);
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      hasDependents: false,
      cardholderNumber: "123456789",
      beneficiaryId: 9991,
      beneficiaryName: "João da Silva",
      token: "elegibility_token_abc_789",
      tokenExpirationDate: new Date(Date.now() + 86400000).toISOString() // +24h
    };
  }

  /**
   * 4. Cadastro de Beneficiário (Mock)
   * /Beneficiary/Register
   * 
   * Usado quando requiresMembership=true e allowCustomMembership=true
   */
  async registerBeneficiary(benefitId: number, fields: any[], quiz: any[]): Promise<boolean> {
    console.log(`[E-Pharma] Registering beneficiary for benefit ${benefitId}...`, { fields, quiz });
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true; // Sucesso
  }

  /**
   * 5. Autorização / Pré-Autorização E-commerce (Mock)
   * /transaction/api/v1/Authorization
   */
  async authorize(request: EpharmaAuthorizationRequest): Promise<EpharmaAuthorizationResponse> {
    console.log("[E-Pharma] Requesting authorization...", request);
    await new Promise(resolve => setTimeout(resolve, 1200));

    return {
      authorizationId: Math.floor(Math.random() * 1000000),
      expirationDate: new Date(Date.now() + 3600000).toISOString(),
      storeId: "1234",
      message: "Autorizado com sucesso",
      items: request.items.map(item => ({
        ean: item.ean,
        approvedQuantity: item.quantity,
        salePrice: item.salePrice,
        retailTransferValue: (item.storeMaximumPrice - item.salePrice) // Valor a ser subsidiado
      }))
    };
  }

  /**
   * 6. Efetivar Venda (Mock)
   * /transaction/api/v1/Sale
   * 
   * Envia os dados do cupom fiscal / NFCe para garantir o repasse financeiro.
   */
  async confirmSale(request: EpharmaSaleRequest): Promise<EpharmaSaleResponse> {
    console.log("[E-Pharma] Confirming sale...", request);
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      saleId: Math.floor(Math.random() * 1000000),
      saleReceipt: request.fiscalDocument.fiscalReceipt || "NFCe-Mock",
      code: 0, // 0 = Sucesso
      message: "Venda efetivada com sucesso"
    };
  }
}

// Instância padrão mockada para o protótipo
export const epharmaClient = new EpharmaClient();

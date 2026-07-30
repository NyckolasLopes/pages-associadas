import {
  ScanntechAuthToken,
  ScanntechCliente,
  ScanntechEvaluationRequest,
  ScanntechEvaluationResponse,
  ScanntechMovementRequest,
  ScanntechMovementResponse
} from "./types";

/**
 * Scanntech SDK (Mock for Frontend Prototype)
 * 
 * Implementação baseada na API Data Integration da Scanntech.
 * Esta API cuida das promoções de varejo, clube de descontos (CRM),
 * e registro de movimentos (cupons fiscais).
 * 
 * Ambiente Base: https://api.scanntech.com
 */
export class ScanntechClient {
  private apiUrl: string;
  private token: string | null = null;

  constructor(env: "sandbox" | "production" = "sandbox") {
    this.apiUrl = env === "sandbox" 
      ? "https://api-sandbox.scanntech.com" 
      : "https://api.scanntech.com";
  }

  /**
   * Autenticação OAuth2 / Basic Auth (Mock)
   */
  async authenticate(clientId: string, secret: string): Promise<ScanntechAuthToken> {
    console.log("[Scanntech] Authenticating...", { clientId });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.token = "scanntech_jwt_token_123";
    
    return {
      access_token: this.token,
      token_type: "Bearer",
      expires_in: 3600
    };
  }

  /**
   * API Clientes - Consulta / Cadastro de Cliente (Mock)
   * Verifica se o cliente tem perfil no Clube de Descontos.
   */
  async fetchCustomerProfile(cpf: string): Promise<ScanntechCliente> {
    console.log(`[Scanntech] Fetching profile for CPF: ${cpf}`);
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      document: cpf,
      documentType: "CPF",
      firstName: "Cliente",
      lastName: "Scanntech",
      loyaltyId: "CRM-999-888",
      optIn: true
    };
  }

  /**
   * API Promoções CRM - Avaliação de Carrinho (Mock)
   * Envia os itens do carrinho e o CPF do cliente para saber quais produtos
   * recebem desconto promocional ou pontos de cashback.
   */
  async evaluateCart(req: ScanntechEvaluationRequest): Promise<ScanntechEvaluationResponse> {
    console.log("[Scanntech] Evaluating Cart Promotions...", req);
    await new Promise(resolve => setTimeout(resolve, 900));

    // Mock: Dá desconto fictício no primeiro item para mostrar a funcionalidade
    const discounts = req.items.length > 0 ? [
      {
        articleId: req.items[0].articleId,
        discountAmount: req.items[0].amount * 0.15, // 15% de desconto
        promotionId: "PROM-SCAN-01",
        promotionName: "Promoção Clube Scanntech 15% OFF",
        type: "DISCOUNT" as const
      }
    ] : [];

    const totalDiscountAmount = discounts.reduce((acc, item) => acc + item.discountAmount, 0);

    return {
      transactionId: `TXN-${Math.floor(Math.random() * 10000)}`,
      totalDiscountAmount,
      discounts
    };
  }

  /**
   * API Movimentos - Registro de Venda (Mock)
   * Efetiva a transação enviando o "Cupom Fiscal" virtual para a Scanntech.
   * Usado para garantir que a promoção foi consumida e evitar fraudes.
   */
  async registerMovement(req: ScanntechMovementRequest): Promise<ScanntechMovementResponse> {
    console.log("[Scanntech] Registering Movement (Sale)...", req);
    await new Promise(resolve => setTimeout(resolve, 1100));

    return {
      status: "OK",
      movementId: `MOV-${Math.floor(Math.random() * 1000000)}`,
      message: "Venda registrada com sucesso no Data Integration."
    };
  }
}

export const scanntechClient = new ScanntechClient();

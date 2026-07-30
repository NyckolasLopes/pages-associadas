// Tipos baseados na documentação Scanntech - Data Integration APIs

export interface ScanntechAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// 07. API Clientes
export interface ScanntechCliente {
  document: string; // CPF ou CNPJ
  documentType: "CPF" | "CNPJ";
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  loyaltyId?: string; // ID interno de CRM
  optIn?: boolean;
}

// 05. API Promoções CRM
export interface ScanntechItemCarrinho {
  articleId: string; // EAN ou SKU
  quantity: number;
  amount: number; // Preço total do item no carrinho
}

export interface ScanntechEvaluationRequest {
  companyId: string;
  storeId: string;
  document?: string; // CPF do cliente
  items: ScanntechItemCarrinho[];
  transactionDate: string;
}

export interface ScanntechDiscountItem {
  articleId: string;
  discountAmount: number;
  promotionId: string;
  promotionName: string;
  type: "DISCOUNT" | "CASHBACK" | "POINTS";
}

export interface ScanntechEvaluationResponse {
  transactionId: string;
  totalDiscountAmount: number;
  discounts: ScanntechDiscountItem[];
}

// 04. API Movimentos e API Promoções (Fechamento da Venda)
export interface ScanntechMovementRequest {
  companyId: string;
  storeId: string;
  posId: string; // Caixa
  ticketNumber: string;
  transactionDate: string;
  cashierId?: string;
  document?: string; // CPF do cliente
  netAmount: number; // Valor pago (Subtotal - Descontos)
  totalAmount: number; // Valor original sem descontos
  totalDiscountAmount: number;
  items: {
    articleId: string;
    quantity: number;
    amount: number; // Valor sem desconto
    netAmount: number; // Valor com desconto
    discounts?: {
      promotionId: string;
      amount: number;
    }[];
  }[];
  payments: {
    paymentMethodId: string; // Dinheiro, Cartão, etc
    amount: number;
  }[];
}

export interface ScanntechMovementResponse {
  status: "OK" | "ERROR";
  movementId?: string;
  errorCode?: string;
  message?: string;
}

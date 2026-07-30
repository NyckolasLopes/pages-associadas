export interface EpharmaAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface EpharmaBenefit {
  benefitId: number;
  benefitName: string;
  clientId: number;
  clientName: string;
  requiresAuthorization: boolean;
  requiresMembership: boolean;
  allowCustomMembership: boolean;
  userIdentifier: number; // 1 = CPF, 2 = Cupom
}

export interface EpharmaProduct {
  ean: string;
  name: string;
  presentation: string;
  maximumPrice: number; // PMC
  salePrice: number;
  discountPercent: number;
  discountPrice: number;
  fixedPrice: boolean;
}

export interface EpharmaEligibility {
  hasDependents: boolean;
  cardholderNumber: string;
  beneficiaryId: number;
  beneficiaryName: string;
  token: string; // Token de elegibilidade para compra
  tokenExpirationDate: string;
}

export interface EpharmaAuthorizationRequest {
  storeSequenceId: string;
  storeCnpj: string;
  typeorigintransaction: number; // 1 = Loja, 2 = APP, 3 = Site
  preAuthorizationId?: string; // Para e-commerce, id da pré-autorização
  prescription?: {
    prescriptor: {
      medicalProfessionalCouncil: number; // 1 = CRM, 2 = CRO
      prescriptorId: string;
      prescritorState: string;
    };
    date: string;
  };
  items: {
    ean: string;
    quantity: number;
    storeMaximumPrice: number;
    salePrice: number;
    categoryId: number; // sempre 0
    productName: string;
  }[];
}

export interface EpharmaAuthorizationResponse {
  authorizationId: number;
  expirationDate: string;
  storeId: string;
  message: string;
  items: {
    ean: string;
    approvedQuantity: number;
    salePrice: number;
    retailTransferValue: number; // subsidio
    rejectionReason?: string;
  }[];
}

export interface EpharmaSaleRequest {
  authorizationId: number;
  storeSequenceId: string;
  storeCnpj: string;
  typeorigintransaction: number;
  fiscalDocument: {
    fiscalDocumentType: number; // 100=Cupom, 200=NFCe, 300=SAT
    fiscalReceipt?: string;
    fiscalPrinter?: string;
    electronicKey?: string; // NFCe ou SAT chave (44 caracteres)
  };
  items: {
    ean: string;
    quantity: number;
    storeMaximumPrice: number;
    storePrice: number;
    salePrice: number;
    categoryId: number;
    productName: string;
  }[];
}

export interface EpharmaSaleResponse {
  saleId: number;
  saleReceipt: string;
  code: number;
  message: string;
}

// Tipos baseados na documentação TrackingSales 3.0 - Zicard (Dermaclub)

export interface ZicardItemCupom {
  tipoProduto: number; // 0 = EAN13, 1 = SKU
  codigoProduto: string;
  precoUnitario: number;
  qtdeVendida: number;
}

export interface ZicardItemDesconto {
  idCampanha: number;
  tipoProduto: number;
  codigoProduto: string;
  flagTipoDesconto: string; // 0 = Valor Absoluto, 1 = Percentual
  descontoUnitario: number;
  qtdeAprovada: number;
  idStatus: number; // 1 = Excedeu limite, 2 = Sorteio, 3 = Desconto normal, 4 = Não participante, 5 = Limite parcial, 6 = Pontos
}

// 5.6 Consulta Descontos Prévios
export interface ZicardConsultaDescontoPrevioReq {
  cnpj: number;
  canalVenda?: string; // "02" = ECOMMERCE
  itensCupom: ZicardItemCupom[];
}

export interface ZicardConsultaDescontoPrevioRes {
  nsuHost: number;
  codigoResposta: string; // "00" = Aprovada
  itensDesconto: ZicardItemDesconto[];
}

// 5.4 Buscar Identificação
export interface ZicardCredencial {
  identificacao: string; // CPF
  idProjeto: number;
  tipoCaptura: number; // 0 = Digitado, 1 = CPF, 2 = CodBarras, 3 = Ausente
}

export interface ZicardStatusCredencial {
  idProjeto: number;
  idStatus: number; // 0=Invalida, 1=Valida, 2=Inativa, 3=Bloqueada, 4=Excedida
  nome?: string;
  sobrenome?: string;
}

export interface ZicardBuscarIdentificacaoReq {
  cnpj: number;
  credenciais: ZicardCredencial[];
}

export interface ZicardBuscarIdentificacaoRes {
  codigoResposta: string;
  statusCredenciais: ZicardStatusCredencial[];
}

// 5.7 Registra Descontos
export interface ZicardItemRegistroDesconto {
  idCampanha: number;
  tipoProduto: number;
  codigoProduto: string;
  precoUnitario: number;
  descUnitario?: number;
  descTotal?: number;
  qtdeVendida: number;
}

export interface ZicardRegistraDescontosReq {
  cnpj: number;
  idTerminal: string;
  nsuReq: number;
  numeroSessao: string;
  numeroCupom?: string; // Obrigatório se CodigoFinalizacao = "00"
  codigoFinalizacao: number; // 00=OK, 86=NOK, 87=NOK Terminal Invalido
  bin?: number;
  descontoFinanceiro?: number;
  dataHora: string; // YYYY-MM-DDTHH:MI:SS.FFF
  itensDescontos?: ZicardItemRegistroDesconto[];
  formaPagamento?: string; // 01=Dinheiro, 02=Debito, 03=Credito, etc
  valorCashback?: number;
  cepEntrega?: string; // Obrigatório para E-commerce
}

export interface ZicardRegistraDescontosRes {
  nsuHost: number;
  codigoResposta: string;
  msgPromocional?: string;
}

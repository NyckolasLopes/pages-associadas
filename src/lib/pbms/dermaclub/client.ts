import {
  ZicardConsultaDescontoPrevioReq,
  ZicardConsultaDescontoPrevioRes,
  ZicardBuscarIdentificacaoReq,
  ZicardBuscarIdentificacaoRes,
  ZicardRegistraDescontosReq,
  ZicardRegistraDescontosRes
} from "./types";

/**
 * Zicard / Dermaclub SDK (Mock for Frontend Prototype)
 * 
 * Implementação baseada na API TrackingSales 3.0 (Zicard).
 * Na versão final, essas requisições devem ocorrer no backend por questões de segurança (chaves API).
 * 
 * Ambiente de Homologação: https://api-autorizadorzeushml-v3.trackingsales.com.br/api/autorizador-v3
 */
export class DermaclubClient {
  private apiUrl: string;
  private idProjetoDermaclub = 15; // ID fictício para o projeto Dermaclub na Zicard

  constructor(env: "sandbox" | "production" = "sandbox") {
    this.apiUrl = env === "sandbox" 
      ? "https://api-autorizadorzeushml-v3.trackingsales.com.br/api/autorizador-v3" 
      : "https://api-autorizadorzeus-v3.trackingsales.com.br/api/autorizador-v3"; // URL de prod suposta
  }

  /**
   * 1. Consulta Descontos Prévios
   * Utilizado no e-commerce (CanalVenda = 02) para calcular descontos no carrinho 
   * sem precisar abrir uma "sessão" física no PDV.
   */
  async consultaDescontosPrevios(req: ZicardConsultaDescontoPrevioReq): Promise<ZicardConsultaDescontoPrevioRes> {
    console.log("[Dermaclub] Consulta Descontos Prévios...", req);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock: Dá desconto no primeiro item (como se fosse um produto Dermaclub)
    const itensDesconto = req.itensCupom.map(item => ({
      idCampanha: 1001,
      tipoProduto: item.tipoProduto,
      codigoProduto: item.codigoProduto,
      flagTipoDesconto: "1", // Percentual
      descontoUnitario: 10, // 10% de desconto
      qtdeAprovada: item.qtdeVendida,
      idStatus: 3 // Desconto normal
    }));

    return {
      nsuHost: Math.floor(Math.random() * 1000000),
      codigoResposta: "00", // Aprovada
      itensDesconto
    };
  }

  /**
   * 2. Buscar Identificação
   * Consulta na base da Zicard se o CPF tem cadastro no programa Dermaclub.
   */
  async buscarIdentificacao(req: ZicardBuscarIdentificacaoReq): Promise<ZicardBuscarIdentificacaoRes> {
    console.log("[Dermaclub] Buscar Identificação...", req);
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      codigoResposta: "00",
      statusCredenciais: req.credenciais.map(cred => ({
        idProjeto: cred.idProjeto,
        idStatus: 1, // Credencial Válida
        nome: "Maria",
        sobrenome: "Silva"
      }))
    };
  }

  /**
   * 3. Registra Descontos
   * Finaliza a venda enviando os dados do Cupom Fiscal e o valor descontado.
   * Utiliza o CodigoFinalizacao: 00 (Sucesso), 86 (Cancelar).
   */
  async registraDescontos(req: ZicardRegistraDescontosReq): Promise<ZicardRegistraDescontosRes> {
    console.log("[Dermaclub] Registra Descontos (Venda Efetivada)...", req);
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (req.codigoFinalizacao === 86) {
      return {
        nsuHost: Math.floor(Math.random() * 1000000),
        codigoResposta: "86",
      };
    }

    return {
      nsuHost: Math.floor(Math.random() * 1000000),
      codigoResposta: "00",
      msgPromocional: "Parabéns! Você economizou R$ X no Dermaclub."
    };
  }
}

export const dermaclubClient = new DermaclubClient();

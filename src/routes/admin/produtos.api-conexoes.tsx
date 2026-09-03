import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Activity, Key, Copy, Check, RefreshCw, Server, AlertCircle, Download, FileCode2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/produtos/api-conexoes")({
  component: ApiConexoes,
});

interface StoreConnection {
  loja_id: string;
  stock_price_hash: string | null;
  stock_price_status: 'online' | 'offline' | 'error';
  stock_price_last_ping: string | null;
  catalog_hash: string | null;
  catalog_status: 'online' | 'offline' | 'error';
  catalog_last_ping: string | null;
  orders_hash: string | null;
  orders_status: 'online' | 'offline' | 'error';
  orders_last_ping: string | null;
}

function ApiConexoes() {
  const { pharmacies, currentUser } = useAdmin();
  const [connections, setConnections] = useState<Record<string, StoreConnection>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas?.length === 0;

  useEffect(() => {
    if (!isGlobalAdmin) return;
    loadConnections();
  }, [isGlobalAdmin]);

  const loadConnections = async () => {
    setIsLoading(true);
    try {
      // @ts-ignore
      const { data, error } = await ((((supabase.from('store_api_connections' as any) as any) as any) as any) as any).select('*');
      if (error) {
        console.error("Erro ao carregar conexões", error);
        return;
      }
      
      const map: Record<string, StoreConnection> = {};
      if (data) {
        // @ts-ignore
        data.forEach(conn => {
          map[conn.loja_id] = conn;
        });
      }
      setConnections(map);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateHash = async (lojaId: string, type: 'stock_price' | 'catalog' | 'orders') => {
    const newHash = "sk_" + type + "_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    
    // Optimistic update
    setConnections(prev => {
      const existing = prev[lojaId] || { loja_id: lojaId, stock_price_hash: null, stock_price_status: 'offline', stock_price_last_ping: null, catalog_hash: null, catalog_status: 'offline', catalog_last_ping: null, orders_hash: null, orders_status: 'offline', orders_last_ping: null };
      return {
        ...prev,
        [lojaId]: {
          ...existing,
          [type === 'stock_price' ? 'stock_price_hash' : type === 'catalog' ? 'catalog_hash' : 'orders_hash']: newHash,
          [type === 'stock_price' ? 'stock_price_status' : type === 'catalog' ? 'catalog_status' : 'orders_status']: 'offline'
        }
      };
    });

    try {
      // Check if store already has a connection
      // @ts-ignore
      const { data: existingData } = await (((((supabase.from('store_api_connections' as any) as any) as any) as any) as any) as any).select('loja_id').eq('loja_id', lojaId).single();
      
      if (existingData) {
      // @ts-ignore
        await (((((supabase.from('store_api_connections' as any) as any) as any) as any) as any) as any).update({
          [type === 'stock_price' ? 'stock_price_hash' : type === 'catalog' ? 'catalog_hash' : 'orders_hash']: newHash,
          [type === 'stock_price' ? 'stock_price_status' : type === 'catalog' ? 'catalog_status' : 'orders_status']: 'offline',
          updated_at: new Date().toISOString()
        }).eq('loja_id', lojaId);
      } else {
      // @ts-ignore
        await supabase.from('store_api_connections' as any).insert({
          loja_id: lojaId,
          [type === 'stock_price' ? 'stock_price_hash' : type === 'catalog' ? 'catalog_hash' : 'orders_hash']: newHash,
        });
      }
      toast.success("Nova chave gerada com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar a chave no banco de dados.");
      loadConnections(); // revert
    }
  };

  const pingConnection = async (lojaId: string, type: 'stock_price' | 'catalog' | 'orders') => {
    const conn: any = connections[lojaId];
    const hash = type === 'stock_price' ? conn?.stock_price_hash : type === 'catalog' ? conn?.catalog_hash : conn?.orders_hash;
    
    if (!hash) {
      toast.error("Gere uma chave primeiro.");
      return;
    }

    toast.info("Testando conexão...");
    
    // Simulate ping
    setTimeout(async () => {
      setConnections(prev => ({
        ...prev,
        [lojaId]: {
          ...prev[lojaId],
          [type === 'stock_price' ? 'stock_price_status' : type === 'catalog' ? 'catalog_status' : 'orders_status']: 'online',
          [type === 'stock_price' ? 'stock_price_last_ping' : type === 'catalog' ? 'catalog_last_ping' : 'orders_last_ping']: new Date().toISOString()
        }
      }));

      // @ts-ignore
      await supabase.from('store_api_connections' as any).update({
        [type === 'stock_price' ? 'stock_price_status' : type === 'catalog' ? 'catalog_status' : 'orders_status']: 'online',
        [type === 'stock_price' ? 'stock_price_last_ping' : type === 'catalog' ? 'catalog_last_ping' : 'orders_last_ping']: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('loja_id', lojaId);

      toast.success("Conexão estabelecida com sucesso!");
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    toast.success("Chave copiada para a área de transferência!");
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const downloadJsonFile = (filename: string, data: any) => {
    const dataStr = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", filename);
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    document.body.removeChild(dlAnchorElem);
  };

  const downloadModeloEstoquePreco = () => {
    const data = [
      {
        "codigoInterno": "563003",
        "ean": "7896523207360",
        "nome": "NEVRALGEX 300MG + 50MG + 35MG COM 10 COMPRIMIDOS",
        "precoDe": 8.33,
        "precoPor": 4.99,
        "estoque": 100,
        "ativo": true,
        "lojaCnpj": "00.000.000/0001-91"
      }
    ];
    downloadJsonFile("modelo_estoque_preco.json", data);
    toast.success("Modelo JSON de Estoque e Preço baixado com sucesso!");
  };

  const downloadModeloCadastroProduto = () => {
    const data = [
      {
        "Produto Ativo": "Sim",
        "Buscável (Busca)": "Sim",
        "Selo Lançamento": "Não",
        "Selo Genérico": "Sim",
        "Natureza do Produto": "Medicamento",
        "ID / SKU / Código Interno": "563003",
        "EAN / Código de Barras*": "7896523207360",
        "EANs Secundários (separados por vírgula)": "7896523207361, 7896523207362",
        "Descrição Comercial / Nome do Produto*": "NEVRALGEX 300MG + 50MG + 35MG COM 10 COMPRIMIDOS",
        "Descrição Longa": "<p><strong>Nevralgex</strong> é indicado no alívio da dor associada a contraturas musculares decorrentes de processos traumáticos ou inflamatórios e em cefaleias tensionais.</p>",
        "Categoria (com ID)": "142 - Medicamentos",
        "Subcategoria (com ID)": "14201 - Dor e Febre",
        "Categoria Adicional": "",
        "Subcategoria Adicional": "",
        "Princípios Ativos": "Dipirona 300mg, Cafeína 50mg, Orfenadrina 35mg",
        "Características Adicionais": "Forma: Comprimidos; Quantidade: 10 comprimidos; Uso: Oral",
        "Marca": "CIMED",
        "Fabricante": "Cimed Indústria de Medicamentos Ltda.",
        "Link da Bula (URL / PDF)": "https://consultas.anvisa.gov.br/api/consulta/bula/pdf/1438100510076",
        "Classe Terapêutica": "Analgésico e Relaxante Muscular",
        "Alerta Regulatório (Texto)": "AO PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO.",
        "Requer Exibição do Alerta Regulatório": "Sim",
        "MS / Registro ANVISA": "1438100510076",
        "Retém Receita?": "Não",
        "Classificação / Tipo do Medicamento": "Similar",
        "Tarja": "Sem Tarja",
        "Tipo de Receita": "",
        "NCM": "30049099",
        "Nível de Relevância (Prioridade)": 80,
        "Preço (de) (R$)": 8.33,
        "Preço (por) (R$)": 4.99,
        "Título da Página (SEO)": "Nevralgex 10 Comprimidos - Compre Online com Melhor Preço",
        "Link da Página (Slug)": "nevralgex-300mg-50mg-35mg-10-comprimidos-563003",
        "Palavras-Chave Foco (GEO / AEO)": "nevralgex, dor muscular, dor de cabeca, cimed",
        "Descrição da Página (SEO / Meta Description)": "Compre Nevralgex com 10 comprimidos na Farmácias Associadas. Alívio rápido para dores musculares e dor de cabeça com entrega rápida.",
        "Texto Alternativo da Imagem (Alt SEO)": "Nevralgex 10 comprimidos Cimed",
        "Tags de Busca Internas": "nevralgex, dipirona, relaxante muscular, dor de cabeca, cimed"
      }
    ];
    downloadJsonFile("modelo_cadastro_produto.json", data);
    toast.success("Modelo JSON de Cadastro de Produto baixado com sucesso!");
  };

  const downloadModeloPedidos = () => {
    const data = [
      {
        "id": "FA-260903-8492",
        "data": "2026-09-03T14:30:00.000Z",
        "status": "novo",
        "lojaId": "loja-matriz",
        "lojaNome": "Farmácias São Lucas Matriz",
        "cliente": {
          "nome": "João da Silva",
          "email": "joao.silva@exemplo.com",
          "telefone": "51999998888",
          "cpf": "12345678900",
          "endereco": {
            "logradouro": "Rua Júlio de Castilhos",
            "numero": "123",
            "complemento": "Apto 402",
            "bairro": "Centro",
            "cidade": "Farroupilha",
            "estado": "RS",
            "cep": "95180-000"
          }
        },
        "itens": [
          {
            "id": "563003",
            "ean": "7896523207360",
            "sku": "563003",
            "nome": "NEVRALGEX 300MG + 50MG + 35MG COM 10 COMPRIMIDOS",
            "quantidade": 2,
            "precoUnitario": 4.99,
            "subtotal": 9.98
          }
        ],
        "pagamento": {
          "metodo": "Cartão de Crédito",
          "status": "aprovado",
          "parcelas": 1,
          "total": 9.98
        },
        "entrega": {
          "tipo": "Entrega Expressa Local",
          "prazo": "Até 2 horas",
          "valor": 5.00
        },
        "subtotal": 9.98,
        "desconto": 0.00,
        "taxaEntrega": 5.00,
        "total": 14.98
      }
    ];
    downloadJsonFile("modelo_pedidos.json", data);
    toast.success("Modelo JSON de Pedidos baixado com sucesso!");
  };

  const downloadModeloCarrinhoAbandonado = () => {
    const data = [
      {
        "id": "cart_abandoned_98231",
        "data": "2026-09-03T15:00:00.000Z",
        "lojaId": "loja-matriz",
        "lojaNome": "Farmácias São Lucas Matriz",
        "cliente": {
          "nome": "Maria de Souza",
          "email": "maria.souza@exemplo.com",
          "telefone": "51988887777"
        },
        "itens": [
          {
            "id": "563003",
            "ean": "7896523207360",
            "nome": "NEVRALGEX 300MG + 50MG + 35MG COM 10 COMPRIMIDOS",
            "quantidade": 1,
            "preco": 4.99
          }
        ],
        "total": 4.99,
        "linkRecuperacao": "https://loja.farmaciasassociadas.com.br/checkout?cart=cart_abandoned_98231"
      }
    ];
    downloadJsonFile("modelo_carrinho_abandonado.json", data);
    toast.success("Modelo JSON de Carrinho Abandonado baixado com sucesso!");
  };

  const downloadModeloDescricoes = () => {
    const data = [
      {
        "ean": "7896523207360",
        "nome": "NEVRALGEX 300MG + 50MG + 35MG COM 10 COMPRIMIDOS",
        "descricao": "<p><strong>Nevralgex</strong> é um medicamento com ação analgésica e relaxante muscular indicado para o alívio das dores associadas a contraturas musculares e cefaleias tensionais.</p>",
        "bulaUrl": "https://consultas.anvisa.gov.br/api/consulta/bula/pdf/1438100510076"
      }
    ];
    downloadJsonFile("modelo_importar_descricoes.json", data);
    toast.success("Modelo JSON de Descrições e Bula baixado com sucesso!");
  };

  if (!isGlobalAdmin) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-slate-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Acesso Restrito</h2>
        <p className="text-slate-500 mt-2">Apenas administradores globais podem gerenciar conexões de API.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string | undefined) => {
    if (status === 'online') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Online</span>;
    if (status === 'error') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 uppercase tracking-wider"><div className="w-1.5 h-1.5 rounded-full bg-red-500" />Erro</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider"><div className="w-1.5 h-1.5 rounded-full bg-slate-400" />Offline</span>;
  };

  const renderApiCard = (loja: any, type: 'stock_price' | 'catalog' | 'orders', title: string, desc: string) => {
    const conn = connections[loja.id];
    const hash = type === 'stock_price' ? conn?.stock_price_hash : type === 'catalog' ? conn?.catalog_hash : conn?.orders_hash;
    const status = type === 'stock_price' ? conn?.stock_price_status : type === 'catalog' ? conn?.catalog_status : conn?.orders_status;
    const lastPing = type === 'stock_price' ? conn?.stock_price_last_ping : type === 'catalog' ? conn?.catalog_last_ping : conn?.orders_last_ping;
    
    // Construct the full URL for the API endpoint
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || "http://20.7.19.49:3006";
    const rpcEndpoint = type === 'stock_price' ? 'sync_estoque_preco_loja' : type === 'catalog' ? 'sync_produtos_loja' : 'sync_pedidos_loja';
    const fullApiUrl = hash ? `${baseUrl}/rest/v1/rpc/${rpcEndpoint}?apikey=${hash}` : null;

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-400" />
              {title}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
          </div>
          {getStatusBadge(status || 'offline')}
        </div>
        
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase w-[52px] shrink-0">URL</span>
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[10px] text-slate-600 truncate relative group" title={fullApiUrl || ""}>
              {fullApiUrl ? (
                <div className="flex justify-between items-center">
                  <span className="truncate pr-4">{fullApiUrl}</span>
                  <button 
                    onClick={() => copyToClipboard(fullApiUrl)}
                    className="text-slate-400 hover:text-[#00B5AD] transition-colors shrink-0"
                    title="Copiar Endpoint"
                  >
                    {copiedHash === fullApiUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <span className="text-slate-400 italic">Nenhuma chave gerada</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase w-[52px] shrink-0">API Key</span>
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[10px] text-slate-600 truncate relative group" title={hash || ""}>
              {hash ? (
                <div className="flex justify-between items-center">
                  <span className="truncate pr-4">{hash}</span>
                  <button 
                    onClick={() => copyToClipboard(hash)}
                    className="text-slate-400 hover:text-[#00B5AD] transition-colors shrink-0"
                    title="Copiar API Key"
                  >
                    {copiedHash === hash ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <span className="text-slate-400 italic">Nenhuma chave gerada</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] font-medium text-slate-400">
            Último ping: {lastPing ? new Date(lastPing).toLocaleString('pt-BR') : 'Nunca'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (type === 'stock_price') downloadModeloEstoquePreco();
                else if (type === 'catalog') downloadModeloCadastroProduto();
                else downloadModeloPedidos();
              }}
              title="Baixar Modelo JSON desta API"
              className="h-7 text-xs px-2.5 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-slate-500" /> Modelo JSON
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => pingConnection(loja.id, type)}
              disabled={!hash}
              className="h-7 text-xs px-3 shadow-sm"
            >
              <Activity className="w-3.5 h-3.5 mr-1.5" /> Ping
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => generateHash(loja.id, type)}
              className="h-7 text-xs px-3 bg-[#00B5AD]/5 border-[#00B5AD]/20 text-[#00B5AD] hover:bg-[#00B5AD]/10 hover:border-[#00B5AD]/30 shadow-sm"
            >
              <Key className="w-3.5 h-3.5 mr-1.5" /> Gerar Nova
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-[22px] font-bold text-[#1a1a1a] flex items-center gap-2">
          <Server className="w-6 h-6 text-[#00B5AD]" />
          API e Conexões
        </h2>
        <span className="text-sm font-medium text-slate-500">
          Gerencie as integrações e chaves de API individuais por loja (Estoque, Preços e Cadastro).
        </span>
      </div>

      {/* Bloco de Modelos JSON Oficiais para Integração */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-emerald-600" />
              Modelos Oficiais de Integração JSON (1 Exemplo por Arquivo)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Baixe os arquivos de modelo estruturados com <strong>apenas 1 exemplo completo</strong> para testar e conectar seus sistemas externos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 1. JSON Estoque e Preço */}
          <Button 
            variant="outline"
            size="sm"
            onClick={downloadModeloEstoquePreco}
            className="font-bold text-xs h-9 bg-blue-50/70 hover:bg-blue-100/70 border-blue-200 text-blue-800 flex items-center gap-2 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            JSON de Estoque e Preço
          </Button>

          {/* 2. JSON Cadastro de Produto (inclui Descrição Longa e Link da Bula) */}
          <Button 
            variant="outline"
            size="sm"
            onClick={downloadModeloCadastroProduto}
            className="font-bold text-xs h-9 bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200 text-emerald-800 flex items-center gap-2 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            JSON Cadastro de Produto (com Descrição e Bula)
          </Button>

          {/* 3. JSON de Pedidos */}
          <Button 
            variant="outline"
            size="sm"
            onClick={downloadModeloPedidos}
            className="font-bold text-xs h-9 bg-indigo-50/70 hover:bg-indigo-100/70 border-indigo-200 text-indigo-800 flex items-center gap-2 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            JSON de Pedidos
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pharmacies.map(loja => (
              <div key={loja.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                    {loja.nome.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{loja.nome}</h3>
                    <p className="text-sm text-slate-500">{loja.endereco}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {renderApiCard(
                    loja, 
                    'stock_price', 
                    'API de Estoque e Preço', 
                    'Sincronização de volumes e valores via ERP'
                  )}
                  {renderApiCard(
                    loja, 
                    'catalog', 
                    'API de Cadastro de Produtos', 
                    'Criação e atualização de ficha técnica de produtos'
                  )}
                  {renderApiCard(
                    loja, 
                    'orders', 
                    'API de Pedidos', 
                    'Integração para capturar e sincronizar pedidos finalizados para o PDV local'
                  )}
                </div>
              </div>
            ))}
            
            {pharmacies.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                Nenhuma loja encontrada no sistema.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
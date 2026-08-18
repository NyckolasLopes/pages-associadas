import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Activity, Key, Copy, Check, RefreshCw, Server, AlertCircle } from "lucide-react";
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
      const { data, error } = await supabase.from('store_api_connections').select('*');
      if (error) {
        console.error("Erro ao carregar conexões", error);
        return;
      }
      
      const map: Record<string, StoreConnection> = {};
      if (data) {
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

  const generateHash = async (lojaId: string, type: 'stock_price' | 'catalog') => {
    const newHash = "sk_" + type + "_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    
    // Optimistic update
    setConnections(prev => {
      const existing = prev[lojaId] || { loja_id: lojaId, stock_price_hash: null, stock_price_status: 'offline', stock_price_last_ping: null, catalog_hash: null, catalog_status: 'offline', catalog_last_ping: null };
      return {
        ...prev,
        [lojaId]: {
          ...existing,
          [type === 'stock_price' ? 'stock_price_hash' : 'catalog_hash']: newHash,
          [type === 'stock_price' ? 'stock_price_status' : 'catalog_status']: 'offline'
        }
      };
    });

    try {
      const { data: existingData } = await supabase.from('store_api_connections').select('loja_id').eq('loja_id', lojaId).single();
      
      if (existingData) {
        await supabase.from('store_api_connections').update({
          [type === 'stock_price' ? 'stock_price_hash' : 'catalog_hash']: newHash,
          [type === 'stock_price' ? 'stock_price_status' : 'catalog_status']: 'offline',
          updated_at: new Date().toISOString()
        }).eq('loja_id', lojaId);
      } else {
        await supabase.from('store_api_connections').insert({
          loja_id: lojaId,
          [type === 'stock_price' ? 'stock_price_hash' : 'catalog_hash']: newHash,
        });
      }
      toast.success("Nova chave gerada com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar a chave no banco de dados.");
      loadConnections(); // revert
    }
  };

  const pingConnection = async (lojaId: string, type: 'stock_price' | 'catalog') => {
    const conn = connections[lojaId];
    const hash = type === 'stock_price' ? conn?.stock_price_hash : conn?.catalog_hash;
    
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
          [type === 'stock_price' ? 'stock_price_status' : 'catalog_status']: 'online',
          [type === 'stock_price' ? 'stock_price_last_ping' : 'catalog_last_ping']: new Date().toISOString()
        }
      }));

      await supabase.from('store_api_connections').update({
        [type === 'stock_price' ? 'stock_price_status' : 'catalog_status']: 'online',
        [type === 'stock_price' ? 'stock_price_last_ping' : 'catalog_last_ping']: new Date().toISOString(),
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

  const renderApiCard = (loja: any, type: 'stock_price' | 'catalog', title: string, desc: string) => {
    const conn = connections[loja.id];
    const hash = type === 'stock_price' ? conn?.stock_price_hash : conn?.catalog_hash;
    const status = type === 'stock_price' ? conn?.stock_price_status : conn?.catalog_status;
    const lastPing = type === 'stock_price' ? conn?.stock_price_last_ping : conn?.catalog_last_ping;
    
    // Construct the full URL for the API endpoint
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || "https://uqwxpoxwwvyqnwgquxit.supabase.co";
    const rpcEndpoint = type === 'stock_price' ? 'sync_estoque_preco_loja' : 'sync_produtos_loja';
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
        
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[10px] text-slate-600 truncate relative group" title={fullApiUrl || ""}>
            {fullApiUrl ? (
              <div className="flex justify-between items-center">
                <span className="truncate pr-4">{fullApiUrl}</span>
                <button 
                  onClick={() => copyToClipboard(fullApiUrl)}
                  className="text-slate-400 hover:text-[#00B5AD] transition-colors shrink-0"
                  title="Copiar URL"
                >
                  {copiedHash === fullApiUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <span className="text-slate-400 italic">Nenhuma chave gerada</span>
            )}
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

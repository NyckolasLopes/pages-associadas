// @ts-nocheck
import { useState } from "react";
import { Copy, Check, Code, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const PEDIDO_STATUS_OPTIONS = [
  { value: "novo",           label: "Pedido Recebido",             color: "bg-sky-100 text-sky-700" },
  { value: "Em separação",   label: "Em Separação",                color: "bg-blue-100 text-blue-700" },
  { value: "Pronto",         label: "Pronto para retirada",        color: "bg-orange-100 text-orange-700" },
  { value: "Em rota",        label: "Em rota de entrega",          color: "bg-purple-100 text-purple-700" },
  { value: "Entregue",       label: "Entregue",                    color: "bg-teal-100 text-teal-700" },
  { value: "Cancelado",      label: "Cancelado",                   color: "bg-red-100 text-red-700" },
];

export const STATUS_COLORS_MAP: Record<string, string> = Object.fromEntries(
  PEDIDO_STATUS_OPTIONS.map(s => [s.value, s.color])
);

export const STATUS_LABEL_MAP: Record<string, string> = Object.fromEntries(
  PEDIDO_STATUS_OPTIONS.map(s => [s.value, s.label])
);

function CodeBlock({ code, language = "json" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-slate-900 text-green-400 text-xs rounded-xl p-4 overflow-x-auto font-mono leading-relaxed border border-slate-700">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="absolute top-2 right-2 h-7 w-7 p-0 bg-slate-800 hover:bg-slate-700 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </Button>
    </div>
  );
}

interface OrderStatusApiDocProps {
  lojaId?: string;
  apiKey?: string;
}

export function OrderStatusApiDoc({ lojaId, apiKey }: OrderStatusApiDocProps) {
  const baseUrl = "https://farmaciasassociadas.com.br";
  const examplePedidoId = "550e8400-e29b-41d4-a716-446655440000";
  const displayKey = apiKey || "sk_orders_SUA_CHAVE_AQUI";

  const updateStatusExample = JSON.stringify({
    api_key: displayKey,
    p_pedido_id: examplePedidoId,
    p_novo_status: "Em separação"
  }, null, 2);

  const getOrdersExample = JSON.stringify({
    api_key: displayKey
  }, null, 2);

  const curlUpdateStatus = `curl -X POST '${baseUrl}/functions/v1/update-order-status' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify({
    api_key: displayKey,
    p_pedido_id: examplePedidoId,
    p_novo_status: "Em separação"
  })}'`;

  const curlGetOrders = `curl -X POST '${baseUrl}/functions/v1/get-orders' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify({ api_key: displayKey })}'`;

  // Supabase RPC direct call (via REST API)
  const supabaseRpcUpdate = `curl -X POST 'https://SEU_PROJECT_ID.supabase.co/rest/v1/rpc/update_pedido_status_loja' \\
  -H 'apikey: SUA_SUPABASE_ANON_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify({
    api_key: displayKey,
    p_pedido_id: examplePedidoId,
    p_novo_status: "Entregue"
  })}'`;

  const responseSuccessExample = JSON.stringify({
    sucesso: true,
    pedido_id: examplePedidoId,
    novo_status: "Em separação",
    updated_at: new Date().toISOString()
  }, null, 2);

  const responseErrorExample = JSON.stringify({
    code: "P0001",
    message: "Chave de API invalida ou nao autorizada"
  }, null, 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-base">API de Status de Pedidos</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Endpoint para atualização automática via ERP/sistema externo
          </p>
        </div>
      </div>

      {/* Status Values Reference */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Code className="w-3.5 h-3.5" />
          Valores de Status Aceitos
        </div>
        <div className="grid grid-cols-1 gap-2">
          {PEDIDO_STATUS_OPTIONS.map(s => (
            <div key={s.value} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2">
                <span>{s.icon}</span>
                <span className="font-medium text-sm text-slate-700">{s.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${s.color} border-0 text-xs font-mono`}>{s.value}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700"
                  onClick={() => {
                    navigator.clipboard.writeText(s.value);
                    toast.success(`"${s.value}" copiado!`);
                  }}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Endpoint 1: Atualizar Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Endpoint: Atualizar Status do Pedido
          </div>
          <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs font-mono">POST</Badge>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="text-xs font-mono text-slate-700 break-all">
            <span className="text-indigo-600 font-bold">POST</span>{" "}
            <span className="text-slate-900">/rest/v1/rpc/update_pedido_status_loja</span>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-600 mb-1">Corpo da Requisição (JSON):</div>
        <CodeBlock code={updateStatusExample} />

        <div className="text-xs font-bold text-slate-600 mb-1">Exemplo via cURL:</div>
        <CodeBlock code={supabaseRpcUpdate} />

        <div className="text-xs font-bold text-slate-600 mb-1">Resposta de Sucesso:</div>
        <CodeBlock code={responseSuccessExample} />

        <div className="text-xs font-bold text-slate-600 mb-1">Resposta de Erro (API Key inválida):</div>
        <CodeBlock code={responseErrorExample} />
      </div>

      {/* Endpoint 2: Listar Pedidos */}
      <div className="space-y-3 border-t border-slate-100 pt-6">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Endpoint: Listar Pedidos da Loja
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs font-mono">POST RPC</Badge>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="text-xs font-mono text-slate-700 break-all">
            <span className="text-emerald-600 font-bold">POST</span>{" "}
            <span className="text-slate-900">/rest/v1/rpc/get_pedidos_loja</span>
          </div>
        </div>
        <div className="text-xs font-bold text-slate-600 mb-1">Corpo da Requisição:</div>
        <CodeBlock code={getOrdersExample} />
      </div>

      {/* Auth note */}
      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
        <strong>⚠️ Autenticação:</strong> Todas as requisições devem incluir o header{" "}
        <code className="bg-amber-100 px-1 rounded">apikey: SUA_SUPABASE_ANON_KEY</code>{" "}
        e o campo <code className="bg-amber-100 px-1 rounded">api_key</code> no corpo com a chave de pedidos gerada neste painel.
      </div>
    </div>
  );
}

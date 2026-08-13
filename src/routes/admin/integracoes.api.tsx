import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Plus, Copy, Eye, EyeOff, Trash2, RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/integracoes/api")({
  component: ApiPage,
});

interface ApiKey {
  id: string;
  nome: string;
  chave: string;
  criado: string;
  ultimoUso: string | null;
  status: "ativa" | "inativa";
  permissoes: string[];
}

const MOCK_KEYS: ApiKey[] = [
  {
    id: "1",
    nome: "Integração ERP Principal",
    chave: "fa_live_sk_8x2k9mL3pQr7nVtW5yZj1hCdEfGbIoUaXsNe",
    criado: "2026-01-15",
    ultimoUso: "2026-07-03",
    status: "ativa",
    permissoes: ["pedidos:ler", "produtos:ler", "estoque:escrever"],
  },
  {
    id: "2",
    nome: "Dashboard Relatórios",
    chave: "fa_live_sk_4aB7cD2eF1gH9iJ0kL3mN5oP6qR8sT",
    criado: "2026-03-22",
    ultimoUso: "2026-06-28",
    status: "ativa",
    permissoes: ["relatorios:ler", "metricas:ler"],
  },
  {
    id: "3",
    nome: "App Mobile (Descontinuado)",
    chave: "fa_live_sk_1zY9xW8vU7tS6rQ5pO4nM3lK2jI1hG",
    criado: "2025-11-10",
    ultimoUso: null,
    status: "inativa",
    permissoes: ["produtos:ler"],
  },
];

const ALL_PERMISSIONS = [
  "pedidos:ler", "pedidos:escrever",
  "produtos:ler", "produtos:escrever",
  "estoque:ler", "estoque:escrever",
  "clientes:ler", "clientes:escrever",
  "relatorios:ler", "metricas:ler",
];

function maskKey(key: string) {
  return key.slice(0, 16) + "•".repeat(24) + key.slice(-4);
}

export default function ApiPage() {
  const [keys, setKeys] = useState<ApiKey[]>(MOCK_KEYS);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPerms, setNewPerms] = useState<string[]>([]);

  const toggleVisible = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyKey = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    toast.success("Chave copiada!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const revokeKey = (id: string) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: "inativa" } : k));
    toast.success("Chave revogada com sucesso.");
  };

  const deleteKey = (id: string) => {
    setKeys(prev => prev.filter(k => k.id !== id));
    toast.success("Chave removida.");
  };

  const createKey = async () => {
    if (!newName.trim()) { toast.error("Informe um nome para a chave."); return; }
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: rawKey, error } = await supabase.rpc('create_master_api_key', { p_nome: newName });
      
      if (error) throw error;
      
      toast.success("Chave Master gerada com sucesso! Copie agora pois não será exibida novamente.");
      // Adicionamos a nova chave na lista local temporariamente para exibição
      const novaChave: ApiKey = {
        id: Date.now().toString(),
        nome: newName,
        chave: rawKey,
        criado: new Date().toISOString().split('T')[0],
        ultimoUso: null,
        status: "ativa",
        permissoes: ["master"],
      };
      setKeys(prev => [novaChave, ...prev]);
      setShowCreate(false);
      setNewName("");
      setVisibleKeys(prev => new Set([...prev, novaChave.id]));
    } catch (err: any) {
      toast.error("Erro ao gerar chave: " + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-primary" /> API
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as chaves de acesso à API da plataforma.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nova chave
        </Button>
      </div>

      {/* Docs Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-primary">Base URL: </span>
            <code className="bg-white border rounded px-2 py-0.5 text-xs font-mono ml-1">POST {import.meta.env.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co'}/rest/v1/rpc/sync_produtos_master</code>
          </div>
        </div>
        <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2">
          <span className="font-semibold mr-2">Headers requeridos:</span>
          <code className="bg-white border rounded px-2 py-0.5 text-xs font-mono ml-1">apikey: {"<sua_chave>"}</code>
        </div>
        <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <span className="font-semibold mr-2">Authorization Header:</span>
          <code className="bg-white border rounded px-2 py-0.5 text-xs font-mono ml-1">Authorization: Bearer {"<sua_chave>"}</code>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-base">Nova chave de API</h2>
          <div>
            <label className="text-sm font-medium">Nome da chave</label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Ex: Integração ERP"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Permissões</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_PERMISSIONS.map(perm => (
                <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer p-2 border rounded-lg hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={newPerms.includes(perm)}
                    onChange={e => setNewPerms(prev => e.target.checked ? [...prev, perm] : prev.filter(p => p !== perm))}
                    className="accent-primary"
                  />
                  <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{perm}</code>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={createKey}>Criar chave</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Keys list */}
      <div className="space-y-3">
        {keys.map(key => (
          <div key={key.id} className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{key.nome}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${key.status === "ativa" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {key.status === "ativa" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {key.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Criada em {key.criado}</span>
                  {key.ultimoUso
                    ? <span>Último uso: {key.ultimoUso}</span>
                    : <span className="text-amber-600">Nunca utilizada</span>
                  }
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {key.status === "ativa" && (
                  <Button variant="outline" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 text-xs" onClick={() => revokeKey(key.id)}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> Revogar
                  </Button>
                )}
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => deleteKey(key.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Key value */}
            <div className="flex items-center gap-2 bg-slate-50 border rounded-lg px-3 py-2">
              <code className="flex-1 text-xs font-mono text-slate-700 truncate">
                {visibleKeys.has(key.id) ? key.chave : maskKey(key.chave)}
              </code>
              <button onClick={() => toggleVisible(key.id)} className="text-muted-foreground hover:text-slate-700">
                {visibleKeys.has(key.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button onClick={() => copyKey(key.id, key.chave)} className="text-muted-foreground hover:text-primary">
                {copiedId === key.id ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {/* Permissions */}
            {key.permissoes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {key.permissoes.map(p => (
                  <span key={p} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{p}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

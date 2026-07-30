import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Webhook, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, Clock, Send, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/integracoes/webhooks")({
  component: WebhooksPage,
});

interface WebhookItem {
  id: string;
  nome: string;
  url: string;
  eventos: string[];
  ativo: boolean;
  criadoEm: string;
  ultimoDisparo: string | null;
  ultimoStatus: number | null;
}

const EVENTOS_DISPONIVEIS = [
  "pedido.criado",
  "pedido.atualizado",
  "pedido.cancelado",
  "pedido.entregue",
  "produto.criado",
  "produto.atualizado",
  "produto.removido",
  "estoque.baixo",
  "cliente.cadastrado",
  "pagamento.aprovado",
  "pagamento.recusado",
];

const MOCK_WEBHOOKS: WebhookItem[] = [
  {
    id: "1",
    nome: "ERP Integração",
    url: "https://erp.minha-empresa.com.br/webhook/pedidos",
    eventos: ["pedido.criado", "pedido.atualizado", "pagamento.aprovado"],
    ativo: true,
    criadoEm: "2026-02-10",
    ultimoDisparo: "2026-07-03T18:42:00",
    ultimoStatus: 200,
  },
  {
    id: "2",
    nome: "Notificação Estoque",
    url: "https://n8n.minha-empresa.com.br/webhook/estoque",
    eventos: ["estoque.baixo", "produto.atualizado"],
    ativo: true,
    criadoEm: "2026-04-05",
    ultimoDisparo: "2026-07-02T09:15:00",
    ultimoStatus: 500,
  },
  {
    id: "3",
    nome: "CRM Clientes (Pausado)",
    url: "https://crm.minha-empresa.com.br/api/hook",
    eventos: ["cliente.cadastrado"],
    ativo: false,
    criadoEm: "2025-12-01",
    ultimoDisparo: null,
    ultimoStatus: null,
  },
];

export default function WebhooksPage() {
  const [hooks, setHooks] = useState<WebhookItem[]>(MOCK_WEBHOOKS);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [url, setUrl] = useState("");
  const [eventos, setEventos] = useState<string[]>([]);

  const resetForm = () => { setNome(""); setUrl(""); setEventos([]); setEditId(null); setShowForm(false); };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (hook: WebhookItem) => {
    setNome(hook.nome); setUrl(hook.url); setEventos(hook.eventos); setEditId(hook.id); setShowForm(true);
  };

  const save = () => {
    if (!nome.trim() || !url.trim()) { toast.error("Nome e URL são obrigatórios."); return; }
    if (editId) {
      setHooks(prev => prev.map(h => h.id === editId ? { ...h, nome, url, eventos } : h));
      toast.success("Webhook atualizado!");
    } else {
      setHooks(prev => [{
        id: Date.now().toString(), nome, url, eventos,
        ativo: true, criadoEm: new Date().toISOString().slice(0, 10),
        ultimoDisparo: null, ultimoStatus: null,
      }, ...prev]);
      toast.success("Webhook criado!");
    }
    resetForm();
  };

  const toggle = (id: string) => {
    setHooks(prev => prev.map(h => h.id === id ? { ...h, ativo: !h.ativo } : h));
  };

  const remove = (id: string) => {
    setHooks(prev => prev.filter(h => h.id !== id));
    toast.success("Webhook removido.");
  };

  const testDisparo = (hook: WebhookItem) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      { loading: `Disparando teste para ${hook.url}...`, success: "Teste enviado! Verifique os logs.", error: "Falha no disparo." }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Webhook className="h-6 w-6 text-primary" /> WebHooks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure endpoints que recebem notificações automáticas de eventos da plataforma.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo WebHook
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-base">{editId ? "Editar WebHook" : "Novo WebHook"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: ERP Integração" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">URL de destino</label>
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://seu-sistema.com/webhook" className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Eventos para escutar</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EVENTOS_DISPONIVEIS.map(ev => (
                <label key={ev} className="flex items-center gap-2 text-sm cursor-pointer p-2 border rounded-lg hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={eventos.includes(ev)}
                    onChange={e => setEventos(prev => e.target.checked ? [...prev, ev] : prev.filter(p => p !== ev))}
                    className="accent-primary"
                  />
                  <code className="text-xs">{ev}</code>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={save}>{editId ? "Salvar alterações" : "Criar WebHook"}</Button>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {hooks.map(hook => (
          <div key={hook.id} className={`bg-white border rounded-xl p-5 shadow-sm transition-opacity ${!hook.ativo ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">{hook.nome}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${hook.ativo ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {hook.ativo ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {hook.ativo ? "Ativo" : "Pausado"}
                  </span>
                  {hook.ultimoStatus && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hook.ultimoStatus === 200 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      HTTP {hook.ultimoStatus}
                    </span>
                  )}
                </div>
                <code className="text-xs text-muted-foreground truncate block mt-1">{hook.url}</code>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Criado em {hook.criadoEm}</span>
                  {hook.ultimoDisparo
                    ? <span>Último disparo: {new Date(hook.ultimoDisparo).toLocaleString("pt-BR")}</span>
                    : <span className="text-amber-600">Nenhum disparo ainda</span>
                  }
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => testDisparo(hook)} title="Testar disparo" className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors">
                  <Send className="h-4 w-4" />
                </button>
                <button onClick={() => openEdit(hook)} title="Editar" className="p-1.5 text-muted-foreground hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => toggle(hook.id)} title={hook.ativo ? "Pausar" : "Ativar"} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors">
                  {hook.ativo ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4" />}
                </button>
                <button onClick={() => remove(hook.id)} title="Excluir" className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {hook.eventos.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {hook.eventos.map(ev => (
                  <span key={ev} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{ev}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

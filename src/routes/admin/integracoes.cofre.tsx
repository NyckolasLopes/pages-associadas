import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Vault, Plus, Eye, EyeOff, Copy, Trash2, Edit2, CheckCircle2, Shield, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/integracoes/cofre")({
  component: CofrePage,
});

interface SegredoItem {
  id: string;
  nome: string;
  valor: string;
  descricao: string;
  categoria: string;
  criadoEm: string;
}

const CATEGORIAS = ["Pagamento", "Logística", "ERP", "Marketing", "Analytics", "Outro"];

const MOCK_SEGREDOS: SegredoItem[] = [
  {
    id: "1",
    nome: "MERCADO_PAGO_ACCESS_TOKEN",
    valor: "APP_USR-1234567890abcdef-ghijkl-MNOPQRST",
    descricao: "Token de acesso à API do Mercado Pago",
    categoria: "Pagamento",
    criadoEm: "2026-01-20",
  },
  {
    id: "2",
    nome: "CORREIOS_SENHA",
    valor: "senhaCorreios#2026!",
    descricao: "Credencial de acesso ao WebService dos Correios",
    categoria: "Logística",
    criadoEm: "2026-02-14",
  },
  {
    id: "3",
    nome: "GOOGLE_ANALYTICS_API_KEY",
    valor: "AIzaSyBmK9xZP3L-Wq2R7tVfJcDnEoUhYgIpAs",
    descricao: "Chave de API do Google Analytics 4",
    categoria: "Analytics",
    criadoEm: "2026-03-01",
  },
  {
    id: "4",
    nome: "META_PIXEL_TOKEN",
    valor: "EAAGm0PX4ZBAA...",
    descricao: "Token de acesso ao Meta Conversions API",
    categoria: "Marketing",
    criadoEm: "2026-04-18",
  },
];

function maskValue(val: string) {
  if (val.length <= 4) return "••••••••";
  return "••••••••••••" + val.slice(-4);
}

export default function CofrePage() {
  const [segredos, setSegredos] = useState<SegredoItem[]>(MOCK_SEGREDOS);
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Outro");
  const [filtro, setFiltro] = useState("Todos");

  const resetForm = () => { setNome(""); setValor(""); setDescricao(""); setCategoria("Outro"); setEditId(null); setShowForm(false); };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (s: SegredoItem) => {
    setNome(s.nome); setValor(s.valor); setDescricao(s.descricao); setCategoria(s.categoria);
    setEditId(s.id); setShowForm(true);
  };

  const save = () => {
    if (!nome.trim() || !valor.trim()) { toast.error("Nome e Valor são obrigatórios."); return; }
    if (editId) {
      setSegredos(prev => prev.map(s => s.id === editId ? { ...s, nome, valor, descricao, categoria } : s));
      toast.success("Segredo atualizado com sucesso!");
    } else {
      setSegredos(prev => [{
        id: Date.now().toString(), nome, valor, descricao, categoria,
        criadoEm: new Date().toISOString().slice(0, 10),
      }, ...prev]);
      toast.success("Segredo adicionado ao cofre!");
    }
    resetForm();
  };

  const remove = (id: string) => {
    setSegredos(prev => prev.filter(s => s.id !== id));
    toast.success("Segredo removido do cofre.");
  };

  const toggleVisible = (id: string) => {
    setVisible(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const copy = (id: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(id);
    toast.success("Valor copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  const categorias = ["Todos", ...CATEGORIAS];
  const filtrados = filtro === "Todos" ? segredos : segredos.filter(s => s.categoria === filtro);

  const catColor: Record<string, string> = {
    "Pagamento": "bg-green-100 text-green-700",
    "Logística": "bg-blue-100 text-blue-700",
    "ERP": "bg-purple-100 text-purple-700",
    "Marketing": "bg-orange-100 text-orange-700",
    "Analytics": "bg-cyan-100 text-cyan-700",
    "Outro": "bg-slate-100 text-slate-600",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Vault className="h-6 w-6 text-primary" /> Cofre de APIs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Armazene credenciais e segredos de forma segura e organizada.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo segredo
        </Button>
      </div>

      {/* Security notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Segurança:</strong> Os valores são armazenados criptografados. Nunca compartilhe tokens de acesso ou senhas de APIs com terceiros.
        </p>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-base">{editId ? "Editar segredo" : "Novo segredo"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nome da variável</label>
              <Input
                value={nome}
                onChange={e => setNome(e.target.value.toUpperCase().replace(/\s/g, "_"))}
                placeholder="EX: MINHA_API_KEY"
                className="mt-1 font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Categoria</label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="mt-1 w-full h-9 px-3 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Valor (token / senha / chave)</label>
            <Input
              type="password"
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="Cole o valor secreto aqui"
              className="mt-1 font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Descrição</label>
            <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Para que serve este segredo?" className="mt-1" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={save}>{editId ? "Salvar alterações" : "Adicionar ao cofre"}</Button>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setFiltro(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filtro === cat ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary"}`}
          >
            {cat}
            {cat !== "Todos" && (
              <span className="ml-1 opacity-70">({segredos.filter(s => s.categoria === cat).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtrados.length === 0 && (
          <div className="text-center p-10 text-muted-foreground text-sm border rounded-xl bg-white">
            Nenhum segredo encontrado nesta categoria.
          </div>
        )}
        {filtrados.map(s => (
          <div key={s.id} className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="font-bold text-sm text-slate-900">{s.nome}</code>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catColor[s.categoria] || catColor["Outro"]}`}>
                    <Tag className="inline h-2.5 w-2.5 mr-0.5" />{s.categoria}
                  </span>
                </div>
                {s.descricao && <p className="text-xs text-muted-foreground mt-1">{s.descricao}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">Adicionado em {s.criadoEm}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(s)} title="Editar" className="p-1.5 text-muted-foreground hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => remove(s.id)} title="Excluir" className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Value */}
            <div className="flex items-center gap-2 bg-slate-50 border rounded-lg px-3 py-2 mt-3">
              <code className="flex-1 text-xs font-mono text-slate-700 truncate">
                {visible.has(s.id) ? s.valor : maskValue(s.valor)}
              </code>
              <button onClick={() => toggleVisible(s.id)} className="text-muted-foreground hover:text-slate-700">
                {visible.has(s.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button onClick={() => copy(s.id, s.valor)} className="text-muted-foreground hover:text-primary">
                {copied === s.id ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

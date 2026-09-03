import { createFileRoute } from "@tanstack/react-router";
import { useQuestions } from "@/stores/questions";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Package, User } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export const Route = createFileRoute("/admin/perguntas")({
  component: AdminPerguntas,
});

function AdminPerguntas() {
  const { questions, answerQuestion, deleteQuestion, loadQuestions } = useQuestions();
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [resposta, setResposta] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (loadQuestions) loadQuestions();
  }, [loadQuestions]);

  const pendingQuestions = questions.filter(q => !q.resposta);
  const answeredQuestions = questions.filter(q => q.resposta);

  if (!mounted) return null;

  const handleAnswer = (id: string) => {
    if (!resposta.trim()) {
      toast.error("A resposta não pode estar vazia.");
      return;
    }
    answerQuestion(id, resposta);
    toast.success("Pergunta respondida com sucesso!");
    setAnsweringId(null);
    setResposta("");
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteQuestion(deleteId);
      toast.success("Pergunta excluída com sucesso.");
      setDeleteId(null);
    }
  };

  return (
    <div className="max-w-6xl space-y-8 p-6 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Perguntas</h1>
        <p className="text-sm font-medium text-slate-500 mt-2">
          Gerencie e responda as perguntas feitas pelos clientes na página dos produtos.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-700">Aguardando Resposta ({pendingQuestions.length})</h2>
        {pendingQuestions.length === 0 ? (
          <div className="p-8 text-center border rounded-xl bg-slate-50 border-dashed text-slate-500">
            Nenhuma pergunta pendente no momento.
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingQuestions.map(q => (
              <div key={q.id} className="border rounded-xl p-5 bg-white shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <User className="h-4 w-4" /> {q.clienteNome} 
                      <span className="text-slate-300">•</span>
                      <span>{new Date(q.data).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded w-fit">
                      <Package className="h-4 w-4 text-primary" /> {q.produtoNome}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                    Pendente
                  </Badge>
                </div>
                
                <div className="text-slate-700 font-medium text-base flex gap-2">
                  <MessageSquare className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  {q.pergunta}
                </div>

                {answeringId === q.id ? (
                  <div className="bg-slate-50 p-4 rounded-lg border mt-2 space-y-3">
                    <label className="text-xs font-bold text-slate-600 uppercase">Sua resposta:</label>
                    <textarea 
                      className="w-full border rounded p-3 text-sm min-h-[100px] outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      placeholder="Escreva sua resposta para o cliente..."
                      value={resposta}
                      onChange={(e) => setResposta(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => { setAnsweringId(null); setResposta(""); }}>
                        Cancelar
                      </Button>
                      <Button onClick={() => handleAnswer(q.id)}>
                        Enviar Resposta
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button onClick={() => setAnsweringId(q.id)} variant="default">
                      Responder Pergunta
                    </Button>
                    <Button onClick={() => setDeleteId(q.id)} variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
                      Excluir
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6 pt-8 border-t">
        <h2 className="text-xl font-bold text-slate-700">Perguntas Respondidas ({answeredQuestions.length})</h2>
        {answeredQuestions.length === 0 ? (
          <div className="p-8 text-center border rounded-xl bg-slate-50 border-dashed text-slate-500">
            Nenhuma pergunta respondida ainda.
          </div>
        ) : (
          <div className="grid gap-4 opacity-75 hover:opacity-100 transition-opacity">
            {answeredQuestions.map(q => (
              <div key={q.id} className="border rounded-xl p-5 bg-white shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <User className="h-4 w-4" /> {q.clienteNome} 
                      <span className="text-slate-300">•</span>
                      <span>{new Date(q.data).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded w-fit">
                      <Package className="h-4 w-4 text-primary" /> {q.produtoNome}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                    Respondida
                  </Badge>
                </div>
                
                <div className="text-slate-700 font-medium text-base flex gap-2">
                  <MessageSquare className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  {q.pergunta}
                </div>

                <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100 mt-2">
                  <p className="text-xs font-bold text-emerald-800 uppercase mb-1">
                    Sua resposta em {q.dataResposta ? new Date(q.dataResposta).toLocaleDateString("pt-BR") : ""}:
                  </p>
                  <p className="text-sm text-emerald-950 font-medium">{q.resposta}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Excluir Pergunta"
        description="Tem certeza que deseja excluir esta pergunta? Ela não será mais exibida para os clientes."
        confirmText="Excluir"
      />
    </div>
  );
}

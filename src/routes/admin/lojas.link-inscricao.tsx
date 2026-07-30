import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { Button } from "@/components/ui/button";
import { Link2, Copy, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/lojas/link-inscricao")({
  component: LinkInscricaoAssociado,
});

function LinkInscricaoAssociado() {
  const { currentUser, registrationTokens, generateRegistrationToken } = useAdmin();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;

  if (!isGlobalAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Acesso negado</h2>
        <p className="text-muted-foreground mt-2">Apenas o administrador global pode acessar esta página.</p>
      </div>
    );
  }

  const handleGenerate = () => {
    generateRegistrationToken();
    toast.success("Novo link gerado com sucesso!");
  };

  const handleCopy = (token: string) => {
    const url = `${window.location.origin}/inscricao/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Sort descending by creation date
  const sortedTokens = [...(registrationTokens || [])].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Link de Inscrição Associado</h1>
        <p className="text-slate-500 mt-1">Gere links únicos para que novos associados possam se cadastrar diretamente.</p>
      </div>

      <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
          <Link2 className="w-8 h-8 text-emerald-700" />
        </div>
        <div className="max-w-md">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Novo Link de Inscrição</h2>
          <p className="text-slate-600 mb-6">Ao gerar um novo link, o associado poderá acessar o formulário de cadastro. O link só pode ser utilizado para um único cadastro.</p>
          <Button onClick={handleGenerate} className="bg-emerald-700 hover:bg-emerald-800 text-white w-full h-12 text-lg">
            Gerar novo link de cadastro
          </Button>
        </div>
      </div>

      {sortedTokens.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-slate-50 font-bold text-slate-800">
            Histórico de Links Gerados
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                <tr>
                  <th className="px-4 py-3">Link</th>
                  <th className="px-4 py-3">Data de Criação</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 w-[120px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedTokens.map((t) => (
                  <tr key={t.token} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700 font-mono text-xs">
                      {window.location.origin}/inscricao/{t.token}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(t.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      {t.used ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Utilizado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <Clock className="w-3.5 h-3.5" />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={t.used}
                        onClick={() => handleCopy(t.token)}
                        className="flex items-center gap-1"
                      >
                        {copiedToken === t.token ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedToken === t.token ? "Copiado" : "Copiar"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

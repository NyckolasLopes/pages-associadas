import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { Button } from "@/components/ui/button";
import { Link2, Copy, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useRegistrationTokens } from "@/stores/registrationTokens";

export const Route = createFileRoute("/admin/lojas/link-inscricao")({
  component: LinkInscricaoAssociado,
});

function LinkInscricaoAssociado() {
  const { currentUser } = useAdmin();
  const { registrationTokens, generateRegistrationToken, deleteRegistrationToken, clearRegistrationTokens } = useRegistrationTokens();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [deleteTokenItem, setDeleteTokenItem] = useState<string | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;

  if (!isGlobalAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Acesso negado</h2>
        <p className="text-muted-foreground mt-2">Apenas o administrador global pode acessar esta página.</p>
      </div>
    );
  }

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      toast.error("O nome da URL não pode estar vazio");
      return;
    }
    const slug = customName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)+/g, '');
    
    if (slug === "") {
      toast.error("Nome inválido");
      return;
    }

    const token = generateRegistrationToken(slug, customName.trim());
    if (!token) {
      toast.error("Essa URL já está em uso, escolha outro nome.");
      return;
    }
    
    toast.success("Novo link gerado com sucesso!");
    setIsGenerateModalOpen(false);
    setCustomName("");
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
          <Button onClick={() => setIsGenerateModalOpen(true)} className="bg-emerald-700 hover:bg-emerald-800 text-white w-full h-12 text-lg">
            Gerar novo link de cadastro
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50 font-bold text-slate-800 flex justify-between items-center">
          <span>Histórico de Links Gerados</span>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={() => setIsClearHistoryModalOpen(true)}
            disabled={sortedTokens.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Limpar Histórico
          </Button>
        </div>
        <div className="overflow-x-auto">
          {sortedTokens.length > 0 ? (
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
                    <td className="px-4 py-3">
                      {t.nome && <div className="font-semibold text-slate-800 text-sm mb-1">{t.nome}</div>}
                      <div className="font-medium text-slate-700 font-mono text-xs break-all">
                        {window.location.origin}/inscricao/{t.token}
                      </div>
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
                    <td className="px-4 py-3 flex items-center gap-2">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                        onClick={() => setDeleteTokenItem(t.token)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500">
              Nenhum link de inscrição foi gerado ainda.
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isClearHistoryModalOpen}
        onClose={() => setIsClearHistoryModalOpen(false)}
        onConfirm={() => {
          clearRegistrationTokens();
          toast.success("Histórico limpo com sucesso!");
        }}
        title="Limpar Histórico"
        description="Tem certeza que deseja excluir todo o histórico de links de inscrição? Esta ação não pode ser desfeita e os links antigos não funcionarão mais."
        confirmText="Limpar"
      />

      <ConfirmDialog
        isOpen={!!deleteTokenItem}
        onClose={() => setDeleteTokenItem(null)}
        onConfirm={() => {
          if (deleteTokenItem) {
            deleteRegistrationToken(deleteTokenItem);
            toast.success("Link excluído!");
          }
        }}
        title="Excluir Link"
        description="Tem certeza que deseja excluir este link de inscrição? Associados não poderão mais se cadastrar usando-o."
        confirmText="Excluir"
      />
      <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Novo Link de Inscrição</DialogTitle>
            <DialogDescription>
              Insira um nome personalizado para o link da nova loja associada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGenerateSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-name">Nome da Loja / URL</Label>
              <Input
                id="custom-name"
                placeholder="Ex: Farmácia Centro"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-slate-500">
                A URL será: {window.location.origin}/inscricao/
                <span className="font-semibold text-slate-700">
                  {customName ? customName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)+/g, '') : "nome-da-loja"}
                </span>
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsGenerateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white">
                Gerar Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

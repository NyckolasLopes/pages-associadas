import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Store, Link as LinkIcon, Play, Pause, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { StoreSelector } from "@/components/admin/StoreSelector";

export const Route = createFileRoute("/admin/lojas/paineis")({
  component: LojasPaineis,
});

function LojasPaineis() {
  const { pharmacies, storePanels, generatePanel, togglePanelStatus, deletePanel, currentUser, activeStoreId } = useAdmin();
  const [selectedLoja, setSelectedLoja] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [panelToDelete, setPanelToDelete] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'reason'>('confirm');
  const [deleteReason, setDeleteReason] = useState("");

  const isAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;

  let tableItems: { loja: any, panel: any }[] = [];
  if (isAdmin) {
    tableItems = storePanels.map(panel => ({
      loja: pharmacies.find(p => p.id === panel.lojaId),
      panel
    }));
  } else {
    const myStores = pharmacies.filter(p => currentUser?.lojasVinculadas?.includes(p.id));
    tableItems = myStores.map(loja => ({
      loja,
      panel: storePanels.find(p => p.lojaId === loja.id)
    }));
  }

  const lojasSemPainel = pharmacies.filter(
    (p) => !storePanels.some((sp) => sp.lojaId === p.id)
  );

  const handleGenerate = () => {
    if (!selectedLoja || selectedLoja === "none") {
      toast.error("Selecione uma loja para gerar o painel.");
      return;
    }
    if (!email || !password) {
      toast.error("Preencha email e senha de acesso.");
      return;
    }
    generatePanel(selectedLoja, email, password);
    toast.success("Painel gerado com sucesso!");
    setSelectedLoja("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            {isAdmin ? "Painéis de Lojas" : "Meu Painel da Loja"}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin 
              ? "Gere e gerencie dashboards individuais para cada farmácia associada."
              : "Gerencie e acesse os painéis gerados."}
          </p>
        </div>
        <div>
          <StoreSelector className="mb-0" />
        </div>
      </div>

      {isAdmin && (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Store className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-lg text-slate-700">Gerar Novo Painel</h3>
          </div>
          
          <div className="flex flex-col gap-4 max-w-2xl">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-bold text-slate-700">Selecione a Loja</label>
              <Select value={selectedLoja} onValueChange={setSelectedLoja}>
                <SelectTrigger>
                  <SelectValue placeholder="Ver todas as lojas..." />
                </SelectTrigger>
                <SelectContent>
                  {lojasSemPainel.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Todas as lojas já possuem painel
                    </SelectItem>
                  ) : (
                    lojasSemPainel.map((loja) => (
                      <SelectItem key={loja.id} value={loja.id}>
                        {loja.nome} - {loja.cidade}/{loja.uf}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-bold text-slate-700">E-mail de Acesso</label>
                <Input 
                  type="email" 
                  placeholder="loja@associadas.com.br" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-bold text-slate-700">Senha</label>
                <Input 
                  type="password" 
                  placeholder="********" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleGenerate} 
              disabled={!selectedLoja || selectedLoja === "none" || !email || !password}
              className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto self-end mt-2"
            >
              Gerar Página para a Loja
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-lg text-slate-700">Painéis Cadastrados</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loja</TableHead>
              <TableHead>URL do Painel</TableHead>
              <TableHead>Credenciais</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              tableItems.map(({ loja, panel }) => {
                const lojaId = loja?.id || panel?.lojaId;
                const url = `/painel-loja/${lojaId}`;
                
                return (
                  <TableRow key={lojaId}>
                    <TableCell className="font-medium text-slate-900">
                      {loja?.nome || "Loja Excluída"}
                    </TableCell>
                    <TableCell>
                      {panel ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <LinkIcon className="w-4 h-4" />
                          {url}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">Aguardando admin</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {panel ? (
                        <div className="text-xs text-slate-600">
                          <strong>E-mail:</strong> {panel.email || "N/A"}<br/>
                          <strong>Senha:</strong> {panel.password || "N/A"}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {panel ? (
                        <Badge variant={panel.status === "active" ? "default" : "secondary"}
                          className={panel.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}
                        >
                          {panel.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {panel ? new Date(panel.createdAt).toLocaleDateString("pt-BR") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {panel ? (
                        <div className="flex items-center justify-end gap-2 flex-nowrap">
                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => togglePanelStatus(panel.lojaId)}
                            >
                              {panel.status === "active" ? (
                                <><Pause className="w-4 h-4 mr-2" /> Desativar</>
                              ) : (
                                <><Play className="w-4 h-4 mr-2" /> Ativar</>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-slate-900 hover:bg-slate-800"
                            asChild
                          >
                            <Link to="/painel-loja/$lojaId" params={{ lojaId: panel.lojaId }} target="_blank">
                              <ExternalLink className="w-4 h-4 mr-2" /> Acessar
                            </Link>
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setPanelToDelete(panel.lojaId);
                                setDeleteStep('confirm');
                                setDeleteReason("");
                                setDeleteModalOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Não disponível</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {deleteStep === 'confirm' ? "Excluir Painel" : "Motivo da Exclusão"}
            </DialogTitle>
            <DialogDescription>
              {deleteStep === 'confirm' 
                ? "Tem certeza que deseja excluir o painel desta loja?" 
                : "Por favor, informe o motivo da exclusão deste painel."}
            </DialogDescription>
          </DialogHeader>

          {deleteStep === 'reason' && (
            <div className="py-4">
              <Textarea 
                placeholder="Descreva o motivo (opcional)"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {deleteStep === 'confirm' ? (
              <>
                <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                  Não, cancelar
                </Button>
                <Button variant="destructive" onClick={() => setDeleteStep('reason')}>
                  Sim, excluir
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={() => {
                  if (panelToDelete) {
                    deletePanel(panelToDelete);
                    toast.success("Painel excluído com sucesso.");
                    setDeleteModalOpen(false);
                  }
                }}>
                  Confirmar Exclusão
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Plus, Flame, Clock, Trash2, Edit } from "lucide-react";
import { useMarketing } from "@/stores/marketing";
import { useStores } from "@/stores/config";
import { useAdmin } from "@/stores/admin";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/marketing/promocoes/")({
  component: AdminPromocoesPage,
});

function AdminPromocoesPage() {
  const promocoesRaw = useMarketing((s) => s.promocoes);
  const { currentUser, selectedStoreId } = useAdmin();
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;
  const effectiveStoreId = !isGlobalAdmin && currentUser?.lojasVinculadas?.length ? currentUser.lojasVinculadas[0] : selectedStoreId;
  const promocoes = isGlobalAdmin ? promocoesRaw : promocoesRaw.filter(p => p.lojaId === effectiveStoreId);

  const removePromocao = useMarketing((s) => s.removePromocao);
  const lojas = useStores((s) => s.lojas);
  const navigate = useNavigate();

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteId) {
      removePromocao(deleteId);
      toast.success("Promoção excluída com sucesso.");
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Promoções</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crie promoções com timer regressivo para aumentar as vendas.
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/admin/marketing/promocoes/nova" })} className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2">
          <Plus className="h-4 w-4" /> Nova Promoção
        </Button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {promocoes.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Flame className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Nenhuma promoção ativa</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              Crie uma promoção focada em conversão para destacar ofertas em vermelho na sua loja.
            </p>
            <Button onClick={() => navigate({ to: "/admin/marketing/promocoes/nova" })} className="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold">
              Criar primeira promoção
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {promocoes.map((p) => (
              <div key={p.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      {p.titulo}
                      {!p.ativa && (
                        <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                          Inativa
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mt-1 text-slate-500">
                      {isGlobalAdmin && p.lojaId && (
                        <div className="flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          Loja: {lojas.find(l => l.id === p.lojaId)?.nome || p.lojaId}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-4 h-4 text-slate-400" />
                        Até {p.dataFim.split("-").reverse().join("/")} às {p.horaFim}
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        Alvo: <span className="text-slate-700 capitalize">{p.tipoAlvo}</span> ({p.alvosId.length})
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Just dummy edit for now */}
                  <Button variant="outline" size="sm" onClick={() => navigate({ to: "/admin/marketing/promocoes/nova", search: { id: p.id } as any })}>
                    <Edit className="h-4 w-4 mr-2" /> Editar
                  </Button>
                  <Button variant="outline" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteId(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Promoção?</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta promoção? A vitrine de ofertas deixará de aparecer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Sim, excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useAdmin, ContentPage } from "@/stores/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Globe, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/paginas-informativas")({
  component: AdminPaginasInformativas,
});

const defaultPage: ContentPage = {
  id: "",
  title: "",
  slug: "",
  location: "footer",
  footerColumn: "Institucional",
  type: "text",
  content: "",
};

function AdminPaginasInformativas() {
  const { contentPages, setContentPages, currentUser } = useAdmin();
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<ContentPage>(defaultPage);

  if (!isGlobalAdmin) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-lg shadow-sm border">
        Acesso restrito. Apenas administradores globais podem gerenciar as páginas informativas da rede.
      </div>
    );
  }

  const handleOpenModal = (page?: ContentPage) => {
    if (page) {
      setEditingPage(page);
    } else {
      setEditingPage({ ...defaultPage, id: Date.now().toString() });
    }
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!editingPage.title || !editingPage.slug) {
      toast.error("Título e slug são obrigatórios.");
      return;
    }

    if (editingPage.type === "external" && !editingPage.externalUrl) {
      toast.error("URL Externa é obrigatória para links externos.");
      return;
    }

    const exists = contentPages.find((p) => p.id === editingPage.id);
    if (exists) {
      setContentPages(contentPages.map((p) => (p.id === editingPage.id ? editingPage : p)));
      toast.success("Página atualizada com sucesso.");
    } else {
      setContentPages([...contentPages, editingPage]);
      toast.success("Página criada com sucesso.");
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta página?")) {
      setContentPages(contentPages.filter((p) => p.id !== id));
      toast.success("Página excluída com sucesso.");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Páginas Informativas
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie as páginas institucionais, políticas e termos que aparecem no rodapé de todas as lojas.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Nova Página
        </Button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Slug (URL)</th>
                <th className="px-4 py-3">Coluna (Rodapé)</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contentPages.map((page) => (
                <tr key={page.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{page.title}</td>
                  <td className="px-4 py-3 text-slate-500">/{page.slug}</td>
                  <td className="px-4 py-3 text-slate-500">{page.footerColumn}</td>
                  <td className="px-4 py-3">
                    {page.type === "external" ? (
                      <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md w-max">
                        <Globe className="w-3.5 h-3.5" /> Link Externo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md w-max">
                        <FileText className="w-3.5 h-3.5" /> Conteúdo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(page)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(page.id)} className="text-red-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {contentPages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Nenhuma página informativas cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPage.id && contentPages.find(p => p.id === editingPage.id) ? "Editar Página" : "Nova Página"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={editingPage.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
                    setEditingPage({ ...editingPage, title, slug: editingPage.slug || slug });
                  }}
                  placeholder="Ex: Quem Somos"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (Caminho da URL)</Label>
                <Input
                  value={editingPage.slug}
                  onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                  placeholder="Ex: quem-somos"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Coluna do Rodapé</Label>
                <Select
                  value={editingPage.footerColumn}
                  onValueChange={(val: any) => setEditingPage({ ...editingPage, footerColumn: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Institucional">Institucional</SelectItem>
                    <SelectItem value="Atendimento">Atendimento</SelectItem>
                    <SelectItem value="Segurança">Segurança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Página</Label>
                <Select
                  value={editingPage.type}
                  onValueChange={(val: any) => setEditingPage({ ...editingPage, type: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Conteúdo Interno (Texto/HTML)</SelectItem>
                    <SelectItem value="external">Link Externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editingPage.type === "external" ? (
              <div className="space-y-2">
                <Label>URL Externa</Label>
                <Input
                  value={editingPage.externalUrl || ""}
                  onChange={(e) => setEditingPage({ ...editingPage, externalUrl: e.target.value })}
                  placeholder="Ex: https://..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Conteúdo da Página (HTML permitido)</Label>
                <Textarea
                  value={editingPage.content || ""}
                  onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                  placeholder="<h1>Seu título aqui</h1><p>Seu texto aqui...</p>"
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Salvar Página</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Edit, Trash2 } from "lucide-react";
import { useAdmin, ContentPage } from "@/stores/admin";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/design/paginas")({
  component: AdminDesignPaginas,
});

function AdminDesignPaginas() {
  const { contentPages, setContentPages } = useAdmin();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);

  const handleOpenNew = () => {
    setEditingPage({
      id: Date.now().toString(),
      title: "",
      slug: "",
      location: "none",
      type: "text",
      content: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (page: ContentPage) => {
    setEditingPage({ ...page });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta página?")) {
      setContentPages(contentPages.filter(p => p.id !== id));
      toast.success("Página excluída!");
    }
  };

  const handleSave = () => {
    if (!editingPage?.title) {
      toast.error("O título é obrigatório");
      return;
    }
    
    // Auto-generate slug if text page and slug is empty
    let finalPage = { ...editingPage };
    if (finalPage.type === "text" && !finalPage.slug) {
      finalPage.slug = finalPage.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    }

    const exists = contentPages.find(p => p.id === finalPage.id);
    if (exists) {
      setContentPages(contentPages.map(p => p.id === finalPage.id ? finalPage : p));
    } else {
      setContentPages([...contentPages, finalPage]);
    }
    
    setIsModalOpen(false);
    setEditingPage(null);
    toast.success("Página salva com sucesso!");
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Páginas de Conteúdo</h2>
        <p className="text-muted-foreground">Crie e gerencie páginas de texto (como Políticas e Quem Somos) ou links externos.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm max-w-4xl">
         <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Páginas de Conteúdo</h3>
              <p className="text-sm text-muted-foreground">Defina onde cada página aparecerá (Cabeçalho, Rodapé, Ambos ou Oculto).</p>
            </div>
          </div>
          <Button onClick={handleOpenNew} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Página
          </Button>
        </div>

        <div className="space-y-4">
          {contentPages.map(page => (
            <div key={page.id} className="flex justify-between items-center border p-4 rounded-lg bg-slate-50">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  {page.title}
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase font-bold">
                    {page.type === "external" ? "Link Externo" : "Página de Texto"}
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase font-bold">
                    Local: {page.location}
                  </span>
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {page.type === "external" ? page.externalUrl : `/pagina/${page.slug}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(page)} className="gap-2">
                  <Edit className="h-4 w-4" /> Editar
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(page.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {contentPages.length === 0 && (
            <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
              Nenhuma página criada.
            </div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPage?.id && contentPages.find(p => p.id === editingPage.id) ? "Editar Página" : "Nova Página"}</DialogTitle>
          </DialogHeader>
          
          {editingPage && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título da Página</Label>
                <Input 
                  value={editingPage.title} 
                  onChange={e => setEditingPage({...editingPage, title: e.target.value})}
                  placeholder="Ex: Quem Somos"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={editingPage.type} 
                    onValueChange={(val: any) => setEditingPage({...editingPage, type: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Página de Texto (HTML)</SelectItem>
                      <SelectItem value="external">Link Externo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Local de Exibição</Label>
                  <Select 
                    value={editingPage.location} 
                    onValueChange={(val: any) => setEditingPage({...editingPage, location: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="header">Cabeçalho</SelectItem>
                      <SelectItem value="footer">Rodapé</SelectItem>
                      <SelectItem value="both">Ambos (Cab. e Rodapé)</SelectItem>
                      <SelectItem value="none">Oculto (Apenas link direto)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(editingPage.location === "footer" || editingPage.location === "both") && (
                  <div className="space-y-2">
                    <Label>Coluna do Rodapé</Label>
                    <Select 
                      value={editingPage.footerColumn || ""} 
                      onValueChange={(val: any) => setEditingPage({...editingPage, footerColumn: val || undefined})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a coluna..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Institucional">Institucional</SelectItem>
                        <SelectItem value="Navegação">Navegação</SelectItem>
                        <SelectItem value="Serviços">Serviços</SelectItem>
                        <SelectItem value="Perfil">Perfil</SelectItem>
                        <SelectItem value="Atendimento">Atendimento</SelectItem>
                        <SelectItem value="Segurança">Segurança</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {editingPage.type === "external" ? (
                <div className="space-y-2">
                  <Label>URL Externa</Label>
                  <Input 
                    value={editingPage.externalUrl || ""} 
                    onChange={e => setEditingPage({...editingPage, externalUrl: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Slug (Caminho da URL)</Label>
                    <Input 
                      value={editingPage.slug} 
                      onChange={e => setEditingPage({...editingPage, slug: e.target.value})}
                      placeholder="Deixe em branco para gerar automaticamente baseado no título"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Conteúdo (Aceita HTML livremente)</Label>
                    <Textarea 
                      value={editingPage.content || ""} 
                      onChange={e => setEditingPage({...editingPage, content: e.target.value})}
                      placeholder="<h1>Meu título</h1><p>Meu texto...</p>"
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={handleSave}>Salvar Página</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

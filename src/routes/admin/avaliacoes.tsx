import { createFileRoute } from "@tanstack/react-router";
import { useReviews } from "@/stores/reviews";
import { useAdminProducts } from "@/stores/products";
import type { Avaliacao } from "@/types";
import { Star, Trash2, Search, MessageSquare, AlertCircle, Plus, Check, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin/avaliacoes")({
  component: AdminAvaliacoes,
});

function AdminAvaliacoes() {
  const avaliacoes = useReviews((s) => s.avaliacoes);
  const removeAvaliacao = useReviews((s) => s.removeAvaliacao);
  const updateAvaliacaoStatus = useReviews((s) => s.updateAvaliacaoStatus);
  const duplicateAvaliacaoToProducts = useReviews((s) => s.duplicateAvaliacaoToProducts);
  const addAvaliacao = useReviews((s) => s.addAvaliacao);
  const updateAvaliacao = useReviews((s) => s.updateAvaliacao);
  const produtos = useAdminProducts((s) => s.customProducts);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Add/Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAvaliacaoId, setEditingAvaliacaoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    produtoId: "",
    usuario: "",
    nota: 5,
    texto: "",
    status: "aprovada" as "aprovada" | "recusada" | "pendente"
  });

  const filteredAvaliacoes = avaliacoes.filter((av) => {
    const term = searchTerm.toLowerCase();
    const prod = produtos.find(p => p.id === av.produtoId);
    const pName = prod?.nome.toLowerCase() || "";
    return av.usuario.toLowerCase().includes(term) || 
           av.texto.toLowerCase().includes(term) || 
           pName.includes(term);
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredAvaliacoes.length / itemsPerPage);
  const paginatedAvaliacoes = filteredAvaliacoes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeAvaliacao(itemToDelete);
      toast.success("Avaliação excluída com sucesso.");
    }
  };

  const handleApprove = (id: string) => {
    updateAvaliacaoStatus(id, "aprovada");
    toast.success("Avaliação aprovada!");
  };

  const handleReject = (id: string) => {
    updateAvaliacaoStatus(id, "recusada");
    toast.error("Avaliação recusada!");
  };

  const openDuplicateModal = (id: string) => {
    setSelectedAvaliacao(id);
    setSelectedProducts([]);
    setProductSearch("");
    setIsDuplicateModalOpen(true);
  };

  const handleDuplicate = () => {
    if (selectedAvaliacao && selectedProducts.length > 0) {
      duplicateAvaliacaoToProducts(selectedAvaliacao, selectedProducts);
      toast.success(`Avaliação adicionada a ${selectedProducts.length} produto(s)!`);
      setIsDuplicateModalOpen(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingAvaliacaoId(null);
    setEditForm({ produtoId: "", usuario: "", nota: 5, texto: "", status: "aprovada" });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (av: Avaliacao) => {
    setEditingAvaliacaoId(av.id);
    setEditForm({ 
      produtoId: av.produtoId, 
      usuario: av.usuario, 
      nota: av.nota, 
      texto: av.texto, 
      status: av.status || "aprovada" 
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editForm.produtoId || !editForm.usuario || !editForm.texto) {
      toast.error("Preencha todos os campos!");
      return;
    }
    if (editingAvaliacaoId) {
      updateAvaliacao(editingAvaliacaoId, editForm);
      toast.success("Avaliação atualizada!");
    } else {
      addAvaliacao(editForm);
      toast.success("Avaliação adicionada!");
    }
    setIsEditModalOpen(false);
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const modalProducts = produtos.filter(p => 
    p.nome.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 100); // Limita aos primeiros 100 para evitar lentidão e travamento do navegador

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Avaliações</h1>
          <p className="text-slate-500 font-medium mt-1">
            Gerencie as avaliações deixadas pelos clientes nos produtos.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar avaliações..." 
              className="pl-9 bg-white border-slate-200"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Button onClick={handleOpenAdd} className="font-bold whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" /> Adicionar Avaliação
          </Button>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {filteredAvaliacoes.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Nenhuma avaliação encontrada</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm">
              {searchTerm 
                ? "Nenhuma avaliação corresponde à sua busca atual." 
                : "Seus produtos ainda não receberam avaliações."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-bold">Data</th>
                  <th className="px-6 py-4 font-bold">Cliente</th>
                  <th className="px-6 py-4 font-bold">Produto</th>
                  <th className="px-6 py-4 font-bold">Nota</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Comentário</th>
                  <th className="px-6 py-4 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAvaliacoes.map((av) => {
                  const produto = produtos.find(p => p.id === av.produtoId);
                  const status = av.status || "aprovada";
                  
                  return (
                    <tr key={av.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">
                        {new Date(av.data).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">
                        {av.usuario}
                      </td>
                      <td className="px-6 py-4">
                        {produto ? (
                          <div className="font-medium text-slate-700 line-clamp-2 max-w-[200px]" title={produto.nome}>
                            {produto.nome}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-500 font-medium text-xs">
                            <AlertCircle className="h-3 w-3" />
                            Produto excluído
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-3.5 w-3.5 ${star <= av.nota ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} 
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {status === "aprovada" && <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Aprovada</Badge>}
                        {status === "recusada" && <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Recusada</Badge>}
                        {status === "pendente" && <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Pendente</Badge>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-600 line-clamp-2 max-w-[250px] whitespace-normal break-words" title={av.texto}>
                          {av.texto}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {status !== "aprovada" && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8 p-0"
                              onClick={() => handleApprove(av.id)}
                              title="Aprovar Avaliação"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {status !== "recusada" && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 w-8 p-0"
                              onClick={() => handleReject(av.id)}
                              title="Recusar Avaliação"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                            onClick={() => openDuplicateModal(av.id)}
                            title="Adicionar avaliação ao produto"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-slate-500 hover:text-slate-600 hover:bg-slate-50 h-8 w-8 p-0"
                            onClick={() => handleOpenEdit(av)}
                            title="Editar Avaliação"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                            onClick={() => handleDelete(av.id)}
                            title="Excluir Avaliação"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <span className="text-sm text-slate-500 font-medium">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <Dialog open={isDuplicateModalOpen} onOpenChange={setIsDuplicateModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Adicionar avaliação ao produto</DialogTitle>
            <DialogDescription>
              Selecione os produtos para os quais deseja copiar esta avaliação.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col gap-4 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar produtos..." 
                className="pl-9"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>

            <div className="overflow-y-auto border rounded-md flex-1">
              {modalProducts.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  Nenhum produto encontrado.
                </div>
              ) : (
                <div className="divide-y">
                  {modalProducts.map(p => (
                    <div key={p.id} className="flex items-center space-x-3 p-3 hover:bg-slate-50 cursor-pointer" onClick={() => toggleProductSelection(p.id)}>
                      <Checkbox 
                        id={`prod-${p.id}`} 
                        checked={selectedProducts.includes(p.id)}
                        className="pointer-events-none"
                      />
                      <label 
                        htmlFor={`prod-${p.id}`} 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer pointer-events-none"
                      >
                        {p.nome}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDuplicateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDuplicate} disabled={selectedProducts.length === 0}>
              Adicionar aos selecionados ({selectedProducts.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAvaliacaoId ? "Editar Avaliação" : "Nova Avaliação"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Produto</label>
              <Select 
                value={editForm.produtoId} 
                onValueChange={(v) => setEditForm({ ...editForm, produtoId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto..." />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Nome do Avaliador</label>
              <Input 
                value={editForm.usuario} 
                onChange={(e) => setEditForm({ ...editForm, usuario: e.target.value })} 
                placeholder="Ex: João Silva" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nota (Estrelas)</label>
                <Select 
                  value={editForm.nota.toString()} 
                  onValueChange={(v) => setEditForm({ ...editForm, nota: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nota..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map(n => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} Estrela{n > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Status</label>
                <Select 
                  value={editForm.status} 
                  onValueChange={(v: any) => setEditForm({ ...editForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprovada">Aprovada</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="recusada">Recusada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Comentário</label>
              <Textarea 
                value={editForm.texto} 
                onChange={(e) => setEditForm({ ...editForm, texto: e.target.value })} 
                placeholder="Escreva a avaliação..." 
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar Avaliação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Tem certeza que deseja excluir esta avaliação?"
        description="Esta ação não poderá ser desfeita."
      />
    </div>
  );
}


import { createFileRoute } from "@tanstack/react-router";
import { Truck, Store, Package, Settings, Save, CheckCircle2, Plus, Edit, Trash2 } from "lucide-react";
import { useAdminProducts } from "@/stores/products";
import { useAdmin } from "@/stores/admin";
import { getDeterministicStock } from "@/lib/stock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/produtos/estoque")({
  component: AdminProdutosEstoque,
});

function AdminProdutosEstoque() {
  const { customProducts, fornecedores, setFornecedores, removeFornecedor } = useAdminProducts();
  const globalTotalStock = customProducts.reduce((acc, p) => acc + (p.estoque || 0), 0);

  const { pharmacies } = useAdmin();

  // State for Lojas Ativas with their ERP Systems
  const lojas = pharmacies.map(pharmacy => {
    const realStock = customProducts.reduce((total, p) => {
      return total + getDeterministicStock(p, pharmacy.id);
    }, 0);
    
    return {
      nome: pharmacy.nome || pharmacy.razaoSocial,
      bairro: pharmacy.bairro || "N/A",
      cidade: pharmacy.cidade && pharmacy.uf ? `${pharmacy.cidade}/${pharmacy.uf}` : "N/A",
      sistema: pharmacy.sistemaUtilizado || "N/A",
      stock: realStock
    };
  });

  const realGlobalTotalStock = lojas.reduce((acc, loja) => acc + loja.stock, 0);

  // Modal State for Fornecedor
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ distribuidor: "", cidade: "", prazo: "", apiUrl: "" });
  const [isSaving, setIsSaving] = useState(false);

  const openNewFornecedor = () => {
    setEditingId(null);
    setFormData({ distribuidor: "", cidade: "", prazo: "", apiUrl: "" });
    setIsModalOpen(true);
  };

  const openEditFornecedor = (f: any) => {
    setEditingId(f.id);
    setFormData(f);
    setIsModalOpen(true);
  };

  const handleSaveFornecedor = () => {
    setIsSaving(true);
    setTimeout(() => {
      if (editingId) {
        setFornecedores(fornecedores.map(f => f.id === editingId ? { ...formData, id: editingId } as any : f));
      } else {
        const newId = Math.max(0, ...fornecedores.map(f => f.id)) + 1;
        setFornecedores([...fornecedores, { ...formData, id: newId } as any]);
      }
      setIsSaving(false);
      setIsModalOpen(false);
      toast.success("Fornecedor externo salvo com sucesso!");
    }, 800);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Estoques
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Gerencie o volume armazenado em todas as lojas (Sistema ERP: SPA) e configure a Prateleira Infinita (Estoque Externo).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="bg-emerald-100 p-4 rounded-full text-emerald-800">
            <Package className="h-8 w-8" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total de estoque de produtos em todas as lojas</div>
            <div className="text-4xl font-bold text-slate-800">{realGlobalTotalStock.toLocaleString("pt-BR")}</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="bg-sky-100 p-4 rounded-full text-sky-700">
            <Truck className="h-8 w-8" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Estoque Externo Configurado</div>
            <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {fornecedores.length} Fornecedor{fornecedores.length !== 1 && 'es'} <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Card: Tabela Lojas Ativas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-xl text-slate-800">Estoque Físico das Lojas (SPA)</h2>
            <p className="text-sm text-slate-500">Volume físico real atual nas prateleiras das unidades parceiras (baseado no total do cadastro).</p>
          </div>
          <Input placeholder="Buscar loja..." className="max-w-xs bg-white" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b text-sm">
            <tr>
              <th className="p-4">Unidade / Loja</th>
              <th className="p-4">Bairro</th>
              <th className="p-4">Cidade/UF</th>
              <th className="p-4">Sistema (ERP)</th>
              <th className="p-4 text-right">Estoque Físico (Unid.)</th>
            </tr>
          </thead>
          <tbody>
            {lojas.map((loja, idx) => (
              <tr key={idx} className="border-b last:border-0 hover:bg-slate-50 transition-colors text-sm">
                <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                  <Store className="h-4 w-4 text-slate-400" />
                  {loja.nome}
                </td>
                <td className="p-4 text-slate-500">{loja.bairro}</td>
                <td className="p-4 text-slate-500">{loja.cidade}</td>
                <td className="p-4 text-slate-500 font-medium text-sky-800">{loja.sistema}</td>
                <td className="p-4 text-right">
                  <span className="inline-block bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full">
                    {loja.stock.toLocaleString('pt-BR')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Card: Tabela Fornecedores Externos */}
      <div className="bg-white rounded-xl border border-sky-200 shadow-sm overflow-hidden mt-8 opacity-70">
        <div className="p-6 border-b border-sky-100 bg-sky-50/30 flex justify-between items-start">
          <div>
            <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2">
              <Truck className="h-5 w-5 text-sky-600" />
              Fornecedores Externos <Badge variant="secondary" className="bg-sky-200 text-sky-800 ml-2">em breve</Badge>
            </h2>
            <p className="text-sm text-slate-500 mt-1">Integração com distribuidores parceiros para usar em caso de falta de estoque local.</p>
          </div>
          <Button onClick={openNewFornecedor} className="bg-sky-600 hover:bg-sky-700" disabled>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Fornecedor
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b text-sm">
            <tr>
              <th className="p-4">Distribuidor</th>
              <th className="p-4">Centro de Distribuição</th>
              <th className="p-4">Prazo (Dias Úteis)</th>
              <th className="p-4">URL da API</th>
              <th className="p-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {fornecedores.length === 0 ? (
               <tr>
                 <td colSpan={5} className="p-8 text-center text-slate-500">Nenhum fornecedor externo configurado.</td>
               </tr>
            ) : fornecedores.map((f, idx) => (
              <tr key={idx} className="border-b last:border-0 hover:bg-slate-50 transition-colors text-sm">
                <td className="p-4 font-bold text-sky-900">{f.distribuidor}</td>
                <td className="p-4 text-slate-600">{f.cidade}</td>
                <td className="p-4 text-slate-600">{f.prazo}</td>
                <td className="p-4 text-slate-400 font-mono text-xs">{f.apiUrl}</td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditFornecedor(f)}>
                    <Edit className="h-4 w-4 mr-2" /> Configurar
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => removeFornecedor(f.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Card: Inventário de Produtos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-xl text-slate-800">Inventário de Produtos</h2>
            <p className="text-sm text-slate-500">Visão geral do estoque disponível por produto em todas as lojas.</p>
          </div>
          <Input placeholder="Buscar produto..." className="max-w-xs bg-white" />
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b text-sm sticky top-0 z-10">
              <tr>
                <th className="p-4">Produto</th>
                <th className="p-4">Código (SKU/EAN)</th>
                <th className="p-4">Marca</th>
                <th className="p-4 text-right">Estoque Global (Unid.)</th>
              </tr>
            </thead>
            <tbody>
              {customProducts.slice(0, 50).map((p, idx) => (
                <tr key={idx} className="border-b last:border-0 hover:bg-slate-50 transition-colors text-sm">
                  <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                    {p.imagem ? (
                      <img src={p.imagem} alt={p.nome} className="w-10 h-10 object-contain bg-white rounded border" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 rounded border flex items-center justify-center text-slate-400 shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    <span className="line-clamp-2 max-w-[300px]">{p.nome}</span>
                  </td>
                  <td className="p-4 text-slate-500 font-mono text-xs">{p.id}</td>
                  <td className="p-4 text-slate-500">{p.marca || "-"}</td>
                  <td className="p-4 text-right">
                    <span className={`inline-block font-bold px-3 py-1 rounded-full ${p.estoque > 5 ? 'bg-emerald-50 text-emerald-800' : p.estoque > 0 ? 'bg-orange-50 text-orange-800' : 'bg-red-50 text-red-800'}`}>
                      {p.estoque || 0}
                    </span>
                  </td>
                </tr>
              ))}
              {customProducts.length > 50 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-500 text-sm">
                    Mostrando 50 de {customProducts.length} produtos. Utilize a busca para encontrar itens específicos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Configuração do Fornecedor */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-sky-600" />
              {editingId ? "Configuração de Estoque Externo" : "Novo Fornecedor Externo"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold">Distribuidor Principal</Label>
                <Input 
                  value={formData.distribuidor} 
                  onChange={(e) => setFormData({ ...formData, distribuidor: e.target.value })} 
                  placeholder="Ex: Panvel, Santa Cruz, Profarma..." 
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Cidade Base do CD</Label>
                <Input 
                  value={formData.cidade} 
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} 
                  placeholder="Ex: Porto Alegre / RS" 
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold">Prazo de Entrega (Dias Úteis)</Label>
                <Input 
                  type="number" 
                  value={formData.prazo} 
                  onChange={(e) => setFormData({ ...formData, prazo: e.target.value })} 
                  placeholder="Ex: 3" 
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">URL da API (EANs)</Label>
                <Input 
                  value={formData.apiUrl} 
                  onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })} 
                  placeholder="https://api.distribuidor.com.br/estoque" 
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveFornecedor} disabled={isSaving} className="bg-sky-600 hover:bg-sky-700">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar Configuração"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


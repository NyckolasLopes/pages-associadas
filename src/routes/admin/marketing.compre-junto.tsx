import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Layers, PackagePlus, ArrowRight, Tag, Search } from "lucide-react";
import { useAdminProducts } from "@/stores/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/marketing/compre-junto")({
  component: CompreJuntoAdmin,
});

function CompreJuntoAdmin() {
  const { customProducts } = useAdminProducts();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Encontrar produtos que possuem oferta de Compre Junto cadastrada
  let produtosComOferta = customProducts.filter(p => p.compreJuntoProdutoId);

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    produtosComOferta = produtosComOferta.filter(p => {
      const parceiro = customProducts.find(cp => cp.id === p.compreJuntoProdutoId);
      const mainMatch = p.nome.toLowerCase().includes(term) || (p.ean && p.ean.includes(term));
      const parceiroMatch = parceiro && (parceiro.nome.toLowerCase().includes(term) || (parceiro.ean && parceiro.ean.includes(term)));
      return mainMatch || parceiroMatch;
    });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Layers className="h-6 w-6 text-emerald-700" />
          Aproveite e leve também (Compre Junto Fixo)
        </h1>
        <div className="bg-emerald-100 text-emerald-800 font-bold px-4 py-2 rounded-full text-sm">
          {produtosComOferta.length} {produtosComOferta.length === 1 ? 'Oferta Cadastrada' : 'Ofertas Cadastradas'}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div className="pb-4 border-b flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-800">Ofertas Manuais de Compre Junto</h2>
            <p className="text-sm text-slate-500 mt-1">
              Lista de todos os produtos que possuem um parceiro fixo configurado (Aproveite e leve também). Para adicionar uma nova oferta, edite o produto desejado e selecione o parceiro na seção "Organização do Produto".
            </p>
          </div>
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou EAN..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {customProducts.filter(p => p.compreJuntoProdutoId).length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <PackagePlus className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">Nenhuma oferta cadastrada</h3>
            <p className="text-sm max-w-sm mx-auto">
              Você ainda não vinculou produtos para a sessão "Aproveite e leve também".
              Edite um produto para começar.
            </p>
          </div>
        ) : produtosComOferta.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Search className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">Nenhuma oferta encontrada</h3>
            <p className="text-sm max-w-sm mx-auto">
              Não encontramos nenhuma oferta correspondente à sua busca.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {produtosComOferta.map(produtoPrincipal => {
              const parceiro = customProducts.find(p => p.id === produtoPrincipal.compreJuntoProdutoId);
              
              return (
                <div key={produtoPrincipal.id} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors">
                  <div className="flex items-center gap-6 flex-1">
                    {/* Produto Principal */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-white rounded-md border flex items-center justify-center overflow-hidden shrink-0">
                        {produtoPrincipal.possuiImagem ? (
                          <img src={`https://vtx-ag-p.s3.us-east-1.amazonaws.com/10940/${produtoPrincipal.ean || produtoPrincipal.id}.jpg`} alt="" className="w-full h-full object-contain p-1" />
                        ) : (
                          <Tag className="h-5 w-5 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Produto Principal</div>
                        <div className="font-bold text-slate-800 line-clamp-1">{produtoPrincipal.nome}</div>
                        <div className="text-xs text-slate-500">R$ {produtoPrincipal.precoPor?.toFixed(2)}</div>
                      </div>
                    </div>

                    <ArrowRight className="h-5 w-5 text-slate-300 shrink-0" />

                    {/* Produto Parceiro */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-white rounded-md border flex items-center justify-center overflow-hidden shrink-0">
                        {parceiro?.possuiImagem ? (
                          <img src={`https://vtx-ag-p.s3.us-east-1.amazonaws.com/10940/${parceiro.ean || parceiro.id}.jpg`} alt="" className="w-full h-full object-contain p-1" />
                        ) : (
                          <Tag className="h-5 w-5 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Parceiro "Leve Também"</div>
                        <div className="font-bold text-slate-800 line-clamp-1">{parceiro?.nome || 'Produto não encontrado'}</div>
                        {parceiro && <div className="text-xs text-slate-500">R$ {parceiro.precoPor?.toFixed(2)}</div>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-8 shrink-0 text-right">
                    <div className="text-xs text-slate-500 mb-1">Preço Total do Kit</div>
                    <div className="text-lg font-black text-emerald-800">
                      R$ {((produtoPrincipal.precoPor || 0) + (parceiro?.precoPor || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

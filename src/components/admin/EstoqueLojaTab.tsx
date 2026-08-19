import { useState, useEffect } from "react";
import { Loja } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Box, RefreshCw } from "lucide-react";
import { brl } from "@/lib/format";
import { catalog } from "@/services/catalog";
import { Spinner } from "@/components/ui/spinner";
import { getDeterministicStock } from "@/lib/stock";

export function EstoqueLojaTab({ loja }: { loja: Loja }) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalProducts, setTotalProducts] = useState(0);
  const [serverProducts, setServerProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [lojaApiDataMap, setLojaApiDataMap] = useState<Record<string, { estoque: number, precoPor: number, precoDe: number }>>({});
  
  const loadData = async () => {
    setIsLoading(true);
    
    // Load explicit stock info if available (similar to admin/produtos.tsx)
    if (loja.id) {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase
        .from("produto_precos_loja")
        .select("produto_id, estoque, preco_por, preco_de")
        .eq("loja_id", loja.id);
      
      if (data) {
        const map: Record<string, any> = {};
        data.forEach(d => {
          map[d.produto_id] = { estoque: d.estoque, precoPor: d.preco_por, precoDe: d.preco_de };
        });
        setLojaApiDataMap(map);
      }
    }

    try {
      const { results, count } = await catalog.adminSearchProducts({
        search,
        page: currentPage - 1,
        pageSize,
        listFilter: "all",
        lojaId: loja.id
      });
      setServerProducts(results);
      setTotalProducts(count);
    } catch (e) {
      console.error(e);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(loadData, 300);
    return () => clearTimeout(timeout);
  }, [search, currentPage, pageSize, loja.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-lg border shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Box className="w-6 h-6 text-emerald-700" /> Meu Estoque
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Integre seu sistema ERP via API para sincronizar quantidades e preços.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar EAN ou Nome..." 
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>EAN</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Preço De</TableHead>
                <TableHead className="text-right">Preço Por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Spinner size={32} />
                      <span>Carregando estoque...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : serverProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                    Nenhum produto em estoque encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                serverProducts.map((item) => {
                  const stock = lojaApiDataMap[item.id]?.estoque ?? getDeterministicStock(item, loja.id);
                  const precoPor = lojaApiDataMap[item.id]?.precoPor ?? item.precoPor;
                  const precoDe = lojaApiDataMap[item.id]?.precoDe ?? item.precoDe;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell className="text-slate-500">{item.ean || item.codigoInterno || "-"}</TableCell>
                      <TableCell className="text-right">
                        <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {stock} un
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{brl(precoDe)}</TableCell>
                      <TableCell className="text-right text-emerald-700 font-bold">{brl(precoPor)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="p-4 border-t flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Mostrar</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-sm border border-slate-200 rounded px-2 py-1 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              {[100, 200, 400, 500].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span className="text-sm text-slate-500">
              de {totalProducts} produtos
            </span>
          </div>
          
          {totalProducts > pageSize && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <div className="px-3 text-sm text-slate-600 font-medium">
                Página {currentPage} de {Math.ceil(totalProducts / pageSize)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalProducts / pageSize), p + 1))}
                disabled={currentPage >= Math.ceil(totalProducts / pageSize)}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

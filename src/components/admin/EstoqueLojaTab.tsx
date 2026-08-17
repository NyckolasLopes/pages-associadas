import { useState, useEffect, useMemo } from "react";
import { useAdmin } from "@/stores/admin";
import { useAdminProducts } from "@/stores/products";
import { getDeterministicStock } from "@/lib/stock";
import { Loja } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Box, RefreshCw } from "lucide-react";
import { brl } from "@/lib/format";

export function EstoqueLojaTab({ loja }: { loja: Loja }) {
  const { getStoreEffectiveProducts, _loaded } = useAdminProducts();
  const [search, setSearch] = useState("");
  
  const [lojaApiDataMap, setLojaApiDataMap] = useState<Record<string, { estoque: number, precoPor: number, precoDe: number }>>({});
  
  // Load explicit stock info if available (similar to admin/produtos.tsx)
  useEffect(() => {
    async function loadLojaApiData() {
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
    }
    loadLojaApiData();
  }, [loja.id]);

  const effectiveProducts = useMemo(() => getStoreEffectiveProducts(loja.id), [getStoreEffectiveProducts, loja.id]);

  const filtered = useMemo(() => {
    return effectiveProducts.filter(p => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        (p.nome && p.nome.toLowerCase().includes(s)) ||
        (p.ean && p.ean.toLowerCase().includes(s)) ||
        (p.codigoInterno && p.codigoInterno.toLowerCase().includes(s))
      );
    });
  }, [effectiveProducts, search]);

  const handleRefresh = () => {
    // Optionally refetch lojaApiDataMap here
  };

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
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={!_loaded}>
            <RefreshCw className={`w-4 h-4 mr-2 ${!_loaded ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
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
            {!_loaded ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                  Carregando estoque...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                  Nenhum produto em estoque encontrado. Realize a integração via API.
                </TableCell>
              </TableRow>
            ) : (
              filtered.slice(0, 100).map((item) => {
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
        
        {filtered.length > 100 && (
          <div className="p-4 text-center text-sm text-slate-500 border-t">
            Exibindo os primeiros 100 itens. Use a busca para encontrar produtos específicos.
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useAdmin } from "@/stores/admin";
import { supabase } from "@/integrations/supabase/client";
import { Loja } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Box } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { brl } from "@/lib/format";

export function EstoqueLojaTab({ loja }: { loja: Loja }) {
  const [estoque, setEstoque] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchEstoque = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("produto_precos_loja")
      .select(`
        id,
        preco_de,
        preco_por,
        estoque,
        ativo,
        produtos (
          id,
          nome,
          ean,
          codigo_interno
        )
      `)
      .eq("loja_id", loja.id);

    if (data && !error) {
      setEstoque(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEstoque();
  }, [loja.id]);

  const filtered = estoque.filter(item => {
    if (!search) return true;
    const s = search.toLowerCase();
    const p = item.produtos;
    if (!p) return false;
    return (
      (p.nome && p.nome.toLowerCase().includes(s)) ||
      (p.ean && p.ean.toLowerCase().includes(s)) ||
      (p.codigo_interno && p.codigo_interno.toLowerCase().includes(s))
    );
  });

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
          <Button variant="outline" onClick={fetchEstoque} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <Spinner className="w-8 h-8 mx-auto text-emerald-600" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                  Nenhum produto em estoque encontrado. Realize a integração via API.
                </TableCell>
              </TableRow>
            ) : (
              filtered.slice(0, 100).map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.produtos?.nome}</TableCell>
                  <TableCell className="text-slate-500">{item.produtos?.ean || item.produtos?.codigo_interno || "-"}</TableCell>
                  <TableCell className="text-right">
                    <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${item.estoque > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {item.estoque} un
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{brl(item.preco_de)}</TableCell>
                  <TableCell className="text-right text-emerald-700 font-bold">{brl(item.preco_por)}</TableCell>
                </TableRow>
              ))
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

import { createFileRoute } from "@tanstack/react-router";
import { Filter, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/descontos")({
  component: DescontosPage,
});

function DescontosPage() {
  const descontos = [
    { id: 1, nome: "Desconto por Pix", data: "22/04/2026", tipo: "Meio de pagamento", status: "active" },
    { id: 2, nome: "Desconto por Boleto", data: "22/04/2026", tipo: "Meio de pagamento", status: "active" },
    { id: 3, nome: "Desconto por Pix Parcelado", data: "22/04/2026", tipo: "Meio de pagamento", status: "active" },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-[26px] font-bold text-slate-800">Descontos</h2>
          <span className="text-sm font-medium text-slate-500">{descontos.length} descontos</span>
        </div>
        <Button className="bg-[#1f1d2b] hover:bg-[#2b283b] text-white font-bold h-10 px-5">
          + Criar desconto
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 flex items-center gap-3 border-b">
          <Button variant="outline" className="h-10 px-4 text-slate-600 font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtrar
          </Button>
          
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="buscar desconto" 
              className="h-10 pl-9 border-slate-200"
            />
          </div>

          <Button variant="outline" className="h-10 px-4 text-slate-600 font-semibold border-slate-200 ml-auto flex items-center gap-2">
            Ações <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-slate-500 uppercase font-bold bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input type="checkbox" className="rounded border-slate-300 w-4 h-4" />
                </th>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Data de início</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {descontos.map((desconto) => (
                <tr key={desconto.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded border-slate-300 w-4 h-4" />
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {desconto.nome}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-600">
                    {desconto.data}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-600">
                    {desconto.tipo}
                  </td>
                  <td className="px-6 py-4 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 px-4 font-bold text-slate-700 flex items-center gap-2">
            10 <ChevronDown className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-slate-400">Itens por página</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 border rounded flex items-center justify-center font-bold text-slate-700 shadow-sm bg-white">
            1
          </div>
          <div className="text-slate-300">|</div>
          <div className="h-10 w-10 border border-transparent rounded flex items-center justify-center font-bold text-slate-400 bg-slate-100">
            1
          </div>
        </div>
      </div>
    </div>
  );
}

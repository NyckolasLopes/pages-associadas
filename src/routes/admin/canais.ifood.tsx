import { createFileRoute } from "@tanstack/react-router";
import { Store, Search, Filter, Check, X, MapPin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/stores/admin";

export const Route = createFileRoute("/admin/canais/ifood")({
  component: IfoodIntegrationPage,
});

function IfoodIntegrationPage() {
  const { pharmacies } = useAdmin();
  const [search, setSearch] = useState("");

  const filteredPharmacies = pharmacies.filter(
    (p) =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.cidade?.toLowerCase().includes(search.toLowerCase()) ||
      p.cnpj?.includes(search)
  );

  const activeCount = pharmacies.filter((p) => p.vendeIfood).length;
  const inactiveCount = pharmacies.length - activeCount;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-500 p-3 rounded-xl shadow-md shadow-red-200 text-white">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Canais de Venda: iFood</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">
              Gerencie a participação das suas farmácias no iFood.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500">Trabalham com iFood</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{activeCount}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Check className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500">Não trabalham</p>
            <p className="text-3xl font-black text-slate-700 mt-1">{inactiveCount}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
            <X className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9 h-9 bg-white"
              placeholder="Buscar por nome, cidade ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              Filtros
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b text-slate-400 text-[11px] font-black uppercase bg-white tracking-wider">
                <th className="px-4 py-3">Loja</th>
                <th className="px-4 py-3">CNPJ</th>
                <th className="px-4 py-3">Localização</th>
                <th className="px-4 py-3 text-center">Trabalha com iFood?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPharmacies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 font-medium">
                    Nenhuma loja encontrada.
                  </td>
                </tr>
              ) : null}
              {filteredPharmacies.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-800 text-[14px]">{p.nome}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 font-medium">{p.cnpj}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {p.cidade && p.uf ? `${p.cidade} / ${p.uf}` : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {p.vendeIfood ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none font-bold py-1">
                        <Check className="h-3.5 w-3.5 mr-1.5" /> Sim, trabalha
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold py-1">
                        <X className="h-3.5 w-3.5 mr-1.5" /> Não trabalha
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useAdmin, Pharmacy } from "@/stores/admin";
import { useState } from "react";
import { Truck, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LogisticsModal } from "@/components/admin/LogisticsModal";

      // @ts-ignore
export const Route = createFileRoute("/admin/logistica")({
  component: LogisticaAdmin,
});

function LogisticaAdmin() {
  const { pharmacies } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);

  const filteredPharmacies = pharmacies.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cnpj.includes(searchTerm) ||
      p.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Logística das Lojas
          </h1>
          <p className="text-slate-500 mt-1">
            Gerencie opções de entrega e retirada para cada loja da rede.
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, CNPJ ou cidade..."
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPharmacies.map((pharmacy) => (
          <div
            key={pharmacy.id}
            className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
            onClick={() => setSelectedPharmacy(pharmacy)}
          >
            <div className={`absolute top-0 left-0 w-1 h-full ${pharmacy.ativo ? "bg-emerald-500" : "bg-slate-300"}`} />
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 leading-tight">
                  {pharmacy.nome}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  CNPJ: {pharmacy.cnpj}
                </p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="truncate">
                  {pharmacy.cidade} - {pharmacy.uf}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Truck className="w-4 h-4 text-slate-400" />
                <span>
                  {pharmacy.aceitaEntrega ? (
                     <span className="text-emerald-600 font-medium">Entrega Própria Ativa</span>
                  ) : (
                     <span className="text-slate-400">Entrega Desativada</span>
                  )}
                  {" • "}
                  {pharmacy.aceitaRetirada ? (
                    <span className="text-emerald-600 font-medium">Retirada Ativa</span>
                  ) : (
                    <span className="text-slate-400">Retirada Desativada</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredPharmacies.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-dashed rounded-xl">
            Nenhuma loja encontrada com os termos de busca.
          </div>
        )}
      </div>

      <LogisticsModal
        pharmacy={selectedPharmacy}
        open={!!selectedPharmacy}
        onOpenChange={(open) => !open && setSelectedPharmacy(null)}
      />
    </div>
  );
}
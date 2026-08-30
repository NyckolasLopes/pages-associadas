import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdmin } from "@/stores/admin";
import { StoreColorManager } from "@/components/admin/StoreColorManager";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Palette,
  Store,
  Search,
  ArrowLeft,
  SlidersHorizontal,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Building2,
  MapPin
} from "lucide-react";
import { safeSlugify } from "@/hooks/useActivePharmacy";

export const Route = createFileRoute("/admin/marketing/cores")({
  component: AdminMarketingCores,
});

function AdminMarketingCores() {
  const { pharmacies, activeStoreId, setActiveStoreId } = useAdmin();
  const [search, setSearch] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(activeStoreId || null);

  const filteredPharmacies = pharmacies.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const nome = (p.nome || "").toLowerCase();
    const slug = (p.slug || "").toLowerCase();
    const cidade = (p.cidade || "").toLowerCase();
    const uf = (p.uf || "").toLowerCase();
    return nome.includes(q) || slug.includes(q) || cidade.includes(q) || uf.includes(q);
  });

  const selectedStore = pharmacies.find((p) => p.id === selectedStoreId);

  const getStoreStripes = (p: any): [string, string, string, string, string, string] => {
    const t = p.themeColors || {};
    return [
      t["--primary"] || t.primary || "#705BC2",
      t["--secondary"] || t.secondary || "#FE509C",
      t["--background"] || t.background || "#FFFFFF",
      t["--accent"] || t.accent || "#199965",
      t["--foreground"] || t.foreground || "#666666",
      t["--topbar-bg"] || t.topbarBg || "#C92A42",
    ];
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Palette className="w-7 h-7 text-emerald-600" />
              Cores das Lojas
            </h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
              Marketing & Visual
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie e personalize a paleta de cores e identidade visual de todas as lojas da rede.
          </p>
        </div>

        {selectedStore && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedStoreId(null)}
            className="flex items-center gap-2 border-slate-300"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para lista de lojas
          </Button>
        )}
      </div>

      {/* Main View: Store List OR Selected Store Manager */}
      {!selectedStore ? (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <Input
              placeholder="Buscar loja por nome, cidade ou link..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 focus-visible:ring-0 shadow-none text-sm h-9"
            />
            {search && (
              <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="text-xs text-slate-400">
                Limpar
              </Button>
            )}
          </div>

          {/* Stores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPharmacies.map((store) => {
              const stripes = getStoreStripes(store);
              const isParceiro = store.categoriaAssociado === "Parceiro" || store.isPleno === false;

              return (
                <div
                  key={store.id}
                  onClick={() => {
                    setSelectedStoreId(store.id);
                    setActiveStoreId(store.id);
                  }}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-1">
                          {store.logoUrl ? (
                            <img src={store.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                          ) : (
                            <Store className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition truncate">
                            {store.nome}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">
                              {store.cidade ? `${store.cidade} - ${store.uf || "RS"}` : "Sem endereço"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 font-bold ${
                          isParceiro
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {store.categoriaAssociado || (isParceiro ? "Parceiro" : "Pleno")}
                      </Badge>
                    </div>

                    {/* Color Stripes Preview */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                        <span>Paleta da Loja</span>
                        <span className="font-mono text-[10px] text-slate-400">6 Cores</span>
                      </div>
                      <div className="h-6 w-full rounded-lg overflow-hidden flex shadow-inner border border-slate-200">
                        {stripes.map((hex, sIdx) => (
                          <div key={sIdx} className="flex-1 h-full" style={{ backgroundColor: hex }} title={hex} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
                    <span className="flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5" /> Configurar Cores
                    </span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}

            {filteredPharmacies.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                Nenhuma loja encontrada para a busca "{search}".
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <StoreColorManager
            storeId={selectedStore.id}
            showStoreSelector={false}
            title={`Cores de ${selectedStore.nome}`}
            description={`Configuração da paleta visual da loja ${selectedStore.nome} (${selectedStore.cidade || "RS"}).`}
          />
        </div>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Store,
  ExternalLink,
  Copy,
  CheckCircle2,
  Globe,
  Rocket,
  MapPin,
} from "lucide-react";

export const Route = createFileRoute("/admin/lojas/gerar")({
  component: GerarLojaPage,
});

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function GerarLojaPage() {
  const { pharmacies } = useAdmin();
  const [generatedSlugs, setGeneratedSlugs] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://pagesassociadas.vercel.app";

  const getLojaSlug = (pharmacy: any) => {
    const nome = pharmacy.nome || pharmacy.nomeFantasia || pharmacy.id;
    return slugify(nome);
  };

  const getLojaUrl = (pharmacy: any) => {
    return `${baseUrl}/${getLojaSlug(pharmacy)}`;
  };

  const getLojaSlugUrl = (pharmacy: any) => {
    return getLojaUrl(pharmacy);
  };

  const handleGerar = (pharmacy: any) => {
    setGeneratedSlugs((prev) => ({ ...prev, [pharmacy.id]: true }));
    toast.success(`Loja "${pharmacy.nome}" gerada com sucesso!`, {
      description: `Acesse: ${getLojaUrl(pharmacy)}`,
    });
  };

  const handleCopyUrl = (pharmacy: any) => {
    const url = getLojaUrl(pharmacy);
    navigator.clipboard.writeText(url);
    setCopiedId(pharmacy.id);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activePharmacies = pharmacies.filter((p) => p.ativo !== false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary" />
            </div>
            Gerar Loja
          </h2>
          <p className="text-muted-foreground mt-1">
            Gere a página individual de e-commerce para cada loja da rede. Cada loja terá sua própria URL com vitrine de produtos, carrinho e atendimento via WhatsApp.
          </p>
        </div>
      </div>

      {/* Lojas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {activePharmacies.map((pharmacy) => {
          const isGenerated = generatedSlugs[pharmacy.id];
          const lojaUrl = getLojaUrl(pharmacy);

          return (
            <div
              key={pharmacy.id}
              className={`relative bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${
                isGenerated
                  ? "border-emerald-300 shadow-md shadow-emerald-100"
                  : "border-slate-200 hover:border-primary/30 hover:shadow-md"
              }`}
            >
              {/* Status indicator */}
              {isGenerated && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Ativa
                  </span>
                </div>
              )}

              <div className="p-5">
                {/* Store header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isGenerated
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {pharmacy.nome}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        {pharmacy.bairro && pharmacy.cidade
                          ? `${pharmacy.bairro}, ${pharmacy.cidade}/${pharmacy.uf}`
                          : pharmacy.cidade
                          ? `${pharmacy.cidade}/${pharmacy.uf}`
                          : pharmacy.endereco || "Endereço não informado"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* URL preview */}
                <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      URL da Loja
                    </span>
                  </div>
                  <p className="text-xs text-primary font-mono break-all leading-relaxed">
                    {lojaUrl}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!isGenerated ? (
                    <Button
                      onClick={() => handleGerar(pharmacy)}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold text-xs h-9"
                    >
                      <Rocket className="w-3.5 h-3.5 mr-1.5" />
                      Gerar Loja
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyUrl(pharmacy)}
                        className="flex-1 text-xs font-bold h-9"
                      >
                        {copiedId === pharmacy.id ? (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Copiado!
                          </span>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1.5" />
                            Copiar Link
                          </>
                        )}
                      </Button>
                      <a
                        href={lojaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-bold h-9 text-primary border-primary/30 hover:bg-primary/5"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Abrir
                        </Button>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activePharmacies.length === 0 && (
        <div className="bg-white border rounded-2xl p-12 text-center">
          <Store className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-700">Nenhuma loja cadastrada</p>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre lojas na seção "Lojas → Nova loja" para poder gerar as páginas.
          </p>
        </div>
      )}
    </div>
  );
}

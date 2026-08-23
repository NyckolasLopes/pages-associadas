import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Store,
  ExternalLink,
  Copy,
  CheckCircle2,
  Globe,
  Rocket,
  MapPin,
  XCircle,
  Trash2,
  Edit2,
  Check,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

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
  const { pharmacies, updatePharmacy, removePharmacy, banners, addBanner } = useAdmin();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [storeToDelete, setStoreToDelete] = useState<string | null>(null);
  const [copyBannersState, setCopyBannersState] = useState<Record<string, boolean>>({});
  
  const [editingSlugId, setEditingSlugId] = useState<string | null>(null);
  const [tempSlug, setTempSlug] = useState("");

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://pagesassociadas.vercel.app";

  const getLojaSlug = (pharmacy: any) => {
    if (pharmacy.slug) return slugify(pharmacy.slug);
    const nome = pharmacy.nome || pharmacy.nomeFantasia || pharmacy.id;
    return slugify(nome);
  };

  const getLojaUrl = (pharmacy: any) => {
    return `${baseUrl}/${getLojaSlug(pharmacy)}`;
  };

  const handleGerar = async (pharmacy: any) => {
    await updatePharmacy(pharmacy.id, {
      ...pharmacy,
      isVirtualStoreGenerated: true,
      virtualStoreStatus: "Ativa"
    });

    const shouldCopy = pharmacy.categoriaAssociado === 'Pleno' ? true : (copyBannersState[pharmacy.id] !== false);
    if (shouldCopy) {
      const globalBanners = banners.filter(b => !b.lojaId);
      for (const banner of globalBanners) {
        await addBanner({
          ...banner,
          id: "", // Will let Supabase generate it
          lojaId: pharmacy.id
        });
      }
    }

    toast.success(`Loja "${pharmacy.nome}" gerada com sucesso!`, {
      description: `Acesse: ${getLojaUrl(pharmacy)}`,
    });
  };

  const handleToggleStatus = (pharmacy: any, checked: boolean) => {
    const newStatus = checked ? "Ativa" : "Inativa";
    updatePharmacy(pharmacy.id, {
      ...pharmacy,
      virtualStoreStatus: newStatus
    });
    toast.success(`Status da loja alterado para ${newStatus}.`);
  };

  const handleDeleteConfirm = async () => {
    if (storeToDelete) {
      try {
        await removePharmacy(storeToDelete);
        toast.success("Loja excluída com sucesso.");
        setStoreToDelete(null);
      } catch (error) {
        console.error("Erro ao excluir loja:", error);
        toast.error("Erro ao excluir a loja.");
      }
    }
  };

  const handleCopyUrl = (pharmacy: any) => {
    const url = getLojaUrl(pharmacy);
    navigator.clipboard.writeText(url);
    setCopiedId(pharmacy.id);
    toast.success("URL copiada!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveSlug = async (pharmacy: any) => {
    if (!tempSlug.trim()) {
      setEditingSlugId(null);
      return;
    }
    const newSlug = slugify(tempSlug);
    await updatePharmacy(pharmacy.id, {
      ...pharmacy,
      slug: newSlug
    });
    setEditingSlugId(null);
    toast.success("URL da loja atualizada!");
  };

  const activePharmacies = pharmacies.filter((p) => p.ativo !== false);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary" />
            </div>
            Gerar Loja Virtual
          </h2>
          <p className="text-muted-foreground mt-1">
            Gere a página individual de e-commerce para cada loja da rede. Controle o status de ativação das vitrines e acessos.
          </p>
        </div>
      </div>

      {/* Lojas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {activePharmacies.map((pharmacy) => {
          const isGenerated = pharmacy.isVirtualStoreGenerated;
          const isAtiva = pharmacy.virtualStoreStatus === "Ativa";
          const lojaUrl = getLojaUrl(pharmacy);

          return (
            <div
              key={pharmacy.id}
              className={`relative bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${
                isGenerated
                  ? (isAtiva ? "border-emerald-300 shadow-md shadow-emerald-100" : "border-slate-300 shadow-sm opacity-90")
                  : "border-slate-200 hover:border-primary/30 hover:shadow-md"
              }`}
            >
              {/* Status and Actions */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {isGenerated && (
                  isAtiva ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Ativa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">
                      <XCircle className="w-3.5 h-3.5" /> Inativa
                    </span>
                  )
                )}
                <button
                  onClick={() => setStoreToDelete(pharmacy.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Excluir loja"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6">
                {/* Store header */}
                <div className="flex items-start gap-4 mb-5">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                    isGenerated
                      ? (isAtiva ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500")
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    <Store className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1 pr-16">
                    <h3 className="font-bold text-slate-900 text-lg truncate mb-1">
                      {pharmacy.nome}
                    </h3>
                    <div className="flex flex-col gap-2">
                      {(() => {
                        const cat = pharmacy.categoriaAssociado || 'Parceiro';
                        const displayCat = cat.toLowerCase() === 'padrão' ? 'Pleno' : cat;
                        return (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border w-fit ${
                            displayCat === 'Pleno' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' 
                              : 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm'
                          }`}>
                            {displayCat === 'Pleno' ? 'Loja Pleno' : 'Loja Parceiro'}
                          </div>
                        );
                      })()}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
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
                </div>

                {/* URL preview (Only if generated) */}
                {isGenerated && (
                  <div className={`rounded-xl p-3 mb-5 border ${isAtiva ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-2 mb-1.5 justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className={`w-3.5 h-3.5 ${isAtiva ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isAtiva ? 'text-emerald-700' : 'text-slate-500'}`}>
                          URL da Loja
                        </span>
                      </div>
                      {editingSlugId !== pharmacy.id && (
                        <button
                          onClick={() => {
                            setEditingSlugId(pharmacy.id);
                            setTempSlug(getLojaSlug(pharmacy));
                          }}
                          className={`text-[10px] font-bold uppercase flex items-center gap-1 hover:opacity-80 transition-opacity ${isAtiva ? 'text-emerald-700' : 'text-slate-500'}`}
                        >
                          <Edit2 className="w-3 h-3" /> Editar URL
                        </button>
                      )}
                    </div>
                    {editingSlugId === pharmacy.id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-500">{baseUrl}/</span>
                        <Input
                          value={tempSlug}
                          onChange={(e) => setTempSlug(e.target.value)}
                          className="h-7 text-xs px-2 flex-1 font-mono"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveSlug(pharmacy);
                            if (e.key === "Escape") setEditingSlugId(null);
                          }}
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-100" onClick={() => handleSaveSlug(pharmacy)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:bg-slate-200" onClick={() => setEditingSlugId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className={`text-xs font-mono break-all leading-relaxed ${isAtiva ? 'text-emerald-900' : 'text-slate-500'}`}>
                        {lojaUrl}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  {!isGenerated ? (
                    <div className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Checkbox 
                          checked={pharmacy.categoriaAssociado === 'Pleno' ? true : (copyBannersState[pharmacy.id] !== false)}
                          onCheckedChange={(checked) => setCopyBannersState(prev => ({...prev, [pharmacy.id]: !!checked}))}
                          disabled={pharmacy.categoriaAssociado === 'Pleno'}
                          id={`copy-banners-${pharmacy.id}`}
                          className="mt-1"
                        />
                        <label 
                          htmlFor={`copy-banners-${pharmacy.id}`} 
                          className="text-sm font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700"
                        >
                          Gerar loja com os banners cadastrados pela rede?
                        </label>
                      </div>
                      <Button
                        onClick={() => handleGerar(pharmacy)}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-10 shadow-sm transition-all hover:scale-[1.02]"
                      >
                        <Rocket className="w-4 h-4 mr-2" />
                        Gerar Loja Virtual
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-sm font-semibold text-slate-700">
                            Status da Vitrine: {isAtiva ? 'Ativada' : 'Desativada'}
                          </Label>
                        </div>
                        <Button
                          variant={isAtiva ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleToggleStatus(pharmacy, !isAtiva)}
                          className={isAtiva ? "w-full bg-red-500 hover:bg-red-600 font-bold shadow-sm" : "w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-sm"}
                        >
                          {isAtiva ? (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Desativar Loja
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Ativar Loja
                            </>
                          )}
                        </Button>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleCopyUrl(pharmacy)}
                          className="flex-1 text-xs font-bold h-9 bg-white"
                        >
                          {copiedId === pharmacy.id ? (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Copiado!
                            </span>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                              Copiar Link
                            </>
                          )}
                        </Button>
                        <a
                          href={lojaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button
                            variant="outline"
                            disabled={!isAtiva}
                            className="w-full text-xs font-bold h-9 text-primary border-primary/30 hover:bg-primary/5 bg-white disabled:opacity-50 disabled:bg-slate-50"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                            Acessar
                          </Button>
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activePharmacies.length === 0 && (
        <div className="bg-white border rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Nenhuma loja cadastrada</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Cadastre as lojas da rede em "Lojas &gt; Nova loja" para poder gerar as vitrines virtuais individuais de cada uma.
          </p>
        </div>
      )}

      <AlertDialog open={!!storeToDelete} onOpenChange={(open) => !open && setStoreToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Loja</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta loja? Essa ação não pode ser desfeita e todos os dados vinculados a ela serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Excluir Loja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

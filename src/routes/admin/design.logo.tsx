import { createFileRoute } from "@tanstack/react-router";
import { StoreSelector } from "@/components/admin/StoreSelector";
import { useAdmin } from "@/stores/admin";
import { useConfig } from "@/stores/config";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import logoUrlDefault from "@/assets/logo.png";
import logoAnvisaDefault from "@/assets/logo-anvisa.png";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/design/logo")({
  component: AdminDesignLogo,
});

const LOGO_BUCKET = "logos";

async function uploadLogoToStorage(file: File, path: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const filePath = `${path}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(filePath);
  // Adiciona cache-buster para forçar reload imediato
  return `${data.publicUrl}?t=${Date.now()}`;
}

function AdminDesignLogo() {
  const { activeStoreId, currentUser, pharmacies, updatePharmacy } = useAdmin();
  const { logo: globalLogo, fetchConfigs, saveConfig } = useConfig();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;
  let storeId = activeStoreId;
  
  if (!isGlobalAdmin && !storeId && currentUser?.lojasVinculadas?.length) {
    storeId = currentUser.lojasVinculadas[0];
  }

  const currentPharmacy = storeId ? pharmacies.find((p) => p.id === storeId) : null;
  const isParceiro = currentPharmacy?.categoriaAssociado === 'Parceiro';
  const isPleno = currentPharmacy?.categoriaAssociado === 'Pleno';

  const defaultLogo = isParceiro ? "" : logoUrlDefault;
  const defaultFavicon = isParceiro ? "" : "/favicon.png";
  const defaultFooterLogo = isParceiro ? "" : logoUrlDefault;
  const defaultAnvisaLogo = isParceiro ? "" : logoAnvisaDefault;

  const currentLogo = currentPharmacy ? (currentPharmacy.logoUrl || defaultLogo) : (globalLogo || defaultLogo);
  const currentFavicon = currentPharmacy ? (currentPharmacy.faviconUrl || defaultFavicon) : defaultFavicon;
  const currentFooterLogo = currentPharmacy ? (currentPharmacy.footerLogoUrl || defaultFooterLogo) : defaultFooterLogo;
  const currentAnvisaLogo = currentPharmacy ? (currentPharmacy.anvisaLogoUrl || defaultAnvisaLogo) : defaultAnvisaLogo;

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
    storagePath: string,
    maxSizeMB: number = 2
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Se não for admin global e não tem currentPharmacy, falha
    if (!isGlobalAdmin && !currentPharmacy) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`O arquivo deve ter no máximo ${maxSizeMB}MB.`);
      return;
    }

    setUploadingField(fieldName);
    try {
      const storagePrefix = currentPharmacy ? currentPharmacy.id : "global";
      const url = await uploadLogoToStorage(file, `${storagePrefix}/${storagePath}`);
      
      if (currentPharmacy) {
        await updatePharmacy(currentPharmacy.id, { ...currentPharmacy, [fieldName]: url });
      } else {
        if (fieldName === 'logoUrl') {
          await saveConfig("logo", url);
        } else {
          toast.info("Apenas o logo principal é suportado globalmente no momento.");
        }
      }
      toast.success("Imagem atualizada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao enviar logo via storage:", err);
      toast.error("Erro ao salvar a imagem.");
    } finally {
      setUploadingField(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerUpload = (fieldName: string, storagePath: string, maxSizeMB?: number) => {
    if (fileInputRef.current) {
      fileInputRef.current.onchange = (e) =>
        handleFileUpload(e as any, fieldName, storagePath, maxSizeMB);
      fileInputRef.current.click();
    }
  };

  if (!isGlobalAdmin && (!storeId || !currentPharmacy)) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-lg shadow-sm border">
        Selecione uma loja específica no topo para visualizar ou alterar o logo e favicon.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Logo e Favicon</h2>
          <p className="text-muted-foreground">Gerencie a identidade visual {currentPharmacy ? `da loja ${currentPharmacy.nome}` : 'global da rede'}.</p>
        </div>
        <StoreSelector className="mb-0" />
      </div>

      {/* Removed Alteração Bloqueada alert */}

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />

      <div className="space-y-6 max-w-4xl">
        <h3 className="text-xl font-bold text-slate-800">Alterar logo e ícone da loja</h3>
        
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm">Logo</span>
            </div>
            {!isPleno && (
              <Button variant="outline" size="sm" disabled={uploadingField === 'logoUrl'} onClick={() => triggerUpload('logoUrl', 'logo')}>
                {uploadingField === 'logoUrl' ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-2" />} Escolher imagem
              </Button>
            )}
          </div>
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="relative group inline-block">
              {currentLogo ? (
                <img src={currentLogo} alt="Logo" className="h-16 object-contain" />
              ) : (
                <div className="h-16 w-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              {currentPharmacy?.logoUrl && !isPleno && (
                <button onClick={() => {
                  if (currentPharmacy?.id) updatePharmacy(currentPharmacy.id, { ...currentPharmacy, logoUrl: "" } as any);
                  toast.success("Logo removido!");
                }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            {!currentPharmacy?.logoUrl && !isParceiro && (
              <p className="text-xs font-medium text-slate-400 mt-4">
                Exibindo logo padrão do tema (Farmácias Associadas).
              </p>
            )}
            {!currentPharmacy?.logoUrl && isParceiro && (
              <p className="text-xs font-medium text-amber-600 mt-4 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">
                Lojas parceiras não utilizam a logo da rede. Envie a logo da sua farmácia.
              </p>
            )}
            <p className="text-xs text-muted-foreground max-w-[250px] mt-4">
              Máximo de 1 imagem. Tamanho máximo <strong>1MB</strong>.
              Todas as logos são redimensionadas para o tamanho máximo de 600 x 600px.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm">Ícone da página (Favicon)</span>
            </div>
            {!isPleno && (
              <Button variant="outline" size="sm" disabled={uploadingField === 'faviconUrl'} onClick={() => triggerUpload('faviconUrl', 'favicon', 0.5)}>
                {uploadingField === 'faviconUrl' ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-2" />} Escolher imagem
              </Button>
            )}
          </div>
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="relative group inline-block">
              {currentFavicon ? (
                <img src={currentFavicon} alt="Favicon" className="h-16 w-16 object-contain border rounded-lg bg-slate-50 p-2" />
              ) : (
                <div className="h-16 w-16 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              {currentPharmacy?.faviconUrl && !isPleno && (
                <button onClick={() => {
                  if (currentPharmacy?.id) updatePharmacy(currentPharmacy.id, { ...currentPharmacy, faviconUrl: "" } as any);
                  toast.success("Favicon removido!");
                }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            {!currentPharmacy?.faviconUrl && !isParceiro && (
              <p className="text-xs font-medium text-slate-400 mt-4">
                Exibindo favicon padrão do tema.
              </p>
            )}
            {!currentPharmacy?.faviconUrl && isParceiro && (
              <p className="text-xs font-medium text-amber-600 mt-4 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">
                Lojas parceiras não utilizam o ícone da rede. Envie o ícone da sua farmácia.
              </p>
            )}
            <p className="text-xs text-muted-foreground max-w-[250px] mt-4">
              Máximo de 1 imagem. Tamanho máximo <strong>100KB</strong>.
              Todos os ícones são redimensionados para o tamanho máximo de 128 x 128px.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm">Logo do Rodapé</span>
            </div>
            <Button variant="outline" size="sm" disabled={uploadingField === 'footerLogoUrl'} onClick={() => triggerUpload('footerLogoUrl', 'footer-logo')}>
              {uploadingField === 'footerLogoUrl' ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-2" />} Escolher imagem
            </Button>
          </div>
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="relative group inline-block">
              {currentFooterLogo ? (
                <img src={currentFooterLogo} alt="Logo Rodapé" className="h-16 object-contain border rounded-lg bg-slate-50 p-2" />
              ) : (
                <div className="h-16 w-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              {currentPharmacy?.footerLogoUrl && (
                <button onClick={() => {
                  if (currentPharmacy?.id) updatePharmacy(currentPharmacy.id, { ...currentPharmacy, footerLogoUrl: "" } as any);
                  toast.success("Logo do rodapé removido!");
                }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            {!currentPharmacy?.footerLogoUrl && (
              <p className="text-xs font-medium text-slate-400 mt-4">
                Exibindo logo padrão do tema no rodapé. alterar.
              </p>
            )}
            <p className="text-xs text-muted-foreground max-w-[300px] mt-4">
              Tamanho recomendado: <strong>300 x 100px</strong> (formato retangular horizontal). Tamanho máximo <strong>1MB</strong>.
            </p>
          </div>
        </div>


        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm">Selo da Anvisa</span>
            </div>
            <Button variant="outline" size="sm" disabled={uploadingField === 'anvisaLogoUrl'} onClick={() => triggerUpload('anvisaLogoUrl', 'anvisa-logo')}>
              {uploadingField === 'anvisaLogoUrl' ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-2" />} Escolher imagem
            </Button>
          </div>
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="relative group inline-block">
              {currentAnvisaLogo ? (
                <img src={currentAnvisaLogo} alt="Logo Anvisa" className="h-16 object-contain border rounded-lg bg-slate-50 p-2" />
              ) : (
                <div className="h-16 w-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              {currentPharmacy?.anvisaLogoUrl && (
                <button onClick={() => {
                  if (currentPharmacy?.id) updatePharmacy(currentPharmacy.id, { ...currentPharmacy, anvisaLogoUrl: "" } as any);
                  toast.success("Logo da Anvisa removido!");
                }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            {!currentPharmacy?.anvisaLogoUrl && (
              <p className="text-xs font-medium text-slate-400 mt-4">
                Nenhum logo da Anvisa configurado.
              </p>
            )}
            <p className="text-xs text-muted-foreground max-w-[300px] mt-4">
              Tamanho ideal: <strong>240 x 136px</strong>. Tamanho máximo <strong>1MB</strong>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

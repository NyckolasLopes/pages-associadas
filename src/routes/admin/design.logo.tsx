import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import logoUrlDefault from "@/assets/logo.png";

export const Route = createFileRoute("/admin/design/logo")({
  component: AdminDesignLogo,
});

function AdminDesignLogo() {
  const admin = useAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        callback(event.target.result);
      }
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (callback: (base64: string) => void) => {
    if (fileInputRef.current) {
      fileInputRef.current.onchange = (e) => handleFileUpload(e as any, callback);
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Logo e Favicon</h2>
        <p className="text-muted-foreground">Gerencie a identidade visual básica da sua loja.</p>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />

      <div className="space-y-6 max-w-4xl">
        <h3 className="text-xl font-bold text-slate-800">Alterar logo e ícone da loja</h3>
        
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm">Logo</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => triggerUpload(base64 => admin.setLogoUrl(base64))}>
              <Upload className="w-3.5 h-3.5 mr-2" /> Escolher imagem
            </Button>
          </div>
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="relative group inline-block">
              <img src={admin.logoUrl || logoUrlDefault} alt="Logo" className="h-16 object-contain" />
              {admin.logoUrl && (
                <button onClick={() => admin.setLogoUrl("")} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            {!admin.logoUrl && (
              <p className="text-xs font-medium text-slate-400 mt-4">
                Exibindo logo padrão do tema.
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
            <Button variant="outline" size="sm" onClick={() => triggerUpload(base64 => { admin.setFaviconUrl(base64); toast.success("Favicon atualizado!"); })}>
              <Upload className="w-3.5 h-3.5 mr-2" /> Escolher imagem
            </Button>
          </div>
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="relative group inline-block">
              <img src={admin.faviconUrl || '/favicon.png'} alt="Favicon" className="h-16 w-16 object-contain border rounded-lg bg-slate-50 p-2" />
              {admin.faviconUrl && (
                <button onClick={() => admin.setFaviconUrl("")} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            {!admin.faviconUrl && (
              <p className="text-xs font-medium text-slate-400 mt-4">
                Exibindo ícone padrão do tema.
              </p>
            )}
            <p className="text-xs text-muted-foreground max-w-[250px] mt-4">
              Máximo de 1 imagem. Tamanho máximo <strong>100KB</strong>.
              Todos os ícones são redimensionados para o tamanho máximo de 128 x 128px.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

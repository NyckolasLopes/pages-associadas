import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { X, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { useMarcasStore } from "@/stores/marcas";

export const Route = createFileRoute("/admin/marcas/nova")({
  component: AdminMarcaNova,
});

function AdminMarcaNova() {
  const navigate = useNavigate();
  const addMarca = useMarcasStore((s) => s.addMarca);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [logo, setLogo] = useState("");
  const [seoUrl, setSeoUrl] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [destaque, setDestaque] = useState(true);
  const [marcaPropria, setMarcaPropria] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL("image/webp", 0.8);
        setLogo(compressedBase64);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!nome.trim()) return;

    addMarca({
      id: `m${Date.now()}`,
      nome,
      descricao,
      logo,
      seoUrl: seoUrl || nome.toLowerCase().replace(/\s+/g, '-'),
      slug: seoUrl || nome.toLowerCase().replace(/\s+/g, '-'),
      ativo,
      destaque,
      marcaPropria
    });

    navigate({ to: "/admin/marcas" });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-slate-50 w-full max-w-3xl rounded-xl shadow-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white rounded-t-xl">
          <h2 className="text-xl font-bold text-slate-800">Nova marca</h2>
          <Link to="/admin/marcas">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto">
          {/* Informações Principais */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-6">
            <h3 className="font-bold text-slate-800 text-lg border-b pb-2">Informações principais</h3>
            
            <div className="flex flex-wrap gap-8 items-center">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Marca ativa?</Label>
                <div className="flex items-center gap-2">
                  <Switch checked={ativo} onCheckedChange={setAtivo} className="data-[state=checked]:bg-[#00AFA9]" />
                  <span className="text-sm text-slate-600">{ativo ? "Sim" : "Não"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Adicionar marca à vitrine de marcas?</Label>
                <div className="flex items-center gap-2">
                  <Switch checked={destaque} onCheckedChange={setDestaque} className="data-[state=checked]:bg-[#00AFA9]" />
                  <span className="text-sm text-slate-600">{destaque ? "Sim" : "Não"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Marca própria?</Label>
                <div className="flex items-center gap-2">
                  <Switch checked={marcaPropria} onCheckedChange={setMarcaPropria} className="data-[state=checked]:bg-[#00AFA9]" />
                  <span className="text-sm text-slate-600">{marcaPropria ? "Sim" : "Não"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Nome da marca <span className="text-red-500">*</span></Label>
              <Input 
                className="h-10 border-slate-200" 
                placeholder="Ex: Apple" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Descrição</Label>
              <Textarea 
                className="min-h-[120px] border-slate-200" 
                placeholder="Descreva a marca detalhadamente..." 
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
              <p className="text-[11px] text-slate-500">A descrição da marca será mostrada na página da marca, logo abaixo do menu lateral. Este conteúdo é de extrema importância para os motores de busca (SEO).</p>
            </div>
          </div>

          {/* Logo da marca */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg border-b pb-2">Logo da marca</h3>
            
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                 <input 
                   type="file" 
                   accept="image/*" 
                   className="hidden" 
                   ref={fileInputRef}
                   onChange={handleFileChange}
                 />
                 {logo ? (
                    <div className="relative w-full max-w-[200px]">
                      <img src={logo} alt="Preview do Logo" className="w-full h-auto max-h-[150px] object-contain rounded" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                         <Button variant="outline" className="bg-white text-slate-800 border-none shadow-sm font-bold" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Alterar imagem</Button>
                      </div>
                    </div>
                 ) : (
                   <>
                     <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100 text-slate-400 group-hover:text-[#00B5AD] transition-colors">
                       <UploadCloud className="w-6 h-6" />
                     </div>
                     <h4 className="font-bold text-slate-700 mb-1 text-sm">Arraste e solte o logo da marca aqui</h4>
                     <p className="text-xs text-slate-500 max-w-sm mx-auto">
                       Dimensão recomendada: 150x100px. Fundo transparente (PNG). Tamanho máximo 2MB.
                     </p>
                   </>
                 )}
              </div>
              
              <div className="pt-2">
                <Label className="text-xs font-bold text-slate-500 mb-1 block">Ou use uma URL de imagem</Label>
                <Input 
                  className="h-10 border-slate-200" 
                  placeholder="https://..." 
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-6">
            <h3 className="font-bold text-slate-800 text-lg border-b pb-2">SEO</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">URL da marca</Label>
                <div className="flex">
                  <div className="bg-slate-100 border border-slate-200 border-r-0 rounded-l-md px-3 flex items-center text-sm text-slate-500">
                    ...suafarmacia.com.br/m/
                  </div>
                  <Input 
                    className="h-10 border-slate-200 rounded-l-none" 
                    placeholder="nome-da-marca" 
                    value={seoUrl}
                    onChange={(e) => setSeoUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-md p-4 bg-white shadow-sm space-y-1">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                <div className="text-[#1a0dab] text-lg hover:underline cursor-pointer truncate">{nome || "Nome da marca"}</div>
                <div className="text-[#006621] text-sm truncate">https://suafarmacia.com.br/m/{seoUrl || nome?.toLowerCase().replace(/\s+/g, '-') || "nome-da-marca"}</div>
                <div className="text-[#545454] text-sm line-clamp-2">{descricao || "A descrição da marca será mostrada na página da marca... Este conteúdo é de extrema importância para os motores de busca (SEO)."}</div>
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-4 bg-white rounded-b-xl mt-auto">
          <Link to="/admin/marcas">
            <Button variant="outline" className="h-10 px-8 font-bold text-slate-600 border-slate-200 hover:bg-slate-50">
              Cancelar
            </Button>
          </Link>
          <Button onClick={handleSave} className="h-10 px-8 bg-[#00AFA9] hover:bg-[#008f8a] text-white font-bold">
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

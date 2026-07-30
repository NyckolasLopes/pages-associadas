import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useConfig } from "@/stores/config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Info, ArrowLeft, Link as LinkIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useRef } from "react";

export const Route = createFileRoute("/admin/configuracoes/redirects")({
  component: RedirectsPage,
});

function RedirectsPage() {
  const { dominios, redirects, addRedirect, removeRedirect, addRedirectsBulk } = useConfig();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Single Redirect State
  const [singleDe, setSingleDe] = useState("");
  const [singlePara, setSinglePara] = useState("");

  // Bulk Redirect State
  const [bulkText, setBulkText] = useState("");
  const [selectedDomain, setSelectedDomain] = useState(() => {
    const principal = dominios.find(d => d.principal);
    return principal ? principal.nome : (dominios[0]?.nome || "");
  });

  const handleAddSingle = () => {
    if (!singleDe.trim() || !singlePara.trim()) {
      toast.error("Preencha as duas URLs");
      return;
    }
    // Formatar para garantir que comece com barra caso não seja url completa
    let de = singleDe.trim();
    let para = singlePara.trim();
    if (!de.startsWith("/") && !de.startsWith("http")) de = "/" + de;
    if (!para.startsWith("/") && !para.startsWith("http")) para = "/" + para;

    addRedirect(de, para);
    setSingleDe("");
    setSinglePara("");
    toast.success("Redirecionamento adicionado");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);
        
        let importedText = "";
        data.forEach((row) => {
          if (!row) return;
          const keys = Object.keys(row);
          
          let oldUrlKey = keys.find(k => {
            const lower = k.toLowerCase();
            return lower.includes("antiga") || lower === "de" || lower === "origem" || lower === "url x";
          });
          
          let newUrlKey = keys.find(k => {
            const lower = k.toLowerCase();
            return lower.includes("nova") || lower === "para" || lower === "destino" || lower === "url y";
          });

          if (!oldUrlKey) {
            const genericUrlKeys = keys.filter(k => k.toLowerCase().includes("url") || k.toLowerCase().includes("link"));
            if (genericUrlKeys.length > 0) {
               oldUrlKey = genericUrlKeys[0];
               if (genericUrlKeys.length > 1 && !newUrlKey) {
                  newUrlKey = genericUrlKeys[1];
               }
            }
          }
          
          if (!oldUrlKey) {
             const possibleOld = keys.find(k => typeof row[k] === 'string' && (row[k].startsWith('/') || row[k].startsWith('http')));
             if (possibleOld) {
                oldUrlKey = possibleOld;
                const possibleNew = keys.find(k => k !== possibleOld && typeof row[k] === 'string' && (row[k].startsWith('/') || row[k].startsWith('http')));
                if (possibleNew) newUrlKey = possibleNew;
             }
          }

          if (oldUrlKey && row[oldUrlKey]) {
            let oldUrl = String(row[oldUrlKey]).trim();
            let newUrl = newUrlKey && row[newUrlKey] ? String(row[newUrlKey]).trim() : "";
            
            if (newUrl) {
              importedText += `${oldUrl}, ${newUrl}\n`;
            } else {
              importedText += `${oldUrl}\n`;
            }
          }
        });
        
        setBulkText(prev => prev ? prev + "\n" + importedText : importedText);
        toast.success("Planilha lida com sucesso! Verifique os dados no campo de texto e clique em Adicionar.");
      } catch (err) {
        toast.error("Erro ao ler a planilha. Verifique o formato.");
      }
    };
    reader.readAsBinaryString(file);
    // Limpar o input para permitir subir o mesmo arquivo de novo se necessário
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddBulk = () => {
    if (!bulkText.trim()) {
      toast.error("Insira as URLs no campo em massa");
      return;
    }
    if (!selectedDomain) {
      toast.error("Selecione um domínio principal");
      return;
    }

    const lines = bulkText.split("\n").filter(line => line.trim() !== "");
    const newRedirects: { de: string; para: string }[] = [];

    lines.forEach(line => {
      // Remover espaços em branco
      let cleanLine = line.trim();
      
      // Checar se tem vírgula ou espaço separando url antiga de url nova (ex: /antiga, /nova)
      let de = "";
      let para = "";

      const parts = cleanLine.split(/[\s,]+/).filter(Boolean);
      
      if (parts.length >= 2) {
        // Assume formato: URL_ANTIGA URL_NOVA
        de = parts[0];
        para = parts[1];
      } else {
        // Apenas URL antiga, aponta para a mesma rota no novo domínio
        de = parts[0];
        // Se a url antiga for completa, tenta extrair o path
        try {
          if (de.startsWith("http")) {
            const urlObj = new URL(de);
            para = `https://${selectedDomain}${urlObj.pathname}${urlObj.search}`;
          } else {
            let pathOnly = de.startsWith("/") ? de : `/${de}`;
            para = `https://${selectedDomain}${pathOnly}`;
          }
        } catch(e) {
          para = `https://${selectedDomain}/${de.replace(/^\//, '')}`;
        }
      }

      // Se for apenas path, garante q comece com /
      if (!de.startsWith("/") && !de.startsWith("http")) de = "/" + de;
      if (!para.startsWith("/") && !para.startsWith("http")) para = "/" + para;

      newRedirects.push({ de, para });
    });

    addRedirectsBulk(newRedirects);
    setBulkText("");
    toast.success(`${newRedirects.length} redirecionamentos criados com sucesso!`);
  };

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link to="/admin/configuracoes" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h2 className="text-[26px] font-bold text-slate-800 flex items-center gap-2">
            <LinkIcon className="h-6 w-6 text-slate-600" /> Redirect 301
          </h2>
          <p className="text-slate-500">Mapeie suas URLs antigas para as novas</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-8">
        {/* Single Redirect */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                REDIRECIONAR DE... <Info className="w-4 h-4 text-slate-400" />
              </label>
              <Input 
                placeholder="URL antiga (Ex: /eletronicos)" 
                value={singleDe}
                onChange={e => setSingleDe(e.target.value)}
                className="h-12 border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                REDIRECIONAR PARA... <Info className="w-4 h-4 text-slate-400" />
              </label>
              <Input 
                placeholder="URL nova (Ex: /eletronicos-nova-pagina)" 
                value={singlePara}
                onChange={e => setSinglePara(e.target.value)}
                className="h-12 border-slate-300"
              />
            </div>
          </div>
          <Button onClick={handleAddSingle} variant="outline" className="border-slate-300 text-slate-700 h-11">
            Adicionar redirecionamento
          </Button>
        </div>

        <hr className="border-slate-100" />

        {/* Bulk Redirect */}
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Informar URLs em Massa</h3>
            <p className="text-sm text-slate-500">
              Cole suas URLs antigas (uma por linha). O sistema vai apontar elas para o domínio principal configurado. 
              Para apontar para um destino específico, separe a URL antiga da nova por vírgula ou espaço (Ex: <code className="text-xs bg-slate-100 px-1 rounded">/antiga, /nova</code>).
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800">Selecione o Domínio de Destino Padrão</label>
            <select 
              className="flex h-12 w-full max-w-md items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
            >
              <option value="" disabled>Selecione um domínio...</option>
              {dominios.map(d => (
                <option key={d.id} value={d.nome}>{d.nome} {d.principal ? '(Principal)' : ''}</option>
              ))}
            </select>
          </div>

          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full h-32 rounded-md border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="http://loja-antiga.com/produto-1&#10;http://loja-antiga.com/categoria-2&#10;/caminho-antigo, /caminho-novo"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={handleAddBulk} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-11 px-8">
              Adicionar URLs em massa
            </Button>
            <Button variant="outline" className="h-11 px-6 gap-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4" /> Importar Planilha
            </Button>
            <input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button variant="ghost" className="h-11 px-6 text-slate-500 hover:text-slate-700" onClick={() => setBulkText("")}>
              Limpar
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Redirecionamentos Existentes */}
      {redirects.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-800">Redirecionamentos Ativos ({redirects.length})</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {redirects.map((redirect) => (
              <div key={redirect.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="text-sm font-semibold text-slate-800 truncate">{redirect.de}</div>
                  <div className="text-xs text-slate-500 truncate flex items-center gap-1 mt-1">
                    ↳ {redirect.para}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => removeRedirect(redirect.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Botões de Ação do Fim da Tela como no design */}
      <div className="flex justify-end gap-4 border-t pt-8 mt-8">
        <Link to="/admin/configuracoes">
          <Button variant="outline" className="h-12 px-8 font-medium w-full sm:w-auto">
            Cancelar
          </Button>
        </Link>
        <Link to="/admin/configuracoes">
          <Button className="h-12 px-8 font-medium w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white">
            Salvar
          </Button>
        </Link>
      </div>

    </div>
  );
}

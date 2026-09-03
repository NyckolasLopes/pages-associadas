import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Check,
  X,
  ArrowLeft,
  ArrowRight
} from "lucide-react";

import { waitForDomRepaint } from "@/lib/massActionUtils";

type Step = "upload" | "preview" | "processing" | "done" | "error";

interface DescriptionImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (updates: { ean: string; nome: string; descricao: string }[]) => Promise<{successCount: number; errorCount: number; errors: {ean: string, error: string}[]}>;
}

export function DescriptionImporter({ open, onOpenChange, onImport }: DescriptionImporterProps) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [updates, setUpdates] = useState<{ ean: string; nome: string; descricao: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [importError, setImportError] = useState<string>("");
  const [importResult, setImportResult] = useState<{successCount: number; errorCount: number; errors: {ean: string, error: string}[]}>({successCount: 0, errorCount: 0, errors: []});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setFileName("");
    setUpdates([]);
    setDragOver(false);
    setImportError("");
    setImportResult({successCount: 0, errorCount: 0, errors: []});
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const processFile = useCallback((file: File) => {
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      toast.error("Formato inválido. Use .xlsx, .xls ou .csv");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

        if (jsonData.length === 0) {
          toast.error("A planilha está vazia.");
          return;
        }

        const detectedHeaders = Object.keys(jsonData[0]);
        const normalizedHeaders = detectedHeaders.map(h => h.toLowerCase().trim());
        
        let eanCol = "";
        let descCol = "";
        let nomeCol = "";

        detectedHeaders.forEach((h, i) => {
          const nh = normalizedHeaders[i];
          if (["ean", "codigo de barras", "código de barras", "gtin", "barcode"].includes(nh)) {
            eanCol = h;
          }
          if (["descricao", "descrição", "description", "descrição longa", "descricao longa"].includes(nh) && !descCol) {
            descCol = h;
          }
          if (["nome do produto", "nome", "produto"].includes(nh) && !nomeCol) {
            nomeCol = h;
          }
        });

        if (!eanCol || !descCol) {
          toast.error("Não foi possível encontrar as colunas EAN e Descrição Longa na planilha.");
          return;
        }

        const extractedUpdates = jsonData
          .map(row => ({
            ean: String(row[eanCol] || "").trim(),
            nome: nomeCol ? String(row[nomeCol] || "").trim() : "",
            descricao: String(row[descCol] || "").trim()
          }))
          .filter(u => u.ean && u.descricao);

        if (extractedUpdates.length === 0) {
          toast.error("Nenhuma linha com EAN e Descrição válidos foi encontrada.");
          return;
        }

        setUpdates(extractedUpdates);
        setStep("preview");
        
      } catch (err) {
        console.error(err);
        toast.error("Erro ao ler a planilha. Verifique o formato do arquivo.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }, [processFile]);

  const handleConfirmImport = useCallback(async () => {
    setStep("processing");
    await waitForDomRepaint(80);
    
    try {
      const result = await onImport(updates);
      await waitForDomRepaint(300);
      setImportResult(result);
      setStep("done");
      toast.success(`Foram atualizadas ${result.successCount} descrições!`);
    } catch (err) {
      console.error("Erro ao importar descrições:", err);
      setImportError(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  }, [updates, onImport]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-indigo-600" />
            Importar Descrições em Massa
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Faça upload de uma planilha com as colunas EAN e Descrição."}
            {step === "preview" && `Encontramos ${updates.length} descrições prontas para atualizar.`}
            {step === "processing" && "Atualizando descrições..."}
            {step === "done" && "Importação processada!"}
            {step === "error" && "Erro na importação"}
          </DialogDescription>
        </DialogHeader>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto min-h-0 py-4">
          {step === "upload" && (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                dragOver
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileInput}
              />
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-700">
                    Arraste sua planilha aqui
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ou clique para selecionar um arquivo
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    A planilha precisa ter as colunas <strong>EAN</strong>, <strong>Nome</strong> e <strong>Descrição</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="border rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b sticky top-0">
                        <th className="text-left px-4 py-3 font-bold text-slate-600 w-32">EAN</th>
                        <th className="text-left px-4 py-3 font-bold text-slate-600">Nova Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {updates.slice(0, 50).map((u, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-muted-foreground font-mono">{u.ean}</td>
                          <td className="px-4 py-3 font-medium text-slate-700 max-w-[400px] truncate">{u.descricao}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {updates.length > 50 && (
                  <div className="px-3 py-2 bg-slate-50 text-xs text-muted-foreground text-center border-t">
                    Exibindo 50 de {updates.length} descrições
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="h-16 w-16 relative">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-lg font-bold text-slate-700 mt-4 text-center max-w-md">
                Aguarde um momento enquanto estamos importanto sua planilha de descrições longas
              </p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${importResult.errorCount === 0 ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                {importResult.errorCount === 0 ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-amber-600" />
                )}
              </div>
              
              <div className="text-center">
                <p className={`text-lg font-bold ${importResult.errorCount === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  Importação Processada
                </p>
                <div className="flex gap-4 mt-2 justify-center">
                   <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{importResult.successCount} Sucessos</Badge>
                   {importResult.errorCount > 0 && <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{importResult.errorCount} Erros</Badge>}
                </div>
              </div>

              {importResult.errorCount > 0 && (
                <div className="w-full max-w-2xl mt-4">
                  <p className="text-sm font-bold text-slate-700 mb-2">Relatório de Erros:</p>
                  <div className="border rounded-md max-h-60 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 font-semibold">EAN</th>
                          <th className="px-3 py-2 font-semibold">Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                         {importResult.errors.map((e, idx) => (
                           <tr key={idx} className="border-t">
                              <td className="px-3 py-2 font-mono">{e.ean}</td>
                              <td className="px-3 py-2 text-red-600">{e.error}</td>
                           </tr>
                         ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <Button onClick={handleClose} className="mt-4" variant="outline">
                Fechar
              </Button>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-lg font-bold text-red-700">Falha na Importação</p>
              <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm max-w-md w-full border border-red-200 font-mono text-center">
                {importError}
              </div>
              <Button onClick={() => setStep("upload")} className="mt-4" variant="outline">
                Tentar Novamente
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== "done" && step !== "processing" && step !== "error" && (
          <DialogFooter className="flex-row justify-between gap-2 pt-4 border-t">
            <div>
              {step === "preview" && (
                <Button
                  variant="outline"
                  onClick={() => setStep("upload")}
                  className="font-bold"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleClose} className="font-bold">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              {step === "preview" && (
                <Button
                  onClick={handleConfirmImport}
                  className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Atualizar {updates.length} Descrições
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

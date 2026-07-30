import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Globe, Plus, Trash2, CheckCircle2, AlertCircle, Info, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfig } from "@/stores/config";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/configuracoes/dominios")({
  component: DominiosPage,
});

function DominiosPage() {
  const { dominios, addDomain, removeDomain, makePrincipal } = useConfig();
  const [modalOpen, setModalOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");

  const handleAddDomain = () => {
    if (!newDomain) return;
    addDomain(newDomain);
    setNewDomain("");
    setModalOpen(false);
    toast.success("Domínio adicionado. Siga as instruções para configurar os apontamentos DNS.");
  };

  const handleRemove = (id: number) => {
    removeDomain(id);
    toast.success("Domínio removido com sucesso.");
  };

  const handleMakePrincipal = (id: number) => {
    makePrincipal(id);
    toast.success("Domínio principal atualizado.");
  };

  return (
    <div className="max-w-5xl space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[26px] font-bold text-slate-800 flex items-center gap-2">
            <Globe className="h-6 w-6 text-slate-500" />
            Domínios
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            Gerencie o endereço da sua loja virtual. Conecte seu domínio próprio para fortalecer sua marca.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="font-bold gap-2">
          <Plus className="h-4 w-4" /> Conectar domínio
        </Button>
      </div>

      <div className="bg-sky-50 border border-sky-100 rounded-lg p-5 flex gap-4">
        <Info className="h-6 w-6 text-sky-600 shrink-0" />
        <div className="space-y-2 text-sm text-sky-900">
          <p className="font-bold text-sky-950">Como apontar seu domínio para a loja?</p>
          <p>Para que seu domínio próprio (ex: sua-farmacia.com.br) funcione corretamente, você precisa configurar os apontamentos DNS no painel onde registrou seu domínio (Registro.br, GoDaddy, HostGator, etc) direcionando para nossos servidores na Vercel.</p>
          
          <div className="bg-white rounded border border-sky-200 p-4 mt-3">
            <h4 className="font-bold mb-3 text-sky-950">Configurações necessárias:</h4>
            
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-1 text-xs uppercase tracking-wider text-slate-500">1. Apontamento Tipo A (Sem www)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-50 p-3 rounded text-xs font-mono">
                  <div><strong>Tipo:</strong> A</div>
                  <div><strong>Nome/Entrada:</strong> @ <span className="text-slate-400 font-sans italic">(ou deixe em branco)</span></div>
                  <div><strong>Valor/Destino:</strong> 76.76.21.21</div>
                </div>
              </div>
              
              <div>
                <p className="font-semibold mb-1 text-xs uppercase tracking-wider text-slate-500">2. Apontamento Tipo CNAME (Com www)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-50 p-3 rounded text-xs font-mono">
                  <div><strong>Tipo:</strong> CNAME</div>
                  <div><strong>Nome/Entrada:</strong> www</div>
                  <div><strong>Valor/Destino:</strong> cname.vercel-dns.com</div>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-sky-700 mt-4 font-medium flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Após configurar, pode levar até 48 horas para a propagação completa do DNS.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-800">Seus domínios</h3>
        </div>
        
        <div className="divide-y divide-slate-100">
          {dominios.map((dom) => (
            <div key={dom.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-full p-1 ${dom.status === 'ativo' ? 'text-emerald-500 bg-emerald-50' : 'text-amber-500 bg-amber-50'}`}>
                  {dom.status === 'ativo' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{dom.nome}</span>
                    {dom.principal && (
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        Principal
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      Status: 
                      {dom.status === 'ativo' 
                        ? <span className="text-emerald-600 font-medium">Ativo e Conectado</span>
                        : <span className="text-amber-600 font-medium">Aguardando propagação</span>
                      }
                    </span>
                    <a href={`https://${dom.nome}`} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      Testar acesso <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {!dom.principal && dom.status === 'ativo' && (
                  <Button variant="outline" size="sm" onClick={() => handleMakePrincipal(dom.id)}>
                    Tornar principal
                  </Button>
                )}
                {!dom.nome.includes('vercel.app') && (
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleRemove(dom.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Conectar novo domínio</DialogTitle>
            <DialogDescription>
              Adicione o endereço que você deseja usar para sua loja.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Seu domínio (ex: minhafarmacia.com.br)</Label>
              <Input 
                value={newDomain} 
                onChange={(e) => setNewDomain(e.target.value)} 
                placeholder="sua-farmacia.com.br"
                autoFocus
              />
            </div>
            <div className="text-sm text-slate-500">
              Não digite <strong>http://</strong> ou <strong>www</strong> no campo acima.
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddDomain} className="font-bold">Adicionar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

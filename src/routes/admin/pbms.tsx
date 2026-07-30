import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Settings, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/pbms")({
  component: AdminPBMs,
});

const PBM_LIST = [
  {
    id: "epharma",
    name: "E-Pharma",
    description: "Integração oficial para autorização de descontos do PBM E-Pharma.",
    logo: (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <span className="text-black font-medium text-[40px] tracking-tighter" style={{ fontFamily: 'sans-serif' }}>e<span className="font-bold">pharma</span></span>
      </div>
    ),
  },
  {
    id: "dermaclub",
    name: "Dermaclub",
    description: "Integração oficial para autorização de descontos do PBM Dermaclub (Zicard).",
    logo: (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#f8b9d4]">
        <div className="text-white font-bold text-[36px] leading-[0.9] tracking-widest">DERMA</div>
        <div className="text-[#e84a27] font-normal text-[36px] leading-[0.9] tracking-widest">CLUB</div>
      </div>
    ),
  },
  {
    id: "scanntech",
    name: "Scanntech",
    description: "Integração Data Integration com Clube de Promoções e Descontos Scanntech.",
    logo: (
      <div className="w-full h-full flex items-center justify-center bg-white gap-2">
        <div className="relative w-10 h-10 flex-shrink-0">
          {/* Símbolo aproximado do logo da scanntech */}
          <div className="absolute inset-0 rounded-full bg-[#003d8f] rounded-tr-none" style={{ transform: 'rotate(45deg)' }} />
          <div className="absolute inset-0 rounded-full bg-[#9bb0d5] rounded-bl-none" style={{ transform: 'rotate(45deg)' }} />
          <div className="absolute inset-0 rounded-full bg-[#d0d0d0] rounded-tl-none" style={{ transform: 'rotate(45deg)' }} />
          <div className="absolute inset-0 rounded-full bg-white scale-[0.6]" />
        </div>
        <span className="text-[#003d8f] font-bold text-[32px] tracking-tighter">scanntech</span>
      </div>
    ),
  }
];

function AdminPBMs() {
  const [activePbm, setActivePbm] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [credentials, setCredentials] = useState<{ [key: string]: boolean }>({});

  const handleConfig = (id: string) => {
    setActivePbm(id);
    setModalOpen(true);
  };

  const handleSaveConfig = () => {
    if (activePbm) {
      setCredentials((prev) => ({ ...prev, [activePbm]: true }));
    }
    setModalOpen(false);
  };

  const selectedPbm = PBM_LIST.find((p) => p.id === activePbm);

  return (
    <div className="max-w-[1200px] w-full mx-auto space-y-8 pb-16 pt-8">
      <div>
        <h2 className="text-[22px] font-bold text-[#1a1a1a]">Programas de Benefício (PBM)</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Configure a integração com os PBMs para ofertar descontos de laboratórios.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PBM_LIST.map((pbm) => {
          const isActive = credentials[pbm.id];

          return (
            <div key={pbm.id} className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 flex items-center justify-center h-[140px] overflow-hidden">
                {pbm.logo ? pbm.logo : (
                  <div className="text-2xl font-black text-slate-300 uppercase tracking-widest">{pbm.name}</div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-slate-800 mb-2">{pbm.name}</h3>
                <p className="text-slate-600 text-sm mb-6 flex-1">{pbm.description}</p>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 font-semibold text-slate-700 hover:text-slate-900 px-3 h-10 -ml-3"
                    onClick={() => handleConfig(pbm.id)}
                  >
                    <Settings className="w-4 h-4" /> Configurar
                  </Button>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    {isActive ? (
                      <span className="flex items-center gap-1.5 text-emerald-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                        Inativo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Configurar {selectedPbm?.name}</DialogTitle>
            <DialogDescription>
              Insira a chave da API e a documentação para vincular o {selectedPbm?.name} corretamente à sua loja.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="font-bold">Chave de Integração (API Key)</Label>
              <Input placeholder="Cole sua chave aqui..." className="font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Documentação / Identificador do Parceiro</Label>
              <Input placeholder="Ex: CNPJ ou Código da loja" />
            </div>
            
            <div className="bg-sky-50 border border-sky-100 p-4 rounded-lg flex gap-3 text-sm text-sky-800">
              <Info className="w-5 h-5 shrink-0 text-sky-600 mt-0.5" />
              <div>
                Você pode nos enviar a documentação para basearmos a integração final. Por agora, você já pode preencher os campos para salvar suas credenciais.
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveConfig} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold">
              Salvar Configuração
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

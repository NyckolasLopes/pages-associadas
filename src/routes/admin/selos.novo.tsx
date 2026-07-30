import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ExternalLink, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/selos/novo")({
  component: AdminSeloNovo,
});

function AdminSeloNovo() {
  return (
    <div className="max-w-[1000px] pb-20 flex items-start gap-8">
      <div className="flex-1 space-y-6">
        <div>
          <Link to="/admin/selos" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-700 mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            ver todos os selos
          </Link>
          <h2 className="text-[22px] font-bold text-[#1a1a1a]">Novo selo</h2>
        </div>

        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-[#fbfbfb]">
            <h3 className="text-lg font-medium text-slate-800">Informações básicas</h3>
          </div>
          
          <div className="p-6 space-y-8">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white bg-[#00AFA9] px-2 py-1 rounded uppercase tracking-wider">ATIVO</span>
              <Switch defaultChecked className="data-[state=checked]:bg-[#00AFA9]" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Nome <span className="text-red-500">*</span></Label>
              <Input className="h-10 border-slate-200" />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Cor do selo <span className="text-red-500">*</span></Label>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-12 bg-[#D0D0D0] rounded-md border border-slate-200 flex items-center justify-center cursor-pointer">
                      <ChevronDown className="h-4 w-4 text-white" />
                    </div>
                    <Input defaultValue="#D0D0D0" className="h-10 border-slate-200 flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Cor do texto <span className="text-red-500">*</span></Label>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-12 bg-[#333333] rounded-md border border-slate-200 flex items-center justify-center cursor-pointer">
                      <ChevronDown className="h-4 w-4 text-white" />
                    </div>
                    <Input defaultValue="#333333" className="h-10 border-slate-200 flex-1" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Visualização</Label>
                <div className="border border-dashed border-slate-200 rounded-md p-4 bg-[#fafafa] flex items-center justify-center h-[140px]">
                  <div className="px-6 py-2 bg-[#D0D0D0] text-[#333333] text-sm font-medium">
                    Nome do selo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-[300px] shrink-0 pt-[88px]">
      </div>

      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 p-4 flex items-center justify-end gap-4 z-10 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] pr-12">
        <Link to="/admin/selos">
          <Button variant="outline" className="h-10 px-8 font-bold text-slate-600 border-slate-200 hover:bg-slate-50">
            Cancelar
          </Button>
        </Link>
        <Button className="h-10 px-8 bg-[#211f26] hover:bg-black text-white font-bold">
          Salvar
        </Button>
      </div>
    </div>
  );
}

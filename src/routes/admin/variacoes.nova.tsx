import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/variacoes/nova")({
  component: AdminVariacaoNova,
});

function AdminVariacaoNova() {
  return (
    <div className="max-w-[1000px] pb-20 flex items-start gap-8">
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-[22px] font-bold text-[#1a1a1a]">Nova variação</h2>
        </div>

        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="space-y-4">
              <Label className="text-lg font-medium text-slate-700">Nome da variação</Label>
              <Input placeholder="Ex: Cores" className="h-12 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400 text-base" />
            </div>
          </div>
        </div>
      </div>

      <div className="w-[300px] shrink-0 pt-16">
      </div>

      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 p-4 flex items-center justify-end gap-4 z-10 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] pr-12">
        <Link to="/admin/variacoes">
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

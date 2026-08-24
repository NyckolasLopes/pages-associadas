import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMarketing } from "@/stores/marketing";
import { useAdmin } from "@/stores/admin";
import { Search, Filter, ChevronDown, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/marketing/cupons/")({
  component: CuponsIndexPage,
});

function CuponsIndexPage() {
  const { cupons, addCoupon, removeCoupon, loadMarketing } = useMarketing();
  const { currentUser, activeStoreId, grupos, lojas } = useAdmin();

  useEffect(() => {
    loadMarketing();
  }, [loadMarketing]);

  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined || Boolean(currentUser?.grupoId && grupos?.find(g => g.id === currentUser?.grupoId)?.permissao_total);
  const effectiveStoreId = !isGlobalAdmin && currentUser?.lojasVinculadas?.length ? currentUser.lojasVinculadas[0] : activeStoreId;
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novoCupom, setNovoCupom] = useState({
    codigo: "",
    descricao: "",
    valorDesconto: 0,
    tipoDesconto: "percentual" as "percentual" | "fixo",
    valorMinimo: 0,
    totalDisponiveis: 100,
    lojaId: "",
  });

  const filteredCupons = cupons.filter((c) => {
    const matchSearch = c.codigo.toLowerCase().includes(search.toLowerCase()) ||
                        c.descricao.toLowerCase().includes(search.toLowerCase());
    if (isGlobalAdmin) return matchSearch;
    return matchSearch && c.lojaId === effectiveStoreId;
  });

  return (
    <div className="max-w-6xl space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">{isGlobalAdmin ? "Cupons das lojas" : "Meus cupons"}</h2>
          <span className="text-sm text-slate-500">{cupons.length} cupom(s)</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-slate-600 font-medium" onClick={() => toast.info("O relatório detalhado de performance de cupons estará disponível em breve.")}>
            Ver performance dos cupons
          </Button>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Cupom</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {isGlobalAdmin && (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Loja Vinculada (Opcional)</label>
                    <Select value={novoCupom.lojaId} onValueChange={(v: any) => setNovoCupom({...novoCupom, lojaId: v})}>
                      <SelectTrigger><SelectValue placeholder="Todas as Lojas (Global)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas as Lojas (Global)</SelectItem>
                        {lojas.map(loja => (
                          <SelectItem key={loja.id} value={loja.id}>{loja.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Código do Cupom</label>
                    <Input 
                      placeholder="EX: 10OFF" 
                      value={novoCupom.codigo} 
                      onChange={e => setNovoCupom({...novoCupom, codigo: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Descrição</label>
                    <Input 
                      placeholder="Descrição breve do cupom" 
                      value={novoCupom.descricao} 
                      onChange={e => setNovoCupom({...novoCupom, descricao: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Tipo</label>
                      <Select value={novoCupom.tipoDesconto} onValueChange={(v: any) => setNovoCupom({...novoCupom, tipoDesconto: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentual">Percentual (%)</SelectItem>
                          <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Valor</label>
                      <Input 
                        type="number" 
                        value={novoCupom.valorDesconto} 
                        onChange={e => setNovoCupom({...novoCupom, valorDesconto: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Valor Mínimo da Compra (R$)</label>
                    <Input 
                      type="number" 
                      value={novoCupom.valorMinimo} 
                      onChange={e => setNovoCupom({...novoCupom, valorMinimo: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
                    if (!novoCupom.codigo) return toast.error("Preencha o código do cupom");
                    addCoupon({
                      codigo: novoCupom.codigo,
                      descricao: novoCupom.descricao,
                      ativo: true,
                      totalDisponiveis: novoCupom.totalDisponiveis,
                      valorMinimo: novoCupom.valorMinimo,
                      dataInicio: "",
                      dataTermino: "",
                      exigirMinItens: false,
                      tipoDesconto: novoCupom.tipoDesconto,
                      valorDesconto: novoCupom.valorDesconto,
                      aplicarFreteGratis: false,
                      aplicacaoAutomatica: false,
                      permiteAcumular: false,
                      usoUnico: false,
                      cupomPrimeiraCompra: false,
                      lojaId: isGlobalAdmin ? (novoCupom.lojaId || undefined) : effectiveStoreId,
                    });
                    toast.success("Cupom criado com sucesso!");
                    setIsModalOpen(false);
                    setNovoCupom({
                      codigo: "", descricao: "", valorDesconto: 0, tipoDesconto: "percentual", valorMinimo: 0, totalDisponiveis: 100, lojaId: ""
                    });
                  }}>
                    Salvar Cupom
                  </Button>
                </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <Button variant="outline" className="flex items-center gap-2 font-bold text-slate-600">
            <Filter className="h-4 w-4" /> Filtrar
          </Button>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9 bg-slate-50 border-slate-200"
              placeholder="buscar cupom"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2 text-slate-600 ml-auto">
            Ações <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 w-10">
                  <Checkbox />
                </th>
                <th className="px-4 py-3">CÓDIGO</th>
                <th className="px-4 py-3">DESCRIÇÃO</th>
                <th className="px-4 py-3">Nº DE UTILIZAÇÃO</th>
                <th className="px-4 py-3 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCupons.length > 0 ? (
                filteredCupons.map((cupom) => (
                  <tr key={cupom.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-4">
                      <Checkbox />
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900">{cupom.codigo}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {cupom.usoUnico ? "Uso único" : "Uso ilimitado"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {cupom.descricao}
                    </td>
                    <td className="px-4 py-4 text-slate-900 font-medium">
                      {cupom.numeroUtilizacoes}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className={`h-2 w-2 rounded-full ${cupom.ativo ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-red-600 cursor-pointer font-medium" onClick={() => removeCoupon(cupom.id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Nenhum cupom encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Select defaultValue="10">
              <SelectTrigger className="w-[70px] h-8 bg-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span>Itens por página</span>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" className="h-8 w-8 p-0" disabled>1</Button>
            <span className="mx-2">...</span>
            <Button variant="outline" className="h-8 w-8 p-0 bg-slate-100 text-slate-400 border-transparent" disabled>1</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

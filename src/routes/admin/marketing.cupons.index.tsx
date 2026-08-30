import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMarketing, Coupon } from "@/stores/marketing";
import { useAdmin } from "@/stores/admin";
import { Search, Filter, ChevronDown, MoreHorizontal, Trash2, Plus, Store, Edit2, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
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
  const { cupons, addCoupon, updateCoupon, removeCoupon, loadMarketing } = useMarketing();
  const { currentUser, activeStoreId, grupos, pharmacies } = useAdmin();

  useEffect(() => {
    loadMarketing();
  }, [loadMarketing]);

  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined || Boolean(currentUser?.grupoId && grupos?.find(g => g.id === currentUser?.grupoId)?.permissao_total);
  const effectiveStoreId = !isGlobalAdmin && currentUser?.lojasVinculadas?.length ? currentUser.lojasVinculadas[0] : activeStoreId;
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCupom, setEditingCupom] = useState<Coupon | null>(null);
  
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
    return matchSearch && (!c.lojaId || c.lojaId === effectiveStoreId);
  });

  return (
    <div className="max-w-6xl space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">{isGlobalAdmin ? "Cupons das lojas" : "Meus cupons"}</h2>
          <span className="text-sm text-slate-500">{filteredCupons.length} cupom(s)</span>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[460px]">
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
                        {pharmacies.map(loja => (
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
                    <label className="text-sm font-medium">Valor {novoCupom.tipoDesconto === "percentual" ? "(%)" : "(R$)"}</label>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={novoCupom.valorDesconto || ""} 
                      onChange={e => setNovoCupom({...novoCupom, valorDesconto: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Valor Mínimo (R$)</label>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={novoCupom.valorMinimo || ""} 
                      onChange={e => setNovoCupom({...novoCupom, valorMinimo: Number(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Limite de Usos (0 = ilimitado)</label>
                    <Input 
                      type="number" 
                      min="0"
                      placeholder="Ex: 100"
                      value={novoCupom.totalDisponiveis || ""} 
                      onChange={e => setNovoCupom({...novoCupom, totalDisponiveis: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={async () => {
                  if (!novoCupom.codigo.trim()) return toast.error("Preencha o código do cupom");
                  await addCoupon({
                    codigo: novoCupom.codigo.trim().toUpperCase(),
                    descricao: novoCupom.descricao,
                    ativo: true,
                    totalDisponiveis: Number(novoCupom.totalDisponiveis) || 0,
                    valorMinimo: Number(novoCupom.valorMinimo) || 0,
                    dataInicio: "",
                    dataTermino: "",
                    exigirMinItens: false,
                    tipoDesconto: novoCupom.tipoDesconto,
                    valorDesconto: Number(novoCupom.valorDesconto) || 0,
                    aplicarFreteGratis: false,
                    aplicacaoAutomatica: false,
                    permiteAcumular: false,
                    usoUnico: false,
                    cupomPrimeiraCompra: false,
                    lojaId: isGlobalAdmin ? (novoCupom.lojaId || undefined) : (effectiveStoreId || undefined),
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

      {/* MODAL DE EDIÇÃO DE CUPOM */}
      <Dialog open={!!editingCupom} onOpenChange={(open) => !open && setEditingCupom(null)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Editar Cupom {editingCupom?.codigo}</DialogTitle>
          </DialogHeader>
          {editingCupom && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Código do Cupom</label>
                <Input 
                  value={editingCupom.codigo} 
                  onChange={e => setEditingCupom({...editingCupom, codigo: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Descrição</label>
                <Input 
                  value={editingCupom.descricao} 
                  onChange={e => setEditingCupom({...editingCupom, descricao: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={editingCupom.tipoDesconto} onValueChange={(v: any) => setEditingCupom({...editingCupom, tipoDesconto: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">Percentual (%)</SelectItem>
                      <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Valor Desconto</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={editingCupom.valorDesconto || ""} 
                    onChange={e => setEditingCupom({...editingCupom, valorDesconto: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Valor Mínimo (R$)</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={editingCupom.valorMinimo || ""} 
                    onChange={e => setEditingCupom({...editingCupom, valorMinimo: Number(e.target.value)})}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Limite de Usos (0 = ilimitado)</label>
                  <Input 
                    type="number" 
                    min="0"
                    value={editingCupom.totalDisponiveis || ""} 
                    onChange={e => setEditingCupom({...editingCupom, totalDisponiveis: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Nº de Utilizações Atual</label>
                <Input 
                  type="number" 
                  min="0"
                  value={editingCupom.numeroUtilizacoes ?? 0} 
                  onChange={e => setEditingCupom({...editingCupom, numeroUtilizacoes: Number(e.target.value)})}
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setEditingCupom(null)}>Cancelar</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={async () => {
                  await updateCoupon(editingCupom.id, editingCupom);
                  toast.success("Cupom atualizado com sucesso!");
                  setEditingCupom(null);
                }}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9 bg-slate-50 border-slate-200"
              placeholder="Buscar por código ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
                <th className="px-4 py-3">DESCONTO</th>
                <th className="px-4 py-3">Nº DE UTILIZAÇÃO</th>
                <th className="px-4 py-3 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCupons.length > 0 ? (
                filteredCupons.map((cupom) => {
                  const usos = Number(cupom.numeroUtilizacoes) || 0;
                  const limite = Number(cupom.totalDisponiveis) || 0;
                  const esgotado = limite > 0 && usos >= limite;

                  return (
                    <tr key={cupom.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-4">
                        <Checkbox />
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900 tracking-wide font-mono text-base">{cupom.codigo}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {cupom.usoUnico ? "Uso único por cliente" : "Uso múltiplo"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {cupom.descricao}
                        {isGlobalAdmin && cupom.lojaId && (
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Store className="h-3 w-3" />
                            {pharmacies.find(p => p.id === cupom.lojaId)?.nome || cupom.lojaId}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-800">
                        {cupom.tipoDesconto === "percentual" ? `${cupom.valorDesconto}% OFF` : `R$ ${cupom.valorDesconto?.toFixed(2)} OFF`}
                        {cupom.valorMinimo > 0 && (
                          <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                            Min: R$ {cupom.valorMinimo.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900 text-base">{usos}</span>
                          {limite > 0 && (
                            <span className="text-xs text-slate-400 font-medium">/ {limite}</span>
                          )}
                        </div>
                        {esgotado && (
                          <span className="inline-block mt-1 text-[10px] uppercase font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                            Esgotado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className={`h-2.5 w-2.5 rounded-full ${cupom.ativo && !esgotado ? "bg-emerald-500" : "bg-slate-300"}`} title={cupom.ativo ? "Ativo" : "Inativo"} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="cursor-pointer font-medium" onClick={() => setEditingCupom(cupom)}>
                                <Edit2 className="h-4 w-4 mr-2" /> Editar Cupom
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer font-medium" onClick={async () => {
                                await updateCoupon(cupom.id, { ativo: !cupom.ativo });
                                toast.success(cupom.ativo ? "Cupom desativado" : "Cupom ativado");
                              }}>
                                {cupom.ativo ? (
                                  <><XCircle className="h-4 w-4 mr-2 text-amber-600" /> Desativar</>
                                ) : (
                                  <><CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" /> Ativar</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer font-medium" onClick={async () => {
                                await updateCoupon(cupom.id, { numeroUtilizacoes: 0 });
                                toast.success("Contador de utilizações zerado!");
                              }}>
                                <RotateCcw className="h-4 w-4 mr-2 text-blue-600" /> Zerar Utilizações
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 cursor-pointer font-medium" onClick={() => {
                                removeCoupon(cupom.id);
                                toast.success("Cupom excluído");
                              }}>
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Nenhum cupom encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

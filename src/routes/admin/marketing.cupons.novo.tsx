import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMarketing, Coupon } from "@/stores/marketing";
import { useAdmin } from "@/stores/admin";
import { useAdminCategories } from "@/stores/categories";
import { useAdminProducts } from "@/stores/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info, AlertTriangle, ChevronRight, Ticket, Percent, DollarSign, Truck, FileText, Store, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/marketing/cupons/novo")({
  component: NovoCupomPage,
});

function NovoCupomPage() {
  const navigate = useNavigate();
  const { addCoupon } = useMarketing();
  const { categories } = useAdminCategories();
  const { customProducts } = useAdminProducts();
  const { currentUser, activeStoreId, grupos, pharmacies } = useAdmin();
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined || Boolean(currentUser?.grupoId && grupos?.find(g => g.id === currentUser?.grupoId)?.permissao_total);
  const effectiveStoreId = !isGlobalAdmin && currentUser?.lojasVinculadas?.length ? currentUser.lojasVinculadas[0] : activeStoreId;

  const [selectedStoreId, setSelectedStoreId] = useState<string>(effectiveStoreId || "");
  const [tipoAlvo, setTipoAlvo] = useState<"todos" | "produtos" | "categorias">("todos");
  const [alvosId, setAlvosId] = useState<string[]>([]);
  const [searchTarget, setSearchTarget] = useState("");
  
  const [formData, setFormData] = useState<Omit<Coupon, "id" | "numeroUtilizacoes">>({
    codigo: "",
    descricao: "",
    ativo: true,
    totalDisponiveis: 0,
    valorMinimo: 0,
    dataInicio: "",
    dataTermino: "",
    exigirMinItens: false,
    tipoDesconto: "percentual",
    valorDesconto: 0,
    aplicarFreteGratis: false,
    aplicacaoAutomatica: false,
    permiteAcumular: false,
    usoUnico: false,
    cupomPrimeiraCompra: false,
    tipoAlvo: "todos",
    alvosId: []
  });

  const filteredCategories = useMemo(() => {
    if (!searchTarget) return categories;
    const q = searchTarget.toLowerCase();
    return categories.filter(c => c.nome.toLowerCase().includes(q));
  }, [categories, searchTarget]);

  const filteredProducts = useMemo(() => {
    if (!searchTarget) return (customProducts || []).slice(0, 40);
    const q = searchTarget.toLowerCase();
    return (customProducts || []).filter((p: any) => p.nome.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))).slice(0, 40);
  }, [customProducts, searchTarget]);

  const handleToggleAlvo = (id: string) => {
    setAlvosId(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: Number(e.target.value) || 0 }));
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData((prev) => ({ ...prev, codigo: code }));
  };

  const handleSave = async () => {
    if (!formData.codigo.trim()) {
      toast.error("Preencha o código do cupom!");
      return;
    }

    const targetLojaId = isGlobalAdmin ? selectedStoreId : effectiveStoreId;
    if (!targetLojaId) {
      toast.error("Selecione a farmácia vinculada a este cupom!");
      return;
    }

    if (tipoAlvo !== "todos" && alvosId.length === 0) {
      toast.error(`Selecione ao menos um(a) ${tipoAlvo === "categorias" ? "categoria" : "produto"} para este cupom.`);
      return;
    }
    
    const payload = {
      ...formData,
      codigo: formData.codigo.trim().toUpperCase(),
      lojaId: targetLojaId,
      tipoAlvo,
      alvosId: tipoAlvo === "todos" ? [] : alvosId
    };
    
    await addCoupon(payload);
    toast.success("Cupom criado com sucesso para a farmácia!");
    navigate({ to: "/admin/marketing/cupons" });
  };

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Novo cupom</h2>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate({ to: "/admin/marketing/cupons" })}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground">
            Salvar Cupom
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* INFORMAÇÕES BÁSICAS */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">Informações básicas</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Switch 
                checked={formData.ativo}
                onCheckedChange={(c) => setFormData(prev => ({ ...prev, ativo: c }))}
                className="data-[state=checked]:bg-emerald-500"
              />
              <Label className="font-bold text-emerald-600">ATIVO</Label>
            </div>

            {isGlobalAdmin && (
              <div className="space-y-2">
                <Label className="font-bold">Loja Vinculada <span className="text-red-500">*</span></Label>
                <div className="max-w-sm">
                  <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                    <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Selecione a Farmácia" /></SelectTrigger>
                    <SelectContent>
                      {pharmacies.map(loja => (
                        <SelectItem key={loja.id} value={loja.id}>{loja.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="font-bold">Código <span className="text-red-500">*</span></Label>
              <div className="flex w-full max-w-sm">
                <Input 
                  name="codigo" 
                  value={formData.codigo} 
                  onChange={handleChange} 
                  className="rounded-r-none font-mono uppercase" 
                />
                <Button variant="outline" onClick={generateCode} className="rounded-l-none bg-slate-50 font-bold text-slate-600">
                  GERAR
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Descrição</Label>
              <Input 
                name="descricao" 
                value={formData.descricao} 
                onChange={handleChange} 
                placeholder="Ex: Cupom de primeira compra" 
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Total de cupons disponíveis <span className="text-red-500">*</span></Label>
              <Input 
                name="totalDisponiveis" 
                type="number" 
                value={formData.totalDisponiveis || ""} 
                onChange={handleNumberChange} 
                className="w-32"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Valor mínimo da compra</Label>
              <div className="flex items-center max-w-xs">
                <span className="flex items-center justify-center bg-slate-50 border border-slate-200 border-r-0 px-4 h-10 rounded-l-md font-bold text-slate-500 text-sm">
                  R$
                </span>
                <Input 
                  name="valorMinimo" 
                  type="number" 
                  value={formData.valorMinimo || ""} 
                  onChange={handleNumberChange} 
                  className="rounded-l-none"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <Label className="font-bold">Data de início <span className="text-red-500">*</span></Label>
                <Input 
                  name="dataInicio" 
                  type="date" 
                  value={formData.dataInicio} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Data de término <span className="text-red-500">*</span></Label>
                <Input 
                  name="dataTermino" 
                  type="date" 
                  value={formData.dataTermino} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 pt-6">
              <Label className="font-bold">Exigir quantidade mínima de itens</Label>
              <div className="flex items-center gap-3 mt-2">
                <Switch 
                  checked={formData.exigirMinItens}
                  onCheckedChange={(c) => setFormData(prev => ({ ...prev, exigirMinItens: c }))}
                  className="data-[state=unchecked]:bg-red-500"
                />
                <Label className="font-bold text-red-600 uppercase">NÃO</Label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">A quantidade considerada será de todos os itens do carrinho.</p>
            </div>
          </div>
        </div>

        {/* DESCONTO */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <Ticket className="h-5 w-5 text-slate-500" />
            <h3 className="text-lg font-bold text-slate-800">Desconto</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4">
              <Input 
                name="valorDesconto" 
                type="number" 
                value={formData.valorDesconto || ""} 
                onChange={handleNumberChange} 
                className="w-32"
              />
              <div className="flex border border-slate-200 rounded-md overflow-hidden">
                <button 
                  className={`flex items-center gap-1.5 px-4 h-10 text-sm font-bold transition-colors ${formData.tipoDesconto === "percentual" ? "bg-slate-100 text-slate-900 shadow-inner" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                  onClick={() => setFormData(prev => ({ ...prev, tipoDesconto: "percentual" }))}
                >
                  <div className={`h-3 w-3 rounded-full border border-slate-400 flex items-center justify-center ${formData.tipoDesconto === "percentual" ? "border-slate-800" : ""}`}>
                    {formData.tipoDesconto === "percentual" && <div className="h-1.5 w-1.5 rounded-full bg-slate-800" />}
                  </div>
                  %
                </button>
                <div className="w-px bg-slate-200" />
                <button 
                  className={`flex items-center gap-1.5 px-4 h-10 text-sm font-bold transition-colors ${formData.tipoDesconto === "fixo" ? "bg-slate-100 text-slate-900 shadow-inner" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                  onClick={() => setFormData(prev => ({ ...prev, tipoDesconto: "fixo" }))}
                >
                  <div className={`h-3 w-3 rounded-full border border-slate-400 flex items-center justify-center ${formData.tipoDesconto === "fixo" ? "border-slate-800" : ""}`}>
                    {formData.tipoDesconto === "fixo" && <div className="h-1.5 w-1.5 rounded-full bg-slate-800" />}
                  </div>
                  R$
                </button>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 mt-3">Desconto aplicado apenas no valor dos produtos.</p>
            <p className="text-xs text-slate-500">Não consideramos o valor do frete.</p>
          </div>
        </div>

        {/* FRETE GRÁTIS */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <Truck className="h-5 w-5 text-slate-500" />
            <h3 className="text-lg font-bold text-slate-800">Frete grátis</h3>
          </div>
          <div className="p-6">
            <Label className="font-bold mb-3 block text-slate-700">Aplicar frete grátis</Label>
            <div className="flex items-center gap-3">
              <Switch 
                checked={formData.aplicarFreteGratis}
                onCheckedChange={(c) => setFormData(prev => ({ ...prev, aplicarFreteGratis: c }))}
                className="data-[state=unchecked]:bg-red-500 data-[state=checked]:bg-emerald-500"
              />
              <Label className={`font-bold uppercase ${formData.aplicarFreteGratis ? 'text-emerald-600' : 'text-red-600'}`}>
                {formData.aplicarFreteGratis ? 'SIM' : 'NÃO'}
              </Label>
            </div>
          </div>
        </div>

        {/* APLICAR EM (PRODUTOS / CATEGORIAS / TODOS) */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">Alvo do Cupom</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Onde este cupom será aplicado:</Label>
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-lg text-sm">
                <button
                  type="button"
                  onClick={() => { setTipoAlvo("todos"); setAlvosId([]); }}
                  className={`py-2 rounded-md font-bold transition-colors ${tipoAlvo === "todos" ? "bg-white text-primary shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Todos os produtos
                </button>
                <button
                  type="button"
                  onClick={() => { setTipoAlvo("categorias"); setAlvosId([]); }}
                  className={`py-2 rounded-md font-bold transition-colors ${tipoAlvo === "categorias" ? "bg-white text-primary shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Categorias específicas
                </button>
                <button
                  type="button"
                  onClick={() => { setTipoAlvo("produtos"); setAlvosId([]); }}
                  className={`py-2 rounded-md font-bold transition-colors ${tipoAlvo === "produtos" ? "bg-white text-primary shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Produtos específicos
                </button>
              </div>
            </div>

            {tipoAlvo !== "todos" && (
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={searchTarget}
                    onChange={(e) => setSearchTarget(e.target.value)}
                    placeholder={`Buscar ${tipoAlvo === "categorias" ? "categoria por nome..." : "produto por nome ou SKU..."}`}
                    className="pl-9 h-9 text-sm bg-white"
                  />
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {tipoAlvo === "categorias" ? (
                    filteredCategories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-2.5 p-2 rounded hover:bg-white text-sm cursor-pointer border border-transparent hover:border-slate-200">
                        <Checkbox
                          checked={alvosId.includes(cat.id)}
                          onCheckedChange={() => handleToggleAlvo(cat.id)}
                        />
                        <span className="font-medium text-slate-700 truncate">{cat.nome}</span>
                      </label>
                    ))
                  ) : (
                    filteredProducts.map((prod: any) => (
                      <label key={prod.id} className="flex items-center gap-2.5 p-2 rounded hover:bg-white text-sm cursor-pointer border border-transparent hover:border-slate-200">
                        <Checkbox
                          checked={alvosId.includes(prod.id)}
                          onCheckedChange={() => handleToggleAlvo(prod.id)}
                        />
                        <span className="font-medium text-slate-700 truncate">{prod.nome}</span>
                      </label>
                    ))
                  )}
                </div>
                <div className="text-xs font-bold text-primary text-right">
                  {alvosId.length} selecionado(s)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* REGRAS */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-16">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">Regras</h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-12 border-b border-slate-100 pb-2 mb-4 bg-slate-50/50 p-2 rounded text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <div className="col-span-2 text-center">ACEITAR</div>
              <div className="col-span-10">REGRA</div>
            </div>

            <div className="space-y-6">
              {/* Regra 1 */}
              <div>
                <div className="grid grid-cols-12 items-start">
                  <div className="col-span-2 flex justify-center pt-1">
                    <Checkbox 
                      checked={formData.aplicacaoAutomatica}
                      onCheckedChange={(c) => setFormData(prev => ({ ...prev, aplicacaoAutomatica: c === true }))}
                    />
                  </div>
                  <div className="col-span-10">
                    <Label className="font-bold text-slate-800 text-base block cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, aplicacaoAutomatica: !prev.aplicacaoAutomatica }))}>
                      Aplicação automática no carrinho de compra
                    </Label>
                    <p className="text-xs text-slate-400 mt-1">Não depende do cliente digitar o código.</p>
                  </div>
                </div>
                {formData.aplicacaoAutomatica && (
                  <div className="mt-3 ml-[16.666%] bg-sky-50 p-4 rounded border border-sky-100 flex gap-3">
                    <Info className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-sky-800 mb-1">A regra se aplica apenas a 1 cupom.</p>
                      <p className="text-sm text-sky-700">Se quiser habilitar a mesma regra de aplicação automática a um novo cupom será necessário escolher qual deles ficará com ela ativa.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Regra 2 */}
              <div className="grid grid-cols-12 items-center border-t border-slate-100 pt-6">
                <div className="col-span-2 flex justify-center">
                  <Checkbox 
                    checked={formData.permiteAcumular}
                    onCheckedChange={(c) => setFormData(prev => ({ ...prev, permiteAcumular: c === true }))}
                  />
                </div>
                <div className="col-span-10">
                  <Label className="font-bold text-slate-700 block cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, permiteAcumular: !prev.permiteAcumular }))}>
                    Permite acumular com outras promoções ativas
                  </Label>
                </div>
              </div>

              {/* Regra 3 */}
              <div className="grid grid-cols-12 items-center border-t border-slate-100 pt-6">
                <div className="col-span-2 flex justify-center">
                  <Checkbox 
                    checked={formData.usoUnico}
                    onCheckedChange={(c) => setFormData(prev => ({ ...prev, usoUnico: c === true }))}
                  />
                </div>
                <div className="col-span-10">
                  <Label className="font-bold text-slate-700 block cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, usoUnico: !prev.usoUnico }))}>
                    Uso único (1 vez) por cliente
                  </Label>
                </div>
              </div>

              {/* Regra 4 */}
              <div className="border-t border-slate-100 pt-6">
                <div className="grid grid-cols-12 items-start">
                  <div className="col-span-2 flex justify-center pt-1">
                    <Checkbox 
                      checked={formData.cupomPrimeiraCompra}
                      onCheckedChange={(c) => setFormData(prev => ({ ...prev, cupomPrimeiraCompra: c === true }))}
                    />
                  </div>
                  <div className="col-span-10">
                    <Label className="font-bold text-slate-700 block cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, cupomPrimeiraCompra: !prev.cupomPrimeiraCompra }))}>
                      Cupom de 1ª compra
                    </Label>
                    {formData.cupomPrimeiraCompra && (
                      <div className="mt-2 bg-amber-50 p-3 rounded border border-amber-200 flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                        <p className="text-sm text-amber-800">
                          O cupom será <strong>aplicado automaticamente</strong> para todo novo cliente que acessar o checkout.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

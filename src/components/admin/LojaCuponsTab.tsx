import { useState, useMemo } from "react";
import { useAdmin } from "@/stores/admin";
import { useAdminCategories } from "@/stores/categories";
import { useAdminProducts } from "@/stores/products";
import { useMarketing, type Coupon } from "@/stores/marketing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Tag, Plus, Trash2, Calendar, DollarSign, Percent, CheckCircle2, XCircle, Search, Layers, Package, Check } from "lucide-react";
import { sanitizeCouponCode, sanitizeText, validatePrice } from "@/lib/security";
import { checkRateLimitOrThrow, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";
import { brl } from "@/lib/format";

export function LojaCuponsTab({ lojaId }: { lojaId: string }) {
  const { pharmacies } = useAdmin();
  const { categories } = useAdminCategories();
  const { customProducts } = useAdminProducts();
  const { cupons, addCoupon, removeCoupon, updateCoupon } = useMarketing();
  const pharmacy = pharmacies.find((p) => p.id === lojaId);

  // Filtra cupons da loja atual ou universais
  const lojaCoupons = cupons.filter((c: any) => c.lojaId === lojaId || c.farmaciaId === lojaId);

  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState<"percent" | "fixed">("percent");
  const [valor, setValor] = useState<string>("");
  const [valorMinimo, setValorMinimo] = useState<string>("");
  const [validade, setValidade] = useState<string>("");
  const [limiteUsos, setLimiteUsos] = useState<string>("");

  const [tipoAlvo, setTipoAlvo] = useState<"todos" | "categorias" | "produtos">("todos");
  const [alvosId, setAlvosId] = useState<string[]>([]);
  const [searchTarget, setSearchTarget] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchTarget) return categories;
    const q = searchTarget.toLowerCase();
    return categories.filter(c => c.nome.toLowerCase().includes(q));
  }, [categories, searchTarget]);

  const filteredProducts = useMemo(() => {
    if (!searchTarget) return (customProducts || []).slice(0, 30);
    const q = searchTarget.toLowerCase();
    return (customProducts || []).filter((p: any) => p.nome.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))).slice(0, 30);
  }, [customProducts, searchTarget]);

  const handleToggleAlvo = (id: string) => {
    setAlvosId(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      checkRateLimitOrThrow(`coupon_add_${lojaId}`, RATE_LIMIT_PRESETS.COUPON_APPLY);

      const cleanCode = sanitizeCouponCode(codigo);
      if (!cleanCode || cleanCode.length < 3) {
        toast.error("O código do cupom deve ter pelo menos 3 caracteres alfanuméricos.");
        return;
      }

      const numValor = parseFloat(valor.replace(",", "."));
      if (isNaN(numValor) || numValor <= 0) {
        toast.error("Informe um valor de desconto válido.");
        return;
      }
      if (tipo === "percent" && numValor > 90) {
        toast.error("O desconto percentual máximo permitido é de 90%.");
        return;
      }

      if (tipoAlvo !== "todos" && alvosId.length === 0) {
        toast.error(`Selecione ao menos um(a) ${tipoAlvo === "categorias" ? "categoria" : "produto"} para aplicar o cupom.`);
        return;
      }

      const numMinimo = valorMinimo ? parseFloat(valorMinimo.replace(",", ".")) : 0;
      const numUsos = limiteUsos ? parseInt(limiteUsos, 10) : undefined;

      const newCoupon = {
        codigo: cleanCode,
        descricao: `Cupom ${cleanCode}`,
        ativo: true,
        totalDisponiveis: numUsos || 999,
        valorMinimo: numMinimo || 0,
        dataInicio: "",
        dataTermino: validade || "",
        exigirMinItens: false,
        tipoDesconto: (tipo === "percent" ? "percentual" : "fixo") as "percentual" | "fixo",
        valorDesconto: numValor,
        aplicarFreteGratis: false,
        aplicacaoAutomatica: false,
        permiteAcumular: false,
        usoUnico: false,
        cupomPrimeiraCompra: false,
        lojaId: lojaId,
        tipoAlvo: tipoAlvo,
        alvosId: tipoAlvo === "todos" ? [] : alvosId,
      };

      addCoupon(newCoupon as any);
      toast.success(`Cupom "${cleanCode}" cadastrado com sucesso para sua unidade!`);

      setCodigo("");
      setValor("");
      setValorMinimo("");
      setValidade("");
      setLimiteUsos("");
      setTipoAlvo("todos");
      setAlvosId([]);
      setSearchTarget("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar cupom.");
    }
  };

  const handleToggleCoupon = (coupon: any) => {
    updateCoupon(coupon.id, { ativo: !coupon.ativo });
    toast.success(`Cupom ${!coupon.ativo ? "ativado" : "pausado"}!`);
  };

  const handleDeleteCoupon = (id: string) => {
    removeCoupon(id);
    toast.success("Cupom excluído com sucesso.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Cupons de Desconto da Loja</h2>
            <p className="text-sm text-slate-500">
              Crie cupons promocionais exclusivos para fidelizar clientes de {pharmacy?.cidade || "sua região"}.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Novo Cupom */}
        <Card className="border-slate-200 shadow-sm lg:col-span-1">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg font-bold">Criar Novo Cupom</CardTitle>
            <CardDescription>Defina as regras e produtos/categorias</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleAddCoupon} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Código do Cupom</Label>
                <Input
                  value={codigo}
                  onChange={(e) => setCodigo(sanitizeCouponCode(e.target.value))}
                  placeholder="Ex: PROMO10, BEMVINDO"
                  className="uppercase font-mono font-bold tracking-wider text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Tipo</Label>
                  <select
                    value={tipo}
                    onChange={(e: any) => setTipo(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
                  >
                    <option value="percent">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Valor do Desconto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder={tipo === "percent" ? "Ex: 10 (%)" : "Ex: 15.00"}
                    className="text-sm"
                    required
                  />
                </div>
              </div>

              {/* Onde aplicar o desconto */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-bold">Aplicar desconto em:</Label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => { setTipoAlvo("todos"); setAlvosId([]); }}
                    className={`py-1.5 rounded-md font-bold transition-colors ${tipoAlvo === "todos" ? "bg-white text-primary shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTipoAlvo("categorias"); setAlvosId([]); }}
                    className={`py-1.5 rounded-md font-bold transition-colors ${tipoAlvo === "categorias" ? "bg-white text-primary shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Categorias
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTipoAlvo("produtos"); setAlvosId([]); }}
                    className={`py-1.5 rounded-md font-bold transition-colors ${tipoAlvo === "produtos" ? "bg-white text-primary shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Produtos
                  </button>
                </div>

                {tipoAlvo !== "todos" && (
                  <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 space-y-2 mt-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        value={searchTarget}
                        onChange={(e) => setSearchTarget(e.target.value)}
                        placeholder={`Buscar ${tipoAlvo === "categorias" ? "categoria..." : "produto..."}`}
                        className="pl-8 h-8 text-xs bg-white"
                      />
                    </div>
                    
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {tipoAlvo === "categorias" ? (
                        filteredCategories.map(cat => (
                          <label key={cat.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-white text-xs cursor-pointer border border-transparent hover:border-slate-200">
                            <Checkbox
                              checked={alvosId.includes(cat.id)}
                              onCheckedChange={() => handleToggleAlvo(cat.id)}
                            />
                            <span className="font-medium text-slate-700 truncate">{cat.nome}</span>
                          </label>
                        ))
                      ) : (
                        filteredProducts.map((prod: any) => (
                          <label key={prod.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-white text-xs cursor-pointer border border-transparent hover:border-slate-200">
                            <Checkbox
                              checked={alvosId.includes(prod.id)}
                              onCheckedChange={() => handleToggleAlvo(prod.id)}
                            />
                            <span className="font-medium text-slate-700 truncate">{prod.nome}</span>
                          </label>
                        ))
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-primary text-right">
                      {alvosId.length} selecionado(s)
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Pedido Mínimo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valorMinimo}
                    onChange={(e) => setValorMinimo(e.target.value)}
                    placeholder="Ex: 50.00"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Limite de Usos</Label>
                  <Input
                    type="number"
                    value={limiteUsos}
                    onChange={(e) => setLimiteUsos(e.target.value)}
                    placeholder="Ex: 100"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Data de Validade (Opcional)</Label>
                <Input
                  type="date"
                  value={validade}
                  onChange={(e) => setValidade(e.target.value)}
                  className="text-sm"
                />
              </div>

              <Button type="submit" className="w-full font-bold gap-2 mt-3 bg-primary text-white">
                <Plus className="w-4 h-4" />
                Criar Cupom
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Cupons Cadastrados */}
        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg font-bold">Cupons Ativos</CardTitle>
            <CardDescription>{lojaCoupons.length} cupom(ns) cadastrado(s)</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {lojaCoupons.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Tag className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm font-bold">Nenhum cupom cadastrado para esta loja.</p>
                <p className="text-xs text-slate-400">Crie cupons no formulário ao lado para compartilhar com seus clientes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lojaCoupons.map((c: any) => {
                  const targetLabel = !c.tipoAlvo || c.tipoAlvo === "todos"
                    ? "Todos os produtos"
                    : (c.tipoAlvo === "categorias"
                      ? `${(c.alvosId || []).length} categoria(s)`
                      : `${(c.alvosId || []).length} produto(s)`);

                  return (
                    <div key={c.id} className="border rounded-2xl p-4 bg-white shadow-sm flex flex-col justify-between space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-base text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                              {c.codigo || c.code}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.ativo ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                            }`}>
                              {c.ativo ? "Ativo" : "Pausado"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium">
                            Desconto: <strong>{c.tipoDesconto === "percentual" || c.tipo === "percent" || c.descontoPercentual ? `${c.valorDesconto || c.valor || c.descontoPercentual}%` : brl(c.valorDesconto || c.valor || c.descontoFixo || 0)}</strong>
                            {c.valorMinimo ? ` (Mín. ${brl(c.valorMinimo)})` : ""}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Alvo: <span className="font-bold text-slate-700">{targetLabel}</span>
                          </p>
                          {c.validade && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Válido até {c.validade}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleCoupon(c)}
                          className="text-xs font-bold h-8"
                        >
                          {c.ativo ? "Pausar" : "Ativar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCoupon(c.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-bold h-8"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Megaphone, Save, Tag, Percent, DollarSign } from "lucide-react";
import { useAdminCategories } from "@/stores/categories";

export const Route = createFileRoute("/admin/marketing/order-bumps")({
  component: OrderBumpsAdmin,
});

function OrderBumpsAdmin() {
  const { orderBumpSettings, setOrderBumpSettings } = useAdmin();
  const { categories } = useAdminCategories();
  
  const [active, setActive] = useState(true);
  const [categoryId, setCategoryId] = useState("145");
  const [maxPrice, setMaxPrice] = useState(20);
  const [discountPercentage, setDiscountPercentage] = useState(1);

  useEffect(() => {
    if (orderBumpSettings) {
      setActive(orderBumpSettings.active);
      setCategoryId(orderBumpSettings.categoryId);
      setMaxPrice(orderBumpSettings.maxPrice);
      setDiscountPercentage(orderBumpSettings.discountPercentage);
    }
  }, [orderBumpSettings]);

  const handleSave = () => {
    setOrderBumpSettings({
      active,
      categoryId,
      maxPrice,
      discountPercentage
    });
    toast.success("Configurações de Order Bump salvas com sucesso!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          Configurações de Order Bump
        </h1>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" /> Salvar Alterações
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-8">
        <div className="flex items-center justify-between pb-6 border-b">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Ativar Order Bumps</h2>
            <p className="text-sm text-slate-500">
              Exibir recomendações de produtos com desconto na tela de checkout para aumentar o ticket médio.
            </p>
          </div>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>

        {active && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-slate-400" />
                  Categoria dos Produtos
                </Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                  <option value="145">Dermocosméticos e Beleza</option>
                  <option value="142">Medicamentos</option>
                  <option value="148">Conveniência</option>
                </select>
                <p className="text-xs text-slate-500">
                  Apenas produtos desta categoria serão mostrados.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  Preço Máximo (R$)
                </Label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                />
                <p className="text-xs text-slate-500">
                  Mostrar apenas produtos que custem até este valor.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-slate-400" />
                  Desconto (%)
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                />
                <p className="text-xs text-slate-500">
                  Desconto aplicado exclusivamente na compra pelo Order Bump. Exibido em valor monetário ao cliente.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border flex flex-col justify-center">
              <h3 className="font-bold text-slate-800 mb-4 text-center">Pré-visualização do Benefício</h3>
              <div className="bg-white p-4 rounded-lg border shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center border">
                    <Tag className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="font-bold line-clamp-1">Produto de Exemplo ({discountPercentage}% OFF)</div>
                    <div className="flex items-end gap-2 mt-1">
                      <span className="font-bold text-primary">R$ {(maxPrice * (1 - discountPercentage / 100)).toFixed(2).replace('.', ',')}</span>
                      <span className="text-xs text-slate-400 line-through">R$ {maxPrice.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded w-fit border border-emerald-100">
                  Você economiza R$ {(maxPrice * (discountPercentage / 100)).toFixed(2).replace('.', ',')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Flame, Gift, Star, Zap, ShoppingBag, Search } from "lucide-react";
import { useMarketing, Promocao } from "@/stores/marketing";
import { toast } from "sonner";
import categoriesData from "@/data/categories.json";
import productsData from "@/data/products.json";

export const Route = createFileRoute("/admin/marketing/promocoes/nova")({
  component: NovaPromocaoPage,
});

const getSafeCategories = () => Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.default || [];
const getSafeProducts = () => Array.isArray(productsData) ? productsData : (productsData as any)?.default || [];

const ICONS = [
  { id: "flame", icon: Flame, label: "Fogo" },
  { id: "gift", icon: Gift, label: "Presente" },
  { id: "star", icon: Star, label: "Estrela" },
  { id: "zap", icon: Zap, label: "Relâmpago" },
  { id: "shopping-bag", icon: ShoppingBag, label: "Sacola" },
];

function NovaPromocaoPage() {
  const navigate = useNavigate();
  const search: any = useSearch({ from: "/admin/marketing/promocoes/nova" });
  const { addPromocao, updatePromocao, promocoes } = useMarketing();
  
  const editingId = search?.id;
  const existing = promocoes.find((p) => p.id === editingId);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<Omit<Promocao, "id">>({
    titulo: "",
    tipoAlvo: "categoria",
    alvosId: [],
    dataFim: "",
    horaFim: "23:59",
    icone: "flame",
    ativa: true,
    tipoCampanha: "padrao",
    levePague_quantidade: 2,
    levePague_precoPorItem: 0,
    corSelo: "#ea580c",
    corIcone: "#ea580c",
    corTextoBotao: "#ffffff",
    corBotao: "#ea580c",
  });

  const categorias = getSafeCategories().filter((c: any) => !c.parentId);
  const produtos = getSafeProducts();
  const filteredProdutos = produtos.filter((p: any) => 
    p.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (existing) {
      setFormData({
        titulo: existing.titulo,
        tipoAlvo: existing.tipoAlvo,
        alvosId: existing.alvosId,
        dataFim: existing.dataFim,
        horaFim: existing.horaFim,
        icone: existing.icone,
        ativa: existing.ativa,
        tipoCampanha: existing.tipoCampanha || "padrao",
        levePague_quantidade: existing.levePague_quantidade || 2,
        levePague_precoPorItem: existing.levePague_precoPorItem || 0,
        corSelo: existing.corSelo || "#ea580c",
        corIcone: existing.corIcone || existing.corSelo || "#ea580c",
        corTextoBotao: existing.corTextoBotao || "#ffffff",
        corBotao: existing.corBotao || existing.corSelo || "#ea580c",
      });
    }
  }, [existing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || formData.alvosId.length === 0) {
      toast.error("Preencha todos os campos obrigatórios (Título e Alvos)");
      return;
    }
    
    if (formData.tipoCampanha !== "leve_pague" && (!formData.dataFim || !formData.horaFim)) {
      toast.error("Preencha a data e hora de encerramento");
      return;
    }

    if (existing) {
      updatePromocao(existing.id, formData);
      toast.success("Promoção atualizada com sucesso");
    } else {
      addPromocao(formData);
      toast.success("Promoção criada com sucesso");
    }
    navigate({ to: "/admin/marketing/promocoes" });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/admin/marketing/promocoes" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {existing ? "Editar Promoção" : "Nova Promoção"}
          </h1>
          <p className="text-muted-foreground text-sm">Configure uma campanha de alta conversão</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-xl shadow-sm p-6 space-y-8">
        {/* Banner Preview Visual */}
        {formData.tipoCampanha !== "leve_pague" && (
          <div className="bg-red-600 rounded-xl p-6 text-white text-center shadow-lg border-2 border-red-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex flex-col items-center gap-2">
              {(() => {
                const Icon = ICONS.find(i => i.id === formData.icone)?.icon || Flame;
                return <Icon className="w-10 h-10 mb-2 animate-pulse" />;
              })()}
              <h2 className="text-2xl font-black uppercase tracking-wider">{formData.titulo || "Título da Promoção"}</h2>
              <div className="flex items-center gap-2 text-xl font-bold bg-black/20 px-4 py-2 rounded-lg mt-2">
                <span className="font-mono bg-white text-red-600 px-2 py-1 rounded">00</span> :
                <span className="font-mono bg-white text-red-600 px-2 py-1 rounded">00</span> :
                <span className="font-mono bg-white text-red-600 px-2 py-1 rounded">00</span>
              </div>
              <p className="text-sm font-medium mt-2 opacity-90">Visualização de como aparecerá para o cliente</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Informações Principais</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Nome da Promoção *</label>
              <Input 
                value={formData.titulo} 
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} 
                placeholder="Ex: Semana do Consumidor"
                className="h-12 border-slate-300"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold">Ícone em Destaque</label>
              <div className="flex gap-2">
                {ICONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    onClick={() => setFormData({ ...formData, icone: item.id })}
                    style={formData.icone === item.id ? { 
                      borderColor: formData.corBotao || '#ea580c', 
                      backgroundColor: (formData.corBotao || '#ea580c') + '1A', 
                      color: formData.corIcone || '#ea580c'
                    } : {}}
                    className={`h-12 w-12 rounded-lg flex items-center justify-center border-2 transition-all ${
                      formData.icone === item.id 
                        ? ''
                        : 'border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Tipo de Promoção</label>
              <select
                className="flex h-12 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                value={formData.tipoCampanha || "padrao"}
                onChange={(e) => setFormData({ ...formData, tipoCampanha: e.target.value as any, tipoAlvo: e.target.value === "leve_pague" ? "produtos" : formData.tipoAlvo })}
              >
                <option value="padrao">Campanha Padrão (Timer + Selo)</option>
                <option value="leve_pague">Leve + Pague - (Compre X, Pague Y cada)</option>
              </select>
            </div>
          </div>

          {formData.tipoCampanha === "leve_pague" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50 p-4 rounded-xl border border-orange-200">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Quantidade Necessária (Ex: Leve 2)</label>
                <Input 
                  type="number" 
                  min="2"
                  value={formData.levePague_quantidade} 
                  onChange={(e) => setFormData({ ...formData, levePague_quantidade: Number(e.target.value) })} 
                  className="h-12 border-slate-300 bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Preço Promocional por Item (R$)</label>
                <Input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={formData.levePague_precoPorItem} 
                  onChange={(e) => setFormData({ ...formData, levePague_precoPorItem: Number(e.target.value) })} 
                  className="h-12 border-slate-300 bg-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2 pt-2 border-t border-orange-200/50 mt-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Cor do Ícone</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.corIcone || "#ea580c"}
                      onChange={(e) => setFormData({ ...formData, corIcone: e.target.value })}
                      className="h-12 w-12 rounded border border-slate-300 cursor-pointer"
                    />
                    <span className="text-sm text-slate-500 uppercase font-mono">{formData.corIcone || "#ea580c"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Cor do Botão</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.corBotao || "#ea580c"}
                      onChange={(e) => setFormData({ ...formData, corBotao: e.target.value })}
                      className="h-12 w-12 rounded border border-slate-300 cursor-pointer"
                    />
                    <span className="text-sm text-slate-500 uppercase font-mono">{formData.corBotao || "#ea580c"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Texto do Botão</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.corTextoBotao || "#ffffff"}
                      onChange={(e) => setFormData({ ...formData, corTextoBotao: e.target.value })}
                      className="h-12 w-12 rounded border border-slate-300 cursor-pointer"
                    />
                    <span className="text-sm text-slate-500 uppercase font-mono">{formData.corTextoBotao || "#ffffff"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {formData.tipoCampanha !== "leve_pague" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Data de Encerramento *</label>
                <Input 
                  type="date" 
                  value={formData.dataFim} 
                  onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })} 
                  className="h-12 border-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Hora de Encerramento *</label>
                <Input 
                  type="time" 
                  value={formData.horaFim} 
                  onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })} 
                  className="h-12 border-slate-300"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Seleção de Produtos</h3>
          <p className="text-sm text-muted-foreground">Escolha os produtos que farão parte desta promoção.</p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 border p-4 rounded-lg bg-slate-50">
              <label className={`flex items-center gap-2 ${formData.tipoCampanha === 'leve_pague' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input 
                  type="radio" 
                  disabled={formData.tipoCampanha === 'leve_pague'}
                  checked={formData.tipoAlvo === 'categoria'} 
                  onChange={() => setFormData({ ...formData, tipoAlvo: 'categoria', alvosId: [] })}
                  className="w-4 h-4 accent-red-600"
                />
                <span className="font-semibold text-slate-700">Por Categoria</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  checked={formData.tipoAlvo === 'produtos'} 
                  onChange={() => setFormData({ ...formData, tipoAlvo: 'produtos', alvosId: [] })}
                  className="w-4 h-4 accent-red-600"
                />
                <span className="font-semibold text-slate-700">Produtos Individuais</span>
              </label>
            </div>

            {formData.tipoAlvo === 'categoria' && (
              <div className="space-y-2 border p-4 rounded-lg">
                <label className="text-sm font-semibold">Selecione uma Categoria *</label>
                <select 
                  className="flex h-12 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.alvosId[0] || ""}
                  onChange={(e) => setFormData({ ...formData, alvosId: [e.target.value] })}
                >
                  <option value="" disabled>Selecione...</option>
                  {categorias.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.tipoAlvo === 'produtos' && (
              <div className="space-y-4 border p-4 rounded-lg bg-white">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Selecione os Produtos *</label>
                  <div className="text-sm font-medium bg-red-100 text-red-700 px-2 py-1 rounded">
                    {formData.alvosId.length} selecionado(s)
                  </div>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    type="search"
                    placeholder="Pesquisar produto pelo nome..."
                    className="pl-9 h-10 border-slate-300"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="border rounded-md max-h-[300px] overflow-y-auto bg-slate-50">
                  {filteredProdutos.length > 0 ? (
                    <div className="divide-y divide-slate-200">
                      {filteredProdutos.map((p: any) => {
                        const isChecked = formData.alvosId.includes(p.id);
                        return (
                          <label key={p.id} className={`flex items-center gap-3 p-3 hover:bg-slate-100 cursor-pointer transition-colors ${isChecked ? 'bg-red-50/50 hover:bg-red-50' : ''}`}>
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, alvosId: [...formData.alvosId, p.id] });
                                } else {
                                  setFormData({ ...formData, alvosId: formData.alvosId.filter(id => id !== p.id) });
                                }
                              }}
                              className="w-5 h-5 rounded text-red-600 focus:ring-red-500 accent-red-600"
                            />
                            <div>
                              <div className="text-sm font-medium text-slate-800">{p.nome}</div>
                              <div className="text-xs text-slate-500">
                                {p.marca} • R$ {p.precoPor.toFixed(2).replace('.', ',')}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-sm text-slate-500">
                      Nenhum produto encontrado.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch 
              checked={formData.ativa} 
              onCheckedChange={(c) => setFormData({ ...formData, ativa: c })} 
            />
            <div>
              <div className="font-bold text-slate-800">Promoção Ativa</div>
              <div className="text-xs text-muted-foreground">Exibe o timer imediatamente na loja.</div>
            </div>
          </div>
          
          <Button type="submit" className="h-12 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-lg">
            <Save className="h-5 w-5 mr-2" />
            Salvar Promoção
          </Button>
        </div>
      </form>
    </div>
  );
}

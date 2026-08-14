import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminProducts } from "@/stores/products";
import { Vitrine, VitrineLocal, Categoria, Produto } from "@/types";
import { catalog } from "@/services/catalog";
import { toast } from "sonner";
import { Flame, Sparkles, TrendingUp, Percent, Tag, Heart, ShoppingBag, Pill, Leaf, Baby, Flower2, Stethoscope, Sun, Dumbbell, Activity, ShieldCheck, Thermometer, Battery, Wind, Droplets, Eye, Smile, Coffee, HeartPulse, Scale, BriefcaseMedical } from "lucide-react";

const ICONS = {
  Flame, Sparkles, TrendingUp, Percent, Tag, Heart, ShoppingBag, Pill, Leaf, Baby, Flower2, Stethoscope, Sun, Dumbbell, Activity, ShieldCheck, Thermometer, Battery, Wind, Droplets, Eye, Smile, Coffee, HeartPulse, Scale, BriefcaseMedical
};

interface VitrineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vitrine?: Vitrine | null;
  lojaId?: string | null;
}

export function VitrineFormModal({ isOpen, onClose, vitrine, lojaId }: VitrineFormModalProps) {
  const { addVitrine, updateVitrine } = useAdminProducts();
  
  const [nome, setNome] = useState("");
  const [ativa, setAtiva] = useState(true);
  const [categoriaId, setCategoriaId] = useState("");
  const [local, setLocal] = useState<VitrineLocal>("espaco_1");
  const [icone, setIcone] = useState("Sparkles");
  const [descricaoSeo, setDescricaoSeo] = useState("");
  const [modo, setModo] = useState<"categoria" | "manual">("categoria");
  const [produtoIds, setProdutoIds] = useState<string[]>([]);
  const [ordem, setOrdem] = useState<number>(0);
  
  const [categoriasOpcoes, setCategoriasOpcoes] = useState<Categoria[]>([]);
  const [produtosOpcoes, setProdutosOpcoes] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state for products
  const [searchProduto, setSearchProduto] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (vitrine) {
        setNome(vitrine.nome);
        setAtiva(vitrine.ativa);
        setCategoriaId(vitrine.categoriaId);
        setLocal(vitrine.local);
        setIcone(vitrine.icone || "Sparkles");
        setDescricaoSeo(vitrine.descricaoSeo || "");
        setModo(vitrine.modo || "categoria");
        setProdutoIds(vitrine.produtoIds || []);
        setOrdem(vitrine.ordem || 0);
      } else {
        setNome("");
        setAtiva(true);
        setCategoriaId("");
        setLocal("espaco_1");
        setIcone("Sparkles");
        setDescricaoSeo("");
        setModo("categoria");
        setProdutoIds([]);
        setOrdem(0);
      }
      
      async function loadOptions() {
        setLoading(true);
        const allProducts = await catalog.listProducts();
        const allCats = await catalog.listCategories(true);
        setCategoriasOpcoes(allCats);
        setProdutosOpcoes(allProducts);
        setLoading(false);
      }
      loadOptions();
    }
  }, [isOpen, vitrine]);

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error("O nome da vitrine é obrigatório");
      return;
    }
    if (modo === "categoria" && !categoriaId) {
      toast.error("Selecione uma categoria ou mude o modo para seleção manual");
      return;
    }
    
    const vitrineData = {
      nome,
      ativa,
      categoriaId: modo === "categoria" ? categoriaId : "manual",
      local,
      icone,
      descricaoSeo,
      modo,
      produtoIds,
      ordem,
    };
    
    if (vitrine) {
      updateVitrine({ ...vitrineData, id: vitrine.id }, lojaId);
      toast.success("Vitrine atualizada com sucesso!");
    } else {
      addVitrine(vitrineData, lojaId);
      toast.success("Vitrine criada com sucesso!");
    }
    onClose();
  };

  const filteredProducts = produtosOpcoes.filter(p => (p.nome || "").toLowerCase().includes(searchProduto.toLowerCase())).slice(0, 50);

  const toggleProduct = (id: string) => {
    if (produtoIds.includes(id)) {
      setProdutoIds(produtoIds.filter(pid => pid !== id));
    } else {
      setProdutoIds([...produtoIds, id]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vitrine ? "Editar Vitrine" : "Nova Vitrine"}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-white bg-primary px-2 py-1 rounded uppercase tracking-wider">ATIVO</span>
            <Switch checked={ativa} onCheckedChange={setAtiva} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome da Vitrine <span className="text-red-500">*</span></Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Ofertas Especiais" />
            </div>
            
            <div className="space-y-2">
              <Label>Ícone</Label>
              <Select value={icone} onValueChange={setIcone}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ícone" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Object.entries(ICONS).map(([name, IconComp]) => (
                    <SelectItem key={name} value={name}>
                      <div className="flex items-center gap-2">
                        <IconComp className="h-4 w-4" />
                        <span>{name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Posição da Vitrine <span className="text-red-500">*</span></Label>
            <Select value={local} onValueChange={(val) => setLocal(val as VitrineLocal)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o espaço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="espaco_1">1º Espaço (Abaixo de Compre por Categoria)</SelectItem>
                <SelectItem value="espaco_2">2º Espaço (Abaixo de Serviços de Saúde)</SelectItem>
                <SelectItem value="espaco_3">3º Espaço (Acima da Vitrine de Marcas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descrição da Vitrine (SEO, AEO, GEO)</Label>
            <Textarea 
              value={descricaoSeo} 
              onChange={e => setDescricaoSeo(e.target.value)} 
              placeholder="Texto rico em palavras-chave para ajudar na indexação (oculto visualmente mas presente no código)"
              className="h-20"
            />
          </div>

          <div className="space-y-2">
            <Label>Modo de Produtos</Label>
            <Select value={modo} onValueChange={(val) => setModo(val as "categoria" | "manual")}>
              <SelectTrigger>
                <SelectValue placeholder="Como os produtos serão selecionados?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="categoria">Por Categoria (Automático)</SelectItem>
                <SelectItem value="manual">Seleção Manual (Específico)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {modo === "categoria" ? (
            <div className="space-y-2">
              <Label>Categoria Vinculada <span className="text-red-500">*</span></Label>
              <Select value={categoriaId} onValueChange={setCategoriaId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Carregando..." : "Selecione uma categoria"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel className="font-bold text-primary">Vitrines Dinâmicas</SelectLabel>
                    <SelectItem value="all">Todos os Produtos</SelectItem>
                    <SelectItem value="campanha">Produtos em Campanha (Ofertas do Mês)</SelectItem>
                    <SelectItem value="ofertas">Ofertas da Semana</SelectItem>
                    <SelectItem value="destaques">Destaques da Loja</SelectItem>
                    <SelectItem value="novidades">Novidades / Lançamentos</SelectItem>
                    <SelectItem value="protetores">Protetores Solares</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="font-bold text-primary border-t pt-2 mt-2">Categorias de Produtos</SelectLabel>
                    {categoriasOpcoes.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-4 border p-4 rounded-md">
              <div className="space-y-2">
                <Label>Buscar Produtos para Adicionar</Label>
                <Input 
                  placeholder="Digite o nome do produto..." 
                  value={searchProduto}
                  onChange={e => setSearchProduto(e.target.value)}
                />
              </div>
              
              <div className="max-h-[200px] overflow-y-auto border rounded divide-y">
                {filteredProducts.map(p => (
                  <div key={p.id} className="p-2 flex items-center justify-between hover:bg-slate-50">
                    <span className="text-sm font-medium line-clamp-1">{p.nome || "Produto sem nome"}</span>
                    <Button 
                      variant={produtoIds.includes(p.id) ? "destructive" : "secondary"} 
                      size="sm"
                      onClick={() => toggleProduct(p.id)}
                    >
                      {produtoIds.includes(p.id) ? "Remover" : "Adicionar"}
                    </Button>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhum produto encontrado.
                  </div>
                )}
              </div>

              {produtoIds.length > 0 && (
                <div className="text-sm text-slate-600 font-medium">
                  {produtoIds.length} produto(s) selecionado(s) para esta vitrine.
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Ordem (Opcional)</Label>
            <Input type="number" value={ordem} onChange={e => setOrdem(Number(e.target.value))} placeholder="0" />
            <p className="text-xs text-muted-foreground">Define a ordem de exibição caso haja mais de uma vitrine no mesmo espaço.</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Vitrine</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

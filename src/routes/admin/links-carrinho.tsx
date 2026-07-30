import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Search, Plus, Package, ShoppingCart, Link as LinkIcon, Copy, Trash2, Tag, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import productsData from "@/data/products.json";

export const Route = createFileRoute("/admin/links-carrinho")({
  component: LinksCarrinho,
});

interface CarrinhoItem {
  id: string;
  sku: string;
  nome: string;
  valorUnitario: number;
  qtd: number;
  foto: string;
}

function LinksCarrinho() {
  const [nomeLink, setNomeLink] = useState("");
  const [ativo, setAtivo] = useState(true);
  
  // Produtos
  const [buscaProduto, setBuscaProduto] = useState("");
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Link gerado
  const [generatedLink, setGeneratedLink] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  // Cupom
  const [cupomInput, setCupomInput] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<{ codigo: string, percentual: number } | null>(null);

  // Fecha busca ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Efeito de Busca
  useEffect(() => {
    if (buscaProduto.trim().length > 2) {
      const q = buscaProduto.toLowerCase();
      const filtered = (productsData as any[]).filter(p => 
        (p.nome && p.nome.toLowerCase().includes(q)) ||
        (p.ean && p.ean.toLowerCase().includes(q))
      ).slice(0, 10);
      setSearchResults(filtered);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [buscaProduto]);

  const handleAddProduto = (p: any) => {
    setCarrinho(prev => {
      const exists = prev.find(i => i.id === p.id);
      if (exists) {
        return prev.map(i => i.id === p.id ? { ...i, qtd: i.qtd + 1 } : i);
      }
      return [
        ...prev,
        {
          id: p.id,
          sku: p.ean || p.id,
          nome: p.nome || "Produto",
          valorUnitario: p.precoPor || 0,
          qtd: 1,
          foto: p.imagem_url || "https://placehold.co/100"
        }
      ];
    });
    setBuscaProduto("");
    setShowResults(false);
    toast.success("Produto adicionado à cesta!");
  };

  const handleUpdateQtd = (id: string, delta: number) => {
    setCarrinho(prev => prev.map(i => {
      if (i.id === id) {
        const newQtd = Math.max(1, i.qtd + delta);
        return { ...i, qtd: newQtd };
      }
      return i;
    }));
  };

  const handleRemoveProduto = (id: string) => {
    setCarrinho(prev => prev.filter(i => i.id !== id));
  };

  const handleApplyCupom = () => {
    if (!cupomInput.trim()) {
      toast.error("Digite o código do cupom.");
      return;
    }
    const codigo = cupomInput.toUpperCase().trim();
    
    // Lista de cupons cadastrados (mock)
    const validCoupons: Record<string, number> = {
      "BEMVINDO10": 10,
      "PROMO20": 20,
      "CLIENTE15": 15,
      "BLACKFRIDAY50": 50,
      "VIP": 10,
    };

    if (!validCoupons[codigo]) {
      toast.error("Cupom inválido.");
      return;
    }
    
    const percentual = validCoupons[codigo];
    
    setCupomAplicado({ codigo, percentual });
    toast.success(`Cupom ${codigo} aplicado (${percentual}% de desconto)!`);
  };

  const handleRemoveCupom = () => {
    setCupomAplicado(null);
    setCupomInput("");
    toast.success("Cupom removido.");
  };

  const handleGenerateLink = () => {
    if (carrinho.length === 0) {
      toast.error("Adicione pelo menos um produto na cesta.");
      return;
    }
    if (!nomeLink) {
      toast.error("Dê um nome para este link (Ex: Carrinho da Dona Maria).");
      return;
    }
    
    // Codificar os itens no formato [{id, qtd}]
    const simplifiedCart = carrinho.map(item => ({ id: item.id, qtd: item.qtd }));
    const encoded = btoa(JSON.stringify(simplifiedCart));
    setGeneratedLink(`https://prototipo-associadas.vercel.app/compartilhado?c=${encoded}`);
    setShowLinkModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success("Link copiado para a área de transferência!");
  };

  const clearForm = () => {
    setNomeLink("");
    setCarrinho([]);
    setAtivo(true);
    setCupomInput("");
    setCupomAplicado(null);
    setShowLinkModal(false);
  };

  const valorProdutos = carrinho.reduce((acc, item) => acc + (item.valorUnitario * item.qtd), 0);
  const valorDesconto = cupomAplicado ? (valorProdutos * cupomAplicado.percentual) / 100 : 0;
  const total = valorProdutos - valorDesconto;

  return (
    <div className="min-h-screen bg-[#F9F9F8] p-8 font-sans pb-32">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Criar Link de Carrinho</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Monte uma cesta pronta para o seu cliente e compartilhe o link de pagamento.
            </p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2" onClick={handleGenerateLink}>
            <LinkIcon className="w-4 h-4" /> Gerar Link
          </Button>
        </div>

        <div className="flex items-start gap-6 flex-col lg:flex-row">
          
          {/* Main Area */}
          <div className="flex-1 space-y-6 w-full">
            
            {/* INFORMAÇÕES */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-slate-400" />
                  <h2 className="text-lg font-bold text-slate-700">Informações do Link</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full ${ativo ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                    {ativo ? "Ativo" : "Inativo"}
                  </span>
                  <Switch checked={ativo} onCheckedChange={setAtivo} className="data-[state=checked]:bg-emerald-500" />
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 block">Nome de identificação *</label>
                  <Input 
                    placeholder="Ex: Carrinho João Silva (Mensal) - Controle interno" 
                    className="font-medium focus-visible:ring-emerald-500"
                    value={nomeLink}
                    onChange={(e) => setNomeLink(e.target.value)}
                  />
                  <p className="text-xs font-medium text-slate-400">Esse nome será usado para você identificar essa venda na listagem de links.</p>
                </div>
              </div>
            </div>

            {/* PRODUTOS */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-700">Cesta de Produtos</h2>
              </div>
              <div className="p-5">
                <div className="relative mb-6" ref={searchRef}>
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <Input 
                    placeholder="Buscar produto por nome ou EAN..." 
                    className="pl-10 font-medium"
                    value={buscaProduto}
                    onChange={(e) => setBuscaProduto(e.target.value)}
                  />
                  {showResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-50">
                      {searchResults.map(p => (
                        <div 
                          key={p.id} 
                          className="flex items-center justify-between p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                          onClick={() => handleAddProduto(p)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white border rounded flex-shrink-0 flex items-center justify-center p-1">
                              {p.imagem_url ? (
                                <img src={p.imagem_url} alt="" className="max-w-full max-h-full object-contain" />
                              ) : (
                                <Package className="w-5 h-5 text-slate-300" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-slate-700 line-clamp-1">{p.nome || "Produto sem nome"}</div>
                              <div className="text-xs font-medium text-emerald-600">
                                {(p.precoPor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </div>
                            </div>
                          </div>
                          <Plus className="w-4 h-4 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {carrinho.length > 0 ? (
                  <div className="space-y-3">
                    {carrinho.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white border rounded flex-shrink-0 p-1 flex items-center justify-center">
                            {item.foto && !item.foto.includes("placehold") ? (
                              <img src={item.foto} className="max-w-full max-h-full object-contain" alt="" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-700">{item.nome}</div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">
                              {item.valorUnitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} un.
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md">
                            <button className="px-2 py-1 text-slate-500 hover:text-slate-800 font-bold" onClick={() => handleUpdateQtd(item.id, -1)}>-</button>
                            <span className="text-sm font-bold w-4 text-center">{item.qtd}</span>
                            <button className="px-2 py-1 text-slate-500 hover:text-slate-800 font-bold" onClick={() => handleUpdateQtd(item.id, 1)}>+</button>
                          </div>
                          
                          <div className="font-black text-emerald-600 min-w-[80px] text-right">
                            {(item.qtd * item.valorUnitario).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </div>
                          
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveProduto(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-500">Nenhum produto adicionado</p>
                    <p className="text-xs font-medium text-slate-400">Busque acima para inserir itens na cesta do cliente.</p>
                  </div>
                )}
              </div>
            </div>

            {/* CUPOM DE DESCONTO */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Tag className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-700">Cupom de Desconto</h2>
                <span className="text-[13px] font-medium text-slate-400">(Opcional)</span>
              </div>
              <div className="p-5">
                {cupomAplicado ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Tag className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-800">{cupomAplicado.codigo}</p>
                        <p className="text-xs font-medium text-emerald-600">{cupomAplicado.percentual}% de desconto aplicado</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold" onClick={handleRemoveCupom}>
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <Input 
                      placeholder="Ex: BEMVINDO10" 
                      className="h-10 font-medium uppercase"
                      value={cupomInput}
                      onChange={(e) => setCupomInput(e.target.value.toUpperCase())}
                    />
                    <Button variant="outline" className="h-10 font-bold text-slate-600 px-6 border-slate-200" onClick={handleApplyCupom}>Aplicar</Button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar / Resumo */}
          <div className="w-full lg:w-[320px] shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-[15px] font-bold text-slate-700">Resumo do Link</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-500">Subtotal ({carrinho.reduce((a, b) => a + b.qtd, 0)} itens)</span>
                  <span className="font-bold text-slate-600">{valorProdutos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
                {cupomAplicado && (
                  <div className="flex justify-between items-center text-sm text-emerald-600">
                    <span className="font-bold">Desconto ({cupomAplicado.percentual}%)</span>
                    <span className="font-bold">- {valorDesconto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm pt-4 border-t border-slate-100">
                  <span className="font-bold text-slate-700">Total a cobrar</span>
                  <span className="font-black text-emerald-600 text-xl">{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
              </div>
              <div className="p-5 pt-0">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold h-11" onClick={handleGenerateLink}>
                  <LinkIcon className="w-4 h-4 mr-2" /> Gerar Link de Compra
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal de Link Gerado */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
              <LinkIcon className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-800">Link Gerado com Sucesso!</DialogTitle>
            <DialogDescription>
              O carrinho está pronto. Agora é só enviar este link para o cliente finalizar o pagamento.
            </DialogDescription>
          </DialogHeader>

          <div className="my-6 space-y-2">
            <p className="text-sm font-bold text-slate-700 text-left">Link compartilhável</p>
            <div className="flex items-center gap-2">
              <Input value={generatedLink} readOnly className="bg-slate-50 font-medium text-slate-600" />
              <Button onClick={copyToClipboard} variant="outline" className="shrink-0 gap-2 font-bold">
                <Copy className="w-4 h-4" /> Copiar
              </Button>
            </div>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900" onClick={clearForm}>
              Criar outro link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

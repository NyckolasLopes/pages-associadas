import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useOrders } from "@/stores/orders";
import { useAdmin } from "@/stores/admin";
import { toast } from "sonner";
import { Search, Info, User, MapPin, ShoppingCart, DollarSign, Check, Store, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import productsData from "@/data/products.json";

export const Route = createFileRoute("/admin/pedidos/novo")({
  component: CriarPedidoAdmin,
});

interface Produto {
  id: string;
  ean: string;
  nome: string;
  precoPor: number;
  imagem_url?: string;
  [key: string]: any;
}

interface CarrinhoItem {
  id: string;
  sku: string;
  nome: string;
  valorUnitario: number;
  qtd: number;
  foto: string;
}

function formatCpf(v: string) {
  const digits = v.replace(/\D/g, "");
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, "$1.$2.$3-$4").substring(0, 14);
}

function parseCurrency(str: string) {
  const clean = str.replace(/[^\d,.-]/g, "").replace(",", ".");
  return parseFloat(clean) || 0;
}

function CriarPedidoAdmin() {
  const { orders, addOrder } = useOrders();
  const { pharmacies, activeStoreId, currentUser, grupos } = useAdmin();
  
  const isGlobalAdmin = () => {
    if (currentUser?.proprietario) return true;
    const userGroup = grupos.find(g => g.id === currentUser?.grupoId);
    return userGroup?.permissao_total || false;
  };
  const navigate = useNavigate();

  // Tipo Logistica
  const [tipoLogistica, setTipoLogistica] = useState<"entrega" | "retirada">("entrega");

  // Dados do Cliente
  const [tipoCliente, setTipoCliente] = useState<"novo" | "existente">("novo");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [celular, setCelular] = useState("");
  const [clienteBloqueado, setClienteBloqueado] = useState(false);

  // Validador de CPF (procura no histórico)
  useEffect(() => {
    const rawCpf = cpf.replace(/\D/g, "");
    if (rawCpf.length === 11) {
      const foundOrder = orders.find(o => o.cliente.cpf.replace(/\D/g, "") === rawCpf);
      if (foundOrder) {
        setNome(foundOrder.cliente.nome);
        setEmail(foundOrder.cliente.email);
        setCelular(foundOrder.cliente.telefone);
        setTipoCliente("existente");
        setClienteBloqueado(true);
        toast.success("Cliente localizado e preenchido automaticamente.");
      } else {
        setClienteBloqueado(false);
      }
    } else {
      setClienteBloqueado(false);
    }
  }, [cpf, orders]);

  // Endereço (Entrega)
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  
  // Retirada
  const [lojaSelecionada, setLojaSelecionada] = useState(!isGlobalAdmin() && activeStoreId ? activeStoreId : "");

  // Envio / Frete
  const [freteStr, setFreteStr] = useState("0,00");
  const [formaEntrega, setFormaEntrega] = useState("");
  
  // Produtos
  const [buscaProduto, setBuscaProduto] = useState("");
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [searchResults, setSearchResults] = useState<Produto[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (buscaProduto.length >= 2) {
      const res = (productsData as any[]).filter(p => (p.nome || "").toLowerCase().includes(buscaProduto.toLowerCase()));
      setSearchResults(res.slice(0, 5) as Produto[]);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [buscaProduto]);

  // Pagamento
  const [formaPagamento, setFormaPagamento] = useState("");
  const [aplicarDesconto, setAplicarDesconto] = useState(false);
  const [descontoStr, setDescontoStr] = useState("");

  const [observacao, setObservacao] = useState("");

  // Restabelecer forma de pagamento/entrega ao mudar logística
  useEffect(() => {
    if (tipoLogistica === "retirada") {
      setFormaEntrega("Retirada na Loja");
      setFreteStr("0,00");
    } else {
      setFormaEntrega("");
    }
    setFormaPagamento("");
  }, [tipoLogistica]);

  // Cálculos
  const subtotal = carrinho.reduce((acc, item) => acc + (item.valorUnitario * item.qtd), 0);
  const frete = tipoLogistica === "entrega" ? parseCurrency(freteStr) : 0;
  const desconto = aplicarDesconto ? parseCurrency(descontoStr) : 0;
  const total = Math.max(0, subtotal + frete - desconto);

  const handleAddProduto = (p: Produto) => {
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
    toast.success("Produto adicionado ao carrinho!");
  };

  const handleCreateOrder = () => {
    if (!nome || !cpf || carrinho.length === 0) {
      toast.error("Preencha os campos obrigatórios e adicione produtos.");
      return;
    }
    if (tipoLogistica === "entrega" && !formaEntrega) {
      toast.error("Selecione uma forma de entrega.");
      return;
    }
    if (!lojaSelecionada) {
      toast.error("Selecione a loja responsável pelo pedido.");
      return;
    }
    if (!formaPagamento) {
      toast.error("Selecione uma forma de pagamento.");
      return;
    }

    const newOrder = {
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      lojaId: lojaSelecionada,
      data: new Date().toLocaleString("pt-BR"),
      cliente: {
        nome,
        email: email || "nao_informado@email.com",
        telefone: celular,
        cpf,
        ip: "127.0.0.1",
        tipo: tipoCliente === "novo" ? "Padrão" : "Frequente"
      },
      pagamento: {
        metodo: formaPagamento
      },
      envio: {
        metodo: formaEntrega,
        prazo: tipoLogistica === "entrega" ? "1 dias úteis" : "Imediato",
        endereco: tipoLogistica === "entrega" ? `${endereco}, ${numero}` : "Retirada em loja",
        cidade: tipoLogistica === "entrega" ? `${cidade} / ${estado}` : "-",
        cep: cep || "-"
      },
      status: "Pago", // Como é criado manualmente no balcão, geralmente já está Pago
      produtos: carrinho.map(item => ({
        nome: item.nome,
        sku: item.sku,
        cores: "N/A",
        disponibilidade: "Imediata",
        qtd: item.qtd,
        valorUnitario: item.valorUnitario,
        foto: item.foto
      })),
      valores: {
        produtos: subtotal,
        desconto,
        frete,
        total
      },
      historico: [
        { data: new Date().toLocaleString("pt-BR"), situacao: "Pedido Efetuado (Balcão)", autor: "Administrador" }
      ],
      anotacoes: observacao
    };

    addOrder(newOrder);
    toast.success("Pedido criado com sucesso!");
    navigate({ to: "/admin/pedidos" });
  };

  const deliveryOptions = ["Entrega Padrão", "Entrega Expressa", "Uber Flash", "99 Entrega"];
  const paymentOptionsEntrega = ["Pix", "Cartão de Crédito"];
  const paymentOptionsRetirada = [
    "Pagamento na Farmácia (Dinheiro)",
    "Pagamento na Farmácia (Pix)",
    "Pagamento na Farmácia (Cartão de Crédito)",
    "Pagamento na Farmácia (Cartão de Débito)"
  ];
  
  const currentPaymentOptions = tipoLogistica === "entrega" ? paymentOptionsEntrega : paymentOptionsRetirada;

  return (
    <div className="min-h-screen bg-[#F9F9F8] p-8 font-sans pb-32">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Novo Pedido</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Geração manual de pedido no painel.</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2" onClick={handleCreateOrder}>
            <Check className="w-4 h-4" /> Finalizar Pedido
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Coluna da Esquerda (Maior) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* DADOS DO CLIENTE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <User className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-700">Dados do Cliente</h2>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 block">CPF *</label>
                    <Input 
                      placeholder="000.000.000-00" 
                      value={cpf} 
                      onChange={(e) => setCpf(formatCpf(e.target.value))} 
                    />
                    <p className="text-xs font-medium text-slate-400">Digite o CPF para autocompletar clientes existentes.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 block">Nome completo *</label>
                    <Input 
                      placeholder="Nome do cliente" 
                      value={nome} 
                      onChange={(e) => setNome(e.target.value)}
                      disabled={clienteBloqueado}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 block">E-mail</label>
                    <Input 
                      placeholder="email@exemplo.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={clienteBloqueado}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 block">Celular</label>
                    <Input 
                      placeholder="(00) 00000-0000" 
                      value={celular} 
                      onChange={(e) => setCelular(e.target.value)}
                      disabled={clienteBloqueado}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* LOGÍSTICA / ENTREGA OU RETIRADA */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <h2 className="text-lg font-bold text-slate-700">Entrega ou Retirada</h2>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  <button 
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${tipoLogistica === "entrega" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
                    onClick={() => setTipoLogistica("entrega")}
                  >
                    Entrega
                  </button>
                  <button 
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${tipoLogistica === "retirada" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
                    onClick={() => setTipoLogistica("retirada")}
                  >
                    Retirada
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 block">Loja Responsável *</label>
                  <Select value={lojaSelecionada} onValueChange={setLojaSelecionada} disabled={!isGlobalAdmin()}>
                    <SelectTrigger className="font-medium text-slate-600">
                      <SelectValue placeholder="Selecione a loja..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pharmacies.map(loja => (
                        <SelectItem key={loja.id} value={loja.id}>
                          {(loja as any).nomeFantasia || loja.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-px bg-slate-100 my-4" />

                {tipoLogistica === "entrega" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 block">Forma de Entrega *</label>
                        <Select value={formaEntrega} onValueChange={setFormaEntrega}>
                          <SelectTrigger className="font-medium text-slate-600">
                            <SelectValue placeholder="Selecione a entrega" />
                          </SelectTrigger>
                          <SelectContent>
                            {deliveryOptions.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 block">Valor do Frete (R$)</label>
                        <Input 
                          placeholder="0,00" 
                          value={freteStr} 
                          onChange={(e) => setFreteStr(e.target.value)} 
                        />
                      </div>
                    </div>
                    
                    <div className="h-px bg-slate-100 my-4" />
                    
                    <div className="grid grid-cols-12 gap-5">
                      <div className="col-span-12 md:col-span-4 space-y-2">
                        <label className="text-sm font-bold text-slate-600 block">CEP</label>
                        <Input placeholder="00000-000" value={cep} onChange={(e) => setCep(e.target.value)} />
                      </div>
                      <div className="col-span-12 md:col-span-8 space-y-2">
                        <label className="text-sm font-bold text-slate-600 block">Endereço</label>
                        <Input placeholder="Rua, Avenida..." value={endereco} onChange={(e) => setEndereco(e.target.value)} />
                      </div>
                      <div className="col-span-6 md:col-span-3 space-y-2">
                        <label className="text-sm font-bold text-slate-600 block">Número</label>
                        <Input value={numero} onChange={(e) => setNumero(e.target.value)} />
                      </div>
                      <div className="col-span-6 md:col-span-5 space-y-2">
                        <label className="text-sm font-bold text-slate-600 block">Bairro</label>
                        <Input value={bairro} onChange={(e) => setBairro(e.target.value)} />
                      </div>
                      <div className="col-span-6 md:col-span-4 space-y-2">
                        <label className="text-sm font-bold text-slate-600 block">Cidade</label>
                        <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex items-start gap-3">
                      <Store className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-emerald-800 text-sm">Retirada na Loja Física</h4>
                        <p className="text-xs font-medium text-emerald-600 mt-0.5">O cliente fará a retirada na unidade selecionada acima.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PRODUTOS */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-slate-400" />
                  <h2 className="text-lg font-bold text-slate-700">Produtos do Pedido</h2>
                </div>
              </div>
              <div className="p-5">
                <div className="relative mb-6" ref={searchRef}>
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <Input 
                    placeholder="Buscar produto por nome ou código..." 
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
                    {carrinho.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50">
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
                              {item.qtd}x de {item.valorUnitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </div>
                          </div>
                        </div>
                        <div className="font-bold text-emerald-600">
                          {(item.qtd * item.valorUnitario).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-500">Nenhum produto adicionado</p>
                    <p className="text-xs font-medium text-slate-400">Busque acima para inserir itens ao pedido.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Coluna da Direita (Menor) */}
          <div className="space-y-6">
            
            {/* PAGAMENTO */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-700">Pagamento</h2>
              </div>
              <div className="p-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 block">Forma de Pagamento *</label>
                  <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                    <SelectTrigger className="font-medium text-slate-600">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {currentPaymentOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] font-medium text-slate-400">
                    Opções disponíveis para {tipoLogistica}.
                  </p>
                </div>
              </div>
            </div>

            {/* RESUMO DE VALORES */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-700">Resumo</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium text-slate-600">
                    <span>Subtotal</span>
                    <span>{subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-slate-600">
                    <span>Frete</span>
                    <span>{frete.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                  
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <Checkbox 
                        checked={aplicarDesconto} 
                        onCheckedChange={(c) => {
                          setAplicarDesconto(c as boolean);
                          if (!c) setDescontoStr("");
                        }} 
                      />
                      <span className="text-sm font-bold text-slate-600">Aplicar desconto manual</span>
                    </label>
                    {aplicarDesconto && (
                      <div className="pl-6">
                        <Input 
                          placeholder="Valor do desconto (R$)" 
                          className="h-8 text-sm"
                          value={descontoStr}
                          onChange={(e) => setDescontoStr(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  {desconto > 0 && (
                    <div className="flex justify-between text-sm font-bold text-red-500">
                      <span>Desconto</span>
                      <span>- {desconto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                    </div>
                  )}
                </div>
                
                <div className="h-px bg-slate-100" />
                
                <div className="flex justify-between items-end">
                  <span className="font-bold text-slate-700">Total</span>
                  <span className="text-2xl font-black text-emerald-600">
                    {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <label className="text-sm font-bold text-slate-600 block mb-2">Anotações Internas</label>
              <Textarea 
                placeholder="Observações que ficam visíveis apenas no painel..." 
                className="text-sm min-h-[100px]"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

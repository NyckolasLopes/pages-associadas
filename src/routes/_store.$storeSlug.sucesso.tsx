import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { MessageCircle, CheckCircle2, Package, Truck, Clock, ShoppingBag, MapPin, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/stores/admin";
import { useCart } from "@/stores/cart";
import { brl, productImage } from "@/lib/format";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrders, type Pedido } from "@/stores/orders";

export const Route = createFileRoute("/_store/$storeSlug/sucesso")({
  component: SucessoPage,
});

function TimelineStep({ icon: Icon, label, active, isLast = false }: { icon: any, label: string, active: boolean, isLast?: boolean }) {
  return (
    <div className={`relative flex flex-col items-center flex-1 ${active ? 'opacity-100' : 'opacity-40'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 z-10 transition-all duration-500
        ${active ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={`text-xs font-bold ${active ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
      {!isLast && (
        <div className={`absolute top-5 left-1/2 w-full h-[2px] -z-0 transition-colors duration-500
          ${active ? 'bg-primary' : 'bg-slate-200'}`} />
      )}
    </div>
  );
}

function SucessoPage() {
  const search = Route.useSearch() as { id?: string };
  const params = useParams({ strict: false });
  const storeSlug = (params as any)?.storeSlug;
  const navigate = useNavigate();
  const clearCart = useCart((s) => s.clear);
  const pharmacies = useAdmin((s) => s.pharmacies);
  const activePharmacy = pharmacies.find(p => p.slug === storeSlug) || pharmacies[0];

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Fetch real order status directly from Supabase with fallback to lastOrder/local orders
  const { data: order, isLoading } = useQuery<Pedido | null>({
    queryKey: ['order-status', search.id],
    queryFn: async () => {
      const cleanId = String(search.id || "").trim();
      const rawNumber = cleanId.replace(/^FA-/, '');

      // 1. Tenta buscar no Supabase
      if (cleanId) {
        try {
          let query = supabase
            .from('pedidos')
            .select('*, pedido_itens(*)');

          // Busca flexível por numero ou id
          if (cleanId.includes('-') && cleanId.length === 36) {
            query = query.or(`id.eq.${cleanId},numero.eq.${cleanId},numero.eq.${rawNumber}`);
          } else {
            query = query.or(`numero.eq.${cleanId},numero.eq.${rawNumber}`);
          }

          const { data, error } = await query.maybeSingle();

          if (!error && data) {
            const d = data as any;
            const parsedItens = (d.pedido_itens && Array.isArray(d.pedido_itens) && d.pedido_itens.length > 0)
              ? d.pedido_itens.map((pi: any) => ({
                  id: pi.produto_id || pi.id,
                  nome: pi.nome,
                  quantidade: Number(pi.qty) || 1,
                  qtd: Number(pi.qty) || 1,
                  valorUnitario: Number(pi.preco_unit) || 0,
                  preco: Number(pi.preco_unit) || 0,
                  imagem: pi.imagem || pi.foto || productImage(pi),
                  foto: pi.foto || pi.imagem || productImage(pi),
                }))
              : (d.itens || d.produtos || []).map((it: any) => ({
                  ...it,
                  imagem: it.imagem || it.foto || productImage(it),
                  foto: it.foto || it.imagem || productImage(it),
                }));

            return {
              id: d.id,
              numero: d.numero || cleanId,
              data: d.data || d.created_at,
              status: d.status || 'novo',
              cliente: d.cliente || {
                nome: d.nome_cliente,
                telefone: d.telefone_cliente,
                email: d.email_cliente,
                cpf: d.cpf_cliente,
                endereco: d.endereco_entrega
              },
              itens: parsedItens,
              produtos: parsedItens,
              valores: d.valores || {
                total: Number(d.total) || 0,
                frete: Number(d.frete) || 0,
                subtotal: Number(d.subtotal) || 0,
                desconto: Number(d.desconto) || 0,
                produtos: Number(d.subtotal) || 0
              },
              pagamento: d.pagamento || { metodo: d.metodo_pagamento },
              envio: d.envio || { metodo: d.metodo_entrega, endereco: d.endereco_entrega },
              lojaId: d.loja_id,
              lojaNome: d.loja_nome || activePharmacy?.nome,
              modalidade: d.modalidade || d.metodo_entrega,
              historico: d.historico || []
            } as Pedido;
          }
        } catch (err) {
          console.warn("Supabase fetch failed in sucesso page, checking local fallback:", err);
        }
      }

      // 2. Fallback: lastOrder salvo no Zustand/localStorage do carrinho
      const lastOrder = useCart.getState().lastOrder;
      if (lastOrder && (lastOrder.id === cleanId || lastOrder.numero === cleanId || !cleanId)) {
        return lastOrder as Pedido;
      }

      // 3. Fallback: lista de pedidos do useOrders
      const storeOrder = useOrders.getState().orders.find(o => 
        o.id === cleanId || o.numero === cleanId || (o.numero && o.numero.replace('FA-', '') === rawNumber)
      );
      if (storeOrder) {
        return storeOrder as Pedido;
      }

      return lastOrder || null;
    },
    enabled: true,
    refetchInterval: 5000,
  });

  const goWhatsApp = () => {
    const phone = (activePharmacy?.telefone || "51999999999").replace(/\D/g, "");
    const waNumber = phone.startsWith("55") ? phone : `55${phone}`;
    let text = `Olá! Fiz um pedido no site e gostaria de acompanhar.\nPedido: *#${search.id}*`;
    if (order?.cliente?.nome) text += `\nNome: ${order.cliente.nome}`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="container-fa py-8 md:py-16 max-w-4xl min-h-[70vh]">
      
      {/* Header com Ícone Animado */}
      <div className="text-center mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 relative shadow-sm border border-green-200">
          <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">Pedido Recebido! 🎉</h1>
        <p className="text-slate-600 text-lg">
          Tudo certo! Seu pedido <strong className="text-slate-900">#{search.id}</strong> foi registrado com sucesso.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 size={48} className="mb-4 animate-spin text-primary" />
          <h2 className="text-xl font-bold text-slate-800">Processando seu pedido...</h2>
        </div>
      ) : order ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 lg:gap-8 items-start animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          
          {/* Coluna da Esquerda (Status e WhatsApp) */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Timeline */}
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Status do Pedido
              </h2>
              <div className="flex justify-between items-start pt-2 px-2 overflow-hidden">
                <TimelineStep icon={ShoppingBag} label="Recebido" active={true} />
                <TimelineStep icon={Package} label="Em Separação" active={order.status === 'separando' || order.status === 'enviado' || order.status === 'concluido'} />
                <TimelineStep icon={order.modalidade?.toLowerCase() === 'retirada' ? MapPin : Truck} label={order.modalidade?.toLowerCase() === 'retirada' ? 'Disponível' : 'Em Rota'} active={order.status === 'enviado' || order.status === 'concluido'} />
                <TimelineStep icon={CheckCircle2} label="Concluído" active={order.status === 'concluido'} isLast={true} />
              </div>
              <p className="text-sm text-slate-500 text-center mt-6 bg-slate-50 p-3 rounded-xl">
                Nossa equipe de loja já está analisando o seu pedido.
              </p>
            </div>

            {/* WhatsApp Call to Action */}
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-8 rounded-3xl border border-emerald-400 shadow-xl shadow-emerald-500/20 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <MessageCircle className="w-32 h-32" />
              </div>
              <h2 className="text-2xl font-bold mb-3 relative z-10">Acompanhe pelo WhatsApp</h2>
              <p className="text-emerald-50 mb-6 relative z-10 text-lg leading-relaxed max-w-[85%]">
                Receba atualizações em tempo real e fale diretamente com o farmacêutico responsável pela sua separação.
              </p>
              <Button 
                onClick={goWhatsApp}
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50 hover:scale-105 transition-all shadow-lg text-lg h-14 px-8 w-full sm:w-auto relative z-10 rounded-2xl"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Falar no WhatsApp
                <ArrowRight className="w-5 h-5 ml-2 opacity-50" />
              </Button>
            </div>

          </div>

          {/* Coluna da Direita (Recibo) */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
                Resumo da Compra
                <Badge variant="outline" className="bg-white text-slate-500">{order.produtos?.length || order.itens?.length || 0} itens</Badge>
              </h2>

              {/* Items List */}
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {(order.produtos || order.itens || []).map((item, i) => {
                  const itemImg = item.imagem || item.foto || productImage(item);
                  return (
                    <div key={i} className="flex gap-4 items-start bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                      <div className="w-14 h-14 bg-white rounded-xl flex-shrink-0 flex items-center justify-center p-1 border border-slate-100 overflow-hidden">
                        {itemImg ? (
                          <img 
                            src={itemImg} 
                            alt={item.nome} 
                            className="w-full h-full object-contain mix-blend-multiply" 
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              if (target.src !== "/produtos/sem-imagem.webp") {
                                target.src = "/produtos/sem-imagem.webp";
                              }
                            }}
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 leading-tight line-clamp-2 mb-1">{item.nome}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{item.qtd || item.quantidade}x un.</span>
                          <span className="text-sm font-bold text-primary">{brl((item.preco || item.valorUnitario || 0) * (item.qtd || item.quantidade || 1))}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="h-px bg-slate-200 w-full mb-6" />

              {/* Totals */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{brl(order.valores?.produtos || order.valores?.subtotal || 0)}</span>
                </div>
                {(order.valores?.desconto || order.valores?.descontos || 0) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto</span>
                    <span className="font-medium">-{brl(order.valores.desconto || order.valores.descontos || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Frete</span>
                  <span className="font-medium">{order.valores?.frete === 0 ? <span className="text-green-600 font-bold">Grátis</span> : brl(order.valores?.frete || 0)}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-slate-900 pt-3 border-t">
                  <span>Total</span>
                  <span className="text-primary">{brl(order.valores?.total || 0)}</span>
                </div>
              </div>

              {/* Endereço / Retirada info */}
              <div className="bg-primary/5 rounded-2xl p-4 text-sm">
                <div className="flex items-start gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">
                      {order.modalidade?.toLowerCase() === 'retirada' ? 'Retirada na Loja' : 'Endereço de Entrega'}
                    </span>
                    <span className="text-slate-600 leading-relaxed">
                      {order.modalidade?.toLowerCase() === 'retirada' 
                        ? `${activePharmacy?.nome || 'Loja'} - ${activePharmacy?.endereco || ''}`
                        : `${order.cliente?.endereco?.rua || order.envio?.endereco || ''}, ${order.cliente?.endereco?.numero || order.envio?.numero || ''}`
                      }
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500 mb-6">Não conseguimos carregar os detalhes do pedido no momento, mas ele foi registrado!</p>
          <Button onClick={goWhatsApp} size="lg" className="h-12 px-8">Falar com Suporte</Button>
        </div>
      )}

      <div className="mt-12 text-center">
        <Link to="/$storeSlug" params={{ storeSlug: params?.storeSlug || activePharmacy?.slug || 'loja-padrao' }}>
          <Button variant="ghost" className="text-slate-500 font-medium hover:text-slate-900">
            &larr; Voltar para a loja
          </Button>
        </Link>
      </div>

    </div>
  );
}

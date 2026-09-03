import { getBrandNameForHead } from "@/utils/brand";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMarketing, type Coupon } from "@/stores/marketing";
import { useActivePharmacy, safeSlugify } from "@/hooks/useActivePharmacy";
import { useAdmin } from "@/stores/admin";
import { useAdminCategories } from "@/stores/categories";
import { useAdminProducts } from "@/stores/products";
import { useCart } from "@/stores/cart";
import { 
  Ticket, 
  Copy, 
  Check, 
  ChevronRight, 
  ShoppingBag, 
  Sparkles, 
  Percent, 
  DollarSign, 
  Truck, 
  Info, 
  Store, 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  Tag, 
  HelpCircle,
  Clock,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { brl, productImage } from "@/lib/format";
import logoUrlDefault from "@/assets/logo.png";

export const Route = createFileRoute("/_store/$storeSlug/cupons")({
  head: ({ params }: any) => {
    const storeSlug = params?.storeSlug || "loja-padrao";
    const cuponsUrl = `https://farmaciasassociadas.com.br/${storeSlug}/cupons`;
    return {
      links: [
        { rel: "canonical", href: cuponsUrl },
      ],
      meta: [
        { title: `Cupons de Desconto e Ofertas — Farmácias Associadas` },
        { name: "description", content: "Economize em suas compras com cupons de desconto exclusivos da nossa farmácia. Copie seu código e aproveite ofertas especiais." },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
        { property: "og:title", content: "Cupons de Desconto — Farmácias Associadas" },
        { property: "og:description", content: "Confira todos os cupons disponíveis e garanta descontos especiais." },
        { property: "og:url", content: cuponsUrl },
        { property: "og:type", content: "website" },
      ],
    };
  },
  component: CuponsPage,
});

function CuponsPage() {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const rawStoreSlug = (params as any)?.storeSlug;
  const activePharmacy = useActivePharmacy();
  const { pharmacies, logoUrl: globalLogoUrl } = useAdmin();
  const { categories } = useAdminCategories();
  const { customProducts } = useAdminProducts();
  const { cupons } = useMarketing();
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId) || activePharmacy?.id;

  const isParceiro = activePharmacy?.categoriaAssociado === 'Parceiro';
  const isPleno = activePharmacy?.categoriaAssociado === 'Pleno' || activePharmacy?.isPleno === true;

  const storeSlug = (activePharmacy?.slug && activePharmacy.slug !== "loja-padrao")
    ? safeSlugify(activePharmacy.slug)
    : (rawStoreSlug && rawStoreSlug !== "loja-padrao")
    ? safeSlugify(rawStoreSlug)
    : "loja-padrao";

  const storeLogo = isParceiro 
    ? (activePharmacy?.logoUrl || activePharmacy?.footerLogoUrl)
    : (activePharmacy?.logoUrl || globalLogoUrl || logoUrlDefault);

  const storeDisplayName = activePharmacy?.nome || "Farmácias Associadas";

  // Filtra cupons ativos da loja selecionada / geral
  const storeCoupons = useMemo(() => {
    if (!cupons || cupons.length === 0) return [];
    const now = new Date();

    return cupons.filter((c: any) => {
      if (c.ativo === false) return false;

      // Validação de Loja
      const couponLojaId = c.lojaId || c.farmaciaId;
      if (selectedPharmacyId && couponLojaId && String(couponLojaId) !== String(selectedPharmacyId)) {
        return false;
      }

      // Validação de Data
      if (c.dataInicio && new Date(c.dataInicio) > now) return false;
      const validUntil = c.dataTermino || c.validade;
      if (validUntil && new Date(validUntil + (validUntil.includes('T') ? '' : 'T23:59:59')) < now) return false;

      return true;
    });
  }, [cupons, selectedPharmacyId]);

  const [filterType, setFilterType] = useState<"todos" | "percentual" | "fixo" | "frete">("todos");
  const [selectedCouponForRules, setSelectedCouponForRules] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredCoupons = useMemo(() => {
    return storeCoupons.filter((c: any) => {
      if (filterType === "todos") return true;
      if (filterType === "percentual") {
        return c.tipoDesconto === "percentual" || c.tipo === "percent" || Boolean(c.descontoPercentual);
      }
      if (filterType === "fixo") {
        return c.tipoDesconto === "fixo" || c.tipo === "fixed" || Boolean(c.descontoFixo);
      }
      if (filterType === "frete") {
        return Boolean(c.aplicarFreteGratis);
      }
      return true;
    });
  }, [storeCoupons, filterType]);

  const handleCopyCode = (codigo: string) => {
    if (!codigo) return;
    navigator.clipboard.writeText(codigo);
    setCopiedCode(codigo);
    toast.success(`Cupom ${codigo} copiado com sucesso!`);
    setTimeout(() => {
      setCopiedCode((prev) => (prev === codigo ? null : prev));
    }, 3000);
  };

  // Helper para resolver informações visuais dos alvos do cupom
  const getCouponTargetInfo = (coupon: any) => {
    const tipoAlvo = coupon.tipoAlvo || (coupon.produtosIds?.length ? "produtos" : (coupon.categoriasIds?.length ? "categorias" : "todos"));
    const alvos: string[] = coupon.alvosId || coupon.produtosIds || coupon.categoriasIds || [];

    if (tipoAlvo === "categorias" && alvos.length > 0) {
      const targetCats = categories.filter(c => alvos.map(String).includes(String(c.id)));
      if (targetCats.length === 1) {
        return {
          label: `na categoria ${targetCats[0].nome}`,
          targetType: "categoria",
          categorySlug: targetCats[0].slug,
          categoryName: targetCats[0].nome
        };
      }
      return {
        label: `em ${targetCats.length} categorias selecionadas`,
        targetType: "categorias",
        categories: targetCats
      };
    }

    if (tipoAlvo === "produtos" && alvos.length > 0) {
      const targetProds = (customProducts || []).filter(p => alvos.map(String).includes(String(p.id)) || (p.sku && alvos.includes(p.sku)));
      if (targetProds.length === 1) {
        return {
          label: `no produto ${targetProds[0].nome}`,
          targetType: "produto",
          product: targetProds[0]
        };
      }
      return {
        label: `em ${targetProds.length > 0 ? targetProds.length : alvos.length} produtos selecionados`,
        targetType: "produtos",
        products: targetProds
      };
    }

    return {
      label: "em produtos selecionados de toda a loja",
      targetType: "todos"
    };
  };

  return (
    <div className="bg-slate-50/50 min-h-screen pb-16">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-100">
        <div className="container-fa py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link to="/$storeSlug" params={{ storeSlug }} className="hover:text-primary transition-colors">
              Início
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-800 font-bold">Cupons de Desconto</span>
          </div>
        </div>
      </div>

      {/* HERO SECTION / APRESENTAÇÃO */}
      <div className="bg-gradient-to-br from-primary via-primary/95 to-slate-900 text-white py-10 sm:py-14 shadow-md relative overflow-hidden">
        {/* Elementos visuais decorativos de fundo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container-fa relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl text-center md:text-left space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-2xs">
                <Ticket className="h-4 w-4 text-amber-300" />
                <span>Cupons & Benefícios Exclusivos</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Garanta seus cupons
              </h1>

              <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-xl">
                Aproveite os melhores descontos da nossa farmácia para cuidar da sua saúde, bem-estar e beleza. Escolha o seu cupom, copie o código e economize!
              </p>
            </div>

            {/* Apresentação do Logo da Loja (Pleno ou Parceiro) */}
            <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/40 flex flex-col items-center text-center max-w-xs w-full">
              {storeLogo ? (
                <img 
                  src={storeLogo} 
                  alt={storeDisplayName}
                  className="max-h-16 h-auto w-auto object-contain mb-3" 
                />
              ) : (
                <div className="bg-primary/10 p-3 rounded-full mb-3 text-primary">
                  <Store className="h-8 w-8" />
                </div>
              )}
              <h2 className="font-bold text-slate-800 text-base line-clamp-1">{storeDisplayName}</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                <ShieldCheck className="h-3 w-3" /> Farmácia Verificada
              </span>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 w-full flex items-center justify-center gap-1 font-semibold">
                <Gift className="h-3.5 w-3.5 text-primary" />
                <span>{storeCoupons.length} {storeCoupons.length === 1 ? 'cupom disponível' : 'cupons disponíveis'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO "COMO UTILIZAR O CUPOM" */}
      <div className="container-fa -mt-6 relative z-20">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/80">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            Como utilizar seu cupom em 3 passos simples
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white font-black text-xs shrink-0 shadow-2xs">
                1
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Copie o código</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Escolha o cupom desejado abaixo e clique no botão para copiar o código.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white font-black text-xs shrink-0 shadow-2xs">
                2
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Escolha seus produtos</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Navegue pelos produtos participantes e adicione os itens na sua cesta de compras.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white font-black text-xs shrink-0 shadow-2xs">
                3
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Aplique no checkout</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cole o código no campo de cupom no carrinho ou checkout para receber seu desconto.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LISTA E FILTROS DE CUPONS */}
      <div className="container-fa mt-8 space-y-6">
        {/* Filtros rápidos */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-800">Cupons Disponíveis</h2>
            <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
              {filteredCoupons.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterType("todos")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterType === "todos"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Todos ({storeCoupons.length})
            </button>
            <button
              onClick={() => setFilterType("percentual")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterType === "percentual"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Porcentagem (%)
            </button>
            <button
              onClick={() => setFilterType("fixo")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterType === "fixo"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Valor Fixo (R$)
            </button>
            <button
              onClick={() => setFilterType("frete")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterType === "frete"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Frete Grátis
            </button>
          </div>
        </div>

        {/* Grid de Cupons */}
        {filteredCoupons.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 space-y-4 max-w-lg mx-auto">
            <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto text-primary">
              <Ticket className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Nenhum cupom encontrado neste filtro</h3>
            <p className="text-sm text-slate-500">
              Fique de olho em nossas promoções para não perder cupons exclusivos em breve.
            </p>
            <Button variant="outline" onClick={() => setFilterType("todos")}>
              Ver todos os cupons
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoupons.map((coupon: any) => {
              const code = coupon.codigo || coupon.code || "";
              const isPercent = coupon.tipoDesconto === "percentual" || coupon.tipo === "percent" || Boolean(coupon.descontoPercentual);
              const val = Number(coupon.valorDesconto || coupon.valor || coupon.descontoPercentual || coupon.descontoFixo || 0);
              const targetInfo = getCouponTargetInfo(coupon);
              const isCopied = copiedCode === code;

              return (
                <div
                  key={coupon.id || code}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group"
                >
                  {/* Topo do Card: Imagem / Ícone ilustrativo */}
                  <div className="p-6 pb-4 flex flex-col items-center justify-center min-h-[140px] bg-gradient-to-b from-slate-50/70 to-white relative">
                    {coupon.aplicarFreteGratis && (
                      <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Truck className="h-3 w-3" /> Frete Grátis
                      </span>
                    )}

                    {coupon.cupomPrimeiraCompra && (
                      <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> 1ª Compra
                      </span>
                    )}

                    {targetInfo.targetType === "produto" && targetInfo.product ? (
                      <img
                        src={productImage(targetInfo.product)}
                        alt=""
                        className="h-24 w-24 object-contain transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-105 shadow-inner">
                        <Ticket className="h-10 w-10 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Linha pontilhada divisória estilo Cupom com recortes */}
                  <div className="relative flex items-center justify-between my-1">
                    <div className="h-4 w-4 rounded-r-full bg-slate-50/50 border border-l-0 border-slate-200 shrink-0" />
                    <div className="flex-1 border-b-2 border-dashed border-slate-200 mx-2" />
                    <div className="h-4 w-4 rounded-l-full bg-slate-50/50 border border-r-0 border-slate-200 shrink-0" />
                  </div>

                  {/* Corpo do Cupom: Desconto, Regra e Ações */}
                  <div className="p-6 pt-3 flex-1 flex flex-col justify-between text-center space-y-4">
                    <div className="space-y-1">
                      <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                        {isPercent ? `${val}% OFF` : `R$ ${val.toFixed(2)} OFF`}
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 line-clamp-2 px-2">
                        {targetInfo.label}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      {/* Botão de Código Copiar + Seta de navegação */}
                      <div className="flex items-stretch rounded-lg shadow-sm border border-primary/20 overflow-hidden bg-primary text-white">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(code)}
                          className="flex-1 py-3 px-4 flex items-center justify-center gap-2 font-mono font-black text-sm uppercase tracking-wider hover:bg-primary/90 active:scale-[0.99] transition-colors"
                          title="Clique para copiar o código do cupom"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-300" />
                              <span>COPIADO!</span>
                            </>
                          ) : (
                            <>
                              <span>{code}</span>
                              <Copy className="h-4 w-4 text-white/80" />
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (targetInfo.categorySlug) {
                              navigate({ to: "/$storeSlug/c/$slug", params: { storeSlug, slug: targetInfo.categorySlug } });
                            } else {
                              navigate({ to: "/$storeSlug/busca", params: { storeSlug } });
                            }
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-3.5 flex items-center justify-center transition-colors border-l border-white/20"
                          title="Explorar produtos participantes"
                        >
                          <ChevronRight className="h-5 w-5 font-black" />
                        </button>
                      </div>

                      {/* Link de Condições */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setSelectedCouponForRules(coupon)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          Condições
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE CONDIÇÕES DO CUPOM */}
      <Dialog open={!!selectedCouponForRules} onOpenChange={(open) => !open && setSelectedCouponForRules(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Ticket className="h-5 w-5 text-primary" />
              Regras do Cupom {selectedCouponForRules?.codigo}
            </DialogTitle>
          </DialogHeader>

          {selectedCouponForRules && (
            <div className="space-y-4 text-sm text-slate-600 pt-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="text-base font-bold text-slate-800 pb-2 border-b border-slate-200 flex items-center justify-between">
                  <span>Desconto:</span>
                  <span className="text-primary font-black text-lg">
                    {selectedCouponForRules.tipoDesconto === "percentual" 
                      ? `${selectedCouponForRules.valorDesconto}% OFF` 
                      : `R$ ${Number(selectedCouponForRules.valorDesconto || 0).toFixed(2)} OFF`}
                  </span>
                </div>

                {selectedCouponForRules.valorMinimo > 0 && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                    <span>Valor mínimo da compra: <strong>{brl(selectedCouponForRules.valorMinimo)}</strong></span>
                  </p>
                )}

                {selectedCouponForRules.dataTermino && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Válido até: <strong>{new Date(selectedCouponForRules.dataTermino + (selectedCouponForRules.dataTermino.includes('T') ? '' : 'T23:59:59')).toLocaleDateString('pt-BR')}</strong></span>
                  </p>
                )}

                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  <span>{getCouponTargetInfo(selectedCouponForRules).label}</span>
                </p>

                {selectedCouponForRules.aplicarFreteGratis && (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Inclui frete grátis</span>
                  </p>
                )}

                {selectedCouponForRules.descricao && (
                  <p className="text-xs text-slate-500 italic pt-2 border-t border-slate-200">
                    "{selectedCouponForRules.descricao}"
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedCouponForRules(null)}
                  className="flex-1"
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    handleCopyCode(selectedCouponForRules.codigo);
                    setSelectedCouponForRules(null);
                  }}
                  className="flex-1 font-bold"
                >
                  Copiar Cupom
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

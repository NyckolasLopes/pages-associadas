import { createFileRoute, Link } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { useAdminProducts } from "@/stores/products";
import { useCart, getEffectivePrice } from "@/stores/cart";
import { useMarketing } from "@/stores/marketing";
import { useLive } from "@/stores/live";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, Phone, Clock, MessageCircle, Truck, Store, 
  Search, Tag, Sparkles, Star, ChevronRight, Check, ShoppingBag, ShieldCheck, Heart 
} from "lucide-react";
import { brl, productImage } from "@/lib/format";
import { toast } from "sonner";
import { sanitizeCouponCode } from "@/lib/security";
import type { Produto } from "@/types";

export const Route = createFileRoute("/_store/loja/$lojaId")({
  head: ({ params }) => {
    // Local SEO Injection
    return {
      meta: [
        { title: `Farmácia Associada — Unidade ${params.lojaId} | Medicamentos & Ofertas Locais` },
        { name: "description", content: "Compre online na Farmácia Associada mais próxima de você com entrega expressa e atendimento direto via WhatsApp." },
        { name: "robots", content: "index, follow" },
      ],
    };
  },
  component: LojaStorefrontPage,
});

function LojaStorefrontPage() {
  const { lojaId } = Route.useParams();
  const { pharmacies, banners, coupons, setSelectedPharmacyId } = useAdmin();
  const { products } = useAdminProducts();
  const { lojaPromocoes } = useMarketing();
  const { addItem, applyCoupon, appliedCoupon } = useCart();
  const { recordLojaAccess, pingSession } = useLive();

  const loja = pharmacies.find((p) => p.id === lojaId) || pharmacies[0];
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Define esta loja como a loja ativa no carrinho e registra o acesso da página da loja
  useEffect(() => {
    if (loja?.id) {
      setSelectedPharmacyId(loja.id);
      recordLojaAccess(loja.id);
      
      const sessionId = sessionStorage.getItem("fa-visitor-session") || Math.random().toString(36).substring(2);
      sessionStorage.setItem("fa-visitor-session", sessionId);
      pingSession(sessionId, loja.id);
    }
  }, [loja?.id, setSelectedPharmacyId, recordLojaAccess, pingSession]);

  // Banners locais
  const lojaBanners = useMemo(() => {
    return banners.filter((b) => (b.lojaId === lojaId || b.farmaciaId === lojaId || !b.lojaId) && b.ativo);
  }, [banners, lojaId]);

  // Cupons da loja
  const lojaCoupons = useMemo(() => {
    return coupons.filter((c) => (c.lojaId === lojaId || c.farmaciaId === lojaId || !c.lojaId) && c.ativo);
  }, [coupons, lojaId]);

  // Filtro de produtos da loja com preços locais
  const lojaProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.ativo) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = p.nome.toLowerCase().includes(term);
        const matchesEan = p.ean?.toLowerCase().includes(term);
        const matchesBrand = p.marca?.toLowerCase().includes(term);
        if (!matchesName && !matchesEan && !matchesBrand) return false;
      }
      if (selectedCategory !== "todos") {
        if (p.categoriaId !== selectedCategory && !p.categoriasAdicionais?.includes(selectedCategory)) {
          return false;
        }
      }
      return true;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleCopyCoupon = (code: string) => {
    applyCoupon(code);
    setCopiedCoupon(code);
    toast.success(`Cupom "${code}" copiado e aplicado ao seu carrinho!`);
    setTimeout(() => setCopiedCoupon(null), 3000);
  };

  const handleAddToCart = (product: Produto) => {
    addItem(product, 1);
    toast.success(`${product.nome} adicionado ao carrinho!`);
  };

  const rawPhone = loja?.whatsapp || loja?.telefone || "51999999999";
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const targetWhatsApp = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

  // Schema.org Local SEO JSON-LD
  const schemaJsonLd = {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    "name": `Farmácias Associadas - ${loja?.nome}`,
    "image": "https://farmaciasassociadas.com.br/logo.png",
    "telephone": loja?.telefone || loja?.whatsapp,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": loja?.endereco,
      "addressLocality": loja?.cidade,
      "addressRegion": loja?.uf,
      "postalCode": loja?.cep,
      "addressCountry": "BR",
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": loja?.lat || -30.0346,
      "longitude": loja?.lng || -51.2177,
    },
    "openingHours": loja?.horarioFuncionamento || "Mo-Sa 08:00-21:00",
    "priceRange": "$$",
    "areaServed": loja?.bairrosAtendidos || [loja?.bairro || "Centro"],
    "description": loja?.seoDescricao || `Farmácia completa em ${loja?.cidade}/${loja?.uf}. Atendimento humanizado e entrega rápida via WhatsApp.`,
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Script de SEO Estruturado Injetado (Schema.org / AEO / GEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />

      {/* Header Local da Loja */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white py-10 px-4 shadow-md">
        <div className="container-fa max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
                  Unidade Regional Oficial
                </Badge>
                <span className="flex items-center text-xs text-emerald-400 font-medium gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Aberta agora
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{loja?.nome}</h1>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{loja?.endereco}, {loja?.bairro} - {loja?.cidade}/{loja?.uf}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{loja?.horarioFuncionamento || "Seg a Sáb: 08h às 21h"}</span>
                </div>
              </div>
            </div>

            {/* Ação Direta WhatsApp */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <a
                href={`https://wa.me/${targetWhatsApp}?text=${encodeURIComponent(
                  `Olá! Estou visitando a página da ${loja?.nome} e gostaria de tirar uma dúvida.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black gap-2 h-12 px-6 shadow-lg hover:shadow-emerald-500/20">
                  <MessageCircle className="w-5 h-5 fill-current" />
                  Pedir no WhatsApp
                </Button>
              </a>

              <Link to="/cart">
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 font-bold h-12 gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Ver Carrinho
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fa max-w-6xl py-8 space-y-8">
        {/* Banner Carrossel Local */}
        {lojaBanners.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lojaBanners.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white group hover:shadow-md transition"
              >
                <img
                  src={b.imagemUrl}
                  alt={b.titulo}
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-3">
                  <h3 className="font-bold text-sm text-slate-800 line-clamp-1">{b.titulo}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cupons Disponíveis na Loja */}
        {lojaCoupons.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/30 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-amber-600" />
              <h3 className="font-black text-slate-900 text-base">Cupons Exclusivos desta Unidade</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {lojaCoupons.map((c) => (
                <div key={c.id} className="bg-white border border-amber-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="font-mono font-black text-sm text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {c.code}
                    </span>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      {c.tipo === "percent" || c.descontoPercentual ? `${c.valor || c.descontoPercentual}% OFF` : `${brl(c.valor || c.descontoFixo || 0)} OFF`}
                      {c.valorMinimo ? ` (Acima de ${brl(c.valorMinimo)})` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyCoupon(c.code)}
                    className="h-8 text-xs font-bold border-amber-500 text-amber-800 hover:bg-amber-500 hover:text-white"
                  >
                    {copiedCoupon === c.code || appliedCoupon === c.code ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <Check className="w-3.5 h-3.5" /> Aplicado
                      </span>
                    ) : (
                      "Aplicar"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barra de Busca de Produtos da Loja */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Buscar produtos em ${loja?.nome}...`}
              className="pl-10 text-sm h-11 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 w-full sm:w-auto justify-end">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Entrega nos bairros: {loja?.bairrosAtendidos?.slice(0, 3).join(", ") || loja?.bairro || "Região Central"}</span>
          </div>
        </div>

        {/* Catálogo de Produtos com Preços da Loja */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-slate-900">
              Produtos & Ofertas ({lojaProducts.length})
            </h2>
          </div>

          {lojaProducts.length === 0 ? (
            <div className="bg-white border rounded-2xl p-12 text-center text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-base text-slate-700">Nenhum produto encontrado para sua busca.</p>
              <p className="text-xs text-slate-500 mt-1">Tente buscar por outro termo ou nome de medicamento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {lojaProducts.map((p) => {
                const ep = getEffectivePrice(p, loja.id);
                const hasDiscount = ep.precoDe && ep.precoDe > ep.precoPor;

                return (
                  <div
                    key={p.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-200 group"
                  >
                    <div>
                      <div className="relative aspect-square w-full bg-slate-50 rounded-xl overflow-hidden p-2 flex items-center justify-center mb-3">
                        <img
                          src={p.possuiImagem ? productImage(p.id) : (p.imagem || "/placeholder.png")}
                          alt={p.nome}
                          className="max-h-full object-contain group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        {hasDiscount && (
                          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                            OFERTA
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">
                        {p.marca || "Associadas"}
                      </p>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug mt-1 group-hover:text-primary transition-colors">
                        {p.nome}
                      </h3>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <div>
                        {hasDiscount && (
                          <p className="text-xs text-slate-400 line-through">
                            {brl(ep.precoDe!)}
                          </p>
                        )}
                        <p className="text-lg font-black text-slate-900">
                          {brl(ep.precoPor)}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(p)}
                        className="w-full font-bold text-xs h-9 gap-1.5 rounded-xl"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé Informativo Local (SEO / GEO / AEO) */}
        <div className="bg-white border rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-primary font-black text-lg">
            <ShieldCheck className="w-6 h-6" />
            Sobre a {loja?.nome}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {loja?.seoDescricao || `A unidade ${loja?.nome} faz parte da Rede Farmácias Associadas, oferecendo atendimento farmacêutico especializado, linha completa de medicamentos, genéricos com desconto, perfumaria e dermocosméticos na região de ${loja?.cidade}/${loja?.uf}.`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t text-xs text-slate-600">
            <div>
              <strong>Endereço:</strong><br />
              {loja?.endereco}, {loja?.bairro}<br />
              {loja?.cidade} - {loja?.uf}, CEP {loja?.cep}
            </div>
            <div>
              <strong>Horário de Atendimento:</strong><br />
              {loja?.horarioFuncionamento || "Segunda a Sábado: 08:00 às 21:00"}
            </div>
            <div>
              <strong>Bairros Atendidos:</strong><br />
              {loja?.bairrosAtendidos?.join(", ") || "Consulte sua região pelo WhatsApp"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

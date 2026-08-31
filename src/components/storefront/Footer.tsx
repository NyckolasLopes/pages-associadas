import { Link, useLocation, useParams } from "@tanstack/react-router";
import {
  Instagram, Facebook, Linkedin, Youtube, CreditCard, Banknote, Wallet,
  Mail, Phone, MapPin, Send, Flame, Users, ShieldCheck, Smartphone, Link as LinkIcon, Music, Twitter, Twitch, Github, FileText
} from "lucide-react";

const SOCIAL_ICON_MAP: Record<string, React.FC<any>> = {
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Music,
  Twitter,
  Twitch,
  Github
};
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoAnvisa from "@/assets/logo-anvisa.png";
import logoUrlDefault from "@/assets/logo.png";
import asaasLogo from "@/assets/asaas-logo.png";
import paymentMethodsImg from "@/assets/payment-methods.png";
import { useAdmin } from "@/stores/admin";
import { useConfig } from "@/stores/config";
import { useLeads } from "@/stores/leads";
import { useCart } from "@/stores/cart";
import { useSearchHistory } from "@/stores/searchHistory";
import { useMemo, useEffect, useState } from "react";
import { useActivePharmacy } from "@/hooks/useActivePharmacy";
import { useAppInstallStore } from "@/stores/appInstall";

const TOP_TERMS = [
  "Dipirona", "Vitamina D", "Paracetamol", "Protetor solar", "Whey protein",
  "Fralda geriátrica", "Termômetro", "Anticoncepcional", "Omeprazol", "Glifage",
  "Ibuprofeno", "Vitamina C", "Desodorante", "Shampoo", "Creme anti-idade"
];
const RELATED_LINKS = [
  "vitamina c", "creme anti-idade", "fraldas", "suplementos", "dipirona", 
  "whey protein", "protetor solar", "shampoo antiqueda", "desodorante aerosol", 
  "termômetro digital", "leite em pó", "ômega 3", "absorvente", "colágeno", 
  "aparelho de pressão", "soro fisiológico", "remédio para dor", "escova dental", 
  "pasta de dente", "sabonete líquido", "anticoncepcional", "antialérgico"
];

export function Footer() {
  const { socialNetworks, contentPages = [] } = useAdmin();
  const { dadosLoja } = useConfig();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { getStoreBanners, pharmacies } = useAdmin();
  const activePharmacy = useActivePharmacy();
  const isParceiro = activePharmacy?.categoriaAssociado === 'Parceiro' || activePharmacy?.isPleno === false;
  const storeSlug = activePharmacy?.slug || "poa";
  const effectiveLojaId = activePharmacy?.id;
  const banners = getStoreBanners(effectiveLojaId);

  const diferenciaisBanners = banners.filter((b) => {
    if (b.posicao !== "Banner Diferenciais" || !b.active) return false;
    
    const hasLocalBannerForPosition = banners.some(
      local => local.lojaId === effectiveLojaId && local.posicao === b.posicao
    );

    if (effectiveLojaId) {
      if (b.lojaId) {
        if (b.lojaId !== effectiveLojaId) return false;
      } else {
        if (isParceiro) return false;
        if (hasLocalBannerForPosition) return false;
      }
    } else {
      if (b.lojaId) return false;
    }

    const now = new Date();
    if (b.startDate && new Date(b.startDate) > now) return false;
    if (b.endDate && new Date(b.endDate) < now) return false;
    return true;
  });
  
  const addLead = useLeads((s) => s.addLead);
  const getTopTerms = useSearchHistory((s) => s.getTopTerms);

  // Fallback to global config if no pharmacy has a description, though typically we use the active pharmacy
  const descricaoLoja = activePharmacy?.footerDescricao || activePharmacy?.pageTitle || dadosLoja.descricao || "Somos a maior rede associativa do Brasil.";
  const tituloCentralRelacionamento = activePharmacy?.footerTituloContato || "ENDEREÇO E INFORMAÇÕES";

  const storeSocials = useMemo(() => {
    const isValidUrl = (url?: string) => {
      if (!url) return false;
      const trimmed = url.trim();
      if (!trimmed || trimmed === "#" || trimmed === "http://" || trimmed === "https://" || trimmed === "/") return false;
      return true;
    };

    const formatLink = (url: string) => {
      const trimmed = url.trim();
      if (!trimmed || trimmed === "#") return "";
      if (!/^https?:\/\//i.test(trimmed)) {
        return `https://${trimmed}`;
      }
      return trimmed;
    };

    if (activePharmacy) {
      if (!activePharmacy.socialLinks) return [];
      const links = [];
      const sl = activePharmacy.socialLinks;
      if (isValidUrl(sl.instagram)) links.push({ id: 'ig', label: 'Instagram', href: formatLink(sl.instagram), iconName: 'Instagram' });
      if (isValidUrl(sl.facebook)) links.push({ id: 'fb', label: 'Facebook', href: formatLink(sl.facebook), iconName: 'Facebook' });
      if (isValidUrl(sl.tiktok)) links.push({ id: 'tk', label: 'TikTok', href: formatLink(sl.tiktok), iconName: 'Music' });
      if (isValidUrl(sl.linkedin)) links.push({ id: 'in', label: 'LinkedIn', href: formatLink(sl.linkedin), iconName: 'Linkedin' });
      if (isValidUrl(sl.youtube)) links.push({ id: 'yt', label: 'YouTube', href: formatLink(sl.youtube), iconName: 'Youtube' });
      return links;
    }

    return (socialNetworks || [])
      .filter(net => isValidUrl(net.href))
      .map(net => ({
        ...net,
        href: formatLink(net.href)
      }));
  }, [activePharmacy?.socialLinks, activePharmacy, socialNetworks]);

  const [topTerms, setTopTerms] = useState<string[]>(TOP_TERMS);

  useEffect(() => {
    if (activePharmacy?.id) {
      const dynamicTerms = getTopTerms(activePharmacy.id, 15);
      if (dynamicTerms.length < 15) {
        // Fallback: merge with default TOP_TERMS, removing duplicates
        const merged = Array.from(new Set([...dynamicTerms, ...TOP_TERMS])).slice(0, 15);
        setTopTerms(merged);
      } else {
        setTopTerms(dynamicTerms);
      }
    } else {
      setTopTerms(TOP_TERMS);
    }
  }, [activePharmacy?.id, getTopTerms]);

  // Páginas do Rodapé dinâmicas por categoria de loja
  const institucionalPages = useMemo(() => {
    if (isParceiro) {
      return [
        { id: "quem-somos", title: "Quem Somos", slug: "quem-somos", type: "text" },
        { id: "politica-de-privacidade", title: "Política de Privacidade", to: `/${storeSlug}/politica-de-privacidade` },
        { id: "trocas-e-devolucoes", title: "Trocas e Devoluções", slug: "trocas-e-devolucoes", type: "text" },
      ];
    }
    return contentPages.filter(p => (p.location === "footer" || p.location === "both") && p.footerColumn === "Institucional");
  }, [isParceiro, contentPages, storeSlug]);

  const navegacaoPages = useMemo(() => {
    if (isParceiro) {
      const list: any[] = [
        { id: "mapa-site", title: "Mapa do Site", to: `/${storeSlug}/mapa-site` },
        { id: "todas-categorias", title: "Categorias", to: `/${storeSlug}/c` },
        { id: "todas-marcas", title: "Marcas", to: `/${storeSlug}/m` },
      ];
      if (activePharmacy?.offersServices) {
        list.push({ id: "servicos", title: "Serviços Farmacêuticos", to: `/${storeSlug}/servicos` });
      }
      return list;
    }
    return contentPages.filter(p => (p.location === "footer" || p.location === "both") && p.footerColumn === "Navegação");
  }, [isParceiro, contentPages, activePharmacy?.offersServices, storeSlug]);

  const perfilPages = useMemo(() => {
    if (isParceiro) {
      return [
        { id: "criar-cadastro", title: "Criar Cadastro", to: `/${storeSlug}/cadastro` },
        { id: "alterar-dados", title: "Alterar Dados", to: `/${storeSlug}/perfil` },
        { id: "enderecos", title: "Endereços", to: `/${storeSlug}/perfil` },
        { id: "acompanhar-pedido", title: "Acompanhar Pedido", to: `/${storeSlug}/pedidos` },
      ];
    }
    return contentPages.filter(p => (p.location === "footer" || p.location === "both") && p.footerColumn === "Perfil");
  }, [isParceiro, contentPages, storeSlug]);

  const atendimentoPages = useMemo(() => {
    if (isParceiro) {
      const partnerPhone = (activePharmacy?.whatsapp || activePharmacy?.telefone || "").replace(/\D/g, "");
      const waUrl = partnerPhone ? `https://wa.me/55${partnerPhone}` : "https://wa.me/5551989444818";
      return [
        { id: "central-atendimento", title: "Central de Atendimento", slug: "central-atendimento", type: "text" },
        { id: "whatsapp", title: "WhatsApp", type: "external", externalUrl: waUrl },
        { id: "como-comprar", title: "Como Comprar", slug: "como-comprar", type: "text" },
        { id: "prazo-entrega", title: "Prazos e Entrega", slug: "prazo-entrega", type: "text" },
        { id: "reembolso", title: "Política de Reembolso", slug: "cancelamento", type: "text" },
        { id: "faq", title: "FAQ", to: `/${storeSlug}/faq` },
      ];
    }
    return contentPages.filter(p => 
      (p.location === "footer" || p.location === "both") && 
      p.footerColumn === "Atendimento" &&
      p.slug !== "formas-pagamento" &&
      p.slug !== "formas-de-pagamento" &&
      p.title?.toLowerCase() !== "formas de pagamento" &&
      p.title?.toLowerCase() !== "pagamento"
    );
  }, [isParceiro, contentPages, activePharmacy?.whatsapp, activePharmacy?.telefone, storeSlug]);

  const segurancaPages = useMemo(() => {
    if (isParceiro) {
      return [
        { id: "protecao-dados", title: "Proteção de Dados", slug: "protecao-dados", type: "text" },
        { id: "termos-de-uso", title: "Termos de Uso", slug: "termos-de-uso", type: "text" },
      ];
    }
    return contentPages.filter(p => (p.location === "footer" || p.location === "both") && p.footerColumn === "Segurança");
  }, [isParceiro, contentPages]);

  const renderPageItem = (p: any) => (
    <li key={p.id}>
      {p.to ? (
        <Link to={p.to} className="hover:underline">
          {p.title}
        </Link>
      ) : p.type === "external" ? (
        <a href={p.externalUrl} target={p.externalUrl?.startsWith("/") ? "_self" : "_blank"} rel="noreferrer" className="hover:underline">
          {p.title}
        </a>
      ) : (
        <Link to={`/${storeSlug}/pagina/${p.slug}` as any} className="hover:underline">
          {p.title}
        </Link>
      )}
    </li>
  );

  return (
    <>
      {/* Promo Banners */}
      {isHome && diferenciaisBanners.length > 0 && (
        <div className="container-fa py-8">
          <div className="flex md:grid md:grid-cols-3 lg:flex lg:justify-between lg:gap-4 gap-4 overflow-x-auto scrollbar-none snap-x pb-2">
            {/* Primeiro Card */}
            <a
              href={diferenciaisBanners[0].link || "#"}
              target={diferenciaisBanners[0].target || "_self"}
              className="shrink-0 snap-start w-[75vw] sm:w-[280px] md:w-auto lg:flex-1 block rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
            >
              <picture className="w-full block">
                {diferenciaisBanners[0].mobileImageUrl && <source media="(max-width: 768px)" srcSet={diferenciaisBanners[0].mobileImageUrl} />}
                <img src={diferenciaisBanners[0].imageUrl} alt="Banner 1" className="w-full h-auto object-cover aspect-[4/3] md:aspect-[3/2]" width={600} height={400} loading="lazy" decoding="async" />
              </picture>
            </a>
            
            {/* Segundo Card */}
            {diferenciaisBanners[0].imageUrl2 && (
              <a
                href={diferenciaisBanners[0].link2 || "#"}
                target="_self"
                className="shrink-0 snap-start w-[75vw] sm:w-[280px] md:w-auto lg:flex-1 block rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
              >
                <picture className="w-full block">
                  {diferenciaisBanners[0].mobileImageUrl2 && <source media="(max-width: 768px)" srcSet={diferenciaisBanners[0].mobileImageUrl2} />}
                  <img src={diferenciaisBanners[0].imageUrl2} alt="Banner 2" className="w-full h-auto object-cover aspect-[4/3] md:aspect-[3/2]" width={600} height={400} loading="lazy" decoding="async" />
                </picture>
              </a>
            )}

            {/* Terceiro Card */}
            {diferenciaisBanners[0].imageUrl3 && (
              <a
                href={diferenciaisBanners[0].link3 || "#"}
                target="_self"
                className="shrink-0 snap-start w-[75vw] sm:w-[280px] md:w-auto lg:flex-1 block rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
              >
                <picture className="w-full block">
                  {diferenciaisBanners[0].mobileImageUrl3 && <source media="(max-width: 768px)" srcSet={diferenciaisBanners[0].mobileImageUrl3} />}
                  <img src={diferenciaisBanners[0].imageUrl3} alt="Banner 3" className="w-full h-auto object-cover aspect-[4/3] md:aspect-[3/2]" width={600} height={400} loading="lazy" decoding="async" />
                </picture>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Links Relacionados (Antes do Footer) */}
      {isHome && (
        <div className="bg-slate-50 border-t border-slate-200">
          <div className="container-fa py-8">
            <div className="flex items-center gap-2 mb-6">
              <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />
              <h2 className="text-xl font-black text-slate-700 tracking-tight">LINKS RELACIONADOS</h2>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {RELATED_LINKS.map((link) => (
                <Link
                  key={link}
                  to="/$storeSlug/busca"
                  params={{ storeSlug } as any}
                  search={{ q: link } as any}
                  className="bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 transition px-3 py-1.5 rounded text-[13px] md:text-sm font-medium"
                >
                  {link}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer 
        className="pb-24 md:pb-0"
        style={{ 
          backgroundColor: 'var(--footer-bg, var(--primary))',
          color: 'var(--footer-text, var(--primary-foreground))'
        }}
      >
        {/* Pre-Footer Cards */}
        <div className="bg-secondary text-white border-b border-white/15">
        <div className="container-fa py-6 grid md:grid-cols-2 gap-4">
          <button 
            type="button" 
            onClick={() => {
              useAppInstallStore.getState().open();
              window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
            }}
            className="flex items-center text-left gap-4 bg-white text-primary p-4 rounded-lg border border-transparent hover:border-primary transition shadow-sm group cursor-pointer w-full"
          >
            <div className="h-12 w-12 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition overflow-hidden">
              {activePharmacy?.faviconUrl ? (
                <img src={activePharmacy.faviconUrl} alt="App" className="h-8 w-8 object-contain" />
              ) : (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              )}
            </div>
            <div>
              <h4 className="font-bold text-sm">
                Baixe o App {activePharmacy?.categoriaAssociado === 'Parceiro' && activePharmacy.nome ? activePharmacy.nome : ""}
              </h4>
              <p className="text-xs opacity-90">Tenha a farmácia na palma da sua mão e ofertas exclusivas.</p>
            </div>
          </button>
          <a href={`https://wa.me/55${(activePharmacy?.whatsapp || dadosLoja.whatsapp || activePharmacy?.telefone || dadosLoja.telefone)?.replace(/\D/g, "") || "5133633900"}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white text-primary p-4 rounded-lg border border-transparent hover:border-primary transition shadow-sm group">
            <div className="h-12 w-12 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-sm">Fale Conosco</h4>
              <p className="text-xs opacity-90">WhatsApp {activePharmacy?.whatsapp || dadosLoja.whatsapp || activePharmacy?.telefone || dadosLoja.telefone}</p>
            </div>
          </a>
        </div>
      </div>

      {/* Top: search terms + newsletter */}
      <div className="border-b border-white/15">
        <div className="container-fa py-8 grid lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-80 mb-3">
              Termos mais procurados
            </h3>
            <div className="flex flex-wrap gap-2">
              {topTerms.map((t) => (
                <Link
                  key={t}
                  to="/$storeSlug/busca"
                  params={{ storeSlug } as any}
                  search={{ q: t } as any}
                  className="inline-block"
                >
                  <Badge variant="outline" className="border-white/40 text-white hover:bg-white hover:text-primary-dark transition cursor-pointer">
                    {t}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-80 mb-3">
              Receba ofertas exclusivas
            </h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const emailInput = form.elements.namedItem("email") as HTMLInputElement;
                if (emailInput && emailInput.value) {
                  addLead({
                    email: emailInput.value,
                    dataCadastro: new Date().toLocaleString('pt-BR'),
                    origem: "Newsletter",
                    status: "Ativo",
                    lojaId: activePharmacy?.id,
                    lojaNome: activePharmacy?.pageTitle || dadosLoja.nomeLoja
                  });
                  toast.success("Inscrição realizada com sucesso!");
                  form.reset();
                }
              }} 
              className="flex gap-2"
            >
              <Input
                type="email"
                name="email"
                required
                placeholder="Seu melhor e-mail"
                style={isParceiro ? {
                  backgroundColor: 'var(--news-input-bg, #ffffff)',
                  color: 'var(--news-input-text, inherit)',
                  borderColor: 'var(--news-input-border, var(--border))'
                } : undefined}
                className="bg-white text-foreground placeholder:text-muted-foreground"
              />
              <Button 
                type="submit" 
                variant="secondary" 
                style={isParceiro ? {
                  backgroundColor: 'var(--news-btn-bg, var(--secondary))',
                  color: 'var(--news-btn-text, var(--secondary-foreground))'
                } : undefined}
                className="shrink-0"
              >
                <Send className="h-4 w-4 mr-1" /> Inscrever
              </Button>
            </form>
            <p className="text-[11px] opacity-75 mt-2">
              Ao inscrever-se, você concorda com nossa{" "}
              <Link to="/$storeSlug/politica-de-privacidade" params={{ storeSlug }} className="underline">
                Política de Privacidade
              </Link>.
            </p>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="container-fa py-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-sm">
        <Col title="Institucional">
          {institucionalPages.map(renderPageItem)}
        </Col>

        <Col title="Navegação">
          {navegacaoPages.map(renderPageItem)}
        </Col>

        {(!isParceiro || activePharmacy?.offersServices) && (
          <Col title="Serviços">
            {contentPages.filter(p => (p.location === "footer" || p.location === "both") && p.footerColumn === "Serviços").map(renderPageItem)}
          </Col>
        )}

        <Col title="Perfil">
          {perfilPages.map(renderPageItem)}
        </Col>

        <Col title="Atendimento">
          {atendimentoPages.map(renderPageItem)}
        </Col>

        <Col title="Segurança">
          {segurancaPages.map(renderPageItem)}
        </Col>
      </div>

      {/* Brand + Social */}
      <div className="border-t border-white/15">
        <div className="container-fa py-8 grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <Link to="/$storeSlug" params={{ storeSlug }} className="inline-flex items-center">
              {isParceiro && !activePharmacy?.footerLogoUrl && !activePharmacy?.logoUrl ? (
                <span className="font-bold text-xl text-white">{activePharmacy?.nome}</span>
              ) : (
                <img
                  src={activePharmacy?.footerLogoUrl || activePharmacy?.logoUrl || (isParceiro ? "" : ((dadosLoja as any)?.logoUrl || (dadosLoja as any)?.logo || logoUrlDefault))}
                  alt="Logo Rodapé"
                  className="h-12 bg-white rounded-md p-2 w-auto object-contain"
                  loading="lazy"
                />
              )}
            </Link>
            <p className="mt-3 text-sm opacity-90">
              {descricaoLoja}
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              {storeSocials.map((net) => {
                const IconComp = net.iconName ? (SOCIAL_ICON_MAP[net.iconName] || LinkIcon) : LinkIcon;
                return (
                  <Social key={net.id} label={net.label} href={net.href}>
                    {net.iconUrl ? (
                      <img src={net.iconUrl} alt={net.label} className="h-4 w-4 object-contain" />
                    ) : (
                      <IconComp className="h-4 w-4" />
                    )}
                  </Social>
                );
              })}
            </div>
          </div>

          <div className="text-sm space-y-2 opacity-95">
            <h3 className="font-bold uppercase text-xs tracking-wider opacity-80">{tituloCentralRelacionamento}</h3>
            {(activePharmacy?.cnpj || !isParceiro) && (
              <div className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0" /> CNPJ: {activePharmacy?.cnpj || (!isParceiro ? dadosLoja.cnpj : '')}</div>
            )}
            {(!isParceiro || activePharmacy?.endereco) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                {activePharmacy?.endereco || (!isParceiro ? dadosLoja.endereco : '')}, {activePharmacy?.numero || (!isParceiro ? dadosLoja.numero : '')}{activePharmacy?.complemento ? ` - ${activePharmacy.complemento}` : (!isParceiro && dadosLoja.complemento ? ` - ${dadosLoja.complemento}` : '')} {activePharmacy?.bairro ? `— ${activePharmacy.bairro}` : (!isParceiro ? `— ${dadosLoja.bairro}` : '')}, {activePharmacy?.cidade || (!isParceiro ? dadosLoja.cidade : '')}/{activePharmacy?.uf || (!isParceiro ? dadosLoja.estado : '')} {activePharmacy?.cep ? `— CEP ${activePharmacy.cep}` : (!isParceiro ? `— CEP ${dadosLoja.cep}` : '')}
              </div>
            )}
            {(activePharmacy?.telefone || !isParceiro) && (
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {activePharmacy?.telefone || (!isParceiro ? dadosLoja.telefone : '')}</div>
            )}
            {(activePharmacy?.whatsapp || !isParceiro) && (
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> WhatsApp: {activePharmacy?.whatsapp || (!isParceiro ? dadosLoja.whatsapp : '')}</div>
            )}
            {(activePharmacy?.email || !isParceiro) && (
              <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {activePharmacy?.email || (!isParceiro ? dadosLoja.email : '')}</div>
            )}
          </div>

        </div>
      </div>

      {/* Legal */}
      <div 
        className="bg-white text-slate-800 border-t-4 border-accent"
        style={isParceiro ? {
          backgroundColor: 'var(--footer-bottom-bg, #ffffff)',
          color: 'var(--footer-bottom-text, #1e293b)'
        } : undefined}
      >
        <div className="container-fa py-6">
          <div 
            className="text-[11px] leading-relaxed break-words overflow-hidden w-full max-w-full"
            style={isParceiro ? { color: 'var(--footer-bottom-text, #334155)' } : undefined}
          >
            {activePharmacy?.footerPlataformaTexto ? (
              <p className="whitespace-pre-wrap break-words">{activePharmacy.footerPlataformaTexto}</p>
            ) : (
              <>
                <p className="break-words">
                  <strong>Plataforma Digital de Vendas da Rede:</strong> {activePharmacy?.razaoSocial || dadosLoja.razaoSocial} | CNPJ: {activePharmacy?.cnpj || dadosLoja.cnpj} | {activePharmacy?.endereco || dadosLoja.endereco}, {activePharmacy?.numero || dadosLoja.numero}{activePharmacy?.complemento ? ` - ${activePharmacy.complemento}` : (dadosLoja.complemento ? ` - ${dadosLoja.complemento}` : '')} - {activePharmacy?.bairro || dadosLoja.bairro} - {activePharmacy?.cidade || dadosLoja.cidade}/{activePharmacy?.uf || dadosLoja.estado} - CEP: {activePharmacy?.cep || dadosLoja.cep}
                </p>
                
                {activePharmacy?.footerAvisoLegal ? (
                  <p className="mt-2 text-justify whitespace-pre-wrap break-words">{activePharmacy.footerAvisoLegal}</p>
                ) : (
                  <p className="mt-2 text-justify break-words">
                    <strong>AVISO LEGAL E RESPONSABILIDADE SANITÁRIA (RDC ANVISA 44/2009):</strong> Este site é uma vitrine digital de intermediação. A venda, a conferência de estoque, o faturamento (emissão da Nota Fiscal), a dispensação e a entrega dos produtos são de responsabilidade exclusiva da Farmácia Parceira da rede selecionada pelo consumidor no momento da compra. Os dados técnicos específicos do estabelecimento vendedor (Razão Social, CNPJ, AFE, CRF e Nome do Farmacêutico Responsável) serão apresentados detalhadamente na tela de resumo do pedido (checkout) e constarão obrigatoriamente no documento fiscal impresso entregue junto com as mercadorias. As informações contidas neste site não devem ser usadas para automedicação e não substituem, em hipótese alguma, as orientações dadas pelo profissional da área. Somente o médico e o farmacêutico estão aptos a diagnosticar qualquer problema de saúde e prescrever o tratamento adequado. Ao persistirem os sintomas, um médico deverá ser consultado. Os preços e promoções divulgados no site são válidos apenas para compras feitas pela internet. Todos os pedidos efetuados estão sujeitos à confirmação da disponibilidade de produto em nosso estoque. Maiores esclarecimentos, consultar o site: <a href="https://www.anvisa.gov.br" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary break-all">www.anvisa.gov.br</a>.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

          <div className="border-t border-slate-200/60 pb-6 md:pb-8">
            <div className="container-fa py-8 flex flex-col gap-8">
              {(activePharmacy?.anvisaLogoUrl || activePharmacy?.categoriaAssociado !== 'Parceiro') && (
                <div className="flex flex-col md:flex-row items-center justify-center w-full gap-10">
                <img
                  src={activePharmacy?.anvisaLogoUrl || logoAnvisa}
                  alt={activePharmacy?.anvisaLogoUrl ? "Selo da Anvisa" : "A Farmácias Associadas segue as normas e regulamentações da ANVISA"}
                  className="h-12 md:h-[68px] w-auto object-contain"
                  width={120}
                  height={68}
                  loading="lazy"
                  decoding="async"
                />
                </div>
              )}
              
              <div className="flex flex-col items-center justify-center gap-4 text-xs pt-6 border-t border-slate-100/50">
                <span 
                  className="text-center pb-24 md:pb-0"
                  style={isParceiro ? { color: 'var(--footer-bottom-text, #64748B)' } : undefined}
                >
                  © {new Date().getFullYear()} {activePharmacy?.nome || dadosLoja?.nomeLoja || "Farmácias Associadas"}. Todos os direitos reservados.
                </span>
              </div>
            </div>
          </div>
        </div>
    </footer>
    </>
  );
}

function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-bold mb-3 text-sm">{title}</h3>
      <ul className="space-y-2 text-sm opacity-90">{children}</ul>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return <li className="hover:underline cursor-pointer">{children}</li>;
}


function Social({ label, href, children }: { label: string; href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      style={{
        backgroundColor: 'var(--social-icons-bg, #ffffff)',
        color: 'var(--social-icons, var(--secondary, #00B5AD))'
      }}
      className="h-8 w-8 rounded-full hover:opacity-90 flex items-center justify-center transition shadow-sm"
    >
      {children}
    </a>
  );
}

function PayBadge({ label, icon }: { label?: string; icon?: React.ReactNode }) {
  return (
    <div className="h-8 px-2 rounded bg-white text-slate-800 text-[11px] font-bold flex items-center min-w-[44px] justify-center shadow-sm">
      {icon ?? label}
    </div>
  );
}

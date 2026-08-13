import { Link, useLocation } from "@tanstack/react-router";
import {
  Instagram, Facebook, Linkedin, Youtube, CreditCard, Banknote, Wallet,
  Mail, Phone, MapPin, Send, Flame, Users, ShieldCheck, Smartphone, Link as LinkIcon, Music, Twitter, Twitch, Github
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
import asaasLogo from "@/assets/asaas-logo.png";
import paymentMethodsImg from "@/assets/payment-methods.png";
import { useAdmin } from "@/stores/admin";
import { useConfig } from "@/stores/config";
import { useLeads } from "@/stores/leads";
import { useCart } from "@/stores/cart";
import { useMemo } from "react";

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
  const banners = useAdmin((s) => s.banners);
  const diferenciaisBanners = banners.filter((b) => b.posicao === "Banner Diferenciais" && b.active);
  const addLead = useLeads((s) => s.addLead);

  const { pharmacies } = useAdmin();
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const activePharmacy = useMemo(() => {
    return pharmacies.find(p => p.id === selectedPharmacyId) || pharmacies[0] || null;
  }, [pharmacies, selectedPharmacyId]);

  // Fallback to global config if no pharmacy has a description, though typically we use the active pharmacy
  const descricaoLoja = activePharmacy?.pageTitle || dadosLoja.descricao;

  return (
    <>
      {/* Promo Banners */}
      {isHome && diferenciaisBanners.length > 0 && (
        <div className="container-fa py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:flex lg:justify-between lg:gap-4 gap-4 overflow-x-auto scrollbar-none snap-x">
            {/* Primeiro Card */}
            <a
              href={diferenciaisBanners[0].link || "#"}
              target={diferenciaisBanners[0].target || "_self"}
              className="shrink-0 snap-start w-[280px] md:w-auto lg:flex-1 block rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
            >
              <picture>
                {diferenciaisBanners[0].mobileImageUrl && <source media="(max-width: 768px)" srcSet={diferenciaisBanners[0].mobileImageUrl} />}
                <img src={diferenciaisBanners[0].imageUrl} alt="Banner 1" className="w-full h-auto object-cover aspect-[3/4]" width={300} height={400} loading="lazy" decoding="async" />
              </picture>
            </a>
            
            {/* Segundo Card */}
            {diferenciaisBanners[0].imageUrl2 && (
              <a
                href={diferenciaisBanners[0].link2 || "#"}
                target="_self"
                className="shrink-0 snap-start w-[280px] md:w-auto lg:flex-1 block rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
              >
                <picture>
                  {diferenciaisBanners[0].mobileImageUrl2 && <source media="(max-width: 768px)" srcSet={diferenciaisBanners[0].mobileImageUrl2} />}
                  <img src={diferenciaisBanners[0].imageUrl2} alt="Banner 2" className="w-full h-auto object-cover aspect-[3/4]" width={300} height={400} loading="lazy" decoding="async" />
                </picture>
              </a>
            )}

            {/* Terceiro Card */}
            {diferenciaisBanners[0].imageUrl3 && (
              <a
                href={diferenciaisBanners[0].link3 || "#"}
                target="_self"
                className="shrink-0 snap-start w-[280px] md:w-auto lg:flex-1 block rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
              >
                <picture>
                  {diferenciaisBanners[0].mobileImageUrl3 && <source media="(max-width: 768px)" srcSet={diferenciaisBanners[0].mobileImageUrl3} />}
                  <img src={diferenciaisBanners[0].imageUrl3} alt="Banner 3" className="w-full h-auto object-cover aspect-[3/4]" width={300} height={400} loading="lazy" decoding="async" />
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
                  to="/busca"
                  search={{ q: link }}
                  className="bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 transition px-3 py-1.5 rounded text-[13px] md:text-sm font-medium"
                >
                  {link}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="bg-primary text-primary-foreground">
        {/* Pre-Footer Cards */}
      <div className="bg-secondary text-white border-b border-white/15">
        <div className="container-fa py-6 grid md:grid-cols-2 gap-4">
          <a href="#" className="flex items-center gap-4 bg-white text-primary p-4 rounded-lg border border-transparent hover:border-primary transition shadow-sm group">
            <div className="h-12 w-12 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            </div>
            <div>
              <h4 className="font-bold text-sm">Baixe nosso App</h4>
              <p className="text-xs opacity-90">Tenha a farmácia na palma da sua mão e ofertas exclusivas.</p>
            </div>
          </a>
          <a href={`tel:${(activePharmacy?.telefone || dadosLoja.telefone)?.replace(/\\D/g, "") || "5133633900"}`} className="flex items-center gap-4 bg-white text-primary p-4 rounded-lg border border-transparent hover:border-primary transition shadow-sm group">
            <div className="h-12 w-12 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Fale Conosco</h4>
              <p className="text-xs opacity-90">Ligue {activePharmacy?.telefone || dadosLoja.telefone} ou WhatsApp {activePharmacy?.whatsapp || dadosLoja.whatsapp}.</p>
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
              {TOP_TERMS.map((t) => (
                <Link
                  key={t}
                  to="/busca"
                  search={{ q: t }}
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
                const formData = new FormData(e.currentTarget);
                const email = formData.get("email") as string;
                if (email) {
                  addLead({
                    email,
                    dataCadastro: new Date().toLocaleString('pt-BR'),
                    origem: "Newsletter",
                    status: "Ativo"
                  });
                  toast.success("Inscrição realizada — bem-vindo(a)!"); 
                  e.currentTarget.reset();
                }
              }}
              className="flex gap-2"
            >
              <Input
                type="email"
                name="email"
                required
                placeholder="Seu melhor e-mail"
                className="bg-white text-foreground placeholder:text-muted-foreground"
              />
              <Button type="submit" variant="secondary" className="shrink-0">
                <Send className="h-4 w-4 mr-1" /> Inscrever
              </Button>
            </form>
            <p className="text-[11px] opacity-75 mt-2">
              Ao inscrever-se, você concorda com nossa{" "}
              <Link to="/ajuda/$page" params={{ page: "privacidade" }} className="underline">
                Política de Privacidade
              </Link>.
            </p>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="container-fa py-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-sm">
        <Col title="Institucional">
          {contentPages.filter(p => (p.location === "footer" || p.location === "both") && p.footerColumn === "Institucional").map(p => (
            <li key={p.id}>
              {p.type === "external" ? (
                <a href={p.externalUrl} target="_blank" rel="noreferrer" className="hover:underline">
                  {p.title}
                </a>
              ) : (
                <Link to={"/pagina/$slug" as any} params={{ slug: p.slug } as any} className="hover:underline">
                  {p.title}
                </Link>
              )}
            </li>
          ))}
        </Col>

        <Col title="Navegação">
          <li><Link to={"/mapa-site" as any} className="hover:underline">Mapa do Site</Link></li>
          <li><Link to={"/departamentos" as any} className="hover:underline">Categorias</Link></li>
          <li><Link to={"/busca" as any} search={{ q: "marcas" } as any} className="hover:underline">Marcas</Link></li>
          <li><Link to="/busca" search={{ q: "principios-ativos" }} className="hover:underline">Princípios Ativos</Link></li>
          <li><Link to="/busca" search={{ q: "classes-terapeuticas" }} className="hover:underline">Classes Terapêuticas</Link></li>
          <li><Link to="/busca" search={{ q: "bulas" }} className="hover:underline">Bulas de A a Z</Link></li>
        </Col>

        <Col title="Serviços">
          <li><Link to="/busca" search={{ q: "servicos" }} className="hover:underline">Serviços de Saúde</Link></li>
          <li><Link to="/busca" search={{ q: "vacinas" }} className="hover:underline">Vacinas</Link></li>
          <li><Link to="/busca" search={{ q: "testes rapidos" }} className="hover:underline">Testes Rápidos</Link></li>
          <li><Link to="/busca" search={{ q: "afericao" }} className="hover:underline">Aferição de Pressão</Link></li>
        </Col>

        <Col title="Perfil">
          <li><Link to="/login" className="hover:underline">Criar Cadastro</Link></li>
          <li><Link to="/perfil" className="hover:underline">Alterar Dados</Link></li>
          <li><Link to="/perfil" className="hover:underline">Endereços</Link></li>
          <li><Link to="/perfil" className="hover:underline">Acompanhar Pedido</Link></li>
        </Col>

        <Col title="Atendimento">
          {contentPages.filter(p => (p.location === "footer" || p.location === "both") && p.footerColumn === "Atendimento").map(p => (
            <li key={p.id}>
              {p.type === "external" ? (
                <a href={p.externalUrl} target="_blank" rel="noreferrer" className="hover:underline">
                  {p.title}
                </a>
              ) : (
                <Link to={"/pagina/$slug" as any} params={{ slug: p.slug } as any} className="hover:underline">
                  {p.title}
                </Link>
              )}
            </li>
          ))}
        </Col>

        <Col title="Segurança">
          {contentPages.filter(p => (p.location === "footer" || p.location === "both") && p.footerColumn === "Segurança").map(p => (
            <li key={p.id}>
              {p.type === "external" ? (
                <a href={p.externalUrl} target="_blank" rel="noreferrer" className="hover:underline">
                  {p.title}
                </a>
              ) : (
                <Link to={"/pagina/$slug" as any} params={{ slug: p.slug } as any} className="hover:underline">
                  {p.title}
                </Link>
              )}
            </li>
          ))}
        </Col>
      </div>

      {/* Brand + Social + Payment */}
      <div className="border-t border-white/15">
        <div className="container-fa py-8 grid lg:grid-cols-3 gap-8 items-start">
          <div>
            <Logo className="h-12 bg-white rounded-md p-2" />
            <p className="mt-3 text-sm opacity-90">
              {descricaoLoja}
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              {socialNetworks.map((net) => {
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
            <h3 className="font-bold uppercase text-xs tracking-wider opacity-80">Central de Relacionamento</h3>
            <div className="flex items-start gap-2"><MapPin className="h-4 w-4 shrink-0 mt-0.5" />{activePharmacy?.endereco || dadosLoja.endereco}, {activePharmacy?.numero || dadosLoja.numero}{activePharmacy?.complemento ? ` - ${activePharmacy.complemento}` : (dadosLoja.complemento ? ` - ${dadosLoja.complemento}` : '')} — {activePharmacy?.bairro || dadosLoja.bairro}, {activePharmacy?.cidade || dadosLoja.cidade}/{activePharmacy?.uf || dadosLoja.estado} — CEP {activePharmacy?.cep || dadosLoja.cep}</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {activePharmacy?.telefone || dadosLoja.telefone}</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> WhatsApp: {activePharmacy?.whatsapp || dadosLoja.whatsapp}</div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {activePharmacy?.email || dadosLoja.email}</div>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-1">
            <div>
              <h3 className="font-bold uppercase text-xs tracking-wider opacity-80 mb-3">Formas de pagamento</h3>
              <div className="bg-white p-3 rounded-lg border border-transparent shadow-sm">
                <img src={paymentMethodsImg} alt="Formas de Pagamento" className="w-full h-auto object-contain mix-blend-multiply" width={300} height={40} loading="lazy" decoding="async" />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Legal */}
      <div className="bg-white text-slate-800 border-t-4 border-accent">
        <div className="container-fa py-6">
          <div className="text-[11px] leading-relaxed text-slate-700">
            {activePharmacy?.footerPlataformaTexto ? (
              <p className="whitespace-pre-wrap">{activePharmacy.footerPlataformaTexto}</p>
            ) : (
              <p>
                <strong>Plataforma Digital de Vendas da Rede:</strong> {activePharmacy?.razaoSocial || dadosLoja.razaoSocial} | CNPJ: {activePharmacy?.cnpj || dadosLoja.cnpj} | {activePharmacy?.endereco || dadosLoja.endereco}, {activePharmacy?.numero || dadosLoja.numero}{activePharmacy?.complemento ? ` - ${activePharmacy.complemento}` : (dadosLoja.complemento ? ` - ${dadosLoja.complemento}` : '')} - {activePharmacy?.bairro || dadosLoja.bairro} - {activePharmacy?.cidade || dadosLoja.cidade}/{activePharmacy?.uf || dadosLoja.estado} - CEP: {activePharmacy?.cep || dadosLoja.cep}
              </p>
            )}
            
            {activePharmacy?.footerAvisoLegal ? (
              <p className="mt-2 text-justify whitespace-pre-wrap">{activePharmacy.footerAvisoLegal}</p>
            ) : (
              <p className="mt-2 text-justify">
                <strong>AVISO LEGAL E RESPONSABILIDADE SANITÁRIA (RDC ANVISA 44/2009):</strong> Este site é uma vitrine digital de intermediação. A venda, a conferência de estoque, o faturamento (emissão da Nota Fiscal), a dispensação e a entrega dos produtos são de responsabilidade exclusiva da Farmácia Parceira da rede selecionada pelo consumidor no momento da compra. Os dados técnicos específicos do estabelecimento vendedor (Razão Social, CNPJ, AFE, CRF e Nome do Farmacêutico Responsável) serão apresentados detalhadamente na tela de resumo do pedido (checkout) e constarão obrigatoriamente no documento fiscal impresso entregue junto com as mercadorias. As informações contidas neste site não devem ser usadas para automedicação e não substituem, em hipótese alguma, as orientações dadas pelo profissional da área. Somente o médico e o farmacêutico estão aptos a diagnosticar qualquer problema de saúde e prescrever o tratamento adequado. Ao persistirem os sintomas, um médico deverá ser consultado. Os preços e promoções divulgados no site são válidos apenas para compras feitas pela internet. Todos os pedidos efetuados estão sujeitos à confirmação da disponibilidade de produto em nosso estoque. Maiores esclarecimentos, consultar o site: <a href="https://www.anvisa.gov.br" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">www.anvisa.gov.br</a>.
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 pb-6 md:pb-8">
          <div className="container-fa py-8 flex flex-col gap-8">
            <div className="flex flex-col md:flex-row items-center justify-center w-full gap-10">
              <img
                src={logoAnvisa}
                alt="A Farmácias Associadas segue as normas e regulamentações da ANVISA"
                className="h-12 md:h-[68px] w-auto object-contain"
                width={120}
                height={68}
                loading="lazy"
                decoding="async"
              />
            </div>
            
            <div className="flex flex-col items-center justify-center gap-4 text-xs pt-6 border-t border-slate-100">
              <span className="text-center text-slate-500">
                © {new Date().getFullYear()} Farmácias Associadas. Todos os direitos reservados.
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
      aria-label={label}
      className="h-8 w-8 rounded-full bg-white text-secondary hover:bg-slate-100 flex items-center justify-center transition shadow-sm"
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useActivePharmacy, safeSlugify } from "@/hooks/useActivePharmacy";
import { useAdmin } from "@/stores/admin";
import { ChevronRight, Store, MapPin, Phone, Clock, ShieldCheck, Award, Heart, CheckCircle2 } from "lucide-react";
import { sanitizeHtml } from "@/lib/security";
import { getSafeMediaUrl } from "@/utils/media";
import { getBrandNameForHead } from "@/utils/brand";

export const Route = createFileRoute("/_store/$storeSlug/quem-somos")({
  head: () => ({
    meta: [
      { title: `Quem Somos — ${getBrandNameForHead()}` },
      { name: "description", content: "Conheça a história e o compromisso da nossa farmácia com a sua saúde." },
      { property: "og:title", content: "Quem Somos" },
    ],
  }),
  component: QuemSomosPage,
});

function QuemSomosPage() {
  const { storeSlug } = Route.useParams();
  const activePharmacy = useActivePharmacy();
  const { contentPages } = useAdmin();

  // Verifica se a loja possui página 'quem-somos' customizada em customPages
  const customQuemSomos = (activePharmacy?.customPages || []).find(
    (p: any) => p.slug === "quem-somos"
  );

  const globalQuemSomos = contentPages.find((p) => p.slug === "quem-somos");

  const storeName = activePharmacy?.nome || "Farmácias Associadas";
  const address = activePharmacy?.endereco || "Endereço em atualização";
  const city = activePharmacy?.cidade || "";
  const state = activePharmacy?.uf || activePharmacy?.estado || "RS";
  const phone = activePharmacy?.telefone || "(51) 3363-3900";
  const whatsapp = activePharmacy?.whatsapp;
  const cnpj = activePharmacy?.cnpj || "00.000.000/0000-00";
  const crf = activePharmacy?.crf || "CRF/RS";
  const farmaceutico = activePharmacy?.farmaceutico || "Farmacêutico(a) Responsável";
  const logoUrl = getSafeMediaUrl(activePharmacy?.logoUrl || activePharmacy?.faviconUrl);

  const isParceiro = activePharmacy?.categoriaAssociado === "Parceiro";

  return (
    <div className="bg-slate-50 min-h-[70vh] pb-24">
      {/* Top Breadcrumbs */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-xs">
        <div className="container-fa py-3">
          <nav className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <Link to="/$storeSlug" params={{ storeSlug }} className="hover:text-primary transition">
              Início
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-800 font-bold">Quem Somos</span>
          </nav>
        </div>
      </div>

      <div className="container-fa pt-8 max-w-5xl">
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/15 rounded-3xl p-6 md:p-12 mb-8 shadow-xs">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {logoUrl ? (
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-2xl bg-white border border-slate-200/80 p-3 shadow-md flex items-center justify-center shrink-0">
                <img src={logoUrl} alt={storeName} className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shrink-0">
                <Store className="h-14 w-14" />
              </div>
            )}

            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
                <Heart className="h-3.5 w-3.5" />
                {isParceiro ? "Farmácia Parceira Autorizada" : "Rede Farmácias Associadas"}
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
                {storeName}
              </h1>
              <p className="text-base text-slate-600 mt-3 leading-relaxed">
                Compromisso com a sua saúde, atendimento humano e a confiança que você e sua família merecem todos os dias.
              </p>
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 md:p-12 shadow-xs mb-8">
          {customQuemSomos?.content ? (
            <div
              className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(customQuemSomos.content) }}
            />
          ) : globalQuemSomos?.content ? (
            <div
              className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(globalQuemSomos.content) }}
            />
          ) : (
            <div className="space-y-6 text-slate-700 leading-relaxed">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Award className="h-6 w-6 text-primary" />
                  Nossa História e Propósito
                </h2>
                <p>
                  A <strong>{storeName}</strong> faz parte da maior rede de farmácias associativas do Brasil, aliando a força de uma grande marca ao carinho e proximidade do comércio local.
                </p>
                <p className="mt-3">
                  Nossa missão é promover o bem-estar e a saúde integral da comunidade de {city || "sua região"}, oferecendo produtos de qualidade comprovada, medicamentos com procedência garantida e atendimento acolhedor por farmacêuticos e profissionais qualificados.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                  <ShieldCheck className="h-8 w-8 text-primary mb-2" />
                  <span className="font-bold text-sm text-slate-800">Procedência 100%</span>
                  <span className="text-xs text-slate-500 mt-1">Medicamentos e cosméticos fiscalizados pela ANVISA.</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                  <Heart className="h-8 w-8 text-primary mb-2" />
                  <span className="font-bold text-sm text-slate-800">Cuidado Humano</span>
                  <span className="text-xs text-slate-500 mt-1">Orientação farmacêutica dedicada a você.</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                  <Store className="h-8 w-8 text-primary mb-2" />
                  <span className="font-bold text-sm text-slate-800">Comunidade Local</span>
                  <span className="text-xs text-slate-500 mt-1">Presente no seu bairro com entrega rápida e segura.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Store Info & Technical Data */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Localização e Contato
            </h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{address}{city ? `, ${city} - ${state}` : ""}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Telefone: <strong>{phone}</strong></span>
              </div>
              {whatsapp && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>WhatsApp: <strong>{whatsapp}</strong></span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Responsabilidade Técnica e Dados
            </h3>
            <div className="space-y-2.5 text-xs text-slate-600">
              <p><strong>Razão Social / Nome:</strong> {storeName}</p>
              <p><strong>CNPJ:</strong> {cnpj}</p>
              <p><strong>Farmacêutico(a) Responsável:</strong> {farmaceutico}</p>
              <p><strong>Registro Profissional:</strong> {crf}</p>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                Atendimento conforme as Boas Práticas Farmacêuticas e resoluções da Agência Nacional de Vigilância Sanitária (ANVISA).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

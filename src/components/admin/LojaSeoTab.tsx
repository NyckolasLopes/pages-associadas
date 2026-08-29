import { useState, useEffect } from "react";
import { useAdmin, type Pharmacy } from "@/stores/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Globe, CheckCircle2, Compass, Sparkles, AlertCircle } from "lucide-react";
import { sanitizeText } from "@/lib/security";
import { safeSlugify } from "@/hooks/useActivePharmacy";

export function LojaSeoTab({ lojaId }: { lojaId: string }) {
  const { pharmacies, updatePharmacy } = useAdmin();
  const pharmacy = pharmacies.find((p) => p.id === lojaId);

  const defaultTitle = pharmacy ? `Farmácias Associadas - ${pharmacy.nome} - ${pharmacy.cidade || "Sua Cidade"}/${pharmacy.uf || "RS"}` : "Farmácias Associadas";
  const defaultDesc = pharmacy ? `Sua farmácia completa em ${pharmacy.cidade || "sua região"}. Medicamentos, perfumaria, dermocosméticos e ofertas exclusivas com entrega rápida em ${pharmacy.bairro || pharmacy.cidade || "sua localidade"}.` : "Compre online com entrega rápida e os melhores preços.";

  const [pageTitle, setPageTitle] = useState(pharmacy?.pageTitle || defaultTitle);
  const [metaDesc, setMetaDesc] = useState(pharmacy?.metaDescription || pharmacy?.seoDescricao || defaultDesc);

  const [facebookPixelId, setFacebookPixelId] = useState(pharmacy?.facebookPixelId || "");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(pharmacy?.googleAnalyticsId || "");
  const [googleTagManagerId, setGoogleTagManagerId] = useState(pharmacy?.googleTagManagerId || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (pharmacy) {
      setPageTitle(pharmacy.pageTitle || `Farmácias Associadas - ${pharmacy.nome} - ${pharmacy.cidade || "Sua Cidade"}/${pharmacy.uf || "RS"}`);
      setMetaDesc(pharmacy.metaDescription || pharmacy.seoDescricao || `Sua farmácia completa em ${pharmacy.cidade || "sua região"}. Medicamentos, perfumaria, dermocosméticos e ofertas exclusivas com entrega rápida em ${pharmacy.bairro || pharmacy.cidade || "sua localidade"}.`);
      setFacebookPixelId(pharmacy.facebookPixelId || "");
      setGoogleAnalyticsId(pharmacy.googleAnalyticsId || "");
      setGoogleTagManagerId(pharmacy.googleTagManagerId || "");
    }
  }, [pharmacy]);

  if (!pharmacy) {
    return <div className="text-sm text-slate-500">Loja não encontrada.</div>;
  }

  const storeDisplaySlug = pharmacy.slug ? safeSlugify(pharmacy.slug) : safeSlugify(pharmacy.nome || pharmacy.id);

  const handleSuggestTitle = () => {
    setPageTitle(`Farmácias Associadas - ${pharmacy.nome} - ${pharmacy.cidade || "Sua Cidade"}/${pharmacy.uf || "RS"}`);
    toast.info("Título sugerido aplicado!");
  };

  const handleSuggestDesc = () => {
    setMetaDesc(`Sua farmácia completa em ${pharmacy.cidade || "sua região"}. Medicamentos, perfumaria, dermocosméticos e ofertas exclusivas com entrega rápida em ${pharmacy.bairro || pharmacy.cidade || "sua localidade"}.`);
    toast.info("Meta descrição sugerida aplicada!");
  };

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const cleanPixel = facebookPixelId.trim().replace(/[^0-9a-zA-Z_-]/g, "");
      const cleanGa4 = googleAnalyticsId.trim().toUpperCase();
      const cleanGtm = googleTagManagerId.trim().toUpperCase();

      const updated: Pharmacy = {
        ...pharmacy,
        pageTitle: sanitizeText(pageTitle.trim(), 120),
        metaDescription: sanitizeText(metaDesc.trim(), 280),
        seoDescricao: sanitizeText(metaDesc.trim(), 280),
        facebookPixelId: cleanPixel,
        googleAnalyticsId: cleanGa4,
        googleTagManagerId: cleanGtm,
      };

      await updatePharmacy(pharmacy.id, updated);
      toast.success("Configurações de SEO e Pixels salvas e ativadas com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar SEO:", err);
      toast.error(`Erro ao salvar: ${err.message || "Erro desconhecido"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const titleLength = pageTitle.length;
  const descLength = metaDesc.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100 shadow-sm">
          <Globe className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Otimização para o Google (SEO Local)</h2>
          <p className="text-sm text-slate-500">
            Ajuste como sua loja aparece nas buscas do Google e configure pixels de rastreamento para anúncios.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Live Preview de SEO */}
        <div className="order-2 lg:order-1 space-y-4">
          <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="bg-slate-50/80 border-b pb-4">
              <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-700">
                <span>Prévia de como aparecerá no Google</span>
                <span className="text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Visualização em tempo real
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-white flex-1 space-y-6">
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2 max-w-full">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center p-1 border border-slate-200 overflow-hidden shrink-0">
                    <img 
                      src={pharmacy.logoUrl || "/icone-associadas.png"} 
                      alt="FA" 
                      className="w-full h-full object-contain" 
                      onError={(e) => { e.currentTarget.src = "/icone-associadas.png"; }} 
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] text-slate-800 font-semibold truncate leading-tight">
                      Farmácias Associadas
                    </div>
                    <div className="text-[12px] text-slate-500 truncate leading-tight">
                      https://farmaciasassociadas.com.br › {storeDisplaySlug}
                    </div>
                  </div>
                </div>
                
                <div className="text-[18px] md:text-[20px] font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug pt-1">
                  {pageTitle || `Farmácias Associadas - ${pharmacy.nome}`}
                </div>
                
                <div className="text-[13px] md:text-[14px] text-[#4d5156] leading-[1.55] mt-1 line-clamp-3">
                  {metaDesc || "Preencha a meta descrição para ver como a sua loja será exibida nos resultados de pesquisa."}
                </div>
              </div>

              <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100 space-y-2">
                <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600 shrink-0" />
                  Indexação e Dados Estruturados (Schema.org)
                </h4>
                <p className="text-xs text-blue-800/80 leading-relaxed">
                  As informações configuradas aqui são injetadas diretamente nas meta tags (<code className="bg-blue-100/80 px-1 rounded">&lt;title&gt;</code>, <code className="bg-blue-100/80 px-1 rounded">&lt;meta description&gt;</code>, <code className="bg-blue-100/80 px-1 rounded">OpenGraph</code>) e convertidas no formato estruturado <strong>Schema.org (Pharmacy / LocalBusiness)</strong> com endereço, coordenadas GPS, horário e contato da sua unidade.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulário de Configuração Local */}
        <div className="order-1 lg:order-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-white border-b pb-4">
              <CardTitle className="text-base font-bold">Dados para Buscas</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSaveSeo} className="space-y-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-slate-700">Título da Página (Google)</Label>
                    <button
                      type="button"
                      onClick={handleSuggestTitle}
                      className="text-xs text-primary font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Sugerir Título
                    </button>
                  </div>
                  <Input
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                    placeholder="Ex: Farmácias Associadas - Farmácia São Lucas - Farroupilha/RS"
                    className="border-slate-300"
                    maxLength={100}
                    required
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>O título principal em azul nas buscas.</span>
                    <span className={titleLength > 65 ? "text-amber-600 font-bold" : "text-emerald-600 font-semibold"}>
                      {titleLength}/65 caracteres recomendados
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-slate-700">Meta Descrição</Label>
                    <button
                      type="button"
                      onClick={handleSuggestDesc}
                      className="text-xs text-primary font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Sugerir Descrição
                    </button>
                  </div>
                  <Textarea
                    rows={3}
                    value={metaDesc}
                    onChange={(e) => setMetaDesc(e.target.value)}
                    className="border-slate-300 resize-none"
                    placeholder="Sua farmácia completa com entrega rápida..."
                    maxLength={250}
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>O resumo descritivo logo abaixo do título.</span>
                    <span className={descLength > 160 ? "text-amber-600 font-bold" : "text-emerald-600 font-semibold"}>
                      {descLength}/160 caracteres recomendados
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-4 border-t border-slate-100 mt-4">
                  <h3 className="text-base font-bold text-slate-800 mb-4">Pixels e Rastreamento</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-bold text-slate-700">Meta (Facebook) Pixel ID</Label>
                      <Input
                        value={facebookPixelId}
                        onChange={(e) => setFacebookPixelId(e.target.value)}
                        className="border-slate-300 font-mono text-sm"
                        placeholder="Ex: 123456789012345"
                      />
                      <p className="text-[11px] text-slate-500">
                        Usado para rastrear conversões de anúncios no Instagram e Facebook.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-bold text-slate-700">Google Analytics (GA4) ID</Label>
                      <Input
                        value={googleAnalyticsId}
                        onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                        className="border-slate-300 font-mono text-sm uppercase"
                        placeholder="Ex: G-XXXXXXXXXX"
                      />
                      <p className="text-[11px] text-slate-500">
                        Usado para análise de tráfego através do Google Analytics 4.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-bold text-slate-700">Google Tag Manager ID</Label>
                      <Input
                        value={googleTagManagerId}
                        onChange={(e) => setGoogleTagManagerId(e.target.value)}
                        className="border-slate-300 font-mono text-sm uppercase"
                        placeholder="Ex: GTM-XXXXXXX"
                      />
                      <p className="text-[11px] text-slate-500">
                        Usado para gerenciar tags e scripts avançados na loja.
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full font-bold gap-2 mt-6 bg-blue-600 hover:bg-blue-700 text-white h-11 shadow-sm transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSaving ? "Salvando Configurações..." : "Salvar Configurações"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}


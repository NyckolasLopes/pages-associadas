import { useState } from "react";
import { useAdmin, type Pharmacy } from "@/stores/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Globe, CheckCircle2, Compass } from "lucide-react";
import { sanitizeText } from "@/lib/security";

export function LojaSeoTab({ lojaId }: { lojaId: string }) {
  const { pharmacies, updatePharmacy } = useAdmin();
  const pharmacy = pharmacies.find((p) => p.id === lojaId);

  const [pageTitle, setPageTitle] = useState(
    pharmacy?.pageTitle || `Farmácias Associadas - ${pharmacy?.nome || "Minha Loja"}`
  );
  
  const [metaDesc, setMetaDesc] = useState(
    pharmacy?.metaDescription || pharmacy?.seoDescricao || 
    `Sua farmácia completa em ${pharmacy?.cidade || "sua região"}. Medicamentos, perfumaria, dermocosméticos e ofertas exclusivas com entrega rápida.`
  );

  const [bairrosAtendidos, setBairrosAtendidos] = useState(
    pharmacy?.bairrosAtendidos?.join(", ") || `${pharmacy?.bairro || "Centro"}, Bela Vista, Menino Deus`
  );

  const [raioEntregaKm, setRaioEntregaKm] = useState(pharmacy?.raioEntregaKm?.toString() || "8");

  if (!pharmacy) {
    return <div className="text-sm text-slate-500">Loja não encontrada.</div>;
  }

  const handleSaveSeo = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanBairros = bairrosAtendidos
      .split(",")
      .map((b) => sanitizeText(b.trim(), 50))
      .filter(Boolean);

    const updated: Pharmacy = {
      ...pharmacy,
      pageTitle: sanitizeText(pageTitle, 100),
      metaDescription: sanitizeText(metaDesc, 250),
      seoDescricao: sanitizeText(metaDesc, 250), // mantendo legado atualizado
      bairrosAtendidos: cleanBairros,
      raioEntregaKm: parseFloat(raioEntregaKm) || 8,
    };

    updatePharmacy(pharmacy.id, updated);
    toast.success("Otimização de Buscas Locais (SEO) salva com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
          <Globe className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Otimização para o Google (SEO Local)</h2>
          <p className="text-sm text-slate-500">
            Ajuste como sua loja aparece nas buscas para clientes da sua região.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Live Preview de SEO */}
        <div className="order-2 lg:order-1 space-y-4">
          <Card className="border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            <CardHeader className="bg-slate-50/80 border-b pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-700">
                Prévia de como aparecerá no Google
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-white flex-1">
              <div className="space-y-2 max-w-md">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center p-1 border">
                    <img src="/logo-icon.png" alt="FA" className="w-full h-full object-contain opacity-50" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    <span className="text-[10px] font-bold text-slate-400">FA</span>
                  </div>
                  <div>
                    <div className="text-[13px] text-slate-800 truncate font-medium">Farmácias Associadas</div>
                    <div className="text-[12px] text-slate-500 truncate">
                      https://farmaciasassociadas.com.br › loja › {pharmacy.id}
                    </div>
                  </div>
                </div>
                
                <div className="text-[20px] font-medium text-[#1a0dab] hover:underline cursor-pointer leading-tight pt-1">
                  {pageTitle || `Farmácias Associadas - ${pharmacy.nome}`}
                </div>
                
                <div className="text-[14px] text-[#4d5156] leading-[1.58] mt-1 line-clamp-2">
                  {metaDesc || "Preencha a meta descrição para ver como a sua loja será exibida nos resultados de pesquisa."}
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600" />
                  Indexação Automática
                </h4>
                <p className="text-xs text-blue-800/80 leading-relaxed">
                  As informações preenchidas são automaticamente convertidas em dados estruturados (Schema.org) internamente no site. Isso garante que o Google e outras plataformas entendam sua loja como uma unidade local distinta.
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
                  <Label className="text-sm font-bold text-slate-700">Título da Página (Google)</Label>
                  <Input
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                    placeholder="Ex: Farmácias Associadas - Filial Menino Deus"
                    className="border-slate-300"
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    O título principal que aparece em azul nas buscas. Use o nome do seu bairro ou cidade.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-700">Meta Descrição</Label>
                  <Textarea
                    rows={3}
                    value={metaDesc}
                    onChange={(e) => setMetaDesc(e.target.value)}
                    className="border-slate-300 resize-none"
                    placeholder="Sua farmácia completa com entrega rápida..."
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>O texto curto que aparece logo abaixo do título azul.</span>
                    <span className={metaDesc.length > 160 ? "text-amber-600 font-bold" : ""}>
                      {metaDesc.length}/160 caracteres (Recomendado)
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <Label className="text-sm font-bold text-slate-700">Regiões e Bairros Atendidos</Label>
                  <Input
                    value={bairrosAtendidos}
                    onChange={(e) => setBairrosAtendidos(e.target.value)}
                    className="border-slate-300"
                    placeholder="Ex: Centro, Cidade Baixa, Praia de Belas"
                  />
                  <p className="text-[11px] text-slate-500">
                    Separe por vírgula. Isso ajuda clientes que buscam por "farmácia que entrega no bairro X".
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-700">Raio Máximo de Entrega (em KM)</Label>
                  <Input
                    type="number"
                    value={raioEntregaKm}
                    onChange={(e) => setRaioEntregaKm(e.target.value)}
                    className="border-slate-300 bg-slate-50 max-w-[150px]"
                  />
                </div>

                <Button type="submit" className="w-full font-bold gap-2 mt-4 bg-blue-600 hover:bg-blue-700 text-white h-11">
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar Dados para Buscas
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

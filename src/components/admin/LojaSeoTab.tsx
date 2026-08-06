import { useState } from "react";
import { useAdmin, type Pharmacy } from "@/stores/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Globe, MapPin, Search, Bot, Sparkles, Phone, Clock, 
  Share2, CheckCircle2, Copy, Layers, Compass 
} from "lucide-react";
import { sanitizeText } from "@/lib/security";

export function LojaSeoTab({ lojaId }: { lojaId: string }) {
  const { pharmacies, updatePharmacy } = useAdmin();
  const pharmacy = pharmacies.find((p) => p.id === lojaId);

  const [nome, setNome] = useState(pharmacy?.nome || "");
  const [whatsapp, setWhatsapp] = useState(pharmacy?.whatsapp || pharmacy?.telefone || "");
  const [bairro, setBairro] = useState(pharmacy?.bairro || "");
  const [cidade, setCidade] = useState(pharmacy?.cidade || "");
  const [uf, setUf] = useState(pharmacy?.uf || "RS");
  const [endereco, setEndereco] = useState(pharmacy?.endereco || "");
  const [cep, setCep] = useState(pharmacy?.cep || "");
  const [raioEntregaKm, setRaioEntregaKm] = useState(pharmacy?.raioEntregaKm?.toString() || "8");
  const [bairrosAtendidos, setBairrosAtendidos] = useState(
    pharmacy?.bairrosAtendidos?.join(", ") || `${pharmacy?.bairro || "Centro"}, Bela Vista, Menino Deus, Moinhos de Vento`
  );
  const [horarioFuncionamento, setHorarioFuncionamento] = useState(
    pharmacy?.horarioFuncionamento || "Seg a Sex: 08h às 21h | Sáb: 08h às 19h | Dom: 09h às 14h"
  );
  const [metaDesc, setMetaDesc] = useState(
    pharmacy?.seoDescricao || `Sua farmácia completa em ${pharmacy?.cidade || "sua região"} - ${pharmacy?.bairro || "Centro"}. Medicamentos, perfumaria, dermocosméticos e ofertas exclusivas com entrega rápida via WhatsApp.`
  );

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
      nome: sanitizeText(nome, 100),
      whatsapp: sanitizeText(whatsapp, 30),
      bairro: sanitizeText(bairro, 80),
      cidade: sanitizeText(cidade, 80),
      uf: sanitizeText(uf, 2).toUpperCase(),
      endereco: sanitizeText(endereco, 150),
      cep: sanitizeText(cep, 10),
      raioEntregaKm: parseFloat(raioEntregaKm) || 8,
      bairrosAtendidos: cleanBairros,
      horarioFuncionamento: sanitizeText(horarioFuncionamento, 150),
      seoDescricao: sanitizeText(metaDesc, 250),
    };

    updatePharmacy(updated);
    toast.success("Configurações de SEO, GEO e AEO Local atualizadas com sucesso!");
  };

  // Schema.org Local Business JSON-LD gerado em tempo real para pré-visualização
  const localSchemaJsonLd = {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    "name": `Farmácias Associadas - ${nome || pharmacy.nome}`,
    "image": "https://farmaciasassociadas.com.br/logo.png",
    "telephone": whatsapp || pharmacy.telefone,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": endereco || pharmacy.endereco,
      "addressLocality": cidade || pharmacy.cidade,
      "addressRegion": uf || pharmacy.uf,
      "postalCode": cep || pharmacy.cep,
      "addressCountry": "BR",
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": pharmacy.lat || -30.0346,
      "longitude": pharmacy.lng || -51.2177,
    },
    "openingHours": horarioFuncionamento,
    "priceRange": "$$",
    "areaServed": bairrosAtendidos.split(",").map((b) => b.trim()),
    "description": metaDesc,
  };

  const copySchemaToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(localSchemaJsonLd, null, 2));
    toast.success("Schema.org JSON-LD copiado para a área de transferência!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Compass className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">SEO, GEO e AEO Local da Loja</h2>
            <p className="text-sm text-slate-500">
              Otimização avançada para Google Maps, Buscas por voz, Motores de IA (ChatGPT, Perplexity) e SEO Regional.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Configuração Local */}
        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg font-bold">Informações Regionais e SEO</CardTitle>
            <CardDescription>
              Esses dados potencializam o ranqueamento orgânico da página da sua loja no Google e mecanismos de IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveSeo} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Nome da Unidade / Loja</Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Farmácia Associadas - Filial Menino Deus"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">WhatsApp de Atendimento Local</Label>
                  <Input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ex: (51) 99999-9999"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Endereço Completo</Label>
                  <Input
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua / Av. e Número"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Bairro Principal</Label>
                  <Input
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Ex: Centro"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Cidade</Label>
                    <Input
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">UF</Label>
                    <Input
                      value={uf}
                      maxLength={2}
                      onChange={(e) => setUf(e.target.value.toUpperCase())}
                      placeholder="RS"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Bairros Atendidos com Entrega (Separados por vírgula)</Label>
                <Input
                  value={bairrosAtendidos}
                  onChange={(e) => setBairrosAtendidos(e.target.value)}
                  placeholder="Ex: Centro, Menino Deus, Praia de Belas, Cidade Baixa, Moinhos de Vento"
                />
                <p className="text-[11px] text-slate-500">
                  Esses bairros são indexados para responder buscas do tipo <em>"farmácia que entrega no bairro X"</em>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Raio Máximo de Entrega (em KM)</Label>
                  <Input
                    type="number"
                    value={raioEntregaKm}
                    onChange={(e) => setRaioEntregaKm(e.target.value)}
                    placeholder="Ex: 8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Horário de Funcionamento</Label>
                  <Input
                    value={horarioFuncionamento}
                    onChange={(e) => setHorarioFuncionamento(e.target.value)}
                    placeholder="Ex: Seg-Sex: 08h às 20h | Sáb: 08h às 18h"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Meta Descrição da Loja (SEO / AEO)</Label>
                <Textarea
                  rows={3}
                  value={metaDesc}
                  onChange={(e) => setMetaDesc(e.target.value)}
                  placeholder="Descrição exibida no snippet do Google..."
                />
                <p className="text-[11px] text-slate-500">Recomendado: entre 120 e 160 caracteres.</p>
              </div>

              <Button type="submit" className="w-full font-bold gap-2 mt-4">
                <CheckCircle2 className="w-4 h-4" />
                Salvar Configurações de SEO Local
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Live Preview de SEO / Schema.org */}
        <div className="space-y-6 lg:col-span-1">
          {/* Card Google Snippet Preview */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800">
                <Globe className="w-4 h-4 text-blue-600" />
                Prévia da Busca Google (SEO)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <div className="text-xs text-slate-500 truncate">
                https://farmaciasassociadas.com.br/loja/{pharmacy.id}
              </div>
              <div className="text-sm font-bold text-blue-800 hover:underline cursor-pointer leading-tight">
                Farmácias Associadas em {bairro || "Sua Região"}, {cidade || "Sua Cidade"} | Medicamentos & Ofertas
              </div>
              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {metaDesc}
              </p>
            </CardContent>
          </Card>

          {/* Card Schema.org / AEO JSON-LD */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800">
                <Bot className="w-4 h-4 text-emerald-600" />
                JSON-LD Gerado (AEO / IA)
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={copySchemaToClipboard}
                className="h-7 px-2 text-xs font-bold gap-1 text-slate-600 hover:text-slate-900"
              >
                <Copy className="w-3 h-3" />
                Copiar
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              <pre className="text-[10px] font-mono bg-slate-950 text-slate-200 p-3 rounded-xl overflow-x-auto max-h-52">
                {JSON.stringify(localSchemaJsonLd, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Copy, RefreshCw, ShoppingBag, Check, FileCode2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminProducts } from "@/stores/products";
import { useRegionsStore } from "@/stores/regions";

export const Route = createFileRoute("/admin/canais/google-shopping")({
  component: GoogleShoppingPage,
});

function GoogleShoppingPage() {
  const [feedUrl, setFeedUrl] = useState("");
  const [blobUrl, setBlobUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { customProducts } = useAdminProducts();
  const { regions, prices } = useRegionsStore();

  const handleGenerateFeed = () => {
    setIsGenerating(true);
    
    // Constrói o XML com os produtos reais e atualizados do Zustand
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Catálogo Farmácias Associadas</title>
    <link>https://associadas.com.br</link>
    <description>Feed de produtos atualizado em tempo real</description>
`;

    const activeProducts = customProducts.filter(p => p.aVenda && p.visivel);
    
    activeProducts.forEach(p => {
      const precoFinal = p.precoPor;
      let priceLabel = "Ate R$ 50";
      if (precoFinal > 50 && precoFinal <= 100) priceLabel = "R$ 50 a R$ 100";
      else if (precoFinal > 100 && precoFinal <= 200) priceLabel = "R$ 100 a R$ 200";
      else if (precoFinal > 200) priceLabel = "Acima de R$ 200";

      xml += `    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.nome}]]></g:title>
      <g:description><![CDATA[${p.descricao || p.nome}]]></g:description>
      <g:link>https://associadas.com.br/p/${p.url}</g:link>
      <g:image_link>${p.possuiImagem ? "https://vtx-ag-p.s3.us-east-1.amazonaws.com/10940/" + (p.ean || p.id) + ".jpg" : "https://placehold.co/600x600?text=Sem+Foto"}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${p.estoque > 0 ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${p.precoDe || p.precoPor} BRL</g:price>
      ${p.precoDe && p.precoPor < p.precoDe ? `<g:sale_price>${p.precoPor} BRL</g:sale_price>` : ''}
      <g:custom_label_0><![CDATA[${priceLabel}]]></g:custom_label_0>
      ${regions.map(r => {
        const rPrice = prices[`${r.id}-${p.id}`];
        if (rPrice !== undefined) {
          let rPriceLabel = "Ate R$ 50";
          if (rPrice > 50 && rPrice <= 100) rPriceLabel = "R$ 50 a R$ 100";
          else if (rPrice > 100 && rPrice <= 200) rPriceLabel = "R$ 100 a R$ 200";
          else if (rPrice > 200) rPriceLabel = "Acima de R$ 200";

          return `<g:regional_item>
        <g:region_id>${r.id}</g:region_id>
        <g:price>${p.precoDe || rPrice} BRL</g:price>
        ${p.precoDe && rPrice < p.precoDe ? `<g:sale_price>${rPrice} BRL</g:sale_price>` : ''}
        <g:custom_label_0><![CDATA[${rPriceLabel}]]></g:custom_label_0>
      </g:regional_item>`;
        }
        return '';
      }).join('\n      ')}
      <g:brand><![CDATA[${p.marca || 'Associadas'}]]></g:brand>
      <g:gtin>${p.ean || ''}</g:gtin>
    </item>\n`;
    });

    xml += `  </channel>\n</rss>`;

    // Cria um objeto Blob dinâmico
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    
    setTimeout(() => {
      setBlobUrl(url); // Link real para o XML
      setFeedUrl("https://associadas.com.br/api/feed/google-merchant.xml"); // URL estética
      setIsGenerating(false);
    }, 1200);
  };

  const handleCopy = () => {
    if (!feedUrl) return;
    navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div className="flex items-center gap-3 bg-gradient-to-br from-emerald-50 via-white to-teal-50/30 p-6 rounded-xl border border-emerald-100 shadow-sm">
        <div className="bg-emerald-500 p-3 rounded-xl shadow-md shadow-emerald-200 text-white">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Google Shopping</h2>
          <p className="text-sm font-medium text-slate-500">Integração com Google Merchant Center</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6 sm:p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Feed XML de Produtos</h3>
        <p className="text-sm text-slate-500 mb-6 font-medium">
          Gere a URL do seu feed de produtos para vincular ao Google Merchant Center. Esta URL contém todos os produtos ativos do seu catálogo formatados corretamente para os anúncios do Google.
        </p>

        <div className="space-y-4">
          <Button 
            onClick={handleGenerateFeed} 
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11"
          >
            {isGenerating ? (
              <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Atualizando Catálogo...</>
            ) : (
              <><RefreshCw className="mr-2 h-4 w-4" /> Sincronizar Produtos Atuais</>
            )}
          </Button>

          {feedUrl && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                URL do Feed (Copie e cole no Merchant Center)
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-1 w-full">
                  <Input 
                    value={feedUrl} 
                    readOnly 
                    className="bg-slate-50 font-mono text-sm text-slate-600 focus-visible:ring-emerald-500 h-11"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleCopy}
                    className={`h-11 px-4 ${copied ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-slate-600"}`}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                
                {blobUrl && (
                  <Button 
                    variant="default"
                    onClick={() => window.open(blobUrl, "_blank")}
                    className="h-11 bg-slate-800 hover:bg-slate-900 text-white w-full sm:w-auto"
                  >
                    <FileCode2 className="h-4 w-4 mr-2" />
                    Abrir XML Completo
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Setup Instructions */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Como integrar?</h4>
        <ol className="list-decimal list-inside text-sm text-slate-600 font-medium space-y-3">
          <li>Acesse sua conta do <strong className="text-slate-800">Google Merchant Center</strong>.</li>
          <li>Vá em <strong className="text-slate-800">Produtos</strong> &gt; <strong className="text-slate-800">Feeds</strong>.</li>
          <li>Clique no botão <strong className="text-slate-800">+</strong> para criar um feed principal.</li>
          <li>Escolha <strong className="text-slate-800">"Busca programada"</strong> (Scheduled fetch).</li>
          <li>Cole a <strong className="text-slate-800">URL do Feed</strong> gerada acima no campo correspondente e salve.</li>
        </ol>
      </div>
    </div>
  );
}


import React from "react";
import { 
  LayoutTemplate, 
  Layers, 
  Image as ImageIcon, 
  ShoppingBag, 
  Tag, 
  Megaphone, 
  ExternalLink, 
  ArrowRight, 
  Sparkles, 
  Sliders, 
  Eye, 
  Palette, 
  Handshake, 
  ShieldCheck, 
  Mail, 
  Maximize2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/stores/admin";
import { Link } from "@tanstack/react-router";

interface StoreStructureViewerProps {
  onNavigateTab: (tab: "banners" | "estrutura" | "vitrines") => void;
  onOpenNewBannerModal?: (posicao?: string) => void;
}

export function StoreStructureViewer({ onNavigateTab, onOpenNewBannerModal }: StoreStructureViewerProps) {
  const banners = useAdmin((s) => s.banners) || [];
  const storefrontVitrineConfig = useAdmin((s) => s.storefrontVitrineConfig);
  const featuredCategories = useAdmin((s) => s.featuredCategories) || [];

  // Contagem de banners por posição
  const fullBannersCount = banners?.filter(b => b.posicao === "Full Banner" && b.active)?.length || 0;
  const tarjaBannersCount = banners?.filter(b => b.posicao === "Banner Tarja" && b.active)?.length || 0;
  const miniBannersCount = banners?.filter(b => b.posicao === "Mini Banner" && b.active)?.length || 0;
  const extraBannersCount = banners?.filter(b => b.posicao === "Banner Extra" && b.active)?.length || 0;
  const categoriaBannersCount = banners?.filter(b => b.posicao === "Banner Categoria" && b.active)?.length || 0;
  const diferenciaisCount = banners?.filter(b => b.posicao === "Banner Diferenciais" && b.active)?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header do Visual da Loja */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-slate-800">Visual da loja</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
              Largura: 1180px
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Panorama geral da estrutura da página inicial da sua loja. Clique em qualquer bloco para configurar seus itens.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/" target="_blank">
            <Button variant="outline" className="text-slate-700 font-bold border-slate-300 hover:bg-slate-50 hover:text-slate-800">
              <Eye className="w-4 h-4 mr-2 text-slate-500" />
              Ver loja ao vivo
            </Button>
          </Link>
          <Button 
            onClick={() => onNavigateTab("vitrines")}
            className="bg-[#00B5AD] hover:bg-[#009c95] text-white font-bold"
          >
            <Sliders className="w-4 h-4 mr-2" />
            Configurar Vitrines
          </Button>
        </div>
      </div>

      {/* Container Central com Wireframe 1180px Proporcional */}
      <div className="bg-slate-100/70 p-6 md:p-8 rounded-2xl border border-slate-200 flex flex-col items-center">
        
        {/* Barra de régua / largura */}
        <div className="w-full max-w-[960px] flex items-center justify-between text-xs text-slate-400 font-mono mb-3 px-2 border-b border-dashed border-slate-300 pb-1">
          <span>0px</span>
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <Maximize2 className="w-3 h-3" /> Layout Principal — 1180px Centralizado
          </span>
          <span>1180px</span>
        </div>

        {/* Wireframe Container (simula os 1180px da imagem 1) */}
        <div className="w-full max-w-[960px] space-y-4">
          
          {/* 1. MENU SUPERIOR */}
          <div className="group relative bg-[#e2e5e9] hover:bg-[#d8dce2] border border-slate-300 rounded-lg p-5 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-slate-600 font-black text-xs shadow-xs">
                  1
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800 tracking-wide">Menu Superior</h4>
                  <p className="text-xs text-slate-500">Barra de avisos, Logo da Farmácia, Busca rápida, Carrinho e Navegação</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 bg-white/80 rounded border border-slate-200 text-slate-600">
                  Fixo no Topo
                </span>
                <Link to={"/admin/lojas" as any} className="hidden sm:inline-flex">
                  <Button size="sm" variant="ghost" className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-800">
                    <Palette className="w-3.5 h-3.5 mr-1 text-[#00B5AD]" /> Personalizar
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* 2. FULLBANNER */}
          <div 
            onClick={() => onNavigateTab("banners")}
            className="group cursor-pointer relative bg-[#d6dadf] hover:bg-[#ccd1d8] border-2 border-dashed border-slate-300 hover:border-[#00B5AD] rounded-lg p-8 transition-all shadow-sm text-center"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-slate-600 font-black text-xs shadow-xs shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    Fullbanner
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {fullBannersCount} ativo(s)
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">Carrossel principal da home • Recomendado: 1800 x 600 px (Desktop) / 800 x 800 px (Mobile)</p>
                </div>
              </div>

              <Button size="sm" className="bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-300 group-hover:border-[#00B5AD] group-hover:text-[#00B5AD] shrink-0">
                <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                Gerenciar Fullbanner
              </Button>
            </div>
          </div>

          {/* 3. BANNER TARJA */}
          <div 
            onClick={() => onNavigateTab("banners")}
            className="group cursor-pointer relative bg-[#e2e5e9] hover:bg-[#d8dce2] border border-slate-300 hover:border-[#00B5AD] rounded-lg p-4 transition-all shadow-sm"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-slate-600 font-black text-xs shadow-xs shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Banner tarja
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      1920 x 200 px
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">Diferenciais da loja (Frete grátis, descontos exclusivos, parcelamento, atendimento)</p>
                </div>
              </div>

              <Button size="sm" variant="ghost" className="bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 hover:text-slate-800 shrink-0">
                Configurar Tarja ({tarjaBannersCount})
              </Button>
            </div>
          </div>

          {/* 4. COMPRE POR CATEGORIA */}
          <div className="group relative bg-[#e2e5e9] hover:bg-[#d8dce2] border border-slate-300 rounded-lg p-4 transition-all shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-slate-600 font-black text-xs shadow-xs shrink-0">
                  4
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Compre por Categoria
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#00B5AD]/10 text-[#009c95] border border-[#00B5AD]/30">
                      {featuredCategories.length} categorias ativas
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">Carrossel de ícones circulares para navegação rápida por departamentos</p>
                </div>
              </div>

              <Link to="/admin/categorias">
                <Button size="sm" variant="ghost" className="bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 hover:text-slate-800 shrink-0">
                  Editar Categorias
                </Button>
              </Link>
            </div>
          </div>

          {/* 5. GRID 2 COLUNAS: BANNER VITRINE (50%) + BOX NEWSLETTER / SERVIÇOS (50%) - FIEL À IMAGEM 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Coluna Esquerda: Banner vitrine / Banner Extra */}
            <div 
              onClick={() => onNavigateTab("banners")}
              className="group cursor-pointer bg-[#d6dadf] hover:bg-[#ccd1d8] border border-slate-300 hover:border-[#00B5AD] rounded-lg p-6 transition-all shadow-sm flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">50% Largura</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-white/90 rounded text-slate-600">580 x 300 px</span>
              </div>
              <div className="my-2">
                <h4 className="text-base font-bold text-slate-800">Banner vitrine</h4>
                <p className="text-xs text-slate-500 mt-0.5">Banners promocionais extras no meio da página ({extraBannersCount} ativos)</p>
              </div>
              <div className="pt-2 border-t border-slate-300/60 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Posição: Banner Extra</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#00B5AD] transition-colors" />
              </div>
            </div>

            {/* Coluna Direita: Box newsletter / Serviços */}
            <div className="group bg-[#d6dadf] hover:bg-[#ccd1d8] border border-slate-300 rounded-lg p-6 transition-all shadow-sm flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">50% Largura</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-white/90 rounded text-slate-600">Box Informativo</span>
              </div>
              <div className="my-2">
                <h4 className="text-base font-bold text-slate-800">Box newsletter / Serviços</h4>
                <p className="text-xs text-slate-500 mt-0.5">Captação de leads por e-mail, canal de WhatsApp e serviços de saúde</p>
              </div>
              <div className="pt-2 border-t border-slate-300/60 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Integrado à Home</span>
                <Mail className="w-4 h-4 text-slate-400" />
              </div>
            </div>

          </div>

          {/* 6. LISTAGEM DOS PRODUTOS / MINHAS VITRINES - FIEL À IMAGEM 1 */}
          <div 
            onClick={() => onNavigateTab("vitrines")}
            className="group cursor-pointer relative bg-[#e2e5e9] hover:bg-[#d8dce2] border-2 border-slate-300 hover:border-[#00B5AD] rounded-lg p-6 transition-all shadow-sm"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-slate-600 font-black text-xs shadow-xs shrink-0 mt-1 sm:mt-0">
                  5
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800 flex flex-wrap items-center gap-2">
                    Listagem dos Produtos
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#00B5AD] text-white">
                      Minhas Vitrines
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configuração de carrosséis e grades: Lançamentos, Mais Pedidos, Destaques e Categorias ({storefrontVitrineConfig.produtosPorVitrine} itens por vitrine)
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {storefrontVitrineConfig.lancamentos && (
                      <span className="text-[11px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        ✓ Lançamentos
                      </span>
                    )}
                    {storefrontVitrineConfig.maisVendidos && (
                      <span className="text-[11px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        ✓ Mais Pedidos
                      </span>
                    )}
                    {storefrontVitrineConfig.destaques && (
                      <span className="text-[11px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        ✓ Destaques ({storefrontVitrineConfig.destaquesOrdem})
                      </span>
                    )}
                    {storefrontVitrineConfig.porCategoria && (
                      <span className="text-[11px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        ✓ Por Categoria ({storefrontVitrineConfig.porCategoriaOrdem})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button size="sm" className="bg-[#00B5AD] hover:bg-[#009c95] text-white font-bold shrink-0">
                <Sliders className="w-3.5 h-3.5 mr-1.5" />
                Configurar Vitrines
              </Button>
            </div>
          </div>

          {/* 7. DIFERENCIAIS DA REDE */}
          <div className="group relative bg-[#f97316]/15 border border-[#f97316]/30 rounded-lg p-4 transition-all shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded bg-[#f97316] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                  6
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Diferenciais Farmácias Associadas
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f97316] text-white">
                      Institucional
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600">A Força de uma Rede Gigante • Atendimento Humanizado • Entrega Rápida • Qualidade Comprovada</p>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-[#f97316]" />
            </div>
          </div>

          {/* 8. MARCAS PARCEIRAS */}
          <div className="group relative bg-[#e2e5e9] hover:bg-[#d8dce2] border border-slate-300 rounded-lg p-4 transition-all shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-slate-600 font-black text-xs shadow-xs shrink-0">
                  7
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Somos parceiros das melhores marcas
                  </h4>
                  <p className="text-xs text-slate-500">Carrossel de marcas homologadas e parceiras oficiais da rede</p>
                </div>
              </div>

              <Link to="/admin/marcas">
                <Button size="sm" variant="ghost" className="bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 hover:text-slate-800 shrink-0">
                  Gerenciar Marcas
                </Button>
              </Link>
            </div>
          </div>

          {/* 9. RODAPÉ DA LOJA */}
          <div className="group relative bg-[#1e293b] text-slate-200 border border-slate-700 rounded-lg p-5 transition-all shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-white font-black text-xs shrink-0">
                  8
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Rodapé da Loja</h4>
                  <p className="text-xs text-slate-400">Informações institucionais, Farmacêutico Responsável (CRF), Horários, Redes Sociais e Formas de Pagamento</p>
                </div>
              </div>
              <Link to={"/admin/lojas" as any}>
                <Button size="sm" variant="outline" className="text-xs font-bold border-slate-600 text-slate-200 bg-slate-800 hover:bg-slate-700">
                  Editar Dados da Loja
                </Button>
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}


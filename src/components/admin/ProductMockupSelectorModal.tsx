import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Search, Check, Plus, Star, Image as ImageIcon, Filter } from "lucide-react";
import { checkIsGenerico } from "@/lib/format";
import type { Produto } from "@/types";

export interface MockupOption {
  id: string;
  nome: string;
  categoria: "generico" | "referencia" | "especial" | "outros";
  categoriaNome: string;
  url: string;
  descricao: string;
  tarja?: string;
  badge: string;
  badgeColor: string;
}

export const PRODUCT_MOCKUPS: MockupOption[] = [
  // Genéricos
  {
    id: "generico-sem-tarja",
    nome: "Genérico - Sem Tarja (MIP)",
    categoria: "generico",
    categoriaNome: "Medicamentos Genéricos",
    url: "/produtos/generico-sem-tarja.webp",
    descricao: "Medicamento isento de prescrição médica com faixa amarela 'G'.",
    tarja: "Sem Tarja",
    badge: "Genérico MIP",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300"
  },
  {
    id: "generico-vermelha",
    nome: "Genérico - Tarja Vermelha",
    categoria: "generico",
    categoriaNome: "Medicamentos Genéricos",
    url: "/produtos/generico-vermelha.webp",
    descricao: "Venda sob prescrição médica com faixa amarela 'G' e tarja vermelha.",
    tarja: "Vermelha",
    badge: "Tarja Vermelha",
    badgeColor: "bg-red-100 text-red-800 border-red-300"
  },
  {
    id: "generico-vermelha-retencao",
    nome: "Genérico - Vermelha (Retém Receita)",
    categoria: "generico",
    categoriaNome: "Medicamentos Genéricos",
    url: "/produtos/generico-vermelha-retencao.webp",
    descricao: "Venda sob prescrição com retenção de receita obrigatória (Portaria 344/98).",
    tarja: "Vermelha Retém Receita",
    badge: "Retém Receita",
    badgeColor: "bg-red-200 text-red-950 border-red-400 font-bold"
  },
  {
    id: "generico-preta",
    nome: "Genérico - Tarja Preta",
    categoria: "generico",
    categoriaNome: "Medicamentos Genéricos",
    url: "/produtos/generico-preta.webp",
    descricao: "Medicamento controlado/psicotrópico com faixa amarela 'G' e tarja preta.",
    tarja: "Preta",
    badge: "Tarja Preta",
    badgeColor: "bg-slate-900 text-white border-slate-700"
  },

  // Referência e Similares
  {
    id: "ref-vermelha",
    nome: "Referência / Similar - Tarja Vermelha",
    categoria: "referencia",
    categoriaNome: "Referência e Similares",
    url: "/produtos/ref-vermelha.webp",
    descricao: "Medicamento de marca ou similar com tarja vermelha.",
    tarja: "Vermelha",
    badge: "Tarja Vermelha",
    badgeColor: "bg-red-100 text-red-800 border-red-300"
  },
  {
    id: "ref-vermelha-retencao",
    nome: "Referência / Similar - Vermelha (Retém Receita)",
    categoria: "referencia",
    categoriaNome: "Referência e Similares",
    url: "/produtos/ref-vermelha-retencao.webp",
    descricao: "Medicamento de marca ou similar com retenção de receita obrigatória.",
    tarja: "Vermelha Retém Receita",
    badge: "Retém Receita",
    badgeColor: "bg-red-200 text-red-950 border-red-400 font-bold"
  },
  {
    id: "ref-preta",
    nome: "Referência / Similar - Tarja Preta",
    categoria: "referencia",
    categoriaNome: "Referência e Similares",
    url: "/produtos/ref-preta.webp",
    descricao: "Medicamento de marca ou similar sob controle especial com tarja preta.",
    tarja: "Preta",
    badge: "Tarja Preta",
    badgeColor: "bg-slate-900 text-white border-slate-700"
  },
  {
    id: "sem-imagem",
    nome: "Padrão Institucional (Sem Tarja / Cosméticos)",
    categoria: "referencia",
    categoriaNome: "Referência e Similares",
    url: "/produtos/sem-imagem.webp",
    descricao: "Embalagem neutra institucional das Farmácias Associadas para higiene, MIPs e perfumaria.",
    tarja: "Sem Tarja",
    badge: "Padrão da Rede",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300"
  },

  // Formas e Dispositivos Especiais
  {
    id: "solucao-nasal",
    nome: "Gotas / Solução Nasal / Frasco",
    categoria: "especial",
    categoriaNome: "Dispositivos & Formas Especiais",
    url: "/produtos/solucao-nasal.webp",
    descricao: "Frascos conta-gotas, soros fisiológicos, soluções nasais e oftálmicas.",
    badge: "Gotas / Solução",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300"
  },
  {
    id: "aerolin",
    nome: "Spray Inalatório / Aerossol / Bombinha",
    categoria: "especial",
    categoriaNome: "Dispositivos & Formas Especiais",
    url: "/produtos/aerolin.webp",
    descricao: "Bombinhas inalatórias de asma, sprays orais e aerossóis respiratórios.",
    badge: "Spray / Inalação",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-300"
  },
  {
    id: "caneta-emagrecedora",
    nome: "Caneta Aplicadora Injetável",
    categoria: "especial",
    categoriaNome: "Dispositivos & Formas Especiais",
    url: "/produtos/caneta-emagrecedora.webp",
    descricao: "Canetas preenchidas injetáveis (insulinas, semaglutida, etc.).",
    badge: "Caneta Injetável",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300"
  },
  {
    id: "energy",
    nome: "Bebida Energética / Lata",
    categoria: "outros",
    categoriaNome: "Conveniência & Outros",
    url: "/produtos/energy.webp",
    descricao: "Bebidas energéticas, refrigerantes e produtos em embalagem de lata.",
    badge: "Lata / Bebida",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300"
  }
];

export function getRecommendedMockup(product: Partial<Produto>): MockupOption {
  const name = String(product?.nome || "").toLowerCase();
  const tarja = String(product?.tarja || "").toLowerCase();
  const retencao = Boolean(product?.retemReceita || (product as any)?.requiresReceita || product?.retemReceitaStatus === "retem");

  if (name.includes("aerolin") || name.includes("salbutamol") || name.includes("aerossol") || name.includes("bombinha")) {
    return PRODUCT_MOCKUPS.find(m => m.id === "aerolin")!;
  }

  if (name.includes("nasal") || name.includes("neosoro") || name.includes("naridrin") || name.includes("soro")) {
    return PRODUCT_MOCKUPS.find(m => m.id === "solucao-nasal")!;
  }
  
  if (name.includes("caneta") || name.includes("ozempic") || name.includes("saxenda") || name.includes("wegovy") || name.includes("mounjaro")) {
    return PRODUCT_MOCKUPS.find(m => m.id === "caneta-emagrecedora")!;
  }

  if (name.includes("energy") || name.includes("energia") || name.includes("energético") || name.includes("baly") || name.includes("monster") || name.includes("red bull")) {
    return PRODUCT_MOCKUPS.find(m => m.id === "energy")!;
  }

  const isGenerico = checkIsGenerico(product);

  if (isGenerico) {
    if (tarja.includes("preta")) {
      return PRODUCT_MOCKUPS.find(m => m.id === "generico-preta")!;
    }
    if (tarja.includes("vermelha")) {
      return retencao 
        ? PRODUCT_MOCKUPS.find(m => m.id === "generico-vermelha-retencao")! 
        : PRODUCT_MOCKUPS.find(m => m.id === "generico-vermelha")!;
    }
    return PRODUCT_MOCKUPS.find(m => m.id === "generico-sem-tarja")!;
  }

  if (tarja.includes("preta")) {
    return PRODUCT_MOCKUPS.find(m => m.id === "ref-preta")!;
  }

  if (tarja.includes("vermelha")) {
    return retencao 
      ? PRODUCT_MOCKUPS.find(m => m.id === "ref-vermelha-retencao")! 
      : PRODUCT_MOCKUPS.find(m => m.id === "ref-vermelha")!;
  }

  return PRODUCT_MOCKUPS.find(m => m.id === "sem-imagem")!;
}

interface ProductMockupSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Partial<Produto>;
  currentImages: Array<{ caminhoImagem?: string } | string>;
  onSelectMockup: (mockupUrl: string, asCover?: boolean) => void;
}

export const ProductMockupSelectorModal: React.FC<ProductMockupSelectorModalProps> = ({
  open,
  onOpenChange,
  product,
  currentImages,
  onSelectMockup,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const recommendedMockup = useMemo(() => {
    return getRecommendedMockup(product);
  }, [product?.nome, product?.tarja, product?.retemReceita, product?.tipoMedicamento, product?.generico]);

  const existingUrls = useMemo(() => {
    return (currentImages || []).map(img => typeof img === 'string' ? img : img?.caminhoImagem || "");
  }, [currentImages]);

  const filteredMockups = useMemo(() => {
    return PRODUCT_MOCKUPS.filter(m => {
      if (selectedCategory !== "all" && m.categoria !== selectedCategory) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = m.nome.toLowerCase().includes(query);
        const matchDesc = m.descricao.toLowerCase().includes(query);
        const matchBadge = m.badge.toLowerCase().includes(query);
        return matchName || matchDesc || matchBadge;
      }
      return true;
    });
  }, [selectedCategory, searchTerm]);

  const handleApply = (url: string, asCover = false) => {
    onSelectMockup(url, asCover);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="space-y-2 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-emerald-700">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span className="text-xs uppercase font-black tracking-wider">Galeria de Mockups Oficiais</span>
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900">
            Escolher Mockup para as Fotos do Produto
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Selecione uma imagem padronizada de alta qualidade das Farmácias Associadas para utilizar na vitrine da loja.
          </DialogDescription>
        </DialogHeader>

        {/* Recomendação Inteligente */}
        {recommendedMockup && (
          <div className="mt-4 p-4 rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-lg border border-emerald-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                <img 
                  src={recommendedMockup.url} 
                  alt={recommendedMockup.nome} 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-600 text-white border-none text-[10px] font-bold">
                    ★ Sugestão Automática
                  </Badge>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${recommendedMockup.badgeColor}`}>
                    {recommendedMockup.badge}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-base">{recommendedMockup.nome}</h4>
                <p className="text-xs text-slate-600 max-w-lg">
                  {recommendedMockup.descricao}
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
              <Button
                size="sm"
                onClick={() => handleApply(recommendedMockup.url, true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 shadow-sm"
              >
                <Star className="w-3.5 h-3.5 mr-1.5" />
                Usar como Capa
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApply(recommendedMockup.url, false)}
                className="border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 font-bold text-xs h-9"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Adicionar à Galeria
              </Button>
            </div>
          </div>
        )}

        {/* Barra de Filtros e Busca */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por nome, tarja, formato..."
              className="pl-9 h-10 text-sm bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            <Button
              type="button"
              size="sm"
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className={`h-8 text-xs font-bold ${selectedCategory === "all" ? "bg-slate-800 text-white" : "bg-white text-slate-600"}`}
            >
              Todos ({PRODUCT_MOCKUPS.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={selectedCategory === "generico" ? "default" : "outline"}
              onClick={() => setSelectedCategory("generico")}
              className={`h-8 text-xs font-bold ${selectedCategory === "generico" ? "bg-amber-600 text-white" : "bg-white text-slate-600"}`}
            >
              Genéricos (4)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={selectedCategory === "referencia" ? "default" : "outline"}
              onClick={() => setSelectedCategory("referencia")}
              className={`h-8 text-xs font-bold ${selectedCategory === "referencia" ? "bg-red-600 text-white" : "bg-white text-slate-600"}`}
            >
              Referência (4)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={selectedCategory === "especial" ? "default" : "outline"}
              onClick={() => setSelectedCategory("especial")}
              className={`h-8 text-xs font-bold ${selectedCategory === "especial" ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}
            >
              Formas Especiais (3)
            </Button>
          </div>
        </div>

        {/* Grid de Mockups */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredMockups.map((mockup) => {
            const isAdded = existingUrls.includes(mockup.url);
            const isCover = existingUrls[0] === mockup.url;
            const isSuggested = recommendedMockup?.id === mockup.id;

            return (
              <div
                key={mockup.id}
                className={`border rounded-xl p-4 bg-white flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden group ${
                  isCover ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20" : isAdded ? "border-slate-300" : "hover:border-slate-300"
                }`}
              >
                {/* Badges superiores */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${mockup.badgeColor}`}>
                    {mockup.badge}
                  </span>
                  {isCover ? (
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                      Capa Atual
                    </Badge>
                  ) : isAdded ? (
                    <Badge variant="outline" className="text-slate-600 bg-slate-100 text-[10px] font-bold">
                      ✓ Na Galeria
                    </Badge>
                  ) : isSuggested ? (
                    <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300 text-[10px] font-bold">
                      Sugerido
                    </Badge>
                  ) : null}
                </div>

                {/* Imagem do Mockup */}
                <div className="w-full h-36 bg-slate-50/80 rounded-lg border border-slate-100 p-2 flex items-center justify-center overflow-hidden mb-3 group-hover:bg-white transition-colors">
                  <img
                    src={mockup.url}
                    alt={mockup.nome}
                    className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                </div>

                {/* Textos */}
                <div className="space-y-1 mb-4">
                  <h5 className="font-bold text-sm text-slate-800 line-clamp-1">{mockup.nome}</h5>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {mockup.descricao}
                  </p>
                </div>

                {/* Botões de Ação */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleApply(mockup.url, true)}
                    className="h-8 text-xs font-bold bg-slate-900 hover:bg-emerald-600 text-white shadow-xs"
                    title="Definir como primeira imagem (capa)"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Como Capa
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleApply(mockup.url, false)}
                    className="h-8 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:border-emerald-400"
                    title="Adicionar à lista de imagens do produto"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMockups.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50 text-slate-500 text-sm">
            Nenhum mockup encontrado para a busca "{searchTerm}".
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

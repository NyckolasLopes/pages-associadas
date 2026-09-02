import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { ChevronRight, Search, Sparkles, ShieldCheck, Tag, ArrowRight } from "lucide-react";
import { useActivePharmacy, safeSlugify } from "@/hooks/useActivePharmacy";
import { useMarcasStore } from "@/stores/marcas";
import { getSafeMediaUrl } from "@/utils/media";
import { getBrandNameForHead } from "@/utils/brand";
import type { Marca } from "@/types";

export const Route = createFileRoute("/_store/$storeSlug/marcas")({
  head: () => ({
    meta: [
      { title: `Vitrine de Marcas — ${getBrandNameForHead()}` },
      { name: "description", content: "Conheça todas as marcas e laboratórios parceiros disponíveis na nossa loja." },
      { property: "og:title", content: "Marcas" },
    ],
  }),
  component: MarcasPage,
});

const ALPHABET = [
  "TODOS", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
];

function MarcasPage() {
  const { storeSlug } = Route.useParams();
  const activePharmacy = useActivePharmacy();
  const { marcas, loadMarcas, getStoreEffectiveMarcas } = useMarcasStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("TODOS");
  const [onlyProprias, setOnlyProprias] = useState(false);

  useEffect(() => {
    loadMarcas();
  }, [loadMarcas]);

  const effectiveMarcas = useMemo(() => {
    const list = getStoreEffectiveMarcas(activePharmacy?.id);
    if (list && list.length > 0) return list;
    return marcas.filter((m) => m.ativo !== false);
  }, [getStoreEffectiveMarcas, activePharmacy?.id, marcas]);

  // Filtragem
  const filteredMarcas = useMemo(() => {
    return effectiveMarcas.filter((marca) => {
      // 1. Filtro marca própria
      if (onlyProprias && !marca.marcaPropria) return false;

      // 2. Filtro de busca
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchName = (marca.nome || "").toLowerCase().includes(term);
        const matchDesc = (marca.descricao || "").toLowerCase().includes(term);
        if (!matchName && !matchDesc) return false;
      }

      // 3. Filtro de letra
      if (selectedLetter !== "TODOS") {
        const firstLetter = (marca.nome || "").trim().charAt(0).toUpperCase();
        if (firstLetter !== selectedLetter) return false;
      }

      return true;
    }).sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
  }, [effectiveMarcas, searchTerm, selectedLetter, onlyProprias]);

  // Agrupamento alfabético
  const groupedMarcas = useMemo(() => {
    const groups: Record<string, Marca[]> = {};
    filteredMarcas.forEach((marca) => {
      const letter = (marca.nome || "").trim().charAt(0).toUpperCase() || "#";
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(marca);
    });
    return groups;
  }, [filteredMarcas]);

  const sortedLetters = Object.keys(groupedMarcas).sort();

  return (
    <div className="bg-slate-50 min-h-[70vh] pb-24">
      {/* Top Breadcrumb Bar */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-xs">
        <div className="container-fa py-3">
          <nav className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <Link to="/$storeSlug" params={{ storeSlug }} className="hover:text-primary transition">
              Início
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-800 font-bold">Vitrine de Marcas</span>
          </nav>
        </div>
      </div>

      <div className="container-fa pt-8">
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/15 rounded-3xl p-6 md:p-10 mb-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
                <ShieldCheck className="h-3.5 w-3.5" />
                Qualidade & Confiança
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
                Vitrine de Marcas
              </h1>
              <p className="text-sm text-slate-600 mt-2 max-w-xl">
                Encontre produtos dos maiores laboratórios e marcas exclusivas das Farmácias Associadas.
              </p>
            </div>

            {/* Live Search */}
            <div className="w-full md:w-80 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar marca ou laboratório..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>
          </div>
        </div>

        {/* Filter Controls & A-Z Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-8 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyProprias(!onlyProprias)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  onlyProprias
                    ? "bg-primary text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Apenas Marcas Exclusivas
              </button>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Mostrando <strong className="text-slate-800">{filteredMarcas.length}</strong> marcas
            </span>
          </div>

          {/* Alphabet Bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {ALPHABET.map((letter) => {
              const isSelected = selectedLetter === letter;
              return (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition shrink-0 ${
                    isSelected
                      ? "bg-primary text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Brands List */}
        {filteredMarcas.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center max-w-md mx-auto my-12">
            <Tag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-lg">Nenhuma marca encontrada</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tente selecionar outra letra ou limpe os filtros de busca.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedLetter("TODOS");
                setOnlyProprias(false);
              }}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedLetters.map((letter) => {
              const marcasInLetter = groupedMarcas[letter] || [];
              return (
                <section key={letter} className="scroll-mt-20">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="h-8 w-8 rounded-lg bg-primary text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                      {letter}
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {marcasInLetter.map((marca) => {
                      const marcaSlug = marca.slug ? safeSlugify(marca.slug) : safeSlugify(marca.nome);
                      const safeLogo = getSafeMediaUrl(marca.logo);

                      return (
                        <Link
                          key={marca.id}
                          to="/$storeSlug/m/$slug"
                          params={{ storeSlug, slug: marcaSlug }}
                          className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col items-center text-center justify-between group"
                        >
                          <div className="h-20 w-full flex items-center justify-center p-2 mb-2">
                            {safeLogo ? (
                              <img
                                src={safeLogo}
                                alt={marca.nome}
                                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-14 w-14 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                {(marca.nome || "M").charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="w-full">
                            <span className="font-bold text-xs text-slate-800 group-hover:text-primary transition line-clamp-1 block">
                              {marca.nome}
                            </span>
                            {marca.marcaPropria && (
                              <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                Exclusiva
                              </span>
                            )}
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100 w-full flex items-center justify-center gap-1 text-[11px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Ver itens</span>
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

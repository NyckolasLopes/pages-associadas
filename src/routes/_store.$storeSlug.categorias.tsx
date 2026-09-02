import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { ChevronRight, Search, Layers, ArrowRight, FolderTree } from "lucide-react";
import { useActivePharmacy, safeSlugify } from "@/hooks/useActivePharmacy";
import { useAdmin } from "@/stores/admin";
import { useAdminCategories } from "@/stores/categories";
import { resolveCategoryIcon } from "@/lib/categoryIcons";
import { getBrandNameForHead } from "@/utils/brand";
import categoriesData from "@/data/categories.json";
import type { Categoria } from "@/types";

export const Route = createFileRoute("/_store/$storeSlug/categorias")({
  head: () => ({
    meta: [
      { title: `Todas as Categorias — ${getBrandNameForHead()}` },
      { name: "description", content: "Explore todos os departamentos e categorias da nossa farmácia." },
      { property: "og:title", content: "Categorias" },
    ],
  }),
  component: CategoriasPage,
});

function CategoriasPage() {
  const { storeSlug } = Route.useParams();
  const activePharmacy = useActivePharmacy();
  const { categoryIcons, storeCategoryIcons } = useAdmin();
  const { categories: dbCategories, loadCategories } = useAdminCategories();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Combina categorias do banco de dados com dados estáticos de fallback
  const allCategories: Categoria[] = useMemo(() => {
    if (dbCategories && dbCategories.length > 0) {
      return dbCategories;
    }
    return (categoriesData as Categoria[]) || [];
  }, [dbCategories]);

  // Categorias principais (raiz) e mapa de filhas
  const { rootCategories, subcategoriesMap } = useMemo(() => {
    const roots: Categoria[] = [];
    const subs: Record<string, Categoria[]> = {};

    allCategories.forEach((cat) => {
      if (!cat.parentId) {
        roots.push(cat);
      } else {
        const pId = String(cat.parentId);
        if (!subs[pId]) subs[pId] = [];
        subs[pId].push(cat);
      }
    });

    return { rootCategories: roots, subcategoriesMap: subs };
  }, [allCategories]);

  // Filtragem por busca
  const filteredRoots = useMemo(() => {
    if (!searchTerm.trim()) return rootCategories;
    const term = searchTerm.toLowerCase().trim();

    return rootCategories.filter((root) => {
      const matchRoot = root.nome.toLowerCase().includes(term);
      const subs = subcategoriesMap[String(root.id)] || [];
      const matchSubs = subs.some((s) => s.nome.toLowerCase().includes(term));
      return matchRoot || matchSubs;
    });
  }, [rootCategories, subcategoriesMap, searchTerm]);

  const storeDisplayName = activePharmacy?.nome || "Nossa Loja";

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
            <span className="text-slate-800 font-bold">Todas as Categorias</span>
          </nav>
        </div>
      </div>

      <div className="container-fa pt-8">
        {/* Header Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/15 rounded-3xl p-6 md:p-10 mb-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
                <Layers className="h-3.5 w-3.5" />
                Catálogo Completo
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
                Departamentos e Categorias
              </h1>
              <p className="text-sm text-slate-600 mt-2 max-w-xl">
                Navegue pelas seções de <span className="font-semibold text-slate-800">{storeDisplayName}</span> e encontre rapidamente medicamentos, cuidados diários, beleza e bem-estar.
              </p>
            </div>

            {/* Live Search Filter */}
            <div className="w-full md:w-80 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar categoria ou departamento..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        {filteredRoots.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center max-w-md mx-auto my-12">
            <FolderTree className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-lg">Nenhuma categoria encontrada</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tente buscar por outro termo ou limpe o campo de busca.
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition"
            >
              Limpar Busca
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoots.map((root) => {
              const IconComp = resolveCategoryIcon(root, {
                storeCategoryIcons,
                categoryIcons,
                activeStoreId: activePharmacy?.id,
              });

              const subs = subcategoriesMap[String(root.id)] || [];
              const rootSlug = root.slug ? safeSlugify(root.slug) : safeSlugify(root.nome);

              return (
                <div
                  key={root.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-primary/40"
                >
                  <div>
                    {/* Root Category Header */}
                    <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <IconComp className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/$storeSlug/c/$slug"
                          params={{ storeSlug, slug: rootSlug }}
                          className="font-bold text-base text-slate-800 hover:text-primary transition truncate block"
                        >
                          {root.nome}
                        </Link>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {subs.length > 0 ? `${subs.length} subcategorias` : "Departamento"}
                        </span>
                      </div>
                    </div>

                    {/* Subcategories List */}
                    {subs.length > 0 ? (
                      <div className="pt-3.5 pb-2 flex flex-wrap gap-1.5">
                        {subs.slice(0, 8).map((sub) => {
                          const subSlug = sub.slug ? safeSlugify(sub.slug) : safeSlugify(sub.nome);
                          return (
                            <Link
                              key={sub.id}
                              to="/$storeSlug/c/$slug"
                              params={{ storeSlug, slug: subSlug }}
                              className="inline-block px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-primary/10 text-slate-600 hover:text-primary text-xs transition font-medium"
                            >
                              {sub.nome}
                            </Link>
                          );
                        })}
                        {subs.length > 8 && (
                          <span className="text-[11px] text-slate-400 self-center px-1 font-medium">
                            +{subs.length - 8} mais
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="py-4 text-xs text-slate-400 italic">
                        Confira os produtos disponíveis deste departamento.
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="pt-3 border-t border-slate-100 mt-2">
                    <Link
                      to="/$storeSlug/c/$slug"
                      params={{ storeSlug, slug: rootSlug }}
                      className="text-xs font-bold text-primary hover:text-primary-dark inline-flex items-center gap-1.5 group/btn"
                    >
                      <span>Ver produtos</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

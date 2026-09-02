import { getBrandNameForHead } from "@/utils/brand";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Map, Store, Layers, Tag, HelpCircle, Shield, ArrowRight } from "lucide-react";
import { useActivePharmacy, safeSlugify } from "@/hooks/useActivePharmacy";
import { useAdmin } from "@/stores/admin";
import { useAdminCategories } from "@/stores/categories";
import { useMarcasStore } from "@/stores/marcas";
import categoriesData from "@/data/categories.json";
import { useEffect, useMemo } from "react";
import type { Categoria } from "@/types";

export const Route = createFileRoute("/_store/$storeSlug/mapa-site")({
  head: () => ({
    meta: [
      { title: `Mapa do Site — ${getBrandNameForHead()}` },
      { name: "description", content: "Navegue por todas as seções, departamentos e páginas da nossa farmácia." },
      { property: "og:title", content: "Mapa do Site" },
      { property: "og:description", content: "Guia completo e visão hierárquica das páginas da loja." },
    ],
  }),
  component: SiteMap,
});

function SiteMap() {
  const { storeSlug } = Route.useParams();
  const activePharmacy = useActivePharmacy();
  const { contentPages } = useAdmin();
  const { categories: dbCategories, loadCategories } = useAdminCategories();
  const { marcas, loadMarcas } = useMarcasStore();

  useEffect(() => {
    loadCategories();
    loadMarcas();
  }, [loadCategories, loadMarcas]);

  const allCategories: Categoria[] = useMemo(() => {
    if (dbCategories && dbCategories.length > 0) return dbCategories;
    return (categoriesData as Categoria[]) || [];
  }, [dbCategories]);

  const rootCategories = useMemo(() => {
    return allCategories.filter((c) => !c.parentId);
  }, [allCategories]);

  const storeName = activePharmacy?.nome || "Farmácias Associadas";

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
            <span className="text-slate-800 font-bold">Mapa do Site</span>
          </nav>
        </div>
      </div>

      <div className="container-fa pt-8 max-w-6xl">
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/15 rounded-3xl p-6 md:p-10 mb-8 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md">
              <Map className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
                Mapa do Site
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Estrutura completa e visão geral de navegação de <strong className="text-slate-800">{storeName}</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Map Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Navegação */}
          <SectionCard title="Navegação da Loja" icon={Store}>
            <MapLink to="/$storeSlug" params={{ storeSlug }}>Início / Vitrine Principal</MapLink>
            <MapLink to="/$storeSlug/busca" params={{ storeSlug }}>Buscar Produtos</MapLink>
            <MapLink to="/$storeSlug/cart" params={{ storeSlug }}>Cesta de Compras</MapLink>
            <MapLink to="/$storeSlug/pedidos" params={{ storeSlug }}>Meus Pedidos</MapLink>
            <MapLink to="/$storeSlug/perfil" params={{ storeSlug }}>Minha Conta & Favoritos</MapLink>
            <MapLink to="/$storeSlug/login" params={{ storeSlug }}>Entrar / Cadastrar</MapLink>
          </SectionCard>

          {/* Categorias */}
          <SectionCard 
            title="Departamentos e Categorias" 
            icon={Layers}
            action={
              <Link to="/$storeSlug/categorias" params={{ storeSlug }} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            <MapLink to="/$storeSlug/categorias" params={{ storeSlug }} highlight>
              ★ Catálogo Completo de Categorias
            </MapLink>
            {rootCategories.slice(0, 8).map((cat) => {
              const catSlug = cat.slug ? safeSlugify(cat.slug) : safeSlugify(cat.nome);
              return (
                <MapLink
                  key={cat.id}
                  to="/$storeSlug/c/$slug"
                  params={{ storeSlug, slug: catSlug }}
                >
                  {cat.nome}
                </MapLink>
              );
            })}
          </SectionCard>

          {/* Marcas */}
          <SectionCard 
            title="Marcas e Laboratórios" 
            icon={Tag}
            action={
              <Link to="/$storeSlug/marcas" params={{ storeSlug }} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            <MapLink to="/$storeSlug/marcas" params={{ storeSlug }} highlight>
              ★ Vitrine Completa de Marcas (A-Z)
            </MapLink>
            {marcas.slice(0, 8).map((m) => {
              const mSlug = m.slug ? safeSlugify(m.slug) : safeSlugify(m.nome);
              return (
                <MapLink
                  key={m.id}
                  to="/$storeSlug/m/$slug"
                  params={{ storeSlug, slug: mSlug }}
                >
                  {m.nome}
                </MapLink>
              );
            })}
          </SectionCard>

          {/* Institucional da Loja */}
          <SectionCard title="Institucional" icon={Store}>
            <MapLink to="/$storeSlug/quem-somos" params={{ storeSlug }} highlight>
              Quem Somos ({storeName})
            </MapLink>
            <MapLink to="/$storeSlug/mapa-site" params={{ storeSlug }}>
              Mapa do Site
            </MapLink>
            {contentPages
              .filter((p) => p.footerColumn === "Institucional" && p.slug !== "quem-somos" && p.slug !== "mapa-site")
              .map((p) => (
                <MapLink
                  key={p.id}
                  to="/$storeSlug/pagina/$slug"
                  params={{ storeSlug, slug: p.slug }}
                >
                  {p.title}
                </MapLink>
              ))}
          </SectionCard>

          {/* Atendimento e Ajuda */}
          <SectionCard title="Atendimento e Compras" icon={HelpCircle}>
            <MapLink to="/$storeSlug/pagina/$slug" params={{ storeSlug, slug: "como-comprar" }}>
              Como Comprar
            </MapLink>
            <MapLink to="/$storeSlug/pagina/$slug" params={{ storeSlug, slug: "prazo-entrega" }}>
              Prazos e Formas de Entrega
            </MapLink>
            <MapLink to="/$storeSlug/pagina/$slug" params={{ storeSlug, slug: "central-atendimento" }}>
              Central de Atendimento
            </MapLink>
            <MapLink to="/$storeSlug/pagina/$slug" params={{ storeSlug, slug: "trocas-e-devolucoes" }}>
              Trocas e Devoluções
            </MapLink>
            <MapLink to="/$storeSlug/pagina/$slug" params={{ storeSlug, slug: "cancelamento" }}>
              Política de Reembolso e Cancelamento
            </MapLink>
            <MapLink to="/$storeSlug/faq" params={{ storeSlug }}>
              Dúvidas Frequentes (FAQ)
            </MapLink>
          </SectionCard>

          {/* Segurança e Privacidade */}
          <SectionCard title="Segurança & Privacidade" icon={Shield}>
            <MapLink to="/$storeSlug/politica-de-privacidade" params={{ storeSlug }} highlight>
              Política de Privacidade (LGPD)
            </MapLink>
            <MapLink to="/$storeSlug/pagina/$slug" params={{ storeSlug, slug: "protecao-dados" }}>
              Como Protegemos seus Dados
            </MapLink>
            <MapLink to="/$storeSlug/pagina/$slug" params={{ storeSlug, slug: "termos-de-uso" }}>
              Termos e Condições de Uso
            </MapLink>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon className="h-4 w-4" />
            </div>
            <span>{title}</span>
          </div>
          {action}
        </div>
        <div className="space-y-1">{children}</div>
      </div>
    </div>
  );
}

function MapLink({
  to,
  params,
  highlight,
  children,
}: {
  to: any;
  params: any;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      params={params}
      className={`block px-2.5 py-1.5 rounded-lg text-xs transition truncate ${
        highlight
          ? "font-bold text-primary bg-primary/5 hover:bg-primary/10"
          : "text-slate-600 hover:text-primary hover:bg-slate-50"
      }`}
    >
      → {children}
    </Link>
  );
}

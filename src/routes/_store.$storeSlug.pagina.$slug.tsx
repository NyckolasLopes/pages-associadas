import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { useActivePharmacy, safeSlugify } from "@/hooks/useActivePharmacy";
import { ChevronRight, FileText } from "lucide-react";
import { NotFound } from "@/components/storefront/NotFound";
import { sanitizeHtml } from "@/lib/security";

export const Route = createFileRoute("/_store/$storeSlug/pagina/$slug")({
  component: PaginaConteudo,
  loader: ({ params }) => {
    return { slug: params.slug };
  }
});

function PaginaConteudo() {
  const { slug } = Route.useLoaderData();
  const { contentPages } = useAdmin();
  const activePharmacy = useActivePharmacy();
  const params = useParams({ strict: false });
  const storeSlug = (params && (params as any).storeSlug) || (activePharmacy?.slug ? safeSlugify(activePharmacy.slug) : "loja-padrao");
  
  // Prioridade: Conteúdo individual customizado da loja -> Conteúdo padrão da rede
  const customPage = activePharmacy?.customPages?.find(p => p.slug === slug);
  const globalPage = contentPages.find(p => p.slug === slug);
  const page = customPage || globalPage;

  if (!page || (page.type !== "text" && !page.content)) {
    return <NotFound type="page" />;
  }

  return (
    <div className="bg-slate-50 min-h-[60vh] pb-20">
      <div className="bg-white border-b">
        <div className="container-fa py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/$storeSlug" params={{ storeSlug }} className="hover:text-primary transition flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Início
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-800 font-semibold">{page.title}</span>
          </div>
        </div>
      </div>
      
      <div className="container-fa py-12 max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-8 border-b pb-6 tracking-tight">
            {page.title}
          </h1>
          <div 
            className="w-full prose prose-slate max-w-none text-slate-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content || "") }}
          />
        </div>
      </div>
    </div>
  );
}


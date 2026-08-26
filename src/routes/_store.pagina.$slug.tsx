import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { NotFound } from "@/components/storefront/NotFound";

import { sanitizeHtml } from "@/lib/security";

export const Route = createFileRoute("/_store/pagina/$slug")({
  component: PaginaConteudo,
  loader: ({ params }) => {
    return { slug: params.slug };
  }
});

function PaginaConteudo() {
  const { slug } = Route.useLoaderData();
  const { contentPages } = useAdmin();
  
  const page = contentPages.find(p => p.slug === slug && p.type === "text");

  if (!page) {
    return <NotFound type="page" />;
  }

  return (
    <div className="bg-slate-50 min-h-[60vh] pb-20">
      <div className="bg-white border-b">
        <div className="container-fa py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-blue-600">Início</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-800 font-medium">{page.title}</span>
          </div>
        </div>
      </div>
      
      <div className="container-fa py-12 max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-8 border-b pb-6">
            {page.title}
          </h1>
          <div 
            className="w-full"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
          />
        </div>
      </div>
    </div>
  );
}

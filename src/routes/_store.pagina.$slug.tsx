import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import mascot404 from "@/assets/404-mascot.png";

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
    return (
      <div className="container-fa py-20 text-center flex flex-col items-center">
        <img src={mascot404} alt="Página não encontrada" className="w-64 max-w-full h-auto mb-6 drop-shadow-md" />
        <h1 className="text-3xl font-bold mb-4">Página não encontrada</h1>
        <p className="text-muted-foreground mb-8">A página que você tentou acessar não existe ou foi removida.</p>
        <Link to="/" className="text-blue-600 font-medium hover:underline">Voltar para a página inicial</Link>
      </div>
    );
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
            dangerouslySetInnerHTML={{ __html: page.content || "" }}
          />
        </div>
      </div>
    </div>
  );
}

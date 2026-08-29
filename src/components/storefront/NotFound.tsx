import { useActivePharmacy, safeSlugify } from "@/hooks/useActivePharmacy";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, SearchX, FileQuestion, PackageX, LayoutGrid } from "lucide-react";
import mascot404 from "@/assets/404-mascot.png";
import mascotNotFound from "@/assets/404-mascot.png";

interface NotFoundProps {
  type?: "page" | "product" | "category" | "showcase";
  title?: string;
  description?: string;
}

export function NotFound({ type = "page", title, description }: NotFoundProps) {
  const activePharmacy = useActivePharmacy();
  const isPartner = activePharmacy?.categoriaAssociado === "Parceiro";

  let storeSlug = "";
  if (activePharmacy?.slug) {
    storeSlug = safeSlugify(activePharmacy.slug);
  } else if (activePharmacy?.nome) {
    storeSlug = safeSlugify(activePharmacy.nome);
  } else {
    try {
      const lastSlug = sessionStorage.getItem('fa-last-store-slug');
      if (lastSlug) storeSlug = lastSlug;
    } catch {}
  }

  const getMascot = () => {
    return type === "product" ? mascotNotFound : mascot404;
  };

  const getIcon = () => {
    switch (type) {
      case "product": return <PackageX className="w-24 h-24 text-slate-300 mb-6" />;
      case "category": return <LayoutGrid className="w-24 h-24 text-slate-300 mb-6" />;
      case "showcase": return <SearchX className="w-24 h-24 text-slate-300 mb-6" />;
      default: return <FileQuestion className="w-24 h-24 text-slate-300 mb-6" />;
    }
  };

  const defaultTitle = {
    page: "Página não encontrada",
    product: "Produto não encontrado",
    category: "Categoria não encontrada",
    showcase: "Vitrine não encontrada"
  }[type];

  const defaultDescription = {
    page: "Desculpe, não conseguimos encontrar a página que você está procurando.",
    product: "O produto que você procura não existe ou foi removido do catálogo.",
    category: "A categoria solicitada não foi encontrada.",
    showcase: "A vitrine de produtos não está mais disponível."
  }[type];

  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 min-h-[60vh]">
      <div className="max-w-md w-full flex flex-col items-center">
        {isPartner ? (
          getIcon()
        ) : (
          <img 
            src={getMascot()} 
            alt={finalTitle} 
            className="w-full max-w-sm h-auto mb-6 drop-shadow-md" 
          />
        )}
        
        <h1 className="text-2xl font-bold text-slate-800 mb-2">{finalTitle}</h1>
        <p className="text-sm text-slate-500 mb-8">{finalDescription}</p>
        
        {storeSlug ? (
          <Link 
            to="/$storeSlug" 
            params={{ storeSlug }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center justify-center gap-2 px-6 py-3 rounded-md transition-all hover:scale-105 shadow-sm w-full sm:w-auto"
          >
            <ChevronLeft className="w-5 h-5" /> Voltar para a loja
          </Link>
        ) : (
          <Link 
            to="/" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center justify-center gap-2 px-6 py-3 rounded-md transition-all hover:scale-105 shadow-sm w-full sm:w-auto"
          >
            <ChevronLeft className="w-5 h-5" /> Voltar para o início
          </Link>
        )}
      </div>
    </div>
  );
}


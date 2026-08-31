import { useActivePharmacy, safeSlugify } from "@/hooks/useActivePharmacy";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, SearchX, FileQuestion, PackageX, LayoutGrid } from "lucide-react";
import mascot404 from "@/assets/404-mascot.png";
import mascotNotFound from "@/assets/produto-nao-encontrado.png";

interface NotFoundProps {
  type?: "page" | "product" | "category" | "showcase";
  title?: string;
  description?: string;
}

export function NotFound({ type = "page", title, description }: NotFoundProps) {
  const activePharmacy = useActivePharmacy();

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
    if (!storeSlug && typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts[0] && !["admin", "login", "cadastro", "reset-password"].includes(parts[0])) {
        storeSlug = safeSlugify(parts[0]);
      }
    }
  }

  const getMascot = () => {
    return type === "product" ? mascotNotFound : mascot404;
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
        <img 
          src={getMascot()} 
          alt={finalTitle} 
          className="w-full max-w-[280px] sm:max-w-xs h-auto mb-6 drop-shadow-md object-contain" 
        />
        
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


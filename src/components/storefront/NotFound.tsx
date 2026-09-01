import error404Img from "@/assets/error-404.png";
import produtoNaoEncontradoImg from "@/assets/produto-nao-encontrado.png";
import { ArrowLeft, PackageX, FileQuestion, ChevronLeft } from "lucide-react";
import { useActivePharmacy, safeSlugify } from "@/hooks/useActivePharmacy";

interface NotFoundProps {
  type?: "page" | "product" | "category" | "showcase";
  title?: string;
  description?: string;
}

export function NotFound({ type = "page", title, description }: NotFoundProps) {
  const activePharmacy = useActivePharmacy();
  const isParceiro = activePharmacy?.categoriaAssociado === "Parceiro" || 
                     activePharmacy?.categoriaAssociado === "Associado" || 
                     activePharmacy?.isPleno === false;

  const storeSlug = activePharmacy?.slug ? safeSlugify(activePharmacy.slug) : "";

  // Se for loja parceira, exibe o layout padrão limpo (sem os mascotes da rede Associadas)
  if (isParceiro) {
    const isProduct = type === "product";
    const defaultTitle = isProduct ? "Produto não encontrado" : "Página não encontrada";
    const defaultDesc = isProduct
      ? "O produto que você procura não existe ou não está disponível nesta loja."
      : "Desculpe, a página que você está procurando não foi encontrada.";

    return (
      <div className="fixed inset-0 z-[999999] bg-white flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none overflow-y-auto">
        <div className="max-w-md w-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200 my-auto p-8 rounded-2xl border border-slate-200 shadow-sm bg-white">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-500">
            {isProduct ? <PackageX className="w-8 h-8 opacity-70" /> : <FileQuestion className="w-8 h-8 opacity-70" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{title || defaultTitle}</h1>
          <p className="text-sm text-slate-500 mb-8 max-w-sm">{description || defaultDesc}</p>
          
          <a
            href={storeSlug ? `/${storeSlug}` : "/"}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <ChevronLeft className="w-4 h-4" />
            {storeSlug ? "Voltar para a loja" : "Voltar para o início"}
          </a>
        </div>
      </div>
    );
  }

  // Loja Pleno ou Rede: Exibe as ilustrações personalizadas
  const isProduct = type === "product";
  const imgSrc = isProduct ? produtoNaoEncontradoImg : error404Img;
  const altText = isProduct ? "Produto não encontrado" : "Página não encontrada - 404";

  return (
    <div className="fixed inset-0 z-[999999] bg-white flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none overflow-y-auto">
      <div className="max-w-md sm:max-w-lg w-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200 my-auto">
        <img 
          src={imgSrc} 
          alt={altText} 
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          width={420}
          height={528}
          className="w-full max-w-[340px] sm:max-w-[420px] h-auto object-contain drop-shadow-sm pointer-events-none"
        />
        
        <div className="mt-6 flex flex-col items-center gap-3 w-full sm:w-auto">
          <a 
            href="/login"
            className="bg-[#00B5AD] hover:bg-[#009E97] text-white font-bold text-base px-8 py-3.5 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 w-full sm:w-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para a rede
          </a>
        </div>
      </div>
    </div>
  );
}


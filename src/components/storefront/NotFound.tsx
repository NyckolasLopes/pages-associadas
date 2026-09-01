import error404Img from "@/assets/error-404.png";
import produtoNaoEncontradoImg from "@/assets/produto-nao-encontrado.png";
import { ArrowLeft } from "lucide-react";

interface NotFoundProps {
  type?: "page" | "product" | "category" | "showcase";
  title?: string;
  description?: string;
}

export function NotFound({ type = "page", title, description }: NotFoundProps) {
  const isProduct = type === "product";
  const imgSrc = isProduct ? produtoNaoEncontradoImg : error404Img;
  const altText = isProduct ? "Produto não encontrado" : "Página não encontrada - 404";

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none">
      <div className="max-w-md sm:max-w-lg w-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
        <img 
          src={imgSrc} 
          alt={altText} 
          className="w-full max-w-[340px] sm:max-w-[420px] h-auto object-contain drop-shadow-sm pointer-events-none"
        />
        
        <div className="mt-8 flex flex-col items-center gap-3 w-full sm:w-auto">
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


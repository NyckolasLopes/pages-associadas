import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useCart } from "@/stores/cart";
import { catalog } from "@/services/catalog";
import { Loader2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/_store/compartilhado")({
  component: CompartilhadoPage,
});

function CompartilhadoPage() {
  const navigate = useNavigate();
  const search = Route.useSearch() as { c?: string };
  const add = useCart((s) => s.add);
  const clear = useCart((s) => s.clear);

  useEffect(() => {
    async function loadSharedCart() {
      if (!search.c) {
        navigate({ to: "/" });
        return;
      }
      try {
        const decoded = atob(search.c);
        const items = JSON.parse(decoded) as { id: string; qtd: number }[];
        
        if (Array.isArray(items) && items.length > 0) {
          clear();
          for (const item of items) {
            const product = await catalog.getProductBySlug(item.id);
            if (product) {
              add(product, item.qtd);
            }
          }
        }
      } catch (err) {
        console.error("Erro ao carregar carrinho compartilhado:", err);
      }
      
      // Redirect to cart and trigger the forced pharmacy selection modal
      navigate({ to: "/cart", search: { shared: "true" } });
    }
    loadSharedCart();
  }, [search.c, navigate, add, clear]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#F9F9F8]">
      <Spinner className="h-10 w-10 text-emerald-600 animate-spin mb-4" />
      <h2 className="text-xl font-bold text-slate-700">Carregando cesta compartilhada...</h2>
    </div>
  );
}

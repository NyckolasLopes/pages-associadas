import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProductEditorForm } from "@/components/admin/ProductEditorForm";
import { useAdminProducts } from "@/stores/products";
import { Produto } from "@/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/produtos/novo")({
  component: AdminNovoProduto,
});

function AdminNovoProduto() {
  const navigate = useNavigate();
  const { addOrUpdateProduct } = useAdminProducts();
  
  // Basic query params read (without typing)
  const searchParams = new URLSearchParams(window.location.search);
  const tipoParam = searchParams.get("tipo") || "fisico";

  const handleSave = (product: Produto) => {
    addOrUpdateProduct(product);
    navigate({ to: "/admin/produtos" });
  };

  const handleCancel = () => {
    navigate({ to: "/admin/produtos" });
  };

  const newProduct: Produto = {
    id: `prod-${Date.now()}`,
    sku: "",
    ean: "",
    nome: "",
    foto: "",
    descricao: "",
    url: "",
    fabricante: "",
    precoDe: 0,
    precoPor: 0,
    estoque: 0,
    registroAnvisa: "",
    tarja: "Sem Tarja",
    retemReceita: false,
    generico: false,
    possuiImagem: false,
    categoriaId: "",
    subcategoriaId: "",
    internalTags: [],
    ativo: true,
    origem: "Manual",
    dataImportacao: new Date().toISOString(),
    tipoProduto: tipoParam
  };

  return (
    <div className="bg-slate-50 min-h-[80vh]">
      <ProductEditorForm 
        open={true}
        onOpenChange={(open) => !open && handleCancel()}
        product={newProduct}
        onSave={handleSave}
        asPage={true}
      />
    </div>
  );
}

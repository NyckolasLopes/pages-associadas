import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StoreSelector } from "@/components/admin/StoreSelector";
import { ProductEditorForm } from "@/components/admin/ProductEditorForm";
import { useAdminProducts } from "@/stores/products";
import { useAdmin } from "@/stores/admin";
import { Produto } from "@/types";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";
import { SubirDadosLojaModal } from "@/components/admin/SubirDadosLojaModal";

export const Route = createFileRoute("/admin/produtos/novo")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tipo: search.tipo as string | undefined,
    }
  },
  component: AdminNovoProduto,
});

function AdminNovoProduto() {
  const navigate = useNavigate();
  const { addOrUpdateProduct } = useAdminProducts();
  const { currentUser, activeStoreId, pharmacies } = useAdmin();
  const [subirDadosOpen, setSubirDadosOpen] = useState(false);
  
  const currentLojaId = activeStoreId || (currentUser?.lojasVinculadas && currentUser.lojasVinculadas[0]) || null;
  const currentLoja = pharmacies.find(p => p.id === currentLojaId);

  const search = Route.useSearch() as any;
  const tipoParam = search.tipo || "";

  const handleSave = async (product: Produto) => {
    const finalProduct: Produto = {
      ...product,
      lojaId: currentLojaId || undefined,
      isIndividualLoja: !!currentLojaId,
      origem: currentLojaId ? "Loja Individual" : "Manual",
    };

    await addOrUpdateProduct(finalProduct, currentLojaId);

    toast.success(
      currentLojaId
        ? `Produto "${product.nome}" cadastrado exclusivamente para a loja ${currentLoja?.nome || ""}!`
        : `Produto "${product.nome}" cadastrado com sucesso no Catálogo Geral da Rede!`
    );

    navigate({ to: "/admin/produtos" });
  };

  const handleCancel = () => {
    navigate({ to: "/admin/produtos" });
  };

  const newProduct: Produto = {
    id: `prod-${Date.now()}`,
    sku: "",
    codigoInterno: "",
    ean: "",
    nome: "",
    foto: "",
    descricao: "",
    url: "",
    marca: "",
    precoDe: "" as any,
    precoPor: "" as any,
    estoque: "" as any,
    registroAnvisa: "",
    tarja: "" as any,
    retemReceita: false,
    generico: false,
    possuiImagem: false,
    categoriaId: "",
    subcategoriaId: "",
    internalTags: [],
    ativo: false,
    visivel: false,
    lancamento: true,
    origem: currentLojaId ? "Loja Individual" : "Manual",
    dataImportacao: new Date().toISOString(),
    tipoProduto: tipoParam,
    lojaId: currentLojaId || undefined,
    isIndividualLoja: !!currentLojaId,
  };

  return (
    <>
      <ProductEditorForm 
        open={true}
        onOpenChange={(open) => !open && handleCancel()}
        product={newProduct}
        onSave={handleSave}
        asPage={true}
        lojaId={currentLojaId}
        isNew={true}
        headerActions={
          <>
            <StoreSelector className="mb-0" />
          </>
        }
      />
      
      <SubirDadosLojaModal
        open={subirDadosOpen}
        onOpenChange={setSubirDadosOpen}
      />
    </>
  );
}


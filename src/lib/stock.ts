// Stock utility - deterministic stock based on product+pharmacy IDs

// Resolve the effective stock for a product at a given pharmacy
export function getDeterministicStock(produtoOrId: any, pharmacyId: string | undefined): number {
  if (!produtoOrId) return 0;
  
  if (typeof produtoOrId === 'object' && produtoOrId !== null) {
    // 1. Se a loja tem um estoque definido, usamos esse valor (seja 0 ou maior)
    if (pharmacyId && produtoOrId.estoquesPorLoja && produtoOrId.estoquesPorLoja[pharmacyId] !== undefined) {
      return Number(produtoOrId.estoquesPorLoja[pharmacyId]);
    }

    // 2. Fallback to the global estoque field set on the product
    if (produtoOrId.estoque !== undefined && Number(produtoOrId.estoque) > 0) {
      return Number(produtoOrId.estoque);
    }
  }

  return 0;
}

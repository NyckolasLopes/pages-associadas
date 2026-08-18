// Stock utility — deterministic stock based on product+pharmacy IDs

// Resolve the effective stock for a product at a given pharmacy
export function getDeterministicStock(produtoOrId: any, pharmacyId: string | undefined): number {
  if (!produtoOrId || !pharmacyId) return 0;
  
  if (typeof produtoOrId === 'object' && produtoOrId !== null) {
    // 1. Check store-specific stock (estoquesPorLoja)
    if (produtoOrId.estoquesPorLoja && produtoOrId.estoquesPorLoja[pharmacyId] !== undefined) {
      return Number(produtoOrId.estoquesPorLoja[pharmacyId]);
    }

    // 2. Fallback to the global estoque field set on the product
    if (produtoOrId.estoque !== undefined) {
      return Number(produtoOrId.estoque);
    }
  }

  return 0;
}

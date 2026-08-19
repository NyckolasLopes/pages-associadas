// Stock utility — deterministic stock based on product+pharmacy IDs

// Resolve the effective stock for a product at a given pharmacy
export function getDeterministicStock(produtoOrId: any, pharmacyId: string | undefined): number {
  if (!produtoOrId) return 0;
  
  if (typeof produtoOrId === 'object' && produtoOrId !== null) {
    // 1. Check store-specific stock (estoquesPorLoja) — only use if > 0
    if (pharmacyId && produtoOrId.estoquesPorLoja && produtoOrId.estoquesPorLoja[pharmacyId] !== undefined) {
      const storeStock = Number(produtoOrId.estoquesPorLoja[pharmacyId]);
      if (storeStock > 0) return storeStock;
    }

    // 2. Fallback to the global estoque field set on the product
    if (produtoOrId.estoque !== undefined && Number(produtoOrId.estoque) > 0) {
      return Number(produtoOrId.estoque);
    }
    
    // 3. If store stock was explicitly set to 0, return 0
    if (pharmacyId && produtoOrId.estoquesPorLoja && produtoOrId.estoquesPorLoja[pharmacyId] !== undefined) {
      return Number(produtoOrId.estoquesPorLoja[pharmacyId]);
    }
  }

  return 0;
}

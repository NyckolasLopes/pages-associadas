// Stock utility — deterministic pseudo-random stock based on product+pharmacy IDs

// Create a deterministic but pseudo-random stock number based on product ID and pharmacy ID
export function getDeterministicStock(produtoOrId: any, pharmacyId: string | undefined): number {
  if (!produtoOrId || !pharmacyId) return 0;
  
  // if a product object is passed and it has estoquesPorLoja configured, use it!
  if (typeof produtoOrId === 'object' && produtoOrId !== null) {
    if (produtoOrId.estoquesPorLoja && produtoOrId.estoquesPorLoja[pharmacyId] !== undefined) {
      return Number(produtoOrId.estoquesPorLoja[pharmacyId]);
    }
  }

  // Always return the actual stock. Never return fake random stock.
  if (typeof produtoOrId === 'object' && produtoOrId !== null) {
    if (produtoOrId.estoque !== undefined && !produtoOrId.estoquesPorLoja) {
      return Number(produtoOrId.estoque);
    }
  }

  return 0;
}

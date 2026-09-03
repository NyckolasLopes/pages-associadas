// Stock utility - deterministic stock based on product+pharmacy IDs

// Resolve the effective stock for a product at a given pharmacy
export function getDeterministicStock(produtoOrId: any, pharmacyId: string | undefined): number {
  if (!produtoOrId) return 0;
  
  if (typeof produtoOrId === 'object' && produtoOrId !== null) {
    // 1. Se a loja tem um estoque definido em estoquesPorLoja, usamos esse valor (seja 0 ou maior)
    if (pharmacyId && produtoOrId.estoquesPorLoja && produtoOrId.estoquesPorLoja[pharmacyId] !== undefined) {
      return Number(produtoOrId.estoquesPorLoja[pharmacyId]);
    }

    // 2. Se a loja tem um estoque definido em precosPorLoja, usamos esse valor
    if (pharmacyId && produtoOrId.precosPorLoja?.[pharmacyId]?.estoque !== undefined) {
      return Number(produtoOrId.precosPorLoja[pharmacyId].estoque);
    }

    // 3. Se a loja está explicitamente inativa para este produto
    if (pharmacyId && produtoOrId.precosPorLoja?.[pharmacyId]?.ativo === false) {
      return 0;
    }

    // 4. Fallback to the global estoque field set on the product (apenas se não houver restrição local)
    if (produtoOrId.estoque !== undefined && Number(produtoOrId.estoque) > 0) {
      return Number(produtoOrId.estoque);
    }
  }

  return 0;
}

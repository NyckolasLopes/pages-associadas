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

  const productId = typeof produtoOrId === 'string' ? produtoOrId : produtoOrId.id;
  if (!productId) return 0;
  
  // Simple hash function
  let hash = 0;
  const str = `${productId}-${pharmacyId}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use hash to generate a stock number between 0 and 15
  // We use Math.abs to ensure positive numbers
  const pseudoRandom = Math.abs(hash) % 100;
  
  // Distribution:
  // 20% chance of 0 stock (Out of stock locally)
  // 40% chance of 1-3 stock
  // 30% chance of 4-8 stock
  // 10% chance of 9-15 stock
  
  if (pseudoRandom < 20) return 0;
  if (pseudoRandom < 60) return 1 + (pseudoRandom % 3);
  if (pseudoRandom < 90) return 4 + (pseudoRandom % 5);
  return 9 + (pseudoRandom % 7);
}

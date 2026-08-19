const fs = require('fs');
let content = fs.readFileSync('src/services/catalog.ts', 'utf8');

// For searchProducts and similar
content = content.replace(/const inStockProducts = products\.filter\(p => p\.estoque > 0\);\s*return \{ results: applyFilters\(inStockProducts, filters\) \};/g, 'return { results: applyFilters(products, filters) };');
content = content.replace(/const inStockProducts = products\.filter\(p => p\.estoque > 0\);\s*return \{ results: applyFilters\(inStockProducts, filters\), didYouMean: undefined \};/g, 'return { results: applyFilters(products, filters), didYouMean: undefined };');

// For featured
content = content.replace(/const comDestaque = comDestaqueAll\.filter\(p => p\.estoque > 0\);/g, 'const comDestaque = comDestaqueAll;');
content = content.replace(/const fallback = fallbackAll\.filter\(p => p\.estoque > 0\)\.slice\(0, needed\);/g, 'const fallback = fallbackAll.slice(0, needed);');

fs.writeFileSync('src/services/catalog.ts', content);

const fs = require('fs');
const path = 'src/routes/admin/index.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix carrinhosRecuperar
content = content.replace(
  'const carrinhosRecuperar = storeCarts.length + (cartItems.length > 0 ? 1 : 0);',
  'const carrinhosRecuperar = rawStoreCarts.length + (cartItems.length > 0 ? 1 : 0);'
);

// 2. Fix the greeting
content = content.replace(
  'Painel Geral da Rede de Farmácias Associadas',
  '{effectiveStoreId ? `Visão da Loja: ${pharmacies.find(p => p.id === effectiveStoreId)?.nome || ""}` : "Painel Geral da Rede de Farmácias Associadas"}'
);

// 3. Remove `{isGlobalView && (` for the global KPIs
content = content.replace(
  '{/* ---- Linha 2 de KPIs Globais ---- */}\n      {isGlobalView && (\n        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">',
  '{/* ---- Linha 2 de KPIs Globais ---- */}\n        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">'
);

// 4. Find the `)}` that closes the global KPIs block and remove it, along with the entire `{!isGlobalView && ...}` block
const startIndex = content.indexOf('{/* ---- Linha 2 de KPIs por Loja ---- */}');
if (startIndex !== -1) {
  // Find the `)}` just before this index
  const precedingText = content.substring(0, startIndex);
  const closingBraceIndex = precedingText.lastIndexOf(')}');
  
  // Find the end of the `{!isGlobalView && ...}` block
  let endIndex = content.indexOf('{/* ---- Modal de Visitantes no Mês por Loja ---- */}', startIndex);
  if (endIndex !== -1) {
    // The exact text to remove is from `closingBraceIndex` to `endIndex`
    const toRemove = content.substring(closingBraceIndex, endIndex);
    
    // BUT we need to leave the line breaks before the modal comment.
    content = content.substring(0, closingBraceIndex) + '\n\n      ' + content.substring(endIndex);
  }
}

fs.writeFileSync(path, content);
console.log('Fixed admin index.tsx');

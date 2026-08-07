const fs = require('fs');
const path = 'src/routes/admin/index.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix greeting
content = content.replace(
  /Painel Geral da Rede de Farmácias Associadas/,
  `{effectiveStoreId ? \`Visão da Loja: \${pharmacies.find(p => p.id === effectiveStoreId)?.nome}\` : "Painel Geral da Rede de Farmácias Associadas"}`
);

// Fix Carrinhos a recuperar calculation
content = content.replace(
  /const carrinhosRecuperar = storeCarts\.length \+ \(cartItems\.length > 0 \? 1 : 0\);/,
  `const carrinhosRecuperar = rawStoreCarts.length + (cartItems.length > 0 ? 1 : 0); // Always global`
);

// Replace the KPI lines rendering
const kpiSearch = `{/* ---- Linha 2 de KPIs Globais ---- */}
      {isGlobalView && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">`;
const kpiReplace = `{/* ---- Linha 2 de KPIs Globais (Sempre visível conforme solicitação) ---- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">`;

content = content.replace(kpiSearch, kpiReplace);

// Remove the closing brace of isGlobalView and the entire !isGlobalView block
// This requires a regex that matches from `)}` before `{/* ---- Linha 2 de KPIs por Loja ---- */}` up to the closing `)}` of !isGlobalView.
const regexToRemove = /\)\}\s*\{\/\* ---- Linha 2 de KPIs por Loja ---- \*\/\}\s*\{\!isGlobalView && \([\s\S]*?\)\}/;
content = content.replace(regexToRemove, '');

fs.writeFileSync(path, content);
console.log('Patched admin index.tsx');

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

// 3. To remove the `isGlobalView && (` wrap and the `{!isGlobalView && (...)}` block safely:
const searchBlockStart = '{/* ---- Linha 2 de KPIs Globais ---- */}\\n      {isGlobalView && (\\n        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">';
// Let's use a simpler replace strategy: string matching precisely on the JSX structure.

let lines = content.split('\\n');
let newLines = [];
let skipMode = false;
let openDivs = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  if (line.includes('{/* ---- Linha 2 de KPIs Globais ---- */}')) {
    newLines.push(line);
    // Skip the next line which is `{isGlobalView && (`
    i++;
    continue;
  }
  
  if (line.includes('{/* ---- Linha 2 de KPIs por Loja ---- */}')) {
    skipMode = true;
    // Look back and remove the `)}` that closed `isGlobalView`
    // It should be one or two lines above this.
    for (let j = newLines.length - 1; j >= 0; j--) {
      if (newLines[j].trim() === ')}') {
        newLines.splice(j, 1);
        break;
      }
    }
    continue;
  }
  
  if (skipMode) {
    if (line.includes('{/* ---- Modal de Visitantes no Mês por Loja ---- */}')) {
      skipMode = false;
      newLines.push(line);
    }
    continue;
  }
  
  newLines.push(line);
}

fs.writeFileSync(path, newLines.join('\\n'));
console.log('Fixed index.tsx cleanly!');

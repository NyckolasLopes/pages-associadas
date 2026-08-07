const fs = require('fs');

function patchAdminTsx() {
  const path = 'src/routes/admin.tsx';
  let content = fs.readFileSync(path, 'utf8');

  // Fix sidebar title
  const oldTitle = '{activeStoreId ? pharmacies.find(p => p.id === activeStoreId)?.nome : (isGlobalAdmin ? "Sede Administrativa" : "Farmácias Associadas")}';
  const newTitle = '{isGlobalAdmin ? "Sede Administrativa" : (activeStoreId ? pharmacies.find(p => p.id === activeStoreId)?.nome : "Farmácias Associadas")}';
  
  content = content.replaceAll(oldTitle, newTitle);

  const badgeStartStr = '{activeStoreId ? (\\r\\n                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 hidden md:block">\\r\\n                    {pharmacies.find(p => p.id === activeStoreId)?.categoriaAssociado || "Padrão"}\\r\\n                  </span>\\r\\n                ) : isGlobalAdmin ? (\\r\\n                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 hidden md:block">\\r\\n                    Sede Administrativa\\r\\n                  </span>\\r\\n                ) : null}';
  const badgeStartStrLF = badgeStartStr.replace(/\\r\\n/g, '\\n');
  const newBadgeStr = `{isGlobalAdmin ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 hidden md:block">
                    SEDE
                  </span>
                ) : activeStoreId ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 hidden md:block">
                    {pharmacies.find(p => p.id === activeStoreId)?.categoriaAssociado || "Padrão"}
                  </span>
                ) : null}`;

  content = content.replace(badgeStartStr, newBadgeStr).replace(badgeStartStrLF, newBadgeStr);

  fs.writeFileSync(path, content);
  console.log('Patched admin.tsx');
}

function patchIndexTsx() {
  const path = 'src/routes/admin/index.tsx';
  let content = fs.readFileSync(path, 'utf8');
  
  const block1Start = '{/* ---- Linha 2 de KPIs Globais ---- */}';
  const i1 = content.indexOf(block1Start);
  if (i1 !== -1) {
    const afterBlock1Start = content.substring(i1 + block1Start.length);
    // JUST search for the exact string and replace it with empty
    const exactStr = '\\n      {isGlobalView && (';
    const exactStr2 = '\\r\\n      {isGlobalView && (';
    let newAfter1 = afterBlock1Start.replace(exactStr, '');
    newAfter1 = newAfter1.replace(exactStr2, '');
    content = content.substring(0, i1 + block1Start.length) + newAfter1;
  }
  
  const block2Start = '{/* ---- Linha 2 de KPIs por Loja ---- */}';
  const i2 = content.indexOf(block2Start);
  if (i2 !== -1) {
    const beforeBlock2Start = content.substring(0, i2);
    const lastBrace = beforeBlock2Start.lastIndexOf(')}');
    
    const block3Start = '{/* ---- Modal de Visitantes no Mês por Loja ---- */}';
    const i3 = content.indexOf(block3Start);
    
    if (lastBrace !== -1 && i3 !== -1) {
      content = content.substring(0, lastBrace) + '\\n\\n      ' + content.substring(i3);
    }
  }

  fs.writeFileSync(path, content);
  console.log('Patched index.tsx');
}

patchAdminTsx();
patchIndexTsx();

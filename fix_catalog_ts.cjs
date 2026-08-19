const fs = require('fs');
let c = fs.readFileSync('src/services/catalog.ts', 'utf8');

c = c.replace(/p\.precosPorLoja\[pr\.loja_id\]/g, 'p.precosPorLoja![pr.loja_id]');
c = c.replace(/p\.estoquesPorLoja\[pr\.loja_id\]/g, 'p.estoquesPorLoja![pr.loja_id]');
c = c.replace(/storeP\.estoque = storeStock !== undefined \? storeStock : \(ov\.estoque !== undefined \? ov\.estoque : p\.estoque\);/g, 'storeP.estoque = storeStock !== undefined && storeStock !== null ? storeStock : (ov.estoque !== undefined ? ov.estoque : p.estoque) || 0;');
c = c.replace(/storeP\._searchString = /g, '(storeP as any)._searchString = ');
c = c.replace(/!storeP\.imagemPrincipal/g, '!(storeP as any).imagemPrincipal');
c = c.replace(/storeP\.imagemPrincipal = /g, '(storeP as any).imagemPrincipal = ');

fs.writeFileSync('src/services/catalog.ts', c);

const fs = require('fs');
const file = 'src/routes/admin/pedidos/index.tsx';
let content = fs.readFileSync(file, 'utf8');

// Hide Loja Faturamento header
content = content.replace(
  '<th className="px-3 py-3">Loja Faturamento</th>',
  '{isGlobalAdmin() && <th className="px-3 py-3">Loja Faturamento</th>}'
);

// Hide Loja Faturamento td
const tdOld = `<td className="px-3 py-3">
                           <div className="flex items-center gap-2">
                             <Store className="h-4 w-4 text-slate-400 shrink-0" />
                             <span className="font-bold text-slate-800 text-[13px] leading-tight break-words">{getLojaName(order.lojaId)}</span>
                           </div>
                        </td>`;
const tdNew = `{isGlobalAdmin() && (
                        <td className="px-3 py-3">
                           <div className="flex items-center gap-2">
                             <Store className="h-4 w-4 text-slate-400 shrink-0" />
                             <span className="font-bold text-slate-800 text-[13px] leading-tight break-words">{getLojaName(order.lojaId)}</span>
                           </div>
                        </td>
                        )}`;

if (content.includes(tdOld)) {
  content = content.replace(tdOld, tdNew);
  fs.writeFileSync(file, content);
  console.log('Successfully patched Loja Faturamento column');
} else {
  console.log('Could not find the tdOld to replace');
}

const fs = require('fs');
const file = 'src/routes/admin/lojas.index.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `<div className="font-bold text-slate-800 flex items-center gap-2">
                            {p.nome}
                            {p.categoriaAssociado === 'Parceiro' && (
                              <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Parceiro</span>
                            )}
                          </div>`;

content = content.replace(
  '<div className="font-bold text-slate-800">{p.nome}</div>',
  replacement
);

fs.writeFileSync(file, content);
console.log('Successfully patched lojas.index.tsx badge');

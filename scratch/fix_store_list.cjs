const fs = require('fs');
const path = 'src/routes/admin/lojas.index.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `                            {p.nome}
                            {p.categoriaAssociado === 'Parceiro' && (
                              <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Parceiro</span>
                            )}`;
const replaceStr = `                            {p.nome}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(path, content);
  console.log('Successfully replaced category name next to store name.');
} else {
  console.log('Could not find exact target string. Attempting with relaxed whitespace...');
  
  const searchPattern = /\{p\.nome\}\s*\{p\.categoriaAssociado === 'Parceiro' && \(\s*<span className="[^"]+">Parceiro<\/span>\s*\)\}/m;
  if (searchPattern.test(content)) {
    content = content.replace(searchPattern, '{p.nome}');
    fs.writeFileSync(path, content);
    console.log('Successfully replaced using regex.');
  } else {
    console.log('Still failed.');
  }
}

import fs from 'fs';

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the replacement character 
  content = content.replace(//g, '🔹');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', filePath);
}

fixFile('src/routes/_store.cart.tsx');
fixFile('src/routes/admin/pedidos/index.tsx');
fixFile('src/routes/admin/carrinhos-abandonados.tsx');

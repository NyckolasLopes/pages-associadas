const fs = require('fs');
const glob = require('glob'); // Assuming glob is available, or use a simple recursive read

const replaceInFile = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('\\u{1F539}')) {
    content = content.replace(/\\u\{1F539\}/g, '🔹');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed emojis in', file);
  }
};

const files = [
  'src/routes/_store.cart.tsx',
  'src/routes/_store.checkout.tsx',
  'src/routes/admin/pedidos/index.tsx',
  'src/routes/admin/carrinhos-abandonados.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    replaceInFile(f);
  }
});

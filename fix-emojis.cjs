const fs = require('fs');

const files = [
  'src/routes/_store.cart.tsx',
  'src/routes/admin/pedidos/index.tsx',
  'src/routes/admin/carrinhos-abandonados.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace all the specific emojis in the whatsapp strings with \u{1F539}
  // The characters were likely 💊, 🏬, 🔢, 📅, 👤, 🚚, 💳, 🛒, 💰, 🏷️, 🛵, 📝, 🔗, ❓, ❗, etc.
  // The safest way is to just replace all non-ascii characters within the backticks that define the message.
  // However, things like 'FARMÁCIAS' have 'Á' which is non-ascii.
  
  // Let's just manually replace the exact ones that appear at the start of lines.
  // In the file it looks like `?? *NOVO PEDIDO` when printed by cat, but it's an emoji in the raw file.
  content = content.replace(/💊|🏬|🔢|📅|👤|🚚|💳|🛒|💰|🏷️|🛵|📝|🔗|📦|🔍|🚨/g, '\\u{1F539}');
  
  // Also remove any literal \uFFFD just in case
  content = content.replace(/\uFFFD/g, '\\u{1F539}');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed emojis in', file);
}

const fs = require('fs');

const file = 'src/routes/_store.cart.tsx';
let content = fs.readFileSync(file, 'utf8');

// The line is: `?? *Subtotal:* R$ ${subtotal.toFixed(2)}\n` +
// So let's match any non-ascii characters or '?' before ' *Subtotal' and ' *Cupom'
content = content.replace(/[^\x00-\x7F]+\s*\*Subtotal/g, '\\u{1F539} *Subtotal');
content = content.replace(/[^\x00-\x7F]+\s*\*Cupom/g, '\\u{1F539} *Cupom');

// Also the divider `\n` (which was likely a long dash)
content = content.replace(/[^\x00-\x7F]+\\n/g, '---\\n');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed remaining in _store.cart.tsx');

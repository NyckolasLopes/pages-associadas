const fs = require('fs');
const file = 'src/types/index.ts';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `  endereco: string;
    telefone?: string;
    whatsapp?: string;`;

const replacementStr = `  endereco: string;
  categoriaAssociado?: 'Pleno' | 'Parceiro';
  telefone?: string;
  whatsapp?: string;`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(file, content);
  console.log('Successfully added categoriaAssociado');
} else {
  // Try another approach
  content = content.replace(
    '  endereco: string;\n    telefone?: string;\n    whatsapp?: string;',
    '  endereco: string;\n  categoriaAssociado?: \'Pleno\' | \'Parceiro\';\n  telefone?: string;\n  whatsapp?: string;'
  );
  fs.writeFileSync(file, content);
  console.log('Successfully added categoriaAssociado (fallback)');
}

const fs = require('fs');
let content = fs.readFileSync('src/routes/painel-loja.$lojaId.tsx', 'utf8');

// Replace defaultValue logic to just default to 'pedidos'
content = content.replace(/<Tabs defaultValue=\{can\([^}]+\} className="space-y-6">/g, '<Tabs defaultValue="pedidos" className="space-y-6">');

// Remove {can('loja_xyz') && ( and their closing )} for TabsTrigger and TabsContent
content = content.replace(/\{can\('loja_[a-z_]+'\)\s*&&\s*\(\s*(<Tabs(?:Trigger|Content)[^>]*>[\s\S]*?<\/Tabs(?:Trigger|Content)>)\s*\)\}/g, '$1');

fs.writeFileSync('src/routes/painel-loja.$lojaId.tsx', content);
console.log('Done');

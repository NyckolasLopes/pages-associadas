const fs = require('fs');
const file = 'src/routes/admin/lojas.index.tsx';
let content = fs.readFileSync(file, 'utf8');

const selectHTML = `              <div className="space-y-1.5 sm:col-span-2">
                <FieldLabel required>Categoria do Associado</FieldLabel>
                <Select value={form.categoriaAssociado || "Pleno"} onValueChange={(val) => update({ categoriaAssociado: val as any })}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pleno">Pleno (Layout da Rede)</SelectItem>
                    <SelectItem value="Parceiro">Parceiro (Layout Neutro/OpenSource)</SelectItem>
                  </SelectContent>
                </Select>
              </div>`;

content = content.replace(
  '            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">\n              <div className="space-y-1.5 sm:col-span-2">\n                <FieldLabel required>Nome Fantasia</FieldLabel>',
  `            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">\n${selectHTML}\n              <div className="space-y-1.5 sm:col-span-2">\n                <FieldLabel required>Nome Fantasia</FieldLabel>`
);

fs.writeFileSync(file, content);
console.log('Successfully patched lojas.index.tsx');

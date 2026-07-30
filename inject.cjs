const fs = require('fs');

const novaStr = fs.readFileSync('src/routes/admin/lojas.nova.tsx', 'utf-8');
const indexStr = fs.readFileSync('src/routes/admin/lojas.index.tsx', 'utf-8');

const novaStart = novaStr.indexOf('{/* ========== DADOS DA LOJA ========== */}');
const novaEnd = novaStr.lastIndexOf('</FormSection>');
const formBody = novaStr.substring(novaStart, novaEnd + 14);

// We want to insert the "Loja Ativa" toggle at the top of Dados da Loja.
const lojaAtivaToggle = `
                <div className="bg-slate-50 border rounded-lg p-4 mb-4">
                  <RadioToggle
                    label="Loja Ativa no E-commerce?"
                    value={form.ativo ?? true}
                    onChange={(v) => update({ ativo: v })}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Lojas inativas não aparecerão na busca de CEP nem na listagem de retirada.
                  </p>
                </div>
`;

let finalBody = formBody.replace(
  '<div className="grid gap-4">',
  '<div className="grid gap-4">\n' + lojaAtivaToggle
);

const indexStart = indexStr.indexOf('{/* ========== DADOS DA LOJA ========== */}');
const indexEnd = indexStr.indexOf('<DialogFooter className="pt-4 border-t">');

if (indexStart !== -1 && indexEnd !== -1) {
  const beforeFooter = indexStr.substring(0, indexEnd);
  const endOfFormBody = beforeFooter.lastIndexOf('</div>');
  
  const newIndexStr = indexStr.substring(0, indexStart) + finalBody + '\n          ' + indexStr.substring(endOfFormBody);
  fs.writeFileSync('src/routes/admin/lojas.index.tsx', newIndexStr, 'utf-8');
  console.log('Successfully injected form into lojas.index.tsx');
} else {
  console.log('Failed to find markers in lojas.index.tsx');
}

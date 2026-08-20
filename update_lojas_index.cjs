const fs = require('fs');

let content = fs.readFileSync('src/routes/admin/lojas.index.tsx', 'utf8');

// Replace the inline form in modal with LojaFormFields
const regex = /<FormSection icon=\{<Store className="h-4 w-4 text-primary" \/>\} title="Dados da Loja">[\s\S]*?<\/DialogFooter>/;

const replacement = `<div className="bg-slate-50 border rounded-lg p-4 mb-4">
                  <RadioToggle
                    label="Loja Ativa no E-commerce?"
                    value={form.ativo ?? true}
                    onChange={(v) => update({ ativo: v })}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Lojas inativas não aparecerão na busca de CEP nem na listagem de retirada.
                  </p>
                </div>
                
                <LojaFormFields form={form} update={update} />
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="font-bold">
              Salvar Loja
            </Button>
          </DialogFooter>`;

content = content.replace(regex, replacement);

if (!content.includes('import { LojaFormFields }')) {
  content = `import { LojaFormFields } from "@/components/admin/LojaFormFields";\n` + content;
}

fs.writeFileSync('src/routes/admin/lojas.index.tsx', content);
console.log("Updated lojas.index.tsx");

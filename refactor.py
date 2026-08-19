import os

def replace_between(filename, start_marker, end_marker, replacement, prefix_import=None):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    start_idx = content.find(start_marker)
    if start_idx == -1:
        print(f"Start marker not found in {filename}")
        return
    
    # We want to replace starting from the start_marker itself
    end_idx = content.find(end_marker, start_idx)
    if end_idx == -1:
        print(f"End marker not found in {filename}")
        return
    
    new_content = content[:start_idx] + replacement + content[end_idx:]
    if prefix_import:
        new_content = prefix_import + new_content
        
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully updated {filename}")

# For lojas.nova.tsx
admin_start = '{/* ========== DADOS DA LOJA ========== */}'
admin_end = '      </div>\n    </div>\n  );\n}'
admin_rep = '<LojaFormFields form={form} update={update} />\n'
admin_import = 'import { LojaFormFields } from "@/components/admin/LojaFormFields";\n'

replace_between('src/routes/admin/lojas.nova.tsx', admin_start, admin_end, admin_rep, admin_import)

# For inscricao.$token.tsx
pub_start = '{/* ========== DADOS DA LOJA ========== */}'
pub_end = '          <div className="pt-6 border-t flex justify-end">'
pub_rep = '<LojaFormFields form={form} update={update} />\n'
pub_import = 'import { LojaFormFields } from "@/components/admin/LojaFormFields";\n'

replace_between('src/routes/inscricao.$token.tsx', pub_start, pub_end, pub_rep, pub_import)


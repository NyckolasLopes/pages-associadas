import sys
from pathlib import Path
content = Path('src/routes/admin/lojas.index.tsx').read_text(encoding='utf-8')
content = content.replace("supabase.functions.invoke('create_loja_api_key'", "(supabase.functions.invoke as any)('create_loja_api_key'")
content = content.replace("supabase.functions.invoke('validate_loja_api_key'", "(supabase.functions.invoke as any)('validate_loja_api_key'")
Path('src/routes/admin/lojas.index.tsx').write_text(content, encoding='utf-8')


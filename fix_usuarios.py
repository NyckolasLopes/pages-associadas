import sys
from pathlib import Path
content = Path('src/routes/admin/usuarios.tsx').read_text(encoding='utf-8')
content = content.replace("supabase.from('profiles')", "supabase.from('profiles' as any)")
Path('src/routes/admin/usuarios.tsx').write_text(content, encoding='utf-8')

import re

fp = 'src/routes/admin/index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

# Add useOrdersKpis to imports
if 'useOrdersKpis' not in content:
    content = content.replace(
        'import { useAdmin } from "@/stores/admin";',
        'import { useAdmin } from "@/stores/admin";\nimport { useOrdersKpis } from "@/hooks/useOrdersQuery";'
    )

# Find where it calculates storeCarts and carrinhosRecuperar
# const storeCarts = effectiveStoreId ? rawStoreCarts.filter(c => c.lojaId === effectiveStoreId) : rawStoreCarts;
# const carrinhosRecuperar = storeCarts.length;

hook_call = '''
  const { data: dbKpis } = useOrdersKpis(effectiveStoreId || undefined);
'''

# We will inject the hook right before const storeCarts
content = content.replace(
    'const storeCarts = effectiveStoreId ? rawStoreCarts.filter',
    hook_call + '\n  const storeCarts = effectiveStoreId ? rawStoreCarts.filter'
)

# Replace carrinhosRecuperar
content = content.replace(
    'const carrinhosRecuperar = storeCarts.length;',
    'const carrinhosRecuperar = storeCarts.length + (dbKpis?.pendentes || 0);'
)

with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)

print('admin/index.tsx fixed')

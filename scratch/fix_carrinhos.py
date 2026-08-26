import re

fp = 'src/routes/admin/carrinhos-abandonados.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

# Add useOrdersKpis to imports
content = content.replace(
    'import { useOrdersQuery } from "@/hooks/useOrdersQuery";',
    'import { useOrdersQuery, useOrdersKpis } from "@/hooks/useOrdersQuery";'
)

# Insert hook after useOrdersQuery
hook_call = '''
  const { data: dbKpis } = useOrdersKpis(activeStoreId || undefined);
'''
content = re.sub(
    r'(const totalOrdersCount = ordersResponse\?\.count \|\| 0;)',
    r'\1\n' + hook_call,
    content
)

# Update KPIs calculation
old_kpis = '''    const kpis = {
      total: allUnifiedOrders.length,
      concluidos: orders.length,
      carrinhosARecuperar: allAbandonedCarts.length,
    };'''
new_kpis = '''    const kpis = {
      total: (dbKpis?.total || 0) + allAbandonedCarts.length,
      concluidos: dbKpis?.concluidos || 0,
      carrinhosARecuperar: (dbKpis?.pendentes || 0) + allAbandonedCarts.length,
    };'''
content = content.replace(old_kpis, new_kpis)

with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)

print('carrinhos-abandonados.tsx fixed')

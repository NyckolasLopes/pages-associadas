import re

fp = 'src/hooks/useOrdersQuery.ts'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

# In useOrdersQuery, fix the status filter
old_filter = '''      if (status && status !== 'todos') {
        query = query.eq('status', status);
      }'''

new_filter = '''      if (status && status !== 'todos') {
        if (status === 'Pendente') {
           query = query.not('status', 'ilike', '%conclu%').not('status', 'ilike', '%cancel%');
        } else {
           query = query.eq('status', status);
        }
      }'''

content = content.replace(old_filter, new_filter)
with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed useOrdersQuery')

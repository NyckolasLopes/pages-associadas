import re

fp = 'src/routes/admin/pedidos/index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'status: order.status || "novo",',
    'status: (order.status || "Concluído") as any,'
)

with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)

print('pedidos type fixed')

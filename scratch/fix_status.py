import re

fp = 'src/routes/admin/pedidos/index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'status: mainView === "carrinhos" ? undefined : (mainView === "concluidos" ? "Concluído" : undefined),',
    'status: mainView === "carrinhos" ? "Pendente" : (mainView === "concluidos" ? "Concluído" : undefined),'
)

with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)

fp2 = 'src/routes/admin/carrinhos-abandonados.tsx'
with open(fp2, 'r', encoding='utf-8') as f:
    content2 = f.read()
    
# In carrinhos-abandonados, mainView is always "carrinhos"
content2 = content2.replace(
    'status: mainView === "carrinhos" ? undefined : (mainView === "concluidos" ? "Concluído" : undefined),',
    'status: "Pendente",'
)

with open(fp2, 'w', encoding='utf-8') as f:
    f.write(content2)

print('status filter fixed')

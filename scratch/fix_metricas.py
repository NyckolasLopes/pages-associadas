import re

fp = 'src/routes/admin/metricas.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

old_if = '''  // Carrinho abandonado / Aguardando pagamento -> Pendente
  if (statusStr === "abandonado no carrinho" || origemStr === "carrinho") {
    return { label: "Pendente", desc: "Abandonado no carrinho" };
  }'''

new_if = '''  // Carrinho abandonado / Aguardando pagamento -> Pendente
  if (statusStr === "abandonado no carrinho" || origemStr === "carrinho" || statusStr === "pendente" || statusStr === "novo") {
    return { label: "Pendente", desc: "Abandonado no carrinho" };
  }'''

content = content.replace(old_if, new_if)

with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)

print('metricas.tsx fixed')

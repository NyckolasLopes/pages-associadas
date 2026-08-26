import re

fp = 'src/routes/_store.cart.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the Entrega button onClick
content = content.replace(
    'onClick={() => setDeliveryMethod("entrega")}',
    '''onClick={() => {
                      setDeliveryMethod("entrega");
                      if (selected === "pickup") {
                        const firstDelivery = freight?.find(f => f.id !== "pickup");
                        if (firstDelivery) setSelected(firstDelivery.id);
                      }
                    }}'''
)

# Fix summary box 1 (around line 1528)
# Look for: {deliveryMethod === "retirada" ? ( ... ) : selectedFreight ? ( freightPrice === 0 ? ... : ... ) : ( "A calcular" )}
old_summary1 = '''{deliveryMethod === "retirada" ? (
                  <span className="text-emerald-600 font-bold">Grátis</span>
                ) : selectedFreight ? (
                  freightPrice === 0 ? <span className="text-emerald-600 font-bold">Grátis</span> : brl(freightPrice)
                ) : (
                  "A calcular"
                )}'''

new_summary1 = '''{deliveryMethod === "retirada" ? (
                  <span className="text-emerald-600 font-bold">Grátis</span>
                ) : (selectedFreight && selectedFreight.id !== "pickup") ? (
                  freightPrice === 0 ? <span className="text-emerald-600 font-bold">Grátis</span> : brl(freightPrice)
                ) : (
                  <span className="text-muted-foreground text-xs">A calcular</span>
                )}'''

content = content.replace(old_summary1, new_summary1)

# Fix summary box 2 (around line 1585 inside the green box)
old_summary2 = '''{deliveryMethod === "entrega" && (
                    <div className="flex justify-between text-sm text-emerald-800">
                      <span>Frete</span>
                      <span>{freightPrice === 0 ? <span className="text-emerald-600 font-bold">Grátis</span> : brl(freightPrice)}</span>
                    </div>
                  )}'''

new_summary2 = '''{deliveryMethod === "entrega" && (
                    <div className="flex justify-between text-sm text-emerald-800">
                      <span>Frete</span>
                      <span>{(selectedFreight && selectedFreight.id !== "pickup") ? (freightPrice === 0 ? <span className="text-emerald-600 font-bold">Grátis</span> : brl(freightPrice)) : <span className="text-emerald-700/70 text-xs">A calcular</span>}</span>
                    </div>
                  )}'''

content = content.replace(old_summary2, new_summary2)

with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)

print('Cart fixed')

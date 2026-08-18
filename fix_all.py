import sys

# 1. logistica.tsx route cast
p1 = 'src/routes/admin/logistica.tsx'
c1 = open(p1, 'r', encoding='utf-8').read()
c1 = c1.replace("createFileRoute('/admin/logistica')", "createFileRoute('/admin/logistica' as any)")
open(p1, 'w', encoding='utf-8').write(c1)

# 2. admin.ts: add apiKeyTemp to Pharmacy
p2 = 'src/stores/admin.ts'
c2 = open(p2, 'r', encoding='utf-8').read()
if 'apiKeyTemp?: string;' not in c2:
    c2 = c2.replace('api_key?: string;', 'api_key?: string;\n  apiKeyTemp?: string;')
open(p2, 'w', encoding='utf-8').write(c2)

# 3 & 4. marketing.promocoes.nova.tsx
p3 = 'src/routes/admin/marketing.promocoes.nova.tsx'
c3 = open(p3, 'r', encoding='utf-8').read()
c3 = c3.replace('bannerUrl: bannerUrl,', '')
c3 = c3.replace("bannerUrl: typeof promoData.banner_url === 'string' ? promoData.banner_url : undefined,", "bannerUrl: (typeof promoData.banner_url === 'string' ? promoData.banner_url : (promoData.banner_url as any)?.caminhoImagem) || undefined,")
c3 = c3.replace("bannerMobileUrl: typeof promoData.banner_mobile_url === 'string' ? promoData.banner_mobile_url : undefined,", "bannerMobileUrl: (typeof promoData.banner_mobile_url === 'string' ? promoData.banner_mobile_url : (promoData.banner_mobile_url as any)?.caminhoImagem) || undefined,")
open(p3, 'w', encoding='utf-8').write(c3)

# 5. produtos.api-conexoes.tsx
p4 = 'src/routes/admin/produtos.api-conexoes.tsx'
c4 = open(p4, 'r', encoding='utf-8').read()
c4 = c4.replace("supabase.from('store_api_connections')", "(supabase.from('store_api_connections') as any)")
open(p4, 'w', encoding='utf-8').write(c4)

# 6. produtos.precos.tsx await
p5 = 'src/routes/admin/produtos.precos.tsx'
c5 = open(p5, 'r', encoding='utf-8').read()
c5 = c5.replace('const result = importStoreSpreadsheet(store.id, previewData);', 'const result = await importStoreSpreadsheet(store.id, previewData);')
open(p5, 'w', encoding='utf-8').write(c5)

# 7. produtos.tsx
p6 = 'src/routes/admin/produtos.tsx'
c6 = open(p6, 'r', encoding='utf-8').read()
c6 = c6.replace('categoriesData.categorias.find', 'categoriesData.find')
c6 = c6.replace('getDeterministicStock(p, currentLojaId)', 'getDeterministicStock(p, currentLojaId || undefined)')
open(p6, 'w', encoding='utf-8').write(c6)

# 8. usuarios.tsx
p7 = 'src/routes/admin/usuarios.tsx'
c7 = open(p7, 'r', encoding='utf-8').read()
c7 = c7.replace("supabase.from('profiles')", "(supabase.from('profiles') as any)")
open(p7, 'w', encoding='utf-8').write(c7)

print('All python fixes applied')

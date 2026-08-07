const fs = require('fs');
const path = 'src/routes/admin/banners.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace:
// const banners = useAdmin(s => s.banners);
// With:
// const activeStoreId = useAdmin(s => s.activeStoreId);
// const allBanners = useAdmin(s => s.banners);
// const banners = activeStoreId ? allBanners.filter(b => b.lojaId === activeStoreId) : allBanners.filter(b => !b.lojaId);

content = content.replace(
  /const banners = useAdmin\(s => s\.banners\);/,
  `const activeStoreId = useAdmin(s => s.activeStoreId);
  const allBanners = useAdmin(s => s.banners);
  const banners = activeStoreId ? allBanners.filter(b => b.lojaId === activeStoreId) : allBanners.filter(b => !b.lojaId);`
);

// We also need to add lojaId to new banners
// Replace:
// id: \`banner_\${Date.now()}\`,
// With:
// id: \`banner_\${Date.now()}\`,
// lojaId: activeStoreId || undefined,

content = content.replace(
  /id: `banner_\$\{Date\.now\(\)\}`,/,
  "id: `banner_${Date.now()}`,\n          lojaId: activeStoreId || undefined,"
);

fs.writeFileSync(path, content);
console.log('Banners patched successfully!');

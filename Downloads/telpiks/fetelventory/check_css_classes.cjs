const fs = require('fs');
const path = require('path');

const pageFiles = fs.readdirSync('src/pages').filter(f => f.endsWith('.jsx'));

for (const pf of pageFiles) {
  const fullPath = path.join('src/pages', pf);
  const code = fs.readFileSync(fullPath, 'utf8');

  // cari import css lokal (bukan dashboard.css/global.css yg dimuat global)
  const cssImportMatch = [...code.matchAll(/import\s+["'](\.\.\/styles\/[a-zA-Z0-9_-]+\.css)["']/g)];
  if (cssImportMatch.length === 0) continue;

  // kumpulkan semua nama file CSS yang relevan untuk halaman ini (termasuk dashboard.css yang selalu ada via global import)
  let cssContent = '';
  for (const m of cssImportMatch) {
    const cssPath = path.resolve('src/pages', m[1]);
    if (fs.existsSync(cssPath)) cssContent += fs.readFileSync(cssPath, 'utf8');
  }
  // dashboard.css selalu tersedia karena diimport di banyak tempat & dipakai global oleh dash-modal-overlay dll
  const dashboardCss = fs.readFileSync('src/styles/dashboard.css', 'utf8');
  cssContent += dashboardCss;
  const animCss = fs.readFileSync('src/styles/animations.css', 'utf8');
  cssContent += animCss;

  // ekstrak semua className="..." statis (yang bukan template literal/expression)
  const classNameMatches = [...code.matchAll(/className=["']([^"'{}]+)["']/g)];
  const usedClasses = new Set();
  for (const m of classNameMatches) {
    for (const cls of m[1].split(/\s+/)) {
      if (cls) usedClasses.add(cls);
    }
  }

  const missing = [];
  for (const cls of usedClasses) {
    const re = new RegExp(`\\.${cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (!re.test(cssContent)) {
      missing.push(cls);
    }
  }

  if (missing.length > 0) {
    console.log(`=== ${pf} ===`);
    console.log('Missing classes:', missing.join(', '));
  }
}
console.log('\nDone checking CSS classes.');

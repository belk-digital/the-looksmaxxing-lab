const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) results = results.concat(walk(file));
    else if (file.endsWith('.ts')) results.push(file);
  });
  return results;
}
const files = [...walk('./src/access'), ...walk('./src/collections'), ...walk('./src/hooks')];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/import\s+(type\s+)?\{\s*Access\s*\}\s+from\s+'payload'/g, "import type { CollectionAccess } from 'payload'");
  content = content.replace(/:\s*Access\s*=/g, ": CollectionAccess =");
  content = content.replace(/BeforeChangeHook/g, "CollectionBeforeChangeHook");
  content = content.replace(/AfterChangeHook/g, "CollectionAfterChangeHook");
  fs.writeFileSync(f, content);
});

const fs = require('fs');
const path = require('path');

const accessDir = './src/access';
const files = fs.readdirSync(accessDir).filter(f => f.endsWith('.ts'));

files.forEach(f => {
  const filePath = path.join(accessDir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/:\s*Access\b/g, ': CollectionAccess');
  content = content.replace(/create:\s*Access/g, 'create: CollectionAccess');
  content = content.replace(/update:\s*Access/g, 'update: CollectionAccess');
  content = content.replace(/read:\s*Access/g, 'read: CollectionAccess');
  content = content.replace(/delete:\s*Access/g, 'delete: CollectionAccess');
  
  // also fix missing CollectionAccess imports if Access is not there
  if (!content.includes("import type { CollectionAccess } from 'payload'") && !content.includes("import { CollectionAccess } from 'payload'")) {
     content = "import type { CollectionAccess } from 'payload';\n" + content;
  }

  fs.writeFileSync(filePath, content);
});

const hooksDir = './src/hooks';
const hookFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.ts'));
hookFiles.forEach(f => {
  const filePath = path.join(hooksDir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/CollectionCollectionBeforeChangeHook/g, 'CollectionBeforeChangeHook');
  content = content.replace(/import { HookArgs } from 'payload'/g, 'import type { CollectionBeforeChangeHook } from "payload"');
  fs.writeFileSync(filePath, content);
});

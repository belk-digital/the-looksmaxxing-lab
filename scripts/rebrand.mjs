import fs from 'fs';
import path from 'path';

const searchTerms = [
  { search: /The Looksmaxxing Lab/g, replace: 'Longevia Research' },
  { search: /thelooksmaxxinglab\.com/g, replace: 'longeviaresearch.com' },
  { search: /thelooksmaxxinglab/g, replace: 'longeviaresearch' },
  { search: /Looksmaxxing Lab/g, replace: 'Longevia Research' },
  { search: /looksmaxxing/gi, replace: 'longevia' } // catch all remaining case-insensitive instances
];

const directories = [
  'src',
  'public',
];

const excludeDirs = ['node_modules', '.next', '.git', 'dist', 'build', '.payload'];
const allowedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.html', '.css', '.scss'];

function walkAndReplace(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        walkAndReplace(fullPath);
      }
    } else {
      const ext = path.extname(fullPath);
      if (allowedExtensions.includes(ext) || file === '.env' || file === '.env.example' || file === '.env.local') {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;

        for (const { search, replace } of searchTerms) {
          if (search.test(content)) {
            content = content.replace(search, replace);
            modified = true;
          }
        }

        if (modified) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Updated ${fullPath}`);
        }
      }
    }
  }
}

for (const dir of directories) {
  const fullDirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullDirPath)) {
    walkAndReplace(fullDirPath);
  }
}

// Also process top level files
const topLevelFiles = ['package.json', 'README.md', '.env', '.env.local', 'next.config.mjs'];
for (const file of topLevelFiles) {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    for (const { search, replace } of searchTerms) {
      if (search.test(content)) {
        content = content.replace(search, replace);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Updated ${fullPath}`);
    }
  }
}

console.log('Done rebranding.');

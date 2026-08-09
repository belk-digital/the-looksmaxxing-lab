import fs from 'fs';
import path from 'path';

function walk(dir: string, cb: (f: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if(fs.statSync(p).isDirectory()) walk(p, cb);
    else cb(p);
  });
}

function processDir(dir: string) {
  walk(dir, f => {
    if(f.endsWith('.tsx')) {
      let content = fs.readFileSync(f, 'utf8');
      let regex = /alt=[\"'](.*?)[\"']/g;
      let match;
      let matches = [];
      while ((match = regex.exec(content)) !== null) {
        matches.push(match[1]);
      }
      if(matches.length > 0) {
        console.log(path.basename(f) + ':');
        matches.forEach(m => console.log('  - ' + m));
      }
    }
  });
}

console.log("HOME COMPONENTS:");
processDir('src/components/home');

console.log("\nFRONTEND PAGES:");
processDir('src/app/(frontend)');

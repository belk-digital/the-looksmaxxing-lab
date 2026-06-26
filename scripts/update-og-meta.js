import fs from 'fs';
import path from 'path';

const updates = [
  { file: 'src/app/(frontend)/layout.tsx', og: 'og-home.png', alt: 'The Looksmaxxing Lab — Research-Grade Peptides', isLayout: true },
  { file: 'src/app/(frontend)/page.tsx', og: 'og-home.png', alt: 'The Looksmaxxing Lab — Research-Grade Peptides' },
  { file: 'src/app/(frontend)/shop/page.tsx', og: 'og-shop.png', alt: 'Shop Research Peptides — The Looksmaxxing Lab' },
  { file: 'src/app/(frontend)/about/page.tsx', og: 'og-about.png', alt: 'About The Looksmaxxing Lab' },
  { file: 'src/app/(frontend)/faq/page.tsx', og: 'og-faq.png', alt: 'Research Peptide FAQ — The Looksmaxxing Lab' },
  { file: 'src/app/(frontend)/contact/layout.tsx', og: 'og-contact.png', alt: 'Contact The Looksmaxxing Lab' },
  { file: 'src/app/(frontend)/certificates/layout.tsx', og: 'og-certificates.png', alt: 'Certificates of Analysis — The Looksmaxxing Lab' },
  { file: 'src/app/(frontend)/journal/layout.tsx', og: 'og-journal.png', alt: 'Research Journal — The Looksmaxxing Lab' },
  { file: 'src/app/(frontend)/peptide-calculator/page.tsx', og: 'og-calculator.png', alt: 'Peptide Reconstitution Calculator — The Looksmaxxing Lab' },
  { file: 'src/app/(frontend)/affiliates/page.tsx', og: 'og-affiliates.png', alt: 'Affiliate Program — The Looksmaxxing Lab' }
];

for (const {file, og, alt, isLayout} of updates) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) {
    console.log("Not found:", file);
    continue;
  }
  let content = fs.readFileSync(p, 'utf8');
  const imageStr = `images: [{ url: '/og/${og}', width: 1200, height: 630, alt: '${alt.replace(/'/g, "\\'")}' }],`;

  if (isLayout) {
    // Replace layout.tsx specifically
    content = content.replace(/images:\s*\[\s*\{\s*url:\s*'\/hero-image\.png',\s*width:\s*1200,\s*height:\s*630,\s*alt:\s*'.*?',\s*\},\s*\],/s, imageStr);
    content = content.replace(/images:\s*\['\/hero-image\.png'\],?/s, `images: ['/og/${og}'],`);
  } else {
    if (content.includes('openGraph: {')) {
      content = content.replace(/openGraph:\s*\{/, `openGraph: {\n    ${imageStr}`);
    } else {
      content = content.replace(/export const metadata.*?\{/, match => `${match}\n  openGraph: {\n    ${imageStr}\n  },`);
    }
  }
  
  fs.writeFileSync(p, content, 'utf8');
  console.log("Updated", file);
}

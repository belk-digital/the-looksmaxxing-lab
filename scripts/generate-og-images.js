import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const mappings = [
  {
    bg: 'glow-and-nad-bg-image.webp',
    out: 'og-about.webp',
    title: 'About Longevia Research'
  },
  {
    bg: 'hero-image-longevia.webp',
    out: 'og-affiliates.webp',
    title: 'Affiliate Program'
  },
  {
    bg: 'three-flying-vials.webp',
    out: 'og-calculator.webp',
    title: 'Peptide Reconstitution Calculator'
  },
  {
    bg: 'motsc-and-retatrutide-on-ice.png',
    out: 'og-certificates.webp',
    title: 'COA Library &amp; Testing'
  },
  {
    bg: 'mots-c-onwater.png',
    out: 'og-contact.webp',
    title: 'Contact Us'
  },
  {
    bg: 'longevia-hero.webp',
    out: 'og-faq.webp',
    title: 'Frequently Asked Questions'
  },
  {
    bg: 'vials-on-magazine.webp',
    out: 'og-home.webp',
    title: 'Premium Research Peptides'
  },
  {
    bg: 'longevia-hero.webp',
    out: 'og-journal.webp',
    title: 'The Research Journal'
  },
  {
    bg: 'glow-and-nad-bg-image.webp',
    out: 'og-shop.webp',
    title: 'Shop Research Peptides'
  }
];

const IMAGES_DIR = path.join(process.cwd(), 'public', 'New Images');
const OUT_DIR = path.join(process.cwd(), 'public', 'og');

async function generate() {
  for (const item of mappings) {
    const bgPath = path.join(IMAGES_DIR, item.bg);
    const outPath = path.join(OUT_DIR, item.out);
    
    if (!fs.existsSync(bgPath)) {
      console.error(`Background image not found: ${bgPath}`);
      continue;
    }

    const titleFontSize = item.title.length > 25 ? 48 : 56;

    const svg = `
      <svg width="1200" height="630">
        <rect width="1200" height="630" fill="rgba(0,0,0,0.6)" />
        <text x="600" y="270" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="600" fill="#ffffff" text-anchor="middle" letter-spacing="6">LONGEVIA RESEARCH</text>
        <text x="600" y="360" font-family="system-ui, -apple-system, sans-serif" font-size="${titleFontSize}" font-weight="800" fill="#ffffff" text-anchor="middle">${item.title}</text>
        <text x="600" y="560" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="400" fill="#aaaaaa" text-anchor="middle" letter-spacing="2">longeviaresearch.com</text>
      </svg>
    `;

    try {
      await sharp(bgPath)
        .resize(1200, 630, { fit: 'cover', position: 'center' })
        .composite([{ input: Buffer.from(svg) }])
        .webp({ quality: 90 })
        .toFile(outPath);
      
      console.log(`Generated ${item.out}`);
    } catch (e) {
      console.error(`Error generating ${item.out}:`, e);
    }
  }
}

generate().then(() => console.log('Done!'));

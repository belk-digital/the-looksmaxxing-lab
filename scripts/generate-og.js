import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const configs = [
  {
    name: 'og-home.png',
    bg: 'public/Featured Images/vials-on-magazine.webp',
    headline: 'The Looksmaxxing Lab',
    subtext: 'Research-Grade Peptides · COA-Verified · ≥99% HPLC Purity'
  },
  {
    name: 'og-shop.png',
    bg: 'public/Featured Images/three-floating-vials.webp',
    headline: 'Shop Research Peptides',
    subtext: '30+ COA-Verified Compounds · ≥99% Purity · US Based'
  },
  {
    name: 'og-about.png',
    bg: 'public/Featured Images/us-based-synthesis.webp',
    headline: 'About The Looksmaxxing Lab',
    subtext: 'US Research Peptide Supplier · Founded 2024'
  },
  {
    name: 'og-faq.png',
    bg: 'public/Featured Images/scientist-at-microscope.webp',
    headline: 'Research Peptide FAQ',
    subtext: 'Purity Standards · Ordering · Storage · COA Verification'
  },
  {
    name: 'og-contact.png',
    bg: 'public/Featured Images/clear-dropper-side-profile.webp',
    headline: 'Contact Us',
    subtext: 'Research Peptide Support · Fast Response Times'
  },
  {
    name: 'og-certificates.png',
    bg: 'public/Featured Images/nad-retatrutide-vials-on-ice.webp',
    headline: 'Certificates of Analysis',
    subtext: 'Third-Party Lab Verified · ≥99% HPLC Purity · Batch Traceable'
  },
  {
    name: 'og-journal.png',
    bg: 'public/Featured Images/white-blue-dna-helix.webp',
    headline: 'Research Journal',
    subtext: 'Peptide Science · Lab Insights · Compound Guides'
  },
  {
    name: 'og-calculator.png',
    bg: 'public/Featured Images/glass-dna-strand.webp',
    headline: 'Peptide Reconstitution Calculator',
    subtext: 'Free Tool · Calculate Your Research Doses'
  },
  {
    name: 'og-affiliates.png',
    bg: 'public/Featured Images/affiliates-hero.webp',
    headline: 'Affiliate Program',
    subtext: 'Earn 15% Commission · Real-Time Tracking · Fast Payouts'
  }
];

const outDir = path.join(process.cwd(), 'public', 'og');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function generate() {
  for (const conf of configs) {
    const bgPath = path.join(process.cwd(), conf.bg);
    const outPath = path.join(outDir, conf.name);

    const subtext = conf.subtext.replace(/≥/g, '&#8805;');

    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="1200" height="630" fill="black" fill-opacity="0.6" />
        <text x="600" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="#f5f5f0" text-anchor="middle" letter-spacing="4">THE LOOKSMAXXING LAB</text>
        <text x="600" y="330" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="800" fill="#f5f5f0" text-anchor="middle">${conf.headline}</text>
        <text x="600" y="400" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="400" fill="#f5f5f0" text-anchor="middle" fill-opacity="0.9">${subtext}</text>
      </svg>
    `;

    await sharp(bgPath)
      .resize(1200, 630, { fit: 'cover', position: 'center' })
      .composite([{ input: Buffer.from(svg), blend: 'over' }])
      .png()
      .toFile(outPath);
      
    console.log('Generated ' + conf.name);
  }
}

generate().catch(console.error);

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const bgPath = path.join(process.cwd(), 'public', 'New Images', 'longevia-hero-landscape.png');

const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.45" />
      <stop offset="50%" stop-color="#000000" stop-opacity="0.58" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.78" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#overlay)" />
  
  <!-- Top Brand -->
  <text x="600" y="220" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600" fill="#D4AF37" text-anchor="middle" letter-spacing="8">LONGEVIA RESEARCH</text>
  
  <!-- Main Headline -->
  <text x="600" y="320" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">Premium Research Peptides</text>
  
  <!-- Subtitle -->
  <text x="600" y="385" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="400" fill="#E5E5E5" text-anchor="middle" letter-spacing="1">US-Synthesized &#183; &#8805;99% HPLC Purity &#183; COA Verified</text>
  
  <!-- Website URL -->
  <text x="600" y="540" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#A3A3A3" text-anchor="middle" letter-spacing="3">longeviaresearch.com</text>
</svg>
`;

async function run() {
  const base = sharp(bgPath).resize(1200, 630, { fit: 'cover', position: 'center' });
  const compositedBuffer = await base.composite([{ input: Buffer.from(svg) }]).toBuffer();

  // Compressed WebP output (~50-80 KB)
  await sharp(compositedBuffer).webp({ quality: 85 }).toFile('public/og/og-home.webp');
  await sharp(compositedBuffer).webp({ quality: 85 }).toFile('public/og/longevia-hero-landscape.webp');
  
  // Compressed PNG output (~200-400 KB)
  await sharp(compositedBuffer).png({ compressionLevel: 9, quality: 85 }).toFile('public/og/og-home.png');
  await sharp(compositedBuffer).png({ compressionLevel: 9, quality: 85 }).toFile('public/og/longevia-hero-landscape.png');

  console.log('og-home.webp size:', fs.statSync('public/og/og-home.webp').size, 'bytes');
  console.log('og-home.png size:', fs.statSync('public/og/og-home.png').size, 'bytes');
  console.log('longevia-hero-landscape.png size:', fs.statSync('public/og/longevia-hero-landscape.png').size, 'bytes');
  console.log('longevia-hero-landscape.webp size:', fs.statSync('public/og/longevia-hero-landscape.webp').size, 'bytes');
}

run().catch(console.error);

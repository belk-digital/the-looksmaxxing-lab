import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const artifactsDir = 'C:\\Users\\aquib\\.gemini\\antigravity-ide\\brain\\fdf3838d-40e4-4f96-bcf5-df2746f6c898';
const outDir = 'f:\\Belk Digital Projects\\the-looksmaxxing-lab\\public\\journal-images';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const map = {
  'coa_hplc_hero_1784587665809.png': 'peptide-coa-hplc-purity-guide-hero.webp',
  'hplc_close_up_1784587677921.png': 'hplc-chromatogram-peak-analysis-close-up.webp',
  'coa_vial_1784587687738.png': 'certificate-of-analysis-document-peptide-vial.webp',
  'mass_spectrometry_1784587698015.png': 'mass-spectrometry-esi-ms-lab-analysis.webp',
  'reconstitution_hero_1784587715153.png': 'peptide-reconstitution-storage-guide-hero.webp',
  'syringe_water_1784587723897.png': 'peptide-reconstitution-syringe-bacteriostatic-water.webp',
  'freezer_rack_1784587732607.png': 'lyophilized-peptide-freezer-storage-rack.webp',
  'refrigerator_cold_chain_1784587750029.png': 'reconstituted-peptide-refrigerator-cold-chain.webp'
};

async function run() {
  for (const [src, dest] of Object.entries(map)) {
    const srcPath = path.join(artifactsDir, src);
    const destPath = path.join(outDir, dest);
    console.log(`Converting ${src} to ${dest}...`);
    try {
        await sharp(srcPath).webp({ quality: 80 }).toFile(destPath);
        console.log(`Success: ${dest}`);
    } catch (e) {
        console.error(`Error with ${src}:`, e);
    }
  }
}

run();

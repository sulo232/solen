/**
 * Generate PWA icon PNGs from an SVG template.
 * Usage: node scripts/generate-icons.js
 */

import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'public', 'icons');
mkdirSync(OUT_DIR, { recursive: true });

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Solen S mark (ig5, TASTE_LOG 2026-07-16) - same monoline path as public/favicon.svg,
// scaled via the SVG viewBox so every rasterized size shares one geometric source.
function makeSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#FFFFFF"/>
  <path d="M 19 8 C 19 5 10 10 16 16 C 22 22 13 27 13 24" fill="none" stroke="#0A0A0A" stroke-width="5" stroke-linecap="round"/>
</svg>`;
}

for (const size of SIZES) {
  const svg = Buffer.from(makeSvg(size));
  await sharp(svg).png().toFile(resolve(OUT_DIR, `icon-${size}.png`));
  console.log(`  icon-${size}.png`);
}

console.log('Done, icons written to public/icons/');

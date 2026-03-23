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

function makeSvg(size) {
  const fontSize = Math.round(size * 0.55);
  const dy = Math.round(size * 0.02);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#9B1D30"/>
  <text x="50%" y="50%" dy="${dy}" text-anchor="middle" dominant-baseline="central"
        font-family="Georgia, 'Times New Roman', serif" font-weight="bold"
        font-size="${fontSize}" fill="#F8F4ED">S</text>
</svg>`;
}

for (const size of SIZES) {
  const svg = Buffer.from(makeSvg(size));
  await sharp(svg).png().toFile(resolve(OUT_DIR, `icon-${size}.png`));
  console.log(`  icon-${size}.png`);
}

console.log('Done — icons written to public/icons/');

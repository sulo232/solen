import { chromium } from 'playwright';
import fs from 'fs';
const OUT = '/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-quirky-ellis-ef5559/8ef73c47-3574-4223-9a33-b050c13a2faf/scratchpad';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:3000/terminal', { waitUntil: 'networkidle', timeout: 25000 });
await page.waitForTimeout(400);

async function typeInfo() {
  return await page.evaluate(() => {
    // find the actual overlay root (portal), not document.body which includes hidden Next.js scaffolding
    const root = document.querySelector('.fixed.inset-0.z-\\[10000\\]') || document.body;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    const sizeSet = {}, weightSet = {};
    let totalChars = 0, boldChars = 0;
    const samples = {};
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      if (!text) continue;
      const parent = node.parentElement;
      if (!parent) continue;
      if (parent.closest('script, style, [aria-hidden="true"]')) continue;
      const rect = parent.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue; // invisible
      const cs = getComputedStyle(parent);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const size = cs.fontSize, weight = cs.fontWeight;
      sizeSet[size] = (sizeSet[size]||0) + text.length;
      weightSet[weight] = (weightSet[weight]||0) + text.length;
      totalChars += text.length;
      if (parseInt(weight) >= 600) boldChars += text.length;
      if (!samples[size]) samples[size] = text.slice(0,30);
    }
    return { sizeSet, weightSet, totalChars, boldChars, pct: totalChars ? (boldChars/totalChars*100).toFixed(1) : 0, samples };
  });
}

const results = {};
const views = [
  { key: 'board', label: 'Board' },
  { key: 'staff', label: 'Chairs' },
  { key: 'clock', label: 'Log' },
  { key: 'profile', label: 'This screen' },
];
for (const v of views) {
  if (v.key !== 'board') {
    await page.click(`button[aria-label="${v.label}"]`);
    await page.waitForTimeout(200);
  }
  results[v.key] = await typeInfo();
}

fs.writeFileSync(OUT + '/results-type-fixed.json', JSON.stringify(results, null, 2));
console.log('DONE');
await browser.close();

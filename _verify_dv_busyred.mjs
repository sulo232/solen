import { chromium } from 'playwright';
import fs from 'fs';
const OUT = '/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-quirky-ellis-ef5559/8ef73c47-3574-4223-9a33-b050c13a2faf/scratchpad';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:3000/terminal?busy=red', { waitUntil: 'networkidle', timeout: 25000 });
await page.waitForTimeout(400);
await page.screenshot({ path: OUT + '/board-busyred.png' });

const badges = await page.evaluate(() => {
  const spans = [...document.querySelectorAll('span[aria-hidden="true"]')];
  return spans.map(s => ({ bg: getComputedStyle(s).backgroundColor }));
});
fs.writeFileSync(OUT + '/busyred-badges.json', JSON.stringify(badges, null, 2));
console.log(JSON.stringify(badges));
await browser.close();

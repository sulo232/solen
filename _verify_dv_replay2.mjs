import { chromium } from 'playwright';
import fs from 'fs';
const OUT = '/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-quirky-ellis-ef5559/8ef73c47-3574-4223-9a33-b050c13a2faf/scratchpad';
const results = {};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:3000/terminal', { waitUntil: 'networkidle', timeout: 25000 });
await page.waitForTimeout(400);

async function snap() {
  return await page.evaluate(() => document.body.innerText.slice(0, 1500));
}

// Make a real, permanent change: click Start on first waiting row, and do NOT undo it.
const rowTextBefore = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Start');
  return btn ? btn.closest('li').textContent : null;
});
await page.locator('button:has-text("Start")').first().click();
await page.waitForTimeout(400);
results.afterStart = await snap();
results.rowStarted = rowTextBefore;

// wait past the 8s undo window so the change is "committed" and undo bar gone
await page.waitForTimeout(8500);
results.afterUndoExpired = await snap();

// Now click Replay
const before = await snap();
await page.click('button[aria-label="Replay the demo"]');
await page.waitForTimeout(400);
const after = await snap();
results.replayTest = { before, after, changed: before !== after };

fs.writeFileSync(OUT + '/results-replay2.json', JSON.stringify(results, null, 2));
console.log('REPLAY2 DONE');
await browser.close();

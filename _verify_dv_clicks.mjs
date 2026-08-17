import { chromium } from 'playwright';
import fs from 'fs';
const OUT = '/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-quirky-ellis-ef5559/8ef73c47-3574-4223-9a33-b050c13a2faf/scratchpad';
const results = {};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:3000/terminal', { waitUntil: 'networkidle', timeout: 25000 });
await page.waitForTimeout(400);

async function snap() {
  return await page.evaluate(() => document.body.innerText.slice(0, 3000));
}

// 1. Sound toggle
results.sound = { before: await page.getAttribute('button[aria-label*="sound"]', 'aria-label') };
await page.click('button[aria-label*="sound"]');
await page.waitForTimeout(150);
results.sound.after = await page.getAttribute('button[aria-label*="Turn the arrival sound"]', 'aria-label');

// 2. Start click on first waiting row
results.start = { before: await snap() };
const startBtn = page.locator('button:has-text("Start")').first();
const rowTextBefore = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Start');
  return btn ? btn.closest('li').textContent : null;
});
await startBtn.click();
await page.waitForTimeout(300);
results.start.rowTextBefore = rowTextBefore;
results.start.after = await snap();
results.start.changed = results.start.before !== results.start.after;
results.start.undoBarPresent = await page.evaluate(() => !!document.body.innerText.match(/started/));

// wait for undo to auto-expire is 8s, skip; instead check Undo button now
const undoBtn = page.locator('button:has-text("Undo")');
results.undo = { present: await undoBtn.count() > 0 };
if (results.undo.present) {
  const beforeUndo = await snap();
  await undoBtn.click();
  await page.waitForTimeout(300);
  const afterUndo = await snap();
  results.undo.changed = beforeUndo !== afterUndo;
  results.undo.before = beforeUndo.slice(0,200);
  results.undo.after = afterUndo.slice(0,200);
}

// 3. Replay
results.replay = { before: await snap() };
await page.click('button[aria-label="Replay the demo"]');
await page.waitForTimeout(300);
results.replay.after = await snap();
results.replay.changed = results.replay.before !== results.replay.after;

// 4. Navigate to Chairs, test Done button
await page.click('button[aria-label="Chairs"]');
await page.waitForTimeout(200);
const doneBtnCount = await page.locator('button:has-text("Done")').count();
results.done = { doneBtnCount };
if (doneBtnCount > 0) {
  const before = await snap();
  await page.locator('button:has-text("Done")').first().click();
  await page.waitForTimeout(300);
  const after = await snap();
  results.done.changed = before !== after;
  results.done.before = before.slice(0,300);
  results.done.after = after.slice(0,300);
}

// 5. bottom bar 4 buttons
await page.click('button[aria-label="Board"]');
await page.waitForTimeout(200);
results.navButtons = {};
for (const label of ['Board','Chairs','Log','This screen']) {
  const before = await page.evaluate(() => document.querySelector('h1')?.textContent);
  await page.click(`button[aria-label="${label}"]`);
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => document.querySelector('h1')?.textContent);
  const ariaCurrent = await page.evaluate((l) => {
    const btn = [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === l);
    return btn ? btn.getAttribute('aria-current') : null;
  }, label);
  results.navButtons[label] = { before, after, changed: before !== after, ariaCurrent };
}

// 6. Accept/Decline: need a pending booking. Reset via Replay, then wait 6s for scripted arrival
await page.click('button[aria-label="Replay the demo"]');
await page.waitForTimeout(300);
console.log('waiting 7s for scripted arrival...');
await page.waitForTimeout(7000);
const hasAccept = await page.locator('button:has-text("Accept")').count();
results.accept = { hasAcceptButton: hasAccept > 0 };
if (hasAccept > 0) {
  const before = await snap();
  await page.click('button:has-text("Accept")');
  await page.waitForTimeout(300);
  const after = await snap();
  results.accept.changed = before !== after;
  results.accept.before = before.slice(0,200);
  results.accept.after = after.slice(0,200);
}

fs.writeFileSync(OUT + '/results-clicks.json', JSON.stringify(results, null, 2));
console.log('CLICKS DONE');
await browser.close();

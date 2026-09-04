// Self-test for the capture script's consent guard. Loads the same page TWICE:
// once WITHOUT dismissing the sheet (the guard must withhold numbers) and once WITH
// (the guard must let them through). A guard that only ever passes proves nothing.
import { chromium, devices } from 'playwright';
const b = await chromium.launch();
const guard = () => {
  const words = /Wir verwenden Cookies|We use cookies|Hilf uns, dein Erlebnis|Nur notwendige/i
    .test(document.body.innerText);
  return words;
};

async function run(dismiss) {
  const ctx = await b.newContext(devices['iPhone 13']);
  const p = await ctx.newPage();
  await p.goto('https://www.airbnb.ch/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await p.waitForTimeout(3500);
  if (dismiss) {
    const btn = p.getByRole('button', { name: /Nur notwendige/i }).first();
    if (await btn.count().catch(() => 0)) await btn.click({ timeout: 5000 }).catch(() => {});
    await p.waitForTimeout(2000);
  }
  const blocked = await p.evaluate(guard);
  await ctx.close();
  return blocked;
}

const dirty = await run(false);   // known BAD case: sheet up
const clean = await run(true);    // known GOOD case: sheet dismissed
await b.close();
console.log('sheet up,   guard blocks :', dirty ? 'BLOCK (correct)' : 'MISS (guard is useless)');
console.log('sheet gone, guard passes :', clean ? 'FALSE BLOCK (guard is too eager)' : 'PASS (correct)');
console.log('RESULT:', dirty && !clean ? 'GUARD WORKS' : 'GUARD FAILED');

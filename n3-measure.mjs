import { chromium } from 'playwright';

const url = 'file:///Users/sulo/Documents/solen/.claude/worktrees/quirky-ellis-ef5559/n3-harness.html';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(500);

const read = () => page.evaluate(() => window.dn3.measure());

const before = await read();

// REAL scroll + a REAL dispatched scroll event, then wait past the 280ms transition.
await page.evaluate(() => {
  window.scrollTo(0, 400);
  window.dispatchEvent(new Event('scroll'));
});
await page.waitForTimeout(700);
const after = await read();

// scroll back to prove it is reversible, not a one-way class flip
await page.evaluate(() => {
  window.scrollTo(0, 0);
  window.dispatchEvent(new Event('scroll'));
});
await page.waitForTimeout(700);
const back = await read();

console.log(JSON.stringify({ before, after, back }, null, 2));

// visual proof
await page.evaluate(() => { window.scrollTo(0, 0); window.dispatchEvent(new Event('scroll')); });
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/claude/n3-rest.png' });
await page.evaluate(() => { window.scrollTo(0, 400); window.dispatchEvent(new Event('scroll')); });
await page.waitForTimeout(700);
await page.screenshot({ path: '/tmp/claude/n3-scrolled.png' });

// type + weight audit on the header only
const type = await page.evaluate(() => {
  const h = document.getElementById('dn3-header');
  const out = [];
  h.querySelectorAll('*').forEach(el => {
    const t = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('');
    if (!t) return;
    const cs = getComputedStyle(el);
    out.push({ text: t.slice(0, 24), size: cs.fontSize, weight: cs.fontWeight });
  });
  const sizes = [...new Set(out.map(o => o.size))];
  const heavy = out.filter(o => parseInt(o.weight) >= 600).length;
  return { nodes: out, distinctSizes: sizes, total: out.length, weight600plus: heavy,
           pctHeavy: Math.round(heavy / out.length * 1000) / 10 };
});
console.log('TYPE ' + JSON.stringify(type, null, 2));

await browser.close();

import { chromium } from "@playwright/test";
import fs from "fs";
const OUT = "/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-quirky-ellis-ef5559/8ef73c47-3574-4223-9a33-b050c13a2faf/scratchpad";
const URL = "http://127.0.0.1:52933/en/dev/terminal";

function measureType(page) {
  return page.evaluate(() => {
    const container = document.querySelector('div.fixed.inset-0');
    const els = Array.from(container.querySelectorAll("*"));
    const results = [];
    for (const el of els) {
      if (el.children.length > 0) continue;
      const text = (el.textContent || "").trim();
      if (!text) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) continue;
      results.push({ size: parseFloat(cs.fontSize), weight: cs.fontWeight, len: text.length });
    }
    return results;
  });
}
function summarize(items) {
  const sizes = [...new Set(items.map(i => i.size))].sort((a,b)=>a-b);
  const weights = [...new Set(items.map(i => i.weight))].sort();
  const totalChars = items.reduce((a, i) => a + i.len, 0);
  const boldChars = items.filter(i => parseInt(i.weight) >= 600).reduce((a, i) => a + i.len, 0);
  return { sizes, weights, maxSize: Math.max(...items.map(i => i.size)), boldPct: totalChars ? Math.round((boldChars/totalChars)*1000)/10 : 0 };
}

const browser = await chromium.launch();
const report = {};

for (const vp of [{w:402,h:874,tag:"m"}, {w:1024,h:820,tag:"d"}]) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  await page.goto(URL, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(500);

  report[`${vp.tag}_quiet`] = summarize(await measureType(page));
  report[`${vp.tag}_quiet_scrollW`] = await page.evaluate(()=>document.documentElement.scrollWidth);

  await page.locator('button:has-text("New booking")').click();
  await page.waitForTimeout(300);
  report[`${vp.tag}_new`] = summarize(await measureType(page));

  await page.locator('button:has-text("Move")').first().click();
  await page.waitForTimeout(300);
  report[`${vp.tag}_move`] = summarize(await measureType(page));
  await page.close();
}

// touch targets + rhythm, scoped strictly to the overlay, on mobile width
const page = await browser.newPage({ viewport: { width: 402, height: 1400 } });
await page.goto(URL, { waitUntil: "networkidle", timeout: 20000 });
await page.waitForTimeout(500);

report.rhythmAndTargets = await page.evaluate(() => {
  const root = document.querySelector('div.fixed.inset-0');
  function box(el) { if (!el) return null; const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; }
  function findBtn(text) { return Array.from(root.querySelectorAll('button')).find(b => b.textContent.trim() === text); }

  const rows = Array.from(root.querySelectorAll('.mt-4.flex.flex-col.gap-2 > div'));
  const waitingRowGaps = [];
  for (let i = 1; i < 3 && i < rows.length; i++) waitingRowGaps.push(Math.round(rows[i].getBoundingClientRect().top - rows[i-1].getBoundingClientRect().bottom));

  const scroller = root.querySelector('.mx-auto.flex.w-full.max-w-\\[760px\\].flex-col.gap-8');
  const sectionGaps = [];
  if (scroller) { const kids = Array.from(scroller.children); for (let i = 1; i < kids.length; i++) sectionGaps.push(Math.round(kids[i].getBoundingClientRect().top - kids[i-1].getBoundingClientRect().bottom)); }

  const pillQuiet = findBtn('Quiet');
  const pauseQueue = findBtn('Pause queue');
  const startOuter = root.querySelector('span[role="button"]');

  return {
    waitingRowGaps, sectionGaps,
    variantPill: box(pillQuiet),
    pauseQueue: box(pauseQueue),
    bellButton: box(root.querySelector('button[aria-label]')),
    startOuterHitArea: box(startOuter),
  };
});

// expand waiting row -> Done/No-show/Cancel sizes
await page.locator('div.fixed.inset-0 button:has-text("A-0")').first().click();
await page.waitForTimeout(150);
report.waitingExpandedActions = await page.evaluate(() => {
  const root = document.querySelector('div.fixed.inset-0');
  return Array.from(root.querySelectorAll('button')).filter(b => ["Done","No-show","Cancel"].includes(b.textContent.trim())).map(b => {
    const r = b.getBoundingClientRect(); return { text: b.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) };
  });
});

// Move state: chip + Move-to button + Keep
await page.locator('button:has-text("Move")').first().click();
await page.waitForTimeout(300);
report.moveTargets = await page.evaluate(() => {
  const root = document.querySelector('div.fixed.inset-0');
  const buttons = Array.from(root.querySelectorAll('button'));
  const chip = buttons.find(b => /^\d\d:\d\d$/.test(b.textContent.trim()));
  const keepBtn = buttons.find(b => b.textContent.trim().startsWith('Keep'));
  const moveBtn = buttons.find(b => b.textContent.trim() === 'Move' || b.textContent.trim().startsWith('Move to'));
  function box(el) { if (!el) return null; const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; }
  return { chip: box(chip), keep: box(keepBtn), moveBtn: box(moveBtn) };
});

// Later-today row expanded actions
await page.locator('button:has-text("Quiet")').first().click();
await page.waitForTimeout(300);
await page.locator('div.fixed.inset-0 >> text=Andrin Lehmann').click().catch(()=>{});
await page.waitForTimeout(150);
report.laterTodayExpandedActions = await page.evaluate(() => {
  const root = document.querySelector('div.fixed.inset-0');
  return Array.from(root.querySelectorAll('button')).filter(b => ["Move","Done","No-show","Cancel"].includes(b.textContent.trim())).map(b => {
    const r = b.getBoundingClientRect(); return { text: b.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) };
  });
});

await page.close();
await browser.close();
fs.writeFileSync(`${OUT}/final-report.json`, JSON.stringify(report, null, 2));
console.log("DONE");

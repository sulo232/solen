import { chromium } from "@playwright/test";
import fs from "fs";
const OUT = "/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-quirky-ellis-ef5559/8ef73c47-3574-4223-9a33-b050c13a2faf/scratchpad";
const URL = "http://127.0.0.1:52933/en/dev/terminal";

function measureType(page) {
  return page.evaluate(() => {
    const container = document.querySelector('div.fixed.inset-0');
    if (!container) return { error: "container not found" };
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
  return {
    sizes, weights, maxSize: Math.max(...items.map(i => i.size)),
    boldPct: totalChars ? Math.round((boldChars/totalChars)*1000)/10 : 0,
  };
}

const browser = await chromium.launch();
const report = {};
for (const vp of [{w:402,h:874,tag:"m"}, {w:1024,h:820,tag:"d"}]) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  await page.goto(URL, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(500);

  report[`${vp.tag}_quiet`] = summarize(await measureType(page));
  await page.locator('button:has-text("New booking")').click();
  await page.waitForTimeout(300);
  report[`${vp.tag}_new`] = summarize(await measureType(page));
  await page.locator('button:has-text("Move")').first().click();
  await page.waitForTimeout(300);
  report[`${vp.tag}_move`] = summarize(await measureType(page));
  await page.close();
}

// touch targets + rhythm on mobile
const page = await browser.newPage({ viewport: { width: 402, height: 1400 } });
await page.goto(URL, { waitUntil: "networkidle", timeout: 20000 });
await page.waitForTimeout(500);
const rhythm = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('.mt-4.flex.flex-col.gap-2 > div'));
  const gaps = [];
  for (let i = 1; i < Math.min(rows.length, 4); i++) {
    gaps.push(Math.round(rows[i].getBoundingClientRect().top - rows[i-1].getBoundingClientRect().bottom));
  }
  const scroller = document.querySelector('.mx-auto.flex.w-full.max-w-\\[760px\\].flex-col.gap-8');
  const sectionGaps = [];
  if (scroller) {
    const kids = Array.from(scroller.children);
    for (let i = 1; i < kids.length; i++) {
      sectionGaps.push(Math.round(kids[i].getBoundingClientRect().top - kids[i-1].getBoundingClientRect().bottom));
    }
  }
  function rect(sel) {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  }
  const pauseBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Pause queue');
  const startSpan = document.querySelector('span[role="button"]');
  return {
    waitingRowGaps: gaps,
    sectionGaps,
    pauseQueue: pauseBtn ? { w: Math.round(pauseBtn.getBoundingClientRect().width), h: Math.round(pauseBtn.getBoundingClientRect().height) } : null,
    startSpan: startSpan ? { w: Math.round(startSpan.getBoundingClientRect().width), h: Math.round(startSpan.getBoundingClientRect().height) } : null,
  };
});
report.rhythm = rhythm;

// expand waiting row for Done/No-show/Cancel + Move chips
await page.locator('div.fixed.inset-0 button:has-text("A-0")').first().click();
await page.waitForTimeout(150);
report.expandedActionSizes = await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('div.fixed.inset-0 button'));
  return buttons.filter(b => ["Done","No-show","Cancel"].includes(b.textContent.trim())).map(b => {
    const r = b.getBoundingClientRect();
    return { text: b.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) };
  });
});
await page.locator('button:has-text("Move")').first().click();
await page.waitForTimeout(300);
report.chipSizes = await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('div.fixed.inset-0 button'));
  const chip = buttons.find(b => /^\d\d:\d\d$/.test(b.textContent.trim()));
  const keepBtn = buttons.find(b => b.textContent.trim().startsWith('Keep'));
  return {
    chip: chip ? { w: Math.round(chip.getBoundingClientRect().width), h: Math.round(chip.getBoundingClientRect().height) } : null,
    keep: keepBtn ? { w: Math.round(keepBtn.getBoundingClientRect().width), h: Math.round(keepBtn.getBoundingClientRect().height) } : null,
  };
});
await page.close();

await browser.close();
fs.writeFileSync(`${OUT}/refresh-report.json`, JSON.stringify(report, null, 2));
console.log("DONE");

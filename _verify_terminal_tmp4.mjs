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
      results.push({
        text: text.slice(0, 50), size: parseFloat(cs.fontSize), weight: cs.fontWeight,
        color: cs.color, len: text.length, tag: el.tagName,
        cls: el.className && el.className.toString().slice(0,70),
      });
    }
    return results;
  });
}

function summarize(items) {
  const sizes = new Set(items.map(i => i.size));
  const weights = new Set(items.map(i => i.weight));
  const totalChars = items.reduce((a, i) => a + i.len, 0);
  const boldChars = items.filter(i => parseInt(i.weight) >= 600).reduce((a, i) => a + i.len, 0);
  const maxSize = Math.max(...items.map(i => i.size));
  return {
    distinctSizes: Array.from(sizes).sort((a,b)=>a-b),
    distinctWeights: Array.from(weights).sort(),
    maxSize,
    boldPctByChars: totalChars ? Math.round((boldChars/totalChars)*1000)/10 : 0,
    totalChars, elementCount: items.length,
  };
}

const browser = await chromium.launch();
const report = {};
const allItems = {};
for (const vp of [{w:402,h:874,tag:"mobile"}, {w:1024,h:820,tag:"desktop"}]) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  await page.goto(URL, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(500);

  let items = await measureType(page);
  report[`${vp.tag}_quiet`] = { summary: summarize(items), scrollWidth: await page.evaluate(()=>document.documentElement.scrollWidth) };
  allItems[`${vp.tag}_quiet`] = items;

  await page.locator('button:has-text("New booking")').click();
  await page.waitForTimeout(300);
  items = await measureType(page);
  report[`${vp.tag}_new`] = { summary: summarize(items), scrollWidth: await page.evaluate(()=>document.documentElement.scrollWidth) };
  allItems[`${vp.tag}_new`] = items;

  await page.locator('button:has-text("Move")').first().click();
  await page.waitForTimeout(300);
  items = await measureType(page);
  report[`${vp.tag}_move`] = { summary: summarize(items), scrollWidth: await page.evaluate(()=>document.documentElement.scrollWidth) };
  allItems[`${vp.tag}_move`] = items;

  await page.close();
}
await browser.close();
fs.writeFileSync(`${OUT}/report-scoped-full.json`, JSON.stringify({ report, allItems }, null, 2));
console.log("DONE");

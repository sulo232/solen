import { chromium } from "@playwright/test";
import fs from "fs";
const OUT = "/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-quirky-ellis-ef5559/8ef73c47-3574-4223-9a33-b050c13a2faf/scratchpad";
const URL = "http://127.0.0.1:52933/en/dev/terminal";

async function measureType(page) {
  return await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("body *"));
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
        text: text.slice(0, 40),
        size: parseFloat(cs.fontSize),
        weight: cs.fontWeight,
        color: cs.color,
        len: text.length,
        tag: el.tagName,
        cls: el.className && el.className.toString().slice(0,60),
        x: Math.round(rect.x), y: Math.round(rect.y),
      });
    }
    return results;
  });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
await page.goto(URL, { waitUntil: "networkidle", timeout: 20000 });
await page.waitForTimeout(500);
const items = await measureType(page);
fs.writeFileSync(`${OUT}/items-mobile-quiet.json`, JSON.stringify(items, null, 2));
await browser.close();
console.log("DONE", items.length);

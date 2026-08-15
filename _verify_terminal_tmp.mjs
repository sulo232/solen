import { chromium } from "@playwright/test";
import fs from "fs";

const OUT = "/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-quirky-ellis-ef5559/8ef73c47-3574-4223-9a33-b050c13a2faf/scratchpad";
const URL = "http://127.0.0.1:52933/en/dev/terminal";

function typeReport(name) {
  return `window.__typeReport_${name}`;
}

async function measureType(page) {
  return await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("body *"));
    const results = [];
    for (const el of els) {
      if (el.children.length > 0) continue; // leaf only
      const text = (el.textContent || "").trim();
      if (!text) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const cs = getComputedStyle(el);
      // skip invisible
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) continue;
      results.push({
        text: text.slice(0, 40),
        size: parseFloat(cs.fontSize),
        weight: cs.fontWeight,
        color: cs.color,
        len: text.length,
        tag: el.tagName,
        x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height),
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
  const bodyCandidates = items.filter(i => i.size === 15 || i.size === 13);
  return {
    distinctSizes: Array.from(sizes).sort((a,b)=>a-b),
    distinctWeights: Array.from(weights).sort(),
    maxSize,
    boldPct: totalChars ? Math.round((boldChars/totalChars)*1000)/10 : 0,
    totalChars,
  };
}

async function run() {
  const browser = await chromium.launch();
  const report = {};

  for (const vp of [{w:402,h:874,tag:"mobile"}, {w:1024,h:820,tag:"desktop"}]) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    await page.goto(URL, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(500);

    // ---- QUIET state ----
    let scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    let items = await measureType(page);
    report[`${vp.tag}_quiet`] = { summary: summarize(items), scrollWidth: scrollW, viewportWidth: vp.w, itemCount: items.length };
    await page.screenshot({ path: `${OUT}/shots/${vp.tag}-quiet.png`, fullPage: false });

    // ---- expand a Waiting row ----
    const waitingRowBtn = page.locator('button:has-text("min") >> nth=0');
    const hasWaiting = await page.locator('text=Waiting').count();
    let waitingRowExpandWorked = null;
    try {
      const firstWaitingRow = page.locator('div.rounded-card >> button').first();
      const beforeCount = await page.locator('text=No-show').count();
      await firstWaitingRow.click({ timeout: 3000 });
      await page.waitForTimeout(200);
      const afterCount = await page.locator('text=No-show').count();
      waitingRowExpandWorked = afterCount > beforeCount;
      // collapse back
      await firstWaitingRow.click();
      await page.waitForTimeout(150);
    } catch (e) {
      waitingRowExpandWorked = `ERROR: ${e.message}`;
    }
    report[`${vp.tag}_waitingExpand`] = waitingRowExpandWorked;

    // ---- click "New booking" state ----
    await page.locator('button:has-text("New booking")').click();
    await page.waitForTimeout(300);
    scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    items = await measureType(page);
    report[`${vp.tag}_new`] = { summary: summarize(items), scrollWidth: scrollW, viewportWidth: vp.w, itemCount: items.length };
    await page.screenshot({ path: `${OUT}/shots/${vp.tag}-new.png`, fullPage: false });
    const hasNewRequest = await page.locator('text=New request').count();
    report[`${vp.tag}_hasPendingBooking`] = hasNewRequest > 0;

    if (hasNewRequest > 0) {
      // click Accept, verify pending card disappears
      const beforeAccept = await page.locator('text=New request').count();
      await page.locator('button:has-text("Accept")').click();
      await page.waitForTimeout(400);
      const afterAccept = await page.locator('text=New request').count();
      report[`${vp.tag}_acceptWorked`] = beforeAccept > 0 && afterAccept === 0;
      await page.screenshot({ path: `${OUT}/shots/${vp.tag}-after-accept.png`, fullPage: false });
    }

    // ---- Move state ----
    await page.locator('button:has-text("Move")').first().click();
    await page.waitForTimeout(300);
    scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    items = await measureType(page);
    report[`${vp.tag}_move`] = { summary: summarize(items), scrollWidth: scrollW, viewportWidth: vp.w, itemCount: items.length };
    await page.screenshot({ path: `${OUT}/shots/${vp.tag}-move.png`, fullPage: false });

    const hasMoveCard = await page.locator('text=Move appointment').count();
    report[`${vp.tag}_hasMoveCard`] = hasMoveCard > 0;

    if (hasMoveCard > 0) {
      // pick a time chip, check selected style, pick a different one
      const chips = page.locator('button:has-text(":")');
      const chipCount = await chips.count();
      report[`${vp.tag}_chipCount`] = chipCount;
      if (chipCount >= 2) {
        await chips.nth(0).click();
        await page.waitForTimeout(150);
        const chip0bg = await chips.nth(0).evaluate(el => getComputedStyle(el).backgroundColor);
        await chips.nth(1).click();
        await page.waitForTimeout(150);
        const chip1bg = await chips.nth(1).evaluate(el => getComputedStyle(el).backgroundColor);
        const chip0bgAfter = await chips.nth(0).evaluate(el => getComputedStyle(el).backgroundColor);
        report[`${vp.tag}_chipSelectSwitch`] = { chip0bg, chip1bg, chip0bgAfter };
      }
    }

    await page.close();
  }

  await browser.close();
  fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
  console.log("DONE");
}

run().catch(e => { console.error("SCRIPT FAIL", e); process.exit(1); });

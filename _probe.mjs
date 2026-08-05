import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { try { localStorage.setItem("solen-cookie-consent", JSON.stringify({analytics:true,marketing:true,ts:Date.now()})); } catch {} });
const p = await ctx.newPage();
p.on("pageerror", e => console.log("PAGEERROR", e.message));
await p.goto("http://127.0.0.1:57223/de", { waitUntil: "networkidle", timeout: 120000 });
await p.waitForTimeout(1200);
await p.locator('button[aria-label="Suche bearbeiten"]').first().click();
await p.waitForTimeout(1400);
const cnt = await p.evaluate(() => document.querySelectorAll('button[aria-label="Schliessen"]').length);
console.log("close buttons:", cnt);
// A) JS click
await p.evaluate(() => document.querySelector('button[aria-label="Schliessen"]').click());
await p.waitForTimeout(700);
console.log("after JS click, sheet present:", await p.evaluate(() => !!document.querySelector('button[aria-label="Schliessen"]')));
// reopen + B) real mouse click
await p.locator('button[aria-label="Suche bearbeiten"]').first().click();
await p.waitForTimeout(1400);
await p.locator('button[aria-label="Schliessen"]').first().click();
await p.waitForTimeout(700);
console.log("after MOUSE click, sheet present:", await p.evaluate(() => !!document.querySelector('button[aria-label="Schliessen"]')));
await b.close();

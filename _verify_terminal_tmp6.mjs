import { chromium } from "@playwright/test";
const URL = "http://127.0.0.1:52933/en/dev/terminal";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 1400 } });
await page.goto(URL, { waitUntil: "networkidle", timeout: 20000 });
await page.waitForTimeout(500);

// expand a waiting row to see Done/No-show/Cancel targets
await page.locator('div.fixed.inset-0 button:has-text("A-042")').click();
await page.waitForTimeout(200);
const expandedTargets = await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('div.fixed.inset-0 button'));
  return buttons.filter(b => ["Done","No-show","Cancel"].includes((b.textContent||"").trim())).map(b => {
    const r = b.getBoundingClientRect();
    return { text: b.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) };
  });
});
console.log("expandedRowActions", JSON.stringify(expandedTargets));

// go to New booking, measure Accept/Decline
await page.locator('button:has-text("New booking")').click();
await page.waitForTimeout(300);
const newTargets = await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('div.fixed.inset-0 button'));
  return buttons.filter(b => ["Accept","Decline"].includes((b.textContent||"").trim())).map(b => {
    const r = b.getBoundingClientRect();
    return { text: b.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) };
  });
});
console.log("newBookingActions", JSON.stringify(newTargets));

// go to Move, measure chip + Keep + Move button
await page.locator('button:has-text("Move")').first().click();
await page.waitForTimeout(300);
const moveTargets = await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('div.fixed.inset-0 button'));
  return buttons.map(b => {
    const r = b.getBoundingClientRect();
    return { text: (b.textContent||"").trim().slice(0,20), w: Math.round(r.width), h: Math.round(r.height) };
  }).filter(b => b.text.includes(':') || b.text.includes('Keep') || b.text.includes('Move to') || b.text === 'Move');
});
console.log("moveTargets", JSON.stringify(moveTargets));

await browser.close();

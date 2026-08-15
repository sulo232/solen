import { chromium } from "@playwright/test";
const URL = "http://127.0.0.1:52933/en/dev/terminal";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 1400 } });
page.setDefaultTimeout(4000);
await page.goto(URL, { waitUntil: "networkidle", timeout: 20000 });
await page.waitForTimeout(500);

const results = {};
async function step(name, fn) {
  try { results[name] = await fn(); }
  catch (e) { results[name] = "ERROR: " + e.message.split("\n")[0]; }
}

await step("bellBefore", () => page.locator('button[aria-label]').first().getAttribute('aria-label'));
await step("bellClick", () => page.locator('button[aria-label]').first().click());
await step("bellAfter", () => page.locator('button[aria-label]').first().getAttribute('aria-label'));

await step("pauseClick", () => page.locator('div.fixed.inset-0 button:has-text("Pause queue")').click());
await step("resumeVisible", () => page.locator('div.fixed.inset-0 button:has-text("Resume queue")').count());

await step("waitingBefore", () => page.locator('div.fixed.inset-0 >> text=/A-0\\d\\d/').count());
await step("startClick", () => page.locator('div.fixed.inset-0 span[role="button"]').first().click({ force: true }));
await page.waitForTimeout(300);
await step("waitingAfterStart", () => page.locator('div.fixed.inset-0 >> text=/A-0\\d\\d/').count());

await step("expandRow", () => page.locator('div.fixed.inset-0 button:has-text("A-0")').first().click());
await step("noShowVisible", () => page.locator('div.fixed.inset-0 button:has-text("No-show")').count());
await step("noShowClick", () => page.locator('div.fixed.inset-0 button:has-text("No-show")').click());
await page.waitForTimeout(300);
await step("waitingAfterNoShow", () => page.locator('div.fixed.inset-0 >> text=/A-0\\d\\d/').count());

console.log(JSON.stringify(results, null, 2));
await browser.close();

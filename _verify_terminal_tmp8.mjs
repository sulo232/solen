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

const bell = page.locator('div.fixed.inset-0 button[aria-label]');
await step("bellBefore", () => bell.getAttribute('aria-label'));
await step("bellClick", () => bell.click());
await step("bellAfter", () => bell.getAttribute('aria-label'));

// Later today: expand + Done
await step("laterBefore", () => page.locator('div.fixed.inset-0 >> text=/to go/').textContent());
await step("expandLater", () => page.locator('div.fixed.inset-0 >> text=Andrin Lehmann').click());
await step("doneClick", () => page.locator('div.fixed.inset-0 button:has-text("Done")').first().click());
await page.waitForTimeout(300);
await step("laterAfter", () => page.locator('div.fixed.inset-0 >> text=/to go/').textContent());
await step("doneCountAfter", () => page.locator('div.fixed.inset-0 >> text=/done today/').textContent().catch(()=>null));

console.log(JSON.stringify(results, null, 2));
await browser.close();

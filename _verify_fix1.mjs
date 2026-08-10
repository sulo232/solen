// Verification for FIX 1 (header tap-swallow bug) + a header-internal control check.
// Run: node _verify_fix1.mjs
import { chromium } from "playwright";

const BASE = "https://admission-integrated-achieved-assumption.trycloudflare.com";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE}/de`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  // Dismiss the cookie banner if present.
  const cookieBtn = page.locator(
    'button:has-text("Akzeptieren"), button:has-text("Alle akzeptieren"), button:has-text("Accept")',
  );
  if ((await cookieBtn.count()) > 0) {
    await cookieBtn.first().click();
    await page.waitForTimeout(400);
  }

  const pill = page.locator('a[href="/de/search"]').first();
  const box = await pill.boundingBox();
  if (!box) throw new Error("search pill not found / not visible");
  console.log(`search pill box: x=${box.x} y=${box.y} w=${box.width} h=${box.height}`);
  console.log(`search pill center: (${box.x + box.width / 2}, ${box.y + box.height / 2})`);

  await pill.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await page.waitForURL("**/de/search", { timeout: 5000 }).catch(() => {});
  console.log("RESULT after clicking search pill center:", page.url());

  // Header-internal control check: /de/about is a deep, non-category, non-home route, so
  // Header.tsx's own utility row (with its hamburger, a real control living INSIDE the
  // header) is visible on mobile (category/home routes hide that row by design, unrelated
  // to this fix). Click it and confirm the menu still opens through the transparent header.
  await page.goto(`${BASE}/de/about`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const hamburgerBtn = page.locator('header button[aria-label*="Men"]').first();
  const hbBox = await hamburgerBtn.boundingBox().catch(() => null);
  console.log("header hamburger box:", hbBox);
  if (hbBox) {
    await hamburgerBtn.click();
    await page.waitForTimeout(400);
    const menuVisible = await page.locator('[role="dialog"][aria-label="Hauptmenü"]').isVisible().catch(() => false);
    console.log("RESULT header-internal hamburger opened the menu:", menuVisible);
  } else {
    console.log("RESULT header-internal hamburger NOT FOUND");
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

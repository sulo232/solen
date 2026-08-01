// Extra FIX 1 check: the SCROLLED (frosted, real bg) state still lets a header control work,
// on a route where the header row stays visible on mobile after scroll (a deep page, not a
// category/home route where the whole header folds away on scroll by separate, intentional
// design, V3-D376).
import { chromium } from "playwright";

const BASE = "https://admission-integrated-achieved-assumption.trycloudflare.com";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE}/de/about`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(400);

  const tone = await page.locator("header").getAttribute("data-tone");
  console.log("header data-tone after scroll:", tone);

  const hamburgerBtn = page.locator('header button[aria-label*="Men"]').first();
  const box = await hamburgerBtn.boundingBox().catch(() => null);
  console.log("hamburger box (scrolled):", box);
  if (box) {
    await hamburgerBtn.click();
    await page.waitForTimeout(400);
    const menuVisible = await page.locator('[role="dialog"][aria-label="Hauptmenü"]').isVisible().catch(() => false);
    console.log("RESULT scrolled-state header hamburger opened the menu:", menuVisible);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

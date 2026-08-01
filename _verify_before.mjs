import { chromium } from "playwright";

const BASE = "https://admission-integrated-achieved-assumption.trycloudflare.com";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE}/de`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const cookieBtn = page.locator(
    'button:has-text("Akzeptieren"), button:has-text("Alle akzeptieren"), button:has-text("Accept")',
  );
  if ((await cookieBtn.count()) > 0) {
    await cookieBtn.first().click();
    await page.waitForTimeout(400);
  }

  // BEFORE: search-pill tap-swallow check.
  const pill = page.locator('a[href="/de/search"]').first();
  const box = await pill.boundingBox();
  console.log("BEFORE: search pill box:", box);
  await pill.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await page.waitForTimeout(600);
  console.log("BEFORE RESULT after clicking search pill center:", page.url());

  // BEFORE: menu first-item y + close-control scan.
  await page.goto(`${BASE}/de`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const openTrigger = page.locator('button[aria-label="Menü öffnen"]:visible').first();
  await openTrigger.click({ force: true });
  await page.waitForTimeout(500);
  const dialog = page.locator('[role="dialog"][aria-label="Hauptmenü"]');
  console.log("BEFORE: menu open:", await dialog.isVisible());
  const cityPill = dialog.locator("button", { hasText: /Basel|Bern|Zürich|Zurich/ }).first();
  const cityBox = await cityPill.boundingBox();
  console.log("BEFORE: first item (city pill) y =", cityBox?.y);
  const closeCount = await dialog.locator('button[aria-label*="chlie"]').count();
  console.log("BEFORE: close buttons found INSIDE the dialog:", closeCount);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Verification for FIX 2 (close control) + FIX 3 (first-item y), on the HOME route where
// Header.tsx's own utility row (incl. its hamburger-to-X) is hidden on mobile by design
// (showCategoryChrome, V3-D 2026-08-01), which is exactly the route class where the reported
// bug (no way to close the menu) actually reproduces: the menu here can only be opened via the
// search pill's trailing button (SearchTemplate/HomeSearchPill's `solen:open-menu` event).
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

  // Confirm Header's own hamburger/X is NOT the thing opening this menu (it's hidden here).
  const headerHamburgerVisible = await page
    .locator('header button[aria-label*="Men"]')
    .first()
    .isVisible()
    .catch(() => false);
  console.log("Header's own hamburger visible on /de (mobile):", headerHamburgerVisible);

  // Open the menu via the search pill's trailing button (the real entry point on this route).
  // Scoped to :visible since Header.tsx's own (hidden here) hamburger shares the identical
  // aria-label text.
  const openTrigger = page.locator('button[aria-label="Menü öffnen"]:visible').first();
  const triggerBox = await openTrigger.boundingBox().catch(() => null);
  console.log("menu-open trigger box:", triggerBox);
  await openTrigger.click({ force: true });
  await page.waitForTimeout(500);

  const dialog = page.locator('[role="dialog"][aria-label="Hauptmenü"]');
  console.log("menu open:", await dialog.isVisible());

  // FIX 3: first item y (the Basel city pill).
  const cityPill = dialog.locator("button", { hasText: /Basel|Bern|Zürich|Zurich/ }).first();
  const cityBox = await cityPill.boundingBox();
  console.log("AFTER: first item (city pill) y =", cityBox?.y);

  // FIX 2: close control is now INSIDE the dialog itself (scoped locator), not the hidden
  // header hamburger.
  const closeBtn = dialog.locator('button[aria-label*="chlie"]');
  console.log("close buttons found INSIDE the dialog:", await closeBtn.count());
  const closeBox = await closeBtn.first().boundingBox();
  console.log("close button box (w x h should read ~38x38):", closeBox);

  await closeBtn.first().click();
  await page.waitForTimeout(500);
  const stillOpen = await dialog.isVisible().catch(() => false);
  console.log("RESULT menu still open after clicking the new close X:", stillOpen);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

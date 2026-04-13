import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Solen — Homepage Visual Regression Tests
 *
 * Single page load, multiple section screenshots.
 * This avoids timeout issues with the dev server on repeated navigations.
 *
 * Run:  npx playwright test
 * Update baselines:  npx playwright test --update-snapshots
 * View report:  npx playwright show-report e2e/visual/report
 */

// Dismiss cookie banner if visible
async function dismissCookies(page: Page) {
  const acceptBtn = page.locator("button", { hasText: /akzeptieren|accept/i });
  if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await acceptBtn.click();
    await page.waitForTimeout(500);
  }
}

test.describe("homepage visual regression", () => {
  let page: Page;

  // First compile can take 60s+ on cold start
  test.describe.configure({ timeout: 120_000 });

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    // Single navigation — wait generously for first compile
    await page.goto("/de/", { waitUntil: "commit", timeout: 90_000 });
    await page.waitForLoadState("domcontentloaded");
    // Let animations, API fetches, and count-ups settle
    await page.waitForTimeout(4000);
    await dismissCookies(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("01-full-page", async () => {
    await expect(page).toHaveScreenshot("full-page.png", { fullPage: true });
  });

  test("02-header", async () => {
    const header = page.locator("header").first();
    await expect(header).toHaveScreenshot("header.png");
  });

  test("03-hero", async () => {
    const hero = page.locator("main section").first();
    await expect(hero).toHaveScreenshot("hero.png");
  });

  test("04-first-carousel", async () => {
    const carousel = page.locator("main .group\\/section").first();
    if (await carousel.isVisible().catch(() => false)) {
      await expect(carousel).toHaveScreenshot("first-carousel.png");
    }
  });

  test("05-trust-stats", async () => {
    const trust = page.locator("section").filter({
      has: page.locator("text=Bewertung"),
    }).first();
    if (await trust.isVisible().catch(() => false)) {
      await expect(trust).toHaveScreenshot("trust-stats.png");
    }
  });

  test("06-discover-section", async () => {
    const heading = page.locator("h2", { hasText: /inspiration|entdecken/i }).first();
    if (await heading.isVisible().catch(() => false)) {
      await heading.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      const section = heading.locator("..").locator("..");
      await expect(section).toHaveScreenshot("discover-section.png");
    }
  });

  test("07-city-section", async () => {
    const city = page.locator("section").filter({
      has: page.locator("text=BASEL"),
    }).first();
    if (await city.isVisible().catch(() => false)) {
      await city.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await expect(city).toHaveScreenshot("city-section.png");
    }
  });

  test("08-footer", async () => {
    const footer = page.locator("footer").first();
    await footer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await expect(footer).toHaveScreenshot("footer.png");
  });

  test("09-mobile-nav-pill", async ({}, testInfo) => {
    if (testInfo.project.name !== "mobile") return;
    const nav = page.locator("nav[aria-label='Navigation']").first();
    if (await nav.isVisible().catch(() => false)) {
      await expect(nav).toHaveScreenshot("mobile-nav-pill.png");
    }
  });
});

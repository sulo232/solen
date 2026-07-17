import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Solen — conversion-spine visual regression (V3-D444).
 *
 * Catches token-clean-but-visually-broken screens the static drift-gate can't
 * see (overlap, layout breaks, hierarchy regressions) across the screens that
 * actually convert: search results → salon PDP → booking.
 *
 * Run:     npm run test:visual
 * Rebaseline (after an INTENTIONAL design change): npm run test:visual:update
 *
 * Note: data-driven pages, so a small tolerance + a rebaseline after legit
 * content/design changes is expected. A real layout/style regression still
 * blows past the tolerance and fails.
 */

async function dismissCookies(page: Page) {
  const btn = page.locator("button", { hasText: /nur notwendige|akzeptieren|accept/i }).first();
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.click().catch(() => {});
    await page.waitForTimeout(400);
  }
}

const ROUTES: { name: string; path: string }[] = [
  { name: "search-results", path: "/de/basel/coiffeur" },
  { name: "salon-pdp", path: "/de/salon/atelier-haarwerk" },
  { name: "booking-services", path: "/de/salon/atelier-haarwerk/booking" },
];

test.describe("conversion spine visual regression", () => {
  // First compile of a route can take 60s+ on a cold dev server.
  test.describe.configure({ timeout: 120_000 });

  for (const r of ROUTES) {
    test(r.name, async ({ page }) => {
      // All 3 viewports run (V3-D448): mobile/tablet now use deviceScaleFactor:1
      // (see playwright.config) which removes the 2x font-render non-determinism that
      // made them flake. Images masked + viewport-only, so the diff is layout/colour/spacing.
      await page.goto(r.path, { waitUntil: "commit", timeout: 90_000 });
      await page.waitForLoadState("domcontentloaded");
      // let images, fonts, API fetches + animations settle
      await page.waitForTimeout(4000);
      await dismissCookies(page);
      await page.waitForTimeout(600);
      // Viewport screenshot (NOT fullPage): fixed dimensions, so it can't flake on
      // page-height variance (the mobile/tablet flake). Captures the above-the-fold
      // design — where regressions are most visible. Photos masked (they load +
      // carousel-advance non-deterministically); we guard layout / spacing / text /
      // colour, not whether a photo changed.
      // per-viewport name: mobile/tablet/desktop must NOT share one baseline file
      // (snapshotPathTemplate omits {projectName}) — V3-D448.
      await expect(page).toHaveScreenshot(`${r.name}-${test.info().project.name}.png`, {
        maxDiffPixelRatio: 0.02,
        mask: [page.locator("img"), page.locator("video"), page.locator("[style*='background-image']")],
      });
    });
  }
});

/**
 * Solen - target-size (WCAG 2.5.8) on the conversion spine, via @axe-core/playwright.
 *
 * The 44px touch-target floor (CLAUDE.md design contract, `icon-button: h-11 w-11`)
 * is convention + eyeballing today. axe-core ships a "target-size" rule that checks
 * WCAG 2.5.8 (interactive targets >= 24x24 CSS px, axe-core's floor; Solen's own
 * 44px convention is stricter). This block runs it over the same ROUTES this file
 * already walks.
 *
 * NOT WIRED YET: @axe-core/playwright is not a dependency in this repo (confirmed via
 * `grep axe package.json` - absent; `axe-core` itself is present only as someone else's
 * transitive dependency, not usable directly for this). Per the task brief, this was
 * deliberately NOT installed. The block below dynamically imports the package and
 * SKIPS with a clear reason (naming the install command) when it is missing, so it is
 * trivially enable-able: the day a maintainer runs
 *
 *   npm install --save-dev @axe-core/playwright
 *
 * these tests start actually running the target-size audit with zero further code
 * changes. Verified against the real published package (registry inspection, not
 * memory): `AxeBuilder` is both the default and a named export, constructed as
 * `new AxeBuilder({ page })`, with `.withRules(rules)` and `.analyze(): Promise<AxeResults>`.
 */
test.describe("conversion spine target-size (WCAG 2.5.8)", () => {
  test.describe.configure({ timeout: 120_000 });

  for (const r of ROUTES) {
    test(`${r.name} target-size`, async ({ page }, testInfo) => {
      let AxeBuilder: new (opts: { page: Page }) => { withRules(rules: string | string[]): any; analyze(): Promise<any> };
      try {
        // @ts-expect-error - @axe-core/playwright is an optional dep, not installed (see
        // block comment above). Once `npm install --save-dev @axe-core/playwright` runs,
        // this directive itself starts erroring as "unused" - that is the enable signal,
        // delete this line and the check is live.
        ({ default: AxeBuilder } = await import("@axe-core/playwright"));
      } catch {
        testInfo.skip(
          true,
          "@axe-core/playwright is not installed - run `npm install --save-dev @axe-core/playwright` to enable this check",
        );
        return;
      }

      await page.goto(r.path, { waitUntil: "commit", timeout: 90_000 });
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(4000);
      await dismissCookies(page);
      await page.waitForTimeout(600);

      const results = await new AxeBuilder({ page }).withRules(["target-size"]).analyze();
      const violations = results.violations.filter((v: { id: string }) => v.id === "target-size");

      // eslint-disable-next-line no-console
      console.log(`[target-size] ${r.name}: ${violations.length} violation group(s)`);
      expect(violations, JSON.stringify(violations, null, 2)).toHaveLength(0);
    });
  }
});

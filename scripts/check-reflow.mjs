#!/usr/bin/env node
// scripts/check-reflow.mjs
//
// WCAG 2.2 SC 1.4.10 (Reflow) check, added for responsive-desktop-06
// (2026-07-27, _design-system/research/missing-principles-2026-07-26/responsive-desktop.json).
//
// A user who zooms a desktop browser to 400% effectively views the page at a
// CSS width around 320px - WELL below the 375px mobile viewport this estate
// is built and tested against (scripts/check-geometry.mjs's VIEWPORTS map
// bottoms out at 375, playwright.config.ts's mobile project is also 375).
// Nothing in the toolchain checked the 320px-specific, legally-referenced
// width before this script existed. See _rules/SOLEN_UI.md accessibility
// floor section for the house-rule citation.
//
// This checks ONE thing: at 320 CSS px width, does the page ever force
// horizontal scroll (document.documentElement.scrollWidth > window width)?
// It does not replace a full a11y audit - it is a narrow, mechanical,
// specific-width check for the one failure SC 1.4.10 names.
//
// Usage:
//   BASE_URL=http://localhost:3000 node scripts/check-reflow.mjs
//   node scripts/check-reflow.mjs /de /de/some/route
//   node scripts/check-reflow.mjs --gate      (exits 1 on any FAIL)
//
// npm run check:reflow   (= report-only, package.json)
// npm run gate:reflow     (= --gate, package.json)

const DEFAULT_ROUTES = [
  "/de",
  "/de/basel/coiffeur",
  "/de/salon/old-town-barbers",
  "/de/booking/lookup",
];

const REFLOW_WIDTH = 320; // WCAG 2.2 SC 1.4.10's own stated equivalent of 400% zoom at 1280px desktop
const REFLOW_HEIGHT = 720;
const SCROLLWIDTH_TOLERANCE = 1; // px - absorbs subpixel scrollbar-gutter rounding noise

function parseArgs(argv) {
  const routes = [];
  let baseUrl = process.env.BASE_URL || "http://localhost:3000";
  let gate = false;
  for (const a of argv) {
    if (a === "--gate") gate = true;
    else if (!a.startsWith("--")) routes.push(a);
  }
  return { baseUrl, gate, routes: routes.length > 0 ? routes : DEFAULT_ROUTES };
}

async function launchBrowser() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (err) {
    console.error("[check-reflow] `playwright` import failed, falling back to playwright-core:", err);
    ({ chromium } = await import("playwright-core"));
  }
  return chromium.launch({ headless: true });
}

async function dismissCookies(page) {
  const btn = page.locator("button", { hasText: /nur notwendige|akzeptieren|accept/i }).first();
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.click().catch(() => {});
    await page.waitForTimeout(400);
  }
}

async function main() {
  const { baseUrl, gate, routes } = parseArgs(process.argv.slice(2));
  console.log(`[check-reflow] base=${baseUrl} viewport=${REFLOW_WIDTH}x${REFLOW_HEIGHT} (WCAG 2.2 SC 1.4.10)`);
  console.log(`[check-reflow] routes: ${routes.join(", ")}`);

  const browser = await launchBrowser();
  const results = [];
  try {
    const context = await browser.newContext({ viewport: { width: REFLOW_WIDTH, height: REFLOW_HEIGHT } });
    for (const route of routes) {
      const page = await context.newPage();
      const url = new URL(route, baseUrl).toString();
      try {
        await page.goto(url, { waitUntil: "commit", timeout: 90_000 });
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(2000);
        await dismissCookies(page);
        await page.waitForTimeout(400);

        const measured = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        const overflowPx = measured.scrollWidth - measured.innerWidth;
        const pass = overflowPx <= SCROLLWIDTH_TOLERANCE;
        results.push({ route, ...measured, overflowPx, pass });
        console.log(
          `[check-reflow] ${route}: scrollWidth=${measured.scrollWidth} innerWidth=${measured.innerWidth} overflow=${overflowPx}px -> ${pass ? "PASS" : "FAIL"}`,
        );
      } catch (err) {
        console.error(`[check-reflow] route ${route} failed:`, err);
        results.push({ route, error: err && err.message ? err.message : String(err), pass: false });
      } finally {
        await page.close().catch(() => {});
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }

  const failing = results.filter((r) => !r.pass);
  console.log(`[check-reflow] Totals: ${failing.length} FAIL / ${results.length} routes at ${REFLOW_WIDTH}px`);
  if (gate && failing.length > 0) {
    console.error("[check-reflow] GATE FAIL: horizontal scroll forced at 320px CSS width on:", failing.map((f) => f.route).join(", "));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("[check-reflow] fatal:", err);
  process.exitCode = 1;
});

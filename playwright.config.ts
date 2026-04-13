import { defineConfig } from "@playwright/test";

/**
 * Solen Visual Regression — Playwright Config
 *
 * Takes screenshots of the live site at 3 viewports.
 * First run saves baselines. Subsequent runs diff against them.
 *
 * Usage:
 *   npx playwright test                    # run all visual tests
 *   npx playwright test --update-snapshots # update baselines
 *   npx playwright show-report e2e/visual/report  # open HTML diff report
 */
export default defineConfig({
  testDir: "./e2e/visual",
  outputDir: "./e2e/visual/test-results",
  snapshotPathTemplate: "{testDir}/baselines/{testName}/{arg}{ext}",

  // Dev server can be slow on first page load
  timeout: 60_000,
  expect: {
    toHaveScreenshot: {
      // Allow 1% pixel diff — accounts for font rendering across machines
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    },
  },

  fullyParallel: false,
  workers: 1,

  reporter: [["html", { outputFolder: "e2e/visual/report", open: "never" }]],

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3001",
    actionTimeout: 15_000,
    screenshot: "off",
    // Force Chromium for all projects — only browser we installed
    browserName: "chromium",
  },

  projects: [
    {
      name: "mobile",
      use: {
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 2,
      },
    },
    {
      name: "tablet",
      use: {
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2,
      },
    },
    {
      name: "desktop",
      use: {
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
      },
    },
  ],
});

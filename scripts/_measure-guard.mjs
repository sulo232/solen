/**
 * _measure-guard.mjs , refuse to measure a page that did not actually load.
 *
 * WHY (owner 2026-07-31: "harden so the agent won't hallucinate again with similar sh")
 *
 * THE INSTANCE. During the balance research a concurrent session deleted
 * public/_mockups/home-v3/index.html mid-run. The URL fell through to Next's [locale]/[city]
 * catch-all, the server returned a 500 error page, and the measurement script measured THAT PAGE
 * and printed "VERDICT PASS". A tool that reports PASS for a screen which does not exist is worse
 * than no tool, because it launders a hallucination through something that looks like evidence.
 *
 * THE SCOPE, counted 2026-07-31 across scripts/*.mjs: measure-balance.mjs checks status.
 * check-geometry.mjs, check-reflow.mjs and check-motion.mjs DO NOT. Every one of them can report a
 * confident PASS or a precise pixel number about an error page. check-geometry is the script whose
 * output was quoted to the owner minutes before this was written, and its numbers could not be
 * confirmed as coming from a real render.
 *
 * FOUR WAYS A MEASUREMENT LIES, all of them seen or plausible here:
 *   1. the response was an error       -> status >= 400
 *   2. the response was a redirect     -> the URL measured is not the URL asked for
 *   3. the page rendered an error UI   -> status 200 but the body is Next's error boundary
 *   4. the page rendered nothing yet   -> zero measurable elements, reported as a clean result
 * A measurement that cannot rule all four out is not a measurement, it is a guess with a decimal
 * point in it.
 *
 * USE, in any Playwright-based measure script:
 *
 *   import { guardedGoto } from './_measure-guard.mjs'
 *   const ok = await guardedGoto(page, url, { expectSelector: 'main' })
 *   if (!ok.ok) { console.error(ok.reason); continue }   // never measure, never print a verdict
 */

const ERROR_UI = [
  'Application error',
  'Internal Server Error',
  'This page could not be found',
  '__next_error__',
  'Unhandled Runtime Error',
  'ENOENT',
];

/**
 * Navigate and prove the page is real. Returns { ok, status, url, reason, elements }.
 * Never throws: a guard that crashes is a guard that gets removed.
 */
export async function guardedGoto(page, url, opts = {}) {
  const {
    expectSelector = 'body',
    minElements = 1,
    settleMs = 1200,
    allowRedirect = false,
  } = opts;

  let res;
  try {
    res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (e) {
    return { ok: false, status: 0, url, reason: `navigation failed: ${e.message}` };
  }

  const status = res ? res.status() : 0;
  if (!res) {
    return { ok: false, status: 0, url, reason: 'no response object, nothing was loaded' };
  }
  if (status >= 400) {
    return { ok: false, status, url, reason: `HTTP ${status}, this is an error page, not the screen` };
  }

  const landed = page.url();
  if (!allowRedirect && stripTrailing(landed) !== stripTrailing(url)) {
    return {
      ok: false, status, url: landed,
      reason: `redirected to ${landed}, so any number would describe a different screen`,
    };
  }

  await page.waitForTimeout(settleMs);

  // Status 200 with an error boundary rendered is the case that fooled the balance script.
  const body = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 4000) : '');
  const hit = ERROR_UI.find((m) => body.includes(m));
  if (hit) {
    return { ok: false, status, url: landed, reason: `error UI rendered ("${hit}") despite HTTP ${status}` };
  }

  // A page that rendered nothing measurable must not be graded. Silence is not a pass.
  const elements = await page.evaluate((sel) => {
    const root = document.querySelector(sel);
    return root ? root.querySelectorAll('*').length : 0;
  }, expectSelector);

  if (elements < minElements) {
    return {
      ok: false, status, url: landed, elements,
      reason: `only ${elements} element(s) under "${expectSelector}", the page had not rendered`,
    };
  }

  return { ok: true, status, url: landed, elements, reason: '' };
}

function stripTrailing(u) {
  try {
    const p = new URL(u);
    return (p.origin + p.pathname.replace(/\/+$/, '')).toLowerCase();
  } catch {
    return String(u).replace(/\/+$/, '').toLowerCase();
  }
}

/** Format a refusal so a report never prints a verdict for a screen that was not measured. */
export function refusal(url, g) {
  return `  ${url}\n    NOT MEASURED: ${g.reason}\n    (a verdict here would be a guess; none is printed)`;
}

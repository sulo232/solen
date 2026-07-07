// scripts/mcp/site-tester/crawl.mjs
//
// Pure browser-automation engine for the site-tester MCP server.
// No MCP SDK imports here on purpose, so this file can be unit-tested
// directly (see selftest.mjs) without spinning up a stdio server.
//
// Exports:
//   checkRoute({ url, viewport })
//   testSite({ url, maxPages, sameOriginOnly, viewport, maxElements })
//
// Both functions own their own browser lifecycle (launch + close in a
// finally block) so callers never leak a Chromium process.

import { mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const VIEWPORTS = {
  desktop: { width: 1280, height: 900 },
  mobile: { width: 375, height: 812 },
};

const PAGE_TIMEOUT_MS = 15_000;
const INTERACTIVE_SELECTOR =
  "button, a[href], [role=button], input, select, textarea, [onclick]";

// ----------------------------------------------------------------------------
// Browser bootstrap: prefer `playwright` (ships its own browsers), fall back
// to `playwright-core` (expects a system/cached Chromium). Never import a
// second browser stack (no puppeteer, no @sparticuz/chromium).
// ----------------------------------------------------------------------------
async function launchBrowser() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (err) {
    console.error("[site-tester] `playwright` import failed, falling back to playwright-core:", err);
    ({ chromium } = await import("playwright-core"));
  }

  try {
    return await chromium.launch({ headless: true });
  } catch (err) {
    console.error(
      "[site-tester] chromium.launch failed (browser binary may be missing, try `npx playwright install chromium`):",
      err
    );
    throw err;
  }
}

function screenshotDir() {
  const dir = join(tmpdir(), "site-tester-screenshots");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function resolveViewport(viewport) {
  return VIEWPORTS[viewport] || VIEWPORTS.desktop;
}

// Attaches console-error and failed-request listeners to a page, returning
// arrays that fill in as events happen plus a detach function.
function attachDiagnostics(page) {
  const consoleErrors = [];
  const failedRequests = [];

  const onConsole = (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  };
  const onPageError = (err) => {
    consoleErrors.push(String(err && err.message ? err.message : err));
  };
  const onResponse = (response) => {
    const status = response.status();
    if (status >= 400) {
      failedRequests.push({ url: response.url(), status });
    }
  };
  const onRequestFailed = (request) => {
    const failure = request.failure();
    failedRequests.push({
      url: request.url(),
      status: failure ? failure.errorText : "REQUEST_FAILED",
    });
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);
  page.on("requestfailed", onRequestFailed);

  const detach = () => {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("response", onResponse);
    page.off("requestfailed", onRequestFailed);
  };

  return { consoleErrors, failedRequests, detach };
}

async function pageHasVisibleText(page) {
  try {
    const text = await page.evaluate(() => {
      const body = document.body;
      if (!body) return "";
      return (body.innerText || "").trim();
    });
    return text.length > 0;
  } catch (err) {
    console.error("[site-tester] pageHasVisibleText evaluate failed:", err);
    return false;
  }
}

/**
 * Loads one URL headless and returns a structured pass/fail record.
 */
export async function checkRoute({ url, viewport = "desktop" } = {}) {
  if (!url) throw new Error("checkRoute requires a url");

  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({ viewport: resolveViewport(viewport) });
    const page = await context.newPage();
    page.setDefaultTimeout(PAGE_TIMEOUT_MS);
    page.setDefaultNavigationTimeout(PAGE_TIMEOUT_MS);

    const { consoleErrors, failedRequests, detach } = attachDiagnostics(page);

    let httpStatus = null;
    let navError = null;
    try {
      const response = await page.goto(url, { waitUntil: "load", timeout: PAGE_TIMEOUT_MS });
      httpStatus = response ? response.status() : null;
    } catch (err) {
      navError = err;
      console.error(`[site-tester] checkRoute navigation failed for ${url}:`, err);
    }

    // Give late console errors / async renders a brief moment to surface.
    await page.waitForTimeout(300);

    const renderedText = navError ? false : await pageHasVisibleText(page);
    const title = navError ? "" : await page.title().catch((err) => {
      console.error("[site-tester] page.title() failed:", err);
      return "";
    });

    const screenshotPath = join(screenshotDir(), `check-${randomUUID()}.png`);
    try {
      await page.screenshot({ path: screenshotPath, fullPage: false });
    } catch (err) {
      console.error(`[site-tester] screenshot failed for ${url}:`, err);
    }

    detach();

    const ok =
      !navError &&
      httpStatus !== null &&
      httpStatus < 400 &&
      consoleErrors.length === 0 &&
      renderedText;

    return {
      url,
      httpStatus,
      ok,
      renderedText,
      consoleErrors,
      failedRequests,
      title,
      screenshotPath,
    };
  } finally {
    await browser.close().catch((err) => {
      console.error("[site-tester] browser.close() failed:", err);
    });
  }
}

// Enumerates every interactive element currently in the DOM and computes a
// STABLE, re-findable CSS selector for each one, up front. This selector is
// what makes the hermetic per-element design possible: instead of holding a
// live ElementHandle across actions (which goes stale the instant a click
// navigates the page), we hold a plain string and re-find the element with
// page.$(selector) after every fresh page.goto(). No handle is ever reused
// across a navigation.
async function enumerateInteractiveElements(page) {
  return page.evaluate((selector) => {
    const nodes = Array.from(document.querySelectorAll(selector));
    return nodes.map((el, idx) => {
      const tag = el.tagName.toLowerCase();
      const text = (el.innerText || el.value || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "").trim().slice(0, 80);
      const href = el.getAttribute("href");
      const type = el.getAttribute("type");

      // Build a best-effort, re-findable CSS selector: prefer #id (globally
      // unique by spec), else an nth-of-type chain from the element up to
      // (and including) a unique ancestor, so the selector still resolves
      // to exactly this element on a freshly reloaded, otherwise-identical
      // DOM.
      function pathSelector(node) {
        const parts = [];
        let current = node;
        while (current && current.nodeType === 1 && current !== document.documentElement) {
          if (current.id) {
            parts.unshift(`#${current.id}`);
            break;
          }
          const parent = current.parentElement;
          const tagName = current.tagName.toLowerCase();
          if (!parent) {
            parts.unshift(tagName);
            break;
          }
          const siblingsOfTag = Array.from(parent.children).filter((c) => c.tagName === current.tagName);
          const pos = siblingsOfTag.indexOf(current) + 1;
          parts.unshift(`${tagName}:nth-of-type(${pos || 1})`);
          current = parent;
        }
        return parts.join(" > ");
      }

      const locator = el.id ? `#${CSS.escape(el.id)}` : pathSelector(el);

      return { index: idx, tag, label: text || href || type || tag, locator, href };
    });
  }, INTERACTIVE_SELECTOR);
}

// Acts on a freshly re-found element handle: click for button-like
// elements, fill a sentinel for input/textarea, select the first option
// for select. Returns { threw: Error|null }. Does not itself decide
// pass/fail, that is the caller's job once navigation is also accounted
// for.
async function actOnElement({ page, handle, tag, index }) {
  try {
    if (tag === "select") {
      const options = await page
        .evaluate((el) => Array.from(el.options).map((o) => o.value), handle)
        .catch(() => []);
      if (options.length > 0) {
        await handle.selectOption(options[0], { timeout: PAGE_TIMEOUT_MS });
      }
      return { threw: null };
    }

    if (tag === "input" || tag === "textarea") {
      const tagType = await handle.getAttribute("type").catch(() => null);
      if (tagType === "checkbox" || tagType === "radio" || tagType === "submit" || tagType === "button") {
        await handle.click({ timeout: PAGE_TIMEOUT_MS, force: false });
      } else {
        await handle.fill("test", { timeout: PAGE_TIMEOUT_MS });
      }
      return { threw: null };
    }

    // button, a, [role=button], [onclick]
    await handle.click({ timeout: PAGE_TIMEOUT_MS, force: false });
    return { threw: null };
  } catch (err) {
    console.error(`[site-tester] action failed for element ${index} (${tag}):`, err);
    return { threw: err };
  }
}

// Polls page.url() for up to `timeoutMs`, returning the first URL that
// differs from `urlBefore`, or `urlBefore` unchanged if nothing navigated
// within the window. This is the ONLY navigation-detection mechanism now:
// because every element starts from its own fresh page.goto(startUrl), a
// detected change can only have been caused by the element under test right
// now, so there is no cross-attribution to a later, unrelated element, and
// a delayed (setTimeout-based) navigation is still caught as long as it
// fires inside the poll window.
async function waitForUrlChange(page, urlBefore, timeoutMs) {
  const pollIntervalMs = 50;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    let current;
    try {
      current = page.url();
    } catch (err) {
      console.error("[site-tester] page.url() failed while polling for navigation:", err);
      return urlBefore;
    }
    if (current !== urlBefore) return current;
    await page.waitForTimeout(pollIntervalMs);
  }
  try {
    return page.url();
  } catch (err) {
    console.error("[site-tester] page.url() failed at end of navigation poll:", err);
    return urlBefore;
  }
}

// Hermetically exercises ONE captured element: loads startUrl fresh, re-
// finds the element by its stable locator, acts on it, and detects any
// navigation the action caused by polling page.url(). Never reuses a
// handle across a navigation boundary, so there is no stale-handle class of
// bug to detect in the first place. Never throws; all failures are
// captured into the returned record.
async function exerciseElementHermetic({ page, context, startUrl, captured, sameOriginOnly }) {
  const { index, tag, label, locator, href } = captured;

  const record = {
    index,
    tag,
    label,
    selector: locator,
    href: href || undefined,
    action: "click",
    result: "pass",
  };

  // Cross-origin links never need a reload/re-find round-trip: skip before
  // touching the page at all.
  if (tag === "a" && href && sameOriginOnly && !isSameOriginUrl(href, startUrl)) {
    record.action = "skip";
    record.result = "skip";
    record.note = "cross-origin link, skipped (sameOriginOnly=true)";
    return record;
  }

  // Same-origin <a href>: open in a fresh page so a broken destination
  // can't affect the page-under-test at all. No reload of the main page
  // needed for this element.
  if (tag === "a" && href) {
    record.action = "navigate";
    const linkHref = new URL(href, startUrl).toString();
    const freshPage = await context.newPage();
    freshPage.setDefaultTimeout(PAGE_TIMEOUT_MS);
    freshPage.setDefaultNavigationTimeout(PAGE_TIMEOUT_MS);
    const diag = attachDiagnostics(freshPage);
    try {
      const response = await freshPage.goto(linkHref, { waitUntil: "load", timeout: PAGE_TIMEOUT_MS });
      const status = response ? response.status() : null;
      if (status !== null && status >= 400) {
        record.result = "fail";
        record.error = `navigation returned status ${status}`;
      } else if (diag.consoleErrors.length > 0) {
        record.result = "fail";
        record.error = `console errors after navigation: ${diag.consoleErrors.join("; ")}`;
      }
      record.navigatedTo = linkHref;
      record.httpStatus = status;
    } catch (err) {
      record.result = "fail";
      record.error = `navigation error: ${err.message || String(err)}`;
      console.error(`[site-tester] link navigation failed for ${linkHref}:`, err);
    } finally {
      diag.detach();
      await freshPage.close().catch((err) => {
        console.error("[site-tester] freshPage.close() failed:", err);
      });
    }
    return record;
  }

  // Everything else (button, [role=button], [onclick], input, select,
  // textarea): reload the page-under-test fresh, so this element (and only
  // this element) starts from a known-good DOM, then re-find it by its
  // stable locator.
  try {
    await page.goto(startUrl, { waitUntil: "load", timeout: PAGE_TIMEOUT_MS });
    await page.waitForTimeout(150);
  } catch (err) {
    record.result = "fail";
    record.error = `failed to reload ${startUrl} before testing this element: ${err.message || String(err)}`;
    console.error(`[site-tester] reload before element ${index} failed:`, err);
    return record;
  }

  const handle = await page.$(locator).catch((err) => {
    console.error(`[site-tester] page.$() failed for locator "${locator}" (element ${index}):`, err);
    return null;
  });

  if (!handle) {
    record.action = "not_found";
    record.result = "fail";
    record.note = "element not present on fresh page load";
    record.error = `locator "${locator}" did not resolve to an element after reloading ${startUrl} (element may only appear after a prior interaction, a documented limitation of hermetic per-element testing)`;
    return record;
  }

  const isVisible = await handle.isVisible().catch((err) => {
    console.error(`[site-tester] isVisible() failed for element ${index}:`, err);
    return false;
  });
  if (!isVisible) {
    // The element exists on a fresh load but is not visible, so it was NOT
    // exercised. It is neither a pass nor a fail: report it as an honest
    // "skip" so a hidden element can never launder into the "pass" default.
    record.action = "skip";
    record.result = "skip";
    record.note = "not visible, not tested";
    return record;
  }

  const tagType = await handle.getAttribute("type").catch(() => null);
  if (tag === "select") {
    record.action = "select";
  } else if (
    (tag === "input" || tag === "textarea") &&
    tagType !== "checkbox" &&
    tagType !== "radio" &&
    tagType !== "submit" &&
    tagType !== "button"
  ) {
    record.action = "fill";
  } else {
    record.action = "click";
  }

  // Track the main-frame navigation response (if any) so a navigating
  // action can report the real landing httpStatus, not just "it changed".
  let navigationResponse = null;
  const onFrameResponse = (response) => {
    const request = response.request();
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      navigationResponse = response;
    }
  };
  page.on("response", onFrameResponse);

  const urlBeforeAction = page.url();
  const { consoleErrors: actionErrors, detach: detachDiag } = attachDiagnostics(page);

  let actResult;
  try {
    actResult = await actOnElement({ page, handle, tag, index });
  } finally {
    // Give a synchronous throw-on-click handler a brief moment to surface
    // before the longer navigation poll below runs.
    await page.waitForTimeout(50);
  }

  const urlAfterAction = await waitForUrlChange(page, urlBeforeAction, 1500);
  page.off("response", onFrameResponse);
  detachDiag();

  const navigated = urlAfterAction !== urlBeforeAction;

  if (navigated) {
    record.action = "click-navigated";
    record.navigatedTo = urlAfterAction;
    const status = navigationResponse ? navigationResponse.status() : null;
    record.httpStatus = status;
    if (status !== null && status >= 400) {
      record.result = "fail";
      record.error = `click navigated to a page that returned status ${status}`;
    } else if (actionErrors.length > 0) {
      record.result = "fail";
      record.error = `console/page errors after navigating click: ${actionErrors.join("; ")}`;
    } else {
      record.result = "pass";
    }
    return record;
  }

  if (actResult.threw) {
    record.result = "fail";
    record.error = actResult.threw.message || String(actResult.threw);
    return record;
  }

  if (actionErrors.length > 0) {
    record.result = "fail";
    record.error = `console/page errors after click: ${actionErrors.join("; ")}`;
    return record;
  }

  return record;
}

function isSameOriginUrl(href, baseUrl) {
  try {
    const resolved = new URL(href, baseUrl);
    const base = new URL(baseUrl);
    return resolved.origin === base.origin;
  } catch (err) {
    console.error(`[site-tester] isSameOriginUrl failed to parse "${href}" against "${baseUrl}":`, err);
    return false;
  }
}

// Collects same-origin hrefs found on a page, for BFS across maxPages.
async function collectSameOriginLinks(page, baseUrl) {
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href"))
  );
  const out = [];
  for (const href of hrefs) {
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      continue;
    }
    if (isSameOriginUrl(href, baseUrl)) {
      try {
        out.push(new URL(href, baseUrl).toString());
      } catch (err) {
        console.error(`[site-tester] failed to resolve link "${href}":`, err);
      }
    }
  }
  return out;
}

// Tests every interactive element on the page at `url`. Returns
// { url, elements, elementsFound, elementsTested, capped, consoleErrors,
//   failedRequests }.
//
// HERMETIC per-element design: there is no shared, mutable ElementHandle
// state across iterations. Phase 1 enumerates every interactive element on
// one fresh load and captures a stable, re-findable CSS locator string for
// each (never a live handle). Phase 2 tests each captured item in complete
// isolation, reloading `url` fresh before every single non-<a> element and
// re-finding it via its locator. This makes the whole stale-handle bug
// class structurally impossible (there is nothing stale to go stale,
// because nothing is held across a navigation boundary) rather than
// something to detect after the fact. Cost: up to `maxElements` page loads
// per page, which is fine for a capped smoke test.
async function testCurrentPage({ page, context, url, sameOriginOnly, maxElements }) {
  const pageConsoleErrors = [];
  const pageFailedRequests = [];

  // Phase 1: enumerate on the current (already-loaded) DOM.
  await page.waitForTimeout(200);
  const captured = await enumerateInteractiveElements(page);
  const elementsFound = captured.length;
  const capped = elementsFound > maxElements;
  const toTest = captured.slice(0, maxElements);

  // Phase 2: exercise each captured element hermetically. Each call reloads
  // `url` on `page` itself (for non-<a> elements) or opens its own fresh
  // page (for same-origin <a href>), so no element's test can affect
  // another's DOM state.
  const elements = [];
  for (const item of toTest) {
    const { consoleErrors, failedRequests, detach } = attachDiagnostics(page);
    const record = await exerciseElementHermetic({
      page,
      context,
      startUrl: url,
      captured: item,
      sameOriginOnly,
    });
    detach();
    pageConsoleErrors.push(...consoleErrors);
    pageFailedRequests.push(...failedRequests);
    elements.push(record);
  }

  return {
    url,
    elements,
    elementsFound,
    elementsTested: elements.length,
    capped,
    consoleErrors: pageConsoleErrors,
    failedRequests: pageFailedRequests,
  };
}

/**
 * Loads `url`, enumerates interactive elements, exercises each safely, and
 * (when maxPages > 1) follows same-origin links breadth-first up to the cap.
 */
export async function testSite({
  url,
  maxPages = 1,
  sameOriginOnly = true,
  viewport = "desktop",
  maxElements = 50,
} = {}) {
  if (!url) throw new Error("testSite requires a url");

  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({ viewport: resolveViewport(viewport) });

    const visited = new Set();
    const queue = [url];
    const pagesTested = [];

    while (queue.length > 0 && pagesTested.length < maxPages) {
      const nextUrl = queue.shift();
      if (visited.has(nextUrl)) continue;
      visited.add(nextUrl);

      const page = await context.newPage();
      page.setDefaultTimeout(PAGE_TIMEOUT_MS);
      page.setDefaultNavigationTimeout(PAGE_TIMEOUT_MS);

      try {
        await page.goto(nextUrl, { waitUntil: "load", timeout: PAGE_TIMEOUT_MS });
      } catch (err) {
        console.error(`[site-tester] testSite navigation failed for ${nextUrl}:`, err);
        pagesTested.push({
          url: nextUrl,
          elements: [],
          elementsFound: 0,
          elementsTested: 0,
          capped: false,
          consoleErrors: [`navigation failed: ${err.message || String(err)}`],
          failedRequests: [],
        });
        await page.close().catch((closeErr) => {
          console.error("[site-tester] page.close() failed after nav error:", closeErr);
        });
        continue;
      }

      const pageResult = await testCurrentPage({
        page,
        context,
        url: nextUrl,
        sameOriginOnly,
        maxElements,
      });
      pagesTested.push(pageResult);

      if (maxPages > 1 && pagesTested.length < maxPages) {
        // Hermetic element testing may have left `page` on whatever URL the
        // last exercised element navigated to (not necessarily nextUrl):
        // reload nextUrl fresh before harvesting links for the BFS queue.
        try {
          await page.goto(nextUrl, { waitUntil: "load", timeout: PAGE_TIMEOUT_MS });
        } catch (err) {
          console.error(`[site-tester] failed to reload ${nextUrl} before link collection:`, err);
        }
        const links = await collectSameOriginLinks(page, nextUrl).catch((err) => {
          console.error(`[site-tester] collectSameOriginLinks failed for ${nextUrl}:`, err);
          return [];
        });
        for (const link of links) {
          if (!visited.has(link)) queue.push(link);
        }
      }

      await page.close().catch((err) => {
        console.error("[site-tester] page.close() failed:", err);
      });
    }

    const summary = pagesTested.reduce(
      (acc, p) => {
        for (const el of p.elements) {
          if (el.result === "pass") acc.pass += 1;
          else if (el.result === "skip") acc.skipped += 1;
          else acc.fail += 1;
        }
        if (p.capped) acc.capped = true;
        return acc;
      },
      { pass: 0, fail: 0, skipped: 0, capped: false }
    );

    return { startUrl: url, pagesTested, summary };
  } finally {
    await browser.close().catch((err) => {
      console.error("[site-tester] browser.close() failed:", err);
    });
  }
}

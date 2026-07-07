#!/usr/bin/env node
// scripts/mcp/site-tester/selftest.mjs
//
// Self-test for the site-tester engine (crawl.mjs), run directly with node,
// NOT through the MCP server. Spins up a tiny local static HTTP server
// serving a fixture page, then exercises check_route and test_site against
// it and asserts the results are correct.
//
// Usage: node scripts/mcp/site-tester/selftest.mjs
// Exits 1 on any failed assertion, 0 if everything passes.

import { createServer } from "node:http";
import { checkRoute, testSite } from "./crawl.mjs";

const FIXTURE_INDEX = `<!doctype html>
<html>
<head><title>Fixture Home</title></head>
<body>
  <h1>Site Tester Fixture</h1>
  <a id="same-origin-link" href="/next.html">Go to next page</a>
  <a id="external-link" href="https://example.com">External site</a>
  <button id="ok-button" onclick="console.log('ok button clicked')">Click me (ok)</button>
  <button id="throw-button" onclick="throw new Error('intentional selftest failure')">Click me (throws)</button>
</body>
</html>`;

const FIXTURE_NEXT = `<!doctype html>
<html>
<head><title>Fixture Next</title></head>
<body>
  <h1>Next Page</h1>
  <a href="/">Back home</a>
</body>
</html>`;

// Dedicated fixture for the navigation-stale regression: a form whose
// submit button navigates the CURRENT page (not a fresh page, unlike an
// <a href>), followed by a trailing button and a trailing link that must
// still be genuinely tested (or truthfully marked non-pass) after the
// page-restore, never silently reported as a false "pass".
const FIXTURE_NAV_PAGE = `<!doctype html>
<html>
<head><title>Fixture Nav</title></head>
<body>
  <h1>Navigation Stale Fixture</h1>
  <form action="/nav-target.html" method="get">
    <button id="submit-button" type="submit">Submit (navigates)</button>
  </form>
  <button id="trailing-button" onclick="console.log('trailing button clicked')">Trailing button</button>
  <a id="trailing-link" href="/next.html">Trailing link</a>
</body>
</html>`;

const FIXTURE_NAV_TARGET = `<!doctype html>
<html>
<head><title>Fixture Nav Target</title></head>
<body>
  <h1>Nav Target Page</h1>
</body>
</html>`;

// Fixture with more interactive elements than a deliberately small
// maxElements, to assert the cap is enforced AND reported (never silently
// truncated).
const CAP_BUTTON_COUNT = 8;
const FIXTURE_CAP_PAGE = `<!doctype html>
<html>
<head><title>Fixture Cap</title></head>
<body>
  <h1>Cap Fixture</h1>
  ${Array.from({ length: CAP_BUTTON_COUNT }, (_, i) => `<button id="cap-btn-${i}">Button ${i}</button>`).join("\n  ")}
</body>
</html>`;

// "DOM diff after nav" fixture: a consent-banner-style page. A "Nav button"
// navigates the CURRENT page (window.location.href = ...), and a "Real CTA"
// button sits AFTER it in DOM order. Under the old detect-and-restore
// design, `isVisible()` on the stale post-navigation handle can resolve to
// `false` WITHOUT THROWING (the reviewer's exact round-3 finding), which
// falls straight into the "not visible, skipped" -> result:"pass" branch,
// silently reporting the Real CTA as passing when it was never tested at
// all. The hermetic design must genuinely re-find and act on it instead.
const FIXTURE_DOM_DIFF_PAGE = `<!doctype html>
<html>
<head><title>Fixture DOM Diff</title></head>
<body>
  <h1>Consent Banner Fixture</h1>
  <button id="nav-button" onclick="window.location.href='/dom-diff-target.html'">Accept (navigates)</button>
  <button id="real-cta" onclick="console.log('real cta clicked')">Real CTA</button>
</body>
</html>`;

const FIXTURE_DOM_DIFF_TARGET = `<!doctype html>
<html>
<head><title>Fixture DOM Diff Target</title></head>
<body>
  <h1>Post-consent Page</h1>
</body>
</html>`;

// "Delayed nav" fixture: one button navigates via setTimeout (250ms) after
// being clicked, and a sibling button does NOT navigate at all. This
// proves two things at once: (1) a delayed navigation is still caught
// (the old 150ms fixed window would miss a 250ms delayed nav; the new
// design polls page.url() for up to 1500ms), and (2) correct attribution
// (only the delayed-nav button is recorded click-navigated, the sibling is
// never falsely credited with a navigation it didn't cause).
const FIXTURE_DELAYED_NAV_PAGE = `<!doctype html>
<html>
<head><title>Fixture Delayed Nav</title></head>
<body>
  <h1>Delayed Navigation Fixture</h1>
  <button id="delayed-nav-button" onclick="setTimeout(function(){ location.href = '/delayed-nav-target.html'; }, 250)">Delayed nav</button>
  <button id="no-nav-button" onclick="console.log('no-nav button clicked')">No nav</button>
</body>
</html>`;

const FIXTURE_DELAYED_NAV_TARGET = `<!doctype html>
<html>
<head><title>Fixture Delayed Nav Target</title></head>
<body>
  <h1>Delayed Nav Target Page</h1>
</body>
</html>`;

// "Hidden element" fixture: a genuinely, always-invisible button
// (display:none, NOT a stale post-navigation handle) followed by a visible
// one. A hidden element is enumerated (querySelectorAll includes it) but can
// never be exercised, so it must report result:"skip" (an honest
// not-tested), NEVER launder into the "pass" default. The visible sibling
// must still be genuinely tested.
const FIXTURE_HIDDEN_PAGE = `<!doctype html>
<html>
<head><title>Fixture Hidden</title></head>
<body>
  <h1>Hidden Element Fixture</h1>
  <button id="hidden-btn" style="display:none" onclick="console.log('should never fire')">Hidden button</button>
  <button id="visible-btn" onclick="console.log('visible button clicked')">Visible button</button>
</body>
</html>`;

function startFixtureServer() {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = req.url.split("?")[0];
      if (url === "/" || url === "/index.html") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(FIXTURE_INDEX);
        return;
      }
      if (url === "/next.html") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(FIXTURE_NEXT);
        return;
      }
      if (url === "/nav-page.html") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(FIXTURE_NAV_PAGE);
        return;
      }
      if (url === "/nav-target.html") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(FIXTURE_NAV_TARGET);
        return;
      }
      if (url === "/cap-page.html") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(FIXTURE_CAP_PAGE);
        return;
      }
      if (url === "/dom-diff-page.html") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(FIXTURE_DOM_DIFF_PAGE);
        return;
      }
      if (url === "/dom-diff-target.html") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(FIXTURE_DOM_DIFF_TARGET);
        return;
      }
      if (url === "/delayed-nav-page.html") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(FIXTURE_DELAYED_NAV_PAGE);
        return;
      }
      if (url === "/delayed-nav-target.html") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(FIXTURE_DELAYED_NAV_TARGET);
        return;
      }
      if (url === "/hidden-page.html") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(FIXTURE_HIDDEN_PAGE);
        return;
      }
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("not found");
    });
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

let passCount = 0;
let failCount = 0;

function assertTrue(condition, label) {
  if (condition) {
    passCount += 1;
    console.log(`PASS: ${label}`);
  } else {
    failCount += 1;
    console.log(`FAIL: ${label}`);
  }
}

function assertEqual(actual, expected, label) {
  assertTrue(actual === expected, `${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

async function main() {
  const { server, port } = await startFixtureServer();
  const baseUrl = `http://127.0.0.1:${port}/`;
  console.log(`[selftest] fixture server listening at ${baseUrl}`);

  try {
    // --- check_route ---
    console.log("\n--- check_route ---");
    const routeResult = await checkRoute({ url: baseUrl, viewport: "desktop" });
    assertEqual(routeResult.ok, true, "check_route: ok is true");
    assertEqual(routeResult.renderedText, true, "check_route: renderedText is true");
    assertEqual(routeResult.httpStatus, 200, "check_route: httpStatus is 200");
    assertEqual(routeResult.title, "Fixture Home", "check_route: title matches fixture");
    assertTrue(
      typeof routeResult.screenshotPath === "string" && routeResult.screenshotPath.length > 0,
      "check_route: screenshotPath is a non-empty string"
    );
    assertTrue(Array.isArray(routeResult.consoleErrors), "check_route: consoleErrors is an array");
    assertTrue(Array.isArray(routeResult.failedRequests), "check_route: failedRequests is an array");

    // --- test_site ---
    console.log("\n--- test_site ---");
    const siteResult = await testSite({
      url: baseUrl,
      maxPages: 1,
      sameOriginOnly: true,
      viewport: "desktop",
      maxElements: 50,
    });

    assertEqual(siteResult.startUrl, baseUrl, "test_site: startUrl matches");
    assertEqual(siteResult.pagesTested.length, 1, "test_site: pagesTested has exactly 1 page");

    const page = siteResult.pagesTested[0];
    // Interactive elements on the fixture: 2 links + 2 buttons = 4
    assertEqual(page.elementsFound, 4, "test_site: elementsFound is 4 (2 links + 2 buttons)");
    assertEqual(page.elementsTested, 4, "test_site: elementsTested is 4 (under the cap)");
    assertEqual(page.capped, false, "test_site: capped is false");
    assertEqual(siteResult.summary.capped, false, "test_site: summary.capped is false");

    const throwButton = page.elements.find((el) => el.label && el.label.includes("throws"));
    assertTrue(!!throwButton, "test_site: found the throwing button in results");
    if (throwButton) {
      assertEqual(throwButton.result, "fail", "test_site: throwing button is marked fail");
      assertTrue(!!throwButton.error, "test_site: throwing button has an error message");
    }

    const okButton = page.elements.find((el) => el.label && el.label.includes("ok"));
    assertTrue(!!okButton, "test_site: found the ok button in results");
    if (okButton) {
      assertEqual(okButton.result, "pass", "test_site: ok button is marked pass");
    }

    const sameOriginLink = page.elements.find((el) => el.tag === "a" && el.navigatedTo && el.navigatedTo.includes("next.html"));
    assertTrue(!!sameOriginLink, "test_site: found the same-origin link and it navigated");
    if (sameOriginLink) {
      assertEqual(sameOriginLink.result, "pass", "test_site: same-origin link navigation is marked pass");
      assertEqual(sameOriginLink.httpStatus, 200, "test_site: same-origin link returned 200");
    }

    const externalLink = page.elements.find((el) => el.tag === "a" && el.href && el.href.includes("example.com"));
    assertTrue(!!externalLink, "test_site: found the external link in results");
    if (externalLink) {
      assertEqual(externalLink.action, "skip", "test_site: external link was skipped (sameOriginOnly=true)");
    }

    assertEqual(siteResult.summary.fail, 1, "test_site: summary.fail is exactly 1 (the throwing button)");
    assertTrue(siteResult.summary.pass >= 2, "test_site: summary.pass counts at least the ok button + same-origin link");

    // --- test_site: navigation-stale regression ---
    // A submit button navigates the CURRENT page (unlike <a href>, which
    // opens a fresh page). The elements after it in DOM order must be
    // genuinely re-tested post-restore, or truthfully marked non-pass,
    // NEVER silently reported as a false "pass".
    console.log("\n--- test_site: navigation-stale regression ---");
    const navUrl = `${baseUrl}nav-page.html`;
    const navResult = await testSite({
      url: navUrl,
      maxPages: 1,
      sameOriginOnly: true,
      viewport: "desktop",
      maxElements: 50,
    });
    const navPage = navResult.pagesTested[0];

    assertEqual(navPage.elementsFound, 3, "nav-stale: elementsFound is 3 (submit button + trailing button + trailing link)");
    assertEqual(navPage.elementsTested, 3, "nav-stale: elementsTested is 3 (all reported, none dropped)");

    const submitEl = navPage.elements[0];
    assertTrue(!!submitEl, "nav-stale: submit button record exists");
    if (submitEl) {
      assertEqual(submitEl.action, "click-navigated", "nav-stale: submit button action is click-navigated");
      assertEqual(submitEl.result, "pass", "nav-stale: submit button is marked pass (landed on a clean page)");
      assertTrue(
        typeof submitEl.navigatedTo === "string" && submitEl.navigatedTo.includes("nav-target.html"),
        "nav-stale: submit button navigatedTo points at nav-target.html"
      );
    }

    // THE regression check: the trailing button must never be a false
    // "not visible, skipped" pass. It must either be genuinely re-tested
    // (pass/fail on its own merit, action click/click-navigated) or
    // truthfully marked as not-exercised (skipped_stale), but NEVER
    // note==="not visible, skipped".
    const trailingButtonEl = navPage.elements[1];
    assertTrue(!!trailingButtonEl, "nav-stale: trailing button record exists");
    if (trailingButtonEl) {
      assertTrue(
        trailingButtonEl.note !== "not visible, skipped",
        `nav-stale: trailing button is NOT falsely reported as "not visible, skipped" (got note=${JSON.stringify(trailingButtonEl.note)}, result=${JSON.stringify(trailingButtonEl.result)})`
      );
      assertTrue(
        trailingButtonEl.tag !== "unknown" || trailingButtonEl.note === "skipped_stale",
        "nav-stale: trailing button is either genuinely identified (re-tested post-restore) or explicitly skipped_stale, not a fabricated unknown-pass"
      );
    }

    const trailingLinkEl = navPage.elements[2];
    assertTrue(!!trailingLinkEl, "nav-stale: trailing link record exists");
    if (trailingLinkEl) {
      assertTrue(
        trailingLinkEl.note !== "not visible, skipped",
        `nav-stale: trailing link is NOT falsely reported as "not visible, skipped" (got note=${JSON.stringify(trailingLinkEl.note)}, result=${JSON.stringify(trailingLinkEl.result)})`
      );
    }

    // With the fix, the page is restored after the submit navigation and
    // handles are re-queried fresh, so both trailing elements should
    // actually be identifiable and exercised (this asserts the FULL fix,
    // not just "not falsely passing").
    assertTrue(
      trailingButtonEl && trailingButtonEl.tag === "button" && trailingButtonEl.result === "pass" && trailingButtonEl.action === "click",
      `nav-stale: trailing button was genuinely re-tested after page-restore and passed (got ${JSON.stringify(trailingButtonEl)})`
    );
    assertTrue(
      trailingLinkEl && trailingLinkEl.tag === "a" && trailingLinkEl.result === "pass",
      `nav-stale: trailing link was genuinely re-tested after page-restore and passed (got ${JSON.stringify(trailingLinkEl)})`
    );

    // --- test_site: maxElements cap ---
    console.log("\n--- test_site: maxElements cap ---");
    const capMaxElements = 3;
    const capResult = await testSite({
      url: `${baseUrl}cap-page.html`,
      maxPages: 1,
      sameOriginOnly: true,
      viewport: "desktop",
      maxElements: capMaxElements,
    });
    const capPage = capResult.pagesTested[0];

    assertEqual(capPage.elementsFound, CAP_BUTTON_COUNT, `cap: elementsFound is ${CAP_BUTTON_COUNT} (all buttons on the fixture)`);
    assertEqual(capPage.elementsTested, capMaxElements, `cap: elementsTested is capped at maxElements (${capMaxElements})`);
    assertTrue(capPage.elementsFound > capPage.elementsTested, "cap: elementsFound > elementsTested (cap actually reduced the tested count)");
    assertEqual(capPage.capped, true, "cap: capped is true");
    assertEqual(capResult.summary.capped, true, "cap: summary.capped is true");

    // --- test_site: DOM-diff-after-nav (round 3 regression) ---
    // Round 2's detect-and-restore design still had a hole: handle.isVisible()
    // on a stale post-navigation handle can resolve to `false` WITHOUT
    // throwing, which fell into "not visible, skipped" -> result:"pass",
    // silently reporting the untested Real CTA as passing. The hermetic
    // design (reload + re-find per element, no shared handle) must genuinely
    // test the Real CTA instead of falsely passing it.
    console.log("\n--- test_site: DOM-diff-after-nav regression ---");
    const domDiffUrl = `${baseUrl}dom-diff-page.html`;
    const domDiffResult = await testSite({
      url: domDiffUrl,
      maxPages: 1,
      sameOriginOnly: true,
      viewport: "desktop",
      maxElements: 50,
    });
    const domDiffPage = domDiffResult.pagesTested[0];

    assertEqual(domDiffPage.elementsFound, 2, "dom-diff: elementsFound is 2 (nav button + real CTA)");
    assertEqual(domDiffPage.elementsTested, 2, "dom-diff: elementsTested is 2 (both reported)");

    const navButtonEl = domDiffPage.elements.find((el) => el.label === "Accept (navigates)");
    assertTrue(!!navButtonEl, "dom-diff: nav button record exists");
    if (navButtonEl) {
      assertEqual(navButtonEl.action, "click-navigated", "dom-diff: nav button action is click-navigated");
      assertEqual(navButtonEl.result, "pass", "dom-diff: nav button is marked pass (landed on a clean page)");
      assertTrue(
        typeof navButtonEl.navigatedTo === "string" && navButtonEl.navigatedTo.includes("dom-diff-target.html"),
        "dom-diff: nav button navigatedTo points at dom-diff-target.html"
      );
    }

    const realCtaEl = domDiffPage.elements.find((el) => el.label === "Real CTA");
    assertTrue(!!realCtaEl, "dom-diff: Real CTA record exists");
    if (realCtaEl) {
      // THE regression check, verbatim: never result:"pass" with
      // note:"not visible, skipped" for an element that was never actually
      // exercised.
      const isFalseInvisiblePass = realCtaEl.result === "pass" && realCtaEl.note === "not visible, skipped";
      assertTrue(
        !isFalseInvisiblePass,
        `dom-diff: Real CTA is NEVER falsely reported as result:"pass" + note:"not visible, skipped" (got ${JSON.stringify(realCtaEl)})`
      );
      // Full positive assertion: it was genuinely found, identified, and
      // clicked successfully on its own fresh reload.
      assertTrue(
        realCtaEl.tag === "button" && realCtaEl.action === "click" && realCtaEl.result === "pass",
        `dom-diff: Real CTA was genuinely re-found and tested on its own fresh page load (got ${JSON.stringify(realCtaEl)})`
      );
    }

    // --- test_site: delayed navigation + correct attribution (round 3) ---
    // One button navigates via setTimeout 250ms after click (past the old
    // 150ms detection window); a sibling button never navigates at all.
    // Both must be reported correctly: the delayed-nav button as
    // click-navigated, the sibling never falsely credited with a
    // navigation it did not cause.
    console.log("\n--- test_site: delayed navigation + attribution regression ---");
    const delayedNavUrl = `${baseUrl}delayed-nav-page.html`;
    const delayedNavResult = await testSite({
      url: delayedNavUrl,
      maxPages: 1,
      sameOriginOnly: true,
      viewport: "desktop",
      maxElements: 50,
    });
    const delayedNavPage = delayedNavResult.pagesTested[0];

    assertEqual(delayedNavPage.elementsFound, 2, "delayed-nav: elementsFound is 2 (delayed-nav button + no-nav button)");
    assertEqual(delayedNavPage.elementsTested, 2, "delayed-nav: elementsTested is 2 (both reported)");

    const delayedNavButtonEl = delayedNavPage.elements.find((el) => el.label === "Delayed nav");
    assertTrue(!!delayedNavButtonEl, "delayed-nav: delayed-nav button record exists");
    if (delayedNavButtonEl) {
      assertEqual(delayedNavButtonEl.action, "click-navigated", "delayed-nav: delayed-nav button IS correctly recorded click-navigated (caught within the 1500ms poll despite the 250ms delay)");
      assertEqual(delayedNavButtonEl.result, "pass", "delayed-nav: delayed-nav button is marked pass (landed on a clean page)");
      assertTrue(
        typeof delayedNavButtonEl.navigatedTo === "string" && delayedNavButtonEl.navigatedTo.includes("delayed-nav-target.html"),
        "delayed-nav: delayed-nav button navigatedTo points at delayed-nav-target.html"
      );
    }

    const noNavButtonEl = delayedNavPage.elements.find((el) => el.label === "No nav");
    assertTrue(!!noNavButtonEl, "delayed-nav: no-nav button record exists");
    if (noNavButtonEl) {
      assertTrue(
        noNavButtonEl.action !== "click-navigated",
        `delayed-nav: no-nav button is NOT falsely credited with a navigation it did not cause (got action=${JSON.stringify(noNavButtonEl.action)})`
      );
      assertEqual(noNavButtonEl.action, "click", "delayed-nav: no-nav button action is plain click");
      assertEqual(noNavButtonEl.result, "pass", "delayed-nav: no-nav button is marked pass");
    }

    // --- test_site: genuinely-hidden element must never be a false pass ---
    // A display:none element is enumerated but never exercised. It must be
    // reported result:"skip" (honest not-tested), NEVER result:"pass". This
    // is the round-4 regression: the not-visible branch used to inherit the
    // "pass" default and silently claim an untested element passed.
    console.log("\n--- test_site: hidden element must never false-pass ---");
    const hiddenUrl = `${baseUrl}hidden-page.html`;
    const hiddenResult = await testSite({
      url: hiddenUrl,
      maxPages: 1,
      sameOriginOnly: true,
      viewport: "desktop",
      maxElements: 50,
    });
    const hiddenPage = hiddenResult.pagesTested[0];

    assertEqual(hiddenPage.elementsFound, 2, "hidden: elementsFound is 2 (hidden + visible button)");
    assertEqual(hiddenPage.elementsTested, 2, "hidden: elementsTested is 2 (both reported)");

    // Match by selector, not label: a display:none button has empty innerText
    // so its label falls back to the tag ("button").
    const hiddenBtnEl = hiddenPage.elements.find((el) => el.selector && el.selector.includes("hidden-btn"));
    assertTrue(!!hiddenBtnEl, "hidden: hidden button record exists");
    if (hiddenBtnEl) {
      assertTrue(
        hiddenBtnEl.result !== "pass",
        `hidden: display:none element is NEVER result:"pass" (got ${JSON.stringify(hiddenBtnEl)})`
      );
      assertEqual(hiddenBtnEl.result, "skip", "hidden: display:none element is result:skip (honest not-tested)");
      assertEqual(hiddenBtnEl.action, "skip", "hidden: display:none element action is skip");
    }

    const visibleBtnEl = hiddenPage.elements.find((el) => el.selector && el.selector.includes("visible-btn"));
    assertTrue(!!visibleBtnEl, "hidden: visible button record exists");
    if (visibleBtnEl) {
      assertEqual(visibleBtnEl.result, "pass", "hidden: sibling visible button was genuinely tested and passed");
      assertEqual(visibleBtnEl.action, "click", "hidden: sibling visible button action is click");
    }

    assertTrue(hiddenResult.summary.skipped >= 1, "hidden: summary.skipped counts the hidden element (not folded into pass or fail)");
    assertEqual(hiddenResult.summary.fail, 0, "hidden: summary.fail is 0 (a hidden element is not a failure)");

    // Cross-origin skip on the base fixture must also be an honest skip, not
    // a false pass, now that skip is a distinct result value.
    const baseExternalLink = page.elements.find((el) => el.tag === "a" && el.href && el.href.includes("example.com"));
    if (baseExternalLink) {
      assertEqual(baseExternalLink.result, "skip", "base: cross-origin external link is result:skip (not a false pass)");
    }
  } finally {
    server.close();
    console.log("\n[selftest] fixture server closed");
  }

  console.log(`\n[selftest] ${passCount} passed, ${failCount} failed`);
  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[selftest] fatal error:", err);
  process.exit(1);
});

#!/usr/bin/env node
//
// Per-section anatomy dumper. Report-only, never a gate.
//
// WHY THIS EXISTS. `_design-system/sections/` has ten screen folders and only
// `salon-detail` holds a real spec (20 per-section files). The other nine hold a
// single CORPUS.md each. salon-detail is also the only route in the product that
// breaks zero design floors, and the only screen the owner says he likes. Writing
// the nine missing specs is item S4 of _plans/DESIGN_CONSISTENCY_2026-08-27.md.
//
// A spec's "Measured" block has to match what the live page actually renders. Nine
// separate agents each firing their own Playwright at the same dev server is exactly
// the load that produced today's wrong numbers (see the SETTLE note in
// check-geometry.mjs). So this walks the routes SEQUENTIALLY, once, and writes one
// JSON per route that every spec writer then reads off disk. One measurement, N
// consumers, no contention.
//
// EXISTS-CHECK (rule 12), run before writing this. Siblings that were read and do
// not cover it:
//   scripts/check-geometry.mjs          six whole-page FLOORS numbers, no section tree
//   scripts/measure-balance.mjs         two measures (frame overflow, entity divergence)
//   scripts/detect-type-scale-outliers  static grep of text-[Npx] in source, never renders
//   scripts/audit-routes.mjs            route inventory, no styles
// The delta this adds is the per-section breakdown: which sections a screen has, in
// order, and for each one its box, its surface, its distinct text roles and its card
// anatomy. Nothing else in scripts/ produces that.
//
// Browser bootstrap, settle wait and dev sign-in are lifted from check-geometry.mjs
// on purpose so the two tools can never disagree about when a page is ready.
//
// Usage:
//   node scripts/measure-sections.mjs /de /de/coiffeur
//   node scripts/measure-sections.mjs --auth /de/profile
//   BASE_URL=http://localhost:3457 node scripts/measure-sections.mjs /de
//   node scripts/measure-sections.mjs --all           (the nine spec-less screens)
//
// Output: _design-system/sections/_measured/<slug>.json, plus a stdout summary.

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..");
const OUT_DIR = join(REPO_ROOT, "_design-system/sections/_measured");

const SETTLE_FLOOR_MS = 4000;
const SETTLE_POLL_MS = 300;
const SETTLE_CAP_MS = 25_000;
const DEFAULT_AUTH_EMAIL = "kunde@solen.ch";

// The nine screen folders under _design-system/sections/ that hold no spec, mapped to
// the live route that renders them. salon-detail is deliberately absent: it already has
// its 20 files and is the template, not a target.
const SPECLESS_SCREENS = [
  { folder: "home-feed", route: "/de", auth: false },
  { folder: "search-results", route: "/de/basel/coiffeur", auth: false },
  { folder: "profile-hub", route: "/de/profile", auth: true },
  // CORRECTED 2026-08-27: /de/profile/saved is not a route. The first run measured the 404
  // page and filed it as the saved screen. There are two real saved surfaces and they are
  // different screens, so both get measured rather than one standing in for the other.
  { folder: "saved-salons", route: "/de/profile/favorites", auth: true },
  { folder: "saved-looks", route: "/de/inspo/saved", auth: true },
  { folder: "booking-service", route: "/de/salon/cuts-and-culture/booking", auth: false },
  // confirmation is NOT here either. `/de/confirmation` with no parameters renders an error
  // state headed "Diese Seite wurde abgeschnitten." The page requires a booking_id
  // (app/[locale]/confirmation/page.tsx line 45), and a guest booking also needs
  // access_token. The first run of this script measured `/de/booking/lookup` instead, which
  // is a different screen entirely (a "find my booking" form), and that JSON was deleted
  // rather than left on disk for a spec writer to describe as the confirmation.
];

// The other four booking steps are NOT in the list above, and the reason is a measured
// finding rather than an omission. The first run of this script used
// `/booking?step=staff`, `?step=datetime` and `?step=pay` as routes. All three returned
// the identical screen, six bands headed "Services auswaehlen / Bart / Extras /
// Haarschnitt / Kombi", byte for byte the same as step one. The step is not in the URL:
// BookingWizard (components-legacy/booking/BookingWizard.tsx) holds it in React state via
// lib/booking-context, and there is no searchParams read anywhere in that component. So a
// query parameter cannot select a step and never could.
//
// Two consequences, both worth writing down rather than working around silently:
//   1. booking-staff, booking-datetime and checkout-pay have to be measured by DRIVING the
//      wizard (pick a service, press through), not by navigating. That is a separate pass.
//   2. A booking step is not linkable and the browser back button inside the flow leaves
//      the flow rather than stepping back one. That is product behaviour, not a bug in this
//      tool, and it is recorded here because this is where it was found. Not investigated
//      further: it is outside what this script is for.
//
// The first run's four step JSONs were all copies of step one and were deleted rather than
// left on disk, because a spec writer reading them would have written three specs of the
// wrong screen.
const DRIVEN_SCREENS = ["booking-staff", "booking-datetime", "checkout-pay"];

function parseArgs(argv) {
  const routes = [];
  let baseUrl = process.env.BASE_URL || "http://localhost:3000";
  let auth = false;
  let authEmail = DEFAULT_AUTH_EMAIL;
  let all = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--base-url") baseUrl = argv[++i];
    else if (a === "--auth") auth = true;
    else if (a.startsWith("--auth=")) { auth = true; authEmail = a.slice("--auth=".length); }
    else if (a === "--all") all = true;
    else if (!a.startsWith("--")) routes.push(a);
  }
  return { baseUrl, auth, authEmail, all, routes };
}

function sampleSettleSignature() {
  const SVG_NS = "http://www.w3.org/2000/svg";
  let textCount = 0, maxFont = 0, imageArea = 0;
  for (const el of document.body.querySelectorAll("*")) {
    const tag = el.tagName.toLowerCase();
    if (el.namespaceURI === SVG_NS && tag !== "svg") continue;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    let hasOwnText = false;
    for (const node of el.childNodes) {
      if (node.nodeType === 3 && node.textContent && node.textContent.trim().length > 0) { hasOwnText = true; break; }
    }
    if (hasOwnText) {
      textCount++;
      const fontSize = parseFloat(style.fontSize) || 0;
      if (fontSize > maxFont) maxFont = fontSize;
    }
    if (tag === "img") { if (el.complete && el.naturalWidth > 0) imageArea += rect.width * rect.height; }
    else if (/url\(/.test(style.backgroundImage || "")) imageArea += rect.width * rect.height;
  }
  return `${textCount}|${Math.round(maxFont * 100)}|${Math.round(imageArea)}`;
}

// SETTLE note, part two (2026-08-27, /de/inspo/saved). sampleSettleSignature above holds
// three quantities steady to decide a page is done: text-leaf count, max font size, loaded
// image area. A loading skeleton holds all three of those constant while it shimmers, so the
// settle loop was declaring a skeleton settled and the whole run measured the loading state
// instead of the real screen. Proven four ways on that route: (1) the capture had 12 cards
// and DiscoveryGridSkeleton's RATIOS array has exactly 12 entries, (2) measured tile width
// 196px matches the skeleton's "-mx-4 px-1.5" wrapper math, not the real grid's "-mx-0 px-1.5"
// (186px), (3) tile height 261px = 196 * 4/3 = RATIOS[0] of "3 / 4", (4) card background was
// rgba(0,0,0,0) with zero images, where a real ItemCard frame is bg-s-bg-sunken and holds an
// <img>. Known-answer control that passed at the same time: the identical width arithmetic on
// /de/profile/favorites predicts 358 and the capture measures 358, so the instrument itself was
// never the problem, only what it was willing to call "done". countVisibleSkeletons below is
// the fix: the settle loop now also requires zero visible skeleton elements before it returns
// settled, on top of the unchanged signature it already required.
//
// CORRECTED same day: the pattern first shipped here as /animate-pulse|skeleton/i and never
// matched the one component it was built for. The registered <Skeleton> primitive
// (app/[locale]/_components/primitives/Skeleton.tsx), which DiscoveryGridSkeleton wraps for
// /de/inspo/saved, renders "animate-shimmer" (Tailwind keyframe), not "animate-pulse", and its
// class list contains no substring "skeleton" either. A check that cannot fire on the one case
// it was written for is worse than no check, it reads as coverage it does not have. Widened to
// also match animate-shimmer; animate-pulse and skeleton stay in the pattern because the design
// contract still names <Skeleton> for loading states generally and other surfaces may use
// either token.
function countVisibleSkeletons() {
  let count = 0;
  for (const el of document.body.querySelectorAll("*")) {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    let className = el.className;
    if (typeof className !== "string") {
      // SVG elements expose className as an SVGAnimatedString, not a plain string.
      if (className && typeof className.baseVal === "string") className = className.baseVal;
      else continue;
    }
    if (/animate-pulse|animate-shimmer|skeleton/i.test(className)) count++;
  }
  return count;
}

async function waitForPageSettle(page) {
  await page.waitForLoadState("networkidle", { timeout: 3000 }).catch((err) => {
    console.error("[measure-sections] networkidle wait did not resolve, continuing without it:", err && err.message ? err.message : err);
  });
  await page.waitForTimeout(SETTLE_FLOOR_MS);
  const start = Date.now();
  let previous = null;
  let skeletonCount = 0;
  while (Date.now() - start < SETTLE_CAP_MS) {
    let current;
    try { current = await page.evaluate(sampleSettleSignature); }
    catch (err) {
      console.error("[measure-sections] settle sample failed, treating this route as unsettled:", err);
      return { settled: false };
    }
    try { skeletonCount = await page.evaluate(countVisibleSkeletons); }
    catch (err) {
      console.error("[measure-sections] skeleton count failed, treating this route as unsettled:", err);
      return { settled: false };
    }
    if (current === previous && skeletonCount === 0) return { settled: true };
    previous = current;
    await page.waitForTimeout(SETTLE_POLL_MS);
  }
  if (skeletonCount > 0) {
    console.error(`[measure-sections] settle cap reached with ${skeletonCount} visible skeleton element(s) still on screen, this route is skeleton blocked, not just slow to settle`);
    return { settled: false, skeletonBlocked: true, skeletonCount };
  }
  return { settled: false };
}

async function signInDevAuth(context, baseUrl, email) {
  const page = await context.newPage();
  try {
    const url = new URL(`/api/dev/login?to=/&email=${encodeURIComponent(email)}`, baseUrl).toString();
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    const finalUrl = page.url();
    const landedOnLogin = /\/auth\/login(?:$|[/?])/.test(finalUrl);
    return { ok: !!response && response.ok() && !landedOnLogin, status: response ? response.status() : 0, finalUrl };
  } catch (err) {
    console.error("[measure-sections] --auth sign-in request failed:", err);
    return { ok: false, status: 0, finalUrl: "", error: err && err.message ? err.message : String(err) };
  } finally {
    await page.close().catch((err) => console.error("[measure-sections] sign-in page.close() failed:", err));
  }
}

function isRedirectedAway(finalUrl, baseUrl, route) {
  try {
    const expected = new URL(route, baseUrl);
    const actual = new URL(finalUrl);
    return actual.pathname !== expected.pathname;
  } catch (err) {
    console.error("[measure-sections] could not compare final URL against the requested route:", err);
    return false;
  }
}

// ----------------------------------------------------------------------------
// The extractor. Runs INSIDE the page.
//
// A "section" here is a band of the screen, not a DOM convention, because this
// codebase does not use <section> consistently. A node counts as a section when it
// is a landmark tag, OR it carries a heading among its own descendants and its
// parent does not carry that same heading alone. That picks up hand-rolled
// <div class="mt-8"> bands, which is most of what these nine screens are made of.
// ----------------------------------------------------------------------------
function extractSections() {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const LANDMARKS = new Set(["header", "nav", "main", "footer", "section", "aside", "form"]);
  const HEADINGS = new Set(["h1", "h2", "h3"]);

  function visible(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return null;
    return { rect, style };
  }

  function ownText(el) {
    let out = "";
    for (const node of el.childNodes) {
      if (node.nodeType === 3 && node.textContent && node.textContent.trim()) out += node.textContent.trim() + " ";
    }
    return out.trim();
  }

  // candidate section roots
  const candidates = [];
  for (const el of document.body.querySelectorAll("*")) {
    if (el.namespaceURI === SVG_NS) continue;
    const tag = el.tagName.toLowerCase();
    const v = visible(el);
    if (!v) continue;
    if (v.rect.height < 24) continue;
    const isLandmark = LANDMARKS.has(tag);
    const headings = Array.from(el.children).filter((c) => HEADINGS.has(c.tagName.toLowerCase()));
    const leadsWithHeading = headings.length > 0;
    if (isLandmark || leadsWithHeading) candidates.push({ el, tag, ...v });
  }

  // drop a candidate fully contained in another candidate that has the same heading text,
  // keeping the OUTER one, so a heading wrapped in three divs reports once.
  const kept = [];
  for (const c of candidates) {
    const dupe = kept.find((k) => k.el.contains(c.el) && k.el.innerText.trim() === c.el.innerText.trim());
    if (!dupe) kept.push(c);
  }
  kept.sort((a, b) => a.rect.top - b.rect.top);

  function textRoles(root) {
    const roles = new Map();
    for (const el of root.querySelectorAll("*")) {
      if (el.namespaceURI === SVG_NS) continue;
      const t = ownText(el);
      if (!t) continue;
      const v = visible(el);
      if (!v) continue;
      const s = v.style;
      const key = [
        Math.round(parseFloat(s.fontSize) * 100) / 100,
        s.fontWeight,
        (s.fontFamily || "").split(",")[0].replace(/["']/g, ""),
        s.color,
        s.textTransform,
        Math.round(parseFloat(s.lineHeight) * 100) / 100 || "normal",
        s.letterSpacing,
      ].join("|");
      if (!roles.has(key)) {
        roles.set(key, {
          fontSizePx: Math.round(parseFloat(s.fontSize) * 100) / 100,
          fontWeight: s.fontWeight,
          fontFamily: (s.fontFamily || "").split(",")[0].replace(/["']/g, ""),
          color: s.color,
          textTransform: s.textTransform,
          lineHeightPx: Math.round(parseFloat(s.lineHeight) * 100) / 100 || null,
          letterSpacing: s.letterSpacing,
          count: 0,
          sample: t.slice(0, 60),
        });
      }
      roles.get(key).count++;
    }
    return Array.from(roles.values()).sort((a, b) => b.fontSizePx - a.fontSizePx);
  }

  function cardAnatomy(root) {
    const cards = new Map();
    for (const el of root.querySelectorAll("*")) {
      if (el.namespaceURI === SVG_NS) continue;
      const v = visible(el);
      if (!v) continue;
      const s = v.style;
      const radius = parseFloat(s.borderTopLeftRadius) || 0;
      const hasShadow = s.boxShadow && s.boxShadow !== "none";
      const hasBorder = (parseFloat(s.borderTopWidth) || 0) > 0;
      if (radius < 8 && !hasShadow) continue;
      if (v.rect.width < 60 || v.rect.height < 32) continue;
      const key = [radius, s.boxShadow, s.borderTopWidth, s.borderTopColor, s.backgroundColor, s.padding].join("|");
      if (!cards.has(key)) {
        cards.set(key, {
          radiusPx: radius,
          boxShadow: hasShadow ? s.boxShadow : "none",
          border: hasBorder ? `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}` : "none",
          background: s.backgroundColor,
          padding: s.padding,
          count: 0,
          exampleSize: `${Math.round(v.rect.width)}x${Math.round(v.rect.height)}`,
        });
      }
      cards.get(key).count++;
    }
    return Array.from(cards.values()).sort((a, b) => b.count - a.count).slice(0, 8);
  }

  function imagery(root) {
    let area = 0, count = 0;
    for (const el of root.querySelectorAll("img")) {
      const v = visible(el);
      if (!v) continue;
      if (!el.complete || !el.naturalWidth) continue;
      area += v.rect.width * v.rect.height;
      count++;
    }
    for (const el of root.querySelectorAll("*")) {
      if (el.tagName.toLowerCase() === "img") continue;
      const v = visible(el);
      if (!v) continue;
      if (!/url\(/.test(v.style.backgroundImage || "")) continue;
      area += v.rect.width * v.rect.height;
      count++;
    }
    return { imageCount: count, imageAreaPx: Math.round(area) };
  }

  // The section's NAME. A direct-child heading is the clean case, but most bands on
  // these screens wrap their h2 two or three divs deep, which reported "(no heading)"
  // for 13 of the 15 bands on /de the first time this ran. So fall back to the first
  // visible heading DESCENDANT, then to the first visible text leaf whose font size is
  // the largest in the band, which is what a reader would call the section title anyway.
  function sectionName(el) {
    const direct = Array.from(el.children).find((x) => HEADINGS.has(x.tagName.toLowerCase()));
    if (direct && direct.innerText.trim()) return direct.innerText.trim().slice(0, 80);
    for (const h of el.querySelectorAll("h1,h2,h3,h4")) {
      if (!visible(h)) continue;
      const t = h.innerText.trim();
      if (t) return t.slice(0, 80);
    }
    let best = null;
    for (const node of el.querySelectorAll("*")) {
      if (node.namespaceURI === SVG_NS) continue;
      const t = ownText(node);
      if (!t) continue;
      const v = visible(node);
      if (!v) continue;
      const size = parseFloat(v.style.fontSize) || 0;
      if (!best || size > best.size) best = { size, text: t };
    }
    return best ? best.text.slice(0, 80) : null;
  }

  const sections = kept.map((c, i) => {
    return {
      index: i,
      tag: c.tag,
      className: (typeof c.el.className === "string" ? c.el.className : "").slice(0, 180),
      heading: sectionName(c.el),
      box: {
        top: Math.round(c.rect.top + window.scrollY),
        left: Math.round(c.rect.left),
        width: Math.round(c.rect.width),
        height: Math.round(c.rect.height),
      },
      surface: {
        background: c.style.backgroundColor,
        padding: c.style.padding,
        borderRadius: c.style.borderTopLeftRadius,
      },
      textRoles: textRoles(c.el),
      cards: cardAnatomy(c.el),
      imagery: imagery(c.el),
    };
  });

  const allRoles = textRoles(document.body);
  const sizes = Array.from(new Set(allRoles.map((r) => r.fontSizePx))).sort((a, b) => b - a);
  const weights = Array.from(new Set(allRoles.map((r) => r.fontWeight)));
  const totalText = allRoles.reduce((n, r) => n + r.count, 0);
  const boldText = allRoles.filter((r) => parseInt(r.fontWeight, 10) >= 600).reduce((n, r) => n + r.count, 0);

  return {
    title: document.title,
    pathname: location.pathname + location.search,
    documentHeight: Math.round(document.body.scrollHeight),
    screen: { distinctSizes: sizes, distinctWeights: weights, textElements: totalText, boldElements: boldText },
    sections,
  };
}

async function main() {
  const { baseUrl, auth, authEmail, all, routes: cliRoutes } = parseArgs(process.argv.slice(2));
  const targets = all
    ? SPECLESS_SCREENS
    : cliRoutes.map((r) => ({ folder: r.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "root", route: r, auth }));

  if (!targets.length) {
    console.error("[measure-sections] nothing to measure. Pass routes, or --all for the nine spec-less screens.");
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  const needsAuth = auth || targets.some((t) => t.auth);
  if (needsAuth) {
    const result = await signInDevAuth(context, baseUrl, authEmail);
    if (result.ok) console.log(`[measure-sections] signed in as ${authEmail}`);
    else console.error(`[measure-sections] sign-in FAILED (status ${result.status}, landed ${result.finalUrl}). Auth-only routes will be measured signed out and marked REDIRECTED.`);
  }

  const summary = [];
  for (const target of targets) {
    const page = await context.newPage();
    let record;
    try {
      const url = new URL(target.route, baseUrl).toString();
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      const status = response ? response.status() : 0;
      const settle = await waitForPageSettle(page);
      const finalUrl = page.url();
      const redirected = isRedirectedAway(finalUrl, baseUrl, target.route);
      const data = await page.evaluate(extractSections);
      record = {
        folder: target.folder,
        route: target.route,
        measuredAtViewport: "390x844",
        httpStatus: status,
        settled: settle.settled,
        skeletonBlocked: !!settle.skeletonBlocked,
        skeletonElementsVisible: settle.skeletonCount || 0,
        redirectedAway: redirected,
        finalUrl,
        ...data,
      };
      const flags = [];
      if (settle.skeletonBlocked) flags.push(`SKELETON_BLOCKED (${settle.skeletonCount} visible)`);
      else if (!settle.settled) flags.push("UNSETTLED");
      if (redirected) flags.push(`REDIRECTED to ${new URL(finalUrl).pathname}`);
      if (status >= 400) flags.push(`HTTP ${status}`);
      summary.push(`${target.folder.padEnd(20)} ${String(data.sections.length).padStart(3)} sections  ${String(data.screen.distinctSizes.length).padStart(2)} sizes  ${flags.length ? flags.join(" + ") : "ok"}`);
    } catch (err) {
      console.error(`[measure-sections] ${target.route} failed:`, err);
      record = { folder: target.folder, route: target.route, error: err && err.message ? err.message : String(err) };
      summary.push(`${target.folder.padEnd(20)} FAILED`);
    } finally {
      await page.close().catch((err) => console.error("[measure-sections] page.close() failed:", err));
    }
    const outPath = join(OUT_DIR, `${target.folder}.json`);
    writeFileSync(outPath, JSON.stringify(record, null, 2));
  }

  await context.close();
  await browser.close();

  console.log("");
  console.log("route                sections  sizes  state");
  for (const line of summary) console.log(line);
  console.log("");
  console.log(`written to _design-system/sections/_measured/`);
}

main().catch((err) => {
  console.error("[measure-sections] fatal:", err);
  process.exit(1);
});

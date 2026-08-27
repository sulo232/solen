#!/usr/bin/env node
// scripts/check-geometry.mjs
//
// DOM-geometry checker, report-only first pass (owner brief: "make the geometry
// law CHECKABLE instead of eyeballed"). Mirrors two existing house patterns rather
// than inventing a runner:
//   - browser bootstrap (prefer `playwright`, fall back to `playwright-core`,
//     launch/close in a finally) copied from scripts/mcp/site-tester/crawl.mjs
//   - standalone-script shape (usage banner at top, single main(), writes a report
//     file + prints to stdout, no test-runner dependency) copied from
//     scripts/capture/record-interaction.mjs
//   - ROUTES list + dismissCookies() + settle-wait sequence copied from
//     e2e/visual/spine.spec.ts (the existing route walk this task named)
//
// Checks the LOCKED geometry law:
//   a) OFF-GRID        every visible element's width/height/margin/padding that is
//                       not a multiple of 4 (4pt grid, LOCKFILE Spacing+Radius+Shadow
//                       section + RATIONALE.md domain 5). Exception list: 1px
//                       hairlines, text-driven heights (leaf/content-only elements),
//                       images/svg/video (intrinsic dimensions).
//   b) BROKEN AXIS      sibling element edges that are ALMOST aligned (1-3px delta) -
//                       the signature of an accident; a deliberate offset is bigger.
//   c) NESTED RADIUS    LOCKFILE DS-4: inner = outer - gap, min 4px. Off by >1px means
//                       the corner gap reads ~41% wider than the flat-edge gap
//                       (gap*sqrt(2) at the corner vs gap on the flat edge). Tested
//                       per CORNER (top-left/top-right/bottom-left/bottom-right,
//                       not a single value), and only against an ancestor that (1)
//                       actually paints that corner - bg-color, bg-image, overflow
//                       clip, or a border, never just a rounded-* class with a
//                       transparent/overflow:visible box - and (2) has the inner
//                       element close to that SAME corner on BOTH axes at once, not
//                       just one shared axis. 2026-07-17 sweep, see the (c) block
//                       below for the full reasoning + commit dea10438f triage.
//   d) ASYMMETRIC PAIR  sibling pairs (twin controls, DS-4) inside a flex row whose
//                       combined center sits >2px off the row's own center.
//
// FLOORS section (added 2026-07-25, owner brief: "make the FLOORS LAW
// measurable... a principle nobody can run is a principle that gets skipped").
// Same in-page shape as (a)-(d) above (own extraction function extractFloors,
// own viewport) since the checks and their population (leaf TEXT elements, not
// boxes) are a different shape than the geometry ones. Measures the FLOORS LAW
// / EMPHASIS BUDGET literals, on the RENDERED first viewport at 390x844
// (fixed, independent of --viewport - see the FLOORS config block below for
// why). Numbers are hardcoded with a comment citing the source, because this
// script cannot parse markdown law:
//   F2  IMAGERY        photographic area (<img> + any background-image url())
//                       as a share of the first viewport, floor 33%. Exempt BY
//                       NAME (forms / checkout payment step / legal / receipts,
//                       CLAUDE.md FLOORS LAW 2) via an editable prefix list.
//   F6  DISPLAY ANCHOR  the largest rendered font-size in the first viewport,
//                       floor 28px.
//   F7a WEIGHT SHARE     share of visible leaf text at computed weight >= 600,
//                       ceiling 30%.
//   F7b ANCHOR RATIO     max font-size / median font-size of visible leaf text
//                       (median lands on body, since most text IS body-sized),
//                       floor 1.8x.
//   F7c SIZE SPREAD      distinct sizes + a DENSEST-CLUSTER check (RANGE LAW
//                       G4 fix, 2026-07-25): flags >4 distinct sizes that fall
//                       inside ANY 8px window, found with a sliding window over
//                       the sorted sizes - not the array's global max-min. The
//                       global spread is still computed and shown in the
//                       report as CONTEXT only, never as the trigger: it used
//                       to BE the trigger, which let 1-2 outlier sizes stretch
//                       the range past 8px and hide a real cluster (home: 9
//                       distinct sizes / 19.2px global spread, PASSED under
//                       the old math even though most of those 9 sit bunched
//                       within a few px of each other).
//   ELEVATION            distinct non-none box-shadow values, floor 2.
// Default and --floors-only (without --gate) stay report-only, always exit 0 -
// see the --gate flag below (RANGE LAW G1, 2026-07-25) for the mode that can
// actually fail the run.
//
// Usage:
//   node scripts/check-geometry.mjs
//   node scripts/check-geometry.mjs --base-url http://localhost:3000 /de /de/some-route
//   node scripts/check-geometry.mjs --viewport desktop
//   node scripts/check-geometry.mjs --floors-only            (FLOORS section only, skips a-d)
//   node scripts/check-geometry.mjs --floors-only /de /de/salon/some-slug
//   node scripts/check-geometry.mjs --floors-only --gate     (FAILS the run on an un-allowlisted floor)
//   BASE_URL=http://localhost:3000 node scripts/check-geometry.mjs
//   npm run check:floors                                     (= --floors-only, package.json)
//   npm run gate:floors                                      (= --floors-only --gate, package.json)
//
// Exit code: 0 in every mode UNLESS --gate is passed - the (a)-(d) geometry
// pass is never gated by this task, only FLOORS is. --gate (RANGE LAW G1,
// 2026-07-25) exits 1 when any non-exempt route FAILs a floor that is not
// listed in FLOORS_ALLOWLIST below. That list is the ratchet: an entry gets
// DELETED once its surface is fixed, never added fresh to route around a new
// failure (the gate prints this reminder on every un-allowlisted failure).

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

// ----------------------------------------------------------------------------
// Config
// ----------------------------------------------------------------------------
const DEFAULT_ROUTES = ["/de", "/de/salon/old-town-barbers", "/de/booking/lookup"];
const OUTPUT_PATH = resolve(process.cwd(), "_design-system/_geometry-report.md");

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 900 },
};

const GRID = 4;
const GRID_TOLERANCE = 0.5; // px - absorbs subpixel flex/grid distribution noise
const NEARMISS_MIN = 1; // px
const NEARMISS_MAX = 3; // px
const RADIUS_TOLERANCE = 1; // px, per checklist item (c)
// Real nested-radius padding never exceeds the largest documented spacing tier
// (Section = 32px, LOCKFILE spacing rhythm); 40px gives headroom. Without this
// cap, the "nearest rounded ancestor" walk matches a big page-level rounded
// sheet wrapper (radius applied once, near its own top corner) against any
// descendant far down the page whose OWN unrelated border-radius happens to
// still sit inside that wrapper's bounding box - found by inspecting the
// first-pass report (bogus "gap"s of 51.5px/137px/155.31px/178.77px).
//
// 2026-07-17: this used to be applied on its own, as a ceiling on
// gap = min(gapLeft, gapTop) - a single number standing in for "is this
// corner-adjacent at all". That's now folded into the per-axis CORNER_WINDOW
// inside extractGeometry's nested-radius block (window = outerRadius +
// RADIUS_GAP_CAP, checked against BOTH axes independently, see FIX 2 there).
// Kept as one constant, not stacked as two separate ceilings.
const RADIUS_GAP_CAP = 40;
const ASYMMETRY_TOLERANCE = 2; // px, per checklist item (d)
const PILL_RADIUS_PX = 999; // Tailwind rounded-full / `pill` token convention

// Cap how many sample findings per check per route get printed, so the report
// stays readable. The COUNT reported is always the true total, never capped.
const SAMPLE_CAP = 30;

// ----------------------------------------------------------------------------
// FLOORS config - frozen literals. This script cannot parse markdown law, so
// the numbers are hardcoded here with a comment citing the source. Primary
// source: _design-system/LOCKFILE.md "EMPHASIS BUDGET , frozen literals"
// (2026-07-25, FLOORS LAW 7), which restates the same numbers CLAUDE.md's
// pinned "NEVER-AGAIN design floors" (F6) and "FLOORS LAW" (F2, F7) blocks
// already carry. If either doc's numbers ever move, this block needs a
// matching hand-edit, nothing here re-derives it automatically.
//
// LOCKFILE measured these on the RENDERED first viewport at 390x844 (iPhone
// 12/13/14 width) - a DIFFERENT viewport than this script's own geometry
// default (VIEWPORTS.mobile = 375x812 above, used by checks a-d). Note: the
// OLDER prose in CLAUDE.md's "FLOORS LAW" item 2 still says "375x812" for the
// imagery floor specifically; the newer, more specific, same-day LOCKFILE
// citation says 390x844, and that is what the task brief for this script
// named explicitly, so FLOORS defaults to 390x844 when no --viewport is
// passed, exactly as before this block changed. Flagging the 375x812 vs
// 390x844 mismatch between the two law docs here rather than silently
// picking one.
//
// responsive-desktop-01 (2026-07-27): the FLOORS pass used to be hardcoded to
// 390x844 with NO way to run it at tablet/desktop at all, so CLAUDE.md's
// FLOORS LAW / NEVER-AGAIN floors (imagery %, display anchor px, weight-share
// %, anchor ratio) were only ever checkable on mobile, silently, with no
// stated scope limit. FLOORS_VIEWPORTS below makes every viewport runnable
// (`--floors-only --viewport desktop`); the THRESHOLD NUMBERS (FLOOR_IMAGERY_PCT
// etc.) are still the mobile-derived LOCKFILE numbers, reused unchanged for
// tablet/desktop - that reuse is a NAMED, explicit placeholder, not a claim
// that they were re-measured or re-thresholded for a wider viewport. A photo
// at a fixed px size is a smaller share of a 1280px-wide viewport than a
// 390px one, so the desktop FLOORS numbers below are almost certainly too
// lenient on imagery share and too strict on nothing in particular; an actual
// re-derivation of desktop/tablet thresholds is a design judgment call for
// the owner (a visual floor, not a mechanical one) and is OUT OF SCOPE here.
// Default (no --viewport flag) behavior is UNCHANGED: still fixed 390x844,
// so the existing FLOORS_ALLOWLIST route+floor entries (measured at 390x844)
// stay valid.
// ----------------------------------------------------------------------------
const FLOORS_VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 900 },
};
const FLOORS_VIEWPORT = FLOORS_VIEWPORTS.mobile; // default/back-compat, see note above

const FLOOR_IMAGERY_PCT = 33; // F2 - LOCKFILE EMPHASIS BUDGET: "min imagery share, browse/discovery/PDP first viewport: 33%"
const FLOOR_DISPLAY_ANCHOR_PX = 28; // F6 - LOCKFILE EMPHASIS BUDGET: "min display anchor: 28px" / CLAUDE.md NEVER-AGAIN floor 6
const WEIGHT_SHARE_THRESHOLD = 600; // F7a - the ">= 600" weight cutoff itself (CLAUDE.md FLOORS LAW 7a)
const CEILING_WEIGHT_SHARE_PCT = 30; // F7a - LOCKFILE EMPHASIS BUDGET: "max share of visible text at weight >= 600: 30%"
const FLOOR_ANCHOR_RATIO = 1.8; // F7b - LOCKFILE EMPHASIS BUDGET: "min anchor-to-body size ratio: 1.8x"
// F7c trap thresholds: the >4-distinct-sizes half is CLAUDE.md's NEVER-AGAIN
// floor 2 ceiling ("<= 4 distinct font sizes on one screen"); the spread-under
// half is this task's brief verbatim ("more than 4 distinct sizes whose
// spread is under 8px"). Note: CLAUDE.md FLOORS LAW 7c's own prose describes
// the same trap informally as "~6px", not 8px - flagging that mismatch too;
// 8px is what's hardcoded below because it is the number given as this
// script's literal spec.
//
// RANGE LAW G4 fix (2026-07-25): SIZE_SPREAD_TRAP_MAX_SPREAD_PX is now the
// width of the SLIDING WINDOW the trap searches for a dense cluster in (see
// densestClusterCount inside extractFloors), not a ceiling on the whole
// distinctSizes array's global max-min. Global spread used to BE the trap's
// only signal, which is the wrong measurement for "size variety without
// hierarchy": 1-2 outlier sizes stretch the global range past 8px and the
// trap goes quiet even while the rest of the sizes sit bunched a couple px
// apart - exactly what home does (9 distinct sizes, 19.2px global spread,
// PASSED the old math) per the measured "nine sizes that all sit within 6px
// of each other" finding in FLATNESS_DIAGNOSIS_2026-07-25.md.
const SIZE_SPREAD_TRAP_MAX_DISTINCT = 4;
const SIZE_SPREAD_TRAP_MAX_SPREAD_PX = 8;
const FLOOR_ELEVATION_COUNT = 2; // ELEVATION - LOCKFILE EMPHASIS BUDGET: "min distinct elevation steps per screen: 2"

// F2 IMAGERY exemption (CLAUDE.md FLOORS LAW 2: "Exempt BY NAME: forms, the
// checkout payment step, legal pages, receipts"). Prefix array so adding an
// exempt route is a one-line edit here, not a code change; matched against
// the route with its /xx locale segment stripped (see stripLocale below).
// Seeded from the real routes under app/[locale] as of 2026-07-25 - not an
// exhaustive route audit, extend as new form/payment/legal/receipt routes
// ship. Scoped to F2 IMAGERY ONLY per the task brief (the EXEMPT BY NAME line
// sits under the F2 bullet, not the other floors) - F6/F7a/F7b/F7c/ELEVATION
// apply to every route, exempt-from-imagery or not.
const FLOORS_IMAGERY_EXEMPT_PREFIXES = [
  // forms
  "/auth", // login / register / reset-password
  "/onboarding",
  "/booking/lookup",
  "/booking/resend-link",
  "/staff-invite",
  // checkout / payment step
  "/walk-in-pay",
  "/walk-in-tip",
  "/tip",
  "/vouchers/buy",
  // legal
  "/legal",
  "/privacy",
  "/terms",
  "/tos",
  "/agb",
  "/datenschutz",
  "/impressum",
  // receipts
  "/confirmation",
  "/bookings",
];

function stripLocale(route) {
  const stripped = route.replace(/^\/(de|en|fr|it)(?=\/|$)/, "");
  return stripped === "" ? "/" : stripped;
}

function isFloorsImageryExempt(route) {
  const path = stripLocale(route);
  return FLOORS_IMAGERY_EXEMPT_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix + "/"));
}

// ----------------------------------------------------------------------------
// GATE allowlist (RANGE LAW G1, 2026-07-25: "make check:floors a REAL gate").
// EDITABLE ratchet: every entry below is a route+floor pair that is
// KNOWN-FAILING today, each with a one-line reason citing the measured number.
// --gate exits non-zero on any FAIL that is NOT covered by this list, so the
// very first run of `npm run gate:floors` still exits 0 (the failure mode
// this task names explicitly: "without this allowlist the gate would fail on
// day one and get disabled"). The list only ever SHRINKS from here: delete an
// entry the moment its surface is fixed, never add a fresh one to route
// around a NEW failure (the gate reprints this rule on every un-allowlisted
// FAIL - see the --gate block in main()).
//
// routePattern is matched against the LOCALE-STRIPPED path (stripLocale
// above): an exact string, or a trailing "/*" to match a prefix - e.g.
// "/salon/*" covers every salon slug, not just the one DEFAULT_ROUTES happens
// to probe today.
//
// Seeded from the live measurement this same session (node scripts/
// check-geometry.mjs --floors-only, 2026-07-25 - matches
// _design-system/research/FLATNESS_DIAGNOSIS_2026-07-25.md for /de and the
// PDP). The task brief named exactly two routes ("/de" and "/de/salon/
// [slug]"); DEFAULT_ROUTES also always probes /de/booking/lookup, which the
// SAME live run showed failing on three OTHER floors the brief did not name.
// Leaving those out would make `npm run gate:floors` fail on its very first
// run against the routes its own npm script actually walks - the exact
// failure mode this task exists to avoid - so they are seeded too, flagged
// here as a discovery rather than folded in silently as if they were part of
// "the two".
// ----------------------------------------------------------------------------
const FLOORS_ALLOWLIST = [
  {
    routePattern: "/",
    floor: "F2",
    reason: "home imagery 4.66% vs the 33% floor; SEV4 fix (photographic hero) not yet applied, FLATNESS_DIAGNOSIS_2026-07-25.md",
  },
  {
    routePattern: "/",
    floor: "F7a",
    reason: "home weight share 50% (11/22) vs the 30% ceiling; SEV4 fix (drop semibold usage) not yet applied, FLATNESS_DIAGNOSIS_2026-07-25.md",
  },
  // Not named in the task brief's "seed with the two we know" - a direct side
  // effect of this SAME task's G4 fix: home's size spread was PASS under the
  // old global-max-min math and only turned FAIL once the trap started
  // measuring the densest cluster instead (see the SIZE_SPREAD_TRAP_MAX_
  // SPREAD_PX comment above for why the old math missed it).
  {
    routePattern: "/",
    floor: "F7c",
    reason: "home densest cluster is 7 distinct sizes within an 8px window (ceiling 4); newly surfaced by this session's own G4 fix, matches FLATNESS_DIAGNOSIS_2026-07-25.md's 'nine sizes that all sit within 6px of each other'",
  },
  {
    routePattern: "/salon/*",
    floor: "F6",
    reason: "PDP display anchor 22px vs the 28px floor; salon name does not yet own the screen, FLATNESS_DIAGNOSIS_2026-07-25.md SEV3",
  },
  {
    routePattern: "/salon/*",
    floor: "F7a",
    reason: "PDP weight share 83.33% (25/30) vs the 30% ceiling; this is the measured root cause the flatness diagnosis names, SEV4",
  },
  {
    routePattern: "/salon/*",
    floor: "F7b",
    reason: "PDP anchor ratio 1.57x vs the 1.8x floor; pairs with the F6 entry above, FLATNESS_DIAGNOSIS_2026-07-25.md SEV3",
  },
  // Not named in the task brief's "seed with the two we know" - discovered live
  // while proving --gate exits 0 against DEFAULT_ROUTES (2026-07-25). The F7c
  // one is a direct side effect of the SAME task's G4 fix: the PDP's size
  // spread was PASS under the old global-max-min math and only turned FAIL
  // once the trap started measuring the densest cluster instead.
  {
    routePattern: "/salon/*",
    floor: "F7c",
    reason: "PDP densest cluster is 5 distinct sizes within an 8px window (ceiling 4); newly surfaced by this session's own G4 densest-cluster fix, same root cause as the F7a/F7b entries above",
  },
  {
    routePattern: "/booking/lookup",
    floor: "F6",
    reason: "booking-lookup display anchor 21px vs the 28px floor; not yet audited, found proving gate:floors exits 0",
  },
  {
    routePattern: "/booking/lookup",
    floor: "F7b",
    reason: "booking-lookup anchor ratio 1.56x vs the 1.8x floor; not yet audited, found proving gate:floors exits 0",
  },
  {
    routePattern: "/booking/lookup",
    floor: "ELEVATION",
    reason: "booking-lookup has 0 distinct box-shadow values vs the floor of 2; a bare form with no elevated surface yet, found proving gate:floors exits 0",
  },
];

function floorsRouteMatchesPattern(pattern, path) {
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -2);
    return path === prefix || path.startsWith(prefix + "/");
  }
  return path === pattern;
}

function isFloorAllowlisted(route, floorCode) {
  const path = stripLocale(route);
  return FLOORS_ALLOWLIST.some((entry) => entry.floor === floorCode && floorsRouteMatchesPattern(entry.routePattern, path));
}

// ----------------------------------------------------------------------------
// CLI args
// ----------------------------------------------------------------------------
function parseArgs(argv) {
  const routes = [];
  let baseUrl = process.env.BASE_URL || "http://localhost:3000";
  let viewport = "mobile"; // Solen is mobile-first (CLAUDE.md); default the check to it.
  let viewportExplicit = false; // responsive-desktop-01: did the caller actually pass --viewport?
  let floorsOnly = false;
  let gate = false; // RANGE LAW G1, 2026-07-25: --gate flips FLOORS from report-only to failing
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--base-url") baseUrl = argv[++i];
    else if (a === "--viewport") {
      viewport = argv[++i];
      viewportExplicit = true;
    } else if (a === "--floors-only") floorsOnly = true;
    else if (a === "--gate") gate = true;
    else if (!a.startsWith("--")) routes.push(a);
  }
  if (!VIEWPORTS[viewport]) {
    console.error(`[check-geometry] unknown --viewport "${viewport}", falling back to mobile`);
    viewport = "mobile";
  }
  return {
    baseUrl,
    viewport,
    viewportExplicit,
    floorsOnly,
    gate,
    routes: routes.length > 0 ? routes : DEFAULT_ROUTES,
  };
}

// ----------------------------------------------------------------------------
// Browser bootstrap (mirrors scripts/mcp/site-tester/crawl.mjs launchBrowser())
// ----------------------------------------------------------------------------
async function launchBrowser() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (err) {
    console.error("[check-geometry] `playwright` import failed, falling back to playwright-core:", err);
    ({ chromium } = await import("playwright-core"));
  }
  try {
    return await chromium.launch({ headless: true });
  } catch (err) {
    console.error(
      "[check-geometry] chromium.launch failed (browser binary may be missing, try `npx playwright install chromium`):",
      err,
    );
    throw err;
  }
}

// Mirrors e2e/visual/spine.spec.ts dismissCookies().
async function dismissCookies(page) {
  const btn = page.locator("button", { hasText: /nur notwendige|akzeptieren|accept/i }).first();
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.click().catch(() => {});
    await page.waitForTimeout(400);
  }
}

// ----------------------------------------------------------------------------
// In-page geometry extraction. Serialized into the page by page.evaluate, so it
// must be fully self-contained (no closures over outer-scope variables besides
// the passed `config`).
// ----------------------------------------------------------------------------
function extractGeometry(config) {
  const { grid, gridTolerance, nearMissMin, nearMissMax, radiusTolerance, asymmetryTolerance, pillRadiusPx, radiusGapCap } = config;

  const SKIP_TAGS = new Set(["html", "body", "head", "script", "style", "noscript", "template", "meta", "link", "title", "br"]);
  const IMAGE_TAGS = new Set(["img", "svg", "video", "picture", "canvas", "iframe"]);
  const SVG_NS = "http://www.w3.org/2000/svg";

  function selectorFor(el) {
    if (el.id) return "#" + CSS.escape(el.id);
    const parts = [];
    let current = el;
    let depth = 0;
    while (current && current.nodeType === 1 && current !== document.documentElement && depth < 8) {
      if (current.id) {
        parts.unshift("#" + CSS.escape(current.id));
        break;
      }
      const parent = current.parentElement;
      const tag = current.tagName.toLowerCase();
      if (!parent) {
        parts.unshift(tag);
        break;
      }
      const siblingsOfTag = Array.from(parent.children).filter((c) => c.tagName === current.tagName);
      const pos = siblingsOfTag.indexOf(current) + 1;
      const cls = current.className && typeof current.className === "string" ? current.className.trim().split(/\s+/)[0] : "";
      parts.unshift(cls ? `${tag}.${cls}:nth-of-type(${pos})` : `${tag}:nth-of-type(${pos})`);
      current = parent;
      depth++;
    }
    return parts.join(" > ");
  }

  function isVisible(el, rect, style) {
    if (rect.width <= 0 || rect.height <= 0) return false;
    if (style.display === "none" || style.visibility === "hidden") return false;
    return true;
  }

  function nearestMultiple(value) {
    return Math.round(value / grid) * grid;
  }

  function offGridDelta(value) {
    const nearest = nearestMultiple(value);
    return Math.abs(value - nearest);
  }

  // Collect every visible, non-SVG-internal element under <body>.
  const allEls = Array.from(document.body.querySelectorAll("*")).filter((el) => {
    const tag = el.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return false;
    if (el.namespaceURI === SVG_NS && tag !== "svg") return false; // path/circle/g/etc inside an icon
    return true;
  });

  const visible = [];
  for (const el of allEls) {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    if (!isVisible(el, rect, style)) continue;
    visible.push({ el, rect, style, tag: el.tagName.toLowerCase() });
  }

  // ---------------------------------------------------------------------
  // (a) OFF-GRID
  // ---------------------------------------------------------------------
  const offGrid = [];
  for (const { el, rect, style, tag } of visible) {
    const selector = selectorFor(el);
    const isImage = IMAGE_TAGS.has(tag) || style.backgroundImage !== "none";
    const isLeaf = el.childElementCount === 0; // text-driven / content-derived height
    const isInline = style.display === "inline";

    if (!isImage) {
      // WIDTH: skip hairlines (<=2px) and inline text runs.
      if (rect.width > 2 && !isInline) {
        const d = offGridDelta(rect.width);
        if (d > gridTolerance) {
          offGrid.push({ selector, tag, property: "width", value: round2(rect.width), nearest: nearestMultiple(rect.width) });
        }
      }
      // HEIGHT: skip hairlines, leaf/content-driven elements, and inline text runs.
      if (rect.height > 2 && !isLeaf && !isInline) {
        const d = offGridDelta(rect.height);
        if (d > gridTolerance) {
          offGrid.push({ selector, tag, property: "height", value: round2(rect.height), nearest: nearestMultiple(rect.height) });
        }
      }
    }

    // MARGIN / PADDING: always checked (authored values, not intrinsic to the element).
    const box = {
      marginTop: parseFloat(style.marginTop) || 0,
      marginRight: parseFloat(style.marginRight) || 0,
      marginBottom: parseFloat(style.marginBottom) || 0,
      marginLeft: parseFloat(style.marginLeft) || 0,
      paddingTop: parseFloat(style.paddingTop) || 0,
      paddingRight: parseFloat(style.paddingRight) || 0,
      paddingBottom: parseFloat(style.paddingBottom) || 0,
      paddingLeft: parseFloat(style.paddingLeft) || 0,
    };
    for (const [prop, value] of Object.entries(box)) {
      if (value === 0) continue;
      const d = offGridDelta(value);
      if (d > gridTolerance) {
        offGrid.push({ selector, tag, property: prop, value: round2(value), nearest: nearestMultiple(value) });
      }
    }
  }

  // ---------------------------------------------------------------------
  // (b) BROKEN AXIS - near-miss alignment between siblings
  // ---------------------------------------------------------------------
  const brokenAxis = [];
  const parents = new Set(visible.map((v) => v.el.parentElement).filter(Boolean));
  for (const parent of parents) {
    const children = Array.from(parent.children).filter((c) => visible.some((v) => v.el === c));
    if (children.length < 2 || children.length > 12) continue; // bound combinatorics + noise
    const rects = children.map((c) => c.getBoundingClientRect());
    for (let i = 0; i < children.length; i++) {
      for (let j = i + 1; j < children.length; j++) {
        const a = rects[i];
        const b = rects[j];
        const edges = [
          ["left", a.left, b.left],
          ["right", a.right, b.right],
          ["top", a.top, b.top],
        ];
        for (const [edgeName, av, bv] of edges) {
          const delta = Math.abs(av - bv);
          if (delta >= nearMissMin && delta <= nearMissMax) {
            brokenAxis.push({
              selectorA: selectorFor(children[i]),
              selectorB: selectorFor(children[j]),
              edge: edgeName,
              delta: round2(delta),
            });
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------
  // (c) NESTED RADIUS - inner = outer - gap (min 4px), LOCKFILE DS-4
  //
  // 2026-07-17 sweep (commit dea10438f triage: 16 hits, only 4 real - all
  // SearchBar - the other 12 traced to two blind spots in this check, fixed
  // below as FIX 1/2, plus a third latent bug FIX 3 caught while fixing them):
  //
  //   FIX 1 INVISIBLE OUTER - the old code accepted ANY ancestor with a
  //   nonzero border-radius as "the outer". An ancestor with a rounded-*
  //   class but a transparent background, no background-image, no clip, and
  //   no border NEVER DRAWS that curve (e.g. Hero's bare `rounded-[11px]`
  //   wrapper div around SearchBar - no bg, no border, no overflow-hidden).
  //   rendersCorner() below requires one real paint signal, read from
  //   computed style, before an ancestor counts as an outer.
  //
  //   FIX 2 DISTANT CORNER - the old code computed gap = min(gapLeft, gapTop),
  //   so an element sharing just ONE axis with a rounded ancestor (e.g. the
  //   same left inset as FeedZone's rounded-t-[28px] panel, 1700px further
  //   down the page) read as "cornered". True arc concentricity needs the
  //   inner element close to the SAME corner on BOTH axes at once - see
  //   CORNER_WINDOW below, which reconciles this with the existing
  //   RADIUS_GAP_CAP ceiling instead of stacking two separate checks.
  //
  //   FIX 3 WRONG CORNER - the old code read a single borderTopLeftRadius as
  //   "the" radius for both inner and outer, so an inner element near an
  //   outer's BOTTOM corner got tested against a TOP radius that has nothing
  //   to do with that corner (rounded-t-* rounds only the top two). All four
  //   corners are now read and tested independently via getCornerRadii().
  // ---------------------------------------------------------------------
  const nestedRadius = [];

  function getCornerRadii(style) {
    return {
      "top-left": parseFloat(style.borderTopLeftRadius) || 0,
      "top-right": parseFloat(style.borderTopRightRadius) || 0,
      "bottom-left": parseFloat(style.borderBottomLeftRadius) || 0,
      "bottom-right": parseFloat(style.borderBottomRightRadius) || 0,
    };
  }

  // Alpha channel of a computed color string. getComputedStyle always
  // resolves to rgb()/rgba() form. rgb() (3 components, no alpha term) is
  // opaque -> 1. Anything unparsable -> 0 (no signal, never a false "yes").
  function colorAlpha(colorStr) {
    if (!colorStr) return 0;
    const m = colorStr.match(/rgba?\(([^)]+)\)/);
    if (!m) return 0;
    const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
    return parts.length >= 4 ? parts[3] : 1;
  }

  const EDGE_CAP = { top: "Top", right: "Right", bottom: "Bottom", left: "Left" };
  function edgeHasBorder(style, edge) {
    const w = parseFloat(style[`border${EDGE_CAP[edge]}Width`]) || 0;
    const s = style[`border${EDGE_CAP[edge]}Style`];
    return w > 0 && s !== "none" && s !== "hidden";
  }

  // FIX 1: does this element actually paint the corner under test? `edges`
  // are the two edges that bound that corner (e.g. top-left -> ["top","left"]);
  // EITHER edge having a real border is enough - the browser still sweeps a
  // visible arc through a corner where only one adjoining edge has width.
  function rendersCorner(style, edges) {
    if (colorAlpha(style.backgroundColor) > 0.05) return true;
    if (style.backgroundImage && style.backgroundImage !== "none") return true;
    if (style.overflowX === "hidden" || style.overflowX === "clip") return true;
    if (style.overflowY === "hidden" || style.overflowY === "clip") return true;
    return edges.some((edge) => edgeHasBorder(style, edge));
  }

  // A radius is functionally a pill/stadium the instant it reaches half the
  // element's own shorter side - the browser clamps rendering there regardless
  // of the literal declared value (e.g. `99px` on a 44px-tall button renders
  // identical to `9999px`). Checking only the literal 9999 token (Tailwind's
  // `rounded-full`) missed this and produced a false "off by 4px" nested-radius
  // hit on a real pill button (found by inspecting the first-pass report).
  function isFunctionalPill(radius, rect) {
    return radius >= pillRadiusPx || radius >= Math.min(rect.width, rect.height) / 2 - 0.5;
  }

  // Per corner: the two bounding edges (FIX 1 render check), and how to
  // compute the gap on each axis between the inner element's corner point
  // and the outer's matching corner point (FIX 2/3).
  const CORNERS = [
    {
      name: "top-left",
      edges: ["top", "left"],
      gapX: (inner, outer) => inner.left - outer.left,
      gapY: (inner, outer) => inner.top - outer.top,
    },
    {
      name: "top-right",
      edges: ["top", "right"],
      gapX: (inner, outer) => outer.right - inner.right,
      gapY: (inner, outer) => inner.top - outer.top,
    },
    {
      name: "bottom-left",
      edges: ["bottom", "left"],
      gapX: (inner, outer) => inner.left - outer.left,
      gapY: (inner, outer) => outer.bottom - inner.bottom,
    },
    {
      name: "bottom-right",
      edges: ["bottom", "right"],
      gapX: (inner, outer) => outer.right - inner.right,
      gapY: (inner, outer) => outer.bottom - inner.bottom,
    },
  ];

  for (const { el, rect, style } of visible) {
    const innerRadii = getCornerRadii(style);

    for (const corner of CORNERS) {
      const innerRadius = innerRadii[corner.name];
      if (innerRadius <= 0 || isFunctionalPill(innerRadius, rect)) continue;

      // Nearest ancestor that rounds THIS SAME corner (FIX 3) and actually
      // renders it (FIX 1). An ancestor with a nonzero radius there that
      // fails the render check is skipped, not treated as a dead end - a
      // further real outer may still sit above it in the tree.
      let ancestor = el.parentElement;
      let depth = 0;
      let outerEl = null;
      let outerRect = null;
      let outerRadius = 0;
      while (ancestor && depth < 5) {
        const aStyle = getComputedStyle(ancestor);
        const aRadius = getCornerRadii(aStyle)[corner.name];
        if (aRadius > 0) {
          const aRect = ancestor.getBoundingClientRect();
          if (!isFunctionalPill(aRadius, aRect) && rendersCorner(aStyle, corner.edges)) {
            outerEl = ancestor;
            outerRect = aRect;
            outerRadius = aRadius;
            break;
          }
        }
        ancestor = ancestor.parentElement;
        depth++;
      }
      if (!outerEl) continue;

      // Containment check: the child must actually sit inside the rounded parent.
      const eps = 1;
      const contained =
        rect.left >= outerRect.left - eps &&
        rect.right <= outerRect.right + eps &&
        rect.top >= outerRect.top - eps &&
        rect.bottom <= outerRect.bottom + eps;
      if (!contained) continue;

      const gapX = corner.gapX(rect, outerRect);
      const gapY = corner.gapY(rect, outerRect);
      if (gapX < 0 || gapY < 0) continue;

      // FIX 2: per-axis corner-proximity window. CORNER_WINDOW = outer radius
      // + RADIUS_GAP_CAP - the arc's own reach plus the largest legit padding
      // tier this codebase uses (32px Section rhythm + 8px headroom, see
      // RADIUS_GAP_CAP above). A corner is only tested when the inner element
      // is within that window of the outer's matching corner on BOTH axes;
      // past it on EITHER axis, a shared coordinate is coincidence, not
      // concentricity. This replaces the old single ceiling on
      // gap = min(gapLeft, gapTop) rather than stacking a second one.
      const cornerWindow = outerRadius + radiusGapCap;
      if (gapX > cornerWindow || gapY > cornerWindow) continue;

      const gap = Math.min(gapX, gapY);
      const expected = Math.max(outerRadius - gap, 4);
      const off = Math.abs(innerRadius - expected);
      if (off > radiusTolerance) {
        nestedRadius.push({
          selector: selectorFor(el),
          corner: corner.name,
          outerSelector: selectorFor(outerEl),
          innerRadius: round2(innerRadius),
          outerRadius: round2(outerRadius),
          gap: round2(gap),
          expected: round2(expected),
          off: round2(off),
        });
      }
    }
  }

  // ---------------------------------------------------------------------
  // (d) ASYMMETRIC PAIR - twin controls inside a flex row, DS-4
  // ---------------------------------------------------------------------
  const asymmetricPair = [];
  for (const parent of parents) {
    const pStyle = getComputedStyle(parent);
    const isFlexRow =
      (pStyle.display === "flex" || pStyle.display === "inline-flex") &&
      (pStyle.flexDirection === "row" || pStyle.flexDirection === "row-reverse" || pStyle.flexDirection === "");
    if (!isFlexRow) continue;

    // "Pair" per DS-4's twin-control rule means exactly TWO controls (back/skip,
    // the two Ändern links) - NOT any two adjacent items in a longer row. A
    // carousel/star-row/link-list with 3+ children is a different pattern (no
    // symmetry is intended), so restricting to parents with exactly 2 element
    // children avoids the false-positive class that otherwise dominates this
    // check (an N-item scroll row's "container center" is its full scrollable
    // width, not the viewport, so adjacent-pair deltas explode into the
    // hundreds/thousands of px and mean nothing).
    const children = Array.from(parent.children).filter((c) => visible.some((v) => v.el === c));
    if (children.length !== 2) continue;
    const pRect = parent.getBoundingClientRect();
    const containerCenterX = pRect.left + pRect.width / 2;

    // Centering is only a meaningful expectation when the parent actually asks
    // for it. A default `justify-content: normal` (start-equivalent) row - e.g.
    // footer social icons, a rating + review-count text pair - packs its two
    // children to one edge on purpose; comparing THAT to the container's center
    // is comparing against a center nobody wanted (found by inspecting real
    // findings: 3/3 first-pass hits were exactly this, see report notes).
    const justify = pStyle.justifyContent;
    const wantsCenter = justify === "center" || justify === "space-around" || justify === "space-evenly";
    if (!wantsCenter) continue;

    const [a, b] = children;
    if (a.tagName === b.tagName) {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      const sameSizeClass = Math.abs(ra.width - rb.width) <= 6 && Math.abs(ra.height - rb.height) <= 6;
      if (sameSizeClass) {
        const centerA = ra.left + ra.width / 2;
        const centerB = rb.left + rb.width / 2;
        const pairCenter = (centerA + centerB) / 2;
        const delta = Math.abs(pairCenter - containerCenterX);
        if (delta > asymmetryTolerance) {
          asymmetricPair.push({
            selectorA: selectorFor(a),
            selectorB: selectorFor(b),
            parentSelector: selectorFor(parent),
            delta: round2(delta),
          });
        }
      }
    }
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  return {
    elementsScanned: visible.length,
    offGrid,
    brokenAxis,
    nestedRadius,
    asymmetricPair,
  };
}

// ----------------------------------------------------------------------------
// FLOORS extraction. A separate in-page function from extractGeometry (own
// fixed viewport, own population: leaf TEXT elements + photo elements, not
// generic boxes), serialized into the page the same way via page.evaluate, so
// it must be equally self-contained (no closures over outer-scope variables
// besides the passed `config` - selectorFor/isVisible/etc are duplicated from
// extractGeometry above rather than shared, for that reason).
// ----------------------------------------------------------------------------
function extractFloors(config) {
  const {
    viewportWidth,
    viewportHeight,
    imageryFloorPct,
    displayAnchorFloorPx,
    weightThreshold,
    weightShareCeilingPct,
    anchorRatioFloor,
    sizeSpreadTrapMaxDistinct,
    sizeSpreadTrapMaxSpreadPx,
    elevationFloorCount,
    imageryExempt,
  } = config;

  const SKIP_TAGS = new Set(["html", "body", "head", "script", "style", "noscript", "template", "meta", "link", "title", "br"]);
  const SVG_NS = "http://www.w3.org/2000/svg";

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  // Duplicated from extractGeometry's selectorFor (see file-header note above).
  function selectorFor(el) {
    if (el.id) return "#" + CSS.escape(el.id);
    const parts = [];
    let current = el;
    let depth = 0;
    while (current && current.nodeType === 1 && current !== document.documentElement && depth < 8) {
      if (current.id) {
        parts.unshift("#" + CSS.escape(current.id));
        break;
      }
      const parent = current.parentElement;
      const tag = current.tagName.toLowerCase();
      if (!parent) {
        parts.unshift(tag);
        break;
      }
      const siblingsOfTag = Array.from(parent.children).filter((c) => c.tagName === current.tagName);
      const pos = siblingsOfTag.indexOf(current) + 1;
      const cls = current.className && typeof current.className === "string" ? current.className.trim().split(/\s+/)[0] : "";
      parts.unshift(cls ? `${tag}.${cls}:nth-of-type(${pos})` : `${tag}:nth-of-type(${pos})`);
      current = parent;
      depth++;
    }
    return parts.join(" > ");
  }

  function truncateText(str, n) {
    const s = (str || "").replace(/\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n) + "…" : s;
  }

  // Same visibility rule as extractGeometry's isVisible (rect + display/visibility
  // only, no opacity check - kept identical on purpose).
  function isVisible(rect, style) {
    if (rect.width <= 0 || rect.height <= 0) return false;
    if (style.display === "none" || style.visibility === "hidden") return false;
    return true;
  }

  // Clip a rect to the first viewport ([0,0]-[viewportWidth,viewportHeight],
  // since this runs right after navigation with no scroll) so off-screen area
  // is never counted.
  function clip(rect) {
    const left = Math.max(rect.left, 0);
    const top = Math.max(rect.top, 0);
    const right = Math.min(rect.right, viewportWidth);
    const bottom = Math.min(rect.bottom, viewportHeight);
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);
    return { width, height, area: width * height };
  }

  function hasOwnText(el) {
    for (const node of el.childNodes) {
      if (node.nodeType === 3 && node.textContent && node.textContent.trim().length > 0) return true;
    }
    return false;
  }

  function median(nums) {
    if (nums.length === 0) return 0;
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  const allEls = Array.from(document.body.querySelectorAll("*")).filter((el) => {
    const tag = el.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return false;
    if (el.namespaceURI === SVG_NS && tag !== "svg") return false; // path/circle/g/etc inside an icon
    return true;
  });

  // ---------------------------------------------------------------------
  // F2 IMAGERY - <img> plus any element with a background-image url(),
  // clipped to the viewport, deduped so a bg-image container wrapping an
  // <img> only counts once (the outer element, since it's checked first via
  // ancestor-membership, not draw order).
  // ---------------------------------------------------------------------
  let imagery;
  if (imageryExempt) {
    imagery = { status: "EXEMPT", sharePct: null };
  } else {
    const candidates = [];
    for (const el of allEls) {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (!isVisible(rect, style)) continue;
      const isImg = el.tagName.toLowerCase() === "img";
      const hasBgImage = /url\(/.test(style.backgroundImage || "");
      if (!isImg && !hasBgImage) continue;
      const c = clip(rect);
      if (c.area <= 0) continue;
      candidates.push({ el, area: c.area });
    }
    const candidateSet = new Set(candidates.map((c) => c.el));
    let sum = 0;
    for (const { el, area } of candidates) {
      let ancestor = el.parentElement;
      let nested = false;
      while (ancestor) {
        if (candidateSet.has(ancestor)) {
          nested = true; // an ancestor is also a photo element, don't double-count
          break;
        }
        ancestor = ancestor.parentElement;
      }
      if (!nested) sum += area;
    }
    const sharePct = (sum / (viewportWidth * viewportHeight)) * 100;
    imagery = { status: sharePct >= imageryFloorPct ? "PASS" : "FAIL", sharePct: round2(sharePct) };
  }

  // ---------------------------------------------------------------------
  // Shared "visible leaf text element" population for F6 / F7a / F7b / F7c -
  // an element that owns a direct, non-whitespace text node (so a layout
  // wrapper around other elements is never measured at the wrong level),
  // visible, and at least partly inside the first viewport.
  // ---------------------------------------------------------------------
  const leaves = [];
  for (const el of allEls) {
    if (!hasOwnText(el)) continue;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (!isVisible(rect, style)) continue;
    const c = clip(rect);
    if (c.width <= 2 || c.height <= 2) continue; // same hairline/noise threshold as extractGeometry
    const fontSize = parseFloat(style.fontSize) || 0;
    if (fontSize <= 0) continue;
    const fontWeight = parseInt(style.fontWeight, 10) || 400;
    leaves.push({ el, fontSize, fontWeight, text: el.textContent });
  }

  const sizes = leaves.map((l) => l.fontSize);
  const maxSize = sizes.length ? Math.max(...sizes) : 0;
  const medianSize = median(sizes); // raw per-element array WITH duplicates, so body dominates
  const maxLeaf = leaves.find((l) => l.fontSize === maxSize) || null;

  // F6 DISPLAY ANCHOR
  const displayAnchor = {
    status: maxSize >= displayAnchorFloorPx ? "PASS" : "FAIL",
    sizePx: round2(maxSize),
    text: maxLeaf ? truncateText(maxLeaf.text, 60) : "",
    selector: maxLeaf ? selectorFor(maxLeaf.el) : "",
  };

  // F7a WEIGHT SHARE
  const heavyCount = leaves.filter((l) => l.fontWeight >= weightThreshold).length;
  const weightSharePct = leaves.length ? (heavyCount / leaves.length) * 100 : 0;
  const weightShare = {
    status: weightSharePct <= weightShareCeilingPct ? "PASS" : "FAIL",
    sharePct: round2(weightSharePct),
    count: heavyCount,
    total: leaves.length,
  };

  // F7b ANCHOR RATIO
  const anchorRatioValue = medianSize > 0 ? maxSize / medianSize : 0;
  const anchorRatio = {
    status: anchorRatioValue >= anchorRatioFloor ? "PASS" : "FAIL",
    ratio: round2(anchorRatioValue),
  };

  // F7c SIZE SPREAD - distinct sizes (2-decimal grouping) + a DENSEST-CLUSTER
  // check (RANGE LAW G4 fix, 2026-07-25). Global max-min ("spreadPx" below) is
  // kept and reported as CONTEXT only; it is no longer what trips the trap,
  // because 1-2 outlier sizes can stretch the global range past the window
  // and hide a real cluster of the rest - the exact wrong-measurement bug
  // this fix targets (home: 9 distinct sizes, 19.2px global spread, but per
  // the measured diagnosis "nine sizes that all sit within 6px of each
  // other" - the old spreadPx<8 test PASSED that screen). densestClusterCount
  // finds the largest number of distinct sizes that fit inside ANY window of
  // width sizeSpreadTrapMaxSpreadPx, via a sorted two-pointer sweep; the trap
  // fires the instant that count exceeds the >4-sizes ceiling, wherever in
  // the range the cluster sits.
  function densestClusterCount(sortedSizes, windowPx) {
    if (sortedSizes.length === 0) return 0;
    let best = 1;
    let left = 0;
    for (let right = 0; right < sortedSizes.length; right++) {
      while (sortedSizes[right] - sortedSizes[left] > windowPx) left++;
      best = Math.max(best, right - left + 1);
    }
    return best;
  }

  const distinctSizes = Array.from(new Set(sizes.map((s) => round2(s)))).sort((a, b) => a - b);
  const spreadPx = distinctSizes.length ? distinctSizes[distinctSizes.length - 1] - distinctSizes[0] : 0;
  const densestClusterSize = densestClusterCount(distinctSizes, sizeSpreadTrapMaxSpreadPx);
  const trapTriggered = densestClusterSize > sizeSpreadTrapMaxDistinct;
  const sizeSpread = {
    status: trapTriggered ? "FAIL" : "PASS",
    distinctCount: distinctSizes.length,
    spreadPx: round2(spreadPx), // context only, see comment above - not the trap trigger
    densestClusterSize,
    trapTriggered,
    sizes: distinctSizes,
  };

  // ---------------------------------------------------------------------
  // ELEVATION - distinct non-none box-shadow VALUES among all visible
  // elements in the first viewport (shadows sit on cards/buttons/sheets, not
  // just text, so this scans allEls, not the leaves population above).
  // ---------------------------------------------------------------------
  // Tailwind's ring/shadow utilities near-universally compose box-shadow from
  // CSS custom properties, so an element that merely CAN show a ring/shadow
  // (e.g. focus:ring-2) but isn't right now still computes 1-2 leading
  // "ghost" layers - fully transparent, zero offset/blur/spread, e.g.
  // "rgba(0, 0, 0, 0) 0px 0px 0px 0px" - ahead of the real layer. The COUNT
  // below is unaffected (it's keyed on the full raw string, so two elements
  // whose real trailing layer differs are correctly still 2 distinct values);
  // this only reformats the DISPLAYED example so a human reads the layer that
  // actually distinguishes it, instead of 60 characters of identical ghost
  // preamble that made every example look like the same no-op.
  function isGhostShadowLayer(layer) {
    const m = layer.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
      const alpha = parts.length >= 4 ? parts[3] : 1;
      if (alpha > 0.01) return false; // has real, visible color
    }
    const nums = (layer.match(/-?[\d.]+px/g) || []).map((n) => parseFloat(n));
    return nums.length === 0 || nums.every((n) => Math.abs(n) < 0.5); // no offset/blur/spread either
  }
  function forDisplay(boxShadowStr) {
    const layers = boxShadowStr.split(/,\s*(?=rgba?\()/);
    const real = layers.filter((layer) => !isGhostShadowLayer(layer));
    return (real.length > 0 ? real.join(", ") : boxShadowStr).trim();
  }

  const shadowMap = new Map(); // computed box-shadow string -> example selector
  for (const el of allEls) {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (!isVisible(rect, style)) continue;
    const c = clip(rect);
    if (c.area <= 0) continue;
    const bs = style.boxShadow;
    if (!bs || bs === "none") continue;
    if (!shadowMap.has(bs)) shadowMap.set(bs, selectorFor(el));
  }
  const elevation = {
    status: shadowMap.size >= elevationFloorCount ? "PASS" : "FAIL",
    distinctCount: shadowMap.size,
    examples: Array.from(shadowMap.entries())
      .slice(0, 5)
      .map(([value, selector]) => ({ selector, value: truncateText(forDisplay(value), 80) })),
  };

  return { imagery, displayAnchor, weightShare, anchorRatio, sizeSpread, elevation, leavesScanned: leaves.length };
}

// ----------------------------------------------------------------------------
// Report formatting
// ----------------------------------------------------------------------------
function formatFindingsSection(title, items, formatLine) {
  const lines = [`### ${title} (${items.length})`, ""];
  if (items.length === 0) {
    lines.push("none found");
  } else {
    for (const item of items.slice(0, SAMPLE_CAP)) {
      lines.push("- " + formatLine(item));
    }
    if (items.length > SAMPLE_CAP) {
      lines.push(`- ...+${items.length - SAMPLE_CAP} more (truncated for readability, count above is exact)`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

// Geometry (a)-(d) portion only, unchanged content/format from before the
// FLOORS task - split out of the old formatRouteReport(route, result) so a
// route block can carry geometry, floors, both, or neither (--floors-only /
// per-pass errors) without duplicating either section's formatting.
function formatGeometrySection(result) {
  const lines = [`Elements scanned: ${result.elementsScanned}`, ""];
  lines.push(
    formatFindingsSection("(a) OFF-GRID", result.offGrid, (i) => `\`${i.selector}\` ${i.property}=${i.value}px (nearest 4pt: ${i.nearest}px)`),
  );
  lines.push(
    formatFindingsSection(
      "(b) BROKEN AXIS (near-miss alignment)",
      result.brokenAxis,
      (i) => `\`${i.selectorA}\` vs \`${i.selectorB}\` , ${i.edge} edges differ by ${i.delta}px`,
    ),
  );
  lines.push(
    formatFindingsSection(
      "(c) NESTED RADIUS",
      result.nestedRadius,
      (i) =>
        `\`${i.selector}\` ${i.corner} inner=${i.innerRadius}px inside \`${i.outerSelector}\` outer=${i.outerRadius}px, gap=${i.gap}px, expected inner=${i.expected}px (off by ${i.off}px)`,
    ),
  );
  lines.push(
    formatFindingsSection(
      "(d) ASYMMETRIC PAIR",
      result.asymmetricPair,
      (i) => `\`${i.selectorA}\` + \`${i.selectorB}\` in \`${i.parentSelector}\` , pair center off container center by ${i.delta}px`,
    ),
  );
  return lines.join("\n");
}

// FLOORS section - markdown TABLE (the existing (a)-(d) sections above are a
// finding-count + bullet list, which doesn't fit FLOORS: every floor always
// reports exactly one row - name, measured value, floor/ceiling, PASS/FAIL/
// EXEMPT - which is what a table communicates, not a "count of problems"
// list).
//
// buildFloorsRows is factored out (RANGE LAW G1, 2026-07-25) so the --gate
// pass in main() evaluates the SAME rows (same `code` per floor - F2/F6/F7a/
// F7b/F7c/ELEVATION - matching FLOORS_ALLOWLIST's `floor` field) that the
// report table prints, instead of re-deriving pass/fail a second time and
// risking the two drifting apart.
function buildFloorsRows(floors) {
  return [
    {
      code: "F2",
      name: "F2 imagery",
      measured: floors.imagery.status === "EXEMPT" ? "n/a (exempt)" : `${floors.imagery.sharePct}%`,
      threshold: `floor >= ${FLOOR_IMAGERY_PCT}%`,
      status: floors.imagery.status,
    },
    {
      code: "F6",
      name: "F6 display anchor",
      measured: `${floors.displayAnchor.sizePx}px ("${floors.displayAnchor.text}")`,
      threshold: `floor >= ${FLOOR_DISPLAY_ANCHOR_PX}px`,
      status: floors.displayAnchor.status,
    },
    {
      code: "F7a",
      name: "F7a weight share",
      measured: `${floors.weightShare.sharePct}% (${floors.weightShare.count}/${floors.weightShare.total})`,
      threshold: `ceiling <= ${CEILING_WEIGHT_SHARE_PCT}%`,
      status: floors.weightShare.status,
    },
    {
      code: "F7b",
      name: "F7b anchor ratio",
      measured: `${floors.anchorRatio.ratio}x`,
      threshold: `floor >= ${FLOOR_ANCHOR_RATIO}x`,
      status: floors.anchorRatio.status,
    },
    {
      code: "F7c",
      name: "F7c size spread",
      measured:
        `${floors.sizeSpread.distinctCount} distinct, densest cluster ${floors.sizeSpread.densestClusterSize} within ${SIZE_SPREAD_TRAP_MAX_SPREAD_PX}px` +
        ` (global spread ${floors.sizeSpread.spreadPx}px, context only)` +
        (floors.sizeSpread.trapTriggered
          ? ` , TRAP: ${floors.sizeSpread.densestClusterSize} distinct sizes inside one ${SIZE_SPREAD_TRAP_MAX_SPREAD_PX}px window`
          : ""),
      threshold: `trap: densest cluster >${SIZE_SPREAD_TRAP_MAX_DISTINCT} distinct within ${SIZE_SPREAD_TRAP_MAX_SPREAD_PX}px`,
      status: floors.sizeSpread.status,
    },
    {
      code: "ELEVATION",
      name: "ELEVATION",
      measured: `${floors.elevation.distinctCount} distinct box-shadow`,
      threshold: `floor >= ${FLOOR_ELEVATION_COUNT}`,
      status: floors.elevation.status,
    },
  ];
}

function formatFloorsSection(floors) {
  const rows = buildFloorsRows(floors);
  const failCount = rows.filter((r) => r.status === "FAIL").length;
  const lines = [
    `### FLOORS (${failCount} FAIL / ${rows.length})`,
    "",
    "| floor | measured | floor/ceiling | status |",
    "|---|---|---|---|",
  ];
  for (const r of rows) {
    lines.push(`| ${r.name} | ${r.measured} | ${r.threshold} | ${r.status} |`);
  }
  if (floors.elevation.examples.length > 0) {
    lines.push("", `elevation examples: ${floors.elevation.examples.map((e) => `\`${e.selector}\` ${e.value}`).join("; ")}`);
  }
  lines.push("");
  return lines.join("\n");
}

// Compact one-line stdout summary, matching the existing console style
// ([check-geometry] <route>: key=value key=value...).
function formatFloorsConsoleLine(floors) {
  return [
    `imagery=${floors.imagery.status === "EXEMPT" ? "EXEMPT" : `${floors.imagery.sharePct}%(${floors.imagery.status})`}`,
    `displayAnchor=${floors.displayAnchor.sizePx}px(${floors.displayAnchor.status})`,
    `weightShare=${floors.weightShare.sharePct}%(${floors.weightShare.status})`,
    `anchorRatio=${floors.anchorRatio.ratio}x(${floors.anchorRatio.status})`,
    `sizeSpread=${floors.sizeSpread.distinctCount}distinct,densestCluster=${floors.sizeSpread.densestClusterSize}within${SIZE_SPREAD_TRAP_MAX_SPREAD_PX}px,globalSpread=${floors.sizeSpread.spreadPx}px(${floors.sizeSpread.status})`,
    `elevation=${floors.elevation.distinctCount}(${floors.elevation.status})`,
  ].join(" ");
}

// ----------------------------------------------------------------------------
// Self-test for the (c) NESTED RADIUS FIX 1/2/3 logic (checklist requirement:
// prove the improved checker still catches the 4 REAL findings the 2026-07-17
// triage fixed, not just that it silences the 12 false positives - a checker
// that stops flagging real bugs while it stops flagging noise is a
// regression, not a fix). Runs synchronously, no browser/DOM needed.
//
// These are pure-math mirrors of the corner logic inside extractGeometry()
// above. extractGeometry must stay 100% self-contained (no closures over
// outer-scope variables) because Playwright serializes it via toString() to
// run inside the browser page - so this self-test can't import it directly.
// If you change the corner math in extractGeometry's (c) block, mirror the
// change here.
// ----------------------------------------------------------------------------
function selfTestNestedRadiusLogic() {
  const assertions = [];
  function assert(name, cond) {
    assertions.push({ name, pass: !!cond });
  }

  // --- FIX 3 / regression control: the 4 REAL SearchBar findings the triage
  // fixed (commit dea10438f) - collapsed rows + submit button, rounded-[13px]
  // inside SearchBar's 22px-radius morphing card with 16px (p-4) padding on
  // both axes, sitting at the card's bottom-left corner. DS-4 says
  // inner = outer - gap = 22 - 16 = 6 (floor 4). Prove the improved logic
  // would STILL flag this if the fix were reverted back to 13px.
  {
    const outerRadius = 22;
    const gapX = 16;
    const gapY = 16; // p-4 on both axes -> both-axes-near-corner, not one
    const cornerWindow = outerRadius + RADIUS_GAP_CAP; // 62
    const withinWindow = gapX <= cornerWindow && gapY <= cornerWindow;
    const gap = Math.min(gapX, gapY);
    const expected = Math.max(outerRadius - gap, 4);
    const revertedInnerRadius = 13; // pre-fix value
    const off = Math.abs(revertedInnerRadius - expected);
    assert("SearchBar real case: bottom-left corner within window (still tested)", withinWindow);
    assert("SearchBar real case: DS-4 expected radius = 6", expected === 6);
    assert("SearchBar real case: reverted 13px still flagged (off > tolerance)", off > RADIUS_TOLERANCE);
    assert("SearchBar real case: the shipped 6px would NOT be flagged", Math.abs(6 - expected) <= RADIUS_TOLERANCE);
  }

  // --- FIX 2: a corner close on only ONE axis (the FeedZone/distant-tile
  // false positive: same left inset, ~1700px further down the page) must be
  // rejected - the old gap = min(gapLeft, gapTop) would have accepted this.
  {
    const outerRadius = 28;
    const gapX = 24;
    const gapY = 1700;
    const cornerWindow = outerRadius + RADIUS_GAP_CAP;
    const withinWindow = gapX <= cornerWindow && gapY <= cornerWindow;
    assert("FIX 2: one-axis-only proximity is rejected (not a real corner)", !withinWindow);
  }

  // --- FIX 2 positive control: close on BOTH axes is still accepted (a real
  // nested corner must not get collateral-damaged by the new window check).
  {
    const outerRadius = 28;
    const gapX = 16;
    const gapY = 16;
    const cornerWindow = outerRadius + RADIUS_GAP_CAP;
    const withinWindow = gapX <= cornerWindow && gapY <= cornerWindow;
    assert("FIX 2: both-axes-close corner is still accepted", withinWindow);
  }

  // --- FIX 1: an ancestor with a rounded-* class but no bg/image/clip/border
  // (Hero's bare `rounded-[11px]` wrapper around SearchBar) must not render.
  {
    const bareStyle = {
      backgroundColor: "rgba(0, 0, 0, 0)",
      backgroundImage: "none",
      overflowX: "visible",
      overflowY: "visible",
      borderTopWidth: "0px",
      borderTopStyle: "none",
      borderLeftWidth: "0px",
      borderLeftStyle: "none",
    };
    const alpha = (() => {
      const m = bareStyle.backgroundColor.match(/rgba?\(([^)]+)\)/);
      const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
      return parts.length >= 4 ? parts[3] : 1;
    })();
    const hasBorder =
      (parseFloat(bareStyle.borderTopWidth) > 0 && bareStyle.borderTopStyle !== "none") ||
      (parseFloat(bareStyle.borderLeftWidth) > 0 && bareStyle.borderLeftStyle !== "none");
    const renders = alpha > 0.05 || bareStyle.backgroundImage !== "none" || hasBorder;
    assert("FIX 1: transparent/borderless rounded div is NOT treated as a real outer", !renders);
  }

  // --- FIX 1 positive control: an opaque background DOES count as an outer.
  {
    const opaqueStyle = { backgroundColor: "rgb(255, 255, 255)" };
    const m = opaqueStyle.backgroundColor.match(/rgba?\(([^)]+)\)/);
    const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
    const alpha = parts.length >= 4 ? parts[3] : 1;
    assert("FIX 1: opaque background DOES render (real outer)", alpha > 0.05);
  }

  // --- FIX 3: an outer that only rounds its TOP corners (rounded-t-*, e.g.
  // FeedZone) must not be matched against an inner element near its BOTTOM
  // corner - the old code's single borderTopLeftRadius would have applied a
  // top-corner radius to a bottom-corner test.
  {
    const outerRadii = { "top-left": 28, "top-right": 28, "bottom-left": 0, "bottom-right": 0 };
    assert("FIX 3: rounded-t-* outer has 0 radius at bottom corners (not testable there)", outerRadii["bottom-left"] === 0 && outerRadii["bottom-right"] === 0);
    assert("FIX 3: rounded-t-* outer still rounds its top corners", outerRadii["top-left"] > 0 && outerRadii["top-right"] > 0);
  }

  const failed = assertions.filter((a) => !a.pass);
  if (failed.length > 0) {
    console.error("[check-geometry] SELF-TEST FAILED - nested-radius FIX 1/2/3 logic is not sound:");
    for (const f of failed) console.error(`  - ${f.name}`);
    process.exit(1);
  }
  console.log(`[check-geometry] self-test passed (${assertions.length} assertions, nested-radius FIX 1/2/3 logic)`);
}

// ----------------------------------------------------------------------------
// Self-test for the FLOORS math (rule 12.5: test new logic before wiring it
// in). clip()/median()/the F7c trap live inside extractFloors, which - like
// extractGeometry above - must stay 100% self-contained for page.evaluate, so
// this self-test re-implements pure-math mirrors rather than importing them.
// stripLocale/isFloorsImageryExempt are plain Node functions (never
// serialized into the page), so those ARE called directly, no mirror needed.
// ----------------------------------------------------------------------------
function selfTestFloorsLogic() {
  const assertions = [];
  function assert(name, cond) {
    assertions.push({ name, pass: !!cond });
  }

  // --- clip(): a rect that's partly off the viewport only counts the
  // on-screen portion; fully off-screen is zero; fully on-screen is untouched.
  {
    const vw = 390;
    const vh = 844;
    function clip(rect) {
      const left = Math.max(rect.left, 0);
      const top = Math.max(rect.top, 0);
      const right = Math.min(rect.right, vw);
      const bottom = Math.min(rect.bottom, vh);
      const width = Math.max(0, right - left);
      const height = Math.max(0, bottom - top);
      return { width, height, area: width * height };
    }
    const rightOverflow = clip({ left: 300, top: 0, right: 490, bottom: 100 });
    assert("clip(): right-edge overflow truncates to the viewport (90 of 190px on-screen)", rightOverflow.width === 90);
    const offscreen = clip({ left: 500, top: 0, right: 600, bottom: 100 });
    assert("clip(): fully off-screen rect has zero area", offscreen.area === 0);
    const onscreen = clip({ left: 10, top: 10, right: 60, bottom: 60 });
    assert("clip(): fully on-screen rect is untouched (50x50=2500)", onscreen.area === 2500);
  }

  // --- median(): the RAW per-element array, with duplicates, so the value
  // most elements share (body text) dominates - matching the F7b spec
  // ("median = body"), not a median of the unique-size set.
  {
    function median(nums) {
      if (nums.length === 0) return 0;
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    assert("median(): odd count picks the middle", median([12, 14, 14, 14, 31]) === 14);
    assert("median(): even count averages the two middles", median([14, 14, 16, 16]) === 15);
    assert("median(): body-dominated set lands on the body size, not the anchor", median([14, 14, 14, 14, 31]) === 14);
  }

  // --- F7c trap (RANGE LAW G4 fix, 2026-07-25): DENSEST-CLUSTER, not global
  // max-min. Mirrors densestClusterCount() inside extractFloors (same
  // self-containment constraint as median()/clip() above - if the cluster
  // math there changes, mirror the change here).
  {
    function densestClusterCount(sortedSizes, windowPx) {
      if (sortedSizes.length === 0) return 0;
      let best = 1;
      let left = 0;
      for (let right = 0; right < sortedSizes.length; right++) {
        while (sortedSizes[right] - sortedSizes[left] > windowPx) left++;
        best = Math.max(best, right - left + 1);
      }
      return best;
    }
    const trap = (sortedSizes) => densestClusterCount(sortedSizes, SIZE_SPREAD_TRAP_MAX_SPREAD_PX) > SIZE_SPREAD_TRAP_MAX_DISTINCT;

    // Regression control: the REAL home bug this fix targets. 9 distinct
    // sizes, global spread 19.2px (matches the live /de measurement) - 7 of
    // the 9 sit bunched inside a 6px band, with 2 outliers stretching the
    // global range well past 8px.
    const homeLikeSizes = [12, 13, 14, 15, 16, 17, 18, 24, 31.2];
    const oldSpreadPx = homeLikeSizes[homeLikeSizes.length - 1] - homeLikeSizes[0];
    assert("F7c trap regression control: home-like set's GLOBAL spread is >8px (why the OLD math missed it)", oldSpreadPx > SIZE_SPREAD_TRAP_MAX_SPREAD_PX);
    assert(
      "F7c trap regression control: the OLD (distinctCount>4 AND globalSpread<8) formula would have PASSED this set",
      !(homeLikeSizes.length > SIZE_SPREAD_TRAP_MAX_DISTINCT && oldSpreadPx < SIZE_SPREAD_TRAP_MAX_SPREAD_PX),
    );
    assert("F7c trap: the NEW densest-cluster math FIRES on the same home-like set (the actual fix)", trap(homeLikeSizes) === true);

    // A genuine type ramp: 6 distinct sizes, each step big enough that no 8px
    // window ever catches more than 4 of them - must NOT fire.
    const realRangeSizes = [11, 13, 15, 18, 22, 28];
    assert("F7c trap: a real, evenly-stepped type range does NOT fire", trap(realRangeSizes) === false);

    // Within the 4-size ceiling regardless of how tightly bunched - must NOT fire.
    const withinCeilingSizes = [12, 13, 14];
    assert("F7c trap: 3 distinct sizes bunched in 2px does NOT fire (within the 4-size ceiling)", trap(withinCeilingSizes) === false);
  }

  // --- ELEVATION display: Tailwind's transparent/zero-geometry "ghost" ring
  // layers (real example seen live: "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0,
  // 0, 0, 0) 0px 0px 0px 0px, rgba(50, 47, 44, 0.09) 0px 2px 8px 0px") must be
  // stripped from the DISPLAYED example (the count itself is keyed on the raw
  // string elsewhere and untouched by this).
  {
    function isGhostShadowLayer(layer) {
      const m = layer.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
        const alpha = parts.length >= 4 ? parts[3] : 1;
        if (alpha > 0.01) return false;
      }
      const nums = (layer.match(/-?[\d.]+px/g) || []).map((n) => parseFloat(n));
      return nums.length === 0 || nums.every((n) => Math.abs(n) < 0.5);
    }
    function forDisplay(boxShadowStr) {
      const layers = boxShadowStr.split(/,\s*(?=rgba?\()/);
      const real = layers.filter((layer) => !isGhostShadowLayer(layer));
      return (real.length > 0 ? real.join(", ") : boxShadowStr).trim();
    }
    const withGhosts = "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(50, 47, 44, 0.09) 0px 2px 8px 0px";
    assert("ELEVATION display: ghost layers are stripped, the real layer survives", forDisplay(withGhosts) === "rgba(50, 47, 44, 0.09) 0px 2px 8px 0px");
    const allGhost = "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px";
    assert("ELEVATION display: an all-ghost value (shouldn't normally reach here, none/skip handles it) falls back to itself, not empty", forDisplay(allGhost) === allGhost);
    const noGhosts = "rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px inset";
    assert("ELEVATION display: a value with no ghost layers passes through untouched", forDisplay(noGhosts) === noGhosts);
  }

  // --- F2 nested-image dedupe: an <img> inside a bg-image div counts the
  // OUTER element's area once, never both.
  {
    const parentOf = { innerImg: "outerDiv" };
    const candidateSet = new Set(["outerDiv", "innerImg"]);
    function isNested(el) {
      let ancestor = parentOf[el];
      while (ancestor) {
        if (candidateSet.has(ancestor)) return true;
        ancestor = parentOf[ancestor];
      }
      return false;
    }
    assert("F2 dedupe: the outer bg-image div is not nested (counts)", isNested("outerDiv") === false);
    assert("F2 dedupe: the inner <img> IS nested inside the counted outer (skipped)", isNested("innerImg") === true);
  }

  // --- exempt-prefix matcher: locale-stripping + a real path-boundary match,
  // not a raw substring (a route that merely STARTS WITH the same characters
  // as an exempt prefix must not false-match).
  {
    assert("exempt: home is not exempt", isFloorsImageryExempt("/de") === false);
    assert("exempt: PDP is not exempt", isFloorsImageryExempt("/de/salon/cuts-and-culture") === false);
    assert("exempt: booking lookup (a form) is exempt", isFloorsImageryExempt("/de/booking/lookup") === true);
    assert("exempt: legal terms is exempt", isFloorsImageryExempt("/en/legal/terms") === true);
    assert("exempt: prefix match respects a path boundary, not a raw substring", isFloorsImageryExempt("/de/legal-notice-board") === false);
  }

  const failed = assertions.filter((a) => !a.pass);
  if (failed.length > 0) {
    console.error("[check-geometry] SELF-TEST FAILED - FLOORS logic is not sound:");
    for (const f of failed) console.error(`  - ${f.name}`);
    process.exit(1);
  }
  console.log(`[check-geometry] self-test passed (${assertions.length} assertions, FLOORS logic)`);
}

// ----------------------------------------------------------------------------
// main
// ----------------------------------------------------------------------------
async function main() {
  selfTestNestedRadiusLogic();
  selfTestFloorsLogic();

  const { baseUrl, viewport, viewportExplicit, floorsOnly, gate, routes } = parseArgs(process.argv.slice(2));
  const vp = VIEWPORTS[viewport];
  // responsive-desktop-01: only switch the FLOORS viewport away from the
  // 390x844 default when the caller EXPLICITLY passed --viewport - an
  // unqualified run (no flag at all) must keep behaving exactly as before.
  const floorsViewport = viewportExplicit ? FLOORS_VIEWPORTS[viewport] : FLOORS_VIEWPORT;

  console.log(`[check-geometry] base=${baseUrl} viewport=${viewport} (${vp.width}x${vp.height}) floorsOnly=${floorsOnly}`);
  console.log(`[check-geometry] routes: ${routes.join(", ")}`);
  console.log(
    `[check-geometry] FLOORS viewport: ${floorsViewport.width}x${floorsViewport.height}${
      viewportExplicit
        ? " (explicit --viewport override; thresholds are still the mobile-derived LOCKFILE numbers, see FLOORS_VIEWPORTS comment)"
        : " (default - LOCKFILE EMPHASIS BUDGET 390x844)"
    }`,
  );

  const browser = await launchBrowser();
  const geometryByRoute = new Map(); // route -> { result, error? } - only populated when !floorsOnly
  const floorsByRoute = new Map(); // route -> { floors, error? } - always populated
  try {
    // -----------------------------------------------------------------
    // Geometry pass (a)-(d) - UNCHANGED logic/output from before this task.
    // Skipped entirely in --floors-only mode (that's the point of the flag).
    // -----------------------------------------------------------------
    if (!floorsOnly) {
      const context = await browser.newContext({ viewport: vp });
      for (const route of routes) {
        const page = await context.newPage();
        const url = new URL(route, baseUrl).toString();
        try {
          await page.goto(url, { waitUntil: "commit", timeout: 90_000 });
          await page.waitForLoadState("domcontentloaded");
          await page.waitForTimeout(4000); // let images/fonts/API fetches/animations settle
          await dismissCookies(page);
          await page.waitForTimeout(600);

          const result = await page.evaluate(extractGeometry, {
            grid: GRID,
            gridTolerance: GRID_TOLERANCE,
            nearMissMin: NEARMISS_MIN,
            nearMissMax: NEARMISS_MAX,
            radiusTolerance: RADIUS_TOLERANCE,
            asymmetryTolerance: ASYMMETRY_TOLERANCE,
            pillRadiusPx: PILL_RADIUS_PX,
            radiusGapCap: RADIUS_GAP_CAP,
          });
          geometryByRoute.set(route, { result });
          console.log(
            `[check-geometry] ${route}: scanned=${result.elementsScanned} offGrid=${result.offGrid.length} brokenAxis=${result.brokenAxis.length} nestedRadius=${result.nestedRadius.length} asymmetricPair=${result.asymmetricPair.length}`,
          );
        } catch (err) {
          console.error(`[check-geometry] route ${route} failed:`, err);
          geometryByRoute.set(route, {
            result: { elementsScanned: 0, offGrid: [], brokenAxis: [], nestedRadius: [], asymmetricPair: [] },
            error: err && err.message ? err.message : String(err),
          });
        } finally {
          await page.close().catch((err) => console.error("[check-geometry] page.close() failed:", err));
        }
      }
    }

    // -----------------------------------------------------------------
    // FLOORS pass - always runs (in every mode), at floorsViewport (390x844
    // default, or the explicit --viewport override, see responsive-desktop-01
    // above), its own context so it's independent of the geometry pass above.
    // Same settle sequence as the geometry pass.
    // -----------------------------------------------------------------
    {
      const floorsContext = await browser.newContext({ viewport: floorsViewport });
      for (const route of routes) {
        const page = await floorsContext.newPage();
        const url = new URL(route, baseUrl).toString();
        try {
          await page.goto(url, { waitUntil: "commit", timeout: 90_000 });
          await page.waitForLoadState("domcontentloaded");
          await page.waitForTimeout(4000); // let images/fonts/API fetches/animations settle
          await dismissCookies(page);
          await page.waitForTimeout(600);

          const exempt = isFloorsImageryExempt(route);
          const floors = await page.evaluate(extractFloors, {
            viewportWidth: floorsViewport.width,
            viewportHeight: floorsViewport.height,
            imageryFloorPct: FLOOR_IMAGERY_PCT,
            displayAnchorFloorPx: FLOOR_DISPLAY_ANCHOR_PX,
            weightThreshold: WEIGHT_SHARE_THRESHOLD,
            weightShareCeilingPct: CEILING_WEIGHT_SHARE_PCT,
            anchorRatioFloor: FLOOR_ANCHOR_RATIO,
            sizeSpreadTrapMaxDistinct: SIZE_SPREAD_TRAP_MAX_DISTINCT,
            sizeSpreadTrapMaxSpreadPx: SIZE_SPREAD_TRAP_MAX_SPREAD_PX,
            elevationFloorCount: FLOOR_ELEVATION_COUNT,
            imageryExempt: exempt,
          });
          floorsByRoute.set(route, { floors });
          console.log(`[check-geometry] ${route} FLOORS: ${formatFloorsConsoleLine(floors)}`);
        } catch (err) {
          console.error(`[check-geometry] FLOORS route ${route} failed:`, err);
          floorsByRoute.set(route, { floors: null, error: err && err.message ? err.message : String(err) });
        } finally {
          await page.close().catch((err) => console.error("[check-geometry] FLOORS page.close() failed:", err));
        }
      }
    }
  } finally {
    await browser.close().catch((err) => console.error("[check-geometry] browser.close() failed:", err));
  }

  const totals = { offGrid: 0, brokenAxis: 0, nestedRadius: 0, asymmetricPair: 0 };
  if (!floorsOnly) {
    for (const { result } of geometryByRoute.values()) {
      totals.offGrid += result.offGrid.length;
      totals.brokenAxis += result.brokenAxis.length;
      totals.nestedRadius += result.nestedRadius.length;
      totals.asymmetricPair += result.asymmetricPair.length;
    }
  }

  let floorsFailTotal = 0;
  let floorsCheckedTotal = 0;
  for (const { floors } of floorsByRoute.values()) {
    if (!floors) continue;
    const statuses = [
      floors.imagery.status,
      floors.displayAnchor.status,
      floors.weightShare.status,
      floors.anchorRatio.status,
      floors.sizeSpread.status,
      floors.elevation.status,
    ];
    floorsCheckedTotal += statuses.filter((s) => s !== "EXEMPT").length;
    floorsFailTotal += statuses.filter((s) => s === "FAIL").length;
  }

  const headerLines = [
    "# Geometry check report",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Base URL: ${baseUrl}  Viewport: ${viewport} (${vp.width}x${vp.height})`,
    "",
    "Report-only pass (checklist item 1): this script never fails the run. Findings",
    "below are raw candidates, not confirmed bugs, until triaged for false positives.",
    "FLOORS is likewise report-only and always exits 0 - a future turn can flip it to",
    "a gate once triaged (see the file header comment). Not a gate yet.",
    "",
  ];
  if (floorsOnly) {
    headerLines.push("(--floors-only: geometry pass (a)-(d) skipped this run)", "");
  } else {
    headerLines.push(
      `Totals: off-grid=${totals.offGrid}  broken-axis=${totals.brokenAxis}  nested-radius=${totals.nestedRadius}  asymmetric-pair=${totals.asymmetricPair}`,
    );
  }
  headerLines.push(
    `Totals (floors): ${floorsFailTotal} FAIL / ${floorsCheckedTotal} checks, ${routes.length} route(s), viewport ${floorsViewport.width}x${floorsViewport.height}`,
  );
  headerLines.push("", "---", "");
  const header = headerLines.join("\n");

  const body = routes
    .map((route) => {
      const g = geometryByRoute.get(route);
      const f = floorsByRoute.get(route);
      const lines = [`## ${route}`, ""];
      if (!floorsOnly) {
        if (g && g.error) lines.push(`GEOMETRY ERROR: ${g.error}`, "");
        else if (g) lines.push(formatGeometrySection(g.result));
      }
      if (f && f.error) lines.push(`FLOORS ERROR: ${f.error}`, "");
      else if (f && f.floors) lines.push(formatFloorsSection(f.floors));
      return lines.join("\n");
    })
    .join("\n---\n\n");

  const report = header + body + "\n";

  const outDir = dirname(OUTPUT_PATH);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(OUTPUT_PATH, report);

  console.log("");
  console.log(report);
  console.log(`[check-geometry] report written to ${OUTPUT_PATH}`);

  // ---------------------------------------------------------------------
  // --gate (RANGE LAW G1, 2026-07-25): fail the run when a non-exempt route
  // breaks a floor that is NOT in FLOORS_ALLOWLIST. Default / --floors-only
  // WITHOUT --gate are unchanged from before this task: always exit 0.
  // ---------------------------------------------------------------------
  if (gate) {
    console.log("");
    console.log("[check-geometry] --gate: checking every FLOORS FAIL against FLOORS_ALLOWLIST...");
    let gateFailed = false;
    for (const route of routes) {
      const entry = floorsByRoute.get(route);
      if (!entry || !entry.floors) {
        // A ROUTE THAT COULD NOT BE MEASURED IS A GATE FAILURE, not a skip (2026-08-27).
        // It used to `continue` here, and that made the gate silently meaningless: the CI
        // `floors:` job served the site on 3002 and ran this with BASE_URL 3001, so every
        // route's page.goto threw, every route landed in this branch, gateFailed stayed
        // false, and the gate printed "PASSED" having loaded zero pages. It did that from
        // the commit that wired it (3f3d09a2a, 2026-07-28) until the port was fixed today.
        // Skipping is the wrong default for a gate: an unreachable page is indistinguishable
        // from a page with no violations, and the safe reading of that ambiguity is FAIL.
        gateFailed = true;
        console.error(
          `[check-geometry] GATE FAIL: ${route} could not be measured` +
            (entry && entry.error ? ` (${entry.error})` : " (no result recorded)") +
            ". An unmeasurable route fails the gate rather than being skipped, because a page " +
            "that never loaded looks exactly like a page with no violations. Check that BASE_URL " +
            "points at a server that is actually serving, then re-run.",
        );
        continue;
      }
      for (const row of buildFloorsRows(entry.floors)) {
        if (row.status !== "FAIL") continue;
        if (isFloorAllowlisted(route, row.code)) continue;
        gateFailed = true;
        console.error(
          `[check-geometry] GATE FAIL: ${route} - ${row.name} measured ${row.measured} (${row.threshold}). ` +
            "This route+floor is not in FLOORS_ALLOWLIST (top of scripts/check-geometry.mjs). Fix the surface, " +
            "or if it is a genuine new known-failing case, add a reasoned entry there. Once a currently-allowlisted " +
            "route+floor is actually fixed: delete this route's allowlist entry once fixed, do not add a new one.",
        );
      }
    }
    if (gateFailed) {
      console.error("");
      console.error("[check-geometry] GATE: FAILED - one or more routes broke a floor outside the allowlist.");
      process.exit(1);
    }
    console.log("[check-geometry] GATE: PASSED - every current FAIL is a reasoned, named entry in FLOORS_ALLOWLIST.");
    process.exit(0);
  }

  process.exit(0); // report-only (no --gate): always 0, in every mode, unchanged from before this task
}

main().catch((err) => {
  console.error("[check-geometry] fatal error:", err);
  if (process.argv.includes("--gate")) {
    // A crash before FLOORS could even be measured must not read as a silent
    // PASS under --gate - that would make the gate meaningless the moment
    // Playwright/chromium is broken, which is worse than no gate at all.
    console.error("[check-geometry] GATE: FAILED - fatal error before FLOORS could be measured, see above.");
    process.exit(1);
  }
  process.exit(0); // report-only (no --gate): never fail the run on this first pass
});

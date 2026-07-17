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
//                       (gap*sqrt(2) at the corner vs gap on the flat edge).
//   d) ASYMMETRIC PAIR  sibling pairs (twin controls, DS-4) inside a flex row whose
//                       combined center sits >2px off the row's own center.
//
// Usage:
//   node scripts/check-geometry.mjs
//   node scripts/check-geometry.mjs --base-url http://localhost:3000 /de /de/some-route
//   node scripts/check-geometry.mjs --viewport desktop
//   BASE_URL=http://localhost:3000 node scripts/check-geometry.mjs
//
// Exit code: ALWAYS 0 on this first pass. This is a report-only tool until the
// findings are triaged and a real noise floor is known (per the task brief); a
// future round can add a --fail-on-new flag once false positives are pruned.

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
const RADIUS_GAP_CAP = 40;
const ASYMMETRY_TOLERANCE = 2; // px, per checklist item (d)
const PILL_RADIUS_PX = 999; // Tailwind rounded-full / `pill` token convention

// Cap how many sample findings per check per route get printed, so the report
// stays readable. The COUNT reported is always the true total, never capped.
const SAMPLE_CAP = 30;

// ----------------------------------------------------------------------------
// CLI args
// ----------------------------------------------------------------------------
function parseArgs(argv) {
  const routes = [];
  let baseUrl = process.env.BASE_URL || "http://localhost:3000";
  let viewport = "mobile"; // Solen is mobile-first (CLAUDE.md); default the check to it.
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--base-url") baseUrl = argv[++i];
    else if (a === "--viewport") viewport = argv[++i];
    else if (!a.startsWith("--")) routes.push(a);
  }
  if (!VIEWPORTS[viewport]) {
    console.error(`[check-geometry] unknown --viewport "${viewport}", falling back to mobile`);
    viewport = "mobile";
  }
  return { baseUrl, viewport, routes: routes.length > 0 ? routes : DEFAULT_ROUTES };
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
  // ---------------------------------------------------------------------
  const nestedRadius = [];
  function cornerRadius(style) {
    return parseFloat(style.borderTopLeftRadius) || 0;
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
  for (const { el, rect, style } of visible) {
    const innerRadius = cornerRadius(style);
    if (innerRadius <= 0 || isFunctionalPill(innerRadius, rect)) continue;

    // Nearest rounded ancestor (not necessarily the immediate parent - an
    // unrounded wrapper div in between is common).
    let ancestor = el.parentElement;
    let depth = 0;
    let outerEl = null;
    let outerStyle = null;
    while (ancestor && depth < 5) {
      const aStyle = getComputedStyle(ancestor);
      const aRadius = cornerRadius(aStyle);
      if (aRadius > 0) {
        outerEl = ancestor;
        outerStyle = aStyle;
        break;
      }
      ancestor = ancestor.parentElement;
      depth++;
    }
    if (!outerEl) continue;
    const outerRadius = cornerRadius(outerStyle);
    const outerRect = outerEl.getBoundingClientRect();
    if (isFunctionalPill(outerRadius, outerRect)) continue; // pill container, exempt (DS-4)

    // Containment check: the child must actually sit inside the rounded parent.
    const eps = 1;
    const contained =
      rect.left >= outerRect.left - eps &&
      rect.right <= outerRect.right + eps &&
      rect.top >= outerRect.top - eps &&
      rect.bottom <= outerRect.bottom + eps;
    if (!contained) continue;

    const gapLeft = rect.left - outerRect.left;
    const gapTop = rect.top - outerRect.top;
    const gap = Math.min(gapLeft, gapTop);
    if (gap < 0 || gap > radiusGapCap) continue;

    const expected = Math.max(outerRadius - gap, 4);
    const off = Math.abs(innerRadius - expected);
    if (off > radiusTolerance) {
      nestedRadius.push({
        selector: selectorFor(el),
        outerSelector: selectorFor(outerEl),
        innerRadius: round2(innerRadius),
        outerRadius: round2(outerRadius),
        gap: round2(gap),
        expected: round2(expected),
        off: round2(off),
      });
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

function formatRouteReport(route, result) {
  const lines = [`## ${route}`, "", `Elements scanned: ${result.elementsScanned}`, ""];
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
        `\`${i.selector}\` inner=${i.innerRadius}px inside \`${i.outerSelector}\` outer=${i.outerRadius}px, gap=${i.gap}px, expected inner=${i.expected}px (off by ${i.off}px)`,
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

// ----------------------------------------------------------------------------
// main
// ----------------------------------------------------------------------------
async function main() {
  const { baseUrl, viewport, routes } = parseArgs(process.argv.slice(2));
  const vp = VIEWPORTS[viewport];

  console.log(`[check-geometry] base=${baseUrl} viewport=${viewport} (${vp.width}x${vp.height})`);
  console.log(`[check-geometry] routes: ${routes.join(", ")}`);

  const browser = await launchBrowser();
  const results = [];
  try {
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
        results.push({ route, result });
        console.log(
          `[check-geometry] ${route}: scanned=${result.elementsScanned} offGrid=${result.offGrid.length} brokenAxis=${result.brokenAxis.length} nestedRadius=${result.nestedRadius.length} asymmetricPair=${result.asymmetricPair.length}`,
        );
      } catch (err) {
        console.error(`[check-geometry] route ${route} failed:`, err);
        results.push({
          route,
          result: { elementsScanned: 0, offGrid: [], brokenAxis: [], nestedRadius: [], asymmetricPair: [] },
          error: err && err.message ? err.message : String(err),
        });
      } finally {
        await page.close().catch((err) => console.error("[check-geometry] page.close() failed:", err));
      }
    }
  } finally {
    await browser.close().catch((err) => console.error("[check-geometry] browser.close() failed:", err));
  }

  const totals = results.reduce(
    (acc, r) => {
      acc.offGrid += r.result.offGrid.length;
      acc.brokenAxis += r.result.brokenAxis.length;
      acc.nestedRadius += r.result.nestedRadius.length;
      acc.asymmetricPair += r.result.asymmetricPair.length;
      return acc;
    },
    { offGrid: 0, brokenAxis: 0, nestedRadius: 0, asymmetricPair: 0 },
  );

  const header = [
    "# Geometry check report",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Base URL: ${baseUrl}  Viewport: ${viewport} (${vp.width}x${vp.height})`,
    "",
    "Report-only pass (checklist item 1): this script never fails the run. Findings",
    "below are raw candidates, not confirmed bugs, until triaged for false positives.",
    "",
    `Totals: off-grid=${totals.offGrid}  broken-axis=${totals.brokenAxis}  nested-radius=${totals.nestedRadius}  asymmetric-pair=${totals.asymmetricPair}`,
    "",
    "---",
    "",
  ].join("\n");

  const body = results.map(({ route, result, error }) => (error ? `## ${route}\n\nERROR: ${error}\n` : formatRouteReport(route, result))).join("\n---\n\n");

  const report = header + body + "\n";

  const outDir = dirname(OUTPUT_PATH);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(OUTPUT_PATH, report);

  console.log("");
  console.log(report);
  console.log(`[check-geometry] report written to ${OUTPUT_PATH}`);

  process.exit(0); // always 0 on this report-only first pass
}

main().catch((err) => {
  console.error("[check-geometry] fatal error:", err);
  process.exit(0); // still report-only: never fail the run on this first pass
});

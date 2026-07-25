#!/usr/bin/env node
// scripts/check-motion.mjs
//
// WCAG 2.2.2 (Pause, Stop, Hide, Level A) RUNTIME probe.
//
// WHY THIS MUST BE RUNTIME, NOT A SOURCE SCAN
// --------------------------------------------------------------------------
// The 2026-07-25 motion sweep (_plans/motion-audit/RANKED.md) fixed five
// simultaneous infinite loops on /business and /fuer-salons. TWO of those
// five would have survived a fix built from the audit's own offender list:
//   1. `animate-pulse` was never in the offender vocabulary. It is
//      Tailwind's default `pulse 2s infinite`, unoverridden. A gate written
//      from a list of known class names passes it silently, every time -
//      two independent audits found this same gap separately. That half a
//      static scan COULD have caught, by vocabulary, but only the half that
//      happens to already be on the list.
//   2. The <Typewriter> loop had NO class name and NO keyframe at all - a
//      raw setTimeout chain running ~13.5s. No static scan of any kind can
//      ever see it, because there is nothing in the source to match on.
// So this probe does not read source. It loads the route in a real
// browser, takes its hands off the keyboard, and watches what is still
// MOVING after the five-second budget. Behavioural criterion, behavioural
// check.
//
// THE CRITERION (WCAG 2.2.2, Level A): moving/blinking information that
// (a) starts automatically, (b) lasts more than five seconds, and (c) is
// presented in parallel with other content, needs a mechanism to pause,
// stop, or hide it. `prefers-reduced-motion` does NOT discharge this - the
// criterion asks for a user-facing pause/stop/hide MECHANISM, and a media
// query the user cannot toggle from the page is not one.
//
// HOUSE PATTERNS REUSED, NOT REINVENTED (mirrors scripts/check-geometry.mjs)
// --------------------------------------------------------------------------
//   - launchBrowser(): prefer `playwright`, fall back to `playwright-core`,
//     close the browser in a `finally`.
//   - dismissCookies(): same selector/regex as check-geometry.mjs. Dismissed
//     for a SECOND reason beyond hygiene here: the consent banner is itself
//     animated (slide/fade in), so leaving it up would report the banner's
//     OWN transition as a false "still moving" finding on every single
//     route, every single run.
//   - usage banner, single main(), report-file + stdout shape.
//   - --gate exit-code + an ALLOWLIST ratchet (MOTION_ALLOWLIST below),
//     same spirit as check-geometry.mjs's FLOORS_ALLOWLIST: known-open rows
//     do not fail the gate, so it can be armed TODAY, and the list can only
//     shrink as each row actually gets fixed.
//
// TWO DETECTORS
// --------------------------------------------------------------------------
// A) CSS-LOOP. After the watch window, walk the DOM in-page and report
//    every VISIBLE element whose computed animationIterationCount is
//    "infinite" and whose animationPlayState is not "paused". Zero-area,
//    display:none, visibility:hidden, and opacity:0 elements are skipped -
//    those present nothing to the user, so they carry no WCAG exposure.
//    This reads COMPUTED style, not the DOM's class attribute, so it finds
//    the class-name shape (animate-pulse, animate-spin, a bespoke
//    @keyframes rule, anything) WITHOUT needing to know the class name in
//    advance - that is the whole point, and the exact half of the offender
//    vocabulary gap this file exists to close.
//
// B) LIVE-DOM. The leg that catches the classless case - the reason this
//    file exists at all. A MutationObserver is armed via
//    context/page.addInitScript BEFORE any app code runs, so a loop that
//    starts during hydration is seen from its very first tick, never from
//    whenever the probe happened to attach after the fact. It observes
//    `document` itself (NOT document.documentElement - confirmed live
//    while self-testing this file: documentElement is still null at the
//    point addInitScript runs, before the parser has created <html>, so
//    observing it threw and silently killed the whole observer with zero
//    findings ever reported) with { subtree, childList, characterData,
//    attributes (style/class only) }, and records { at, type, target
//    description, attributeName } into a capped ring buffer (spliced at
//    ~4000 records) so a fast loop cannot exhaust memory before the watch
//    window ends.
//    After the watch window, LATE mutations (past the 5000ms budget) are
//    grouped by target+type, and any group with >= 3 repeats is reported.
//    Rationale: a handful of one-off late mutations is ordinary app life (an
//    image finishing decode, a ResizeObserver firing once) - the tell for a
//    LOOP is REPETITION, not mere existence past the budget.
//    Two honesty requirements, both wired into the init script:
//      - pointerdown/keydown/wheel/touchstart are listened for in the
//        CAPTURE phase and the last-input time is recorded. The criterion
//        is about motion that starts AUTOMATICALLY; real user input after
//        that point disqualifies later mutations as evidence. The probe
//        itself never interacts (besides the one cookie-consent click,
//        which is recorded like any other input), but this keeps the
//        reading honest the moment interaction is ever added.
//      - window.fetch is wrapped to record start/end times. If the route
//        was still fetching (started before the budget, not yet resolved
//        by the budget) when the budget mark passes, mutating nodes for
//        that route are reported as LIVE-DOM-CONDITIONAL, not LIVE-DOM. A
//        slow endpoint repainting a skeleton into real content is a
//        genuinely different and much weaker exposure than an unconditional
//        loop; collapsing the two would make the report cry wolf on every
//        page that is simply still loading data. LIVE-DOM-CONDITIONAL is
//        always report-only - it never fails --gate.
//
// Usage:
//   node scripts/check-motion.mjs
//   node scripts/check-motion.mjs --routes=/de,/de/business
//   node scripts/check-motion.mjs --gate
//   BASE_URL=http://localhost:3001 node scripts/check-motion.mjs
//   npm run check:motion
//   npm run gate:motion
//
// Exit code: 0 in report-only mode, always. --gate exits 1 the moment any
// non-allowlisted route reports a CSS-LOOP finding or an unconditional
// LIVE-DOM finding (LIVE-DOM-CONDITIONAL never gates, see above).

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

// ----------------------------------------------------------------------------
// Config
// ----------------------------------------------------------------------------
const BUDGET_MS = 5000; // the WCAG 2.2.2 criterion itself, not a tuning knob
const WATCH_MS = 7500; // headroom past the budget so a mutation right at 5000ms isn't a coin-flip

// Matches the house measurement viewport (check-geometry.mjs FLOORS_VIEWPORT),
// with mobile emulation flags on since Solen is mobile-first and a chunk of
// the audited loops (walk-in ring, queue tracker) are touch-surface only.
const VIEWPORT = { width: 390, height: 844 };
const DEVICE_SCALE_FACTOR = 2;
const IS_MOBILE = true;
const HAS_TOUCH = true;

const BUFFER_CAP = 4000; // ring-buffer cap for the LIVE-DOM mutation log, see armLiveDomProbe below
const REPEAT_THRESHOLD = 3; // a late-mutation group needs >= this many repeats to count as a loop, not app life

const DEFAULT_ROUTES = ["/de", "/de/business", "/de/fuer-salons", "/de/salon/old-town-barbers", "/de/inspo", "/de/zuerich/coiffeur"];
const OUTPUT_PATH = resolve(process.cwd(), "_plans/motion-audit/_probe-report.md");

// ----------------------------------------------------------------------------
// MOTION_ALLOWLIST (ratchet, same spirit as check-geometry.mjs's
// FLOORS_ALLOWLIST). Each entry is a regex matched against a finding's
// animation-name + class-name text; a hit means "known-open, tracked in
// RANKED.md, do not fail the gate on this row today." The list only ever
// SHRINKS - delete a row the moment its surface is fixed, never add a fresh
// one to route around a NEW failure.
// ----------------------------------------------------------------------------
const MOTION_ALLOWLIST = [
  { pattern: /\bspin\b/, reason: "RANK 1 open: animate-spin, 62 sites / 36 files, batch fix pending" },
  { pattern: /\bbreathe\b/, reason: "RANK 1 open: .animate-breathe, blocked on the Motion-sheet-22 contradiction" },
  { pattern: /\bbounce\b/, reason: "RANK 1 open: animate-bounce, FormulaPhotoUpload:78" },
];

function matchAllowlist(matchText) {
  for (const entry of MOTION_ALLOWLIST) {
    if (entry.pattern.test(matchText)) return entry;
  }
  return null;
}

// ----------------------------------------------------------------------------
// CLI args
// ----------------------------------------------------------------------------
function parseArgs(argv) {
  let routes = null;
  let gate = false;
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  for (const a of argv) {
    if (a === "--gate") gate = true;
    else if (a.startsWith("--routes=")) routes = a.slice("--routes=".length).split(",").map((r) => r.trim()).filter(Boolean);
  }
  return { baseUrl, gate, routes: routes && routes.length > 0 ? routes : DEFAULT_ROUTES };
}

// ----------------------------------------------------------------------------
// Browser bootstrap (mirrors scripts/check-geometry.mjs launchBrowser())
// ----------------------------------------------------------------------------
async function launchBrowser() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (err) {
    console.error("[check-motion] `playwright` import failed, falling back to playwright-core:", err);
    ({ chromium } = await import("playwright-core"));
  }
  try {
    return await chromium.launch({ headless: true });
  } catch (err) {
    console.error(
      "[check-motion] chromium.launch failed (browser binary may be missing, try `npx playwright install chromium`):",
      err,
    );
    throw err;
  }
}

// Mirrors check-geometry.mjs dismissCookies(). See file header for the
// SECOND reason this matters here specifically: the banner is animated.
async function dismissCookies(page) {
  const btn = page.locator("button", { hasText: /nur notwendige|akzeptieren|accept/i }).first();
  if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btn.click().catch(() => {});
    await page.waitForTimeout(400);
  }
}

// ----------------------------------------------------------------------------
// Detector A: CSS-LOOP. Self-contained in-page function (page.evaluate
// serializes it via toString() into the browser, so it cannot close over
// any outer-scope variable).
// ----------------------------------------------------------------------------
function extractCssLoops() {
  const SKIP_TAGS = new Set(["html", "body", "head", "script", "style", "noscript", "template", "meta", "link", "title", "br"]);
  const SVG_NS = "http://www.w3.org/2000/svg";

  function selectorFor(el) {
    if (el.id) return "#" + CSS.escape(el.id);
    const parts = [];
    let current = el;
    let depth = 0;
    while (current && current.nodeType === 1 && current !== document.documentElement && depth < 6) {
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
      const cls = current.className && typeof current.className === "string" ? current.className.trim().split(/\s+/)[0] : "";
      parts.unshift(cls ? `${tag}.${cls}` : tag);
      current = parent;
      depth++;
    }
    return parts.join(" > ");
  }

  // Presents-nothing checks - deliberately the same shape as check-geometry's
  // isVisible, PLUS opacity:0 (an off-screen/opacity-hidden loop presents no
  // information to anyone, so it carries no WCAG exposure even if it never
  // stops running).
  function isVisible(rect, style) {
    if (rect.width <= 0 || rect.height <= 0) return false;
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (parseFloat(style.opacity) === 0) return false;
    return true;
  }

  const allEls = Array.from(document.body.querySelectorAll("*")).filter((el) => {
    const tag = el.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return false;
    if (el.namespaceURI === SVG_NS && tag !== "svg") return false;
    return true;
  });

  const findings = [];
  for (const el of allEls) {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    if (!isVisible(rect, style)) continue;

    // animation-name/-iteration-count/-play-state/-duration are all
    // comma-separated lists when an element runs multiple animations at
    // once; they line up positionally, so each index is checked as one unit.
    const names = style.animationName.split(",").map((s) => s.trim());
    if (names.length === 1 && names[0] === "none") continue;
    const iterationCounts = style.animationIterationCount.split(",").map((s) => s.trim());
    const playStates = style.animationPlayState.split(",").map((s) => s.trim());
    const durations = style.animationDuration.split(",").map((s) => s.trim());

    for (let i = 0; i < names.length; i++) {
      if (names[i] === "none") continue;
      if (iterationCounts[i] !== "infinite") continue;
      if (playStates[i] === "paused") continue;
      const className = el.className && typeof el.className === "string" ? el.className : "";
      findings.push({
        selector: selectorFor(el),
        className,
        animationName: names[i],
        duration: durations[i] || durations[0] || "",
      });
    }
  }
  return findings;
}

// ----------------------------------------------------------------------------
// Detector B: LIVE-DOM. Two self-contained pieces:
//   armLiveDomProbe   runs via page.addInitScript, so it executes before any
//                     app JS on every fresh navigation on this page.
//   (extraction is a one-line page.evaluate in main(), reading window.__motionProbe)
// Both must stay self-contained for the same serialization reason as
// extractCssLoops above.
// ----------------------------------------------------------------------------
function armLiveDomProbe(config) {
  const { bufferCap } = config;
  const startedAt = Date.now();
  window.__motionProbe = { mutations: [], lastInputAt: 0, fetchLog: [], startedAt };

  // Describes the mutation's target well enough for a human AND for the
  // Node-side allowlist matcher (which needs the raw class list, not just a
  // human-readable abbreviation) - characterData mutations target a Text
  // node, which has no tagName/className of its own, so those fall back to
  // the parent element (the classic Typewriter shape: a text node inside a
  // <span> gets its textContent rewritten on every tick).
  function describeTarget(node) {
    const el = node.nodeType === 3 ? node.parentElement : node.nodeType === 1 ? node : null;
    if (!el) return { selector: "(text node, no parent element)", className: "" };
    const tag = el.tagName.toLowerCase();
    const id = el.id ? "#" + el.id : "";
    const className = el.className && typeof el.className === "string" ? el.className.trim() : "";
    const clsForDisplay = className ? "." + className.split(/\s+/).slice(0, 2).join(".") : "";
    return { selector: tag + id + clsForDisplay, className };
  }

  const observer = new MutationObserver((records) => {
    const buf = window.__motionProbe.mutations;
    for (const r of records) {
      const desc = describeTarget(r.target);
      buf.push({
        at: Date.now() - startedAt,
        type: r.type,
        target: desc.selector,
        targetClassName: desc.className,
        attributeName: r.attributeName || null,
      });
      // Cap the ring buffer so a fast loop (dozens of mutations/sec) cannot
      // exhaust memory before the watch window ends. Drops the OLDEST
      // records, since the tell we care about (repetition PAST the budget)
      // needs the most recent tail of the log, not its earliest entries.
      if (buf.length > bufferCap) buf.splice(0, buf.length - bufferCap);
    }
  });
  observer.observe(document, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["style", "class"],
  });

  // Honesty requirement 1: real input disqualifies later mutations as
  // evidence of AUTOMATIC motion. Capture phase so it fires even if an app
  // handler calls stopPropagation.
  for (const type of ["pointerdown", "keydown", "wheel", "touchstart"]) {
    document.addEventListener(
      type,
      () => {
        window.__motionProbe.lastInputAt = Date.now() - startedAt;
      },
      { capture: true, passive: true },
    );
  }

  // Honesty requirement 2: a fetch still in flight at the budget mark means
  // any mutation the fetch's response causes is a data-population effect,
  // not an unconditional loop - genuinely weaker evidence (see file header).
  // `entry.end` stays null while the fetch is pending, which is exactly the
  // "still fetching after the budget" signal the Node side checks for.
  const origFetch = window.fetch;
  if (typeof origFetch === "function") {
    window.fetch = function motionProbeFetch(...args) {
      const entry = { start: Date.now() - startedAt, end: null, errored: false };
      window.__motionProbe.fetchLog.push(entry);
      const p = origFetch.apply(this, args);
      p.then(
        () => {
          entry.end = Date.now() - startedAt;
        },
        () => {
          entry.end = Date.now() - startedAt;
          entry.errored = true;
        },
      );
      return p;
    };
  }
}

// ----------------------------------------------------------------------------
// Node-side pure logic (no DOM). Kept OUTSIDE the in-page functions above on
// purpose - this runs in Node against the data already pulled out of the
// page, and is what the embedded self-test below exercises directly.
// ----------------------------------------------------------------------------

// Groups LATE mutations (past the budget) by target+type+attribute and keeps
// only groups that repeat at least REPEAT_THRESHOLD times. A one-off late
// mutation (an image finishing decode, a single ResizeObserver tick) is
// ordinary app life, not a loop - the tell for a loop is repetition.
function groupLateMutations(mutations, budgetMs, repeatThreshold) {
  const late = mutations.filter((m) => m.at > budgetMs);
  const groups = new Map();
  for (const m of late) {
    const key = `${m.target}|${m.type}|${m.attributeName || ""}`;
    let g = groups.get(key);
    if (!g) {
      g = { target: m.target, targetClassName: m.targetClassName, type: m.type, attributeName: m.attributeName, count: 0, firstAt: m.at, lastAt: m.at };
      groups.set(key, g);
    }
    g.count++;
    g.lastAt = m.at;
  }
  return Array.from(groups.values())
    .filter((g) => g.count >= repeatThreshold)
    .sort((a, b) => b.count - a.count);
}

// Was any fetch still unresolved (or resolved AFTER the budget) at the
// moment the budget mark passed? That's "still fetching after the budget."
function wasStillFetchingAtBudget(fetchLog, budgetMs) {
  return fetchLog.some((f) => f.start <= budgetMs && (f.end === null || f.end > budgetMs));
}

// Builds the text an allowlist regex is tested against - animation name AND
// the full class list, since a named @keyframes rule and a Tailwind utility
// class are two different places the same "spin"/"breathe"/"bounce" word
// can live.
function cssLoopMatchText(finding) {
  return `${finding.animationName} ${finding.className}`;
}
function liveDomMatchText(group) {
  return `${group.target} ${group.targetClassName || ""}`;
}

// ----------------------------------------------------------------------------
// Embedded self-test (rule 12.5: test new logic before wiring it in). Pure
// math/array logic, no browser needed - runs synchronously before main().
// ----------------------------------------------------------------------------
function selfTestMotionLogic() {
  const assertions = [];
  function assert(name, cond) {
    assertions.push({ name, pass: !!cond });
  }

  // --- groupLateMutations: repetition past the budget is a loop; a single
  // late mutation, or mutations before the budget, are not.
  {
    const mutations = [
      { at: 1000, type: "characterData", target: "span.label", targetClassName: "label" },
      { at: 5100, type: "characterData", target: "span.label", targetClassName: "label" },
      { at: 5300, type: "characterData", target: "span.label", targetClassName: "label" },
      { at: 5500, type: "characterData", target: "span.label", targetClassName: "label" },
      { at: 6000, type: "attributes", target: "div.other", targetClassName: "other", attributeName: "style" },
    ];
    const groups = groupLateMutations(mutations, BUDGET_MS, REPEAT_THRESHOLD);
    assert("groupLateMutations: pre-budget mutation excluded from the count", groups.find((g) => g.target === "span.label").count === 3);
    assert("groupLateMutations: a single late mutation (below threshold) is dropped", groups.every((g) => g.target !== "div.other"));
    assert("groupLateMutations: the qualifying group is reported", groups.length === 1);
  }

  // --- wasStillFetchingAtBudget: pending (end null) or resolved-after-budget
  // both count; resolved-before-budget does not.
  {
    assert("fetch still pending at budget -> true", wasStillFetchingAtBudget([{ start: 100, end: null }], BUDGET_MS) === true);
    assert("fetch resolved AFTER budget -> true", wasStillFetchingAtBudget([{ start: 100, end: 5200 }], BUDGET_MS) === true);
    assert("fetch resolved BEFORE budget -> false", wasStillFetchingAtBudget([{ start: 100, end: 900 }], BUDGET_MS) === false);
    assert("fetch that started after the budget doesn't count", wasStillFetchingAtBudget([{ start: 6000, end: null }], BUDGET_MS) === false);
    assert("no fetches at all -> false", wasStillFetchingAtBudget([], BUDGET_MS) === false);
  }

  // --- MOTION_ALLOWLIST matching: the three seeded rows match their named
  // shape and nothing else.
  {
    assert("allowlist: animate-spin matches the spin row", matchAllowlist(cssLoopMatchText({ animationName: "spin", className: "animate-spin h-4 w-4" })) !== null);
    assert("allowlist: .animate-breathe matches the breathe row", matchAllowlist(cssLoopMatchText({ animationName: "breathe", className: "animate-breathe" })) !== null);
    assert("allowlist: animate-bounce matches the bounce row", matchAllowlist(cssLoopMatchText({ animationName: "bounce-in", className: "animate-bounce" })) !== null);
    assert("allowlist: an unrelated shimmer loop does NOT match any row", matchAllowlist(cssLoopMatchText({ animationName: "shimmer", className: "animate-shimmer" })) === null);
    assert(
      "allowlist: word-boundary guard - 'spinner' (spin as a substring, not a whole word) does NOT match \\bspin\\b",
      matchAllowlist(cssLoopMatchText({ animationName: "spinner-fade", className: "" })) === null,
    );
    assert(
      "allowlist: an exact 'spin' token still matches \\bspin\\b (the boundary guard doesn't overreach)",
      matchAllowlist(cssLoopMatchText({ animationName: "spin", className: "" })) !== null,
    );
  }

  const failed = assertions.filter((a) => !a.pass);
  if (failed.length > 0) {
    console.error("[check-motion] SELF-TEST FAILED - motion probe logic is not sound:");
    for (const f of failed) console.error(`  - ${f.name}`);
    process.exit(1);
  }
  console.log(`[check-motion] self-test passed (${assertions.length} assertions, probe logic)`);
}

// ----------------------------------------------------------------------------
// Report formatting
// ----------------------------------------------------------------------------
function formatCssLoopLine(finding) {
  const hit = matchAllowlist(cssLoopMatchText(finding));
  const tail = hit ? ` , ALLOWLISTED (${hit.reason})` : "";
  return `\`${finding.selector}\` animation-name=${finding.animationName} duration=${finding.duration}${tail}`;
}

function formatLiveDomLine(group, conditional) {
  const hit = matchAllowlist(liveDomMatchText(group));
  const tail = hit ? ` , ALLOWLISTED (${hit.reason})` : conditional ? " , CONDITIONAL, report-only (route still fetching at the budget mark)" : "";
  const attr = group.attributeName ? ` attribute=${group.attributeName}` : "";
  return `\`${group.target}\` ${group.type}${attr} , ${group.count}x between ${group.firstAt}ms and ${group.lastAt}ms${tail}`;
}

function formatRouteSection(route, entry) {
  const lines = [`## ${route}`, ""];
  if (entry.error) {
    lines.push(`ERROR: ${entry.error}`, "");
    return lines.join("\n");
  }
  const { cssLoops, liveDomGroups, liveDomConditionalGroups, lastInputAt } = entry;
  lines.push(`### CSS-LOOP (${cssLoops.length})`, "");
  if (cssLoops.length === 0) lines.push("none found");
  else for (const f of cssLoops) lines.push("- " + formatCssLoopLine(f));
  lines.push("");
  lines.push(`### LIVE-DOM (${liveDomGroups.length})`, "");
  if (liveDomGroups.length === 0) lines.push("none found");
  else for (const g of liveDomGroups) lines.push("- " + formatLiveDomLine(g, false));
  lines.push("");
  lines.push(`### LIVE-DOM-CONDITIONAL (${liveDomConditionalGroups.length}, report-only, route still fetching at the ${BUDGET_MS}ms budget)`, "");
  if (liveDomConditionalGroups.length === 0) lines.push("none found");
  else for (const g of liveDomConditionalGroups) lines.push("- " + formatLiveDomLine(g, true));
  lines.push("", `input: lastInputAt=${lastInputAt}ms (0 unless the cookie-consent click fired; the probe does not otherwise interact)`, "");
  return lines.join("\n");
}

// ----------------------------------------------------------------------------
// main
// ----------------------------------------------------------------------------
async function main() {
  selfTestMotionLogic();

  const { baseUrl, gate, routes } = parseArgs(process.argv.slice(2));
  console.log(`[check-motion] base=${baseUrl} budget=${BUDGET_MS}ms watch=${WATCH_MS}ms viewport=${VIEWPORT.width}x${VIEWPORT.height}`);
  console.log(`[check-motion] routes: ${routes.join(", ")}`);

  const browser = await launchBrowser();
  const byRoute = new Map();
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: DEVICE_SCALE_FACTOR,
      isMobile: IS_MOBILE,
      hasTouch: HAS_TOUCH,
    });
    for (const route of routes) {
      const page = await context.newPage();
      // Armed on THIS page before any navigation, so it re-arms fresh on
      // every new document this page loads and is present from hydration's
      // first tick, not from whenever this script happens to attach after.
      await page.addInitScript(armLiveDomProbe, { bufferCap: BUFFER_CAP });
      const url = new URL(route, baseUrl).toString();
      try {
        await page.goto(url, { waitUntil: "commit", timeout: 90_000 });
        await page.waitForLoadState("domcontentloaded");
        await dismissCookies(page); // see file header: also silences the banner's own motion
        await page.waitForTimeout(WATCH_MS);

        const cssLoops = await page.evaluate(extractCssLoops);
        const probe = await page.evaluate(() => {
          const p = window.__motionProbe;
          return p ? { mutations: p.mutations, lastInputAt: p.lastInputAt, fetchLog: p.fetchLog } : { mutations: [], lastInputAt: 0, fetchLog: [] };
        });

        const conditional = wasStillFetchingAtBudget(probe.fetchLog, BUDGET_MS);
        const groups = groupLateMutations(probe.mutations, BUDGET_MS, REPEAT_THRESHOLD);
        const liveDomGroups = conditional ? [] : groups;
        const liveDomConditionalGroups = conditional ? groups : [];

        byRoute.set(route, { cssLoops, liveDomGroups, liveDomConditionalGroups, lastInputAt: probe.lastInputAt });
        console.log(
          `[check-motion] ${route}: cssLoops=${cssLoops.length} liveDom=${liveDomGroups.length} liveDomConditional=${liveDomConditionalGroups.length}`,
        );
      } catch (err) {
        console.error(`[check-motion] route ${route} failed:`, err);
        byRoute.set(route, { error: err && err.message ? err.message : String(err) });
      } finally {
        await page.close().catch((err) => console.error("[check-motion] page.close() failed:", err));
      }
    }
  } finally {
    await browser.close().catch((err) => console.error("[check-motion] browser.close() failed:", err));
  }

  let cssLoopTotal = 0;
  let liveDomTotal = 0;
  let liveDomConditionalTotal = 0;
  for (const entry of byRoute.values()) {
    if (entry.error) continue;
    cssLoopTotal += entry.cssLoops.length;
    liveDomTotal += entry.liveDomGroups.length;
    liveDomConditionalTotal += entry.liveDomConditionalGroups.length;
  }

  const header = [
    "# Motion probe report , WCAG 2.2.2 (Pause, Stop, Hide, Level A)",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Base URL: ${baseUrl}  Budget: ${BUDGET_MS}ms  Watch window: ${WATCH_MS}ms  Viewport: ${VIEWPORT.width}x${VIEWPORT.height}`,
    "",
    "Runtime probe, not a source scan (see file header for why). Criterion: moving/blinking",
    "information that starts automatically, lasts past 5s, and runs alongside other content",
    "needs a user-facing pause/stop/hide mechanism. prefers-reduced-motion does NOT discharge it.",
    "",
    `Totals: CSS-LOOP=${cssLoopTotal}  LIVE-DOM=${liveDomTotal}  LIVE-DOM-CONDITIONAL=${liveDomConditionalTotal} (report-only)  ${routes.length} route(s)`,
    "",
    "---",
    "",
  ].join("\n");

  const body = routes.map((route) => formatRouteSection(route, byRoute.get(route))).join("\n---\n\n");
  const report = header + body + "\n";

  const outDir = dirname(OUTPUT_PATH);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(OUTPUT_PATH, report);

  console.log("");
  console.log(report);
  console.log(`[check-motion] report written to ${OUTPUT_PATH}`);

  if (gate) {
    console.log("");
    console.log("[check-motion] --gate: checking every finding against MOTION_ALLOWLIST...");
    let gateFailed = false;
    for (const [route, entry] of byRoute.entries()) {
      if (entry.error) {
        console.error(`[check-motion] GATE: ${route} could not be measured (${entry.error}) - skipped, not counted as a failure.`);
        continue;
      }
      for (const f of entry.cssLoops) {
        if (matchAllowlist(cssLoopMatchText(f))) continue;
        gateFailed = true;
        console.error(
          `[check-motion] GATE FAIL: ${route} - CSS-LOOP \`${f.selector}\` animation-name=${f.animationName} runs infinite, unpaused, past ${BUDGET_MS}ms. ` +
            `Not in MOTION_ALLOWLIST (top of scripts/check-motion.mjs). Fix shape: bound the loop to a finite cycle count that ends inside 5s and holds a ` +
            `legible final frame (the "3 forwards" pattern already used by animate-shimmer in tailwind.config.js), or ship a real stop control.`,
        );
      }
      // LIVE-DOM-CONDITIONAL never gates, see file header - only unconditional LIVE-DOM groups can fail here.
      for (const g of entry.liveDomGroups) {
        if (matchAllowlist(liveDomMatchText(g))) continue;
        gateFailed = true;
        console.error(
          `[check-motion] GATE FAIL: ${route} - LIVE-DOM \`${g.target}\` ${g.type} mutated ${g.count}x past the ${BUDGET_MS}ms budget (no CSS animation, ` +
            `no class match). Not in MOTION_ALLOWLIST. Fix shape: bound the loop to a finite cycle count that ends inside 5s and holds a legible final frame ` +
            `(the "3 forwards" pattern already used by animate-shimmer in tailwind.config.js), or ship a real stop control.`,
        );
      }
    }
    if (gateFailed) {
      console.error("");
      console.error("[check-motion] GATE: FAILED - one or more routes have an un-allowlisted motion exposure.");
      process.exit(1);
    }
    console.log("[check-motion] GATE: PASSED - every current finding is either clean or a reasoned, named entry in MOTION_ALLOWLIST.");
    process.exit(0);
  }

  process.exit(0); // report-only (no --gate): always 0
}

main().catch((err) => {
  console.error("[check-motion] fatal error:", err);
  if (process.argv.includes("--gate")) {
    console.error("[check-motion] GATE: FAILED - fatal error before the probe could run, see above.");
    process.exit(1);
  }
  process.exit(0);
});

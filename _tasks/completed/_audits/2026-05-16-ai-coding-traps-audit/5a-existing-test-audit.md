# Topic 5A — Existing Test Audit
Date: 2026-05-16
Scope: Quality audit of the SINGLE existing test file in the Solen repo

## File: e2e/visual/homepage.spec.ts

Absolute path: `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/e2e/visual/homepage.spec.ts`

### Lines: 109
### Test count: 9

Test names (numbered, all inside one `test.describe("homepage visual regression")` block):
1. `01-full-page`
2. `02-header`
3. `03-hero`
4. `04-first-carousel`
5. `05-trust-stats`
6. `06-discover-section`
7. `07-city-section`
8. `08-footer`
9. `09-mobile-nav-pill`

### What it claims to test

The file header comment claims: "Solen — Homepage Visual Regression Tests. Single page load, multiple section screenshots."

By test name, it claims to cover:
- The full homepage rendered top-to-bottom
- The site header
- The hero section
- The first carousel (LastMinute / Coiffeur)
- The trust-stats strip (the "Bewertung" / rating row)
- The "Inspiration / Entdecken" discover section
- The "BASEL" city section (Nearby / city-scoped salons)
- The footer
- The mobile-only navigation pill (a bottom nav, only asserted under `mobile` project)

### What it actually tests

Mechanically, what runs:
1. `beforeAll` opens ONE page at `/de/`, waits `waitUntil:"commit"` (lowest-fidelity ready state — TCP/HTTP commit, NOT DOM-ready), then `domcontentloaded`, then a fixed `waitForTimeout(4000)`, then dismisses the cookie banner if visible.
2. Each test takes a Playwright pixel-diff screenshot via `toHaveScreenshot(...)` against baselines in `e2e/visual/baselines/<test>/<arg>.png`.
3. The diff tolerance is `maxDiffPixelRatio: 0.01` (1% of pixels can differ) with `animations: "disabled"`.
4. Five of the nine tests (`04`, `05`, `06`, `07`, `09`) are GUARDED by `if (await locator.isVisible().catch(() => false))`. If the locator is NOT visible, the test **passes silently with zero assertions executed**. This is the most important finding in this audit.
5. Test `09-mobile-nav-pill` `return`s immediately if `testInfo.project.name !== "mobile"`, meaning under the `tablet` and `desktop` projects it passes without doing anything.

There are **no assertions on text content, no DOM state checks, no navigation/interaction tests, no API/network assertions, no a11y assertions, no count assertions**. Only image-diffs.

### Quality findings

- **[CRITICAL] Silent pass on missing element.** Tests 04, 05, 06, 07, 09 use the pattern `if (await x.isVisible().catch(() => false)) { await expect(x).toHaveScreenshot(...) }`. If the carousel disappears, if "Bewertung" stops rendering, if "BASEL" is renamed, if the discover section is deleted entirely — the test still passes green. There is no `else { throw }` and no `expect(x).toBeVisible()` precondition. This is textbook fake-coverage: the test claims to cover the section but does not require the section to exist.
- **[CRITICAL] No `npm test` script.** `package.json` has only `dev`, `build`, `build:vite`, `start`, `lint`. There is no `"test"` or `"test:e2e"` script. A new contributor or CI runner has no entry point. Discovery requires reading the comment block inside the spec file itself. This explains why the suite is effectively decorative — nothing in the project's standard workflow invokes it.
- **[CRITICAL] No webServer config.** `playwright.config.ts` has NO `webServer` block. The dev server is NOT auto-started by Playwright — the human must remember to run `next dev` (on port 3001) in another terminal first. If the dev server is down, `page.goto("/de/")` will fail and the entire suite errors out before any assertions run. This is not a graceful degradation; it is a setup landmine.
- **[CRITICAL] Single shared page across tests (`beforeAll`, not `beforeEach`).** A single browser page is reused for all nine tests. If test 04 scrolls/clicks/mutates the DOM, test 05 inherits that state. Already, tests 06/07/08 explicitly `scrollIntoViewIfNeeded()`, meaning by the time test 08 (footer) runs, the page is scrolled to the bottom. This couples tests and makes failures non-isolable. It also means screenshot baselines for "header" implicitly assume nothing has scrolled the page yet — a fragile invariant.
- **[HIGH] No data seeding / no DB assertions.** Solen's homepage feed sections (`Coiffeur`, `LastMinute`, `Nearby`, `RecentlyViewed`) currently use static `DEMO` arrays per `CLAUDE.md`. The visual baseline locks in **demo data screenshots**. When real Supabase data wires in (per `_audits/2026-05-10-v3-wireup-audit.md`), every baseline will diff and have to be re-snapshotted; the suite cannot tolerate dynamic content because there is no data mocking or fixed seed. The current "pass" state is conditional on demo-data identity, not real behavior.
- **[HIGH] Cookie banner handling is opportunistic.** `dismissCookies` uses a regex `/akzeptieren|accept/i` against any `button`, with a 3-second wait. If the German copy ever changes ("Annehmen", "OK", "Cookies erlauben"), the banner sits over the hero and every screenshot from then on contains a cookie strip. The test would still pass on first run (new baseline captured WITH the banner) and silently lock in the broken state.
- **[HIGH] `waitForTimeout(4000)` after `domcontentloaded` is brittle.** Solen has client-side count-ups (e.g. `+12,348` stat), API fetches (`/api/salons/by-category/*`, `/api/staff/featured`, `/api/salons/nearby/*` — all newly added per `git status`), atmosphere blob animations, and `framer-motion` enters. Four seconds is an arbitrary timeout that will be too short on a cold-start dev server (first compile can take 60s+, as the test author themselves note in the comment) and too long for CI. There is no `waitForResponse`, no `waitFor` predicate on a specific DOM signal. Flake will be the norm.
- **[HIGH] Locators are brittle and CSS-implementation-dependent.** Test 04 targets `main .group\\/section`, which is a Tailwind `group/section` utility class. The moment a refactor renames the group or drops the modifier, the test goes from "asserting a screenshot" to "silently passing because the locator returns nothing and the `isVisible()` guard swallows it." Similarly: `page.locator("text=Bewertung")` is German-locale-specific; `page.locator("text=BASEL")` depends on the city being uppercased in copy; `page.locator("h2", { hasText: /inspiration|entdecken/i })` is brittle to copy edits.
- **[HIGH] Test 06's selector escapes containment.** `const section = heading.locator("..").locator("..");` walks two parent levels via XPath. If the DOM nesting changes by one level (e.g. wrapping a div for a layout fix), the screenshot suddenly captures a different scope. The selector is structurally fragile.
- **[MEDIUM] No accessibility, focus, or keyboard tests.** No `getByRole`, no `aria-*` assertions, no keyboard navigation, no focus traps for the modal/cookie banner, no contrast checks. Given Solen's design system explicitly bakes WCAG (`SOLEN_PATTERNS.md`, `SOLEN_UI.md`) and uses `uiux-audit` skill manually, the lack of automated a11y is a real gap.
- **[MEDIUM] No interaction tests at all.** Zero `click`s (other than the cookie banner), zero form fills, zero hover-state assertions, zero navigation across routes. The "test" is purely "did the initial server-rendered HTML produce the same pixels?" This is the narrowest possible reading of "visual regression," and it cannot catch hover-state bugs, click-handler regressions, search-bar suggest dropdown bugs, or routing breakage.
- **[MEDIUM] No mobile/tablet/desktop differentiation in assertions.** The same 9 tests run under three projects (mobile/tablet/desktop) but only test 09 has any per-project branching. Tests 01-08 produce three separate screenshots (one per project, written under different test-result paths) but the spec body cannot express, for example, "header should show hamburger on mobile and full nav on desktop." There is no `if (mobile) expect(hamburgerVisible)` logic.
- **[MEDIUM] Tolerance of 1% pixel diff swallows real changes.** With `maxDiffPixelRatio: 0.01`, on a 1440×900 screenshot (1.296M pixels) up to ~13k pixels can change silently. A small but real color shift or 1-2px layout drift can hide under that ratio. Inversely, font hinting differences across machines can blow past 1% on copy-heavy sections, causing false failures.
- **[MEDIUM] Disabling animations distorts what's "really shown."** `animations: "disabled"` is the right call for visual regression (otherwise flake is unbounded), but it means hero entry animations, blob drift, count-ups, hover transitions — anything time-dependent — is **never visually verified**. The test cannot tell whether the count-up bug from V2-D49 ever regressed.
- **[MEDIUM] Mobile nav pill test (09) is the only one that "tests behavior".** Test 09 is the only test that conditionally runs by project. But it still just screenshots; it does not click the pill, does not assert it stays sticky on scroll, does not assert it remains visible after scroll. It is "test 02 with a different element."
- **[LOW] No baseline strategy documentation.** Baselines are checked into the repo at `e2e/visual/baselines/`, but `CLAUDE.md` does not document who is allowed to run `--update-snapshots` or under what conditions. There is no PR-template check, no review nudge, no CI gate. Snapshot updates are a one-person action with no oversight.
- **[LOW] `outputDir: "./e2e/visual/test-results"` is gitignored implicitly?** Not verified in this audit — but if not gitignored, ephemeral diff artifacts could leak into commits. (Note for the file owner, not a blocker.)
- **[LOW] No CI integration apparent.** `.github/workflows/` was not inspected as part of this slice but the absence of an npm script implies any CI invocation would have to hard-code `npx playwright test`. The visual regression suite is effectively a manual local tool, not a guard rail.
- **[LOW] Comment claim "Single page load, multiple section screenshots — This avoids timeout issues with the dev server on repeated navigations" is candid but a smell.** It documents that the suite was designed AROUND a dev-server flakiness problem rather than fixing the underlying issue (no `webServer` config, no `next build && next start` for tests, no fixture data). The comment is an architectural confession.

### "Would it fail if homepage rendered nothing" answer

**Partial — leans heavily toward NO.**

If the homepage rendered an entirely blank page (e.g. `<html><body></body></html>`):
- Test 01 (`full-page`): would **FAIL** — the fullPage screenshot would clearly diff from the baseline (white vs the current cream + content). This is the only test that meaningfully asserts "the page rendered."
- Test 02 (`header`): would **error** — `page.locator("header").first()` returns no element, and `toHaveScreenshot` on a non-existent element throws. This counts as a fail.
- Test 03 (`hero`): same — `page.locator("main section").first()` would have no match if `<main>` is missing.
- Test 04 (`first-carousel`): would **silently PASS** — the `isVisible().catch(() => false)` guard returns false, and the test exits without running `toHaveScreenshot`. Zero assertions executed = green test.
- Test 05 (`trust-stats`): same as 04 — **silently PASS**.
- Test 06 (`discover-section`): same — **silently PASS**.
- Test 07 (`city-section`): same — **silently PASS**.
- Test 08 (`footer`): would **error** — `await footer.scrollIntoViewIfNeeded()` runs unguarded, and `scrollIntoViewIfNeeded` throws on a non-existent element. Counts as a fail.
- Test 09 (`mobile-nav-pill`): would **silently PASS** (guard pattern, AND it only runs on mobile project anyway).

So the actual answer: of 9 tests, **3 would hard-fail (01 full-page diff, 02 header missing, 08 footer missing), 1 would error (03 hero), 5 would silently pass green** even on a totally blank page.

A "blank page" smoke test for this suite reports 5/9 green — a misleading signal that hides catastrophic breakage. The test suite passes the "delete the function body" mental model only in the loosest sense: the full-page diff catches the broadest case, but the per-section tests do not.

### Playwright config

Path: `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/playwright.config.ts` (66 lines)

- **`testDir`**: `./e2e/visual`
- **`outputDir`**: `./e2e/visual/test-results` (diff artifacts)
- **`snapshotPathTemplate`**: `{testDir}/baselines/{testName}/{arg}{ext}` — baselines live alongside specs under `baselines/`
- **`timeout`**: `60_000` (per-test 60s)
- **`expect.toHaveScreenshot.maxDiffPixelRatio`**: `0.01` (1% pixel tolerance)
- **`expect.toHaveScreenshot.animations`**: `"disabled"`
- **`fullyParallel`**: `false`
- **`workers`**: `1` (serial — no parallelism, consistent with the shared-page anti-pattern)
- **`reporter`**: HTML at `e2e/visual/report`, `open: "never"`
- **`use.baseURL`**: `process.env.BASE_URL || "http://localhost:3001"` — note the port `3001` (Next.js default is 3000). If `next dev` runs on default 3000, the suite silently misses.
- **`use.actionTimeout`**: `15_000`
- **`use.screenshot`**: `"off"` (on-failure auto-capture is disabled — only the explicit `toHaveScreenshot` calls produce images)
- **`use.browserName`**: `"chromium"` (no Firefox, no WebKit — "only browser we installed")
- **Projects** (viewport configs, no other overrides):
  - `mobile`: 375 × 812, `deviceScaleFactor: 2`
  - `tablet`: 768 × 1024, `deviceScaleFactor: 2`
  - `desktop`: 1280 × 900, `deviceScaleFactor: 1`
- **No `webServer` block** — Playwright does not start `next dev`. The dev server must be running externally.
- **No `globalSetup` / `globalTeardown`** — no DB seeding, no auth fixture, no env reset.

### Other e2e/ files

`find /Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/e2e -type f` returns:
- `e2e/visual/homepage.spec.ts` — the only test file
- 9 baseline PNGs under `e2e/visual/baselines/homepage-visual-regression-<NN>-<slug>/<file>.png` (one per test)

No other `.spec.ts`, no helpers, no fixtures, no page-object models, no auth setup file. No tests for the new API routes added in this branch (`app/api/favorites/`, `app/api/salons/by-category/`, `app/api/salons/by-slugs/`, `app/api/salons/nearby/`, `app/api/staff/featured/` per `git status`). No tests for booking flow, checkout, auth, search results, salon detail — none of the Tier 1 funnel pages from `_audits/2026-05-10-v3-wireup-audit.md`.

Exhaustive `find` for `*.{test,spec}.{ts,tsx,js,jsx}` outside `node_modules`/`.next`/`.git` returns exactly one path: `e2e/visual/homepage.spec.ts`. There are no co-located unit tests in `app/`, `lib/`, `components-legacy/`, or anywhere else.

Test framework dependency inventory in `package.json`:
- `@playwright/test`: `^1.59.1` (devDependency, the only test framework dep)
- No Vitest, no Jest, no Mocha, no Chai, no MSW, no `@testing-library/*`, no Cypress, no Storybook test runner.

### package.json test commands

`package.json` `scripts` block (full, verbatim):
```json
"dev": "next dev",
"build": "next build",
"build:vite": "vite build",
"start": "next start",
"lint": "next lint"
```

- `npm test` → **does not exist** (npm will print "Missing script: test").
- `npm run test:e2e` → does not exist.
- `npm run test:unit` → does not exist.
- `npm run test:visual` → does not exist.

The only way to run the suite is `npx playwright test` (documented in the spec file's header comment, NOT in `package.json`, NOT in `CLAUDE.md`, NOT in `_docs/PROJECT_REFERENCE.md` per my grep). A new contributor reading `package.json` would conclude this project has no tests at all.

The `.playwright-mcp/` directory at the repo root contains ~20 ad-hoc snapshot YAML files from Playwright MCP sessions (dates 2026-05-07 through 2026-05-14). Those are debugging artifacts from MCP-driven design work by Claude — they are unreferenced by `playwright.config.ts` and unrelated to the regression suite.

### Verdict

**Status: decorative, leaning fake.**

It is not entirely useless — test 01 (`full-page`) is a real catch-all that would scream if the homepage went blank or radically changed layout, and tests 02 / 03 / 08 will error (not silent-pass) if their unconditionally-targeted elements vanish. Four tests do something. But:

1. Five of the nine tests silently pass when their target element is missing. That is fake coverage by definition (per global rule 7 / Topic 5 trap): the name claims to test a section but the function body does not require it to exist.
2. There is no `npm test` script, no CI wiring inferred, no `webServer` config — the suite is operationally orphaned and cannot run unattended.
3. There are no behavior, navigation, interaction, API, data, or a11y assertions. Only pixel diffs. The 1% tolerance further weakens those.
4. The single shared `beforeAll` page couples tests and locks each baseline to a specific scroll/cookie state.
5. The locked baselines screenshot **demo data**, so the moment Solen wires real Supabase content per the V3 wireup audit, every baseline becomes stale and must be re-snapped — there is no mocking, fixture, or seed-control to keep tests stable.
6. The suite cannot survive a copy edit ("Bewertung" → "Reviews", "BASEL" → "Basel") or a Tailwind utility rename without going green-but-broken.
7. Lock-in to one locale (`/de/`), one browser (Chromium-only), one substrate (demo data) makes generalization to a real regression net impossible without a rewrite.

In Topic 5's "fake test coverage" taxonomy, this is **a marketing-grade test name pinned to a 1-section image diff**. It is the kind of suite an AI agent would generate to satisfy a "we have tests" checkbox — visible in the PR, green in CI (if CI ran it), but not actually a guard rail against regression.

**Recommendations (do not implement in this slice — out of scope):**
- Replace the `isVisible() ?` guard pattern with `await expect(locator).toBeVisible()` preconditions in every per-section test. Convert silent skips into hard failures.
- Add an `"test": "playwright test"` script to `package.json`.
- Add a `webServer` block to `playwright.config.ts` so the dev server boots with the test run (or, better, run against `next build && next start` for stable, production-like rendering).
- Split into `beforeEach` per-test page loads (cost is real first-compile time, but isolation is worth it; or use `next start` to avoid the cold-compile overhead).
- Add at least one click-and-navigate test (search bar → results page) and one API-mocked test for a feed section so the suite verifies SOMETHING beyond pixels.
- Document the test workflow in `CLAUDE.md` so new agents/contributors know it exists, what it covers, and how to update snapshots.
- Decide whether to fix the suite or to delete it and start over with Vitest + Playwright on a real test plan (recommended). The current artifact is doing more harm than good — it provides false comfort.

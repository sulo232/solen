# Topic 5 slice C — Test infrastructure gap analysis

**Audit date:** 2026-05-16
**Slice:** What testing infrastructure exists vs what's needed.
**Repo root:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7`

---

## Headline

**Playwright wired (visual regression only, 1 file). Everything else absent.** No Vitest, no Jest, no @testing-library, no MSW, no CI test runs, no Supabase test isolation. There is zero unit-test or integration-test coverage in this codebase. The only `*.spec.ts` in the repo is `e2e/visual/homepage.spec.ts` (9 visual-regression tests against the live dev server) — no API tests, no lib tests, no component tests, no E2E user-flow tests.

---

## Test framework state

- **Vitest: ABSENT** — not in `package.json` deps/devDeps. (`vite` 6.4.1 is present for an unrelated `build:vite` script, but no `vitest` package.)
- **Jest: ABSENT** — not in `package.json`. (Intentional — Vitest is the modern preference for Next.js 15.)
- **Playwright: WIRED** — `@playwright/test@^1.59.1` in devDependencies, `playwright.config.ts` at root, 1 spec file at `e2e/visual/homepage.spec.ts`. Config is visual-regression-tuned (`maxDiffPixelRatio: 0.01`, animations disabled, 3 viewport projects: mobile/tablet/desktop).
- **@testing-library/react: ABSENT** — no `@testing-library/*` packages anywhere.
- **happy-dom / jsdom: ABSENT** — no DOM-emulation environment installed.
- **MSW (Mock Service Worker): ABSENT** — no `msw` package, no `mocks/handlers.ts`, no request-mocking layer for Stripe/Gemini/Resend/Mapbox/Upstash.
- **supertest: ABSENT** — no API-route integration testing tool.
- **Stripe mock library: ABSENT** — no `@stripe/stripe-mock` or similar.
- **Faker / test-data factories: ABSENT** — no `@faker-js/faker` or factory library for seed data.

## npm scripts

`package.json` (lines 5-11):
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "build:vite": "vite build",
  "start": "next start",
  "lint": "next lint"
}
```

**No `test`, `test:unit`, `test:e2e`, `test:integration`, `test:watch`, `test:coverage` scripts.** Visual-regression tests are invoked manually via `npx playwright test` (per the JSDoc in `playwright.config.ts`).

## Config files

- `vitest.config.ts` / `vitest.config.js`: **ABSENT**
- `jest.config.ts` / `jest.config.js` / `jest.config.mjs`: **ABSENT**
- `playwright.config.ts`: **PRESENT** — `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/playwright.config.ts` (66 lines, visual-regression tuned, `baseURL: http://localhost:3001`, Chromium-only, single worker, HTML reporter to `e2e/visual/report`)
- `vite.config.ts` + `vite.config.js`: **PRESENT** at root — but these power an unused `build:vite` script (`@vitejs/plugin-react-swc` building React for esnext target). Not a Vitest config — `vite.config.ts` does NOT register a `test` block.
- `tsconfig.json` for tests: **NO SEPARATE CONFIG.** Main `tsconfig.json` excludes `supabase/functions`, `src/`, `remotion`, `**/*.figma.tsx` — but does not exclude `e2e/`. There is no `tsconfig.test.json` or test-specific TS config.

## Test directories

- `e2e/`: **PRESENT** — contains `e2e/visual/homepage.spec.ts` (1 file, 9 visual-regression tests) and `e2e/visual/baselines/` (committed screenshots).
- `__tests__/`: **ABSENT** at root, ABSENT in `lib/`, `components/`, `app/`. Verified via `find -maxdepth 4 -type d -name __tests__`.
- `tests/`: **ABSENT**.
- `test/`: **ABSENT**.
- Co-located `*.test.ts` / `*.test.tsx` files: **ABSENT** — `find -maxdepth 5 -name "*.test.ts" -o -name "*.test.tsx"` returns zero hits outside node_modules.
- Co-located `*.spec.ts` files: only `e2e/visual/homepage.spec.ts`. No spec files for `lib/`, `app/api/`, components.

## Supabase test setup

- `supabase/config.toml`: **ABSENT** — there is no local-stack config. `supabase/` contains only `functions/` (7 Edge Functions), `migrations/`, `templates/`. No `config.toml` means `supabase start` (local Docker stack) has never been initialized for this repo.
- `supabase/seed.sql`: **ABSENT** — no test/dev seed data file at the canonical path.
- Test DB strategy: **NOT DEFINED.** No documentation in `_docs/`, `_rules/`, or `_tasks/` describes how integration tests would isolate from production data. No Supabase branching workflow referenced. No `SUPABASE_TEST_URL` / `SUPABASE_TEST_ANON_KEY` envvar pattern in `.env.example`.
- The 7 Edge Functions (`booking-reminder`, `compute-analytics`, `post-booking-preferences`, `recurring-booking-processor`, `salon-verification`, `slot-auto-release`, `smart-nudges`) all run against live Supabase with **zero unit tests**.

## Stripe test mode

- `.env.example` line 13: `STRIPE_SECRET_KEY=sk_live_...` — example shows **live key**, not `sk_test_`. No separate `STRIPE_TEST_SECRET_KEY` envvar pattern is documented for dev/test isolation.
- Stripe CLI for local webhook forwarding (`stripe listen --forward-to localhost:3001/api/stripe/webhook`): **not referenced** in `_docs/`, `package.json` scripts, or `_rules/`. No documented webhook-test workflow.
- No Stripe fixture-replay or webhook-event-fixture pattern in the repo.

## CI integration

- `.github/workflows/`: **ABSENT.** The `.github/` directory exists but contains only `pull_request_template.md`. There are no GitHub Actions workflows.
- Tests in CI: **ABSENT** — there is no CI runner of any kind. No PR-gating test step, no main-branch test step, no Playwright run in CI.
- Test reporting / coverage / failure notifications: **N/A** (no CI exists).
- Note: project CLAUDE.md mentions `.github/workflows/cron-jobs.yml` invoking `/api/cron/*` routes for the Netlify migration, but **no such workflow file exists in this worktree** — the file referenced in CLAUDE.md is aspirational or lives elsewhere.

## Coverage tooling

- `c8` / `nyc` / `istanbul`: **ABSENT** — none in `package.json`.
- `@vitest/coverage-v8` / `@vitest/coverage-istanbul`: **ABSENT.**
- Coverage thresholds: **NOT SET** (no config to set them in).
- Codecov / Coveralls upload: **ABSENT** (no CI exists to upload from).

## Mutation testing

- `@stryker-mutator/*`: **ABSENT** — flag as future improvement, but mutation testing requires a baseline test suite first. Not actionable until Vitest + a real unit-test suite are in place.

## API mocking (MSW or similar)

- `msw`: **ABSENT.**
- Custom fetch-mock layer: **ABSENT.** A grep for `vi.mock` / `jest.mock` / `fetch-mock` / `nock` returns zero hits outside node_modules.
- The codebase makes outbound calls to Stripe (`stripe.checkout.sessions.create`), Gemini (`@google/generative-ai`), Resend (`resend`), Mapbox, Upstash Redis, Google Places, PostHog, Unsplash/Pexels/Pixabay, seven.io SMS — **none of these have a mocking layer**. Any unit/integration test that touches these would hit live APIs.

## What the existing Playwright suite covers

`e2e/visual/homepage.spec.ts` (109 lines, 9 tests):
1. `01-full-page` — full-page screenshot of `/de/`
2. `02-header` — header element snapshot
3. `03-hero` — first `main section` snapshot
4. `04-first-carousel` — first `.group/section` (conditional)
5. `05-trust-stats` — section containing "Bewertung" (conditional)
6. `06-discover-section` — section with h2 matching `/inspiration|entdecken/i` (conditional)
7. `07-city-section` — section containing "BASEL" (conditional)
8. `08-footer` — footer element snapshot
9. `09-mobile-nav-pill` — mobile-only `nav[aria-label='Navigation']`

Each runs at 3 viewports (mobile 375, tablet 768, desktop 1280) = **27 baselines per run**. Coverage scope: **homepage visual snapshots only**. No user-flow tests (signup, booking, checkout, search). No API route tests. No salon-detail, search-results, profile, checkout page coverage.

## What is NOT tested (the actual gap)

- **All 60+ API routes** (`app/api/**/route.ts`): zero coverage. Critical routes like `/api/checkout/session`, `/api/bookings/create`, `/api/stripe/webhook`, `/api/auth/*`, `/api/favorites/*` — no unit, integration, or contract tests.
- **All Supabase query layers** (`lib/queries/*`, `lib/auth/*`): zero coverage. RLS-policy correctness is verified manually only.
- **All 7 Supabase Edge Functions** (`supabase/functions/*`): zero tests. These run on schedule and silently fail if broken.
- **All 19 cron job handlers** (`app/api/cron/*` per `vercel.json`): zero tests. They run hourly/daily and process bookings, refunds, reminders, deletions, SMS, deposits, no-shows, infill reminders — silent failures here have real customer impact.
- **All business logic libraries** (`lib/automod.ts`, `lib/content-flags.ts`, `lib/booking-email.ts`, `lib/solen-score`, pricing/discount logic, time-slot generation): zero coverage.
- **All Zod schemas**: present in code (per `_rules/SECURITY_RULES.md`) but zero round-trip validation tests.
- **i18n translation completeness** (`messages/*.json`): no test that German/French/English/Italian keysets match.
- **Component behavior**: zero component unit tests. Only visual-snapshot tests on rendered homepage.

## Recommendations (concrete next steps for a real test suite)

1. **Install Vitest + helpers** — surgical addition, no Next.js disruption:
   ```bash
   npm i -D vitest @vitest/coverage-v8 happy-dom @testing-library/react @testing-library/jest-dom @testing-library/user-event
   ```

2. **Create `vitest.config.ts`** at root:
   ```ts
   import { defineConfig } from "vitest/config";
   import react from "@vitejs/plugin-react";
   export default defineConfig({
     plugins: [react()],
     test: {
       environment: "happy-dom",
       globals: true,
       setupFiles: ["./tests/setup.ts"],
       include: ["**/*.{test,spec}.{ts,tsx}", "!e2e/**"],
       exclude: ["node_modules", ".next", "e2e/**"],
       coverage: {
         provider: "v8",
         include: ["lib/**", "app/api/**"],
         exclude: ["**/*.d.ts", "**/types.ts", "**/index.ts"],
         thresholds: { lines: 60, functions: 60, branches: 55, statements: 60 },
       },
     },
     resolve: { alias: { "@": "/" } },
   });
   ```

3. **Add npm scripts** to `package.json`:
   ```json
   "test": "vitest run",
   "test:watch": "vitest",
   "test:coverage": "vitest run --coverage",
   "test:e2e": "playwright test",
   "test:e2e:update": "playwright test --update-snapshots"
   ```

4. **Set up Supabase local stack** for integration tests:
   - `supabase init` to create `supabase/config.toml`
   - `supabase/seed.sql` with deterministic test users/salons/services/bookings
   - `tests/helpers/supabase-client.ts` that creates a service-role client pointed at `http://127.0.0.1:54321` when `NODE_ENV === 'test'`
   - Document workflow: `supabase start` → `npm test` → `supabase stop`
   - **Test isolation:** each test file resets only its own rows via a fixture-cleanup hook; never `TRUNCATE`. Or wrap each test in a transaction (requires `supabase-js` test fork or raw `pg` client).

5. **Configure MSW** for external-API mocking:
   ```bash
   npm i -D msw
   ```
   - Create `tests/mocks/handlers.ts` with handlers for `api.stripe.com`, `api.resend.com`, `generativelanguage.googleapis.com`, `api.mapbox.com`, `*.upstash.io`, `maps.googleapis.com`.
   - Create `tests/mocks/server.ts` (`setupServer(...handlers)`), boot in `tests/setup.ts` via `beforeAll/afterAll`.
   - Provides hermetic tests with no live API calls and no flakiness from rate limits or transient failures.

6. **Wire CI via GitHub Actions** — create `.github/workflows/test.yml`:
   - Triggers: `pull_request` to `main`, `push` to `main`
   - Steps: checkout → setup-node@20 → `npm ci` → `npm run lint` → `npm test` → upload coverage to Codecov
   - Separate job for Playwright: install Chromium → `npm run build` → start prod server → `npm run test:e2e`
   - Required status check: PRs cannot merge unless both jobs pass.

7. **Set initial coverage floor** (start gentle, raise quarterly):
   - `lib/auth/**`, `lib/queries/**`, `lib/automod.ts`, `lib/content-flags.ts`, `app/api/checkout/**`, `app/api/bookings/**`, `app/api/stripe/webhook/**`: **70% line coverage**
   - Other `lib/**`, `app/api/**`: **40% line coverage**
   - Fail CI below threshold; treat coverage drops as bugs.

8. **Stripe test mode discipline**:
   - Update `.env.example` to show `STRIPE_SECRET_KEY=sk_test_...` as the default; document `sk_live_*` only for production envvars in Netlify/Vercel.
   - Add `_docs/STRIPE_TESTING.md` covering local `stripe listen --forward-to localhost:3001/api/stripe/webhook` workflow + canned event replay (`stripe trigger checkout.session.completed`).
   - For unit tests, mock Stripe via MSW handlers returning standard fixture responses (don't hit Stripe sandbox in CI).

9. **Add contract tests for all 19 cron handlers** — these are silent-failure surfaces. Minimum: a `tests/cron/*.test.ts` per route that asserts (a) returns 200 when `CRON_SECRET` matches, (b) returns 401 when missing/wrong, (c) idempotent on repeated invocation, (d) handles empty result sets gracefully.

10. **Add test for Edge Functions** — Deno-native (`deno test supabase/functions/booking-reminder/index.ts`) since Edge Functions don't run in Node. Add `npm run test:edge` script that wraps Deno test runner. Currently zero coverage on these.

11. **Future: mutation testing with Stryker** — only after the baseline suite reaches ~70% on critical paths. Stryker reveals tests that pass vacuously. Defer until step 7 is done.

12. **Future: visual-regression scope expansion** — extend `e2e/visual/` to cover salon-detail, search-results, checkout, profile pages. Each adds ~27 baselines (3 viewports x ~9 sections). Budget: 1 spec file per route, ~30 minutes to author + baseline.

---

## Path

This file: `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/_audits/2026-05-16-ai-coding-traps-audit/5c-test-infrastructure.md`

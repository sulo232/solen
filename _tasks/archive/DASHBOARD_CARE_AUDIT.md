# Dashboard Care Audit — "what to be careful about" (2026-06-14)

Produced by a 5-dimension parallel audit (git-hygiene · dashboard-reality · money/data-integrity · design-system · cross-cutting). 47 items: 7 blocker, 17 high, 17 medium, 6 low. Read the BLOCKERS before touching anything; the rest is grouped by theme. File:line refs are against `/Users/sulo/Documents/solen`.

---

## 🛑 BLOCKERS — never do these (deduped from 7)

1. **Never `git add -A` / `git add .` / `git commit -a`.** `public/` is not gitignored, so a blanket add sweeps ~190 throwaway `public/solen-*.html` mockups + a 1 MB `_archive/monolith-v1.html` + the tracked junk `supabase/.temp/cli-latest` + half-finished untracked features into one commit. Netlify deploys from `main`, so it would also ship that pile live. → Stage by explicit path only.
2. **Never `git reset --hard` / `git checkout .` / `git stash -u` / `git clean -fd`.** 279 files are untracked = git has no blob = unrecoverable. `clean -fd` would delete the entire loyalty Phase 1, the salon-PDP rebuild (11 files), barber pages, discovery, and `business/checkout/fuer-salons/rewards` routes. To undo one tracked file use `git checkout -- <path>`; delete one untracked file by hand.
3. **Never `supabase db push` / `db reset`, and never trigger `.github/workflows/db-migrate.yml`** (it runs `supabase db push`). Migration history is name-diverged; push re-runs `013_drop_legacy_schema`'s `DROP ... CASCADE` = live data loss. The workflow is untracked + dispatch-only; leave it inert (no secrets, don't uncomment the `push:` trigger). All schema changes go through additive idempotent `apply_migration` (`IF NOT EXISTS` / `CREATE OR REPLACE`, no drops). This includes the tempting "just create `platform_settings`" fix. Refs: `.github/workflows/db-migrate.yml:43-49`, `_tasks/SCHEMA_DRIFT_AUDIT.md`, `_tasks/MIGRATION_REBASELINE_PLAN.md`.
4. **Don't trust / build on the dashboard `today_revenue` headline — it's structurally always ~0.** `app/api/dashboard/today/route.ts:76,84-86,130,134` selects `bookings.total_price`, a column that does not exist (the 5 real price columns are `final_price/price_paid/estimated_price/paid_amount/refunded_amount`). PostgREST returns undefined → every row sums 0. Fix the data layer (pick `price_paid` CHF for list value or `paid_amount/100` for cash) before redesigning the card. Do NOT add a `total_price` column by reflex.

---

## 🔀 Git / committing (the 300-file pile)

The pile is 21 modified + 279 untracked; ~190 untracked are mockup noise. The DANGER is entanglement + blast radius, not size. **Dashboard code is already committed** (44 tracked files; only `components-legacy/dashboard/LastMinuteManager.tsx` is new), so dashboard checkpoints ARE cleanly path-scopable.

**Safe checkpoint recipe (per dashboard commit):**
```
git status --short -- app/[locale]/dashboard components-legacy/dashboard   # see what changed
git add <only the specific files you touched>
git diff --cached --stat                                                   # confirm nothing from public/, _archive/, supabase/, lib/loyalty/, app/api/ leaked in
git commit -m "..."
```
Never `-a`/`-A`. Optional one-time cleanup so `git status` is readable: add `public/solen-*.html`, `public/_mockups/`, `_archive/`, `supabase/.temp/` to `.gitignore` in a tiny standalone commit.

- **[high] Keep the loyalty group ONE atomic commit.** It spans `app/api/stripe/{webhook,booking-pay-intent}/route.ts` + `app/api/promo/validate/route.ts` + `lib/validations.ts` + `lib/loyalty/` + `app/api/loyalty/` + `app/api/cron/loyalty-recompute/` + `app/[locale]/rewards/` + the `rewards` block in all 4 `messages/*.json` + `.github/workflows/cron-jobs.yml`. Committing the webhook without booking-pay-intent ships a half-wired real-money path.
- **[high] `007_stylist_availability.sql` is an ORPHAN** — uncommitted, NOT applied live (`to_regclass` null), no code reads the table, and its `StaffAvailability.tsx` fetches a route that doesn't exist. Decide: finish it (additive apply_migration, renumber to a post-live timestamp) or delete it. Don't commit-and-forget. Also its `CREATE POLICY` are non-idempotent (no `DROP POLICY IF EXISTS`) → re-run errors.
- **[high] Loyalty migration FILE names don't match LIVE versions.** Files are `20260614000000_*` / `20260614010000_*`; live versions are `125125` (phase2), `150624` (window_12mo), `165055` (phase1_perks), `171811` (self_guard) — and the last two have NO mirror file. Rename the 2 files to match + add the 2 missing mirrors (pull DDL from live). Files are documentation-only mirrors; migrations are already live via `apply_migration`.

---

## 💰 Money / data integrity (the #1 B2B trust risk)

- **[blocker] `today_revenue` reads non-existent `bookings.total_price` → always 0** (see Blocker #4).
- **[high] Revenue/PL/leaderboard/client-LTV read `bookings.price_paid` (pre-discount list price) → they now OVER-report after the loyalty discount.** `price_paid` is the sticker price written at booking creation; the member discount reduces the real charge later (`paid_amount`/`tier_discount_amount`, Rappen). Nothing reads `tier_discount_amount`/`applied_tier` yet. Salon NET is still correct (discount comes from Solen's commission, so `salon_payouts.net_amount` is right) — the gap is only in `price_paid`-based "gross revenue" cards. Per surface, decide: "cash paid" → `paid_amount/100`; "list value" → `price_paid` (and label it). Prefer `salon_payouts` (already discount-correct) for earnings widgets. Refs: `app/api/dashboard/{batch:64,barber-leaderboard:74,barber/pl-comparison:57-58}`, `app/api/salon/clients:41`, `app/api/admin/revenue:39,80`.
- **[high] Two live money-unit conventions coexist — a silent 100x trap.** `PLComparison.tsx:58` divides by 100 (expects **Rappen**); `StatCard`/home `fmtChf`/`formatCurrency`/earnings/revenue/analytics expect **CHF** (no division). Column units: `final_price`/`price_paid`/`estimated_price` = CHF; `paid_amount`/`refunded_amount`/`platform_fee`/`net_amount`/`vat_amount` = Rappen; `salon_payouts.{gross,commission,net}_amount` = CHF (webhook /100s before write). Never `reduce`/chart across the two bases without normalizing.
- **[high] Test-salon seed writes Rappen-magnitude (3000-9000) into the CHF `price_paid` column** (`app/api/admin/test-salon/seed/route.ts:87`). Every revenue number is 100x inflated under seed data — don't "fix" a reader with a `/100` to compensate; fix the seed (`randInt(30,90)`) or test against a real-booking salon.
- **[medium] Don't hardcode a commission rate.** Source = `platform_settings.commission`; only sanctioned fallback = `DEFAULT_COMMISSION_RATE_PERCENT=15`. After the loyalty change, `salon_payouts.commission_percent` is the EFFECTIVE (possibly reduced) per-row rate — read it per row, don't imply a flat 15%. The invoice template (`invoices/[payoutId]:106`) is the correct reference.
- **[high] Verify earnings/revenue/commission against the NEW `application_fee`-derived ledger.** The webhook now derives commission from `pi.application_fee_amount` (not rate×gross). Spot-check a discounted booking: reduced charge + reduced commission + UNCHANGED salon payout.
- **[low] Fabricated-data ban is currently respected** (walk-in analytics + leaderboard return honest 0, no `Math.random`/`sin`). Keep it: a new metric with no data source returns 0 + an INCOMPLETE_FEATURES note, never an invented value.

---

## 🧭 Dashboard reality / auth

- **[blocker] `platform_settings` table does not exist live** — commission/refund reads fall back to constants. To make commission-admin authoritative, add it via additive `apply_migration` ONLY, seed `commission.rate_percent`. Never `db push`.
- **[high] Middleware `adminOnlyPaths` is an incomplete hardcoded allowlist.** Missing: `commission-admin`, `homepage-admin`, `help-editor`, `admin-sandbox`, `discovery-posts`. A salon_owner can load those page SHELLS (data is still blocked by per-API `role==='admin'` 403, so it's a broken-empty page, not a leak). When adding any admin page: add its subpath to `middleware.ts:200-218` AND keep the API 403. The API check is the real security boundary.
- **[medium] Middleware auto-promotes salon-owning users to `salon_owner` on every `/dashboard` hit** (`middleware.ts:162-198`) — a DB write on the request path. Dashboard access = "owns a salon" OR `role==='salon_owner'`, and the role can mutate mid-session. Account for this if you tighten access; don't add more writes to middleware.
- **[medium] Several dashboard pages have empty `catch {}`** (violates the no-silent-error rule): `loyalty:35,66`, `discovery-posts:107`, `homepage-admin:68`, `segments:64`, `admin-sandbox:104`, `discovery-admin:129,597`, `settings:299`. Replace with `console.error("[Page] what:", err)` when you touch them. (`await res.json().catch(()=>({}))` is fine — defensive default, not a swallowed error.)
- **[medium] `discovery-posts` "my posts" is broken** — sends `creator=me` against a uuid-validated param → 400, swallowed by an empty catch. Pass the real user id; don't add `me` to the uuid schema.
- **[medium] Services photo UPLOAD is fixed; photo DELETE is still broken** (X-button only filters local state; no DELETE handler; `photos` never folded into the PATCH). INCOMPLETE_FEATURES entry is half-stale.
- **[low] G2 "appointment payment is a no-op" is STALE** — online-pay is now create-then-charge (pending→webhook→paid). Trust the code path, not the doc. An online-pay booking is NOT revenue until the webhook confirms it.
- **[low] Category dashboards (nail/spa/coiffeur) are thin shells** that delegate to sub-components keyed on `salonId`. Empty ≠ unbuilt — verify `/api/profile` returns a `salon_id` (and `getActiveSalon` picks the right one for multi-salon owners) before judging.
- **[medium] Walk-in metrics returning 0 are HONEST** (no data model for chair utilization / tips / retention). Don't fabricate them — that anti-pattern was already removed once.
- **[medium] Revenue/analytics use `price_paid` not `paid_amount`** — "booked value" vs "cash collected". Be explicit which a card means; don't sum `price_paid` next to `salon_payouts` net (different bases).

---

## 🎨 Design-system (dashboard "Aurora")

Good news: banned patterns are CLEAN today — no `border-l-4` colored channel bar, no `zap` icon, no Geist, no invented "Pro" tier, no dot-matrix chart. The active-nav (icon chip + pale fill, `DashboardLayout.tsx`) is the correct anti-bar pattern — **preserve it**.

- **[high] ⚠️ `_design-system/DASHBOARD_REBUILD_DECISIONS.md` DOES NOT EXIST** — yet CLAUDE.md + the `project_dashboard_rebuild_spec` memory both cite it as the LOCKED source of truth. Building "to the locked spec" = building from a phantom. The real on-disk docs are `_design-system/components/DashboardUI.md` (primitives) + `_design-system/_dashboard-triage.md`. Confirm the locked decisions with the owner before a rebuild.
- **[high] ⚠️ "Aurora Azure #4A8BE9" appears ZERO times in shipped code** — the live accent is `s-accent` #276EF1 (the customer Uber blue). The `project_dashboard_aurora_design` memory + `dashboard-v3` mockup use #4A8BE9, but it was never shipped. Use the `s-accent`/`s-accent-bright` token; if Azure is genuinely wanted, add it as a token first + confirm the hex with the owner. Don't hardcode a third blue inline.
- **[high] Don't copy any `components-legacy/dashboard/*` widget as a styling template** — 28 frozen-V2 widgets carry 182 `s-coral` refs now silently aliased to ink (`tailwind.config.js:81`), so they look "intentional B&W" but are dead color refs. Use the `DashboardUI` registry primitives (DashPanel/DashStatCard/DashButton/DashRow/DashStatusPill/DashQuickAction) instead.
- **[high] Don't reuse the green→orange gradient `#1B4D1B → #F3A864`** (dead V2 palette) on `TodayLiveCard.tsx:114,144` + `DashboardHeaderStrip.tsx:86` (comment even mislabels it "coral-amber" while the hex is forest green). Re-skin to the Aurora pastel-glow + `s-accent` recipe.
- **[medium] `s-coral-text` is an UNDEFINED token** (`DashboardHeaderStrip:117`, `TodayLiveCard`) → renders default color silently. And `HeadDiagram.tsx:96` uses `var(--coral, #1B4D1B)` (a "coral" var whose fallback is green). Replace with real tokens; screenshot-check after (tsc won't catch it).
- **[medium] Don't add a third component system** — recompose the registry primitives. No `if category === 'X'` styling branches (V3-D205 universal-components). New shared primitive ⇒ write its `.md` + COMPONENT_REGISTRY entry same turn.
- **[medium] The dashboard is OUTSIDE strict drift scope** (`_rebuilt_routes.json` has no dashboard glob; `_drift-report.md` has 0 dashboard hits). Passing `/solen-drift-check` is NOT evidence the dashboard is clean — manually grep `s-coral/s-amber/raw-hex` + screenshot. Add a route to `strict_globs` only AFTER it's clean.
- **[low] Chart hex is hardcoded** (acceptable for Recharts props) — reuse existing constants (`CHART_ACCENT #276EF1`, success `#16A34A`, error `#DC2626`); don't fork new blues. (Aside: customer `WhySolen.tsx:140,210` still paints stars orange `#F3A864` — should be `s-star #FFC32B`.)

---

## 🌐 Cross-cutting platform

- **[high] Every new dashboard string → all 4 `messages/*.json`.** They already drift (en −11, fr −18, it −29 keys vs de) and carry a literal `refundFlow._todo_translate` placeholder. next-intl renders the raw key path when a key is missing in the active locale → fr/it dashboard breaks. Add to de/en/fr/it in the same edit; check key-parity before "done".
- **[high] New dashboard reads/writes need owner-scoped authz.** Security comes from app-level `getActiveSalon` + `.eq('salon_id', …)`, NOT RLS, on the admin/service_role path. Any endpoint that forgets the salon filter, or uses the admin client without an ownership re-check, leaks another salon's data. New tables ⇒ enable RLS + owner-scoped policy in the same migration (follow `loyalty_status` / `promo_codes`).
- **[medium] Two PreToolUse hooks will halt you.** `pre-build-exists-check.sh` blocks new `page.tsx`/`route.ts`/migration/`public/solen-*.html` until `npm run exists <kw>` ran this turn (override: `touch .claude/exists-skip.flag`). `pre-edit-drift-gate.sh` blocks edits adding net-new hardcoded hex / arbitrary Tailwind / banned tokens. Editing an EXISTING file never trips exists.
- **[medium] New dashboard data routes need `export const dynamic = "force-dynamic"`** (on the ROUTE, not the page — all 42 pages are `"use client"`). Without it a route can be statically cached and serve stale numbers. Client fetch failures ⇒ `console.error("[Component] desc:", err)` + visible error state, never empty catch.
- **[low] `cron-jobs.yml` gained a monthly `0 4 1 * *` loyalty-recompute job.** `recompute_loyalty_status()` and `current_user_tier()` hardcode the SAME thresholds (gold=3, plat=6, 12mo, CHF 25) independently — change BOTH together or on-read gating and the monthly snapshot diverge. `tier_perks` %/use-caps are PLACEHOLDER — don't surface as final in the dashboard.

---

## Stale-doc corrections surfaced (worth fixing separately)
- `CLAUDE.md` + memory `project_dashboard_rebuild_spec` cite `_design-system/DASHBOARD_REBUILD_DECISIONS.md` which **does not exist**.
- Memory `project_dashboard_aurora_design` says Azure **#4A8BE9** is canonical; shipped code uses **#276EF1** (Azure is mockup-only, unbuilt).
- `INCOMPLETE_FEATURES.md`: G2 (online-pay no-op) and service-photo-upload entries are stale/half-stale; walk-in 0s are still accurate.

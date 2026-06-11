# Wave plan — open work + execution order

Generated 2026-05-28 after V3-D331.
Updated 2026-05-28 (V3-D332) after LLM council stress-test (Opus + Grok + Gemini) + user decisions on i18n / W14↔W15 swap / dashboard triage / W10 signup scope.

**Cross-reference:** each item tagged with work-type number from `WORK_TYPES.md` (1=surgical, 2=route sweep, 3=component sweep, 4=ground-up rebuild, 5=new primitive, 6=major IA shift).

---

## Locked user decisions from council round (V3-D332)

| Decision | Choice | Impact |
|---|---|---|
| **i18n posture** | Multilingual from W9 onwards (DE/EN/FR/IT in parallel) | All wave estimates × 1.5 |
| **W14 ↔ W15 order** | Swap — booking flow before map | Revenue path > discovery enhancement (Opus + Grok) |
| **/dashboard scope** | Triage 285 findings → blocking ships as W14.5 "operator-UX correctness" | Cannot sell /fuer-salons while operator UX is broken (Opus) |
| **W10 signup scope** | Real Supabase wiring (6-10h) | Production signup, no manual follow-up debt |

**Opus's contrarian "you'll regret this" prediction (taken seriously):** spacing audit (W12) will reopen the 3 already-swept routes — make it READ-ONLY discovery, fix sweep separate (now W12.5).

---

## Current state snapshot

- **91 files** in `_rebuilt_routes.json` strict_globs (drift-locked)
- **698 open INFO findings** in `_pending-migration.md` (276 A7 uppercase + 227 A8 tracking + 195 A9 accent)
- **0 hard breakages** (A4/A5/A6/B1/B2/B5 strict at zero)
- **3 routes phase-2 swept this session:** /warum-solen, /de homepage, /fuer-salons V1
- **15 component docs** in `_design-system/components/`
- **Carve-outs** (separate sessions): booking flow (W14 now), Solen-originals (W13)

---

## Core routes (locked for W16 STRICT flip)

Per Opus: W16 is a moving goalpost without this list. Locking now.

```
/de                              # homepage
/de/salon/[slug]                 # PDP
/de/search                       # search results
/de/fuer-salons                  # canonical B2B
/de/warum-solen                  # consumer-WHY
/de/coiffeur                     # 6 category landings (W11)
/de/barbershop
/de/nails
/de/spa
/de/makeup
/de/waxing
/de/entdecken                    # discovery feed
```

W16 STRICT flip blocked until `_pending-migration.md` count on this list = 0.
All other routes: A7-A12 stays INFORMATIONAL.

---

## Wave 8 — DONE this session (V3-D330 + V3-D331)

| # | Item | Type | Status |
|---|---|---|---|
| 1 | LOCKFILE §1.5 / §2.5 / §11 + V3-D331 eyebrow policy | 1 surgical (doc) | ✅ |
| 2 | Drift rules A7-A12 added (INFORMATIONAL) | 1 surgical (config) | ✅ |
| 3 | /warum-solen sweep (124 → 59 INFO) | 2 route sweep | ✅ |
| 4 | /de homepage sweep | 2 route sweep | ✅ |
| 5 | /fuer-salons V1 build | 4 ground-up rebuild | ✅ |
| 6 | Dot-eyebrow sweep (8 callsites, 5 files) | 3 component sweep + 2 route sweeps | ✅ |
| 7 | WORK_TYPES.md taxonomy doc | 1 surgical (doc) | ✅ |
| 8 | WAVE_PLAN.md (this file) | 1 surgical (doc) | ✅ |
| 9 | V3-D332 council stress-test + plan revisions | 1 surgical (doc) | ✅ |

**Commit unit:** all items in 1 wave-PR with per-item commits. When verified, awaiting your explicit "commit" instruction.

---

## Wave 9 — Salon PDP + sub-PDPs (multilingual from start)

| # | Item | Type | Realistic time | Notes |
|---|---|---|---|---|
| 1 | /salon/[slug] sweep (DE) | 2 route sweep | 1h | Drop decorative eyebrows, accent narrowing |
| 2 | Pattern 3 hero rebuild (search-card over full-bleed photo) | 4 ground-up rebuild (hero portion) | 1.5h | Salon's existing cover photo, no AI placeholders needed |
| 3 | /salon/[slug]/barber/[barberSlug] | 2 route sweep | 30 min | |
| 4 | /salon/[slug]/gift-card | 2 route sweep | 30 min | |
| 6 | /salon/[slug]/reviews | 2 route sweep | 30 min | |
| 7 | EN/FR/IT translation pass for all 5 routes | 1 surgical × per locale | 1.5h | Multilingual decision applied |
| 8 | A11y + perf verifier gates per route | 1 surgical × per route | 30 min | Lighthouse a11y ≥95, LCP ≤2.5s mobile |

**Realistic total:** ~6h (was 2.25h optimistic) · per-route commits inside W9 wave-PR · 1 atomic merge.
**Verification gates per route:** before/after screenshot mobile + desktop, Lighthouse a11y ≥95, LCP ≤2.5s on mobile, no contrast failures, user visual sign-off.

---

## Wave 10 — /fuer-salons V2 + B2B fusion + real Supabase signup

| # | Item | Type | Realistic time | Notes |
|---|---|---|---|---|
| 1 | Pull /partner Categories grid into /fuer-salons | 4 section insert | 45 min | 6-category grid |
| 2 | Replace /fuer-salons Pricing with /partner competitor comparison chart | 4 section replace | 45 min | 1% callout |
| 3 | Pull /partner Social proof badges | 2 section insert | 30 min | 4 trust badges |
| 4 | **Real Supabase signup form** — replaces JoinUsCard | 4 ground-up rebuild + DB schema | 6-10h | Per user decision: production signup. Email confirm + Stripe trial flow + RLS policies |
| 5 | 301 /business → /fuer-salons (next.config.js + Netlify rules) | 6 major IA shift | 30 min | |
| 6 | Flip /partner redirect target → /fuer-salons | 6 major IA shift | 15 min | |
| 7 | Header dropdown anchor audit (#how / #anmelden / #pricing) | 1 surgical | 15 min | |
| 8 | Internal link grep + update (`/business`, `/partner` hrefs) | 2 batch sweep | 30 min | |
| 9 | Sitemap + SEO alternates update | 1 surgical | 15 min | |
| 10 | EN/FR/IT translation pass | 1 surgical × per locale | 2h | |
| 11 | A11y + perf verifier gates | 1 surgical | 30 min | |

**Realistic total:** ~12-16h (was 2.5h optimistic) · split across 2 sessions · per-route commits, wave-as-PR.
**Verification:** curl old URLs → confirm 301 → new URL; visual diff /fuer-salons before/after; Stripe test-mode signup E2E; user sign-off on B2B IA.

---

## W11-prep — Photo strategy spike (BLOCKS W11)

| # | Item | Time | Notes |
|---|---|---|---|
| 1 | CDN decision: Supabase Storage transforms vs Cloudinary vs Next.js Image only | 30 min | |
| 2 | AI placeholder source: Midjourney / DALL-E / Stable Diffusion + license terms | 15 min | |
| 3 | Quality gate: manual review per category before sweep | 15 min | |

**Total:** ~1h. Blocks W11 entirely.

---

## Wave 11 — 6 category landings + Pattern 2 imagery

| # | Item | Type | Realistic time | Notes |
|---|---|---|---|---|
| 1 | Generate AI placeholder hero photos × 6 | Asset prep | 1h | After W11-prep decision |
| 2 | /coiffeur sweep + Pattern 2 full-bleed hero | 2 + 4 hero rebuild | 1.5h | Establishes pattern + DE/EN/FR/IT copy |
| 3 | /barbershop | 2 route sweep | 1.5h | Pattern established |
| 4 | /nails | 2 route sweep | 1.5h | |
| 5 | /spa | 2 route sweep | 1.5h | |
| 6 | /makeup | 2 route sweep | 1.5h | |
| 7 | /waxing | 2 route sweep | 1.5h | |
| 8 | A11y + perf verifier gates per landing | 1 × 6 | 1h | Lighthouse a11y ≥95, LCP ≤2.5s with hero image |

**Realistic total:** ~11h (was 2.5h optimistic — Opus called this "25min/landing impossible") · per-route commits.

---

## Wave 12 — Proportional spacing audit (READ-ONLY discovery)

Per Opus contrarian: separate discovery from fix.

| # | Item | Type | Time | Notes |
|---|---|---|---|---|
| 1 | Measure spacing-to-text ratios on core routes via Playwright getBoundingClientRect | 1 surgical (script) | 30 min | Output to `_design-system/_spacing-drift.md` |
| 2 | Generate findings report — routes where ratio > 3× | 1 surgical | 30 min | |

**Total:** ~1h. READ-ONLY — no code changes. Findings feed W12.5.

---

## Wave 12.5 — Spacing fixes (separate from discovery)

| # | Item | Type | Estimate | Notes |
|---|---|---|---|---|
| 1 | Per-finding tighten section py-* | 1 surgical × ~10 | TBD after W12 measures | Will likely reopen the 3 already-swept routes per Opus's prediction |

**Realistic total:** TBD — set after W12 reports. Don't pre-estimate.

---

## Wave 13 — Solen-originals stream

| # | Item | Type | Realistic time | Notes |
|---|---|---|---|---|
| 1 | /entdecken sweep | 2 route sweep | 1h | TikTok-stream feed |
| 2 | /entdecken Pattern 5 magazine-grid mode (`?view=grid`) | 4 ground-up | 2h | Toggle mode |
| 3 | /loyalty/stamp | 2 route sweep | 1h | StampCard already swept |
| 4 | /referral/[code] | 2 route sweep | 1h | |
| 5 | **/onboarding/salon (bumped to Type 4 partial rebuild)** | 4 form-heavy partial rebuild | 3h | Per Opus + my concern — 100 findings + form state |
| 6 | /staff-invite | 2 route sweep | 45 min | |
| 7 | EN/FR/IT translation pass | 1 surgical | 2h | |

**Realistic total:** ~11h (was 4h) · split across 2 sessions.

---

## Wave 14 — Booking flow (SEPARATE SESSION, was W15, now first per Opus)

Revenue path > map. Per Opus + Grok both.

| # | Item | Type | Realistic time | Notes |
|---|---|---|---|---|
| 1 | Capture Fresha booking flow state diagram | Investigation | 1h | Service → time → staff → review → deposit → confirm |
| 2 | Stripe test-mode setup + verification | 1 surgical (env) | 1h | Explicit, not implicit |
| 3 | /salon/[slug]/booking/** rebuild | 4 ground-up | 6-8h | Full flow, mobile-first |
| 4 | /checkout (137 findings) | 4 ground-up | 4h | |
| 5 | /confirmation | 4 ground-up | 2h | |
| 6 | /walk-in-pay | 2 route sweep | 1h | |
| 7 | /tip/[bookingId] | 2 route sweep | 1h | |
| 8 | /bookings/[id]/approve-increase | 2 route sweep | 1h | |
| 9 | /bookings/[id]/respond-adjustment | 2 route sweep | 1h | |
| 10 | EN/FR/IT translation pass | 1 surgical | 3h | |
| 11 | A11y + perf verifier gates | 1 × N | 1h | |
| 12 | E2E test in Stripe test mode | 1 surgical | 2h | |

**Realistic total:** 3-5 days polish on existing; 1-2 weeks if rebuilding (Opus). Need to decide: polish or rebuild.
**Stripe risk:** revenue-critical. Per Opus: "isolate Stripe/Supabase mutations behind feature flags or separate PRs even within a single route."

---

## Wave 14.5 — /dashboard operator-UX correctness (BLOCKING ONLY)

Per Opus: cannot sell /fuer-salons while operator UX is broken.

| # | Item | Type | Time | Notes |
|---|---|---|---|---|
| 1 | Subagent triages 285 /dashboard findings → blocking vs cosmetic | Investigation | 1h | |
| 2 | Ship blocking fixes only (broken calendar / booking mgmt / payout settings) | 1 surgical × N (TBD from triage) | 3-6h | Estimate after triage |
| 3 | Cosmetic findings → defer to indefinite future wave | (no work) | 0 | |

**Realistic total:** 4-7h. Must complete before W10 /fuer-salons V2 launches signup (otherwise sellers sign up to broken operator UX).

**Sequencing note:** W14.5 actually needs to happen BEFORE W10 ships signup, not after W14. Will renumber to W10.5 if user confirms.

---

## Wave 15 — Map primitive (was W14, now after booking)

| # | Item | Type | Realistic time | Notes |
|---|---|---|---|---|
| 1 | User pick: (i) toggle on /search / (ii) separate /search/map / (iii) different | 6 IA decision | 15 min | |
| 2 | Build MapView primitive (Mapbox + react-map-gl + Swiss tiles + clustering) | 5 new primitive | 2-3 days | Per Opus realistic estimate |
| 3 | URL state + mobile gestures + 1000-marker perf optimization | 5 new primitive | 1 day | |
| 4 | Component doc `_design-system/components/MapView.md` | 1 surgical (doc) | 30 min | Same turn rule |
| 5 | COMPONENT_REGISTRY.md entry | 1 surgical (doc) | 10 min | |
| 6 | Wire to SearchTemplate via `?view=map` | 4 partial rebuild | 1 day | Conditional render |
| 7 | 4 follow-up decisions (cluster threshold / viewport / empty state / loading) | 1 surgical × 4 | 1h | |
| 8 | A11y verifier gate (keyboard nav, screen reader for map) | 1 surgical | 1h | |

**Realistic total:** 3-5 days (was 1 day — Opus called optimistic).
**New deps:** `mapbox-gl`, `react-map-gl`, Mapbox token in `.env`.

---

## Wave 16 — Phase 3: flip drift to STRICT

| # | Item | Type | Time | Notes |
|---|---|---|---|---|
| 1 | Verify `_pending-migration.md` count = 0 on the locked core routes list above | 1 surgical (verify) | 15 min | |
| 2 | Drop "INFO " prefix from A7-A12 in check.py | 1 surgical (config) | 10 min | |
| 3 | Update LOCKFILE §2.5 to note phase 3 lock | 1 surgical (doc) | 10 min | |
| 4 | Add CI fail-on-strict-finding hook (Netlify build script) | 1 surgical (config) | 30 min | |
| 5 | Verify intentional violation → CI fails (smoke test) | 1 surgical | 15 min | |

**Total:** ~1.5h. Future regressions blocked at commit time.

---

## Wave 17 — Misc cleanup (anytime)

| # | Item | Type | Time | Notes |
|---|---|---|---|---|
| 1 | framer-motion 3-keyframe spring warning fix | 1 surgical | 30 min | Chip spawned |
| 2 | Component docs gap audit (15 vs N in registry) | 1 surgical | 1h | |
| 3 | /partner sweep if not absorbed by W10 fusion | 2 route sweep | 30 min | Likely redirected, skip |
| 4 | WhySolen.tsx — keep + clean OR delete | 1 surgical OR 6 IA | 15 min | Unused |
| 5 | A12 false-positive audit on greenfield route | 1 surgical | 30 min | Per my concern |

---

## Out of scope (revised per Opus's triage rule)

| Surface | Status | Rationale |
|---|---|---|
| `/dashboard/*` cosmetic findings | **Deferred indefinitely** | Per Opus: triage blocking → W14.5; cosmetic → defer freely |
| `/auth/*` | **Deferred** (was "forever") | Auth carve-out — separate auth-aesthetic session. Reclassify per Opus framing. |
| `/dev/*` | Out-of-scope (dev only) | Dev surfaces don't ship |
| `/legal/*`, `/impressum`, `/privacy`, `/terms` | Stable — already swept W6 | Minor A1/A2 noise OK |

---

## Wave order rationale (revised V3-D332)

```
W8  ✅ DONE (this session)
W9  → Salon PDP + multilingual + verifier gates              ← NEXT
W10 → /fuer-salons V2 + Supabase signup + 301 redirects
W10.5 (was W14.5) → /dashboard triage + blocking-only fixes   ← BEFORE signup goes live
W11-prep → Photo strategy spike
W11 → 6 category landings + Pattern 2 + AI placeholders
W12 → Spacing audit (READ-ONLY discovery)
W12.5 → Spacing fixes (separate sweep)
W13 → Solen-originals stream
W14 → Booking flow (SEPARATE SESSION, revenue path)           ← was W15, now first
W15 → Map primitive (after booking ships money)               ← was W14, now last feature
W16 → Flip drift A7-A12 to STRICT
W17 → Misc cleanup (anytime)
```

**Sequencing rules from WORK_TYPES.md** (now refined per Opus):
- Within a wave: surgical first, ground-up rebuild last
- A11y + perf are PER-WAVE VERIFIER GATES, not separate waves (Opus's sharper framing)
- Per-route commits inside wave-as-PR (Opus disagreed with Grok's per-wave splits)
- New primitive (W15) gets its own wave
- Booking flow separate session (W14)

---

## Commit + push policy (refined V3-D332)

Per Opus: "Per-route commits, wave-as-PR. Bisection on a regression in W13 (5 routes) is impossible at wave-commit granularity. Per-route commits → wave-level PR → atomic merge gives you both bisection and atomic UX consistency. The commit overhead is ~5min/route; the rollback overhead at wave granularity is hours."

**Rule:** every route gets its own commit. Wave merged as a single PR (squash if you want clean main history; otherwise preserve per-route commits). Stripe/Supabase mutations behind feature flag or separate PR even within a single route.

**User explicit:** NEVER commit or push automatically. User says "commit" explicitly. User says "push" explicitly (separate). Each push hits Netlify deploys + costs money.

---

## Rollback procedure (added V3-D332 per my concern)

If a wave introduces a regression post-merge:
- **Type 6 (major IA shift)** — revert the redirect config commit. Clear Netlify edge cache (`netlify deploy --prod --build`). Verify old URLs work again.
- **Type 4 (ground-up rebuild)** — revert merge commit. Reopen wave branch. Iterate. Re-merge.
- **Type 5 (new primitive)** — revert primitive + consumer commits. Component doc + registry entry stay (zombie OK — registry is forgiving).
- **Type 2/3 (sweeps)** — git revert per-route commit. Other routes in wave keep their fixes (per-route commit granularity makes this safe).

---

## Changelog

- **2026-06-12 — PHASE PLAN + W14/W14.5:** booking flow rebuilt to mockup 20 (services-only step → StaffStep → Zeit → Haare → Bezahlen, no progress UI, Atelier grouped cards) + pay-in-salon e2e verified; W14.5 dashboard triage DONE (verdict signup-ready; 1 blocker — blank setup-banner labels — fixed; 2,248 cosmetic findings deferred). Waves regrouped into 6 phases (see top). /entdecken items cancelled (Discovery NO-TOUCH lock).
- **2026-05-28 — V3-D331 (Wave 8 done):** dot-eyebrow sweep across 5 files + LOCKFILE §2.5 expansion + drift rule A12.
- **2026-05-28 — V3-D332 (council stress-test):** Opus + Grok + Gemini consulted; user picked 4 decisions; plan revised. W14 ↔ W15 swap, multilingual from W9, /dashboard triaged, real Supabase signup, W12 split into discovery + fix, per-route commits, rollback procedure added, core routes locked.

---

## Update protocol

After each wave completes:
1. Mark items ✅ in this file
2. Add an entry to changelog (date + wave number + summary)
3. Re-snapshot the current state numbers (drift counts, swept count)
4. Verify next wave's scope still applies given what shipped

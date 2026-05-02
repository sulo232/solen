# Solen — Build Map

> Sequenced rollout plan. Takes the 63 locked design decisions in `_tasks/SOLEN_DESIGN.md` §20 and turns them into a build order.
>
> **This is a thin map** — phases, dependencies, scope estimates, entry/exit criteria. Each phase gets its own detailed sub-plan written **only when that phase starts**, so Phase N+1 sees what Phase N actually built.
>
> **Source of truth** = `_tasks/SOLEN_DESIGN.md` (Q1–Q63 locks). This file just sequences them.

---

## Working principles

1. **Foundation before features.** Token contract + folder hygiene first. No surface work until tokens are right — otherwise every component built before token migration needs revisiting.
2. **Primitives before layouts.** EmptyState family + LiveActivityCard + density prop + focus ring need to exist before profile/dashboard refactors consume them.
3. **State coverage before page polish.** Loading / empty / error / success grammars (Q19–Q22, Q36) get implemented as a primitive set so each page surface plugs them in instead of inventing per-page versions.
4. **Consumer before B2B.** Profile + discovery + salon detail land first — they're the public face. Dashboard shell + density work follows because B2B audience is smaller and tolerates more iteration.
5. **One phase committed at a time.** Each phase ships as its own series of small commits (per `CLAUDE.md` surgical-edits rule). No big "redesign" PR.
6. **Drift cleanup is continuous, not a phase.** Whenever a phase touches a file, it fixes any drift in that file (banned classes, retired patterns) per the design lock. No separate "drift sweep" phase — that approach failed in V2.

---

## Phase overview

| Phase | Name | Locks fed | Blocks | Wall-clock estimate |
|---|---|---|---|---|
| **0** | Token contract + folder hygiene | Q23, Q24, Q43, Q45, Q47, Q62 (foundation slice only) | Everything | ~1 day |
| **1** | State primitives | Q18, Q19, Q20, Q21, Q22, Q36, Q60 | Phases 2–7 | ~2 days |
| **2** | Brand primitives | Q25, Q26, Q28, Q30, Q32, Q35, Q40, Q41, Q42, Q43, Q46, Q47, Q48 | Phases 3–6 | ~2 days |
| **3** | Profile shell + Live-Activity | Q58, Q59 | Phase 5 (loyalty surface 2 reuses meta-strip pattern) | ~2 days |
| **4** | Home + discovery surfaces | Q49, Q50, Q51 | — | ~2 days |
| **5** | Salon detail + booking flow | Q52, Q53, Q54, Q55, Q56, Q57 | — | ~3 days |
| **6** | Dashboard shell + density | Q61, Q62, Q63 | — | ~2 days |
| **7** | Polish + drift sweep + retired-pattern audit | Cross-cutting | — | ~1 day |

**Total estimate:** ~15 working days (rough). Actual will vary by interrupts.

---

## Phase 0 — Token contract + folder hygiene

**Why first:** every Q-lock from Q23 onward references specific tokens (coral `#E8624A`, amber `#F3A864`, ink `#1A1209`, Anton, Figtree). If the token layer drifts during a feature phase, fixing it later means re-touching every component built in between. Lock the contract now, test it, then build on it.

**Goal:** `tailwind.config.js` + `app/globals.css` + `_rules/SOLEN_UI.md` reflect the locked Anton + Figtree + coral + amber + ink-3-scale token contract. All retired tokens (`Bebas Neue`, `Syne`, `DM Sans`, V2 green `#1B4D1C`, V2 peach `#F5A962`, dark mode classes) removed from config (not from code yet — that's the surface phases).

**Entry criteria:** all 63 §20 locks present in `SOLEN_DESIGN.md`. ✅ Met.

**Exit criteria:**
- `tailwind.config.js` exports the locked token names exactly (`s-coral`, `s-amber`, `s-ink`, `s-ink-2`, `s-ink-3`, `s-bg`, `s-bg-sunken`, `s-border`, status tokens)
- `app/globals.css` `:root` has the canonical hex values per Q23+Q45
- Anton + Figtree loaded via `next/font` in `app/layout.tsx`; old font imports removed from layout (not from components — Phase 1+ removes per-file)
- `_rules/SOLEN_UI.md` matches `SOLEN_DESIGN.md` (no contradictions; if both exist with conflicting values, `SOLEN_DESIGN.md` wins per CLAUDE.md)
- Folder hygiene: `_audits/`, `_tasks/archive/`, `_tasks/completed/` exist; no scratch files at repo root other than agreed list (per `_audits/STRUCTURE_AUDIT.md` if it exists)
- `solen-coral.html` preview renders without warnings

**Scope:** ~3-5 small files edited. No component touches yet. Low risk.

**Drift NOT removed in this phase:** components still using `Fraunces`/`Bebas Neue`/`Syne`/`DM Sans` className references — they keep working because the className just won't resolve anymore (silent fallback), and Phase 1+ touches those files anyway. Removing them all in Phase 0 = 100+ component touches with zero feature value.

---

## Phase 1 — State primitives

**Why second:** every page surface phase (3–6) consumes loading / empty / error / focus / motion primitives. Build them once, plug them into surfaces.

**Goal:** the state grammar locked in Q18–Q22, Q36, Q47, Q60 exists as reusable components.

**Locks fed:**
- Q18 disabled (token swap to `s-ink-3`/`s-ink-4`)
- Q19 state lockset (happy / empty-FTU / empty-filtered / error / loading)
- Q20 loading = skeleton (shape-of-real-content)
- Q21 empty illustration grammar (line-coral SVG)
- Q22 error grammar (inline + toast)
- Q36 5 celebration moments (booking, payment, favorite, loyalty, review)
- Q47 focus-visible ring (2px coral + 2px outside offset)
- Q60 EmptyState 3-treatment family (FTU full-screen / no-upcoming inline / filtered neutral)

**Components built (NEW):**
- `components/ui/EmptyStateFTU.tsx` (~80L)
- `components/ui/EmptyStateInline.tsx` (~60L)
- `components/ui/EmptyStateFiltered.tsx` (~50L)
- `components/ui/Skeleton.tsx` (shape-of-real-content variants for SalonCard, BookingRow, ReviewRow)
- `components/ui/InlineError.tsx` (~40L)
- `components/ui/Toast.tsx` (action-result toast, slides up dark-ink)
- `components/ui/CelebrationRing.tsx` (Q36 reusable: coral ring expand + checkmark scale-in + toast slide; configurable durations)
- `components/ui/FocusRing.css` or Tailwind plugin extending `:focus-visible`

**Components updated:**
- Any component currently importing a per-file `<EmptyState>` swaps to one of the 3 new ones. Audit grep: `grep -rn "EmptyState\|<Empty" components/`.

**Entry criteria:** Phase 0 complete. Coral + amber tokens resolve correctly.

**Exit criteria:**
- All 4 state primitives + 3 EmptyState variants + CelebrationRing render in `solen-coral.html` preview gallery
- `:focus-visible` ring shows on every focusable element (button, link, input, custom Tab-stop) when reached via keyboard but NOT on mouse-click
- One canonical loading skeleton for SalonCard exists; future per-page loading states reuse via prop
- Toast queue tested with 3+ rapid fires (no overlap chaos)

**Scope:** 8 new components, 1 CSS layer. Existing pages still use their old empty/loading variants — Phase 3+ swaps them per page.

---

## Phase 2 — Brand primitives

**Goal:** the brand-fingerprint pieces (signature lockup, card anatomy, button labels, motion timing, spacing scale, hover classes, no-truncation rule, hit area, focus ring, numeric formatting) get locked into shared components/utilities so page surfaces consume them.

**Locks fed:**
- Q25 button labels (single verb default, expand for $/time/count)
- Q26 SalonCard anatomy (square cover, ab-time, no glow)
- Q28 + Q43 numerics (tabular only on movers, CHF prefix)
- Q30 shadow tiers (3 elevations + border-only for in-flow)
- Q32 spacing scale (9 sanctioned 4–64 + 2 hero 80/96)
- Q35 motion (slide default + morph for home-card → salon-detail)
- Q40 hover only on 4 classes (CTAs, links, cards, nav-icons)
- Q41 + Q42 NO truncation (full text in EN/DE/FR/IT)
- Q46 48×48 hit area + ≥8px gap
- Q47 focus-visible ring (already covered Phase 1; verify here)
- Q48 signature lockup (eyebrow + Anton headline + Fresha-flow home search)

**Components built (NEW or refactored):**
- `components/ui/SignatureLockup.tsx` (eyebrow + Anton headline; the brand fingerprint per Q48)
- `components/ui/SolenCard.tsx` (canonical card per Q26 + Q30 in-flow shadow)
- `components/ui/Button.tsx` (variants per Q25 button-label rules + Q40 hover class)
- `lib/format.ts` (CHF prefix + tabular numerics helpers per Q28/Q43)
- Tailwind extension: spacing scale per Q32, shadow tiers per Q30, motion timing tokens per Q35

**Entry criteria:** Phase 0 + Phase 1 complete.

**Exit criteria:**
- Anton uppercase + tracked coral eyebrow renders identically anywhere `SignatureLockup` is used
- One canonical SalonCard exists; existing 5+ card variants in `components/cards/**` audited and migrated or marked for migration in their owning phase
- All buttons in new code use the canonical Button variant (page surfaces migrate per phase, not all at once)
- Tabular numerics fire on price tags, time slots, count chips
- No truncation on any new component — text wraps full

**Scope:** ~5 new shared components, 1 utils file, Tailwind config extension.

---

## Phase 3 — Profile shell + Live-Activity

**Goal:** consumer profile page (`/[locale]/profil`) refactored to Q58 hybrid layout (Insta header + Sei-Hiro grouped lists + event-driven Live-Activity hero card with 6 priority states). Loyalty stamp 3-surface system (Q59) wired in.

**Locks fed:** Q58, Q59. Reuses primitives from Phases 1–2.

**Components built (NEW):**
- `components/profile/LiveActivityCard.tsx` (~150L, 6 states + priority + websocket + reduced-motion)
- `components/profile/ProfileGroupedLists.tsx` (~120L, Sei-Hiro card-list pattern)
- New route page: `/[locale]/profil/stempel/page.tsx` (loyalty hero card + active list + redeemed history)
- API: `/api/profile/live-state` (resolves which Live-Activity state qualifies)

**Components affected:**
- `components/ProfilePage.tsx` (1159L) — refactored, 5-tab `ProfileTabs` removed
- `components/profile/ProfileHero.tsx` (99L) — gradient avatar shifts to right of name+bio
- `components/loyalty/StampCard.tsx` (137L) — confetti animation block + import dropped (per Q59 anti-confetti rule)
- Bottom-nav components (`FloatingNavPill`, etc.) deprecated for web rendering (per Q58 hamburger-only lock)

**Entry criteria:** Phases 0–2 complete.

**Exit criteria:**
- `/[locale]/profil` renders new layout with Live-Activity card showing the resolved priority state
- Live card morphs (cross-fade + 4px Y slide, 400ms per Q35) ONLY on data change, not on rotation (no setInterval rotation)
- Reduced-motion honored: instant swap, no animation
- `/[locale]/profil/stempel` exists with hero + active + redeemed sections
- StampCard reward unlock fires Q36 celebration (1200ms ring + amber checkmark + dark-ink toast), no confetti
- Mobile: bottom-nav components do NOT render on web routes; hamburger header + avatar dropdown is the only nav

**Scope:** 2 new components + 1 new route + 1 new API. Major refactor of ProfilePage.tsx.

---

## Phase 4 — Home + discovery surfaces

**Goal:** home page above-fold + 8-section rhythm + carousel-per-section pattern locked in Q49–Q51. Existing home `/[locale]/page.tsx` gets the new structure.

**Locks fed:** Q49 (stacked above-fold, 3 quick-action chips, no hero photo), Q50 (Airbnb-pattern carousel-per-section, 2.5/3.5/4.5-up scroll-snap), Q51 (8 home sections + Recently Viewed; admin toggles + affinity reorder).

**Components built/refactored:**
- `components/home/AboveFold.tsx` (Q48 signature lockup + Fresha-flow home search + 3 quick-action chips per Q49)
- `components/home/SectionCarousel.tsx` (canonical scroll-snap carousel per Q50; reused by all 8 sections)
- 8 section components per Q51 (Last-Minute, Nearby, Per-category, Discover, Browse-by-City, Spotlight, Testimonials, Trust Stats) + conditional Recently Viewed
- `platform_settings.homepage_sections` admin toggle wiring

**Entry criteria:** Phases 0–2 complete.

**Exit criteria:**
- Home above-fold matches `solen-coral.html#q49`
- All 8 sections render with carousel-per-section pattern
- Admin can toggle sections on/off via `platform_settings`
- Affinity reorder works for Per-category section (signed-in users see relevant categories first)

**Scope:** 1 above-fold + 1 reusable carousel + 8 section components + admin toggle UI.

---

## Phase 5 — Salon detail + booking flow

**Goal:** `/salon/[slug]` page (Q52 hero + Q53 booking entry + Q54 reviews) and the 3-step booking wizard (Q55 + Q56 + Q57 confirmation).

**Locks fed:** Q52, Q53, Q54, Q55, Q56, Q57.

**Components affected:**
- `components/salon/SalonHero.tsx` (180L) — carousel evolves to A + D-on-tap fullscreen gallery sub-page
- `components/salon/SalonSectionNav.tsx` (124L) + `SalonTabBar.tsx` (67L) — Fresha-pattern sticky scrollspy with sliding coral underline
- `components/salon/SalonMobileCTA.tsx` (92L) + `SalonSidebar.tsx` (136L) — sticky bottom + sidebar both route to `/book/[slug]`
- `components/salon/SalonReviews.tsx` (383L) — splits: summary on detail + new `/salon/[slug]/reviews` sub-page
- `components/booking/BookingWizard.tsx` (172L) — 4-step → 3-step
- DELETE: `components/booking/ConfirmationStep.tsx` (194L) + `PaymentStep.tsx` (216L) — merged into:
- NEW: `components/booking/PayConfirmStep.tsx` (~250-300L)
- `components/booking/BookingSuccess.tsx` — Q57 layered moment (CelebrationRing + summary + 3 utility chips + secondary CTA)
- ReviewPrompt scheduled-cron-only (no immediate render on confirmation)

**Entry criteria:** Phases 0–2 complete. Phase 3 is helpful but not blocking.

**Exit criteria:**
- Salon detail page matches `solen-coral.html#q52`
- Booking wizard collapses to 3 steps with `Schritt N / 3` progress bar
- Pay+Confirm screen shows summary card + cancel policy + payment method selector
- `BookingSuccess` shows celebration ring + "Bestätigt · #<id>" + summary + 3 utility chips (Calendar / Directions / Share); NO upsell, NO auto-redirect, NO ReviewPrompt on this screen
- `/salon/[slug]/reviews` sub-page renders filterable infinite-scroll review list with reply threads expanded
- NO truncation anywhere (full EN/DE/FR/IT text)

**Scope:** ~6 component refactors + 2 new components + 2 deleted + 1 new sub-page route.

---

## Phase 6 — Dashboard shell + density

**Goal:** B2B dashboard (`/dashboard`) gets the viewport-split shell (Q61), grouped sidebar/drawer (Q61), same-tokens differentiation (Q62), and contextual density per surface (Q63).

**Locks fed:** Q61, Q62, Q63.

**Components built (NEW):**
- `components/dashboard/TodayLiveCard.tsx` (~250L mobile-only)
- `components/dashboard/DashboardHeaderStrip.tsx` (~120L desktop sticky stats strip)
- `components/dashboard/DashboardSidebar.tsx` (~200L desktop shell with category-tools injection)
- `components/dashboard/DashboardDrawer.tsx` (~150L mobile drawer wraps Sidebar groups)
- `hooks/useDashboardLiveState.ts` (~80L SWR + websocket)

**Components affected:**
- `components/dashboard/DashboardLayout.tsx` — sidebar shell
- `app/[locale]/dashboard/page.tsx` — viewport router (mobile = TodayLiveCard, desktop = calendar embed)
- `components/dashboard/StaffTable`, all category data tables — gain `density="dense"|"comfortable"` prop; `dense` set per-route

**Entry criteria:** Phases 0–2 complete. Phase 3 helpful (LiveActivityCard pattern reused).

**Exit criteria:**
- `/dashboard` on phone shows Today Live-Activity card; on desktop shows calendar week-grid + sticky stats header
- Persistent sidebar (desktop) / hamburger drawer (mobile) renders all 7 groups: Heute / Plan / Kunden / Geschäft / Analyse / {Category}-Tools / Einstellungen
- Category-Tools group injected based on salon `categories[]` (single-category salon sees one tool group; multi-category sees stacked)
- Working surfaces use dense rows (28-32px), editor surfaces use comfortable rows (48-56px)
- Sidebar bg = cream `#FAF7F3`; right content area stays white
- Stats homepage (current `/dashboard` landing) retired — no separate "overview" route

**Scope:** ~5 new components, 1 new hook, 1 viewport router rewrite, 30+ data-table components gain density prop.

---

## Phase 7 — Polish + drift sweep + retired-pattern audit

**Goal:** sweep the codebase for any remaining drift from earlier phases. Remove retired patterns from any file the previous phases didn't touch. Final QA against the locks.

**Cross-cutting work:**
- Grep for retired tokens: `Fraunces`, `Bebas Neue`, `Syne`, `DM Sans`, `Plus Jakarta`, `Outfit`, `Phosphor` — if any references survive, remove
- Grep for retired V2 colors: `#1B4D1C` (V2 green), `#F5A962` (V2 peach) — should not exist
- Grep for retired classes: `rounded-lg`, `rounded-xl`, `rounded-2xl`, `bg-black`, `text-gray-*`, `dark:*` — replace with locked tokens
- Grep for emoji UI (`🎉` `✨` `💖` etc. in JSX) — flag for owner review per Q24
- Audit `aspect-[3/2]` (retired) → square `1/1` per Q26
- Confirm zero usage of glass-everywhere / blob-everywhere / 3:2-cover-photo patterns
- Run a11y audit: every focusable element has `:focus-visible` ring per Q47; hit areas ≥48×48 per Q46; WCAG AA contrast per Q45
- Generate `_audits/CURRENT_STATE_FINAL.md` with conformance summary

**Entry criteria:** Phases 0–6 complete and verified.

**Exit criteria:**
- Zero references to retired patterns in `components/` and `app/`
- `_audits/CURRENT_STATE_FINAL.md` shows ≥95% conformance against `SOLEN_DESIGN.md`
- `solen-coral.html` and live app render visually identical for the same surface (preview-as-truth)

**Scope:** Hard to estimate — depends how clean Phases 0–6 left things. Optimistic: 1 day. Pessimistic: 3 days.

---

## After Phase 7

The questionnaire walk produced 63 locks. The build map executes them. Once Phase 7 lands, we have the design system as code.

**Open work that's NOT in this map (deferred):**
- Future questionnaire (Q64+) for things the V3 walk didn't cover (e.g. mobile native PWA bottom-nav, per-category sub-brands, multi-tenancy chrome for `Vercel for Platforms`, AI-generated salon-page suggestions)
- Pricing page redesign (not covered in Q1–Q63)
- Onboarding flow for new salon partners (touches dashboard but is a flow not a surface)
- Email/SMS template visual locks (Resend + seven.io templates aren't in Q1–Q63)

These get appended to `_tasks/SOLEN_DESIGN.md` §20 as new Q-locks via the same propose → wait → execute → verify protocol when they come up.

---

## How to use this map

1. **Don't start two phases in parallel.** One phase at a time, fully verified, then next.
2. **When starting a phase**, write `_tasks/SOLEN_BUILD_PHASE_<N>.md` with the detailed file-by-file plan. That sub-plan dies when the phase merges (move to `_tasks/completed/`).
3. **Each phase should ship as 5–15 small commits**, not one big PR. CLAUDE.md surgical-edits rule applies throughout.
4. **If a phase reveals that the lock is wrong**, stop the phase, propose a revision, get explicit "ok / lock / go", update §20, then resume. Never silently diverge from the lock.
5. **`solen-coral.html` is the truth.** If the live app renders differently from the preview, the live app is wrong (assuming the preview reflects the §20 lock).

---

## Status

| Phase | Started | Verified | Notes |
|---|---|---|---|
| 0 | — | — | Next up |
| 1 | — | — | |
| 2 | — | — | |
| 3 | — | — | |
| 4 | — | — | |
| 5 | — | — | |
| 6 | — | — | |
| 7 | — | — | |

_Status table updated as phases complete._

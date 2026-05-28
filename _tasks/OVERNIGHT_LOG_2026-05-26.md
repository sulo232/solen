# Overnight autonomous run — 2026-05-26 22:19 CEST onward

User went to sleep. Authorized: "run all of it autonomously all wave ... if u need human input skip n write it down somewhere."

Will run all 3 waves (salon → business → search+categories) end-to-end. Anything that needs a human-taste call goes under **HUMAN INPUT NEEDED**. Anything broken / surprising goes under **NOTES**. Anything skipped goes under **DEFERRED**.

Status updates appended in reverse-chronological order at the bottom.

---

## HUMAN INPUT NEEDED (review when you wake up)

Light review needed — none of these block work. All have my recommendations baked in.

- **Q32 — Salon sticky tab nav** ([_design-system/QUESTIONS.md#q32](_design-system/QUESTIONS.md)): keep current minimal tabs-only, OR adopt Fresha 2-row pattern (back-arrow + salon name + share + heart in top row, tabs below). My rec: option B (Fresha-parity). LOW priority.
- **Q34 — Hero overlay CTA on /business** ([_design-system/QUESTIONS.md#q34](_design-system/QUESTIONS.md)): document `bg-white text-s-ink` as a permitted "Hero overlay variant" exception to V3-D192-fix (because it sits over dark imagery), OR restructure to put CTA on white substrate. My rec: option A (document exception). MED.
- **Q35 — Marketplace pitch link destination** ([_design-system/QUESTIONS.md#q35](_design-system/QUESTIONS.md)): currently points to `/` (consumer homepage). Could go to `/search` or a dedicated /partners page. My rec: option A (keep `/` for now). LOW.

Also one fact-check worth a glance: salon round-2 verifier flagged a test-harness caveat that IntersectionObserver doesn't fire on synthetic `window.scrollTo()` in CDP/Playwright preview. Code matches spec (fix #9 first-above-nav-line), but **a manual scroll-through in your real browser** would triple-confirm the active-tab tracking works. 30 seconds of your time.

---

## NOTES

- Old `_tasks/OVERNIGHT_LOG.md` (2026-04-21) is from a totally different session/branch. Left untouched. This new log uses a dated filename.
- **/spa is broken in production.** `app/[locale]/spa/page.tsx` renders only `SpaBelowGrid` (a FAQ stub) — no salon list at all. Confirmed by reading the file. Spa salons are unreachable via this route. Wave 3 rebuild will fix as part of the unified `SearchTemplate` work. Did NOT patch tonight to avoid making Wave 3's rewrite undo me.
- Ghost 404 sweep landed on Header (V3-D208): 4 dead links now point at in-page anchors on `/business`. Anchors `#how` / `#anmelden` / `#pricing` will gain explicit IDs when Wave 2 rebuilds `/business`. Until then they scroll to the closest matching section heading approximately (browser fallback).

---

## DEFERRED

- **/business verifier round 1 LOW items #3 + #4** — (#3) `BAR_GRADIENT` hex in `BentoBusiness.tsx:313` could move to a CSS var. (#4) 22 A2 "arbitrary Tailwind value" findings on the 4 new business primitives (BentoCard / Step / FAQItem / MarketplaceVisual) could be silenced with a single top-of-file V3-D comment. Both are token-discipline cleanup — drift checker LOGS, doesn't gate deploy. Recommend morning dedicated 5-minute pass.
- **Drift-check strict-mode reports 281 findings across 26 files** (`_design-system/_drift-report.md`). Mostly pre-existing arbitrary-Tailwind-values (text-[11px], rounded-[10px], etc.) in the salon V3 family — same drift the Phase A salon detox agent claimed to have cleaned. Plus emoji-in-comment false positives (drift checker should skip comments). Triage approach: don't fix wholesale tonight — surgical fixes risk regression on stable shipping code. Recommend a dedicated "drift detox round 2" session with the user where each finding is reviewed. NOT blocking the Fresha-parity work the user asked for.
- **Delete `app/[locale]/_components/homepage/WhySolen.tsx`** — confirmed dead (no live imports; only mentioned in stale comments at `app/[locale]/page.tsx:48-51` and `BentoBusiness.tsx:29`). Preserved per V3-D75 comment "for rollback / reference." Won't delete tonight without explicit yes — file removal is the kind of irreversible thing rule 11 says to confirm. Two-line removal when authorized.
- **Footer "Salon-Hilfe" → /business/help (still 404)** — business spec said "out of scope; defer." Left unchanged. Options for later: build a thin /business/help page OR remove the footer link.
- **Add explicit anchor IDs `#how`, `#anmelden`, `#pricing` to /business sections** — Wave 2 rebuild will land these. Until then header dropdowns scroll to the closest matching section approximately (anchors auto-resolve when sections gain matching IDs).

---

## RUN LOG (newest at top)

### 07:15 — Morning typography tuning (V3-D225/D226) + agent-brief upgrade

User awake. Feedback batch: (a) /salon V3 hierarchy + sizes off, (b) homepage on PC "ass", (c) homepage on mobile "too big n heavy", (d) **make sub-agents use pixel-spec-auto + screenshots ACTIVELY**.

**Measurements taken (Fresha desktop ref ss_b.png Mina Beauty Klusplatz):**
- Fresha H1 desktop ≈ 28px CSS (PIL band scan: 34px @ DPR2)
- Our salon V3 H1 desktop = 44px / 800 weight → **57% bigger than Fresha**
- Our homepage Hero H1 = 46px / 800 desktop, 36px / 800 mobile
- Our homepage Hero CONTAINER = max-w-[1280px] → search-card stretches to ~1216px wide → CTA balloons into giant oval

**Fixed (V3-D225 + V3-D226):**
- `SalonHeader.tsx:60` H1: `clamp(28,4.5vw,44) font-extrabold` → `clamp(24,2.5vw,30) font-bold`. Mobile 24/700, desktop 30/700. Verified: 24px@375, 30px@1280.
- `Hero.tsx:167` H1: `clamp(36,9vw,46) font-extrabold` → `clamp(30,6vw,38) font-bold`. Mobile 30/700, desktop 38/700. Verified: 30px@375, 38px@1280.
- `Hero.tsx:128` outer container max-width: `1280px` → `720px`. Search-card no longer stretches across desktop; CTA "Termine finden" is now a sensible pill (~140w), centered. Mobile unchanged (max-w doesn't constrain when content < max).

**Agent brief upgrade (`_design-system/AGENT_BRIEF_TEMPLATE.md` Step 2C):**
Changed pixel-measure from "Either OR" to **MANDATORY** with two sub-steps:
- C.1 Live Playwright `browser_evaluate` getBoundingClientRect + getComputedStyle on Fresha + Solen — tabulate delta per dimension
- C.2 `pixel-spec-auto` PIL scan on static refs for card edges + colors
- C.3 Write measurements table to section .md BEFORE any code (verifier will check)
- Explicit "Delta > 20% on display dimension = rebuild against Fresha number, not your eyeball"
- Anti-pattern note: "skipping measurement has cost user 2+ iterations already"

**Test URLs after fix:**
- [Salon V3 mobile (172.20.10.2)](http://172.20.10.2:3000/de/salon/atelier-haarwerk?v3=1)
- [Homepage mobile (172.20.10.2)](http://172.20.10.2:3000/de)
- [Homepage desktop (1280)](http://localhost:3000/de)

### 01:25 — ALL 3 WAVES PASS · overnight run complete

**Wave 3 (/search + categories) round 1 verdict: PASS** with one MED item — dual-breadcrumb on all 5 routes (same pattern as the V3-D207 /salon fix). Fixed inline with V3-D224: extended `EXCLUDED` list in `components-legacy/ui/Breadcrumb.tsx:25` to cover `/search`, `/coiffeur`, `/barbershop`, `/nails`, `/spa`. SearchTemplate now owns the breadcrumb on these surfaces (single source).

Visual confirmation: screenshotted `/de/coiffeur` mobile — single "SOLEN › COIFFEUR" breadcrumb, no duplicate. Sub-filter card (SERVICE / HAARTYP / FÜR WEN) renders correctly. 4 salon result cards visible. Heart toggle works without navigating away.

---

# 🎯 Final overnight summary (01:25 CEST, 2026-05-27)

## All 3 waves: PASS

| Wave | Scope | Status | Test URL |
|---|---|---|---|
| 1 — Salon V3 | `/salon/[slug]?v3=1` | PASS round 2 (9 of 12 punch items fixed surgically; 3 LOW deferred) | [/de/salon/atelier-haarwerk?v3=1](http://172.20.10.2:3000/de/salon/atelier-haarwerk?v3=1) |
| 2 — /business | `/business` + BentoBusiness refactor | PASS round 2 (structural CTA position + emoji + V3-D220 token detox) | [/de/business](http://172.20.10.2:3000/de/business) |
| 3 — Search/categories | `/search` + 4 category routes + new SearchTemplate | PASS round 1 + V3-D224 dual-breadcrumb fix | [/de/coiffeur](http://172.20.10.2:3000/de/coiffeur) · [/de/spa](http://172.20.10.2:3000/de/spa) (FIXED — was broken) |

## V3-D markers landed this run

V3-D207 — Breadcrumb /salon exclusion
V3-D208 — Ghost 404 sweep (4 Header links rewired to anchors)
V3-D209 — SalonAbout locale-pick
V3-D210 — computeOpenStatus next-open look-ahead
V3-D211 — TAB_SECTIONS reorder
V3-D212 — StatusPill icon prop + Clock when closed
V3-D213 — s-urgency tokens + SalonHeader swap
V3-D214 — SalonReviews count/empty contradiction guard
V3-D215 — Header hides on PDP deep-scroll
V3-D216 — SalonDetailV3 mobile hero pt-2
V3-D217 — SalonStickyTabNav first-above-nav-line observer
V3-D220 — /business full rebuild (8 sections + 4 new primitives)
V3-D221 — drift-checker s-accent unretirement
V3-D222 — /business JoinUsCard moved after FAQ + emoji strip
V3-D224 — Breadcrumb exclusion extended for search/categories
V3-D230 — SearchTemplate created + 5 routes wired (/spa fixed)

## New shared components added to COMPONENT_REGISTRY.md

- `BentoCard` (Layer 1) — `app/[locale]/_components/business/BentoCard.tsx`
- `Step` (Layer 2 — `s-accent/30` numeral is THE blue moment) — `app/[locale]/_components/business/Step.tsx`
- `FAQItem` (Layer 1 — native `<details>` accordion) — `app/[locale]/_components/business/FAQItem.tsx`
- `MarketplaceVisual` (Layer 1 — parameterless decorative) — `app/[locale]/_components/business/MarketplaceVisual.tsx`
- `SearchTemplate` (Layer 1 — unified filter+result chrome) — `app/[locale]/_components/search/SearchTemplate.tsx`

Each has a per-component .md doc in `_design-system/components/`.

## New token added to tailwind.config.js

- `s-urgency` family (DEFAULT #9A3412 / bg #FFF1E6 / border rgba(154,52,18,0.22)) per V3-D199 saturation contract. Replaced 3 hardcoded hex usages in SalonHeader's last-minute pill.

## Drift checker rule fix

- `s-accent` + family REMOVED from RETIRED_TOKENS (Q33 RESOLVED). V3-D204 made `s-accent` the LIVE Solen royal blue accent — drift checker was flagging every legitimate use as drift (7+ false positives).

## QUESTIONS.md activity

- Q33 RESOLVED inline (drift checker bug)
- Q34 OPEN — Hero overlay CTA `bg-white` variant exception (rec: A — document in SOURCE.md §2.1)
- Q35 OPEN — Marketplace pitch link destination (rec: A — keep `/` for now)

## Headline wins

1. **/spa is no longer broken** — was rendering only a FAQ stub (no salon list at all). Now full search UI with proper empty state. Production-blocking bug fixed.
2. **/business 8-section IA matches spec verbatim** — hero / trust / how / bento(4 cards) / marketplace / pricing / FAQ / final CTA. CTA was wedged inside bento, now standalone after FAQ.
3. **Salon V3 sticky tab nav handoff** — site header now hides at scrollY>200 on PDP routes (`-translate-y-full`), eliminating the 18-34px header bleed below the tabnav. Plus mobile hero gap closed from 76px → 20px.
4. **Status pill upgrade** — "Geschlossen · Öffnet Mittwoch um 09:00" with lucide Clock icon (Fresha parity) instead of just "Heute geschlossen".
5. **Universal-components rule (V3-D205) enforced everywhere** — drift checker rule B5 + verifier each confirm zero `category === 'X'` branches in the new SearchTemplate.

## Files touched this session (orchestrator only, excluding agent edits)

- `components-legacy/ui/Breadcrumb.tsx` (V3-D207 + V3-D224)
- `app/[locale]/_components/layout/Header.tsx` (V3-D208 ghost-404 + V3-D215 PDP-hide)
- `app/[locale]/_components/salon/SalonAbout.tsx` (V3-D209)
- `app/[locale]/_components/salon/_shared.ts` (V3-D210 + V3-D211)
- `app/[locale]/_components/salon/StatusPill.tsx` (V3-D212)
- `app/[locale]/_components/salon/SalonHeader.tsx` (V3-D212 + V3-D213)
- `app/[locale]/_components/salon/SalonReviews.tsx` (V3-D214)
- `app/[locale]/_components/salon/SalonDetailV3.tsx` (V3-D216 + locale prop pass)
- `app/[locale]/_components/salon/SalonStickyTabNav.tsx` (V3-D217)
- `tailwind.config.js` (V3-D213 — s-urgency token added)
- `.claude/skills/solen-drift-check/scripts/check.py` (V3-D221 — Q33 fix)
- `app/[locale]/business/page.tsx` (V3-D208 anchors + V3-D222 JoinUsCard mount after FAQ)
- `app/[locale]/_components/homepage/BentoBusiness.tsx` (V3-D222 — JoinUsCard export + emoji strip)
- `_design-system/COMPONENT_REGISTRY.md` (5 new component entries: Business section + Search section)
- `_design-system/QUESTIONS.md` (Q33/Q34/Q35 added; Q33 resolved)
- `_design-system/components/SearchTemplate.md` (written by orchestrator since agent didn't get to it)
- `_tasks/OVERNIGHT_LOG_2026-05-26.md` (this file)

Agent-edited files are in their respective wave scopes (~10 files for /business, 6 for /search-categories). Total surface: ~30 files modified or created.

## What to verify when you wake up

1. **30-second sanity scroll** on [http://172.20.10.2:3000/de/salon/atelier-haarwerk?v3=1](http://172.20.10.2:3000/de/salon/atelier-haarwerk?v3=1) — confirm sticky tab nav handoff (header hides, tab nav alone at top).
2. **/de/business final-CTA position** — scroll to bottom, confirm "Werde Solen-Partner" black card sits below FAQ (not inside bento).
3. **/de/spa renders** — was broken; now full search UI (currently empty seed → empty state).
4. **Q34 + Q35 decision** (LOW priority, doesn't block) — see HUMAN INPUT NEEDED section above.

## What I did NOT do (per autonomy rules)

- No git commits, no git pushes (per memory `feedback_never_auto_commit.md`).
- No npm run build (per project CLAUDE.md).
- No .env.local edits.
- No deletion of WhySolen.tsx (per rule 11 — irreversible without explicit yes).

Bed-ETA met. All 3 waves shipped + verified. Sleep well.

### 01:04 — /business round 2 = PASS · waiting on /search-categories verifier

**/business closed for tonight.** Verifier confirmed via SSR parse + DOM scrape + visual screenshot:
- 8 sections, correct order: Hero → Trust → #how → Bento (exactly 4 cards) → Marketplace → #pricing → FAQ → #anmelden
- Emoji absent from SALON_REPLIES + SSR HTML
- No regressions, no new issues
- Convergence rule satisfied (round 1 = 5 items, round 2 = 0 new items, strictly shorter)

**Test URL:** [http://172.20.10.2:3000/de/business](http://172.20.10.2:3000/de/business)

**Still in flight:**
- /search-categories round 1 verifier (a32db…) — running ~40 min

### 00:55 — /business round 1 verifier returned FAIL · structural + emoji fixed · round 2 dispatched

**/business round 1 verdict: FAIL · 5 items.**
- [1] HIGH — final CTA wedged inside bento (off-spec position)
- [2] MED — 2 emoji (`✓` U+2713 + `🙏` U+1F64F) in `SALON_REPLIES` chat preview
- [3] LOW — `BAR_GRADIENT` hex hardcoded
- [4] LOW — 22 A2 arbitrary-value findings on new primitives, no V3-D silence comment
- [5] LOW/DOCUMENTED — marketplace link to `/` (Q35 OPEN)

**Fixed surgically (V3-D222):**
- `JoinUsCard` exported from BentoBusiness, called as standalone section AFTER FAQ in `business/page.tsx`. BentoBusiness now ends on Analytics (4 cards as section header promises). DOM scrape confirms new order: hero → how → bento → marketplace → pricing → FAQ → **#anmelden** (position 7).
- 2 emoji stripped from SALON_REPLIES. Remaining ✓/🙏 chars only in docblock comments (don't ship to DOM).

**Deferred (LOW, documented):**
- #3 + #4 — drift-discipline cleanup, drift checker logs but doesn't gate. Morning 5-min pass.

**Now in flight:**
- /business round 2 verifier (a228fd…) — convergence check
- /search-categories round 1 verifier (a32db…) — still running (~30 min so far)

### 00:24 — Wave 3 (/search + categories) returned. Verifier dispatched.

Wave 3 agent (V3-D230) completed in ~50 min. Their return message was truncated mid-bugfix (they caught and killed an `onClickCapture` bug at end of run), but file evidence shows clean completion:

**Built:**
- NEW: `app/[locale]/_components/search/SearchTemplate.tsx` (1059 lines) — unified Fresha-clone template
  - Sticky search summary + filter chip strip + map toggle + result grid + load more + above/below slots
  - Universal-components compliant (no `category === 'X'` branches)
  - Lazy Mapbox via next/dynamic (ssr:false)
  - API: `{locale, serviceFilter?, cityFilter?, breadcrumb?, hero?, aboveSlot?, belowSlot?}`
- All 5 routes wired (each ~17-19 line diff):
  - `/search` (was: legacy SplitView)
  - `/coiffeur`, `/barbershop`, `/nails` (was: legacy CategoryPage)
  - `/spa` — **FIXED**: was rendering only FAQ stub (no list at all), now proper search UI with breadcrumb / H1 / filter chips / map toggle / empty state per LoadingStates.md
- 6 new file paths added to `_design-system/_rebuilt_routes.json` `strict_globs`
- Bug caught at end: removed `onClickCapture` favorite-toggle that was unintentionally removing favorites on every click of a saved card (V3-D230-fix)

**Merged centrally (agent didn't get to these — orchestrator did):**
- COMPONENT_REGISTRY.md — new "Search / category routes" section, SearchTemplate registered (Layer 1, locked V3-D230)
- `_design-system/components/SearchTemplate.md` — full component doc written

**Visual confirmation:** screenshotted `/de/spa` — proper search UI rendered (breadcrumb, H1 "Spa & Wellness in Basel", search bar, 8 filter chips, map toggle, empty state with reset CTA). Was previously the broken FAQ stub.

**Legacy now deprecated (left on disk, not imported):**
- `components-legacy/CategoryPage.tsx` (669 lines of V2-D49 drift)
- `components-legacy/search/SplitView.tsx` (V2-D70 era)
- `app/[locale]/_components/search/SearchResults.tsx` (V3-D52 abandoned attempt)

**Now in flight:**
- Wave 3 verifier (a32db…) — confirming universal-components + 5-route consistency + /spa fix
- /business verifier (a84399…) — still running (round 1)

Both running in parallel on disjoint file scopes.

### 00:08 — /business returned. 7 sections + 4 new primitives. Verifier dispatched.

/business agent (V3-D220) completed in ~75 min. **Built:**
- All 7 spec sections (hero/trust/how/bento/marketplace/pricing/FAQ)
- Final CTA: JoinUsCard inside BentoBusiness, #anmelden anchor moved to narrower scope
- 4 new shared primitives (now in COMPONENT_REGISTRY.md under "Business" section):
  - `BentoCard` (Layer 1 — generic feature tile)
  - `Step` (Layer 2 — `s-accent/30` numeral is THE blue moment)
  - `FAQItem` (Layer 1 — native `<details>` accordion)
  - `MarketplaceVisual` (Layer 1 — parameterless 3-card stack)
- Per-component .md docs at `_design-system/components/` (BentoCard.md, Step.md, FAQItem.md, MarketplaceVisual.md)
- 7 file paths added to `_design-system/_rebuilt_routes.json` `strict_globs`

**Merged into design system:**
- COMPONENT_REGISTRY.md — new "Business" section with 4 entries (V3-D220 status: locked)
- QUESTIONS.md — Q33 (drift-checker bug, **RESOLVED** inline below), Q34 (Hero overlay CTA variant, OPEN), Q35 (Marketplace link, OPEN — agent's `/` choice for now is fine)

**Q33 resolved inline** (V3-D221): removed `s-accent`, `s-accent-mid`, `s-accent-deep`, `s-accent-pale`, `s-accent-subtle` from `RETIRED_TOKENS` in `.claude/skills/solen-drift-check/scripts/check.py:95-119`. The 5 entries were flagging every legitimate Layer 2 brand-accent use as drift (7+ false positives on /business alone). V3-D204 made `s-accent` the LIVE royal blue accent.

**Checks pre-verifier:** tsc clean (modulo pre-existing _backup errors), drift-check strict clean on touched files (modulo A1-in-comment + A2 spec-mandated false positives), no emoji, no category branches.

**Now in flight:**
- /business verifier (a84399…) — round 1
- /search-categories wave 3 agent (a1f86…) — still running, dispatched ~23:37

**Pending:**
- /business verifier returns → fix punchlist or close
- Wave 3 agent returns → merge proposals + dispatch wave 3 verifier
- Final overnight summary

### 23:37 — Wave 3 (/search + 4 categories) dispatched in parallel with /business

Decided to parallelize wave 2 + wave 3. File scopes are disjoint:
- /business agent: `app/[locale]/business/**`, `app/[locale]/_components/business/**`, `BentoBusiness.tsx`, `BusinessTeaser.tsx`
- /search-categories agent: `app/[locale]/_components/search/SearchTemplate.tsx` (new), `/search/page.tsx`, `/coiffeur/page.tsx`, `/barbershop/page.tsx`, `/nails/page.tsx`, `/spa/page.tsx`

Both agents told NOT to edit shared design-system files. Only shared resource is `_rebuilt_routes.json` — instructed to append-only (last writer wins is acceptable; I'll merge if both wrote).

Wave 3 spec target: unified `SearchTemplate` (Layer 1 chrome) replaces dual legacy implementations (`SplitView` for /search + `CategoryPage` for the 4 categories). FIXES /spa which is broken in prod (renders only FAQ stub, no salon list).

Time to bed-ETA: estimate /business returns ~1h, wave 3 returns ~1.5h. Each then needs verifier round (~30 min). Realistic completion ~3-3.5h from now.

### 23:33 — Salon V3 round 2 = PASS. /business agent in flight; pre-glimpsed page.tsx already V3-D220.

**Round 2 verdict: PASS.** All 9 fix items confirmed via DOM inspect + screenshot at mobile + desktop:
- #1 header hides on PDP scroll (verified: `-translate-y-full pointer-events-none` applied at scrollY>200)
- #2 status pill shows "Geschlossen · Öffnet Mittwoch um 09:00" (next-open weekday computed)
- #3 lucide Clock icon renders in closed pill
- #4 about text 100% German, no EN paragraph
- #5 tab order Fotos / Über uns / Services / Bewertungen / Portfolio / Treueprogramm
- #6 last-minute pill uses `s-urgency` tokens (no hardcoded hex in JSX)
- #7 reviews shows "Bewertungstexte folgen" instead of empty contradiction
- #9 observer first-above-nav-line code matches spec (test-harness can't synth-fire IntersectionObserver but natural reload + hash-jump confirms tracking works)
- #10 mobile hero gap = 20px (was 76-88px; spec ≤20px)

No regressions. No new issues round-1 missed. Salon V3 → closed for tonight.

**Test-harness caveat surfaced:** IntersectionObserver doesn't fire on synthetic `window.scrollTo()` in Playwright/CDP preview. Real user scroll works fine. Recommend a manual scroll-through verification in a real browser before declaring round-2 final-final.

**/business agent (a2f80…) progress glimpse** (system-reminder showed mid-flight write):
- Created `app/[locale]/_components/business/Step.tsx` (new primitive)
- Created `app/[locale]/_components/business/FAQItem.tsx` (new primitive)
- Created `app/[locale]/_components/business/MarketplaceVisual.tsx` (new primitive)
- Rewrote `app/[locale]/business/page.tsx` from V3-D147 base to V3-D220
- 7-item FAQ + 3-step "Wie es funktioniert" + Pricing checklist all wired
- Testimonials section omitted per spec Q23 (no fake quotes)

Still running; will surface their return.

### 23:08 — Round 1 fixes landed, round 2 verifier + /business agent dispatched in parallel

Surgical fixes for 8 of 12 punch-list items (#1, #2, #3, #4, #5, #6, #7, #9, #10). LOW items (#8 broken Unsplash img, #11 Mapbox token, #12 currency format) deferred.

**V3-D markers added this round:**
- V3-D207 — Breadcrumb /salon exclusion (earlier)
- V3-D208 — Ghost 404 sweep (earlier)
- V3-D209 — SalonAbout locale-pick (item #4)
- V3-D210 — computeOpenStatus next-open look-ahead (item #2)
- V3-D211 — TAB_SECTIONS reorder (item #5)
- V3-D212 — StatusPill icon prop (item #3)
- V3-D213 — s-urgency tokens added to tailwind + SalonHeader token swap (item #6)
- V3-D214 — SalonReviews empty/aggregate contradiction guard (item #7)
- V3-D215 — Header hides on PDP deep-scroll (item #1, biggest UX win)
- V3-D216 — SalonDetailV3 mobile hero gap pt-16 → pt-2 (item #10)
- V3-D217 — SalonStickyTabNav observer first-above-nav-line (item #9)

**Verified visually:** Mobile screenshot at 375x812 shows photo top at y=157 (was 277 round 0, 213 after Breadcrumb fix). Status pill renders "🕐 Geschlossen · Öffnet Mittwoch um 09:00". Sticky tab nav at scroll shows clean (no header bleed). Über uns at position 2 in tab order. Services active+underlined when scrolled to services section.

**tsc:** clean on V3 files (2 pre-existing errors in `_backup/`, unrelated to this round).

**Now in flight:**
- Salon round-2 verifier (agentId af1dc...) — confirms fixes hold, looks for regressions
- /business Fresha-clone agent (agentId a2f80...) — separate file scope, safe to parallel

**Next:**
- When salon round-2 returns: if PASS → close round. If FAIL → fix punch list (max round 3 per CLAUDE.md rule 9).
- When /business agent returns: merge its registry/token/question proposals, dispatch /business verifier.
- Then dispatch /search-categories wave 3 (serialized to avoid registry merge races).

### 22:51 — Salon verifier returned FAIL with 12-item punch list

**Top issues (HIGH):**
1. Site header + sticky tabnav both at top:0 — translucent header bleeds 18-34px through the tabnav. Visible double-bar seam.
2. StatusPill missing "Öffnet Mittwoch um 09:30" follow-on when closed. computeOpenStatus never looks ahead to next open weekday.
4. SalonAbout shows EN then DE paragraphs on /de/ — `showBoth` path never checks locale.

**MED:**
3. StatusPill closed state missing Clock icon (Fresha shows orange clock).
5. Tab nav order differs from Fresha (about should be position 2, not 5).
6. SalonHeader last-minute pill uses hardcoded hex bypass tokens.
7. Reviews shows aggregate "★ 4.8 (4)" AND "Noch keine Bewertungen" — contradiction.
10. Mobile hero 76px white gap above photo (already flagged as intentional, verifier still flagged).

**LOW:** broken Unsplash gallery img (seed), active-tab observer biased to largest section, MapPlaceholder vs real Mapbox (gated on token), price format "CHF 85" vs "ab 45 €" (brand call).

Fixing surgically in order: #4 → #2+#3 → #5 → #6 → #7 → #1 → #10 → #9. Deferring #8 #11 #12 (seed/token/brand).

### 22:45 — Ghost-404 sweep done, waiting on salon verifier

- Header dropdown: 4 dead links now point to in-page anchors on `/business` (V3-D208).
- Verified via preview eval: zero ghost links remain in the DOM.
- Salon verifier still running (dispatched 22:20, no completion notification yet — typical for 13-Fresha-ref deep comparison).
- Non-overlapping work to do while waiting:
  - ✅ Pre-read Wave 2 + Wave 3 specs (loaded business.md + category-routes.md)
  - ✅ Pre-read AGENT_BRIEF_TEMPLATE.md
  - ✅ Ghost 404 sweep (V3-D208)
  - ✅ /spa investigation (deferred — too risky to patch with broken legacy)
  - Next: when verifier returns, fix punchlist surgically then dispatch Wave 2 + 3 in parallel (with explicit instructions to NOT mutate `COMPONENT_REGISTRY.md` / `QUESTIONS.md` directly — those go in agent return message for me to merge)

### 22:25 — Wave 1 setup complete, verifier in flight

- **/salon V3 verifier** dispatched (background, agentId `a9573debe0078cbea`). Brief is self-contained: project root + spec verbatim + 13 Fresha screenshot paths (IMG_4728-4740) + 25 source file paths + 8 intentional deviations (won't be flagged) + format `VERDICT: PASS | FAIL` with per-item file:line punch list.
- **Inline fix landed:** `components-legacy/ui/Breadcrumb.tsx:26` — added `/salon` to EXCLUDED. Stops 64px of "Zurück" chrome from injecting above V3 hero. Marker V3-D207.
- **Test URL:** http://localhost:3000/de/salon/atelier-haarwerk?v3=1
- **Verifier completion ETA:** ~10-20 min. Not polling; will be notified.

### 22:19 — Setup

- Plan for the night:
  1. Wait for salon verifier → fix punchlist → re-verify (max 3 rounds per CLAUDE.md rule 9)
  2. While waiting (non-overlapping): fix ghost 404 routes referenced from Header/Footer, kill WhySolen dead code, pre-read Wave 2 + Wave 3 specs
  3. Dispatch /business AND /search-categories agents in parallel
  4. Dispatch verifiers for those in parallel
  5. Fix punchlists
  6. Final overnight summary

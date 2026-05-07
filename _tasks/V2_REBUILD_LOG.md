# Solen V2 Rebuild Log

> The single living doc that answers "what does the codebase look like RIGHT NOW."
> Reading order: Status → Stripped → Quarantined → In-flight → Locked & Surviving → Decisions → Next actions.
>
> NOT a design system spec. `_tasks/SOLEN_LIVE_TRUTH.md` owns specs.
> NOT a decision history. `_tasks/SOLEN_DESIGN.md` §20 owns history.
> This doc owns the running narrative.

---

## Status (one-liner)

**2026-05-07 (latest)** — V3 design lock (V2-D15-3). Brand orange `#E8742A` retired, **dark teal `#043338` + pale teal `#C2F0F1`** locked as brand. 6 categories → **4 categories** (Coiffeur=Z cream+cherry, Barbershop=G bone+black, Nails=A pale ice blue+magenta, Spa & Wellness=I forest+sandy beige). Typography: Bricolage + Inter Tight retired, **Cooper BT (display) + ITC Avant Garde Gothic Std (body)** locked with Sansita 900 + League Spartan as free fallbacks. Yuh-density principle + pill rule + atmosphere wash recipe + 31-combo library codified in LIVE_TRUTH §1 / §2 / §5 / §5a / §5c / §5d / §5e. **Preview:** `public/solen-v2-republik-teal.html` (homepage), `solen-v2-palette.html` (palette), `solen-v2-combos.html` (combo grid). **Next:** Phase 0 §F.1 implementation on V3 foundations + tailwind.config.js token swap (sweep flag required).

**2026-05-07 (earlier)** — (superseded by V2-D15-3) Hybrid scratch reset on `SOLEN_LIVE_TRUTH.md` foundations (V2-D15). Foundations rewritten from research on Republik · Fresha · Uber · Airbnb. Brand orange + Bricolage + Inter Tight kept then. Substrate cream → white. Instrument Serif + JetBrains Mono retired. Per-category Republik-style colorway treatment added. v2-prelim archived at `_tasks/archive/SOLEN_LIVE_TRUTH_v2-prelim.archived.md`.

**2026-05-06** — (superseded by 2026-05-07) v2 design language locked, no pivot. Brand color exploration concluded after overnight reflection — orange `#E8742A` + Bricolage stack stay. Phase 0 §F.1 implementation unblocked.

**2026-05-05** — Phase 0 in progress. §F.1 form primitives spec **locked** (V2-D14 — 4 open decisions resolved + 4 audit contradictions fixed). New §5f Hierarchy principle locked. Brand color exploration started end-of-day but unresolved — see V2-D15 for resolution.

**2026-05-05** — V2 LIVE_TRUTH replaced wholesale with v2 content from user's parallel Claude session (V2-D13). V1 spec archived to `_tasks/archive/SOLEN_LIVE_TRUTH_v1.archived.md`. New principal: `_tasks/SOLEN_LIVE_TRUTH.md` (§1–§25 + §5f + §F.1 + Component PR checklist + 36-gap roadmap). Visualization rendered at `public/solen-v2-locked.html`. Backend untouched. `components-legacy/` still quarantined; will retire incrementally per V2-D05.

**2026-05-04** — Strip phase MEDIUM: COMPLETE (deferred Phase 4-5 to incremental route-by-route cleanup — see "Phase 4-5 deferred" below). Backend untouched. v2 hero attempt deleted. Homepage = empty shell. `components-legacy/` quarantined (318 files: ~250 actively used, ~30-50 likely-orphan to be removed during rebuild).

---

## Stripped (what's been removed and when)

Each entry: action, what removed, why (cite LIVE_TRUTH §X / SOLEN_UI #Y / retired list / V2-D0X), commit SHA, recoverable.

### 2026-05-03 — Components quarantined to legacy
- **Action:** `git mv components components-legacy` + sweep 592 import lines across 114 files
- **Why:** First step of strip — reduce surface for AI drift while preserving git history (V2-D02 lock)
- **Commit:** uncommitted (user reviews diff before commit)
- **Recoverable via:** `git mv components-legacy components` reverses

### 2026-05-04 — V2 hero/page attempt deleted
- **Action:** Deleted `app/[locale]/_components/Hero.tsx` (parent folder kept empty for next route work). Rewrote `app/[locale]/page.tsx` from 272 lines → 76 lines (metadata + empty `<></>` shell + rebuild docblock).
- **Why:** Audit found violations: horizontal-segmented search bar (banned per LIVE_TRUTH §7 Q49), plum color that didn't match palette, briefly cream-as-page-bg (retired per CLAUDE.md). Removed to prevent AI drift back to broken patterns.
- **Commit:** uncommitted (user reviews diff before commit)
- **Recoverable via:** git history (file restore)

### 2026-05-04 — Tailwind config drift cleanup
- **Action:** Removed retired colored-glow shadows (`coral-glow`, `coral-glow-hover`, `amber-glow`, `v5-glow-coral`), removed `glass-gradient` + `mesh-warm` backgroundImage tokens, removed `pulse-coral` animation + keyframe (referenced pre-Q64 coral hex). Fixed `s-amber.subtle` (#FFF4E8 → #FCEBD3) and `s-amber.text` (#7A4A2D → #8C4A14) per LIVE_TRUTH §2. Net delta: -15 lines (175 → 160).
- **Why:** Colored-glow shadows banned per SOLEN_UI §5c. Glass + decorative gradients retired per LIVE_TRUTH §8. `pulse-coral` references retired coral hex post-Q64. Amber drift surfaced during preview/React sync — preview correctly used LIVE_TRUTH spec, config had stale values.
- **Commit:** uncommitted (user reviews diff before commit)
- **Recoverable via:** git history (single file diff)
- **Verification:** grep counts confirmed 0 matches for `coral-glow`, `amber-glow`, `v5-glow-coral`, `glass-gradient`, `mesh-warm`, `pulse-coral` post-edit.

### 2026-05-04 — SOLEN_DESIGN.md §11 + §12 marked RETIRED
- **Action:** Inserted ⚠️ RETIRED banners atop §11 (search bar — referenced banned horizontal-segmented pattern + retired DM Sans) and §12 (section patterns — referenced retired Bebas Neue + Fraunces). Historical content preserved below banners. Net delta: +4 lines (589 → 593).
- **Why:** Both sections directly contradict LIVE_TRUTH (§6 typography + §7 hero search spec). Per CLAUDE.md hierarchy LIVE_TRUTH wins. Banners prevent future AI agents from implementing stale patterns when reading the doc.
- **Commit:** uncommitted (user reviews diff before commit)
- **Recoverable via:** git history (single file diff)

### 2026-05-04 — Phase 1 orphan deletion (_archive/)
- **Action:** Deleted 4 files from `components-legacy/_archive/`: QuartierTile.tsx, RecommendedSalons.tsx, WaitlistModal.tsx, WeatherBanner.tsx (~10.6 KB total). Folder removed (was empty).
- **Why:** Confirmed orphan via 2-pass audit (Explore subagent 2026-05-04, Category A). Zero imports across app/, lib/, hooks/, components-legacy/. Already explicitly archived per pre-existing `_archive/` convention.
- **Commit:** uncommitted (user reviews diff before commit)
- **Recoverable via:** git history (file restore by SHA)

### 2026-05-04 — Phase 2 orphan deletion (single-feature orphans)
- **Action:** Deleted 23 files across barber/, dashboard/ (incl. dashboard/barber and dashboard/waxing), nail/, profile/, salon/, shared/, plus root index.ts in `components-legacy/`. SKIPPED 16 files originally flagged as orphans — all confirmed actively wired via dependency chains to live app routes (AiMatcherModal, CompareBar, CompareDrawer, NailPreferencesForm, ReportProblemModal, DeviceFrame, EditPanel, RequestList, PageTransition, AllergyWarning, InspoBoard, InspoUploader, MaterialSelector, ShapeLengthPicker, NailDesignCard, NotificationItem). No empty folders left behind.
- **Why:** Removed to reduce surface area for AI drift before V2 rebuild.
- **AUDIT FLAG:** 41% false-positive rate in Category A for Phase 2 — Explore audit's "no direct import" check missed transitive dependency chains rooted at `app/[locale]/layout.tsx` (compare, notifications, layout) and feature-bundle barrels (CoiffeurSections, EditorPage, NailBookingSteps, TechPortfolio). Recommend re-running orphan audit with transitive-reachability-from-app-route criterion before Phase 4-5.
- **Commit:** uncommitted (user reviews diff before commit)
- **Recoverable via:** git history (file restore by SHA)

### 2026-05-04 — Phase 3 orphan deletion (booking/ stale flow)
- **Action:** Deleted 10 files from `components-legacy/booking/` (audit said 14, actual safe-to-delete count = 10 — see deviation below): ConfirmationStep, CustomerPreferencesForm, DateSelectionStep, GroupBookingModal, PaymentStep, ReviewPrompt, ServiceCart, ServiceSelectionStep, StaffSelectionStep, TimeSelectionStep. Surgically edited `components-legacy/booking/index.ts` from 19 → 9 re-exports — barrel now only re-exports actively-used components: BookingWizard, ServicesStaffStep, DateTimeStep, PayConfirmStep, StaffPicker, GuestBookingForm, PackageRedeemBanner, BookingCard, BookingsList.
- **Why:** 10 of 16 booking/ files were barrel-export ghosts — re-exported by `booking/index.ts` but no external consumer. Removed stale flow to prevent AI drift back to old booking-wizard patterns during V2 rebuild (the new booking flow will be designed externally per V2 plan).
- **Deviation from audit:** 4 files originally on the deletion list (BookingCard, ServicesStaffStep, DateTimeStep, PayConfirmStep) were SKIPPED — they are transitively required by the survivors BookingWizard (via barrel) and BookingsList (direct relative import). Deleting them would break two consumer pages: `app/[locale]/salon/[slug]/booking/page.tsx` and `app/[locale]/profile/bookings/page.tsx`.
- **Commit:** uncommitted (user reviews diff before commit)
- **Recoverable via:** git history (file restore + index.ts revert)

### TEMPLATE for future entries
```
### YYYY-MM-DD — [action]
- **Action:** [specific files + what changed in 1-2 sentences]
- **Why:** [cite LIVE_TRUTH §X / SOLEN_UI #Y / retired list / V2-D0X]
- **Commit:** [SHA or "uncommitted"]
- **Recoverable via:** [how]
```

---

## Quarantined (`components-legacy/` status)

- **Where:** `/components-legacy/` (moved from `/components/` 2026-05-03)
- **Count:** 355 .tsx/.ts files total
  - **Layout chrome (KEEP, used by `app/[locale]/layout.tsx`):** 11
  - **Actively used by other routes:** 235
  - **Orphans (no route imports):** 109 — pending user review for deletion (see "Orphan audit" below)
  - **Transitive orphans:** 0
- **Importable as:** `@/components-legacy/*`
- **Status:** preserved during V2 rebuild. Old routes still call from this path via 592 import lines swept across 114 files.
- **Tailwind scans:** `tailwind.config.js` content array includes both `components/` (new, currently empty + .gitkeep) and `components-legacy/`.
- **Will fully delete when:** all main routes (homepage, salon detail, booking wizard, profile, dashboard) have been rebuilt and no new route imports from legacy.

### Orphan audit (2026-05-04, awaiting user approval before deletion)

**Audit method:** Explore subagent grepped all 355 files for import references across `app/`, `lib/`, `hooks/`, `components-legacy/`. Two-pass for transitive orphans. Result: 109 confirmed standalone orphans, 0 transitive.

**Phased deletion plan (pending user approval):**

| Phase | Files | Risk | Rationale |
|---|---|---|---|
| 1 | `_archive/` (4 files) | None | Already archived |
| 2 | Single-feature orphans (~20 files) | Low | Self-contained, no inter-deps |
| 3 | `booking/` orphans (16 files) | Medium | Superseded by current `BookingWizard` + `BookingsList` |
| 4 | UI primitives + `discovery/` orphans (28 + 19 files) | Medium-high | Verify no deep shadcn-style imports first |
| 5 | Root-level orphans (`CategoryHero`, `ReviewCarousel`, `TerminePage`) | Low | Substantial files; verify not referenced in docs |

**Full 109-file orphan list:** see Explore subagent report (2026-05-04). Categorized by directory:

- **`ui/`:** 28 (button, card, input, label, tabs, BottomSheet, GlassCard, HeroVisualCard, HomeSearchBar, HowItWorks, PriceSlider, ProgressDots, SearchBar, SocialProofStrip, WaitlistModal, border-beam, tracing-beam, category-icons, +others)
- **`discovery/`:** 19 (BookCTA, CategoryPills, CutGuide, ReportButton, ShareButton, SimilarStyles, KISection, +others)
- **`booking/`:** 16 (BookingCard, BookingWizard, ConfirmationStep, DateTimeStep, PayConfirmStep, +others — BookingWizard re-exported via `index.ts` but only 2 of 19 barrel exports actually consumed externally)
- **`dashboard/`:** 11 (BreakManager, ClosureManager, SolenScoreCard, ScheduleGrid, +others)
- **`nail/`:** 9 (AllergyWarning, InspoBoard, NailDiscoveryFilters, RetailCheckout, +others)
- **`barber/`:** 4 (CutHistoryTimeline, LoyaltyCard, LoyaltyCardList, WalkinQueue)
- **`_archive/`:** 4 (QuartierTile, RecommendedSalons, WaitlistModal, WeatherBanner)
- **`salon/`:** 3 (BookingSidebar, MobileBookingBar, SalonTabBar)
- **`editor/`:** 3 (DeviceFrame, EditPanel, RequestList)
- **`compare/`:** 2 (CompareBar, CompareDrawer)
- **Root + other:** 10 (CategoryHero, ReviewCarousel, TerminePage, index.ts, layout/PageTransition, coiffeur/AiMatcherModal, disputes/ReportProblemModal, profile/LooksGrid, notifications/NotificationItem, shared/HandDiagram)

---

## In-flight (external design)

- **Tool:** Static HTML mockup (user choice 2026-05-03)
- **Format expected:** single .html file, similar shape to `public/solen-coral.html`
- **Will live at:** `public/solen-v2-design.html` (or similar — user names)
- **My role on receipt:**
  1. Parse the HTML — extract per-section tokens, copy, structure
  2. Compare against LIVE_TRUTH locks (table below) — flag ANY conflicts for user decision BEFORE implementing
  3. Translate sections to React components in `app/[locale]/_components/`
  4. Implement homepage hero first (single component, user judges in isolation)
- **Status:** awaiting delivery from user
- **Expected scope:** at minimum the homepage. Optimal: full template set.

---

## Locked & surviving (do not touch regardless of new design)

These survive any further pivots within v2. Pinned here so future-me doesn't re-litigate. **Updated for V2-D15-3 (2026-05-07)** — orange/Bricolage/cream-substrate row values archived; V3 dark teal + Cooper BT + Avant Garde Gothic + 4 categories now locked.

| What | Value | Source |
|---|---|---|
| Brand color | dark teal `#043338` (Republik panel #4) | LIVE_TRUTH §1 + V2-D15-3 |
| Brand pale / subtle / mid | `#C2F0F1` pair · `#E1F4F4` subtle pill bg · `#0A6873` mid hover | LIVE_TRUTH §1 |
| Typography display | Cooper BT 900 (single weight, mixed-case) — hero h1 / logo / feature h2 / category panel h1 only | LIVE_TRUTH §5 |
| Typography body / UI | ITC Avant Garde Gothic Std 300/400/500/600/700 — everything else | LIVE_TRUTH §5 |
| Typography free fallbacks | Sansita 900 (Cooper) · League Spartan (Avant Garde) · Inter Tight (final) | LIVE_TRUTH §5 |
| No italic anywhere | period (V2-D15) | LIVE_TRUTH §5.3 |
| Page background | white `#FFFFFF` (substrate; permanent — V2-D15 reverted from cream) | LIVE_TRUTH §4 |
| Card surface | white `#FFFFFF` (always) | LIVE_TRUTH §4 |
| Sunken surface | `#FAF7F3` (inactive search, disabled inputs) | LIVE_TRUTH §4 |
| Ink scale | `#1A1209` / `#56463E` / `#7A6957` / `#C4B8A6` (cool greys banned) | LIVE_TRUTH §4 |
| Heart save color | love-red `#FF4A6B` (NEVER brand, NEVER overridden) | LIVE_TRUTH §3 |
| Status semantic | success `#16A34A` · warning `#F59E0B` · error `#D32F2F` · closed `#DC2626` · star `#F3A864` (DISTINCT from brand) | LIVE_TRUTH §3 |
| Per-category (V3 — 4 cats) | Coiffeur Z `#FFF1DD`+`#B5345A` · Barbershop G `#D8D6CB`+`#000` · Nails A `#CAE8FF`+`#B50051` · Spa & Wellness I `#193120`+`#948565` | LIVE_TRUTH §2 |
| Pill rule | every pill text is `#FFFFFF` on dark or `#000000` on light, NEVER tinted-of-bg | LIVE_TRUTH §5a |
| Atmosphere wash | white substrate + 5-stop radial gradient (cyan core + navy framing + horizon bleed) | LIVE_TRUTH §5g |
| Color philosophy | Yuh density (60–100×/page small) + Republik monochrome-per-panel | LIVE_TRUTH §5h |
| Combo library | 31-combo grid A–EE at `public/solen-v2-combos.html` (5th cat / Pro variant reserves) | LIVE_TRUTH §5i |
| Easings | `--ease-snap` 200ms · `--ease-spring` 400ms · `--ease-glide` 600ms · `--ease-thud` 150ms | LIVE_TRUTH §5c |
| Spacing scale | 4px-based (4/8/12/16/20/24/32/48/64/96) | LIVE_TRUTH §6 |
| Breakpoints | 3 only — base / 768px / 1024px (+ optional 1280px) | LIVE_TRUTH §6b |
| Dark mode | not in scope (single light theme — Q62 carries over) | LIVE_TRUTH §4 |
| Icon library | Lucide outlined, 1.8 stroke, `currentColor` inherit | LIVE_TRUTH §5e |
| Voice | confident, useful, Swiss-direct. German primary, du-form. Multi-city: Basel + Zürich + Bern at launch. | LIVE_TRUTH §0 + §1b |
| Cities | all 3 share brand teal — no per-city accent | LIVE_TRUTH §1b |
| Backend (lib/, hooks/, app/api/) | untouched — design respects existing API contract | CLAUDE.md |

**Retired V2/V1 values (do not reintroduce):** Brand orange `#E8742A` + variants (`#FFE4D2`, `#8A3C0F`, `#5C2308`, `#F0834D`); 6-cat colorways (rose/sunny/clay/sage/coral-orange/camel/plum); typography Bricolage Grotesque, Inter Tight as PRIMARY, Instrument Serif italic, JetBrains Mono, Anton, Figtree, Peace Sans, Open Sauce Sans, Fraunces; cream substrate `#FBF8F3`; Makeup category; Wellness as separate category.

---

## Decisions this rebuild

New Q-style locks made during the V2 rebuild. When finalized → propagate to LIVE_TRUTH §s.

### V2-D01 (2026-05-03) — Plum retired from Anton hero headlines (provisional)
- **Context:** Session — plum `#4A1E3C` for hero "BEAUTY." line read as outlier (didn't tie to amber accents or brand-green CTA).
- **Decision:** Hero headlines pick from brand-green family (sage variants) or amber family for line-1 anchor. Plum reserved for category color (barber) per LIVE_TRUTH §5.
- **Status:** provisional pending external design lock.

### V2-D02 (2026-05-03) — Components quarantined not deleted
- **Context:** Strip-vs-quarantine debate.
- **Decision:** `git mv components components-legacy` + import sweep. Keep legacy reachable. Deletion deferred until new design locked + all routes migrated.
- **Status:** locked.

### V2-D03 (2026-05-03) — Doc structure simplified to 3 active layers
- **Context:** Audit found 4 design-related docs with contradictions.
- **Decision:** Three layers — V2_REBUILD_LOG (running state, this file), SOLEN_LIVE_TRUTH (specs), SOLEN_DESIGN §20 (history). Other doc sections marked retired.
- **Status:** locked.

### V2-D04 (2026-05-04) — Sub-agent supervision model for strip phase
- **Context:** User requested parallel sub-agent dispatch instead of supervising agent doing strip work directly.
- **Decision:** Strip steps dispatched to 3 parallel general-purpose sub-agents (hero deletion, tailwind cleanup, SOLEN_DESIGN banners) + 1 Explore sub-agent (orphan audit). None touch the log file directly — each returns proposed log entry, supervising agent aggregates. Avoids race condition + parallelizes work.
- **Status:** locked for this phase. Orphan deletion (next pass) will use same model.

### V2-D05 (2026-05-04) — Phase 4-5 deletion deferred → incremental route-by-route cleanup
- **Context:** First orphan audit had 25% false-positive rate (would have deleted 16 actively-used files in Phase 2 + 4 in Phase 3 if pre-flight grep hadn't caught them). Re-audit with transitive-reachability had 100% false-positive rate (claimed only 10 booking/ files reachable, missed the global Header / DashboardLayout / DetailPage / 11 layout chrome imports). Conclusion: import-graph reachability via grep is unreliable for ~280-file codebase; would need AST parsing (which requires npm install — rejected by user).
- **Decision:** Defer Phase 4-5 deletion. Replace with incremental cleanup tied to route rebuilds: each new route deletes the specific legacy components it replaces, in the same commit. End state (empty `components-legacy/`) is identical; risk is dramatically lower.
- **Status:** locked. See "Phase 4-5 deferred" section above for full process.

### V2-D06 (2026-05-05) — All new specs land IN `SOLEN_LIVE_TRUTH.md`, never in new docs
- **Context:** Audit of LIVE_TRUTH v2 surfaced 36+ spec gaps. Risk: each gap becomes a new doc, recreating the 4-doc-conflict problem from before.
- **Decision:** Every new spec is a new `§` section inside `SOLEN_LIVE_TRUTH.md`. NO new top-level docs (no `_tasks/PHASE_X.md`, no `_tasks/AUTH_SPEC.md`, etc). NO splitting LIVE_TRUTH into multiple files. The principal stays one principal. `SOLEN_UI.md` only updates if a genuinely new universal principle emerges.
- **Status:** locked.

### V2-D07 (2026-05-05) — Each phase blocks the next
- **Context:** 3 months of frontend pain happened partly because phases ran in parallel before specs locked, generating drift between in-progress surfaces.
- **Decision:** Phase N+1 does not start until Phase N is fully locked (all surfaces have spec + mockup + implementation + sign-off + V2-D## decision entry). Hard gate. The only exception: Phase 6 (B2B) can run in parallel from Phase 3+ because B2B is a separate workstream that doesn't share components with consumer.
- **Status:** locked.

### V2-D08 (2026-05-05) — HTML mockups split per surface as files grow
- **Context:** A single `solen-v2-design.html` covering all surfaces would become a 10K+-line monolith that's hard to navigate, slow to render, and error-prone to edit.
- **Decision:** Mockups split per surface using naming convention `public/solen-v2-<surface>.html`. Examples: `solen-v2-primitives.html`, `solen-v2-auth.html`, `solen-v2-salon-detail.html`, `solen-v2-booking.html`, `solen-v2-search-results.html`, `solen-v2-account.html`, `solen-v2-system.html`, `solen-v2-b2b.html`. Each file is independently servable for review.
- **Status:** locked.

### V2-D09 (2026-05-05) — Guest checkout decision (PENDING USER)
- **Context:** Phase 1 (auth) needs to know whether v1 supports booking-without-account. Affects Phase 2 booking wizard scope significantly.
- **Decision:** PENDING — see "Cross-cutting questions" in next-actions section.

### V2-D10 (2026-05-05) — Map view on /search/results (PENDING USER)
- **Context:** §25.16 already deferred map view for /[city]/[category]. /search/results is a different surface — confirm consistent.
- **Decision:** PENDING.

### V2-D11 (2026-05-05) — Loyalty / packages / gift cards in v1 (PENDING USER)
- **Context:** Phase 2 booking wizard might or might not redeem packages / gift cards. Default would be defer to v2.
- **Decision:** PENDING.

### V2-D12 (2026-05-05) — Stripe Connect (marketplace payouts) vs Stripe regular (PENDING USER)
- **Context:** Backend decision but affects B2B Phase 6 architecture significantly.
- **Decision:** PENDING.

### V2-D15 (2026-05-06) — Brand color + typography stay v2 · color exploration concluded
- **Context:** Spent ~2026-05-05 evening exploring whether brand orange `#E8742A` is right. Built 5 comparison labs: font-pivot, font-lab (10 candidates), matrix (palette × fonts), color-lab (8 brand colors), collision-test (which colors fight semantic alerts), ink-brand (Uber/Revolut/Aesop pattern), cta-options. User reached fatigue — every candidate either fought alerts (vibrant orange/coral/mustard/forest-green) or felt cold/disconnected (warm-ink CTA, "doesn't match the warm aesthetic"). Walked away overnight per the "step away 24h" option.
- **Reference research:** inspected Yuh's Swiss banking site overnight (`/tmp/yuh-research/yuh-design-categories.md` — 32-category breakdown extracted from their 438KB stylesheet). Headline finding: Yuh ships with a vibrant coral-orange brand `#fa5b35` adjacent to their semantic error red. **They live with the same alert-collision concern Solen was wrestling with.** Empirical evidence that vibrant warm brand color is a workable choice for a Swiss financial-flavor app even with imperfect semantic separation.
- **Decision (2026-05-06, fresh-eyes verdict):** v2 stays. Brand orange `#E8742A`, Bricolage Grotesque + Inter Tight + Instrument Serif italic + JetBrains Mono. Cream substrate `#FBF8F3`. Warm-ink scale. All §1–§5e locks hold. **Color exploration is concluded** — only minor tweaks accepted from here, no further palette/typography pivots without strong new evidence.
- **What this unblocks:** Phase 0 §F.1 implementation (form primitives → `app/[locale]/_components/primitives/`). Tailwind config updates can land alongside first React component. No more spec-level color debate.
- **What's parked, not killed:** the alert-collision concern is real and acknowledged. Revisit at v2-launch polish phase when real screens + real users provide signal. May surface as a future V2-D## (e.g. desaturated brand variant for transactional CTAs while marketing keeps current vibrant). Not before.
- **Files left on disk for future reference (do not delete):** `public/solen-v2-font-pivot.html`, `public/solen-v2-font-lab.html`, `public/solen-v2-matrix.html`, `public/solen-v2-color-lab.html`, `public/solen-v2-collision-test.html`, `public/solen-v2-ink-brand.html`, `public/solen-v2-cta-options.html`. Each captures a slice of the exploration. `/tmp/yuh-research/` is gitignored (in `/tmp`) — copy to `_tasks/research/yuh.md` if worth preserving long-term.
- **User feedback captured to memory:** "stop inventing stuff if you don't know — ask" (already in `feedback_dont_invent.md`). The collision-test row 10 / warm-ink-as-brand failure ("ugly black outline") was a direct application of that — I proposed a candidate without testing the visual outcome (the colored glow shadow created an outline-looking artifact under the dark fill). Memory entry updated.
- **Status:** locked. Phase 0 §F.1 implementation can start.

### V2-D15-1 (2026-05-07) — Full commitment on every research point ("don't implement conservatively")
- **Context:** After V2-D15 hybrid scratch reset, user reviewed the renewed visualization and called out the Republik colorway treatment as too conservative. Said: "evrth on each points each brand dont implement conservetory" — meaning every brand-reference point should be implemented at full strength, not partial.
- **Decision:** Amend V2-D15 with full-strength application of each research point:
  - **§2 Per-category colorways → Level 3 Republik commitment.** Brand orange `#E8742A` retreats from category pages entirely. Header band tinted at category-color × 6%, 3px solid stripe at top, h1 in **full saturated category color** (not deep variant — Republik energy), filter pill active in category color, "Buchen →" sticky bottom CTA in category-deep gradient (was brand-orange), count badge in category-deep, loading-more spinner in category color, section dividers at 30% category color. Brand orange returns at the cross-link footer (multi-category context) and main footer §21. The page IS the colorway.
  - **§5.1 Uber Display vs Text rule reinforced.** Bricolage ONLY at hero/section/card-name/big-numerics. Explicit DO NOT list (button labels, form labels, microcopy, footer links, eyebrow text, toast text, tooltip text). PR checklist enforces.
  - **§5c.7 Motion application checklist added.** 23 specific state-change moments × required motion treatment × required easing token. Implementation rule: every component PR lists which moments the component encounters + confirms motion wired. Motion that doesn't tie to a state change is banned.
  - **§25 Fresha sequencing principle made explicit.** Header band → filter pills → grid → end-of-list → cross-link footer → main footer. Order non-negotiable. Filter results re-render grid in place, never re-order page.
- **Rationale:** the user's "don't implement conservatively" is the strongest direction signal in 2 sessions. The earlier conservative Level 1 treatment of §2 was a hedge — committing to Level 3 means the references are taken seriously, not as "inspiration." Each research point now has spec-level enforcement (token swaps in §25, PR checklist additions, banned anti-patterns).
- **Brand-level implication:** brand orange becomes a global identity color (homepage hero, header city pill, save heart at semantic love-red exception, footer accent) — NOT an action color. Action color is category-themed on category surfaces, brand-orange-themed on global surfaces. Both work because they never share the same surface.
- **Status:** locked. Spec patches applied 2026-05-07. Visualization update pending.

### V2-D15-2 (2026-05-07) — Purple ban
- **Context:** During category-color exploration, user said "stop using purple — purple is banned everywhere" after the Wellness `#9B7BB8` plum and Coiffeur-deep `#6B2D4D` (which reads purple at large saturated surfaces) were tested.
- **Decision:** Wellness `#9B7BB8` plum is banned. Coiffeur-deep `#6B2D4D` is banned as a large saturated surface (still acceptable as small text accent for Coiffeur context). Wellness category color replaced with camel `#A66E3D` deep `#5C3D22`. Bern city tile gradient updated to camel.
- **Status:** applied to LIVE_TRUTH §2 (camel for Wellness in 6-cat era), then superseded by V2-D15-3 which retired Wellness as a separate category entirely.

### V2-D15-3 (2026-05-07) — Brand pivot: orange retired, dark teal locked + 6 cats → 4 cats + typography pivot
- **Context:** Sustained design exploration over 2026-05-07 evening. User systematically rejected the v2 brand-orange direction, the chunky Yuh-style Peace Sans + Open Sauce typography, and the 5-saturated-panel-per-page Republik category mode. Through iterative rounds (palette doc → swatch page → 31-combo grid → category-by-category picks), arrived at a fully-locked V3 palette grounded in: (a) Republik colorway research at `/tmp/republik-research/colorways.md` (19 panels extracted from live site), (b) Yuh discipline research at `/tmp/yuh-research/yuh-system.md` (3 pages sampled — coral used 35–101× per page), (c) user-flagged screenshots (the dark teal Republik panel + the Wirtschaft tomato red + the Westjordanland forest green), (d) graphic-design typography reference (Avant Garde Gothic + Cooper BT seen on social).
- **Decisions (all locked):**
  - **Brand color:** retire `#E8742A` orange. Lock `#043338` dark teal as `s-brand.DEFAULT` (Republik panel #4 — the dark teal article hero the user explicitly flagged from `https://www.republik.ch`). Brand pale `#C2F0F1` (Republik exact pair). Brand subtle `#E1F4F4`. Drop `s-brand.text` and `s-brand.text-deep` orange-era variants — dark teal at 14.74 : 1 on white is body-safe at any size, no `text-deep` needed.
  - **Brand discipline:** Yuh-density rule. Brand teal appears 60–100× per page in tiny accents (logo, links, list bullets, ONE word per hero h1, CTA pills, status text). Never as hero panel bg. The discipline is density, not size.
  - **Categories:** 6 cats → 4 cats. Drop Wellness as separate (merge into Spa & Wellness). Retire Makeup. Defer Waxing post-launch. Lock combo letters from `public/solen-v2-combos.html`:
    - Coiffeur = **Z** (cream `#FFF1DD` + cherry `#B5345A`, 5.24 : 1 AA)
    - Barbershop = **G** (bone `#D8D6CB` + black `#000`, 14.40 : 1 AAA — Republik panel #7)
    - Nails = **A** (pale ice blue `#CAE8FF` + magenta `#B50051`, 5.35 : 1 AA — Republik panel #1)
    - Spa & Wellness = **I** (forest `#193120` + sandy beige `#948565`, 3.86 : 1 AA-large — Republik panel #9, user-flagged Westjordanland screenshot)
    - Retired 6-cat hexes: `#B5588A` (rose), `#E8A957` (sunny), `#C77A5C` (clay), `#88B89E` (sage), `#D66547` (coral-orange), `#A66E3D` (camel) — all do not reintroduce.
  - **Typography:** retire Bricolage Grotesque (display) + Inter Tight (primary body) + Instrument Serif italic + JetBrains Mono. Lock **Cooper BT** (display: hero h1, logo, feature h2, category panel h1) + **ITC Avant Garde Gothic Std** (body, UI, section h2s, eyebrows, buttons, microcopy, numerics). Free Google Fonts fallbacks: Sansita 900 (Cooper) + League Spartan (Avant Garde) + Inter Tight (final fallback). Retire intermediate Peace Sans + Open Sauce Sans considered briefly. The pairing was user-locked from a graphic-design reference.
  - **Pill rule:** every pill-shaped UI element (CTA, tag, chip, badge, numbered circle) uses `#FFFFFF` on dark or `#000000` on light. No tinted-of-bg colors. Inline links / status text / eyebrows can still use tinted brand teal — the rule is for PILLS specifically. (See LIVE_TRUTH §5a.)
  - **Atmosphere wash:** hero substrate stays white with a 5-stop radial gradient — pale ice blue + pale teal core + royal blue navy framing + horizon bleed. Locked CSS in LIVE_TRUTH §5c. NOT painterly SVG (deferred — would need designer asset, out of scope).
  - **Color philosophy (locked design law):** white substrate permanent. ONE brand color used densely. Brand never a hero substrate. Saturated panels follow Republik monochrome rule (one text color per panel). Pastels for soft tiles or atmosphere, never section bgs at body density. Semantic colors stay semantic. Pill text white-or-black. (See LIVE_TRUTH §5d.)
  - **Combo library:** the 31-combo grid at `public/solen-v2-combos.html` (A–S Republik-extracted, T–EE fresh hue-gap fills) is the exclusive source for adding future categories or themed feature pages. (See LIVE_TRUTH §5e.)
- **Source-of-truth artifacts:**
  - `public/solen-v2-republik-teal.html` — the locked V3 homepage mockup (Inter Tight retired, Cooper + Avant Garde applied)
  - `public/solen-v2-palette.html` — full V3 palette swatch page
  - `public/solen-v2-combos.html` — 31-combo grid reference (A–EE)
  - `/tmp/republik-research/colorways.md` — research artifact (19 Republik panels with hex/contrast/font/laws)
  - `/tmp/yuh-research/yuh-system.md` — research artifact (Yuh discipline across 3 pages)
  - `/tmp/solen-palette/v3-bright-modern.md` — preliminary palette spec doc
- **Files to retire from `public/`** (V2-D15-era exploration labs, no longer authoritative):
  - `solen-v2-font-pivot.html`, `solen-v2-font-lab.html`, `solen-v2-matrix.html`, `solen-v2-color-lab.html`, `solen-v2-collision-test.html`, `solen-v2-ink-brand.html`, `solen-v2-cta-options.html` — brand-orange-era explorations, retire next cleanup pass.
  - `solen-v2-renewed.html`, `solen-v2-republik.html`, `solen-v2-3-options.html`, `solen-v2-colorways.html` — V2-D15/D15-1-era explorations, retire.
- **Implications for tailwind.config.js:** still V2 tokens. Token swap will land alongside Phase 0 §F.1 React components when implementation starts. The pre-sweep-check hook (`.claude/hooks/pre-sweep-check.sh`) blocks any mass orange→teal sweep without `touch .claude/sweep-approved.flag` — explicitly authorize the sweep when ready.
- **Implications for messages/de.json:** drop `makeup` category key when v1 launches. Keep `coiffeur`, `barbershop`, `nails`, `spa`. FAQ copy already says "Spa & Wellness" combined — no change needed.
- **What's parked, not killed:** the brand color is locked but a Solen Pro premium tier that wants its own visual identity could pull combo C (light grey + near-black) or H (aubergine + white). Out of v1 scope. Waxing as a 5th category is parked — bring back when launch data shows demand.
- **User direction quoted (for future audits):** "i want yuh restraint with the color i just showed you"; "stop using purple"; "i wanna go yuh style"; "Avant Garde Gothic + Cooper BT"; "we ditched makeup a long time ago" (4-cat lock); "Coiffeur = Z, Barbershop = G, Nails = A, Spa & Wellness = I" (combo lock).
- **Status:** foundations locked. LIVE_TRUTH §1, §2, §5 patched. New sections §5a (pill rule), §5g (atmosphere wash), §5h (color philosophy + cumulative palette), §5i (combo library) added. Mockup at `solen-v2-republik-teal.html` reflects the lock.
- **⚠️ Pending follow-up sweep:** 32 references to brand orange `#E8742A` remain in component-level specs (§F.1 form primitives, §12 header, §13 hero, §14 search, §16 salon card — focus rings, switches, radios, checkboxes, pulse dots, caret, hover bg). These reference the old orange literal — need to be updated to `#043338` brand teal. Plus `#FFE4D2` brand-subtle peach → `#E1F4F4` brand-subtle teal, `#F0834D` hover-top retired, `#8A3C0F` brand-text + `#5C2308` brand-text-deep retired (teal is body-safe at any size, no `text-deep` variant needed). `rgba(232,116,42,X)` brand-peach shadows → revisit (likely keep as warm-tint, or shift to teal-tint `rgba(4,51,56,X)`). This sweep is the brand-pivot scenario the `pre-sweep-check.sh` hook is designed for — when ready, run `touch .claude/sweep-approved.flag` then do a single coherent pass through LIVE_TRUTH component specs.
- Phase 0 implementation can resume on V3 foundations once the component-level sweep lands. Tailwind config swap (`s-brand` token from `#E8742A` to `#043338`) lands at the same time.

### V2-D15 (2026-05-07) — Hybrid scratch reset on LIVE_TRUTH foundations
- **Context:** After completing §F.1 form primitives (V2-D14), user asked deeper questions about brand identity by referencing 4 brands they admire (Republik colorways, Fresha layout, Uber typography+icons, Airbnb animations). Two AI research deliverables on those brands came back with verifiable citations, identifying patterns that VALIDATED most of v2 (per-category palette, Bricolage+Inter Tight, motion vocabulary, page sequencing) but INVALIDATED 3 specific elements (warm cream substrate, Instrument Serif italic accents, JetBrains Mono numerics).
- **Decision:** Hybrid scratch reset — rewrite foundations of `SOLEN_LIVE_TRUTH.md` from scratch grounded in the research, but preserve component patterns + §F.1 primitives + §25 category page + §24b/§24c cross-cutting. Cost: 2-3 hours of work. Net result: foundations re-anchored to research (not the original v2-prelim paste from the user's parallel Claude session), most implementation preservation intact.
- **Specific changes from v2-prelim:**
  1. **Substrate:** warm cream `#FBF8F3` → white `#FFFFFF`. All 4 reference brands use white. Cards now lift via shadow + border, not cream-vs-white contrast. §3 Warm-ink scale + substrate updated; §F.1 form primitive bg note updated; §9c sticky tab bar bg updated; §12.7 sticky header bg updated; §24b.4 contrast pairings recalculated (white substrate ratios actually slightly higher than cream); §25.6 sortieren sheet bg updated; §25.11 cross-link footer kept a subtle warm-grey gradient as visual delineation (not a substrate revert).
  2. **Typography:** dropped Instrument Serif italic + JetBrains Mono. 2 typefaces total: Bricolage Grotesque (display) + Inter Tight (body + UI + numerics with `font-variant-numeric: tabular-nums`). Italic-as-moment ornament gone from the system. §5 rewritten; §5.3 explicitly retires the italic accent moment; §13.3 hero greeting no longer italic; §16.4 salon card rating no longer mono; §F.1 numerics updated.
  3. **Per-category colorway treatment (Republik move):** new §2 + §1.1 brand-orange-discipline rule + §32 (preserved §25) updated. On category pages, category color (Coiffeur rose `#B5588A`, etc.) carries page-identity — h1, breadcrumb-current, accent bar above breadcrumb, section dividers. Brand orange retreats to global elements (header, save heart, footer accent) on those pages. New §2.1/§2.2/§2.3 detail where category color appears + does not + anti-patterns.
  4. **Voice:** stripped V1 "editorial-magazine that printed your haircut" framing. New §0 voice paragraph: "confident, useful, Swiss-direct. Not literary. Not corporate." Du-form German default, Sie only in legal copy.
  5. **Iconography (§5e.1):** added 10-signature-icon concept as future custom-tweak set (deferred to v2-launch polish, CHF 200-500 budget). v1 stays on Lucide as-is.
  6. **§5b Depth system:** simplified to single-shadow Yuh-style approach (was stacked-layer in v2-prelim). Cleaner rendering at scale.
  7. **§5c Motion principle (Airbnb):** added explicit "motion is for state-change continuity, not decoration" as governing rule. Implementation discipline note: motion MUST be applied at state-change moments, not specced and forgotten.
  8. **PR Checklist additions:** category-colorway audit lines, italic-removal audit, mono-removal audit, no-cream-revert audit.
- **Research sources:** documented in user's research-prompt deliverables (paste in conversation 2026-05-07). Republik philosophy quotes from Brigitte Meyer ("kein Chichi, kein Bullshit, keine Schnörkel" / "präzises Bild von Fall zu Fall"). Uber Move type system spec from MCKL. Airbnb Motion Engineering at Scale from Airbnb tech blog. Fresha venue detail page section order from live inspection via Playwright.
- **Status:** locked. Component patterns and §F.1 primitives unchanged in their internal logic — only the cream→white + italic-removal + mono-removal sweep applied to text references.
- **Implications for tailwind.config.js:** still V1 tokens. Token swap will land alongside the first React primitive component when Phase 0 implementation starts. No wholesale sweep needed.

### V2-D14 (2026-05-05) — §F.1 form primitives — 4 open decisions resolved
- **Context:** First Phase 0 spec drafted. Audit found 4 open questions visualized at `public/solen-v2-decisions.html` for user to compare side-by-side.
- **Decisions (locked by user):**
  - **Issue 5 → Option B.** Keep 14px on md inputs. Accept iOS auto-zoom on focus. No transform-scale workaround. No `user-scalable=no` viewport hack. If a future surface needs zoom-free behavior, that single input can override to 16px (note in surface spec).
  - **Issue 6 → Option A.** Switch ON track = brand-orange `#E8742A`. Accepted exception to §1's "≤4 brand instances per screen" restraint principle for settings pages where many switches stack. Brand-orange holds at scale.
  - **Issue 7 → confirmed.** Circle elements use `var(--radius-full)` (50%) — radio circle, switch knob, avatar, heart button, status dots. Pills use `var(--radius-pill)` (99px). Loose phrasing "pill (50%)" replaced.
  - **Issue 8 → 3 reference states only.** Default / active / focus locked as standalone states. No "stacked" or "focus replaces active" sub-rule — in practice `:focus-visible` only fires for keyboard, so click-and-typing renders active w/o outline. If both fire (programmatic focus + click), both render and that's accepted.
- **Audit fixes also landed:**
  - Active bg `#FFF7F1` (invented) → `#FFF4E8` (matches §14.3 lock)
  - Disabled bg `#F5F0E8` (V1 leftover) → `#FAF7F3` (sunken cream from §3)
  - md padding 14px vertical → 12px (matches §13.4 hero search row lock)
  - Internal padding contradiction (§F.1.0 vs §F.1.0a) resolved by referencing the size table
- **Status:** §F.1 spec locked. Mockup at `public/solen-v2-primitives.html` is the next deliverable. After mockup approval → implementation in `app/[locale]/_components/primitives/` → V2-D15 implementation lock → §F.2 modal next.
- **User feedback captured to memory (2026-05-05):** "stop inventing stuff if you don't know — ask." Saved at `~/.claude/projects/.../memory/feedback_dont_invent.md` and indexed in `MEMORY.md`. Applies to all future spec drafting: never pull hex/size/copy from training data when not in locked sections; either reuse a locked value or flag as open question for user decision.

---

### V2-D13 (2026-05-05) — LIVE_TRUTH replaced wholesale with v2 spec from parallel Claude session
- **Context:** User compiled a fresh v2 design spec across 4 sequential design steps in a separate Claude session (covering brand color, geographic scope, semantic + warm-ink + per-category palettes, typography, depth, personality, layout fundamentals, hit targets, header, hero, search system, section headers, salon card, scroll row, entdecken, city tiles, b2b card, footer, SEO link wall, homepage flow, a11y baseline, analytics, and the full /basel/coiffeur category page). Pasted into this session 2026-05-05 along with a finished /basel/coiffeur HTML mockup. Old LIVE_TRUTH (V1: forest green `#1B4D1B` + Anton/Figtree) was incompatible — different brand color, different fonts, different surface decisions throughout.
- **Decision:** V1 LIVE_TRUTH renamed to `_tasks/archive/SOLEN_LIVE_TRUTH_v1.archived.md` via `git mv` (history preserved). New `_tasks/SOLEN_LIVE_TRUTH.md` written from the v2 paste verbatim with: (a) paste artifacts cleaned (autolink remnants like `[solen.ch](http://solen.ch)`), (b) navigation index added at top, (c) "What's still missing" section appended listing the 36 surface gaps mapped to Phases 0–6. Visualization at `public/solen-v2-locked.html` shows palette + type specimen + locked components + the entire /basel/coiffeur reference inline.
- **Status:** locked. From this point forward, this v2 doc IS the principal. V1 references in any other doc need to be updated to point at the archive path or the new spec.
- **Implications for tailwind.config.js:** still contains V1 tokens (`s-coral.DEFAULT = #1B4D1B`, Anton/Figtree font stack). Will be updated as Phase 0 primitives land — token swap won't be a single sweep, it'll happen alongside the first React components that consume v2 tokens. Pre-sweep hook (`.claude/hooks/pre-sweep-check.sh`) still active; v2 hex sweep will need explicit `sweep-approved.flag`.

---

## Phase 4-5 deferred — incremental cleanup model

**Decision (2026-05-04):** Phase 4 (UI primitives + discovery sub-components) and Phase 5 (root-level orphans) deletion is **DEFERRED in favor of incremental cleanup tied to route rebuilds**.

**Why deferred:**
1. Two attempts at orphan-graph audit failed badly (first audit: 25% false-positive deletion of actively-used files; second audit: 100% false-positive — claimed almost everything is orphan including the global Header). Import-graph reachability via grep is unreliable for ~280-file codebases with re-exports, dynamic imports, barrel files, and feature bundles.
2. Reaching the goal (empty `components-legacy/`) doesn't require a single mass deletion. Route-by-route rebuild reaches the same end state.
3. Marginal benefit of additional deletion is shrinking (the main drift surface — default `components/` path — is already empty). Marginal risk of broken audits is growing.

**Incremental cleanup process (replaces Phase 4-5):**
1. When a new route is built from the external design mockup, identify which legacy components it functionally replaces
2. Delete those specific legacy components in the SAME COMMIT as the new route
3. Each deletion is provably safe (the new route works without them, no other route imports them — verified per-route, not per-codebase)
4. Append a "Stripped" log entry per route migration noting what was removed and which new route superseded it
5. After ~5 weeks of route rebuilds, `components-legacy/` empties naturally → final cleanup is just `rmdir`

**Backstop:** If at end of rebuild any legacy files remain unattached to a "new route replaces this" mapping, do a final manual review (likely <30 files at that point — small enough to eyeball).

---

## Next actions

1. **User reviews v2 doc + visualization** — `_tasks/SOLEN_LIVE_TRUTH.md` (the new principal) and `public/solen-v2-locked.html` (`localhost:3000/solen-v2-locked.html` after `npx serve public`). If anything in the spec doesn't match user intent, fix the spec first, then re-render the visualization.
2. **Phase 0 — Foundation primitives.** Per the locked plan, Phase 0 covers §F.1–§F.8: form primitives, modal, bottom sheet, toast, date/time picker, skip-link, font fallback strategy, cookie consent. For each: (a) draft spec section in LIVE_TRUTH, (b) component-by-component HTML mockup at `public/solen-v2-primitives.html`, (c) implement in `app/[locale]/_components/primitives/`, (d) lock with V2-D## entry. Phase 1 (auth) does not start until Phase 0 is fully locked.
3. **Tailwind token swap** lands incrementally as primitives consume v2 tokens. Token additions go into `tailwind.config.js` alongside the first React component that needs them; no mass sweep. The pre-sweep hook stays armed.
4. **Legacy retirement** continues per V2-D05 — each new route deletes the specific legacy components it replaces in the same commit. Append "Stripped" entry per route.

---

## Reading hierarchy (when docs conflict)

Per CLAUDE.md:
1. `_tasks/SOLEN_LIVE_TRUTH.md` wins (current locked specs — V3 / V2-D15-3 lock 2026-05-07)
2. `_tasks/SOLEN_DESIGN.md` §20 decisions log — historical context only
3. **V3 visual references:** `public/solen-v2-republik-teal.html` (homepage) · `public/solen-v2-palette.html` (palette swatches) · `public/solen-v2-combos.html` (31-combo library)
4. Component JSDoc — implementation notes only

**Retired visual references (do not consult):** `public/solen-coral.html`, `public/solen-v2-design.html`, the V2-D15-era exploration labs (`solen-v2-font-pivot.html`, `solen-v2-color-lab.html`, etc.). All represent superseded design states.

**This log slots in as the "running state" layer — NOT a competing source of truth.**

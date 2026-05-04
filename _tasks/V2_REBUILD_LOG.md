# Solen V2 Rebuild Log

> The single living doc that answers "what does the codebase look like RIGHT NOW."
> Reading order: Status → Stripped → Quarantined → In-flight → Locked & Surviving → Decisions → Next actions.
>
> NOT a design system spec. `_tasks/SOLEN_LIVE_TRUTH.md` owns specs.
> NOT a decision history. `_tasks/SOLEN_DESIGN.md` §20 owns history.
> This doc owns the running narrative.

---

## Status (one-liner)

**2026-05-04** — Strip phase MEDIUM: COMPLETE (deferred Phase 4-5 to incremental route-by-route cleanup — see "Phase 4-5 deferred" below). Awaiting external HTML design mockup. Backend untouched. v2 hero attempt deleted. Homepage = empty shell. `components-legacy/` quarantined (318 files: ~250 actively used, ~30-50 likely-orphan to be removed during rebuild).

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

These survive any V2 design pivot. Pinned here so future-me doesn't re-litigate.

| What | Value | Source |
|---|---|---|
| Brand color | forest green `#1B4D1B` | LIVE_TRUTH §1 + Q64 |
| Brand color name in code | token kept as `s-coral` (value = green) | LIVE_TRUTH §9 carve-out #4 |
| Typography display | Anton 400 (single weight) | LIVE_TRUTH §6 + Q23/Q48 |
| Typography body | Figtree 400-700 | LIVE_TRUTH §6 + Q48 |
| Page background | white `#FFFFFF` (cream-as-page-bg banned) | LIVE_TRUTH §4 + retired list |
| Dark mode | not in scope (single light theme) | Q62 |
| Icon library | Lucide outlined, 1.5-1.8 stroke | LIVE_TRUTH §6 |
| Voice | German primary, du-form, Swiss editorial | LIVE_TRUTH §17 |
| Heart save color | love-red `#FF4A6B` (NEVER brand) | LIVE_TRUTH §3 + SOLEN_UI #5b |
| Status success | mid-green `#16A34A` (DISTINCT from brand) | LIVE_TRUTH §3 |
| Per-category accents | coiffeur amber-deep, barber plum, nails coral, spa sage, makeup sand, waxing blue (locked exception) | LIVE_TRUTH §5 |
| `s-amber.subtle` | `#FCEBD3` (peach) | LIVE_TRUTH §2 — **fixed in tailwind.config.js 2026-05-04** |
| `s-amber.text` | `#8C4A14` (deep amber) | LIVE_TRUTH §2 — **fixed in tailwind.config.js 2026-05-04** |
| Backend (lib/, hooks/, app/api/) | untouched — design respects existing API contract | CLAUDE.md |

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

1. **User produces external HTML design mockup** at `public/solen-v2-design.html`
2. On receipt: parse mockup → compare against "Locked & surviving" table → flag conflicts → implement homepage hero first
3. If hero approved → implement remaining homepage sections one at a time. Each section that REPLACES a legacy component → delete that legacy component in the same commit (incremental cleanup per V2-D05).
4. Once full homepage locks → next route (salon detail) using same pattern
5. Update LIVE_TRUTH whenever a V2-D decision becomes truly locked
6. Append to "Stripped" section with each strip/build action

---

## Reading hierarchy (when docs conflict)

Per CLAUDE.md:
1. `_tasks/SOLEN_LIVE_TRUTH.md` wins (current locked specs)
2. `_tasks/SOLEN_DESIGN.md` §20 decisions log — historical context only
3. `public/solen-coral.html` (or `solen-v2-design.html`) — visual reference
4. Component JSDoc — implementation notes only

**This log slots in as the "running state" layer — NOT a competing source of truth.**

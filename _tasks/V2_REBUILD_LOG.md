# Solen V2 Rebuild Log

> The single living doc that answers "what does the codebase look like RIGHT NOW."
> Reading order: Status → Stripped → Quarantined → In-flight → Locked & Surviving → Decisions → Next actions.
>
> NOT a design system spec. `_tasks/SOLEN_LIVE_TRUTH.md` owns specs.
> NOT a decision history. `_tasks/SOLEN_DESIGN.md` §20 owns history.
> This doc owns the running narrative.

---

## Status (one-liner)

**2026-05-09 (afternoon, PHASE 0 COMPLETE)** — All 8 Phase 0 primitives shipped. V2-D28 §F.5 date picker + V2-D29 §F.6 skip-link + V2-D30 §F.7 font-display strategy + V2-D31 §F.8 cookie consent banner. Phase 0 took ~6 days end-to-end (V2-D14 §F.1 spec lock 2026-05-05 → V2-D31 §F.8 ship 2026-05-09). 8 React primitive components + 8 mockup HTML files + 5 LIVE_TRUTH §F sub-sections. **Phase 1 (auth) and homepage build now unblocked.** Per user direction next: V3 homepage React build → Phase 1 auth. · 

**2026-05-09 (afternoon, Phase 0 plow)** — V2-D28 lock: §F.5 date/time picker mockup + React shipped. `react-aria-components` Calendar wrapped with V3 styling, `@internationalized/date` for date math (DE-CH locale, Mon-first week), TimeSlotList composed alongside w 4-column grid grouped Vormittag/Nachmittag/Abend. Loading skeleton w shimmer animation, empty state, disabled dates via `isDateUnavailable` callback (booking flow uses for past dates + salon-closed days). Native `<input type="date">` explicitly banned per spec. Dev test page extended w 2 demos (date-and-time live + single-date variant). · 

**2026-05-09 (morning, +logo replacement)** — V2-D27 lock: V1/V2 Bebas-Neue-with-coral-dot logo retired. New logo = Cooper-style "Solen" wordmark mixed case + brand-teal `#043338` dot accent (option C from `public/solen-v2-logo-options.html` — user picked after seeing 4 options). 7 files patched: `public/logo.svg` (text+circle SVG, font fallback chain to Sansita), `public/favicon.svg` (coral circle → brand-teal circle), new `app/[locale]/_components/primitives/Logo.tsx` React component (4 sizes + light/dark tone variants + noDot prop), barrel + dev-page demo, V3 homepage mockup `.nav-logo` CSS updated (color brand→ink, added `::after` dot pseudo-element), LIVE_TRUTH §1.3 added with full V2-D27 lock spec. Live header (legacy) auto-fixes via `logo.svg` reference. · 

**2026-05-09 (morning, post-overnight, +font fix)** — User confirmed bigger sizes (V2-D26 — typography size refresh, kept ITC Avant Garde Gothic for body, bumped most subtexts +2-3px). 14 files patched (8 primitive components + dev page + 4 mockups need a future cleanup pass + LIVE_TRUTH spec sizes). Body 14→16, label 12→14, helper 11→13, eyebrow 11→13, card-tag 9→11, toast title 14→15, switch sub-label 12→13, pill toggle 12→13, input md size 14→16 (also resolves V2-D14/V2-D17 contradiction about iOS auto-zoom — md ≥16px now prevents focus-zoom). Display headings (Cooper-style h1/h2) unchanged. · 

**2026-05-09 (morning, post-overnight)** — User up. **V2-D09 / V2-D10 / V2-D11 / V2-D12 all resolved** (guest checkout OUT · map view IN · loyalty+packages+gift cards all IN v1 · Stripe Connect locked from DB schema implicit decision). Phase 1 (auth) unblocked. **NEW:** user flagged body font sizes feel small + asked for font visualization — see `public/solen-v2-font-visual.html` showing current Avant Garde Gothic at spec sizes vs +2-3px bumped sizes vs 5 alternative body fonts (Inter / Manrope / Plus Jakarta / DM Sans / Outfit). Cooper Black Std cdnfonts.com URL is currently HTTP 500 — headings silently falling back to Sansita 900 (looks visually similar). Awaiting font decision. · 

**2026-05-09 (OVERNIGHT SUMMARY — autonomous run complete)** — 3 of 3-4 sub-sections shipped + 1 spec drafted. Phase 0 advanced from §F.1 (V2-D17) → §F.4 (V2-D20) without user supervision.

### Shipped tonight (3 sub-sections, 4 commits):
- **V2-D18** (`e07d28e`) — §F.2 modal: spec + mockup + React + dev verification. `react-aria-components` Modal+ModalOverlay+Dialog. 3 sizes (sm/md/lg), 4 use cases. `tailwind.config.js` got 6 new z-index tokens.
- **V2-D19** (`9a112e8`) — §F.3 bottom sheet: spec + mockup + React + dev verification. Same react-aria stack as §F.2 but bottom-anchored. 3 height variants (auto/default 75dvh/full 90dvh). `useResponsiveOverlay()` hook for sheet↔modal switching.
- **V2-D20** (`07478f4`) — §F.4 toast: spec + mockup + React + dev verification. **Hand-rolled** queue + Context (react-aria-components only exports `UNSTABLE_Toast*` at v1.16.0). `<ToastProvider>` + `useToast()` hook. 4 tones. Max 3 visible, FIFO queue, error-priority override.
- **V2-D21** (this commit) — §F.5 date/time picker SPEC ONLY (mockup + React deferred — date pickers are the largest single primitive, half-shipping was worse than scheduling cleanly).

### Bucket B candidate decisions logged (need user sign-off — commit if approved as a V2-D## decision):

**§F.2 modal (V2-D18):**
- §F.2.5 footer destructive-tertiary placement: `<ModalFooter layout="between">` puts destructive on far left, primary group on right. *Picked because it visually separates "irreversible" from "primary action."*
- §F.2.7 default focus on destructive flows: `autoFocus` on "Abbrechen" (secondary), NOT "Löschen" (destructive). *Per §F.2.7 spec — accidental Enter doesn't fire destructive.*
- §F.2.8 close X hit-area extension via negative margin (`w-11 h-11 -m-2.5`). *Picked because it doesn't add extra spacing around the icon.*

**§F.3 sheet (V2-D19):**
- §F.3.0a heights = `auto / default / full`. *Mapped to use-case naming.*
- §F.3.7 desktop fallback breakpoint = 768px. *Matches Solen's existing mobile/desktop divide.*
- §F.3.2 drag handle 36×4px, ink/.20. *Middle ground — visible without decorative-loud.*

**§F.4 toast (V2-D20):**
- §F.4.1 default duration timing — success/info=3s, warning=6s, error=Infinity (sticky). *Split because warnings need longer read time, errors must NOT auto-dismiss.*
- §F.4.3 stack direction = newest at BOTTOM. *Mobile thumb position = viewport edge = where attention lives.*
- §F.4.4 action button = text-only brand-teal, hover ink-1. *Toast is already a card; button-on-button feels heavy.*

### Bucket B doc-cleanup TODOs (not blocking, deferred to attended doc-cleanup pass):
- §25.6 sort sheet line 3353 cites pure-black backdrop hex (`rgba(0,0,0,.35)`) which contradicts §4 anti-pattern. When §25.6 implements via §F.3, primitive's warm-ink prevails; surface text needs cleanup.
- (Pre-existing from V2-D17): §F.1.4 Variant B inactive bg cites gradient — V2-D15-4 supersedes (pills are flat).
- (Pre-existing from V2-D17): §F.1.7 line 1266 says inputs ≥ 16px but V2-D14 kept md at 14px.

### Bucket C blockers surfaced: NONE. Three sub-sections shipped cleanly.

### Phase 1 unblocked — V2-D09 / V2-D10 / V2-D11 / V2-D12 all resolved 2026-05-09:
- **V2-D09:** Guest checkout — **OUT** (signup required). §A.1 / §A.6 spec needs gate copy.
- **V2-D10:** Map view on /search/results — **IN**. §SR needs Karte/Liste toggle.
- **V2-D11:** Loyalty / packages / gift cards — **all 3 IN v1.** §BW step 3 needs promo + gift-card redemption + package redemption + loyalty toggle. Risk: scope expansion (~3-4 weeks). Implementation order: gift cards → packages → loyalty.
- **V2-D12:** **Stripe Connect** (confirmed prior implicit decision per DB_SCHEMA.md line 8 + SOLEN_DESIGN.md Q55).

### Suggested next session scope (Phase 1 unblocked):
1. User reviews + signs off (or overrides) each Bucket B candidate decision above. For each sign-off, append a V2-D## entry to V2_REBUILD_LOG.md.
2. **NEW request: font visualization** — user flagged body font sizes feel small + asked to see what fonts we have. See `public/solen-v2-font-visual.html` (V2-D26 candidate, not yet locked). User picks (a) bigger sizes only, (b) different body font + bigger sizes. Affects globals.css + tailwind config + V2-D15-3 typography lock.
3. **Phase 0 not finished but Phase 1 not gated by Phase 0 except §F.2 modal (shipped V2-D18).** Next session can start Phase 1 spec/mockup/implement loop in parallel with finishing Phase 0 (§F.5 mockup+React + §F.6 + §F.7 + §F.8). Default recommendation: do font fix first (it touches every component), then start Phase 1 auth surfaces (§A.1 login modal first — only needs §F.2 already shipped).

### Verification (when user wakes):
- `npm run dev` then http://localhost:3000/de/dev/primitives — every primitive renders interactively (form primitives + 4 modals + 3 sheets + 8 toast triggers).
- Static mockups: `npx serve public -p 4747` then open `/solen-v2-modal.html` / `/solen-v2-sheet.html` / `/solen-v2-toast.html`.
- `git log --oneline | head -5` shows V2-D18/D19/D20/D21 commits.
- `npx tsc --noEmit | grep -v "components-legacy\|tmp3\|tmp_header"` — empty (only legacy errors remain per V2-D05).

### Spec contradictions still unresolved (not blocking, doc-cleanup):
- §F.1.4 Variant B gradient (V2-D17 surfaced)
- §F.1.7 16px iOS rule (V2-D17 surfaced)
- §25.6 backdrop hex (V2-D19 surfaced)

----

**2026-05-09 (overnight, autonomous, +2)** — Phase 0 §F.4 toast primitive **shipped** (V2-D20). Spec at LIVE_TRUTH §F.4 (~146 lines, 4 tones success/info/warning/error + state matrix queued→opening→open→dismissing→closed + auto-dismiss timing 3s/3s/6s/sticky + bottom-center mobile / bottom-right desktop position + max-3-visible stacking with FIFO queue + error-priority override + ARIA live region rules + 9 anti-patterns). Mockup at `public/solen-v2-toast.html` shows 4 tone variants + mobile vs desktop position stages (3-stack mobile bottom-center, single error desktop bottom-right) + 5-step state timeline. React at `app/[locale]/_components/primitives/Toast.tsx` — **hand-rolled queue + Context** per spec §F.4.7 (react-aria-components only exports `UNSTABLE_Toast*` at v1.16.0, not safe to depend on). 4 exports: `<ToastProvider>` (render once at app root) + `useToast()` hook returning `{success,info,warning,error,custom,dismiss,dismissAll}` + `ToastTone` + `ToastOptions` types. Internal `<ToastRegion>` portal + `<ToastItem>` w hover-pause timer. `motion-reduce:` collapses to opacity-only 100ms. ARIA live region: `role="alert" aria-live="assertive"` for errors, `role="status" aria-live="polite"` for others. Stacking: max 3 visible, error tone replaces oldest non-error if queue full, others FIFO queue. Dev test page wraps `<PrimitivesDevPageInner>` in `<ToastProvider>` + new `<ToastDemo>` w 4 tone-fire buttons + 4 stacking-demo buttons (fire 5 to queue 2, with-action, title-only, dismiss-all). Typecheck clean. Live site impact: ZERO (still no route imports — `<ToastProvider>` will need to be added to `app/[locale]/layout.tsx` when Phase 1 surfaces start using `useToast()`, which is a future commit). **Three Phase 0 sub-sections shipped tonight — autonomous run goal met.** **Next:** §F.5 date/time picker spec only (no mockup, no React) → wake-up summary. · **2026-05-09 (overnight, autonomous, +1)** — Phase 0 §F.3 bottom sheet primitive **shipped** (V2-D19). Spec at LIVE_TRUTH §F.3 (~178 lines, anatomy + 3 height variants auto/default/full + 4-state matrix + drag handle visual-only-v1 + sticky bottom CTA pattern + mobile-only-w-desktop-fallback rule + ease-glide entry 600ms + ease-snap exit 200ms + 8 anti-patterns). Mockup at `public/solen-v2-sheet.html` renders 4 use cases inside iPhone-style frames (sort sheet auto, filter sheet 75vh w sticky CTA, share sheet auto, look-detail 90vh full). React at `app/[locale]/_components/primitives/Sheet.tsx` — composes same `react-aria-components` Modal/ModalOverlay/Dialog stack as §F.2 modal but bottom-anchored (translateY 100→0 motion via `data-[entering]:` modifiers, top-only radius 28px via existing `rounded-sheet` token, top-projecting shadow via arbitrary value). 4 sibling components (Sheet + SheetHeader + SheetBody + SheetCTARow). Plus `useResponsiveOverlay()` hook returning `"sheet"|"modal"` based on `(min-width: 768px)` matchMedia — SSR-safe (defaults to sheet, hydrates on client mount). `safe-area-inset-bottom` respected in SheetCTARow padding for iOS home-indicator. No new tailwind tokens (z-sheet-bg/z-sheet were added in V2-D18 batch). Dev test page extended with 3 sheet demos (sort sheet w live RadioGroup composition, filter sheet w PillGroup multi+single composition, share sheet). Typecheck clean. **Bucket B doc-cleanup logged:** §25.6 sort sheet line 3353 cites `rgba(0,0,0,.35)` backdrop hex which contradicts §4 anti-pattern; when §25.6 implements via §F.3 the warm-ink hex prevails — surface spec text needs cleanup later. Live site impact: ZERO. **Next:** §F.4 toast primitive — same loop. · **2026-05-09 (overnight, autonomous)** — Phase 0 §F.2 modal primitive **shipped** (V2-D18). Spec drafted into LIVE_TRUTH §F.2 (~183 lines, anatomy + 3 sizes + 4-state matrix + dismiss + focus + motion + 8 anti-patterns). Mockup at `public/solen-v2-modal.html` (anatomy stage with full backdrop+modal demo, 3-size grid, 4 use-case examples, 4-step state timeline, 8-card anti-pattern strip). React at `app/[locale]/_components/primitives/Modal.tsx` — composes `react-aria-components` `Modal` + `ModalOverlay` + `Dialog` (explicit V2-D18 architecture deviation from V2-D17 native-first since no native `<dialog>` has cross-browser focus-trap + scroll-lock + portal). Sibling components `ModalHeader` + `ModalBody` + `ModalFooter` follow V2-D17 composition pattern, each receives `size` prop (sm/md/lg) for padding. cva for surface-size variants. Motion via `data-[entering]:` / `data-[exiting]:` Tailwind modifiers + ease-snap (250ms entry, 150ms exit, scale 0.95→1, opacity fade). `motion-reduce:` collapses to opacity-only 100ms per §24b.3. `tailwind.config.js` got 6 new z-index tokens (sheet-bg/sheet/modal-bg/modal/toast/tooltip per LIVE_TRUTH §8 lock — naming aligns with the existing §8 z-index ladder). Dev test page extended with 4 modal demos (sm confirm, md login w TextInput composition, lg report-content w RadioGroup+Textarea composition, sm destructive w isDismissable=false+keyboardDismissDisabled). Typecheck clean for new files. Live site impact: ZERO. **Next:** §F.3 bottom sheet primitive — same loop. · **2026-05-08 (latest, evening)** — Phase 0 §F.1 form primitives **React implementation shipped** (V2-D17). 11 new files in `app/[locale]/_components/primitives/`: 6 primitives (TextInput / Textarea / Select / Checkbox / Radio / Switch) + 2 shared helpers (FieldLabel / FieldHelper) + 2 layout containers (RadioGroup / PillGroup) + 1 layout pill (PillToggle for Variant B of both checkbox + radio) + barrel `index.ts`. Plus dev test page at `app/[locale]/dev/primitives/page.tsx` (gated `notFound()` in production, route at `/[locale]/dev/primitives`). `tailwind.config.js` got 2 token additions: `s-bg.active = #FFF4E8` (input active-typing tint, was wrongly retired in V2-D15 comment) + 4 motion easings (`ease-snap`/`ease-spring`/`ease-glide`/`ease-thud`) per LIVE_TRUTH §F.1 + §5b motion vocabulary. Architecture: native HTML elements + cva for variants + cn() helper, NOT react-aria-components (matches §F.1.3 "v1 decision: native `<select>`" preference). Layout-shift-safe border treatment: 1px border + `ring-1 ring-inset` for second pixel of color (visually identical to 2px border, no layout shift on tone change). Typecheck passes — all 42 pre-existing tsc errors are in legacy code (`components-legacy/`, `tmp3.tsx`, `tmp_header.tsx`) flagged in V2-D05 for incremental retirement. **Live site impact: zero** — no existing route imports the primitives yet, they're dormant utilities. To verify visually: `npm run dev` then navigate to `/de/dev/primitives`. **Next:** §F.2 modal primitive — spec draft + mockup, same loop. · **2026-05-08 (latest)** — Phase 0 §F.1 form primitives mockup **locked** (V2-D16). `public/solen-v2-primitives.html` rebuilt from scratch on V3 tokens (was pre-V3: Bricolage / Inter Tight / orange `#E8742A` / cream substrate / italic — all retired). New mockup uses Cooper BT for page h1 + section h2s only (display moments), ITC Avant Garde Gothic Std for everything else, brand-teal `#043338` for focus/checked/on states, white substrate + `#FFF4E8` warm tint for active inputs + `#FAF7F3` sunken bg for disabled, V2-D15-4 editorial section-break wrapping every primitive section, V2-D15-4 flat-pill discipline (no gradients, no inset gloss, no italic). Renders all 6 primitives × full state matrix: text input (9 states + 6 type variants), textarea (4 states), select (3 states), checkbox (Variant A boxed × 6 states + Variant B pill multi), radio (Variant A row × 4 states + Variant B pill single), switch (4 states + settings list demo). Bonus: 3 sizes (sm/md/lg) demo, password strength meter, confirmation match, anti-pattern strip (floating labels / pill text inputs / required-asterisk / clear-on-error). Spec at LIVE_TRUTH §F.1.1-§F.1.10 (already V3-aligned from prior session) needed only one cosmetic doc fix: §F.1.0b disabled state cited `(sunken cream from §3)` → corrected to `(sunken from §4)` (Sunken `#FAF7F3` lives in §4 surface scale, not §3 semantic colors). **Next:** §F.2 modal primitive — spec draft + mockup, same loop. · **2026-05-07** — V3 design polish (V2-D15-4 — pill de-gloss + Option D editorial section-break). Pills are flat (no inset Web 2.0 gloss, no gradient bg, no `saturate(1.4)` glass pump, no brand-color glow ring on dots), section headers wrap with editorial top-rule + eyebrow-left + meta-right + Cooper-BT h2 (replaces V2-D15 minimalist Avant Garde plain-h2 layout). Cards / atmosphere wash / depth system on non-pill surfaces UNCHANGED. Builds on V2-D15-3 (V3 brand lock, 4 cats Z/G/A/I, Cooper + Avant Garde typography). · **V2-D15-3 (earlier same day):** brand orange `#E8742A` retired, **dark teal `#043338` + pale teal `#C2F0F1`** locked as brand. 6 categories → **4 categories** (Coiffeur=Z cream+cherry, Barbershop=G bone+black, Nails=A pale ice blue+magenta, Spa & Wellness=I forest+sandy beige). Typography: Bricolage + Inter Tight retired, **Cooper BT (display) + ITC Avant Garde Gothic Std (body)** locked with Sansita 900 + League Spartan as free fallbacks. Yuh-density principle + pill rule + atmosphere wash recipe + 31-combo library codified in LIVE_TRUTH §1 / §2 / §5 / §5a / §5c / §5d / §5e. **Preview:** `public/solen-v2-republik-teal.html` (homepage), `solen-v2-palette.html` (palette), `solen-v2-combos.html` (combo grid). **Next:** Phase 0 §F.1 implementation on V3 foundations + tailwind.config.js token swap (sweep flag required).

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

### V2-D09 (2026-05-05 / resolved 2026-05-09) — Guest checkout: OUT of v1
- **Context:** Phase 1 (auth) needed to know whether v1 supports booking-without-account. Affects Phase 2 booking wizard scope significantly.
- **Decision (2026-05-09):** **OUT of v1.** Users must sign up to book. Reasoning: account creation creates retention surface (favorites, saved looks, booking history, reviews-eligibility). Guest-checkout in beauty-marketplace v1 historically captures less repeat-business signal. Re-evaluate at v2 if signup-friction kills conversion in real data.
- **Implications for Phase 1:** §A.1 login modal needs a "Konto erstellen" path that's prominent (not buried). §A.6 spec section ("Guest checkout decision") becomes "Required-signup gate copy" — the blocking-screen + "30-Sekunden-Anmeldung" reassurance + social-proof.
- **Implications for Phase 2:** §BW booking wizard step 1 includes signup gate if user not authenticated. No guest path. The booking-cart state survives the auth flow (don't lose progress).
- **Status:** locked.

### V2-D10 (2026-05-05 / resolved 2026-05-09) — Map view on /search/results: IN v1
- **Context:** §25.16 deferred map view for `/[city]/[category]` category page. /search/results is a different surface — confirm consistent.
- **Decision (2026-05-09):** **IN v1 for /search/results.** Search results gets a "Karte" toggle alongside list view. The category page (§25) keeps its v2 deferral — the two surfaces have different intents (search-results is geo-bounded query; category-page is browse-by-discipline). Reasoning: search is an explicit "where can I get X?" intent — map answers that intent better than a list. Browse is a discovery intent — list is fine.
- **Implications for Phase 2:** §SR search results spec needs Karte/Liste toggle pill (matches existing pattern from filter pills §25.7). Map clusters salons by location; each pin shows mini-card on hover/tap. Mobile: full-screen map mode swap. Use Mapbox or Google Maps (both already in package.json — Mapbox preferred per existing imports).
- **Implications for §25 category page:** unchanged. v2 still defers map.
- **Status:** locked.

### V2-D11 (2026-05-05 / resolved 2026-05-09) — Loyalty / packages / gift cards: IN v1 (all 3)
- **Context:** Phase 2 booking wizard might or might not redeem packages / gift cards. Default would have been defer to v2.
- **Decision (2026-05-09):** **All 3 IN v1.** User confirmed "all ship." Reasoning per user — these are differentiating features in DACH beauty market (gift cards especially common at Swiss salons), and the partial backend infrastructure already exists in legacy code (`PackageRedeemBanner.tsx 105L`, `ServiceCart.tsx 194L promo/gift/referral` — see SOLEN_DESIGN.md Q55 component inventory).
- **Implications for Phase 2:** §BW booking wizard step 3 (Pay+Confirm) needs:
  - Promo code field (existing input pattern §F.1.1)
  - Gift card redemption flow (validate code → apply credit → show remaining balance)
  - Package redemption (if user has active package, show "From package: 2 visits left" line item)
  - Loyalty points display (if user has accrued points, show "Use 50 points (= CHF 5)" toggle)
- **Implications for §AC.2 profile bookings:** include past loyalty earned + package usage history.
- **Implications for §B.6 service management (Phase 6 B2B):** salons need to define which services count toward loyalty + which packages they offer (e.g. "5 cuts for CHF 400").
- **Risk:** scope expansion. Loyalty + packages + gift cards is ~3-4 weeks of work alone in Phase 2 + Phase 6. Re-flag if Phase 2 timeline starts slipping — may carve out gift cards (highest value, lowest complexity) and defer loyalty + packages to v1.1.
- **Status:** locked. Implementation order: gift cards first (simplest), then packages, then loyalty (tracking + accrual = most state).

### V2-D12 (2026-05-05 / resolved 2026-05-09) — Stripe Connect (marketplace payouts)
- **Context:** Backend architecture decision affecting B2B Phase 6 payouts.
- **Decision (2026-05-09):** **Stripe Connect.** Confirmed implicit-prior-decision per user instruction "I think in the previous version we already talked abt this go find it." Found in:
  - `_rules/DB_SCHEMA.md` line 8 — `salon_payouts` table already includes `stripe_payment_intent_id`, `commission_percent`, `commission_amount`, `net_amount`. The schema is built FOR Stripe Connect.
  - `_tasks/SOLEN_DESIGN.md` Q55 (booking wizard) — "default = Karte if Stripe Connect set up" — wizard spec already assumes Connect.
- **Reasoning:** Solen is a marketplace (consumer pays Solen, Solen takes commission, salon gets paid out). Stripe Connect is the marketplace standard — handles KYC for salons, payout to salon bank account, commission split, refunds. Stripe regular checkout would require building all that custom (or worse, paying salons manually).
- **Implications for Phase 6 B2B:** §B.12 billing/subscription spec needs Connect onboarding flow (Stripe-hosted) + payout dashboard + tax handling (Swiss VAT). Salon goes through Connect Express onboarding during signup, gets a Connect account, money flows through Solen platform → automatic split (e.g. 90/10) → daily/weekly payout to salon bank account.
- **Implications for Phase 2 booking wizard:** payment intent creation uses `transfer_data` to split commission at-charge. No post-hoc payout reconciliation needed.
- **Status:** locked. The DB schema confirms commitment — formalizing here removes the "PENDING USER" marker.

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

### V2-D36 (2026-05-09 evening) — Decision 3 lock: DB schema = Hybrid w explicit drift prevention + §0c authoritative source map

- **Context:** Decision 3 in V2-D33 doc consolidation flow asked whether DB schema should be inline in LIVE_TRUTH (Option A), stay at `_rules/DB_SCHEMA.md` w pointer only (Option B), or Hybrid (Option C — schema mapping in LIVE_TRUTH §33, full DDL stays in DB_SCHEMA.md).
- **User picked C.** Plus an explicit instruction: "i dont [want] any drift and [stuff] or the new agent confusing w the old rule [and stuff]." So drift prevention + new-agent-clarity were locked alongside.
- **Decision:** **C — Hybrid + drift-proofed via §0c "Authoritative source map"**. Three new sections added to LIVE_TRUTH:
  - **§0c.1** — authoritative-source table: every adjacent doc (`DB_SCHEMA.md` / `SECURITY_RULES.md` / `CODE_SAFETY.md` / `LESSONS_LEARNED.md` / `STRUCTURAL_RULES.md` / `I18N_ROUTING.md` / `V2_REBUILD_LOG.md` / `INCOMPLETE_FEATURES.md` / `CLAUDE.md` + `PROJECT_REFERENCE.md`) listed with its specialty area + LIVE_TRUTH's role + drift rule per overlap zone.
  - **§0c.2** — archived docs do-NOT-consult list. Identifies all the pre-V3 `_tasks/*` docs that get moved to `_tasks/archive/` in the V2-D33 archive step. New agents reading any archived doc are explicitly redirected back to LIVE_TRUTH.
  - **§0c.3** — drift prevention protocol: ONE rule. "Update authoritative source FIRST. Then update LIVE_TRUTH ONLY if change crosses LIVE_TRUTH summary scope." Examples for column-rename, security-rule, production-incident.
  - **§0c.4** — "I'm a new agent, where do I start?" sequence. 7 steps: read §0c → §0b → index → surface §X + §X.99 → adjacent concerns per §0c.1 → V2_REBUILD_LOG latest entries → build.
- **§33 added:** DB schema → surface mapping. Loud banner at top: "Authoritative source for column types / RLS policies / indexes / migrations: `_rules/DB_SCHEMA.md`. This section is a navigation aid only — it maps surface specs to which Postgres tables they read from / write to. NEVER duplicate column definitions or RLS policies here."
  - **§33.1** — surface → tables table. Pre-populated with 14 surface rows where the table set is already known (§13 hero, §14 search, §16 salon card, §SD salon detail, §BW booking wizard, §C confirmation, §RV reviews-write, §A auth, §AC favorites/bookings/saved-looks/settings, §B.5/§B.7/§B.12 B2B). Marked "fills in as Phase 1+ surfaces ship" — empty rows added per surface as it specs.
  - **§33.2** — cross-cutting infrastructure tables (platform_settings, feature_flags, audit_log, bans, rate_limit_events). Not surface-specific.
  - **§33.3** — anti-patterns: no column types in §33, no DDL snippets, no orphan surfaces (every surface MUST list tables in §33 via its §X.99 mapping).
- **Drift prevention summary:** column rename = update DB_SCHEMA.md only. New surface using new tables = update §33 only. New table not yet used = update DB_SCHEMA.md only (don't preemptively add to §33). Both rules together = no overlap, no drift.
- **For new agents:** §0c.4 7-step sequence becomes the canonical "how to onboard" path. Any future agent (Claude Code, sub-agents, human contributors) starts at §0c and never has to wonder "which doc owns this?"
- **Files patched:**
  - `_tasks/SOLEN_LIVE_TRUTH.md` — §0c added (~80 lines, between §0b and Index), §33 added (~50 lines, before "What's still missing" phase outlines)
- **Status:** locked. Decision 3 done. Next: Decision 4 (17 known gaps location).

### V2-D35 (2026-05-09 evening) — Decision 2 lock: Hybrid spec pattern (UX-first descriptions + concentrated implementation mapping)

- **Context:** during V2-D33 doc consolidation, asked whether LIVE_TRUTH §23 homepage flow (and future surface specs) should name specific React components like `TestimonialCarousel`/`TrustStatsBanner` + their API endpoints, or stay component-agnostic.
- **Three options weighed:**
  - **A** — component-agnostic spec (clean, refactor-resistant, but agents/devs have to grep to find implementations — exactly the failure mode that caused the §16 mistake)
  - **B** — component + API named throughout each section (unambiguous, but brittle — every rename = spec edit; couples spec to architecture)
  - **C — Hybrid** — UX-first descriptions + concentrated `§X.99 Implementation mapping (informational, may drift)` table at end of each surface section
- **Decision:** **C — Hybrid.** Spec stays readable for designers/PMs, survives renames; mapping table gives agents/devs a single grep-target for "which component implements this section." Disclaimer manages maintenance expectations.
- **Documented as:** new §0b "How this doc is structured" in LIVE_TRUTH (between §0 What this is and the Index). Three meta-rules locked:
  - **§0b.1** — Concept + examples > exhaustive lists (formula-first specs). The §16.3.0 universal badge color formula is the canonical example.
  - **§0b.2** — UX-first descriptions + concentrated implementation mapping (the Hybrid pattern locked here). Includes anti-patterns: scattered implementation details + no mapping at all.
  - **§0b.3** — When in doubt, document the rule, not the answer. One-off answers go in V2_REBUILD_LOG; rules go in LIVE_TRUTH.
- **Application:** §0b applies to **all surface specs going forward**. When §23 (homepage flow) is written, it must include §23.99 implementation mapping. Same for §SD salon detail, §BW booking wizard, §A auth surfaces, §AC account surfaces, etc. Existing surface specs (§13-§22) are grandfathered as-is — adding mapping tables retroactively is an opportunistic cleanup, not a blocking task.
- **Files patched:**
  - `_tasks/SOLEN_LIVE_TRUTH.md` — new §0b inserted between §0 and Index. ~50 lines.
- **Status:** locked. Decision 2 done. Next: Decision 3 (DB schema inline vs pointer).

### V2-D34 (2026-05-09 evening) — §16 salon card badge system v2 (light glassmorphic + 2-badge layout + color philosophy)

- **Context:** during V2-D32 homepage mockup work, user audited my §16 salon-card implementation against pre-V3 specs (Q10 from 2026-04-22 + Q26 from 2026-05-01) that I'd missed when first building the cards. Q10 locks 4 curation badges (Solen Favorit / Top bewertet / Beliebt / Neu) with priority order. Q26 locks the 2-badge layout (curation top-left + availability bottom-left). V3 §16 had inherited only the older single-badge availability pattern — never adopted Q10's curation system OR Q26's bottom-left availability placement. This entry locks the full Q10+Q26 spec into V3 §16, refined with V2-D15-4 flat-pill discipline + new color philosophy.
- **A/B mockup at `public/solen-v2-card-badges.html`:**
  - **A** — current V3 §16 (single availability badge top-left, no curation)
  - **B** — full Q10+Q26 spec (curation top-left + availability bottom-left)
  - User picked B + iterated on visual refinement.
- **Visual refinement journey (4 iterations):**
  1. Initial B: solid yellow Solen Favorit bg + solid brand-teal availability pill + dots — too "deep/dark" per user.
  2. Iter 2: light glassmorphic bgs (rgba 0.62 alpha + blur 14px) + shape differentiation (curation = rounded rect 8px, availability = full pill 999px). Better but still felt unbalanced.
  3. Iter 3: dropped pulsing dots — pill color carries the meaning ("In 15 Min" green tint = "free now," no dot needed). Heart became floating (no white circle bg) — just SVG with drop-shadow. Heart shadow on saved state was 0.45 alpha — felt too heavy.
  4. **Iter 4 (LOCKED):** unified color philosophy across all tinted badges. Each state picks its hue, then bg=`rgba(<hue>, 0.22)` + border=`rgba(<hue>, 0.32)` + text=deep version of hue. Solen Favorit yellow → text `#8B5E0F` deep amber. Available green → text `#0E7A38` deep green. This-week brand-teal → text `#043338`. Pause ink-3 → text `#56463E`. Heart unsaved → ink-3 warm gray (was deep ink — too contrast); heart saved shadow reduced to 0.20 alpha (was 0.45).
- **Final design (V2-D34 lock):**
  - **Curation badge** (top-left, rounded rectangle 8px radius, light glass) — 4 variants: Solen Favorit (yellow tint + deep amber text), Top bewertet / Beliebt / Neu (white tint + ink-1 text). Backend auto-assigns via `/api/admin/badges/auto-assign`. Priority order Solen Favorit > Top bewertet > Beliebt > Neu. Solen Exclusive (mentioned in BACKEND_NEEDS_UI.md) **NOT in v1** — defer to v2.
  - **Availability pill** (bottom-left, full pill 999px, light glass, color-coded) — 3 states: today/now (green tint + deep green text), this-week (brand-teal tint + brand-teal text), pause (ink-3 tint + ink-2 text). NO dots — color is the signal.
  - **Heart** (top-right, floating, no circle bg) — 24px SVG, ink-3 warm gray stroke unsaved (or white-ish on dark Spa bg), love-red `#FF4A6B` filled saved, drop-shadow 0.18 alpha unsaved / 0.20 alpha saved.
- **Universal color formula** (locked LIVE_TRUTH §16.3.0): `bg: rgba(<hue>, 0.22)` + `border: rgba(<hue>, 0.32)` + `color: <deep-version-of-hue>` + `backdrop-filter: blur(14px) saturate(1)` + `box-shadow: 0 1px 3px rgba(26,18,9,0.06)`. Reusable for any future state badge.
- **Backend integration TBD (deferred):** `/api/admin/badges/auto-assign` cron + thresholds. Q10 doesn't lock exact threshold values — V2-D34 sets defaults: Top bewertet = ≥4.7 stars + ≥50 reviews; Beliebt = top 10% bookings in city × cat trailing 30d; Neu = first 60d after onboarding; Solen Favorit = algorithmic (rating × volume × reply rate × recency × response time, exact formula TBD with backend team). These thresholds are NEW V2-D34 — not in Q10 or any earlier doc. User can override.
- **Files patched:**
  - `_tasks/SOLEN_LIVE_TRUTH.md` §16.1 anatomy diagram updated to show 2-badge layout, §16.3 photo overlays section completely rewritten (added §16.3.0 universal color formula, §16.3.1 curation badge, §16.3.2 availability pill, §16.3.3 heart icon, §16.3.4 anti-patterns)
  - `public/solen-v2-card-badges.html` — A/B comparison mockup, ~700 lines
  - `public/solen-v2-homepage.html` — all 25 salon-card instances updated to new V2-D34 design (TODO this commit)
- **Live site impact:** none currently — no route imports the new cards yet. Will apply when V2-D32 React build lands.
- **Status:** **locked.** §16 V2-D34 supersedes the V2-D14/V2-D17 single-badge spec. Next: Decision 2 in V2-D33 doc consolidation flow (component naming in LIVE_TRUTH).

### V2-D31 (2026-05-09 afternoon) — Phase 0 COMPLETE · §F.6 + §F.7 + §F.8 batch ship

**This single commit closes 3 sub-sections (§F.6 skip-link + §F.7 font-display + §F.8 cookie consent) + locks Phase 0 as fully done.** Bundling them because §F.6 + §F.7 are tiny (one component each + spec doc) and §F.8 has its own substantial spec+mockup+React. Single commit reduces commit-message noise; details below.

#### V2-D29 — §F.6 Skip-to-main link
- **Context:** WCAG 2.4.1 (Bypass Blocks Level A) requires keyboard / screen-reader users can skip past header/nav to main content.
- **Decision:** standard `sr-only` accessibility pattern. Hidden by default (1×1 px clipped, focusable). On `:focus` / `:focus-visible`, becomes brand-teal pill in top-left corner at z-tooltip, jumps to `<main id="main">`.
- **Files:** `app/[locale]/_components/primitives/SkipLink.tsx` (new) · `_tasks/SOLEN_LIVE_TRUTH.md` §F.6 added (~50 lines).
- **Bucket B:** `sr-only` chosen as the hide technique (alternatives: `clip-path: inset(50%)` / `position: absolute; left: -9999px;`). Picked sr-only for being the de-facto Tailwind + a11y community standard.

#### V2-D30 — §F.7 Font fallback stack + `font-display` strategy
- **Context:** locking the strategy that keeps V3 typography working when Cooper cdnfonts.com fails (currently HTTP 500). No code changes needed — globals.css already has `&display=swap` on Google Fonts URL; cdnfonts URLs use `display: auto` which we can't control. Fallback chain in font-family handles every failure case.
- **Decision:** `font-display: swap` locked on every web font. Fallback chains locked at Tailwind config level: Display = Cooper BT → Sansita 900 → Georgia → serif · Body = Avant Garde Gothic → League Spartan → Inter Tight → system-ui → sans-serif.
- **Files:** `_tasks/SOLEN_LIVE_TRUTH.md` §F.7 added (~80 lines, mostly documentation). No code changes — globals.css strategy was already correct, just unspecced.
- **Bucket B:** `swap` over `optional` / `fallback` / `block`. Picked swap because brand integrity > FOIT prevention (some users seeing Sansita instead of Cooper for 200ms is acceptable; 3 seconds of invisible text is not).

#### V2-D31 — §F.8 Cookie consent banner (GDPR / Swiss DSG)
- **Context:** non-negotiable for DACH market launch. Solen uses analytics (PostHog) + future marketing pixels (Meta, Google) — both require explicit opt-in.
- **Architecture:** `<CookieConsentProvider>` at app root manages state via React Context + persists to localStorage (chicken-and-egg = cookies-can't-store-cookie-consent). Hook `useCookieConsent()` exposes consent state to other components for analytics gating. 12-month expiry — banner re-shows after.
- **3 categories (v1):** `necessary` (always on, switch disabled — auth session, language, consent record itself) · `analytics` (opt-in — PostHog) · `marketing` (opt-in — Meta/Google pixels).
- **UX flow:** sticky-bottom banner on first visit w 3 buttons (Anpassen link + "Nur notwendige" ghost + "Alle akzeptieren" primary, all equally prominent per dark-pattern anti-pattern). "Anpassen" opens settings modal (§F.2 lg) with per-category switches. Save → consent persisted, banner hides.
- **Composition wins:** uses §F.1.6 Switch primitive for category toggles + §F.2 Modal for settings + §F.4 toast pattern for sticky-bottom positioning. Demonstrates V2-D## composition discipline working as designed — primitives compose into a complex system.
- **Files (3):**
  - `app/[locale]/_components/primitives/CookieConsent.tsx` — Provider + Banner + SettingsModal (5 exports incl. types). ~290 lines.
  - `public/solen-v2-cookie-banner.html` — full mockup. Desktop banner + mobile stacked banner + settings modal stage + 6-card anti-pattern strip.
  - `_tasks/SOLEN_LIVE_TRUTH.md` §F.8 added (~200 lines, full GDPR/DSG anti-pattern coverage).
- **Bucket B candidate decisions logged:**
  - 3 categories (necessary / analytics / marketing) — alternative was 4 (add `preferences` for personalization). Picked 3 because v1 doesn't have personalization cookies yet; preferences can be added v2.
  - localStorage key = `solen-cookie-consent`. Format = JSON string. 12-month expiry chosen as standard GDPR practice (also Google's recommended TTL).
  - Banner copy = neutral DACH-safe ("Wir verwenden Cookies / Notwendige Cookies sind immer aktiv / Du kannst jede Kategorie einzeln steuern"). Alternative: legalese ("Diese Website verwendet Cookies gemäss Art. 5 DSG..."). Picked neutral — conversion-friendly while still legally compliant.
- **Wiring TODO (NOT in this commit — defers to layout integration):**
  - `app/[locale]/layout.tsx` needs `<CookieConsentProvider>` wrapping children. Will land when V3 homepage is built (V2-D32).
  - PostHog mounting needs to gate on `consent.analytics === true` — wired when Phase 1 first uses PostHog event tracking (auth events).
  - Footer "Cookie-Einstellungen" link needs `useCookieConsent().openSettings()` callback — wired when V3 footer is implemented in Phase 2 §SR or homepage build.

#### Phase 0 final state (all 8 sub-sections shipped):
| sub | name | spec | mockup | React | V2-D## |
|-----|------|------|--------|-------|--------|
| §F.1 | Form primitives (input/textarea/select/checkbox/radio/switch/pill) | ✅ V2-D14 | ✅ V2-D16 | ✅ V2-D17 | locked |
| §F.2 | Modal primitive | ✅ V2-D18 | ✅ V2-D18 | ✅ V2-D18 | locked |
| §F.3 | Bottom sheet primitive | ✅ V2-D19 | ✅ V2-D19 | ✅ V2-D19 | locked |
| §F.4 | Toast primitive | ✅ V2-D20 | ✅ V2-D20 | ✅ V2-D20 | locked |
| §F.5 | Date/time picker | ✅ V2-D21 | ✅ V2-D28 | ✅ V2-D28 | locked |
| §F.6 | Skip-to-main link | ✅ V2-D29 | (no mockup needed) | ✅ V2-D29 | locked |
| §F.7 | Font-display strategy | ✅ V2-D30 | (n/a) | (already correct) | locked |
| §F.8 | Cookie consent banner | ✅ V2-D31 | ✅ V2-D31 | ✅ V2-D31 | locked |

**Phase 0 verification:** `/de/dev/primitives` renders every primitive interactively. 8 mockup HTML files at `/solen-v2-{primitives,modal,sheet,toast,datetime,cookie-banner,logo-options,republik-teal}.html` provide V2-D## locked visual references. Logo (V2-D27) ships across all surfaces via SVG + React component. Typography V2-D26 size refresh applied throughout.

**Phase 1 (auth) + homepage build are now unblocked.** Per user direction, next steps: V3 homepage React build (V2-D32) → Phase 1 auth surfaces (login modal §A.1 first).

### V2-D28 (2026-05-09 afternoon) — Phase 0 §F.5 date/time picker mockup + React shipped

- **Context:** Per user direction (finish Phase 0 → homepage → Phase 1), §F.5 spec was drafted V2-D21 overnight; mockup + React deferred to next attended session. This commit ships them.
- **Architecture:** `react-aria-components` Calendar + CalendarGrid + CalendarGridHeader + CalendarHeaderCell + CalendarGridBody + CalendarCell (all stable exports). Wrapped with V3 styling via cva-free className composition (the cell-level state needs `data-*` attribute access from react-aria's render-prop pattern, simpler than cva for this case). `@internationalized/date` handles DE-CH locale + Mon-first week + min/max + isDateUnavailable callback. Native `<input type="date">` explicitly banned per §F.5.7.
- **Composition:** `<DateTimePicker>` root manages combined state `{ date, time }`. Internal `<SolenCalendar>` (calendar grid) + `<TimeSlotList>` (async slot fetching) compose side-by-side on desktop, vertical stack on mobile. `groupByPeriod()` helper sorts slots into Vormittag/Nachmittag/Abend buckets via `parseTime()` — robust to malformed time strings (falls back to manual hour parse).
- **State support:** loading shimmer (animate-shimmer keyframes already in tailwind config), empty (no date selected OR no slots that day), disabled day cells (past + salon-closed via `isDateDisabled` callback), today highlight (2px brand-pale border + brand-teal text), selected day cell (brand-teal bg + white text + 600 weight), outside-month cells (40% opacity, tap navigates to that month), selected time slot (brand-teal pill).
- **Files created (2):**
  - `app/[locale]/_components/primitives/DateTimePicker.tsx` — DateTimePicker + internal SolenCalendar + TimeSlotList. 4 type exports (DateTimePickerProps / DateTimeValue / TimeSlot / + component).
  - `public/solen-v2-datetime.html` — full mockup. Anatomy stage (composed calendar + 4×grid time slots) · 8 day-cell states (default / today / hover / selected / disabled / outside-month / range-start / range-end — range deferred but rendered for v2 reference) · 2 time-slot states (loading skeleton w shimmer + empty state w cal icon) · mobile vs desktop layouts (vertical stack mobile inside §F.3 sheet vs side-by-side desktop card) · 6-card anti-pattern strip.
- **Files patched (2):**
  - `app/[locale]/_components/primitives/index.ts` — exports DateTimePicker + types
  - `app/[locale]/dev/primitives/page.tsx` — added Section "§F.5 · V2-D28" w 2 live demos. Imports `today` + `getLocalTimeZone` from `@internationalized/date`. Demo `slots` is fake data: dates ending in 0 or 5 simulate fully-booked, others have 16 mixed availability slots. `isDateDisabled` returns true for Sundays.
- **Bucket B candidate decisions logged:**
  - §F.5 Calendar uses `react-aria-components` w cell-level render-prop instead of full cva variant approach — alternative was hand-roll using `@internationalized/date` math directly. Picked react-aria for proper kbd nav + a11y + locale support; trade-off is slightly heavier render-prop pattern in cell rendering.
  - §F.5.2 time slot grouping: hard-coded "Vormittag/Nachmittag/Abend" splits at 12:00 / 18:00. Alternative: configurable boundaries. Picked hard-coded because day-period semantics are universal (DACH market) and configurability adds API surface for no benefit.
  - §F.5.4 mobile/desktop split: CSS `flex-col md:flex-row` at the 768px Tailwind breakpoint. Same as §F.3 sheet. No JS responsive switching.
- **Tailwind tokens added:** none. `animate-shimmer` already existed in config.
- **Live site impact: ZERO.** No existing route imports it. Booking wizard (§BW Phase 2) will use it.
- **Typecheck:** clean for new files.
- **Status:** **shipped + locked.** Phase 0 §F.5 is complete: spec ✓ (V2-D21) + mockup ✓ + React ✓ + dev verification ✓. **Next:** §F.6 skip-to-main link.

### V2-D27 (2026-05-09 morning) — Logo replacement: Bebas+coral retired, Cooper-Solen + brand-teal dot locked

- **Context:** User this morning, after seeing the V2 logo at `public/logo.svg` rendered in the dev-tools or somewhere: "and additionally can you ditch this logo of solen from evrywhere its so hidious." Current logo: Bebas Neue tall-narrow caps "SOLEN" + small `#E8624A` coral dot inside the O. Both font (Bebas Neue) and color (coral) were retired V2-D15-3 — the SVG file was a leftover that never got swept.
- **4 options visualized at `public/solen-v2-logo-options.html`:**
  - A — Cooper "Solen" mixed case · plain (no dot)
  - B — Cooper "SOLEN" all caps
  - C — Cooper "Solen·" with brand-teal dot accent ← **user pick**
  - D — Cooper "solen" all lowercase
- **Decision:** Option **C** locked. Cooper-style "Solen" wordmark (Cooper BT → Sansita 900 fallback since cdnfonts.com Cooper is currently HTTP 500) + trailing brand-teal `#043338` dot accent. The dot is baseline-aligned (sits like a period after Solen) — gives a "Solen." reading. Mixed case preserves Cooper Black's character (chunky lowercase forms are where the font's personality lives).
- **Rationale per option:**
  - Option C wins because it (a) preserves the V1/V2 dot-accent brand idea (just in V3 brand-teal instead of retired coral), (b) keeps the warmth of mixed-case Cooper, (c) reads as "Solen·" — a complete brand statement vs Option A's bare wordmark.
  - Option B (all caps) was rejected — loses Cooper Black's character (caps in Cooper are boring vs lowercase).
  - Option D (lowercase) was rejected — too "tech startup" (Linear/Notion/Substack vibe doesn't match Solen's beauty marketplace warmth).
- **Files patched (7):**
  - `public/logo.svg` — replaced Bebas+coral with Cooper-stack `<text>` + brand-teal `<circle>`. 124×36 viewBox. Font-family fallback chain `'Sansita', 'Cooper Black', 'Cooper Black Std', 'Cooper BT', Georgia, serif` so SVG-as-image renders acceptably even when Cooper isn't loaded. Comment in SVG documents the V2-D27 lock.
  - `public/favicon.svg` — replaced retired coral `#E8624A` circle with brand-teal `#043338` circle. Tab/bookmark monogram now matches V3 brand.
  - `app/[locale]/_components/primitives/Logo.tsx` — new React component. cva variants for size (sm 18px / md 28px / lg 40px / xl 64px) + tone (light / dark). Dot uses `s-brand` on light, `s-brand-pale` on dark. `noDot` prop for contexts where the dot competes (e.g. inside a button).
  - `app/[locale]/_components/primitives/index.ts` — appended Logo + types exports.
  - `app/[locale]/dev/primitives/page.tsx` — added Logo demo Section showing 4 sizes on light + dark substrate, in-app-header context, and `noDot` variant.
  - `public/solen-v2-republik-teal.html` — `.nav-logo` CSS updated: color `var(--brand)` → `var(--ink)`, added `display: inline-flex; align-items: baseline` + `::after` brand-teal dot pseudo-element. The V3-locked homepage mockup now matches V2-D27.
  - `_tasks/SOLEN_LIVE_TRUTH.md` — added §1.3 "The Solen logo wordmark (V2-D27 lock)" subsection. Full spec: anatomy + size scale (sm/md/lg/xl) + 7 anti-patterns. Locked at end of §1 brand color section.
- **Live site impact (immediate):**
  - Legacy header at `components-legacy/layout/Header.tsx` uses `<Image src="/logo.svg">` — auto-picks up the new SVG without code change. Live site users see new logo on next page load.
  - Browser tab favicon updates to brand-teal circle.
  - V3 mockup at `localhost:4747/solen-v2-republik-teal.html` renders new Cooper+dot logo.
- **Bucket B doc-cleanup TODOs (deferred):**
  - 5 archival HTML files in `public/` (`offline.html`, `solen-v2-preview.html`, `solen-v2-locked.html`, `solen-coral.html`, `variations.html`) reference Bebas Neue in CSS BUT no actual logo SVG inline (they're V1 design archives, not user-facing). The grep finding earlier confirmed only one file (`solen-v2-logo-options.html`) intentionally renders the OLD logo for comparison. Other archives use Bebas Neue for image-card placeholders (not logos). Skip in this commit; flag for cleanup pass.
  - Future React surfaces (Phase 1 auth modal, Phase 2 header rebuild) should use `<Logo>` component, not inline `<Image src="/logo.svg">`. Migration happens incrementally per V2-D05.
- **Live site impact: minimal.** Live header gets new logo automatically (one SVG file swap). Only footer / og:image / favicon update at the same time. No React route changes needed. New surfaces use `<Logo>` from V2-D27 onward.
- **Typecheck:** clean for new Logo.tsx + barrel + dev page edits.
- **Status:** **shipped + locked.** Logo is now V2-D27. To verify: `npm run dev` → `/de/dev/primitives` (Logo demo section) + reload `localhost:3000` (legacy header now shows new logo).

### V2-D26 (2026-05-09 morning) — Typography size refresh (kept Avant Garde Gothic, bumped subtexts +2-3px)

- **Context:** User feedback this morning after wake-up: "the fonts in the components so small like what is the font we are using i like the title font but not the sub texts." After font visualization at `public/solen-v2-font-visual.html` showed (a) current sizes vs +2-3px bumped sizes side-by-side and (b) 5 alternative body fonts, user picked option **A — keep ITC Avant Garde Gothic Std, bump sizes**.
- **Decision:** sweep larger sizes through every Phase 0 primitive + the dev test page + LIVE_TRUTH §F.1-§F.4 spec text. No font swap. Cooper Black Std display fallback chain unchanged (Cooper / Sansita 900) — heads-up logged that `cdnfonts.com/css/cooper-black-std` is currently HTTP 500 so headings render Sansita silently; visual continuity preserved via fallback.
- **Size mapping (V2-D26 lock):**
  - Field label 12px → **14px**
  - Helper / error / warning / success message 11px → **13px** (icon also 12 → 14)
  - Eyebrow / meta row 11px → **13px**
  - Card tag (showroom labels) 9px → **11px**
  - Body / paragraph 14px → **16px**
  - Input sm: 13 → **14px** · md: 14 → **16px** · lg: 16 → **18px** (heights stay 40/56/64; padding unchanged — already had slack)
  - Pill toggle / chip 12px → **13px** (padding 7/12 → 8/14 to compensate)
  - Toast title 14 → **15px** · description 12 → **13px** · action 13 → **14px**
  - Switch label 14 → **16px** · sub-label 12 → **13px**
  - Checkbox label / Radio label 14 → **16px** (Variant A boxed/row)
  - Optional-tag (FieldLabel) 11 → **12px**
  - Textarea char counter 11 → **12px**
- **Side-effect: V2-D14 / V2-D17 iOS auto-zoom contradiction RESOLVED.** §F.1.7 line 1266 originally said "all text inputs `font-size ≥ 16px`" but V2-D14 had locked md at 14px. With md now at 16px, the §F.1.7 rule is satisfied for the default input size by default — only sm (compact filter rows) violates it as an explicit accepted exception per V2-D14's original "decision B" trade-off. Spec text updated accordingly.
- **Files patched (8 primitive components):**
  - `app/[locale]/_components/primitives/FieldLabel.tsx` — label 12→14, optional-tag 11→12
  - `app/[locale]/_components/primitives/FieldHelper.tsx` — text 11→13, icon 12→14
  - `app/[locale]/_components/primitives/TextInput.tsx` — cva sizes sm 13→14, md 14→16, lg 16→18
  - `app/[locale]/_components/primitives/Textarea.tsx` — body 14→16, counter 11→12
  - `app/[locale]/_components/primitives/Select.tsx` — cva sizes sm 13→14, md 14→16, lg 16→18
  - `app/[locale]/_components/primitives/Checkbox.tsx` — label 14→16
  - `app/[locale]/_components/primitives/Radio.tsx` — label 14→16
  - `app/[locale]/_components/primitives/Switch.tsx` — label 14→16, sub-label 12→13
  - `app/[locale]/_components/primitives/PillToggle.tsx` — text 12→13, padding 7/12 → 8/14
  - `app/[locale]/_components/primitives/Modal.tsx` — eyebrow 11→13, body 14→16
  - `app/[locale]/_components/primitives/Sheet.tsx` — eyebrow 11→13, body 14→16
  - `app/[locale]/_components/primitives/Toast.tsx` — title 14→15, description 12→13, action 13→14
- **Files patched (dev page):**
  - `app/[locale]/dev/primitives/page.tsx` — replace_all sweep on `text-[13px]` → `text-[14px]`, `text-[11px]` → `text-[13px]`, `text-[9px]` → `text-[11px]`. Buttons stay text-[14px] (not bumping CTAs in this sweep — user complaint was about subtexts, not button labels). Code-element callouts (`<code>` tags inside paragraphs) stay text-[12px] for visual hierarchy.
- **Files patched (LIVE_TRUTH spec):**
  - §F.1.0 anatomy table — label / helper / error / warning / success message rows updated
  - §F.1.0a sizes table — sm 13→14, md 14→16, lg 16→18
  - §F.1.0a iOS-zoom note rewritten to acknowledge V2-D26 resolves V2-D14/V2-D17 contradiction
  - §F.1.2 textarea char counter font 11→12
  - §F.1.4 checkbox Variant A label font 14→16
  - §F.1.4 checkbox Variant B pill font 12→13
  - §F.1.5 radio Variant A label font 14→16
  - §F.1.6 switch label 14→16, sub-label 12→13
  - §F.2.3 modal eyebrow 11→13
  - §F.2.4 modal body font 14→16, line-height 1.5→1.55
  - §F.3.3 sheet eyebrow 11→13
  - §F.3.4 sheet body font 14→16
  - §F.4.0 toast title 14→15, description 12→13, action 13→14
- **Bucket B doc-cleanup TODOs (deferred to attended pass):**
  - 4 mockup HTML files (`solen-v2-primitives.html` / `solen-v2-modal.html` / `solen-v2-sheet.html` / `solen-v2-toast.html`) still render OLD sizes. They're V2-D## locked references — should be regenerated to match V2-D26 in a future pass. Until then, the React components are the authoritative visual reference (`/dev/primitives` shows current state).
  - LIVE_TRUTH §13-§25 surface specs reference some text sizes that compose with form primitives — those references are surface-specific and don't have to change with V2-D26 (they're describing how the surface composes the primitives, not the primitive's own typography).
  - §F.5 date picker spec has size references (day cell 14px, time slot 13px) that should bump to 16/14 respectively when §F.5 is implemented next session.
- **Live site impact: ZERO.** No existing route imports these primitives. The /dev/primitives page is the only surface that renders them, and it's gated to dev only.
- **Typecheck:** to verify after commit. Pure className changes, no type changes.
- **Status:** **shipped.** Verify visually at `/de/dev/primitives` after `npm run dev`.

### V2-D21 (2026-05-09 overnight, autonomous) — Phase 0 §F.5 date/time picker spec drafted (mockup + React deferred)

- **Context:** Fourth and final sub-section of the autonomous overnight run. Per the plan's scope ceiling: spec only (no mockup, no React). Date/time picker is the largest single primitive in Phase 0 — calendar grid + time slot list + range variant (v2). Half-shipping creates worse outcomes than scheduling cleanly. Spec alone gives the next session a clean starting point.
- **Decision:** ship §F.5 SPEC into LIVE_TRUTH (~164 lines). DO NOT mockup, DO NOT build React. Spec includes a §F.5.8 implementation-TODO subsection that flags the next-session scope (build via `react-aria-components` `Calendar` + `DateField` + cva V3 styling, mockup at `public/solen-v2-datetime.html`, dev test page integration).
- **Spec scope (§F.5.0 through §F.5.8):**
  - Anatomy diagram (calendar grid + time slot list)
  - 4 variants: single-date / **date-and-time (most-used, booking flow)** / time-only (reserved) / date-range (v2 deferred)
  - State matrix: default / today / hover / selected / disabled / outside-month / loading / empty
  - Calendar grid spec (DE-CH locale, Monday-first, month nav via chevrons, kbd nav, min/max date, isDateDisabled callback)
  - Time slot list spec (Vormittag/Nachmittag/Abend grouping, configurable slot duration, async fetch shape, loading skeleton, empty state)
  - Composition pattern (`<DateTimePicker>` root managing combined state, internal `<CalendarGrid>`/`<DayCell>`/`<TimeSlotList>`/`<TimeSlot>` not exposed)
  - Mobile vs desktop (mobile = vertical stack inside §F.3 sheet, desktop = side-by-side card on `/book/[slug]`)
  - Motion (200ms month transition, 150ms day-select, 100ms slot-select, shimmer skeleton via existing `animate-shimmer` token)
  - ARIA: `role="grid"` calendar, `role="gridcell"` days, `role="listbox"` time slots, full kbd nav
  - 5 anti-patterns (year-month picker wheel banned, showing all 24h banned, native `<input type="date">` banned, range in v1 banned, italic banned)
- **Architecture decision (locked here for next session):** use `react-aria-components` `Calendar` + `DateField` (already installed at `^1.16.0` — these are STABLE exports, not UNSTABLE_) + cva for V3 styling. Native `<input type="date">` explicitly banned in §F.5.7 because native pickers vary wildly across iOS/Android/desktop — we lose visual control over the most user-facing primitive in the booking flow.
- **Tailwind tokens added:** none. The existing `animate-shimmer` (line 132 in tailwind.config.js) covers the loading skeleton motion.
- **Files created:** none — spec only.
- **Files patched:**
  - `_tasks/SOLEN_LIVE_TRUTH.md` — appended §F.5 section (~164 lines).
- **Live site impact:** ZERO. No React, no mockup yet.
- **Status:** **spec drafted, lock pending** (mockup + React in next session). The §F.5.8 implementation-TODO subsection is the explicit handoff to the next session.

### V2-D20 (2026-05-09 overnight, autonomous) — Phase 0 §F.4 toast primitive shipped

- **Context:** Third sub-section of the autonomous overnight execution. §F.2 modal (V2-D18, `e07d28e`) and §F.3 sheet (V2-D19, `9a112e8`) shipped earlier in the night. Toast is the smallest meaningful primitive that fit remaining time; date/time picker (§F.5) deferred to spec-only because half-shipping a date picker is worse than scheduling cleanly.
- **Architecture decisions:**
  - **Hand-rolled queue + Context, NOT react-aria-components.** Per spec §F.4.7 + autonomous-loop Step 4a verification: `react-aria-components` exports only `UNSTABLE_ToastRegion / UNSTABLE_ToastList / UNSTABLE_Toast / UNSTABLE_ToastContent / UNSTABLE_ToastStateContext` at v1.16.0 — explicitly marked unstable, locking ourselves in is risky. Hand-roll achieves same UX with stable API surface + zero new dependencies. Migration path documented in spec: when react-aria stabilizes (drops `UNSTABLE_` prefix) we MAY migrate, not before.
  - **Queue management.** `<ToastProvider>` holds two state arrays: `toasts` (currently visible, max 3) and `queue` (FIFO waiting). Effect-driven slot assignment: when `toasts.length < 3 && queue.length > 0`, pull from queue. Error tone has priority override — if queue is full and a new error fires, it replaces the oldest non-error toast (per §F.4.3 spec).
  - **Per-toast timer w hover-pause.** Each `ToastItem` uses `setTimeout` for auto-dismiss. `onMouseEnter` pauses + tracks elapsed; `onMouseLeave` resumes with remaining time. Errors have `duration: Infinity` (sticky); others use tone defaults (success/info 3s, warning 6s).
  - **State machine via `data-state` attr.** Three render states: `opening` (mount with offset+opacity 0), `open` (visible, animated to 0/1), `dismissing` (offset opposite + opacity 0). Drives Tailwind `data-[state=opening]:` modifiers. `motion-reduce:` collapses to opacity-only.
  - **Composition: hook-based, not children-based.** Caller doesn't render `<Toast>` JSX directly — they call `toast.success({ title, description, action, onAction })`. Provider+hook pattern ergonomic + matches react-hot-toast / sonner conventions.
  - **ARIA correctness.** `<ol role="region" aria-label="Benachrichtigungen">` wraps the list per WAI-ARIA toast pattern. Each `<li>` gets `role="alert"` + `aria-live="assertive"` for errors, `role="status"` + `aria-live="polite"` for others. Caller can override via `ariaLive` prop.
- **Tailwind tokens added:** none. `z-toast` was added in V2-D18 batch.
- **Files created (3):**
  - `app/[locale]/_components/primitives/Toast.tsx` — `ToastProvider` (Context provider w queue manager) + `useToast()` hook (returns 7 methods: success/info/warning/error/custom/dismiss/dismissAll) + internal `ToastRegion` (portal-target fixed-position container) + internal `ToastItem` (per-toast w timer + hover-pause + animated state machine). `ToastTone` + `ToastOptions` types exported. Plus `cva` variants for tone-tinted left bar (4px wide, success-green / brand-teal / warning-amber / error-red).
  - `public/solen-v2-toast.html` — full mockup. Page head + 4-tone variant grid (success w action, info, warning, error sticky w action) + position+stacking section showing mobile bottom-center 3-stack + desktop bottom-right single error + 5-step state timeline (queued / opening / open / dismissing / closed) + 8-card anti-pattern strip.
- **Files patched (3):**
  - `_tasks/SOLEN_LIVE_TRUTH.md` — appended §F.4 section (~146 lines).
  - `app/[locale]/_components/primitives/index.ts` — appended Toast exports.
  - `app/[locale]/dev/primitives/page.tsx` — split `PrimitivesDevPage` into outer (production gate + `<ToastProvider>` wrap) + inner (the actual content, renamed `PrimitivesDevPageInner`). New `<ToastDemo>` helper component with 4 tone-fire buttons + 4 stacking-demo buttons (fire-5-to-queue-2, with-action, title-only, dismiss-all).
- **Bucket B candidate decisions logged (need user sign-off on wake-up):**
  - §F.4.1 default duration timing — success/info=3000ms, warning=6000ms, error=Infinity (sticky). Alternatives: 5000ms uniform across non-errors. Picked split because warnings need longer read time and errors must NOT auto-dismiss.
  - §F.4.3 stack direction = newest at BOTTOM. Alternative: newest at top (push others down). Picked bottom because user's spatial anchor is the viewport edge (mobile thumb position), and "the latest thing" being closest to their attention point makes sense.
  - §F.4.4 action button = text-only, brand-teal, hover ink-1. Alternative: bordered button matching pill-style. Picked text-only because toast surface is already a card — a button-on-button feels too heavy. Brand-teal makes the action visually distinct from the body text.
- **Spec contradictions surfaced:** none new. Same 4 still pending (V2-D17 §F.1.4 gradient + V2-D17 §F.1.7 16px iOS + V2-D19 §25.6 backdrop hex + this commit no new).
- **Live site impact: ZERO.** No existing route imports the toast. Future surfaces using `useToast()` will need `<ToastProvider>` at `app/[locale]/layout.tsx` — a future commit when Phase 1 starts (auth uses toasts for "Login fehlgeschlagen" etc).
- **Typecheck:** zero errors in new files.
- **Status:** **shipped + locked.** Phase 0 §F.4 is complete. **Three Phase 0 sub-sections shipped this overnight.** **Next:** §F.5 date/time picker spec only → wake-up summary.

### V2-D19 (2026-05-09 overnight, autonomous) — Phase 0 §F.3 bottom sheet primitive shipped

- **Context:** Second sub-section of the autonomous overnight execution. §F.2 modal landed cleanly in commit `e07d28e` (V2-D18). §F.3 inherits §F.2's react-aria portal + focus-trap + scroll-lock infrastructure — only the CSS positioning + motion differ.
- **Architecture decisions:**
  - **Same react-aria-components stack as §F.2** — Modal + ModalOverlay + Dialog. The accessibility behavior is identical; only positioning + motion CSS differ. This validates the V2-D17/V2-D18 architecture decision: react-aria's headless behavior + cva styling = clean primitive composition without reimplementing focus traps per primitive.
  - **3 fixed height variants (v1):** `auto` (content-fits, e.g. sort sheet), `default` (75dvh, e.g. filter sheet), `full` (90dvh, e.g. look-detail). Multi-snap + swipe gesture deferred to v2 — needs JS gesture library, out of scope.
  - **Drag handle is visual-only in v1.** Spec acknowledges this is an "affordance lie" (handle suggests swipe but no gesture wired). Documented as accepted compromise per §F.3.2 since users still expect handle visually (iOS / Material familiarity). v2 wires the gesture.
  - **`useResponsiveOverlay()` hook returns "sheet"|"modal" based on viewport.** Helper for surfaces that need the same dialog content rendered as sheet on mobile / modal on desktop. Breakpoint locked at `(min-width: 768px)` to match Solen's existing mobile/desktop divide. SSR-safe (defaults to "sheet" before hydration). Caller pattern: `const Overlay = useResponsiveOverlay() === "sheet" ? Sheet : Modal`. Body content composes with both.
  - **Top-projecting shadow.** `0 -4px 28px rgba(50,47,44,0.12), 0 -2px 8px rgba(50,47,44,0.06)` — inverted elevation-3 (shadow projects upward since the sheet is bottom-anchored, no shadow below the viewport edge). Applied via Tailwind arbitrary value, not added to config (one-off).
  - **`safe-area-inset-bottom` respect.** SheetCTARow padding-bottom uses `pb-[max(1rem,env(safe-area-inset-bottom))]` so iOS home-indicator doesn't overlap the primary CTA. Critical for filter / sort sheet UX.
- **Tailwind tokens added:** none. The 6 z-index tokens added in V2-D18 (sheet-bg/sheet/modal-bg/modal/toast/tooltip) cover §F.3. The existing `rounded-sheet` token (28px, was already in tailwind.config.js for top-corner radius) gets used.
- **Files created (3):**
  - `app/[locale]/_components/primitives/Sheet.tsx` — Sheet + SheetHeader + SheetBody + SheetCTARow + `useResponsiveOverlay()` hook (5 exports). Sheet wraps `<ModalOverlay>` + `<AriaModal>` + `<Dialog>` with bottom-anchored CSS. Visual drag handle 36×4 ink/.20 in pt-3/pb-2 row at top.
  - `public/solen-v2-sheet.html` — full mockup. Page head + 4 use cases rendered inside iPhone-style frames (360×720 with 8px black bezel + 36px radius) — visualizes the mobile-only context. Sort sheet (auto height w 4 radio rows), filter sheet (75vh w 3 filter groups + sticky CTA), share sheet (auto height w utility pills), look-detail (90vh full w photo placeholder + meta). 4-step state timeline + 8-card anti-pattern strip.
- **Files patched (3):**
  - `_tasks/SOLEN_LIVE_TRUTH.md` — appended §F.3 section (~178 lines) between §F.2 end and the Step 4 marker. References `var(--z-sheet-bg)` + `var(--z-sheet)` per V2-D18 token additions.
  - `app/[locale]/_components/primitives/index.ts` — appended Sheet exports + `useResponsiveOverlay` hook export.
  - `app/[locale]/dev/primitives/page.tsx` — appended `<Section eyebrow="Sheet">` rendering 3 live sheet demos. Includes a "resize browser to <768px" callout — the dev page itself isn't responsive-overlay-aware (would defeat the demo); real surfaces use `useResponsiveOverlay()`. 4 new useState hooks for sheet open states + filter Set.
- **Bucket B candidate decisions logged (need user sign-off on wake-up):**
  - §F.3.0a heights = `auto / default / full`. Alternative naming: `compact / standard / tall` or `peek / half / full`. Picked `auto / default / full` because it maps directly to the use cases (auto = content-driven, default = the most common 75vh, full = explicitly the largest 90vh).
  - §F.3.7 desktop fallback breakpoint = 768px. Alternatives: 640px (small tablet) or 1024px (large tablet+). Picked 768px to match Solen's existing mobile/desktop divide already used in §6 layout. User can override later if specific surfaces want different breakpoints.
  - §F.3.2 drag handle dimensions (36×4px, ink/.20). Alternatives: 48×5 (more prominent, iOS-familiar) or 32×3 (subtler). Picked 36×4 as middle ground — visible without being decorative-loud.
- **Bucket B doc-cleanup TODO surfaced (not blocking, deferred to attended doc-cleanup pass):**
  - §25.6 sort sheet line 3353: cites `rgba(0,0,0,.35)` backdrop hex (pure black) which contradicts §4 anti-pattern (warm-ink only). When §25.6 implements via §F.3 the primitive's warm-ink `rgba(26,18,9,0.40)` prevails — but the surface-spec text should be cleaned up to match.
- **Spec contradictions surfaced:** none new. The two contradictions logged in V2-D17 (§F.1.4 Variant B gradient, §F.1.7 16px iOS rule) and the §25.6 backdrop noted above remain unresolved.
- **Live site impact: ZERO.** No existing route imports Sheet. Only the dev test page uses it.
- **Typecheck:** `npx tsc --noEmit` — zero errors in `app/[locale]/_components/primitives/Sheet.tsx` and `app/[locale]/dev/primitives/page.tsx`. Pre-existing legacy errors remain.
- **Status:** **shipped + locked.** Phase 0 §F.3 is complete: spec ✓ + mockup ✓ + React ✓ + dev verification ✓. **Next:** §F.4 toast primitive — same loop.

### V2-D18 (2026-05-09 overnight, autonomous) — Phase 0 §F.2 modal primitive shipped

- **Context:** First sub-section of the autonomous overnight execution (per `/Users/sulo/.claude/plans/immutable-shimmying-meerkat.md`). User asleep. Per the autonomous loop, §F.2 modal runs first (highest unlock value: auth login modal, booking confirm overlays, board management, report-content, sheet desktop fallback).
- **Architecture decisions (locked here, applies to §F.3 sheet inheriting modal patterns):**
  - **`react-aria-components` Modal + ModalOverlay + Dialog** — explicit V2-D18 deviation from V2-D17 native-first. No native `<dialog>` element has the focus-trap + scroll-lock + portal behavior the spec needs across all browsers. cva used for size variants on top of react-aria's headless behavior.
  - **Composition pattern follows V2-D17.** Sibling `<ModalHeader>` / `<ModalBody>` / `<ModalFooter>` components, not nested-wrapper. Each accepts a `size` prop that drives padding (sm/md = 20-24px, lg = 24-28px). Caller passes `size` through from `<Modal>` for now; future: extract via Context to avoid prop drilling — deferred.
  - **Layout-shift-safe motion via Tailwind data-attribute modifiers.** `data-[entering]:` and `data-[exiting]:` modifiers map react-aria's lifecycle attrs to scale + opacity transitions. Both entry and exit use `ease-snap` (cubic-bezier(.4,0,.2,1)) — modals are functional, not playful. No spring/bounce. `motion-reduce:` collapses to opacity-only 100ms per §24b.3.
  - **Backdrop = warm-ink dim + 4px blur.** `bg-[rgba(26,18,9,0.40)]` + `backdrop-blur-[4px]`. Pure black backdrop banned per §4 anti-pattern.
- **Tailwind tokens added (V2-D18):** 6 z-index tokens to match LIVE_TRUTH §8 z-index lock — `sheet-bg=400`, `sheet=410`, `modal-bg=500`, `modal=510`, `toast=600`, `tooltip=700`. Naming convention: `*-bg` for the dim/backdrop layer, bare token for the content layer above. Added all 6 in this commit (not just modal-* / modal-bg) since §F.3 sheet and §F.4 toast will need theirs in the next sub-sections, and adding them now avoids a config edit per sub-section.
- **Files created (3):**
  - `app/[locale]/_components/primitives/Modal.tsx` — Modal + ModalHeader + ModalBody + ModalFooter (4 exports from one file). Modal wraps `<ModalOverlay>` + `<AriaModal>` + `<Dialog>` from react-aria-components. Header includes optional eyebrow + title + close X (44×44 hit area via negative-margin trick). Body is scroll container with size-aware padding. Footer supports `layout="right"` (default) or `layout="between"` for destructive-tertiary placement.
  - `public/solen-v2-modal.html` — full mockup. Page head + anatomy stage (with simulated dimmed bg behind backdrop) + 3 sizes side-by-side (sm confirm, md login, lg report) + 4 use-case grid (confirmation destructive, share w utility chips, edit single field, sign-out w destructive tertiary) + 4-step state timeline (closed / opening / open / dismissing) + 8-card anti-pattern strip with red dashed border.
- **Files patched (3):**
  - `_tasks/SOLEN_LIVE_TRUTH.md` — appended §F.2 section (~183 lines) between existing §F.1 and the Step 4 marker. References `var(--z-modal-bg)` per §8 z-index lock.
  - `app/[locale]/_components/primitives/index.ts` — appended Modal exports.
  - `app/[locale]/dev/primitives/page.tsx` — appended `<Section eyebrow="Modal">` rendering 4 live modal demos (sm confirm, md login w TextInput composition, lg report w RadioGroup+Textarea composition, sm destructive w isDismissable=false+keyboardDismissDisabled+autoFocus on Abbrechen). 4 new useState hooks for modal open states.
  - `tailwind.config.js` — appended 6 z-index tokens.
- **Bucket B candidate decisions logged (need user sign-off on wake-up):**
  - §F.2.5 footer destructive-tertiary placement — `<ModalFooter layout="between">` puts destructive on far left, primary group on right. Alternative was destructive in middle / inline with primary — picked `between` because it visually separates "irreversible" from "primary action," matches user expectation.
  - §F.2.7 default focus on destructive flows — focuses "Abbrechen" (secondary) instead of "Löschen" (primary destructive). Spec says "destructive defaults focus to Abbrechen so accidental Enter doesn't fire destructive action." Implemented via `autoFocus` prop on the cancel button. This is a defensible safety pattern but worth user sign-off.
  - §F.2.8 close X hit-area extension via negative margin — `w-11 h-11 -m-2.5` produces 44×44 click area while keeping the visual icon at 24px. Alternative: `padding: 10px` on the button (similar effect). Picked negative-margin because it doesn't add extra spacing around the icon (preserves the spec's 12px header gap to title).
- **Spec contradictions surfaced (TODOs for next doc-cleanup pass):**
  - None new. The two contradictions logged in V2-D17 (§F.1.4 Variant B gradient, §F.1.7 16px iOS rule) remain unresolved.
- **Live site impact: ZERO.** No existing route imports the modal. Only the dev test page at `/[locale]/dev/primitives` uses it (gated `notFound()` in production).
- **Typecheck:** `npx tsc --noEmit` — zero errors in `app/[locale]/_components/primitives/Modal.tsx` and `app/[locale]/dev/primitives/page.tsx`. Pre-existing 42 errors in legacy code remain (per V2-D05 retirement plan).
- **Status:** **shipped + locked.** Phase 0 §F.2 is complete: spec ✓ + mockup ✓ + React ✓ + dev verification ✓. **Next:** §F.3 bottom sheet primitive — same loop.

### V2-D17 (2026-05-08 evening) — Phase 0 §F.1 React implementation shipped

- **Context:** V2-D16 locked the §F.1 mockup (`public/solen-v2-primitives.html`). Per the V2 rebuild plan loop (spec → mockup → conflict scan → implement → lock), the next step was React implementation in `app/[locale]/_components/primitives/`. User authorized "go a" (Option A: implement now, not continue speccing §F.2-§F.8 first). Goal: vertical slice — get §F.1 working in code before writing 7 more sub-specs that may surface gaps only React reveals.
- **Architecture decisions (locked here so §F.2-§F.8 follow the same):**
  - **Native HTML + cva + cn() — NOT react-aria-components.** `react-aria-components` is installed (used by date pickers etc) but for §F.1 primitives the spec explicitly prefers native (§F.1.3 "v1 decision: native `<select>` for desktop AND mobile"). Native `<input>` / `<textarea>` / `<select>` / `<button role="switch">` are accessibility-correct out of the box. Adobe React Aria stays available for primitives that genuinely need richer state machines (date pickers, comboboxes, modals — §F.5+).
  - **Layout-shift-safe border pattern.** §F.1.0b spec defines stuck states (error / warning / success / active) as "2px border replaces 1px border" — literal interpretation causes a 1px layout shift on tone change. Solution: keep `border-1` always, paint the second pixel via `ring-1 ring-inset ring-{tone}` from the inside. Visually identical to a 2px border, but the box-model layout doesn't shift on state transition. Use this same pattern for any future bordered-input primitive.
  - **Composition pattern.** Each form field uses `<FieldLabel>` + `<{Primitive}>` + `<FieldHelper>` rendered as siblings — not nested inside a "Field" wrapper. This matches react-aria's compositional model + shadcn conventions, and lets callers compose error states however they need (e.g. only render `<FieldHelper tone="error">` after first blur).
  - **Controlled / uncontrolled hybrid for stateful primitives.** Switch supports both — pass `checked` for controlled, `defaultChecked` for uncontrolled. Falls through to `useState` internally when uncontrolled. Same pattern Switch / Checkbox / Radio expose. Caller chooses.
  - **Aria-pressed for PillToggle, not aria-checked.** PillToggle is rendered as `<button>` (not native checkbox/radio), so it uses `aria-pressed`. The `<PillGroup mode="multi"|"single">` parent communicates the semantics via `data-pill-mode`; semantic enforcement (single-select-deselects-others) is the caller's responsibility — matches how the spec is written, no surprise abstractions.
- **Tailwind tokens added:**
  - `s-bg.active = #FFF4E8` — input active-typing tint per LIVE_TRUTH §F.1.0 + §14.3. Was wrongly retired in a V2-D15 comment that conflated micro-tint with cream substrate. Clarifying comment added inline.
  - 4 motion easings (`ease-snap` / `ease-spring` / `ease-glide` / `ease-thud`) per LIVE_TRUTH §F.1 + §5b motion vocabulary. Distinct from existing `ease-out-warm` / `ease-out-back` / `spring-bounce` (those stay for legacy compat). Use V3 names in new code.
- **Files created (11):**
  - `app/[locale]/_components/primitives/FieldLabel.tsx` — label, supports `required` (red dot 5px) + `optional` (lowercase tag)
  - `app/[locale]/_components/primitives/FieldHelper.tsx` — helper / error / warning / success message with tone-appropriate icon + `role="alert"` on error + `aria-live="polite"` default for error+warning
  - `app/[locale]/_components/primitives/TextInput.tsx` — 9 states (default · focus · active · filled · error · warning · success · disabled · loading) × 3 sizes (sm 40px / md 56px / lg 64px) × 6 type variants (text · email · tel · password-w-reveal · search · number · url). `loading` shows trailing spinner without locking the field. `revealable` adds Eye/EyeOff toggle button on `type="password"`.
  - `app/[locale]/_components/primitives/Textarea.tsx` — 4 tones, `resize-y` only, 88-280px height range. Plus `<TextareaCounter>` companion (warns at 80% via brand-teal tabular-nums).
  - `app/[locale]/_components/primitives/Select.tsx` — native `<select>` with `appearance: none` + custom Lucide chevron, 3 sizes × 4 tones.
  - `app/[locale]/_components/primitives/Checkbox.tsx` — Variant A boxed, supports `indeterminate` (synced via effect since HTML doesn't support it as attribute), spring-overshoot check icon reveal (300ms ease-spring).
  - `app/[locale]/_components/primitives/Radio.tsx` — Variant A radio row, plus `<RadioGroup>` container with `role="radiogroup"`. Inner-dot fades 150ms ease-snap.
  - `app/[locale]/_components/primitives/Switch.tsx` — `<button role="switch">` with `aria-checked`, controlled+uncontrolled hybrid, optional label+sub-label rendering. Knob slides 200ms ease-snap, press scale 100ms ease-thud.
  - `app/[locale]/_components/primitives/PillToggle.tsx` — Variant B for both checkbox + radio (single source of truth — same shape, semantics handled by parent). Plus `<PillGroup mode="multi"|"single">` layout container.
  - `app/[locale]/_components/primitives/index.ts` — barrel export.
  - `app/[locale]/dev/primitives/page.tsx` — full dev test page rendering every primitive in every state. Routes at `/{locale}/dev/primitives`. Gated via `if (process.env.NODE_ENV === "production") notFound()`. To view: `npm run dev` then navigate to `http://localhost:3000/de/dev/primitives`.
- **Files patched:**
  - `tailwind.config.js` — `s-bg.active` token + 4 motion easings + clarifying comment about V2-D15 retired list scope
- **Spec contradictions surfaced for follow-up (not fixed in this commit):**
  - §F.1.4 Variant B inactive bg cited as `linear-gradient(180deg, #fff, #FDFAF5)` — V2-D15-4 supersedes (gradients banned on pills). React component implements flat white per V2-D15-4. Spec line should be updated to flat in a future doc-cleanup pass. Logged as TODO.
  - §F.1.7 line 1266 says "all text inputs `font-size ≥ 16px`" but V2-D14 decision B kept md inputs at 14px (accepting iOS auto-zoom). Internal contradiction. React component implements 14px on md per V2-D14 (locked). Spec line should be reconciled.
- **Live site impact: ZERO.** No existing page imports any of these primitives. They're dormant utilities. The dev test page at `/{locale}/dev/primitives` is the only route that uses them, and it's gated to dev only.
- **Typecheck:** `npx tsc --noEmit` — all 42 errors are in pre-existing legacy code (`components-legacy/`, `tmp3.tsx`, `tmp_header.tsx`) per V2-D05 incremental retirement plan. Zero errors from new files.
- **Status:** **shipped + locked.** Phase 0 §F.1 is complete: spec ✓ (V2-D14) + mockup ✓ (V2-D16) + React implementation ✓ (V2-D17) + dev verification ✓. **Next:** §F.2 modal primitive — same loop (spec draft → mockup → React).

### V2-D16 (2026-05-08) — Phase 0 §F.1 form primitives mockup locked

- **Context:** §F.1 spec was already written (~310 lines, V2-D14 lock 2026-05-05) and was already V3-aligned after V2-D15-3 (brand-teal `#043338`, Avant Garde Gothic body, ink-1 `#1A1209`). But the mockup `public/solen-v2-primitives.html` was pre-V3 — used Bricolage Grotesque (retired), Inter Tight as primary (now fallback only), Instrument Serif italic (italic banned V2-D15), orange `#E8742A` (retired), cream substrate `#FBF8F3` (retired V2-D15), `#8A3C0F` brand-text (retired). Mockup needed full rebuild against V3 tokens before Phase 0 §F.1 implementation could start.
- **Decision:** rebuild `public/solen-v2-primitives.html` from scratch on V3 foundations, locking the mockup as the visual reference Phase 0 §F.1 React components implement against. Spec stays in LIVE_TRUTH §F.1.1-§F.1.10 (no spec changes — only one cosmetic doc fix at §F.1.0b: disabled-state citation `(sunken cream from §3)` → `(sunken from §4)`, since `#FAF7F3` lives in §4 surface scale, not §3 semantic colors).
- **Mockup contents (state matrix complete):**
  - **§F.1.1 text input** — 9 states (default · focus-kbd · active-typing · filled · error · warning · success · disabled · loading) + 6 type variants (text · email · tel · password-w-reveal · search · number · url)
  - **§F.1.2 textarea** — 4 states (default · filled · approaching-limit warn · error too-short)
  - **§F.1.3 select** — 3 states (default-w-placeholder · filled · disabled)
  - **§F.1.4 checkbox** — Variant A boxed × 6 states (default · checked · indeterminate · focus · disabled-unchecked · disabled-checked) + Variant B pill (multi-select 8-pill demo, 2 active)
  - **§F.1.5 radio** — Variant A radio row × 4 states (sort sheet selected · booking step w disabled+focus inline) + Variant B pill (3-option group, 1 active)
  - **§F.1.6 switch** — 4 isolated states (off · on · focus · disabled) + 4-row settings-list demo
  - **§F.1.0a sizes** — sm/md/lg side-by-side
  - **§F.1.8 inline validation** — password strength meter (zu schwach · gut, 4-bar visual) + confirmation-match error
  - **§F.1.10 anti-patterns** — 4 banned patterns rendered with red dashed border + why-banned reasoning (floating labels · pill-shaped inputs · required-asterisk · clear-on-error)
- **V3 discipline applied:**
  - Cooper BT only at page h1 + section h2s (display moments). Avant Garde Gothic for everything else (labels, inputs, buttons, helper text, anti-pattern strips).
  - Brand-teal `#043338` for focus rings, checked checkboxes, on-state switches, radio dots, caret, selection bg `rgba(4,51,56,.18)`.
  - White substrate `#FFFFFF`. `#FFF4E8` warm tint for active-typing inputs (matches §14.3 search row). `#FAF7F3` sunken bg for disabled inputs.
  - Editorial section-break (top rule + eyebrow + meta + Cooper-BT h2) wraps every primitive section per V2-D15-4.
  - V2-D15-4 flat-pill discipline: no gradient buttons, no inset Web 2.0 gloss on pills, no `saturate(1.4)` glass pump, no italic anywhere.
  - All ink scale + semantic colors from §3/§4, all easings from §5b motion vocabulary.
- **Files patched:**
  - `public/solen-v2-primitives.html` — full rewrite, ~870 lines
  - `_tasks/SOLEN_LIVE_TRUTH.md` — §F.1.0b line 1081 cosmetic fix (`from §3` → `from §4`)
- **Status:** **locked.** Mockup is the visual reference Phase 0 §F.1 React implementation will match. **Next:** option A — implement §F.1 React components in `app/[locale]/_components/primitives/` against tailwind V3 tokens (the actual ship); option B — continue spec/mockup loop with §F.2 modal primitive (parallel-track all 7 remaining Phase 0 sub-sections, then implement at end). User decision.

### V2-D15-4 (2026-05-07 evening) — Pill de-gloss + editorial section-break (Option D)

- **Context:** After V2-D15-3 lock landed, user spawned a fresh Opus sub-agent to test if the V3 spec was self-sufficient (it was, 3.5/5 confidence) but the agent's output read "shiny / 2000s / draft." Pre-commit audit by 5 parallel Sonnet sub-agents had already cleaned ~50 inconsistencies, but the user identified two remaining issues: (a) pills feel too shiny (Web 2.0 gloss tricks baked into §5b L4 + §1 hover gradient + the "inset 0 1px 0 rgba(255,255,255,X)" pattern across CTAs/badges/chips), (b) section titles read bland (Avant Garde 700 plain h2, no editorial framing). User explicitly opted to KEEP everything else from V2-D15-3 (atmosphere wash, category combos, depth on cards, brand teal usage, etc.) and only fix these two surfaces.
- **Decisions (locked from `public/solen-v3-pills-titles-tweaks.html` preview):**
  - **Tweak 1 — pill de-gloss (LIVE_TRUTH §5a.2 + §5a.3 added).** Pills are FLAT. The §5b depth system applies to cards / surfaces / overlays, NOT pills. Drop on every pill: `inset 0 1px 0 rgba(255,255,255,X)` Web 2.0 inner-glow, `linear-gradient` button backgrounds (gradient on hover banned — use `transition: background 150ms ease` to a flat lighter/darker variant), stacked multi-shadow (max ONE soft shadow on pills, only when contextually elevated like a frosted-glass badge over a photo), `backdrop-filter: ... saturate(1.4)` (use `saturate(1)`), brand-color glow ring on dots (`box-shadow: 0 0 0 3px rgba(brand,.2)`), tinted brand-color drop shadows on CTAs. Locked pill-treatment table in §5a.3 covers 8 pill types (primary CTA, secondary ghost, default chip, active chip, glassy badge, salon-card heart, numbered step, status dot).
  - **Tweak 2 — Option D editorial section-break (LIVE_TRUTH §15 rewritten).** Old V2-D15 minimalist `clean` layout (Avant Garde 700 h2 left + `Alle →` right, no eyebrow, no meta) is **retired**. Replaced with the editorial section-break pattern: (1) 1px ink-1 top rule, (2) eyebrow-left + meta-right row in Avant Garde 700 11px uppercase letter-spaced 0.18em (eyebrow optionally leads with brand-teal 5px dot, meta uses tabular-nums), (3) h2 row: **Cooper BT 900** (replacing Avant Garde 700 from V2-D15) at clamp(28-40px) + `Alle →` link in brand teal underline-3px. Spacing: 48/64px section margin-top (was 32/48 — increased for section-break breathing room), 14px rule→eyebrow, 12px eyebrow→h2, 16px h2→content. Per-section eyebrow + meta examples table added covering all 9 homepage sections.
  - **§5b L4 backdrop-filter saturate(1.4) → saturate(1)** locked (V2-D15-4 anti-pattern call-out moved into §5a.2). All globals.css glass utilities also swept to saturate(1) — 9 instances total (was using 1.2, 1.3, 1.4 across `.glass`, `.glass-strong`, `.glass-subtle`, `.glass-frost`, `.glass-toolbar`, `.glass-pill`, `.glass-pill-active`, the v5 frosted glass, and the driver-popover).
  - **§1 hover gradient retired.** Brand-teal CTA hover was `linear-gradient(180deg, #0A6873 0%, #043338 100%)` plus inset highlight + tinted drop shadow. Now: flat `#043338` resting → flat `#0A6873` mid-teal on hover via `transition: background 150ms ease`. Optional `transform: translateY(-1px)` on hover, `transform: scale(0.98)` on active w `transition-duration: 100ms`. Same gradient string was used at §13.4 hero search submit and §14.2 search-results filter active-chip — both swept by replace_all.
  - **§5a renumbered to §5a.1 (text color rule, original V2-D15-3 lock) + §5a.2 (surface treatment, V2-D15-4 lock) + §5a.3 (treatment table).** Text-color rule unchanged; new subsections add the de-gloss discipline.
- **What V2-D15-4 keeps from V2-D15-3 (no change):** brand teal `#043338` + pale teal + brand subtle, 4 categories Z/G/A/I, Cooper BT + Avant Garde Gothic typography, atmosphere wash recipe (still 0.78/0.72/0.32/0.28 opacities), §5b L1/L2/L3/L5 depth on cards/surfaces/overlays/accent-glow (cards still get inset highlights and stacked shadows — those weren't the user's complaint), Republik colorway monochrome rule, pill text white-or-black (§5a.1), Yuh-density principle, semantic colors, ink scale, every dimension/layout/spacing rule.
- **What V2-D15-4 considered and rejected:** the broader `solen-v3-depth-comparison.html` preview proposed flat-modernizing the entire §5b depth system (dropping inset highlights from cards, single soft shadow on hover only, flat card surface, atmosphere wash 0.40/0.40/0.10, flat city tiles per-city-tinted, B2B card flat brand-subtle). User explicitly rejected: "i actc like how it is rn like bfr u make any tweaks." The shiny depth on cards / B2B / atmosphere stays — only PILLS got de-glossed, only TITLES got editorial framing.
- **Source-of-truth artifacts:**
  - `public/solen-v3-pills-titles-tweaks.html` — the A/B preview that locked the picks (pills clean side + Option D)
  - `public/solen-v3-depth-comparison.html` — the rejected broader-modernization proposal (kept on disk as what-not-to-do reference)
  - `public/solen-v2-republik-teal.html` — locked homepage now using the section-break pattern + de-glossed pills
- **Files patched:**
  - `_tasks/SOLEN_LIVE_TRUTH.md` — §5a (added §5a.2 surface treatment + §5a.3 pill-treatment table, ~75 lines), §5b L4 saturate sweep, §1 hover gradient retired (string sweep on `linear-gradient(180deg, #0A6873 0%, #043338 100%)` → flat note), §15 rewritten (anatomy diagram + locked decisions + §15.7 per-section eyebrow/meta examples added)
  - `app/globals.css` — saturate(1.2/1.3/1.4) → saturate(1) sweep, 9 glass utilities cleaned
  - `public/solen-v2-republik-teal.html` — `.btn-primary` flat-pill rewrite, `.section-h2` switched from Avant Garde 700 to Cooper BT 900, `.section-link` underline + brand teal, `.sec-break-rule` + `.sec-break-meta-row` + `.sec-break-eyebrow` CSS added, both section headers ("In Basel diese Woche" + "Jede Kategorie, ihre eigene Farbe") wrapped with the editorial pattern
- **Implications for tailwind.config.js + Phase 0 implementation:** no token changes needed (font tokens, color tokens, shadow tokens unchanged). Pill components implemented in Phase 0 §F.1 must follow §5a.2 anti-pattern list — the `pre-sweep-check.sh` audit pattern would catch any inset highlight + saturate(1.4) regression on a future PR. Section-header component implemented in Phase 0 must use the §15.1 anatomy diagram exactly.
- **Status:** locked. Spec patches applied 2026-05-07 evening. Homepage mockup reflects the lock at `public/solen-v2-republik-teal.html`. V2-D15-3 superseded for §5a + §5b L4 + §1 hover + §15; everything else V2-D15-3 intact.

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

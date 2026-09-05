# SUGGESTIONS.md , live design-improvement suggestions (design-suggest contract)

<!-- exists-check: net-new file created by the design-suggest system 2026-07-10 (its SKILL.md names this path as its output); extends, not duplicates, FRONTEND_AUDIT_2026-07-08.md (that = found DEBT vs current law; this = forward DIRECTIONS + the owner's new lenses). Max ~7 live entries; approved/rejected entries move to the log at the bottom. -->

> How this works: each entry is a suggestion, not a decision. Approve by clicking its chip (or
> saying its number). [mockup] = you see it before it ships; [behavior] = interaction change;
> [code] = already covered by locked law, no taste question. LOCK flags mean approving also
> unlocks a frozen row , called out explicitly.

> **Refreshed 2026-09-05** by the round-2 judgment pass. The live seven below are the buildable-now
> gaps from `research/WHAT_IS_MISSING_2026-09-05.md`, which was written against ten round-1 direction
> folds and five live reference folds measured the same day. Every number in an entry was measured in
> that run and names the file that produced it. The previous live set (S1, S3 to S7) went unanswered
> for four consecutive weekly passes; it is carried below the new set rather than deleted, because
> none of it was ever approved or rejected. Each entry was checked against `REMOVED.md` before it was
> written; the two that touch a graveyarded area say so in their own row.

## S8. Ink text and a saturated icon on every pale semantic pill , [code][mockup] | effort M | statutory floor

- **what:** the pale-tint-plus-same-hue-text recipe puts coloured text on its own tint. Replace it with
  the recipe `CLAUDE.md` taste rule 6 already specifies: pastel `.bg` + ink text + saturated icon. This
  is **not** the monochroming that taste rule 4 forbids: the hue stays on the screen, it moves from the
  text to the icon, which is where the same rule says a semantic colour is legal.
- **where:** `components-legacy/booking/BookingCard.tsx:84-90` (five states, rendered at `:137-139` as
  `rounded-pill px-2.5 py-1 text-[12px] font-semibold`) and
  `app/[locale]/_components/salon/SalonBundles.tsx:191` (the discount pill, live on the salon page
  today). **The fix already exists in our own code:** `components-legacy/ui/SalonBadge.tsx:59` renders
  `color: "#0A0A0A"` on the identical `#E8F5E9` fill, so this is one recipe winning over the other, not
  a new invention.
- **why:** computed this run by alpha blending each `/10` fill over white exactly as it renders
  (`scratchpad/r2/judge/badge_contrast.py`): confirmed `#16A34A` on `#E8F6ED` = **2.96:1**, pending
  `#F1AE27` on `#FEF7E9` = **1.82:1**, cancelled `#DC2626` on `#FCE9E9` = **4.13:1**, completed
  `#6B6B6B` on `#F3F3F3` = 4.80:1. AA for 12px text is 4.5:1, so three of five fail and pending misses
  even the 3:1 graphical floor. Measured live at 390x844 on `/en/salon/muse-beauty-studio`, the
  discount pill renders fill `rgb(232,245,233)`, text `rgb(22,163,74)`, 13px, 58x28: **2.93:1**. Ink on
  that same fill measures **17.76:1**. WCAG AA sits at precedence tier 2, above taste at tier 5.
- **effort:** M. Two components now. The wider family (a `bg-s-{success,warning,error,urgency,open}`
  fill with a `text-s-` of the same family in one className) is 89 matches across 52 files, 23 of which
  also carry an explicit `text-[Npx]` so they are certainly text and not an icon disc.
- **graveyard:** `REMOVED.md:90` killed the `-0%` discount badge, not the pill. Nothing here re-adds a
  zero state, and no STOCK-style marker is involved (`REMOVED.md:101`).
- **source:** `research/WHAT_IS_MISSING_2026-09-05.md` G5.

## S9. `rounded-input` renders 16px on 37 sites while three documents and the owner say 12 , [code][mockup] | effort S | no lock

**SUPERSEDED 2026-09-06, measured, do not apply.** Every native input already renders 12px (app/globals.css:441, a base rule that out-specifies the utility), and none of the 37 `rounded-input` sites is an input, so changing the token would move 37 wrappers and photos and no field. The live suggestion is S15 (rename the token). Kept for the record.

- **what:** one token value. `input: "16px"` becomes `12px`.
- **where:** `tailwind.config.js:289`. No document changes: the three that describe it already agree
  with each other.
- **why:** `LOCKFILE.md:580` records "input 12px ... Owner kept shipped 12 over 16, 2026-06-08",
  `SOURCE.md`'s radius table says 12 ("corrected here 2026-07-12"), and `CLAUDE.md:140` says "Height
  48, radius 12". **37** live uses of `rounded-input` counted this run, so a control the owner settled
  personally renders at the value he turned down, on every one of them.
- **effort:** S. One line, and the mockup is a formality: one input at both radii, stacked, since the
  change is visible even though no taste question is open.
- **source:** `research/WHAT_IS_MISSING_2026-09-05.md` G3. Not found by the 2026-09-04 pass or by
  `DESIGN_FILES_AUDIT.md`.

## S10. Count border-and-shadow doubles in the geometry pass , [code] | effort M | no lock

- **what:** the FLOORS pass renders a fold already. Add two counts to it: elements carrying a visible
  border AND a box-shadow at once, and total bordered elements. Fail above a ceiling recorded beside
  the prose rule.
- **where:** `scripts/check-geometry.mjs` (the FLOORS pass); the numeric ceiling goes in
  `_design-system/LOCKFILE.md` §17.2, next to the sentence it enforces.
- **why:** §17.2 already states the rule in its own words, *"a card carrying elevation drops its
  border, never both"*, and nothing counts it at render time. Measured this run in the fold: 15
  doubles across the ten round-1 direction pages (payment-step A 6, search-results A 3, empty-states C
  3, confirmation C 1, press-motion A 1, profile C 1) against **1** across all five live reference
  folds. Bordered elements: payment-step A 13, empty-states C 12, search-results A 11, against Airbnb
  listing 3, Fresha venue 4, Fresha search 4.
- **effort:** M.
- **source:** `research/WHAT_IS_MISSING_2026-09-05.md` G10, numbers from `WHY_UNFINISHED.md` section 4.

## S11. Render the real product chrome on `/dev` direction pages , [behavior][code] | effort S | no lock

- **what:** an opt-in on the direction routes that keeps the Header, `BottomNav` and consent bar, so a
  direction is composed and judged inside the viewport a customer actually gets.
- **where:** `app/[locale]/_components/layout/HideInBooking.tsx:60`,
  `if (/\/dev(\/|$)/.test(pathname)) return null;`. `BottomNav` is real and mounted at
  `app/[locale]/layout.tsx:170` (`md:hidden fixed inset-x-0 bottom-0`); its own header comment records
  the height as **125px total**.
- **why:** fixed or sticky blocks intersecting the fold measured **0** on all ten round-1 direction
  folds (payment-step A's own sticky bar is the single exception) against live `/en` 2, Airbnb home 3,
  Fresha search 2. Round 1 therefore laid out eight screens for a phone 125px taller than the real one,
  and the switcher strip put 44px of scaffolding back where the chrome should have been. The bottom nav
  is approved and shipping (`REMOVED.md:124`, owner 2026-08-10, "easier ... for the web area"), so a
  preview without it is a preview of a screen the product does not have.
- **effort:** S. The instrument changes, no design law does.
- **source:** `research/WHAT_IS_MISSING_2026-09-05.md` G11.

## S12. Swap the greyscale seed photo and say one line about what is inside a frame , [code] | effort S | no lock

- **what:** replace the seed photo `photo-1560066984`, and give `LOCKFILE.md` §11's existing sourcing
  policy one line about photo CONTENT, which no file in the estate currently mentions.
- **where:** the seed photo set, plus `_design-system/LOCKFILE.md` §11 Imagery Pattern Registry.
- **why:** measured mean HSV saturation across the six seeded photos: 0.193, 0.248, 0.157, 0.221,
  0.430 and **0.000**. The zero one is greyscale, its computed `filter` is `none`, and it renders in
  the fold of **five of the ten** round-1 directions. bookings-list A is 57.0% photographic and
  **0.0%** coloured; Airbnb listing is 44.4% and 32.5%. `CLAUDE.md` FLOORS LAW 2 and `LOCKFILE.md`
  §17.1 both specify photographic AREA and the missing-photo fallback, and neither says anything about
  what is in the picture, so a colourless photo passes the imagery floor and still reads dead.
- **effort:** S. Seeding is the expected fix, named as such in taste rule 1.
- **graveyard:** `REMOVED.md:101` killed the STOCK marker badge. This adds no marker; it changes an
  asset.
- **source:** `research/WHAT_IS_MISSING_2026-09-05.md` G9.

## S13. LOCKFILE truth pair: a deleted component in the badge table, and `elevation-2` defined twice , [code] | effort S | no lock

- **what (a):** `LOCKFILE.md:1663` (§13.3, dated 2026-06-10) points the "Status (open/closed/pending)"
  row at `StatusPill`, deleted 2026-06-30 (`_design-system/components/StatusPill.md:1-8`,
  `REMOVED.md:46`), zero live import sites. The live component is `StatusInline`, three import sites
  (`SalonDetailV3.tsx`, `SalonSidebar.tsx`, `SalonHeader.tsx`). Repoint the row.
- **what (b):** `LOCKFILE.md:678` asserts `elevation-2 (= warm-md = card-hover = surface)` as a
  two-layer shadow. `tailwind.config.js:313` defines it single-layer, `0 2px 8px rgba(50,47,44,0.09)`,
  while `:295` `card-hover` and `:296` `surface` keep the two-layer value, so the aliases the lock
  calls identical are not. Same shape for elevation-3 at `:314`. Record the real values and drop the
  false `=` chain.
- **why:** §17.2's depth table sends every builder to `elevation-2` by name, so the token they reach
  for is not the value the lock records. This is documentation drift on a token in daily use.
- **do not "fix" the tint:** `LOCKFILE.md:685` says the warm `rgba(50,47,44, ...)` base is deliberate
  and that cool-greying the shadows is wrong. The defect is the value mismatch, not the hue.
- **effort:** S. Documentation only, no visual change.
- **source:** `research/WHAT_IS_MISSING_2026-09-05.md` G7 and G4.

## S14. Three type-ramp rows in LOCKFILE §2 and §2.5 , [code] | effort S each | LOCK flag (§2 Scale table)

- **what (a), the ramp may not have a hole in it:** §2.5 counts sizes and caps them at 4. Nothing says
  the sizes have to be spread. Measured: confirmation C renders 12px x14, 14 x4, 15 x2, 16 x1, 28 x1,
  with **nothing between 16 and 28**; payment-step A and empty-states B carry the same 12px hole. The
  references populate it: Airbnb listing 26 then 18 x3 then 16 x7 and 14 x13; Airbnb home 28 then 18 x2
  then 14 x10; Fresha venue 28 then 19 x2 then 16 x12. Their anchor-to-second-tier drop is 8, 10 and
  9px; ours on the three commit screens is 12px with a single text run beneath it.
- **what (b), reconcile the CTA row:** `CLAUDE.md:129` says CTA 15 ("never <=13 on a button"),
  `LOCKFILE.md` §2 Scale table says mobile 14 and desktop 15, `LOCKFILE.md` §2.5 role registry says 15
  flat with no phone column. Round 1 shipped 15 on every primary button measured, matching two of the
  three. Give the CTA row the phone-versus-desktop reconciliation the Core ramp got on 2026-09-04
  (`LOCKFILE.md:393-397`).
- **what (c), record what carries the anchor once weight cannot:** `app/globals.css:269` clamps
  `main :is(.font-semibold, .font-bold)` to 500, with dashboard restored to 600 on the next selector.
  That is his 2026-08-15 option C, a decision, not a defect. Measured: characters at weight >= 600 in
  the fold are **0.0%** on eight of the ten directions and on the live salon page, against Airbnb home
  9.4%, Airbnb listing 5.5%, Fresha venue 8.2%, Fresha search 17.5%. Six inline `fontWeight` bypasses
  already exist in the directions folder, one of them commented *"inline style beats the sitewide
  font-bold->500 clamp"*, because nothing states what to use instead of weight.
- **explicitly NOT in this entry:** the 4-size ceiling itself. `TASTE_AUTHORITY.md:279-281` puts B37,
  the size-count contradiction, on the "OPEN, AND NOT YOURS TO CLOSE" list, and four of the five
  reference folds break our working default (Airbnb home 6 sizes, Airbnb listing 5, Fresha venue 5,
  Treatwell 6). That one is his.
- **effort:** S per row.
- **source:** `research/WHAT_IS_MISSING_2026-09-05.md` G8, G12, G13, G14.

## S15. Rename the rounded-input token , [code] | effort S | no lock

- **what:** the token is 16px and sits on 37 non-input elements (wrappers, avatars, photo thumbnails,
  modal shells) while native inputs get their 12px from a separate rule in `app/globals.css:441`
  (inside the `@layer base` block starting `:434`, which out-specifies the single `.rounded-input`
  utility since Tailwind 3.4 emits no real cascade layers). A rename to a name that says what it is,
  the entity-card 16 that `CLAUDE.md:134` already locks, is a zero-visual-change mechanical sweep: no
  element currently rendered with `rounded-input` changes size, only the class name changes.
- **where:** `tailwind.config.js:289` plus the 37 call sites (list:
  `scratchpad/r2/rounded-input-sites.txt`), none of which is a native `<input>`, `<textarea>` or
  `<select>`.
- **why:** a token whose name promises a value it never delivers is the same "value typed versus value
  stated" defect `research/WHAT_IS_MISSING_2026-09-05.md` names throughout, just running the other
  direction, the name is wrong rather than the number. Verified this run: `input:not([type=checkbox])
  ...` in `app/globals.css:434` sets `border-radius: 12px` at `:441`, unconditionally, on every native
  input/textarea/select, with no reference to `rounded-input` at all.
- **effort:** S. Mechanical find-and-replace of the class name; no document changes, since none of the
  three radius documents ever described a non-input element.
- **source:** `research/WHAT_IS_MISSING_2026-09-05.md` G3 (corrected 2026-09-06).

---

## Carried from the previous set, never approved and never rejected (2026-07-10 to 2026-08-01)

Open for four consecutive weekly passes. Listed in one line each so nothing is lost, not restated in
full a fifth time. They need an approve-or-drop, and until they get one they are not competing with the
seven above for the max-7 slot count.

- **S1. Motion modernization sweep** , [code] | L. 94 of 135 animated sites still run single-property
  animations; plan at `research/MOTION_MODERNIZATION_2026-07-10.md`. Still the largest single piece of
  design debt in the file.
- **S3. Chrome subtraction bundle** , [behavior][mockup] | M-L | LOCK flags. Header hides on scroll,
  CityTopBar folds into the header, sticky book bar condenses. **Read it against S11 before building:**
  S11 says our previews are missing chrome that ships, S3 proposes removing chrome that ships, and the
  two want the same viewport measured before either lands.
- **S4. Booking step-swap gains direction** , [behavior] | S | LOCK flag (MOTION.md values).
- **S5. Skeleton-to-content uses the enter recipe** , [behavior] | S.
- **S6. Subtraction pair** , [code][remove] | S. Part (b), the border-plus-shadow double-chrome sweep,
  is the same defect S10 proposes to start counting. Approving S10 without S6 measures the problem
  without fixing it.
- **S7. Homepage sections cascade on scroll-into-view** , [mockup] | M.
- **7. De-uppercase the partner landing page** , [code] | S (2026-08-01). 9 of the estate's 18 live
  tracked-uppercase eyebrows sit in `app/[locale]/partner/page.tsx`. Supersedes the 2026-07-11 item 1;
  fold the two, never carry both.

---
Parked (not suggested , blocked on the owner, or the lock says no):

- **The button and chip radius (16 versus capsule).** `CLAUDE.md:134` records the 2026-08-16 correction
  to `rounded-[16px]`, and `tailwind.config.js:288` still ships `btn: "99px"` with four documents
  agreeing with the config. It cannot be fixed in either direction yet: `TASTE_LOG.md:1266` is the only
  mention in the repo of a "16px chip corner he rejected on sight 2026-09-02", it carries no verbatim,
  no replacement value and no dated entry, and the sentence parses both ways. **The unblocking move is
  one question to him, not a commit.** Live call sites, counted this run: `rounded-btn` 359,
  `rounded-pill` 299, `rounded-[16px]` 212.
- **A `.text` companion for `s-success` and `s-error`.** `s-warning` has had one since 2026-06-02
  (`#B45309`, measured 4.71:1 on its pale fill); the other two families have `.DEFAULT` and `.bg` only.
  It mints a value, so it is an ASK under `TASTE_AUTHORITY.md` §4 item 6. S8 fixes the same screens
  today without minting anything, which is why S8 is live and this is parked.
- **A generator for `public/solen-styleguide.html`.** 168 hand-authored lines, nothing generates it,
  and it is stale on radius (`:34-36`, `:148` draw buttons at `border-radius:999px`). Either it gets a
  generator or `CLAUDE.md` drops the claim that it is "the contract the whole app holds to". Effort
  M-L, and the choice between those two is his.
- eyebrow-drop-default (narrows a deliberate carve-out , resurface only if S3 lands), radius-token
  collapse (superseded by the radius park above, which names the actual blocker).

## Log
- 2026-07-10 scroll-pill (owner-confirmed element from the X ref) PARKED after seeing the checkout mockup: "meh idk abt putting ths in booking but maybe in store pages but acc think but park ths for now". Mockup stays at public/_mockups/checkout-scroll-pill.html for reference; candidate surface when revisited: salon/store pages. Nothing builds until the owner reopens it.
- 2026-07-10 S2 (Go-with card adaptation) REJECTED by owner: 'not at all what i mentioned'. Mockup deleted + graveyarded. The reference interest is being re-scoped by direct owner question (which element of x-scrollpill-ref.mp4 they actually liked); nothing rebuilds until that answer exists (ask-first gate added same day).
- 2026-09-05 refresh: S8 to S14 added from `research/WHAT_IS_MISSING_2026-09-05.md`. S1 and S3 to S7 moved to the carried block unanswered, not dropped. The radius question, the semantic `.text` companions and the styleguide generator were parked with their blockers named.
(approvals/rejections land here with dates)

---

## Appendix: 2026-07-11 weekly self-audit aggregate (merged 2026-07-16 during the branch salvage; the two versions of this file were concatenated by an unresolved conflict, now resolved keep-both with the design-suggest contract as the canonical head)

<!-- exists-check: net-new vs SOURCE.md/DRIFT_LEDGER.md/_drift-report.md because this is the design-suggest skill's own record file (skill section 2 names _design-system/SUGGESTIONS.md); it aggregates deltas FROM those files into rankable suggestions, none of them hold suggestions. -->
# Design suggestions (design-suggest channel)

> Refreshed 2026-07-11 by the weekly self-audit (gather+record only, chips deferred per skill cadence).
> Every file:line below was verified against the working tree on 2026-07-11, not copied from an audit doc.
> Rules that bind any build: mockup-first on the REAL page, treatment-only, design-verifier PASS, tunnel link.

## Live suggestions (max 7)

### 1. Strip tracked-uppercase eyebrows from the partner landing page
- what: 9 instances of `uppercase tracking-[0.16em]` eyebrow labels on a rebuilt customer surface.
- where: `app/[locale]/partner/page.tsx:47` (plus 59, 96, 128, 161, 249, 284, 401, 483)
- why: banned pattern (copy-economy rule 5: normal-case 13px semibold); drift-report A21 hard finding.
- effort: S
- source: drift-report

### 2. Replace opacity hairlines in the booking pay step with the border token
- what: 4 dividers use `border-s-ink/[0.06]`-style opacity hairlines instead of `border-s-border` (#E4E4E7).
- where: `components-legacy/booking/PayConfirmStep.tsx:284, 300, 317, 361` (drift code A17)
- why: design contract hairline row: one token (`s-border #E4E4E7`) for every divider.
- effort: S
- source: drift-report

### 3. "Mehr lesen" review expander should be blue, not ink
- what: the truncated-review expand button renders `text-s-ink`; the locked pattern is inline `text-s-accent`.
- where: `app/[locale]/_components/salon/SalonReviews.tsx:212-214`
- why: copy-economy rule 2 names this exact pattern ("blue Mehr lesen"); LOCKFILE link row (`s-accent #276EF1`).
- effort: S
- source: PSYCH_AUDIT / LOCKFILE divergence

### 4. Lift 36px touch targets on search controls to the 44px floor
- what: map-toggle and filter/clear buttons are `h-9 w-9` (36px), under the locked >=44px floor.
- where: `app/[locale]/_components/search/SearchTemplate.tsx:1295, 1326`
- why: design contract touch-target row (>=44px / `h-11`); PSYCH_AUDIT high item. Note: line 1295 carries a V3-D421d comment ("map icon stays full size when pinned"), so check that decision before changing the pinned state.
- effort: S
- source: PSYCH_AUDIT

### 5. Give the booking-action magic-link page a recovery action
- what: the page has ZERO tappable elements (verified: 0 button/Link/a tags) in all terminal states; email arrivals hit a dead end.
- where: `app/[locale]/booking-action/page.tsx`
- why: PSYCHOLOGY law K (every terminal/empty state gets one computed recovery action); peak-end law G.
- effort: S
- source: PSYCH_AUDIT

### 6. Wire haptics on key mobile commit taps
- what: the one open `[ ]` item in MOTION.md: `navigator.vibrate` on Buchen/confirm taps where the platform supports it (Android; iOS web limited, never fake it).
- where: `_design-system/MOTION.md:79`; entry points `components-legacy/booking/PayConfirmStep.tsx` (pay CTA), `BookingWizard.tsx` (final confirm)
- why: MOTION.md principle line 54; the only owner-flagged open motion debt.
- effort: S
- source: MOTION.md

## Dropped this pass (do not resurface without re-check)
- Pay-step star-rating gating: STALE. `PayConfirmStep.tsx:347-354` already gates on rating AND count together and renders the count. The PSYCH_AUDIT item is fixed.
- Booking stepper progress-bar: graveyard hit (REMOVED.md), killed by owner.

## Source counts (2026-07-11 gather)
- drift-report (2026-07-06): 30 hard findings, ~21 on rebuilt/live routes (9 partner A21, 4 PayConfirm A17, 3 vouchers A21, 4 single A21s, 1 A1 not-found hex, 1 A19 gift-card sub-12px, 1 B5 BookingWizard).
- MOTION.md: 1 open leftover (haptics).
- PSYCH_AUDIT_2026-07-07: ~13 still-open [mockup]/[code] items after kill-list drops; top 3 carried above.

---

## 2026-07-18 weekly self-audit refresh (gather+record only, no chips)

Verified sources: _drift-report.md (no rerun this pass, 2026-06-12 report still current), MOTION.md, TASTE_LOG.md through 2026-07-17.

Prior 6 live items (2026-07-11): none surfaced as "resolved" in TASTE_LOG or in recent commits touching the cited files, so all 6 remain open. Owner should approve or drop rather than re-list; no chips fired.

New deltas since 2026-07-11:
- **TASTE_LOG 2026-07-17 input law**: input radius corrected from 16 to 12; input fill = filled gray #F4F4F5. CLAUDE.md updated. Not a suggestion (it is a settled call already applied via the type-targeted base rule); flagged here so no future suggestion re-litigates it.
- **TASTE_LOG 2026-07-16 IG-principles round 1**: 12 ADD candidates owner-approved; deliverables tracked in workstream #30 (IG_PRINCIPLES_EVAL.md), not in this file.
- **TASTE_LOG 2026-07-15 dark mode**: DECLINED, graveyarded. No suggestion.
- **Drift-gate literal gaps surfaced by 2026-07-18 audit (DOC-VS-GATE reconciliation)**: 10 LOCKFILE §1 hexes are missing from `ALLOWED_HEX` in `.claude/skills/solen-drift-check/scripts/check.py` (#E4E4E7 s-border, #F1AE27 s-warning, #C2410C s-urgency, #EA580C s-surcharge, #C03001 s-pop, #DC2626 s-error/s-closed, #1F8900 s-open, #B45309 s-warning.text, #EAEFFE s-accent.pale, #9CA3AF s-chart-2). Legitimate inline SVG fills for those tokens currently fire A1 false-positive drift. Parked here (fix belongs to the checker, out of write scope for this audit; see _plans/SELF_AUDIT_2026-07-18.md).
- **Drift-gate RETIRED_TOKENS gaps**: `s-amber`, `s-love*`, `s-cat-*-text`, and 5 of the `s-atm-*` family are named RETIRED in LOCKFILE §1 but missing from the checker's `RETIRED_TOKENS` set; net-new use would not be flagged. Same parking as above.

---

## 2026-07-25 weekly self-audit refresh (gather+record only, no chips)

Verified sources: `_drift-report.md` (2026-06-12 report, not rerun , logger only), `MOTION.md`,
`TASTE_LOG.md` through 2026-07-24, `REMOVED.md`, and a live `--gate-stdin` probe of the drift gate.

**Prior live items:** the 6 from 2026-07-11 (carried at 2026-07-18) are all still open , nothing in
TASTE_LOG or recent commits resolved the cited files. Still awaiting an owner approve-or-drop; no
chips fired this pass either. Not re-listed here to avoid a third duplicate block.

**MOTION.md:** still exactly 1 open leftover (`MOTION.md:80` haptics). No new motion debt.

### CORRECTION to the 2026-07-18 DOC-VS-GATE numbers (this audit under-counted itself)

Last pass reported "10 missing hexes" and "4 missing `RETIRED_TOKENS`" from a text grep of
`.claude/skills/solen-drift-check/scripts/check.py`. That grep read COMMENTED-OUT and prose hexes as
live set members, so both counts were wrong. This pass parsed the sets via AST (ground truth) and then
PROVED each gap by piping a real payload through `check.py --gate-stdin` and reading the exit code.

**Measured: 25 LOCKFILE §1-3 hexes are absent from `ALLOWED_HEX`; all 25 block (rc=2, rule A1).**
Split by whether the block is CORRECT:

- **16 are LIVE locked token values , these are FALSE POSITIVES** (a legitimate inline SVG `fill=` /
  `style={{}}` / `tailwind.config.js` definition of the token is refused):
  `#E4E4E7` s-border · `#1F8900` s-open · `#F1AE27` s-warning · `#FDF6E7` s-warning.bg ·
  `#B45309` s-warning.text · `#C2410C` s-urgency · `#C03001` s-pop (UN-RETIRED V3-D424) ·
  `#C5C8C4` s-ink-disabled · `#9CA3AF` s-chart-2 (reinstated 2026-07-21) · `#D1D5DB` s-chart-3 ·
  `#DC2626` s-error/s-closed · `#FEE2E2` s-error.bg · `#E8F5E9` s-success.bg ·
  `#EA580C` s-surcharge · `#FFEDD5` s-surcharge.bg · `#EAEFFE` s-accent.pale
- **9 blocks are CORRECT** (superseded or conditional, the gate is right to refuse them):
  `#15803D` (tokenized s-brand.mid only, removed 2026-07-12) · `#185CE0` (old accent-deep, current is
  `#1E54B7`) · `#906309` (de-muddied V3-D424) · `#D32F2F` + `#FFEBEE` (consolidated onto `#DC2626`
  / `#FEE2E2`) · `#E0DDDB` + `#E8E4DF` + `#F8F5F2` (warm chrome, reversed by v2 rule 4) ·
  `#E09A0C` (sanctioned deeper amber sibling, needs an owner pick first)

**Severity is MEDIUM, not high:** the gate blocks a RAW HEX and points at the Tailwind token, which is
the correct authoring form on a component. The real false-positive surface is narrow , the
single-point definition files (`app/globals.css`, `tailwind.config.js`, both measured BLOCK) and
inline SVG fills. `drift-ok: <reason>` clears it, so nothing is actually wedged.

**`RETIRED_TOKENS`: 7 gaps** (LOCKFILE §1 names them retired, the gate would not flag net-new use):
`s-amber` (PERMANENTLY KILLED V3-D320) · `s-love` family · and 5 of the `s-atm-*` family the gate
misses because it lists only warm/cool/base , `s-atm-cream`, `s-atm-terra`, `s-atm-sage`,
`s-atm-bone`, `s-atm-butter`. (The bare `s-sage`/`s-butter` entries do NOT prefix-match the
`s-atm-` forms.) The `s-cat-*-text` variants ARE covered: `retired_token_re` ends on `\b`, which
matches before the `-text` suffix , verified.

Both fixes live in `.claude/skills/solen-drift-check/scripts/check.py`, which is PRODUCT code and
outside the self-audit's write scope. Parked for an owner-approved edit; full detail and the exact
literal lists are in `_plans/SELF_AUDIT_2026-07-25.md`.

### Not suggestions (recorded so no future pass re-litigates them)
- Phantom-gate sweep of `_design-system/**` + `REMOVED.md`: **0 real phantoms.** All 20 raw regex hits
  are English prose ("a hard gate", "the ship gate", "an owner gate") or truncation artifacts of the
  matcher itself, not hook filenames. `mockup-depicts-gate` and `no-black-selected-gate.py`, the two
  hits that DO look like filenames, both exist on disk. Same verdict as 2026-07-18.

---

## 2026-08-01 weekly self-audit refresh (gather+record only, no chips)

Verified sources: the drift checker **re-run this pass** (first rerun since 2026-06-12; written to a
temp path, the committed `_drift-report.md` was left alone since this audit is read-only on product
files), `MOTION.md`, `TASTE_LOG.md`, `REMOVED.md`, and a direct grep sweep for half-built animation.

**Prior live items:** the 6 from 2026-07-11 are open for the FOURTH consecutive pass, and S1/S3-S7
above are unchanged. Not re-listed a fourth time. They need an owner approve-or-drop, not another
restatement , a suggestion that has sat unanswered for three weeks is not a backlog, it is noise in
the channel this file exists to keep clean.

**Drift, re-measured (the number moved, and it is the first real delta this file has had):**

| | 2026-06-12 report | 2026-08-01 rerun | delta |
|---|---|---|---|
| files scanned (strict) | 93 | 92 | -1 |
| HARD findings (A1-A6 / B1-B5) | 30 | **36** | **+6** |
| phase-1 INFO (A7-A11) | 1272 | **2123** | **+851** |

The hard total is dominated by two rules, and neither is a taste question:
- **A21 tracked-uppercase eyebrow x18.** Banned by copy-economy rule 5 (owner 2026-06-11). Nine of the
  18 are on ONE file, `app/[locale]/partner/page.tsx` (lines 45, 59, 96, 128, 161, 249, 284, 401, 496);
  the rest are `business/page.tsx:191`, `privacy/components/PrivacySidebar.tsx:97`,
  `terms/components/TermsSidebar.tsx:109`, `components-legacy/CityPage.tsx:114`, and 5 on the
  `dev/new-primitives` scratch route (not a customer surface, safe to ignore or delete).
- **C2 hardcoded solen.ch URL x13.**
- Plus A20 middle-dot separator x2, A1 hardcoded hex x1, A19 sub-12px text x1, B5 category branch x1.

The **+851 INFO** jump is the finding worth an owner decision: the A7-A11 typography-migration backlog
nearly doubled in seven weeks while the file count fell. New code is being written against the old type
conventions faster than the phase-2 sweep retires them. That is a trend, not a defect list.

**Suggestion (new, one only , the channel stays quiet while 6 items are unanswered):**

### 7. De-uppercase the partner landing page , [code] | effort S | no lock
`app/[locale]/partner/page.tsx` carries **9 of the 18** live tracked-uppercase eyebrows, the single
densest violation of a rule the owner set by name in 2026-06-11 copy-economy. One file, one mechanical
treatment (normal-case 13px semibold per the mockup banned-list), no taste question, and it removes
half the estate's A21 count. Supersedes live item 1 from 2026-07-11 ("Strip tracked-uppercase eyebrows
from the partner landing page"), which named the same file before the count was measured , fold the
two, do not carry both.

**MOTION.md:** still exactly 1 open leftover (`MOTION.md:92`, haptics). Confirmed still unbuilt:
`navigator.vibrate` has **0** occurrences across `app/`, `components/`, `components-legacy/`, `lib/`.

**Animation-leftover sweep , 0 real findings, and the raw greps LIE.** Scanning for the three leftover
shapes the owner named (a `transition` with no trigger, a framer import never rendered, `initial=`
without `animate=`) returns 7 and 10 file hits respectively, and **every one is a false positive**:
`components-legacy/ui/ExpandableTabs.tsx` matches on the comment "CSS transitions only , no
framer-motion", and all `/profile/settings/*` + `/profile/edit` hits are `SettingsForm`'s plain
`initial={{...}}` DATA prop, already annotated `mockup-ok: not framer-motion` at the callsite.
Recorded so the next pass does not re-find them and file six phantom suggestions.

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

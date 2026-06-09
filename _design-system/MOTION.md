# MOTION + the design-language pass (2026-06-09)

Source: two Tim Gabe videos the owner shared , **"4 levels of UI/UX design (and BIG mistakes to avoid)"** + **"The Secret Behind Weirdly Addictive Apps"** , plus owner calibration ("overmade the depths", "premium feel"). This doc is the durable record so it survives context compaction. Referenced from CLAUDE.md so it loads every session.

## The thesis (do NOT lose this)

**Premium = RESTRAINED statics + RICH motion.** Over-decorating (heavy shadows, too many effects) is "visual overworking" , the named mid-level mistake. Senior work strips embellishment and carries hierarchy through spacing + type. The premium / "addictive" feeling is bought with **motion + polish + emotional micro-moments**, NOT static effects. "Polish builds trust."

## What's DONE (committed)

- **Depth** , `shadow-float` softened from a wide float to a subtle lift; restraint rule in LOCKFILE §3.5. (commit 376ff19c5)
- **Typography** , 6-role core ramp codified in LOCKFILE §2 (Page 22 / Section 18 / Title 16 / Body 14 / Meta 13 / Label 12, nothing sub-12px); 3 sub-12px spots fixed. (commit dc0d0f848)
- **Color** (restrained, 80/17/3 holds) + **spacing** (8pt rhythm) measured on-principle , no change needed.
- **SuccessMark** celebration component + the booking-confirmed moment (see below).

## Motion principles (the "when to use")

- **Easings** (LOCKFILE/SOURCE §4: snap / spring / glide / thud) used purposefully on EVERY interaction , press feedback, transitions, sheet + overlay entrances , consistently, never ad-hoc.
- **Celebratory moments** on emotional peaks → use `<SuccessMark>`. The peak is booking-confirmed (done); also walk-in-joined, review-posted, package/gift bought, payment settled.
- **Haptics** on mobile where the platform allows (Android `navigator.vibrate`; iOS web is limited , use where real, never fake).
- **Restraint in motion too** , purposeful + quick (150-300ms), never gratuitous. Motion is the lever; it is not decoration.

## SuccessMark , the celebration component

- `app/[locale]/_components/primitives/SuccessMark.tsx` , solid green disc (`s-success` #16A34A) + white check, springs in (spring overshoot) with a ring pulse. Owner-approved look (dark-green fill + white check).
- Pair with the `.celebrate-rise` utility on the content that follows (staggered delays) for the full beat.
- Easings map to the §4 core tokens (NOT ad-hoc): disc pop = `spring` `cubic-bezier(0.34,1.56,0.64,1)` (bouncy reveal); text rise = `glide` `cubic-bezier(0.16,1,0.3,1)` (smooth, no overshoot , text must not bounce). Choreography: ring 0s → disc pop 0.07s → check draw 0.36s → title 0.46s → subtitle 0.56s → order hero 0.68s.
- `prefers-reduced-motion` safe (base state = final/visible; animations only add the entrance).
- Reuse on every success peak , do not re-build the animation per surface.

## DONE since (2026-06-09, the council + rollout run)

- **Council COLOR MODEL** codified (LOCKFILE §1.5.0): warmth + photography first, semantic for meaning, blue system-only + the one bare-manage-link carve-out. Resolves the "dead-grey ↔ too-much-blue" oscillation. Warm neutral tokens shipped app-wide (`s-bg.sunken` #F5F5F4→#F8F5F2, `s-border` #E0DDDB→#E8E4DF).
- **SENIOR_SCORECARD.md** ship-gate (5 dims) + drift rule **A19** (sub-12px, INFO until swept). Scorecard Color dim rewritten to fail BOTH dead-grey AND decorative-blue.
- **Confirmation** rebuilt to 5/5 (date is focal, code → footer, ink actions + the one blue manage-link, icon-only copy, "Kalender hinzufügen").
- **Back/Home nav**: one up-affordance (Back on deep pages, Home on top-level; Breadcrumb mobile-back removed). Header icons balanced to 22px.
- **Salon PDP** links inked (council model). **Homepage** type swept (sub-12px floored, 10→7 sizes).
- **SuccessMark** on the walk-in "joined the queue" peak (c9e405378).

## REMAINING WORK (the to-do , this is what must survive compaction)

- [x] **SuccessMark on the success peaks** — DONE: booking-confirmed, walk-in-joined, gift-card-sent, package-bought all use SuccessMark + staggered `.celebrate-rise` (commits c9e405378, f89587203). Payment-settled = the booking confirmation (done). Review form has no inline success state (it toasts/closes) — revisit only if a success screen is added.
- [x] **Booking step transition** — DONE: slide+fade on the §4 `glide` curve (V3-D464, 85f46a86c). The flow already had press-feedback (active:scale) + spring sheets.
- [ ] **Motion sweep**: purposeful transitions + press feedback across the key flows (booking steps, search, salon PDP) using the §4 easings consistently.
- [ ] **Haptics**: wire `navigator.vibrate` on key mobile taps (Buchen, confirm) where supported.
- [ ] **App-wide sub-12px sweep**: A19 flags ~840 instances beyond the homepage; floor them all, then flip A19 from INFO to a HARD drift gate.
- [ ] **Copy pass**: clarity + concision on the key customer surfaces (the video's "messaging" level , the one axis not yet audited).
- [ ] **Cleanup**: remove the throwaway `public/solen-*.html` + `public/_*.png` mockup artifacts. CAUTION: `solen-confirm-senior.html` + `solen-color-model.html` + `solen-nav-backhome.html` + `solen-home-type.html` are referenced by committed docs/commits as approved specs , re-point or note before deleting.

## Session mockups (reference, then delete)

`solen-depth-calibration.html`, `solen-type-system.html`, `solen-motion-booking.html`, `solen-salon-*.html`, plus the `_d-*.png` / `_m-*.png` / `_sp-*.png` captures. All throwaway , listed under Cleanup above.

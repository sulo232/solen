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

- `app/[locale]/_components/primitives/SuccessMark.tsx` , solid green disc + white check, springs in (spring overshoot) with a ring pulse. **Disc = normal green `s-success #16A34A`** (deep #15803D REVERTED 2026-06-10 / V3-D470 — owner: normal green; CANON §0.4). Code + doc agree, no token swap pending. The motion carries the confidence, not a darker hue.
- Pair with the `.celebrate-rise` utility on the content that follows (staggered delays) for the full beat.
- Easings map to the §4 core tokens (NOT ad-hoc): disc pop = `spring` `cubic-bezier(0.34,1.56,0.64,1)` (bouncy reveal); text rise = `glide` `cubic-bezier(0.16,1,0.3,1)` (smooth, no overshoot , text must not bounce). Choreography: ring 0s → disc pop 0.07s → check draw 0.36s → title 0.46s → subtitle 0.56s → order hero 0.68s.
- `prefers-reduced-motion` safe (base state = final/visible; animations only add the entrance).
- Reuse on every success peak , do not re-build the animation per surface.

## DONE since (2026-06-09, the council + rollout run)

- **Council COLOR MODEL** codified (LOCKFILE §1.5.0): warmth + photography first, semantic for meaning, blue system-only + the one bare-manage-link carve-out. **[SUPERSEDED by Design Language v2, 2026-06-09 (later same day): blue is now the GENEROUS interactivity colour — links, secondary/ghost buttons, active tabs, tappable affordances; OFF non-interactive text. AND the warm-neutral shift is REVERSED toward cool white-first surfaces (`s-bg.sunken` → #F4F4F5, `s-border` → #E4E4E7), no warm cream. See public/_mockups/design-language-v2.html + CANON §0.]**
- **SENIOR_SCORECARD.md** ship-gate (5 dims) + drift rule **A19** (sub-12px, INFO until swept). Scorecard Color dim rewritten to fail BOTH dead-grey AND vibrating-blue (blue on NON-interactive text). **v2 update (2026-06-09): blue ON interactive affordances — links/tabs/ghost buttons — is REQUIRED, not a fail.**
- **Confirmation** rebuilt to 5/5 (date is focal, code → footer, ink actions + the one blue manage-link, icon-only copy, "Kalender hinzufügen").
- **Back/Home nav**: one up-affordance (Back on deep pages, Home on top-level; Breadcrumb mobile-back removed). Header icons balanced to 22px.
- **Salon PDP** links inked (council model — REVERSED by v2: PDP links are now blue `s-accent #276EF1`). **Homepage** type swept (sub-12px floored, 10→7 sizes).
- **SuccessMark** on the walk-in "joined the queue" peak (c9e405378).

## REMAINING WORK (the to-do , this is what must survive compaction)

- [x] **SuccessMark on the success peaks** — DONE: booking-confirmed, walk-in-joined, gift-card-sent, package-bought all use SuccessMark + staggered `.celebrate-rise` (commits c9e405378, f89587203). Payment-settled = the booking confirmation (done). Review form has no inline success state (it toasts/closes) — revisit only if a success screen is added.
- [x] **Booking step transition** — DONE: slide+fade on the §4 `glide` curve (V3-D464, 85f46a86c). The flow already had press-feedback (active:scale) + spring sheets.
- [~] **Motion sweep**: PRESS FEEDBACK done (2026-06-09, f664744e7) — 18 customer-facing `active:scale` outliers aligned to the SOURCE §6 3-tier convention (CTA/card 0.97, row 0.98, icon-only 0.94). Dominant SalonCard was already canonical. TRANSITIONS: the app is already substantially animated (booking slide+fade V3-D464, SuccessMark peaks, 19 motion refs in SearchTemplate, entrance utilities `card-stagger-in`/`.animate-in`/`fade-in-up` defined in globals.css). Adding MORE entrance/transition motion is feel-dependent + gratuitousness-risky (e.g. re-staggering search results on every filter change reads as annoying), so it's gated on the owner's live-app feel: which moments read as static/janky → target those, rather than blanket-animate. Don't blind-add transitions. **OUTCOME (2026-06-09): tried a one-time `.animate-in` page entrance on the salon PDP content panel as a live demo — owner couldn't perceive it ("i dont understand it") → REVERTED. Lesson: a 500ms subtle fade-up entrance is below the owner's perception threshold; subtle motion nobody notices is pure risk for no payoff. Per Design Language v2 (owner 2026-06-09: "we also want more animations everywhere"), motion is RE-OPENED. Add: staggered rise-in on load (opacity 0→1 + ~10px rise, ~0.55s, staggered delays — the earlier subtle fade was too faint, make it PERCEPTIBLE: larger offset + clearer stagger), card hover-lift, blue-link hover-underline, button press-scale(.97), and the success ring-pulse + disc spring-pop + check stroke-draw (SuccessMark). Respect prefers-reduced-motion. The earlier "imperceptible fade" lesson means make entrances BIGGER, not skip them.**
- [ ] **Haptics**: wire `navigator.vibrate` on key mobile taps (Buchen, confirm) where supported.
- [x] **App-wide sub-12px sweep** — DONE (2026-06-09, commits e97d6906f + this one). Floored all 826 `text-[Npx]` (N<12) -> `text-[12px]` across 206 files (scoped strictly to font-size classes, not w/h/gap/leading/color). Verified: tsc clean, homepage + salon PDP render clean at 375px with 0 overflow, small labels more legible. Then flipped **A19 INFO->HARD** (sub-12px) AND **A20 INFO->HARD** (middle-dot separator). A20's regex was refined to `\s·|·\s` so it flags real separators but exempts the lone `"·"` fallback avatar-initial glyph (Header/profile/salonInitials = content, not a separator). Drift checker: strict hard 0 in 102 files, 0 HARD A19/A20. NOTE: dense internal dashboards were mechanically floored + tsc-clean but not individually eyeballed — recommend a quick dashboard visual glance.
- [x] **Copy pass** — DONE (audited 2026-06-09). Customer copy is already tight: the confirmation's actual offenders were fixed earlier this session (`Zum Kalender hinzufügen`→`Kalender hinzufügen`, icon-only copy). A full i18n audit surfaced only 11 "verbose" candidates, and call-site investigation cleared all of them: the `Bitte wähle … aus` strings are `setError()` validation messages (polite error voice is *correct* there, not filler), `Jetzt bezahlen`/`Jetzt anstellen` are intentional payment/queue urgency, `Zur Zahlung` is a directional CTA, `Bitte wählen` is the conventional dropdown placeholder. Nothing safe to blind-change. The codified copy-economy rule (LOCKFILE) governs new copy going forward. LESSON: the same German string can be correct copy or filler depending on call-site (validation vs button) , never blanket-sweep copy.
- [x] **Cleanup** — DONE (commit dbb9be0e0). Pruned ~300 throwaway `public/solen-*.html` + `public/_*.png` artifacts; kept the 26 referenced by living docs (incl. `solen-confirm-senior` / `solen-color-model` / `solen-nav-backhome` / `solen-home-type` , the approved specs). Doc-reference scan ran before deletion.

## Session mockups (reference, then delete)

`solen-depth-calibration.html`, `solen-type-system.html`, `solen-motion-booking.html`, `solen-salon-*.html`, plus the `_d-*.png` / `_m-*.png` / `_sp-*.png` captures. All throwaway , listed under Cleanup above.

## Motion sheet 22 — THE LOCKED MICRO-MOMENT VOCABULARY (owner-approved 2026-06-12)

**Every future build uses these. Not optional, not per-surface taste.** Utilities live in
globals.css (motion sheet 22 block); all reduced-motion safe. The rule per situation:

| Situation | The ONE pattern | Utility / wiring |
|---|---|---|
| Anything loading | skeleton SHIMMER, content-shaped (LoadingStates.md) — spinners only INSIDE buttons | `.sk`-style shimmer per grammar |
| Any close/X | press-collapse, icon tier | inherited from Sheet/Modal primitives (`active:scale-[0.94]`), X size 20 in 44px hit area |
| Any press | CTA/card 0.97 · row 0.98 · icon 0.94 | `active:scale-[…]` 3-tier |
| Count/badge changes | spring bump | `key={count}` + `.animate-count-bump` |
| Money value changes | roll/odometer tick | `key={value}` + `.animate-value-roll` |
| Choice reveals a set (slots, options) | cascade in | container `.slot-cascade`, re-mount with key |
| Live position/number updates | departure-board flip | `key={n}` + `.animate-num-flip` |
| Live status dot (REAL state only) | ping | `animate-ping` twin dot (StatusPill pattern) |
| Saving/favoriting | pop + 6-particle burst | HeartButton pattern (`.heart-burst` ×6, keyed) |
| Adding to a cart | fly-dot to the cart anchor | `.cart-fly-dot` + `[data-cart-anchor]` (ServicesStaffStep pattern) |
| Success peak | SuccessMark + `.celebrate-rise` staggers | never a static check |
| List first-load | stagger rise-in | `.salon-card-stagger` |
| People/avatars first in view | wave hello once | `.team-wave` + IntersectionObserver (SalonTeam pattern) |
| Empty-state icon | breathe | `.animate-breathe` |
| Toasts | tilt-settle enter | Toast primitive owns it |
| Earned moment without a client event (e.g. stamp) | DO NOT fake on load | wire `.animate-stamp-slam` only behind a real "just earned" signal |

**Icon canon (same date, owner picks):** Lucide ONLY · back = ArrowLeft (never ChevronLeft) ·
share = Share · check = bare Check · error = AlertCircle · hero/frosted icon-buttons stroke 2.1 ·
sheet-header X = 20 · empty star = s-border · meta icons = 13 · stars `fill-s-star`, hearts #FF3366.

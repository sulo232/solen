# SUGGESTIONS.md , live design-improvement suggestions (design-suggest contract)

<!-- exists-check: net-new file created by the design-suggest system 2026-07-10 (its SKILL.md names this path as its output); extends, not duplicates, FRONTEND_AUDIT_2026-07-08.md (that = found DEBT vs current law; this = forward DIRECTIONS + the owner's new lenses). Max ~7 live entries; approved/rejected entries move to the log at the bottom. -->

> How this works: each entry is a suggestion, not a decision. Approve by clicking its chip (or
> saying its number). [mockup] = you see it before it ships; [behavior] = interaction change;
> [code] = already covered by locked law, no taste question. LOCK flags mean approving also
> unlocks a frozen row , called out explicitly.

## S1. Motion modernization sweep , [code], the recipe is already law | effort L | TOP PICK
94 of 135 animated sites still run single-property animations (opacity-only / slide-only) from
two pre-recipe sources; only booking uses the locked blur+scale+opacity recipe. The booking
CONFIRMATION (the peak-end moment) and every homepage row are legacy; route transitions are dead
code. Plan + full file:line inventory: research/MOTION_MODERNIZATION_2026-07-10.md , demo of 3
surfaces first (video), then 2 systemic fixes cover most of the 94.

## S3. Chrome subtraction bundle , [behavior][mockup] | effort M-L | LOCK flags
(a) Header hides on scroll-down / reveals on scroll-up (unlocks LOCKFILE section 7 sticky row);
(b) CityTopBar folds into the Header as an inline location pill (removes a 52px band, unlocks
its section 7 row); (c) sticky book bar condenses to a pill past the hero, re-expands on
scroll-up (no lock). Net effect: up to 131px of permanent chrome becomes content space , the
single most "modern app" move available. One mockup shows all three together.

## S4. Booking step-swap gains direction , [behavior] | effort S | LOCK flag (MOTION.md values)
Forward slides content 24px left, back mirrors , wayfinding the graveyarded progress-stepper
used to provide, done by motion instead of chrome.

## S5. Skeleton-to-content uses the enter recipe , [behavior] | effort S | no lock
Loaded content mounts via blur+scale+opacity instead of the hard cut. Fills the one gap in the
locked loading law (shimmer is specified, the handoff is not).

## S6. Subtraction pair , [code][remove] | effort S | no lock
(a) category chip off cards on single-category pages (the URL/H1 already says it, taste rule 4);
(b) finish the border+shadow double-chrome sweep (ProgressiveFilter, DiscoveryEmptyState still
pair hairline + elevation , the exact "dated tell" LOCKFILE names).

## S7. Homepage sections cascade on scroll-into-view , [mockup] | effort M | no lock
The existing stagger recipe fires per-section via IntersectionObserver (once), not just on mount
, sections below the fold currently appear inert.

---
Parked (not suggested , owner rejected the shape before or lock says no): eyebrow-drop-default
(narrows a deliberate carve-out , resurface only if S3 lands), radius-token collapse (L effort,
low visible payoff , resurface with the next tailwind.config touch).

## Log
- 2026-07-10 scroll-pill (owner-confirmed element from the X ref) PARKED after seeing the checkout mockup: "meh idk abt putting ths in booking but maybe in store pages but acc think but park ths for now". Mockup stays at public/_mockups/checkout-scroll-pill.html for reference; candidate surface when revisited: salon/store pages. Nothing builds until the owner reopens it.
- 2026-07-10 S2 (Go-with card adaptation) REJECTED by owner: 'not at all what i mentioned'. Mockup deleted + graveyarded. The reference interest is being re-scoped by direct owner question (which element of x-scrollpill-ref.mp4 they actually liked); nothing rebuilds until that answer exists (ask-first gate added same day).
(approvals/rejections land here with dates)

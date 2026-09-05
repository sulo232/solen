<!-- exists-check: `npm run exists "21st.dev"` returned 0 matches before this file was written
     (only prior hit anywhere in the repo is TASTE_LOG.md's 2026-09-05 entry naming this exact
     filename as planned, alongside the sibling `airbnb--motion.md`, same session). Net-new,
     no duplicate. Nothing here lands in real code; mockup-first still binds per CLAUDE.md, and
     no source is ported until its license is confirmed (see LICENSE STATUS below). -->

# 21st.dev motion kit (booking-flow candidates)

REF: 21st.dev / public component gallery / motion-only / fresh Playwright captures, 2026-09-05

## Scope note

The 21st.dev MCP was not connected this session (missing API key), so this is a plain Playwright
capture of the public site, same discipline as the Airbnb capture: every timing is read from a
recorded video's `document.getAnimations()` dump or from live `getComputedStyle` transition
values, never eyeballed from a screenshot. Raw captures under
`public/_pixel-refs/21st-dev/` (gitignored scratch).

## A site mechanic that matters for anyone repeating this capture

21st.dev renders every live component demo inside a **sandboxed iframe**
(`https://cdn.21st.dev/bundled/<id>.html`), not in the top-level page. A `document.getAnimations()`
call against the top page returns nothing useful; you have to enumerate `page.frames()`, filter
for `cdn.21st.dev/bundled/`, and run the query against that frame. This cost real time to
discover this session (first two capture attempts silently returned 0 animations against the
wrong document) and will cost the same time again for the next person unless it is written down
here.

## LICENSE STATUS, read before porting anything

21st.dev's own page for a component does **not** show an explicit license badge in its UI (no
SPDX tag was visible on any page captured this session). For the three components below, license
is inferred from the UPSTREAM open-source project each one wraps, not from 21st.dev itself:
shadcn/ui, Vaul, and Sonner are all independently well-known MIT-licensed projects. This is
**expect**, not **verified**: I did not fetch each project's LICENSE file this session to
re-confirm. Treat it as "very likely MIT, worth a five-second confirmation before shipping",
not as a cleared fact.

Separately: 21st.dev gates the FULL primitive source (`Component.tsx`) behind a sign-in +
"unlock" paywall for at least the official shadcn Button entry ("Component source is locked...
Members get unlimited access; free accounts get a few unlocks each day"). No account was created
and no credentials were entered (both prohibited). The `Usage.tsx` demo snippets (how to call the
component) were visible without unlocking and are saved below; the underlying primitive
implementation (`button.tsx`'s actual class string) was NOT captured from 21st.dev this session.
For Button specifically, the primitive is trivially available from shadcn/ui's own public GitHub
repo (a separate, unlocked, MIT source) rather than through 21st.dev's gate, but that fetch was
not performed this session either, given the time budget. **Nothing from the locked Button page
is saved as source; only its measured behavior (there was none capturable, see below) would have
been ported, and none was found.**

## Sources captured this session

| component | 21st.dev URL | saved to |
|---|---|---|
| shadcn Button | `21st.dev/@shadcn/components/button` | `02-shadcn-button.json`, `.png`, `02-shadcn-button-code.txt` (Usage.tsx snippets only, source locked) |
| shadcn Drawer (Vaul) | `21st.dev/@shadcn/components/drawer` | `04-drawer-open/` (video + animations.json + screenshots) |
| shadcn Tabs | `21st.dev/@shadcn/components/tabs` | inline computed-style capture (not saved as a folder, see Measured) |
| shadcn Sonner (toast) | `21st.dev/@shadcn/components/sonner` | `06-sonner-toast/` (video + animations.json + screenshots) |

Four components were captured with real timing (Drawer, Tabs, Sonner, plus Button's static
recipe list). This is short of the 6-10 asked for; the remainder (a step-to-step page transition,
a pill/segmented-control select distinct from Tabs, a card-tap, a dedicated success/confirmation
checkmark) were located in the search results (see Candidate list below for named examples) but
not individually captured this pass, given the ~25-minute budget was already spent getting past
the cookie/translation dialogs and the iframe discovery on the Airbnb half of this task. Named
below as NOT CAPTURED rather than silently dropped.

## Measured

### Drawer (Vaul, via shadcn/ui), bottom-sheet open

Component: `@shadcn/components/drawer`, "Move Goal" stepper demo. Clicking "Open Drawer" slides a
bottom sheet up from beneath the viewport.

- `getComputedStyle` on the drawer content element, read mid-transition (at ~200ms into the
  gesture) and after settling: `transitionProperty: transform`, **`transitionDuration: 0.5s`**,
  **`transitionTimingFunction: cubic-bezier(0.32, 0.72, 0, 1)`**. Identical before and after
  settle, so this is the drawer's one full-open transition, not two different phases.
  **verified**
- This curve, `cubic-bezier(0.32, 0.72, 0, 1)`, is Vaul's own named "spring-like" easing (a fast
  start with a long, soft deceleration and no overshoot) and is DIFFERENT from all four of
  Solen's locked tokens. It reads closer to `glide` (decelerate, no bounce) than to `spring`
  (which does overshoot) but is not a numeric match to either.
- Uses `transform: translateY(...)` exclusively; no opacity or blur change was present in the
  computed style read. **verified** (this is a direct contradiction of Solen's ENTER RECIPE if
  applied as-is; see Port map).
- Depends on: **Vaul** (a standalone drag/spring library, not Framer Motion). Solen already
  depends on framer-motion; adding Vaul would be a new dependency, not a drop-in.

### Tabs (shadcn/ui, built on Radix + Tailwind defaults)

Component: `@shadcn/components/tabs`, "Account / Password" demo.

- Tab triggers: `transitionProperty: all`, **`transitionDuration: 0.15s`**,
  **`transitionTimingFunction: cubic-bezier(0.4, 0, 0.2, 1)`**. **verified**
- The "Save changes" button inside the same demo: `transitionProperty: color, background-color,
  border-color, text-decoration-color, fill, stroke`, same **0.15s** /
  **`cubic-bezier(0.4, 0, 0.2, 1)`**. **verified**
- This curve is Tailwind's own default `transition` utility easing, and it is a byte-for-byte
  numeric match to Solen's locked `snap` token, `cubic-bezier(0.4, 0, 0.2, 1)`
  (`_design-system/LOCKFILE.md` §4). This is the cleanest direct confirmation in this whole
  capture: an unrelated, independently-built component library converges on the exact same
  curve Solen already uses for "an in-place state flip: tab switch, chip select, filter change"
  (THE SPEED LAW's own example list). Duration also matches Solen's "snap" tier (150ms) exactly.

### Sonner (toast), by the same author as Vaul

Component: `@shadcn/components/sonner`, "Success Toast" demo.

- Toast element (`li[data-sonner-toast]`), read ~150ms after the trigger click:
  `transitionProperty: transform, opacity, height, box-shadow`,
  **`transitionDuration: 0.4s, 0.4s, 0.4s, 0.2s`** (three properties share 400ms, box-shadow
  runs faster at 200ms), **`transitionTimingFunction: ease`** (the CSS keyword, which resolves to
  `cubic-bezier(0.25, 0.1, 0.25, 1)`) on all four. **verified**
- This is the one component captured this session that DOES combine transform + opacity in a
  single entrance (height is also animated, which Solen's SPEED LAW explicitly bans: "Never
  animate width, height or top... so nothing reflows mid-motion"). No blur.

### Button (shadcn/ui), press/variant recipe

Component source locked (see LICENSE STATUS), so no computed press-transform value could be read
directly from a real rendered instance behind the lock. The `Usage.tsx` snippets show variant
names (`default`, `secondary`, `destructive`, `outline`, `ghost`, `link`) and a `Loader2
className="animate-spin"` loading pattern, but carry no timing values themselves (spin duration
is Tailwind's default `animate-spin`, 1s linear infinite, a Tailwind-framework constant rather
than a shadcn choice). **Nothing measured here; recipe names only, tagged assume for any timing.**

## NOT CAPTURED this session (named, not silently dropped)

- **A step-to-step page transition demo.** Search results surfaced candidates
  (`@arihantcodes_1f7b8c4d/components/animated-drawer`, various "page transition" and stepper
  entries) but none were opened and timed given the budget.
- **A dedicated success/confirmation checkmark animation**, distinct from the toast. The search
  `21st.dev/community/components/s/success-checkmark` surfaced
  `@shugar/components/toast/success` and `@serafimcloud/components/alert/success-alert` as named
  candidates, neither captured.
- **A card-tap / hover-lift component** distinct from Airbnb's own (covered in the sibling file).
- **A number ticker / odometer** for a live price or count, relevant to Solen's existing
  `.animate-value-roll` pattern (`MOTION.md`'s Motion sheet 22). Not searched this session.

## Port map onto Motion-22

| 21st.dev pattern | duration | curve | closest Solen token | fit |
|---|---|---|---|---|
| Tabs in-place select | 150ms | `cubic-bezier(0.4,0,0.2,1)` | `snap` | **Exact match**, both curve and duration. Strongest finding in this file. |
| Vaul drawer open | 500ms | `cubic-bezier(0.32,0.72,0,1)` | `glide` (closest by shape) | **No token match.** A genuinely different, named curve; porting it as-is would add a fifth easing value to a locked four-token system. |
| Sonner toast enter | 400ms (+ 200ms box-shadow) | `ease` = `cubic-bezier(0.25,0.1,0.25,1)` | `glide` (closest by shape) | **Close but not exact.** Also violates the "never animate height" rule (Sonner does). Solen's own Toast primitive already exists and is locked to a different recipe (LOCKFILE: "Toast/chips: slide-up + settle, §4 glide"); Sonner is evidence for the general shape, not a replacement. |
| Button variants/loading spinner | n/a (locked source) | n/a | n/a | **Nothing portable.** Names only. |

**Does the ENTER RECIPE hold?** No. Of the two entrances with confirmed keyframe/property data
(Vaul drawer: transform only, no opacity/blur; Sonner toast: transform+opacity+height, no blur),
NEITHER matches Solen's locked 3-property opacity+scale+blur recipe. This is not a reason to
change Solen's recipe (that decision is owner-locked, 2026-07-09, and grounded in a specific
perceptibility finding, see `MOTION.md`), but it means neither component can be ported as a
drop-in "enter" implementation without first re-authoring its entrance to the Solen recipe.

## Conflicts

- **CONFLICT [motion]: Sonner animates `height`.** Solen's SPEED LAW hard rule #2 says "Never
  animate width, height or top" specifically so nothing reflows mid-motion. Sonner's toast does
  exactly this (to accordion open/closed as toasts stack). If Sonner's visual result is wanted,
  the height-animation part must be re-implemented against Solen's own rule (e.g. animate
  `max-height` with `overflow:hidden` composited off the main thread, or use a wrapping element
  sized by transform/scale instead), not copied as-is.
- **CONFLICT [motion]: Vaul's curve is a fifth value.** `cubic-bezier(0.32,0.72,0,1)` is not one
  of Solen's four locked tokens and does not numerically equal any of them. Adopting Vaul's exact
  feel for a Solen bottom sheet means either accepting a new named token (owner call) or accepting
  a visibly different settle shape by substituting `glide`.
- **No graveyard hits.** `_design-system/REMOVED.md` grep for "motion|bounce|wave|jump" turned up
  nothing relevant to Tabs, Drawer, Sonner, or Button; none of the killed patterns (SalonTeam
  wave-hello, sticky-bar snap-jump) resemble anything captured here.

## CANDIDATE LIST, motion moves for the Solen booking flow

Eight moves, each with its measured source, its timing, and the Solen token/primitive it maps to.
Ordered roughly by how directly portable each one is (most confident first).

1. **In-place option/pill select** (service duration pill, staff pill, time-slot chip).
   Source: 21st.dev Tabs, verified 150ms `cubic-bezier(0.4,0,0.2,1)`. Maps to: Solen's `snap`
   token, EXACT existing match, already the locked answer for "Select toggle / scrim swap" and
   "TabPill active swap" per LOCKFILE. No change needed, just confirmation this is the right
   choice.
2. **Press/tap feedback on the CTA and cards** (Weiter, Buchen, service rows).
   Source: Airbnb live listing page, verified `transform` 100ms `cubic-bezier(0.2,0,0,1)` for
   small controls, 250ms same curve for larger ones. Maps to: Solen's existing 3-tier
   `active:scale-[…]` ladder (0.94/0.97/0.98) stays as-is (already locked, already measured at
   1.1-1.6px edge movement per MOTION.md); Airbnb's curve differs (decelerate vs Solen's `thud`
   accelerate) and that divergence is a CONFLICT already logged in the sibling Airbnb file, not a
   new adoption.
3. **Step-to-step transition, strategy A: slide stack.** Not captured live this session (no
   step-to-step demo was opened on 21st.dev), but this is Solen's OWN existing shipped pattern:
   `useStepSwapMotion` (`app/[locale]/_components/primitives/motion.ts`), opacity+scale(0.99),
   260ms, `glide` enter / `thud` exit (split per motion-02's fix). Listed here as the baseline
   strategy against which the two alternatives below should be judged, since the brief asks for
   three genuinely different strategies.
4. **Step-to-step transition, strategy B: fade + scale (no horizontal travel).** Source: Solen's
   own ENTER RECIPE itself (opacity 0->1, scale 0.96->1, blur 8px->0, 280ms `glide`,
   owner-locked 2026-07-09). Distinct from strategy A by having NO x-axis slide at all, just a
   material resolving in place. Already exists as `useEnterMotion()`; applying it to a step
   change (rather than a card entrance) would be new usage of an existing primitive, not new
   code.
5. **Step-to-step transition, strategy C: shared summary bar that persists.** Not sourced from
   either capture this session (neither Airbnb nor 21st.dev demonstrated a persistent bar across
   route-like steps in what was captured). This is closest to Solen's OWN existing booking
   running-summary bar (`RESTRAINT_TEST.md`, cited in CLAUDE.md's sticky-CTA row) and the PDP's
   `SalonMobileBookBar`. Flagging as: the "third strategy" the brief asks for is really "use the
   persistent-bar pattern Solen already ships elsewhere, for the step content instead of just the
   CTA", not a new import. Needs a mockup, not a code change, before anything ships (mockup-first
   law).
6. **Bottom sheet open/close** (a service picker sheet, a filter sheet).
   Source: 21st.dev Vaul drawer, verified 500ms `cubic-bezier(0.32,0.72,0,1)`, transform only.
   Maps to: Solen's existing Sheet primitive already runs "300ms glide" per LOCKFILE §16 (close:
   `translateY(10px) scale(.965)` + blur + brightness dim, 320ms glide). Vaul's number is close in
   spirit but 200ms slower and on a different curve; NOT recommending a swap, just confirming
   Solen's own sheet law is already in a similar family. If a gesture-driven variant is wanted
   (drag-to-dismiss), LOCKFILE §16.5 already has house spring values for that, which is the
   correct source over Vaul's fixed CSS transition (Vaul only replicates the release feel via a
   real drag library; Solen's own §16.5 gesture-physics section already specifies this).
7. **Success / confirmation moment** (booking confirmed).
   Source: NOT independently captured this session (the dedicated checkmark search wasn't opened
   past the results list). Solen already has this LOCKED and BUILT: `<SuccessMark>`
   (`MOTION.md`), disc pop `spring` bezier, check-draw, staggered `.celebrate-rise` text. No
   candidate from either reference beats what already ships; this row exists only to confirm
   nothing external was found that argues for changing it.
8. **Toast / inline confirmation** (e.g. "Added to favorites", a save confirmation).
   Source: 21st.dev Sonner, verified 400ms `ease` transform+opacity(+height, banned property).
   Maps to: Solen's existing Toast primitive (already locked to slide-up + settle, `glide`).
   Sonner corroborates the general SHAPE (transform+opacity together, ~400ms) but its height
   animation must NOT be copied (see Conflicts). Net effect: no change recommended, Solen's own
   Toast already sits in the right neighborhood.

**Summary read for the owner's stated want ("more motion when I click stuff, between stuff"):**
the two references converge on validating Solen's EXISTING locked primitives (snap for pills,
the 3-tier press ladder, the ENTER RECIPE, the Toast and Sheet primitives, SuccessMark) rather
than surfacing a wholesale new vocabulary to import. The two genuinely new, evidence-backed ideas
worth a mockup are: (a) using the fade+scale ENTER RECIPE for step changes as a DISTINCT
alternative to the existing slide-stack step-swap (candidates 3 vs 4 above, a real strategy
choice), and (b) extending the persistent summary-bar pattern Solen already ships on the PDP and
booking CTA into the step CONTENT itself, not just the commit button (candidate 5). Both need
mockups before code, per CLAUDE.md's mockup-first law.

<!-- D1, audit 4 of the motion sweep: the marketing, content, legal and auth surfaces, never audited
     before. Same constraint as the other three: "dont invent unnececary stuff like based on principle
     we made". Every row traces to THE SPEED LAW (MOTION.md), a numbered finding in
     research/TASTE_MOTION.md, or a locked row of the CLAUDE.md design contract. Where no rule reaches
     a case the verdict is NO RULE COVERS THIS, never a guess. "No motion needed" is a verdict, not a
     gap: TASTE_MOTION findings 8, 12 and 13 make motion on a reading surface a measured harm. -->
# Motion audit 4: marketing, content, legal, auth

## Summary

**133 interactive or animated elements across 23 routes and 14 supporting components.** The headline is
not a new pattern, it is a **scoping error in audit 2**: `HOME_SEARCH_INSPO.md` filed
`BentoBusiness.tsx` under "Not mounted, so not counted" because `app/[locale]/page.tsx:56` has its
import commented out. BentoBusiness is mounted on **`/business` (page.tsx:272) and `/fuer-salons`
(page.tsx:289)**, both in this scope. Its `animate-ping`, its three `animate-pulse` typing dots, its
0.2s crossfade, its 0.4s spring and its 200ms tab chip are therefore **live defects on two shipped
routes**, not latent ones, and it carries three more that audit 2 did not reach: an infinite
JS-timer `<Typewriter>` loop, a bar chart that animates `height`, and an `AnimatePresence mode="wait"`.

The second theme is that marketing is where the press tier is worst. RANK 2 reports ~100 press rows
across the product; this scope adds **31 more**, and not one pressable element in the entire scope
presses at 80-100ms. The B2B pages sit at 200ms, /partner at 150ms and 300ms, auth at 150ms.

The third theme is the one this scope was expected to raise and it resolves **in the product's
favour**: marketing legitimately earns motion the product would not, and this codebase has almost
none of the decorative-scroll-reveal kind. `/business`, `/fuer-salons`, `/partner`, `/help`,
`/kontakt`, `/ueber-uns`, `/impressum`, `/blog`, `/karriere` and both legal pages carry **zero
scroll-triggered reveals**. The one component that claims one (`BentoCard.tsx`, docstring line 17:
"Scroll-triggered entrance") does not implement it: it uses `initial`/`animate`, not `whileInView`,
so all four cards animate on mount whether or not they are on screen. The decoration that does exist
is the bento's ambient loops, and those are an accessibility problem, not a taste one.

**`.animate-marquee` and `.testimonial-scroll` are both DEAD.** Neither has a single call site
anywhere in the repository, in this scope or outside it. `.animate-marquee` (globals.css:506) is
referenced only by three prose comments in `Entdecken.tsx`; `.testimonial-scroll` (globals.css:994)
is referenced by nothing at all. Neither is a live WCAG 2.2.2 failure today. `.testimonial-scroll`
remains the worse of the two on paper, because its only stop mechanism is `:hover`, which does not
exist on touch, so mounting it would be an unconditional Level A failure. Recorded so the next
audit does not have to re-derive it.

`components/ui/animated-testimonials.tsx` is likewise **not mounted**: its only consumer is
`ArtistOfTheMonth.tsx`, which `app/[locale]/page.tsx:52` removed from the page composition at V3-D104.
Its 10-second `setInterval` autoplay is audited below as latent, uncounted.

### Counts

| verdict | rows | note |
|---|---|---|
| **OK** | 47 | includes 11 whole files where "no motion" is the correct answer |
| **WRONG-TIER** | 46 | 31 press, 15 in-place/reveal |
| **MISSING** | 22 | pressable with no press feedback at all |
| **WCAG-2.2.2** | 9 | 6 unconditional, 3 conditional on a slow endpoint |
| **RULE-2** (never animate width/height/top) | 4 | 3 of them net-new shapes |
| **RULE-4** (interruptible) | 2 | `mode="wait"`, the BookingWizard shape |
| **NO RULE COVERS THIS** | 3 | non-gesture springs, a 3D hover tilt, a forced 2.5s redirect |
| **total** | **133** | |

RULE-4 is a token I added for THE SPEED LAW hard rule 4, which the brief's verdict vocabulary has no
slot for. It is a stated rule, not an invention; RANKED RANK 5 already reports the same shape at
`BookingWizard.tsx:213`.

Three dead-transition bugs are recorded inline rather than as their own verdict: a transition that
names a property the code never changes does nothing at all, which is the silent-no-op class the
project CLAUDE.md warns about, arriving in CSS instead of PostgREST.

---

## Scope and exclusions

**Audited routes:** `/business`, `/fuer-salons` (incl. `?v=2`), `/partner`, `/brand/[slug]`, `/blog`,
`/help`, `/help/[slug]`, `/behandlungen/[...slug]`, `/karriere`, `/kontakt`, `/ueber-uns`,
`/coming-soon`, `/agb`, `/impressum`, `/legal/privacy`, `/legal/terms`, `/datenschutz`, `/auth/login`,
`/auth/register`, `/auth/reset-password`, `/auth/signup`.

**Supporting components read in full:** `business/Step.tsx`, `business/FAQItem.tsx`,
`business/MarketplaceVisual.tsx`, `business/BentoCard.tsx`, `homepage/BentoBusiness.tsx`,
`components/ui/typewriter.tsx`, `components/ui/animated-testimonials.tsx`,
`components/core/morphing-dialog.tsx`, `components-legacy/ui/interactive-hover-button.tsx`,
`components-legacy/partner/PartnerSignupForm.tsx`, `components-legacy/auth/SignIn.tsx`,
`components-legacy/ui/Spinner.tsx`, `components-legacy/ui/EmptyState.tsx`,
`components-legacy/ui/CategoryTree.tsx`, `components-legacy/ui/QuickPreviewSheet.tsx`,
`lib/animations.ts`.

**Excluded as already audited elsewhere, not re-reported:** `Header`, `Footer`, `MobileMenu`,
`CookieConsent`, `Toast`, `Skeleton`, `SkeletonCard`, `globals.css` and `tailwind.config.js`
(PRIMITIVES_SHARED.md); `SalonCard`, `SearchAutocomplete`, `SearchBar`, `FilterBar`/`FilterDrawer`
(HOME_SEARCH_INSPO.md). Where one of those renders inside a scope route it appears as a single
cross-reference row, not a re-audit.

**Dead code, stated not counted:** `app/[locale]/behandlungen/[...slug]/TreatmentsClient.tsx` is a
227-line near-duplicate of `page.tsx` in the same folder and is imported by nothing. `/agb`,
`/datenschutz` and `/auth/signup` are three-line `redirect()` stubs with no DOM.

**One thing this audit could not verify in a browser and therefore does not assert:** see the open
question at the end about `BentoCard`'s hover tilt under `prefers-reduced-motion`.

---

## Where marketing legitimately earns motion, and where it does not

The brief asked for this honestly, so here it is with the citation attached.

**What earns it.** `TASTE_MOTION` finding 6 (Bederson & Boltman 1999, p = .001) supports motion that
helps a user reconstruct where things are, and finding 12 (Tversky et al. 2002) blesses "real-time
changes and reorientations in time and space" by the authors' own words. The `JoinUsCard`
MorphingDialog is exactly that: a card in normal flow morphs into a portalled modal via a shared
`layoutId`. A cut there would lose the object identity. That motion is correct on both pages and its
400ms is defensible because the thing it moves is effectively full-screen, which is the one carve-out
THE SPEED LAW grants above 300ms. Same for `/coming-soon`'s 500ms page entrance: the animated element
IS the whole screen.

**What does not.** Everything ambient in `BentoBusiness`. The ping dot, the three pulsing typing dots
and the looping typewriter are illustrative chrome on a page whose job is to get a salon owner into a
signup form. Finding 8 (Pratt et al. 2010, plus NN/g's design consequence, verbatim: "it's hard to
stop attending to it, and, if irrelevant to the task at hand, it can substantially degrade the user
experience") makes them a cost paid against the CTA, and finding 14 makes them a Level A exposure.
A landing page being a landing page does not buy an exemption from either. Marketing bends the
restraint rule; it does not bend WCAG.

**And the one that is measured against itself.** `animated-testimonials.tsx`'s 10-second autoplay is
covered by finding 13 (Brehmer et al. 2019, 96 participants, up to 2.8x slower), whose Solen
recommendation row reads "Never replace a scannable set with a timed sequence. No auto-advancing PDP
gallery, no auto-rotating home carousel." It is unmounted, which is the correct state.

---

## Rows

Format: `file:line` · element · its JOB · the tier THE SPEED LAW assigns · what the code does TODAY
(real class string, or "none") · verdict. A bare `transition-*` with no duration is the CSS default
150ms, which is the snap tier, and is scored OK.

### `/business` , `app/[locale]/business/page.tsx`

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `business/page.tsx:204` | hero primary CTA "Jetzt anmelden" | press acknowledgement + hover lift | press 80-100 | `transition-all duration-200 ease-glide hover:-translate-y-[1px] hover:shadow-elevation-3 active:scale-[0.97]` | **WRONG-TIER** , press runs at 200ms. Another instance of RANK 2, and the exact inheritance mechanism RANK 2 names: `active:scale` shares a class with the colour/shadow transition and silently takes its duration. `transition-all` also transitions `box-shadow`, which TASTE_MOTION finding 25 says never to animate. |
| `business/page.tsx:211` | hero secondary CTA "Wie es funktioniert" | press acknowledgement | press 80-100 | `transition-all duration-200 ease-glide hover:bg-white/10 active:scale-[0.97]` | **WRONG-TIER** , 200ms press. Another instance of RANK 2. |
| `business/page.tsx:291` | "So findest du Solen-Kund:innen" link | hover colour step | snap 150 | `transition-colors duration-150 ease-glide hover:text-s-accent-deep` | **OK** |
| `business/Step.tsx:29` | the three "01/02/03" step cards | static content, non-interactive | none | none | **OK** , the docstring's "no client-side state or motion" is accurate. Motion here would be decoration (finding 12: never justify motion as comprehension aid). |
| `business/FAQItem.tsx:34` | `<summary>` FAQ disclosure | press acknowledgement on a tap target | press 80-100 | `cursor-pointer`, no `active:` anything | **MISSING** , the single most-tapped control in the FAQ section has no press feedback. |
| `business/FAQItem.tsx:40` | chevron rotate on open | in-place state flip | snap 150 | `transition-transform duration-200 ease-glide group-open:rotate-180` | **WRONG-TIER** , 200ms. Another instance of RANK 5's de-facto fourth tier. |
| `business/FAQItem.tsx:43` | answer reveal | disclosure of adjacent content | reveal 250-300, or none | instant, no transition (documented choice, lines 15-17) | **OK** , an instant reveal is the correct restraint call and the file says so. Contrast with `/partner:436`, which tries to animate the same thing and fails. |
| `business/MarketplaceVisual.tsx:82-108` | 3-card perspective stack | decorative illustration, `aria-hidden` | none | static CSS transforms, no animation | **OK** |
| `business/page.tsx:313-341` | pricing card + check list | static | none | none | **OK** |
| `business/page.tsx:234` | trust-strip separator dot | decoration | none | none | **OK** (motion); the dot itself is a taste-rule-2 question, out of this audit's scope |

### `BentoBusiness` , LIVE on `/business:272` and `/fuer-salons:289`

Audit 2 recorded rows `:96`, `:160-168`, `:379`, `:409` and `:482` under "Not mounted, so not counted"
and explicitly wrote "none is a live defect." **That conclusion is wrong for this scope.** Both
mounting sites are in `app/[locale]/`, both routes ship. The rows below supersede that classification.

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `BentoBusiness.tsx:96` | ping halo on the "Bestätigt 23 Sek." dot | decoration; signals nothing real, gated on no state | none | `animate-ping` (Tailwind stock, `infinite`) | **WCAG-2.2.2** , auto-start, no endpoint, beside the whole page, no stop control. Another instance of RANK 1, **promoted from latent to LIVE**. Structurally identical to `SalonWalkInPanel.tsx:188`, which RANK 1 calls unconditional. |
| `BentoBusiness.tsx:160,164,168` | three "customer is typing" dots | decoration; no real chat is connected | none | `animate-pulse` ×3 with `animationDelay` 0/200/400ms, `infinite` | **WCAG-2.2.2** , three concurrent infinite loops. **`animate-pulse` is an offender shape RANK 1's list does not name** (it names shimmer, spin, ping, breathe, bounce, walkin-ring-pulse). Add it. |
| `BentoBusiness.tsx:144-150` | `<Typewriter>` cycling 4 salon replies | decoration | none | `typewriter.tsx:81-116`, a `setTimeout` chain, `loop` defaults true, 45ms/char + 2200ms hold, never terminates | **WCAG-2.2.2** , **NEW shape.** This is a JS-timer loop, so it is invisible to every class-name-based check, to the `globals.css:823-830` reduced-motion block and to any future gate that greps for `animate-*`. It is the only loop in the scope that handles reduced motion itself (`typewriter.tsx:65-72`, honest credit), and per finding 14 that still does not discharge 2.2.2. |
| `BentoBusiness.tsx:413-427` | analytics bars growing from zero | reveal of a chart | reveal 250-300 | `initial={{height:"0%"}} animate={{height:"${h}%"}} transition={{duration:0.7, delay:i*0.06}}` | **RULE-2** , animates `height`, which hard rule 2 forbids by name. **NEW**, and it is the most direct hard-rule-2 breach found anywhere in the sweep so far. Also 700ms + up to 360ms stagger ≈ 1.06s on a non-full-screen element, well over the reveal ceiling. |
| `BentoBusiness.tsx:403` | `<AnimatePresence mode="wait">` around the chart | swap datasets on tab press | , | `mode="wait"` serialises exit then enter | **RULE-4** , non-interruptible; a second tab press waits for the first exit. Another instance of RANK 5 (`BookingWizard.tsx:213`), now on a marketing route. |
| `BentoBusiness.tsx:409` | chart crossfade | in-place dataset flip | snap 150 | `transition={{duration: 0.2}}` | **WRONG-TIER** , another instance of RANK 5's 200ms fourth tier, now LIVE. |
| `BentoBusiness.tsx:379` | J / M / W period chips | in-place state flip, repeated action | snap 150 (finding 4: repeated → fastest that reads) | `transition-colors duration-200 ease-glide`, no `active:` | **WRONG-TIER + MISSING** , 200ms and zero press feedback on a chip the card invites you to "durchklicken". |
| `BentoBusiness.tsx:205-223` | 15 calendar slot tiles entering | decorative panel entrance | reveal 250-300 | `initial={{opacity:0,scale:0.7}} animate transition={{duration:0.35, delay:i*0.035}}` | **WRONG-TIER** , 350ms each, last tile starts at 490ms, ~840ms total for decoration. Also a scale of 0.7 on a small tile, far outside the ENTER RECIPE's 0.96. Not filed under RANK 3 because it is not the recipe, it is a bespoke one. |
| `BentoBusiness.tsx:482` | `MorphingDialog` transition | trigger card morphs into a modal | reveal, or full-screen carve-out | `{type:"spring", bounce:0.05, duration:0.4}` | **NO RULE COVERS THIS** , a non-gesture spring has no assigned tier (LOCKFILE §16.5 covers finger-driven only). Same gap as RANK 6. On the merits this is the best motion in the scope: finding 6 and finding 12's blessed use both cover it. |
| `BentoBusiness.tsx:634` | modal submit "Jetzt anmelden" | press acknowledgement | press 80-100 | `transition-all duration-200 ease-glide hover:scale-[1.02] active:scale-[0.97]` | **WRONG-TIER** , 200ms press on the page's conversion button. |
| `BentoBusiness.tsx:597,604,611,618` | four modal inputs | focus feedback | snap 150 (no tier assigned to focus) | `transition-shadow focus:shadow-[0_0_0_3px_rgba(255,255,255,0.4)]` | **OK** on tier (bare = 150ms). Flagged separately: that is a focus **halo**, which the design-contract `focus` row kills by name for the third time ("the soft box-shadow halo this row used to describe is DEAD by name"). Not a motion defect; a contract defect on a motion-shaped property. |
| `morphing-dialog.tsx:392` (via `:645`) | modal close X | press acknowledgement | press 80-100 | `transition-colors`, no `active:` | **MISSING** , the design contract's own close treatment is `active:scale-[0.94]`, inherited from Sheet/Modal. This one inherits nothing. |
| `morphing-dialog.tsx:177-179` | modal backdrop fade | scrim | reveal 250-300 | inherits the parent 400ms spring via `MotionConfig` | **OK** , a scrim fade is the documented exception in MOTION.md's own recipe note. |
| `BentoCard.tsx:71-73` | the four bento cards entering | list first-load entrance | reveal 250-300 | `initial={{opacity:0,y:30}} animate transition={{duration:0.5}}` | **WRONG-TIER** , 500ms on a non-full-screen card. Separately: the docstring (line 17) says "Scroll-triggered entrance" but the code uses `initial`/`animate`, **not** `whileInView`, so all four fire on mount regardless of viewport. Doc contradicts code. |
| `BentoCard.tsx:84` | card hover lift | hover feedback | snap 150 | `shadow-elevation-1 transition-shadow duration-200 ease-glide hover:shadow-elevation-2` | **WRONG-TIER** , 200ms, and finding 25 says never transition `box-shadow` (multi-pass repaint per frame; the cheap form is a pre-rendered shadow layer whose opacity animates). |
| `BentoCard.tsx:47-54` | desktop cursor-following 3D tilt | expressive polish | , | `useSpring(useTransform(...), {damping:30, stiffness:200})` on `rotateX`/`rotateY`, `transformPerspective: 1200` | **NO RULE COVERS THIS** , a non-gesture spring on a mouse-driven MotionValue. Two things worth stating rather than resolving: (a) finding 15's named vestibular trigger class includes "2D planes moved in 3D space", and a perspective-1200 plane rotating ±6° is literally that, at small amplitude; (b) see the open question below about whether `reducedMotion="user"` reaches it. |

### `/fuer-salons` , `app/[locale]/fuer-salons/page.tsx`

Sections 3-8 render the same `Step`, `FAQItem`, `MarketplaceVisual`, `BentoBusiness` and `JoinUsCard`
rows as `/business`; those are not repeated. Route-specific rows only.

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `fuer-salons/page.tsx:227` | hero primary CTA | press acknowledgement | press 80-100 | `transition-all duration-200 ease-glide hover:-translate-y-[1px] active:scale-[0.97]` | **WRONG-TIER** , 200ms. Another instance of RANK 2. |
| `fuer-salons/page.tsx:235` | hero secondary CTA | press acknowledgement | press 80-100 | `transition-all duration-200 ease-glide hover:bg-white/10 active:scale-[0.97]` | **WRONG-TIER** |
| `fuer-salons/page.tsx:307` | marketplace link | hover colour step | snap 150 | `transition-colors duration-150 ease-glide hover:text-s-ink-2` | **OK** |
| `fuer-salons/page.tsx:339` (`?v=2` only) | six category tiles | hover border + shadow | snap 150 | `hover:border-s-ink hover:shadow-elevation-1 transition-[border-color,box-shadow] duration-200` | **WRONG-TIER** , 200ms; finding 25 on the shadow half. |
| `fuer-salons/page.tsx:417` (`?v=2` only) | four trust badges | static | none | none | **OK** |
| `fuer-salons/page.tsx:256,258` | trust-strip dots | decoration | none | none | **OK** (motion) |

### `/partner` , `app/[locale]/partner/page.tsx`

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `partner/page.tsx:108` | eight feature cards | hover border + shadow | snap 150 | `hover:shadow-elevation-1 transition-[border-color,box-shadow] duration-200` | **WRONG-TIER** , 200ms; finding 25. |
| `partner/page.tsx:147` | six category cards | hover border + shadow | snap 150 | `hover:border-s-ink hover:shadow-elevation-1 transition-[border-color,box-shadow] duration-200` | **WRONG-TIER** |
| `partner/page.tsx:418` | nine FAQ cards, `<button>` | in-place select flip | snap 150 | `transition-[border-color,box-shadow] duration-300`, no `active:` | **WRONG-TIER + MISSING** , 300ms on an in-place change is the shape the law calls out by name ("a 420ms tab switch reads as the UI thinking"); 300 is the same class of error. And a nine-card row with no press feedback at all. |
| `partner/page.tsx:430` | FAQ chevron | in-place flip | snap 150 | `transition-transform duration-300` | **WRONG-TIER** |
| `partner/page.tsx:436` | FAQ answer reveal | disclosure | reveal 250-300 | `overflow-hidden transition-[height,opacity] duration-300` toggling `max-h-48` / `max-h-0` | **RULE-2** , the property list names `height`, which hard rule 2 forbids. **And it is a dead transition on top of that:** the class that actually changes is `max-height`, which is not in the property list, so only the opacity animates and the height snaps. Two bugs, one line. **NEW.** |
| `partner/page.tsx:455` | sticky bottom CTA | press acknowledgement, the page's persistent conversion control | press 80-100 | `hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150` | **WRONG-TIER** , 150ms. Another instance of RANK 2. |
| `partner/page.tsx:501` | "Beratung" mailto link | hover colour step | snap 150 | `transition-colors` (bare = 150) | **OK** |
| `partner/page.tsx:413` | FAQ horizontal snap scroller | user-driven scroll | none | `overflow-x-auto snap-x snap-mandatory` | **OK** , finding 15's peripheral-horizontal-movement trigger is about *auto* motion; a user-driven scroller is not in the class. |
| `partner/page.tsx:175-180` | dashed connector lines + chevrons | static decoration, `aria-hidden` | none | none | **OK** |
| `partner/page.tsx:347-381` | competitor comparison bars | static widths via inline `style` | none | none, no transition | **OK** , correctly static. Contrast with `BentoBusiness:413`, which animates the same idea and trips hard rule 2. |
| `interactive-hover-button.tsx:20` (via `:494`) | "InteractiveHoverButton" final CTA | press acknowledgement | press 80-100 | `active:scale-[0.97] transition-[transform,filter]` (bare = 150) | **WRONG-TIER** , 150ms press. Separately: the component is named for a hover interaction it does not implement, there is no `hover:` class in the file. Dead vocabulary, same family as RANK 5's 36 zero-call-site utilities. |
| `PartnerSignupForm.tsx:59,67` | two hero inputs | focus/colour feedback | snap 150 | `transition-colors` (bare = 150) | **OK** |
| `PartnerSignupForm.tsx:72` | hero submit button | press acknowledgement + hover brightness | press 80-100 | `bg-s-ink hover:brightness-[1.06] ... transition-colors`, no `active:` | **MISSING** press. Plus a second dead transition: `brightness` is a `filter`, and `transition-colors` does not cover `filter`, so the hover step snaps instantly. |
| `PartnerSignupForm.tsx:75` | `<Loader2 className="animate-spin" />` | in-flight feedback inside a button | , | `animate-spin`, `infinite`, bounded by the POST | **WCAG-2.2.2 (conditional)** , legal per motion-22 ("spinners only INSIDE buttons") and bounded in the happy path; a stalled `/api/partner/leads` turns it into a Level A exposure with no code change. Another instance of RANK 1's conditional class. |

### `/coming-soon` , `app/[locale]/coming-soon/page.tsx`

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `coming-soon/page.tsx:58-62` | whole-page content entrance | full-screen entrance | full-screen carve-out permits >300 | `initial={{opacity:0,y:16}} animate transition={{duration:0.5}}` | **OK** , the animated element is the entire screen content, which is the one case THE SPEED LAW allows above 300ms. |
| `coming-soon/page.tsx:88` | "Benachrichtigen" button | press acknowledgement | press 80-100 | `hover:brightness-110 active:scale-[0.97] transition-[transform,filter] duration-200` | **WRONG-TIER** , 200ms press. |
| `coming-soon/page.tsx:103` | "Zurück" link | hover colour step | snap 150 | `transition-colors duration-200` | **WRONG-TIER** , marginal; another 200ms fourth-tier row. |
| `coming-soon/page.tsx:83` | email input | , | snap 150 | no transition class | **OK** , focus is global per the design contract. |

### `/help` , `app/[locale]/help/page.tsx`

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `help/page.tsx:78` | search input | , | snap 150 | `transition-colors` (bare) | **OK** |
| `help/page.tsx:87` | "Alle" filter chip | in-place select flip | snap 150 | `transition-colors` (bare = 150), no `active:` | **OK** tier / **MISSING** press |
| `help/page.tsx:99` | three category chips | in-place select flip, repeated | snap 150 | `transition-colors` (bare = 150), no `active:` | **OK** tier / **MISSING** press (×3, counted once) |
| `help/page.tsx:122-134` | eight `<Skeleton>` during fetch | loading | , | `animate-shimmer`, `infinite` | **WCAG-2.2.2 (conditional)** , another instance of RANK 1, the highest-blast-radius entry. Eight concurrent loops here. |
| `help/page.tsx:147-151` | article-group entrance | list re-render on filter or keystroke | snap 150 (finding 4: repeated → fastest that reads) | `initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}` with **no transition prop**, so framer's default | **WRONG-TIER** , **NEW.** The effect at `:34-47` re-fetches on every `search` change with no debounce, and `grouped` re-keys, so this entrance re-runs on **every keystroke**. MOTION.md names this exact harm in its own remaining-work note ("re-staggering search results on every filter change reads as annoying"), and finding 4 has three independent sources plus a 150ms number against it. |
| `help/page.tsx:163` | article rows | hover + press | press 80-100 / snap 150 | `hover:bg-s-bg-sunken transition-colors` (bare = 150), no `active:` | **OK** tier / **MISSING** press (row tier 0.98) |
| `help/page.tsx:168` | row chevron | hover colour step | snap 150 | `transition-colors` (bare) | **OK** |
| `EmptyState.tsx:50-52` (via `:137`) | empty state entrance | reveal | reveal 250-300 | `initial={{opacity:0,scale:0.97}}`, `duration:0.25`, gated on `useReducedMotion()` | **OK** , correctly tiered and the only component in the scope that gates itself explicitly. (That this is the legacy `EmptyState` rather than the locked `<EmptyState>` anatomy is a design-contract question, not a motion one.) |

### `/help/[slug]` , `app/[locale]/help/[slug]/page.tsx`

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `help/[slug]/page.tsx:50-57` | six `<Skeleton>` | loading | , | `animate-shimmer`, `infinite` | **WCAG-2.2.2 (conditional)** , another instance of RANK 1. |
| `help/[slug]/page.tsx:75` | "Zurück zur Hilfe" CTA | press acknowledgement | press 80-100 | `hover:brightness-110 transition-[filter] duration-200`, no `active:` | **WRONG-TIER + MISSING** |
| `help/[slug]/page.tsx:100-114` | rendered article body | static prose | none | none | **OK** , finding 12 makes motion here a harm, not a gap. |

### `/brand/[slug]` , `app/[locale]/brand/[slug]/page.tsx`

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `brand/[slug]/page.tsx:49` | full-page `<Spinner size="lg" />` | loading the whole route | , | `Spinner.tsx:24` `animate-[spin_0.7s_linear_infinite]` | **WCAG-2.2.2** , another instance of RANK 1's `animate-spin`, with an aggravator RANK 1 does not record: this is a **page-level** spinner, and finding 15 names "a spinning loader as a page-level element" in the vestibular trigger class explicitly. It also breaks the locked `states` row (loading = `<Skeleton>` shape-matched, "NOT a bare spinner") and motion-22 ("spinners only INSIDE buttons"). Three separate rules, one element. |
| `brand/[slug]/page.tsx:92` | external website link | hover colour step | snap 150 | `transition-colors` (bare) | **OK** |
| `brand/[slug]/page.tsx:113` | `<SalonCard>` grid | , | , | , | cross-reference , audited in HOME_SEARCH_INSPO.md, not re-reported |

### `/behandlungen/[...slug]` , `app/[locale]/behandlungen/[...slug]/page.tsx`

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `behandlungen/page.tsx:186-188` | six `<SkeletonCard>` | loading a result grid | , | `animate-shimmer` ×5 per card, `infinite` | **WCAG-2.2.2 (conditional)** , this is RANK 1's named worst case verbatim: "a 6-card grid renders 30 concurrent infinite shimmers". Another instance, now with a second route behind it. |
| `behandlungen/page.tsx:192-197` | empty state | reveal | reveal 250-300 | `EmptyState` 250ms, reduced-motion gated | **OK** |
| `behandlungen/page.tsx:132,134` | `SearchAutocomplete`, `FilterBar` | , | , | , | cross-reference , HOME_SEARCH_INSPO.md |
| `CategoryTree.tsx:67` | skeleton bars while categories load | loading | , | `h-8 bg-s-bg-sunken rounded animate-pulse`, `infinite` | **WCAG-2.2.2 (conditional)** , another instance of RANK 1, in a file no prior audit reached, and again on the `animate-pulse` shape RANK 1's list omits. |
| `CategoryTree.tsx:81` | mobile category chips | in-place select flip | snap 150 | `transition-colors duration-150`, no `active:` | **OK** tier / **MISSING** press |
| `CategoryTree.tsx:103` | desktop tree rows | hover + navigate | snap 150 | `transition-colors` (bare), no `active:` | **OK** tier / **MISSING** press |
| `QuickPreviewSheet.tsx:68-71` | mobile sheet enter/exit | a sheet that TRAVELS | reveal 250-300 | `initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{duration:0.35, ease:[0.23,1,0.32,1]}}` | **WRONG-TIER** , 350ms, marginally over. The exit reuses the same decelerate curve, which is another instance of RANK 4 (exits should accelerate on `thud`; the system's only accelerate curve still has one call site). |
| `QuickPreviewSheet.tsx:96-99` | desktop drawer enter/exit | travels from the right edge | reveal 250-300 | same 350ms, same curve both directions | **WRONG-TIER** + RANK 4 |
| `QuickPreviewSheet.tsx:103` | sheet close button | press acknowledgement | press 80-100 | `transition-colors`, no `active:` | **MISSING** |
| `QuickPreviewSheet.tsx:182` | "Details" secondary CTA | press acknowledgement | press 80-100 | `hover:border-s-accent/50 transition-colors`, no `active:` | **MISSING** |
| `QuickPreviewSheet.tsx:189` | "Buchen" primary CTA | press acknowledgement | press 80-100 | `active:scale-[0.97] transition-[transform,filter] duration-150` | **WRONG-TIER** , 150ms. Another instance of RANK 2. |

### `/auth/login` , `page.tsx` + `components-legacy/auth/SignIn.tsx`

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `SignIn.tsx:234` | "Anmelden" submit, the route's commit button | press acknowledgement | press 80-100, CTA scale 0.97 | `active:scale-[0.98] transition-[transform,opacity] duration-150` | **WRONG-TIER** , 150ms **and** the wrong press value: 0.98 is the row tier, a commit CTA is 0.97 under the locked 3-tier rule. Another instance of RANK 2, plus a value error RANK 2 does not cover. |
| `SignIn.tsx:187` | "Reset-Link senden" submit | press acknowledgement | press 80-100 | `active:scale-[0.97] transition-[transform,filter] duration-150` | **WRONG-TIER** |
| `SignIn.tsx:256` | "Mit Apple anmelden" | press acknowledgement | press 80-100 | `hover:bg-s-bg-sunken transition-colors` (bare = 150), no `active:` | **OK** tier / **MISSING** press |
| `SignIn.tsx:268` | "Mit Google anmelden" | press acknowledgement | press 80-100 | same as above | **OK** tier / **MISSING** press |
| `SignIn.tsx:225` | password eye toggle | press acknowledgement | press 80-100, icon scale 0.94 | `transition-colors`, no `active:` | **MISSING** |
| `SignIn.tsx:242` | "Passwort vergessen?" | in-place mode swap | snap 150 | `transition-colors` (bare) | **OK** |
| `SignIn.tsx:155,194` | "Zurück zur Anmeldung" ×2 | hover colour step | snap 150 | `transition-colors` (bare) | **OK** |
| `SignIn.tsx:188,208,235` | in-button `<Spinner size="sm" invert />` | in-flight feedback | , | `animate-[spin_0.7s_linear_infinite]`, bounded by the auth call | **WCAG-2.2.2 (conditional)** , another instance of RANK 1's conditional class; legal shape per motion-22, exposed only on a slow endpoint. |
| `SignIn.tsx:138-159` | reset-sent confirmation panel | success state | , | static, no motion | **OK** , MOTION.md's SuccessMark list does not include password-reset-sent, so no rule requires a celebration here. Not filed as MISSING. |
| `auth/login/page.tsx:27` | "Registrieren" link | navigate | none | `text-s-ink font-semibold`, no hover, no transition | **OK** (motion). Separately: the design contract's `link` row specifies hover-underline on text links; this one has neither hover treatment nor the blue. A contract gap, not a tier gap. |

### `/auth/register` , `app/[locale]/auth/register/page.tsx`

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `register/page.tsx:183` | password strength meter | value change on every keystroke | snap 150 (finding 4: repeated → fastest) | `transition-[width] duration-300` | **RULE-2** , animates `width`, forbidden by name in hard rule 2. **NEW.** Compounded by 300ms on a control that updates per keystroke, which is the exact case finding 4's three sources speak to. The cheap correct form is `transform: scaleX()`. |
| `register/page.tsx:226` | "Konto erstellen" submit | press acknowledgement | press 80-100 | `active:scale-[0.97] transition-transform duration-150` | **WRONG-TIER** |
| `register/page.tsx:30` | "Kund:in" role card | press acknowledgement on the first choice in the flow | press 80-100, row scale 0.98 | `hover:border-s-ink/30 hover:bg-s-bg-sunken transition-colors duration-150`, no `active:` | **MISSING** |
| `register/page.tsx:43` | "Salon" role card | as above | press 80-100 | as above | **MISSING** |
| `register/page.tsx:38,51` | two role chevrons | hover colour step | snap 150 | `transition-colors` (bare) | **OK** |
| `register/page.tsx:150` | "Weiter" text link | hover colour step | snap 150 | `transition-colors` (bare) | **OK** |
| `register/page.tsx:295` | `<AnimatePresence mode="wait">` on the step swap | wizard step swap | reveal 250-300 | `mode="wait"` serialises exit 250ms then enter 400ms ≈ 650ms wall time | **RULE-4** , non-interruptible. Another instance of RANK 5's `BookingWizard.tsx:213` finding, same mechanism, different route. |
| `lib/animations.ts:113-128` | `slideSwitch` variants | step swap travel | reveal 250-300 | enter `x:±40 → 0, duration 0.4, ease EASE_SOLEN [0.23,1,0.32,1]`; exit `0 → ∓40, duration 0.25`, same ease | **WRONG-TIER** on the enter , 400ms on a `max-w-sm` card inside a page, not a full-screen transition. Also RANK 4: the exit uses the same decelerate curve as the enter. Note MOTION.md already ships a gentler purpose-built step-swap tier (0.99 / 260ms, `useStepSwapMotion`); this route hand-rolls a different one. |
| `register/page.tsx:227` | in-button `<Spinner>` | in-flight feedback | , | bounded by `/api/auth/signup` | **WCAG-2.2.2 (conditional)** , another instance of RANK 1. |

### `/auth/reset-password` , `app/[locale]/auth/reset-password/page.tsx`

RANK 1 names `resend-link/page.tsx:569`; that is a different file and is not in this scope. This route
has its own set.

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `reset-password/page.tsx:178` | password strength meter | value change per keystroke | snap 150 | `transition-[width] duration-300` | **RULE-2** , second instance of the same NEW shape (identical to `register:183`; both cite the same `ImageUpload.tsx:265-273` source geometry, so the third copy is at that file too). |
| `reset-password/page.tsx:207` | "Passwort ändern" submit | press acknowledgement | press 80-100 | `active:scale-[0.97] transition-[transform,filter] duration-150` | **WRONG-TIER** |
| `reset-password/page.tsx:143` | "Neuen Link anfordern" | press acknowledgement | press 80-100 | `transition-transform active:scale-[0.97]` (bare = 150) | **WRONG-TIER** |
| `reset-password/page.tsx:166` | password eye toggle | press acknowledgement | press 80-100, icon 0.94 | `transition-colors`, no `active:` | **MISSING** |
| `reset-password/page.tsx:112` | logo link | hover opacity step | snap 150 | `hover:opacity-80 transition-opacity` (bare) | **OK** |
| `reset-password/page.tsx:217` | "Zurück zur Anmeldung" | hover colour step | snap 150 | `transition-colors` (bare) | **OK** |
| `reset-password/page.tsx:149` | `<Spinner size="md" />` during link verification | loading a region | , | `animate-[spin...infinite]`, bounded by `exchangeCodeForSession` | **WCAG-2.2.2 (conditional)** , another instance of RANK 1. Note the file's own comment at `:27-29` says this used to spin forever on an invalid link and was fixed with `linkError`; the remaining exposure is a slow-but-valid exchange. |
| `reset-password/page.tsx:73` | `setTimeout(() => router.push(...), 2500)` after success | forced wait before redirect | , | 2500ms hold on a success screen with no animation running | **NO RULE COVERS THIS** , not an animation, so THE SPEED LAW does not reach it, and no rule in MOTION.md or TASTE_MOTION governs a timed auto-redirect. Recorded, not judged. |
| `reset-password/page.tsx:100-103` | ambient blur glow | decoration | none | static, no animation | **OK** |
| `reset-password/page.tsx:81-84` | success check disc | success peak | , | static `<Check>` icon, no `SuccessMark`, no `.celebrate-rise` | **OK** on motion tiers. Motion-22 lists the success peaks by name (booking-confirmed, walk-in-joined, review-posted, package bought, payment settled) and password-reset is not among them, so this is not a MISSING row. Flagged only as a candidate if the owner ever extends that list. |

### Static content and legal , zero motion, and that is the correct answer

Every route below carries only prose plus `<Link>`/`<a>` elements. The accent links inherit
`transition: color 150ms ease` from `globals.css:182-184` (the `DS-6` single-point rule), which is
exactly the snap tier, so they are correct without a class of their own. Adding entrance or
scroll-reveal motion to any of these would be decoration: finding 12 says never justify a Solen
animation as a comprehension aid, and finding 8 says motion beside a reading task spends attention
against the task.

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `blog/page.tsx:40` | one "Inspo" accent link | hover colour step | snap 150 | inherited 150ms via `globals.css:182` | **OK** |
| `karriere/page.tsx:38` | one mailto link | hover colour step | snap 150 | inherited 150ms | **OK** |
| `ueber-uns/page.tsx:53,66,70` | four accent links | hover colour step | snap 150 | inherited 150ms | **OK** |
| `kontakt/page.tsx:27,39,44,50,63,67,80` | eight accent links | hover colour step | snap 150 | inherited 150ms | **OK** |
| `impressum/page.tsx:40` | one mailto link | hover colour step | snap 150 | inherited 150ms | **OK** |
| `legal/terms/page.tsx` | prose only, no interactive element | , | none | none | **OK** |
| `legal/privacy/page.tsx` | prose only, no interactive element | , | none | none | **OK** |
| `agb/page.tsx:5` | `redirect()` stub, no DOM | , | none | none | **OK** |
| `datenschutz/page.tsx:5` | `redirect()` stub, no DOM | , | none | none | **OK** |
| `auth/signup/page.tsx:5` | `redirect()` stub, no DOM | , | none | none | **OK** |
| `behandlungen/TreatmentsClient.tsx` | 227-line duplicate of `page.tsx`, imported by nothing | , | , | dead file | **OK** , dead code, uncounted |

### Not mounted, so not counted

Audited because the brief named them, listed so the next audit does not re-derive their status.

- **`.animate-marquee`** (`globals.css:506-511`, `marquee 12s linear infinite`) , **zero call sites in
  the entire repository.** The only occurrences of the token outside globals.css are three prose
  comments in `Entdecken.tsx:313,328,331,349` describing where it *used* to live. Not a live 2.2.2
  failure on any route.
- **`.testimonial-scroll`** (`globals.css:994-999`, `testimonialScroll 40s linear infinite`, with
  `:hover { animation-play-state: paused }` at `:997`) , **zero call sites.** Not live. Recorded
  because if it is ever mounted it is an unconditional Level A failure: `:hover` is not a mechanism on
  touch, so a phone user gets no stop control at all, and 40s is eight times the criterion's
  five-second threshold.
- **`animated-testimonials.tsx:91`** , `setInterval(handleNext, 10000)` autoplay carousel. Would be a
  2.2.2 exposure (auto-start, indefinite, beside content, no pause control) **and** the case finding
  13 measures directly: animation substituted for a scannable set, up to 2.8x slower. Its only
  consumer, `ArtistOfTheMonth.tsx`, was removed from the page composition at V3-D104
  (`app/[locale]/page.tsx:52-56`).
- **`animated-testimonials.tsx:165`** , photo swap `duration: 0.5` carrying a `rotate`. 500ms on a
  large image plus rotation sits in finding 15's named trigger class.
- **`animated-testimonials.tsx:250,258`** , nav arrows at `duration-200` with `active:scale-[0.95]`;
  wrong press tier and a press value that matches neither 0.94 (icon) nor 0.97 (CTA).
- **`animated-testimonials.tsx:431`** , CTA `transition-all duration-200 ease-out ... active:scale-[0.97]`.

---

## Contradictions found, stated rather than silently fixed

1. **`HOME_SEARCH_INSPO.md`'s "Not mounted, so not counted" section is wrong about
   `BentoBusiness.tsx`.** It reasons from `app/[locale]/page.tsx` alone. The component ships on
   `/business:272` and `/fuer-salons:289`. Five rows it filed as "none is a live defect" are live,
   including two WCAG 2.2.2 exposures. The lesson generalises: mount-checking against one route is
   not mount-checking. `ImportProgressBar.tsx` and `ProgressiveFilter.tsx` are excluded there by the
   same reasoning and should be re-checked against the dashboard and onboarding routes before anyone
   trusts that section.
2. **`BentoCard.tsx`'s docstring contradicts its code.** Line 17 says "Scroll-triggered entrance
   (initial → animate fade-up)"; the implementation at `:71-72` uses `initial`/`animate`, not
   `whileInView`, so nothing is scroll-triggered. Same family as RANKED's `OfflineBanner` finding
   (documents a slide it does not implement) and its `globals.css:571` shimmer comment.
3. **`interactive-hover-button.tsx` implements no hover interaction.** The file contains no `hover:`
   class. The name is the only surviving trace of whatever it once did.
4. **RANK 1's offender list is missing `animate-pulse`.** It appears three times in `BentoBusiness`
   and once in `CategoryTree`, all infinite, all in this scope. The list should read shimmer / spin /
   ping / **pulse** / breathe / bounce / walkin-ring-pulse.
5. **RANK 1's offender list cannot see JS-timer loops.** `Typewriter` loops forever through
   `setTimeout`, with no class name and no CSS keyframe. Any gate built from the current list will
   pass it. Worth naming before the gate is written.
6. **`register/page.tsx` hand-rolls a step swap while `useStepSwapMotion` exists.** MOTION.md locks a
   step-swap tier (opacity + scale 0.99, 260ms, `glide`, no blur) with a documented containing-block
   reason. The auth wizard uses `slideSwitch` at 400ms with an `x` translate instead. Two different
   answers to the same question, both shipped.

---

## The three most serious findings

**1. `BentoBusiness` is live on two marketing routes and audit 2 said it was not. NEW as a live
finding; the individual shapes are another instance of RANK 1.**
`BentoBusiness.tsx:96` (`animate-ping`), `:160/164/168` (three `animate-pulse` dots) and `:144-150`
(the `Typewriter` loop) are five auto-starting, never-ending animations rendering simultaneously on
`/business` and `/fuer-salons`, on the two pages whose entire job is to move a salon owner into a
signup form. None is gated on a fetch, none has an endpoint, none has a stop control, and
`prefers-reduced-motion` does not discharge SC 2.2.2 (finding 14). The ping is structurally identical
to `SalonWalkInPanel.tsx:188`, which RANK 1 calls one of the two unconditional failures in the
product. Two of the shapes are additionally invisible to the fix RANK 1 proposes: `animate-pulse` is
not on its offender list, and the `Typewriter` loop has no class name at all.

**2. Three RULE-2 breaches that animate a layout property, all net-new, one of which is also a dead
transition.**
`BentoBusiness.tsx:413-427` animates `height` from `0%` to a target on every bar of the analytics
chart, at 700ms with a 60ms stagger. `register/page.tsx:183` and `reset-password/page.tsx:178` animate
`width` on the password strength meter at 300ms, on a control that updates on every keystroke, which
finding 4 specifically says must take the fastest tier. `partner/page.tsx:436` names `height` in a
`transition-[height,opacity]` while the class it actually toggles is `max-height`, so it trips hard
rule 2 in intent and does nothing in practice, the FAQ answer's height snaps while only its opacity
fades. All four are `transform`/`opacity`-expressible: `scaleX` for the meters, `scaleY` with a
transform-origin for the bars, a measured height for the disclosure.

**3. The press tier is absent from marketing and auth entirely. Another instance of RANK 2, +31 rows.**
Not one of the 31 pressable elements in this scope presses at 80-100ms. `/business` and
`/fuer-salons` press at 200ms including both hero CTAs and the modal submit; `/partner`'s sticky
conversion CTA presses at 150ms and its nine FAQ cards at 300ms with no press feedback at all;
`SignIn.tsx:234`, the login commit button, presses at 150ms **and** uses `scale-[0.98]`, the row tier,
where the locked 3-tier rule assigns a CTA 0.97. On top of that, 22 controls have no press feedback
whatsoever, including both role-choice cards that open the registration flow, all three OAuth buttons,
every eye toggle and every FAQ summary. Miller 1968 read at the primary source is the only tier in
the whole ladder with a named source, and it is the tier the marketing funnel skips.

---

## Open question, not resolved

**Does `reducedMotion="user"` reach `BentoCard`'s hover tilt?** `MotionProvider`
(`components-legacy/layout/MotionProvider.tsx:7`) wraps the whole locale tree at
`app/[locale]/layout.tsx:57` with `<MotionConfig reducedMotion="user">`, which is genuinely good news
and means the framer entrances in this scope (`BentoCard:71`, `VisualCalendar:205`,
`coming-soon:58`, `help:147`, `register:296`, `QuickPreviewSheet:68`) are covered without each file
gating itself. But `BentoCard.tsx:47-54` does not animate through a `animate`/`whileHover` prop: it
writes `MotionValue`s from a `mousemove` handler and consumes them through `style`. Whether framer's
reduced-motion gate intercepts that path is a runtime question I did not open a browser to answer,
so this audit does not assert it either way. It matters because finding 15's named trigger class
includes "2D planes moved in 3D space", which is what a `perspective: 1200` plane rotating on two
axes is. One Playwright run with the emulated media feature settles it.

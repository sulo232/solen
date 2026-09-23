# RATIONALE.md , the mechanics layer of the Solen taste system

<!-- exists-check: net-new vs CANON/SOURCE/LOCKFILE/TASTE_LOG/PSYCHOLOGY/RESTRAINT_TEST because none holds the perceptual/mathematical MECHANICS layer: 2026-07-15 inventory found LOCKFILE rationale is 51 percent BARE and 4 percent mechanics-class, SOURCE has zero named perception/aesthetics citations, PSYCHOLOGY.md covers behavioral (conversion/retention) laws not visual-perception mechanics. This file EXTENDS that stack (backlinks throughout) and duplicates none of it; npm run exists rationale = 0 hits. -->

**Status: v2 (2026-07-16). v1 OWNER-CONFIRMED 2026-07-15 (location = this file; retrofit = FULL sweep, done in section 14; template = hybrid; added domains i18n/touch/enforcement; imagery DECLINED). Round 2 added 2026-07-16 from the owner's second research digest + two judgment-agent passes: sections 16-28 (epistemics, cognition/signifiers, depth/light, token architecture, states/feedback, forms, icons, data display, typographic craft, composition/Swiss lineage, voice/tone, ethics, gap register), BOUNDARY field in the entry template, folklore table extended. Kill-list honored (judges 2026-07-16): RTL/CJK compressed to one boundary line, data display kept compact, ISO 9186 noted-not-adopted, dark-mode polarity recorded as a mobile-canon pointer only (web dark mode stays graveyarded).**

**What this is.** The WHY layer: the perceptual, mathematical, and empirical mechanics that ground the decisions locked elsewhere. LOCKFILE/CANON hold the WHAT (frozen literals), TASTE_LOG holds the WHEN/WHO (dated owner calls), PSYCHOLOGY.md holds the behavioral laws. This file holds the MECHANISMS (formulas, thresholds, named studies) those decisions can cite, so a rule can be defended instead of asserted.

**What this is NOT.** Never a lever to reopen a lock. When a mechanic here argues against a LOCKFILE literal, that is a QUESTIONS.md entry for the owner, not a change. Precedence is owned by the Solen precedence section of the project CLAUDE.md; this file's general mechanics rank below all of it. A dated owner decision beats a study every time; this file's job is to make the tradeoff visible, not to win it.

**Source basis.** Owner-supplied research digest (2026-07-15, 8-domain design-decision framework survey) + the 2026-07-15 inventory of the existing stack (LOCKFILE 1431 lines: 51 percent of locked rules carry no recorded why, mechanics-class rationale is 4 percent; SOURCE.md: zero named perception/aesthetics citations; full audit in _plans/TASTE_RATIONALE.md).

---

## 0. Evidence tiers (same vocabulary as PSYCHOLOGY.md, extended)

| Tier | Meaning |
|---|---|
| **T1** | Replicated / meta-analytic / formal standard (WCAG math, Fitts, CVD prevalence) |
| **T2** | One strong study or converging independent sources |
| **T3** | Directional (single study, vendor data, popularized claim with a defensible core); verify on our own data before trusting magnitude |
| **CONV** | Named convention: useful default with a domain of validity, no empirical claim (8pt grid, harmony schemes, our 80/17 budget) |
| **MYTH** | Debunked or fabricated; never cite (table in section 9) |

Every mechanic below carries its tier. A CONV is not a weaker T1: it is a different kind of claim (a coordination device, not a truth), and the honest label is what keeps this file from becoming folklore itself.

---

## 1. The entry format (how a taste decision earns its "because")

A defensible rationale documents FORCES and TRADEOFFS, not rules (the shared lesson of QOC, ADRs, and Alexander's pattern format). The template for any new taste decision, and for retrofits of locked ones:

```
DECISION: <the rule, one line, with its locked literal>
FORCES: <the competing pressures this resolves, 2-4 bullets>
OPTIMIZES FOR: <what wins>
SACRIFICES: <what loses, named honestly>
BOUNDARY: <when the rule flips; the reversal condition (round-2 addition, 2026-07-16)>
MECHANIC: <formula / threshold / study + tier, or "owner taste, dated" if none>
SOURCE: <owner date / measured ref / RATIONALE.md section>
```

The BOUNDARY field (added 2026-07-16 from the round-2 digest's four-part entry test) is what separates a rule from a slogan: "body text is positive polarity" is complete only with "except code blocks and immersive media." Existing retrofit blocks in section 14 predate the field; add BOUNDARY lines opportunistically when a block is next touched, do not sweep-rewrite them.

**The reversibility test:** a principle is only actionable if a competent team could defensibly choose its opposite. "Make it usable" is a value, not a principle. "Restraint: one ink anchor per card, at the cost of scannability of secondary values" is a principle. Entries that fail the test get demoted to values (section 8 keeps a short values list so they have somewhere honest to live).

**Existing proto-rationale to build on, not duplicate:** the V3-D provenance format (SOURCE.md section 15) is already an ADR chain (id + date + motivation + supersession); TASTE_LOG's Decision/Why tables are QOC-lite; RESTRAINT_TEST.md's "honest risk" section is the house's best worked example of forces/tradeoffs. The template above adds only the two missing fields: FORCES and SACRIFICES.

---

## 2. Domain 1: Perception (what the eye does before thought)

**SYMMETRY joins this list 2026-07-17 (it was missing, though Wertheimer includes it; research/GEOMETRY_PRINCIPLES_2026-07-17.md sym-03/sym-04/sym-05).** Symmetric elements group into one perceptual unit, and the grouping is close to pre-attentive: crude mirror symmetry is judged at ~50ms exposure (T1, Huang/Pashler/Junge 2004, citing Barlow and Reeves). Three consequences, all operational. (1) An ACCIDENTAL symmetry is read exactly as fast as a designed one, so two functionally independent controls placed in a mirrored layout WILL read as one unit whether you meant it or not. (2) Symmetry must track function: mirroring is only honest when the two actions are substitutable, never for Bezahlen vs Abbrechen (T2, Thimbleby 2002: if the system lacks the symmetry the visuals claim, users hit capture errors). This is the positive twin of the slip-adjacency rule below and grounds the Twin-control rule (LOCKFILE DS-4) on symmetry, not only similarity. (3) When a pair IS mirrored, the axis must be VERTICAL: vertical mirror symmetry is the most salient orientation, horizontal second (T1, Wenderoth 1994, The Salience of Vertical Symmetry). Symmetry, balance and alignment are three different properties and are measured separately (T2, NN/g): balance is weight distribution about an axis and needs no mirroring, alignment is shared coordinates, symmetry is a mirror transform that either holds within tolerance or does not.

**Gestalt grouping (T1, Wertheimer/Koffka).** Proximity is the strongest grouping signal: whitespace ENCODES relationship. Similarity, common region (cards), common fate (coordinated motion), continuity (alignment), figure/ground (elevation) follow.
- Grounds: spacing rhythm 32/12/16 (LOCKFILE:446-450): section gaps larger than card gaps IS proximity math; "space within a group < space between groups" is why the three tiers exist.
- Grounds: grouped list cards (LOCKFILE:463-468): common region, one card per group, rows inside.
- Grounds: the divider rule (taste rule 2, "existing contrast IS the separator"): adding a middot between two already-differentiated tokens double-encodes one boundary.

**Preattentive attributes / isolation (T1, Ware; Bertin's retinal variables).** A single differing attribute pops out in under 250ms; pop-out weakens as distractor variety grows. Position and size read as ordered/quantitative; hue and shape read as categorical.
- Grounds: the one-ink-anchor card rule (LOCKFILE:375, A13): four bold anchors means zero pop-out, "bolding everything bolds nothing" is preattentive math, not just taste.
- Grounds: blue-sparse (LOCKFILE section 0 restraint model): an accent that is rare is a preattentive signal; at 8-12 percent of pixels it stops discriminating (the recorded "vibrating blue" failure).
- Grounds: per-screen type budget, 4 sizes / 2 weights (LOCKFILE:319): each added size is a distractor class that dilutes the hierarchy signal.

**Fitts's Law (T1, Fitts 1954): MT = a + b * log2(D/W + 1).** Bigger and closer targets are faster and lower-error; for rectangles the smaller of width/height governs (MacKenzie/Buxton 1992).
- Grounds: 44px touch floor (design contract; HeartButton 44 hit / 32 visible, LOCKFILE:715): the hit-area/visible split is exactly Fitts (W is the hit area, not the paint).
- Grounds: sheet drag-dismiss ~90px threshold (LOCKFILE:1392-1394): a release threshold is a Fitts target along the drag axis.
- Retrofit target: bottom-anchored primary CTAs on mobile (thumb-zone distance, the D term).

**Hick's Law (T1, Hick-Hyman): RT = a + b * log2(n + 1).** Decision time grows with equally probable options; it trades AGAINST Fitts on menu depth.
- Grounds: single-select search filters (owner lock), 3-5 labeled service categories (PSYCHOLOGY.md law on choice comparability). Caveat from our own psychology research: choice OVERLOAD at population level is weak (meta d = 0.02); Hick is about decision LATENCY, not conversion. Cite Hick for speed, never for "fewer options convert better" (that is the jam-study MYTH, PSYCHOLOGY.md myth table).

**Memory span: cite Cowan (~4 chunks, 2001), never Miller's 7+/-2.** Recognition (scanning a visible list) is not span-limited at all; the limit binds recall. No Solen rule should ever justify "7 items max" from Miller.

**Scanning patterns, researched 2026-07-15 (T1, NN/g eyetracking; full sourced delta in research/TASTE_HIERARCHY.md):** scanning is TASK-optimized, so hierarchy is judged against the screen's task, never in the abstract. The F-pattern is a FAILURE MODE of unformatted content ("good design can prevent F-shape scanning"), the layer-cake (distinct, descriptive headings that get fixated while body is skipped) is the target state. The squint/blur test is the named method for focal-hierarchy checks. Ceilings for a screen: ~3 type sizes (**NOT the law , the binding ceiling is `<=4` distinct sizes AND `<=2` weights, LOCKFILE §12 and this file's own line ~351, which is hard and gate-checked. Read the "~3" here as this research's tighter editorial preference, never as the pass/fail number: a diagnosis run against "~3" fails a compliant 4-size screen.**), max 2 elements at the top prominence tier, max 2 stacked emphasis treatments per text run. Z-pattern: unverified folk convention, added to the folklore table. Diagnosis procedure: the solen-taste-diagnosis skill.

---

## 3. Domain 2: Color (the space you reason in matters)

**OKLCH is the palette-generation space (T1 for perceptual uniformity vs HSL).** HSL lightness is a math artifact of RGB: hues at equal HSL-L differ wildly in perceived brightness, so multi-hue systems built in HSL cannot hold contrast constant. OKLab/OKLCH (Ottosson 2020) gives near-uniform L, orthogonal L/C/H, predictable contrast across hues. Caveats: imperfect in high-chroma blue/purple, gamut edges clip.
- Already practiced once: chart-series hue stepping at fixed L+C (LOCKFILE:99-100). That is the pattern to generalize.
- The SOURCE.md section 2.1 "saturation contract" is written in HSL ranges. It works because Solen is nearly monochrome (one accent), but any future multi-hue extension (category colors, data viz, dark mode) derives in OKLCH and only then converts. HSL stays as legacy documentation, not as the generator.

**CVD prevalence (T1, Colour Blind Awareness): ~1 in 12 men (8 percent), ~1 in 200 women; ~300M people; red-green types ~99 percent of cases.**
- Solen's highest-risk pair is exactly red-green: s-success #16A34A vs s-error/s-closed #DC2626 (status colors on bookings, availability, validation). WCAG 1.4.1: color never the sole carrier. Our practice (icon + text + color on status chips, check inside the success disc) already conforms; this is the mechanic that makes it non-negotiable rather than stylistic.
- SOURCE.md:1046 states "color as the only signal" as an anti-pattern without the CVD math; this section is its missing floor.

**Color psychology and harmony schemes: CONV at best.** Cross-cultural variance is large; "white = purity" class claims are conventions of our market, not laws. Harmony wheels (complementary/triadic) are scaffolds. Solen's hue choices are justified by universal SEMANTIC convention (star yellow, error red) plus brand restraint, which is the honest framing SOURCE.md already uses.

**The 80/17 budget (CONV, internal).** Same claim-shape as the 60-30-10 folk rule, but it is OUR dated budget decision (V3-D138/V3-D197), stated as a house constraint, not as science. Keep it, keep the label.

---

## 4. Domain 3: Contrast (the math is settled; the policy is ours)

**WCAG 2.x ratio (T1, normative standard): (L1 + 0.05) / (L2 + 0.05)** on linearized sRGB luminance (0.2126 R + 0.7152 G + 0.0722 B). Thresholds: AA 4.5:1 normal text, 3:1 large text (>=18pt or >=14pt bold); 1.4.11 non-text 3:1 for UI components and focus indicators. AAA 7:1 / 4.5:1.

**Known failures of the WCAG 2 formula (documented, drives the APCA supplement):** overstates contrast for dark pairs (a passing 4.5:1 near black can be unreadable, so it misguides dark mode), polarity-blind, ignores weight/size beyond the crude large-text cutoff.

**APCA (T2, WCAG 3 candidate, NOT yet normative in 2026): Lc scale, polarity-aware, weight/size-aware.** Rough floors: Lc 90 small body, Lc 75 body, Lc 60 large, Lc 45 bold headlines, Lc 30 non-text minimum. Policy recommendation: WCAG 2.2 AA stays the legal floor; APCA is the supplementary check wherever WCAG 2 is known-weak (dark surfaces, thin/small type). WCAG 3 is a Working Draft; do not build compliance claims on it.

**Solen tokens, measured today (2026-07-15, both metrics):**

| Pair | WCAG | APCA Lc | Verdict |
|---|---|---|---|
| s-ink #0A0A0A on white | 19.80:1 | 105.8 | AAA, headroom for everything |
| s-ink-2 #6B6B6B on white | 5.33:1 | 76.5 | AA pass; APCA fine at 14px, MARGINAL at 12px meta (small text wants ~Lc 90) |
| s-ink-2 on sunken #F4F4F5 | 4.85:1 | 70.0 | AA pass with little headroom; below APCA body floor |
| s-accent #276EF1 on white | 4.58:1 | 71.1 | AA pass (barely) at link sizes |
| s-accent on sunken #F4F4F5 | 4.17:1 | 64.6 | **FAILS AA 4.5:1 for normal-size text.** Blue links/counts on sunken surfaces are below the floor today |
| s-success #16A34A as TEXT on white | 3.30:1 | 59.7 | Fails AA for normal text; passes 3:1 only as large text / non-text. Green STATUS TEXT at 12-14px is below the floor; the pastel-chip pattern (ink text + green icon) is the conforming form |
| disabled #C5C8C4 on white | 1.69:1 | 30.0 | Exempt (WCAG excludes disabled), fine |
| star #FFC32B | 1.60:1 | 27.0 | Below 3:1 as a lone graphic; conforming because the adjacent count text carries the value (1.4.1 pairing) |

Two of those are policy questions for the owner (probe 3 in the taste lab): tune s-ink-2 / the on-sunken blue usage, or accept and document the deviation.

**This table is a snapshot, not a re-runnable check (color-tokens-05, 2026-07-27).** `scripts/check-contrast.mjs` computes the same WCAG formula programmatically (`--self-test` reproduces every row above) and can scan a `text-s-*`/`bg-s-*` className pairing in real files for anything under the applicable floor. When a NEW component pairs an existing token against a background or font-size this table never covered, run the script, don't assume the table still applies.

**Documented deliberate departures (record, do not silently "fix"):**
- **No focus ring on buttons/links** (globals.css:344-404, owner-mandated repeatedly): conflicts with WCAG 2.4.7/2.4.11; inputs keep an ink edge + halo. This is a recorded owner tradeoff (aesthetic calm over keyboard-focus visibility), not an oversight. Residual inconsistency: SalonCard's own Link wrapper still carries a focus-visible outline (SalonCard.tsx:471).
- ~~**420ms entrance recipe** (MOTION.md:28): above the NN/g 300-400ms comfort band, deliberate premium-feel call (section 7).~~ **NO LONGER A DEPARTURE , retimed to 280ms on 2026-07-26** (owner decision, picked off the three-column side-by-side at `/de/dev/motion` Demo 7; supersedes this row). 280ms sits INSIDE the NN/g band and inside the reveal tier of THE SPEED LAW, so there is nothing left to document as a departure. Live value + the full reasoning: `MOTION.md` ENTER RECIPE.

**Simultaneous contrast (T1):** the same token reads differently on white vs sunken vs photo; evaluate pairs in their real context (this is why the styleguide page, not the token table, is the verification surface).

---

## 5. Domain 4: Typography (scale as constraint, measure as comfort)

**Modular scale (CONV, Bringhurst / Tim Brown).** A shared ratio reduces arbitrary size decisions; the "musical harmony" claim is aesthetic assertion. Solen's ladder (11/12/14/15/18-20/24/40, "Scale B") was tuned by hand, not ratio-derived, and that is FINE: the value of a scale is the constraint, and our constraint is the per-screen budget (4 sizes / 2 weights, LOCKFILE:319) plus the frozen role table. Do not retrofit a fake ratio onto it; record it as a hand-tuned constraint system.

**Measure (CONV with strong practice consensus, Bringhurst): 45-75 characters per line, ~66 ideal; 40-50 for multi-column.** Too-long lines make the return sweep error-prone. Currently ABSENT from the system: no max-width in ch anywhere, and German makes it worse two ways: compound words break lines unpredictably, and DE/FR run roughly 20-35 percent longer than EN (industry localization heuristic; treat as a range, not a fact; SOURCE.md:1075's flat "30 percent" gets this label). Candidate rule (probe 4): body/description blocks cap at ~65-70ch equivalent.

**x-height and optical cuts (T2, type-design practice).** Point size measures the em body, not the letters; apparent size tracks x-height. Inter Tight (display) + Inter (body) is one family in two optical cuts: harmony by construction, the same mechanism as a superfamily pairing, and the actual reason the pairing cannot clash. That is the first-principles version of "the way Uber does it" (SOURCE.md:319), which should be relabeled from imitation to mechanism.

**Hierarchy floors, researched 2026-07-15 (sourced delta in research/TASTE_TYPOGRAPHY.md):** 2-3 heading/type levels per screen (Butterick: "two is better"); a dominance jump is 30-50 percent larger, never a 1-2px nudge (NN/g); heading space-above > space-below, always (Butterick); ALL-CAPS only for single glanceable labels, never sentences (NN/g glanceable-fonts, T1); bold OR italic never both, and sans-serif UI skips italic; underline reads as hyperlink, never emphasis; centered text never beyond 1-2 short lines; max two visual indent levels regardless of logical depth.

**WCAG 1.4.12 text spacing (T1, robustness constraint, not a default):** content must survive user overrides of line-height 1.5x, paragraph spacing 2x, letter spacing 0.12em, word spacing 0.16em. At 14px body: 21px line-height, 28px paragraph gap. This binds our clamps and truncation (line-clamp blocks must not clip at forced spacing); add to the a11y checklist in SOURCE section 16.

---

## 6. Domain 5: Spacing and shape (grids, optics, corners)

**CORRECTION 2026-07-17 (the pixel-crispness half of the next paragraph is FALSE, research/GEOMETRY_PRINCIPLES_2026-07-17.md GM-07).** The grid does NOT keep values on whole physical pixels: real Android hardware reports a non-integer devicePixelRatio (Pixel-class ~2.625, MDN devicePixelRatio + device reporting), so a 4px token lands on a fractional physical pixel anyway. KEEP the rule, swap the why to the two justifications that survive: (1) decision-reduction, the grid kills the per-element debate, which is the honest and sufficient reason; (2) rem-based scaling, Tailwind's scale is 0.25rem-based, so tokens honor a user's font-size preference (a real WCAG 1.4.4 property). Also settled the same day: the owner's own annotated reference ladder (16/48/56/72/84) is entirely 4-multiples, i.e. their eye picked this grid unprompted; its weak point is not the grid but that 48 to 56 and 72 to 84 are only 1.17x steps, below the ~1.25 distinctness floor.

**4pt grid (CONV).** Solen is 4pt-based (SOURCE.md:369); Material and the 8pt tradition use 8 with a 4pt sub-grid. The defensible why for 4/8: common density factors (1.5x/2x/3x) keep multiples crisp (an odd 5px at 1.5x lands on a half pixel), and the grid kills per-element debate. Our choice of 4 over 8 buys denser mobile rhythm at the cost of more permissible values (weaker constraint); the 32/12/16 rhythm tiers restore the constraint at the layout level. Above ~100px, LOCKFILE already rounds to clean 5/10s (8pt pedantry buys nothing at that size, LOCKFILE:452).

**Whitespace (T2): cite Chaparro et al. 2004 (margins improved reading speed and comprehension; leading affected preference more than performance). NEVER cite "Lin 2004 whitespace +20 percent": fabricated attribution (section 9).** Macro whitespace signals structure and calm (premium read); micro whitespace drives legibility. Proximity math from domain 1 is the operative rule.

**Optical vs mathematical alignment (T2; unsettled axis at Solen, probe 2).** Bounding boxes lie: a circle at equal box height encloses less area and reads smaller; a triangle centered by box reads off-center (its visual mass sits toward one edge). Type does this natively (round letters overshoot baselines). Candidate house rules: play/chevron glyphs nudge ~4-8 percent toward visual center; circles sized next to squares get a ~2-4 percent overshoot; icon-in-disc centering is checked by eye at 2x zoom, not by flexbox faith.

**Corners.**
- Nested radius: LOCKED (inner = outer minus gap, min 4px, DS-4, LOCKFILE:428-433). Mechanic: concentric corners stay parallel; same-radius-inside-same-radius bulges. Matches the research formula (inner = outer minus padding). Nothing to relitigate.
- Curvature CHARACTER (probe 1, unsettled): a straight edge meeting a circular arc has a G1 curvature jump the eye reads as a faint kink; superellipse/squircle profiles (|x/a|^n + |y/b|^n = 1, circle n=2, squircle n~4-5, Apple's continuous corners) remove it. Cost: CSS corner-shape is not broadly shipped in 2026, so squircles today mean clip-path/mask plumbing on every rounded element, plus drift risk against the locked radius tokens. Forces: perceived refinement vs implementation surface.
- Rounded reads friendly (T2, Bar and Neta 2006/2007: preference for curved contours; sharp contours raise amygdala response; replicated cross-culturally, moderated by expertise): the mechanic under our pill buttons and 16px cards.

**Grouping and containment, researched 2026-07-15 (the bento mechanics; full decision tree + sources in research/TASTE_GROUPING.md):** peers-of-a-collection (independently actionable items) vs facets-of-one-record is the semantic test that picks the structure. Homogeneous peers = plain list rows, never per-row cards; heterogeneous peers = separate cards, never wrapped in an outer card too (cards-within-cards is a named ban); facets already differing in weight/color = whitespace only (the existing contrast IS the separator, taste rule 2's researched grounding); uniform anchorless facets = ONE card with inset dividers. Named anti-patterns: the full-width tinted "stopping point" block (readers stop scrolling at it, NN/g common-region, the owner's bento complaint), dividers added where whitespace/contrast already separates ("borders are often added in an abundance of caution"), dividers under subheaders in grids. Dashboard density and checkout floors: research/TASTE_DASHBOARDS.md + research/TASTE_CHECKOUT.md, operationalized in the solen-taste-diagnosis skill.

**Target sizes (T1, standards): WCAG 2.5.8 AA (2.2) 24x24 CSS px minimum; WCAG 2.5.5 AAA 44x44; Apple HIG 44pt; Material 48dp with 8dp spacing.** Solen's 44px floor (design contract) is the AAA/HIG line, deliberately above the legal AA minimum. All of it is Fitts in standards clothing.

---

## 7. Domain 6: Motion and timing (thresholds first, character second)

**Response thresholds (T1-T2):** 0.1s reads instantaneous, 1s keeps flow, 10s loses attention (Miller 1968, Nielsen 1993). Doherty and Thadani 1982: throughput rises sharply under ~400ms system response (the "addictive 400ms" framing is dramatized; the defensible core is faster-feedback-better-throughput). Modern operational form: INP good <= 200ms at p75 (web.dev). NN/g durations: micro-feedback ~100ms, screen-level changes 200-300ms, 500ms feels like drag; entrances slightly longer than exits.

**Solen ladder audit (2026-07-15, amended 2026-08-10).** The 80/150/200/250/300/500ms whitelist (LOCKFILE:575) and the globals.css custom-property ladder (100/150/200/300/500ms) sit inside the NN/g band. ~~The locked ENTER recipe is 420ms + blur (MOTION.md:28), ABOVE the 300-400 comfort ceiling: a deliberate premium-feel owner call (dated, "motion approved w ur reccomended"). Record it as a DOCUMENTED DEPARTURE: optimizes perceived richness on first paint, sacrifices ~100ms of perceived snappiness, bounded to entrances only (feedback interactions stay <=200ms).~~ **The ENTER recipe was retimed to 280ms + blur on 2026-07-26** (owner decision off Demo 7; supersedes the struck sentences), which puts it inside the band, so the departure is closed and the ~100ms sacrifice is no longer being paid. The blur is what buys perceptibility at speed (Chang & Ungar, UIST '93, via `research/TASTE_MOTION.md` finding 10), which is why the duration could come down without the entrance becoming imperceptible again. What the struck text still teaches, and why it is kept: naming a departure honestly is what made it findable and fixable , the alternative (silently citing NN/g while shipping 420) is how docs rot.

**Easing semantics (T2, Material motion research + practice):** decelerate (ease-out) for entrances (element reacts instantly then settles), accelerate (ease-in) for exits (reads as gone), standard in-out for in-place moves, linear only for continuous processes. Solen's tokens map cleanly: glide (0.16,1,0.3,1) is a strong decelerate (entrances, correct), thud (0.7,0,0.84,0) is an accelerate (press-down, correct), snap (0.4,0,0.2,1) is the standard curve, spring (0.34,1.56,0.64,1) is a bezier overshoot for earned moments. The semantics were chosen right; this paragraph is the missing why.

**Open inconsistency (flagged for reconciliation, not relitigation):** "spring" exists twice with different math: the bezier overshoot token (MOTION.md:61) and a physics spring (stiffness ~300 / damping ~30) for sheets (RESTRAINT_TEST.md:29). Either document as two intentional mechanisms (bezier for fire-and-forget CSS, physics for interruptible gestures, which is the standard split) or converge. Physics springs are the right tool exactly where a gesture can interrupt mid-flight (sheet drag), which supports the two-mechanism reading.

**prefers-reduced-motion (T1, WCAG 2.3.3):** vestibular-disorder trigger class is large-scale motion, parallax, spatial transitions. Implementation EXISTS globally (globals.css:805-813 hard-caps all animation/transition durations under the media query); MOTION.md states the principle 3x; SOURCE section 16 and RESTRAINT_TEST never mention it. Doc fix: point SOURCE's a11y section at the existing global rule so it stops being invisible law.

**Duration scales with distance/size (CONV, Material):** small toggles ~100-150ms, screen-scale moves toward 300ms+. Already implicit in the per-transition table (LOCKFILE:553-559); now stated.

---

## 8. Domain 7: Aesthetic theory (why polish is not decoration)

**Aesthetic-usability effect (T2: Kurosu and Kashimura 1995, r ~ 0.589 between perceived aesthetics and APPARENT usability; Tractinsky 1997 replication; 2023 CHI nuance: controlling processing fluency shrinks the effect).** Perceived beauty buys perceived usability, trust, and error tolerance BEFORE any interaction. This is the evidence line under the polish investment (and under PSYCHOLOGY.md's 100ms trust window law; cross-reference, do not duplicate).

**Processing fluency (T2, Reber/Schwarz/Winkielman): ease of processing is itself experienced as pleasant.** BOUNDARY (added 2026-07-17, this paragraph previously stated the effect flatly and the file's own template requires the field): the symmetry half is conditional, not universal. Bertamini and Makin's own title asks "Always, Never or Sometimes" and answers sometimes: the preference shows up under vocal-response and affect-misattribution tasks and vanishes under key-press evaluation. Treat symmetry as a grouping and detection mechanic (section 2) first, and as a beauty claim only with the task named. Do NOT reach for the face-symmetry-attractiveness literature (Rhodes, Perrett) to support a UI claim: different stimulus class, entangled with averageness, listed in the folklore table below. High contrast, symmetry, prototypicality, clean figure-ground read as beautiful BECAUSE they process easily. This is the deepest single why in this file: it grounds restraint (fewer distractor classes = fluent scan), the one-ink-anchor rule, copy economy (fewer words = fluent parse), and skeleton-shaped loading (prototypical layout preserved). Legibility reads as beauty.

**MAYA / typicality x novelty (T2, Hekkert et al. 2003: typicality and novelty independently predict preference and suppress each other).** Push novelty only as far as category recognition survives. The dual-axis rule (STRUCTURE = Fresha, AESTHETIC = Uber, LOCKFILE section 10) IS applied MAYA: Fresha anatomy supplies the typicality anchor (a booking flow everyone already knows), the Uber-restraint skin supplies the bounded novelty delta. Recording that turns the house's biggest rule from "because those brands" into a first-principles strategy.

**Berlyne inverted-U (T3, mixed replication):** intermediate complexity is preferred; useful lens for card density and Inspo feed richness ("rich not bland" pulls toward the peak from the sparse side), never a hard law.

**Rams' 10 principles (values, not mechanics):** review-checklist material (is it honest, is it thorough, is it as little design as possible). They live here as a judgment aid; they fail the reversibility test as principles, and that is fine at the values layer.

**In-house numbers to keep labeled:** RESTRAINT_TEST.md's life-budget percentages (photography ~50 / type ~25 / motion ~15 / whitespace ~7 / depth ~3) are llm-council output, CONV label, precision is presentational. Do not cite them as evidence.

---

## 9. Domain 9 (Solen-specific): i18n typography (owner-added 2026-07-15)

The measure/typography mechanics of domain 4 break first in German, and Solen ships de/en/fr/it. SOURCE.md section 17 holds the RULES (string files, plurals, Swiss formats); this section holds the mechanics under them.

**Text expansion (CONV, industry localization heuristic, treat as a range):** DE and FR run roughly 20-35 percent longer than EN at sentence scale, worse at label scale (short EN labels can double). Consequences with mechanics:
- Button labels: the <=3 word lock (LOCKFILE:765) is what keeps CTAs from wrapping in DE; the mechanic is expansion-at-label-scale, not copy taste alone.
- Any fixed-width slot (chips, badges, tab pills) is sized against the LONGEST locale render, not the EN draft. Test strings: "Terminbestätigung", "Haarverlängerung", "Wegbeschreibung", FR "Renseignements complémentaires".
- Truncation robustness: truncate/line-clamp blocks must still carry meaning with 35 percent more glyphs; pair every truncation with a full-value affordance (title attr, detail row, Mehr lesen).

**Compound words (T1 linguistic fact, no hyphenation dictionary in CSS by default):** German compounds do not wrap without `hyphens: auto` + `lang="de"`; a 24-glyph compound inside a narrow column overflows or forces ugly breaks. Mechanic: measure caps (domain 5's 45-75ch) need MORE slack in DE columns; enable hyphenation only deliberately (it changes the premium read).

**Numerics across locales (CONV, Swiss convention):** tabular-nums for anything that aligns or updates (prices, times, codes: already the Inter Tight tabular lock); CHF formats per SOURCE section 17; never let locale switching reflow number columns. Swiss thousands grouping (the apostrophe form, 1'000'000) does NOT come free from locale-native formatting for every locale: `fr-CH` space-groups with a comma decimal in this runtime's ICU data ((1234567).toLocaleString("fr-CH") gives "1 234 567", not "1'234'567"), while de-CH/it-CH/en-CH all apostrophe-group. Fixed 2026-07-27 (copy-i18n-06): lib/format.ts's formatPrice/formatNumber/formatCount now force the apostrophe convention via a fixed "de-CH" Intl.NumberFormat call regardless of the locale passed in, since numbers (unlike dates) are formatted identically across all four UI locales here. Never pass a per-locale BCP-47 tag straight into a number formatter and assume Swiss grouping falls out; use lib/format.ts's helpers.

**Expansion is length-dependent, not flat (round-2 delta, W3C "Text size in translation" restating IBM globalization data):** the shorter the source string, the larger the percentage expansion. Planning buckets: under 10 chars can expand 200-300 percent, 11-20 chars roughly 80-100, 21-70 chars roughly 40, 71+ roughly 30. This supersedes the flat 20-35 percent range for LABEL-scale strings: chips, tabs, buttons are the highest-expansion class, which is why the 3-word CTA lock earns its keep.

**RTL and CJK: out of scope by locale set (boundary line, judges' kill-list 2026-07-16).** Solen ships de/en/fr/it, all LTR Latin; RTL mirroring and CJK line-breaking mechanics enter this file only if an Arabic/Hebrew/CJK locale is ever planned.

---

## 10. Domain 10 (Solen-specific): touch ergonomics (owner-added 2026-07-15)

Extends domain 1's Fitts mechanics from SIZE to PLACEMENT. The D term (distance) is the half of Fitts's law the 44px floor does not cover.

**Thumb reach (T3, Hoober's observational research on one-handed phone grips):** on large phones the bottom-center third of the screen is the cheap zone; top corners are the expensive zone (regrip or second hand). Numbers vary by study and grip; treat magnitude as directional, the ORDERING (bottom-center cheap, top corners dear) is stable.
- Grounds: the sticky bottom commit CTA in booking (already shipped): the highest-value tap sits in the cheapest zone.
- Grounds: bottom sheets as the primary mobile pattern (grabber + drag): interaction stays in-zone.
- Candidate retrofits: destructive/rare actions belong in the expensive zone (top), never adjacent to the commit CTA (slip cost, Fitts W + error recovery); global Header back button is top-left, acceptable because back is a deliberate, low-frequency action.

**Slip adjacency (T2, touch-accuracy practice):** two targets whose consequences differ wildly (Bezahlen vs Abbrechen) need more than 8px separation or a size/prominence asymmetry; the mechanic is touch landing scatter (~7-9mm typical fingertip contact), which is also why 44px ~ 9mm is the floor.

---

## 11. Domain 11 (Solen-specific): enforcement (owner-added 2026-07-15)

The house lesson (PSYCHOLOGY.md section "Enforcement", owner 2026-07-07): docs get forgotten as context fills; only mechanical enforcement survives. The rationale layer gets the same treatment:

1. **Folklore-citation gate (to build via /harden in a main-repo session; this worktree session cannot write .claude/hooks):** a PreToolUse gate over _design-system/**.md and _plans/**.md edits that blocks the MYTH-table claims entering docs: golden ratio as law, Miller 7+/-2, "Lin 2004" whitespace, 60-30-10 as truth, plus a warn tier for new unsourced "N percent" claims (the existing stat-source-gate.py covers persuasion stats in replies; this extends the idea to design docs). Self-test per rule 12.5: one should-block input (a doc edit citing "golden ratio dictates our card proportions") and one should-pass ("1.618 is one available ratio, CONV").
2. **Reversibility audit (fold into the weekly estate self-audit, workstream 17):** for each principle added since the last run, check it names what it optimizes AND sacrifices; a principle whose opposite no competent team would choose gets demoted to the values list.
3. **Retrofit drift check:** when a LOCKFILE value changes, its rationale block here must change in the same commit (the block cites the literal; a stale literal in this file is drift). Candidate drift-checker rule once the retrofit lands.

---

## 12. Design folklore table (never cite; companion to PSYCHOLOGY.md's myth table)

| Claim | Status | What to do instead |
|---|---|---|
| Golden ratio governs beauty | MYTH (Markowsky 1992: canonical examples unsupported) | 1.618 is one available ratio if you like it; never "because phi" |
| Miller's 7+/-2 for menu/option counts | Superseded (Cowan 2001: ~4 chunks; recognition is not span-bound) | Cite Cowan for recall tasks only; menus are recognition |
| "Whitespace +20 percent comprehension (Lin 2004)" | FABRICATED attribution (real Lin 2004 is about older adults' hypertext retention; author refuted the misuse) | Cite Chaparro et al. 2004 (margins help reading speed/comprehension) |
| 60-30-10 color proportion | Interior-design folk rule, no empirical basis | Our 80/17 is an internal CONV budget, labeled as such |
| "Color X causes emotion Y" universals | Culture-bound conventions | Semantic conventions of our market, labeled CONV |
| Harmony schemes as laws | Scaffolds (Itten tradition), weak direct evidence | Use as starting constraints |
| "Doherty 400ms makes UIs addictive" | Dramatized (Halt and Catch Fire lore on a real 1982 finding) | Faster feedback raises throughput; operationalize as INP <= 200ms |
| Z-pattern scanning as an eyetracking fact | Unverified folk convention (no primary eyetracking source; NN/g's own zigzag research is critical of diagonal layouts) | Cite F-pattern (failure mode) and layer-cake (target), research/TASTE_HIERARCHY.md |
| A fixed strength ranking of hierarchy channels ("color beats size") | No validated ordering exists in any primary source | "Highest contrast to surroundings wins" (relative, Wikipedia/NN-g synthesis) |
| "German text expands exactly 30 percent" | Unsourced flat number (SOURCE.md:1075) | Treat as a 20-35 percent planning range, or measure our own strings |
| "reads warm by physiological convention" (SOURCE.md:232) | Unsourced perception claim | Keep the rule, drop the physiology, label CONV |
| ">=75 percent of expected traffic is mobile" (SOURCE.md:63) | Internal number with no source/date | Attach the analytics source + date, or soften to "majority mobile" |
| 10,000-hour rule | Gladwell misreading; Ericsson rejected it ("nothing special or magical about ten thousand hours"); Macnamara 2014 meta-analysis: deliberate practice explains 26/21/18/4/<1 percent of variance by domain | Practice matters and is not sufficient; never cite 10k hours (round 2, 2026-07-16) |
| 3-click rule | No empirical support (Porter/UIE 2003: satisfaction and success do not drop at click 3) | Information scent per click matters, not click count (round 2) |
| "8-second attention span, shorter than a goldfish" | Fabricated attribution chain, no primary source exists | Cite task-specific engagement data or nothing (round 2) |
| Golden ratio / Fibonacci as a UI proportion method (RULED 2026-07-17, the owner asked directly) | De Bartolo et al. 2022 (PsyCh Journal 11(5)), the modern replication: phi drew a "slight overall preference (53%, p<.001)" but "not as the modal, most selected, preferred ratio", and "found no significant preference in geometric stimuli", which is the exact category a card or panel is. Markowsky 1992 (College Mathematics Journal 23(1)) on the art-history half: "much of what is presented with respect to the golden ratio in art, architecture, literature, and aesthetics is false or seriously misleading". And the arithmetic ends it before the psychology does: 16 x 1.618 = 25.89 and 24 x 1.618 = 38.83, both off the 4pt grid, so every phi value must be rounded to ship | Use the closed 4pt set. What actually works is closure and repetition (T1, Wertheimer similarity), not the generator |
| Harmonic ratios (2:3, 3:4, 4:5) as visual law | The acoustics is real (overtone alignment, first-rate physics); the transfer from consonant SOUND to pleasing SIGHT is a Pythagorean analogy with no matching perception study, and every source consulted states it as assumed. Coincidence trap: Solen's 3:2 photo aspect IS the perfect-fifth ratio but is sourced to competitive measurement (LOCKFILE:1177), not music theory. Do not let anyone retrofit the story onto it | Cite the real source of a ratio, never the analogy |
| Le Corbusier's Modulor as a universal proportional law | Built on one arbitrarily chosen body, revised 1.75m to 1.83m because "in English detective novels, the good-looking men, such as policemen, are always six feet tall"; takes phi as an input so it inherits phi's weakness; answers a body-to-room question, not a screen question | Nothing to port |
| Face-symmetry attractiveness research as support for a UI symmetry claim | Different stimulus class, entangled with averageness; the UI-relevant symmetry evidence is detection speed and grouping (Huang/Pashler/Junge 2004, Wenderoth 1994), not beauty | Cite the detection/grouping work instead |
| "The 4pt grid keeps every value on a whole physical pixel" | FALSE on the web: real Android hardware reports non-integer devicePixelRatio (Pixel-class ~2.625), so a 4px token lands on a fractional physical pixel regardless (research GM-07) | Keep the grid, justify it by decision-reduction + rem-based scaling (WCAG 1.4.4) |
| Rule of thirds as perceptual law | Composition convention, weak perceptual evidence (same class as the golden ratio) | Use as a CONV heuristic, never as a justification (round 2) |
| Ego depletion / willpower as a depletable UX resource | Effectively dead: 2016 Registered Replication (23 labs, N=2141) d = 0.04, CI spans zero | Never build UX rationale on willpower depletion (round 2) |
| "Skeleton screens always beat spinners" | Contested: NN/g and controlled tests find skeletons can feel equal or slower; benefit depends on shape fidelity and duration | Our lock (Skeleton matching the final layout) is the variant that tests well; keep the lock AND the flag (round 2) |

House rule (global rule 15 applied to design): a recalled number is memory wearing a number. Attach a named checkable source, soften to qualitative, or cut.

---

## 13. Retrofit queue: the 12 load-bearing BARE rules (from the 2026-07-15 LOCKFILE audit)

Rules every component inherits that carry zero recorded why at their definition site. Retrofit = add a FORCES/MECHANIC block per section 1, values unchanged. Owner picked FULL scope (all ~47 bare rules); the full blocks live in section 14, this table stays as the priority index.

| # | Rule (file:line) | Grounding mechanic (tier) |
|---|---|---|
| 1 | Motion duration whitelist 80-500ms (LOCKFILE:575) | Section 7 thresholds: NN/g band + INP 200 + documented 420ms departure (T1-T2) |
| 2 | Easing curves snap/spring/glide/thud (LOCKFILE:581-585) | Section 7 easing semantics: decel-in / accel-out (T2) |
| 3 | Radius scale 12-28px (LOCKFILE:414-426) | Section 6 corners: Bar-Neta curvature preference (T2) + nested-radius mechanic; step values CONV |
| 4 | Type scale table (LOCKFILE:221-241) | Section 5: hand-tuned constraint system + 4-size screen budget as the real constraint (CONV) |
| 5 | Tracking set (LOCKFILE:324-331) | Optical size compensation: tighter at display sizes, looser at caps/small (CONV, type practice) |
| 6 | Container widths + breakpoints (LOCKFILE:815-836) | Section 5 measure: 45-75ch for text columns (CONV); device-class buckets (CONV) |
| 7 | HeartButton 44/32 (LOCKFILE:715) | Fitts + WCAG 2.5.5/2.5.8 + HIG 44pt (T1) |
| 8 | Icon stroke widths 1.9 vs 2 (LOCKFILE:1218,1279) | Optical weight matching to adjacent text (CONV); NOTE: internally inconsistent, reconcile |
| 9 | Z-index scale 400-700 (LOCKFILE:495-496) | Figure/ground layering order (T1 Gestalt); gap sizing CONV (insertion headroom) |
| 10 | Toast 4s / max 3 (LOCKFILE:611) | Reading-time floor (~200ms/word + margin) + attention thresholds (T2) |
| 11 | Sheet grabber + 90px dismiss (LOCKFILE:1392-1394) | Fitts along drag axis + accidental-flick guard (T1 mechanism, CONV values) |
| 12 | Elevation shadow stacks (tailwind elevation-1/2/3) | Figure/ground + single-light-source convention (CONV); earned-elevation tree in CONTROL_ELEVATION (already MEASURED) |

---

## 14. Retrofit blocks (full sweep, owner-picked 2026-07-15)

One 6-field block per BARE LOCKFILE decision unit (values verbatim, never changed here). Drafted by the 2026-07-15 sweep; each block cites the domain section holding its mechanic. When a LOCKFILE value changes, its block here changes in the same commit (section 11 item 3).

**Range: LOCKFILE sections 0-2.5 (hard rules, color, accent, typography, type registry) (8 blocks)**

### Decorative-glyph and emoji restriction (LOCKFILE:15)
DECISION: No emoji anywhere in code, files, UI, or commits; lucide-react icons only; only two typographic glyphs allowed (arrow, star); the middot is banned as a meta-separator and the bullet dot is banned as decoration except a live-status carve-out.
FORCES: expressive, playful UI signaling versus a calm, professional, restrained surface; fast ad-hoc glyph use in copy versus a closed, auditable icon and glyph vocabulary; decorative flourish versus every mark carrying real meaning.
OPTIMIZES FOR: restraint and a single consistent icon system a drift checker can enforce.
SACRIFICES: expressive shorthand (emoji, ad-hoc separators) some teams use for tone or scannability.
MECHANIC: house convention (CONV); the middot-specific ban notes a repeated owner rejection but with no date or study attached at this site, so treat as owner taste, undated.
SOURCE: LOCKFILE:15; RATIONALE.md section 0 (evidence tier definitions, CONV)

### No category branches in components (LOCKFILE:17)
DECISION: No `if (category === 'X')` branches in components; the same component renders for Coiffeur, Barber, Nails, Spa, Makeup, and Waxing without conditionals (drift rule B5).
FORCES: one shared component keeps every category visually and behaviorally in sync and caps maintenance surface, versus a per-category branch letting each vertical get UI tailored to its own needs (queue-heavy walk-ins versus appointment-only spas); one enforceable code path versus many specialized ones.
OPTIMIZES FOR: cross-category consistency and a single code path that can be drift-checked.
SACRIFICES: category-specific optimization; a vertical with genuinely different needs is still served by the same shape as every other vertical.
MECHANIC: house convention (CONV); no usability study grounds the no-branch choice specifically, it is a maintainability and consistency policy.
SOURCE: LOCKFILE:17; RATIONALE.md section 0 (evidence tier definitions, CONV)

### Semantic color vocabulary (LOCKFILE:18,64-80)
DECISION: No new semantic hues may be invented; every status color is drawn from one closed table: success/open green `#16A34A`, error `#D32F2F` (closed distinct at `#DC2626`), warning amber `#F1AE27`, info blue (`s-accent`), rating star `#FFC32B`, save/heart `#FF3366`, urgency burnt-amber `#C2410C`, surcharge orange `#EA580C`, escalated vermilion `#C03001`, disabled `s-ink-3`.
FORCES: brand or category color differentiation versus a disciplined, learnable color-to-meaning mapping; the temptation to pick a new hue for a new state versus keeping the palette auditable by a drift checker; visual variety versus consistent meaning across the whole product.
OPTIMIZES FOR: color as a stable, learnable meaning channel, so a given hue always means the same thing everywhere.
SACRIFICES: visual variety and any category- or brand-specific color accent.
MECHANIC: mixed tier; the red/error versus green/success pair sits on the highest-risk CVD axis and universal semantic conventions (star yellow, error red) have real grounding (RATIONALE.md section 3, CVD prevalence T1 and semantic-convention CONV); the closed-set governance itself and the specific non-red/green hex picks (amber, burnt-amber, vermilion, orange) are CONV, not measured.
SOURCE: LOCKFILE:18,64-80; RATIONALE.md section 3 (CVD prevalence T1; color psychology and harmony schemes CONV)

### Outcome-driven semantic color inheritance (LOCKFILE:84-86)
DECISION: A case's focal amount and state elements inherit their outcome color automatically (declined/canceled/void to red, refunded/approved/charged to green, pending to blue, closed/unknown to neutral, V3-D425); on outcome/status screens only, the primary CTA itself takes the same semantic color as a scoped exception to the default ink CTA (V3-D426), with an open caveat about red on a constructive retry action.
FORCES: a fully consistent color-is-the-message mapping across every outcome screen versus the default rule that only one ink CTA exists per screen; automatic inheritance removes per-screen judgment calls versus the risk of a jarring or ambiguous color, such as red on a try-again button that is not actually destructive.
OPTIMIZES FOR: never showing an outcome in a neutral color that could be misread as nothing having happened.
SACRIFICES: the single-ink-CTA discipline on outcome screens; clarity is not fully resolved for the retry-button case, which the rule itself flags as unresolved owner discretion.
MECHANIC: owner taste, undated; the rule asserts "color IS the message" as a philosophy but states no formal mechanism, study, or dated owner quote at its definition site.
SOURCE: LOCKFILE:84-86; RATIONALE.md section 3 (color psychology and harmony schemes, CONV)

### Cool-neutral surface and border tokens over warm (LOCKFILE:40,44)
DECISION: The neutral chrome layer is cool-toned: `s-border` `#E4E4E7` and `s-bg.sunken` `#F4F4F5`, both explicitly reversing an earlier warm/cream palette (`#E0DDDB`, `#F8F5F2`) under "v2 rule 4."
FORCES: a warm/cream neutral can read softer or more premium to some eyes versus a cool neutral reading cleaner; a photography-forward warm brand feel versus the B&W-first restraint model; consistency with a prior locked warm palette, shipped twice, versus the current cool reversal.
OPTIMIZES FOR: an unambiguous cool, clean base that lets photography and semantic color carry the warmth and life on the page.
SACRIFICES: the warm/cream option that was locked and shipped twice before (V3-D447, then again at V3-D460) and reversed both times without a stated formal reason at this site.
MECHANIC: owner taste, undated; the token table only states that v2 rule 4 reverses the warm choice, it does not explain warm versus cool at the definition site, and the value has oscillated across at least two prior locks.
SOURCE: LOCKFILE:40,44; RATIONALE.md section 0 (evidence tier definitions, CONV/owner-taste distinction)

### Type scale table (LOCKFILE:221-261)
DECISION: The 19-role typographic scale (Hero H1 through Star rating small) locks exact mobile/desktop px, weight, line-height, and tracking per role (for example Hero H1 40/64px, 700, 1.1, -0.02em; Section H2 18/20px, 600, 1.25, -0.01em), plus the Fresha-exact hero spacing chain (64px header-to-H1, 12px H1-to-sub, 64px sub-to-search-card).
FORCES: a mathematically derived ratio scale is easy to defend and extend versus a hand-tuned scale that can fit real content and real screens better; Uber's tighter, restrained scale versus Fresha's more editorial hero treatment, blended so the hero alone uses Fresha-exact sizing while everything below uses the Uber-aligned scale; a per-screen size budget versus the freedom to add a size wherever it seems to help.
OPTIMIZES FOR: a fixed, memorizable vocabulary of sizes that keeps every screen inside a small, countable type budget.
SACRIFICES: the internal defensibility of a true modular/ratio scale; the specific numbers cannot be derived from a formula, only from precedent.
MECHANIC: CONV, hand-tuned constraint system; the real constraint is the separately stated per-screen budget of four sizes and two weights, not a ratio (RATIONALE.md section 5, modular scale as CONV).
SOURCE: LOCKFILE:221-261; RATIONALE.md section 5 (modular scale CONV, hand-tuned constraint system)

### Canonical tracking value set (LOCKFILE:321-333)
DECISION: Letter-spacing is locked to seven canonical values mapped to specific roles: -0.02em Hero H1, -0.015em Page H2/Body large, -0.01em Section H2/Subsection H3, -0.005em Hero sub/Primary CTA/Secondary CTA, 0 Body/Meta/Tab label, 0.06em Tag/Status compact, 0.08em Eyebrow/Tag-Status default.
FORCES: tighter tracking at large display sizes optically compensates for bigger glyphs looking loose, versus looser tracking on small uppercase text compensating for cramped small caps; a small closed set that a drift rule can validate versus the roughly twenty ad-hoc values already found in the codebase.
OPTIMIZES FOR: a small, enforceable set (drift rule A8) that collapses prior sprawl into one vocabulary.
SACRIFICES: any callsite that genuinely needed a value between the canonical steps; those get logged to a migration file instead of accommodated.
MECHANIC: CONV, type-practice convention of tighter tracking at display sizes and looser tracking on caps/small text; no formula or study sets these exact seven numbers.
SOURCE: LOCKFILE:321-333; RATIONALE.md section 13 item 5 (tracking set, optical size compensation CONV)

### Per-screen type budget (LOCKFILE:319)
DECISION: On any single screen, type must draw from four or fewer distinct sizes and two or fewer distinct weights, counted before shipping; this is a hard rule, not the earlier soft "aim for" guidance.
FORCES: richer per-screen hierarchy (more sizes and weights to mark more distinctions) versus a scannable, fast-reading screen; matching what one specific screen's content seems to need versus a fixed budget applied uniformly everywhere.
OPTIMIZES FOR: fast visual scanning by capping the number of distractor size/weight classes on any one screen.
SACRIFICES: the ability to give a genuinely complex screen more graduated hierarchy than four sizes allow.
MECHANIC: T1, preattentive attribute pop-out weakens as distractor variety grows; each added size or weight is another distractor class that dilutes the hierarchy signal (RATIONALE.md section 2, preattentive attributes, Ware and Bertin).
SOURCE: LOCKFILE:319; RATIONALE.md section 2 (preattentive attributes T1)

**Range: LOCKFILE sections 3-4 (spacing, radius, shadow, depth, motion) (14 blocks)**

### Border radius scale (LOCKFILE:414-426)
DECISION: Radius tokens locked per role: card/panel/rounded-2xl 16px, card-lg 20px, rounded-3xl 24px, input 12px, sheet 28px, search/btn 99px, pill/rounded-full 9999px.
FORCES: a consistent silhouette across every surface type; enough granularity to tell card from hero from sheet apart; keeping the token count small so nobody eyeballs a new radius per component; pill shapes (9999px) must read as fully round at any width.
OPTIMIZES FOR: a small, memorable step set that lets different surface classes be told apart by feel (card vs sheet vs pill) without a formula for every case.
SACRIFICES: no stated reason 16 was chosen over 14 or 18, or why the steps run 12/16/20/24/28 instead of an even progression; a new component has to pattern-match to the nearest existing role rather than compute a value.
MECHANIC: section 6 corners, Bar and Neta 2006/2007 rounded-contour preference (T2) supports rounded over sharp in general; the specific step values (12, 16, 20, 24, 28, 9999) are a hand-picked set, CONV, not derived from a ratio or formula.
SOURCE: LOCKFILE:414-426; RATIONALE.md section 6

### Twin-control rule (LOCKFILE:435-437)
DECISION: Two controls sharing one purpose (back/skip, paired Ändern links, paired filters) must be the SAME component instance: identical size, radius, weight, color. Styling twins differently is called drift.
FORCES: signaling "these two do the same kind of thing" so a learned expectation from one transfers to the other; the engineering convenience of one reused instance; a local screen sometimes wanting a twin styled differently for a one-off reason.
OPTIMIZES FOR: predictability, a user who learns one control's behavior recognizes its twin instantly.
SACRIFICES: per-screen flexibility to tune a twin's weight or color for local emphasis.
MECHANIC: section 2 Gestalt similarity (T1), identical form is the grouping cue that tells the eye two elements are equivalent; styling them apart breaks that signal even when the underlying function is unchanged.
SOURCE: LOCKFILE:435-437; RATIONALE.md section 2

### Button padding ratio (LOCKFILE:439-440)
DECISION: Standalone buttons target horizontal padding at roughly 2x vertical padding (example 12px/24px); full-width CTAs are exempt because their height is driven by other layout rules.
FORCES: enough side padding that a label does not look pinched against the pill edge; not so much padding that it wastes width on dense mobile layouts; full-width CTAs are governed by tap-target height instead of a ratio.
OPTIMIZES FOR: a button silhouette that reads as a rounded pill with breathing room, not a tight label wrapped in an outline.
SACRIFICES: no stated reason the ratio is 2x rather than 1.5x or 2.5x, so the number is hand-tuned, not derived.
MECHANIC: house convention, CONV. No domain section in RATIONALE.md ties button aspect ratio to a formula; this is owner taste, undated.
SOURCE: LOCKFILE:439-440; RATIONALE.md (no domain section grounds this ratio; CONV)

### Spacing rhythm 32/12/16 tier scale (LOCKFILE:442-453)
DECISION: Three vertical spacing tiers apply sitewide: Section 32px between page sections, Card 12px between sibling cards, Group 16px between groups inside a card; larger one-off dimensions round to clean 5s/10s.
FORCES: enough separation between unrelated sections that they don't read as one block; enough closeness between sibling cards that they read as one list; a small enough token set that nobody invents mt-5 or mt-7; mobile needing more air than desktop without a second full scale.
OPTIMIZES FOR: a rhythm the eye can use to infer structure (what is grouped, what is separate) from gap size alone, without a heading or border saying so.
SACRIFICES: fine-grained control, a card that would look better at 14px between siblings has to round to 12 or 16 instead.
MECHANIC: section 2 Gestalt proximity (T1), space within a group must read as smaller than space between groups; the 32/12/16 relationship is exactly that ordering, applied as a three-step scale.
SOURCE: LOCKFILE:442-453; RATIONALE.md section 2

### Grouped list cards, one card per group (LOCKFILE:463-477)
DECISION: Any list of same-kind rows (services, per-staff Leistungen, booking services) renders as ONE grouped card per group (rounded-[24px] border border-s-border bg-white shadow-whisper overflow-hidden) with rows inside (px-5 py-[18px], border-t border-s-border first:border-t-0); separate bordered/shadowed cards per row are banned.
FORCES: rows in the same group need to read as one unit, not a stack of unrelated cards; a shadow or border per row adds visual weight that competes with content; selection inside a row needs its own affordance without adding another card boundary.
OPTIMIZES FOR: the group reading as one coherent object, with shared card chrome doing the boundary work so individual rows stay chrome-light.
SACRIFICES: a single row cannot carry independent elevation or be visually reordered outside its group without restructuring the card.
MECHANIC: section 2 Gestalt common region (T1), one bounding shape enclosing several rows signals "belongs together" more strongly than matching styles on separate cards would.
SOURCE: LOCKFILE:463-477; RATIONALE.md section 2

### Box shadow elevation value table (LOCKFILE:481-486)
DECISION: Three elevation levels plus a pressed state, each a fixed two-layer rgba(50,47,44,...) stack: elevation-1 (0 1px 3px .04, 0 1px 2px .03), elevation-2 (0 4px 12px .08, 0 2px 4px .04), elevation-3 (0 8px 28px .12, 0 4px 10px .06), pressed (0 1px 1px .12, inset 0 1px 2px .06).
FORCES: each level needs to read as visibly more lifted than the last without the top level looking pasted on; the shadow color needs to feel like real cast shadow, not a flat gray box; blur and spread must both grow with elevation, not opacity alone.
OPTIMIZES FOR: a small set of surfaces (1, 2, 3) that read as a consistent depth ladder anywhere in the app, so a resting card, a hovered card, and a modal are distinguishable by elevation alone.
SACRIFICES: no stated reason for the exact blur, spread, and opacity numbers at each step; extending the ladder later has no formula to extend from, only pattern-matching to the nearest step.
MECHANIC: section 2 Gestalt figure/ground (T1) grounds why a shadow is used at all (it signals a surface floating above another); the specific rgba stack and the single consistent shadow color across all three levels reflect a single-light-source convention, CONV, not a measured value.
SOURCE: LOCKFILE:481-486; RATIONALE.md section 2

### Z-index scale (LOCKFILE:494-497)
DECISION: Layering fixed at sheet-bg 400, sheet 410, modal-bg 500, modal 510, toast 600, tooltip 700, header/tab-nav z-50, sticky-rail z-30.
FORCES: overlays must stack in a predictable order (a toast above a modal, a modal above a sheet) regardless of DOM mount order; each layer needs headroom so a future overlay type can be inserted without renumbering everything; the sticky header must stay below any overlay but above normal content.
OPTIMIZES FOR: an unambiguous, once-decided stacking order that every new component just plugs into instead of guessing a number.
SACRIFICES: the 100-point gaps between tiers are generous headroom that is never explained; inserting a new layer type means picking a number by convention, not by rule.
MECHANIC: section 2 Gestalt figure/ground layering order (T1), what sits on top must be the most urgent or most recently invoked surface; the specific gap size between tiers (100) is CONV, chosen for insertion headroom, not derived.
SOURCE: LOCKFILE:494-497; RATIONALE.md section 2

### Surface rule, gray tray vs white placement (LOCKFILE:510-516)
DECISION: s-bg-sunken (#F4F4F5) is a grouping tray, not a global wash: gray sits under grouped lists/settings/forms/dashboard panels/card clusters; white stays for the feed, content/profile pages, heroes, and modals/sheets; alternate gray and white down a page for rhythm, never make the whole app one or the other.
FORCES: a white card needs something to visibly lift off of, or "elevation" reads as nothing; a photo-forward feed needs a white background so photos hold full contrast; a long page needs alternation so it doesn't read as monotonous in either color; making the whole app one color each collapses the distinction the rule exists to create.
OPTIMIZES FOR: the white card always having a visible reason to look lifted, sitting on a slightly darker tray, instead of the lift being asserted by shadow alone.
SACRIFICES: a second background color to keep consistent everywhere, and a placement rule (gray here, white there) that a person has to apply by reading section-by-section guidance rather than derive automatically.
MECHANIC: section 2 Gestalt figure/ground (T1), a lighter object reads as in front of a darker field because of relative contrast, not shadow alone; the gray tray supplies that contrast so the white card's elevation registers. Which specific page sections get gray versus white is CONV, an editorial choice, not a formula.
SOURCE: LOCKFILE:510-516; RATIONALE.md section 2

### Default surface depth, drop hairline when elevated (LOCKFILE:518-522)
DECISION: Product cards and surfaces get elevation-1 at rest by default; a card that carries elevation must drop border-s-border (1px border plus flat, unshadowed card together is called "the dated tell"); hairlines stay only as dividers inside a grouped list.
FORCES: a card needs some depth cue to read as liftable, not a flat rectangle; combining a hairline border with elevation risks two competing depth signals at once; removing the border entirely risks the card losing a visible edge on some light backgrounds.
OPTIMIZES FOR: one depth cue per card, either the shadow or the hairline, never both, so the edge treatment stays legible and doesn't look indecisive.
SACRIFICES: a small amount of edge definition on light backgrounds, since a shadow at rest is subtler than a hairline at close range.
MECHANIC: the redundant-cue argument (why not stack both) is section 2 figure/ground (T1), a border and a shadow are both edge cues and doubling them adds noise, not clarity. The claim that border-plus-flat specifically "reads dated" is a style-trend judgment, owner taste, undated, no perceptual formula backs the word "dated."
SOURCE: LOCKFILE:518-522; RATIONALE.md section 2

### State matrix, interactive state values (LOCKFILE:526-532)
DECISION: Card, Primary button, Photo chip, List row, and Input each get a fixed rest/hover/pressed/selected/focus/disabled value set, for example Card: white+elevation-1 rest, translateY(-2px)+elevation-2 hover, scale(.985)+elevation-1 pressed, ring-2 s-ink+elevation-2 selected, ring-2 s-accent offset-2 focus, opacity .45 no shadow disabled; Primary button: bg-s-ink+elevation-2+inset top-highlight rest, elevation-3+translateY(-1px) hover, scale(.97)+pressed shadow pressed.
FORCES: every interactive primitive needs a visually distinct signal per state so a user knows what is hovered, pressed, selected, or disabled without reading text; the six states must stay distinguishable from each other on the same element; the values must stay cheap to animate (transform and shadow, not layout properties).
OPTIMIZES FOR: state legibility, the difference between resting, pressed, and selected should never be ambiguous, across every primitive in the system.
SACRIFICES: a large, fixed value matrix every new primitive must be checked against; no formula generates a new primitive's state values, they have to be hand-picked to feel consistent with the existing five.
MECHANIC: section 2 preattentive attributes (T1), a state change needs a single popping-out difference (position, elevation, ring) to register in under 250ms; section 7 easing semantics grounds which motion curve rides with which state change (thud for pressed, glide for hover lift). The specific pixel and scale values themselves (2px lift, .985 scale, ring-2) are CONV, tuned by eye.
SOURCE: LOCKFILE:526-532; RATIONALE.md section 2, section 7

### Loading, outcome confirmation, and no-gesture-only rules (LOCKFILE:534-549)
DECISION: Any control triggering async work shows inline feedback (label plus a 15px spinner, opacity .85, pointer-events none) and greys out on navigation; completing an action confirms at both the control (heart fills, row check, icon swaps to check) and the destination (favorites badge, sticky total, confirmation screen); no action is ever gesture-only, every swipe/drag affordance has a visible button twin.
FORCES: an async action with zero visible feedback reads as broken; confirming only at the control risks the user not trusting the action landed anywhere; confirming only at the destination is too late for the moment of the tap; a gesture-only control excludes anyone who cannot perform that specific gesture.
OPTIMIZES FOR: the user never wondering whether a tap registered, and never being locked out of an action because they can't perform a gesture.
SACRIFICES: extra implementation surface, every gesture needs a maintained button twin, and every action needs two confirmation points instead of one.
MECHANIC: the inline-loading rule is grounded in section 7 response thresholds (T1-T2, Doherty and Thadani 1982, Nielsen 1993), feedback under roughly one second keeps the user in flow and its absence reads as failure. The dual confirmation-at-both-ends rule and the no-gesture-only requirement are not covered by a domain section in RATIONALE.md; both are house convention, CONV.
SOURCE: LOCKFILE:534-549; RATIONALE.md section 7 (loading only; confirmation and gesture-twin rules uncovered, CONV)

### Motion per-transition mapping table (LOCKFILE:553-559)
DECISION: Fixed duration/easing pairs per transition type: hover lift on cards 200ms glide, press (button/chip/card) 150ms thud, sheet/modal open 300ms glide, select toggle/scrim swap 200ms snap, color/focus ring 150ms snap.
FORCES: a small interaction (color change, focus ring) needs to feel instant; a large interaction (a sheet sliding the height of the screen) needs enough duration to read smooth rather than a jump cut; every transition on the same element type needs the same timing across screens.
OPTIMIZES FOR: matching motion duration to the visual distance or scale of the change, small fast, large proportionally slower, using only the already-locked duration and easing tokens.
SACRIFICES: no independent justification per row, so a reader cannot see why sheet-open is 300ms and not 250 or 350; the mapping applies the general duration/easing tokens rather than deriving new ones.
MECHANIC: section 7, duration scales with distance and size (CONV, Material motion practice), small toggles land near 100-150ms and screen-scale moves trend toward 300ms or more; this table applies that convention row by row.
SOURCE: LOCKFILE:553-559; RATIONALE.md section 7

### Motion duration whitelist (LOCKFILE:572-576)
DECISION: Only six duration values are canonical: 80ms, 150ms, 200ms, 250ms, 300ms, 500ms; any other duration is drift.
FORCES: enough granularity that a micro-interaction and a screen-level change each get an appropriately different duration; few enough values that no two developers pick slightly different numbers for the same kind of transition; headroom for one deliberately slower recipe without opening the whole scale.
OPTIMIZES FOR: consistency, every transition in the app draws from the same short list so timing never drifts component by component.
SACRIFICES: a transition that would look best at, say, 175ms or 400ms has to round to a neighboring canonical value instead.
MECHANIC: section 7 response thresholds (T1-T2), Miller 1968 and Nielsen 1993's roughly 0.1s/1s/10s bands and the modern INP <=200ms floor bound the low and mid end; NN/g's micro-feedback ~100ms, screen-level 200-300ms, and "500ms feels like drag" guidance cover the rest. The list sits inside that band, apart from the separately documented 420ms entrance recipe, which is not one of these six values and is recorded elsewhere as a deliberate departure.
SOURCE: LOCKFILE:572-576; RATIONALE.md section 7

### Easing function set (LOCKFILE:578-585)
DECISION: Four named easing curves are locked: snap cubic-bezier(0.4,0,0.2,1) for standard UI (focus, color), spring cubic-bezier(0.34,1.56,0.64,1) for bouncy reveal (toggle, check), glide cubic-bezier(0.16,1,0.3,1) for long-distance smooth motion (sheet open), thud cubic-bezier(0.7,0,0.84,0) for press-down feel (button scale).
FORCES: an entering element should feel like it decelerates into place, not slam to a stop; an exiting or pressed element should feel like it accelerates away, not linger; a genuinely continuous state (a progress indicator) needs a curve that doesn't imply arrival; a celebratory moment benefits from a small overshoot a strictly monotonic curve can't produce.
OPTIMIZES FOR: each curve's shape matching the physical read of the motion it's assigned to, so the animation reinforces what happened (arrived, pressed, dismissed) instead of fighting it.
SACRIFICES: only four curves to choose from, an interaction that wants a fifth distinct feel has to reuse the nearest existing curve instead of a purpose-built one.
MECHANIC: section 7 easing semantics (T2, Material motion research), decelerate curves for entrances, accelerate curves for exits, standard in-out for in-place moves, overshoot only for earned reveal moments. Snap, thud, glide, and spring each map cleanly onto that semantic set.
SOURCE: LOCKFILE:578-585; RATIONALE.md section 7

**Range: LOCKFILE sections 5-7 + 11 (primitives, copy, layout, imagery) (11 blocks)**

### Toast auto-dismiss and max visible (LOCKFILE:604-614)
DECISION: Toasts (`toast.success/error/warning/info`) auto-dismiss after 4s, maximum 3 visible at once.
FORCES: enough time for the user to read the message; not letting stale confirmations pile up on screen; auto-dismiss removes the need for a manual close action; a message that vanishes before it is read is worse than none.
OPTIMIZES FOR: a screen that stays current, nothing lingers past its relevance window.
SACRIFICES: slower readers, distracted users, or longer description text can lose the message before finishing it; no stated reopen path once it dismisses.
MECHANIC: section 7 names the general attention-holding band ("1s keeps flow, 10s loses attention," Miller 1968, Nielsen 1993, T1-T2) but records no reading-speed formula for these specific numbers. The 4s duration and 3-toast cap are house convention (CONV).
SOURCE: LOCKFILE:604-614; RATIONALE.md section 7

### HeartButton hit-area and visible-circle split (LOCKFILE:705-716)
DECISION: HeartButton uses a 44px tap hit area with a 32px visible circle, pink #FF3366 fill when saved.
FORCES: touch accuracy needs a large enough target; a 44px visible mark would look oversized against the 14-16px text it sits beside; the control's visual weight has to stay proportionate to its row.
OPTIMIZES FOR: tap reliability without inflating the visual footprint of a small secondary control.
SACRIFICES: the true hit area is invisible, so the control looks smaller than it acts, a user judging tappability by eye alone underestimates the target.
MECHANIC: section 2 names this exact split as a worked Fitts's Law example (the hit area is the W term, not the paint, T1); section 6 supplies the standards floor it sits above (WCAG 2.5.8 AA 24x24, WCAG 2.5.5 AAA 44x44, Apple HIG 44pt, T1).
SOURCE: LOCKFILE:705-716; RATIONALE.md section 2, section 6

### Primitive size ladders, TabPill and StatusInline (LOCKFILE:640-651,666-676)
DECISION: TabPill sizes are sm=32px, md=40px. StatusInline sizes are sm=13, md=15, lg=16.
FORCES: components need a compact variant for dense rows and a larger one for standalone use; the frozen type scale and the 44px touch-target floor pull against fitting a control into a tight row.
OPTIMIZES FOR: a small closed set of reusable sizes instead of ad hoc per-instance values.
SACRIFICES: both TabPill sizes sit below the 44px touch-target floor set in the design contract, trading full Fitts-compliant tap area for visual compactness; StatusInline's 13/15/16 ladder is a local set, not drawn from the frozen type-scale role table.
MECHANIC: section 6 gives the target-size standards (WCAG 2.5.8 AA 24x24, WCAG 2.5.5 AAA 44x44, T1) that 32/40 falls between without matching either; section 5 frames the type scale as a hand-tuned constraint system, not a derived ratio (CONV). No mechanic derives 32, 40, 13, 15, or 16 specifically.
SOURCE: LOCKFILE:640-651,666-676; RATIONALE.md section 5, section 6

### Status copy pattern, open/closed plus detail (LOCKFILE:743-746)
DECISION: Open renders as `"Geöffnet"` alone or `"Geöffnet · Schliesst um HH:MM"`. Closed renders as `"Geschlossen"` alone, `"Geschlossen · Öffnet HH:MM"`, or `"Geschlossen · Öffnet {Weekday} um HH:MM"`.
FORCES: a short state word reads fastest; the time detail adds a genuinely different fact (when, not just whether); StatusInline already renders the first word in green or red against a muted second clause.
OPTIMIZES FOR: packing state plus its most useful detail into one line.
SACRIFICES: the middot between the color-coded word and the muted clause duplicates a boundary the color contrast is already carrying, which is the exact pattern the project's own separator rule warns against (existing contrast IS the separator, do not add a middot too). This block records that tension, it does not resolve it.
MECHANIC: section 2 states this exact principle directly: "the divider rule (taste rule 2, existing contrast IS the separator): adding a middot between two already-differentiated tokens double-encodes one boundary" (T1, Gestalt). The rule is grounded; this specific instance is not reconciled against it.
SOURCE: LOCKFILE:743-746; RATIONALE.md section 2

### Service-row format and price-string convention (LOCKFILE:772-778,793)
DECISION: Service rows stack name (15-16/600/ink), duration (13-14/400/muted ink-2), and `"ab {price} CHF"` (14-15/700/ink). The salon-card price line instead uses `"ab CHF {N}"` (CHF as prefix, not suffix).
FORCES: a 3-line stack needs a size/weight order that reads name first without a heavier row competing for attention; the price string needs to read as an estimate ("ab", from) not a fixed total; a listing card has less width than a service row.
OPTIMIZES FOR: name as the clear anchor by size, price as a secondary ink element distinguished by weight rather than size.
SACRIFICES: the two surfaces render the same fact ("from CHF N") in mirrored word order, one prefixed, one suffixed, with no stated reason for the divergence, a real consistency cost for anyone who sees both surfaces close together.
MECHANIC: section 2 grounds size-led hierarchy and the one-ink-anchor pattern (preattentive size ordering, T1); section 5 grounds the type sizes as a hand-tuned constraint system (CONV). No mechanic explains the prefix/suffix divergence between surfaces; that detail is CONV and unreconciled.
SOURCE: LOCKFILE:772-778,793; RATIONALE.md section 2, section 5

### Duration format convention (LOCKFILE:780)
DECISION: Duration renders as `"{n} Min."` under 60 minutes, `"{h} Std."` on exact hours, `"{h} Std., {rem} Min."` when mixed.
FORCES: exact minutes matter for short appointments; a clean hour count reads faster than a redundant ", 0 Min."; German unit order differs from English.
OPTIMIZES FOR: the shortest correct string for each duration shape.
SACRIFICES: three branching formats instead of one constant pattern, more surface area for a locale bug (this rule is German-only, FR/IT/EN equivalents are not specified at this site).
MECHANIC: section 9 covers locale numerics generally (tabular figures, CHF formats, Swiss convention, CONV) but does not state this specific branching rule. It is a house formatting convention (CONV), not a cited standard.
SOURCE: LOCKFILE:780; RATIONALE.md section 9

### Brand voice register (LOCKFILE:801-807)
> **REVERSED 2026-07-29, supersedes the register half of this entry.** The owner took the product
> FORMAL: *"make it the Sie instead of the du"* , `Sie` (de), `Lei` (it), `vous` (fr). The live law is
> `COPY_LAW.md` §1, which also carries the measured starting point and the counter-evidence, so it is
> not re-argued here. The ADR below is KEPT UNCHANGED as the record of what the informal call had been
> reasoned from , the SACRIFICES line in particular named the exact failure (formal categories reading
> `du` as under-formal for the price point) that the reversal acted on. The no-exclamation, no-emoji
> and no-over-capitalization halves of this entry are UNTOUCHED and still live.

DECISION: Copy always uses `"du"` (never `"Sie"`), no exclamation marks, no emoji, no over-capitalization; speed and urgency get dedicated patterns ("Termin in 30 Sek." for speed, "Nur noch X heute" for urgency).
FORCES: informal address reads warmer and faster; formality signals distance in Swiss German consumer contexts; restraint (no exclamation, no caps) reads as confidence rather than salesmanship; speed/urgency copy has to stay honest rather than hyped.
OPTIMIZES FOR: a calm, informal, confident tone held constant across every surface.
SACRIFICES: users in more formal service categories (higher-end spa, medical-adjacent treatments) may read "du" as under-formal for the price point; this is a market-wide choice with no per-category exception recorded.
MECHANIC: no perceptual or empirical mechanic governs formality register. This is a market/brand convention (CONV), the same claim-shape as the color-psychology conventions in section 3 ("universal SEMANTIC convention... plus brand restraint").
SOURCE: LOCKFILE:801-807; RATIONALE.md section 3 (CONV framing, by analogy)

### Salon-card secondary badges, urgency and featured (LOCKFILE:791-792)
DECISION: Urgency badge reads `"Nur noch {N} heute"` with a Flame icon. Featured badge `"EMPFOHLEN"` appears only in listings, never on the PDP hero.
FORCES: scarcity information can genuinely help a time-pressed booker; a featured label helps a scanning list stand out; the same label on a PDP (where the user already chose this salon) would be redundant since the decision to view is already made.
OPTIMIZES FOR: showing decision-relevant badges only where a decision is still being made (the listing), not after (the PDP).
SACRIFICES: no threshold is stated for what counts as "featured" or how the urgency count N is computed, so both badges risk reading as decorative unless the backing data logic is equally rigorous; this line only locks the copy and placement, not the data source.
MECHANIC: this is a scarcity/social-proof framing question, which belongs to PSYCHOLOGY.md's behavioral-law domain, not to this file's perceptual mechanics (sections 2-11). No RATIONALE.md mechanic applies; recorded as house convention (CONV).
SOURCE: LOCKFILE:791-792; no RATIONALE.md section applies, CONV

### Container widths and breakpoints (LOCKFILE:813-839)
DECISION: Page and hero content cap at `max-w-[1280px]`, salon PDP grid at `max-w-[1180px]`, /business hero at `max-w-[1400px]`, search bar at `md:max-w-[820px]` desktop / `max-w-[540px]` mobile, FAQ section at `max-w-[820px]`. Breakpoints: sm 640px, md 768px, lg 1024px, xl 1280px, 2xl 1536px, mobile-first below md.
FORCES: a wide container reads faster on large monitors but produces uncomfortably long text lines; a narrow container protects reading comfort but wastes space on photo-heavy or grid surfaces; different surfaces (text-heavy FAQ vs photo grid PDP) want different caps.
OPTIMIZES FOR: per-surface width caps tuned to what each surface actually holds.
SACRIFICES: seven different max-width values in one system, a larger permitted set than a single global cap, each new surface has to pick from or add to the list rather than inherit one number.
MECHANIC: section 5's measure guidance (45-75 characters per line, about 66 ideal, CONV) is the closest applicable mechanic for the text-column caps (FAQ, search bar); it does not on its own derive 1280, 1180, or 1400 for the wider layout containers. Those are CONV device-class buckets, not measure-derived.
SOURCE: LOCKFILE:813-839; RATIONALE.md section 5

### Sticky header and nav layering plus offsets (LOCKFILE:825-831)
DECISION: Site header `sticky top-0`, h=79px, z-50. CityTopBar (above header when mounted) `sticky top-0`, h=52px. Salon sticky tab nav `fixed top-0`, h=~52px, z-[60], above the site header. Sidebar sticky-pinned at `top-24` (96px clearance). Anchor scroll-margin `scroll-mt-24`.
FORCES: multiple sticky elements can stack on top of each other and need an unambiguous order; a sidebar pinned too close to the header collides with it on scroll; anchor-jump targets need clearance so a jumped-to heading is not hidden under the sticky header.
OPTIMIZES FOR: a fixed, non-overlapping stacking order where the most contextually specific bar (the salon tab nav) wins over the global header.
SACRIFICES: every new sticky element has to be slotted into this z-order by hand, there is no scale-based derivation, a future addition can silently collide if its z-index is not chosen against this exact list.
MECHANIC: section 2 grounds figure/ground layering as a Gestalt principle generally (T1), supporting that SOME order should exist, but it does not derive these specific z or height numbers. The 79/52/96 pixel values are CONV, sized to the components' own measured heights, not to a formula.
SOURCE: LOCKFILE:825-831; RATIONALE.md section 2

### Grid pattern set, carousels, result grids, galleries, bento (LOCKFILE:841-848)
DECISION: Salon-card carousel `gap-3` (12px) mobile, `gap-5` (20px) desktop. Search result grid `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` (2-col when map open). Team carousel cards `w-[112px] md:w-[120px]`, `gap-6`. Photo gallery 1+2 layout at 3+ photos, 1+1 split at 2 photos. Bento grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-2`.
FORCES: more columns show more at once but shrink each card below a useful size on narrow screens; a fixed gap has to read as one group without wasting width; a map-open state has to give up a column to the map.
OPTIMIZES FOR: per-surface column and gap combinations tuned to what fits at each breakpoint, adjusting for context.
SACRIFICES: five separate grid recipes (carousel, result grid, team carousel, gallery, bento) instead of one shared grid primitive, so a spacing change to one does not propagate to the others.
MECHANIC: section 2 grounds gap-as-grouping-signal (proximity, Gestalt, T1: space within a group less than space between groups); section 6 grounds the gap values themselves (4pt grid CONV: gap-3, gap-5, gap-6 are all multiples of 4). The specific column-count breakpoints (2/3/4, 1/2) are CONV device-class buckets, not derived from either mechanic.
SOURCE: LOCKFILE:841-848; RATIONALE.md section 2, section 6

Note for the orchestrator (outside the block format above): section 11, Imagery Pattern Registry (LOCKFILE:1108-1167), yielded zero BARE units. Every rule there already carries a measured reference (the Uber inventory citation at 1108-1110 and again at 1163-1165), a dated owner approval (DS-10 scrim recipe, 2026-06-11; the border-radius exception, V3-D350), or is pure process bookkeeping (sourcing/scheduling policy at 1148-1150, the migration-mapping work-tracking table at 1152-1161). This is consistent with RATIONALE.md's own status line, which records the owner declining to add an imagery domain on 2026-07-15, so no new imagery rationale should be merged in.

**Range: LOCKFILE sections 12-16 (dashboard skin, icons, cards, vibe, sheets) (12 blocks)**

### Icon stroke width inconsistency (LOCKFILE:1218,1279-1280)
DECISION: Inline Lucide glyphs default to stroke width `1.9` (`2.8-3` only on a check inside a filled disc); the icon-size pairing table separately sets Lucide `strokeWidth 2` (`1.75` at >=24px). Two different default stroke widths asserted for the same monochrome icon system.
FORCES: a lighter stroke reading quietly next to 14px body text versus matching Lucide's own shipped default; optical parity with Inter Tight's stroke contrast versus internal consistency across the two spec sites.
OPTIMIZES FOR: at each site, a locally reasoned stroke choice (contrast against a filled disc at 1218; presumably Lucide's default at 1279).
SACRIFICES: a single consistent stroke width across the whole icon system, whichever value ships becomes silent drift from the other.
MECHANIC: optical weight matching to adjacent text is the plausible logic, but it is asserted, not derived, house convention (CONV). RATIONALE.md's own retrofit queue already names this exact pair as internally inconsistent and unretrofitted.
SOURCE: LOCKFILE:1218,1279-1280; RATIONALE.md section 13 (retrofit queue, item 8)

### Stepper node visual recipe (LOCKFILE:1228-1234)
DECISION: Stepper nodes are 42px discs: done = `bg-s-accent` #276EF1 fill + white 18px step-icon (stroke 2) + `text-s-ink` 10.5px/600 label; current = white disc with `inset 0 0 0 2px #276EF1, 0 0 0 5px rgba(39,110,241,.14)` + blue 18px icon + `text-s-ink` 10.5px/700 label; upcoming = `bg-s-bg-sunken` #F4F4F5 + `text-s-ink-3` icon and 10.5px/600 label. Connector: `bg-s-border` #E4E4E7, 2px, `border-radius: 2px`, centered at `margin-top: 20px`.
FORCES: enough size/contrast for three states to read at a glance versus keeping the tracker compact on a mobile top bar; an inset ring plus halo for "current" versus a plainer treatment.
OPTIMIZES FOR: instant state legibility (three visibly distinct disc treatments) at a small footprint.
SACRIFICES: any argued reason for the exact pixel values (42px, 18px, 10.5px, 2px ring, 5px halo) over other equally legible numbers.
MECHANIC: no formal mechanic for the specific pixel values, house convention, undated (CONV). The blue-versus-green color choice itself is separately grounded by a dated owner quote at LOCKFILE:1226 (2026-06-11); the geometry is not.
SOURCE: LOCKFILE:1228-1234

### Stepper orientation threshold (LOCKFILE:1239-1241)
DECISION: Trackers use horizontal icon-above-text layout by default for trackers with <=4 nodes (36px discs); a longer setup checklist of 5+ items switches to vertical icon-left-of-text layout.
FORCES: legible node spacing on a mobile top bar (more nodes shrinks each disc/label) versus a vertical list that scales to any length but costs screen height.
OPTIMIZES FOR: readable node spacing at the top of a mobile screen.
SACRIFICES: any stated reason the cutoff sits at 4 rather than 3 or 5, the number is asserted, not derived.
MECHANIC: a viewport-width/legibility constraint is the plausible driver but is not stated or measured at the site, house convention, undated (CONV).
SOURCE: LOCKFILE:1239-1241

### Icon zone segregation (LOCKFILE:1294-1295,1428-1430)
DECISION: Different icon styles may coexist only within visually separate zones: Lucide UI glyphs own rows/buttons/chrome; the 3D category icon set (`/icons/categories/*.png`) owns category tiles, section headers, and empty-state accents. Mixing the two styles inside one zone is drift.
FORCES: the warmth/richness of a 3D icon set for browsing surfaces versus the flat monochrome-Lucide restraint used everywhere else; one unified icon language for consistency versus two languages for differentiated zones.
OPTIMIZES FOR: letting the richer 3D set do emotional/browsing work in specific zones without diluting the restrained Lucide system elsewhere.
SACRIFICES: a single unified icon language across the product; the zone boundary is policed by convention, not by anything mechanically checkable.
MECHANIC: no formal mechanic; house convention, undated (CONV), loosely parallel to the same-family-two-cuts logic used for Inter/Inter Tight (RATIONALE.md section 5, T2) but that parallel is not argued at the site.
SOURCE: LOCKFILE:1294-1295,1428-1430

### Card grammar 5-step recipe (LOCKFILE:1301-1311)
DECISION: Every card/list-item is built in the fixed order Group, Rank, De-label, Icon the details row, One differentiated element; "Label: value" pairs are explicitly rejected as "a spreadsheet, not a card."
FORCES: fast scanning of grouped, ranked, de-labeled facts versus completeness (explicit labels remove ambiguity but add visual noise); one differentiated element per card for a clear anchor versus showing every fact with equal weight.
OPTIMIZES FOR: fast visual scanning across a list of cards.
SACRIFICES: explicit labels that would remove ambiguity on genuine edge cases; a card with two truly important facts still has to pick one anchor.
MECHANIC: proximity/grouping and figure-ground Gestalt principles ground steps 1-2 (section 2, T1); step 5 is the same preattentive one-ink-anchor mechanic already grounded for card anchors elsewhere in LOCKFILE (section 2, T1); de-labeling (step 3) maps to processing fluency, fewer redundant tokens read faster (section 8, T2). None of this is cited at the §14.1 site itself.
SOURCE: LOCKFILE:1301-1311; RATIONALE.md section 2, section 8

### Divider decision rule (LOCKFILE:1313-1319)
DECISION: Dividers follow a ladder: gap-only separation by default; a hairline `border-s-border/60` only inside dense receipt-style clusters (price breakdowns, booking summaries); alternating row tint only in true data tables (dashboard); "a divider next to generous padding = delete the divider."
FORCES: visual separation between grouped items versus adding a line that duplicates whitespace already doing that job; dense numeric clusters that benefit from a hairline anchor versus open lists that don't need one.
OPTIMIZES FOR: whitespace as the primary separator, reserving a drawn line for cases where whitespace alone is ambiguous.
SACRIFICES: a uniform divider treatment everywhere, three case-by-case rules is more decisions per screen, not fewer.
MECHANIC: Gestalt proximity, whitespace encodes relationship, space within a group should read differently than space between groups (section 2, T1); the same mechanic RATIONALE.md already applies to the middot-separator ban, not cited at this specific site.
SOURCE: LOCKFILE:1313-1319; RATIONALE.md section 2

### Personality zone table (LOCKFILE:1356-1365)
DECISION: Personality (playful copy, illustration, animation) is allowed in 404/error pages, empty states, success moments, and onboarding; it is banned in booking flow/checkout/pay and in queue tracker/search results/PDP chrome.
FORCES: brand warmth and human voice versus the risk personality reads as friction or distraction mid-task (payment, search, tracking a queue); differentiation from "corporate" competitors versus trust and speed in money-moving flows.
OPTIMIZES FOR: task completion and trust in the funnel; brand warmth everywhere the user isn't mid-transaction.
SACRIFICES: a consistent brand voice across the whole product, the funnel reads comparatively plain next to the rest of the app, by design.
MECHANIC: no dated owner quote or formal study grounds this specific zone list at the site (the section-level "owner-approved, 2026-06-11" tag is provenance, not an argued rationale); it loosely parallels processing fluency's fewer-distractor-classes-reads-faster logic (section 8, T2) in the funnel, but that mapping is not stated, house convention, undated (CONV).
SOURCE: LOCKFILE:1356-1365

### Sheet grabber + drag-dismiss threshold (LOCKFILE:1392-1394)
DECISION: Every sheet has a 38×4.5px `bg-s-border` grabber pill centered 6px from the top; dragging follows the finger and releases home under ~90px, dismissing past that threshold; tap-outside and a visible control remain as non-gesture alternatives.
FORCES: a forgiving dismiss target versus accidental dismissal from a small drag; discoverability of a gesture-only interaction versus keeping a visible fallback control.
OPTIMIZES FOR: a dismiss gesture that is hard to trigger by accident but easy to complete on purpose.
SACRIFICES: any argued reason for exactly 90px, or exactly 38×4.5px for the grabber, over a smaller or larger target.
MECHANIC: the ~90px release threshold is a Fitts's Law target along the drag axis (section 2, T1). RATIONALE.md's own retrofit queue already names this exact rule as the target for that mechanic, but the LOCKFILE site does not cite it.
SOURCE: LOCKFILE:1392-1394; RATIONALE.md section 2

### Sheet background recede treatment (LOCKFILE:1395-1397)
DECISION: Opening a sheet scales the page behind it via `translateY(10px) scale(.965)` + `border-radius 22px` + `brightness(.96)`, animated over 320ms `glide` (reversing on close), under a `rgba(10,10,10,.42)` dim layer; recorded only as "Option B (owner pick)."
FORCES: signaling depth/hierarchy (the sheet is now focus, the page recedes) versus the cost of animating the whole page behind an overlay; a subtle recede versus a plain dim-only backdrop.
OPTIMIZES FOR: a layered "the page is still there but stepped back" depth read instead of a flat dim.
SACRIFICES: the simpler, cheaper plain-dim backdrop implied as the alternative option; no record of why option B beat the alternatives or why these specific numbers were picked.
MECHANIC: figure-ground layering is a real Gestalt mechanic for receding a background generally (section 2, T1), but the specific numbers (.965 scale, 22px radius, .96 brightness, 320ms) are not derived from it; only an "owner pick" tag is recorded, undated, with no stated reason among options, house convention (CONV).
SOURCE: LOCKFILE:1395-1397

### Gallery position indicator recipe (LOCKFILE:1400-1404)
DECISION: Swipeable galleries show position dots (6px, white 55%; active dot stretches to 18px white 100%, 250ms `glide`) inside a bottom 64px scrim band, replacing a lone "1/6" counter; CSS scroll-snap carries the momentum.
FORCES: a numeral counter (precise, reads as text) versus dots (glanceable, reads as position without reading); a wider active dot for current position versus a same-size dot with only a color change.
OPTIMIZES FOR: at-a-glance position awareness without requiring the user to read a number.
SACRIFICES: the precision of a numeral ("photo 4 of 6"); at high photo counts individual dots become too small to register as separate targets.
MECHANIC: size is a preattentive, ordered-quantity signal (Ware/Bertin, section 2, T1), the honest grounding for stretching the active dot rather than recoloring it; the specific pixel values (6px, 18px, 55%, 100%, 250ms, 64px band) are not derived from that mechanic, only the size-as-signal logic is.
SOURCE: LOCKFILE:1400-1404; RATIONALE.md section 2

### Shared-element transition (LOCKFILE:1406-1411)
DECISION: Salon card to PDP navigation uses the View Transitions API so the tapped card's photo expands into the PDP hero (content fades up after); this is the only shared-element transition in the product, every other route change keeps slide/fade, subtle parallax is permitted only on home/category heroes, and scrolljacking is banned outright.
FORCES: a signature, high-delight transition for the single highest-frequency navigation versus the implementation cost and browser-support burden of View Transitions elsewhere; consistent motion language across all routes versus one deliberately special moment; visual richness (parallax) versus user control (no scrolljacking).
OPTIMIZES FOR: reserving the richest motion moment for the one navigation nearly every user takes, keeping everything else calm.
SACRIFICES: motion consistency across routes, this one transition behaves differently from every other route change by design; no stated reason this specific navigation, rather than another, earns the exception.
MECHANIC: the photo-expanding-into-hero effect is continuity/common-fate, a real Gestalt mechanic (section 2, T1); the "exactly one flagship moment" restraint mirrors the same one-thing-per-screen pattern used elsewhere (one-ink-anchor card rule, one-progress-indicator rule), but that parallel is not stated at the site, house convention (CONV).
SOURCE: LOCKFILE:1406-1411; RATIONALE.md section 2

### Entrance recipes table (LOCKFILE:1413-1420)
DECISION: New elements use fixed entrance recipes by type: badges/SuccessMark pop-rotate (scale .6→1 + slight rotate, spring); card grids get a 40ms stagger rise-in; hero imagery (marketing only) gets a fly-in + 4s ease-in-out bob loop, one element max; toast/chips slide-up and settle (glide).
FORCES: a distinct entrance per element type for perceptual variety/character versus a single shared entrance for consistency and lower implementation surface; a looping hero animation for liveliness versus the risk of a distracting, never-settling element.
OPTIMIZES FOR: matching entrance character to what the element is (a badge earns a spring-pop moment, a card grid earns a calm cascade, chrome like toasts stays understated).
SACRIFICES: a single unified entrance timing/curve across the system; the specific numbers (40ms stagger, 4s loop) are not derived from anything and are free to drift from the duration ladder they should sit inside.
MECHANIC: easing semantics (decelerate for entrances) and duration-scales-with-size are named mechanics (section 7, T1-T2, CONV) that the spring-pop and slide-up choices plausibly draw on, but the specific numbers here (40ms stagger, 4s bob loop, one element max) are not tied to that mechanic at the site, house convention (CONV).
SOURCE: LOCKFILE:1413-1420; RATIONALE.md section 7

---

## 15. Open items (post owner answers 2026-07-15)

Answered 2026-07-15: location = this file; retrofit = FULL sweep; template = hybrid; added domains = i18n typography + touch ergonomics + enforcement (imagery DECLINED).
Probe picks answered 2026-07-15 (owner verbatim "1a 2 your pick 3b 4 b 5 no dark mode", full entries in TASTE_LOG.md 2026-07-15): corners stay circular; optical corrections adopted as a rule; contrast policy = WCAG 2.2 AA floor + APCA supplement with on-sunken retune (meta grey #575757 on #F4F4F5, blue metadata renders ink on sunken; implementation queued as its own sweep); 68ch measure cap adopted; web dark mode DECLINED and graveyarded (REMOVED.md 2026-07-15).
Still open:
1. The 3B contrast retune IMPLEMENTATION sweep (decision settled, code not yet changed; sitewide audit of ink-2/accent text on sunken surfaces).
2. Folklore-citation gate build (section 11 item 1): needs a main-repo session (/harden), hooks dir is write-protected from worktree sessions.
3. Web discount badge alignment to the mobile green-by-price treatment (owner re-rejected the rose photo tag on sight 2026-07-15; mockup-first task queued).

---

# ROUND 2 (2026-07-16): the deep-mechanics layer

Source: the owner's second research digest (epistemology, Norman, depth/light, tokens, states, forms, icons, data viz, typographic craft, composition, voice, ethics, i18n) + two judgment-agent gap passes (generative lens, diagnostic lens) run 2026-07-16. Same rules as v1: tiers on every claim, no lock reopened, digest figures the digest itself flagged as unverified stay flagged.

## 16. Domain 12: the epistemic stance (why to trust this file, and how much)

**Polanyi's tacit knowledge (T2 as philosophy of expertise): "we know more than we can tell."** Externalization is LOSSY and partial (Gourlay 2006's critique of the SECI model: some tacit knowledge is inherently tacit, much is merely un-articulated). Consequence: this file never fully captures the owner's taste and is iterative BY DESIGN. A PASS against this file is necessary, never sufficient; the owner's live eye stays the last gate, which is the epistemic reading of the mockup-first law.

**Hume's true judges (1757): delicacy, practice, comparison, freedom from prejudice, good sense.** The standard of taste is the joint verdict of qualified judges. This legitimizes the owner-as-standard (years of comparing thousands of screens IS the practice + comparison warrant) and sets the bar for any AI verdict: it must come from measurement and comparison, never from recall or vibes.

**Kant's four moments (1790):** aesthetic judgments are disinterested, claim universal assent WITHOUT a stateable concept, and feel necessary. That is why "this is bad" arrives without a named rule and still demands agreement; it is the structure of aesthetic judgment, not a communication failure. The diagnosis skill exists to bridge exactly that gap: find the mechanic under the felt judgment.

**Bourdieu's counterweight (T2, sociology): taste classifies the classifier.** Part of what reads as "good taste" is class signaling (habitus, cultural capital). House discipline: when a principle's only defense is "it reads premium," label it CONV brand positioning, never perception.

**Repertory grid (Kelly 1955, T2 as method): the operational payload of this domain.** Triadic comparison over real screens ("which two of these three are alike, and how does the third differ") surfaces the owner's UNNAMED taste axes in their own words; elicitation order = salience. This is the Taste Lab formalized, and the method for future rounds that hunt unknown axes rather than settle named ones. Pair with staircase/adaptive probes on continuous axes (radius, shadow depth, blue saturation, motion duration) to convert recurring vague complaints ("too heavy," "too small") into measured thresholds. Queued as gap-register item D5.

## 17. Domain 13: cognition and signifiers

**Affordance vs signifier (Norman 1988; the 2008/2013 correction): you design SIGNIFIERS.** The affordance can exist and be useless if nothing perceivable communicates it. The flat-design cost is measured (T2, NN/g 2017 eyetracking, 71 users, 9 page pairs): weak-signifier pages took 22 percent more looking time and 25 percent more fixations on findability tasks. Grounds: clickability is signalled by AFFORDANCE (chevron, underline-on-hover, weight, icon), never by color alone (taste rule 3's mechanic), and the earned-elevation tree (CONTROL_ELEVATION) is a signifier budget, not decoration policy.

**Gulfs of execution and evaluation (Norman):** every interaction owes a bridge in (what can I do here = signifiers, constraints, mappings) and a bridge out (what just happened = feedback within the domain-6 thresholds). The state matrix (domain 16) is the enumerated answer to the evaluation gulf.

**Cognitive load (Sweller 1988, T2): intrinsic, extraneous, germane.** Design's enemy is extraneous load only. BOUNDARY on minimalism: hiding needed context RAISES load; copy economy deletes words the context already says, never words carrying decision information.

**Jakob's law + Tesler's law (CONV, named vocabulary):** users spend most time on other products, so category conventions are free usability (the STRUCTURE = Fresha axis is applied Jakob); irreducible complexity must land somewhere, and it lands on our side (the booking flow absorbs slot/staff/payment complexity so the customer does not).

**Information scent (T2, Pirolli and Card 1999, information foraging):** labels, links, icons, and snippets are proximal cues predicting distal value; vague labels have weak scent and raise abandonment of the trail. Bounds the icon-verbosity ladder (icon-only is allowed exactly where the adjacent object supplies the scent) and CTA copy (verb + object beats "Mehr erfahren" when the destination is not obvious).

**Dead affordances are fabrications (owner rule, 2026-07-16: "it sometimes makes a chevron that has no real destination").** A chevron, arrow, or any tap affordance PROMISES a destination; rendering one with nothing wired behind it lies to the user exactly like a fabricated number does (taste rule 1's interaction twin). Law: no chevron/arrow ships without a real route or handler; a mockup showing an inert control labels it inert; when a row has no destination yet, it carries NO chevron rather than a dead one. Checked by the loop-reviewer's standing lens on every UI diff.

**Progressive disclosure (T2, NN/g):** common options first, advanced on demand, with a discoverable disclosure signifier. Already practiced (filter sheets, "Mehr lesen" clamps); recorded as mechanics.

**Memory and attention effects, replication-flagged:**
| Effect | Tier | Solen use |
|---|---|---|
| Von Restorff isolation | T1 | the one-accent pop-out math (domain 1) |
| Serial position (primacy/recency) | T1 | first/last list slots are premium inventory |
| Goal gradient + endowed progress | T1-T2 | PSYCHOLOGY.md law (cross-ref, no duplication) |
| Peak-end | in PSYCHOLOGY.md as law 1 | magnitude contested; keep scope as recorded there |
| Zeigarnik (open tasks remembered) | T3, weak/inconsistent | do not build on it |
| Ego depletion | MYTH (section 12) | never |

## 18. Domain 14: depth, light, and materiality

**Light-from-above prior (T2, Ramachandran 1988; explicitly WEAK and overridable, Morgenstern 2011):** shading consistent with top light reads raised; inverted reads inset. The mechanic under two locks: shadows offset DOWNWARD (every elevation token is positive-y), and pressed states go INSET (the LOCKFILE pressed stack).

**Two-light model (CONV, Material's elevation system):** believable depth = a key light (directional, blurred, offset cast shadow) + ambient occlusion (tight contact shadow). Our elevation-1/2/3 tokens are each a two-layer stack (one wide blur + one tight shadow): that IS the key+ambient model, now recorded as the mechanic for the section-14 shadow block, upgrading it from bare CONV.

**Positive polarity advantage (T1, Buchner 2007; Piepenbrock 2013/2014):** dark-on-light reads faster and more accurately for normal vision, both young and old, and the advantage GROWS as type shrinks (mechanism: brighter background constricts the pupil, sharper retinal image). BOUNDARY: on web this only confirms the default (web dark mode is graveyarded, owner 2026-07-15, and stays so). It BINDS the mobile dark canon (solen-mobile THEMING.md): elevation by lightness not shadow, desaturated hues, charcoal not pure black (halation is worst for astigmatism, pooled adult prevalence roughly 40 percent, Hashemi 2018). Pointer only; the mobile file is the canon.

**Translucency discipline (CONV + market case):** frost (FROST_GLASS) is locked for over-photo controls; its mechanic is figure/ground preservation, its risk is contrast that varies with the content underneath, which is why the recipe carries blur + tint as a worst-case floor. Apple's Liquid Glass (2025) shipped into immediate legibility criticism and later opacity concessions (single-source detail, flagged): the market case for keeping translucency paired with a solid fallback and a contrast floor.

## 19. Domain 15: color-token architecture

**Three tiers (CONV, industry standard; the W3C DTCG 2025.10 spec formalizes the exchange FORMAT, explicitly not the strategy):** primitive (raw value) > semantic (meaning: s-error) > component. The semantic layer is why a retheme is one mapping change and why a reviewer reads intent ("danger") instead of a hex. Solen's tailwind layer is already semantic (s-ink, s-bg-sunken, s-accent, s-error); the standing discipline: components cite semantic names, never raw primitives (the drift gate's hex rule is this, mechanized).

**Radix's 12-step job map (CONV, the best-documented ramp grammar):** steps 1-2 app/subtle backgrounds, 3-5 component backgrounds (normal/hover/pressed), 6-8 borders (subtle/interactive/hover), 9-10 solids, 11-12 text (low/high contrast); engineered so the same step across hues is interchangeable, which is the OKLCH + APCA payoff from domains 2-3. Solen's neutral mapping, recorded for EXTENSION, not migration: white = 1, sunken #F4F4F5 = 2-3, border #E4E4E7 = 6, disabled/ink-3 = 8-9 region, ink-2 #6B6B6B = 11, ink #0A0A0A = 12. When a new neutral is needed, place it by JOB on this map instead of inventing a hex; this closes the "no formula to extend from" gap the section-14 blocks kept admitting, for neutrals.

**Semantic hues are market conventions (boundary note):** red = error / green = success is Western; East Asian financial contexts invert red/green. Zero current impact for a de/en/fr/it Swiss product; the free discipline Solen already follows: tokens are named by MEANING (s-success, s-error), never by hue, so a market inversion would be one mapping change.

## 20. Domain 16: states and feedback

**The state matrix (enumeration; values already locked at LOCKFILE:526-549):** default, hover (pointer-only, never the sole signifier), focus-visible, active/pressed, disabled, loading, error, empty, success, read-only, selected, indeterminate. Every interactive component owes a designed answer per applicable state; Skeleton/EmptyState/ErrorState are the locked answers for three of them.

**:focus vs :focus-visible (T2, the mechanic behind a house departure):** :focus fires on mouse clicks too, which is historically why designers deleted outlines and broke keyboard navigation; :focus-visible fires only when the browser judges an indicator is needed. Solen's recorded departure (no ring on buttons/links, section 4) stays owner law; this entry exists so the tradeoff is visible and so inputs (which DO keep the ink edge + halo) are understood as the conforming half.

**The disabled-button argument (T2, strong practitioner consensus: GOV.UK, Adam Silver, Axess Lab):** WCAG 1.4.3 EXEMPTS disabled controls from contrast floors, which is precisely why dead grey buttons are illegible; and a mute disabled button explains nothing. The researched pattern: keep it enabled or aria-disabled, let the tap surface a SPECIFIC reason ("Wähle zuerst einen Termin"). TENSION, flagged not applied: our locked disabled treatment is opacity-50 cursor-not-allowed on the commit button. The lock stands; the probe-worthy question (gap register, QUESTIONS.md) is whether the booking commit should explain itself on tap instead of sitting mute.

**Validation timing (T2, forms research):** validate on blur or submit, never per keystroke; confirm success early, deliver errors late. FormFieldError is the component; this is its missing WHEN.

**Perceived performance (each claim flagged):**
- Skeletons: contested (section 12 folklore row); our lock (skeleton must MATCH the final layout) is the variant that tests well. Keep lock + flag.
- Progress bars (T2, Harrison 2010, CHI): bar animation changes perceived duration by roughly 10 percent; decelerating-backward ribbing reads fastest. Relevant only where a real determinate wait exists.
- Labor illusion / operational transparency (T2, Buell and Norton 2011): showing the system working ("Verfügbarkeit wird geprüft...") makes waits accepted and sometimes PREFERRED to instant, via perceived effort. Candidate: availability/search waits over ~1s name the step instead of a bare skeleton. Probe-able.
- Optimistic UI (CONV, tradeoff): render success, reconcile, roll back. Saves/hearts: safely optimistic (current HeartButton behavior). Payments and bookings: NEVER optimistic (correctness risk is the sacrifice, and here it is unacceptable).

## 21. Domain 17: forms and input

**Label placement (T2 with honest caveats):** top-aligned labels read in one fixation (Penzo 2006 eyetracking); the caveats are real (trivial 4-field study; Das 2008 found no completion difference; Jarrett: answer-time dominates saccade-time on real forms). Default: top-aligned, which is ALSO the i18n-safe choice (German labels do not fit left columns, domain 9). Left-aligned only as a deliberate brake on unfamiliar data entry. Placeholder-as-label is banned by MECHANIC, not taste: it vanishes on input (recall load), reads as a filled value (skip errors), and fails low-vision users.

**Single column (T2, Baymard/CXL):** multi-column forms create ambiguous reading paths and mis-tabbing; group only tight semantic pairs (PLZ/Ort). Baymard's checkout benchmark (their 50-study aggregate, re-check numbers at baymard.com before citing precisely): average checkouts carry roughly twice the form elements needed, and trimming measurably lifts completion.

**Input mechanics (T1, standards):** autocomplete tokens are WCAG 1.3.5, inputmode/type summon the right mobile keyboard, paste is never blocked. Error layer: WCAG 3.3.1/3.3.2/3.3.3 + Nielsen heuristic 9 (plain language, precise, constructive; inline at the field, summary linking down on long forms).

## 22. Domain 18: iconography

**Optical grid (CONV, Material's system):** 24px canvas, 20px live area, keyline shapes (circle 20, square 18, rects 20x16) so different silhouettes read the same visual size; stroke weight, terminals, and corner treatment consistency matter more than equal bounding boxes. Lucide's 24-grid/2px default conforms; the house 1.9-vs-2 stroke inconsistency stays flagged (section 13 item 8).

**Optical volume:** domain 5's optics applied to glyphs: a circle must slightly exceed a square's box to read equal; icon-in-disc centering is verified by eye at zoom, not by flexbox faith.

**Icon + label (T2, NN/g "universal icons are rare"):** ambiguity is the norm outside a tiny set. DEFINED boundary (owner demanded the "almost" be pinned, 2026-07-16): icon-only is permitted for EXACTLY this closed set, each with a mandatory aria-label: close X (the 38px circled recipe), back arrow (global header), search magnifier, hamburger menu, save heart, copy (only directly beside the code it copies), share (only inside an action row beside its object). EVERYTHING else carries a visible word; commitments (Buchen, Bezahlen) are words only. Adding to the set is an owner call logged in TASTE_LOG, never ad hoc. The mechanic is information scent (domain 13). ISO 9186 comprehension testing exists (a 67-percent-class threshold, edition-dependent); noted, not adopted: heavyweight process for a Lucide-based system.

## 23. Domain 19: data display (compact by design; judges' kill-list honored, dashboard floors live in research/TASTE_DASHBOARDS.md)

**Cleveland and McGill 1984 (T1; replicated by Heer and Bostock 2010):** decoding accuracy ranks position-on-common-scale > position-non-aligned > length/direction/angle > area > volume/curvature > shading/saturation. Operational: bars or dots over pies/donuts for any comparison; never encode magnitude in shading alone; direct-label over legend where space allows.

**Truncated y-axis (T2, Correll/Bertini/Franconeri 2020):** truncation exaggerates effect size and the exaggeration SURVIVES explicit disclosure cues. Rule: bar charts start at zero, always; line charts may truncate for analytic intent, honestly framed.

**Tufte (values, named):** data-ink ratio, chartjunk, lie factor near 1.0, small multiples. Judgment aids, not formulas.

**Tables:** numbers right-aligned in tabular figures so place value stacks (the mechanic under the Inter Tight tabular lock); text left-aligned; zebra striping is marginal (T3, only wide dense grids), prefer row spacing + one subtle divider, which is current practice.

**BOUNDARY:** customer surfaces carry no data viz; this domain binds the owner dashboard only.

## 24. Domain 20: typographic craft

**Punctuation:** smart quotes and apostrophes, the real ellipsis character. DOCUMENTED DEPARTURE, recorded so no one relitigates it from Bringhurst: classical typography assigns the en dash to ranges and the em dash to breaks; the house BANS both glyphs everywhere (owner law, hook-enforced). Ranges use "bis" or a spaced hyphen, breaks use period/comma/colon/parens. The departure trades typographic classicism for a hard, greppable rule; it is absolute.

**Widows and rag:** text-wrap: balance for 2-6 line headings; text-wrap: pretty for body last lines (Chromium shipped; verify Safari/Firefox support at first use). Justified text without hyphenation makes rivers: UI text is never justified (flush-left ragged-right is also the Swiss-style value, domain 21).

**Font loading (T2, web-perf mechanics):** FOIT vs FOUT is a design decision; font-display plus metric overrides (size-adjust, ascent/descent-override) eliminate swap layout shift. Solen loads type via next/font self-hosting, which applies metric-adjusted fallbacks automatically (framework-verified); the mechanic is recorded for anything ever loaded outside next/font.

**Variable axes (available, not yet exploited):** opsz (optical sizing, auto via font-optical-sizing) is the variable-font form of domain 4's optical-cut mechanics; GRAD changes apparent weight WITHOUT changing metrics, the correct tool if emphasis must never reflow a line. Inter v4 carries both.

**System stack vs webfont (CONV tradeoff):** system stacks cost zero network and read native; webfonts carry brand voice at a loading cost. Solen pays the cost deliberately: Inter Tight IS half the brand's voice.

## 25. Domain 21: composition vocabulary and the Swiss lineage

**Named axes for what the squint test finds (CONV vocabulary):** balance (symmetric/asymmetric/radial), visual weight, tension, rhythm and repetition, dominance/focal point, movement (the eye's path), unity vs variety, scale contrast, negative space treated as SHAPE. The diagnosis skill reports in these words so a felt "unbalanced" maps to a named axis; the computable form (visual-weight centroid) is gap-register item D1.

**Rule of thirds:** folklore tier (section 12). A usable CONV crop heuristic, never a justification.

**Swiss/International Typographic Style (adopted VALUES, the honest label for the house lineage):** objective clarity, mathematical grid, sans-serif, flush-left ragged-right, photography over illustration (Muller-Brockmann, Grid Systems, 1981). A Swiss product running Swiss-style values is brand coherence, chosen and reversible, and this is the true ancestry of several "premium/calm" instincts the file previously left unattributed. Neo-brutalism, bento grids, and the translucency revival are 2024-2026 TRENDS: cite as trend, never as principle.

**Art-direction statement (generative aid, CONV; gap-register G3 companion):** one or two sentences naming the intended feeling and reference vocabulary BEFORE composing a new surface (the personality-zone table is the per-zone version). Cheap, and it converges first mockups instead of gambling them.

## 26. Domain 22: voice and tone mechanics

**Four tone dimensions (T2, NN/g 2016):** funny/serious, formal/casual, respectful/irreverent, enthusiastic/matter-of-fact. The LOCKFILE register lock (du-form, no exclamation marks, no hype) pins Solen at: casual side of center, matter-of-fact, always respectful, serious-leaning with warmth allowed at confirmation moments. Recorded as axis positions so new-surface copy has a target rather than a vibe.

**Voice constant, tone varies by state (CONV, Mailchimp framing):** celebratory at success (PSYCHOLOGY.md law 1's confirmation warmth), calm and plain at errors (domain 17 error rules), matter-of-fact in forms and settings.

**No dead ends (Yifrah, microcopy):** every empty, error, and zero-results state offers a next action; EmptyState's action slot is the enforcement. Buttons name the action they perform (verb CTAs, already law).

**Aaker's brand-personality five (T2; cross-cultural generalizability contested):** sincerity, excitement, competence, sophistication, ruggedness. A naming vocabulary: Solen reads competence + sincerity with sophistication accents. Vocabulary, not law.

**Sentence case (house law; mechanics note):** sentence case reads faster and more humane, Title Case reads branded/formal; German capitalizes nouns anyway, so the rule bites in EN/FR/IT strings.

## 27. Domain 23: ethics as taste (names and anchors; the refusals themselves live in PSYCHOLOGY.md)

**Brignull's taxonomy (deceptive.design; term coined 2010):** sneaking, nagging, obstruction (roach motel / hard to cancel), forced action, confirmshaming, comparison prevention, disguised ads, fake scarcity, fake social proof, fake urgency, hidden costs, hidden subscription, preselection, trick wording, visual interference. Gray et al. 2018 compress to five: nagging, obstruction, sneaking, interface interference, forced action. This section exists so reviews can cite refusals by their industry names.

**Every category resolved to a verdict (2026-07-27, closing the ethics-psychology-05 gap: naming a taxonomy without ruling on each entry left 5-6 categories decorative).** A hit in the taxonomy is not enough on its own; the row below is the actual binding ruling and where it lives.

| Category | Verdict | Where ruled |
|---|---|---|
| Sneaking / hidden costs | BANNED | PSYCHOLOGY.md hard line 3 (no relative-only price hiding the absolute) + law 5 (total price from step one) |
| Preselection | BANNED except the stated exception | PSYCHOLOGY.md hard line 2 (no pre-checked paid add-ons/subscriptions); law 2 allows preselecting a free default only |
| Fake scarcity / fake urgency | BANNED | PSYCHOLOGY.md hard line 1 + hard line 6 (countdown only on live, user-relevant counts) |
| Fake social proof | BANNED | PSYCHOLOGY.md hard line 1 (no fabricated numbers, counts, or social proof, ever) |
| Confirmshaming | BANNED | PSYCHOLOGY.md law 10 ("dishonest dismiss copy" is named in the same banned list as invented-stakes loss-framing) |
| Forced action | BANNED | PSYCHOLOGY.md hard line 5 (no lock/blur wall before delivered value; no forced account before pay) |
| Obstruction (roach motel / hard to cancel) | BANNED, now a standing hard line | PSYCHOLOGY.md hard line 8 (exit/cancel/unsubscribe parity, added ethics-psychology-06; previously only a one-time 2026-07-16 verified audit finding with no standing rule) |
| Nagging (repeated re-asks of a declined permission or upsell) | BANNED | ask once per session; a declined permission or upsell prompt does not re-fire without a new user-initiated trigger. No prior ruling existed; recorded here (ethics-psychology-05) |
| Comparison prevention (inconsistent units, bundling that blocks price/duration comparison) | BANNED | extends PSYCHOLOGY.md law 11 (comparability beats trimming): price + duration render in the same inline unit across every option in a list, never buried in a bundle with no per-item breakout. No prior ruling existed; recorded here (ethics-psychology-05) |
| Disguised ads / sponsored ranking | BANNED preventively, no feature exists today | PSYCHOLOGY.md hard line 10 (added ethics-psychology-10): a persistent "Gesponsert" label at salon-name weight, never overriding a real safety/quality signal |
| Hidden subscription (auto-renewal with no prominent pre-purchase disclosure) | NOT YET APPLICABLE, ruling reserved | no membership/auto-renewal feature ships today (PSYCH_RETENTION.md's contested section floats one); the moment it is scoped it must disclose renewal terms before purchase and satisfy hard line 8's exit parity. No prior ruling existed; recorded here (ethics-psychology-05) |
| Trick wording (double-negative settings copy, ambiguous toggle labels) | BANNED | a toggle label states literally what happens when ON ("SMS-Erinnerungen" not "SMS nicht deaktivieren"); no double negatives in settings copy anywhere. No prior ruling existed; recorded here (ethics-psychology-05) |
| Visual interference (a decline/dismiss control rendered smaller, lower-contrast, or harder to hit than the accept control) | BANNED | decline and accept controls in the same prompt share the same tap-target floor (44px) and a comparable visual weight; only the fill differs (ink commit vs neutral outline), never size or contrast. No prior ruling existed; recorded here (ethics-psychology-05) |

**Regulatory anchors:** EU DSA Article 25 prohibits interfaces that deceive, manipulate, or materially distort user decisions (recital 67 names dark patterns); California CPRA: consent obtained through dark patterns is not valid consent. BOUNDARY, stated honestly: Solen is Swiss; the DSA binds services offered INTO the EU, and whether that covers Solen is a legal question this file does not settle. The design stance does not depend on the answer: the PSYCHOLOGY.md hard lines (no fake scarcity/urgency/social proof, no confirmshaming, symmetric opt-outs) already refuse the taxonomy, regulation or not.

## 28. Gap register (judge-flagged 2026-07-16; open queue, owner-gated where marked)

Two judgment passes ran over the whole stack. Their converged verdict, recorded verbatim in spirit: **the stack is analytic, not generative** (it can grade a mockup twelve ways and cite a study for each, but holds few priors that produce a RIGHT first mockup), and **its floors are prose, not computed** (only static-code drift is mechanized; every perceptual floor is eyeballed under task focus, the exact condition the house ledger says degrades advice into noise).

**Generative gaps (lens A):**
| # | Gap | Route |
|---|---|---|
| G1 | Richness calibration: "rich not bland" has zero mechanics; needs a probe-calibrated band (photos per screen, fields per card, above-fold count) | Taste Lab probe: 3 richness levels of one real surface. HIGHEST |
| G2 | Layout-pattern selector: list vs grid vs carousel vs table vs bento, given content shape (NN/g carousel + Baymard list-vs-grid as anchors) | Probe: same content 3 ways. HALF-CLOSED 2026-07-16 (owner "all approves", IG round 1 ig10): the grid-TYPE classification step below is now law; the remaining open half is the list-vs-carousel-vs-table selector, which G2's probe still owns (G2's own carousel/grid answer is already settled per owner 2026-07-16: grid for search, carousel for home) |
| G3 | Page-level rhythm for NEW pages: section order, dense/breathe cadence, CTA placement grammar | Elicit + art-direction statement (domain 25) |
| G4 | Empty-state + illustration language (bridge from the personality-zone table; NN/g blank-slate: teach value, one action) | Probe-able |
| G5 | Responsive reflow grammar: named transform per surface class (Frost's responsive-pattern taxonomy as vocabulary) | Probe: mobile+desktop of one screen |
| G6 | Imagery/art direction: OWNER-DECLINED 2026-07-15; listed as a known gap, needs a NEW yes | Owner-gated |
| G7 | Flow-level motion choreography (spatial continuity across booking steps; Material shared-axis) | Needs video prototype, weak as static probe |
| G8 | Token extension grammar: neutrals now closed by domain 19's job map; semantic/status extension still CONV | Doc follow-up |
| G9 | Density defaults per CUSTOMER surface (extend TASTE_DASHBOARDS floors to cards/grids) | Probe-able |

**Diagnostic gaps (lens B; "mechanizable" = a script can compute it):**
| # | Gap | Mechanizable |
|---|---|---|
| D1 | Visual-weight/balance centroid metric (answers "unbalanced" with a number: per-element bbox area x darkness x saturation, centroid offset) | YES |
| D2 | Blue-coverage percent + accent-hue count per rendered screen (the most-relitigated rule, measurable as pixels) | YES |
| D3 | Alignment/off-grid conformance (near-miss edges 1-4px apart, off-4pt values) | YES |
| D4 | Pre-delivery self-walk: run the diagnosis skill on MY OWN mockups BEFORE showing (candidate Stop-gate; the reactive loop is the weakest link) | Gate |
| D5 | Repertory-grid triads + staircase probes as Taste Lab rounds (extract UNNAMED axes; thresholds for "too heavy") | Procedure |
| D6 | Tap-target + slip-adjacency sweep (44px floor, 8px consequential separation, computed per screen) | YES |
| D7 | Cross-surface consistency diff (price strings, stroke widths, twin components across call-sites) | YES |
| D8 | Spacing-rhythm audit (all sibling gaps vs the 32/12/16 whitelist) | YES |
| D9 | Multi-locale overflow audit (render de/en/fr/it, flag clipped/wrapped CTAs and chips) | YES |
| D10 | Severity matrix: contract breach (gate-enforced literal) = blocking regardless of visual size; within-budget taste = cosmetic | Skill edit |

Build order recommendation (not started, owner can reprioritize): D4 (the gate that makes everything else fire) > D2 + D1 (the two most-complained axes) > G1 probe (the most-cited generative direction) > the rest as audit-script sprints.

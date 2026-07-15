# RATIONALE.md , the mechanics layer of the Solen taste system

<!-- exists-check: net-new vs CANON/SOURCE/LOCKFILE/TASTE_LOG/PSYCHOLOGY/RESTRAINT_TEST because none holds the perceptual/mathematical MECHANICS layer: 2026-07-15 inventory found LOCKFILE rationale is 51 percent BARE and 4 percent mechanics-class, SOURCE has zero named perception/aesthetics citations, PSYCHOLOGY.md covers behavioral (conversion/retention) laws not visual-perception mechanics. This file EXTENDS that stack (backlinks throughout) and duplicates none of it; npm run exists rationale = 0 hits. -->

**Status: DRAFT v1 (2026-07-15), pending owner answers on location, retrofit scope, and template weight.**

**What this is.** The WHY layer: the perceptual, mathematical, and empirical mechanics that ground the decisions locked elsewhere. LOCKFILE/CANON hold the WHAT (frozen literals), TASTE_LOG holds the WHEN/WHO (dated owner calls), PSYCHOLOGY.md holds the behavioral laws. This file holds the MECHANISMS (formulas, thresholds, named studies) those decisions can cite, so a rule can be defended instead of asserted.

**What this is NOT.** Never a lever to reopen a lock. When a mechanic here argues against a LOCKFILE literal, that is a QUESTIONS.md entry for the owner, not a change. Precedence stays: owner's live ask > hooks > LOCKFILE > CLAUDE.md pinned blocks > TASTE_LOG > memory > this file's general mechanics. A dated owner decision beats a study every time; this file's job is to make the tradeoff visible, not to win it.

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
MECHANIC: <formula / threshold / study + tier, or "owner taste, dated" if none>
SOURCE: <owner date / measured ref / RATIONALE.md section>
```

**The reversibility test:** a principle is only actionable if a competent team could defensibly choose its opposite. "Make it usable" is a value, not a principle. "Restraint: one ink anchor per card, at the cost of scannability of secondary values" is a principle. Entries that fail the test get demoted to values (section 8 keeps a short values list so they have somewhere honest to live).

**Existing proto-rationale to build on, not duplicate:** the V3-D provenance format (SOURCE.md section 15) is already an ADR chain (id + date + motivation + supersession); TASTE_LOG's Decision/Why tables are QOC-lite; RESTRAINT_TEST.md's "honest risk" section is the house's best worked example of forces/tradeoffs. The template above adds only the two missing fields: FORCES and SACRIFICES.

---

## 2. Domain 1: Perception (what the eye does before thought)

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

**Documented deliberate departures (record, do not silently "fix"):**
- **No focus ring on buttons/links** (globals.css:344-404, owner-mandated repeatedly): conflicts with WCAG 2.4.7/2.4.11; inputs keep an ink edge + halo. This is a recorded owner tradeoff (aesthetic calm over keyboard-focus visibility), not an oversight. Residual inconsistency: SalonCard's own Link wrapper still carries a focus-visible outline (SalonCard.tsx:471).
- **420ms entrance recipe** (MOTION.md:28): above the NN/g 300-400ms comfort band, deliberate premium-feel call (section 7).

**Simultaneous contrast (T1):** the same token reads differently on white vs sunken vs photo; evaluate pairs in their real context (this is why the styleguide page, not the token table, is the verification surface).

---

## 5. Domain 4: Typography (scale as constraint, measure as comfort)

**Modular scale (CONV, Bringhurst / Tim Brown).** A shared ratio reduces arbitrary size decisions; the "musical harmony" claim is aesthetic assertion. Solen's ladder (11/12/14/15/18-20/24/40, "Scale B") was tuned by hand, not ratio-derived, and that is FINE: the value of a scale is the constraint, and our constraint is the per-screen budget (4 sizes / 2 weights, LOCKFILE:319) plus the frozen role table. Do not retrofit a fake ratio onto it; record it as a hand-tuned constraint system.

**Measure (CONV with strong practice consensus, Bringhurst): 45-75 characters per line, ~66 ideal; 40-50 for multi-column.** Too-long lines make the return sweep error-prone. Currently ABSENT from the system: no max-width in ch anywhere, and German makes it worse two ways: compound words break lines unpredictably, and DE/FR run roughly 20-35 percent longer than EN (industry localization heuristic; treat as a range, not a fact; SOURCE.md:1075's flat "30 percent" gets this label). Candidate rule (probe 4): body/description blocks cap at ~65-70ch equivalent.

**x-height and optical cuts (T2, type-design practice).** Point size measures the em body, not the letters; apparent size tracks x-height. Inter Tight (display) + Inter (body) is one family in two optical cuts: harmony by construction, the same mechanism as a superfamily pairing, and the actual reason the pairing cannot clash. That is the first-principles version of "the way Uber does it" (SOURCE.md:319), which should be relabeled from imitation to mechanism.

**WCAG 1.4.12 text spacing (T1, robustness constraint, not a default):** content must survive user overrides of line-height 1.5x, paragraph spacing 2x, letter spacing 0.12em, word spacing 0.16em. At 14px body: 21px line-height, 28px paragraph gap. This binds our clamps and truncation (line-clamp blocks must not clip at forced spacing); add to the a11y checklist in SOURCE section 16.

---

## 6. Domain 5: Spacing and shape (grids, optics, corners)

**4pt grid (CONV).** Solen is 4pt-based (SOURCE.md:369); Material and the 8pt tradition use 8 with a 4pt sub-grid. The defensible why for 4/8: common density factors (1.5x/2x/3x) keep multiples crisp (an odd 5px at 1.5x lands on a half pixel), and the grid kills per-element debate. Our choice of 4 over 8 buys denser mobile rhythm at the cost of more permissible values (weaker constraint); the 32/12/16 rhythm tiers restore the constraint at the layout level. Above ~100px, LOCKFILE already rounds to clean 5/10s (8pt pedantry buys nothing at that size, LOCKFILE:452).

**Whitespace (T2): cite Chaparro et al. 2004 (margins improved reading speed and comprehension; leading affected preference more than performance). NEVER cite "Lin 2004 whitespace +20 percent": fabricated attribution (section 9).** Macro whitespace signals structure and calm (premium read); micro whitespace drives legibility. Proximity math from domain 1 is the operative rule.

**Optical vs mathematical alignment (T2; unsettled axis at Solen, probe 2).** Bounding boxes lie: a circle at equal box height encloses less area and reads smaller; a triangle centered by box reads off-center (its visual mass sits toward one edge). Type does this natively (round letters overshoot baselines). Candidate house rules: play/chevron glyphs nudge ~4-8 percent toward visual center; circles sized next to squares get a ~2-4 percent overshoot; icon-in-disc centering is checked by eye at 2x zoom, not by flexbox faith.

**Corners.**
- Nested radius: LOCKED (inner = outer minus gap, min 4px, DS-4, LOCKFILE:428-433). Mechanic: concentric corners stay parallel; same-radius-inside-same-radius bulges. Matches the research formula (inner = outer minus padding). Nothing to relitigate.
- Curvature CHARACTER (probe 1, unsettled): a straight edge meeting a circular arc has a G1 curvature jump the eye reads as a faint kink; superellipse/squircle profiles (|x/a|^n + |y/b|^n = 1, circle n=2, squircle n~4-5, Apple's continuous corners) remove it. Cost: CSS corner-shape is not broadly shipped in 2026, so squircles today mean clip-path/mask plumbing on every rounded element, plus drift risk against the locked radius tokens. Forces: perceived refinement vs implementation surface.
- Rounded reads friendly (T2, Bar and Neta 2006/2007: preference for curved contours; sharp contours raise amygdala response; replicated cross-culturally, moderated by expertise): the mechanic under our pill buttons and 16px cards.

**Target sizes (T1, standards): WCAG 2.5.8 AA (2.2) 24x24 CSS px minimum; WCAG 2.5.5 AAA 44x44; Apple HIG 44pt; Material 48dp with 8dp spacing.** Solen's 44px floor (design contract) is the AAA/HIG line, deliberately above the legal AA minimum. All of it is Fitts in standards clothing.

---

## 7. Domain 6: Motion and timing (thresholds first, character second)

**Response thresholds (T1-T2):** 0.1s reads instantaneous, 1s keeps flow, 10s loses attention (Miller 1968, Nielsen 1993). Doherty and Thadani 1982: throughput rises sharply under ~400ms system response (the "addictive 400ms" framing is dramatized; the defensible core is faster-feedback-better-throughput). Modern operational form: INP good <= 200ms at p75 (web.dev). NN/g durations: micro-feedback ~100ms, screen-level changes 200-300ms, 500ms feels like drag; entrances slightly longer than exits.

**Solen ladder audit (2026-07-15).** The 80/150/200/250/300/500ms whitelist (LOCKFILE:575) and the globals.css custom-property ladder (100/150/200/300/500ms) sit inside the NN/g band. The locked ENTER recipe is 420ms + blur (MOTION.md:28), ABOVE the 300-400 comfort ceiling: a deliberate premium-feel owner call (dated, "motion approved w ur reccomended"). Record it as a DOCUMENTED DEPARTURE: optimizes perceived richness on first paint, sacrifices ~100ms of perceived snappiness, bounded to entrances only (feedback interactions stay <=200ms). That is the honest ADR form; the alternative (silently citing NN/g while shipping 420) is how docs rot.

**Easing semantics (T2, Material motion research + practice):** decelerate (ease-out) for entrances (element reacts instantly then settles), accelerate (ease-in) for exits (reads as gone), standard in-out for in-place moves, linear only for continuous processes. Solen's tokens map cleanly: glide (0.16,1,0.3,1) is a strong decelerate (entrances, correct), thud (0.7,0,0.84,0) is an accelerate (press-down, correct), snap (0.4,0,0.2,1) is the standard curve, spring (0.34,1.56,0.64,1) is a bezier overshoot for earned moments. The semantics were chosen right; this paragraph is the missing why.

**Open inconsistency (flagged for reconciliation, not relitigation):** "spring" exists twice with different math: the bezier overshoot token (MOTION.md:61) and a physics spring (stiffness ~300 / damping ~30) for sheets (RESTRAINT_TEST.md:29). Either document as two intentional mechanisms (bezier for fire-and-forget CSS, physics for interruptible gestures, which is the standard split) or converge. Physics springs are the right tool exactly where a gesture can interrupt mid-flight (sheet drag), which supports the two-mechanism reading.

**prefers-reduced-motion (T1, WCAG 2.3.3):** vestibular-disorder trigger class is large-scale motion, parallax, spatial transitions. Implementation EXISTS globally (globals.css:805-813 hard-caps all animation/transition durations under the media query); MOTION.md states the principle 3x; SOURCE section 16 and RESTRAINT_TEST never mention it. Doc fix: point SOURCE's a11y section at the existing global rule so it stops being invisible law.

**Duration scales with distance/size (CONV, Material):** small toggles ~100-150ms, screen-scale moves toward 300ms+. Already implicit in the per-transition table (LOCKFILE:553-559); now stated.

---

## 8. Domain 7: Aesthetic theory (why polish is not decoration)

**Aesthetic-usability effect (T2: Kurosu and Kashimura 1995, r ~ 0.589 between perceived aesthetics and APPARENT usability; Tractinsky 1997 replication; 2023 CHI nuance: controlling processing fluency shrinks the effect).** Perceived beauty buys perceived usability, trust, and error tolerance BEFORE any interaction. This is the evidence line under the polish investment (and under PSYCHOLOGY.md's 100ms trust window law; cross-reference, do not duplicate).

**Processing fluency (T2, Reber/Schwarz/Winkielman): ease of processing is itself experienced as pleasant.** High contrast, symmetry, prototypicality, clean figure-ground read as beautiful BECAUSE they process easily. This is the deepest single why in this file: it grounds restraint (fewer distractor classes = fluent scan), the one-ink-anchor rule, copy economy (fewer words = fluent parse), and skeleton-shaped loading (prototypical layout preserved). Legibility reads as beauty.

**MAYA / typicality x novelty (T2, Hekkert et al. 2003: typicality and novelty independently predict preference and suppress each other).** Push novelty only as far as category recognition survives. The dual-axis rule (STRUCTURE = Fresha, AESTHETIC = Uber, LOCKFILE section 10) IS applied MAYA: Fresha anatomy supplies the typicality anchor (a booking flow everyone already knows), the Uber-restraint skin supplies the bounded novelty delta. Recording that turns the house's biggest rule from "because those brands" into a first-principles strategy.

**Berlyne inverted-U (T3, mixed replication):** intermediate complexity is preferred; useful lens for card density and Inspo feed richness ("rich not bland" pulls toward the peak from the sparse side), never a hard law.

**Rams' 10 principles (values, not mechanics):** review-checklist material (is it honest, is it thorough, is it as little design as possible). They live here as a judgment aid; they fail the reversibility test as principles, and that is fine at the values layer.

**In-house numbers to keep labeled:** RESTRAINT_TEST.md's life-budget percentages (photography ~50 / type ~25 / motion ~15 / whitespace ~7 / depth ~3) are llm-council output, CONV label, precision is presentational. Do not cite them as evidence.

---

## 9. Design folklore table (never cite; companion to PSYCHOLOGY.md's myth table)

| Claim | Status | What to do instead |
|---|---|---|
| Golden ratio governs beauty | MYTH (Markowsky 1992: canonical examples unsupported) | 1.618 is one available ratio if you like it; never "because phi" |
| Miller's 7+/-2 for menu/option counts | Superseded (Cowan 2001: ~4 chunks; recognition is not span-bound) | Cite Cowan for recall tasks only; menus are recognition |
| "Whitespace +20 percent comprehension (Lin 2004)" | FABRICATED attribution (real Lin 2004 is about older adults' hypertext retention; author refuted the misuse) | Cite Chaparro et al. 2004 (margins help reading speed/comprehension) |
| 60-30-10 color proportion | Interior-design folk rule, no empirical basis | Our 80/17 is an internal CONV budget, labeled as such |
| "Color X causes emotion Y" universals | Culture-bound conventions | Semantic conventions of our market, labeled CONV |
| Harmony schemes as laws | Scaffolds (Itten tradition), weak direct evidence | Use as starting constraints |
| "Doherty 400ms makes UIs addictive" | Dramatized (Halt and Catch Fire lore on a real 1982 finding) | Faster feedback raises throughput; operationalize as INP <= 200ms |
| "German text expands exactly 30 percent" | Unsourced flat number (SOURCE.md:1075) | Treat as a 20-35 percent planning range, or measure our own strings |
| "reads warm by physiological convention" (SOURCE.md:232) | Unsourced perception claim | Keep the rule, drop the physiology, label CONV |
| ">=75 percent of expected traffic is mobile" (SOURCE.md:63) | Internal number with no source/date | Attach the analytics source + date, or soften to "majority mobile" |

House rule (global rule 15 applied to design): a recalled number is memory wearing a number. Attach a named checkable source, soften to qualitative, or cut.

---

## 10. Retrofit queue: the 12 load-bearing BARE rules (from the 2026-07-15 LOCKFILE audit)

Rules every component inherits that carry zero recorded why at their definition site. Retrofit = add a FORCES/MECHANIC block per section 1, values unchanged.

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

## 11. Pending owner decisions (this draft freezes nothing)

1. WHERE this layer lives (this file vs inline LOCKFILE blocks vs TASTE_LOG format only).
2. Retrofit SCOPE (the 12 above + new decisions, vs everything, vs new-only).
3. Template WEIGHT (full 6-field block vs lean Decision/Because/Tradeoff line).
4. Contrast POLICY (adopt APCA as supplementary + fix the two failing pairs, vs WCAG-only + documented deviations).
5. The five probe axes in the taste lab (corner curvature, optical corrections, contrast tuning, measure cap, web dark mode): each unsettled, each elicited visually before any rule is written.

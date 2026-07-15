# RATIONALE.md , the mechanics layer of the Solen taste system

<!-- exists-check: net-new vs CANON/SOURCE/LOCKFILE/TASTE_LOG/PSYCHOLOGY/RESTRAINT_TEST because none holds the perceptual/mathematical MECHANICS layer: 2026-07-15 inventory found LOCKFILE rationale is 51 percent BARE and 4 percent mechanics-class, SOURCE has zero named perception/aesthetics citations, PSYCHOLOGY.md covers behavioral (conversion/retention) laws not visual-perception mechanics. This file EXTENDS that stack (backlinks throughout) and duplicates none of it; npm run exists rationale = 0 hits. -->

**Status: v1 OWNER-CONFIRMED (2026-07-15). Location: this file (rules link in, locked docs unchanged). Retrofit scope: ALL bare rules (~47), owner picked full sweep over top-12. Template: hybrid (full 6-field block for LOCKFILE retrofits and big calls, lean one-liner for everyday TASTE_LOG entries). Added domains: i18n typography, touch ergonomics, enforcement. Imagery domain: owner DECLINED 2026-07-15, do not add without a new yes. Probe picks settled 2026-07-15 (TASTE_LOG entry); still open: the 3B contrast-retune implementation sweep + the folklore gate build.**

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

## 9. Domain 9 (Solen-specific): i18n typography (owner-added 2026-07-15)

The measure/typography mechanics of domain 4 break first in German, and Solen ships de/en/fr/it. SOURCE.md section 17 holds the RULES (string files, plurals, Swiss formats); this section holds the mechanics under them.

**Text expansion (CONV, industry localization heuristic, treat as a range):** DE and FR run roughly 20-35 percent longer than EN at sentence scale, worse at label scale (short EN labels can double). Consequences with mechanics:
- Button labels: the <=3 word lock (LOCKFILE:765) is what keeps CTAs from wrapping in DE; the mechanic is expansion-at-label-scale, not copy taste alone.
- Any fixed-width slot (chips, badges, tab pills) is sized against the LONGEST locale render, not the EN draft. Test strings: "Terminbestätigung", "Haarverlängerung", "Wegbeschreibung", FR "Renseignements complémentaires".
- Truncation robustness: truncate/line-clamp blocks must still carry meaning with 35 percent more glyphs; pair every truncation with a full-value affordance (title attr, detail row, Mehr lesen).

**Compound words (T1 linguistic fact, no hyphenation dictionary in CSS by default):** German compounds do not wrap without `hyphens: auto` + `lang="de"`; a 24-glyph compound inside a narrow column overflows or forces ugly breaks. Mechanic: measure caps (domain 5's 45-75ch) need MORE slack in DE columns; enable hyphenation only deliberately (it changes the premium read).

**Numerics across locales (CONV, Swiss convention):** tabular-nums for anything that aligns or updates (prices, times, codes: already the Inter Tight tabular lock); CHF formats per SOURCE section 17; never let locale switching reflow number columns.

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
| "German text expands exactly 30 percent" | Unsourced flat number (SOURCE.md:1075) | Treat as a 20-35 percent planning range, or measure our own strings |
| "reads warm by physiological convention" (SOURCE.md:232) | Unsourced perception claim | Keep the rule, drop the physiology, label CONV |
| ">=75 percent of expected traffic is mobile" (SOURCE.md:63) | Internal number with no source/date | Attach the analytics source + date, or soften to "majority mobile" |

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

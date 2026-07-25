<!-- exists-check: net-new vs _design-system/research/UNFINISHED_AUDIT_2026-07-21.md (which diagnosed
     "compliant but unfinished" and produced the FLOORS LAW), RATIONALE.md (mechanics), and the
     TASTE_*.md research set. This file is the MEASURED follow-up: it tests whether the floors that
     audit produced were actually applied, and answers a different owner question ("why does it feel
     flat/boring vs Airbnb, Fresha, Uber"). `npm run exists flatness` = 0 hits. -->

# Why it reads flat and beta-ish: the measured core cause (2026-07-25)

Owner, verbatim: *"idk why but i feel like our design is so flat n boring compared to airbnb or fresha or uber... theres nth special n jst looks like a beta yk why cna u find the core cause"*

Diagnosis run per `solen-taste-diagnosis`, on the RENDERED pages at 390x844 (localhost:3000, branch main),
not from source. Every number below was measured this session with getBoundingClientRect + computed styles.

---

## THE CORE CAUSE, in one sentence

**Emphasis is spent uniformly instead of selectively: on the PDP 86% of visible text is semibold.**
The mechanism (TASTE_RANGE.md finding 1, Healey/NCSU): a target whose properties are UNIQUE pops out
preattentively in under 250ms; a target sharing its properties with the field becomes a conjunction target
and drops into slow serial search. At 86% weight-600, semibold is a property of the FIELD, not the anchor,
so nothing pops. (The size-ratio half of this claim was overstated, see the corrected table row.) When nearly everything
is emphasized, emphasis stops carrying information (Nielsen: "if you emphasize everything, nothing gets
focus"), and the eye finds no entry point. "Flat" is not a vibe here, it is literally the measurement.

This is the same root the 2026-07-21 UNFINISHED_AUDIT named (ceilings without floors), one step further
along: the FLOORS LAW was written, but the floors were never applied to the home surface.

---

## MEASURED EVIDENCE (first viewport, 390x844)

| Metric | Home | PDP | Floor / ceiling in our own law |
|---|---|---|---|
| Imagery share of first viewport | **4.7%** | 34.7% | FLOORS LAW 2: ~>= 33% on browse/discovery/PDP |
| Largest text vs body (dynamic range) | 2.4x | **1.57x** | **CORRECTED 2026-07-25 by TASTE_RANGE.md research:** the published 30-50% figure means 1.3x-1.5x, so 1.57x PASSES that bar. The original line here ("1.57x is one step, not a hierarchy") misread its own source. Our 1.8x floor is a HOUSE CONVENTION, stricter than any published number. The weight-share finding below is unaffected and remains the core cause. |
| Share of visible text at weight >= 600 | 52% | **86%** | emphasis must be the exception; 86% makes it the default |
| Max font size | 31.2px | **22px** | display anchor floor is >= 28px per customer screen (FLOORS LAW 6) |
| Distinct chromatic colours on screen | **2** | 3 | semantic colour is allowed and expected; near-zero chroma reads unfinished |
| Distinct shadow values | **1** | 2 | one value = no depth vocabulary, everything sits on the same plane |
| Distinct type sizes | 9 | 6 | ceiling is 4. Note: MANY sizes but NO range, they cluster 12-18px |

The last row is the tell. We are simultaneously **over** the size-count ceiling and **under** the
size-range floor: nine sizes that all sit within 6px of each other. That is variety without hierarchy,
which is the worst of both, it costs consistency and buys no legibility.

---

## WHAT THE FIRST SCREEN ACTUALLY IS

Home, first viewport, described without judgement (Feldman pass):
wordmark, 31px headline, 18px subline, a white card containing three EMPTY inputs and one black button,
then a row of three 100px icon tiles. Photographic content: 4.7% of the viewport.

A beauty marketplace opens on **an empty form**. Airbnb, Fresha and Uber Eats all open on the THING being
bought, photographed, with the search affordance laid over or under it. We open on the tool for finding
the thing. That single difference accounts for most of the "beta" feeling: a form is what a product looks
like before someone designs it.

---

## WHY IT LOOKS "BETA" SPECIFICALLY

Three compounding effects, all measured above:

1. **No entry point.** With 86% of text at one weight and a 1.57x size range, nothing wins the squint test.
   A designed screen tells you where to look first; ours presents everything at once, which is what a
   wireframe does.
2. **No material.** One shadow value, near-zero chroma, and (on home) no photography, means every element
   sits on the same plane on the same white. There is nothing to read as "surface" versus "content".
3. **Restraint applied everywhere instead of somewhere.** Apple and Uber are restrained in most places
   precisely so ONE place can be loud. We are restrained uniformly, so the loud place never arrives.

---

## WHAT THIS IS NOT

- Not the palette. Black/white/blue is fine, Uber ships it. The failure is that we never spend the contrast
  the palette allows.
- Not "we need more decoration". The taste rules banning decorative dots, fake data and filler are correct
  and should stay. Decoration is not the missing ingredient, RANGE is.
- Not a component-quality problem. The cards, pills and type primitives are individually well built. They
  are all just tuned to the same middle setting.

---

## THE FIX DIRECTION (not applied, this file is the diagnosis only)

Ranked by severity (frequency x impact x persistence):

1. **SEV 4, home imagery.** 4.7% against a 33% floor on the single most-visited surface. The first viewport
   needs a photographic anchor. Our own FLOORS LAW already mandates this and was never applied here.
2. **SEV 4, weight inflation.** Drop the PDP's 86% semibold share toward the 20-30% band, so that 600
   marks something again. This is a find-and-replace level change with an outsized payoff.
3. **SEV 3, no display anchor on the PDP.** Max 22px where the floor is 28px. The salon name should own
   the screen it belongs to.
4. **SEV 2, collapse the size ladder.** Nine clustered sizes on home to four spaced ones, so the ramp reads
   as steps rather than noise.
5. **SEV 2, one shadow value.** Give elevation at least a two-step vocabulary so "raised" can mean something.

Each of these is a floor we already wrote and did not enforce. The system does not need new rules, it needs
the existing floors applied to the surfaces that skipped them.

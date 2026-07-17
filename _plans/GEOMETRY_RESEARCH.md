# Geometry, symmetry and the math of composition (owner ask 2026-07-17)

Owner verbatim (dictated, with an annotated reference screenshot: a dark Sleep-alarm UI marked up with 16/48/56/72/84/12px measurements and arrows reading "lack of symmetry", "poor alignment", "i'd slightly reduce the weight on these for a better overall composition"): "More like bento boxes rather than side of it and stuff, it's all like about design outside of the bento box and like also like the whole website is like about math. I like the perfect combination stuff. I'm gonna have to reference. Can you check if you already have this in our taste design system? And so when we make or create any stuff, like, it actually follows. And if it doesn't, can you actually use [research] and go research it fully? Like, access many websites using Playwright like Wikipedia or any website that matches ... actually go research into it and find me every single one and which one. And then after that, after the audit, tell me which one applies to Solen, and then tell me. This is a reference."

Reading: the reference is NOT about bento boxes as a trend. It is about the geometry BETWEEN and AROUND the boxes: symmetry, optical vs mathematical centering, alignment of edges across a composition, and the numeric system (why 16 not 15, why 48/56/72/84) that makes a layout feel resolved. "The whole website is about math."

## Exists-check (run 2026-07-17, before proposing anything)

ALREADY IN THE SYSTEM (do not re-derive, extend):
- Nested/concentric radius: LOCKED, inner = outer minus gap, min 4px (RATIONALE.md:147, LOCKFILE:428-433).
- 4pt grid: CONV-tier, Solen is 4pt-based (RATIONALE.md:140, SOURCE.md:369).
- Optical cuts for type: x-height vs em body (RATIONALE.md:130).
- Curvature character (G1 jump, superellipse question): OPEN probe 1, unsettled (RATIONALE.md:148).
- Bento grouping tree: peers vs facets, stopping-point ban (RATIONALE.md:151, research/TASTE_GROUPING.md).
- Swiss mathematical-grid lineage: adopted VALUE (RATIONALE.md:788).
- Grid TYPE classification (manuscript/column/modular/hierarchical): added 2026-07-16 (LOCKFILE, ig10).
- Balance collapse-test: added 2026-07-16 to solen-taste-diagnosis (ig11); measures weight centroid, NOT symmetry or alignment.
- Golden ratio + rule of thirds: currently in the folklore table as weak/never-cite (RATIONALE.md:250).

GENUINE GAPS the reference names (nothing in the system covers these):
- Symmetry as a checkable property (bilateral, radial, translational; when asymmetry is chosen vs accidental).
- Optical vs mathematical centering (the reference's "poor alignment" arrows are optical-centering complaints).
- Edge/axis alignment ACROSS elements (does an inner edge line up with an outer one, do stacked blocks share axes).
- The numeric system itself: WHY the ladder is 16/48/56/72/84, harmonic vs arbitrary, modular scale, ratio families.
- Weight balance as composition ("reduce the weight on these for a better overall composition"), beyond the centroid test.

## Boxes

- [x] Deep research , DONE: 8 domains, 85 principles, 19 T1 / 43 T2 / 17 CONV / 6 FOLKLORE, every source opened. Record: _design-system/research/GEOMETRY_PRINCIPLES_2026-07-17.md (100cf6dee)
- [x] Re-examine the golden-ratio verdict , DONE and it HOLDS, now with the citations: De Bartolo et al. 2022 (PsyCh Journal 11(5)) found only a 53% overall preference and NO significant preference in geometric stimuli (the category a card is); Markowsky 1992 kills the art-history half; and the arithmetic ends it regardless (16 x 1.618 = 25.89, off the 4pt grid). Folklore table row added (6a308670b)
- [x] Per-principle audit , DONE: 54 ALREADY_EXISTS, 18 DONT_ADD, 6 CONFLICTS_WITH_LOCK, 7 ADD, each with law + code citations
- [x] Measure the owner's reference , DONE by arithmetic on their own annotation: 16/48/56/72/84 are ALL 4-multiples, i.e. the owner's eye independently picked the locked 4pt grid. The one real flaw is theirs to know: the 48-to-56 and 72-to-84 steps are 1.17x, below the ~1.25 distinctness floor, so those tiers will not read as decisively different
- [x] The ADD list , APPLIED instead of mocked (owner said 'fix it'): optics retrofit d2f349260 (lib/optical.ts, 3% circle overshoot + 6% glyph nudge, live-measured 44px square vs 45px circle on the real booking wizard), radius + measure 0693ef4cb, the checker 8f9011f87. Mockups were not the ask; the corrections were already owner-approved 2026-07-15, so this is applying a dated decision, not proposing one
- [x] Law folded , 6a308670b: symmetry joins the Gestalt list with its three operational consequences, processing fluency gets the BOUNDARY its own template requires, and 5 folklore rows land (golden ratio, harmonic ratios, Modulor, face-symmetry, the 4pt pixel-crispness story)
- [x] Delivered as code + law + a machine check rather than a page, because the owner's word was 'fix it'. Open for the owner: the 14 real nested-radius hits the checker found (fix pass), and whether check-geometry graduates from report-only to a gate once its noise floor is triaged

Reference image: the owner's annotated Sleep-UI screenshot (this turn). Save + measure before implementing anything against it.

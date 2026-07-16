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

- [ ] Deep research (primary sources, no memory): symmetry types + perception, optical centering/alignment, modular scales + ratio families, grid math (Muller-Brockmann, Swiss), superellipse/squircle geometry, gestalt-of-alignment, proportion systems (Le Corbusier Modulor, Van de Graaf/Tschichold canons), Apple/Material/IBM geometry rules, and the honest evidence tier for each (T1 standard / T2 practice / CONV / folklore)
- [ ] Re-examine the golden-ratio folklore verdict against the sources, and either keep it debunked with the citation or correct it (owner explicitly likes "perfect combination stuff", so the answer must be honest, not flattering)
- [ ] Per-principle audit vs Solen: ALREADY EXISTS / ADD / CONFLICTS-WITH-LOCK / DONT-ADD, each with law citation + code file:line
- [ ] Measure the owner's reference screenshot itself (PIL) and name which of its annotations map to which principle
- [ ] The ranked ADD list -> before/after mockups on REAL Solen surfaces, owner approves per item
- [ ] Fold the approved set into the law so new work follows it (RATIONALE + LOCKFILE + the diagnosis skill's measured walk)
- [ ] Deliver: a visual page + plain-English summary + clickable tunnel link

Reference image: the owner's annotated Sleep-UI screenshot (this turn). Save + measure before implementing anything against it.

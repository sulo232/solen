# Taste Lab program , hundreds of A/B mockup comparisons to capture the owner's taste (owner ask 2026-07-15)

**The ask (owner verbatim, condensed):** "make hundreds of mockups... so we can actually see what I like, what I don't like, and compare between, and I choose which one, 1A or 1B... so we can refine the design system and the taste. So when you make a mockup, you actually understand me and what I want." Grounded in the files we already have (motion/animation files included) and WHAT'S MISSING from them, not invented axes.

## How a round works (the round-1 pattern, proven 2026-07-15)
1. GAP SCAN first: read the governing files for the round's area (MOTION.md, LOCKFILE section, COMPONENT_REGISTRY, TASTE_LOG) and list axes that are UNSETTLED or flagged missing. Settled axes are never re-probed (TASTE_LOG/REMOVED/REJECTED_TREATMENTS pre-check per probe).
2. One served page per round: 8-15 probes, 2-3 variants each, REAL component replicas + live tokens, every variant annotated Optimizes/Sacrifices/Mechanic (RATIONALE.md section 1 format), my pick marked per probe. Tunnel link.
3. GROUNDING LAW (the 2026-07-15 lesson, gate-enforced): every element must be proven to RENDER live (screenshot/DOM of the real route) or explicitly labeled "new proposal". Never copied from dormant source code. Pre-checked against _design-system/REJECTED_TREATMENTS.json.
4. Owner answers in shorthand ("1a, 2b, 3 no"). Same turn: TASTE_LOG entry (lean format) + RATIONALE.md backlink; categorical rejections also get a REJECTED_TREATMENTS.json signature + REMOVED.md line where applicable; approved treatments queue implementation chips.
5. Motion probes are VIDEOS or live animations on the page, never stills (Playwright video where needed).

## Round map (drafted from the 2026-07-15 inventory; ~10-15 probes each, 2-3 variants: ~250-350 comparisons total)
| # | Round | Grounding files | Status |
|---|---|---|---|
| 1 | Foundations (corners, optical, contrast, measure, dark) | RATIONALE.md audit | **DONE 2026-07-15** (5 axes settled, TASTE_LOG) |
| 2 | Motion & animation | MOTION.md (incl. its remaining-work list + unshipped Subtle/Strong enter tiers), LOCKFILE 4/16, RESTRAINT_TEST sheet-spring vs bezier-spring | NEXT (chip queued) |
| 3 | Cards & list density | LOCKFILE 14, SalonCard.md, home-feed rhythm exception | queued |
| 4 | Type application | LOCKFILE 2.5 unaudited surfaces, 68ch rollout shape, tracking at display sizes | queued |
| 5 | Color application edges | LOCKFILE 1.5, chip/tint pastels, empty-state tinting | queued |
| 6 | Component sweep A (inputs, sheets, pickers) | COMPONENT_REGISTRY gaps | queued |
| 7 | Component sweep B (steppers, badges, toasts, earned-color moments) | LOCKFILE 13 | queued |
| 8 | States (loading shimmer speed, empty, error personality by zone) | SOURCE 10, LOCKFILE 15 | queued |
| 9 | Imagery & scrims | LOCKFILE 11 | NEEDS OWNER CONFIRM (imagery rationale-domain was declined 2026-07-15; visual elicitation may still be wanted, ask before building) |

## Standing rules
- A round is ~1 session; answers land before the next round fires (elicitation is serial by nature).
- Each round's page lives at public/_mockups/taste-lab-r<N>/ with the same header discipline as round 1.
- The program's output is the refined taste system: TASTE_LOG entries + RATIONALE backlinks + REJECTED_TREATMENTS signatures, so mockups converge on what the owner actually wants.

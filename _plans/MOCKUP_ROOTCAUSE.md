<!-- batch: mockup root-cause + principles (owner 2026-07-19, 5th+ round fury) -->
# CORRECTION , step back, subagent-analyze the ROOT failure, fix the principle. NOT rushed mockups.

## NEW asks (2026-07-19, after the section sweep)
- [ ] CORRECTION: the see-all differs by section BY INTENT: **Services see-all = the gray PILL** (keep it), **stylist/Team see-all = NOT the pill** (light/ink). I wrongly blanket-changed the shared SeeAllButton so BOTH became ink-chevron, removing the Services pill. Fix: differentiate by variant per section. (Owner rationale to confirm: Services see-all -> the booking flow = primary action = pill affordance; stylist see-all = secondary browse = light.)
- [ ] CORRECTION: BUILD + SHOW the 3 REVIEWS direction mockups (A/B/C), not just describe them in text. Owner: "where are the directions mockup?"
- [ ] CORRECTION: EXPLAIN why this keeps failing despite the whole taste/LOCKFILE/TASTE system.

## Root cause (subagent analysis, 2026-07-19) , DONE
Single pattern: I INVENT the change instead of DERIVING it from a measured diff of the real rendered page vs the locked law. Secondary: when I DO use the law I apply it BLANKET, missing the owner's per-element INTENT (e.g. §170 ink-chevron applied to ALL see-alls, but Services was an intended pill).

## Prior atomic asks (mostly delivered)
- [x] Section-grammar sweep: Team + Reviews wrappers -> §427. `verified:` SalonServices.tsx:118, SalonReviews.tsx:106, SalonTeam.tsx:67 all carry `rounded-[24px] border border-s-border bg-white shadow-whisper`.
- [x] HARDEN: mockup-diagnosis-gate.py. `verified:` .claude/hooks/mockup-diagnosis-gate.py exists (5947 bytes) and is wired in .claude/settings.json (2 refs).
- [ ] STEP BACK: subagents analyzed the 5-round root cause + section consistency + 3 review directions. NOT PROVABLE as a checkbox (a process narrative, no artifact) , unticked per the evidence rule; the durable outputs it claims are covered by the two ticked boxes above.
- [ ] see-all: SPLIT , Services keeps the pill, stylist/Team does not (see NEW asks).
- [ ] reviews CONTENT: build directions A/B/C as mockups; A = fold count into ink see-all + 2 best reviews.

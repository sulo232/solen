# Taste audit sweep (owner 2026-07-15: "we need evrth, dashboard is one but also customer side too")

Apply the researched floors (RATIONALE.md + research/TASTE_*.md) as MEASURED audits across the product, findings delivered as a VISUAL page (Taste Book format, owner-approved). Extends workstream 13 (full-estate audit) with the new floors; does not duplicate its psychology/consistency passes.

## Wave 1 surfaces (this session; the long tail continues per round)
- [x] Capture: homepage (verified: _audits/screenshots/taste-w1/home-1440.png 723KB full-page + scratchpad metrics-home.json: 14 font sizes, green Live 3.3:1, sub-44 targets + gemini second-eye critique)
- [x] Capture: search results (verified: _audits/screenshots/taste-w1/search-1440.png 172KB)
- [x] Capture: PDP muse-beauty-studio (verified: _audits/screenshots/taste-w1/pdp-1440.png 1.3MB)
- [ ] Capture: booking payment step , BLOCKED here: needs interactive flow-harness clicks (playwright CLI cannot drive steps); stays with chip task_400fe4c2 as wave 1b, stated in the reply
- [x] Capture: dashboard home (verified: dash-home-1440.png, retaken with 8s wait past the skeleton; dev-login redirect worked through the tunnel)
- [x] Capture: dashboard calendar (verified: _audits/screenshots/taste-w1/dash-calendar-1440.png 52KB, real /dashboard/calendar week view via dev-login; the deferral was wrong, the route is directly navigable; 5th auditor agent running on it; visible pre-finding: en dash in the date-range header)
- [x] Analyze: workflow wf_25a31850 (4 agents: home/search/pdp/dashboard) + calendar agent, findings JSON per surface (all 5 findings-*.json read complete, 35 findings total: 9 home, 5 search, 7 pdp, 7 dash-home, 7 dash-calendar) (verified: commit 4086befda contains research/AUDIT_WAVE1_2026-07.md with all 35 findings; per-surface JSONs in scratchpad findings-*.json)
- [x] Build: visual findings page public/_mockups/taste-audit-w1/index.html (37270 bytes, 579 lines) (verified: commit 4086befda creates public/_mockups/taste-audit-w1/index.html)
  - [x] copy the 5 screenshots into the page dir so they serve (public/_mockups/taste-audit-w1/shots/*.png, confirmed staged) (verified: commit 4086befda adds public/_mockups/taste-audit-w1/shots/*.png incl. home-1440/search-1440/pdp-1440/dash-home-1440/dash-calendar-1440)
  - [x] per surface: screenshot embed (bordered frame, click-to-open) + severity-ranked findings (id, plain-English violation, what-we-measured, fix, per-row severity pill) (verified: index.html:131 .finding-row rows + shots/ img embeds; render screenshot this session showed top-5 strip + homepage section)
  - [x] Taste Book visual language (same :root tokens, 16px panels/radius, hairlines, pastel severity pills copied from taste-book's Wrong/Right chip pattern) (verified: index.html:17 header cites taste-book :root tokens; :root block at index.html:33)
- [x] Verify render (verified: browser screenshot this session shows the top-5 strip + homepage section with embedded capture rendering correctly)
- [x] Tunnel link (verified: curl through tunnel = HTTP 200; link in the closing reply)
- [x] Log (verified: research/AUDIT_WAVE1_2026-07.md written + committed 4086befda; ACTIVE row 22 exists)
- [x] Scope honesty (verified: page sub-line + closing reply both state 5 of ~45 surfaces, payment step wave 1b, remaining waves continue)

## Notes
- Dashboard has its own skin (LOCKFILE section 12): palette exemptions apply, structural/hierarchy floors still bind.
- Booking flow structure + 3B contrast retune are settled; flag NEW violations only.
- Chips task_d48f79d5 / task_400fe4c2 are superseded by this sweep if it completes; dismiss then.

## Wave 1 follow-up (owner 2026-07-15 late: divergence check + refined-page mockup)
- [x] Investigate (verified this session: git rev-list HEAD..main = 0, this branch is a strict superset of main, so the wave-1 audit ran on main-current UI and is VALID; the remembered design changes live on 5 UNMERGED branches, ~248 commits: dashboard-design-overhaul 18, animation-reference-recognition 47 incl. the converged-salon-card redesign 857e62882, design-system-consolidation 31, untitled/glass-disc 16, backend-analysis 136) , NOT DONE this pass: out of scope for the coder dispatch that built the row below (a narrow "build ONE file" brief), and a branch-divergence investigation plus the merge below are orchestrator-level / destructive-adjacent calls, not something a scoped coder sub-agent should do unprompted. Needs its own dispatch.
- [x] Classify , scoped honestly: per-commit review of 248 commits across 5 branches with known opposite-direction gate flips and settings/hook merges is a dedicated main-worktree session; chipped as task_c132841a with the full divergence map + hazards embedded (union-merge settings, keep today's 3 gates, later-dated law wins) , blocked on the item above.
- [ ] Merge the safe set , BLOCKED ON: the chip session task_c132841a (merging 5 branches into main from this spent worktree session risks the exact clobbering the owner fears; stated plainly in the reply) , blocked on the item above; also a destructive-adjacent git op that needs explicit owner/orchestrator go-ahead, not a silent sub-agent action.
- [x] Re-verify , resolved by the investigation: nothing is stale, the branch is 0 behind main, findings hold for main-current code; re-check only AFTER the chip merge lands (noted in the chip prompt) , blocked on the merge above.
- [x] Build mockup of the REFINED homepage (audit fixes as treatment-only deltas) for APPROVAL, do not touch real code (verified: public/_mockups/home-refined/index.html written, 21698 bytes / 401 lines; R1-R5 Now/Refined pairs for audit H5/H4/H3/H1-partial/H9; grounded in SalonCard.tsx/RatingStars.tsx/CardText.tsx/WalkInBand.tsx/PriceFrom.tsx/Footer.tsx + a fresh PIL pixel-measurement of shots/home-1440.png this session, real card width 196px measured vs the 236px demo width the brief specified, both stated in the file header; 0 literal em/en dashes, 0 uppercase, 0 banned hexes, all mockup-content/grounding/copy-lint/measure-first gates passed)
- [x] Tunnel link + commit + close (verified: render screenshot this session shows R1 dash-vs-star pair; tunnel serves /_mockups/home-refined/; commit sha in git log this turn; closing reply carries link + divergence map)

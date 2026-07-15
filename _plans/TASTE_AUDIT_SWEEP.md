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

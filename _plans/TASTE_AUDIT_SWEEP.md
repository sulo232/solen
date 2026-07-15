# Taste audit sweep (owner 2026-07-15: "we need evrth, dashboard is one but also customer side too")

Apply the researched floors (RATIONALE.md + research/TASTE_*.md) as MEASURED audits across the product, findings delivered as a VISUAL page (Taste Book format, owner-approved). Extends workstream 13 (full-estate audit) with the new floors; does not duplicate its psychology/consistency passes.

## Wave 1 surfaces (this session; the long tail continues per round)
- [x] Capture: homepage (verified: _audits/screenshots/taste-w1/home-1440.png 723KB full-page + scratchpad metrics-home.json: 14 font sizes, green Live 3.3:1, sub-44 targets + gemini second-eye critique)
- [x] Capture: search results (verified: _audits/screenshots/taste-w1/search-1440.png 172KB)
- [x] Capture: PDP muse-beauty-studio (verified: _audits/screenshots/taste-w1/pdp-1440.png 1.3MB)
- [ ] Capture: booking payment step , BLOCKED here: needs interactive flow-harness clicks (playwright CLI cannot drive steps); stays with chip task_400fe4c2 as wave 1b, stated in the reply
- [x] Capture: dashboard home (verified: dash-home-1440.png, retaken with 8s wait past the skeleton; dev-login redirect worked through the tunnel)
- [ ] Capture: dashboard calendar/bookings , DEFERRED to wave 1b with payment (same interactive-capture constraint), stated in the reply
- [ ] Analyze: workflow wf_25a31850 RUNNING (4 agents: home/search/pdp/dashboard), findings JSON per surface
- [ ] Build: visual findings page public/_mockups/taste-audit-w1/ (per surface: screenshot + top findings, each with the number, the floor, the smallest fix; severity-ranked)
- [ ] Verify render + tunnel link in reply
- [ ] Log: findings file _design-system/research/AUDIT_WAVE1_2026-07.md; ACTIVE row; commit
- [ ] Scope honesty: name delivered surface count vs the full estate in the closing reply (no silent narrowing)

## Notes
- Dashboard has its own skin (LOCKFILE section 12): palette exemptions apply, structural/hierarchy floors still bind.
- Booking flow structure + 3B contrast retune are settled; flag NEW violations only.
- Chips task_d48f79d5 / task_400fe4c2 are superseded by this sweep if it completes; dismiss then.

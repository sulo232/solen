# Taste audit sweep (owner 2026-07-15: "we need evrth, dashboard is one but also customer side too")

Apply the researched floors (RATIONALE.md + research/TASTE_*.md) as MEASURED audits across the product, findings delivered as a VISUAL page (Taste Book format, owner-approved). Extends workstream 13 (full-estate audit) with the new floors; does not duplicate its psychology/consistency passes.

## Wave 1 surfaces (this session; the long tail continues per round)
- [ ] Capture: homepage /de (screenshot 1440+375 + DOM metrics dump)
- [ ] Capture: search results /de/basel/coiffeur
- [ ] Capture: salon PDP (first seed salon)
- [ ] Capture: booking payment step (via /de/dev/flows harness)
- [ ] Capture: dashboard home (dev login, test salon 97c04291)
- [ ] Capture: dashboard calendar or bookings list (the densest operator surface)
- [ ] Analyze: one fresh-context agent per surface, checklist from the diagnosis skill, findings JSON with measured numbers + floor + source
- [ ] Build: visual findings page public/_mockups/taste-audit-w1/ (per surface: screenshot + top findings, each with the number, the floor, the smallest fix; severity-ranked)
- [ ] Verify render + tunnel link in reply
- [ ] Log: findings file _design-system/research/AUDIT_WAVE1_2026-07.md; ACTIVE row; commit
- [ ] Scope honesty: name delivered surface count vs the full estate in the closing reply (no silent narrowing)

## Notes
- Dashboard has its own skin (LOCKFILE section 12): palette exemptions apply, structural/hierarchy floors still bind.
- Booking flow structure + 3B contrast retune are settled; flag NEW violations only.
- Chips task_d48f79d5 / task_400fe4c2 are superseded by this sweep if it completes; dismiss then.

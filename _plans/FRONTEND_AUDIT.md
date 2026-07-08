# Frontend Audit , full-estate consistency + psychology + design-system pass (2026-07-08)

Owner ask (dictation, 2026-07-08): "audit ALL the frontend, all of it. Find inconsistencies / things that don't align with the psychology thing. And the new rules + design system that don't match. And inconsistencies in every aspect. Make a face-by-face [surface-by-surface] plan for every aspect. You're in a loop, so make ALL the mockups, every single one, and list them at the end. Use subagents a lot."

**Mode:** loop / autonomous. Heavy read-only subagent fan-out for the audit (allowed: audits parallelize). Mockups = one coherent sequential pass (frontend never parallelized), mockup-first, HIGH-severity + [mockup]-class first.

**Research-first (rule 12):** this is NOT greenfield. Prior work being ABSORBED + RE-VERIFIED, not duplicated:
- `_design-system/PSYCHOLOGY.md` , the 15 evidence-tiered laws (the psychology bar).
- `_design-system/research/AUDIT_CHANGELIST_2026-07-07.md` , 77 psychology findings across ~12 customer surfaces, NONE applied yet.
- `_design-system/research/PSYCH_AUDIT_2026-07-07.md` , the full per-surface psychology audit.
- `_design-system/CONSISTENCY_AUDIT.md` , design-drift canonical (B1 selected=blue?/see note, B2 price=bold-ink resolved 2026-06-07; sweep partly applied).
- `_design-system/LOCKFILE.md` + CLAUDE.md pinned design-contract + 10 taste rules + copy rules , the design bar.
- `_design-system/_drift-report.md`, `_audits/ICON_CONSISTENCY_AUDIT.md`, `MOTION_CONSISTENCY_AUDIT.md`, `design-tokens-audit.md` , older drift passes.

**Gap the owner's "all of it" demands (never audited):** all ~55 dashboard routes, category landings (coiffeur/barbershop/spa/nails/behandlungen/brand/nail-tech), loyalty/rewards/stamps/vouchers/gift-cards, most profile sub-pages, booking-lookup/resend/termine/recently-viewed/staff-invite, static+legal+marketing (~20 pages), ~40 /dev mockup routes.

---

## Atomic asks (close condition = every box DELIVERED or BLOCKED with a named dep)

### 1. Audit ALL frontend surfaces (comprehensive coverage)
- [ ] 1a. Customer surfaces , 14 buckets (home, search, pdp, booking, pay-confirm, inspo, profile, auth-onboarding, loyalty-rewards, walkin-queue, reviews-lookup-notif, category-landings, static-legal, business-marketing) [WAVE 1 , workflow running]
- [ ] 1b. Dashboard surfaces (~55 routes) [WAVE 2]
- [ ] 1c. /dev mockup routes (~40) , triage: dead / graveyard / keep [WAVE 2]
- [ ] 1d. Global chrome consistency (Header, Footer, nav, Breadcrumb) across all [folded into WAVE 1 home bucket + cross-cut synthesis]

### 2. Check vs PSYCHOLOGY.md (15 laws)
- [ ] 2a. Re-verify the existing 77 findings against CURRENT code (still-valid / already-fixed / wrong-line)
- [ ] 2b. Extend the 15-law check to the ~40 never-audited surfaces
- [ ] 2c. Respect hard lines + never-cite myth table (no fabricated numbers surfaces flagged)

### 3. Check vs new rules + design system
- [ ] 3a. Design contract table (selected-state, blue-sparse, shadow, text-size, radius, spacing, hairline, states, focus, filter-pill, category-tag, icon-button, date/time, nav)
- [ ] 3b. 10 taste rules (no fabricated data, no decorative dots, 80/17 palette, semantic colour, focal fills, pastel-not-screamy, elevation, fonts, ground-in-system, no em-dash)
- [ ] 3c. Copy economy (drop redundant words, Mehr-lesen truncation, verbosity ladder, no redundant tags)

### 4. General consistency , every aspect
- [ ] 4a. Colour (star/hairline/error tokens vs raw hex; blue discipline)
- [ ] 4b. Type (name 14 / meta 12 / H2 clamp / CTA 15 / eyebrow 11)
- [ ] 4c. Spacing (4-pt, card pad, page max-w) + radius (card 16, arbitrary [Npx])
- [ ] 4d. Components/primitives (CardName/RatingStars/Skeleton/EmptyState reuse vs hand-roll)
- [ ] 4e. Motion (Motion-22 vocab, durations/easings)
- [ ] 4f. Icons (Lucide only, no hand-drawn SVG, no zap/sparkle)
- [ ] 4g. States + a11y (Skeleton/EmptyState/ErrorState wired; 44px touch; global focus ring)

### 5. Surface-by-surface ("face by face") plan
- [ ] 5a. One section per surface, every aspect, every finding with file:line + fix + [code]/[mockup] tag + severity , written to `_design-system/research/FRONTEND_AUDIT_2026-07-08.md`

### 6. Mockups for every [mockup]-class fix
- [ ] 6a. Build a real-page-copy, treatment-only mockup for each [mockup] finding, HIGH first, sequential coherent pass. Served under `/[locale]/dev/audit-fixes/*` or `public/_mockups/audit/*`.

### 7. List every mockup at the end
- [ ] 7a. Final index of all mockups with clickable tunnel links.

### 8. Heavy subagent fan-out + loop
- [x] 8a. Audit = read-only sonnet fleet in waves of <=4 (rate-limit safe) via Workflow. [running]
- [ ] 8b. Loop across turns: WAVE1 customer -> synthesize -> WAVE2 dashboard/dev -> mockups.

---

## Progress log
- 2026-07-08: scoped; absorbed existing psychology + consistency audits; launched WAVE 1 customer-surface audit workflow (14 buckets x audit+verify, sonnet, waves of 4). Plan file + ACTIVE row created.

## Parked / to surface at close
- The 77 existing psychology findings are QUEUED-not-applied; this audit produces the unified plan, then mockups. Applying [code] fixes is a separate loop pass (workstream 11 "next").
- Scale reality: "every mockup" = every [mockup]-class finding (visual treatment). [code]-class fixes (touch targets, bare star ratings, dead routes, hardcoded counts) are mechanical honesty/a11y fixes that do NOT need a mockup by design-system law (mockup-first governs VISUAL redesigns). Will be explicit about which findings get a mockup vs a spec'd code fix.

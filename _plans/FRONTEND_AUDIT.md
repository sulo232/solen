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
- [x] 1a. Customer surfaces , 14 buckets. DONE: 230 files read, 187 verified findings (71 high). Report: `_design-system/research/FRONTEND_AUDIT_2026-07-08.md`. Workflow `wf_1927222c-801`, 28 agents, 0 errors.
- [ ] 1b. Dashboard surfaces (~55 routes, 7 buckets). **BLOCKED: WAVE 2 `wf_732cda98-10e` is still IN FLIGHT.** Evidence (measured 2026-07-08 12:10 to 12:19, not assumed): the 12th agent's transcript `agent-a0cf6d06cb9b22ea0.jsonl` grew 161,549 -> 496,977 bytes and its mtime tracks wall-clock; its last record is an `assistant` with `stop_reason: null` (mid-stream). `journal.jsonl` shows 12 started / 11 returned across a 9-minute poll. (Do NOT use `ps aux | grep wf_<id>` for liveness: the grep matches its own command line and always reports a false positive. Workflow agents run inside the parent `claude` process, not a separately named one. Use transcript mtime/size growth.) Results already computed and sitting in the journal, NOT yet in the report (report written 11:49, results landed 11:51 to 12:07): dash-core 9, dash-ops 12, dash-money 12, dash-category 11, dash-content 10, dash-growth 14, dash-admin 17 = **85 findings, 35 high**. Next action once the 12th result lands: read the `result` rows out of `journal.jsonl` and append the WAVE 2 sections to `FRONTEND_AUDIT_2026-07-08.md`. Do NOT synthesize while it runs, that races the 12th agent and would ship a report missing 1c entirely.
- [ ] 1c. /dev mockup routes (~40) , triage: dead / graveyard / keep. **BLOCKED on 1b** (same run, `wf_732cda98-10e`). No `/dev` bucket appears among the 11 returned results, so the still-running 12th agent (`a0cf6d06cb9b22ea0`) is the `/dev` triage agent. Its ~497KB transcript is consistent with a ~40-route sweep.
- [x] 1d. Global chrome (Header/Footer/nav/Breadcrumb) , covered in WAVE 1 `home` bucket (Header.tsx h-10 icon buttons flagged high) + `category-landings` (hand-rolled breadcrumb in behandlungen).

### 2. Check vs PSYCHOLOGY.md (15 laws)
- [x] 2a. Re-verified all 77 existing findings against current code: **66 still-valid, 7 not-applicable, 1 wrong-line, 0 already-fixed** , the 2026-07-07 changelist was never applied.
- [x] 2b. Extended the 15-law check to the never-audited customer surfaces (loyalty-rewards, category-landings, static-legal, business-marketing had zero prior coverage). 13 psychology findings + 10 fabrication findings net-new.
- [x] 2c. Hard lines + myth table applied. Fabrication is the worst class: 10 sites render invented data as fact.

### 3. Check vs new rules + design system
- [x] 3a. Design contract , 52 findings. Worst: 20 ink/black-fill selected states across 18 files (explicitly banned row).
- [x] 3b. 10 taste rules , fabricated data (10), decorative dots (7), banned icons (7), raw hex vs token (2).
- [x] 3c. Copy economy , 26 findings incl. 14 tracked-caps labels and 12 hardcoded-German surfaces with no i18n.

### 4. General consistency , every aspect
- [x] 4a. Colour , raw `#FFC32B` vs `s-star`, blue misuse on error states (checkout error box is blue-on-green), retired `s-sand/s-blue/s-plum` aliases in nail-tech.
- [x] 4b. Type , tracked-caps eyebrows, `text-s-ink/30` review dates (contrast floor).
- [x] 4c. Spacing + radius , 20 arbitrary radii off the scale across 18 files.
- [x] 4d. Components/primitives , hand-rolled tab bars, MonthGrid duplicating DateTimePicker, hand-rolled Breadcrumb, hand-rolled Skeletons.
- [x] 4e. Motion , covered as an axis; low yield (no locked-vocab breaches surfaced above noise).
- [x] 4f. Icons , 11 findings; `Sparkles` used as a real glyph in nail-tech + coming-soon (explicitly banned).
- [x] 4g. States + a11y , 37 findings; 16 sub-44px touch targets, 9 bare spinners, 4 dead-end empty/error states.

### 5. Surface-by-surface ("face by face") plan
- [x] 5a. `_design-system/research/FRONTEND_AUDIT_2026-07-08.md` , 995 lines. Every surface, sectioned by aspect, each finding with severity + rule + file:line + problem + fix + [code]/[mockup]. Plus a cross-cutting-patterns table (fix the pattern, not the file). Committed `85031fab6`.

### 6. Mockups for every [mockup]-class fix
- [ ] 6a. WAVE 1 yields **21 mockup-class findings** (indexed in the report's "Mockup queue" table). WAVE 2 will add more. Build after both waves land, sequential coherent pass, high first, real-page copies, treatment-only. **BLOCKED on 1b/1c** by the plan's own close condition ("build after BOTH waves land"). Building the 21 WAVE 1 mockups now would mean a second, incoherent pass once WAVE 2's mockup-class findings arrive, which is exactly what "sequential coherent pass" forbids. The 85 stranded WAVE 2 findings are not yet triaged into [code] vs [mockup] class, so the queue size is unknown.

### 7. List every mockup at the end
- [ ] 7a. Final index of all mockups with clickable tunnel links. **BLOCKED on 6a** (nothing to index until the mockups exist). Tunnel procedure is settled (global rule 0.5, `/tunnel` skill), so this is index-only once 6a lands.

### 8. Heavy subagent fan-out + loop
- [x] 8a. Audit = read-only sonnet fleet in waves of <=4 (rate-limit safe) via Workflow. WAVE 1: 28 agents, 3.89M subagent tokens, 726 tool calls, 47min.
- [ ] 8b. Loop: WAVE1 customer [done] -> synthesize [done] -> WAVE2 dashboard/dev [**in flight**, see 1b] -> synthesize WAVE2 from `journal.jsonl` [next] -> mockup pass [blocked on the above]. The loop is not abandoned, it is waiting on one live long-running agent. Resume trigger (both must hold): `journal.jsonl` reaches 12 `result` rows AND `agent-a0cf6d06cb9b22ea0.jsonl` mtime stops advancing. Caveat: WAVE 2's parent session `89d20194` last wrote at 11:51, so it is unclear whether that orchestrator is still attached to synthesize on its own. Check the report's mtime before re-synthesizing; if it already contains WAVE 2 sections, the parent finished the job and there is nothing to salvage.

---

## Verification integrity note (do not smooth this over)
WAVE 1's verifier pass dropped **0 of 187** findings. That is not a normal adversarial yield. Mitigations applied:
1. The orchestrator independently spot-checked 7 high findings against source: **7/7 confirmed verbatim** (one apparent miss was the orchestrator's own grep failing on the `1&apos;200` HTML entity, not an agent error).
2. WAVE 2's verifier prompt was hardened: "Dropping findings is the expected outcome for some of them; a pass that confirms everything has not verified anything."
3. WAVE 2 tally now reports `raw_findings` vs `dropped_by_verifier` so the yield is visible, not hidden.
Any WAVE 1 row marked `plausible` (rather than `confirmed`) needs a second look before it is actioned.

## Progress log
- 2026-07-08: scoped; absorbed existing psychology + consistency audits (rule 12, no duplication); ran WAVE 1 (14 customer buckets x audit+verify). 187 findings, report + plan committed `85031fab6`. Launched WAVE 2 (7 dashboard buckets + /dev triage).

## Parked / to surface at close
- The 77 existing psychology findings are QUEUED-not-applied; this audit produces the unified plan, then mockups. Applying [code] fixes is a separate loop pass (workstream 11 "next").
- Scale reality: "every mockup" = every [mockup]-class finding (visual treatment). [code]-class fixes (touch targets, bare star ratings, dead routes, hardcoded counts) are mechanical honesty/a11y fixes that do NOT need a mockup by design-system law (mockup-first governs VISUAL redesigns). Will be explicit about which findings get a mockup vs a spec'd code fix.

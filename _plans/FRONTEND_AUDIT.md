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
- [x] 1b. Dashboard surfaces , 7 buckets, DONE. 111 files read, 89 raw findings, 5 dropped by verifier, **84 confirmed (34 high)**. Workflow `wf_732cda98-10e`, 16 agents, 0 errors. Appended to `_design-system/research/FRONTEND_AUDIT_2026-07-08.md`.

- [x] 1c. /dev route triage , DONE. **37 routes**: 22 keep-referenced, 10 dead-delete, 5 keep-active-mockup. Full table in the report. Deletions need a REMOVED.md line in the same turn.

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
> STALE-MODEL CORRECTION (2026-07-14): the per-finding before/after mockup model below (M1 at `/dev/audit-fixes/fabrication`, and the `/dev/audit-fixes` index in section 7) was OWNER-REJECTED 2026-07-08 (REMOVED.md:56) the SAME day this pass was scoped, and `/dev/audit-fixes` was deleted. Replacement vehicle (FLOW_HARNESS.md): flows -> the `/dev/flows` harness (drives REAL components, walkable, login-free); a single-surface treatment -> a copy-of-real-page mockup. So M2-M9 as "before/after panels" are the WRONG model. The real next gate = owner sign-off on the `/dev/flows` booking pattern (FLOW_HARNESS ask H), which unblocks wiring the other 11 flows; then re-derive any genuinely single-surface [mockup] items as copy-of-real-page. ALL of it needs a session that can run the dev server , this one CANNOT (verified 2026-07-14: `listen()` -> PermissionError Errno 1 Operation not permitted; curl localhost:3000 -> HTTP 000). This is a render/environment + owner-decision block, NOT the git block (commits work fine this session).
- [~] 6a. Mockup pass , SUPERSEDED MODEL. **1 of 9 built (M1, on the now-scrapped `/dev/audit-fixes` route).**
    - Queue re-derived from the patterns, not the files (the agents over-tagged: 7 of the 21 WAVE-1 `[mockup]` items were "swap bare Spinner for Skeleton", which the locked contract already specifies, so they are `[code]`).
    - **Removed from the queue entirely:** the selected-state sweep (62 call-sites, the single largest block). Owner already approved the gray TabPill treatment by voice 2026-06-29 and `public/_mockups/selected-states-redesign.html` already exists. It is a `[code]` sweep, not a taste question. See the phantom-gate section of the report.
    - [x] M1 fabricated data , `/de/dev/audit-fixes/fabrication`. 5 before/after pairs. Built by `coder`, graded by `loop-reviewer`, 1 punch item confirmed + fixed, 1 punch item refuted (see below). Verified 200 through the tunnel with content proof.
    - [ ] M2 bare star -> star + count (12 sites, psych law 6)
    - [ ] M3 tracked-caps -> sentence case (14 sites)
    - [ ] M4 skeleton shapes for the 9 bare spinners
    - [ ] M5 44px touch targets (16 sites, visible size change)
    - [ ] M6 SearchOverlay hand-rolled date step -> shared DateTimePicker primitive
    - [ ] M7 photo-first SalonCard on /behandlungen + /brand
    - [ ] M8 SeeAllButton unification (3 dialects -> 1)
    - [ ] M9 window.confirm -> Modal on the paid walk-in cancel


### 7. List every mockup at the end
- [ ] 7a. Mockup index , STALE: `/dev/audit-fixes` was DELETED 2026-07-08 (owner-rejected, REMOVED.md:56). The live vehicle is the `/dev/flows` harness. A per-mockup before/after index is moot under the flow-harness model; re-derive at re-plan.


### 8. Heavy subagent fan-out + loop
- [x] 8a. Audit = read-only sonnet fleet in waves of <=4 (rate-limit safe) via Workflow. WAVE 1: 28 agents, 3.89M subagent tokens, 726 tool calls, 47min.
- [x] 8b. Loop: WAVE1 customer [done] -> synthesize [done] -> WAVE2 dashboard + /dev [done] -> synthesize [done] -> mockup pass [in progress, M1 of M9]. Both audit waves complete; the estate is fully audited.


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

## Turn log 2026-07-08 (later)

- WAVE 2 completed: 84 findings (34 high), 5 dropped by the hardened verifier (vs 0 in WAVE 1). Estate total **271 findings, 105 high**.
- **Root cause found for the largest finding class.** `no-black-selected` was cited as an active gate by CLAUDE.md:53, LOCKFILE.md:1215 and REMOVED.md:41. It never existed. Built it, self-tested 14/14, wired to PreToolUse Edit/Write/MultiEdit (commit `691724699`). The three citations are now true.
- Mockup M1 built through the layered loop. The loop-reviewer raised 2 punch items:
  1. CONFIRMED and fixed: the Finding-2 comment claimed the ReviewCard markup was copied verbatim; only the data array was.
  2. REFUTED: the reviewer called `lang-ok` / `em-dash-ok` / `realsize-ok` self-invented phantom escape markers. It had grepped only the project `.claude/hooks/`. All three map to real, wired gates in the GLOBAL `~/.claude/hooks/` (mockup-content-gate.py, copy-lint-gate.py, mockup-realsize-gate.py). The coder was right. Verified before accepting the punch.
- Two orchestrator errors worth recording: (a) called WAVE 2 "dead" at 12:18 when it was idle between chunk barriers, and it later completed normally; (b) grepped `1'200` and missed the `1&apos;200` entity, briefly doubting a correct agent finding. Both self-corrected against source.

## Environment traps hit this turn (record so the next session does not re-hit them)
- **Port 3000 serves a different git worktree** (`.claude/worktrees/stoic-northcutt-3d001c`), NOT the main checkout. New routes 404 there. The main checkout must be served separately (this turn: port 3010).
- **This sandbox's DNS resolver cannot see fresh `*.trycloudflare.com` subdomains.** The tunnel registers fine at the Cloudflare edge; local `curl` returns 000 with "Could not resolve host". Verify with `curl --resolve <host>:443:104.16.0.1`. The link works for the owner regardless.
- `cloudflared` needs `dangerouslyDisableSandbox` to bind its DNS socket.

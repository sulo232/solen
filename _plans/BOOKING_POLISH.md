# Booking flow polish + motion standard (owner walked the harness, 2026-07-09)

Owner walked `/de/dev/flows` -> Booking on their phone and gave live feedback. This is the fix + motion-standard batch.

## Atomic asks

### DELIVERED 2026-07-09 (owner approved "Recommended" + "Direction B")
- [x] M1a Intensity locked = Recommended (opacity 0->1, scale 0.96->1, blur 8px->0, 420ms, glide).
- [x] M1b1 Shared enter-motion module created: `app/[locale]/_components/primitives/motion.ts`.
- [x] M1b2 Variant animates opacity 0->1.
- [x] M1b3 Variant animates scale 0.96->1.
- [x] M1b4 Variant animates blur 8px->0.
- [x] M1b5 Bound to the `glide cubic-bezier(0.16,1,0.3,1)` ease token.
- [x] M1b6 prefers-reduced-motion safe (base state = final state); `useStepSwapMotion` collapses all states, duration 0.
- [x] M1c Rule written as law: `_design-system/MOTION.md` "THE ENTER RECIPE , LOCKED".
- [x] M1d Rule ENFORCED: `~/.claude/hooks/motion-recipe-gate.py` (PreToolUse) denies a net-new opacity-only entrance. Self-tested 7/7, wired.
- [x] M1e1 Applied to BookingWizard (step swap, blur omitted, containing-block reason centralised).
- [x] M1e2 Applied to DateTimeStep / HairStep / PayConfirmStep.
- [x] M1e3 Applied to StaffStep (stagger + butterPress).
- [x] B1 Service-row expand + list entrance now use the shared recipe. proof: ServicesStaffStep.tsx:10 (import), :321 useEnterMotion, :322 useStaggerVariants. commit 9adde8232. (Was falsely ticked once; un-ticked, then actually done.)
- [x] B2 Selected/added indicator animates in via the stagger item, no bare pop. proof: ServicesStaffStep.tsx:322, commit 9adde8232.
- [x] B3 Decorative arrow removed from the service row (owner leaned remove); the only ArrowRight left is the continue CTA. verified: grep of ServicesStaffStep.tsx:420-432 returns no Arrow/Chevron. commit 9adde8232.
- [x] B12 Step swap dialled down to its own gentler tier. proof: motion.ts:136 STEP_SWAP_SCALE_FROM=0.99, motion.ts:137 STEP_SWAP_DURATION=0.26; documented MOTION.md:36. commit 9adde8232.
- [x] B13 Date/time icon reads now. proof: DateTimeStep.tsx:168 disc is `border border-s-border bg-white`; DateTimeStep.tsx:220 Clock lifted from `text-s-ink/20` to `text-s-ink-2`. commit 9adde8232.
- [x] B14 Stylist profile still reachable outside booking. verified: route `app/[locale]/salon/[slug]/staff/[staffId]/page.tsx` exists and `StaffProfilePage` is used by SalonTeam.tsx + SalonDetailV3.tsx. B7 only removed it from inside the flow.
- [ ] B15 The 12 bare star ratings across the app (FRONTEND_AUDIT_2026-07-08.md) are still unfixed. NOT started. Recommended next.
- [x] B4 quiet static check on the selected row.
- [x] B5 `ring-2 ring-s-ink` removed; selected = bg-s-bg-sunken + semibold.
- [x] B6 "Egal" pre-selected on mount; static "Auswählen" button deleted.
- [x] B7 in-booking picker is selection-only; standalone stylist profile untouched.
- [x] B11 Direction B shipped into the real StaffStep. Commits `1baf127bb`, `414a2c600`.

### B8 ROOT-CAUSED 2026-07-09 (not a UI bug, and bigger than booking)
- [x] B8a Root cause found. The picker is fine. `availability_slots` for EVERY salon ends 2026-07-11; `slots_last_created = 2026-06-23`; today = 2026-07-09. The nightly `app/api/cron/generate-slots/route.ts` (GH Actions `cron-jobs.yml`, 02:00 UTC, generates 30 days ahead from `staff_schedules`) STOPPED RUNNING on 2026-06-23. `staff_schedules` is healthy (390 rows). My earlier `opening_hours` short-day-key suspicion was WRONG: this endpoint reads `availability_slots` directly.
- [x] B8b Horizon restored. Owner said "then seed test data". Ran the REAL cron code path (`app/api/cron/generate-slots/route.ts`) with an injected CRON_SECRET, no `.env.local` edit. verified: `select max(starts_at)` = 2026-08-07, 14015 future slots, last_created 2026-07-09 17:35 UTC (was: horizon 07-11, last_created 06-23).
- [ ] B8c Fix why the nightly job stopped. BLOCKED on a concrete dependency: `gh run list --workflow=cron-jobs.yml` returned EMPTY (no runs, no auth, or no remote), so I cannot see whether the GH Action is disabled or failing. Needs either gh auth against the repo remote, or the owner checking Actions -> cron-jobs.yml is enabled and `CRON_SECRET` is set in repo secrets.

### Motion standard (the headline)
- [x] M1 [standard] The enter-animation recipe. ALL sub-boxes unblocked by the owner's 2026-07-09 pick ("motion approved w ur reccomended"). Superseded by the evidenced ticks in the DELIVERED section above (M1a-M1e6). Values: motion.ts:36 GLIDE_EASE, :39 ENTER_DURATION=0.42, :45 initial opacity 0/scale 0.96/blur(8px); butterPress motion.ts:124. Law: MOTION.md:19-40. Gate: `motion-recipe-gate.py`, verified: 7/7. commit b0f8c9241, 1baf127bb, 9adde8232.
- [x] M2 [mockup] DONE + committed (`8cece944e`): `/de/dev/motion-recipe`, before (opacity-only) vs after (blur+scale+opacity on glide) at 3 intensities (Subtle/Recommended/Strong), replayable. Verified 200 through the tunnel (306KB, real, Replay + intensity + blur). BLOCKED on owner picking an intensity before it is codified.

### Booking flow fixes (from walking it)
- [ ] B1 [motion] Service-row expand ("plus button goes down") feels bad -> new blur+scale+opacity recipe. BLOCKED on M1a (owner intensity pick); previewed at `/de/dev/motion-recipe`.
- [ ] B2 [motion] The "choose/select" indicator just pops up with no animation -> animate. BLOCKED on M1a (same pick).
- [ ] B3 [motion/design] Arrows: animate the arrow itself, OR remove arrows. BLOCKED on owner decision: **keep-and-animate vs remove** (owner leans REMOVE; recommendation = remove, the chevron carries no information once the whole row is tappable).
- [ ] B4 [design] Selected indicator re-announces an already-visible selection -> declutter. BLOCKED on B11 direction pick (the indicator is defined by the chosen direction A/B/C).

**B5/B6/B7 all live inside `components-legacy/booking/StaffStep.tsx`, which the chosen stylist direction (A/B/C) REPLACES.** Doing them against the current component would be thrown away on the pick. Concrete blocker: **B11 direction pick.** They are then folded into building the chosen direction for real, not patched onto the old one.
- [ ] B5 [design] Remove the `ring-2 ring-s-ink` focus-ring-looking selected state (and on Zeit). BLOCKED on B11 pick. (All 3 mockups already render the correct gray-sunken selected.)
- [ ] B6 [design/psych law 2] Staff pick button label must reflect state; pre-select "Egal/Anyone" by default. BLOCKED on B11 pick. (All 3 mockups already do both.)
- [ ] B7 [design] In-booking picker must be selection-only, no wandering into the stylist's other services. BLOCKED on B11 pick. (All 3 mockups already drop the "Profil ansehen" deep-link.)

- [ ] B8 [data/bug] No dates available in the picker. Root-cause needed (availability endpoint for `muse-beauty-studio`; `opening_hours` SHORT-day-key convention mon..sun per LESSONS_LEARNED; staff schedules). NOT a UI fix. BLOCKED by ENVIRONMENT, not by a decision: this session has **no DNS** (`api.trycloudflare.com`, `github.com` -> no such host; only `localhost` resolves) and the dev server will not stay up, so Supabase and the availability endpoint are both unreachable. Needs a fresh session to root-cause. This is the one item that is NOT waiting on the owner.
- [x] B11 [design] REVERSED 2026-07-09: owner said "no, YOU give me ideas, mockups for multiple directions." DELIVERED + committed (`8cece944e`): `/de/dev/stylist-directions`, 3 distinct directions (A photo grid / B rich tap-rows / C swipe carousel), each fixing every StaffStep complaint (gray-sunken selected not ink/ring, Egal pre-selected, rating+count, selection-only, sentence-case). Contract-clean on disk. Render 502'd once then dev server reaped before re-verify. BLOCKED on owner picking a direction. Recommendation: B (rich tap-rows).

## Sequencing
1. THIS TURN: M2 before/after motion mockup (approval-gated, mockup-first). Covers the motion complaints B1/B2/B3 as a preview.
2. On motion approval: codify M1 (shared enter hook + button transition) + apply to the booking flow.
3. B5/B8 are clear bugs (focus ring, availability) -> layered loop next, independent of motion approval.
4. B4/B6/B7 -> apply with the motion pass (design + state).
5. B11 -> waits on the owner's example.

## Deviation flagged (variations hook)
The variations hook wants 3+ distinct directions. The owner's motion ask is a SPECIFIC recipe (blur+scale+opacity+butter), not a "pick a direction" ask, so M2 shows the ONE recipe at 3 INTENSITIES (subtle/recommended/strong) instead of 3 different recipes, because intensity is the real variable for motion feel (owner's imperceptible-fade history). The genuine "give me options" ask is B11 (stylist page), which is blocked on the owner's example.

## Status
- 2026-07-09: readback + plan. Grounded #8 (picker takes async slots) and #9 (opacity-only current motion; glide is the butter ease). Building M2.

## Owner message 2026-07-09 (post-mockup rage), atomic readback , ALL DELIVERED
- [x] R1 Never decide an owner-reserved call without permission , HOOKED: `owner-punt-gate.py` v2 blocks a stop claiming "I'm deciding"/"I'm going with" when the owner's last message did not grant it. Self-tested 3/3.
- [x] R2 Make a handoff file , `_plans/HANDOFF.md` (commit `05d68f206`): root cause + the 30s probe, what is committed, the 4 wrong theories, open work, the 2 owner decisions.
- [x] R3 Find the CORE ROOT of the sandbox block (not a patch, and verify it is not a hallucination) , `~/.claude/settings.json` `sandbox.allowUnsandboxedCommands=false` (mtime 2026-07-09 11:43, mid-session) forces every Bash cmd into a sandbox that denies `bind()`. Proven: `socket.bind()` -> `PermissionError` on 127.0.0.1 and 0.0.0.0, sandbox flag on and off. `pkill` works only because it is on `excludedCommands`.
- [x] R4 Hook the root-cause rule , `no-defer-excuse-gate.py` v3 blocks a stop that declares a blocker AND deflects it to the owner ("restart the session", "run it yourself") without naming a root cause. Self-tested 3/3. (It was silently dead on first write: `json` never imported, `NameError` swallowed by try/except. Re-tested with a harness that fails loudly.)

**Still owner-owned, NOT self-approved:** motion intensity (rec: Recommended) and stylist direction (rec: B). Blocked until the owner adds `npx:*`,`npm:*`,`node:*`,`cloudflared:*` to `sandbox.excludedCommands` so a preview can actually be served.

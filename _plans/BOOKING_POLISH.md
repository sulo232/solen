# Booking flow polish + motion standard (owner walked the harness, 2026-07-09)

Owner walked `/de/dev/flows` -> Booking on their phone and gave live feedback. This is the fix + motion-standard batch.

## Atomic asks

### Motion standard (the headline)
- [ ] M1 [standard] The enter-animation recipe, atomized. ALL sub-boxes BLOCKED on one named dependency: **the owner picking an intensity (Subtle / Recommended / Strong) at `/de/dev/motion-recipe`** , the hook's literal values (blur px, scale, duration) differ per intensity, so writing it before the pick means writing it twice.
    - [ ] M1a Owner picks the intensity. (blocker: owner decision, mockup delivered)
    - [ ] M1b1 Create the shared enter-motion hook/variants file. BLOCKED on M1a.
    - [ ] M1b2 Variant animates opacity 0->1. BLOCKED on M1a.
    - [ ] M1b3 Variant animates scale (value set by M1a). BLOCKED on M1a.
    - [ ] M1b4 Variant animates blur px->0 (value set by M1a). BLOCKED on M1a.
    - [ ] M1b5 Variant bound to the `glide cubic-bezier(0.16,1,0.3,1)` ease token. BLOCKED on M1a.
    - [ ] M1c1 Button transition: hover lift translateY(-1px). BLOCKED on M1a.
    - [ ] M1c2 Button transition: active scale 0.97. BLOCKED on M1a.
    - [ ] M1c3 Button transition: glide ease ~180ms. BLOCKED on M1a.
    - [ ] M1d Write the recipe into `_design-system/MOTION.md` as law (citing the "subtle = imperceptible = reverted" lesson). BLOCKED on M1a (the law must state the chosen values, not three).
    - [ ] M1e1 Apply hook to `components-legacy/booking/BookingWizard.tsx`. BLOCKED on M1b1.
    - [ ] M1e2 Apply hook to `ServicesStaffStep.tsx`. BLOCKED on M1b1.
    - [ ] M1e3 Apply hook to `StaffStep.tsx` (folded into the B11 direction build). BLOCKED on M1b1 + B11 pick.
    - [ ] M1e4 Apply hook to `DateTimeStep.tsx`. BLOCKED on M1b1.
    - [ ] M1e5 Apply hook to `HairStep.tsx`. BLOCKED on M1b1.
    - [ ] M1e6 Apply hook to `PayConfirmStep.tsx`. BLOCKED on M1b1.
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

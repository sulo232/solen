# HANDOFF , read this first (written 2026-07-09, session ended badly)

## 1. THE BLOCKER, root-caused (do not re-litigate)

**No preview link can be produced from a Claude Code Bash session right now.**

Root cause, one line in the owner's `~/.claude/settings.json` (mtime 2026-07-09 11:43, changed mid-session):

```json
"sandbox": {
  "allowUnsandboxedCommands": false,
  "excludedCommands": ["ps:*", "pgrep:*", "pkill:*", "killall:*", "top:*", "rm:*"]
}
```

`allowUnsandboxedCommands: false` forces EVERY Bash command into the macOS sandbox, and that
sandbox denies the `bind()` syscall. Therefore `next dev` dies with
`Error: listen EPERM: operation not permitted 0.0.0.0:<port>`, there is no origin, and any
cloudflared tunnel returns 502/530. `pkill` works only because it is on `excludedCommands`,
which is how a previous session killed its own working dev server.

**The 30-second discriminating probe. Run this BEFORE promising any link:**
```python
python3 -c "import socket; s=socket.socket(); s.bind(('127.0.0.1',3457)); s.listen(1); print('OK')"
```
`PermissionError` => you cannot serve anything. Say so, name this root cause, do not guess.

**THE FIX (owner must apply it, the file is unwritable from inside the sandbox):**
add the dev-server + tunnel commands to `excludedCommands` so they run unsandboxed:
```json
"excludedCommands": ["ps:*","pgrep:*","pkill:*","killall:*","top:*","rm:*",
                     "npx:*","npm:*","node:*","cloudflared:*"]
```
Owner has NOT approved this yet. Propose it, do not assume.

**Wrong theories already burned (do not repeat them):** "the background process is reaped"
(`pgrep` lies here, `sysmond` is missing), "DNS is dead" (`curl https://api.trycloudflare.com`
returns 404, it resolves), "the tunnel is broken" (it registered at edge `zrh02` and served a
real 361KB page). Four wrong diagnoses cost four rounds and the owner's trust.

## 2. WHAT IS BUILT AND COMMITTED

| what | where | state |
|---|---|---|
| Full-estate frontend audit, wave 1 | `_design-system/research/FRONTEND_AUDIT_2026-07-08.md` | 187 verified findings (71 high), 14 customer surfaces. Commit `85031fab6` |
| Dev flow harness | `app/[locale]/dev/flows/` | Hub + Booking wired to real salon `muse-beauty-studio`, login-free. Commit `cf2b26cfd` |
| Motion before/after mockup | `app/[locale]/dev/motion-recipe/` | opacity-only (current) vs blur+scale+opacity on `glide`, 3 intensities, replayable. Commit `8cece944e`. Verified 200 through a tunnel while one still worked. |
| 3 stylist-picker directions | `app/[locale]/dev/stylist-directions/` | A photo grid / B rich tap-rows / C swipe carousel. Commit `8cece944e`. **Render never visually confirmed** (502 once, then bind died). |
| Cancellation-fee refund fix | `app/api/bookings/**` | Commit `edbcce81f`. Pre-existing work, NOT written or verified by that session. |

## 3. THE TWO DECISIONS THE OWNER STILL OWNS (do not self-approve)

1. **Motion intensity**: Subtle / Recommended / Strong. Recommendation: **Recommended**
   (opacity 0->1, scale 0.96->1, blur 8px->0, 420ms, ease `glide cubic-bezier(0.16,1,0.3,1)`).
   Reason: `MOTION.md` records that a subtle fade was imperceptible to the owner and got reverted.
2. **Stylist direction**: A / B / C. Recommendation: **B (rich tap-rows)** , most scannable,
   shows rating+count, specialty and soonest slot at a glance; C hides stylists behind a swipe.

The owner said, verbatim, "dont fucking decide without my permission." A mockup they could never
open is NOT approval. Being blocked is not a licence to self-approve. These wait.

## 4. OPEN WORK (all of `_plans/BOOKING_POLISH.md`)

Everything below blocks on decision 1 and/or 2 above.
- M1 shared enter-motion hook (opacity+scale+blur, `glide`), then apply across the booking flow
  (currently opacity-only in `components-legacy/booking/*`).
- B1 service-row expand motion, B2 select-indicator pop, B3 arrows (owner leans REMOVE),
  B4 declutter the already-visible selected indicator.
- B5 remove `ring-2 ring-s-ink` selected ring in `StaffStep.tsx` (reads as a focus ring).
- B6 pre-select "Egal/Anyone" + make the pick button label reflect state (never a static "Wählen").
- B7 wall the in-booking stylist picker off from the full profile ("Profil ansehen" lets the user
  wander into the stylist's other services mid-booking).
- B8 **real data bug**: no available dates in the picker. Root-cause first, do not UI-patch.
  Prime suspect: `opening_hours` is SHORT-day-keyed (`mon`..`sun`) per `_rules/LESSONS_LEARNED.md`.
- Wave 2 of the audit (55 dashboard routes + 40 `/dev` routes) never ran. Script:
  `scratchpad/frontend-audit-wave2.workflow.js`, run id `wf_732cda98-10e`.

## 5. WHAT WAS HARDENED THIS SESSION (gates, self-tested)

- `link-gate.py` v6: also treats files touched by commits in the last 20 min as this turn's
  visual work. Previously the owner's own commit-often rule silently blinded it (clean tree =>
  no gate => linkless mockup turns).
- `link-gate.py` v7: **curls every `trycloudflare.com` markdown link in the final message and
  blocks the stop unless it returns 2xx/3xx.** A well-formed link to a dead tunnel used to sail
  through. 3/3 self-tested.
- `session-marker-sweep.py` v2: skip-flag TTL 48h -> 8h. Six stale flags were muting gates for
  days. 3/3 self-tested. All flags cleared.
- `owner-punt-gate.py` v2: blocks a stop whose final message CLAIMS an owner-reserved decision
  ("I'm deciding", "I'm going with") when the owner's last message did not grant it. 3/3.
- `no-defer-excuse-gate.py` v3: blocks a stop that declares a blocker AND deflects it to the
  owner ("restart the session", "run it yourself") WITHOUT naming a root cause. 3/3.
  (It was silently dead on first write: `json` was never imported, `json.dumps` raised
  `NameError`, the try/except swallowed it. Always self-test with a harness that fails loudly.)

## 6. HOW TO ACTUALLY SEE THE MOCKUPS

Until the owner applies the `excludedCommands` fix, only they can serve it:
```
npm run dev
cloudflared tunnel --url http://localhost:3000
```
Then `/de/dev/flows`, `/de/dev/motion-recipe`, `/de/dev/stylist-directions`.

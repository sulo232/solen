# Dashboard overhaul , HANDOFF

Written 2026-07-15. Branch `claude/dashboard-design-overhaul-f5603f`, head `dd7426390`, working tree clean.
Read this first, then `_design-system/TASTE_LOG.md` Round D1. Everything below is verified against disk,
not recalled. Nothing is in the real app yet: this is mockups + law only.

---

## 1. Where it stands in one line

7 mockup rounds on the operator dashboard HOME, all rejected; the 8th (`traced.html`) is unreviewed. The
root cause was diagnosed and the taste system was repaired so the same failures cannot silently recur.

## 2. The ONE owner decision that blocks the real build

**LOCKFILE §12.1 + §12.2 contradict the approved direction and must be superseded BY NAME.**

| LOCKFILE §12 says | Owner decided (TASTE_LOG Round D1) |
|---|---|
| §12.1 structure = Fresha **icon rail** + KPI-overview home | labeled sidebar, **chairs are the hero**, "make from new" |
| §12.2 primary CTA + active nav = **blue #276EF1** | **ink** commit CTA, calm gray selected |
| §12.1 home = sales line chart + upcoming bar chart | **no chart on home**, revenue is one quiet stat |

Frozen rows never re-open without the owner saying so by name. **Recommendation: supersede both.** They
describe the dashboard the owner spent 7 rounds rejecting, and TASTE_LOG Round D1 is the newer dated
decision (it already wins by precedence, but leaving §12 as-is means the next agent reads the old law
first and rebuilds the thing that got rejected , exactly what happened this session). Concrete next
action on a yes: rewrite §12.1/§12.2 to point at TASTE_LOG Round D1, keep §12.3 (radii) and §12.4
(drift scope) as-is.

## 3. What the owner actually wants (verbatim, from 7 rounds)

Full table: `_design-system/TASTE_LOG.md` -> "Round D1: Operator dashboard home". Condensed:

- **Hero = people in the chair now**, several at once. Not revenue. "put the person in chair, many person... make that main"
- **Revenue = one quiet stat** top-left with Appointments + Free chairs. "we don't even need that as the main information"
- **ONE nav** (labeled sidebar, Focus/Linear style, expanded). A second nav-shaped bar = "clutter"
- **Nothing appears twice.** "same information all over and over again"
- **Today = small**: count + See all + ~2 rows
- **Mark people paid/unpaid** inline (real `bookings.payment_status`)
- **No colored edge bars, ever.** "never do this ever"
- **Only real features.** The generic waiting queue was invented; real walk-in is barbershop-only + pay-first
- **One carded hero, everything else bare text.** "not just everywhere cards or boxes or pill"
- **Binary 16/32 gaps. One pill spec per context** (same height + font, no pill-in-pill, no divider beside a color contrast)

## 4. The root cause (LLM council, owner-commissioned, 2026-07-15)

"Cluttered" never meant element count. It meant **equal visual weight**: every block wearing the same
card costume with no dominant focal object, so the eye has nowhere to land. Deleting elements cannot fix
that , 5 equal things are as flat as 7. Grok: *"no single large, high-contrast object the eye is forced
to land on first."* Gemini: *"over-application of a single visual metaphor (the card)."* The owner's
"minimal / breathing space" = **"I can't instantly see what I must act on."**

Law that fell out (now in TASTE_LOG): ONE carded hero per screen = the thing the owner must ACT on;
everything else is bare text on the canvas.

## 5. Why it kept failing (the system holes, all verified this session)

1. `TASTE_LOG.md` had **zero** dashboard entries , `grep -n "dashboard|operator|chair"` = 0 hits. 7 rounds of taste lived only in chat, so each new mockup restarted from guesses. **FIXED**: Round D1 written.
2. LOCKFILE §12 codifies the OLD dashboard , the only dashboard law actively steered toward the rejected design. **OPEN**: needs the supersede above.
3. `pre-edit-drift-gate.sh:67` , `*public/*) exit 0` exempts mockups, so no hex/token/treatment law binds `public/_mockups/**`. **PARTLY FIXED**: mockup-depicts-gate now carries the machine-checkable subset.
4. `REMOVED.md` had **no treatment entries** , the left-edge-bar ban existed only in a memory file, which is why it shipped. **FIXED**: 6 lines added, `npm run exists` now hits them.
5. The exists-gate only proved `npm run exists` **ran**, never checked what the mockup **drew**. **FIXED**: mockup-depicts-gate.

## 6. What landed (verified)

| Thing | Where | Proof |
|---|---|---|
| TASTE_LOG Round D1, 13 dated decisions + council note + §12 conflict flag | `_design-system/TASTE_LOG.md` (tail) | commit dd7426390 |
| 6 treatment graveyard lines (edge bar, dock, revenue hero, right rail, waiting queue, pill-in-pill) | `_design-system/REMOVED.md` | `grep -c "TASTE_LOG Round D1"` = 6 |
| mockup-depicts-gate (ARM 1 graveyard vs visible copy, ARM 2 Depicts manifest) | `.claude/hooks/mockup-depicts-gate.py` | commit 5acef6089; self-test 2 block / 2 pass |
| ARM 1b, colored edge-accent ban in mockup CSS | same file, `# ---- ARM 1b` block | commit dd7426390; self-tested: green var + hex BLOCK (exit 2); neutral border-right, non-mockup file, traced manifest PASS (exit 0) |
| Gate wired PreToolUse Write + Edit | `.claude/settings.json` | json parses; matcher probe returned Edit + Write |

## 7. The mockups (`public/_mockups/dashboard-overhaul/`)

| File | What | Status |
|---|---|---|
| `traced.html` | **CURRENT.** Chairs hero, revenue demoted to a stat, paid/unpaid chips + Mark paid, no dock, no waiting, no edge bar, 16/32 | **unreviewed**, last owner word was still "cluttered" (pre council fix) |
| `fresh.html` | 3 from-scratch structures: Workspace (Workable top-nav + 3 col), Terminal (chair board + dock), Focus (sidebar + one column) | owner liked ALL 3, asked to integrate |
| `integrated.html` | the integration attempt | rejected: dock = 2nd nav, repeats, edge bar |
| `chairs.html` | chairs-first declutter | rejected: invented waiting list, green edge bar |
| `index.html`, `v2.html`, `comp.html` | rounds 1-3, all built ON TOP of the old dashboard | dead, "that's the whole recurring problem" |

**Note:** none of these carry a `Depicts:` manifest except `traced.html`, so the gate would now correctly
reject the older ones. That is the right verdict on them.

## 8. Known-suspect, unverified

- **"Pakete" in the sidebar** is probably the same invented-feature bug: Pakete/packages was KILLED (REMOVED.md), `/dashboard/bundles` is what actually exists. Run `npm run exists pakete` before the next build. Not yet fixed.
- `traced.html` sidebar order/icons came from `RAIL_NAV` in `components-legacy/dashboard/DashboardLayout.tsx`; re-verify against that file, not from memory.

## 9. Next actions, in order

1. **Owner rules on the §12 supersede** (section 2). Recommendation: yes, supersede §12.1 + §12.2.
2. Owner reacts to `traced.html` , specifically whether the one-carded-hero + bare-text-secondaries fix (commit 2809a6532) actually resolves "cluttered", since that is the council's predicted fix and it has not been judged yet.
3. Fix the Pakete/bundles suspect (section 8).
4. Only then: build the approved home in real code (`DashboardLayout` + `DashboardUI`), mockup-first per screen, then propagate to the other ~44 `/dashboard/*` routes.

## 10. Hard-won rules for whoever picks this up

- **Never build on the current dashboard when the owner says "new" or "overhaul".** Ground the structure in the references they name (Workable, Uber Eats terminal), not the existing page.
- **Trace every surface before drawing it.** `npm run exists <feature>`. The gate enforces this now, but the gate only catches what it can see.
- **Measure, never eyeball.** The "why are these two pills different sizes" round: they were 34 vs 35px, 13.5 vs 13px font, and a pill nested inside a pill. All invisible to a vibe check, all obvious to `getBoundingClientRect`.
- **A layout that needs a paragraph to justify it has failed.** The dock's "sidebar = places, dock = actions" rule was correct and still got rejected, because the user should never have to read the rule.
- The owner's design vocabulary is a **symptom description**, not a spec. "Cluttered" meant "no focal point". Diagnose before removing.

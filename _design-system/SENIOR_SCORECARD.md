# SENIOR SCORECARD — the ship-gate for customer-facing screens (2026-06-09)

**Why this exists:** the design rules already encode senior-level design (they were translated from the Tim Gabe "4 levels of UI/UX" + "addictive apps" videos into `SOLEN_UI.md` §2/§2a/§5b/§9b/§9c/§9d/§199 and `LOCKFILE.md` §2.5 + A13). The problem was never missing rules. It was that they live as **principles** ("ask: …", "aim for …") with no pass/fail gate, so a screen can ship while quietly violating them. The booking-confirmation page proved it: ~11 font sizes, a support code as the visual hero, four explainer paragraphs, zero purposeful color, 5 stacked cards , every one a rule that already existed on paper.

**What this is:** the video's own scoring method, turned into a gate. Five dimensions. Each scored **Pass / Half / Fail**. **A customer-facing screen ships only at 5/5 Pass.** Any Half or Fail is a punch-list item, same as a verifier-loop finding (CLAUDE.md rule 9). This doc does not invent new rules , it **indexes** the existing ones into a gradeable checklist and says which are auto-checkable (drift) vs judgment (verifier-agent).

---

## The scorecard

Score every customer-facing screen on all five before calling it done.

| # | Dimension | Senior = PASS | FAIL (the named anti-pattern) | Indexes (the rule) | Checked by |
|---|---|---|---|---|---|
| 1 | **Copy** | Every word earns its place. No word repeats a heading/label already above it. Each label states what the tap does. | Explainer paragraphs; subtitle repeats the title; "keep your number ready"; "Submit"/"Continue" for a specific action. | `SOLEN_UI §2a`, `§8` | verifier-agent (judgment) |
| 2 | **Emphasis** | Exactly **one focal** per screen = the thing the user came for. Everything else recedes. One primary action. | A support code / metadata as the biggest element. 3 competing CTAs. Bolding everything. | `SOLEN_UI §2`, `§9b`; `LOCKFILE A13` (card-scope sibling) | verifier-agent + drift (count primary CTAs) |
| 3 | **Color** | 80/17/3. Accent + semantic color ONLY on what matters. The emotional peak wears its semantic color (booking confirmed → green), never dead grey. | Rainbow (everything screams) **OR** all-grey-dull (the peak has no color). Brand-color flood. | `SOURCE §1` color-law; `SOLEN_UI §5b` | verifier-agent + drift (hex/accent rules A9) |
| 4 | **Type** | **≤4 sizes, ≤2 weights on the screen.** Pick from the §2.5 roles, never ad-hoc px. Mono for the one big number. Nothing <12px. | 6+ sizes; 4+ weights; stray `text-[Npx]`; sub-12px. | `LOCKFILE §2.5` core ramp + per-screen budget; `SOLEN_UI §199` | drift-checker (counts distinct sizes/weights per file) + verifier |
| 5 | **Structure** | 8pt grid. Group related things. The **fewest containers** that still hold the meaning. | 5 stacked cards; random spacing; dividers between already-spaced sections. | `SOURCE §4`; `SOLEN_UI §3`, `§8` | verifier-agent + drift (spacing) |

**Bonus (the video's "hidden mistake", senior+):** **Experience** , is there motion between states, not just a static frame? Confirmed-booking celebration, press feedback, sheet transitions. Indexes `MOTION.md` + `SOLEN_UI §9c`/`§9d`. Not part of the 5/5 static gate, but the differentiator above it , log a Half if the screen is a dead static frame on an emotional peak.

---

## How to use it

- **When:** any customer-facing screen build, rebuild, or non-trivial edit (work-types 2/3/4/6 in `WORK_TYPES.md`). Surgical 1-line fixes (type 1) are exempt unless they touch hierarchy/copy/color.
- **Where it hooks:** it is the **AESTHETIC-quality gate** in the per-wave verifier gates (`WORK_TYPES.md` §"Per-wave verifier gates", Axis 2). A screen passes Axis-2 only when it scores 5/5 here.
- **Split of labor:**
  - **Auto (drift-checker, hard-fail):** dim 4 (count distinct font sizes + weights per file; flag sub-12px + stray `text-[Npx]`), dim 2 partial (count primary-CTA recipes), dim 3 partial (hex + accent rules A9). These can't be "judged away."
  - **Judgment (verifier-agent, with a screenshot):** dim 1 copy economy, dim 2 "is the focal the right thing", dim 3 "does the peak wear color / is it dull", dim 5 container-count + grouping. The verifier returns a per-dimension Pass/Half/Fail + a punch list.
- **Output format the verifier returns:**
  ```
  Copy:      PASS
  Emphasis:  FAIL — the order code is the largest element; the date should be the focal
  Color:     HALF — confirmed-green present but the rest is flat grey; let green carry the paid state
  Type:      FAIL — 11 distinct sizes (target ≤4)
  Structure: HALF — 5 cards; collapse to 1 essentials card + actions
  → 5/5 required. Not shippable. Fix Emphasis + Type, re-grade.
  ```

## The failure mode this must avoid (no-teeth risk)

A scorecard that's just another doc gets skipped exactly like the principles did , the dual-axis gates already existed and the confirmation page slipped through anyway. So it only works with teeth:
1. The **countable** dims go into the drift-checker as hard-fail rules (size/weight count, sub-12px, stray px) , a machine can't be talked out of it.
2. The **judgment** dims are a **mandatory verifier-agent pass** on every customer screen, with the rendered screenshot, before "ready for review." No screenshot + grade = not done.
3. CLAUDE.md points here so it loads every session; WORK_TYPES binds it to the ship gate. Without 1+2+3 it's decoration.

## First application

Booking confirmation (`components-legacy/booking/BookingConfirmation.tsx`) , the screen that exposed the gap , is the first rebuild graded against this. Target: 5/5 (the approved senior mockup `public/solen-confirm-senior.html`).

## See also
- `_rules/SOLEN_UI.md` , the principles this grades against (§2/§2a/§5b/§8/§9b/§9c/§9d/§199).
- `_design-system/LOCKFILE.md` §2.5 , the type role registry + per-screen budget.
- `_design-system/MOTION.md` , the experience/motion layer (bonus dimension).
- `_design-system/WORK_TYPES.md` , where this hooks as the Axis-2 quality gate.

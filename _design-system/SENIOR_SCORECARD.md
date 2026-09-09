# SENIOR SCORECARD — the ship-gate for customer-facing screens (2026-06-09)

**Why this exists:** the design rules already encode senior-level design (they were translated from the Tim Gabe "4 levels of UI/UX" + "addictive apps" videos into `SOLEN_UI.md` §2/§2a/§5b/§9b/§9c/§9d/§199 and `LOCKFILE.md` §2.5 + A13). The problem was never missing rules. It was that they live as **principles** ("ask: …", "aim for …") with no pass/fail gate, so a screen can ship while quietly violating them. The booking-confirmation page proved it: ~11 font sizes, a support code as the visual hero, four explainer paragraphs, zero purposeful color, 5 stacked cards , every one a rule that already existed on paper.

**What this is:** the video's own scoring method, turned into a production-readiness gate. Six dimensions (Floors added 2026-07-27, hierarchy-density-02, see below). Each scored **Pass / Half / Fail**. **A customer-facing screen ships only at 6/6 Pass and after explicit owner approval.** Any Half or Fail is a punch-list item for a production candidate. This doc does not invent new rules , it **indexes** the existing ones into a gradeable checklist and says which are auto-checkable (drift) vs rendered judgment.

---

## The scorecard

Score every customer-facing screen on all six before calling a production candidate done.

| # | Dimension | Senior = PASS | FAIL (the named anti-pattern) | Indexes (the rule) | Evidence |
|---|---|---|---|---|---|
| 1 | **Copy** | Every word earns its place. No word repeats a heading/label already above it. Each label states what the tap does. | Explainer paragraphs; subtitle repeats the title; "keep your number ready"; "Submit"/"Continue" for a specific action. | `SOLEN_UI §2a`, `§8` | Rendered copy inspection |
| 2 | **Emphasis** | Exactly **one focal** per screen = the thing the user came for. Everything else recedes. One primary action. | A support code / metadata as the biggest element. 3 competing CTAs. Bolding everything. | `SOLEN_UI §2`, `§9b`; `LOCKFILE A13` (card-scope sibling) | Screenshot + DOM primary-action count |
| 3 | **Color** | Life from **white-first cool neutrals + photography FIRST** (white #FFFFFF, cool sunken #F4F4F5 / hairline #E4E4E7; on a photo screen the photo carries it), then **semantic** colour for meaning only (paid→green, rating→yellow, saved→pink). Blue marks INTERACTIVITY — links, secondary/ghost buttons, active tabs, tappable rows, interactive icon tints all wear `s-accent #276EF1`; exactly one ink primary commit per screen; the emotional peak wears its semantic colour (success = normal green #16A34A disc + white check — deep #15803D reverted 2026-06-10). | **Dead-grey** (cool/flat surface, no warmth/photo, AND interactive affordances left ink-grey so nothing reads tappable) **OR vibrating blue** (blue on NON-interactive text — body, labels, prices, headings, eyebrows — or a blue-FILLED primary, or rainbow/brand-flood). Both are fails: blue belongs on interaction, never emphasis. | `LOCKFILE §1.5.0` colour model; `SOURCE §1` | Screenshot + applicable drift candidates |
| 4 | **Type** | **≤4 sizes, ≤2 weights on the screen.** Pick from the §2.5 roles, never ad-hoc px. Mono for the one big number. Nothing <12px. | 6+ sizes; 4+ weights; stray `text-[Npx]`; sub-12px. | `LOCKFILE §2.5` core ramp + per-screen budget; `SOLEN_UI §199` | DOM-computed size/weight count + drift A19 |
| 5 | **Structure** | 8pt grid. Group related things. The **fewest containers** that still hold the meaning. | 5 stacked cards; random spacing; dividers between already-spaced sections. | `SOURCE §4`; `SOLEN_UI §3`, `§8` | Screenshot + measured container/grouping inspection |
| 6 | **Floors** (added 2026-07-27, hierarchy-density-02) | Passes all six items of the FLOORS LAW finished-screen pass: photographic focal present, exactly one biggest element, >=1 tabular/real number, >=1 semantic-color moment, no dead-grey zone, worst-case content holds (longest name/review/service name doesn't break the two-anchor card rule or the display anchor). A commit-bearing screen also clears the trust floor (price breakdown, cancellation term in DOM, provider identity visible). | A screen that scores 5/5 on dims 1-5 while still failing imagery/density/warmth or shipping a defined-but-never-rendered cancellation string (the exact walk-in-pay bug, fixed 2026-07-27) , "compliant but unfinished." | `CLAUDE.md` FLOORS LAW block; `LOCKFILE.md §17`, `§17.5`, `§17.6`; EMPHASIS BUDGET table | `npm run check:floors` for countable measures + worst-case render, DOM trust check, interaction, accessibility, and real-data inspection |

**Bonus (the video's "hidden mistake", senior+):** **Experience** , is there motion between states, not just a static frame? Confirmed-booking celebration, press feedback, sheet transitions. Indexes `MOTION.md` + `SOLEN_UI §9c`/`§9d`. Not part of the 6/6 readiness score, but the differentiator above it , log a Half if the screen is a dead static frame on an emotional peak.

---

## How to use it

- **When:** any customer-facing screen build, rebuild, or non-trivial edit (work-types 2/3/4/6 in `WORK_TYPES.md`). Surgical 1-line fixes (type 1) are exempt unless they touch hierarchy/copy/color.
- **Where it hooks:** it is the **AESTHETIC-quality gate** in the per-wave evidence gates (`WORK_TYPES.md`, Axis 2) for a production candidate. A screen passes production Axis 2 only when it scores 6/6 here.
- **Evidence split:**
  - **Auto (drift-checker + check:floors):** sub-12px (rule A19 — INFO until the ~102 legacy instances are swept, then HARD), dim 3 (hardcoded hex A1/A15 + accent rules A9), dim 2 partial (primary-CTA recipe), dim 6 countable half (`npm run check:floors` measures imagery share, weight share, anchor ratio, elevation steps on the rendered page). These can't be "judged away." NOTE: the ≤4-sizes / ≤2-weights COUNT is deliberately NOT a static rule — per-file counting is too noisy (primitives + composite files legitimately use many). Measure it in the rendered DOM instead.
  - **Rendered judgment:** the working assistant inspects the actual screenshot, DOM, interaction, accessibility, real data, worst-case content, and trust-floor DOM for commit-bearing screens. Ordinary low-risk reversible work closes with these focused direct checks. Add one read-only independent verifier only when consequence, uncertainty, or reach warrants it; that one review can cover all applicable criteria. Do not add another reviewer layer.
- **Commissioned exploration:** for an explicit owner-commissioned multi-direction or net-new exploration, use the aesthetic dimensions and finished-screen floors/ceilings to diagnose the tradeoff in each direction. They do not reject an authorized alternative merely because it varies product anatomy, layout, type, shape, hierarchy, decorative treatment, or a reference layout within the commission. Accessible interactions, data truth, money and terms, security, and real rendered evidence remain required. Production implementation or adoption as design law still requires explicit owner approval; a complaint is never approval.
- **Output format for the score:**
  ```
  Copy:      PASS
  Emphasis:  FAIL — the order code is the largest element; the date should be the focal
  Color:     HALF — confirmed-green present but the rest is flat grey; let green carry the paid state
  Type:      FAIL — 11 distinct sizes (target ≤4)
  Structure: HALF — 5 cards; collapse to 1 essentials card + actions
  Floors:    FAIL , imagery 4.7% (floor 33%), no worst-case-content check run
  → 6/6 required. Not shippable. Fix Emphasis + Type + Floors, re-grade.
  ```

## The failure mode this must avoid (no-teeth risk)

A scorecard that's just another doc gets skipped exactly like the principles did , the dual-axis gates already existed and the confirmation page slipped through anyway. So it only works with teeth:
1. The **countable** dims are machine-checked: sub-12px is drift rule A19, hardcoded hex / accent misuse are A1 / A15 / A9 , a machine can't be talked out of those. (The size/weight COUNT is DOM-measured, not static — per-file counting is too noisy to gate on.)
2. The **judgment** dims require the actual rendered screenshot and measured DOM, interaction, accessibility, and real-data evidence. The working assistant performs the direct check; one independent verifier is added only when the current consequence, uncertainty, or reach threshold requires it.
3. CLAUDE.md points here so it loads every session; WORK_TYPES binds it to the production ship gate. Without 1+2+3 it's decoration.

## First application

Booking confirmation (`components-legacy/booking/BookingConfirmation.tsx`) , the screen that exposed the gap , is the first rebuild graded against this. Target: 6/6 (the approved senior mockup `public/solen-confirm-senior.html`).

## See also
- `_rules/SOLEN_UI.md` , the principles this grades against (§2/§2a/§5b/§8/§9b/§9c/§9d/§199).
- `_design-system/LOCKFILE.md` §2.5 , the type role registry + per-screen budget.
- `_design-system/MOTION.md` , the experience/motion layer (bonus dimension).
- `_design-system/WORK_TYPES.md` , where this hooks as the Axis-2 quality gate.

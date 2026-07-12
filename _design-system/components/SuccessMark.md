# SuccessMark

**Layer: 3** (semantic UI — the green disc + white check IS the "success" message; universal-colour green, independent of the interactive-blue accent and NOT budgeted).

**Purpose.** The Solen "moment of delight" on a success PEAK — booking confirmed, payment settled, walk-in joined, review posted, package/gift bought. A **solid normal-green `s-success #16A34A` disc with a WHITE checkmark** — confident, not a pale-green tint. This is the explicit carve-out from the "refined pastel" Layer-3 pattern: the FOCAL confirmation moment is solid; inline transient status (a `Toast tone="success"`, an open/closed pill) keeps the pastel `.bg` + ink text + saturated icon pattern. (Same green as the done-step in the §13.2 stepper — focal and inline share #16A34A.)

> **Green reconciled 2026-06-10 (V3-D470):** the disc is **normal `#16A34A`**, NOT deep `#15803D`. The v2 (2026-06-09) deep-green-disc was REVERTED — owner wants normal green. CANON §0.4 is the authority and supersedes any remaining "deep #15803D" mention in older docs. The disc reads confident via SIZE + solid fill + white check + spring-pop, not a darker hue.

**File.** `app/[locale]/_components/primitives/SuccessMark.tsx`

**Public API.** `<SuccessMark size? className? />`. `size?: number` (visible disc diameter in px, default 58; the check scales to ~0.52×). No tone/variant — success is the only thing it renders.

**Use for.** The ONE focal success/confirmation beat on a screen — `BookingConfirmation` (live), walk-in "joined the queue", review posted, gift/package purchased, payment settled. **Don't reuse for.** Routine or transient inline success (use a pastel `Toast tone="success"` — the chip/badge carve-out), a static "done/complete" status chip (use `StatusInline` or a plain `Check`; `StatusPill` was deleted 2026-06-30, see `StatusPill.md`), or any non-success state. One per screen, on the emotional peak only.

**Visual.** Normal-green `s-success #16A34A` solid disc + WHITE check (stroke). NOT a pale tint, and NOT deep `#15803D` (that was reverted 2026-06-10). The shipped component already fills `bg-s-success` (#16A34A) — code and doc now agree; the once-"pending" deep-green token swap is CANCELLED.

**Motion (v2 rule 7).** On mount: **ring-pulse** (`.success-ring` expands + fades) → **disc spring-pop** (`.success-disc`, spring overshoot) → **check stroke-draw** (`.success-check`). Pair with the `.celebrate-rise` utility on the content that FOLLOWS, with staggered inline `animation-delay` (e.g. title 0.46s, subtitle 0.56s, card 0.68s) for the full beat. Keyframes + classes (`.success-ring` / `.success-disc` / `.success-check` / `.celebrate-rise`) live in `app/globals.css` so they are shared, never re-derived per surface. `prefers-reduced-motion`-safe: the animation only adds the entrance; the resting/base state IS the final visible mark, so reduced-motion users see a static, drawn, visible disc + check.

**Provenance.** Built in the 2026-06-09 motion pass (see `MOTION.md`). v2 (2026-06-09): owner approved a dark-green-disc; **REVERTED 2026-06-10 (V3-D470)** back to normal `#16A34A` ("normal green, not deep"). The white-check + spring-pop motion stay. The chip-vs-focal boundary is stated in CANON §0.4, LOCKFILE §1 (success FOCAL row) + §5 (Toast note) + §13.2 (done-step), and SOURCE §2.5.

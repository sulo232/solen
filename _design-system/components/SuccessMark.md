# SuccessMark

**Layer: 3** (semantic UI — the green disc + white check IS the "success" message; universal-colour green, independent of the interactive-blue accent and NOT budgeted).

**Purpose.** The Solen "moment of delight" on a success PEAK — booking confirmed, payment settled, walk-in joined, review posted, package/gift bought. Design Language v2 (2026-06-09, rule 6) makes this a **deep solid green `s-success.deep #15803D` disc with a WHITE checkmark** — confident, not a pale-green tint. This is the explicit carve-out from the "refined pastel" Layer-3 pattern: the FOCAL confirmation moment is deep + solid; inline transient status (a `Toast tone="success"`, an open/closed pill) keeps the pastel `.bg` + ink text + saturated icon pattern.

**File.** `app/[locale]/_components/primitives/SuccessMark.tsx`

**Public API.** `<SuccessMark size? className? />`. `size?: number` (visible disc diameter in px, default 58; the check scales to ~0.52×). No tone/variant — success is the only thing it renders.

**Use for.** The ONE focal success/confirmation beat on a screen — `BookingConfirmation` (live), walk-in "joined the queue", review posted, gift/package purchased, payment settled. **Don't reuse for.** Routine or transient inline success (use a pastel `Toast tone="success"` — the chip/badge carve-out), a static "done/complete" status chip (use `StatusPill` or a plain `Check`), or any non-success state. One per screen, on the emotional peak only.

**Visual (v2 rule 6).** Deep-green `s-success.deep #15803D` solid disc + WHITE check (stroke). NOT `#16A34A` (that is the lighter inline-status green), NOT a pale tint.
> ⚠️ **Token swap pending.** The shipped component currently fills `bg-s-success` (#16A34A). The v2 implementation step is to introduce `s-success.deep #15803D` in `tailwind.config.js` and point the disc at it (`bg-s-success-deep`). Until then the doc/registry value (#15803D) is the target, the code is one token behind. Tracked in `V2_RECONCILIATION.md`.

**Motion (v2 rule 7).** On mount: **ring-pulse** (`.success-ring` expands + fades) → **disc spring-pop** (`.success-disc`, spring overshoot) → **check stroke-draw** (`.success-check`). Pair with the `.celebrate-rise` utility on the content that FOLLOWS, with staggered inline `animation-delay` (e.g. title 0.46s, subtitle 0.56s, card 0.68s) for the full beat. Keyframes + classes (`.success-ring` / `.success-disc` / `.success-check` / `.celebrate-rise`) live in `app/globals.css` so they are shared, never re-derived per surface. `prefers-reduced-motion`-safe: the animation only adds the entrance; the resting/base state IS the final visible mark, so reduced-motion users see a static, drawn, visible disc + check.

**Provenance.** Built in the 2026-06-09 motion pass (see `MOTION.md`). v2 (2026-06-09): owner approved the deep-green-disc + white-check look ("switch up the green, make the fill dark green and make a check mark light") and "more animations everywhere" — codified as v2 rule 6 (deep success) + rule 7 (motion). The chip-vs-focal boundary is stated in CANON §0 rule 6, LOCKFILE §1 (success FOCAL row) + §5 (Toast note), and SOURCE §2.5.

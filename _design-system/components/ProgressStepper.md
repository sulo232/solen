# ProgressStepper

**File:** _(not yet extracted — currently inline in `walk-in-pay/page.tsx` + the booking flow + mockups. Pattern is LOCKED; component extraction pending.)_
**Layer:** 1 (chrome) — with a Layer-3 carve-out: the DONE node borrows semantic green because "completed" is a success state.
**Locked since:** V3-D470 (2026-06-10 · owner-demanded icon/step/badge system)
**Literal spec:** [LOCKFILE §13.2](../LOCKFILE.md) — that is the single source of truth for every value below. This doc is the usage/API layer.

---

## Purpose

The horizontal, **icon-ABOVE-text** step tracker for a short multi-step flow. Two live instances:
- **Booking flow:** Service → Zeit → Haare → Bezahlen
- **Walk-in live tracker:** Bezahlt → In der Schlange → Fast dran → Dran

Owner 2026-06-10 locked the icon-above-text form ("in the walk-in we have icon and underneath text, should be like that everywhere … in booking flow icon then underneath the text instead of beside it") — the DoorDash/Uber delivery-tracker shape, replacing the old icon-beside-text inline chip.

This is the **only** progress indicator a screen gets. Owner flagged a screen showing a step tracker AND a separate time bar — "why two." Never both.

---

## Public API (proposed, for extraction)

```ts
export interface ProgressStepperProps {
  steps: { key: string; label: string; icon?: LucideIcon }[]; // icon optional → numerals if omitted
  current: number;          // 0-based index of the active step
  orientation?: 'horizontal' | 'vertical'; // default 'horizontal'
}
```

Derived per-node state: index `< current` → **done**, `=== current` → **current**, `> current` → **upcoming**.

---

## Node states (LITERAL — mirror of §13.2)

| State | Disc | Glyph | Label |
|---|---|---|---|
| **Done** | `bg-s-success` #16A34A, 36px circle | white `Check`, 17px, stroke 2.8 | `text-s-ink-3`, 11px, weight 600 |
| **Current** | white disc, 36px, **inset 3px green ring** (`box-shadow: inset 0 0 0 3px #16A34A`) | green `#16A34A` numeral OR weighted step icon | `text-s-ink`, 11px, weight 700 |
| **Upcoming** | `bg-s-bg-sunken` #F4F4F5, 36px | `text-s-ink-3` numeral OR thin icon | `text-s-ink-3`, 11px, weight 600 |

- **Done = GREEN (solid fill + white check).** "The black check mark, isn't it green" — completed is a SUCCESS state (#16A34A, the reconciled normal green; deep #15803D reverted 2026-06-10). Same green as `SuccessMark`.
- **Current = GREEN RING, never black/solid-fill, never blue (V3-D470b, owner pick B 2026-06-10).** White disc + 3px inset `#16A34A` ring + green glyph. The earlier "current = ink" was rejected as too harsh against the green done discs (owner: _"i dont like the pitch black, like N26, i like the greens, contrast too harsh"_). The stepper is now one green family: done = filled green, current = ring green, upcoming = grey, so done-vs-current reads as **filled-vs-ring**. A tracker reads **green(filled) → green(filled) → green(ring) → grey** — no black, no blue.
- **Connector:** `bg-s-border` #E4E4E7, 2px, `border-radius: 2px`, vertically centered on the discs (`margin-top: 17px` for a 36px disc). Done-portion MAY render green/ink; future-portion grey.
- **Icons:** distinct Lucide glyph per node when steps have identity (walk-in: `Check` → `Users` → `Clock` → `Armchair`/`Scissors`). Only the CURRENT node's icon is weighted; done shows the green check; upcoming shows a thin glyph. **No repeated checkmarks** — only DONE nodes get a check. Generic numbered flows use numerals (1·2·3·4).

---

## Orientation

- **Horizontal, icon-above-text** — DEFAULT, for a top-of-screen tracker with **≤4 nodes** (booking step bar, walk-in live tracker). Discs 36px, labels under, connectors between.
- **Vertical, icon-left-of-text** — for a longer onboarding/setup CHECKLIST (5+ items, N26/Monzo style): disc on the left, title + 1-line description to the right, vertical connector. Same three node-state recipes.

---

## Use for

- A short booking/checkout/queue flow's progress header (≤4 nodes → horizontal).
- A multi-item onboarding/setup checklist (5+ → vertical).

## Don't reuse for

- A "how it works" marketing section (use `<Step>` — the numbered card primitive, different thing).
- A single long-running task with no discrete steps (use a `<Spinner>` or a single bar).
- Anything that would put TWO progress indicators on one screen.

---

## A11y

- Render the node list as an `<ol>`; the current node gets `aria-current="step"`.
- The disc glyph is decorative (`aria-hidden`) — the visible label carries the meaning; expose ordinal via the list or an SR-only "Schritt 3 von 4".
- Done/current state must not rely on color alone: the check glyph (done) + weight bump (current) + label color together encode state, so it survives grayscale / color-blindness.

---

## Provenance

V3-D470 (2026-06-10): owner demanded a canonical icon/step/badge system ("research how apple does it by using grey and black … fix the fucking design system"). Grounded in Mobbin refs — [N26](https://mobbin.com/screens/b6ec6a4b-56c2-49f7-b46d-ddbd62bf1096) (green-check done / filled current / grey-outline future), [Minna Bank](https://mobbin.com/screens/ee0764da-eba8-4c79-8fa0-7f3d262e71fe), [Monzo](https://mobbin.com/screens/858f6b4b-d550-46c5-9134-95e3c9a34f61), [Booking.com](https://mobbin.com/screens/863aee66-2ec7-45fc-8c0d-72f66afa243a). Visual mockup: `public/_mockups/restraint/design-system-icons-steps-badges.html` + the live booking-hair-step + walk-in trackers.

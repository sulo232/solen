# StatusPill

**File:** [app/[locale]/_components/salon/StatusPill.tsx](../../app/[locale]/_components/salon/StatusPill.tsx)
**Layer:** 3 (semantic UI — color IS the meaning: green = open, red = closed. Universal "open/closed" convention per §1.)
**Locked since:** V3-D201 (2026-05-26 · salon Phase A A4)
**SOURCE.md links:** [§1 universal colors](../SOURCE.md#§1--brand-positioning) · [§2.5 catalog](../SOURCE.md#§25--semantic-ui-surfaces-catalog-v3-d197-2026-05-26) · [§14.0 decision tree](../SOURCE.md#§140--the-color-layer-decision-tree-first-question-before-writing-any-class)

---

## Purpose

Single-source open/closed indicator for salon-detail surfaces. Replaces 2 inline-duplicated implementations (`SalonHeader`, `SalonSidebar`) that had inconsistent colors and dot styles.

Renders a colored dot + status label. Color encodes semantic meaning (Layer 3 per V3-D197).

---

## Public API

```ts
export interface StatusPillProps {
  isOpen: boolean;       // semantic state
  label: string;         // German display copy, e.g. "Geöffnet bis 19:30"
  size?: "sm" | "md";    // sm inline / md block. Default "sm"
  showDot?: boolean;     // toggle leading dot. Default true
  className?: string;    // composer escape hatch
}
```

---

## Visual signature

```
●  Geöffnet bis 19:30      ← isOpen=true,  size=sm, showDot=true (green)
●  Geschlossen · Öffnet 10:00   ← isOpen=false, size=sm (red)
   Geöffnet bis 19:30      ← size=sm, showDot=false (text-only carrier)
```

**Color (Layer 3 — universal convention):**
- Open → `text-s-success` `#16A34A` + dot `bg-s-success`
- Closed → `text-s-closed` `#DC2626` + dot `bg-s-closed` (red dot + red/maroon text on pale-red bg; per CANON §4, not amber, not grey)

**Size:**
- `sm` (default) — `text-[13px]`, gap-1.5, dot 8×8
- `md` — `text-[14px]`, gap-2, dot 10×10

---

## Motion

None. StatusPill is informational; no state-change animation needed. Color is set by parent re-render when `isOpen` flips.

---

## Do / Don't

### Do
- Use `<StatusPill>` for any open/closed semantic across salon-detail (header, sidebar, opening-hours rows in mobile, etc.)
- Pass a complete German label including time ("Geöffnet bis 19:30") — accessibility benefits from full context vs just "Open"
- Use `showDot={false}` when the surrounding meta row already has visual separators (e.g. inline meta with `·` dots — dot would look noisy)

### Don't
- Don't hardcode `text-emerald-600` or `text-red-600` anywhere — use `<StatusPill>`. The "emerald" Tailwind default is a different green from `s-success` and creates drift; the closed red must be `s-closed #DC2626`, not a raw Tailwind red.
- Don't use this for other binary semantic states (active/inactive tab, verified/unverified, etc.). Use `<TabPill>` or a specific component. Mixing roles dilutes the "color = open/closed" meaning.
- Don't change the dot/text color via `className` override. If you need a different semantic, that's a different component.

---

## Edge cases

| Case | Behavior |
|---|---|
| `label` empty | Renders empty span. Pass meaningful label always. |
| Very long label (>30 chars) | Wraps naturally. No truncation built-in — wrap with `truncate` on parent if needed. |
| Prefers-reduced-motion | No animation present; no special handling needed. |

---

## Provenance

- **V3-D201** (2026-05-26) — created during salon Phase A A4. Replaces inline `text-emerald-600` patterns in `SalonHeader` + `SalonSidebar`.
- **CANON §4** (2026-06-01) — closed state set to red `s-closed #DC2626` (was muted grey ink-2 + border dot). Closed-as-grey retired per user call 2026-05-30.

---

## Related

- **OpeningTimes table** (`SalonOpeningTimes`) — uses an inline dot for per-day status (not StatusPill). Future refactor could compose StatusPill per row.
- **§2.5 catalog** — this is row "StatusPill state='open' / state='closed'" in the SOURCE.md catalog. Universal color convention enforced.

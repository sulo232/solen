# TabPill

**File:** [app/[locale]/_components/primitives/TabPill.tsx](../../app/[locale]/_components/primitives/TabPill.tsx)
**Layer:** 1 (chrome — navigation/filter affordance. Active state uses ink, NOT s-accent. Brand accent is reserved for non-chrome highlights per V3-D192-fix.)
**Locked since:** V3-D201 (2026-05-26 · salon Phase A A7)
**SOURCE.md links:** [§14 component contract](../SOURCE.md#§14--component-authoring-contract) · [§6 motion](../SOURCE.md#§6--motion-vocabulary)

---

## Purpose

Generic active/inactive segmented filter pill. Replaces 3 inline implementations (`SalonServices`, `SalonServicesSheet`, plus future booking-flow chips). Will be used by search filters too.

Tab affordance — NOT a semantic color signal. The active/inactive distinction is about navigation state, not about meaning. Hence Layer 1 chrome treatment (ink active, white inactive) instead of Layer 3 (semantic color).

---

## Public API

```ts
export interface TabPillProps {
  active: boolean;             // current selection state
  onClick: () => void;
  children: React.ReactNode;   // label content (text + optional icon)
  size?: "sm" | "md";          // sm 32px inline / md 40px sticky. Default "sm"
  variant?: "outline" | "ghost"; // outline = with border / ghost = borderless. Default "outline"
  ariaLabel?: string;          // when children is icon-only
  className?: string;
}
```

---

## Visual signature

**outline · sm (default — filter rows):**
```
┌────────────┐  ┌────────────┐  ┌────────────┐
│  All       │  │  Coiffeur  │  │  Nails     │   ← inactive: white bg + s-border + ink-2 text
└────────────┘  └────────────┘  └────────────┘
                      ↓ tap
┌────────────┐  ┌────────────┐  ┌────────────┐
│  All       │  │  Coiffeur  │  │  Nails     │   ← active: ink fill + white text + elevation-1
└────────────┘  └────────────┘  └────────────┘
```

**ghost (sticky bar variants):**
- active: bg-s-ink, no border
- inactive: transparent, text-s-ink-3 hover to s-ink

**Size:**
- `sm` — h-8 (32px), text-[13px], px-3
- `md` — h-10 (40px), text-[14px], px-4

---

## Motion

| Trigger | Property | Duration | Easing |
|---|---|---|---|
| Hover (inactive) | `color` + `border-color` | 200ms | `ease-glide` |
| Active press | `scale` to 0.97 | 80ms | `ease-glide` |
| State swap (active ↔ inactive) | Instant | — | — |

No state-swap animation — chip should commit instantly to the user's choice. Layout shouldn't jump.

---

## Do / Don't

### Do
- Use for filter chips ("All", "Coiffeur", "Barber", "Nails"), category selectors, segment controls
- Use `outline` for standalone filter rows, `ghost` for chips inside a styled chrome (sticky bar with its own bg)
- Pair sm with sticky filter rows, md with standalone segment controls

### Don't
- Don't use for primary CTAs ("Buchen", "Bestätigen") — those are `<button class="bg-s-ink rounded-full">`, not a TabPill
- Don't use brand-accent (royal blue) for the active state. Brand accent is for highlight moments, not navigation chrome.
- Don't use for semantic state (success/error/etc.) — use `<StatusPill>` or another Layer 3 component
- Don't apply hover shadows. Hover is color-only per the contract.

---

## Edge cases

| Case | Behavior |
|---|---|
| Icon-only child | Pass `ariaLabel` so screen readers have meaning |
| Children wraps | TabPill is `whitespace-nowrap` — long labels overflow rather than wrap. Parent must scroll or truncate. |
| Disabled state | NOT supported in current API. If a chip should be unavailable, hide it. (Showing disabled + grey adds noise.) |
| Keyboard | Native `<button>` semantics: Enter/Space activates. Tab order from parent. |

---

## Provenance

- **V3-D201** (2026-05-26) — created during salon Phase A A7. Replaces inline patterns in 3 files. Layer 1 chrome (ink active), confirmed against §14.0 decision tree.

---

## Related

- **StatusPill** — Layer 3 semantic-color sibling. TabPill is for navigation, StatusPill is for state.
- **HeartButton** — Layer 3 save-state pill (different semantic, different visual treatment).
- **§14.0 decision tree** — answered Q3 default (Layer 1 chrome) because tab selection isn't a "meaning by color" surface, it's a "where am I in the nav" surface.

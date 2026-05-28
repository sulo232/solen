# ComingSoon

**File:** [app/[locale]/_components/primitives/ComingSoon.tsx](../../app/[locale]/_components/primitives/ComingSoon.tsx)
**Locked since:** V3-D195 (2026-05-26)
**SOURCE.md links:** [§11 Clickable Surface Contract — option D](../SOURCE.md#§11--clickable-surface-contract) · [§16 a11y](../SOURCE.md#§16--accessibility-rules) · [§18 Voice / copy](../SOURCE.md#§18--brand-voice--copy)

---

## Purpose

The canonical wrapper for surfaces that are visually present but not yet wired to a real destination — the "kommt bald" affordance. Wraps any clickable child and:

1. Visually dims the child to 50 % + sets `cursor-not-allowed`.
2. Hijacks the click — `preventDefault` + `stopPropagation` + fires `toast.info("{label} kommt bald")`.
3. Suffixes the `aria-label` with `" — bald verfügbar"` so screen readers warn.
4. Marks the DOM with `data-coming-soon="true"` for drift-checker / E2E selectors.

Per [Q16](../QUESTIONS.md#q16) this is the **single source of truth** for option D in §11. If you find yourself writing `opacity-50 cursor-not-allowed onClick={() => toast.info(...)}` inline, switch to this wrapper. Callers can't diverge from the pattern when the pattern is a component.

---

## Public API

```ts
export interface ComingSoonProps {
  label: string;                       // shown in the toast title ("{label} kommt bald")
  toastTitle?: React.ReactNode;        // override the default title text
  toastDescription?: React.ReactNode;  // optional sub-line
  children: React.ReactElement;        // single child to wrap (button / link / div)
}

export function ComingSoon(props: ComingSoonProps): React.ReactElement;
```

The component uses `React.cloneElement` to merge props — `className`, `onClick`, `aria-label`, `tabIndex`, and `data-coming-soon` are mutated on the child. Any other props pass through untouched.

---

## Usage examples

### Wrap a button

```tsx
<ComingSoon label="Karten-Ansicht">
  <button className="px-4 py-2 rounded-pill bg-s-ink text-white">
    Karte
  </button>
</ComingSoon>
```

Renders as a dimmed ink pill. Tapping fires `toast.info("Karten-Ansicht kommt bald")`. Screen reader hears "Karten-Ansicht — bald verfügbar".

### Wrap a Next.js Link (the href stays but never navigates)

```tsx
<ComingSoon label="Benachrichtigungen">
  <Link href="/notifications" aria-label="Benachrichtigungen">
    <BellIcon />
  </Link>
</ComingSoon>
```

`preventDefault()` stops the navigation. The existing `aria-label` is preserved + suffixed.

### Custom toast copy

```tsx
<ComingSoon
  label="Filter"
  toastTitle="Filter sind in Arbeit"
  toastDescription="Wir bauen Service-Typ + Preisspanne. Bleib dran."
>
  <button aria-label="Filter öffnen">
    <FilterIcon />
  </button>
</ComingSoon>
```

---

## Visual signature

```
Resting state:
┌───────────────┐
│   Karte       │   ← child renders normally, opacity-50, cursor-not-allowed
└───────────────┘
       ↓ tap
┌───────────────────────────────┐
│ ●  Karten-Ansicht kommt bald  │   ← toast.info() — royal-blue dot
└───────────────────────────────┘
```

- **Dim level:** `opacity-50` (50 %) — visible enough to read, dim enough to signal "not yet."
- **Cursor:** `cursor-not-allowed` on desktop. No equivalent on mobile (the dim opacity carries the signal there).
- **Toast tone:** always `info` (royal-blue dot per §1 — accent is the "informational highlight" register).
- **Aria suffix:** ` — bald verfügbar` appended once. Idempotent: re-wrapping (or wrapping a child whose label already ends with this suffix) won't double-append.

---

## Motion details

ComingSoon doesn't add motion itself. Two motion sources fire:

1. **The child's existing hover/active motion** still runs at the dimmed visual layer. Acceptable — it tells the user the surface IS interactive, just not destination-wired yet.
2. **The toast's slide-down on tap** — see [Toast.md motion details](Toast.md#motion-details).

If you need to suppress the child's motion (e.g. don't rotate a chevron on a coming-soon button), pass a different child or branch in the parent.

---

## A11y

| Attribute | Value | Why |
|---|---|---|
| `aria-label` | `{existing} — bald verfügbar` | Screen-reader users hear the "not-yet" state before activation |
| `tabIndex` | 0 (or inherited from child) | Keyboard-reachable so users can discover it |
| `data-coming-soon` | `"true"` | Drift-checker selector + E2E-test hook |
| Focus visible | inherits from child | Don't strip the child's focus ring |

**Note: not `aria-disabled="true"`.** Pressing Enter on the wrapper should still fire the toast (which IS the affordance). `aria-disabled` would tell screen readers the element does nothing — but it DOES do something (informs of the coming feature). The label suffix is the correct signal.

---

## Do / Don't

### Do

- Use this wrapper for every dead-click that you want to keep VISIBLE for layout reasons. Common cases: notification bell, "open filters" before filters ship, "map view" toggle before maps.
- Pass German `label` — the toast is German `du` voice per §18. Match the surface's own label.
- Override `toastTitle` when "kommt bald" is too short — e.g. "Filter sind in Arbeit" reads better than "Filter kommt bald".
- Compose with `<Tooltip>` (TBD) for desktop hover discovery, if/when that primitive exists.

### Don't

- Don't wrap a child with no `aria-label` AND no visible text — the resulting label becomes "{label} — bald verfügbar" which IS the wrapper's `label` prop, but only because we fall back. Prefer to set the child's aria-label explicitly.
- Don't wrap multiple children at once. The wrapper takes a SINGLE React element. Wrap each in its own `<ComingSoon>`, or wrap the parent container.
- Don't use this for "feature requires login" — that's a different affordance (an auth-gate redirect, not a "coming soon" toast). Build a `<LoginGate>` wrapper if needed.
- Don't use this for items that WILL crash when tapped. ComingSoon implies "scaffolding exists, wiring doesn't." If the route truly doesn't exist, route the user to a real destination instead.
- Don't nest `<ComingSoon>` inside another `<ComingSoon>` — undefined behavior, the inner wins and the outer's label/handlers are silently dropped.

---

## Edge cases

| Case | Behavior |
|---|---|
| Child is a `<Link>` with `href` | `e.preventDefault()` blocks the navigation. Href stays in DOM (matters for crawlers + middle-click semantics). |
| Child has its own `onClick` | The wrapper REPLACES it (the wrapper's handler runs instead). Intentional — the wrapped action is suppressed by design. |
| Child has its own `tabIndex` | Wrapper preserves it (only sets `tabIndex={0}` if the child didn't set one). |
| Child has its own `aria-label` | Wrapper preserves + suffixes with `" — bald verfügbar"`. Idempotent: re-suffixing is a no-op. |
| Child has its own `className` | Merged via `cn()`. The wrapper's classes (`opacity-50 cursor-not-allowed`) are appended → win on conflict because Tailwind's later utilities override earlier. |
| Wrapped element is `<input>` or other non-button | The dim + cursor still apply, but click semantics on inputs are different. Recommended: only wrap buttons / links / divs with onClick. Inputs should be `disabled` instead. |
| Wrapped element renders nothing on a server render | The wrapper still clones — the cloned element just doesn't render. No crash. |
| Same surface tapped 5× rapidly | Each tap fires a toast. Toast stack caps at 3 — oldest drops. Acceptable: user sees the feedback every time. |

---

## Drift-checker integration

ComingSoon stamps `data-coming-soon="true"` on the wrapped element. The Solen drift-check skill (`/solen-drift-check`) treats this attribute as the **legitimate** sentinel for §11 option D — surfaces with this attribute are exempt from the "empty onClick" / "href=#" rules in B1 and B2. If a coming-soon surface is missing the attribute (because someone wrote the pattern inline instead of using the wrapper), drift-check flags it.

---

## Provenance

- **V3-D195** (2026-05-26) — primitive built per [Q16](../QUESTIONS.md#q16) decision C. Single wrapper enforces option D across the codebase; supersedes the inline `opacity-50 cursor-not-allowed + onClick toast.info` pattern that previously lived ad-hoc in MobileMenu / Header / dashboard surfaces.

---

## Related

- **[Toast](Toast.md)** — fires `toast.info(...)` on tap. ComingSoon is the primary consumer of `toast.info`.
- **§11 Clickable Surface Contract** — defines option D; ComingSoon is the canonical implementation.
- **`/solen-drift-check` skill** — treats `data-coming-soon="true"` as the sentinel exempting a surface from dead-click checks.
- **`<LoginGate>`** (TBD) — sibling pattern for auth-required surfaces, not "coming soon."

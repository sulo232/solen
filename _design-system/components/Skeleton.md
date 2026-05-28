# Skeleton

**File:** [app/[locale]/_components/primitives/Skeleton.tsx](../../app/[locale]/_components/primitives/Skeleton.tsx)
**Locked since:** V3-D195 (2026-05-26)
**SOURCE.md links:** [§10.1 Loading state](../SOURCE.md#§101--loading-state) · [§6.3 Named keyframes](../SOURCE.md#§63--named-keyframes-catalog) · [§13 Mobile perf](../SOURCE.md#§13--mobile-perf-rules) · [§14 Component authoring contract](../SOURCE.md#§14--component-authoring-contract)

---

## Purpose

A single primitive for the canonical "data hasn't arrived yet" placeholder shape per [§10.1](../SOURCE.md#§101--loading-state). Stamps a token-aligned shimmering gradient (`s-bg-sunken → white → s-bg-sunken`) into any width/height/aspect shape.

Two co-existing patterns (per [Q14](../QUESTIONS.md#q14)):

1. **`<Skeleton>` primitive** (this file) — the 80 % case. Use it when building skeleton compositions that mirror final layouts.
2. **`.skeleton-shimmer` utility class** — defined in `app/globals.css` for ad-hoc inline uses, especially in legacy code. Note: the utility class uses a legacy hardcoded gradient (`#F0F0F0/#E0E0E0`) — prefer the `<Skeleton>` wrapper for new code so callers get the token gradient.

Server component (no `"use client"`). Pure markup; the animation runs purely in CSS.

---

## Public API

```ts
export interface SkeletonProps {
  width?: string | number;          // px when number, raw CSS when string
  height?: string | number;         // px when number, raw CSS when string
  rounded?: number | "full";        // px when number, "9999px" when "full"
  aspect?: "square" | "video";      // when set, overrides width/height
  className?: string;               // for spacing, max-width, etc.
}

export function Skeleton(props: SkeletonProps): JSX.Element;
```

**Defaults:** `rounded = 4`. No default width/height — caller is expected to set one or use `aspect`.

---

## Visual signature

```
┌──────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░ │  ← s-bg-sunken → white → s-bg-sunken gradient
└──────────────────────────┘     animated background-position over 1.5s
```

- **Background:** `bg-gradient-to-r from-s-bg-sunken via-white to-s-bg-sunken` — token-aligned. Per [Q19](../QUESTIONS.md#q19), shimmer stays in the chrome-grey band; no warm tints.
- **Animation:** `animate-shimmer` Tailwind keyframe (`background-position: -200% 0 → 200% 0` over 1.5s, infinite, ease-in-out).
- **`aria-hidden="true"`** — skeletons are visual scaffolding; screen readers should announce "Loading" via a separate live region per [§16.3](../SOURCE.md#§163--aria), not the skeleton itself.

---

## Composition examples

### Match a SalonCard footprint

```tsx
<div className="w-[160px]">
  <Skeleton aspect="square" rounded={16} />
  <Skeleton height={16} width="80%" rounded={4} className="mt-2" />
  <Skeleton height={12} width="50%" rounded={4} className="mt-1" />
</div>
```

### Match a ProCard list row (FeaturedStylists pattern)

```tsx
<div className="flex items-center gap-4 p-3">
  <Skeleton width={72} height={72} rounded="full" />
  <div className="flex-1">
    <Skeleton height={16} width="70%" rounded={4} />
    <Skeleton height={12} width="40%" rounded={4} className="mt-1.5" />
  </div>
</div>
```

### Match a ReviewCard text block

```tsx
<div className="p-4 rounded-card border border-s-border">
  <div className="flex gap-1">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} width={12} height={12} rounded="full" />
    ))}
  </div>
  <Skeleton height={14} width="95%" rounded={4} className="mt-3" />
  <Skeleton height={14} width="85%" rounded={4} className="mt-1" />
  <Skeleton height={14} width="60%" rounded={4} className="mt-1" />
</div>
```

---

## Motion details

| Property | Value |
|---|---|
| Keyframe | `shimmer` (tailwind.config.js line 250) — `background-position: -200% 0 → 200% 0` |
| Duration | 1.5 s, infinite |
| Easing | `ease-in-out` (calm, not strobe) |
| Reduced motion | Global override at `app/globals.css:681` (`animation-duration: .01ms !important`) — the shimmer freezes; the gradient remains as a static visual placeholder. |

The shimmer uses `background-position`, not transform — it does NOT need GPU compositor hints. Layout cost is low because the gradient is a single repaint on the painted background, not the layer.

---

## Do / Don't

### Do

- Match skeleton dimensions to the final layout — when data arrives, the swap should have zero layout shift.
- Use `aspect="square"` or `aspect="video"` when the parent supplies the width — saves you computing `paddingTop: 100%` tricks.
- Compose skeletons inside the same Card / Section / Grid shell that will render real data. Reuse the layout.
- Cap skeleton count to "visible + 1" — show 3 if 3 fit in a horizontal carousel viewport, not 10. Overshoot reads as "slow."

### Don't

- Don't use Skeleton for permanent decorative blocks — it's load-bearing semantically (`aria-hidden="true"` + `animate-shimmer` signal "this is pending data").
- Don't override the gradient via custom `className="bg-..."` — Tailwind class-merging via `cn()` will override, but the result drifts from the locked token palette. If you need a different gradient, raise in QUESTIONS.md first.
- Don't apply both `<Skeleton>` and the legacy `.skeleton-shimmer` class — the CSS class will win specificity-wise and override the token gradient.
- Don't use Skeleton for full-page loading — render a layout-shaped composition of Skeletons that mirrors the page, not one giant block.

---

## Edge cases

| Case | Behavior |
|---|---|
| Neither `width` nor `height` nor `aspect` set | Skeleton collapses to 0×0. Caller must set one. Acceptable: don't add a safety default — it would hide layout bugs. |
| `aspect="square"` + explicit `width` | `width` is ignored. `aspect-square` + `w-full` win. Wrap in a sized parent for control. |
| `rounded="full"` on a non-square box | Renders an oval / capsule (`border-radius: 9999px` on a rectangle). Intentional — use it for pill skeletons. |
| `prefers-reduced-motion: reduce` | Animation freezes; gradient stays as static placeholder. User still sees the layout footprint. |
| Inside a flex container with `flex: 1` | `width` style is overridden by flex sizing. Acceptable — the flex parent owns layout. |
| Server-rendered (no `"use client"`) | Pure CSS animation — no JS needed. Works in RSC trees. |

---

## Provenance

- **V3-D195** (2026-05-26) — primitive built per [Q14](../QUESTIONS.md#q14) decision C (both utility + wrapper). Token-aligned gradient (`s-bg-sunken → white → s-bg-sunken`) supersedes the legacy `.skeleton-shimmer` hardcoded `#F0F0F0/#E0E0E0` stops for new callsites.
- **`.skeleton-shimmer` utility** (legacy, retained in `app/globals.css:824`) — historical class for ad-hoc skeletons. Not deprecated; still used by category card row + a few legacy spots.

---

## Related

- **[LoadingStates.md](LoadingStates.md)** — composition patterns + the four async state grammar.
- **`.skeleton-shimmer`** in `app/globals.css:824` — sibling utility class.
- **`animate-shimmer`** Tailwind keyframe — defined in `tailwind.config.js:244`, used by this primitive directly.
- **§10.1 SOURCE.md** — canonical loading-state spec.

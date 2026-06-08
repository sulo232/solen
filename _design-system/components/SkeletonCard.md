# SkeletonCard

**File:** [app/[locale]/_components/primitives/SkeletonCard.tsx](../../app/[locale]/_components/primitives/SkeletonCard.tsx)
**Layer:** 1 (chrome)
**Status:** new (2026-06-08)
**SOURCE.md links:** [§10.1 Loading state](../SOURCE.md#§101--loading-state)

---

## Purpose

The composite "a salon/result card hasn't arrived yet" placeholder. Reproduces the SalonCard footprint as a stack of [`<Skeleton>`](Skeleton.md) shapes inside a hairline card. Built entirely from the canonical `<Skeleton>` primitive, so the shimmer gradient (`s-bg-sunken → white → s-bg-sunken`) and `prefers-reduced-motion` handling stay token-aligned.

Replaces the legacy `components-legacy/ui/Skeleton.tsx` `variant="card"` composite, which was deleted on consolidation (2026-06-08). The legacy `variant="avatar"` / `variant="text"` paths collapsed back into plain `<Skeleton>` usages.

Server component (no `"use client"`). Pure markup; the animation runs purely in CSS.

---

## Public API

```ts
export interface SkeletonCardProps {
  className?: string; // outer card wrapper — grid sizing, max-width, etc.
}

export function SkeletonCard(props: SkeletonCardProps): JSX.Element;
```

---

## Anatomy

```
┌──────────────────────────┐  ← rounded-[20px] card, border-s-border, overflow-hidden
│ ░░░░░░░░░░░░░░░░░░░░░░░░ │  ← photo: <Skeleton aspect="square" rounded={0} />
│ ░░░░░░░░░░░░░░░░░░░░░░░░ │
├──────────────────────────┤  ← p-4, space-y-3
│ ░░░░░░░░░░░░░░░  (75%)   │  ← <Skeleton height={16} width="75%" rounded={8} />
│ ░░░░░░░░  (50%)          │  ← <Skeleton height={12} width="50%" rounded={8} />
│ ▢▢▢▢▢  ▢▢▢                │  ← two pills: h20 × w64 + w48, rounded="full"
└──────────────────────────┘
```

Measurements are a 1:1 carry-over of the deleted legacy composite (`aspect-square` photo, `h-4 w-3/4` + `h-3 w-1/2` text lines, `h-5 w-16` + `h-5 w-12` chips, `rounded-[20px]` card). It is a greyscale loading placeholder, not a design decision.

---

## Usage

```tsx
import { SkeletonCard } from "@/app/[locale]/_components/primitives";

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {Array.from({ length: 6 }).map((_, i) => (
    <SkeletonCard key={i} />
  ))}
</div>
```

- **Use for:** loading grids of salon/result cards.
- **Don't use for:** single-line or avatar placeholders — use [`<Skeleton>`](Skeleton.md) directly (`rounded="full"` for avatars, line dims for text).

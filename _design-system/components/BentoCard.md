# BentoCard

**File:** [app/[locale]/_components/business/BentoCard.tsx](../../app/[locale]/_components/business/BentoCard.tsx)
**Layer:** 1 (chrome — surfaces a generic visual + copy slot; no semantic meaning carried by color)
**Locked since:** V3-D218 (2026-05-26 · /business rebuild)
**SOURCE.md links:** [§3 typography](../SOURCE.md) · [§6 motion](../SOURCE.md) · [§8 card grammar](../SOURCE.md)

---

## Purpose

Generic feature-card primitive used in the `/business` page's 4-card bento grid (Sofortige Bestätigung / Direkt-Chat / Voller Kalender / Analytics). Extracted from inline `BentoBusiness.tsx` so the same primitive can serve any "feature x4" layout going forward.

Three layers of interaction:
1. **Scroll entrance** — fade-up via Framer Motion `initial → animate`, duration 0.5s, cubic-bezier(0.22, 1, 0.36, 1).
2. **Desktop 3D tilt** — cursor-tracked rotateX/rotateY, springs back to 0 on leave. Damping 30, stiffness 200, ±6° max. No-op on touch (no hover).
3. **Visual slot** — arbitrary React node for the upper-card mockup (chart, calendar grid, popup, chat bubbles, etc.).

---

## Public API

```ts
export interface BentoCardProps {
  title: string;             // h3 inside card (Section H2 spec — Inter Tight 700)
  description: string;       // p body primary (Hanken Grotesk 300, 14px, leading 1.5)
  visual: React.ReactNode;   // upper-card mockup — flex-1 height-driven
  className?: string;        // composer escape hatch (e.g. md:col-span-2)
}
```

---

## Visual signature

```
┌──────────────────────────────────────┐
│ ┌────────────────────────────────┐   │  ← rounded-3xl bg-white
│ │                                │   │  ← shadow-elevation-1 → -2 on hover
│ │       [visual slot]            │   │
│ │      (flex-1, ~50% h)          │   │
│ │                                │   │
│ └────────────────────────────────┘   │
│  Title h3 (20-22px, 700, -0.03em)   │
│  Description (14px, 300, lh 1.5)     │
└──────────────────────────────────────┘
```

**Container:**
- `rounded-3xl` (24px) — bento grandeur, not the standard 16px card token (intentional — these are the page's biggest surfaces, the larger radius reads more "premium / surface")
- `bg-white` on `s-bg.base` page background
- `shadow-elevation-1` → `shadow-elevation-2` on hover
- `min-h-[280px] mobile / 320px desktop`
- `overflow-hidden` (allows visuals to bleed without disturbing the rounded edge)

**Padding:** `p-6` mobile / `p-7` desktop.

**Typography (h3):**
- `font-display text-[20px] md:text-[22px]` (Section H2 spec from SOURCE.md §3)
- `font-bold` (700) — NOT `font-extrabold` (extrabold is reserved for Hero H1 / Page H2 roles)
- `tracking-[-0.03em]`
- `leading-tight`
- `text-s-ink`

**Typography (p):**
- `font-body text-[14px] font-light leading-[1.5]`
- `text-s-ink-2`
- 8px gap below h3 (`mt-2`)

---

## Motion

| Phase | Duration | Easing | Property |
|---|---|---|---|
| Entrance (one-shot) | 0.5s | cubic-bezier(0.22, 1, 0.36, 1) | opacity 0→1, y 30px→0 |
| Tilt-track (continuous) | spring damping=30, stiffness=200 | — | rotateX/rotateY ±6° |
| Tilt-release | spring damping=30, stiffness=200 | — | rotateX/rotateY → 0 |
| Shadow promotion | 200ms | ease-glide | elevation-1 → elevation-2 |

The 3D tilt is a **documented exception** to SOURCE.md §6 motion vocabulary. It is allowed here because:
1. Bento cards are the primary "wow" surface on the /business page.
2. Max tilt is bounded (±6°) so it stays a subtle parallax, not a gimmick.
3. Mobile (no hover) gracefully degrades to a flat card.
4. The pattern is constrained to this primitive — not introduced into general card vocabulary.

---

## Use for

- Feature x4 grids on B2B / marketing landing surfaces (Solen for business)
- Future "what we do" splash sections that need 2-4 large visual-led surfaces

## Don't reuse for

- Salon cards in listing / search results — use `<SalonCard>` (different content model + clickable destination)
- Review cards — use `<ReviewCard>` pattern (different layout grammar)
- Dashboard widgets — those need their own primitive (this card's tilt + scroll-entrance is too marketing-y for utility UI)

---

## Visual slot catalog (current usages)

Inside `BentoBusiness.tsx`:
- `VisualBooking` — glassmorph booking-confirmation popup over an accent-tinted glow halo
- `VisualCustomerDM` — Instagram-style 3-bubble chat preview with Typewriter
- `VisualCalendar` — 5x3 grey-scale availability grid with staggered scale-in entrance
- `VisualAnalyticsTabbed` — period-switcher (Jahr/Monat/Woche) + animated bar chart

Each Visual* is a function component with no props. When adding a new bento card, build a new Visual* with the same API and pass it via `<BentoCard visual={<VisualFoo />} />`.

---

## A11y

- No additional ARIA wiring — the card is a static information surface, not a control.
- If the bento card grows a click target (e.g. opens a modal), the wrapping `<a>` / `<button>` handles its own focus + label semantics — the card body should remain non-interactive.
- The 3D tilt has no a11y impact (it's `transform` only, no z-shift, and the focusable subtree retains pointer + keyboard order).
